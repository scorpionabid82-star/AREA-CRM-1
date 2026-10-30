import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Building2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  Truck,
  Check,
  ShieldCheck,
  Tag,
  Clock,
  PackageCheck,
  CheckSquare
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { EquipmentRequest, EquipmentRequestStatus } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface EquipmentRequestsViewProps {
  selectedBranchIdFilter?: string;
}

export const EquipmentRequestsView: React.FC<EquipmentRequestsViewProps> = ({
  selectedBranchIdFilter,
}) => {
  const {
    equipmentRequests,
    branches,
    currentRole,
    currentUser,
    createEquipmentRequest,
    reviewEquipmentRequest,
    dispatchEquipmentRequest,
    deliverEquipmentRequest,
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reviewingRequest, setReviewingRequest] = useState<EquipmentRequest | null>(null);

  // Create form state
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Ofis Təchizatı & Kartric');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState<'asagi' | 'orta' | 'yuksek' | 'tecili'>('orta');
  const [targetBranchId, setTargetBranchId] = useState(() => managerBranchId || branches.find(b => !b.isDeleted)?.id || 'branch-nerimanov');

  // Review form state
  const [reviewStatus, setReviewStatus] = useState<EquipmentRequestStatus>('tesdiqlendi');
  const [approvedQty, setApprovedQty] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  const effectiveBranchId = managerBranchId || activeBranchId;

  const filteredRequests = equipmentRequests.filter(req => {
    if (isManager && req.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && req.branchId !== effectiveBranchId) return false;

    const matchesSearch =
      req.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !reason.trim()) {
      showToast('Zəhmət olmasa tələb olunan avadanlığın adını və səbəbini daxil edin.', 'error');
      return;
    }

    const branch = branches.find(b => b.id === targetBranchId);

    createEquipmentRequest({
      branchId: targetBranchId,
      branchName: branch?.name || 'Filial',
      itemName: itemName.trim(),
      category,
      quantity,
      reason: reason.trim(),
      priority,
      createdBy: currentUser?.fullName || (isManager ? 'Filial Meneceri' : 'İstifadəçi'),
    });

    showToast('Avadanlıq / ehtiyat hissəsi tələbi uğurla Texnobabaya göndərildi!', 'success');
    setShowCreateModal(false);
    setItemName('');
    setReason('');
    setQuantity(1);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;

    if (reviewStatus === 'reddedildi' && !rejectionReason.trim()) {
      showToast('Rədd etmə səbəbini mütləq daxil edin.', 'error');
      return;
    }

    reviewEquipmentRequest(
      reviewingRequest.id,
      reviewStatus,
      reviewStatus === 'qismen_tesdiqlendi' ? approvedQty : reviewingRequest.quantity,
      rejectionReason.trim()
    );

    showToast('Tələb qərarı uğurla qeyd edildi.', 'success');
    setReviewingRequest(null);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'tecili':
        return (
          <Tooltip content="Təcili təchizat: Dərhal təmin olunmalıdır">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <AlertTriangle className="w-3 h-3 text-rose-600 animate-bounce" />
              <span>Təcili</span>
            </span>
          </Tooltip>
        );
      case 'yuksek':
        return (
          <Tooltip content="Yüksək prioritet">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Yüksək</span>
            </span>
          </Tooltip>
        );
      case 'orta':
        return (
          <Tooltip content="Orta prioritet">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span>Orta</span>
            </span>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content="Aşağı prioritet">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-100 border border-slate-200">
              <span>Aşağı</span>
            </span>
          </Tooltip>
        );
    }
  };

  const getStatusBadge = (s: EquipmentRequestStatus) => {
    switch (s) {
      case 'yeni':
        return (
          <Tooltip content="Yeni tələb: Texnobaba baxışı gözlənilir">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Clock className="w-3 h-3 text-indigo-600" />
              <span>Yeni</span>
            </span>
          </Tooltip>
        );
      case 'nezere_alindi':
        return (
          <Tooltip content="Nəzərə alınıb: Siyahıya daxil edilib">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Nəzərə alınıb</span>
            </span>
          </Tooltip>
        );
      case 'tesdiqlendi':
        return (
          <Tooltip content="Tam Təsdiq Edildi: Göndərişə hazırlanır">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Təsdiq</span>
            </span>
          </Tooltip>
        );
      case 'qismen_tesdiqlendi':
        return (
          <Tooltip content="Qismən Təsdiq Edildi: Say düzəlişi ilə">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Qismən</span>
            </span>
          </Tooltip>
        );
      case 'reddedildi':
        return (
          <Tooltip content="Tələb rədd edildi">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3 h-3 text-rose-600" />
              <span>İmtina</span>
            </span>
          </Tooltip>
        );
      case 'gonderildi':
        return (
          <Tooltip content="Göndərildi: Kuryerlə yoldadır">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
              <Truck className="w-3 h-3 text-cyan-600" />
              <span>Yolda</span>
            </span>
          </Tooltip>
        );
      case 'tehvil_alindi':
        return (
          <Tooltip content="Təhvil Alındı: Filial inventarına oturduldu və akt yaradıldı">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <PackageCheck className="w-3 h-3 text-emerald-600" />
              <span>Təhvil</span>
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
            <h2 className="text-lg font-bold text-slate-900">Avadanlıq və Ehtiyat Hissəsi Tələbləri</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Təchizat Sorğuları
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Yeni kompüter, proyektor, printer kartrici və aksessuarlar üzrə rəsmi sifariş və təsdiq prosesi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isManager && (
            <select
              value={effectiveBranchId}
              onChange={e => setActiveBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
            >
              <option value="all">Bütün Filiallar ({equipmentRequests.length})</option>
              {branches
                .filter(b => !b.isDeleted)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Tələb Yarat</span>
          </button>
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
            placeholder="Məhsul adı, tələb nömrəsi və ya səbəb axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="all">Bütün Statuslar</option>
          <option value="yeni">Yeni Tələblər</option>
          <option value="tesdiqlendi">Təsdiqlənmiş</option>
          <option value="qismen_tesdiqlendi">Qismən Təsdiq</option>
          <option value="gonderildi">Yolda Olanlar</option>
          <option value="tehvil_alindi">Təhvil Alınmışlar</option>
          <option value="reddedildi">Rədd Edilmişlər</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">№ / Tarix</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Tələb Olunan Məhsul</th>
                <th className="py-3 px-4 text-center">Tələb Miqdarı</th>
                <th className="py-3 px-4 text-center">Təsdiq Miqdarı</th>
                <th className="py-3 px-4">Prioritet</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Axtarışa uyğun avadanlıq tələbi tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{req.requestNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDateAz(req.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {req.branchName.replace('AREA ', '')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{req.itemName}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{req.reason}</p>
                      {req.rejectionReason && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                          Rədd səbəbi: {req.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 font-mono">
                      {req.quantity}
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono">
                      {req.approvedQuantity !== undefined ? (
                        <span className="text-emerald-700">{req.approvedQuantity}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(req.priority)}</td>
                    <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Texnobaba Review Actions */}
                      {isTexnobaba && (req.status === 'yeni' || req.status === 'nezere_alindi') && (
                        <Tooltip content="Tələbi nəzərdən keçir və qərar ver">
                          <button
                            onClick={() => {
                              setReviewingRequest(req);
                              setReviewStatus('tesdiqlendi');
                              setApprovedQty(req.quantity);
                              setRejectionReason('');
                            }}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {/* Texnobaba Dispatch */}
                      {isTexnobaba &&
                        (req.status === 'tesdiqlendi' || req.status === 'qismen_tesdiqlendi') && (
                          <Tooltip content="Avadanlığı anbardan çıxar və kuryerlə göndər">
                            <button
                              onClick={() => {
                                dispatchEquipmentRequest(req.id);
                                showToast('Avadanlıq kuryerlə filiala göndərildi!', 'success');
                              }}
                              className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        )}

                      {/* Manager Delivery Receipt */}
                      {(isManager || isDirector) && req.status === 'gonderildi' && (
                        <Tooltip content="Avadanlığı filialda təhvil al və akt yarat">
                          <button
                            onClick={() => {
                              deliverEquipmentRequest(req.id);
                              showToast('Avadanlıq təhvil alındı və təhvil aktı arxivləşdirildi!', 'success');
                            }}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <PackageCheck className="w-4 h-4" />
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
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="font-mono text-xs text-indigo-600 font-bold">{reviewingRequest.requestNumber}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Avadanlıq Tələbinə Qərar Verilməsi</h3>
              <p className="text-xs text-slate-500">
                {reviewingRequest.branchName} · {reviewingRequest.itemName} ({reviewingRequest.quantity} ədəd)
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Qərar Seçimi:</label>
                <select
                  value={reviewStatus}
                  onChange={e => setReviewStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="tesdiqlendi">Təsdiq Edildi (Tam miqdar)</option>
                  <option value="qismen_tesdiqlendi">Qismən Təsdiq Edildi (Miqdarı dəyişərək)</option>
                  <option value="nezere_alindi">Nəzərə Alındı (Gözləmədə)</option>
                  <option value="reddedildi">Rədd Edildi (Səbəb ilə)</option>
                </select>
              </div>

              {reviewStatus === 'qismen_tesdiqlendi' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Təsdiq Edilən Say:</label>
                  <input
                    type="number"
                    min={1}
                    max={reviewingRequest.quantity}
                    value={approvedQty}
                    onChange={e => setApprovedQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              )}

              {reviewStatus === 'reddedildi' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">
                    Rədd Səbəbi <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Məsələn: Bu avadanlıq hazırda mərkəzi anbarda tükənib, rüblük təchizat planına salındı..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Qərarı Təsdiqlə
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Yeni Avadanlıq / Ehtiyat Hissəsi Tələbi</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filialın təchizat ehtiyacının qeydiyyata alınması</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tələb Olunan Məhsul / Detal:</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  placeholder="Məs: Proyektor HDMI kabeli, Canon 725 kartrici..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kateqoriya:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Ofis Təchizatı & Kartric">Kartric & Çap Vəsaiti</option>
                    <option value="Kompüter & Aksessuar">Kompüter & Aksessuar</option>
                    <option value="Proyektor & Görüntü">Proyektor & Kabel</option>
                    <option value="Şəbəkə & İnternet">Şəbəkə & Wi-Fi</option>
                    <option value="Mebel & Təsərrüfat">Mebel & Təsərrüfat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Miqdar:</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={quantity}
                    onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Prioritet:</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="asagi">Aşağı</option>
                    <option value="orta">Orta</option>
                    <option value="yuksek">Yüksək</option>
                    <option value="tecili">Təcili</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Filial:</label>
                  <select
                    value={targetBranchId}
                    onChange={e => setTargetBranchId(e.target.value)}
                    disabled={isManager}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white disabled:bg-slate-50"
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
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tələbin Zərurət Səbəbi:</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Məsələn: Dərs otağı 2-də proyektor kabeli qırılıb, dərslərin nümayişi dayanıb..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Tələbi Göndər
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
