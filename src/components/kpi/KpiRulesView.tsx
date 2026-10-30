import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Calculator,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Percent,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Scale,
  RotateCcw,
  Check,
  ShieldCheck,
  HelpCircle,
  Eye,
  Wallet,
  Building2,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { KpiMetricFinanceRule, KpiRuleMode, KpiCategory } from '../../types/crm';
import { formatAZN } from '../../utils/formatters';

interface KpiRulesViewProps {
  onNavigateToFinance?: () => void;
}

export const KpiRulesView: React.FC<KpiRulesViewProps> = ({ onNavigateToFinance }) => {
  const {
    kpiFinanceRules,
    updateKpiFinanceRule,
    resetKpiFinanceRules,
    syncSalariesWithKpiAndAttendance,
    setActiveTab,
    staff,
    confirmAction,
  } = useCrm();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedMonthForSync, setSelectedMonthForSync] = useState<string>('2026-03');

  // Simulator State
  const [simBaseSalary, setSimBaseSalary] = useState<number>(1500);
  const [simValues, setSimValues] = useState<Record<string, number>>({
    STAFF_PUNCTUALITY: 98,
    STD_ATTENDANCE: 88,
    LEAD_CONVERSION: 34,
    NPS: 4.85,
    RETENTION: 92,
    CURRICULUM_PROG: 96,
    COMPETITION_PREP: 82,
  });

  const categories: { id: string; label: string; count: number }[] = useMemo(() => {
    return [
      { id: 'all', label: 'Bütün Qaydalar', count: kpiFinanceRules.length },
      { id: 'davamiyyet', label: 'Davamiyyət & İntizam', count: kpiFinanceRules.filter(r => r.category === 'davamiyyet').length },
      { id: 'satis', label: 'Satış & Müraciətlər', count: kpiFinanceRules.filter(r => r.category === 'satis').length },
      { id: 'xidmet', label: 'Xidmət & NPS Məmnuniyyəti', count: kpiFinanceRules.filter(r => r.category === 'xidmet').length },
      { id: 'tedris', label: 'Tədris & Sillabus', count: kpiFinanceRules.filter(r => r.category === 'tedris').length },
    ];
  }, [kpiFinanceRules]);

  const filteredRules = useMemo(() => {
    if (activeCategoryFilter === 'all') return kpiFinanceRules;
    return kpiFinanceRules.filter(r => r.category === activeCategoryFilter);
  }, [kpiFinanceRules, activeCategoryFilter]);

  // Overall Simulator Calculation
  const simulatorResult = useMemo(() => {
    let totalBonusPercent = 0;
    let totalPenaltyPercent = 0;
    let totalBonusAmount = 0;
    let totalPenaltyAmount = 0;

    const breakdown = kpiFinanceRules.filter(r => r.isActive).map(rule => {
      const actualVal = simValues[rule.metricCode] ?? rule.formulaSettings.targetThreshold;
      const targetVal = rule.formulaSettings.targetThreshold;

      let impactPercent = 0;
      let formulaNote = '';

      if (rule.mode === 'formula') {
        const relDiff = targetVal > 0 ? (actualVal - targetVal) / targetVal : 0;
        const rawPercent = relDiff * rule.formulaSettings.scaleFactor * (rule.formulaSettings.baseSalaryMultiplier * 100);

        if (rawPercent >= 0) {
          impactPercent = Math.min(rule.formulaSettings.bonusCapPercent, Math.round(rawPercent * 10) / 10);
          formulaNote = `+${impactPercent}% (Hədəfdən ${actualVal >= targetVal ? '+' : ''}${Math.round((actualVal - targetVal) * 10) / 10} fərq)`;
        } else {
          impactPercent = Math.max(-rule.formulaSettings.penaltyFloorPercent, Math.round(rawPercent * 10) / 10);
          formulaNote = `${impactPercent}% (Hədəf kəsiri ${Math.round((actualVal - targetVal) * 10) / 10})`;
        }
      } else {
        // Manual Tier Scale
        const ratio = targetVal > 0 ? (actualVal / targetVal) * 100 : 100;
        if (ratio >= 105) {
          impactPercent = rule.manualTiers.tierAPlusBonusPercent;
          formulaNote = `Pillə A+ (+${impactPercent}%)`;
        } else if (ratio >= 98) {
          impactPercent = rule.manualTiers.tierABonusPercent;
          formulaNote = `Pillə A (+${impactPercent}%)`;
        } else if (ratio >= 88) {
          impactPercent = rule.manualTiers.tierBBonusPercent;
          formulaNote = `Pillə B (Neytral)`;
        } else {
          impactPercent = -rule.manualTiers.tierCPenaltyPercent;
          formulaNote = `Pillə C (${impactPercent}%)`;
        }
      }

      const amount = Math.round((simBaseSalary * Math.abs(impactPercent)) / 100);

      if (impactPercent > 0) {
        totalBonusPercent += impactPercent;
        totalBonusAmount += amount;
      } else if (impactPercent < 0) {
        totalPenaltyPercent += Math.abs(impactPercent);
        totalPenaltyAmount += amount;
      }

      return {
        ruleId: rule.id,
        metricCode: rule.metricCode,
        metricName: rule.metricName,
        category: rule.category,
        mode: rule.mode,
        actualVal,
        targetVal,
        impactPercent,
        amount,
        formulaNote,
      };
    });

    const netKpiPercent = Math.round((totalBonusPercent - totalPenaltyPercent) * 10) / 10;
    const netKpiAmount = totalBonusAmount - totalPenaltyAmount;
    const finalCalculatedSalary = Math.max(0, simBaseSalary + netKpiAmount);

    return {
      breakdown,
      totalBonusPercent: Math.round(totalBonusPercent * 10) / 10,
      totalPenaltyPercent: Math.round(totalPenaltyPercent * 10) / 10,
      totalBonusAmount,
      totalPenaltyAmount,
      netKpiPercent,
      netKpiAmount,
      finalCalculatedSalary,
    };
  }, [kpiFinanceRules, simBaseSalary, simValues]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-wide">
                KPI Maliyyə Qaydaları və Maaşa Təsir Paneli
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                Formula Engine v2.0
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Davamiyyət, satış konversiyası və şagird məmnuniyyəti (NPS) kimi KPI-ların əməkhaqqına necə təsir edəcəyini əl ilə və ya avtomatik düsturlarla tənzimləyin. Dəyişikliklər maliyyə səhifəsinə dərhal inteqrasiya olunur.
            </p>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => syncSalariesWithKpiAndAttendance(selectedMonthForSync)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            title="Aktiv qaydalar əsasında maliyyə səhifəsindəki maaşları dərhal yenidən hesabla"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Maaşları Yenidən Hesabla</span>
          </button>

          <button
            onClick={() => {
              confirmAction({
                title: 'KPI Qaydalarını Sıfırla',
                message: 'Bütün maliyyə və KPI tənzimləmələrini ilkin zavod standart vəziyyətinə qaytarmaq istədiyinizə əminsiniz?',
                confirmText: 'Bəli, Sıfırla',
                danger: false,
                onConfirm: resetKpiFinanceRules,
              });
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            title="Bütün düstur və hədləri ilkin standart vəziyyətinə qaytar"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Sıfırla</span>
          </button>

          <button
            onClick={() => {
              if (onNavigateToFinance) onNavigateToFinance();
              else setActiveTab('finance');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Maliyyə Səhifəsi</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Quick Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeCategoryFilter === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeCategoryFilter === cat.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sync Month Selector */}
        <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Tətbiq Ayı:</span>
          <select
            value={selectedMonthForSync}
            onChange={e => setSelectedMonthForSync(e.target.value)}
            className="font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
          >
            <option value="2026-03">2026 Mart</option>
            <option value="2026-04">2026 Aprel</option>
            <option value="2026-02">2026 Fevral</option>
          </select>
        </div>
      </div>

      {/* Main Grid: KPI Rules Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRules.map(rule => {
          const isFormula = rule.mode === 'formula';

          return (
            <div
              key={rule.id}
              className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden flex flex-col justify-between ${
                rule.isActive ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-200 opacity-60 bg-slate-50/60'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      rule.category === 'davamiyyet' ? 'bg-sky-500' :
                      rule.category === 'satis' ? 'bg-emerald-500' :
                      rule.category === 'xidmet' ? 'bg-indigo-500' : 'bg-purple-500'
                    }`} />
                    <h4 className="text-sm font-bold text-slate-900">
                      {rule.metricName}
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rule.metricCode}
                    </span>
                  </div>

                  {/* Active Toggle Switch */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={rule.isActive}
                      onChange={e => updateKpiFinanceRule(rule.id, { isActive: e.target.checked })}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{rule.isActive ? 'Aktiv' : 'Deaktiv'}</span>
                  </label>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {rule.notes || 'Bu göstəricinin icraatı üzrə maaşa tətbiq olunan faiz və ya məbləğ qaydaları.'}
                </p>

                {/* Mode Selector Tabs (Formula vs Manual Tiers) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => updateKpiFinanceRule(rule.id, { mode: 'formula' })}
                    className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isFormula
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Avtomatik Düstur</span>
                  </button>

                  <button
                    onClick={() => updateKpiFinanceRule(rule.id, { mode: 'manual_tiers' })}
                    className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isFormula
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Əl ilə Pilləli Dərəcə</span>
                  </button>
                </div>
              </div>

              {/* Card Body: Formula Controls or Manual Tiers */}
              <div className="p-4 space-y-4 flex-1">
                {isFormula ? (
                  /* MODE A: AUTOMATIC FORMULA ENGINE */
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Base Salary Multiplier (%) */}
                      <div className="p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                        <label className="block text-[11px] font-bold text-indigo-950">
                          Maaş Təsir Əmsalı (%):
                        </label>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            step="1"
                            min="1"
                            max="50"
                            value={Math.round(rule.formulaSettings.baseSalaryMultiplier * 100)}
                            onChange={e => {
                              const val = Math.max(1, Math.min(50, Number(e.target.value)));
                              updateKpiFinanceRule(rule.id, {
                                formulaSettings: {
                                  ...rule.formulaSettings,
                                  baseSalaryMultiplier: val / 100,
                                },
                              });
                            }}
                            className="w-16 bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-indigo-900"
                          />
                          <span className="text-[11px] font-semibold text-indigo-700">% maaş təsiri</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Baza maaşın neçə %-i bu metrikə bağlıdır.
                        </span>
                      </div>

                      {/* Scale Sensitivity Factor */}
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <label className="block text-[11px] font-bold text-slate-800">
                          Həssaslıq Əmsalı (Scale):
                        </label>
                        <div className="flex items-center gap-1 mt-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="3.0"
                            value={rule.formulaSettings.scaleFactor}
                            onChange={e => {
                              const val = Math.max(0.1, Number(e.target.value));
                              updateKpiFinanceRule(rule.id, {
                                formulaSettings: {
                                  ...rule.formulaSettings,
                                  scaleFactor: val,
                                },
                              });
                            }}
                            className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-900"
                          />
                          <span className="text-[11px] font-semibold text-slate-600">x artım çarpanı</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Hədəfi aşdıqda artım sürəti.
                        </span>
                      </div>
                    </div>

                    {/* Thresholds & Limits */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block">Hədəf Hədd</span>
                        <input
                          type="number"
                          step="0.1"
                          value={rule.formulaSettings.targetThreshold}
                          onChange={e => {
                            updateKpiFinanceRule(rule.id, {
                              formulaSettings: {
                                ...rule.formulaSettings,
                                targetThreshold: Number(e.target.value),
                              },
                            });
                          }}
                          className="w-full text-center bg-white border border-slate-200 rounded py-0.5 text-xs font-mono font-bold text-slate-900 mt-1"
                        />
                      </div>

                      <div className="p-2 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center">
                        <span className="text-[10px] font-semibold text-emerald-800 block">Maks. Bonus %</span>
                        <input
                          type="number"
                          step="1"
                          value={rule.formulaSettings.bonusCapPercent}
                          onChange={e => {
                            updateKpiFinanceRule(rule.id, {
                              formulaSettings: {
                                ...rule.formulaSettings,
                                bonusCapPercent: Number(e.target.value),
                              },
                            });
                          }}
                          className="w-full text-center bg-white border border-emerald-300 rounded py-0.5 text-xs font-mono font-bold text-emerald-800 mt-1"
                        />
                      </div>

                      <div className="p-2 bg-rose-50/60 border border-rose-200 rounded-lg text-center">
                        <span className="text-[10px] font-semibold text-rose-800 block">Maks. Kəsir %</span>
                        <input
                          type="number"
                          step="1"
                          value={rule.formulaSettings.penaltyFloorPercent}
                          onChange={e => {
                            updateKpiFinanceRule(rule.id, {
                              formulaSettings: {
                                ...rule.formulaSettings,
                                penaltyFloorPercent: Number(e.target.value),
                              },
                            });
                          }}
                          className="w-full text-center bg-white border border-rose-300 rounded py-0.5 text-xs font-mono font-bold text-rose-800 mt-1"
                        />
                      </div>
                    </div>

                    {/* Formula Expression Preview Box */}
                    <div className="p-2.5 bg-slate-900 text-indigo-200 rounded-xl text-[11px] font-mono flex items-center justify-between gap-2 border border-slate-800">
                      <div className="truncate">
                        <span className="text-indigo-400 font-bold">Düstur: </span>
                        <span>
                          Maaş * {Math.round(rule.formulaSettings.baseSalaryMultiplier * 100)}% * ((Faktiki - {rule.formulaSettings.targetThreshold}) / {rule.formulaSettings.targetThreshold} * {rule.formulaSettings.scaleFactor})
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 shrink-0">
                        Canlı Düstur
                      </span>
                    </div>
                  </div>
                ) : (
                  /* MODE B: MANUAL TIERED SCALE (A+, A, B, C) */
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Tier A+ */}
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          A+ (&ge;105%)
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <input
                            type="number"
                            step="0.5"
                            value={rule.manualTiers.tierAPlusBonusPercent}
                            onChange={e => {
                              updateKpiFinanceRule(rule.id, {
                                manualTiers: {
                                  ...rule.manualTiers,
                                  tierAPlusBonusPercent: Number(e.target.value),
                                },
                              });
                            }}
                            className="w-14 text-center bg-white border border-emerald-300 rounded py-1 text-xs font-mono font-bold text-emerald-800"
                          />
                          <span className="text-[11px] font-bold text-emerald-700">%</span>
                        </div>
                        <span className="text-[9px] text-emerald-700 block font-medium">Maksimal Əlavə</span>
                      </div>

                      {/* Tier A */}
                      <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                          A (98-104%)
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <input
                            type="number"
                            step="0.5"
                            value={rule.manualTiers.tierABonusPercent}
                            onChange={e => {
                              updateKpiFinanceRule(rule.id, {
                                manualTiers: {
                                  ...rule.manualTiers,
                                  tierABonusPercent: Number(e.target.value),
                                },
                              });
                            }}
                            className="w-14 text-center bg-white border border-indigo-300 rounded py-1 text-xs font-mono font-bold text-indigo-800"
                          />
                          <span className="text-[11px] font-bold text-indigo-700">%</span>
                        </div>
                        <span className="text-[9px] text-indigo-700 block font-medium">Standart Bonus</span>
                      </div>

                      {/* Tier B */}
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          B (88-97%)
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <input
                            type="number"
                            step="0.5"
                            value={rule.manualTiers.tierBBonusPercent}
                            onChange={e => {
                              updateKpiFinanceRule(rule.id, {
                                manualTiers: {
                                  ...rule.manualTiers,
                                  tierBBonusPercent: Number(e.target.value),
                                },
                              });
                            }}
                            className="w-14 text-center bg-white border border-amber-300 rounded py-1 text-xs font-mono font-bold text-amber-800"
                          />
                          <span className="text-[11px] font-bold text-amber-700">%</span>
                        </div>
                        <span className="text-[9px] text-amber-700 block font-medium">Neytral</span>
                      </div>

                      {/* Tier C */}
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          C (&lt;88%)
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <input
                            type="number"
                            step="0.5"
                            value={rule.manualTiers.tierCPenaltyPercent}
                            onChange={e => {
                              updateKpiFinanceRule(rule.id, {
                                manualTiers: {
                                  ...rule.manualTiers,
                                  tierCPenaltyPercent: Number(e.target.value),
                                },
                              });
                            }}
                            className="w-14 text-center bg-white border border-rose-300 rounded py-1 text-xs font-mono font-bold text-rose-800"
                          />
                          <span className="text-[11px] font-bold text-rose-700">%</span>
                        </div>
                        <span className="text-[9px] text-rose-700 block font-medium">Kəsir / Cərimə</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic text-center">
                      İşçinin ümumi və ya metrik üzrə qiymətləndirmə dərəcəsinə əsasən müəyyən olunmuş sabit maaş faizi tətbiq edilir.
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Live Sample Calculation Preview */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-slate-900">Nümunə:</span>
                  <span>
                    1500 ₼ maaşda hədəf 5% aşıldıqda:
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-600">
                  +{isFormula ? Math.round(1500 * rule.formulaSettings.baseSalaryMultiplier * 0.05 * rule.formulaSettings.scaleFactor) : Math.round(1500 * (rule.manualTiers.tierAPlusBonusPercent / 100))} ₼ əlavə
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-Time Live Salary Simulator Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Canlı Əməkhaqqı & KPI Qaydaları Simulyatoru
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Canlı Nəticə
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tənzimlədiyiniz qaydaların nümunəvi əməkdaş maaşına necə təsir etdiyini real vaxtda sınaqdan keçirin.
            </p>
          </div>

          {/* Base Salary Input */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-semibold">Test Baza Maaşı:</span>
            <input
              type="number"
              step="50"
              value={simBaseSalary}
              onChange={e => setSimBaseSalary(Math.max(100, Number(e.target.value)))}
              className="w-20 bg-white border border-slate-300 rounded px-2 py-1 font-mono font-bold text-slate-900 text-right"
            />
            <span className="font-bold text-slate-700">AZN</span>
          </div>
        </div>

        {/* Sliders Grid for Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Slider 1: Davamiyyət */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">QR Davamiyyət İntizamı</span>
              <span className="font-mono font-bold text-sky-600 text-sm">{simValues.STAFF_PUNCTUALITY}%</span>
            </div>
            <input
              type="range"
              min="75"
              max="100"
              value={simValues.STAFF_PUNCTUALITY}
              onChange={e => setSimValues(prev => ({ ...prev, STAFF_PUNCTUALITY: Number(e.target.value) }))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>75% (Kəsir)</span>
              <span>Hədəf: 95%</span>
              <span>100% (Mükəmməl)</span>
            </div>
          </div>

          {/* Slider 2: Satış Konversiyası */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Satış & Qeydiyyat</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">{simValues.LEAD_CONVERSION}%</span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={simValues.LEAD_CONVERSION}
              onChange={e => setSimValues(prev => ({ ...prev, LEAD_CONVERSION: Number(e.target.value) }))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>15% (Aşağı)</span>
              <span>Hədəf: 30%</span>
              <span>50% (Rekord)</span>
            </div>
          </div>

          {/* Slider 3: Məmnuniyyət NPS */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800">Şagird/Valideyn NPS</span>
              <span className="font-mono font-bold text-indigo-600 text-sm">{simValues.NPS} bal</span>
            </div>
            <input
              type="range"
              min="3.8"
              max="5.0"
              step="0.05"
              value={simValues.NPS}
              onChange={e => setSimValues(prev => ({ ...prev, NPS: Number(e.target.value) }))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>3.8 (Şikayət)</span>
              <span>Hədəf: 4.8</span>
              <span>5.0 (Tam 5 bal)</span>
            </div>
          </div>
        </div>

        {/* Calculation Result Summary Box */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block">
              Simulyasiya Nəticəsi: Yekun Maaş Hesablaması
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black font-mono-nums text-white">
                {formatAZN(simulatorResult.finalCalculatedSalary)}
              </span>
              <span className={`text-sm font-bold flex items-center ${
                simulatorResult.netKpiPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {simulatorResult.netKpiPercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {simulatorResult.netKpiPercent >= 0 ? `+${simulatorResult.netKpiPercent}%` : `${simulatorResult.netKpiPercent}%`} ({simulatorResult.netKpiAmount >= 0 ? `+${formatAZN(simulatorResult.netKpiAmount)}` : `-${formatAZN(Math.abs(simulatorResult.netKpiAmount))}`})
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Baza Maaş: {formatAZN(simBaseSalary)} · Toplam Bonus: +{formatAZN(simulatorResult.totalBonusAmount)} · Toplam Kəsir: -{formatAZN(simulatorResult.totalPenaltyAmount)}
            </p>
          </div>

          {/* Quick Metrics Breakdown Badges */}
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
            {simulatorResult.breakdown.slice(0, 4).map(item => (
              <div
                key={item.ruleId}
                className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-center"
              >
                <span className="text-[10px] text-slate-400 block truncate max-w-[100px]">{item.metricName.split(' ')[0]}</span>
                <span className={`font-mono font-bold text-xs ${
                  item.impactPercent > 0 ? 'text-emerald-400' : item.impactPercent < 0 ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {item.impactPercent > 0 ? `+${item.amount} ₼` : item.impactPercent < 0 ? `-${item.amount} ₼` : '0 ₼'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
