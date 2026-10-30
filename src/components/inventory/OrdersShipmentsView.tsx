import React, { useState } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Boxes,
  Calendar,
  Building2,
  Clock,
  ArrowRight,
  FileSignature,
  Eye,
  CheckSquare,
  Printer,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventoryOrder, InventoryOrderStatus } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface OrdersShipmentsViewProps {
  selectedBranchIdFilter?: string;
  onOpenActModal?: (actId: string) => void;
}

export const OrdersShipmentsView: React.FC<OrdersShipmentsViewProps> = ({
  selectedBranchIdFilter,
  onOpenActModal,
}) => {
  const {
    inventoryOrders,
    branches,
    currentRole,
    currentUser,
    reviewInventoryOrder,
    dispatchInventoryOrder,
    deliverInventoryOrder,
    showToast,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  const [activeBranchId, setActiveBranchId] = useState<string>(
    managerBranchId || selectedBranchIdFilter || 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'diy' | 'paid'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedOrderDetail, setSelectedOrderDetail] = useState<InventoryOrder | null>(null);
  const [reviewingOrder, setReviewingOrder] = useState<InventoryOrder | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'tesdiqlendi' | 'qismen_tesdiqlendi' | 'reddedildi'>('tesdiqlendi');
  const [approvedQuantities, setApprovedQuantities] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState('');

  const effectiveBranchId = managerBranchId || activeBranchId;

  const filteredOrders = inventoryOrders.filter(order => {
    if (isManager && order.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && order.branchId !== effectiveBranchId) return false;

    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.reason && order.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items.some(i => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenReviewModal = (order: InventoryOrder) => {
    setReviewingOrder(order);
    setReviewDecision('tesdiqlendi');
    setRejectionReason('');
    const initialApproved: Record<string, number> = {};
    order.items.forEach(i => {
      initialApproved[i.productId] = i.requestedQty;
    });
    setApprovedQuantities(initialApproved);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingOrder) return;

    if (reviewDecision === 'reddedildi' && !rejectionReason.trim()) {
      showToast('Zəhmət olmasa rədd səbəbini mütləq qeyd edin.', 'error');
      return;
    }

    reviewInventoryOrder(
      reviewingOrder.id,
      reviewDecision,
      reviewDecision === 'qismen_tesdiqlendi' ? approvedQuantities : undefined,
      rejectionReason.trim()
    );

    showToast('Sifariş üzrə qərar uğurla təsdiqləndi!', 'success');
    setReviewingOrder(null);
  };

  const getStatusBadge = (s: InventoryOrderStatus, rejectionNote?: string) => {
    switch (s) {
      case 'yeni':
      case 'baxilir':
        return (
          <Tooltip content="Təsdiq Gözləyir: Texnobaba meneceri tərəfindən baxışdadır">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600 animate-spin-slow" />
              <span>Gözləyir</span>
            </span>
          </Tooltip>
        );
      case 'tesdiqlendi':
        return (
          <Tooltip content="Tam Təsdiq Edilib: Göndərişə hazırdır">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              <span>Təsdiq</span>
            </span>
          </Tooltip>
        );
      case 'qismen_tesdiqlendi':
        return (
          <Tooltip content="Qismən Təsdiq Edilib: Müəyyən miqdarlar düzəlişlə təsdiqlənib">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Qismən</span>
            </span>
          </Tooltip>
        );
      case 'gonderildi':
        return (
          <Tooltip content="Göndərildi: Kuryerlə yoldadır, filial təhvili gözləyir">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Truck className="w-3 h-3 text-cyan-600" />
              <span>Yolda</span>
            </span>
          </Tooltip>
        );
      case 'tehvil_alindi':
        return (
          <Tooltip content="Təhvil Alındı: Filial inventarına daxil edilib və rəsmi akt tərtib olunub">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <PackageCheck className="w-3 h-3 text-emerald-600" />
              <span>Təhvil</span>
            </span>
          </Tooltip>
        );
      case 'reddedildi':
        return (
          <Tooltip content={rejectionNote ? `Rədd Edilib: ${rejectionNote}` : 'Rədd Edilib'}>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3 h-3 text-rose-600" />
              <span>İmtina</span>
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
            <h2 className="text-lg font-bold text-slate-900">Sifarişlər və Göndərişlər Jurnalı</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Loqistika & Təhvil
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            DIY və ödənişli məhsul sifarişlərinin təsdiqi, anbar çıxışı, kuryer göndərişi və filial təhvili
          </p>
        </div>

        {!isManager && (
          <select
            value={effectiveBranchId}
            onChange={e => setActiveBranchId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
          >
            <option value="all">Bütün Filiallar ({inventoryOrders.length})</option>
            {branches
              .filter(b => !b.isDeleted)
              .map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Sifariş № (SİF-...), məhsul adı və ya filial axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hamısı
            </button>
            <button
              onClick={() => setTypeFilter('diy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'diy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DIY
            </button>
            <button
              onClick={() => setTypeFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                typeFilter === 'paid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ödənişli
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
          >
            <option value="all">Bütün Statuslar</option>
            <option value="yeni">Təsdiq Gözləyən</option>
            <option value="tesdiqlendi">Təsdiq Edilmiş</option>
            <option value="gonderildi">Yolda Olan</option>
            <option value="tehvil_alindi">Təhvil Alınmış</option>
            <option value="reddedildi">Rədd Edilmiş</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Sifariş № / Tarix</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Növ</th>
                <th className="py-3 px-4">Tərkib (Məhsullar)</th>
                <th className="py-3 px-4 text-right">Məbləğ</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Axtarışa uyğun sifariş qeydi tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{order.orderNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDateAz(order.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {order.branchName.replace('AREA ', '')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          order.type === 'diy'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {order.type === 'diy' ? 'DIY Materialı' : 'Ödənişli Mal'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="text-[11.5px] text-slate-700 flex items-center justify-between">
                            <span className="truncate pr-2 font-medium">{it.productName}</span>
                            <span className="font-mono text-slate-500 shrink-0">
                              {it.approvedQty !== undefined && it.approvedQty !== it.requestedQty
                                ? `${it.approvedQty} / ${it.requestedQty}`
                                : it.requestedQty}{' '}
                              {it.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      {order.reason && (
                        <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">
                          «{order.reason}»
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {order.type === 'paid' ? formatAZN(order.totalAmount) : 'Təmənnasız'}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(order.status, order.rejectionReason)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Details */}
                      <Tooltip content="Sifarişin tərkibinə və detallarına baxış">
                        <button
                          onClick={() => setSelectedOrderDetail(order)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Tooltip>

                      {/* Texnobaba Review */}
                      {isTexnobaba && (order.status === 'yeni' || order.status === 'baxilir') && (
                        <Tooltip content="Sifarişi təsdiqlə və ya düzəliş et">
                          <button
                            onClick={() => handleOpenReviewModal(order)}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {/* Texnobaba Dispatch */}
                      {isTexnobaba &&
                        (order.status === 'tesdiqlendi' || order.status === 'qismen_tesdiqlendi') && (
                          <Tooltip content="Mərkəzi anbardan çıxarış və kuryerlə göndəriş">
                            <button
                              onClick={() => {
                                dispatchInventoryOrder(order.id);
                                showToast('Məhsullar mərkəzi anbardan çıxarıldı və kuryerlə göndərildi!', 'success');
                              }}
                              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}

                      {/* Branch Manager Delivery Receipt */}
                      {(isManager || isDirector) && order.status === 'gonderildi' && (
                        <Tooltip content="Məhsulları filial inventarına təhvil al">
                          <button
                            onClick={() => {
                              deliverInventoryOrder(order.id);
                              showToast('Məhsullar filial inventarına təhvil alındı və rəsmi akt generasiya olundu!', 'success');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <PackageCheck className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {/* View Act */}
                      {order.generatedActId && onOpenActModal && (
                        <Tooltip content="Rəsmi təhvil-təslim aktını A4 çap et">
                          <button
                            onClick={() => onOpenActModal(order.generatedActId!)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal for Texnobaba */}
      {reviewingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="font-mono text-xs text-indigo-600 font-bold">{reviewingOrder.orderNumber}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Sifarişin Nəzərdən Keçirilməsi və Təsdiqi</h3>
              <p className="text-xs text-slate-500">{reviewingOrder.branchName}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Qərar:</label>
                <select
                  value={reviewDecision}
                  onChange={e => setReviewDecision(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="tesdiqlendi">Sifarişi Tam Təsdiq Et</option>
                  <option value="qismen_tesdiqlendi">Qismən Təsdiq Et (Miqdarları dəyişərək)</option>
                  <option value="reddedildi">Sifarişi Rədd Et (Səbəb ilə)</option>
                </select>
              </div>

              {/* Items Table for adjusting approved quantities */}
              {reviewDecision !== 'reddedildi' && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Məhsul</th>
                        <th className="py-2 px-3 text-center">İstənilən</th>
                        <th className="py-2 px-3 text-right">Təsdiq Miqdarı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reviewingOrder.items.map(item => (
                        <tr key={item.productId}>
                          <td className="py-2 px-3 font-medium text-slate-800">{item.productName}</td>
                          <td className="py-2 px-3 text-center font-mono">{item.requestedQty} {item.unit}</td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              max={item.requestedQty}
                              disabled={reviewDecision === 'tesdiqlendi'}
                              value={approvedQuantities[item.productId] ?? item.requestedQty}
                              onChange={e =>
                                setApprovedQuantities({
                                  ...approvedQuantities,
                                  [item.productId]: Math.max(0, parseInt(e.target.value) || 0),
                                })
                              }
                              className="w-16 p-1 text-center font-mono font-bold rounded border border-slate-200"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {reviewDecision === 'reddedildi' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rədd Səbəbi *</label>
                  <textarea
                    required
                    rows={2}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Məs: Filialın aylıq kvotası tükənib və ya anbar qalığı çatışmır..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingOrder(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Qərarı Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-600 font-bold">{selectedOrderDetail.orderNumber}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedOrderDetail.branchName}</h3>
                <p className="text-xs text-slate-500">Tarix: {formatDateAz(selectedOrderDetail.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Növ:</strong> {selectedOrderDetail.type === 'diy' ? 'DIY Materialı' : 'Ödənişli Mal'}</p>
                {selectedOrderDetail.type === 'paid' && (
                  <p><strong>Ümumi Məbləğ:</strong> {formatAZN(selectedOrderDetail.totalAmount)}</p>
                )}
                {selectedOrderDetail.reason && (
                  <p><strong>Sifariş Səbəbi:</strong> {selectedOrderDetail.reason}</p>
                )}
                {selectedOrderDetail.rejectionReason && (
                  <p className="text-rose-600"><strong>Rədd Səbəbi:</strong> {selectedOrderDetail.rejectionReason}</p>
                )}
              </div>

              {/* Items List */}
              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Sifariş Olunmuş Məhsullar:</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Məhsul</th>
                        <th className="py-2 px-3 text-center">İstənilən</th>
                        <th className="py-2 px-3 text-center">Təsdiq</th>
                        {selectedOrderDetail.type === 'paid' && <th className="py-2 px-3 text-right">Qiymət</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrderDetail.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                          <td className="py-2 px-3 text-center font-mono">{it.requestedQty} {it.unit}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700">{it.approvedQty} {it.unit}</td>
                          {selectedOrderDetail.type === 'paid' && (
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatAZN(it.unitPrice)}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status History Timeline */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">Sifarişin Hərəkət Tarixçəsi:</span>
                <div className="space-y-2 border-l-2 border-indigo-400 ml-2 pl-3">
                  {selectedOrderDetail.statusHistory.map((step, idx) => (
                    <div key={idx} className="text-[11px] relative">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 absolute -left-[17px] top-1" />
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="capitalize">{step.status.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400 font-mono">{formatDateAz(step.date)}</span>
                      </div>
                      <p className="text-slate-500">Qeyd edən: {step.user}</p>
                      {step.note && <p className="text-slate-700 italic mt-0.5">«{step.note}»</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
