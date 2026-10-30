import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Phone,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  Kanban,
  Table as TableIcon,
  Trash2,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Lead, LeadStage } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';

interface LeadsViewProps {
  onOpenPublicPortal?: () => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ onOpenPublicPortal }) => {
  const {
    leads,
    groups,
    branches,
    addLead,
    updateLeadStage,
    deleteLead,
    convertLeadToStudent,
    staff,
    confirmAction,
    can,
    showToast,
  } = useCrm();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareBranchId, setShareBranchId] = useState('all');
  const [copiedLink, setCopiedLink] = useState(false);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);

  const getShareableUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const baseUrl = `${origin}/?view=register`;
    if (shareBranchId !== 'all') {
      return `${baseUrl}&branch=${shareBranchId}`;
    }
    return baseUrl;
  };

  // Convert to student modal states
  const [convertGroupId, setConvertGroupId] = useState(groups[0]?.id || '');
  const [convertMonthlyFee, setConvertMonthlyFee] = useState(260);

  // New lead form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [interestedCourse, setInterestedCourse] = useState('Full-Stack Frontend Proqramlaşdırma');
  const [source, setSource] = useState<any>('Instagram');
  const [assignedManager, setAssignedManager] = useState('Aytən Məmmədova');
  const [notes, setNotes] = useState('');

  const stages: { id: LeadStage; title: string; color: string }[] = [
    { id: 'yeni', title: 'Yeni Müraciət', color: 'border-t-indigo-500' },
    { id: 'elaqe_saxlanildi', title: 'Əlaqə Saxlanıldı', color: 'border-t-blue-500' },
    { id: 'sinaq_dersi', title: 'Sınaq Dərsi', color: 'border-t-amber-500' },
    { id: 'gozleyir', title: 'Qərar Gözləyir', color: 'border-t-purple-500' },
    { id: 'qeydiyyat', title: 'Tələbəyə Çevrildi', color: 'border-t-emerald-500' },
    { id: 'imtina', title: 'İmtina', color: 'border-t-slate-400' },
  ];

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    addLead({
      fullName,
      phone,
      interestedCourse,
      source,
      stage: 'yeni',
      assignedManager,
      notes,
    });

    setShowAddLeadModal(false);
    setFullName('');
    setPhone('');
    setNotes('');
  };

  const handleConfirmConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingLead) return;

    convertLeadToStudent(convertingLead.id, convertGroupId, convertMonthlyFee);
    setConvertingLead(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Lidlər
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono-nums">
              {leads.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Müraciətlər, satış qıfı və tələbəyə konversiya.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Lövhəsi"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cədvəl Baxışı"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {can('create', 'leads') && (
            <>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                title="Valideynlər üçün onlayn qeydiyyat linkini paylaş"
              >
                <Share2 className="w-4 h-4" />
                <span>Qeydiyyat Linkini Paylaş</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddLeadModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Lid</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.id);
            return (
              <div
                key={stage.id}
                className={`bg-slate-100/70 rounded-xl p-3 flex flex-col min-w-[210px] border-t-4 ${stage.color} border border-slate-200`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 truncate">{stage.title}</span>
                  <span className="text-xs font-mono-nums font-semibold px-1.5 py-0.5 rounded bg-white text-slate-600 shadow-2xs">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 flex-1">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:shadow-sm transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900">{lead.fullName}</p>
                            {lead.applicationCode && (
                              <span className="font-mono text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                #{lead.applicationCode}
                              </span>
                            )}
                          </div>
                          {lead.parentName && (
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Valideyn: <span className="text-slate-700">{lead.parentName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono-nums mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            confirmAction({
                              title: 'Müraciəti Sil',
                              message: `"${lead.fullName}" (${lead.interestedCourse}) müraciətini silmək istədiyinizə əminsiniz?`,
                              confirmText: 'Bəli, Sil',
                              danger: true,
                              onConfirm: () => deleteLead(lead.id),
                            });
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                          title="Müraciəti sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded font-medium truncate">
                        {lead.interestedCourse}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {lead.source}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="w-2.5 h-2.5" />
                          {lead.assignedManager.split(' ')[0]}
                        </span>
                      </div>

                      {/* Convert to Student Button (if not already converted) */}
                      {lead.stage !== 'qeydiyyat' && lead.stage !== 'imtina' && can('create', 'students') && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setConvertingLead(lead);
                            }}
                            className="w-full py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors text-center cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Tələbəyə çevir</span>
                          </button>
                        </div>
                      )}

                      {/* Move stage dropdown */}
                      <select
                        value={lead.stage}
                        disabled={!can('edit', 'leads')}
                        onChange={e => updateLeadStage(lead.id, e.target.value as LeadStage)}
                        className={`w-full text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 ${!can('edit', 'leads') ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>
                            Mərhələ: {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}

                  {!stageLeads.length && (
                    <div className="text-center py-6 text-[11px] text-slate-400">
                      Müraciət yoxdur
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Müraciət Edən</th>
                  <th className="py-3 px-4">Telefon</th>
                  <th className="py-3 px-4">Kurs</th>
                  <th className="py-3 px-4">Mənbə</th>
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-4">Mərhələ</th>
                  <th className="py-3 px-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{lead.fullName}</td>
                    <td className="py-3 px-4 font-mono-nums text-slate-700">{lead.phone}</td>
                    <td className="py-3 px-4 text-slate-600">{lead.interestedCourse}</td>
                    <td className="py-3 px-4 text-slate-500">{lead.source}</td>
                    <td className="py-3 px-4 font-mono-nums text-slate-500">
                      {formatDateAz(lead.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={lead.stage}
                        disabled={!can('edit', 'leads')}
                        onChange={e => updateLeadStage(lead.id, e.target.value as LeadStage)}
                        className={`text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 ${!can('edit', 'leads') ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lead.stage !== 'qeydiyyat' && can('create', 'students') && (
                          <button
                            onClick={() => setConvertingLead(lead)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded transition-colors cursor-pointer"
                          >
                            Tələbəyə Çevir
                          </button>
                        )}
                        {can('delete', 'leads') && (
                          <button
                            onClick={() => {
                              confirmAction({
                                title: 'Müraciəti Sil',
                                message: `"${lead.fullName}" (${lead.interestedCourse}) müraciətini bazadan silmək istədiyinizə əminsiniz?`,
                                confirmText: 'Bəli, Sil',
                                danger: true,
                                onConfirm: () => deleteLead(lead.id),
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Müraciəti sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Convert to Student */}
      {convertingLead && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Müraciəti Tələbəyə Çevir
            </h3>

            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{convertingLead.fullName}</strong> adlı müraciətçi birbaşa rəsmi tələbə bazasına əlavə olunacaq və qrupuna təhkim ediləcək.
            </p>

            <form onSubmit={handleConfirmConvert} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Təyin Ediləcək Qrup:
                </label>
                <select
                  value={convertGroupId}
                  onChange={e => setConvertGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.currentStudents}/{g.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aylıq Tədris Haqqı (AZN):
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Məs: 85, 93, 260..."
                  value={convertMonthlyFee === 0 ? '' : convertMonthlyFee}
                  onChange={e => {
                    const val = e.target.value;
                    setConvertMonthlyFee(val === '' ? 0 : parseFloat(val) || 0);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                >
                  Təsdiq Et və Tələbə Yarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Lead */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Yeni Müraciət Daxil Et
            </h3>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Müraciət Edənin Adı və Soyadı:
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: Murad Hüseynov"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Əlaqə Telefonu:
                </label>
                <input
                  type="text"
                  required
                  placeholder="+994 50 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maraqlandığı Tədris İstiqaməti:
                </label>
                <input
                  type="text"
                  value={interestedCourse}
                  onChange={e => setInterestedCourse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gəliş Mənbəyi:
                  </label>
                  <select
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Tövsiyə">Tövsiyə</option>
                    <option value="Birbaşa gəliş">Birbaşa gəliş</option>
                    <option value="Digər">Digər</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Təhkim Olunan Menecer:
                  </label>
                  <select
                    value={assignedManager}
                    onChange={e => setAssignedManager(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeydlər:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  placeholder="Müştərinin istəyi və ya vaxt tələbi..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Müraciəti Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Share Public Registration Link */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Valideyn Qeydiyyat Linki
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paylaşılabilir ictimai qeydiyyat və izləmə portalı
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Filial Seçimi (Link üçün):
                </label>
                <select
                  value={shareBranchId}
                  onChange={e => setShareBranchId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="all">Bütün Filiallar (Valideyn özü seçir)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.address})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Seçilmiş filial üçün link valideynə həmin filialı avtomatik seçili təqdim edir.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Paylaşılacaq Birbaşa Keçid (URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareableUrl()}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getShareableUrl());
                      setCopiedLink(true);
                      showToast('Qeydiyyat linki buferə kopyalandı!');
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-1.5 text-xs text-indigo-900">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Məxfilik və İş Prinsipi:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-indigo-800/90 pl-1">
                  <li>Valideyn bu linklə daxil olub övladının məlumatlarını yazır.</li>
                  <li>Müraciət dərhal bu səhifənin <strong>«Yeni Müraciət»</strong> sütununa düşür.</li>
                  <li>Valideynə unikal <strong>Müraciət Kodu</strong> verilir və o, yalnız öz müraciətini izləyə bilir.</li>
                  <li>Başqa heç bir tələbə və ya müraciət valideynə göstərilmir.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Salam! AREA Robototexnika və Mühəndislik Akademiyasında övladınızın qeydiyyatı üçün rəsmi müraciət portalı:\n${getShareableUrl()}\n\nZəhmət olmasa formu doldurun, qəbul şöbəmiz sizinlə əlaqə saxlayacaq.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp-da Paylaş</span>
                </a>

                {onOpenPublicPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowShareModal(false);
                      onOpenPublicPortal();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Portala Bax (Önizləmə)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
