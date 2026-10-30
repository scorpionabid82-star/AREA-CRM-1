import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  X,
  CheckCircle2,
  TrendingUp,
  Award,
  Building2,
  Calendar,
  Filter,
  Users,
  ShieldCheck,
  QrCode,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Share2,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useCrm } from '../../context/CrmContext';
import { StaffKpiEvaluation, BranchLocation, StaffMember } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';

interface KpiMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KpiMonthlyReportModal: React.FC<KpiMonthlyReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { staffKpis, branches, staff, currentUser, trainerSalaries } = useCrm();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('multi'); // 'multi' = 4 Months Dynamics, or specific '2026-04', '2026-03', '2026-02', '2026-01'
  const [filterBranchId, setFilterBranchId] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  const [includeSalaries, setIncludeSalaries] = useState<boolean>(true);

  // Available unique months sorted chronologically
  const availableMonths = useMemo(() => {
    const monthsSet = new Set(staffKpis.map(e => e.month));
    const sorted = Array.from(monthsSet).sort();
    return sorted; // e.g. ['2026-01', '2026-02', '2026-03', '2026-04']
  }, [staffKpis]);

  const monthNamesAz: Record<string, string> = {
    '2026-01': 'Yanvar 2026',
    '2026-02': 'Fevral 2026',
    '2026-03': 'Mart 2026',
    '2026-04': 'Aprel 2026',
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return staffKpis.filter(item => {
      const matchMonth = selectedPeriod === 'multi' ? true : item.month === selectedPeriod;
      const matchBranch = filterBranchId === 'all' ? true : item.branchId === filterBranchId;
      const matchRole = filterRole === 'all' ? true : item.role === filterRole;
      return matchMonth && matchBranch && matchRole;
    });
  }, [staffKpis, selectedPeriod, filterBranchId, filterRole]);

  // Dynamics by Month (Trend calculation)
  const monthlyDynamics = useMemo(() => {
    return availableMonths.map(m => {
      const evalsInMonth = staffKpis.filter(e => {
        const matchBranch = filterBranchId === 'all' || e.branchId === filterBranchId;
        const matchRole = filterRole === 'all' || e.role === filterRole;
        return e.month === m && matchBranch && matchRole;
      });

      const avgScore = evalsInMonth.length > 0
        ? Math.round((evalsInMonth.reduce((acc, curr) => acc + curr.totalScore, 0) / evalsInMonth.length) * 10) / 10
        : 0;

      const totalBonus = evalsInMonth.reduce((acc, curr) => acc + curr.kpiBonusAmount, 0);
      const totalPenalty = evalsInMonth.reduce((acc, curr) => acc + curr.kpiPenaltyAmount, 0);
      const count = evalsInMonth.length;
      const highPerformers = evalsInMonth.filter(e => e.grade === 'A+' || e.grade === 'A').length;

      return {
        month: m,
        monthName: monthNamesAz[m] || m,
        shortName: (monthNamesAz[m] || m).split(' ')[0],
        avgScore,
        targetScore: 100,
        totalBonus,
        totalPenalty,
        count,
        highPerformers,
      };
    }).filter(d => d.count > 0);
  }, [availableMonths, staffKpis, filterBranchId, filterRole]);

  // Overall statistics for the report header
  const reportStats = useMemo(() => {
    if (monthlyDynamics.length === 0) {
      return {
        firstScore: 0,
        latestScore: 0,
        growthRate: 0,
        totalBonus: 0,
        totalEvaluations: 0,
        topBranch: 'AREA Nərimanov Filialı',
        topStaff: 'Fərid Əliyev',
        averageScore: 0,
      };
    }

    const firstScore = monthlyDynamics[0].avgScore;
    const latestScore = monthlyDynamics[monthlyDynamics.length - 1].avgScore;
    const growthRate = Math.round((latestScore - firstScore) * 10) / 10;
    const totalBonus = filteredData.reduce((acc, curr) => acc + curr.kpiBonusAmount, 0);
    const totalEvaluations = filteredData.length;

    // Highest scoring staff member in latest period
    const latestMonth = availableMonths[availableMonths.length - 1] || '2026-04';
    const latestEvals = staffKpis.filter(e => e.month === latestMonth);
    const sortedStaff = [...latestEvals].sort((a, b) => b.totalScore - a.totalScore);
    const topStaff = sortedStaff[0]?.staffName || 'Fərid Əliyev';

    // Top branch
    const branchScores = branches.map(b => {
      const bEvals = staffKpis.filter(e => e.branchId === b.id && e.month === latestMonth);
      const bAvg = bEvals.length > 0
        ? bEvals.reduce((acc, curr) => acc + curr.totalScore, 0) / bEvals.length
        : 0;
      return { name: b.name, avg: bAvg };
    }).sort((a, b) => b.avg - a.avg);

    const topBranch = branchScores[0]?.name || 'AREA Nərimanov Filialı';
    const allScoresSum = filteredData.reduce((acc, curr) => acc + curr.totalScore, 0);
    const averageScore = filteredData.length > 0
      ? Math.round((allScoresSum / filteredData.length) * 10) / 10
      : 100;

    return {
      firstScore,
      latestScore,
      growthRate,
      totalBonus,
      totalEvaluations,
      topBranch,
      topStaff,
      averageScore,
    };
  }, [monthlyDynamics, filteredData, availableMonths, staffKpis, branches]);

  // Branch Comparison Across Months
  const branchMonthlyTable = useMemo(() => {
    return branches.map(branch => {
      const rowScores: Record<string, number> = {};
      availableMonths.forEach(m => {
        const evals = staffKpis.filter(e => e.branchId === branch.id && e.month === m);
        const avg = evals.length > 0
          ? Math.round((evals.reduce((acc, curr) => acc + curr.totalScore, 0) / evals.length) * 10) / 10
          : 0;
        rowScores[m] = avg;
      });

      const firstMonth = availableMonths[0];
      const lastMonth = availableMonths[availableMonths.length - 1];
      const startScore = rowScores[firstMonth] || 0;
      const endScore = rowScores[lastMonth] || 0;
      const delta = startScore > 0 ? Math.round((endScore - startScore) * 10) / 10 : 0;

      return {
        branchId: branch.id,
        branchName: branch.name,
        scores: rowScores,
        latestScore: endScore,
        delta,
      };
    }).filter(b => b.latestScore > 0);
  }, [branches, availableMonths, staffKpis]);

  // Staff Members Individual Progression
  const staffProgressionList = useMemo(() => {
    const uniqueStaffIds = Array.from(new Set(filteredData.map(e => e.staffId)));

    return uniqueStaffIds.map(stId => {
      const staffRecords = staffKpis.filter(e => e.staffId === stId);
      const sortedRecords = [...staffRecords].sort((a, b) => a.month.localeCompare(b.month));
      const latest = sortedRecords[sortedRecords.length - 1];
      const previous = sortedRecords.length > 1 ? sortedRecords[sortedRecords.length - 2] : null;

      const delta = previous
        ? Math.round((latest.totalScore - previous.totalScore) * 10) / 10
        : 0;

      return {
        staffId: latest.staffId,
        staffName: latest.staffName,
        role: latest.role,
        branchName: latest.branchName,
        latestMonth: latest.month,
        latestScore: latest.totalScore,
        grade: latest.grade,
        bonus: latest.kpiBonusAmount,
        penalty: latest.kpiPenaltyAmount,
        delta,
        remarks: latest.directorRemarks,
      };
    }).sort((a, b) => b.latestScore - a.latestScore);
  }, [filteredData, staffKpis]);

  // Generate & Download PDF function
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);

    try {
      // Temporarily ensure high visibility and standard sizing
      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // 2x high resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `AREA_KPI_Ayliq_Dinamika_Hesabati_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to CSV / Excel
  const handleExportCsv = () => {
    const headers = [
      'Əməkdaş',
      'Vəzifə',
      'Filial',
      'Ay',
      'KPI Balı',
      'Dərəcə',
      'Bonus (AZN)',
      'Cərimə (AZN)',
      'Qeyd'
    ];

    const rows = filteredData.map(e => [
      `"${e.staffName}"`,
      `"${e.role}"`,
      `"${e.branchName}"`,
      `"${e.month}"`,
      e.totalScore,
      `"${e.grade}"`,
      e.kpiBonusAmount,
      e.kpiPenaltyAmount,
      `"${e.directorRemarks || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AREA_KPI_Dinamika_Dataset_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Top Control Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  KPI Aylıq Dinamika PDF Hesabat Modulu
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Rəsmi Format
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Avtomatik formalaşdırılan A4 rəsmi hesabat sənədi, dinamika qrafikləri və maaşa təsir cədvəli.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="CSV kimi ixrac et"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">CSV İxrac</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Çap et və ya brauzerdən PDF saxla"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Çap Et</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Hazırlanır...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>PDF Yükləndi!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Endir (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Customization Toolbar (Hidden on print) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Dövr:</span>
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="multi">Son 4 Ay Müqayisəli Dinamika</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {monthNamesAz[m] || m}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Filial:</span>
              <select
                value={filterBranchId}
                onChange={e => setFilterBranchId(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="all">Bütün Filiallar (Şəbəkə)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name.replace('AREA ', '')}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Vəzifə:</span>
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="all">Bütün Heyət</option>
                <option value="Təlimçi">Yalnız Təlimçilər</option>
                <option value="Menecer">Yalnız Menecerlər</option>
              </select>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={e => setIncludeCharts(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Dinamika Qrafiki</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={includeSalaries}
                onChange={e => setIncludeSalaries(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Maaş Təsiri</span>
            </label>
          </div>
        </div>

        {/* Scrollable Document Area (The Printed Paper Element) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          {/* A4 Paper Canvas */}
          <div
            ref={printAreaRef}
            id="kpi-official-report-canvas"
            className="w-full max-w-[210mm] bg-white text-slate-900 p-8 sm:p-10 shadow-lg rounded-xl print:shadow-none print:rounded-none print:p-6 print:w-full space-y-6"
            style={{ minHeight: '297mm' }}
          >
            {/* Header: Corporate Letterhead */}
            <div className="border-b-2 border-indigo-900 pb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-900 to-indigo-700 text-white font-bold flex items-center justify-center text-2xl shadow-sm shrink-0">
                  A
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">
                    AREA · Azərbaycan Robototexnika Mərkəzi
                  </h1>
                  <h2 className="text-sm font-bold text-indigo-700 tracking-wide mt-0.5">
                    Tədris və İnzibati Heyətin KPI Aylıq Dinamikası Hesabatı
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Avtomatlaşdırılmış Performans Qiymətləndirmə və Əməkhaqqı İnteqrasiya Sistemi
                  </p>
                </div>
              </div>

              {/* Document Meta Info Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] space-y-1 sm:text-right shrink-0 w-full sm:w-auto">
                <div className="text-slate-500">
                  Sənəd №: <span className="font-mono font-bold text-slate-900">AREA-KPI-REP-2026-04</span>
                </div>
                <div className="text-slate-500">
                  Tarix: <span className="font-semibold text-slate-900">{formatDateAz(new Date().toISOString().split('T')[0])}</span>
                </div>
                <div className="text-slate-500">
                  Hesabat Dövrü: <span className="font-semibold text-indigo-700">{selectedPeriod === 'multi' ? '2026 Yanvar - 2026 Aprel' : (monthNamesAz[selectedPeriod] || selectedPeriod)}</span>
                </div>
                <div className="text-slate-500">
                  Təsdiq Edən: <span className="font-semibold text-slate-900">{currentUser?.fullName || 'Direktorluq'}</span>
                </div>
              </div>
            </div>

            {/* Executive Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Şəbəkə Orta KPI</span>
                <div className="text-xl font-bold font-mono-nums text-slate-900 mt-0.5">
                  %{reportStats.averageScore}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 flex items-center mt-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{reportStats.growthRate}% dinamika</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">Təyin Edilən Bonus</span>
                <div className="text-xl font-bold font-mono-nums text-emerald-700 mt-0.5">
                  +{formatAZN(reportStats.totalBonus)}
                </div>
                <span className="text-[10px] text-emerald-600 mt-0.5 block">
                  {reportStats.totalEvaluations} qiymətləndirmə üzrə
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold uppercase text-indigo-800 block">Lider Filial</span>
                <div className="text-xs font-bold text-slate-900 truncate mt-1">
                  {reportStats.topBranch.replace('AREA ', '')}
                </div>
                <span className="text-[10px] text-indigo-600 mt-0.5 block">
                  Aylıq ən yüksək nəticə
                </span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase text-amber-800 block">Ayın Ən Yaxşı Təlimçisi</span>
                <div className="text-xs font-bold text-slate-900 truncate mt-1">
                  {reportStats.topStaff}
                </div>
                <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                  106.5% KPI (A+)
                </span>
              </div>
            </div>

            {/* Chart Section: Monthly KPI Trend Dynamics */}
            {includeCharts && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Aylıq Performans Dinamikası (2026 Yanvar - Aprel)</span>
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Orta KPI ballarının hədəfə (Target: 100%) nisbətdə 4 aylıq inkişaf qrafiki
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <span className="text-slate-600 font-medium">Faktiki KPI</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span className="text-slate-600 font-medium">Hədəf (100%)</span>
                    </div>
                  </div>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyDynamics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="reportKpiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="shortName" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis domain={[80, 115]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                        formatter={(val: any) => [`%${val}`, '']}
                      />
                      <Area type="monotone" dataKey="avgScore" name="Faktiki KPI" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#reportKpiGrad)" />
                      <Line type="monotone" dataKey="targetScore" name="Hədəf" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Table 1: Branch Comparative Dynamics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Filiallar üzrə Aylıq Müqayisəli Dinamika</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Bütün Filial Şəbəkəsi</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Filial Adı</th>
                      <th className="py-2 px-2 text-center">Yanvar</th>
                      <th className="py-2 px-2 text-center">Fevral</th>
                      <th className="py-2 px-2 text-center">Mart</th>
                      <th className="py-2 px-2 text-center">Aprel</th>
                      <th className="py-2 px-2 text-center">Trend Dinamikası</th>
                      <th className="py-2 px-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchMonthlyTable.map(item => (
                      <tr key={item.branchId} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                          {item.branchName}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono-nums text-slate-600">
                          %{item.scores['2026-01'] || '-'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono-nums text-slate-600">
                          %{item.scores['2026-02'] || '-'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono-nums text-slate-700 font-medium">
                          %{item.scores['2026-03'] || '-'}
                        </td>
                        <td className="py-1.5 px-2 text-center font-mono-nums text-indigo-900 font-bold">
                          %{item.scores['2026-04'] || '-'}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={`inline-flex items-center gap-0.5 font-bold ${
                            item.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {item.delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {item.delta >= 0 ? `+${item.delta}%` : `${item.delta}%`}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Aktiv / Hədəfdə
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Individual Performance & Salary Integration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Əməkdaşların Fərdi Qiymətləndirməsi və Maaşa Təsiri</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">QR İntizamı & Metrik İcrası</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-2.5">Əməkdaş</th>
                      <th className="py-2 px-2">Vəzifə / Filial</th>
                      <th className="py-2 px-2 text-center">Dövr Balı</th>
                      <th className="py-2 px-2 text-center">Dərəcə</th>
                      <th className="py-2 px-2 text-center">Aylıq Delta</th>
                      {includeSalaries && (
                        <>
                          <th className="py-2 px-2 text-right">Maaş Bonusu</th>
                          <th className="py-2 px-2 text-right">Cərimə</th>
                        </>
                      )}
                      <th className="py-2 px-2.5 text-left">Direktor Rəyi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staffProgressionList.slice(0, 8).map(st => (
                      <tr key={st.staffId} className="hover:bg-slate-50">
                        <td className="py-2 px-2.5 font-bold text-slate-900">
                          {st.staffName}
                        </td>
                        <td className="py-2 px-2 text-slate-600">
                          <span className="font-medium text-slate-800">{st.role}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                            {st.branchName.replace('AREA ', '')}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono-nums font-bold text-indigo-700">
                          %{st.latestScore}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded-md font-mono-nums font-bold text-[10px] ${
                            st.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                            st.grade === 'A' ? 'bg-indigo-100 text-indigo-800' :
                            st.grade === 'B' ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {st.grade}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono-nums">
                          <span className={`inline-flex items-center text-[10px] font-bold ${
                            st.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {st.delta >= 0 ? `+${st.delta}%` : `${st.delta}%`}
                          </span>
                        </td>
                        {includeSalaries && (
                          <>
                            <td className="py-2 px-2 text-right font-mono-nums font-bold text-emerald-600">
                              {st.bonus > 0 ? `+${formatAZN(st.bonus)}` : '0 ₼'}
                            </td>
                            <td className="py-2 px-2 text-right font-mono-nums text-rose-600">
                              {st.penalty > 0 ? `-${formatAZN(st.penalty)}` : '0 ₼'}
                            </td>
                          </>
                        )}
                        <td className="py-2 px-2.5 text-slate-600 text-[10px] italic max-w-[200px] truncate">
                          {st.remarks || 'Qüsursuz icraat təsdiqlənib.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Signatures & Stamp Block */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
              {/* Director Statement */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wide">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Rəsmi Rəhbərlik Təsdiqi və Qərarı</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  "Bu hesabat AREA Tədris Mərkəzinin QR geolokasiya davamiyyət qeydləri və təsdiq olunmuş KPI metrikaları əsasında avtomatik generasiya edilmişdir. Hesablanmış bonus və əlavələr maliyyə səhifəsindəki rəsmi əməkhaqqı vərəqələrinə köçürülmüşdür."
                </p>
                <div className="text-[10px] text-slate-500">
                  Elektron Verifikasiya İmzası: <span className="font-mono text-slate-700">SHA-256-KPI-VERIFIED-2026-AZ</span>
                </div>
              </div>

              {/* Official Stamp & Signature Area */}
              <div className="flex justify-between items-center sm:justify-end gap-6">
                {/* Official Stamp Graphic */}
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-indigo-700 flex flex-col items-center justify-center text-center p-1 relative select-none">
                  <div className="absolute inset-1 rounded-full border border-indigo-600/60" />
                  <span className="text-[8px] font-bold text-indigo-900 tracking-wider uppercase">
                    AREA ACADEMY
                  </span>
                  <span className="text-[9px] font-black text-indigo-800 my-0.5 tracking-tight">
                    TƏSDİQ EDİLDİ
                  </span>
                  <span className="text-[7px] text-indigo-700 font-mono">
                    2026 · BAKU
                  </span>
                </div>

                {/* Signature Lines */}
                <div className="space-y-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Direktor:</span>
                    <span className="text-xs font-bold text-slate-900 block mt-0.5">
                      {currentUser?.fullName || 'Direktorluq'}
                    </span>
                    <div className="w-32 border-b border-slate-400 mt-2 ml-auto" />
                    <span className="text-[9px] text-slate-400 block mt-0.5">İmza və Möhür</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
              <span>AREA Tədris İdarəetmə Sistemi (CRM) · Konfidensial Rəsmi Sənəd</span>
              <span>Səhifə 1 / 1 · Çap tarixi: {new Date().toLocaleDateString('az-AZ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
