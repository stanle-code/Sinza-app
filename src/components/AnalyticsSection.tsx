import React, { useState, useEffect } from 'react';
import { WeeklyReport, AttendanceRecord, SabbathClass } from '../types';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, CartesianGrid } from 'recharts';
import { FileText, FileSpreadsheet, Sparkles, TrendingUp, Users, Heart, BookOpen, Search, Filter } from 'lucide-react';
import { SDALogo, SabbathSchoolLogo } from './Logos';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export function AnalyticsSection() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<SabbathClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterClassId, setFilterClassId] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const reportsSnap = await getDocs(collection(db, 'weekly_reports'));
        const attSnap = await getDocs(collection(db, 'attendance'));
        const classesSnap = await getDocs(collection(db, 'classes'));

        const reportsList: WeeklyReport[] = [];
        reportsSnap.forEach((doc) => reportsList.push(doc.data() as WeeklyReport));
        setReports(reportsList);

        const attList: AttendanceRecord[] = [];
        attSnap.forEach((doc) => attList.push(doc.data() as AttendanceRecord));
        setAttendance(attList);

        const classesList: SabbathClass[] = [];
        classesSnap.forEach((doc) => classesList.push(doc.data() as SabbathClass));
        setClasses(classesList);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered reports & attendance based on user's selection
  const filteredReports = filterClassId === 'all' 
    ? reports 
    : reports.filter(r => r.classId === filterClassId);

  const filteredAttendance = filterClassId === 'all'
    ? attendance
    : attendance.filter(a => a.classId === filterClassId);

  // Aggregate Key Statistics
  const totalVisits = filteredReports.reduce((s, r) => s + (r.hudumaYangu?.visits || 0), 0);
  const totalLiterature = filteredReports.reduce((s, r) => s + (r.hudumaYangu?.literature || 0), 0);
  const totalTeachings = filteredReports.reduce((s, r) => s + (r.hudumaYangu?.teachings || 0), 0);
  const totalSouls = filteredReports.reduce((s, r) => s + (r.hudumaYangu?.soulsWon || 0), 0);

  const totalHelped = filteredReports.reduce((s, r) => s + (r.hudumaJamii?.peopleHelped || 0), 0);
  const totalClothes = filteredReports.reduce((s, r) => s + (r.hudumaJamii?.clothesGiven || 0), 0);
  const totalMoneyValue = filteredReports.reduce((s, r) => s + (r.hudumaJamii?.moneyValueFood || 0), 0);

  // Lessoni status percentages
  const totalSubmissions = filteredReports.length || 1;
  const countLessonMpango = filteredReports.filter(r => r.usomajiLesoni?.somaLesoniMpango).length;
  const countBibliaMpango = filteredReports.filter(r => r.usomajiLesoni?.somaBibliaMpango).length;
  const countFunguKuu = filteredReports.filter(r => r.usomajiLesoni?.kaririFunguKuu).length;
  const countKesha = filteredReports.filter(r => r.usomajiLesoni?.somaKeshaRohoUnabii).length;

  const pctLessonMpango = Math.round((countLessonMpango / totalSubmissions) * 100);
  const pctBibliaMpango = Math.round((countBibliaMpango / totalSubmissions) * 100);
  const pctFunguKuu = Math.round((countFunguKuu / totalSubmissions) * 100);
  const pctKesha = Math.round((countKesha / totalSubmissions) * 100);

  // Total Present & Visitors across attendance logs
  const totalPresent = filteredAttendance.reduce((s, a) => s + (a.attendees?.length || 0), 0);
  const totalVisitors = filteredAttendance.reduce((s, a) => s + (a.visitors?.length || 0), 0);

  // Generate charts data: Group report and usomaji stats by week ending dates
  const getWeeklyProgressData = () => {
    const grouped: Record<string, { date: string; Upendo: number; Vitabu: number; Roho: number; Wagonjwa: number }> = {};
    
    filteredReports.forEach(r => {
      const date = r.weekEndDate;
      if (!grouped[date]) {
        grouped[date] = { date, Upendo: 0, Vitabu: 0, Roho: 0, Wagonjwa: 0 };
      }
      grouped[date].Upendo += r.hudumaYangu?.visits || 0;
      grouped[date].Vitabu += r.hudumaYangu?.literature || 0;
      grouped[date].Roho += r.hudumaYangu?.soulsWon || 0;
      grouped[date].Wagonjwa += r.hudumaJamii?.peopleHelped || 0;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getAttendanceChartData = () => {
    const grouped: Record<string, { date: string; Washiriki: number; Wageni: number }> = {};
    
    filteredAttendance.forEach(a => {
      const date = a.date;
      if (!grouped[date]) {
        grouped[date] = { date, Washiriki: 0, Wageni: 0 };
      }
      grouped[date].Washiriki += a.attendees?.length || 0;
      grouped[date].Wageni += a.visitors?.length || 0;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  };

  const weeklyProgress = getWeeklyProgressData();
  const attendanceProgress = getAttendanceChartData();

  // EXPORT GENERATORS
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Ripoti ya Shule ya Sabato Sinza SDA\n';
    csvContent += `Darasani, ${filterClassId === 'all' ? 'Yote' : filterClassId}\n\n`;
    csvContent += 'Kipengele, Thamani ya Jumla\n';
    csvContent += `Vipeperushi na Vitabu Vilivyotolewa, ${totalLiterature}\n`;
    csvContent += `Kutembelea washiriki kwa injili, ${totalVisits}\n`;
    csvContent += `Mahubiri/Mafundisho yaliyotolewa, ${totalTeachings}\n`;
    csvContent += `Roho zilizoongolewa, ${totalSouls}\n`;
    csvContent += `Watu waliowasaidiwa kijamii, ${totalHelped}\n`;
    csvContent += `Nguo zilizotolewa, ${totalClothes}\n`;
    csvContent += `Thamani ya misaada ya chakula / pesa, ${totalMoneyValue} TSH\n`;
    csvContent += `Jumla ya Washiriki Waliohudhuria Sabato, ${totalPresent}\n`;
    csvContent += `Jumla ya Wageni Waliohudhuria Sabato, ${totalVisitors}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SDA_Sinza_Sabbath_School_Statistics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    const summaryData = [
      { 'Zana/Kipengele': 'Vipeperushi na Vitabu', Jumla: totalLiterature, 'Huduma ya Jamii': 'Nguo Zilizotolewa', 'Jamii Jumla': totalClothes },
      { 'Zana/Kipengele': 'Utembeleaji Injili', Jumla: totalVisits, 'Huduma ya Jamii': 'Watu Waliowasaidiwa', 'Jamii Jumla': totalHelped },
      { 'Zana/Kipengele': 'Mafundisho na Mahubiri', Jumla: totalTeachings, 'Huduma ya Jamii': 'Thamani ya Chakula (TSH)', 'Jamii Jumla': totalMoneyValue },
      { 'Zana/Kipengele': 'Roho zilizo batizwa', Jumla: totalSouls, 'Huduma ya Jamii': 'Jumla ya Mahudhurio Sabatoni', 'Jamii Jumla': totalPresent },
      { 'Zana/Kipengele': 'Asilimia Inayosoma Lesoni kila siku', Jumla: `${pctLessonMpango}%`, 'Huduma ya Jamii': 'Jumla ya Wageni', 'Jamii Jumla': totalVisitors }
    ];

    const ws = XLSX.utils.json_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Uchambuzi wa Idara');
    XLSX.writeFile(wb, `SDA_Sinza_Sabbath_School_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Header section
    doc.setFillColor(34, 43, 69);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('KANISA LA WAADVENTISTA WASABATO SINZA', 15, 15);
    doc.setFontSize(11);
    doc.text('IDARA YA SHULE YA SABATO - TAARIFA YA KIUTENDAJI & TAKWIMU', 15, 23);
    doc.text(`Tarehe ya Ripoti: ${new Date().toLocaleDateString('sw-TZ')}`, 15, 30);

    // Body Title
    doc.setTextColor(33, 33, 33);
    doc.setFontSize(14);
    doc.text('Tathmini ya Kujifunza na Huduma za Umisionari', 15, 55);

    // Table rows
    let y = 65;
    const drawRow = (label: string, val: string | number) => {
      doc.setFontSize(10);
      doc.text(label, 15, y);
      doc.text(String(val), 150, y);
      doc.line(15, y + 2, 195, y + 2);
      y += 10;
    };

    drawRow('Idadi ya Vipeperushi/Vitabu vilivyotolewa:', totalLiterature);
    drawRow('Utembeleaji kwa makusudio ya uenezaji injili:', totalVisits);
    drawRow('Idadi ya mahubiri na mafundisho:', totalTeachings);
    drawRow('Roho (Watu walio batizwa au kukubali ukweli):', totalSouls);
    drawRow('Watu wenye uhitaji waliowasaidiwa na jamii:', totalHelped);
    drawRow('Nguo zilizotolewa kwa wasiojiweza:', totalClothes);
    drawRow('Thamani ya misaada ya chakula na fedha (TSH):', `${totalMoneyValue.toLocaleString('sw-TZ')} TSH`);
    drawRow('Washiriki waliosaini mahudhurio ya Sabato:', totalPresent);
    drawRow('Wageni walioshiriki darasa letu:', totalVisitors);
    drawRow('Soma Lesoni kila siku kwa mpango:', `${pctLessonMpango}% ya washiriki`);
    drawRow('Soma Biblia kwa mpango thabiti:', `${pctBibliaMpango}% ya washiriki`);

    // Add footer
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('Imeandaliwa Kiotomatiki na Sabbath School App - Sinza SDA Church', 15, 280);

    doc.save(`SDA_Sinza_Sabbath_School_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 text-sm">Takwimu na Chati zinatayarishwa...</div>
    );
  }

  return (
    <div id="analytics-section" className="space-y-8 animate-fade-in">
      
      {/* Title & Filter Options with actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-900/40 p-4 border border-zinc-800/80 rounded-2xl">
        <div className="flex items-center gap-3">
          <SabbathSchoolLogo className="w-10 h-10 text-amber-500" />
          <div className="text-left">
            <h2 className="text-lg font-bold text-white">Takwimu na Chati za Shule ya Sabato</h2>
            <p className="text-xs text-zinc-400">Hakuna Data feki. Takwimu zinajengwa kutoka kwenye ripoti halisi zilizowasilishwa.</p>
          </div>
        </div>

        {/* Filter selection and exports triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              id="analytics-class-filter"
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="bg-transparent text-xs text-zinc-150 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Madarasa Yote ({classes.length})</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>{c.name}</option>
              ))}
            </select>
          </div>

          <button
            id="pdf-export-btn"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 transition"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            Shusha PDF
          </button>
          
          <button
            id="excel-export-btn"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            Excel
          </button>

          <button
            id="csv-export-btn"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-800 transition"
          >
            CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Visits Card */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-950 text-amber-500">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Utembeleaji injili</p>
            <h4 className="text-xl font-black text-white">{totalVisits}</h4>
          </div>
        </div>

        {/* Literature Card */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-950 text-blue-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Vitabu vilitolewa</p>
            <h4 className="text-xl font-black text-white">{totalLiterature}</h4>
          </div>
        </div>

        {/* Helped Card */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-950 text-emerald-500">
            <Heart className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Watu kusaidiwa</p>
            <h4 className="text-xl font-black text-white">{totalHelped}</h4>
          </div>
        </div>

        {/* Souls Card */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-zinc-950 text-red-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Roho zime batizwa</p>
            <h4 className="text-xl font-black text-white">{totalSouls}</h4>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dynamic Area Chart for Gospel & Community service */}
        <div id="chart-visits-card" className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="text-left">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Mwenendo wa Huduma ya Kujitolea na Uinjilisti
            </h3>
            <p className="text-[10px] text-zinc-400">Takwimu ya utembeleaji, uenezaji na kusaidia watu ya kila juma la kimasomo</p>
          </div>
          <div className="h-64">
            {weeklyProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Hakuna data ya kutosha kubeba chati. Mara ripoti zitakapowasilishwa, graff hii itajijenga kiotomatiki.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyProgress}>
                  <defs>
                    <linearGradient id="colorUpendo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWagonjwa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Legend />
                  <Area type="monotone" dataKey="Upendo" name="Utembeleaji" stroke="#f59e0b" fillOpacity={1} fill="url(#colorUpendo)" />
                  <Area type="monotone" dataKey="Wagonjwa" name="Wasaidiwa" stroke="#10b981" fillOpacity={1} fill="url(#colorWagonjwa)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance progress graph */}
        <div id="chart-attendance-card" className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="text-left">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Takwimu za Mahudhurio Sabatoni (Washiriki & Wageni)
            </h3>
            <p className="text-[10px] text-zinc-400">Jografia ya mahudhurio ya darasa ya kila juma ya sabato</p>
          </div>
          <div className="h-64">
            {attendanceProgress.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                Hakuna data ya mahudhurio ya Sabato bado. Mara tu mwalimu au admin anavyorekodi, chati itajieleza hapa.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                  <Legend />
                  <Bar dataKey="Washiriki" name="Washiriki" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Wageni" name="Wageni waliorekodiwa" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lessoni Study Performance Cards */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-5 lg:col-span-2">
          <div className="text-left">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Tabia za Kujifunza Neno & Roho ya Unabii
            </h3>
            <p className="text-[10px] text-zinc-400">Mwitikio wa usomaji wa lesoni kwa mpango na kukariri kila juma</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 text-left space-y-1.5">
              <span className="text-xs text-zinc-400 font-semibold">Soma Lesoni kila siku</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400">{pctLessonMpango}%</span>
                <span className="text-[10px] text-emerald-400">&checkmark;</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${pctLessonMpango}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 text-left space-y-1.5">
              <span className="text-xs text-zinc-400 font-semibold">Soma Biblia</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-400">{pctBibliaMpango}%</span>
                <span className="text-[10px] text-emerald-400">&checkmark;</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full" style={{ width: `${pctBibliaMpango}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 text-left space-y-1.5">
              <span className="text-xs text-zinc-400 font-semibold">Kariri Fungu Kuu</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{pctFunguKuu}%</span>
                <span className="text-[10px] text-emerald-400">&checkmark;</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${pctFunguKuu}%` }} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 text-left space-y-1.5">
              <span className="text-xs text-zinc-400 font-semibold">Kesha / Roho ya Unabii</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-400">{pctKesha}%</span>
                <span className="text-[10px] text-emerald-400">&checkmark;</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full" style={{ width: `${pctKesha}%` }} />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
