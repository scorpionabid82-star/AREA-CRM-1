import React, { useState } from 'react';
import {
  Monitor,
  Printer,
  Projector,
  Wrench,
  Search,
  Plus,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Cpu,
  History
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { EquipmentItem } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface EquipmentRegistryViewProps {
  selectedBranchIdFilter?: string;
  onOpenTicketWithEquipment?: (equipmentId: string) => void;
}

export const EquipmentRegistryView: React.FC<EquipmentRegistryViewProps> = ({
  selectedBranchIdFilter,
  onOpenTicketWithEquipment,
}) => {
  const {
    equipmentList,
    branches,
    currentRole,
    currentUser,
    createEquipment,
    updateEquipment,
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'islek' | 'temirde' | 'nasaz'>('all');

  const [selectedEquipDetail, setSelectedEquipDetail] = useState<EquipmentItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Equipment Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Kompüter');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newBranchId, setNewBranchId] = useState(() => managerBranchId || branches.find(b => !b.isDeleted)?.id || 'branch-nerimanov');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState<'islek' | 'temirde' | 'nasaz'>('islek');
  const [newNotes, setNewNotes] = useState('');

  const effectiveBranchId = managerBranchId || activeBranchId;

  const filteredEquipment = equipmentList.filter(item => {
    if (item.technicalStatus === 'silinib') return false;
    if (isManager && item.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && item.branchId !== effectiveBranchId) return false;

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStat = statusFilter === 'all' || item.technicalStatus === statusFilter;

    return matchesSearch && matchesCat && matchesStat;
  });

  const categories = ['all', 'Kompüter', 'Proyektor', 'Printer', 'Elektronika', 'Mebel', 'Digər'];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newModel.trim()) {
      showToast('Zəhmət olmasa avadanlığın adını və modelini daxil edin.', 'error');
      return;
    }

    const branch = branches.find(b => b.id === newBranchId);

    createEquipment({
      name: newName.trim(),
      category: newCategory,
      model: newModel.trim(),
      serialNumber: newSerial.trim() || undefined,
      branchId: newBranchId,
      branchName: branch?.name || 'Filial',
      location: newLocation.trim() || 'Əsas Otaq',
      technicalStatus: newStatus,
      notes: newNotes.trim() || undefined,
    });

    showToast('Yeni avadanlıq uğurla reyestrə əlavə edildi!', 'success');
    setShowAddModal(false);
    setNewName('');
    setNewModel('');
    setNewSerial('');
    setNewLocation('');
    setNewNotes('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Kompüter':
        return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'Printer':
        return <Printer className="w-4 h-4 text-emerald-600" />;
      case 'Proyektor':
        return <Projector className="w-4 h-4 text-indigo-600" />;
      default:
        return <Cpu className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Filial Avadanlıqları Reyestri</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Maddi-Texniki Baza
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kompüterlər, proyektorlar, printerlər və digər əsas vəsaitlərin unikal ID ilə uçotu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isManager && (
            <select
              value={effectiveBranchId}
              onChange={e => setActiveBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
            >
              <option value="all">Bütün Filiallar ({equipmentList.length})</option>
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Avadanlıq</span>
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
            placeholder="Avadanlıq adı, unikal ID (EQ-...), model və ya seriya nömrəsi..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'Bütün Avadanlıqlar' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {item.id}
                </span>

                <Tooltip
                  content={
                    item.technicalStatus === 'islek'
                      ? 'İşlək Vəziyyətdə: Bütün funksiyalar aktivdir'
                      : item.technicalStatus === 'temirde'
                      ? 'Təmirdədir: Texnobaba servisində bərpadadır'
                      : 'Nasaz / Qüsurlu: Müraciət açılması tələb olunur'
                  }
                >
                  <span
                    className={`inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      item.technicalStatus === 'islek'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.technicalStatus === 'temirde'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {item.technicalStatus === 'islek' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : item.technicalStatus === 'temirde' ? (
                      <Wrench className="w-3 h-3 text-amber-600 animate-spin-slow" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                    )}
                    <span>
                      {item.technicalStatus === 'islek'
                        ? 'İşlək'
                        : item.technicalStatus === 'temirde'
                        ? 'Təmirdə'
                        : 'Nasaz'}
                    </span>
                  </span>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2 mt-3">
                {getCategoryIcon(item.category)}
                <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
              </div>

              <p className="text-xs text-slate-600 mt-1 font-medium">{item.model}</p>

              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700 font-medium">{item.branchName}</span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Məkan: <span className="text-slate-600 font-medium">{item.location}</span>
                </p>
                {item.serialNumber && (
                  <p className="text-[11px] text-slate-400 font-mono">
                    S/N: {item.serialNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Təmir: <strong className="text-slate-700 font-mono">{item.repairHistory.length}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                {onOpenTicketWithEquipment && item.technicalStatus !== 'islek' && (
                  <Tooltip content="Nasazlıq üçün dərhal texniki müraciət yarat">
                    <button
                      onClick={() => onOpenTicketWithEquipment(item.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </Tooltip>
                )}

                <Tooltip content="Texniki pasport və təmir tarixçəsinə bax">
                  <button
                    onClick={() => setSelectedEquipDetail(item)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Equipment Detail Modal */}
      {selectedEquipDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600">{selectedEquipDetail.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedEquipDetail.name}</h3>
                <p className="text-xs text-slate-500">{selectedEquipDetail.model}</p>
              </div>
              <button
                onClick={() => setSelectedEquipDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Filial:</span>
                  <span className="font-bold text-slate-800">{selectedEquipDetail.branchName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Yerləşmə:</span>
                  <span className="font-bold text-slate-800">{selectedEquipDetail.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Seriya Nömrəsi:</span>
                  <span className="font-mono text-slate-800">{selectedEquipDetail.serialNumber || 'Qeyd olunmayıb'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status:</span>
                  <span className="font-bold capitalize text-slate-800">{selectedEquipDetail.technicalStatus}</span>
                </div>
              </div>

              {selectedEquipDetail.notes && (
                <div>
                  <span className="font-bold text-slate-700 block mb-0.5">Xüsusi Qeydlər:</span>
                  <p className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
                    {selectedEquipDetail.notes}
                  </p>
                </div>
              )}

              {/* Repair history */}
              <div>
                <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Keçmiş Təmir Tarixçəsi ({selectedEquipDetail.repairHistory.length}):</span>
                </span>
                {selectedEquipDetail.repairHistory.length === 0 ? (
                  <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-lg">
                    Bu avadanlıq üzrə təmir qeydi yoxdur.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedEquipDetail.repairHistory.map((rep, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px]">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{rep.description}</span>
                          <span className="text-slate-400 font-mono">{formatDateAz(rep.date)}</span>
                        </div>
                        {rep.cost && (
                          <p className="text-slate-500 mt-0.5">Xərc: {rep.cost} AZN ({rep.performer})</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Yeni Avadanlıq Qeydiyyatı</h3>
              <p className="text-xs text-slate-500 mt-0.5">Maddi-texniki bazaya yeni vahidin əlavə olunması</p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Avadanlığın Adı:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Məs: HP Masaüstü Kompüter Dəsti"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kateqoriya:</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Kompüter">Kompüter</option>
                    <option value="Proyektor">Proyektor</option>
                    <option value="Printer">Printer</option>
                    <option value="Elektronika">Elektronika</option>
                    <option value="Mebel">Mebel</option>
                    <option value="Digər">Digər</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Filial:</label>
                  <select
                    value={newBranchId}
                    onChange={e => setNewBranchId(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Model:</label>
                  <input
                    type="text"
                    required
                    value={newModel}
                    onChange={e => setNewModel(e.target.value)}
                    placeholder="Məs: Pavilion TP01 i5"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Seriya Nömrəsi (S/N):</label>
                  <input
                    type="text"
                    value={newSerial}
                    onChange={e => setNewSerial(e.target.value)}
                    placeholder="Məs: HP-NR-9982"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Filial Daxili Yerləşmə:</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  placeholder="Məs: Laboratoriya 2, Masa 3"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Texniki Vəziyyət:</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="islek">İşlək Vəziyyətdə</option>
                  <option value="temirde">Təmirdədir</option>
                  <option value="nasaz">Nasaz / Qüsurlu</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Əlavə Qeydlər:</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Quraşdırılmış proqramlar, komplektasiya..."
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
                  Reyestrə Əlavə Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
