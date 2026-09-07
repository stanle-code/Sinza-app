export type UserRole = 'admin' | 'teacher' | 'member';

export interface UserProfile {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  gender: 'Kiume' | 'Kike';
  dateOfBirth: string; // YYYY-MM-DD
  classId: string;
  className: string;
  role: UserRole;
  status: 'active' | 'suspended';
  bio?: string;
  occupation?: string;
  ministry?: string;
  skills?: string[];
  talents?: string[];
  favoriteVerse?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  xp: number;
  level: number;
  achievements?: string[]; // list of badge IDs
  lastReportDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SabbathClass {
  classId: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  membersCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface WeeklyReport {
  reportId: string;
  memberId: string;
  memberName: string;
  classId: string;
  className: string;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  
  // A. HUDUMA YANGU KWA YESU
  hudumaYangu: {
    visits: number;       // Mara ngapi umetembelea kwa kusudi la injili
    literature: number;   // Idadi ya magazeti, vitabu na vijizuu vilivyotolewa
    teachings: number;    // Idadi ya mafundisho na mahubiri yaliyotolewa
    soulsWon: number;     // Idadi ya roho zilizoongolewa
  };

  // B. HUDUMA KWA JAMII
  hudumaJamii: {
    peopleHelped: number; // Idadi ya watu waliosaidiwa
    clothesGiven: number; // Idadi ya nguo zilizotolewa
    moneyValueFood: number; // Fedha na thamani ya chakula kilichotolewa
  };

  // C. USOMAJI WA LESONI NA BIBLIA
  usomajiLesoni: {
    somaLesoniMpango: boolean;      // Je, umesoma lesoni kwa mpango?
    somaLesoniSiMpango: boolean;    // Je, umesoma lesoni japokuwa si kwa mpango?
    somaLesoniMtandao: boolean;     // Je, umesoma lesoni kwa njia ya mtandao?
    somaBibliaMpango: boolean;      // Je, umesoma Biblia kwa mpango?
    somaKeshaRohoUnabii: boolean;   // Je, umesoma Kesha au Roho ya Unabii?
    somaLesoniWatoto: boolean;      // Je, umesoma lesoni za watoto pamoja na watoto?
    kaririFunguKuu: boolean;        // Je, umekariri fungu kuu?
    mwongozoKujifunzaBiblia: boolean; // Je, una mwongozo wa kujifunza Biblia?
  };

  status: 'submitted' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedByName?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  attendanceId: string; // classId_YYYY-MM-DD
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  attendees: string[]; // List of member UIDs present
  visitors: {
    name: string;
    phone?: string;
    gender: 'Kiume' | 'Kike';
  }[];
  recordedBy: string; // Teacher or Admin UID
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  announcementId: string;
  title: string;
  content: string;
  scope: 'global' | string; // 'global' or classId
  authorId: string;
  authorName: string;
  isPinned: boolean;
  scheduledFor?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface EventRecord {
  eventId: string;
  title: string;
  description: string;
  category: 'Sabbath Program' | 'Evangelism' | 'Bible Study' | 'Prayer Meeting' | 'Community Outreach' | 'Seminar';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  registrants: string[]; // Array of member UIDs registered
  createdAt: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon identification
  criteria: string;
  xpReward: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'midnight' | 'ocean' | 'forest' | 'emerald' | 'gold' | 'royal';
  accentColor: string; // hex or tailwind color class
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  motionReduction: boolean;
  hideBirthdayPublicly: boolean;
}
