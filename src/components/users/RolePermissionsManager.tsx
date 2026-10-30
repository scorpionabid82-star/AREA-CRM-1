import React, { useState, useMemo } from 'react';
import {
  Shield,
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
  CheckSquare,
  Square,
  Lock,
  Unlock,
  Sparkles,
  Users,
  Info,
  Crown,
  Briefcase,
  GraduationCap,
  User,
  Wrench,
  SlidersHorizontal,
  TableProperties,
  LayoutGrid,
  Building2,
  Check,
  ExternalLink,
  Layers,
  ChevronRight,
  Maximize2,
  AlertTriangle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Role, SystemModuleId, PermissionAction, ModulePermissionRule, UserAccount } from '../../types/crm';
import { SYSTEM_MODULES, ROLE_DETAILS, DEFAULT_ROLE_PERMISSIONS } from '../../utils/permissions';
import { UserPermissionsModal } from './UserPermissionsModal';


// Helper for module icon display
const getModuleEmoji = (category: string, id: string): string => {
  switch (id) {
    case "dashboard": return "📊";
    case "students": return "🎒";
    case "contracts": return "📄";
    case "groups": return "👥";
    case "leads": return "🎯";
    case "finance": return "💳";
    case "marketing": return "📢";
    case "smm": return "📱";
    case "courses": return "📚";
    case "trainers": return "👨‍🏫";
    case "branches": return "🏢";
    case "users": return "👤";
    case "reports": return "📈";
    case "permissions": return "🛡️";
    case "settings": return "⚙️";
    default:
      if (category === "academic") return "🎓";
      if (category === "management") return "📑";
      if (category === "system") return "🔧";
      return "📁";
  }
};

