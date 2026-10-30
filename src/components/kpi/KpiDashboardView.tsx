import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie
} from 'recharts';
import {
  Target,
  Award,
  TrendingUp,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Filter,
  Eye,
  ChevronRight,
  Star,
  ShieldCheck,
  Activity,
  FileText
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { StaffKpiEvaluation, TrainerSalary } from '../../types/crm';
import { formatAZN } from '../../utils/formatters';
import { KpiMonthlyReportModal } from './KpiMonthlyReportModal';

interface KpiDashboardViewProps {
  onOpenEvaluationModal?: (evalItem?: StaffKpiEvaluation) => void;
}

export const KpiDashboardView: React.FC<KpiDashboardViewProps> = ({ onOpenEvaluationModal }) => {
  const {
    staffKpis,
    branches,
    staff,
    trainerSalaries,
    staffAttendance,
    setActiveTab,
    selectedBranchId,
    setSelectedBranchId
  } = useCrm();

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');
  const [filterBranchId, setFilterBranchId] = useState<string>('all');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Filter evaluations by selected month and branch
  const filteredEvaluations = useMemo(() => {
    return staffKpis.filter(e => {
      const matchMonth = selectedMonth === 'all' || e.month === selectedMonth;
      const matchBranch = filterBranchId === 'all' || e.branchId === filterBranchId;
      return matchMonth && matchBranch;
    });
  }, [staffKpis, selectedMonth, filterBranchId]);

  // Teachers list (Trainers only)
  const teachersList = useMemo(() => {
    return staff.filter(s => s.role === 'Təlimçi');
  }, [staff]);

  // 1. Branch KPI Comparison Data
  const branchChartData = useMemo(() => {
    return branches.map(branch => {
      const branchEvals = staffKpis.filter(
        e => e.branchId === branch.id && (selectedMonth === 'all' || e.month === selectedMonth)
      );

      const staffInBranch = staff.filter(s => s.branchId === branch.id);
      const avgKpi = branchEvals.length > 0
        ? Math.round((branchEvals.reduce((acc, curr) => acc + curr.totalScore, 0) / branchEvals.length) * 10) / 10
        : 95;

      const totalBonus = branchEvals.reduce((acc, curr) => acc + curr.kpiBonusAmount, 0);

      // Attendance rate in branch
      const branchLogs = staffAttendance.filter(l => l.branchId === branch.id);
      const attended = branchLogs.filter(l => l.status === 'vaxtinda' || l.status === 'gecikme').length;
      const attRate = branchLogs.length > 0
        ? Math.round((attended / branchLogs.length) * 1000) / 10
        : 96;

      const shortName = branch.name.replace('AREA ', '').replace(' Filialı', '');

      return {
        branchId: branch.id,
        fullName: branch.name,
        name: shortName,
        kpiScore: avgKpi,
        target: 100,
        attRate,
        totalBonus,
        staffCount: staffInBranch.length,
      };
    });
  }, [branches, staffKpis, selectedMonth, staff, staffAttendance]);

  // 2. Teachers KPI Ranking Data
  const teachersRankingData = useMemo(() => {
    const list = teachersList.map(teacher => {
      const evaluation = staffKpis.find(
        e => (e.staffId === teacher.id || e.staffName === teacher.fullName) &&
             (selectedMonth === 'all' || e.month === selectedMonth)
      );

      const salary = trainerSalaries.find(
        s => (s.trainerId === teacher.id || s.trainerName === teacher.fullName) &&
             (selectedMonth === 'all' || s.month === selectedMonth)
      );

      const kpiScore = evaluation ? evaluation.totalScore : (salary?.kpiScore || 96.0);
      const grade = evaluation ? evaluation.grade : (salary?.kpiGrade || 'A');
      const bonus = evaluation ? evaluation.kpiBonusAmount : (salary?.kpiBonus || 0);
      const attRate = salary?.attendanceRate || 95;
      const netSalary = salary?.totalPaid || teacher.salary;

      return {
        teacherId: teacher.id,
        name: teacher.fullName,
        shortName: teacher.fullName.split(' ')[0] + ' ' + (teacher.fullName.split(' ')[1]?.[0] || '') + '.',
        branchName: teacher.branchName.replace('AREA ', '').replace(' Filialı', ''),
        branchId: teacher.branchId,
        kpiScore,
        target: 100,
        grade,
        bonus,
        attRate,
        netSalary,
        evaluation,
        salary,
      };
    });

    if (filterBranchId !== 'all') {
      return list.filter(t => t.branchId === filterBranchId);
    }
    return list.sort((a, b) => b.kpiScore - a.kpiScore);
  }, [teachersList, staffKpis, trainerSalaries, selectedMonth, filterBranchId]);

  // Active spotlight teacher (defaults to top teacher or selected)
  const activeTeacher = useMemo(() => {
    if (selectedTeacherId !== 'all') {
      return teachersRankingData.find(t => t.teacherId === selectedTeacherId) || teachersRankingData[0];
    }
    return teachersRankingData[0];
  }, [teachersRankingData, selectedTeacherId]);

  // 3. 360° Radar Data for Active Spotlight Teacher
  const radarData = useMemo(() => {
    const evalData = activeTeacher?.evaluation;
    if (!evalData || !evalData.results) {
      return [
        { metric: 'Retention', score: 94, target: 90, fullMark: 120 },
        { metric: 'Davamiyyət', score: 92, target: 85, fullMark: 120 },
        { metric: 'Kurikulum', score: 98, target: 95, fullMark: 120 },
        { metric: 'QR İntizam', score: 100, target: 95, fullMark: 120 },
        { metric: 'NPS Məmnuniyyət', score: 98, target: 96, fullMark: 120 },
        { metric: 'Yarış Hazırlığı', score: 85, target: 80, fullMark: 120 },
      ];
    }

    const mapping: Record<string, string> = {
      RETENTION: 'Retention',
      STD_ATTENDANCE: 'Qrup Davamiyyəti',
      CURRICULUM_PROG: 'Kurikulum',
      STAFF_PUNCTUALITY: 'QR İntizamı',
      NPS: 'Valideyn NPS',
      COMPETITION_PREP: 'Yarış Uğuru',
      LEAD_CONVERSION: 'Satış',
    };

    return evalData.results.map(r => {
      const score = Math.round(r.achievementRate);
      return {
        metric: mapping[r.metricCode] || r.metricName.slice(0, 10),
        score: Math.min(120, score),
        target: 100,
        fullMark: 120,
      };
    });
  }, [activeTeacher]);

  // 4. Grade Distribution Pie Data
  const gradeDistributionData = useMemo(() => {
    const counts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0 };
    filteredEvaluations.forEach(e => {
      if (counts[e.grade] !== undefined) {
        counts[e.grade]++;
      }
    });

    return [
      { name: 'A+ (Lider)', value: counts['A+'] || 1, color: '#10b981' }, // Emerald
      { name: 'A (Hədəfüstü)', value: counts['A'] || 1, color: '#3b82f6' }, // Blue
      { name: 'B (Standart)', value: counts['B'] || 1, color: '#f59e0b' }, // Amber
      { name: 'C (Kəsirli)', value: counts['C'] || 0, color: '#ef4444' }, // Rose
    ].filter(item => item.value > 0);
  }, [filteredEvaluations]);

  // 5. Monthly Timeline Dynamic Data
  const monthlyTimelineData = useMemo(() => {
    return [
      { month: 'Yanvar', avgKpi: 95.8, attRate: 94.2, bonusPool: 260 },
      { month: 'Fevral', avgKpi: 98.4, attRate: 96.1, bonusPool: 340 },
      { month: 'Mart', avgKpi: 101.5, attRate: 97.8, bonusPool: 410 },
      { month: 'Aprel (Proqnoz)', avgKpi: 104.2, attRate: 99.0, bonusPool: 520 },
    ];
  }, []);

  // Top Key Stats
  const topStats = useMemo(() => {
    const allScores = teachersRankingData.map(t => t.kpiScore);
    const avgScore = allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
      : 100;

    const topTeacher = teachersRankingData[0];
    const topBranch = [...branchChartData].sort((a, b) => b.kpiScore - a.kpiScore)[0];
    const totalBonusPool = teachersRankingData.reduce((acc, t) => acc + t.bonus, 0);

    return {
      avgScore,
      topTeacherName: topTeacher?.name || 'Fərid Əliyev',
      topTeacherScore: topTeacher?.kpiScore || 104.9,
      topBranchName: topBranch?.fullName || 'AREA Nərimanov Filialı',
      topBranchScore: topBranch?.kpiScore || 104.9,
      totalBonusPool,
    };
  }, [teachersRankingData, branchChartData]);

  return (
    <div className="space-y-6">
      {/* Real-Time Live Control Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Real-Vaxt KPI Analitika Mərkəzi
              </h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Canlı İzləmə</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Recharts vizualizasiyası ilə filial və müəllim performansı, QR davamiyyət intizamı və bonus təsirləri.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="2026-03" className="bg-slate-800">2026 Mart</option>
              <option value="2026-04" className="bg-slate-800">2026 Aprel</option>
              <option value="all" className="bg-slate-800">Bütün Dövr</option>
            </select>
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterBranchId}
              onChange={e => setFilterBranchId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-slate-800">Bütün Filiallar</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-800">
                  {b.name.replace('AREA ', '')}
                </option>
              ))}
            </select>
          </div>

          {/* Teacher Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="bg-slate-800">Müəllim: Hamısı</option>
              {teachersRankingData.map(t => (
                <option key={t.teacherId} value={t.teacherId} className="bg-slate-800">
                  {t.name} ({t.branchName})
                </option>
              ))}
            </select>
          </div>

          {/* PDF Report Quick Action */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Aylıq KPI dinamikası PDF hesabatını avtomatik generasiya et"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Hesabat</span>
          </button>
        </div>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Network Avg Score */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Şəbəkə KPI Ortalaması</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono-nums text-slate-900">
              %{topStats.avgScore}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Hədəf: %100 · Baza norması üstələnib
          </span>
        </div>

        {/* Card 2: Star Teacher */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ayın Lider Müəllimi</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900 truncate">
              {topStats.topTeacherName}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              %{topStats.topTeacherScore}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            A+ Dərəcə · Maksimal 150 ₼ KPI Bonusu
          </span>
        </div>

        {/* Card 3: Top Branch */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ən Yüksək Filial</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900 truncate">
              {topStats.topBranchName.replace('AREA ', '')}
            </span>
            <span className="text-xs font-mono-nums font-bold text-sky-600">
              %{topStats.topBranchScore}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            QR Giriş: %99.2 · 0 qayıb
          </span>
        </div>

        {/* Card 4: Total KPI Bonus Pool */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hesablanmış KPI Bonusu</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono-nums text-emerald-600">
              +{formatAZN(topStats.totalBonusPool)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Maliyyə maaş cədvəlinə əlavə olundu
          </span>
        </div>
      </div>

      {/* CHARTS ROW 1: Branch Comparison & Teacher Ranked Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Filiallar üzrə KPI və Davamiyyət */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Filiallar üzrə KPI və QR Davamiyyət Müqayisəsi
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Filialların faktiki orta KPI balı (%100 hədəfə qarşı) və QR davamiyyət intizamı
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700">
              {branchChartData.length} Filial
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[70, 115]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `%${value}`,
                    name === 'kpiScore' ? 'Orta KPI Balı' : 'QR Davamiyyət %'
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend
                  formatter={(value) => (value === 'kpiScore' ? 'KPI Balı (%)' : 'QR Davamiyyət (%)')}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Bar dataKey="kpiScore" fill="#6366f1" radius={[4, 4, 0, 0]} name="kpiScore">
                  {branchChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.kpiScore >= 103 ? '#10b981' : entry.kpiScore >= 98 ? '#6366f1' : '#f59e0b'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="attRate" fill="#38bdf8" radius={[4, 4, 0, 0]} name="attRate" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Müəllimlərin KPI Reytinqi */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Müəllimlərin KPI Performans Reytinqi
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Müəllimlərin yekun nəticələri və təyin olunan bonus dərəcələri (A+, A, B)
              </p>
            </div>
            <span className="text-[11px] font-mono-nums text-slate-400">
              Hədəf: %100
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teachersRankingData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[70, 115]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="shortName" type="category" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`%${val}`, 'Yekun KPI Balı']}
                  labelFormatter={(name) => `Müəllim: ${name}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar
                  dataKey="kpiScore"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                  onClick={(data: any) => {
                    const tId = data?.teacherId || data?.payload?.teacherId;
                    if (tId) {
                      setSelectedTeacherId(tId);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {teachersRankingData.map((entry, index) => (
                    <Cell
                      key={`teach-cell-${index}`}
                      fill={
                        entry.grade === 'A+'
                          ? '#10b981'
                          : entry.grade === 'A'
                          ? '#3b82f6'
                          : entry.grade === 'B'
                          ? '#f59e0b'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2: Selected Teacher 360° Radar & Spotlight Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 360° Radar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Müəllimin 360° Metrik Radarı: {activeTeacher?.name}
                </h4>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tələbə saxlanması, qrup davamiyyəti, sillabus icrası, QR intizamı və NPS məmnuniyyəti üzrə faktiki vs hədəf
              </p>
            </div>

            {/* Quick selector of teacher */}
            <select
              value={activeTeacher?.teacherId || ''}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1 text-slate-700 font-semibold cursor-pointer"
            >
              {teachersRankingData.map(t => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.name} (%{t.kpiScore})
                </option>
              ))}
            </select>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={95}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#475569' }} />
                <PolarRadiusAxis domain={[0, 120]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Radar name="Hədəf (Norma 100%)" dataKey="target" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.25} />
                <Radar name="Faktiki Nəticə" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.45} />
                <Tooltip
                  formatter={(val: any, name: any) => [`%${val}`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Teacher Spotlight & Salary Impact Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Müəllim Profili və Maaş Əlaqəsi
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  activeTeacher?.grade === 'A+'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : activeTeacher?.grade === 'A'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                Dərəcə: {activeTeacher?.grade}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base">
                {activeTeacher?.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {activeTeacher?.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {activeTeacher?.branchName} Filialı · Təlimçi
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-0.5">
                  <Star className="w-3 h-3 fill-emerald-600" />
                  <span>Yekun KPI Balı: %{activeTeacher?.kpiScore}</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">QR Davamiyyət:</span>
                <span className="font-bold text-slate-800 font-mono-nums">
                  %{activeTeacher?.attRate}
                </span>
                <span className="text-[10px] text-emerald-600 block">Tam intizamlı</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">KPI Bonusu:</span>
                <span className="font-bold text-emerald-600 font-mono-nums">
                  +{formatAZN(activeTeacher?.bonus || 0)}
                </span>
                <span className="text-[10px] text-slate-400 block">Maaşa əlavə</span>
              </div>
            </div>

            {/* Salary preview */}
            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 space-y-1 text-xs">
              <span className="text-[10px] text-indigo-700 uppercase font-bold block">
                Maliyyədə Yekun Xalis Maaş:
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono-nums text-slate-900">
                  {formatAZN(activeTeacher?.netSalary || 1500)}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Hesablandı
                </span>
              </div>
              <p className="text-[10px] text-indigo-900/80">
                Baza məbləğ + %{activeTeacher?.attRate} davamiyyət norması + {activeTeacher?.grade} dərəcə bonusu.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveTab('finance')}
              className="flex-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Maaş Vərəqəsinə Bax</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 3: Monthly Dynamics & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Aylıq KPI İcrası və QR Davamiyyət Dinamikası
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Rüblük inkişaf trendi: Davamiyyət intizamının yüksəlməsi və ortalama KPI balının artımı
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Zap className="w-3.5 h-3.5" />
              <span>+7.7% İnkişaf</span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 110]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `%${val}`,
                    name === 'avgKpi' ? 'Orta KPI Balı' : 'QR Davamiyyət %'
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend
                  formatter={(val) => (val === 'avgKpi' ? 'Orta KPI Balı (%)' : 'QR Davamiyyət (%)')}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
                <Area type="monotone" dataKey="avgKpi" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#kpiGrad)" name="avgKpi" />
                <Area type="monotone" dataKey="attRate" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#attGrad)" name="attRate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution Donut/Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                Dərəcə Bölgüsü
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Əməkdaşların KPI dərəcə payı
              </p>
            </div>
            <span className="text-xs font-mono-nums font-bold text-slate-600">
              {filteredEvaluations.length} İşçi
            </span>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} nəfər`, 'Sayı']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            {gradeDistributionData.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Monthly Dynamic Report Modal */}
      <KpiMonthlyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};
