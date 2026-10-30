import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Clock,
  Check,
  LogOut,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const ProfileSettingsModal: React.FC = () => {
  const {
    currentUser,
    updateUser,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    logout,
    isProfileModalOpen,
    setIsProfileModalOpen,
    showToast,
  } = useCrm();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [branchId, setBranchId] = useState(currentUser?.branchId || selectedBranchId || branches[0]?.id || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isProfileModalOpen && currentUser) {
      setFullName(currentUser.fullName || '');
      setPhone(currentUser.phone || '');
      setBranchId(currentUser.branchId || selectedBranchId || branches[0]?.id || '');
    }
  }, [isProfileModalOpen]);

  if (!isProfileModalOpen || !currentUser) {
    return null;
  }

  const initials = currentUser.fullName
    ? currentUser.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast('Zəhmət olmasa ad və soyadınızı daxil edin', 'error');
      return;
    }

    setIsSaving(true);
    const selectedBranch = branches.find(b => b.id === branchId);

    updateUser(currentUser.id, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      branchId: branchId,
      branchName: selectedBranch?.name || currentUser.branchName,
    });

    if (branchId !== selectedBranchId) {
      setSelectedBranchId(branchId);
    }

    showToast('Profil məlumatlarınız uğurla yadda saxlanıldı!', 'success');
    setIsSaving(false);
    setIsProfileModalOpen(false);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'direktor':
        return { label: 'Baş Direktor (Superadmin)', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'menecer':
        return { label: 'Tədris Meneceri', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'telimci':
        return { label: 'Aparıcı Təlimçi', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'sagird':
        return { label: 'Tələbə / Şagird', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            {currentUser.photoURL || currentUser.avatarUrl ? (
              <img
                src={currentUser.photoURL || currentUser.avatarUrl}
                alt={currentUser.fullName}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover shadow-xs border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Profil Tənzimləmələri
              </h3>
              <p className="text-[11px] text-slate-500">
                Google hesabı ilə sinxronlaşdırılmış profil
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Email / Google Account (Read-only) */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1 flex items-center justify-between">
              <span>Gmail / Google Hesabı</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Təsdiqlənmiş Google Hesabı</span>
              </span>
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono-nums">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{currentUser.email}</span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Ad və Soyad:
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Google hesabınızdakı ad və soyad"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Əlaqə Nömrəsi:
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+994 50 123 45 67"
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono-nums"
              />
            </div>
          </div>

          {/* System Role Badge */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="block text-slate-600 font-semibold mb-1">
                Sistem Rolu:
              </span>
              <div className={`px-2.5 py-1.5 rounded-lg border text-center font-bold text-[11px] ${roleInfo.color}`}>
                {roleInfo.label}
              </div>
            </div>

            {/* Assigned / Preferred Branch */}
            <div>
              <span className="block text-slate-600 font-semibold mb-1">
                Əsas Filial:
              </span>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Last Login Info */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Son daxilolma:</span>
            </span>
            <span className="font-mono-nums font-medium text-slate-700">
              {currentUser.lastLogin || 'Bugün'}
            </span>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                logout();
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıxış</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Bağla
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Yadda Saxla</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
