import React, { useState, useEffect } from 'react';
import { SabbathClass, UserProfile, AttendanceRecord } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Calendar, UserCheck, Plus, Trash, Search, QrCode, CheckCircle, Info } from 'lucide-react';

interface ClassAttendanceModalProps {
  sabbathClass: SabbathClass;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClassAttendanceModal({ sabbathClass, onClose, onSuccess }: ClassAttendanceModalProps) {
  const [date, setDate] = useState(() => {
    // Default to the next or closest Saturday
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() + (6 - day);
    const sat = new Date(d.setDate(diff));
    return sat.toISOString().split('T')[0];
  });

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [presentUids, setPresentUids] = useState<Record<string, boolean>>({});
  
  // Visitor fields
  const [visitors, setVisitors] = useState<{ name: string; phone: string; gender: 'Kiume' | 'Kike' }[]>([]);
  const [visName, setVisName] = useState('');
  const [visPhone, setVisPhone] = useState('');
  const [visGender, setVisGender] = useState<'Kiume' | 'Kike'>('Kiume');

  // QR Simulator/Scan UID input
  const [qrInput, setQrInput] = useState('');
  const [qrSuccessMessage, setQrSuccessMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchClassMembers = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const q = query(
          collection(db, 'users'),
          where('classId', '==', sabbathClass.classId),
          where('role', '==', 'member')
        );
        const snap = await getDocs(q);
        const list: UserProfile[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as UserProfile);
        });
        setMembers(list);

