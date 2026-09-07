import React, { useState, useEffect } from 'react';
import { SabbathClass, UserProfile, WeeklyReport, Announcement } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, updateDoc, addDoc, doc } from 'firebase/firestore';
import { BookOpen, Users, ClipboardCheck, ListPlus, BellRing, Check, X, AlertCircle, Eye, RefreshCw, Star, Info } from 'lucide-react';
import { ClassAttendanceModal } from './ClassAttendanceModal';

interface TeacherPanelProps {
  teacher: UserProfile;
}

export function TeacherPanel({ teacher }: TeacherPanelProps) {
  const [sabbathClass, setSabbathClass] = useState<SabbathClass | null>(null);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Attendance trigger modal
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  // New Class Announcement form
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // Status/Messages
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchClassAndReports = async () => {
    if (!teacher.classId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Class info
      const classDoc = await getDocs(query(collection(db, 'classes'), where('classId', '==', teacher.classId)));
      if (!classDoc.empty) {
        setSabbathClass({ classId: classDoc.docs[0].id, ...classDoc.docs[0].data() } as SabbathClass);
      }

      // 2. Fetch pending weekly reports for this class
      const reportsSnap = await getDocs(
        query(
          collection(db, 'weekly_reports'),
          where('classId', '==', teacher.classId),
          where('status', '==', 'submitted')
        )
      );
      const list: WeeklyReport[] = [];
      reportsSnap.forEach((doc) => {
        list.push(doc.data() as WeeklyReport);
      });
      setReports(list);

    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kupakia taarifa za darasa lako.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassAndReports();
  }, [teacher.classId]);

  // Report Approvals
  const handleApproveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'weekly_reports', reportId), {
        status: 'approved',
        approvedBy: teacher.uid,
        approvedByName: teacher.fullName,
        updatedAt: new Date().toISOString()
      });
      setStatusMsg('Ripoti imeidhinishwa kwa ufanisi!');
      fetchClassAndReports();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kuidhinisha ripoti.');
    }
  };

  // Report Rejections
  const handleRejectReport = async (reportId: string, reason: string = 'Inahitaji marekebisho kidogo') => {
    try {
      await updateDoc(doc(db, 'weekly_reports', reportId), {
        status: 'rejected',
        rejectionReason: reason,
        approvedBy: teacher.uid,
        approvedByName: teacher.fullName,
        updatedAt: new Date().toISOString()
      });
      setStatusMsg('Ripoti imekataliwa kwa marekebisho.');
      fetchClassAndReports();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kukataa ripoti hii.');
    }
  };

  // Announcement publishing
  const handlePostAnnouncement = async () => {
    if (!annTitle.trim() || !annContent.trim() || !teacher.classId) return;
    try {
      const ann: Announcement = {
        announcementId: `ann_${Date.now()}`,
        title: annTitle.trim(),
        content: annContent.trim(),
        scope: teacher.classId, // Only class specific
        authorId: teacher.uid,
        authorName: teacher.fullName,
        isPinned: false,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'announcements'), ann);
      setAnnTitle('');
      setAnnContent('');
      setStatusMsg('Tangazo la Darasa limechapishwa kikamilifu!');
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kuchapisha tangazo la darasa.');
    }
  };

  if (!teacher.classId) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center animate-fade-in space-y-3">
        <AlertCircle className="w-12 h-12 text-zinc-500 mx-auto" />
        <h3 className="text-base font-bold text-white">Bado Hujatengewa Darasa</h3>
        <p className="text-xs text-zinc-400">Tafadhali wasiliana na Msimamizi Mkuu (Admin) ili akukabidhi Darasa la Shule ya Sabato la kusimamia.</p>
      </div>
    );
  }

  return (
    <div id="teacher-panel-container" className="space-y-6 animate-fade-in text-left">
      
      {/* Class welcome details */}
      {sabbathClass && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <span className="text-[10px] text-amber-500 uppercase tracking-widest font-black">Darasa Linalosimamiwa na Wewe</span>
            <h2 className="text-2xl font-black text-white">{sabbathClass.name}</h2>
            <p className="text-xs text-zinc-400">Tengeneza mahudhurio, pitisha ripoti, au chapisha matangazo maalum ya ndani ya darasa hili.</p>
          </div>

          <div className="flex gap-3">
            <button
              id="attendance-btn"
              onClick={() => setShowAttendanceModal(true)}
              className="flex items-center gap-1.5 py-3 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 transition shadow"
            >
              <Users className="w-4 h-4" />
              Sajili Mahudhurio
            </button>
            <button
              id="refresh-teacher-data"
              onClick={fetchClassAndReports}
              className="p-3 bg-zinc-900 hover:bg-zinc-850 rounded-xl text-zinc-400 border border-zinc-800 transition"
              title="Pakia Upya"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-555/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <Info className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly reports pending review */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            Ripoti za juma hili zinazosubiri kuidhinishwa ({reports.length})
          </h3>
          <p className="text-xs text-zinc-400">Washiriki wa darasa lako waliotuma ripoti za nyanja ya uinjilisti na kujifunza wanahitaji uhakiki wako.</p>

          {loading ? (
            <div className="py-12 text-center text-zinc-550 text-xs">Takwimu za ripoti zinajazwa...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 rounded-xl bg-zinc-900/20 border border-zinc-850 text-center text-zinc-500 text-xs">
              Hakuna ripoti mpya zilizotumwa juma hili bado na wasomi wako.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div key={rep.reportId} id={`pending-report-${rep.reportId}`} className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-805 space-y-4 text-left">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white">{rep.memberName}</h4>
                      <p className="text-[10px] text-zinc-400">Sabato: {rep.weekEndDate}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id={`approve-${rep.reportId}`}
                        onClick={() => handleApproveReport(rep.reportId)}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" /> Kubali
                      </button>
                      <button
                        id={`reject-${rep.reportId}`}
                        onClick={() => handleRejectReport(rep.reportId)}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-zinc-850 hover:bg-zinc-800 text-red-400 border border-zinc-750 flex items-center gap-1 transition"
                      >
                        <X className="w-3.5 h-3.5" /> Kataa
                      </button>
                    </div>
                  </div>

                  {/* Report details summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-zinc-950 text-xs text-zinc-400 leading-relaxed border border-zinc-900/60">
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">A. Huduma</span>
                      <p>Utembeleaji injili: <span className="text-white font-semibold">{rep.hudumaYangu?.visits || 0}</span></p>
                      <p>Vifunguo na Trakti: <span className="text-white font-semibold">{rep.hudumaYangu?.literature || 0}</span></p>
                      <p>Watu walioongoka: <span className="text-white font-semibold">{rep.hudumaYangu?.soulsWon || 0}</span></p>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">B. Jamii</span>
                      <p>Watu walioungwa msaada: <span className="text-white font-semibold">{rep.hudumaJamii?.peopleHelped || 0}</span></p>
                      <p>Nguo zilizotolewa: <span className="text-white font-semibold">{rep.hudumaJamii?.clothesGiven || 0}</span></p>
                      <p>Msaada (Pesa/Chakula): <span className="text-white font-semibold">{rep.hudumaJamii?.moneyValueFood || 0} TSH</span></p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider text-[10px]">C. Usomaji Kitabu</span>
                      <p>Soma Lesoni kila siku: {rep.usomajiLesoni?.somaLesoniMpango ? <span className="text-emerald-400 font-bold">Ndio</span> : 'Hapana'}</p>
                      <p>Biblia kila siku: {rep.usomajiLesoni?.somaBibliaMpango ? <span className="text-emerald-400 font-bold">Ndio</span> : 'Hapana'}</p>
                      <p>Kariri fungu: {rep.usomajiLesoni?.kaririFunguKuu ? <span className="text-emerald-400 font-bold">Ndio</span> : 'Hapana'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish class announcement widget */}
        <div id="class-announcement-card" className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <BellRing className="w-5 h-5 text-amber-550 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Chapisha Tangazo la Darasa</h3>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">Tuma ujumbe/tangazo kwa wanadarasa wote wa darasa lako hili kwa wakati halisi bado.</p>
          
          <div className="space-y-3">
            <input
              id="ann-title"
              type="text"
              placeholder="Kichwa cha tangazo..."
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-100"
            />
            <textarea
              id="ann-content"
              rows={4}
              placeholder="Ujumbe mzima au ufafanuzi..."
              value={annContent}
              onChange={(e) => setAnnContent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-zinc-100 focus:outline-none"
            />
            <button
              id="post-announcement"
              onClick={handlePostAnnouncement}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 transition"
            >
              Chapisha Tangazo
            </button>
          </div>
        </div>

      </div>

      {/* Attendance Modal integration */}
      {showAttendanceModal && sabbathClass && (
        <ClassAttendanceModal
          sabbathClass={sabbathClass}
          onClose={() => setShowAttendanceModal(false)}
          onSuccess={() => {
            setShowAttendanceModal(false);
            setStatusMsg('Mahudhurio yamehifadhiwa na kusajiliwa kiotomatiki!');
            fetchClassAndReports();
          }}
        />
      )}

    </div>
  );
}
