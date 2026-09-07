import React, { useState, useEffect } from 'react';
import { SabbathClass, UserProfile, WeeklyReport, ActivityLog } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Users, BookOpen, FileText, Check, X, ShieldAlert, Plus, Search, Archive, AlertCircle, Edit, Trash2 } from 'lucide-react';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'classes' | 'teachers' | 'members' | 'reports' | 'logs'>('classes');
  
  const [classes, setClasses] = useState<SabbathClass[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Search
  const [searchQuery, setSearchQuery] = useState('');

  // Creation forms state
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');

  // Status/Messages
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch Classes (Existing collection in Firestore!)
      const classesSnap = await getDocs(collection(db, 'classes'));
      const classesList: SabbathClass[] = [];
      classesSnap.forEach(doc => {
        classesList.push({ classId: doc.id, ...doc.data() } as SabbathClass);
      });
      setClasses(classesList);

      // 2. Fetch Users to segment Teachers and Members
      const usersSnap = await getDocs(collection(db, 'users'));
      const teachersList: UserProfile[] = [];
      const membersList: UserProfile[] = [];
      usersSnap.forEach(doc => {
        const u = doc.data() as UserProfile;
        if (u.role === 'teacher') teachersList.push(u);
        else if (u.role === 'member') membersList.push(u);
      });
      setTeachers(teachersList);
      setMembers(membersList);

      // 3. Fetch Weekly Reports
      const reportsSnap = await getDocs(collection(db, 'weekly_reports'));
      const reportsList: WeeklyReport[] = [];
      reportsSnap.forEach(doc => {
        reportsList.push(doc.data() as WeeklyReport);
      });
      setReports(reportsList);

      // 4. Fetch Activity Logs
      const logsSnap = await getDocs(collection(db, 'activity_logs'));
      const logsList: ActivityLog[] = [];
      logsSnap.forEach(doc => {
        logsList.push(doc.data() as ActivityLog);
      });
      setLogs(logsList.sort((a,b)=> b.createdAt.localeCompare(a.createdAt)));

    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kupakia taarifa za usimamizi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Class Management CRUD
  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const classId = `darasa_${Date.now()}`;
      const newClass: SabbathClass = {
        classId,
        name: newClassName.trim(),
        membersCount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'classes', classId), newClass);
      setNewClassName('');
      setStatusMsg('Darasa jipya limeundwa kwa mafanikio!');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kuunda darasa jipya.');
    }
  };

  const handleArchiveClass = async (classId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'archived' : 'active';
      await updateDoc(doc(db, 'classes', classId), { status: nextStatus });
      setStatusMsg(`Hali ya darasa imebadilishwa kuwa ${nextStatus === 'active' ? 'Hai' : 'Imehifadhiwa'}!`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kubadilisha hali ya darasa.');
    }
  };

  // Create Teacher Account (Simulated)
  const handleCreateTeacher = async () => {
    if (!newTeacherName.trim() || !newTeacherEmail.trim() || !newTeacherPhone.trim()) {
      setErrorMsg('Tafadhali jaza taarifa zote za mwalimu.');
      return;
    }
    try {
      const tempUid = `mwalimu_${Date.now()}`;
      const newTeacher: UserProfile = {
        uid: tempUid,
        fullName: newTeacherName,
        email: newTeacherEmail,
        phoneNumber: newTeacherPhone,
        gender: 'Kiume',
        dateOfBirth: '1980-01-01',
        classId: '',
        className: 'Bado haijatengwa',
        role: 'teacher',
        status: 'active',
        xp: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', tempUid), newTeacher);
      
      // Also add directly to teachers list for display convenience
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPhone('');
      setStatusMsg(`Mwalimu ${newTeacher.fullName} amesajiliwa! Nenosiri la muda limetumwa.`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kusajili mwalimu jipya.');
    }
  };

  const handleAssignTeacherToClass = async (classId: string, teacherId: string) => {
    const teacherObj = teachers.find(t => t.uid === teacherId);
    if (!teacherObj) return;
    try {
      await updateDoc(doc(db, 'classes', classId), {
        teacherId: teacherObj.uid,
        teacherName: teacherObj.fullName
      });

      // Update teacher profile to know their class definition
      const targetClass = classes.find(c => c.classId === classId);
      if (targetClass) {
        await updateDoc(doc(db, 'users', teacherId), {
          classId: targetClass.classId,
          className: targetClass.name
        });
      }

      setStatusMsg(`Mwalimu ${teacherObj.fullName} amekabidhiwa darasa kwa mafanikio!`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kumkabidhi mwalimu kwenye darasa.');
    }
  };

  // Report Approvals/Rejections by Admin Overrides
  const handleReportAction = async (reportId: string, action: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'weekly_reports', reportId), {
        status: action,
        approvedBy: 'admin_override',
        approvedByName: 'Msimamizi Mkuu'
      });
      setStatusMsg(`Sura ya Ripoti imehakikiwa na kuwa: ${action === 'approved' ? 'Imekubalika' : 'Imekataliwa'}!`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Imeshindwa kusasisha hali ya ripoti.');
    }
  };

  // Searching logic
  const getFilteredClasses = () => classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const getFilteredTeachers = () => teachers.filter(t => t.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const getFilteredMembers = () => members.filter(m => m.fullName.toLowerCase().includes(searchQuery.toLowerCase()));
  const getFilteredReports = () => reports.filter(r => r.memberName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div id="admin-panel-container" className="space-y-6 animate-fade-in text-left">
      
      {/* Title block */}
      <div className="bg-zinc-900/40 p-5 border border-zinc-800/80 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Usimamizi Mkuu wa Idara (Admin Dashboard)
          </h2>
          <p className="text-xs text-zinc-400">Panga madarasa, dhibiti walimu na washiriki, na hakiki ripoti zote za Shule ya Sabato Sinza.</p>
        </div>

        {/* Global Search Interface */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 items-center gap-2 max-w-sm w-full">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            id="admin-search-input"
            type="text"
            placeholder="Tafuta darasa, mwalimu au mshiriki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-zinc-200 outline-none w-full"
          />
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-555/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" />
          {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-zinc-800 pb-px overflow-x-auto gap-2">
        {([
          { key: 'classes', label: 'Madarasa la Shule ya Sabato', icon: <BookOpen className="w-4 h-4" /> },
          { key: 'teachers', label: 'Walimu', icon: <Users className="w-4 h-4" /> },
          { key: 'members', label: 'Washiriki', icon: <Users className="w-4 h-4" /> },
          { key: 'reports', label: 'Ripoti Zinazosubiri', icon: <FileText className="w-4 h-4" /> },
          { key: 'logs', label: 'Magogo ya Ukaguzi', icon: <ShieldAlert className="w-4 h-4" /> }
        ] as const).map((tab) => (
          <button
            id={`tab-btn-${tab.key}`}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-zinc-900/20 border border-zinc-805 rounded-2xl p-5 md:p-6 min-h-[400px]">
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-sm">Pakia mifumo yote na madarasa...</div>
        ) : (
          <>
            {/* CLASSES PANEL */}
            {activeTab === 'classes' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Create class widget */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-amber-500" /> Unda Darasa Jipya
                    </h3>
                    <p className="text-[11px] text-zinc-400">Ongeza darasa jipya ambalo litatumika kusajili washiriki na walimu.</p>
                    <div className="space-y-3">
                      <input
                        id="new-class-name"
                        type="text"
                        placeholder="Jina la darasa (mf. Darasa la Yohana)..."
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white"
                      />
                      <button
                        id="save-class-btn"
                        onClick={handleCreateClass}
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-600 transition"
                      >
                        Hifadhi Darasa
                      </button>
                    </div>
                  </div>

                  {/* List of active classes */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="text-sm font-bold text-white">Madarasa Yanayopatikana ({classes.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {getFilteredClasses().map((cls) => (
                        <div key={cls.classId} id={`class-item-${cls.classId}`} className="bg-zinc-900/40 border border-zinc-805 p-4 rounded-xl flex flex-col justify-between space-y-3">
                          <div className="text-left flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-white">{cls.name}</h4>
                              <p className="text-[10px] text-zinc-400 mt-0.5">Mwalimu: <span className="text-amber-500">{cls.teacherName || 'Bado hajatengwa'}</span></p>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                              cls.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {cls.status === 'active' ? 'Hai' : 'Imehifadhiwa'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-850 pt-2.5">
                            <span className="text-[10px] text-zinc-400">{cls.membersCount || 0} washiriki waliosajiliwa</span>
                            
                            <div className="flex gap-2">
                              {/* Assign teacher selection */}
                              <select
                                id={`assign-teacher-select-${cls.classId}`}
                                onChange={(e) => handleAssignTeacherToClass(cls.classId, e.target.value)}
                                className="bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-300 p-1 rounded cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>Tenga Mwalimu...</option>
                                {teachers.map(t => (
                                  <option key={t.uid} value={t.uid}>{t.fullName}</option>
                                ))}
                              </select>

                              <button
                                id={`archive-class-${cls.classId}`}
                                onClick={() => handleArchiveClass(cls.classId, cls.status)}
                                className="text-zinc-400 hover:text-red-500 transition p-1"
                                title="Anza kuhifadhi/kuondoa"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TEACHERS PANEL */}
            {activeTab === 'teachers' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Create teacher widget */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl h-fit space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-500" /> Sajili Mwalimu
                  </h3>
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Jina Kamili:</label>
                      <input
                        id="new-teacher-name"
                        type="text"
                        placeholder="Mwalimu Juma..."
                        value={newTeacherName}
                        onChange={(e) => setNewTeacherName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Barua Pepe (Email):</label>
                      <input
                        id="new-teacher-email"
                        type="email"
                        placeholder="teacher@church.com"
                        value={newTeacherEmail}
                        onChange={(e) => setNewTeacherEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">Namba ya Simu:</label>
                      <input
                        id="new-teacher-phone"
                        type="text"
                        placeholder="07xxxxxxxx..."
                        value={newTeacherPhone}
                        onChange={(e) => setNewTeacherPhone(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                      />
                    </div>
                    <button
                      id="save-teacher-btn"
                      onClick={handleCreateTeacher}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-zinc-950 hover:bg-amber-600 transition"
                    >
                      Kamilisha Usajili
                    </button>
                  </div>
                </div>

                {/* Teachers list */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-bold text-white">Walimu Waliopo ({teachers.length})</h3>
                  <div className="space-y-3">
                    {getFilteredTeachers().map((t) => (
                      <div key={t.uid} className="p-3.5 rounded-xl bg-zinc-900/30 border border-zinc-805 flex items-center justify-between">
                        <div className="text-left flex flex-col">
                          <span className="text-xs font-bold text-white">{t.fullName}</span>
                          <span className="text-[10px] text-zinc-400 mt-0.5">{t.email} | {t.phoneNumber}</span>
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 font-semibold border border-zinc-800">
                          {t.className || 'Hajatengewa Darasa'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MEMBERS PANEL */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Wasifu wa Washiriki Wote ({members.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {getFilteredMembers().map((m) => (
                    <div key={m.uid} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-805 space-y-2">
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-white">{m.fullName}</h4>
                        <p className="text-[10px] text-zinc-450 mt-0.5">{m.phoneNumber} | {m.gender}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-850 pt-2 text-[10px] text-zinc-400">
                        <span>Darasa: <span className="text-white font-semibold">{m.className || 'Bila darasa'}</span></span>
                        <span>Ngazi: <span className="text-amber-550 font-bold">{m.level || 1} ({m.xp || 0} XP)</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REPORTS OVERRIDE PANEL */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">Uhifadhi & Udhibiti wa Ripoti za kila juma ({reports.filter(r => r.status==='submitted').length} zinazosubiri)</h3>
                
                {getFilteredReports().filter(r => r.status === 'submitted').length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">Hakuna ripoti zozote zinazosubiri kupitishwa kwa sasa.</div>
                ) : (
                  <div className="space-y-4">
                    {getFilteredReports().filter(r => r.status === 'submitted').map((rep) => (
                      <div key={rep.reportId} className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-805 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 text-left">
                          <div>
                            <h4 className="text-xs font-bold text-white">{rep.memberName}</h4>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Darasa: {rep.className} | Kipindi: {rep.weekStartDate} hadi {rep.weekEndDate}</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              id={`approve-override-${rep.reportId}`}
                              onClick={() => handleReportAction(rep.reportId, 'approved')}
                              className="px-3 py-1.5 bg-emerald-555 hover:bg-emerald-600 text-zinc-950 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <Check className="w-3 h-3" /> Kubali
                            </button>
                            <button
                              id={`reject-override-${rep.reportId}`}
                              onClick={() => handleReportAction(rep.reportId, 'rejected')}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              <X className="w-3 h-3" /> Kataa
                            </button>
                          </div>
                        </div>

                        {/* Expand report content for review */}
                        <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-zinc-950 text-[10px] text-zinc-400 text-left">
                          <div>
                            <span className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider">A. Huduma</span>
                            <p>Utembeleaji: {rep.hudumaYangu?.visits}</p>
                            <p>Utoaji Vitabu: {rep.hudumaYangu?.literature}</p>
                            <p>Roho zilizobatizwa: {rep.hudumaYangu?.soulsWon}</p>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider">B. Huduma ya jamii</span>
                            <p>Wasilishwa msaada: {rep.hudumaJamii?.peopleHelped} Watu</p>
                            <p>Nguo: {rep.hudumaJamii?.clothesGiven}</p>
                            <p>Chakula: {rep.hudumaJamii?.moneyValueFood} TSH</p>
                          </div>
                          <div>
                            <span className="font-bold text-zinc-300 block mb-1 uppercase tracking-wider">C. Usomaji</span>
                            <p>Soma Lesoni mpango: {rep.usomajiLesoni?.somaLesoniMpango ? 'Ndio' : 'Hapana'}</p>
                            <p>Kariri fungu: {rep.usomajiLesoni?.kaririFunguKuu ? 'Ndio' : 'Hapana'}</p>
                            <p>Soma Biblia: {rep.usomajiLesoni?.somaBibliaMpango ? 'Ndio' : 'Hapana'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AUDIT LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> Magogo ya Kiusalama (Audit & Access Logs)
                </h3>
                
                {logs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">Hakuna ukaguzi wa kiusalama kwa sasa.</div>
                ) : (
                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-900 flex justify-between items-start text-xs text-left">
                        <div className="space-y-1">
                          <p className="text-zinc-200 font-bold">{log.action}</p>
                          <p className="text-[10px] text-zinc-400">{log.details}</p>
                          <p className="text-[9px] text-zinc-500">Mtumiaji: {log.userName} ({log.userRole})</p>
                        </div>
                        <span className="text-[9px] text-zinc-500">{new Date(log.createdAt).toLocaleString('sw-TZ')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
