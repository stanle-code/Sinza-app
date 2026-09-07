import React, { useState } from 'react';
import { WeeklyReport, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { BookOpen, Users, Heart, ClipboardCheck, ArrowLeft, ArrowRight, Eye, Calendar, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MemberReportModalProps {
  member: UserProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export function MemberReportModal({ member, onClose, onSuccess }: MemberReportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate current week dates
  const getSabbathWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Most recent Sunday
    const start = new Date(today);
    start.setDate(today.getDate() - dayOfWeek);
    
    // Upcoming Saturday
    const end = new Date(today);
    end.setDate(today.getDate() + (6 - dayOfWeek));

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const currentWeeks = getSabbathWeekDates();

  const [reportDate, setReportDate] = useState(currentWeeks.end);
  const [weekStartDate, setWeekStartDate] = useState(currentWeeks.start);

  const [visits, setVisits] = useState<number>(0);
  const [literature, setLiterature] = useState<number>(0);
  const [teachings, setTeachings] = useState<number>(0);
  const [soulsWon, setSoulsWon] = useState<number>(0);

  const [peopleHelped, setPeopleHelped] = useState<number>(0);
  const [clothesGiven, setClothesGiven] = useState<number>(0);
  const [moneyValueFood, setMoneyValueFood] = useState<number>(0);

  const [somaLesoniMpango, setSomaLesoniMpango] = useState<boolean>(false);
  const [somaLesoniSiMpango, setSomaLesoniSiMpango] = useState<boolean>(false);
  const [somaLesoniMtandao, setSomaLesoniMtandao] = useState<boolean>(false);
  const [somaBibliaMpango, setSomaBibliaMpango] = useState<boolean>(false);
  const [somaKeshaRohoUnabii, setSomaKeshaRohoUnabii] = useState<boolean>(false);
  const [somaLesoniWatoto, setSomaLesoniWatoto] = useState<boolean>(false);
  const [kaririFunguKuu, setKaririFunguKuu] = useState<boolean>(false);
  const [mwongozoKujifunzaBiblia, setMwongozoKujifunzaBiblia] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const reportId = `${member.uid}_${reportDate}`;
      const finalReport: WeeklyReport = {
        reportId,
        memberId: member.uid,
        memberName: member.fullName,
        classId: member.classId || 'darasa_bila_jina',
        className: member.className || 'Darasa la Kawaida',
        weekStartDate: weekStartDate,
        weekEndDate: reportDate,
        hudumaYangu: {
          visits: Number(visits),
          literature: Number(literature),
          teachings: Number(teachings),
          soulsWon: Number(soulsWon)
        },
        hudumaJamii: {
          peopleHelped: Number(peopleHelped),
          clothesGiven: Number(clothesGiven),
          moneyValueFood: Number(moneyValueFood)
        },
        usomajiLesoni: {
          somaLesoniMpango,
          somaLesoniSiMpango,
          somaLesoniMtandao,
          somaBibliaMpango,
          somaKeshaRohoUnabii,
          somaLesoniWatoto,
          kaririFunguKuu,
          mwongozoKujifunzaBiblia
        },
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Also trigger rewards (XP) local animation if they answered yes to a lot of entries!
      let xpEarned = 10; // base XP for reporting
      if (visits > 0) xpEarned += 15;
      if (soulsWon > 0) xpEarned += 50;
      if (peopleHelped > 0) xpEarned += 20;
      if (somaLesoniMpango) xpEarned += 25;
      if (kaririFunguKuu) xpEarned += 15;

      // Submit report to Firestore
      await setDoc(doc(db, 'weekly_reports', reportId), finalReport);

      // Award XP to Member Profile
      const updatedXp = (member.xp || 0) + xpEarned;
      const updatedLevel = Math.floor(updatedXp / 100) + 1;
      
      const didLevelUp = updatedLevel > (member.level || 1);

      await setDoc(doc(db, 'users', member.uid), {
        xp: updatedXp,
        level: updatedLevel,
        lastReportDate: reportDate,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Run celebration confetti!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      if (didLevelUp) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            colors: ['#FFD700', '#FFA500'],
            spread: 120,
            origin: { y: 0.4 }
          });
        }, 300);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `weekly_reports/${member.uid}_${reportDate}`);
      } catch (fe: any) {
        setErrorMsg(fe.message || 'Hitilafu imetokea wakati wa kuwasilisha taarifa yako.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div id="report-modal-container" className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900 p-6 md:p-8 text-white shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
            <div>
              <h2 className="text-xl font-bold">Ripoti ya Shule ya Sabato</h2>
              <p className="text-xs text-zinc-400">Juma linaloishia: <span className="text-amber-400 font-semibold">{reportDate}</span> ({member.className})</p>
            </div>
          </div>
          <button id="close-report-modal" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition">&times;</button>
        </div>

        {/* Form Error Indicator */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left">
            {errorMsg}
          </div>
        )}

        {/* Progress Bar / Steps indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-initial">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-amber-500 text-zinc-950 ring-4 ring-amber-500/20'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-all ${
                    step > s ? 'bg-emerald-500' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-semibold">Habari za Juma na Tarehe</h3>
              </div>
              <p className="text-xs text-zinc-400">Tafadhali chagua tarehe ya sabato ya juma unaloripoti. Tarehe hizi kwa kawaida huchaguliwa kiotomatiki.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Kuanzia Tarehe (Jumapili):</label>
                  <input
                    id="week-start-input"
                    type="date"
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-amber-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Sabato ya Mwisho wa Juma:</label>
                  <input
                    id="week-end-input"
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-amber-500 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-semibold">A. Huduma Yangu kwa Yesu</h3>
              </div>
              <p className="text-xs text-zinc-400">Shughuli hizi za umisionari na uenezi wa injili zilizofanyika kwa hiari katika juma hili.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Mara ngapi umetembelea kwa kusudi la injili?</label>
                  <input
                    id="visits-input"
                    type="number"
                    min="0"
                    value={visits}
                    onChange={(e) => setVisits(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Idadi ya magazeti ya nyumba kwa nyumba, vitabu na vijizuu?</label>
                  <input
                    id="literature-input"
                    type="number"
                    min="0"
                    value={literature}
                    onChange={(e) => setLiterature(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Idadi ya mafundisho na mahubiri uliyoyatoa?</label>
                  <input
                    id="teachings-input"
                    type="number"
                    min="0"
                    value={teachings}
                    onChange={(e) => setTeachings(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Idadi ya roho zilizoongolewa (Batizwa/Tayari)?</label>
                  <input
                    id="souls-input"
                    type="number"
                    min="0"
                    value={soulsWon}
                    onChange={(e) => setSoulsWon(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-semibold">B. Huduma kwa Jamii</h3>
              </div>
              <p className="text-xs text-zinc-400">Shughuli zote za kijamii na kutoa msaada kwa wenye uhitaji bila ubaguzi katika juma hili.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Idadi ya watu uliowasaidia (Wagonjwa/Wenye Shida):</label>
                  <input
                    id="helped-input"
                    type="number"
                    min="0"
                    value={peopleHelped}
                    onChange={(e) => setPeopleHelped(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">Idadi ya nguo ulizozitoa kwa jamii:</label>
                  <input
                    id="clothes-input"
                    type="number"
                    min="0"
                    value={clothesGiven}
                    onChange={(e) => setClothesGiven(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-300 mb-1">Thamani ya Fedha / Chakula ulichokitoa kusaidia jamii (TSH):</label>
                  <input
                    id="money-input"
                    type="number"
                    min="0"
                    value={moneyValueFood}
                    onChange={(e) => setMoneyValueFood(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm focus:border-amber-500 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-semibold">C. Usomaji wa Lesoni na Biblia</h3>
              </div>
              <p className="text-xs text-zinc-400">Imarisha maisha yako ya kiroho kwa kujifunza zana hizi za Shule ya Sabato na Roho ya Unabii:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="soma-lesoni-mpango"
                    type="checkbox"
                    checked={somaLesoniMpango}
                    onChange={(e) => setSomaLesoniMpango(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umesoma lesoni kwa mpango kila siku?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="soma-lesoni-si-mpango"
                    type="checkbox"
                    checked={somaLesoniSiMpango}
                    onChange={(e) => setSomaLesoniSiMpango(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umesoma lesoni ijapokuwa si kwa mpango?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="soma-lesoni-mtandao"
                    type="checkbox"
                    checked={somaLesoniMtandao}
                    onChange={(e) => setSomaLesoniMtandao(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umesoma lesoni kwa njia ya mtandao?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="soma-biblia-mpango"
                    type="checkbox"
                    checked={somaBibliaMpango}
                    onChange={(e) => setSomaBibliaMpango(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umesoma Biblia kwa mpango thabiti?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="soma-kesha"
                    type="checkbox"
                    checked={somaKeshaRohoUnabii}
                    onChange={(e) => setSomaKeshaRohoUnabii(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umesoma Kesha au Roho ya Unabii?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="soma-watoto"
                    type="checkbox"
                    checked={somaLesoniWatoto}
                    onChange={(e) => setSomaLesoniWatoto(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umeshudumia/soma lesoni na watoto?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="kariri-fungu"
                    type="checkbox"
                    checked={kaririFunguKuu}
                    onChange={(e) => setKaririFunguKuu(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Umekariri Fungu Kuu la Juma?</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-850 border border-zinc-750 cursor-pointer hover:border-zinc-700 transition">
                  <input
                    id="mwongozo-biblia"
                    type="checkbox"
                    checked={mwongozoKujifunzaBiblia}
                    onChange={(e) => setMwongozoKujifunzaBiblia(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 bg-zinc-900 border-zinc-700 h-4 w-4"
                  />
                  <span className="text-xs text-zinc-200">Unatumia mwongozo wa kujisomea Biblia?</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6">
          <button
            id="prev-step-btn"
            disabled={step === 1}
            onClick={() => setStep((s) => (s - 1) as any)}
            className="flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-medium border border-zinc-750 text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Nyuma
          </button>

          {step < 4 ? (
            <button
              id="next-step-btn"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 transition"
            >
              Endelea
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="submit-report-btn"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Inawasilisha...</>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Wasilisha Ripoti
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