export const RolePermissionsManager: React.FC = () => {
  const {
    rolePermissions,
    updateRolePermissions,
    bulkUpdateRolePermissions,
    resetRolePermissions,
    updateUserCustomPermission,
    bulkUpdateUserCustomPermissions,
    resetUserCustomPermissions,
    currentRole,
    setCurrentRole,
    currentUser,
    users,
    showToast,
    confirmAction,
  } = useCrm();

  // Primary Scope Switcher: 'roles' (standard defaults) vs 'users' (individual overrides)
  const [managementScope, setManagementScope] = useState<'roles' | 'users'>('roles');

  // Role Scope States
  const [selectedRole, setSelectedRole] = useState<Role>('menecer');
  const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('detail');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'core' | 'academic' | 'management' | 'system'>('all');

  // User Scope States
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | Role>('all');
  const [onlyWithOverrides, setOnlyWithOverrides] = useState(false);
  const [modalUser, setModalUser] = useState<UserAccount | null>(null);

  const isSuperAdminUser = currentUser?.isSuperAdmin || currentUser?.role === 'direktor' || currentRole === 'direktor';

  // Role user counts
  const roleCounts: Record<Role, number> = useMemo(() => {
    return {
      direktor: users.filter(u => !u.isDeleted && u.role === 'direktor').length,
      texnobaba_meneceri: users.filter(u => !u.isDeleted && u.role === 'texnobaba_meneceri').length,
      menecer: users.filter(u => !u.isDeleted && u.role === 'menecer').length,
      telimci: users.filter(u => !u.isDeleted && u.role === 'telimci').length,
      sagird: users.filter(u => !u.isDeleted && u.role === 'sagird').length,
    };
  }, [users]);

  // Active non-deleted users
  const activeUsers = useMemo(() => {
    return users.filter(u => !u.isDeleted);
  }, [users]);

  // Total users with custom overrides
  const usersWithOverridesCount = useMemo(() => {
    return activeUsers.filter(u => {
      if (!u.customPermissions) return false;
      return Object.values(u.customPermissions).some(mod => mod && Object.keys(mod).length > 0);
    }).length;
  }, [activeUsers]);

  // Filtered users for individual permission management
  const filteredUsers = useMemo(() => {
    return activeUsers.filter(u => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(userSearchQuery));
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const hasOverrides = u.customPermissions && Object.values(u.customPermissions).some(mod => mod && Object.keys(mod).length > 0);
      const matchesOverrideFilter = !onlyWithOverrides || hasOverrides;
      return matchesSearch && matchesRole && matchesOverrideFilter;
    });
  }, [activeUsers, userSearchQuery, userRoleFilter, onlyWithOverrides]);

  // Selected user for individual management
  const selectedUser = useMemo(() => {
    if (selectedUserId) {
      const found = activeUsers.find(u => u.id === selectedUserId);
      if (found) return found;
    }
    return filteredUsers[0] || activeUsers[0] || null;
  }, [selectedUserId, activeUsers, filteredUsers]);

  // Count overrides for selected user
  const selectedUserStats = useMemo(() => {
    if (!selectedUser || !selectedUser.customPermissions) {
      return { allows: 0, denies: 0, total: 0 };
    }
    let allows = 0;
    let denies = 0;
    Object.values(selectedUser.customPermissions).forEach(rule => {
      if (rule) {
        Object.values(rule).forEach(val => {
          if (val === true) allows++;
          if (val === false) denies++;
        });
      }
    });
    return { allows, denies, total: allows + denies };
  }, [selectedUser]);

  // Filter modules
  const filteredModules = useMemo(() => {
    return SYSTEM_MODULES.filter(m => {
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesSearch =
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const activeRoleConfig = rolePermissions[selectedRole];
  const activeRoleDetails = ROLE_DETAILS[selectedRole];

  // Quick Action: Grant All Permissions for current selected role
  const handleGrantAll = () => {
    confirmAction({
      title: `${activeRoleDetails.label} üçün Bütün Səlahiyyətləri Ver`,
      message: `"${activeRoleDetails.label}" rolu üçün bütün sistem modulları üzrə baxış, əlavə, redaktə və silmə hüquqlarını aktivləşdirmək istəyirsiniz?`,
      confirmText: 'Bəli, Hamısını Ver',
      danger: false,
      onConfirm: async () => {
        const fullRules: Record<SystemModuleId, ModulePermissionRule> = {} as any;
        SYSTEM_MODULES.forEach(m => {
          fullRules[m.id] = { view: true, create: true, edit: true, delete: true };
        });
        await bulkUpdateRolePermissions(selectedRole, fullRules);
      },
    });
  };

  // Quick Action: View Only Mode for current selected role
  const handleViewOnly = () => {
    confirmAction({
      title: `${activeRoleDetails.label} üçün Yalnız Baxış Rejimi`,
      message: `"${activeRoleDetails.label}" rolu üçün əlavə, redaktə və silmə hüquqları ləğv ediləcək, yalnız baxış icazəsi saxlanılacaq. Təsdiq edirsiniz?`,
      confirmText: 'Bəli, Yalnız Baxış Et',
      danger: false,
      onConfirm: async () => {
        const viewRules: Record<SystemModuleId, ModulePermissionRule> = {} as any;
        SYSTEM_MODULES.forEach(m => {
          viewRules[m.id] = {
            view: true,
            create: false,
            edit: false,
            delete: false,
          };
        });
        // Ensure safety guard for Direktor
        if (selectedRole === 'direktor') {
          viewRules.permissions = { view: true, create: true, edit: true, delete: true };
        }
        await bulkUpdateRolePermissions(selectedRole, viewRules);
      },
    });
  };

  // Quick Action: Reset to Defaults for this role or all
  const handleResetRole = (roleToReset: Role) => {
    const targetDetails = ROLE_DETAILS[roleToReset];
    confirmAction({
      title: `${targetDetails.label} Standart Qaydalara Sıfırlansın?`,
      message: `Bu əməliyyat "${targetDetails.label}" rolunun bütün fərdi dəyişikliklərini siləcək və ilkin təhlükəsiz sistem standartlarına bərpa edəcək. Davam edilsin?`,
      confirmText: 'Bəli, Sıfırla',
      danger: true,
      onConfirm: async () => {
        await resetRolePermissions(roleToReset);
      },
    });
  };

  // Quick Action: Reset all roles to defaults
  const handleResetAllRoles = () => {
    confirmAction({
      title: 'Bütün Rolları Standart Qaydalara Sıfırla',
      message: 'Sistemdəki bütün rolların səlahiyyətləri standart ilkin təhlükəsizlik vəziyyətinə qaytarılacaq. Bu əməliyyat geri qaytarıla bilməz.',
      confirmText: 'Bəli, Bütün Rolları Sıfırla',
      danger: true,
      onConfirm: async () => {
        await resetRolePermissions();
      },
    });
  };

  // Toggle all actions for a specific module in current role
  const handleToggleModuleAll = (moduleId: SystemModuleId) => {
    const currentModuleRule = activeRoleConfig[moduleId];
    const allActive = currentModuleRule.view && currentModuleRule.create && currentModuleRule.edit && currentModuleRule.delete;
    const nextVal = !allActive;

    // Safety guard
    if (selectedRole === 'direktor' && moduleId === 'permissions' && !nextVal) {
      showToast('Təhlükəsizlik xətası: Superadmin səlahiyyət idarəetmə hüququndan məhrum edilə bilməz!', 'error');
      return;
    }

    updateRolePermissions(selectedRole, moduleId, 'view', nextVal);
    updateRolePermissions(selectedRole, moduleId, 'create', nextVal);
    updateRolePermissions(selectedRole, moduleId, 'edit', nextVal);
    updateRolePermissions(selectedRole, moduleId, 'delete', nextVal);
  };

  // User actions: 3-state cycle
  const handleCycleUserAction = async (userId: string, moduleId: SystemModuleId, action: PermissionAction) => {
    if (!selectedUser) return;
    const currentVal = selectedUser.customPermissions?.[moduleId]?.[action];
    let nextVal: boolean | null;

    if (currentVal === undefined) {
      nextVal = true;
    } else if (currentVal === true) {
      nextVal = false;
    } else {
      nextVal = null;
    }

    await updateUserCustomPermission(userId, moduleId, action, nextVal);
  };

  // User actions: Reset
  const handleUserReset = (user: UserAccount) => {
    confirmAction({
      title: `${user.fullName} üçün Fərdi İstisnaları Sıfırla`,
      message: `Bu istifadəçinin bütün fərdi səlahiyyət istisnaları silinəcək və o, "${ROLE_DETAILS[user.role]?.label || user.role}" rolunun standart qaydalarına qayıdacaq. Təsdiq edirsiniz?`,
      confirmText: 'Bəli, Rola Qaytar',
      danger: false,
      onConfirm: async () => {
        await resetUserCustomPermissions(user.id);
      },
    });
  };

  // User actions: Grant All
  const handleUserGrantAll = (user: UserAccount) => {
    confirmAction({
      title: `${user.fullName} üçün Bütün Hüquqları Aç`,
      message: `Bu istifadəçiyə bütün 15 sistem modulu üzrə Baxış, Əlavə, Redaktə və Silmə üçün fərdi icazə veriləcək. Davam edilsin?`,
      confirmText: 'Bəli, Bütün Hüquqları Aç',
      danger: false,
      onConfirm: async () => {
        const fullRules: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>> = {};
        SYSTEM_MODULES.forEach(m => {
          fullRules[m.id] = { view: true, create: true, edit: true, delete: true };
        });
        await bulkUpdateUserCustomPermissions(user.id, fullRules);
      },
    });
  };

  // User actions: View Only
  const handleUserViewOnly = (user: UserAccount) => {
    confirmAction({
      title: `${user.fullName} üçün Yalnız Oxuma Rejimi`,
      message: `Bütün modullarda yalnız baxış icazəsi veriləcək, əlavə, redaktə və silmə hüquqları qadağan ediləcək. Davam edilsin?`,
      confirmText: 'Bəli, Yalnız Oxuma Rejimi',
      danger: false,
      onConfirm: async () => {
        const viewRules: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>> = {};
        SYSTEM_MODULES.forEach(m => {
          viewRules[m.id] = { view: true, create: false, edit: false, delete: false };
        });
        await bulkUpdateUserCustomPermissions(user.id, viewRules);
      },
    });
  };

  // User actions: module-level quick toggle
  const handleUserModuleQuick = async (userId: string, moduleId: SystemModuleId, mode: 'all' | 'none' | 'reset') => {
    if (mode === 'reset') {
      await updateUserCustomPermission(userId, moduleId, 'view', null);
      await updateUserCustomPermission(userId, moduleId, 'create', null);
      await updateUserCustomPermission(userId, moduleId, 'edit', null);
      await updateUserCustomPermission(userId, moduleId, 'delete', null);
    } else if (mode === 'all') {
      await updateUserCustomPermission(userId, moduleId, 'view', true);
      await updateUserCustomPermission(userId, moduleId, 'create', true);
      await updateUserCustomPermission(userId, moduleId, 'edit', true);
      await updateUserCustomPermission(userId, moduleId, 'delete', true);
    } else if (mode === 'none') {
      await updateUserCustomPermission(userId, moduleId, 'view', false);
      await updateUserCustomPermission(userId, moduleId, 'create', false);
      await updateUserCustomPermission(userId, moduleId, 'edit', false);
      await updateUserCustomPermission(userId, moduleId, 'delete', false);
    }
  };

  // Calculate statistics for the active role
  const roleStats = useMemo(() => {
    let totalActions = 0;
    let grantedActions = 0;
    SYSTEM_MODULES.forEach(m => {
      const rule = activeRoleConfig[m.id];
      if (rule) {
        totalActions += 4;
        if (rule.view) grantedActions++;
        if (rule.create) grantedActions++;
        if (rule.edit) grantedActions++;
        if (rule.delete) grantedActions++;
      }
    });
    const percentage = totalActions > 0 ? Math.round((grantedActions / totalActions) * 100) : 0;
    return { totalActions, grantedActions, percentage };
  }, [activeRoleConfig]);

  const rolesList: { role: Role; label: string; icon: React.FC<{ className?: string }> }[] = [
    { role: 'direktor', label: 'Direktor (Superadmin)', icon: Crown },
    { role: 'texnobaba_meneceri', label: 'Texnobaba Meneceri', icon: Wrench },
    { role: 'menecer', label: 'Menecer', icon: Briefcase },
    { role: 'telimci', label: 'Təlimçi / Müəllim', icon: GraduationCap },
    { role: 'sagird', label: 'Şagird / Tələbə', icon: User },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Superadmin Status & Info */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Superadmin Rol & Səlahiyyət İdarəetmə Mərkəzi
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                  RBAC · 2-Səviyyəli İdarəetmə
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Firestore Canlı Sinxronizasiya
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                İstər rollar üzrə qlobal standartları, istərsə də ayrı-ayrı istifadəçilərə məxsus fərdi istisnaları
                (<span className="text-indigo-300 font-semibold">Baxış, Əlavə, Redaktə, Silmə</span>) bir mərkəzdən idarə edin.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {managementScope === 'roles' ? (
              <button
                onClick={handleResetAllRoles}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-700/50 transition-all cursor-pointer shadow-xs"
                title="Bütün rolları standart vəziyyətə sıfırla"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Bütün Rolları Sıfırla</span>
              </button>
            ) : selectedUser ? (
              <button
                onClick={() => setModalUser(selectedUser)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-xs"
                title="Detallı pəncərədə aç"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Detallı Pəncərə</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Safety Lockout Notice */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-[11px] text-slate-400 flex-wrap">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong className="text-amber-300 font-medium">Təhlükəsizlik Kilidi Qorunması:</strong> Direktor (Superadmin) hesabı üçün səlahiyyətlər modulunun idarəsi daimi aktiv saxlanılır.
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-300 bg-slate-800/60 px-3 py-1 rounded-md border border-slate-700/50">
            <span className="text-slate-400">Cari Test Rolu:</span>
            <span className="font-bold text-indigo-300 capitalize">{currentRole}</span>
          </div>
        </div>
      </div>

      {/* Main Scope Switcher Tab Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          <button
            onClick={() => setManagementScope('roles')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              managementScope === 'roles'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Rollar üzrə Standart Qaydalar</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
              5 Rol
            </span>
          </button>

          <button
            onClick={() => setManagementScope('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              managementScope === 'users'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Fərdi İstifadəçi Səlahiyyətləri</span>
            {usersWithOverridesCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                {usersWithOverridesCount} fərdi
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 font-semibold">
                {activeUsers.length} nəfər
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            {managementScope === 'roles'
              ? 'Rol qaydaları bütün istifadəçilər üçün baza şablonudur.'
              : 'Fərdi istisnalar rol qaydalarını üstələyir (Force Allow / Force Deny).'}
          </span>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODE 1: ROLES MANAGEMENT (Existing Detail & Matrix Views) */}
      {/* ========================================================== */}
      {managementScope === 'roles' && (
        <div className="space-y-6">
          {/* Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {rolesList.map(({ role, label, icon: IconComponent }) => {
              const isSelected = selectedRole === role;
              const details = ROLE_DETAILS[role];
              const count = roleCounts[role];

              // Compute permissions summary for this role
              let activeCount = 0;
              SYSTEM_MODULES.forEach(m => {
                const rule = rolePermissions[role]?.[m.id];
                if (rule) {
                  if (rule.view) activeCount++;
                  if (rule.create) activeCount++;
                  if (rule.edit) activeCount++;
                  if (rule.delete) activeCount++;
                }
              });
              const totalCount = SYSTEM_MODULES.length * 4;
              const pct = Math.round((activeCount / totalCount) * 100);

              return (
                <div
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-lg ${details.bgLightClass}`}>
                      <IconComponent className={`w-5 h-5 ${details.colorClass}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {count} nəfər
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{label}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">{details.description}</p>

                  <div className="space-y-1 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Səlahiyyət:</span>
                      <span className="font-semibold text-slate-700">{activeCount}/{totalCount} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct > 75 ? 'bg-emerald-500' : pct > 40 ? 'bg-indigo-500' : pct > 15 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${activeRoleDetails.bgLightClass}`}>
                  {activeRoleDetails.label}
                </div>
                <div className="text-xs text-slate-500">
                  Səlahiyyət əhatəsi: <strong className="text-slate-800">{roleStats.grantedActions}</strong> / {roleStats.totalActions} ({roleStats.percentage}%)
                </div>
              </div>

              {/* Quick Buttons for the Selected Role */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleGrantAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                  title="Bütün modullara tam hüquq ver"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Bütün Hüquqları Ver</span>
                </button>

                <button
                  onClick={handleViewOnly}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  title="Yalnız oxuma/baxış hüququ saxla"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Yalnız Baxış Rejimi</span>
                </button>

                <button
                  onClick={() => handleResetRole(selectedRole)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                  title="Bu rol üçün standart ilkin qaydalara qaytar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Standart Qaydaya Sıfırla</span>
                </button>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
                  <button
                    onClick={() => setViewMode('detail')}
                    className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      viewMode === 'detail'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Detallı kartlar görünüşü"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Detallı</span>
                  </button>
                  <button
                    onClick={() => setViewMode('matrix')}
                    className={`p-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                      viewMode === 'matrix'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Müqayisəli matris cədvəli"
                  >
                    <TableProperties className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">5 Rol Matrisi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Modul adı və ya təsvir üzrə axtarış..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1 hidden md:inline">Kateqoriya:</span>
                {[
                  { id: 'all', label: 'Bütün Modullar' },
                  { id: 'core', label: 'Əsas CRM' },
                  { id: 'academic', label: 'Akademik' },
                  { id: 'management', label: 'İdarəetmə' },
                  { id: 'system', label: 'Sistem' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-md font-medium text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* VIEW MODE: DETAILED CARDS */}
          {viewMode === 'detail' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredModules.map(moduleMeta => {
                const rule = activeRoleConfig[moduleMeta.id] || { view: false, create: false, edit: false, delete: false };
                const isSafetyLocked = selectedRole === 'direktor' && moduleMeta.id === 'permissions';

                return (
                  <div
                    key={moduleMeta.id}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getModuleEmoji(moduleMeta.category, moduleMeta.id)}</span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs">{moduleMeta.label}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{moduleMeta.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isSafetyLocked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> Qorunur
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={isSafetyLocked}
                            onClick={() => handleToggleModuleAll(moduleMeta.id)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold px-1.5 py-0.5 rounded hover:bg-indigo-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Bütün hüquqları aç/bağla"
                          >
                            Hamısını Dəyiş
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                        {moduleMeta.description}
                      </p>
                    </div>

                    {/* 4 Permission Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-3 border-t border-slate-100">
                      {/* View Action */}
                      <button
                        type="button"
                        disabled={isSafetyLocked}
                        onClick={() => updateRolePermissions(selectedRole, moduleMeta.id, 'view', !rule.view)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
                          rule.view
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                        } ${isSafetyLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Baxış</span>
                      </button>

                      {/* Create Action */}
                      <button
                        type="button"
                        disabled={isSafetyLocked}
                        onClick={() => updateRolePermissions(selectedRole, moduleMeta.id, 'create', !rule.create)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
                          rule.create
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                        } ${isSafetyLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Əlavə</span>
                      </button>

                      {/* Edit Action */}
                      <button
                        type="button"
                        disabled={isSafetyLocked}
                        onClick={() => updateRolePermissions(selectedRole, moduleMeta.id, 'edit', !rule.edit)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
                          rule.edit
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                        } ${isSafetyLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Redaktə</span>
                      </button>

                      {/* Delete Action */}
                      <button
                        type="button"
                        disabled={isSafetyLocked}
                        onClick={() => updateRolePermissions(selectedRole, moduleMeta.id, 'delete', !rule.delete)}
                        className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer ${
                          rule.delete
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                        } ${isSafetyLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Silmə</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE: MATRIX TABLE */}
          {viewMode === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">Bütün 5 Rol üçün Müqayisəli Səlahiyyət Matrisi</span>
                <span className="text-[11px] text-slate-500">
                  Hər sütunda: <strong>B</strong> (Baxış) · <strong>Ə</strong> (Əlavə) · <strong>R</strong> (Redaktə) · <strong>S</strong> (Silmə)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700">
                      <th className="py-2.5 px-3 font-bold w-64">Modul</th>
                      {rolesList.map(({ role, label }) => (
                        <th key={role} className="py-2.5 px-3 font-bold text-center border-l border-slate-200">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredModules.map(moduleMeta => (
                      <tr key={moduleMeta.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{getModuleEmoji(moduleMeta.category, moduleMeta.id)}</span>
                            <div>
                              <div className="font-semibold text-slate-800">{moduleMeta.label}</div>
                              <div className="text-[10px] text-slate-400">{moduleMeta.category}</div>
                            </div>
                          </div>
                        </td>

                        {rolesList.map(({ role }) => {
                          const rule = rolePermissions[role]?.[moduleMeta.id] || { view: false, create: false, edit: false, delete: false };
                          const isLocked = role === 'direktor' && moduleMeta.id === 'permissions';

                          return (
                            <td key={role} className="py-2 px-2 border-l border-slate-200 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => updateRolePermissions(role, moduleMeta.id, 'view', !rule.view)}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
                                    rule.view ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                                  title={`${moduleMeta.label} - Baxış: ${rule.view ? 'Aktiv' : 'Deaktiv'}`}
                                >
                                  B
                                </button>
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => updateRolePermissions(role, moduleMeta.id, 'create', !rule.create)}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
                                    rule.create ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                                  title={`${moduleMeta.label} - Əlavə: ${rule.create ? 'Aktiv' : 'Deaktiv'}`}
                                >
                                  Ə
                                </button>
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => updateRolePermissions(role, moduleMeta.id, 'edit', !rule.edit)}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
                                    rule.edit ? 'bg-amber-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                                  title={`${moduleMeta.label} - Redaktə: ${rule.edit ? 'Aktiv' : 'Deaktiv'}`}
                                >
                                  R
                                </button>
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => updateRolePermissions(role, moduleMeta.id, 'delete', !rule.delete)}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ${
                                    rule.delete ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  } ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
                                  title={`${moduleMeta.label} - Silmə: ${rule.delete ? 'Aktiv' : 'Deaktiv'}`}
                                >
                                  S
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* MODE 2: PER-USER PERMISSION MANAGEMENT (Exceptions View)   */}
      {/* ========================================================== */}
      {managementScope === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: User Selector List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
            {/* Search and Filters Header */}
            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  İstifadəçilər ({filteredUsers.length})
                </span>
                {usersWithOverridesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    {usersWithOverridesCount} fərdi tənzimlənmiş
                  </span>
                )}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  placeholder="Ad, soyad, email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>

              {/* Role Filter & Override Toggle */}
              <div className="flex items-center gap-2">
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value as any)}
                  className="flex-1 py-1 px-2 text-xs rounded-md border border-slate-200 bg-white focus:outline-hidden focus:border-indigo-500 text-slate-700"
                >
                  <option value="all">Bütün Rollar</option>
                  <option value="direktor">Direktor</option>
                  <option value="texnobaba_meneceri">Texnobaba Meneceri</option>
                  <option value="menecer">Menecer</option>
                  <option value="telimci">Təlimçi</option>
                  <option value="sagird">Şagird</option>
                </select>

                <button
                  type="button"
                  onClick={() => setOnlyWithOverrides(!onlyWithOverrides)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer border ${
                    onlyWithOverrides
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Yalnız fərdi istisnası olan istifadəçiləri süzgəcdən keçir"
                >
                  Fərdilər
                </button>
              </div>
            </div>

            {/* Scrollable User List */}
            <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Axtarışa uyğun istifadəçi tapılmadı.
                </div>
              ) : (
                filteredUsers.map(userItem => {
                  const isSelected = selectedUser?.id === userItem.id;
                  const roleMeta = ROLE_DETAILS[userItem.role] || ROLE_DETAILS.menecer;
                  const overrideCount = userItem.customPermissions
                    ? Object.values(userItem.customPermissions).reduce((acc, mod) => acc + (mod ? Object.keys(mod).length : 0), 0)
                    : 0;

                  return (
                    <div
                      key={userItem.id}
                      onClick={() => setSelectedUserId(userItem.id)}
                      className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600 pl-2.5'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 shadow-2xs">
                          {userItem.fullName ? userItem.fullName.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {userItem.fullName}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${roleMeta.bgLightClass}`}>
                              {roleMeta.label}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{userItem.email}</div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1">
                        {overrideCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            <SlidersHorizontal className="w-2.5 h-2.5" />
                            {overrideCount} istisna
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Roldan irsi
                          </span>
                        )}
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 ${isSelected ? 'text-indigo-600' : ''}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected User Permissions Panel (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedUser ? (
              <>
                {/* User Header Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                        {selectedUser.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-base text-slate-900">{selectedUser.fullName}</h3>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${(ROLE_DETAILS[selectedUser.role] || ROLE_DETAILS.menecer).bgLightClass}`}>
                            {(ROLE_DETAILS[selectedUser.role] || ROLE_DETAILS.menecer).label}
                          </span>
                          {selectedUser.branchName && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {selectedUser.branchName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</p>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for Selected User */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleUserGrantAll(selectedUser)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                        title="Bütün modullara tam hüquq ver"
                      >
                        Tam Aç
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUserViewOnly(selectedUser)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                        title="Yalnız oxuma/baxış hüququ ver"
                      >
                        Yalnız Oxuma
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUserReset(selectedUser)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                        title="Bütün fərdi istisnaları sil və rola sıfırla"
                      >
                        Rola Sıfırla
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalUser(selectedUser)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Pəncərə rejimində aç"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Pəncərə</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                      <div className="text-[10px] text-slate-500 font-medium">Baza Rol Qaydası</div>
                      <div className="font-bold text-slate-800 capitalize mt-0.5">{selectedUser.role}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60">
                      <div className="text-[10px] text-amber-700 font-medium">Ümumi Fərdi İstisna</div>
                      <div className="font-bold text-amber-900 mt-0.5">{selectedUserStats.total} əməliyyat</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                      <div className="text-[10px] text-emerald-700 font-medium">Xüsusi İcazələr</div>
                      <div className="font-bold text-emerald-900 mt-0.5">+{selectedUserStats.allows} hüquq</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/60">
                      <div className="text-[10px] text-rose-700 font-medium">Xüsusi Qadağalar</div>
                      <div className="font-bold text-rose-900 mt-0.5">-{selectedUserStats.denies} hüquq</div>
                    </div>
                  </div>

                  {/* 3-State Legend */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-2 border-t border-slate-100 flex-wrap">
                    <span className="font-semibold text-slate-700">Düymə vəziyyətləri:</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                      <span>Roldan İrsi (Standart)</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <strong className="text-emerald-700 font-semibold">Fərdi İcazə (Aktiv)</strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <strong className="text-rose-700 font-semibold">Fərdi Qadağan (Blok)</strong>
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      (Düyməyə klikləyərək vəziyyəti ardıcıl dəyişə bilərsiniz)
                    </span>
                  </div>
                </div>

                {/* Modules Filter & Search */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Modullarda axtarış..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-indigo-500 placeholder-slate-400 text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
                    {[
                      { id: 'all', label: 'Bütün' },
                      { id: 'core', label: 'Əsas CRM' },
                      { id: 'academic', label: 'Akademik' },
                      { id: 'management', label: 'İdarəetmə' },
                      { id: 'system', label: 'Sistem' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`px-2.5 py-1 rounded-md font-medium text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modules Interactive List */}
                <div className="space-y-3">
                  {filteredModules.map(moduleMeta => {
                    const roleRule = rolePermissions[selectedUser.role]?.[moduleMeta.id] || { view: false, create: false, edit: false, delete: false };
                    const userRule = selectedUser.customPermissions?.[moduleMeta.id];

                    const actions: PermissionAction[] = ['view', 'create', 'edit', 'delete'];
                    const actionLabels: Record<PermissionAction, { label: string; icon: React.FC<{ className?: string }> }> = {
                      view: { label: 'Baxış', icon: Eye },
                      create: { label: 'Əlavə', icon: PlusCircle },
                      edit: { label: 'Redaktə', icon: Edit3 },
                      delete: { label: 'Silmə', icon: Trash2 },
                    };

                    const hasModuleOverrides = userRule && Object.keys(userRule).length > 0;

                    return (
                      <div
                        key={moduleMeta.id}
                        className={`bg-white rounded-xl border p-4 shadow-2xs transition-all ${
                          hasModuleOverrides ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200/90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{getModuleEmoji(moduleMeta.category, moduleMeta.id)}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-xs">{moduleMeta.label}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">({moduleMeta.id})</span>
                                {hasModuleOverrides && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    Fərdi istisna
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{moduleMeta.description}</p>
                            </div>
                          </div>

                          {/* Quick module action buttons */}
                          <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUserModuleQuick(selectedUser.id, moduleMeta.id, 'all')}
                              className="text-[10px] px-2 py-0.5 rounded font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                              title="Bütün əməliyyatları fərdi icazə et"
                            >
                              Tam Aç
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUserModuleQuick(selectedUser.id, moduleMeta.id, 'none')}
                              className="text-[10px] px-2 py-0.5 rounded font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                              title="Bütün əməliyyatları fərdi blokla"
                            >
                              Tam Bağla
                            </button>
                            {hasModuleOverrides && (
                              <button
                                type="button"
                                onClick={() => handleUserModuleQuick(selectedUser.id, moduleMeta.id, 'reset')}
                                className="text-[10px] px-2 py-0.5 rounded font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                                title="Bu modulun istisnalarını sil və rola qaytar"
                              >
                                Rola Qaytar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 4 Interactive 3-State Buttons */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                          {actions.map(action => {
                            const { label, icon: ActionIcon } = actionLabels[action];
                            const customVal = userRule?.[action];
                            const roleDefault = roleRule[action];

                            // Determine status styling
                            let badgeStyle = '';
                            let statusText = '';
                            let iconElement = <ActionIcon className="w-3.5 h-3.5" />;

                            if (customVal === true) {
                              badgeStyle = 'bg-emerald-600 text-white shadow-2xs border-emerald-600 ring-2 ring-emerald-200';
                              statusText = 'Fərdi İcazə';
                              iconElement = <Check className="w-3.5 h-3.5 stroke-[3]" />;
                            } else if (customVal === false) {
                              badgeStyle = 'bg-rose-600 text-white shadow-2xs border-rose-600 ring-2 ring-rose-200';
                              statusText = 'Fərdi Qadağan';
                              iconElement = <Lock className="w-3.5 h-3.5" />;
                            } else {
                              badgeStyle = roleDefault
                                ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                : 'bg-slate-50/60 text-slate-400 border-slate-200/60 hover:bg-slate-100';
                              statusText = roleDefault ? 'Roldan: İcazə' : 'Roldan: Yoxdur';
                            }

                            return (
                              <button
                                key={action}
                                type="button"
                                onClick={() => handleCycleUserAction(selectedUser.id, moduleMeta.id, action)}
                                className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition-all cursor-pointer text-left ${badgeStyle}`}
                                title={`${moduleMeta.label} - ${label}: klikləyərək vəziyyəti dəyişin (İrsi -> İcazə -> Qadağan)`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs font-bold flex items-center gap-1.5">
                                    {iconElement}
                                    {label}
                                  </span>
                                  {customVal !== undefined && (
                                    <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 rounded bg-black/20">
                                      {customVal ? 'ON' : 'OFF'}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-medium leading-none ${customVal !== undefined ? 'text-white/90' : 'text-slate-500'}`}>
                                  {statusText}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">İstifadəçi seçilməyib</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Sol tərəfdəki siyahıdan fərdi səlahiyyətlərini tənzimləmək istədiyiniz istifadəçini seçin.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Embedded Modal Dialog (if opened via button) */}
      {modalUser && (
        <UserPermissionsModal
          isOpen={!!modalUser}
          user={modalUser}
          onClose={() => setModalUser(null)}
        />
      )}
    </div>
  );
};
