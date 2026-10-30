import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Info,
  Lock,
  Unlock,
  Check,
  Building2,
  SlidersHorizontal,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { UserAccount, SystemModuleId, PermissionAction, ModulePermissionRule } from '../../types/crm';
import { SYSTEM_MODULES, ROLE_DETAILS } from '../../utils/permissions';

interface UserPermissionsModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const {
    rolePermissions,
    updateUserCustomPermission,
    bulkUpdateUserCustomPermissions,
    resetUserCustomPermissions,
    confirmAction,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'academic' | 'management' | 'system'>('all');
  const [localOverrides, setLocalOverrides] = useState<Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state when user changes or modal opens
  React.useEffect(() => {
    if (user) {
      setLocalOverrides(user.customPermissions || {});
      setIsDirty(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const roleConfig = rolePermissions[user.role] || {};
  const roleMeta = ROLE_DETAILS[user.role] || ROLE_DETAILS.menecer;

  // Count active overrides
  const totalOverridesCount = useMemo(() => {
    let count = 0;
    Object.values(localOverrides).forEach(modRules => {
      if (modRules) {
        count += Object.keys(modRules).length;
      }
    });
    return count;
  }, [localOverrides]);

  // Filter modules
  const filteredModules = SYSTEM_MODULES.filter(m => {
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesSearch =
      m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cycle action state: Inherit (null/undefined) -> Force Allow (true) -> Force Deny (false) -> Inherit
  const handleCycleAction = (moduleId: SystemModuleId, action: PermissionAction) => {
    const currentVal = localOverrides[moduleId]?.[action];
    let nextVal: boolean | undefined;

    if (currentVal === undefined) {
      // Step from default -> force true
      nextVal = true;
    } else if (currentVal === true) {
      // Step from force true -> force false
      nextVal = false;
    } else {
      // Step from force false -> inherit (undefined)
      nextVal = undefined;
    }

    setLocalOverrides(prev => {
      const mod = { ...(prev[moduleId] || {}) };
      if (nextVal === undefined) {
        delete mod[action];
      } else {
        mod[action] = nextVal;
      }

      const next = { ...prev };
      if (Object.keys(mod).length === 0) {
        delete next[moduleId];
      } else {
        next[moduleId] = mod;
      }
      return next;
    });
    setIsDirty(true);
  };

  // Specific state set
  const handleSetAction = (moduleId: SystemModuleId, action: PermissionAction, value: boolean | undefined) => {
    setLocalOverrides(prev => {
      const mod = { ...(prev[moduleId] || {}) };
      if (value === undefined) {
        delete mod[action];
      } else {
        mod[action] = value;
      }

      const next = { ...prev };
      if (Object.keys(mod).length === 0) {
        delete next[moduleId];
      } else {
        next[moduleId] = mod;
      }
      return next;
    });
    setIsDirty(true);
  };

  // Quick Action: Grant All to Module
  const handleGrantModule = (moduleId: SystemModuleId) => {
    setLocalOverrides(prev => ({
      ...prev,
      [moduleId]: { view: true, create: true, edit: true, delete: true },
    }));
    setIsDirty(true);
  };

  // Quick Action: Deny All to Module
  const handleDenyModule = (moduleId: SystemModuleId) => {
    setLocalOverrides(prev => ({
      ...prev,
      [moduleId]: { view: false, create: false, edit: false, delete: false },
    }));
    setIsDirty(true);
  };

  // Quick Action: Reset Module to Role Default
  const handleResetModule = (moduleId: SystemModuleId) => {
    setLocalOverrides(prev => {
      const next = { ...prev };
      delete next[moduleId];
      return next;
    });
    setIsDirty(true);
  };

  // Quick Action: Reset ALL to Role Defaults
  const handleResetAllToRole = () => {
    confirmAction({
      title: `${user.fullName} üçün Bütün Fərdiləri Sil`,
      message: `Bütün fərdi istisna qaydaları silinəcək və istifadəçi yalnız öz rolunun (${roleMeta.label}) standart səlahiyyətlərinə tabe olacaq. Davam edilsin?`,
      confirmText: 'Bəli, Rola Sıfırla',
      danger: true,
      onConfirm: async () => {
        setLocalOverrides({});
        setIsDirty(false);
        await resetUserCustomPermissions(user.id);
      },
    });
  };

  // Quick Action: Grant All Modules View & Edit
  const handleGrantFullAccess = () => {
    const full: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>> = {};
    SYSTEM_MODULES.forEach(m => {
      full[m.id] = { view: true, create: true, edit: true, delete: true };
    });
    setLocalOverrides(full);
    setIsDirty(true);
  };

  // Quick Action: View-Only Mode
  const handleViewOnlyMode = () => {
    const viewOnly: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>> = {};
    SYSTEM_MODULES.forEach(m => {
      viewOnly[m.id] = { view: true, create: false, edit: false, delete: false };
    });
    setLocalOverrides(viewOnly);
    setIsDirty(true);
  };

  // Save changes
  const handleSave = async () => {
    await bulkUpdateUserCustomPermissions(user.id, localOverrides);
    setIsDirty(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-start sm:items-center gap-3.5">
            {user.photoURL || user.avatarUrl ? (
              <img
                src={user.photoURL || user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover shrink-0 border-2 border-indigo-500/40 shadow-sm"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white">{user.fullName}</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {roleMeta.label}
                </span>
                {user.branchName && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {user.branchName.replace('AREA ', '')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user.email} · Fərdi səlahiyyət və səhifə görünüş istisnaları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {totalOverridesCount > 0 ? (
              <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {totalOverridesCount} fərdi istisna aktivdir
              </span>
            ) : (
              <span className="text-xs font-medium px-3 py-1 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
                Bütün səlahiyyətlər roldan irsidir
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Bağla"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Presets & Explanation Banner */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="hidden sm:inline">
              Fərdi qayda təyin edilməyən modullar avtomatik olaraq <strong>{roleMeta.label}</strong> roluna tabe olur.
            </span>
            <span className="sm:hidden text-[11px]">
              Təyin edilməyən modullar <strong>{roleMeta.label}</strong> roluna tabedir.
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleGrantFullAccess}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Bütün Səhifələri Aç</span>
            </button>
            <button
              type="button"
              onClick={handleViewOnlyMode}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-semibold border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3 h-3 text-indigo-600" />
              <span>Yalnız Oxuma Rejimi</span>
            </button>
            {totalOverridesCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllToRole}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-[11px] font-semibold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3 text-rose-600" />
                <span>Rola Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Modul adı ilə axtarış..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: 'all', label: 'Hamısı' },
                { id: 'core', label: 'Əsas' },
                { id: 'academic', label: 'Akademik' },
                { id: 'management', label: 'İdarəetmə' },
                { id: 'system', label: 'Sistem' },
              ] as const
            ).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend / Status Helper */}
        <div className="px-5 sm:px-6 py-2 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Seçim Məntiqi:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border border-slate-400" />
            <span>Roldan İrsi (Standart)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-700 font-medium">Fərdi İcazə Ver</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-rose-700 font-medium">Fərdi Qadağan Et</span>
          </span>
          <span className="text-slate-400 ml-auto hidden sm:inline">
            (Düyməyə klikləməklə vəziyyətləri dəyişə bilərsiniz)
          </span>
        </div>

        {/* Modules List */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5 divide-y divide-slate-100">
          {filteredModules.map(m => {
            const roleRule = roleConfig[m.id] || { view: false, create: false, edit: false, delete: false };
            const customRule = localOverrides[m.id];
            const hasModuleOverride = customRule && Object.keys(customRule).length > 0;

            const actions: { key: PermissionAction; label: string; icon: any }[] = [
              { key: 'view', label: 'Baxış (Səhifə/Tab)', icon: Eye },
              { key: 'create', label: 'Əlavə Etmə', icon: PlusCircle },
              { key: 'edit', label: 'Redaktə', icon: Edit3 },
              { key: 'delete', label: 'Silmə', icon: Trash2 },
            ];

            return (
              <div key={m.id} className="pt-3.5 first:pt-0">
                <div className="p-4 rounded-2xl border transition-all bg-white hover:border-slate-300 border-slate-200 space-y-3.5">
                  {/* Module Title & Overview */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{m.label}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {m.category.toUpperCase()}
                        </span>
                        {hasModuleOverride && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Fərdi İstisna
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                    </div>

                    {/* Quick Module-Level Actions */}
                    <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleGrantModule(m.id)}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                        title="Bütün əməliyyatları fərdi olaraq icazəli et"
                      >
                        Tam Aç
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDenyModule(m.id)}
                        className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                        title="Bütün əməliyyatları fərdi olaraq qadağan et"
                      >
                        Tam Bağla
                      </button>
                      {hasModuleOverride && (
                        <button
                          type="button"
                          onClick={() => handleResetModule(m.id)}
                          className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Roldan gələn standart qaydaya qaytar"
                        >
                          Rola Qaytar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Toggles Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {actions.map(act => {
                      const Icon = act.icon;
                      const customVal = customRule?.[act.key];
                      const roleVal = roleRule[act.key];

                      const isInherited = customVal === undefined;
                      const isForceAllow = customVal === true;
                      const isForceDeny = customVal === false;

                      const effectiveAllowed = isInherited ? roleVal : isForceAllow;

                      return (
                        <div
                          key={act.key}
                          onClick={() => handleCycleAction(m.id, act.key)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-2 ${
                            isForceAllow
                              ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300'
                              : isForceDeny
                              ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-300'
                              : roleVal
                              ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-100/80 opacity-85'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-slate-500" />
                              <span>{act.label}</span>
                            </span>

                            {/* Badge */}
                            {isForceAllow && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {isForceDeny && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            {isInherited && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  roleVal
                                    ? 'bg-emerald-100/80 text-emerald-800'
                                    : 'bg-slate-200/80 text-slate-600'
                                }`}
                              >
                                {roleVal ? 'Roldan Açiq' : 'Roldan Bağli'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60">
                            <span className="text-slate-500">Status:</span>
                            <span
                              className={`font-bold ${
                                isForceAllow
                                  ? 'text-emerald-700'
                                  : isForceDeny
                                  ? 'text-rose-700'
                                  : effectiveAllowed
                                  ? 'text-slate-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isForceAllow
                                ? 'Fərdi İcazəli'
                                : isForceDeny
                                ? 'Fərdi Qadağan'
                                : 'Roldan İrsi'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {isDirty ? (
              <span className="text-amber-600 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Yadda saxlanılmamış fərdi dəyişikliklər var
              </span>
            ) : (
              <span className="text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Cari səlahiyyətlər sinxronlaşdırılıb
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ləğv Et
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Yadda Saxla və Tətbiq Et</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