        // Preload any existing attendance for this date
        const attendanceId = `${sabbathClass.classId}_${date}`;
        const attendDoc = await getDocs(
          query(collection(db, 'attendance'), where('attendanceId', '==', attendanceId))
        );
        if (!attendDoc.empty) {
          const loadedData = attendDoc.docs[0].data() as AttendanceRecord;
          const preSet: Record<string, boolean> = {};
          loadedData.attendees.forEach((uid) => {
            preSet[uid] = true;
          });
          setPresentUids(preSet);
          setVisitors(loadedData.visitors || []);
        } else {
          setPresentUids({});
          setVisitors([]);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Imeshindwa kupakia washiriki wa darasa hili.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassMembers();
  }, [sabbathClass.classId, date]);

  const handleToggleAttendee = (uid: string) => {
    setPresentUids((prev) => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const handleAddVisitor = () => {
    if (!visName.trim()) return;
    setVisitors((prev) => [
      ...prev,
      { name: visName.trim(), phone: visPhone.trim(), gender: visGender }
    ]);
    setVisName('');
    setVisPhone('');
    setQrSuccessMessage(`Mgeni ${visName} ameongezwa kwa mafanikio!`);
    setTimeout(() => setQrSuccessMessage(''), 3000);
  };

  const handleRemoveVisitor = (index: number) => {
    setVisitors((prev) => prev.filter((_, i) => i !== index));
  };

  // Simulating scanning a QR Code card containing member UID
  const handleSimulateQrScan = () => {
    if (!qrInput.trim()) return;
    const foundMember = members.find((m) => m.uid === qrInput.trim() || m.phoneNumber === qrInput.trim());
    if (foundMember) {
      setPresentUids((prev) => ({
        ...prev,
        [foundMember.uid]: true
      }));
      setQrSuccessMessage(`Amebainika: ${foundMember.fullName} amesajiliwa kuwa wepo!`);
      setQrInput('');
      setTimeout(() => setQrSuccessMessage(''), 4050);
    } else {
      setErrorMsg('Nambari ya UID ya Mwanachama haikutambuliwa dharura.');
      setTimeout(() => setErrorMsg(''), 4050);
    }
  };

  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const attendanceId = `${sabbathClass.classId}_${date}`;
      const finalAttendees = Object.keys(presentUids).filter((uid) => presentUids[uid]);

      const record: AttendanceRecord = {
        attendanceId,
        classId: sabbathClass.classId,
        className: sabbathClass.name,
        date,
        attendees: finalAttendees,
        visitors: visitors.map(v => ({ name: v.name, phone: v.phone || '', gender: v.gender })),
        recordedBy: sabbathClass.teacherId || 'admin_operator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'attendance', attendanceId), record);
      onSuccess();
    } catch (err) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `attendance/${sabbathClass.classId}_${date}`);
      } catch (fe: any) {
        setErrorMsg(fe.message || 'Hitilafu imetokea wakati wa kuhifadhi mahudhurio.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div id="attendance-modal" className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 text-white shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-lg font-bold">Marka Mahudhurio: {sabbathClass.name}</h2>
              <p className="text-xs text-zinc-400">Tengeneza mahudhurio ya darasa ya kila sabato kiurahisi</p>
            </div>
          </div>
          <button id="close-attendance-btn" onClick={onClose} className="p-1 text-zinc-400 hover:text-white text-xl">&times;</button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs text-left">
            {errorMsg}
          </div>
        )}

        {qrSuccessMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs text-left flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {qrSuccessMessage}
          </div>
        )}

        {/* Date Selector & QR scanner simulations container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5" /> Tarehe ya Sabato:
            </label>
            <input
              id="attendance-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-850 border border-zinc-750 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-400" /> Skana QR / UID Simulator:
            </label>
            <div className="flex gap-2">
              <input
                id="qr-manual-input"
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Ingiza UID au Namba ya Simu..."
                className="flex-1 bg-zinc-850 border border-zinc-750 rounded-xl p-2.5 text-xs text-white focus:border-amber-400"
              />
              <button
                id="simulate-scan-btn"
                onClick={handleSimulateQrScan}
                className="bg-amber-500 hover:bg-amber-600 font-bold text-zinc-950 px-3 py-1.5 rounded-xl text-xs transition-colors"
              >
                Soma Card
              </button>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {loading ? (
            <div className="py-12 text-center text-zinc-450 text-sm">Inapakia washiriki wa darasa hili...</div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-800 pb-2">Washiriki wa Darasa ({members.length})</h3>
              
              {members.length === 0 ? (
                <div className="text-center py-6 text-zinc-500 text-xs">
                  Hakuna mshiriki yeyote aliyesajiliwa kwenye darasa hili bado.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((member) => {
                    const isPresent = !!presentUids[member.uid];
                    return (
                      <div
                        id={`member-row-${member.uid}`}
                        key={member.uid}
                        onClick={() => handleToggleAttendee(member.uid)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                          isPresent
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-850/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{member.fullName}</span>
                          <span className="text-[10px] text-zinc-400">{member.phoneNumber || 'Siri'}</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition ${
                          isPresent ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-650'
                        }`}>
                          {isPresent && <span className="text-zinc-950 font-bold text-[10px]">&checkmark;</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Visitors Section */}
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h3 className="text-sm font-semibold text-blue-400">Sajili Wageni wa Shule ya Sabato ({visitors.length})</h3>
            
            {/* Visitors form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-850/30 p-3.5 border border-zinc-800 rounded-2xl">
              <input
                id="vis-name"
                type="text"
                value={visName}
                onChange={(e) => setVisName(e.target.value)}
                placeholder="Jina kamili la mgeni..."
                className="bg-zinc-900 border border-zinc-750 rounded-xl p-2.5 text-xs text-white"
              />
              <input
                id="vis-phone"
                type="text"
                value={visPhone}
                onChange={(e) => setVisPhone(e.target.value)}
                placeholder="Simu (Si lazima)..."
                className="bg-zinc-900 border border-zinc-750 rounded-xl p-2.5 text-xs text-white"
              />
              <div className="flex gap-2">
                <select
                  id="vis-gender"
                  value={visGender}
                  onChange={(e) => setVisGender(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-750 rounded-xl p-2.5 text-xs text-white flex-1 focus:outline-none"
                >
                  <option value="Kiume">Kiume</option>
                  <option value="Kike">Kike</option>
                </select>
                <button
                  id="add-visitor-btn"
                  onClick={handleAddVisitor}
                  className="bg-blue-650 hover:bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visitors list */}
            {visitors.length > 0 && (
              <div className="space-y-2">
                {visitors.map((visitor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-850 border border-zinc-800">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-semibold">{visitor.name}</span>
                      <span className="text-[10px] text-zinc-400">Jinsia: {visitor.gender} | Simu: {visitor.phone || 'Siri'}</span>
                    </div>
                    <button
                      id={`remove-visitor-${idx}`}
                      onClick={() => handleRemoveVisitor(idx)}
                      className="text-red-400 hover:text-red-500 transition p-1"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 pt-4 mt-6">
          <button
            id="cancel-attendance-btn"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl text-xs font-medium border border-zinc-750 text-zinc-400 hover:text-white"
          >
            Ghairi
          </button>
          <button
            id="save-attendance-btn"
            disabled={isSubmitting}
            onClick={handleSubmitAttendance}
            className="py-2.5 px-6 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
          >
            {isSubmitting ? 'Inahifadhi...' : 'Hifadhi Mahudhurio'}
          </button>
        </div>

      </div>
    </div>
  );
}
