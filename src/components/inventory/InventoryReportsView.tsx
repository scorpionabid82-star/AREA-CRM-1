import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Wrench,
  DollarSign,
  Cpu,
  ClipboardList,
  FileCheck2,
  ShoppingCart,
  Layers
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { exportToCSV, formatAZN, formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface InventoryReportsViewProps {
  selectedBranchIdFilter?: string;
}

export const InventoryReportsView: React.FC<InventoryReportsViewProps> = ({
  selectedBranchIdFilter,
}) => {
  const {
    inventoryAuditLogs,
    inventoryOrders,
    technicalTickets,
    equipmentList,
    inventoryPayments,
    branches,
    currentRole,
    currentUser,
    showToast,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  const [activeBranchId, setActiveBranchId] = useState<string>(
    managerBranchId || selectedBranchIdFilter || 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const effectiveBranchId = managerBranchId || activeBranchId;

  const filteredLogs = inventoryAuditLogs.filter(log => {
    if (isManager && log.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && log.branchId !== effectiveBranchId) return false;

    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityName && log.entityName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;

    return matchesSearch && matchesEntity;
  });

  // Calculate high-level KPIs
  const totalOrders = inventoryOrders.length;
  const deliveredDiy = inventoryOrders.filter(o => o.type === 'diy' && o.status === 'tehvil_alindi').length;
  const totalPaidVolume = inventoryOrders.filter(o => o.type === 'paid').reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalTickets = technicalTickets.length;
  const completedTickets = technicalTickets.filter(t => t.status === 'tamamlandi').length;
  const ticketResolutionRate = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 100;

  const operationalEquip = equipmentList.filter(e => e.technicalStatus === 'islek').length;
  const equipHealthRate = equipmentList.length > 0 ? Math.round((operationalEquip / equipmentList.length) * 100) : 100;

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('İxrac etmək üçün qeyd yoxdur.', 'error');
      return;
    }

    const dataToExport = filteredLogs.map(log => ({
      'Tarix': new Date(log.timestamp).toLocaleString('az-AZ'),
      'Filial': log.branchName || 'Ümumi',
      'Modul Bölməsi': log.entityType,
      'Əməliyyat': log.action,
      'Sənəd / Obyekt': log.entityName || log.entityId,
      'Təsvir və Detallar': log.details,
      'İcraçı İstifadəçi': log.user,
    }));

    exportToCSV(`AREA_CRM_Inventar_Audit_Hesabati_${new Date().toISOString().split('T')[0]}`, dataToExport);
    showToast('Audit hesabatı uğurla CSV formatında endirildi!', 'success');
  };

  const getEntityBadge = (type: string) => {
    switch (type) {
      case 'order':
        return (
          <Tooltip content="Sifariş və Göndərişlər Modulu">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShoppingCart className="w-3 h-3 text-indigo-600" />
              <span>Sifariş</span>
            </span>
          </Tooltip>
        );
      case 'ticket':
        return (
          <Tooltip content="Texniki Servis və Təmir Modulu">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              <Wrench className="w-3 h-3 text-amber-600" />
              <span>Texniki</span>
            </span>
          </Tooltip>
        );
      case 'equipment':
        return (
          <Tooltip content="Avadanlıq Reyestri Modulu">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              <Cpu className="w-3 h-3 text-blue-600" />
              <span>Avadanlıq</span>
            </span>
          </Tooltip>
        );
      case 'request':
        return (
          <Tooltip content="Avadanlıq Təchizatı Tələbləri">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              <ClipboardList className="w-3 h-3 text-purple-600" />
              <span>Tələb</span>
            </span>
          </Tooltip>
        );
      case 'debt':
        return (
          <Tooltip content="Filial Borc və Hesablaşmaları">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              <DollarSign className="w-3 h-3 text-rose-600" />
              <span>Borc</span>
            </span>
          </Tooltip>
        );
      case 'act':
        return (
          <Tooltip content="Rəsmi Aktlar və Elektron İmza">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck2 className="w-3 h-3 text-emerald-600" />
              <span>Akt</span>
            </span>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content={`Əməliyyat bölməsi: ${type}`}>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              <Layers className="w-3 h-3 text-slate-500" />
              <span className="capitalize">{type}</span>
            </span>
          </Tooltip>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Analitik Hesabatlar və Əməliyyat Jurnalı</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Audit & Analitika
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mərkəzi anbar və filiallar üzrə dövriyyə göstəriciləri, xərclər və bütün əməliyyatların audit izləri
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isManager && (
            <select
              value={effectiveBranchId}
              onChange={e => setActiveBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
            >
              <option value="all">Bütün Filiallar</option>
              {branches
                .filter(b => !b.isDeleted)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          )}

          <Tooltip content="Audit jurnalını və hesabatları CSV faylı olaraq ixrac et">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>CSV İxrac</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Təhvil Verilmiş DIY Materialları</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono-nums mt-2">
            {deliveredDiy} <span className="text-xs font-normal text-slate-400">partiya</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Tədris proqramı üzrə təminat</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ödənişli Sifariş Həcmi</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono-nums mt-2">
            {formatAZN(totalPaidVolume)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Filial büdcələri dövriyyəsi</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Texniki Problemlərin Həlli</span>
            <Wrench className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono-nums mt-2">
            %{ticketResolutionRate}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {completedTickets} / {totalTickets} müraciət aktla tamamlandı
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Avadanlıqların İşləklik İndeksi</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700 font-mono-nums mt-2">
            %{equipHealthRate}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {operationalEquip} / {equipmentList.length} avadanlıq tam işləkdir
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Əməliyyat, sənəd nömrəsi, icraçı və ya detal axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
        >
          <option value="all">Bütün Əməliyyat Bölmələri</option>
          <option value="order">Sifarişlər</option>
          <option value="ticket">Texniki Müraciətlər</option>
          <option value="equipment">Avadanlıqlar</option>
          <option value="request">Tələblər</option>
          <option value="debt">Borc və Ödənişlər</option>
          <option value="act">Aktlar</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Sistem Əməliyyatları Audit Jurnalı</h3>
          <span className="text-xs text-slate-400">{filteredLogs.length} audit qeydi</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Tarix & Vaxt</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Bölmə</th>
                <th className="py-3 px-4">Əməliyyat</th>
                <th className="py-3 px-4">Sənəd / Obyekt</th>
                <th className="py-3 px-4">Detallar</th>
                <th className="py-3 px-4 text-right">İcraçı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Audit qeydi tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('az-AZ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.branchName ? log.branchName.replace('AREA ', '') : 'Mərkəz'}
                    </td>
                    <td className="py-3 px-4">
                      {getEntityBadge(log.entityType)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-700">
                      {log.entityName || log.entityId}
                    </td>
                    <td className="py-3 px-4 max-w-sm text-slate-600 leading-relaxed">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {log.user}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
