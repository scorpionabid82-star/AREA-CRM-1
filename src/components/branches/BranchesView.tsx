import React, { useState } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  User,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  Layers,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Navigation,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { BranchLocation } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';

export const BranchesView: React.FC = () => {
  const {
    branches,
    addBranch,
    updateBranch,
    deleteBranch,
    softDeleteBranch,
    hardDeleteBranch,
    restoreBranch,
    selectedBranchId,
    setSelectedBranchId,
    staff,
    groups,
    students,
    currentUser,
    setActiveTab,
    showToast,
    confirmAction,
    can,
  } = useCrm();

  const isDirector = currentUser?.role === 'direktor' || currentUser?.isSuperAdmin;
  const [activeTabFilter, setActiveTabFilter] = useState<'active' | 'archived'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchLocation | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(40.3756);
  const [longitude, setLongitude] = useState(49.8432);
  const [radiusMeters, setRadiusMeters] = useState(150);
  const [phone, setPhone] = useState('+994 12 498 00 00');
  const [managerName, setManagerName] = useState('Aytən Məmmədova');
  const [roomCount, setRoomCount] = useState(4);
  const [monthlyRent, setMonthlyRent] = useState(1500);
  const [status, setStatus] = useState<'aktiv' | 'temirde' | 'planlasdirilir' | 'silinib'>('aktiv');

  // Open Edit Modal and prefill
  const handleOpenEdit = (branch: BranchLocation) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address);
    setLatitude(branch.latitude);
    setLongitude(branch.longitude);
    setRadiusMeters(branch.radiusMeters);
    setPhone(branch.phone || '');
    setManagerName(branch.managerName || '');
    setRoomCount(branch.roomCount || 3);
    setMonthlyRent(branch.monthlyRent || 1000);
    setStatus(branch.status || 'aktiv');
  };

  // Get current browser GPS for form
  const handleDetectCoordinates = () => {
    if (!navigator.geolocation) {
      showToast('Brauzeriniz geolokasiyanı dəstəkləmir', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(Number(pos.coords.latitude.toFixed(5)));
        setLongitude(Number(pos.coords.longitude.toFixed(5)));
        showToast('Cari GPS koordinatları formaya daxil edildi!');
      },
      err => {
        showToast('GPS koordinatlarını əldə etmək mümkün olmadı: ' + err.message, 'error');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addBranch({
      name,
      address,
      latitude,
      longitude,
      radiusMeters,
      phone,
      managerName,
      roomCount,
      monthlyRent,
      status,
      createdAt: new Date().toISOString().split('T')[0],
    });

    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch || !name.trim()) return;

    updateBranch(editingBranch.id, {
      name,
      address,
      latitude,
      longitude,
      radiusMeters,
      phone,
      managerName,
      roomCount,
      monthlyRent,
      status,
    });

    setEditingBranch(null);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setLatitude(40.3756);
    setLongitude(49.8432);
    setRadiusMeters(150);
    setPhone('+994 12 498 00 00');
    setRoomCount(4);
    setMonthlyRent(1500);
    setStatus('aktiv');
  };

  // Calculations for executive summary
  const totalRentBudget = branches.reduce((acc, b) => acc + (b.monthlyRent || 0), 0);
  const totalRooms = branches.reduce((acc, b) => acc + (b.roomCount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Filiallar
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono-nums">
              {branches.length} Filial
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Məkan şəbəkəsi, GPS geolokasiya radiusları və otaq təyinatı.
          </p>
        </div>

        {can('create', 'branches') && (
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Filial</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Filiallar</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono-nums text-slate-900">
            {branches.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {branches.filter(b => b.status === 'aktiv').length} Aktiv fəaliyyətdə
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Auditoriya</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono-nums text-slate-900">
            {totalRooms} otaq
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tədris laboratoriyaları
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">İcarə Fondu</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono-nums text-slate-900">
            {formatAZN(totalRentBudget)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Aylıq məkan büdcəsi
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Geofence GPS</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono-nums text-emerald-600">
            100% Qorunma
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            GPS radius yoxlanışı
          </span>
        </div>
      </div>

      {/* Branches List Header & Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Akademiyanın Məkan Şəbəkəsi
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
              {branches.length} filial
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTabFilter('active')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTabFilter === 'active'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktiv Filiallar ({branches.filter(b => !b.isDeleted).length})
            </button>
            <button
              onClick={() => setActiveTabFilter('archived')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                activeTabFilter === 'archived'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arxiv / Zibil Qutusu ({branches.filter(b => b.isDeleted).length})</span>
            </button>
          </div>
        </div>

        {branches.filter(b => (activeTabFilter === 'active' ? !b.isDeleted : b.isDeleted)).length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              {activeTabFilter === 'active' ? 'Heç bir aktiv filial tapılmadı.' : 'Zibil qutusu boşdur.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {branches
              .filter(branch => (activeTabFilter === 'active' ? !branch.isDeleted : branch.isDeleted))
              .map(branch => {
                const isCurrentActive = selectedBranchId === branch.id;
                const branchStaffCount = staff.filter(s => s.branchId === branch.id).length;
                const branchGroups = groups.filter(g => g.room.includes(branch.name.split(' ')[1] || ''));

                return (
                  <div
                    key={branch.id}
                    className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                      branch.isDeleted
                        ? 'border-rose-200 bg-rose-50/20 opacity-90'
                        : isCurrentActive
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Card Top */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                            Filial ID: {branch.id}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{branch.name}</h4>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            branch.isDeleted
                              ? 'bg-rose-100 text-rose-800'
                              : branch.status === 'aktiv'
                              ? 'bg-emerald-50 text-emerald-700'
                              : branch.status === 'temirde'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {branch.isDeleted
                            ? 'Silinib (Arxiv)'
                            : branch.status === 'aktiv'
                            ? 'Aktiv Fəaliyyət'
                            : branch.status === 'temirde'
                            ? 'Təmirdə'
                            : 'Planlaşdırılır'}
                        </span>
                      </div>

                  {/* Address */}
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>

                  {/* Manager and Phone */}
                  <div className="flex items-center justify-between text-xs text-slate-700 py-1.5 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-900 truncate">{branch.managerName || 'Təyin edilməyib'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono-nums text-slate-500 shrink-0">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{branch.phone || '—'}</span>
                    </div>
                  </div>

                  {/* GPS & Geofence Details */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Navigation className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-mono-nums text-[11px] truncate">
                        {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[11px] font-mono-nums">{branch.radiusMeters}m geofence</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px]">{branch.roomCount || 0} auditoriya</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono-nums text-slate-900 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px]">{formatAZN(branch.monthlyRent || 0)}</span>
                    </div>
                  </div>

                  {/* Staff & groups count */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {branchStaffCount} heyət
                    </span>
                    <span>·</span>
                    <span className="font-mono-nums">{formatDateAz(branch.createdAt || '')}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-1.5">
                    {isCurrentActive ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Cari Seçilmiş
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedBranchId(branch.id);
                          showToast(`Aktiv filial dəyişdirildi: ${branch.name}`);
                        }}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        Aktiv Et
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedBranchId(branch.id);
                        setActiveTab('staff-attendance');
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                      title="Bu filialın QR Terminalını aç"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {branch.isDeleted ? (
                      can('delete', 'branches') && (
                        <>
                          <button
                            onClick={() => restoreBranch(branch.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-md transition-colors cursor-pointer"
                            title="Filialı bərpa et"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Bərpa et</span>
                          </button>
                          <button
                            onClick={() => {
                              confirmAction({
                                title: 'Filialı Birdəfəlik Sil',
                                message: `"${branch.name}" filialını bazadan birdəfəlik və fiziki olaraq silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır!`,
                                confirmText: 'Bəli, Birdəfəlik Sil',
                                danger: true,
                                onConfirm: () => hardDeleteBranch(branch.id),
                              });
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                            title="Birdəfəlik fiziki sil (Hard Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        {can('edit', 'branches') && (
                          <button
                            onClick={() => handleOpenEdit(branch)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                            title="Filialı redaktə et"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {can('delete', 'branches') && (
                          <>
                            <button
                              onClick={() => {
                                confirmAction({
                                  title: 'Filialı Arxivə Göndər',
                                  message: `"${branch.name}" filialını arxivə göndərmək istədiyinizə əminsiniz? Filialı istənilən vaxt bərpa edə bilərsiniz.`,
                                  confirmText: 'Arxivə Göndər',
                                  danger: false,
                                  onConfirm: () => softDeleteBranch(branch.id),
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors cursor-pointer"
                              title="Arxivə göndər (Soft Delete)"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                confirmAction({
                                  title: 'Filialı Birdəfəlik Sil',
                                  message: `"${branch.name}" filialını birdəfəlik bazadan silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır!`,
                                  confirmText: 'Bəli, Birdəfəlik Sil',
                                  danger: true,
                                  onConfirm: () => hardDeleteBranch(branch.id),
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Birdəfəlik sil (Hard Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Modal: Add New Branch */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Yeni Akademiya Filialının Yaradılması
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filialın Adı:
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: AREA Nərimanov Filialı (Ağa Neymətulla)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dəqiq Ünvan:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Bakı ş., Nərimanov r-nu, Ağa Neymətulla küç. 14"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              {/* Coordinates & GPS auto-detect */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    GPS Geolokasiya & Geofence:
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectCoordinates}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Cihazın Cari GPS-ni Götür</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Enlem (Lat):</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={e => setLatitude(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Uzunluq (Lng):</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={e => setLongitude(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Radius (metr):</label>
                    <input
                      type="number"
                      min="30"
                      max="1000"
                      value={radiusMeters}
                      onChange={e => setRadiusMeters(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial Meneceri / Rəhbəri:
                  </label>
                  <select
                    value={managerName}
                    onChange={e => setManagerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Əlaqə Telefonu:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Otaq Sayı:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={roomCount}
                    onChange={e => setRoomCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İcarə Haqqı (AZN):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status:
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="aktiv">Aktiv</option>
                    <option value="temirde">Təmirdə</option>
                    <option value="planlasdirilir">Planlaşdırılır</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Filialı Təsdiqlə və Aç
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Branch */}
      {editingBranch && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Filial Tənzimləmələri və Redaktə
              </h3>
              <button
                onClick={() => setEditingBranch(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleUpdateBranch} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filialın Adı:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ünvan:
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    GPS Geolokasiya & Geofence:
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectCoordinates}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Cihazın Cari GPS-ni Götür</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Enlem (Lat):</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={latitude}
                      onChange={e => setLatitude(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Uzunluq (Lng):</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={longitude}
                      onChange={e => setLongitude(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Radius (metr):</label>
                    <input
                      type="number"
                      min="30"
                      max="1000"
                      value={radiusMeters}
                      onChange={e => setRadiusMeters(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial Meneceri / Rəhbəri:
                  </label>
                  <select
                    value={managerName}
                    onChange={e => setManagerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Əlaqə Telefonu:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Otaq Sayı:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={roomCount}
                    onChange={e => setRoomCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    İcarə Haqqı (AZN):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={monthlyRent}
                    onChange={e => setMonthlyRent(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status:
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="aktiv">Aktiv</option>
                    <option value="temirde">Təmirdə</option>
                    <option value="planlasdirilir">Planlaşdırılır</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Yeniləməni Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
