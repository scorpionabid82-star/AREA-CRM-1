import React from 'react';
import {
  Boxes,
  FileSignature,
  Wrench,
  AlertTriangle,
  Send,
  Clock,
  DollarSign,
  TrendingDown,
  Building2,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventorySubTab } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface InventoryOverviewProps {
  onNavigateTab: (tab: InventorySubTab) => void;
  selectedBranchIdFilter?: string;
}

export const InventoryOverview: React.FC<InventoryOverviewProps> = ({
  onNavigateTab,
  selectedBranchIdFilter,
}) => {
  const {
    currentRole,
    currentUser,
    branches,
    inventoryProducts,
    inventoryOrders,
    equipmentRequests,
    technicalTickets,
    inventoryPayments,
    inventoryAuditLogs,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  // Filter scoped to branch if manager or if director filtered by a specific branch
  const effectiveBranchId = managerBranchId || (selectedBranchIdFilter && selectedBranchIdFilter !== 'all' ? selectedBranchIdFilter : null);

  const scopedOrders = effectiveBranchId
    ? inventoryOrders.filter(o => o.branchId === effectiveBranchId)
    : inventoryOrders;

  const scopedRequests = effectiveBranchId
    ? equipmentRequests.filter(r => r.branchId === effectiveBranchId)
    : equipmentRequests;

  const scopedTickets = effectiveBranchId
    ? technicalTickets.filter(t => t.branchId === effectiveBranchId)
    : technicalTickets;

  const scopedPayments = effectiveBranchId
    ? inventoryPayments.filter(p => p.branchId === effectiveBranchId)
    : inventoryPayments;

  // Key metrics calculation
  const newDiyOrders = scopedOrders.filter(o => o.type === 'diy' && (o.status === 'yeni' || o.status === 'baxilir')).length;
  const pendingPaidOrders = scopedOrders.filter(o => o.type === 'paid' && (o.status === 'yeni' || o.status === 'baxilir'));
  const pendingPaidCount = pendingPaidOrders.length;
  const pendingPaidAmount = pendingPaidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const newEquipRequests = scopedRequests.filter(r => r.status === 'yeni' || r.status === 'nezere_alindi').length;
  const newTickets = scopedTickets.filter(t => t.status === 'yeni' || t.status === 'nezere_alindi').length;
  const inProgressTickets = scopedTickets.filter(t => t.status === 'icradadir' || t.status === 'elaqe_saxlanildi').length;
  const waitingBranchConfirmTickets = scopedTickets.filter(t => t.status === 'filial_tesdiq_gozleyir').length;
  const inTransitOrders = scopedOrders.filter(o => o.status === 'gonderildi').length;

  const lowStockProducts = inventoryProducts.filter(p => !p.isArchived && p.centralStock <= p.minStockAlert);

  // Total branch debt calculation
  const totalAccruedDebt = scopedOrders
    .filter(o => o.type === 'paid' && o.status === 'tehvil_alindi')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const totalPaid = scopedPayments.reduce((sum, p) => sum + p.amount, 0);
  const netRemainingDebt = Math.max(0, totalAccruedDebt - totalPaid);

  return (
    <div className="space-y-6">
      {/* Scope banner if branch is selected */}
      {effectiveBranchId && (
        <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-950">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Göstəricilər aktiv filtr üzrə hesablanır:{' '}
              <strong className="font-bold text-indigo-900">
                {branches.find(b => b.id === effectiveBranchId)?.name || 'Seçilmiş Filial'}
              </strong>
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-indigo-200 text-indigo-700">
            {isManager ? 'Filial Meneceri Rejimi' : 'Direktor Baxışı'}
          </span>
        </div>
      )}

      {/* Primary KPI Grid (All clickable) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {/* 1. Yeni DIY Sifarişləri */}
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              Yeni DIY Sifarişləri
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-nums">{newDiyOrders}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Təsdiq gözləyən dövri materiallar</p>
          </div>
        </button>

        {/* 2. Təsdiq Gözləyən Ödənişli Sifarişlər */}
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              Ödənişli Sifarişlər
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 font-mono-nums">
              {pendingPaidCount}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">
                ({formatAZN(pendingPaidAmount)})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Büdcə xərcli tələblər</p>
          </div>
        </button>

        {/* 3. Yeni Avadanlıq Tələbləri */}
        <button
          onClick={() => onNavigateTab('equipment-requests')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              Avadanlıq Tələbləri
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 font-mono-nums">{newEquipRequests}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Kompüter, proyektor, kartric və s.</p>
          </div>
        </button>

        {/* 4. Yeni Texniki Müraciətlər */}
        <button
          onClick={() => onNavigateTab('tickets')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              Yeni Texniki Müraciət
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 font-mono-nums">{newTickets}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Təmir baxışı gözləyir</p>
          </div>
        </button>

        {/* 5. İcra Prosesində Olan İşlər */}
        <button
          onClick={() => onNavigateTab('tickets')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              İcrada Olan Təmirlər
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 font-mono-nums">{inProgressTickets}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Usta / servis tərəfindən icra olunur</p>
          </div>
        </button>

        {/* 6. Filial Təsdiqini Gözləyən İşlər */}
        <button
          onClick={() => onNavigateTab('tickets')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              Filial Təsdiqi Gözləyən
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 font-mono-nums">
              {waitingBranchConfirmTickets}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Təmir bitib, akt təsdiqi gözlənilir</p>
          </div>
        </button>

        {/* 7. Göndərilmiş (Yolda) Məhsullar */}
        <button
          onClick={() => onNavigateTab('orders')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              Yolda Olan Göndərişlər
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-cyan-700 font-mono-nums">{inTransitOrders}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Filial tərəfindən təhvil alınmalıdır</p>
          </div>
        </button>

        {/* 8. Qalıq Borc */}
        <button
          onClick={() => onNavigateTab('debts')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all text-left cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-900">
              {isManager ? 'Filialın Qalıq Borcu' : 'Filialların Ümumi Borcu'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600 font-mono-nums">
              {formatAZN(netRemainingDebt)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ödənilmiş: {formatAZN(totalPaid)}
            </p>
          </div>
        </button>
      </div>

      {/* Critical Stock Alert Banner for Texnobaba / Director */}
      {!isManager && lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Mərkəzi Anbarda Kritik Qalıq Xəbərdarlığı ({lowStockProducts.length} məhsul)
              </h4>
              <p className="text-[11px] text-amber-700 mt-0.5">
                {lowStockProducts.map(p => `${p.name} (${p.centralStock} ${p.unit})`).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('warehouse')}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            Mərkəzi Anbara Keç
          </button>
        </div>
      )}

      {/* Director Multi-Branch Debt Breakdown Table */}
      {isDirector && !effectiveBranchId && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Filiallar Üzrə Təchizat və Borc Vəziyyəti</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bütün filialların cari sifariş, təhvil və borc müqayisəsi
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('debts')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ətraflı maliyyə cədvəli</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-y border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Filial</th>
                  <th className="py-2.5 px-3 text-center">DIY Sifarişləri</th>
                  <th className="py-2.5 px-3 text-center">Ödənişli Sifariş</th>
                  <th className="py-2.5 px-3 text-right">Cəmi Sifariş Məbləği</th>
                  <th className="py-2.5 px-3 text-right">Ödənilmiş</th>
                  <th className="py-2.5 px-3 text-right">Qalıq Borc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branches
                  .filter(b => !b.isDeleted)
                  .map(br => {
                    const bOrders = inventoryOrders.filter(o => o.branchId === br.id);
                    const bDiy = bOrders.filter(o => o.type === 'diy').length;
                    const bPaid = bOrders.filter(o => o.type === 'paid');
                    const bPaidTotal = bPaid.reduce((s, o) => s + (o.totalAmount || 0), 0);
                    const bPaidPayments = inventoryPayments
                      .filter(p => p.branchId === br.id)
                      .reduce((s, p) => s + p.amount, 0);
                    const bDebt = Math.max(0, bPaidTotal - bPaidPayments);

                    return (
                      <tr key={br.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{br.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{bDiy}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{bPaid.length}</td>
                        <td className="py-2.5 px-3 text-right text-slate-700">{formatAZN(bPaidTotal)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                          {formatAZN(bPaidPayments)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {bDebt > 0 ? (
                            <Tooltip content={`Qalıq filial borcu: ${formatAZN(bDebt)} (Ödənilməsi gözlənilir)`}>
                              <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                                <span>{formatAZN(bDebt)}</span>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip content="Borc yoxdur: Bütün təchizat ödənişləri tam qapadılıb">
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Qapalı</span>
                              </span>
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Activity Audit Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Son İcra və Audit Əməliyyatları</h3>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            Bütün tarixçə
          </button>
        </div>

        <div className="space-y-2">
          {inventoryAuditLogs.slice(0, 5).map(log => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  {log.branchName && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
                      {log.branchName.replace('AREA ', '')}
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400 font-mono">№ {log.entityName || log.entityId}</span>
                </div>
                <p className="text-slate-600 mt-0.5">{log.details}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block font-mono">
                  {new Date(log.timestamp).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{log.user}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
