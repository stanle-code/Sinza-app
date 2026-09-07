import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { UserProfile, SabbathClass, Announcement, EventRecord, UserPreferences, ActivityLog } from './types';
import { THEMES } from './themes';
import { SDALogo, SabbathSchoolLogo } from './components/Logos';
import { ThemeSelector } from './components/ThemeSelector';
import { MemberReportModal } from './components/MemberReportModal';
import { AnalyticsSection } from './components/AnalyticsSection';
import { AchievementsSection } from './components/AchievementsSection';
import { AdminPanel } from './components/AdminPanel';
import { TeacherPanel } from './components/TeacherPanel';
import {
  BookOpen,
  Users,
  Award,
  Calendar,
  Search,
  Bell,
  LogOut,
  Settings,
  User,
  Plus,
  Compass,
  ChevronRight,
  ClipboardCheck,
  ShieldCheck,
  Smartphone,
  Mail,
  Lock,
  Moon,
  Info,
  Clock,
  Sparkles,
  MapPin,
  Menu,
  Star,
  X
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminSetupUnlocked, setIsAdminSetupUnlocked] = useState(false);

  // Global app configurations
  const [classesList, setClassesList] = useState<SabbathClass[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);

  // Navigation states
  const [activeTab, setActiveTab] = useState<'nyumbani' | 'ripoti' | 'takwimu' | 'mafanikio' | 'usimamizi' | 'mwalimu' | 'wasifu' | 'maudhui'>('nyumbani');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // User Auth Forms states
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isAdminSetup, setIsAdminSetup] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Kiume' | 'Kike'>('Kiume');
  const [dob, setDob] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // Password reset on first login for Teachers
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newSecurePassword, setNewSecurePassword] = useState('');

  // Modals status
  const [showReportModal, setShowReportModal] = useState(false);

  // Alerts/Toasts
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  // Application Preferences/Themes
  const [preferences, setPreferences] = useState<UserPreferences>({
    userId: '',
    theme: 'light',
    accentColor: 'amber',
    fontSize: 'base',
    motionReduction: false,
    hideBirthdayPublicly: false,
  });

  const showAlert = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertMsg(msg);
    setAlertType(type);
    setTimeout(() => {
      setAlertMsg('');
    }, 4500);
  };

  // Profile customization states
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [ministry, setMinistry] = useState('');
  const [favoriteVerse, setFavoriteVerse] = useState('');
  const [talents, setTalents] = useState<string[]>([]);
  const [currentTalentInput, setCurrentTalentInput] = useState('');

  // Offline Sync State indicator
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showAlert('Umerudi mtandaoni! Data inaingizwa sasa.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showAlert('Uko nje ya mtandao. Data inahifadhiwa kwenye kifaa chako.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Authentication State changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentAuthUser) => {
      if (currentAuthUser) {
        setFirebaseUser(currentAuthUser);
        try {
          // Read user profile from Firestore
          const profileDoc = await getDoc(doc(db, 'users', currentAuthUser.uid));
          if (profileDoc.exists()) {
            const profileData = profileDoc.data() as UserProfile;
            setUser(profileData);

            // Preload profile custom properties
            setBio(profileData.bio || '');
            setOccupation(profileData.occupation || '');
            setMinistry(profileData.ministry || '');
            setFavoriteVerse(profileData.favoriteVerse || '');
            setTalents(profileData.talents || []);

            // Check if teacher needs to change temporary password
            if (profileData.role === 'teacher' && profileData.createdAt === profileData.updatedAt) {
              setMustChangePassword(true);
            }

            // Load theme preferences
            const prefDoc = await getDoc(doc(db, 'user_preferences', currentAuthUser.uid));
            if (prefDoc.exists()) {
              setPreferences({ userId: currentAuthUser.uid, ...prefDoc.data() } as UserPreferences);
            } else {
              setPreferences((prev) => ({ ...prev, userId: currentAuthUser.uid }));
            }
          } else {
            // First time registration or no profile found
            showAlert('Sajili akaunti yako ya mwonekano kwanza.', 'info');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          showAlert('Hitilafu katika kupata wasifu wa mtumiaji.', 'error');
        }
      } else {
        setUser(null);
        setFirebaseUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if first-admin setup is locked out or available
  useEffect(() => {
    const checkAdminsExist = async () => {
      try {
        const snap = await getDocs(collection(db, 'admins'));
        if (snap.empty) {
          setIsAdminSetupUnlocked(true);
          setAuthMode('register');
          setIsAdminSetup(true);
        } else {
          setIsAdminSetupUnlocked(false);
        }
      } catch (err) {
        console.error('Checking administration setups failed:', err);
      }
    };
    checkAdminsExist();
  }, []);

  // Preload classes dynamically from Firestore (Existing collection requirement!)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'classes'), (snap) => {
      const list: SabbathClass[] = [];
      snap.forEach((docSnap) => {
        list.push({ classId: docSnap.id, ...docSnap.data() } as SabbathClass);
      });
      setClassesList(list);
    }, (err) => {
      console.error('Classes listener failed:', err);
    });
    return () => unsubscribe();
  }, []);

  // Preload global announcements in real-time
  useEffect(() => {
    const q = query(collection(db, 'announcements'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: Announcement[] = [];
      snap.forEach((docSnap) => {
        list.push({ announcementId: docSnap.id, ...docSnap.data() } as Announcement);
      });
      setAnnouncements(list.sort((a,b)=> b.createdAt.localeCompare(a.createdAt)));
    }, (err) => {
      console.error('Announcements load failed:', err);
    });
    return () => unsubscribe();
  }, []);

  // Preload church events with real-time RSVPs
  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const list: EventRecord[] = [];
      snap.forEach((docSnap) => {
        list.push({ eventId: docSnap.id, ...docSnap.data() } as EventRecord);
      });
      setEvents(list.sort((a, b) => a.date.localeCompare(b.date)));
    }, (err) => {
      console.error('Events sync failed:', err);
    });
    return () => unsubscribe();
  }, []);

  // Handle Log out
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      showAlert('Umekata logu kwa heri!', 'success');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Sign in Administrator or Teacher/Member with Email/Password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showAlert('Kila kisanduku ni lazima kujazwa.', 'error');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      showAlert('Umekaribishwa kwa mafanikio!', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Barua pepe au Nenosiri lilikosewa.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // First-time Admin or Member registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !fullName || !phone) {
      showAlert('Tafadhali jaza visanduku vyote vya lazima.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Nenosiri lako na uhakiki wa nenosiri hazifanani.', 'error');
      return;
    }
    if (!isAdminSetup && !selectedClassId) {
      showAlert('Tafadhali chagua Darasa la Shule ya Sabato la Kujiunga.', 'error');
      return;
    }

    setLoading(true);
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const userUid = credentials.user.uid;

      const selectedClass = classesList.find((c) => c.classId === selectedClassId);

      const profilePayload: UserProfile = {
        uid: userUid,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        email: email.trim(),
        gender: gender,
        dateOfBirth: dob || '1995-01-01',
        classId: isAdminSetup ? '' : selectedClassId,
        className: isAdminSetup ? 'Wasimamizi' : (selectedClass?.name || 'Sajili Darasa'),
        role: isAdminSetup ? 'admin' : 'member',
        status: 'active',
        xp: 10, // starting gift XP for joining
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Save user profile to `/users`
      await setDoc(doc(db, 'users', userUid), profilePayload);

      // 2. If registering as Administrator (For First-time setup)
      if (isAdminSetup) {
        await setDoc(doc(db, 'admins', userUid), {
          uid: userUid,
          fullName: fullName.trim(),
          email: email.trim(),
          assignedAt: new Date().toISOString()
        });
        showAlert('Wasifu wa kwanza wa Usimamizi umeundwa kikamilifu!', 'success');
        setIsAdminSetupUnlocked(false);
      } else {
        // Increment members count in selected class (Existing folder classes)
        if (selectedClassId) {
          await updateDoc(doc(db, 'classes', selectedClassId), {
            membersCount: (selectedClass?.membersCount || 0) + 1
          });
        }
        showAlert('Wasifu wako wa Mshiriki umeundwa vyema!', 'success');
      }

      // 3. Set Audit activity log
      await setDoc(doc(db, 'activity_logs', `log_${Date.now()}`), {
        id: `log_${Date.now()}`,
        userId: userUid,
        userName: fullName.trim(),
        userRole: profilePayload.role,
        action: isAdminSetup ? 'First Admin Creation' : 'Member Registration',
        details: `${fullName} amesajili mafanikio katika Shule ya Sabato Sinza`,
        createdAt: new Date().toISOString()
      });

    } catch (err: any) {
      console.error(err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `users/${fullName}`);
      } catch (fe: any) {
        showAlert(fe.message || 'Hitilafu wakati wa kujisajili.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password reset workflow
  const handleForgotPasword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showAlert('Tafadhali ingiza barua pepe kwanza.', 'error');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      showAlert('Fuatilia kiungo cha marekebisho ya nenosiri katika Barua pepe yako sasa.', 'success');
      setAuthMode('login');
    } catch (err) {
      showAlert('Barua pepe hiyo haipatikani kwenye mfumo.', 'error');
    }
  };

  // Trigger Teacher temporary password change
  const handleForcePasswordChange = async () => {
    if (!newSecurePassword || newSecurePassword.length < 6) {
      showAlert('Nenosiri la kwanza lazima liwe na herufi sita au zaidi.', 'error');
      return;
    }
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newSecurePassword);
        // Update user setup completed in user object
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          updatedAt: new Date().toISOString()
        });
        setMustChangePassword(false);
        showAlert('Nenosiri jipya limethibitishwa kikamilifu!', 'success');
      }
    } catch (err) {
      showAlert('Meshindwa kusasisha nenosiri upya.', 'error');
    }
  };

  // RSVP management for Events
  const handleEventRSVP = async (eventId: string, currentRegistrants: string[]) => {
    if (!user) return;
    try {
      const isRegistered = currentRegistrants.includes(user.uid);
      const nextRegistrants = isRegistered
        ? currentRegistrants.filter((id) => id !== user.uid)
        : [...currentRegistrants, user.uid];

      await updateDoc(doc(db, 'events', eventId), {
        registrants: nextRegistrants
      });

      showAlert(isRegistered ? 'Ameshindwa kujiunga na programu' : 'Hongera! Umejisajili kushiriki kikamilifu!', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Imeshindwa kufanya uhifadhi.', 'error');
    }
  };

  // Custom profile update actions
  const handleUpdateProfileCustoms = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        bio,
        occupation,
        ministry,
        favoriteVerse,
        talents,
        updatedAt: new Date().toISOString()
      });
      showAlert('Wasifu wako mkuu umesahihishwa!', 'success');
      // refresh local profile object
      setUser((prev: any) => ({
        ...prev,
        bio,
        occupation,
        ministry,
        favoriteVerse,
        talents
      }));
    } catch (err) {
      showAlert('Imeshindwa kuhifadhi wasifu upya.', 'error');
    }
  };

  const handleAddTalent = () => {
    if (!currentTalentInput.trim()) return;
    if (talents.includes(currentTalentInput.trim())) return;
    setTalents((prev) => [...prev, currentTalentInput.trim()]);
    setCurrentTalentInput('');
  };

  const handleRemoveTalent = (val: string) => {
    setTalents((prev) => prev.filter((t) => t !== val));
  };

  const selectedTheme = THEMES[preferences.theme] || THEMES.light;

  return (
    <div id="sinza-app-root" className={`min-h-screen ${selectedTheme.background} font-${preferences.fontSize} transition-all duration-300`}>
      
      {/* Alert Banner / Toast */}
      {alertMsg && (
        <div
          id="toast-alert"
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] py-3.5 px-6 rounded-2xl shadow-2xl border flex items-center gap-3 animate-bounce ${
            alertType === 'success'
              ? 'bg-emerald-555 text-zinc-950 border-emerald-400 font-bold'
              : alertType === 'error'
              ? 'bg-red-500/10 border-red-500 text-red-500 text-xs'
              : 'bg-zinc-900 border-zinc-800 text-amber-500 text-xs'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Auth Screen */}
      {!user ? (
        <div id="auth-screen" className="min-h-screen flex items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url("https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1400")' }}>
          <div id="auth-panel" className="w-full max-w-lg bg-zinc-900/70 backdrop-blur-md rounded-3xl border border-white/10 p-6 md:p-8 text-white space-y-6 shadow-2xl">
            
            {/* Logos and header */}
            <div className="flex justify-between items-center px-4">
              <SDALogo className="w-14 h-14 text-amber-500" />
              <div className="text-center">
                <h1 className="text-lg font-black tracking-wide">SINZA SDA CHURCH</h1>
                <p className="text-[10px] text-zinc-400 font-medium">Adult Sabbath School Department</p>
              </div>
              <SabbathSchoolLogo className="w-14 h-14 text-blue-400" />
            </div>

            {/* Title / Description */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">
                {isAdminSetup
                  ? 'Sanidi Wasifu wa Kwanza wa Usimamizi'
                  : authMode === 'login'
                  ? 'Ukurasa wa Kuingia (Login)'
                  : authMode === 'register'
                  ? 'Sajili Wasifu wa Mshiriki'
                  : 'Rudisha Nenosiri'}
              </h2>
              <p className="text-xs text-zinc-400">Mfumo thabiti na rasmi wa Kidigitali kwa madarasa ya Shule ya Sabato Sinza</p>
            </div>

            {/* Auth Form selectors */}
            {!isAdminSetup && (
              <div className="flex bg-zinc-950/60 p-1.5 rounded-xl border border-zinc-850">
                <button
                  id="switch-login"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'login' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Ingia
                </button>
                <button
                  id="switch-register"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    authMode === 'register' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Sajili Mshiriki
                </button>
              </div>
            )}

            {/* FORMS */}
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-zinc-400">Barua Pepe (Email):</label>
                  <div className="flex items-center gap-2 bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl">
                    <Mail className="w-4 h-4 text-zinc-500" />
                    <input
                      id="login-email"
                      type="email"
                      placeholder="ingiza barua pepe..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-zinc-200 w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-zinc-400">Nenosiri (Password):</label>
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      className="text-[10px] text-amber-500 hover:underline"
                    >
                      Umesahau?
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl">
                    <Lock className="w-4 h-4 text-zinc-500" />
                    <input
                      id="login-password"
                      type="password"
                      placeholder="ingiza nenosiri..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-zinc-200 w-full"
                    />
                  </div>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs transition shadow-xl mt-4"
                >
                  Ingia Mfomuni
                </button>
              </form>
            ) : authMode === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4.5 max-h-[450px] overflow-y-auto pr-2">
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-zinc-400">Jina Kamili:</label>
                  <input
                    id="reg-fullname"
                    type="text"
                    placeholder="Mshiriki Yohana..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-zinc-400">Barua Pepe (Email):</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="mshiriki@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-zinc-400">Namba ya Simu:</label>
                  <input
                    id="reg-phone"
                    type="text"
                    placeholder="07xxxxxxxx..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-zinc-400">Jinsia:</label>
                    <select
                      id="reg-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                    >
                      <option value="Kiume">Kiume</option>
                      <option value="Kike">Kike</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-zinc-400">Siku ya Kuzaliwa:</label>
                    <input
                      id="reg-dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                    />
                  </div>
                </div>

                {!isAdminSetup && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-zinc-400">Chagua Darasa la Shule ya Sabato:</label>
                    <select
                      id="reg-class"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                    >
                      <option value="">Chagua Darasa lako...</option>
                      {classesList.map((c) => (
                        <option key={c.classId} value={c.classId}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-850 pt-3">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-zinc-400">Nenosiri:</label>
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="herufi 6+..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-zinc-400">Thibitisha:</label>
                    <input
                      id="reg-confirm"
                      type="password"
                      placeholder="Uhakiki..."
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                    />
                  </div>
                </div>

                <button
                  id="reg-submit-btn"
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black rounded-xl text-xs transition shadow-xl mt-4"
                >
                  {isAdminSetup ? 'Sajili Msimamizi' : 'Sajili Sasa'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPasword} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-bold text-zinc-400">Ingiza barua pepe yako:</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="barua-pepe@safari.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950/60 p-3 border border-zinc-850 rounded-xl text-xs text-zinc-200"
                  />
                </div>
                <button
                  id="forgot-submit-btn"
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs mt-3"
                >
                  Tuma Kiungo cha Kuhuisha
                </button>
              </form>
            )}

            <div className="text-[10px] text-zinc-500 text-center border-t border-white/5 pt-3">
              Sinza Seventh-day Adventist Church &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      ) : mustChangePassword ? (
        /* Teacher temporary password forcing screen */
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-white space-y-4 text-center">
            <Lock className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-lg font-bold">Badilisha Nenosiri la Muda</h2>
            <p className="text-xs text-zinc-400">Huu ni usajili wa kwanza. Ni sheria lazima mwalimu ubadilishe nenosiri la kwanza uliyopokea kwa msimamizi kabla ya kuona darasa lako.</p>
            <input
              id="new-secure-pwd"
              type="password"
              placeholder="Nenosiri lako salama kuanzia herufi 6+..."
              value={newSecurePassword}
              onChange={(e) => setNewSecurePassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl text-xs text-white"
            />
            <button
              id="change-pwd-btn"
              onClick={handleForcePasswordChange}
              className="w-full py-2.5 bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs"
            >
              Hifadhi na Uendelee
            </button>
          </div>
        </div>
      ) : (
        /* Main application page */
        <div className="min-h-screen flex flex-col justify-between">
          
          {/* Header */}
          <header className={`sticky top-0 z-40 ${selectedTheme.header} shadow-sm backdrop-blur-md`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              
              <div className="flex items-center gap-2.5">
                <SDALogo className="w-9 h-9 text-amber-500" />
                <div className="text-left leading-tight hidden xs:block">
                  <h1 className="text-xs font-black tracking-wide">SINZA SDA CHURCH</h1>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Sabbath School Dep.</span>
                </div>
              </div>

              {/* Offline Indicator & Level Badges */}
              <div className="flex items-center gap-4">
                
                {/* Offline sign */}
                {!isOnline && (
                  <span className="flex items-center gap-1 text-[9px] bg-red-500/10 text-red-500 py-1 px-2.5 font-bold rounded-full border border-red-500/20">
                    Nje ya Mtandao (IndexedDB Active)
                  </span>
                )}

                <div className="flex items-center gap-1.5 bg-zinc-550/10 hover:bg-zinc-550/20 py-1 px-2.5 rounded-full text-xs font-bold text-amber-550 transition border border-amber-550/20">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ngazi {user.level || 1}</span>
                </div>

                {/* User mini status */}
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold line-clamp-1">{user.fullName}</span>
                  <span className="text-[9px] text-zinc-400 capitalize">{user.role === 'admin' ? 'Msimamizi' : user.role === 'teacher' ? 'Mwalimu wa Sabato' : user.className}</span>
                </div>

                {/* Menu triggers */}
                <button
                  id="mobile-menu-trigger"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-1 bg-zinc-550/10 rounded-lg hover:bg-zinc-550/20 text-zinc-400"
                >
                  {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  className="hidden md:block p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          </header>

          {/* Core App View Container */}
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            
            {/* Desktop Side/Top Tabs menu */}
            <div className="flex flex-col md:flex-row gap-6">
              
              {/* Sidebar layout menu for desktop */}
              <div className="hidden md:flex flex-col w-64 space-y-1.5 shrink-0">
                {([
                  { key: 'nyumbani', label: 'Mwanzo (Announcements)', icon: <Compass className="w-4 h-4" /> },
                  { key: 'ripoti', label: 'Wasilisha Ripoti', icon: <ClipboardCheck className="w-4 h-4" />, roleExclusive: 'member' },
                  { key: 'mwalimu', label: 'Darasa Langu', icon: <BookOpen className="w-4 h-4" />, roleExclusive: 'teacher' },
                  { key: 'usimamizi', label: 'Usimamizi Mkuu', icon: <ShieldCheck className="w-4 h-4" />, roleExclusive: 'admin' },
                  { key: 'takwimu', label: 'Uchambuzi & Grafu', icon: <Compass className="w-4 h-4" /> },
                  { key: 'mafanikio', label: 'Ubao wa Ushindi & Badji', icon: <Award className="w-4 h-4" /> },
                  { key: 'wasifu', label: 'Marekebisho ya Wasifu', icon: <User className="w-4 h-4" /> },
                  { key: 'maudhui', label: 'Rangi na Mwonekano', icon: <Settings className="w-4 h-4" /> }
                ] as { key: string; label: string; icon: any; roleExclusive?: string }[]).map((tab) => {
                  // Role checks
                  if (tab.roleExclusive && user.role !== tab.roleExclusive) return null;

                  return (
                    <button
                      id={`sidebar-btn-${tab.key}`}
                      key={tab.key}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setShowMobileMenu(false);
                      }}
                      className={`flex items-center gap-3 py-3 px-4 text-xs font-semibold rounded-2xl transition text-left ${
                        activeTab === tab.key
                          ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-550/10'
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
                
                <hr className="border-zinc-800" />
                <div className="p-4 rounded-xl bg-zinc-950/20 text-[9px] text-zinc-500 text-left space-y-1">
                  <p>Mshiriki UID: <span className="font-mono text-zinc-400">{user.uid}</span></p>
                  <p>Kanisa: Sinza Seventh-day Adventist Church</p>
                </div>
              </div>

              {/* Mobile Sidebar menu overlays */}
              {showMobileMenu && (
                <div id="mobile-sidebar-overlay" className="fixed inset-0 z-30 bg-black/80 md:hidden flex justify-end">
                  <div className="w-80 bg-zinc-900 border-l border-zinc-805 p-6 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                        <SDALogo className="w-8 h-8 text-amber-500" />
                        <h4 className="text-xs font-bold text-white">Shule ya Sabato Sinza</h4>
                        <button onClick={() => setShowMobileMenu(false)} className="p-1 text-zinc-400">&times;</button>
                      </div>

                      <div className="flex flex-col gap-1">
                        {([
                          { key: 'nyumbani', label: 'Mwanzo (Announcements)', icon: <Compass className="w-4 h-4" /> },
                          { key: 'ripoti', label: 'Wasilisha Ripoti', icon: <ClipboardCheck className="w-4 h-4" />, roleExclusive: 'member' },
                          { key: 'mwalimu', label: 'Darasa Langu', icon: <BookOpen className="w-4 h-4" />, roleExclusive: 'teacher' },
                          { key: 'usimamizi', label: 'Usimamizi Mkuu', icon: <ShieldCheck className="w-4 h-4" />, roleExclusive: 'admin' },
                          { key: 'takwimu', label: 'Uchambuzi & Grafu', icon: <Compass className="w-4 h-4" /> },
                          { key: 'mafanikio', label: 'Ubao wa Ushindi & Badji', icon: <Award className="w-4 h-4" /> },
                          { key: 'wasifu', label: 'Marekebisho ya Wasifu', icon: <User className="w-4 h-4" /> },
                          { key: 'maudhui', label: 'Maudhui na Rangi', icon: <Settings className="w-4 h-4" /> }
                        ] as { key: string; label: string; icon: any; roleExclusive?: string }[]).map((tab) => {
                          if (tab.roleExclusive && user.role !== tab.roleExclusive) return null;
                          return (
                            <button
                              id={`mobile-btn-${tab.key}`}
                              key={tab.key}
                              onClick={() => {
                                setActiveTab(tab.key);
                                setShowMobileMenu(false);
                              }}
                              className={`flex items-center gap-3 py-3 px-4 text-xs font-semibold rounded-xl text-left ${
                                activeTab === tab.key
                                  ? 'bg-amber-500 text-zinc-950 font-bold'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              {tab.icon}
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      id="mobile-logout-btn"
                      onClick={handleLogout}
                      className="w-full py-3 bg-red-600/10 text-red-500 border border-red-500/20 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Ondoka
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW SWAP CORE */}
              <div className="flex-1 space-y-6">
                
                {/* 1. ANNOUNCEMENTS AND EVENT FEED (NYUMBANI) */}
                {activeTab === 'nyumbani' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
                    
                    {/* Welcome hero banner */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="relative p-6 rounded-3xl bg-zinc-900 overflow-hidden border border-white/5 shadow" style={{ backgroundImage: 'linear-gradient(135deg, rgba(245,158,11,0.05) 0%, rgba(16,185,129,0.05) 100%)' }}>
                        <div className="relative z-10 space-y-2">
                          <span className="text-[10px] text-amber-550 font-black uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Karibu Shule ya Sabato Sinza
                          </span>
                          <h2 className="text-xl md:text-2xl font-black text-white">Habari {user.fullName}!</h2>
                          <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">Kuza maisha yako ya kiroho kwa kujifunza lesoni kila siku, kukariri mafungu kuu, na kujitolea katika utumishi wa jamii na uinjilisti.</p>
                          
                          {user.role === 'member' && (
                            <button
                              id="hero-report-trigger"
                              onClick={() => setShowReportModal(true)}
                              className="py-2.5 px-5 bg-gradient-to-r from-amber-550 to-amber-600 hover:to-amber-700 font-bold text-zinc-950 rounded-xl text-xs transition shadow-xl mt-3 flex items-center gap-2"
                            >
                              Wasilisha Ripoti ya wiki hii
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Real-time Announcements List */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white border-b border-zinc-850 pb-2">Matangazo ya Kanisa na Ndani ya Darasa ({announcements.length})</h3>
                        
                        {announcements.length === 0 ? (
                          <div className="p-8 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-950/20 border border-zinc-850/60">Hakuna matangazo yoyote ya kiidara yaliyochapishwa kwa sasa.</div>
                        ) : (
                          <div className="space-y-4">
                            {announcements.map((ann) => {
                              // If announcement has scope and does not match member's class, skip it!
                              if (ann.scope !== 'global' && ann.scope !== user.classId) return null;

                              return (
                                <div key={ann.announcementId} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-805 space-y-2 text-left">
                                  <div className="flex justify-between items-start">
                                    <h4 className="text-xs font-black text-white">{ann.title}</h4>
                                    <span className="text-[8px] px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                                      {ann.scope === 'global' ? 'Kanisa Zima' : 'Darasani kwako'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-300 leading-relaxed">{ann.content}</p>
                                  <div className="flex items-center gap-2 pt-2 text-[9px] text-zinc-500 font-bold">
                                    <span>Mchapishaji: {ann.authorName}</span>
                                    <span>&bull;</span>
                                    <span>{new Date(ann.createdAt).toLocaleDateString('sw-TZ')}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Events / Programs Feed (RSVP Support) */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white border-b border-zinc-850 pb-2">Ratiba ya Matukio & Vipindi ({events.length})</h3>
                      
                      {events.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-950/20 border border-zinc-850/60">Idara bado haijapanga matukio kwa juma hili bado.</div>
                      ) : (
                        <div className="space-y-4">
                          {events.map((event) => {
                            const isUserRegistered = event.registrants?.includes(user.uid) || false;
                            
                            return (
                              <div key={event.eventId} id={`event-card-${event.eventId}`} className="p-4.5 rounded-2xl bg-zinc-900/40 border border-zinc-805 text-left space-y-3">
                                <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/25 py-0.5 px-2 rounded-full uppercase font-bold tracking-widest">{event.category}</span>
                                
                                <div className="space-y-1">
                                  <h4 className="text-xs font-black text-white">{event.title}</h4>
                                  <p className="text-[10px] text-zinc-400 leading-normal">{event.description}</p>
                                </div>

                                <div className="space-y-1.5 pt-1.5 text-[10px] text-zinc-450 border-t border-zinc-850">
                                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-zinc-500" /> <span>{event.date} Mnamo {event.time}</span></div>
                                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> <span>{event.location}</span></div>
                                </div>

                                <button
                                  id={`rsvp-btn-${event.eventId}`}
                                  onClick={() => handleEventRSVP(event.eventId, event.registrants || [])}
                                  className={`w-full py-2 rounded-xl text-[10px] font-bold transition ${
                                    isUserRegistered
                                      ? 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400'
                                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850'
                                  }`}
                                >
                                  {isUserRegistered ? 'Umejisajili kushiriki (Ghairi)' : 'Nitashiriki Programu Hii'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 2. REPORT EXCLUSIVES PANEL */}
                {activeTab === 'ripoti' && (
                  <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-805 space-y-4 text-left">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-amber-550" /> Wasilisha au Sahihisha ripoti yako ya Shule ya Sabato
                    </h2>
                    <p className="text-xs text-zinc-400">Kuripoti nyanjani kutarudisha matokeo ya kiroho kiotomatiki na kutunuku Alama na Badji.</p>
                    
                    <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 text-xs text-zinc-400 leading-relaxed max-w-xl">
                      Weka data sahihi kulingana na kile unachokikumbuka. Mara tu ripoti inapowasilishwa, itamfikia Mwalimu wako wa Darasa kwa uhakiki na idhinisho kabla ya kuwa rasmi kwenye ripoti ya idara nzima ya kanisa kuu bado.
                    </div>

                    <button
                      id="page-report-trigger-btn"
                      onClick={() => setShowReportModal(true)}
                      className="py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold rounded-xl text-xs shadow-lg flex items-center gap-2"
                    >
                      Anza Kujaza Ripoti ya wiki hii
                    </button>
                  </div>
                )}

                {/* 3. TEACHER DASHBOARD PANEL LINK */}
                {activeTab === 'mwalimu' && <TeacherPanel teacher={user} />}

                {/* 4. ADMIN DASHBOARD PANEL LINK */}
                {activeTab === 'usimamizi' && <AdminPanel />}

                {/* 5. STATS ANALYTICS LINK */}
                {activeTab === 'takwimu' && <AnalyticsSection />}

                {/* 6. ACHIEVEMENTS & LEADERBOARDS LINK */}
                {activeTab === 'mafanikio' && <AchievementsSection member={user} />}

                {/* 7. PROFILE CUSTOMIZER WORKFLOW */}
                {activeTab === 'wasifu' && (
                  <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-805 space-y-6 text-left animate-fade-in max-w-3xl">
                    <div className="border-b border-zinc-800 pb-3">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-amber-500" />
                        Sasisha & Binafsisha Wasifu wako (Profile Customs)
                      </h3>
                      <p className="text-xs text-zinc-400">Kubali kukamilisha wasifu wako ili washiriki wenzako wa darasani wakutambue na kuthamini vipaji vyako.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">Kazi/Shughuli Unayofanya (Occupation):</label>
                        <input
                          id="profile-occupation"
                          type="text"
                          value={occupation}
                          onChange={(e) => setOccupation(e.target.value)}
                          placeholder="Mkurugenzi wa Teknolojia..."
                          className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">Idara/Huduma Kanisani (Ministry):</label>
                        <input
                          id="profile-ministry"
                          type="text"
                          value={ministry}
                          onChange={(e) => setMinistry(e.target.value)}
                          placeholder="Kwaya ya Kanisa / Huduma ya Vijana..."
                          className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-1">Fungu Kipenzi cha Biblia (Favorite Verse):</label>
                        <input
                          id="profile-verse"
                          type="text"
                          value={favoriteVerse}
                          onChange={(e) => setFavoriteVerse(e.target.value)}
                          placeholder="Zaburi 23:1 - Bwana ndiye mchungaji wangu, sitapungukiwa na kitu..."
                          className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-1">Wasifu Mfupi na Historia (Bio):</label>
                        <textarea
                          id="profile-bio"
                          rows={3}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Nimeikabidhi nafsi yangu kumtumikia kristo..."
                          className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white resize-none"
                        />
                      </div>

                      {/* Dynamic Talent management tags */}
                      <div className="sm:col-span-2 space-y-3">
                        <label className="block text-[10px] text-zinc-400">Vipawa na Karama zako (Talents & Skills):</label>
                        <div className="flex gap-2">
                          <input
                            id="talent-input"
                            type="text"
                            value={currentTalentInput}
                            onChange={(e) => setCurrentTalentInput(e.target.value)}
                            placeholder="mf. Kuimba, Kuhubiri, Kupika, Kupiga Kinanda..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-xs text-white"
                          />
                          <button
                            id="add-talent-btn"
                            onClick={handleAddTalent}
                            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 rounded-xl border border-zinc-800 text-xs font-bold text-amber-500"
                          >
                            Ongeza
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {talents.map((t) => (
                            <span key={t} className="flex items-center gap-1.5 py-1 px-3 bg-zinc-950 border border-zinc-850 text-[10px] font-semibold text-zinc-200 rounded-full">
                              {t}
                              <button onClick={() => handleRemoveTalent(t)} className="text-red-400 hover:text-red-500 text-xs font-bold">&times;</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      id="save-profile-btn"
                      onClick={handleUpdateProfileCustoms}
                      className="py-3 px-6 bg-amber-500 hover:bg-amber-600 font-bold text-zinc-950 rounded-xl text-xs shadow-lg transition"
                    >
                      Hifadhi Marekebisho yote
                    </button>
                  </div>
                )}

                {/* 8. MAUDHUI (THEMES & STYLE SELECTOR LINK) */}
                {activeTab === 'maudhui' && (
                  <ThemeSelector
                    preferences={preferences}
                    onChange={(updates) => setPreferences((prev) => ({ ...prev, ...updates }))}
                    userId={user.uid}
                  />
                )}

              </div>

            </div>
          </main>

          {/* Footer of the whole application */}
          <footer className="py-6 border-t border-zinc-850 bg-zinc-900/35 text-center mt-12 text-[10px] text-zinc-500 space-y-2">
            <div className="flex gap-3 justify-center items-center">
              <SDALogo className="w-5 h-5 opacity-40 text-white" />
              <SabbathSchoolLogo className="w-5 h-5 opacity-40 text-blue-500" />
            </div>
            <p>Idara ya Shule ya Sabato &copy; {new Date().getFullYear()} - Sinza SDA Church</p>
            <p>Mfumo unalindwa kwa itifaki zote rasmi za Firebase. Usimamizi kwa heri thabiti.</p>
          </footer>

          {/* Modal Overlay triggerer */}
          {showReportModal && (
            <MemberReportModal
              member={user}
              onClose={() => setShowReportModal(false)}
              onSuccess={() => {
                setShowReportModal(false);
                showAlert('Ripoti yako ya juma imefanikiwa kuwasilishwa! Shule ya Sabato inakuthamini.', 'success');
              }}
            />
          )}

        </div>
      )}

    </div>
  );
}
