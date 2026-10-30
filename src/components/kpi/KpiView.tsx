import React, { useState, useMemo } from 'react';
import {
  Target,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  DollarSign,
  Plus,
  Sliders,
  Calculator,
  RefreshCw,
  Edit2,
  Check,
  ChevronRight,
  Filter,
  Search,
  Users,
  Briefcase,
  HelpCircle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Scale
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  KpiMetricDefinition,
  StaffKpiEvaluation,
  KpiMetricResult,
  Role
} from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';
import { KpiDashboardView } from './KpiDashboardView';
import { KpiMonthlyReportModal } from './KpiMonthlyReportModal';
import { KpiRulesView } from './KpiRulesView';

export const KpiView: React.FC = () => {
  const {
    kpiDefinitions,
    addKpiDefinition,
    updateKpiDefinition,
    staffKpis,
    saveStaffKpiEvaluation,
    staff,
    staffAttendance,
    trainerSalaries,
    syncSalariesWithKpiAndAttendance,
    setActiveTab,
    currentRole,
    currentUser,
    branches,
    can,
  } = useCrm();

  const [activeTab, setActiveTabState] = useState<'dashboard' | 'evaluations' | 'metrics' | 'rules' | 'formula'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-03');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report Modal state
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Modal states
  const [showEvalModal, setShowEvalModal] = useState<boolean>(false);
  const [editingEval, setEditingEval] = useState<StaffKpiEvaluation | null>(null);

  const [showMetricModal, setShowMetricModal] = useState<boolean>(false);
  const [editingMetric, setEditingMetric] = useState<KpiMetricDefinition | null>(null);

  // New / Edit Metric Form
  const [metricName, setMetricName] = useState('');
  const [metricCode, setMetricCode] = useState('');
  const [metricCategory, setMetricCategory] = useState<'tedris' | 'davamiyyet' | 'xidmet' | 'satis'>('tedris');
  const [metricTarget, setMetricTarget] = useState<number>(90);
  const [metricUnit, setMetricUnit] = useState<'%' | 'bal' | 'say' | 'saat'>('%');
  const [metricWeight, setMetricWeight] = useState<number>(20);
  const [metricBonusThresh, setMetricBonusThresh] = useState<number>(95);
  const [metricPenaltyThresh, setMetricPenaltyThresh] = useState<number>(80);
  const [metricDesc, setMetricDesc] = useState('');
  const [metricRoles, setMetricRoles] = useState<('Direktor' | 'Menecer' | 'Təlimçi')[]>(['Təlimçi']);

  // New / Edit Evaluation Form
  const [evalStaffId, setEvalStaffId] = useState<string>('');
  const [evalMonth, setEvalMonth] = useState<string>('2026-03');
  const [evalDirectorRemarks, setEvalDirectorRemarks] = useState<string>('');
  const [evalStatus, setEvalStatus] = useState<'tesdiqlenib' | 'qaralama'>('tesdiqlenib');
  const [evalMetricResults, setEvalMetricResults] = useState<{
    metricId: string;
    actual: number;
    note?: string;
  }[]>([]);

  // Interactive Simulator State for Tab 3
  const [simBaseSalary, setSimBaseSalary] = useState<number>(1500);
  const [simWorkDaysAttended, setSimWorkDaysAttended] = useState<number>(22);
  const [simLateCount, setSimLateCount] = useState<number>(0);
  const [simAbsentCount, setSimAbsentCount] = useState<number>(0);
  const [simKpiScore, setSimKpiScore] = useState<number>(104);

  // Filtered evaluations
  const filteredEvaluations = useMemo(() => {
    return staffKpis.filter(e => {
      const matchMonth = selectedMonth === 'all' || e.month === selectedMonth;
      const matchRole = selectedRoleFilter === 'all' || e.role === selectedRoleFilter;
      const matchSearch =
        searchQuery === '' ||
        e.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.branchName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchMonth && matchRole && matchSearch;
    });
  }, [staffKpis, selectedMonth, selectedRoleFilter, searchQuery]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    const list = filteredEvaluations;
    if (list.length === 0) {
      return { avgScore: 100, highGrades: 0, totalBonuses: 0, totalPenalties: 0 };
    }
    const sumScore = list.reduce((acc, curr) => acc + curr.totalScore, 0);
    const avgScore = Math.round((sumScore / list.length) * 10) / 10;
    const highGrades = list.filter(e => e.grade === 'A+' || e.grade === 'A').length;
    const totalBonuses = list.reduce((acc, curr) => acc + curr.kpiBonusAmount, 0);
    const totalPenalties = list.reduce((acc, curr) => acc + curr.kpiPenaltyAmount, 0);

    return { avgScore, highGrades, totalBonuses, totalPenalties };
  }, [filteredEvaluations]);

  // Total weights check
  const totalMetricWeights = useMemo(() => {
    return kpiDefinitions.reduce((acc, k) => acc + k.weight, 0);
  }, [kpiDefinitions]);

  // Handle open evaluation modal for create/edit
  const handleOpenEvalModal = (evaluation?: StaffKpiEvaluation) => {
    if (evaluation) {
      setEditingEval(evaluation);
      setEvalStaffId(evaluation.staffId);
      setEvalMonth(evaluation.month);
      setEvalDirectorRemarks(evaluation.directorRemarks || '');
      setEvalStatus(evaluation.status);
      setEvalMetricResults(
        evaluation.results.map(r => ({
          metricId: r.metricId,
          actual: r.actual,
          note: r.note || '',
        }))
      );
    } else {
      setEditingEval(null);
      const firstStaff = staff[0];
      setEvalStaffId(firstStaff?.id || '');
      setEvalMonth(selectedMonth === 'all' ? '2026-03' : selectedMonth);
      setEvalDirectorRemarks('');
      setEvalStatus('tesdiqlenib');

      // Pre-fill metrics applicable to first staff member
      const applicable = kpiDefinitions.filter(k =>
        k.applicableRoles.includes((firstStaff?.role as any) || 'Təlimçi')
      );
      setEvalMetricResults(
        applicable.map(k => ({
          metricId: k.id,
          actual: k.target,
          note: '',
        }))
      );
    }
    setShowEvalModal(true);
  };

  // Change staff in evaluation modal updates applicable metrics
  const handleStaffChangeInModal = (staffId: string) => {
    setEvalStaffId(staffId);
    const selected = staff.find(s => s.id === staffId);
    if (!selected) return;

    const applicable = kpiDefinitions.filter(k =>
      k.applicableRoles.includes((selected.role as any) || 'Təlimçi')
    );
    setEvalMetricResults(
      applicable.map(k => ({
        metricId: k.id,
        actual: k.target,
        note: '',
      }))
    );
  };

  // Live computation of evaluation totals inside modal
  const modalCalculations = useMemo(() => {
    const selectedStaff = staff.find(s => s.id === evalStaffId);
    const applicableDefs = kpiDefinitions.filter(k =>
      k.applicableRoles.includes((selectedStaff?.role as any) || 'Təlimçi')
    );

    let totalWeightedScore = 0;
    let totalAssignedWeight = 0;

    const computedResults: KpiMetricResult[] = evalMetricResults.map(entry => {
      const def = applicableDefs.find(k => k.id === entry.metricId);
      if (!def) {
        return {
          metricId: entry.metricId,
          metricCode: 'UNKNOWN',
          metricName: 'Metrik',
          target: 100,
          actual: entry.actual,
          unit: '%',
          weight: 0,
          achievementRate: 100,
          weightedScore: 0,
          note: entry.note,
        };
      }

      const achievementRate =
        def.target > 0 ? Math.round((entry.actual / def.target) * 1000) / 10 : 100;
      const weightedScore = Math.round(((achievementRate * def.weight) / 100) * 10) / 10;

      totalWeightedScore += weightedScore;
      totalAssignedWeight += def.weight;

      return {
        metricId: def.id,
        metricCode: def.code,
        metricName: def.name,
        target: def.target,
        actual: entry.actual,
        unit: def.unit,
        weight: def.weight,
        achievementRate,
        weightedScore,
        note: entry.note,
      };
    });

    // Normalize score to 100% basis if total assigned weight differs from 100
    const normalizedScore =
      totalAssignedWeight > 0
        ? Math.round((totalWeightedScore / totalAssignedWeight) * 1000) / 10
        : 100;

    // Grade and bonuses based on normalized score
    let grade: 'A+' | 'A' | 'B' | 'C' = 'B';
    let bonusAmount = 0;
    let penaltyAmount = 0;

    if (normalizedScore >= 103) {
      grade = 'A+';
      bonusAmount = 150;
      penaltyAmount = 0;
    } else if (normalizedScore >= 98) {
      grade = 'A';
      bonusAmount = 120;
      penaltyAmount = 0;
    } else if (normalizedScore >= 88) {
      grade = 'B';
      bonusAmount = 40;
      penaltyAmount = 0;
    } else {
      grade = 'C';
      bonusAmount = 0;
      penaltyAmount = 50;
    }

    return {
      computedResults,
      totalScore: normalizedScore,
      grade,
      bonusAmount,
      penaltyAmount,
    };
  }, [evalStaffId, evalMetricResults, kpiDefinitions, staff]);

  // Save evaluation submit
  const handleSaveEvaluationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStaff = staff.find(s => s.id === evalStaffId);
    if (!targetStaff) return;

    const evaluationToSave: StaffKpiEvaluation = {
      id: editingEval ? editingEval.id : `kpi-eval-${Date.now()}`,
      staffId: targetStaff.id,
      staffName: targetStaff.fullName,
      role: targetStaff.role as any,
      branchId: targetStaff.branchId,
      branchName: targetStaff.branchName,
      month: evalMonth,
      results: modalCalculations.computedResults,
      totalScore: modalCalculations.totalScore,
      grade: modalCalculations.grade,
      kpiBonusAmount: modalCalculations.bonusAmount,
      kpiPenaltyAmount: modalCalculations.penaltyAmount,
      evaluatedBy: currentUser?.fullName ? `${currentUser.fullName} (${currentUser.role})` : 'Direktorluq',
      evaluatedAt: new Date().toISOString().split('T')[0],
      directorRemarks: evalDirectorRemarks,
      status: evalStatus,
    };

    saveStaffKpiEvaluation(evaluationToSave);
    setShowEvalModal(false);
  };

  // Open Metric Modal for Create / Edit
  const handleOpenMetricModal = (metric?: KpiMetricDefinition) => {
    if (metric) {
      setEditingMetric(metric);
      setMetricName(metric.name);
      setMetricCode(metric.code);
      setMetricCategory(metric.category);
      setMetricTarget(metric.target);
      setMetricUnit(metric.unit);
      setMetricWeight(metric.weight);
      setMetricBonusThresh(metric.bonusThreshold);
      setMetricPenaltyThresh(metric.penaltyThreshold);
      setMetricDesc(metric.description);
      setMetricRoles(metric.applicableRoles);
    } else {
      setEditingMetric(null);
      setMetricName('');
      setMetricCode(`KPI_${Date.now().toString().slice(-4)}`);
      setMetricCategory('tedris');
      setMetricTarget(90);
      setMetricUnit('%');
      setMetricWeight(15);
      setMetricBonusThresh(95);
      setMetricPenaltyThresh(80);
      setMetricDesc('');
      setMetricRoles(['Təlimçi']);
    }
    setShowMetricModal(true);
  };

  const handleSaveMetricSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName.trim()) return;

    if (editingMetric) {
      updateKpiDefinition(editingMetric.id, {
        name: metricName,
        code: metricCode,
        category: metricCategory,
        target: metricTarget,
        unit: metricUnit,
        weight: metricWeight,
        bonusThreshold: metricBonusThresh,
        penaltyThreshold: metricPenaltyThresh,
        description: metricDesc,
        applicableRoles: metricRoles,
      });
    } else {
      addKpiDefinition({
        name: metricName,
        code: metricCode || `KPI_${Date.now()}`,
        category: metricCategory,
        target: metricTarget,
        unit: metricUnit,
        weight: metricWeight,
        bonusThreshold: metricBonusThresh,
        penaltyThreshold: metricPenaltyThresh,
        description: metricDesc,
        applicableRoles: metricRoles,
      });
    }
    setShowMetricModal(false);
  };

  // Simulator dynamic values for Tab 3
  const simCalculations = useMemo(() => {
    const totalDays = 22;
    const dailyPay = Math.round(simBaseSalary / totalDays);
    const absentDeduction = simAbsentCount * dailyPay;
    const lateDeduction = simLateCount * 10;
    const totalAttDeduction = absentDeduction + lateDeduction;

    const isPerfectAttendance =
      simWorkDaysAttended >= totalDays && simLateCount === 0 && simAbsentCount === 0;
    const attBonus = isPerfectAttendance ? 50 : 0;

    let kpiGrade: 'A+' | 'A' | 'B' | 'C' = 'B';
    let kpiBonus = 0;
    let kpiPenalty = 0;

    if (simKpiScore >= 103) {
      kpiGrade = 'A+';
      kpiBonus = 150;
    } else if (simKpiScore >= 98) {
      kpiGrade = 'A';
      kpiBonus = 120;
    } else if (simKpiScore >= 88) {
      kpiGrade = 'B';
      kpiBonus = 40;
    } else {
      kpiGrade = 'C';
      kpiPenalty = 50;
    }

    const netPayable = Math.max(
      0,
      simBaseSalary - totalAttDeduction + attBonus + kpiBonus - kpiPenalty
    );

    return {
      dailyPay,
      absentDeduction,
      lateDeduction,
      totalAttDeduction,
      attBonus,
      kpiGrade,
      kpiBonus,
      kpiPenalty,
      netPayable,
    };
  }, [simBaseSalary, simWorkDaysAttended, simLateCount, simAbsentCount, simKpiScore]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              KPI və Performans İdarəetməsi
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Maaşa İnteqrasiya
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Əməkdaşların KPI hədəfləri, icraat dərəcələri, QR davamiyyət intizamı və maaşın formalaşması.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="KPI göstəricilərinin aylıq dinamikasını izləmək üçün avtomatik yaradılan PDF hesabat modulu"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Hesabat Modulu</span>
          </button>

          {can('edit', 'kpi') && (
            <button
              onClick={() => syncSalariesWithKpiAndAttendance(selectedMonth === 'all' ? '2026-03' : selectedMonth)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Davamiyyət və KPI əsasında maliyyə səhifəsindəki maaşları avtomatik yenilə"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Maaşları Yenilə</span>
            </button>
          )}

          {can('create', 'kpi') && (
            <button
              onClick={() => handleOpenEvalModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Qiymətləndirmə</span>
            </button>
          )}

          {can('create', 'kpi') && (
            <button
              onClick={() => handleOpenMetricModal()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>Yeni Metrik</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Orta KPI İcrası</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-slate-900 mt-1">
            %{stats.avgScore}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {stats.highGrades} əməkdaş hədəfi üstələyib (A / A+)
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ümumi KPI Bonusu</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-emerald-600 mt-1">
            +{formatAZN(stats.totalBonuses)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Maaşlara əlavə olunan stimul paketi
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">İntizam & QR Davamiyyət</span>
            <QrCode className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-sky-600 mt-1">
            97.8%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Geolokasiya ilə vaxtında giriş norması
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aktiv Metrikalar</span>
            <Layers className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-slate-900 mt-1">
            {kpiDefinitions.length} metrik
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Çəki cəmi: %{totalMetricWeights} (Tədris, Davamiyyət, Xidmət, Satış)
          </span>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTabState('dashboard')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Vizual Analitika Dashboard</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
            Canlı Qrafik
          </span>
        </button>

        <button
          onClick={() => setActiveTabState('evaluations')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'evaluations'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>İcraat və Qiymətləndirmə</span>
          <span className="px-1.5 py-0.2 bg-indigo-200/60 text-indigo-900 rounded-full text-[10px]">
            {filteredEvaluations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabState('metrics')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'metrics'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>KPI Metrikalarının Təyini</span>
          <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
            {kpiDefinitions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTabState('rules')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'rules'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-indigo-600" />
          <span>KPI Qaydaları (Maliyyəyə Təsir)</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
            Düstur & Əl ilə
          </span>
        </button>

        <button
          onClick={() => setActiveTabState('formula')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'formula'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Maaşın Formalaşma Modeli & Simulyator</span>
        </button>

        <button
          onClick={() => setShowReportModal(true)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 bg-slate-50 text-indigo-700 hover:bg-indigo-50 border border-slate-200"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Aylıq Dinamika PDF Hesabatı</span>
          <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
            Avtomatik PDF
          </span>
        </button>
      </div>

      {/* TAB 0: REAL-TIME RECHARTS VISUAL DASHBOARD */}
      {activeTab === 'dashboard' && (
        <KpiDashboardView onOpenEvaluationModal={handleOpenEvalModal} />
      )}

      {/* TAB 1: EVALUATIONS & PERFORMANCE */}
      {activeTab === 'evaluations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                <span>Dövr:</span>
              </div>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Bütün Aylar</option>
                <option value="2026-03">2026 Mart</option>
                <option value="2026-04">2026 Aprel</option>
              </select>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Vəzifə:</span>
              </div>
              <select
                value={selectedRoleFilter}
                onChange={e => setSelectedRoleFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Bütün Vəzifələr</option>
                <option value="Təlimçi">Təlimçilər</option>
                <option value="Menecer">Menecerlər</option>
                <option value="Direktor">Direktorluq</option>
              </select>
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="İşçi və ya filial axtar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Evaluations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEvaluations.map(evaluation => {
              // Find matching salary from trainerSalaries
              const matchingSalary = trainerSalaries.find(
                s => (s.trainerId === evaluation.staffId || s.trainerName === evaluation.staffName) && s.month === evaluation.month
              );

              return (
                <div
                  key={evaluation.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-200 transition-colors"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {evaluation.staffName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {evaluation.staffName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {evaluation.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{evaluation.branchName}</span>
                          <span>·</span>
                          <span className="font-mono-nums">{evaluation.month}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall Grade badge */}
                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          evaluation.grade === 'A+'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : evaluation.grade === 'A'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : evaluation.grade === 'B'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Dərəcə: {evaluation.grade}</span>
                        <span className="font-mono-nums font-bold">({evaluation.totalScore}%)</span>
                      </div>
                      {evaluation.status === 'tesdiqlenib' ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Təsdiqlənib
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                          <Clock className="w-3 h-3" /> Qaralama
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content: Metrics Breakdown */}
                  <div className="p-4 space-y-3 bg-slate-50/50">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Metrik İcrası və Çəkilər</span>
                      <span>Hədəf / Fakt</span>
                    </div>

                    <div className="space-y-2">
                      {evaluation.results.map(res => (
                        <div
                          key={res.metricId}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/80 text-xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {res.metricName}
                            </span>
                            <div className="flex items-center gap-2 font-mono-nums">
                              <span className="text-slate-400 text-[11px]">
                                {res.target} {res.unit}
                              </span>
                              <span className="text-slate-300">/</span>
                              <span
                                className={`font-bold ${
                                  res.achievementRate >= 100
                                    ? 'text-emerald-600'
                                    : res.achievementRate >= 90
                                    ? 'text-indigo-600'
                                    : 'text-amber-600'
                                }`}
                              >
                                {res.actual} {res.unit}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <div className="flex items-center gap-2">
                              <span>İcra: %{res.achievementRate}</span>
                              <span className="text-slate-300">·</span>
                              <span>Çəki: %{res.weight}</span>
                            </div>
                            <span className="font-semibold text-slate-700">
                              Xal: {res.weightedScore} bal
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                res.achievementRate >= 100
                                  ? 'bg-emerald-500'
                                  : res.achievementRate >= 90
                                  ? 'bg-indigo-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, res.achievementRate)}%` }}
                            />
                          </div>

                          {res.note && (
                            <p className="text-[10px] text-slate-400 italic pt-0.5">
                              "{res.note}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {evaluation.directorRemarks && (
                      <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100 text-xs text-indigo-900">
                        <span className="font-bold text-[11px] block text-indigo-800 mb-0.5">
                          Direktor Rəyi:
                        </span>
                        {evaluation.directorRemarks}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Salary Impact Connection */}
                  <div className="p-3 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">KPI Təsiri:</span>
                        {evaluation.kpiBonusAmount > 0 ? (
                          <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" /> +{formatAZN(evaluation.kpiBonusAmount)} Bonus
                          </span>
                        ) : evaluation.kpiPenaltyAmount > 0 ? (
                          <span className="font-bold text-rose-600 flex items-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3" /> -{formatAZN(evaluation.kpiPenaltyAmount)} Kəsir
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium">Bonus yoxdur</span>
                        )}
                      </div>

                      {matchingSalary && (
                        <div className="border-l border-slate-200 pl-3">
                          <span className="text-[10px] text-slate-400 block uppercase">Maliyyədə Xalis Maaş:</span>
                          <span className="font-bold font-mono-nums text-slate-900">
                            {formatAZN(matchingSalary.totalPaid)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {can('edit', 'kpi') && (
                        <button
                          onClick={() => handleOpenEvalModal(evaluation)}
                          className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Düzəliş</span>
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab('finance')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Maaşa Bax</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: METRIC DEFINITIONS & WEIGHTS */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          {/* Header notice */}
          <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl flex items-start gap-3">
            <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-indigo-950">
                KPI Metrikaları və Çəkilər Sistemi (Cəmi Çəki: %{totalMetricWeights})
              </h4>
              <p className="text-indigo-800 leading-relaxed">
                Hər bir əməkdaşın qiymətləndirilməsi müəyyənləşdirilmiş bu metrikalar üzrə aparılır. Çəkilərin cəmi 100% olduqda balanslaşdırılmış obyektiv əməkhaqqı bonusu formalaşır.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiDefinitions.map(metric => (
              <div
                key={metric.id}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-nums font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {metric.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                          metric.category === 'tedris'
                            ? 'bg-blue-50 text-blue-700'
                            : metric.category === 'davamiyyet'
                            ? 'bg-emerald-50 text-emerald-700'
                            : metric.category === 'satis'
                            ? 'bg-violet-50 text-violet-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {metric.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {metric.name}
                    </h4>
                  </div>

                  {can('edit', 'kpi') && (
                    <button
                      onClick={() => handleOpenMetricModal(metric)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                      title="Metriki redaktə et"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {metric.description}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Hədəf:</span>
                    <span className="font-bold text-slate-900 font-mono-nums">
                      {metric.target} {metric.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Çəki Payı:</span>
                    <span className="font-bold text-indigo-600 font-mono-nums">
                      %{metric.weight}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Bonus Həddi:</span>
                    <span className="font-semibold text-emerald-600 font-mono-nums">
                      ≥ {metric.bonusThreshold} {metric.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Kəsir Həddi:</span>
                    <span className="font-semibold text-rose-600 font-mono-nums">
                      &lt; {metric.penaltyThreshold} {metric.unit}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {metric.applicableRoles.map(role => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SALARY FORMULATION POLICY & INTERACTIVE SIMULATOR */}
      {activeTab === 'formula' && (
        <div className="space-y-6">
          {/* Transparent Formula Step-by-Step Explanation */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Maaşın Formalaşma Qaydası və Riyazi Modeli
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Təlim mərkəzində hər bir əməkdaşın xalis əməkhaqqı Baza tarif, QR davamiyyət intizamı və KPI icraatına əsasən formalaşır.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-xs">Baza Məbləğ</h4>
                <p className="text-[11px] text-slate-500">
                  Sabit aylıq maaş, tələbə sayından / qrup gəlirindən faiz (%) və ya tədris olunmuş dərs saatlarına görə ilkin tarif.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-xs">QR Davamiyyət Təsiri</h4>
                <p className="text-[11px] text-slate-500">
                  Aylıq 22 iş günü norması. Hər qayıb gün üçün 1 günlük baza məbləğ kəsilir. Gecikmə üçün 10 ₼ cərimə. 100% vaxtında gəlişə +50 ₼ intizam bonusu.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-xs">KPI Dərəcə Bonusu</h4>
                <p className="text-[11px] text-slate-500">
                  A+ (≥103%) = +150 ₼<br />
                  A (98-102.9%) = +120 ₼<br />
                  B (88-97.9%) = +40 ₼<br />
                  C (&lt;88%) = -50 ₼ kəsir
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  4
                </div>
                <h4 className="font-bold text-indigo-950 text-xs">Yekun Xalis Maaş</h4>
                <p className="text-[11px] text-indigo-900 font-mono-nums">
                  Baza - Davamiyyət Kəsintisi + İntizam Bonusu + KPI Bonusu - KPI Kəsiri = Ödəniləcək Məbləğ
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live Simulator */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  İnteraktiv Maaş Kalkulyatoru Simulyatoru
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Göstəriciləri dəyişərək yekun maaşın necə formalaşdığını canlı izləyin
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Baza Əməkhaqqı:</span>
                    <span className="font-mono-nums text-indigo-600">{formatAZN(simBaseSalary)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="3500"
                    step="50"
                    value={simBaseSalary}
                    onChange={e => setSimBaseSalary(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>500 AZN</span>
                    <span>3,500 AZN</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      İşə Gəliş (gün):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="22"
                      value={simWorkDaysAttended}
                      onChange={e => setSimWorkDaysAttended(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Norma: 22 gün</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gecikmə sayı:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={simLateCount}
                      onChange={e => setSimLateCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                    />
                    <span className="text-[10px] text-slate-400">10 ₼ / gecikmə</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qayıb sayı:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={simAbsentCount}
                      onChange={e => setSimAbsentCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Gündəlik kəsinti</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>KPI İcraat Balı (%):</span>
                    <span className="font-mono-nums text-indigo-600 font-bold">%{simKpiScore}</span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="125"
                    step="1"
                    value={simKpiScore}
                    onChange={e => setSimKpiScore(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>60% (C kəsir)</span>
                    <span>100% (A dərəcə)</span>
                    <span>125% (A+ maksimal)</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Payslip Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Maaşın Hesablama Vərəqəsi
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700 font-mono-nums">
                    Simulyasiya
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Baza Əməkhaqqı:</span>
                    <span className="font-mono-nums font-bold text-slate-900">
                      +{formatAZN(simBaseSalary)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Davamiyyət Kəsintisi ({simAbsentCount} qayıb, {simLateCount} gecikmə):</span>
                    <span className="font-mono-nums font-bold text-rose-600">
                      -{formatAZN(simCalculations.totalAttDeduction)}
                    </span>
                  </div>

                  {simCalculations.attBonus > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>100% Vaxtında QR İntizam Bonusu:</span>
                      <span className="font-mono-nums font-bold text-emerald-600">
                        +{formatAZN(simCalculations.attBonus)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>KPI Dərəcəsi ({simCalculations.kpiGrade} · %{simKpiScore}):</span>
                    {simCalculations.kpiBonus > 0 ? (
                      <span className="font-mono-nums font-bold text-emerald-600">
                        +{formatAZN(simCalculations.kpiBonus)}
                      </span>
                    ) : simCalculations.kpiPenalty > 0 ? (
                      <span className="font-mono-nums font-bold text-rose-600">
                        -{formatAZN(simCalculations.kpiPenalty)}
                      </span>
                    ) : (
                      <span className="font-mono-nums text-slate-400">0 AZN</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Yekun Xalis Maaş:</span>
                  <div className="text-right">
                    <span className="text-xl font-bold font-mono-nums text-indigo-600">
                      {formatAZN(simCalculations.netPayable)}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Ödəniləcək xalis məbləğ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB RULES: KPI RULES & FINANCIAL SALARY IMPACT PANEL */}
      {activeTab === 'rules' && (
        <KpiRulesView onNavigateToFinance={() => setActiveTab('finance')} />
      )}

      {/* MODAL: CREATE / EDIT EVALUATION */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingEval ? 'KPI Qiymətləndirməsinə Düzəliş' : 'Yeni KPI Qiymətləndirməsi Qeydi'}
              </h3>
              <button
                onClick={() => setShowEvalModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEvaluationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Əməkdaş:
                  </label>
                  <select
                    value={evalStaffId}
                    onChange={e => handleStaffChangeInModal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.role} · {s.branchName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hesabat Ayı:
                  </label>
                  <select
                    value={evalMonth}
                    onChange={e => setEvalMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium"
                  >
                    <option value="2026-03">2026 Mart</option>
                    <option value="2026-04">2026 Aprel</option>
                  </select>
                </div>
              </div>

              {/* Metric Actuals Input List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-900 block">
                  Metrikalar üzrə Faktiki Göstəricilər:
                </span>

                <div className="space-y-2">
                  {evalMetricResults.map((item, idx) => {
                    const def = kpiDefinitions.find(k => k.id === item.metricId);
                    if (!def) return null;

                    return (
                      <div
                        key={item.metricId}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {def.name}
                          </span>
                          <span className="text-slate-500 font-mono-nums">
                            Hədəf: {def.target} {def.unit} · Çəki: %{def.weight}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                              Faktiki Qiymət ({def.unit}):
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={item.actual}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setEvalMetricResults(prev =>
                                  prev.map((m, i) => (i === idx ? { ...m, actual: val } : m))
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold mb-0.5 block">
                              Qeyd / İzah:
                            </label>
                            <input
                              type="text"
                              placeholder="Məs. Heç bir tələbə ayrılmadı..."
                              value={item.note || ''}
                              onChange={e => {
                                const noteVal = e.target.value;
                                setEvalMetricResults(prev =>
                                  prev.map((m, i) => (i === idx ? { ...m, note: noteVal } : m))
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Summary */}
              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-indigo-700 block uppercase font-bold">
                    Hesablanmış KPI Nəticəsi:
                  </span>
                  <span className="font-bold text-indigo-950 font-mono-nums text-sm">
                    %{modalCalculations.totalScore} (Dərəcə: {modalCalculations.grade})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-700 block uppercase font-bold">
                    Maaşa Əlavə Bonus:
                  </span>
                  <span className="font-bold text-emerald-700 font-mono-nums text-sm">
                    +{formatAZN(modalCalculations.bonusAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direktor Rəyi / Tövsiyə:
                </label>
                <textarea
                  rows={2}
                  value={evalDirectorRemarks}
                  onChange={e => setEvalDirectorRemarks(e.target.value)}
                  placeholder="Əməkdaşın aylıq fəaliyyəti barədə yekun rəy..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Saxla və Maaş Bonusu Tətbiq Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT KPI METRIC */}
      {showMetricModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingMetric ? 'KPI Metrikinə Düzəliş' : 'Yeni KPI Metriki Təyin Et'}
              </h3>
              <button
                onClick={() => setShowMetricModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveMetricSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metrikin Adı:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Məs. Tələbə Saxlanması (Retention %)"
                  value={metricName}
                  onChange={e => setMetricName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kod:
                  </label>
                  <input
                    type="text"
                    required
                    value={metricCode}
                    onChange={e => setMetricCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kateqoriya:
                  </label>
                  <select
                    value={metricCategory}
                    onChange={e => setMetricCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="tedris">Tədris</option>
                    <option value="davamiyyet">Davamiyyət</option>
                    <option value="xidmet">Xidmət</option>
                    <option value="satis">Satış</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hədəf:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricTarget}
                    onChange={e => setMetricTarget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vahid:
                  </label>
                  <select
                    value={metricUnit}
                    onChange={e => setMetricUnit(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="%">%</option>
                    <option value="bal">Bal (1-5)</option>
                    <option value="say">Say</option>
                    <option value="saat">Saat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Çəki Payı (%):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={metricWeight}
                    onChange={e => setMetricWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold text-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bonus Həddi:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricBonusThresh}
                    onChange={e => setMetricBonusThresh(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kəsir Həddi:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricPenaltyThresh}
                    onChange={e => setMetricPenaltyThresh(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Təsvir:
                </label>
                <textarea
                  rows={2}
                  value={metricDesc}
                  onChange={e => setMetricDesc(e.target.value)}
                  placeholder="Metrikin mahiyyəti və tələbi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowMetricModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Metriki Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Dynamic Monthly Report Modal */}
      <KpiMonthlyReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
};
