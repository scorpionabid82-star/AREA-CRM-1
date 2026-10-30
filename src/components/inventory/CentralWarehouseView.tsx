import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Calendar,
  CheckCircle2,
  Tag,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventoryProduct } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

export const CentralWarehouseView: React.FC = () => {
  const {
    inventoryProducts,
    warehouseLogs,
    currentRole,
    currentUser,
    addInventoryProduct,
    updateInventoryProduct,
    adjustCentralStock,
    showToast,
  } = useCrm();

  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isDirector = currentRole === 'direktor';
  const canManage = isTexnobaba; // Only Texnobaba can edit central stock as per prompt

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'diy' | 'paid'>('all');
  const [selectedProductForLog, setSelectedProductForLog] = useState<InventoryProduct | null>(null);

  // Stock Adjustment Modal
  const [adjustingProduct, setAdjustingProduct] = useState<InventoryProduct | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'daxil_olma' | 'cixis'>('daxil_olma');

  // New Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('DIY Material');
  const [newProdType, setNewProdType] = useState<'diy' | 'paid'>('diy');
  const [newProdUnit, setNewProdUnit] = useState('ədəd');
  const [newProdPrice, setNewProdPrice] = useState(0);
  const [newProdStock, setNewProdStock] = useState(0);
  const [newProdMinStock, setNewProdMinStock] = useState(5);
  const [newProdDesc, setNewProdDesc] = useState('');

  const filteredProducts = inventoryProducts.filter(p => {
    if (p.isArchived) return false;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (adjustAmount <= 0) {
      showToast('Miqdar 0-dan böyük olmalıdır.', 'error');
      return;
    }
    if (!adjustReason.trim()) {
      showToast('Zəhmət olmasa düzəliş səbəbini mütləq daxil edin.', 'error');
      return;
    }

    const change = adjustType === 'daxil_olma' ? adjustAmount : -adjustAmount;
    if (adjustType === 'cixis' && adjustingProduct.centralStock < adjustAmount) {
      showToast('Anbarda çıxış üçün kifayət qədər qalıq yoxdur.', 'error');
      return;
    }

    adjustCentralStock(adjustingProduct.id, change, adjustReason.trim());
    showToast(`«${adjustingProduct.name}» anbar qalığı uğurla yeniləndi.`, 'success');
    setAdjustingProduct(null);
    setAdjustAmount(0);
    setAdjustReason('');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      showToast('Məhsul adını daxil edin.', 'error');
      return;
    }

    addInventoryProduct({
      name: newProdName.trim(),
      category: newProdCategory,
      type: newProdType,
      unit: newProdUnit,
      unitPrice: newProdType === 'paid' ? Number(newProdPrice) : 0,
      centralStock: Number(newProdStock),
      minStockAlert: Number(newProdMinStock),
      description: newProdDesc.trim(),
    });

    showToast(`«${newProdName.trim()}» mərkəzi anbar reyestrinə əlavə edildi!`, 'success');
    setShowAddModal(false);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdStock(0);
    setNewProdPrice(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Texnobaba Mərkəzi Anbarı</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Qlobal Stok
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bütün filialların təchizatı üçün mərkəzdə saxlanılan cari qalıqlar və hərəkət jurnalı
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Məhsul Qeydiyyatı</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Məhsul adı və ya kateqoriya axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bütün Məhsullar
          </button>
          <button
            onClick={() => setTypeFilter('diy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'diy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            DIY Materialları
          </button>
          <button
            onClick={() => setTypeFilter('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'paid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ödənişli Mallar
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Məhsul Adı</th>
                <th className="py-3 px-4">Kateqoriya</th>
                <th className="py-3 px-4">Növ</th>
                <th className="py-3 px-4 text-center">Ölçü Vahidi</th>
                <th className="py-3 px-4 text-right">Vahid Qiyməti</th>
                <th className="py-3 px-4 text-center">Cari Anbar Qalığı</th>
                <th className="py-3 px-4 text-center">Təhlükəsizlik Həddi</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(product => {
                const isLow = product.centralStock <= product.minStockAlert;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{product.name}</p>
                      {product.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs">{product.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{product.category}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          product.type === 'diy'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {product.type === 'diy' ? 'DIY Tədris' : 'Ödənişli'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 capitalize">{product.unit}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {product.type === 'paid' ? formatAZN(product.unitPrice) : 'Təmənnasız'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Tooltip
                        content={
                          product.centralStock === 0
                            ? 'Qalıq tükənib! Təcili təchizat lazımdır'
                            : isLow
                            ? `Təhlükəsizlik həddindən aşağıdır! (Minimum hədd: ${product.minStockAlert} ${product.unit})`
                            : 'Anbarda yetərli qalıq mövcuddur'
                        }
                      >
                        <span
                          className={`text-xs font-black font-mono px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${
                            product.centralStock > 0
                              ? isLow
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-50 text-rose-700 border border-rose-300'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          <span>
                            {product.centralStock} {product.unit}
                          </span>
                        </span>
                      </Tooltip>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {product.minStockAlert} {product.unit}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Tooltip content="Hərəkət jurnalı və partiya tarixçəsinə bax">
                        <button
                          onClick={() => setSelectedProductForLog(product)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </Tooltip>

                      {canManage && (
                        <Tooltip content="Mərkəzi anbar qalığını tənzimlə (Daxilolma / Çıxış)">
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setAdjustAmount(0);
                              setAdjustReason('');
                              setAdjustType('daxil_olma');
                            }}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
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

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Mərkəzi Anbar Qalığı Düzəlişi</h3>
              <p className="text-xs text-slate-500 mt-0.5">{adjustingProduct.name}</p>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Cari Anbar Qalığı:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {adjustingProduct.centralStock} {adjustingProduct.unit}
                </span>
              </div>

              {/* Adjustment direction */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('daxil_olma')}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    adjustType === 'daxil_olma'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Daxil Olma (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('cixis')}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    adjustType === 'cixis'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Çıxış (-)</span>
                </button>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Miqdar ({adjustingProduct.unit}):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustAmount || ''}
                  onChange={e => setAdjustAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="Məsələn: 20"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Reason (Mütləq) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Düzəlişin Rəsmi Səbəbi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Məs: İstehsalçıdan 50 ədəd yeni partiya qəbulu, yaxud inventar sayım fərqi..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Təsdiq Et və Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Viewer Modal */}
      {selectedProductForLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Mərkəzi Anbar Hərəkətləri Tarixçəsi</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedProductForLog.name}</p>
              </div>
              <button
                onClick={() => setSelectedProductForLog(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {warehouseLogs.filter(l => l.productId === selectedProductForLog.id).length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Bu məhsul üzrə hərəkət qeydi tapılmadı.
                </div>
              ) : (
                warehouseLogs
                  .filter(l => l.productId === selectedProductForLog.id)
                  .map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-black ${
                              log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount} {selectedProductForLog.unit}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Əvvəl: {log.previousStock} ➔ Sonra: {log.newStock})
                          </span>
                        </div>
                        <p className="text-slate-700 mt-1 font-medium">{log.reason}</p>
                      </div>

                      <div className="text-right text-[10px] text-slate-400 shrink-0">
                        <span className="font-mono block">{formatDateAz(log.performedAt)}</span>
                        <span>{log.performedBy}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Product Registration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Mərkəzi Anbara Yeni Məhsul Daxil Etmə</h3>
              <p className="text-xs text-slate-500 mt-0.5">Məhsul reyestrinə yeni vahid əlavə olunması</p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Məhsulun Tam Adı:</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder="Məs: Arduino Uno R3 Başlanğıc Paketi"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Növ:</label>
                  <select
                    value={newProdType}
                    onChange={e => setNewProdType(e.target.value as 'diy' | 'paid')}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="diy">DIY Tədris Materialı</option>
                    <option value="paid">Ödənişli Təchizat Malı</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kateqoriya:</label>
                  <input
                    type="text"
                    required
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                    placeholder="Məs: Elektronika"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ölçü Vahidi:</label>
                  <input
                    type="text"
                    required
                    value={newProdUnit}
                    onChange={e => setNewProdUnit(e.target.value)}
                    placeholder="ədəd, dəst, metr"
                    className="w-full p-2 rounded-xl border border-slate-200"
                  />
                </div>

                {newProdType === 'paid' ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Qiymət (AZN):</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProdPrice}
                      onChange={e => setNewProdPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-400">Qiymət:</label>
                    <input
                      type="text"
                      disabled
                      value="Təmənnasız"
                      className="w-full p-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-center"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">İlkin Qalıq:</label>
                  <input
                    type="number"
                    min={0}
                    value={newProdStock}
                    onChange={e => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Təhlükəsizlik Minimum Həddi:</label>
                <input
                  type="number"
                  min={1}
                  value={newProdMinStock}
                  onChange={e => setNewProdMinStock(parseInt(e.target.value) || 5)}
                  className="w-full p-2 rounded-xl border border-slate-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Təsvir və Qeyd:</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={e => setNewProdDesc(e.target.value)}
                  placeholder="Materialın texniki xüsusiyyətləri..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
