import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  History,
  Edit2,
  Boxes,
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { BranchInventoryItem } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface BranchInventoriesViewProps {
  selectedBranchIdFilter?: string;
}

export const BranchInventoriesView: React.FC<BranchInventoriesViewProps> = ({
  selectedBranchIdFilter,
}) => {
  const {
    branchInventories,
    branches,
    currentRole,
    currentUser,
    adjustBranchInventory,
    showToast,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  const [activeBranchId, setActiveBranchId] = useState<string>(
    managerBranchId || selectedBranchIdFilter || 'branch-nerimanov'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingItem, setAdjustingItem] = useState<BranchInventoryItem | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<BranchInventoryItem | null>(null);

  // Filter items by branch
  const effectiveBranchId = managerBranchId || activeBranchId;
  const branchItems = branchInventories.filter(item => item.branchId === effectiveBranchId);

  const filteredItems = branchItems.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBranch = branches.find(b => b.id === effectiveBranchId);

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    if (newStockInput < 0) {
      showToast('Qalıq sayı mənfi ola bilməz.', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('Zəhmət olmasa manual inventar düzəlişinin səbəbini mütləq qeyd edin.', 'error');
      return;
    }

    adjustBranchInventory(
      adjustingItem.branchId,
      adjustingItem.productId,
      newStockInput,
      adjustReason.trim()
    );

    showToast(`«${adjustingItem.productName}» filial inventar qalığı yeniləndi. Mərkəzi anbar toxunulmaz qaldı.`, 'success');
    setAdjustingItem(null);
    setAdjustReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Filial İnventarları</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Lokal İnventar
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Hər filialın daxilində olan tədris materialları, cari qalıqlar və lokal sayım düzəlişləri
          </p>
        </div>

        {/* Branch Selector for Director / Texnobaba */}
        {!isManager && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <select
              value={effectiveBranchId}
              onChange={e => setActiveBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {branches
                .filter(b => !b.isDeleted)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* Isolation Rule Notice */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>İnventar Təcrid Qaydası:</strong> Filialın manual inventar sayımı və düzəlişi <em>mərkəzi anbar qalığına toxunmur</em>. Filial meneceri faktiki fiziki sayıma əsasən öz filial inventarını tənzimləyə bilər, lakin hər düzəliş səbəblə birlikdə qeydiyyat tarixinə yazılır.
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Məhsul adı və ya kateqoriyaya görə axtarın..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Branch Items Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">{activeBranch?.name || 'Filial'} İnventar Siyahısı</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Cəmi: {filteredItems.length} məhsul</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Məhsul Adı</th>
                <th className="py-3 px-4">Kateqoriya</th>
                <th className="py-3 px-4 text-center">Ölçü Vahidi</th>
                <th className="py-3 px-4 text-center">Cari Filial Qalığı</th>
                <th className="py-3 px-4">Son Dəyişiklik Tarixi</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Bu filial üçün hələ inventar qeydi mövcud deyil.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.productName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.category}</td>
                    <td className="py-3 px-4 text-center text-slate-700 capitalize">{item.unit}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-black font-mono px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {item.currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {formatDateAz(item.lastUpdated)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Tooltip content="Sayım və düzəliş tarixçəsinə bax">
                        <button
                          onClick={() => setSelectedHistoryItem(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </Tooltip>

                      {/* Manual correction allowed for manager (their branch) or texnobaba/director */}
                      <Tooltip content="Faktiki inventar sayımı və düzəlişi et">
                        <button
                          onClick={() => {
                            setAdjustingItem(item);
                            setNewStockInput(item.currentStock);
                            setAdjustReason('');
                          }}
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Filial İnventarı Manual Düzəlişi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {adjustingItem.branchName} · {adjustingItem.productName}
              </p>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Sistemdə Qeydiyyatda Olan Qalıq:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {adjustingItem.currentStock} {adjustingItem.unit}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Faktiki Sayılmış Yeni Qalıq ({adjustingItem.unit}):
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newStockInput}
                  onChange={e => setNewStockInput(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Düzəlişin Rəsmi Səbəbi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Məs: Aylıq fiziki inventarizasiya sayımı, dərslərdə istifadə olunan material silgisi..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Filial Qalığını Yenilə
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustments History Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">İnventar Sayım və Düzəliş Tarixçəsi</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedHistoryItem.productName}</p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {selectedHistoryItem.adjustmentsHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Bu məhsul üzrə manual düzəliş qeydi yoxdur.
                </div>
              ) : (
                selectedHistoryItem.adjustmentsHistory.map(adj => (
                  <div
                    key={adj.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">
                        {adj.previousStock} ➔ {adj.newStock} {selectedHistoryItem.unit}{' '}
                        <span className={adj.difference >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          ({adj.difference >= 0 ? `+${adj.difference}` : adj.difference})
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{formatDateAz(adj.date)}</span>
                    </div>
                    <p className="text-slate-600 font-medium">{adj.reason}</p>
                    <p className="text-[10px] text-slate-400">İcraçı: {adj.user}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
