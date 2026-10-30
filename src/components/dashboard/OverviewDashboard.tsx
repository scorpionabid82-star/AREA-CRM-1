import React from 'react';
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  QrCode,
  Award,
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  CreditCard,
  CalendarCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatAZN, formatDateAz } from '../../utils/formatters';

export const OverviewDashboard: React.FC = () => {
  const {
    students,
    groups,
    leads,
    payments,
    expenses,
    extraIncomes,
    staffAttendance,
    certificates,
    curriculums,
    setActiveTab,
    currentRole,
    currentUser,
    branches,
    staff,
    selectedBranchId,
    trainerSalaries,
  } = useCrm();

  const isStudent = currentRole === 'sagird';
  const isManager = currentRole === 'menecer' || currentUser?.role === 'menecer';
  const isTrainer = currentRole === 'telimci' || currentUser?.role === 'telimci';
  const myStudent = students[0]; // Rəşad Quliyev
  const myGroup = groups.find(g => g.id === myStudent?.groupId) || groups[0];

  const myTrainerStaff = isTrainer
    ? staff.find(
        s =>
          (currentUser?.linkedEntityId && s.id === currentUser.linkedEntityId) ||
          (currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
      )
    : null;

  const currentBranchObj = branches.find(b => b.id === selectedBranchId) || branches[0];
  const trainerBranchAssignment = myTrainerStaff?.assignedBranches?.find(
    ab => ab.branchId === currentBranchObj?.id
  );
  const trainerBranchSchedule =
    trainerBranchAssignment?.workSchedule || myTrainerStaff?.workSchedule || '10:00 - 18:00';

  const myTrainerGroups = isTrainer
    ? groups.filter(
        g =>
          g.trainerId === myTrainerStaff?.id ||
          g.trainerName === myTrainerStaff?.fullName ||
          (currentUser?.fullName && g.trainerName === currentUser.fullName)
      )
    : [];

  const activeStudents = students.filter(s => s.status === 'aktiv');
  const myTrainerStudentsCount = activeStudents.filter(s =>
    myTrainerGroups.some(g => g.id === s.groupId)
  ).length;

  const myTrainerSalary = isTrainer
    ? trainerSalaries.find(
        ts =>
          (ts.trainerId === myTrainerStaff?.id || ts.trainerName === myTrainerStaff?.fullName) &&
          (ts.branchId ? ts.branchId === currentBranchObj?.id : true)
      )
    : null;

  const totalDebt = students.reduce((acc, s) => (s.balance < 0 ? acc + Math.abs(s.balance) : acc), 0);
  const totalTuitionIncome = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExtraIncome = extraIncomes.reduce((acc, e) => acc + e.amount, 0);
  const totalRevenue = totalTuitionIncome + totalExtraIncome;
  const approvedExpenses = expenses.filter(e => e.approvalStatus === 'tesdiqlendi');
  const pendingExpenses = expenses.filter(e => e.approvalStatus === 'gozleyir');
  const totalExpenses = approvedExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayStaffAttendance = staffAttendance.filter(a => a.date === todayStr || a.date === '2026-04-03');

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
            {isStudent ? '🎓' : isTrainer ? '👨‍🏫' : isManager ? '🏢' : '⚡'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight">
                {isStudent
                  ? myStudent?.fullName || 'Şagird Kabineti'
                  : isTrainer
                  ? `${currentUser?.fullName || myTrainerStaff?.fullName || 'Təlimçi Kabineti'}`
                  : isManager
                  ? `${currentUser?.fullName || 'Filial Meneceri'}`
                  : 'AREA-CRM İdarəetmə'}
              </h2>
              <span className="text-[11px] font-semibold text-slate-400 font-mono-nums">
                {isStudent
                  ? myGroup?.name || 'Qrup'
                  : isTrainer
                  ? `📍 ${currentBranchObj?.name ? currentBranchObj.name.replace('AREA ', '') : 'Filial'}`
                  : isManager
                  ? `${branches[0]?.name || currentUser?.branchName || 'Təyin Edilmiş Filial'}`
                  : 'Filiallar və Tədris'}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              {isStudent
                ? myGroup?.courseName || 'Tədris Kursu'
                : isTrainer
                ? `Cari Mərkəz: ${currentBranchObj?.name || 'Filial'} · Yuxarıdakı menyudan təyin olunduğunuz digər filiallara keçid edə bilərsiniz`
                : isManager
                ? `Yalnız ${branches[0]?.name || currentUser?.branchName || 'Öz Filialınız'} üzrə Maliyyə, Qrup və Tələbə Statistikası`
                : 'Mərkəzi İdarəetmə və Nəzarət Paneli'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isStudent ? (
            <>
              <button
                onClick={() => setActiveTab('curriculum')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sillabus</span>
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Sertifikat</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('staff-attendance')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Terminal</span>
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Sertifikat</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isStudent ? (
          <>
            {/* Student Metric 1 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">🎓 Tədris Qrupu</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-base font-bold text-slate-900 truncate">
                {myGroup?.name || 'Qrup Təyin Edilməyib'}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>👨‍🏫 {myGroup?.trainerName || 'Təlimçi təyin edilməyib'}</span>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
                >
                  Cədvəl <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Student Metric 2 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">📊 Davamiyyət</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono-nums text-emerald-600">
                {myStudent?.attendanceRate ?? 100}%
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>🟢 Yüksək İştirak</span>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
                >
                  Jurnal <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Student Metric 3 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">📖 Tərəqqi</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold font-mono-nums text-indigo-600">
                {myGroup?.progressPercent ?? 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>Modul 3</span>
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
                >
                  Mövzular <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Student Metric 4 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">💳 Balans</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono-nums text-slate-900">
                {formatAZN(myStudent?.balance ?? 0)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span className="text-emerald-700 font-semibold">🟢 Ödənilib</span>
                <span className="text-slate-400 font-mono-nums">Aylıq: {myStudent?.monthlyFee ?? 0} ₼</span>
              </div>
            </div>
          </>
        ) : isTrainer ? (
          <>
            {/* Trainer Metric 1: Active Groups in this Branch */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">🎓 Tədris Qrupları</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-slate-900">
                {myTrainerGroups.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>📍 {currentBranchObj?.name ? currentBranchObj.name.replace('AREA ', '').replace(' Filialı', '') : 'Filial'}</span>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center cursor-pointer"
                >
                  Qruplar <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Trainer Metric 2: Students */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">👥 Tələbələriniz</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-slate-900">
                {myTrainerStudentsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span className="text-emerald-700 font-semibold">🟢 Aktiv İştirak</span>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center cursor-pointer"
                >
                  Jurnal <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Trainer Metric 3: Branch Work Schedule */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">⏰ Filial İş Qrafiki</span>
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="space-y-1 min-h-[36px]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    (trainerBranchAssignment?.employmentType || myTrainerStaff?.employmentType) === 'full_stat'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : (trainerBranchAssignment?.employmentType || myTrainerStaff?.employmentType) === 'yarim_stat'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : (trainerBranchAssignment?.employmentType || myTrainerStaff?.employmentType) === 'saatliq'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {(trainerBranchAssignment?.employmentType || myTrainerStaff?.employmentType) === 'full_stat'
                      ? `Full ştat · ${trainerBranchAssignment?.weeklyHours || 40}s`
                      : (trainerBranchAssignment?.employmentType || myTrainerStaff?.employmentType) === 'yarim_stat'
                      ? `Yarım ştat · ${trainerBranchAssignment?.weeklyHours || 20}s`
                      : (trainerBranchAssignment?.employmentType || myTrainerStaff?.employmentType) === 'saatliq'
                      ? `Saatlıq · ${trainerBranchAssignment?.weeklyHours || 12}s`
                      : 'Fərdi qrafik'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {trainerBranchSchedule}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>GPS Qeydiyyat</span>
                <button
                  onClick={() => setActiveTab('staff-attendance')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center cursor-pointer"
                >
                  QR Giriş <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Trainer Metric 4: Branch Salary & Bonus */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">💰 Filial Maaş / Bonus</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-emerald-600">
                {myTrainerSalary ? formatAZN(myTrainerSalary.totalPaid) : formatAZN(trainerBranchAssignment?.baseSalary || 800)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span className="text-slate-600 font-medium truncate max-w-[140px]">
                  {myTrainerSalary?.calcType === 'saatliq'
                    ? `Saatlıq (${myTrainerSalary.baseRate} ₼/s)`
                    : myTrainerSalary?.calcType === 'faiz'
                    ? `%${myTrainerSalary.baseRate} Gəlir Payı`
                    : 'Sabit Baza Maaş'}
                </span>
                <span className="text-slate-400 font-mono-nums text-[10px]">
                  {myTrainerSalary?.employmentType === 'saatliq'
                    ? `${myTrainerSalary.workedHoursTotal || 30}/${myTrainerSalary.normHoursTotal || 30}s (%${myTrainerSalary.attendanceRate})`
                    : myTrainerSalary ? `Davamiyyət: %${myTrainerSalary.attendanceRate}` : 'Fərdi Hesabat'}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Metric 1 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">👥 Tələbələr</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-slate-900">
                {activeStudents.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>🎓 {groups.length} Qrup</span>
                <button
                  onClick={() => setActiveTab('students')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
                >
                  Hamısı <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">📈 Gəlir</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-slate-900">
                {formatAZN(totalRevenue)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span className="text-emerald-700 font-semibold font-mono-nums">
                  ✨ Xalis: {formatAZN(netProfit)}
                </span>
                <button
                  onClick={() => setActiveTab('finance')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
                >
                  Maliyyə <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">⚠️ Borclar</span>
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-amber-600">
                {formatAZN(totalDebt)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>🔴 {students.filter(s => s.balance < 0).length} Tələbə</span>
                <button
                  onClick={() => setActiveTab('whatsapp')}
                  className="text-amber-700 hover:text-amber-800 font-semibold inline-flex items-center"
                >
                  WhatsApp <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between text-slate-500 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider">🎯 Lidlər</span>
                <GraduationCap className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold font-mono-nums text-slate-900">
                {leads.filter(l => l.stage !== 'qeydiyyat' && l.stage !== 'imtina').length}
              </div>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
                <span>⚡ Satış Qıfı</span>
                <button
                  onClick={() => setActiveTab('leads')}
                  className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center"
                >
                  Qıf <ArrowRight className="w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Staff QR Geolocation Highlights & Curriculum Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Staff QR Attendance & Active Groups */}
        <div className="lg:col-span-2 space-y-6">
          {/* Staff QR Attendance Status Box */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  Heyət QR Davamiyyəti
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('staff-attendance')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                Loglar <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">👥 Girişlər</span>
                  <span className="text-base font-bold font-mono-nums text-slate-800">
                    {todayStaffAttendance.length}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 block">🟢 Vaxtında</span>
                  <span className="text-base font-bold font-mono-nums text-emerald-800">
                    {todayStaffAttendance.filter(a => a.status === 'vaxtinda').length}
                  </span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-[11px] text-amber-700 block">⏰ Gecikən</span>
                  <span className="text-base font-bold font-mono-nums text-amber-800">
                    {todayStaffAttendance.filter(a => a.status === 'gecikme').length}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold pb-2">
                      <th className="pb-2">👤 Əməkdaş</th>
                      <th className="pb-2">🏢 Filial</th>
                      <th className="pb-2">🕒 Giriş</th>
                      <th className="pb-2">📍 Məsafə</th>
                      <th className="pb-2 text-right">⚡ Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayStaffAttendance.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 font-medium text-slate-800">{log.staffName}</td>
                        <td className="py-2.5 text-slate-500">{log.branchName.replace('AREA ', '').replace(' Filialı', '')}</td>
                        <td className="py-2.5 font-mono-nums text-slate-600">{log.checkInTime}</td>
                        <td className="py-2.5 font-mono-nums text-slate-600">
                          {log.distanceMeters}m
                        </td>
                        <td className="py-2.5 text-right font-medium">
                          {log.status === 'vaxtinda' ? (
                            <span className="text-emerald-700 font-medium">Vaxtında</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Gecikmə</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Active Groups & Curriculum Progress */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Qruplar və Kurikulum İrəliləyişi</h3>
              </div>
              <button
                onClick={() => setActiveTab('curriculum')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
              >
                Kurikulum detalları <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {groups.map(grp => (
                <div key={grp.id} className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-900">{grp.name}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="text-slate-500">{grp.trainerName}</span>
                    </div>
                    <span className="font-mono-nums font-semibold text-indigo-600">
                      {grp.progressPercent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${grp.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{grp.schedule}</span>
                    <span>{grp.currentStudents} / {grp.capacity} tələbə</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions, Recent Certificates, Financial Summary */}
        <div className="space-y-6">
          {/* Certificates Generated Widget */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Verilmiş Sertifikatlar</h3>
              </div>
              <button
                onClick={() => setActiveTab('certificates')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Yeni hazırla
              </button>
            </div>

            <div className="space-y-3">
              {certificates.map(cert => (
                <div
                  key={cert.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{cert.studentName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[170px]">{cert.courseName}</p>
                    </div>
                    <span className="text-[10px] font-mono-nums px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                      {cert.grade}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono-nums">{cert.id}</span>
                    <span>{formatDateAz(cert.issueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Payments Feed */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Son Ödənişlər</h3>
              </div>
              <button
                onClick={() => setActiveTab('finance')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Maliyyəyə get
              </button>
            </div>

            <div className="space-y-2.5">
              {payments.slice(0, 4).map(pay => (
                <div key={pay.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs">
                  <div>
                    <p className="font-medium text-slate-900">{pay.studentName}</p>
                    <p className="text-[11px] text-slate-400">{pay.method} · {formatDateAz(pay.date)}</p>
                  </div>
                  <span className="font-mono-nums font-semibold text-emerald-600">
                    +{formatAZN(pay.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
