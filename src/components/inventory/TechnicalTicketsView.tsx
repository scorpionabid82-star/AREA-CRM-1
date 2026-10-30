import React, { useState } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Building2,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  PhoneCall,
  Check,
  RotateCcw,
  FileSignature,
  FileText,
  Monitor,
  Tag,
  Eye,
  CheckSquare,
  Printer
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { TechnicalTicket, TechnicalTicketStatus } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface TechnicalTicketsViewProps {
  selectedBranchIdFilter?: string;
  onOpenActModal?: (actId: string) => void;
}

export const TechnicalTicketsView: React.FC<TechnicalTicketsViewProps> = ({
  selectedBranchIdFilter,
  onOpenActModal,
}) => {
  const {
    technicalTickets,
    equipmentList,
    branches,
    currentRole,
    currentUser,
    createTechnicalTicket,
    updateTicketProgress,
    confirmTicketResolution,
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
  const [managingTicket, setManagingTicket] = useState<TechnicalTicket | null>(null);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<TechnicalTicket | null>(null);

  // New ticket state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isNonInventory, setIsNonInventory] = useState(false);
  const [selectedEquipId, setSelectedEquipId] = useState('');
  const [priority, setPriority] = useState<'asagi' | 'orta' | 'yuksek' | 'tecili'>('orta');
  const [targetBranchId, setTargetBranchId] = useState(() => managerBranchId || branches.find(b => !b.isDeleted)?.id || 'branch-nerimanov');

  // Texnobaba management state
  const [actionStep, setActionStep] = useState<TechnicalTicketStatus>('icradadir');
  const [contactNote, setContactNote] = useState('');
  const [workDoneText, setWorkDoneText] = useState('');
  const [repairResultText, setRepairResultText] = useState('');

  // Branch Confirmation state
  const [confirmingTicket, setConfirmingTicket] = useState<TechnicalTicket | null>(null);
  const [branchNote, setBranchNote] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const effectiveBranchId = managerBranchId || activeBranchId;

  const filteredTickets = technicalTickets.filter(ticket => {
    if (isManager && ticket.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && ticket.branchId !== effectiveBranchId) return false;

    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const branchEquipment = equipmentList.filter(
    e => e.branchId === (isManager ? managerBranchId : targetBranchId)
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Zəhmət olmasa problemin başlığını və ətraflı təsvirini qeyd edin.', 'error');
      return;
    }

    const branch = branches.find(b => b.id === targetBranchId);
    const equip = !isNonInventory && selectedEquipId ? equipmentList.find(e => e.id === selectedEquipId) : null;

    createTechnicalTicket({
      branchId: targetBranchId,
      branchName: branch?.name || 'Filial',
      isNonInventory,
      equipmentId: equip?.id,
      equipmentName: equip ? `${equip.name} (${equip.model})` : undefined,
      title: title.trim(),
      description: description.trim(),
      priority,
      createdBy: currentUser?.fullName || (isManager ? 'Filial Meneceri' : 'İstifadəçi'),
    });

    showToast('Texniki müraciət uğurla yaradıldı və Texnobaba növbəsinə əlavə olundu!', 'success');
    setShowCreateModal(false);
    setTitle('');
    setDescription('');
    setIsNonInventory(false);
    setSelectedEquipId('');
  };

  const handleProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingTicket) return;

    updateTicketProgress(managingTicket.id, {
      status: actionStep,
      contactedBranch: actionStep === 'elaqe_saxlanildi' ? true : undefined,
      contactNote: contactNote.trim() || undefined,
      workDone: workDoneText.trim() || undefined,
      repairResult: repairResultText.trim() || undefined,
    });

    showToast('Müraciətin icra statusu uğurla yeniləndi.', 'success');
    setManagingTicket(null);
    setWorkDoneText('');
    setRepairResultText('');
    setContactNote('');
  };

  const handleBranchConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingTicket) return;

    if (isRejecting) {
      if (!branchNote.trim()) {
        showToast('Zəhmət olmasa problemin niyə həll olunmadığını izah edin.', 'error');
        return;
      }
      confirmTicketResolution(confirmingTicket.id, false, branchNote.trim());
      showToast('Müraciət təkrar icra üçün Texnobabaya geri qaytarıldı.', 'info');
    } else {
      confirmTicketResolution(confirmingTicket.id, true, branchNote.trim());
      showToast('Təmir filial tərəfindən rəsmən qəbul edildi və Texniki İcra Aktı generasiya olundu!', 'success');
    }

    setConfirmingTicket(null);
    setBranchNote('');
    setIsRejecting(false);
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'tecili':
        return (
          <Tooltip content="Təcili prioritet: Dərhal müdaxilə tələb olunur">
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

  const getStatusBadge = (s: TechnicalTicketStatus) => {
    switch (s) {
      case 'yeni':
        return (
          <Tooltip content="Yeni qeydiyyata alınmış müraciət">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-3 h-3" />
              <span>Yeni</span>
            </span>
          </Tooltip>
        );
      case 'nezere_alindi':
        return (
          <Tooltip content="Nəzərə alınıb: Texnobaba növbəsinə daxil edilib">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Clock className="w-3 h-3" />
              <span>Nəzərə alındı</span>
            </span>
          </Tooltip>
        );
      case 'elaqe_saxlanildi':
        return (
          <Tooltip content="Filialla əlaqə saxlanılıb və detallar dəqiqləşdirilib">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <PhoneCall className="w-3 h-3" />
              <span>Əlaqə</span>
            </span>
          </Tooltip>
        );
      case 'icradadir':
        return (
          <Tooltip content="Təmir və bərpa prosesi icradadır">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Wrench className="w-3 h-3 text-indigo-600" />
              <span>İcradadır</span>
            </span>
          </Tooltip>
        );
      case 'temir_olundu':
      case 'filial_tesdiq_gozleyir':
        return (
          <Tooltip content="Təmir bitib: Filial menecerinin sınaqdan keçirib təsdiqləməsi gözlənilir">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-amber-700" />
              <span>Təsdiq gözləyir</span>
            </span>
          </Tooltip>
        );
      case 'tamamlandi':
        return (
          <Tooltip content="Rəsmi İcra Aktı ilə təsdiqlənərək tamamlandı">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Tamamlandı</span>
            </span>
          </Tooltip>
        );
      case 'geri_qaytarildi':
        return (
          <Tooltip content="Filial narazılıq bildirərək təkrar icraya qaytardı">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <RotateCcw className="w-3 h-3 text-rose-600" />
              <span>Qaytarıldı</span>
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
            <h2 className="text-lg font-bold text-slate-900">Texniki Müraciətlər və Təmir Paneli</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Texniki Dəstək
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Avadanlıq nasazlıqları, sınmış pəncərə, qapı, elektrik və digər təmir proseslərinin izlənməsi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isManager && (
            <select
              value={effectiveBranchId}
              onChange={e => setActiveBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
            >
              <option value="all">Bütün Filiallar ({technicalTickets.length})</option>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Texniki Müraciət Yarat</span>
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
            placeholder="Müraciət başlığı, nömrəsi (TK-...) və ya təsvir..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
        >
          <option value="all">Bütün Statuslar</option>
          <option value="yeni">Yeni Müraciətlər</option>
          <option value="icradadir">İcrada Olanlar</option>
          <option value="filial_tesdiq_gozleyir">Filial Təsdiqi Gözləyənlər</option>
          <option value="tamamlandi">Tamamlanmışlar</option>
          <option value="geri_qaytarildi">Geri Qaytarılanlar</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">№ / Tarix</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Mövzu & Avadanlıq</th>
                <th className="py-3 px-4">Təsvir</th>
                <th className="py-3 px-4">Prioritet</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Axtarışa uyğun texniki müraciət tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{ticket.ticketNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDateAz(ticket.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {ticket.branchName.replace('AREA ', '')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{ticket.title}</p>
                      {ticket.isNonInventory ? (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          İnventarda Olmayan Problem (Qapı/Pəncərə/Elektrik)
                        </span>
                      ) : (
                        <span className="inline-block mt-0.5 text-[10px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                          {ticket.equipmentName || ticket.equipmentId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-600 line-clamp-2">{ticket.description}</p>
                      {ticket.workDone && (
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5 line-clamp-1">
                          Görülən iş: {ticket.workDone}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">{getPriorityBadge(ticket.priority)}</td>
                    <td className="py-3 px-4">{getStatusBadge(ticket.status)}</td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Details */}
                      <Tooltip content="Müraciətin təsvirinə və status tarixinə bax">
                        <button
                          onClick={() => setSelectedTicketDetail(ticket)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Tooltip>

                      {/* Texnobaba Manage Button */}
                      {isTexnobaba && ticket.status !== 'tamamlandi' && (
                        <Tooltip content="Təmir prosesini və statusunu idarə et">
                          <button
                            onClick={() => {
                              setManagingTicket(ticket);
                              setActionStep(
                                ticket.status === 'yeni'
                                  ? 'nezere_alindi'
                                  : ticket.status === 'nezere_alindi'
                                  ? 'elaqe_saxlanildi'
                                  : ticket.status === 'elaqe_saxlanildi'
                                  ? 'icradadir'
                                  : 'filial_tesdiq_gozleyir'
                              );
                              setWorkDoneText(ticket.workDone || '');
                              setRepairResultText(ticket.repairResult || '');
                              setContactNote(ticket.contactNote || '');
                            }}
                            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {/* Branch Manager Confirmation Actions */}
                      {(isManager || isDirector) && ticket.status === 'filial_tesdiq_gozleyir' && (
                        <Tooltip content="Görülmüş təmir işini yoxla və təsdiq et / geri qaytar">
                          <button
                            onClick={() => {
                              setConfirmingTicket(ticket);
                              setBranchNote('');
                              setIsRejecting(false);
                            }}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}

                      {/* View Act if generated */}
                      {ticket.generatedActId && onOpenActModal && (
                        <Tooltip content="Rəsmi texniki icra aktını A4 çap et">
                          <button
                            onClick={() => onOpenActModal(ticket.generatedActId!)}
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

      {/* Ticket Details & Timeline Modal */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-rose-600">{selectedTicketDetail.ticketNumber}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedTicketDetail.title}</h3>
                <p className="text-xs text-slate-500">{selectedTicketDetail.branchName}</p>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <p className="text-slate-700">
                  <strong className="text-slate-900">Problem Təsviri:</strong> {selectedTicketDetail.description}
                </p>
                {selectedTicketDetail.equipmentName && (
                  <p className="text-slate-700">
                    <strong className="text-slate-900">Avadanlıq:</strong> {selectedTicketDetail.equipmentName}
                  </p>
                )}
                {selectedTicketDetail.workDone && (
                  <p className="text-emerald-800 pt-1 border-t border-slate-200">
                    <strong>Görülən İş:</strong> {selectedTicketDetail.workDone}
                  </p>
                )}
                {selectedTicketDetail.repairResult && (
                  <p className="text-emerald-800">
                    <strong>Təmir Nəticəsi:</strong> {selectedTicketDetail.repairResult}
                  </p>
                )}
                {selectedTicketDetail.branchConfirmationNote && (
                  <p className="text-indigo-800 pt-1 border-t border-slate-200">
                    <strong>Filial Təsdiq Rəyi:</strong> {selectedTicketDetail.branchConfirmationNote}
                  </p>
                )}
              </div>

              {/* Status History Timeline */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">Müraciətin Tam İcra Tarixçəsi:</span>
                <div className="space-y-2 border-l-2 border-indigo-400 ml-2 pl-3">
                  {selectedTicketDetail.statusHistory.map((step, idx) => (
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

      {/* Texnobaba Progress Update Modal */}
      {managingTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="font-mono text-xs text-rose-600 font-bold">{managingTicket.ticketNumber}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Müraciət Üzrə İcra Qeydi</h3>
              <p className="text-xs text-slate-500">{managingTicket.title}</p>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Yeni İcra Mərhələsi:</label>
                <select
                  value={actionStep}
                  onChange={e => setActionStep(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  <option value="nezere_alindi">Nəzərə Alındı</option>
                  <option value="elaqe_saxlanildi">Filialla Əlaqə Saxlanıldı</option>
                  <option value="icradadir">İcradadır (Usta / Servis təhkim olundu)</option>
                  <option value="filial_tesdiq_gozleyir">Təmir Edildi (Filialın təsdiqinə göndər)</option>
                </select>
              </div>

              {actionStep === 'elaqe_saxlanildi' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Əlaqə və Danışıq Qeydi:</label>
                  <textarea
                    rows={2}
                    value={contactNote}
                    onChange={e => setContactNote(e.target.value)}
                    placeholder="Filial meneceri ilə danışıldı, cihazın baxış saatı təyin edildi..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              )}

              {(actionStep === 'icradadir' || actionStep === 'filial_tesdiq_gozleyir') && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Görülən İşlərin Təsviri:</label>
                    <textarea
                      required={actionStep === 'filial_tesdiq_gozleyir'}
                      rows={2}
                      value={workDoneText}
                      onChange={e => setWorkDoneText(e.target.value)}
                      placeholder="Məs: Şəbəkə kabeli dəyişdirildi, yeni qoruyucu avtomat quraşdırıldı..."
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Təmir Nəticəsi və Test Yoxlanışı:</label>
                    <textarea
                      required={actionStep === 'filial_tesdiq_gozleyir'}
                      rows={2}
                      value={repairResultText}
                      onChange={e => setRepairResultText(e.target.value)}
                      placeholder="Məs: Cihaz 2 saat yoxlanıldı, qızma və nasazlıq müşahidə olunmadı..."
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManagingTicket(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Statusu Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Confirmation Modal */}
      {confirmingTicket && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="font-mono text-xs text-indigo-600 font-bold">{confirmingTicket.ticketNumber}</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">Təmir Nəticəsinin Təsdiqi və Aktlaşdırılması</h3>
              <p className="text-xs text-slate-500">{confirmingTicket.title}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-700">
                <strong>Texnobaba tərəfindən görülən iş:</strong> {confirmingTicket.workDone}
              </p>
              <p className="text-slate-700">
                <strong>Nəticə:</strong> {confirmingTicket.repairResult}
              </p>
            </div>

            <form onSubmit={handleBranchConfirmSubmit} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="confirmDecision"
                    checked={!isRejecting}
                    onChange={() => setIsRejecting(false)}
                    className="text-emerald-600"
                  />
                  <span className="font-bold text-emerald-700">Təmir Nəticəsini Qəbul Et (Akt Yaransın)</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="confirmDecision"
                    checked={isRejecting}
                    onChange={() => setIsRejecting(true)}
                    className="text-rose-600"
                  />
                  <span className="font-bold text-rose-700">Qəbul Etmə (Problem davam edir)</span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {isRejecting ? 'Geri Qaytarma Səbəbi *' : 'Filial Rəyi / Təsdiq Qeydi:'}
                </label>
                <textarea
                  required={isRejecting}
                  rows={2}
                  value={branchNote}
                  onChange={e => setBranchNote(e.target.value)}
                  placeholder={
                    isRejecting
                      ? 'Problem hələ də davam edir, məsələn...'
                      : 'İş tam və keyfiyyətlə təhvil alındı.'
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingTicket(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-semibold shadow-xs cursor-pointer ${
                    isRejecting ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isRejecting ? 'Geri Qaytar' : 'Aktı Təsdiqlə və Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Yeni Texniki Müraciət Yarat</h3>
              <p className="text-xs text-slate-500 mt-0.5">Avadanlıq və ya təsərrüfat qüsurunun qeydiyyatı</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Müraciətin Qısa Başlığı:</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Məs: Proyektorun fan səsi və lampanın sönməsi"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              {/* Inventory vs Non-Inventory selector */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="invType"
                      checked={!isNonInventory}
                      onChange={() => setIsNonInventory(false)}
                    />
                    <span className="font-semibold text-slate-800">Qeydiyyatda Olan Avadanlıq</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="invType"
                      checked={isNonInventory}
                      onChange={() => setIsNonInventory(true)}
                    />
                    <span className="font-semibold text-slate-800">İnventarda Olmayan Problem</span>
                  </label>
                </div>

                {!isNonInventory ? (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-bold text-slate-600">Avadanlığı Seçin:</label>
                    <select
                      value={selectedEquipId}
                      onChange={e => setSelectedEquipId(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    >
                      <option value="">-- Avadanlıq siyahısından seçin --</option>
                      {branchEquipment.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.id} · {e.name} ({e.location})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 pt-1">
                    * Qapı kilidi, sınmış şüşə, elektrik rozetkası, santexnika və s. sərbəst müraciətlər üçün.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Prioritet:</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="asagi">Aşağı (Adi)</option>
                    <option value="orta">Orta</option>
                    <option value="yuksek">Yüksək (Təcili təmir)</option>
                    <option value="tecili">Təcili (Dərs prosesini dayandırır)</option>
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
                <label className="font-bold text-slate-700">Nasazlığın Ətraflı Təsviri:</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Problemin necə baş verdiyini və hazırkı vəziyyəti dəqiq təsvir edin..."
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Müraciəti Göndər
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
