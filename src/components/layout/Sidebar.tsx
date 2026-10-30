import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  QrCode,
  Award,
  BookOpen,
  Wallet,
  MessageSquare,
  Building2,
  UserCog,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  User,
  Target,
  FileSignature,
  ClipboardList,
  Boxes,
  Package,
  Cpu,
  Truck,
  CreditCard,
  BarChart3,
  Layers,
  Wrench,
  AlertTriangle,
  Share2,
} from 'lucide-react';
import { useCrm, ActiveTab } from '../../context/CrmContext';
import { Role, SystemModuleId, InventorySubTab } from '../../types/crm';
import { ROLE_DETAILS } from '../../utils/permissions';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  count?: number;
  roles: string[];
}

interface InventorySubMenuItem {
  id: ActiveTab;
  subTab: InventorySubTab;
  label: string;
  icon: LucideIcon;
  count?: number;
  roles: Role[];
}

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    selectedBranchId,
    setSelectedBranchId,
    branches,
    students,
    contracts,
    leads,
    certificates,
    groups,
    users,
    staff,
    currentUser,
    expenses,
    tasks,
    inventoryOrders,
    equipmentRequests,
    technicalTickets,
    activeInventorySubTab,
    setActiveInventorySubTab,
    setIsProfileModalOpen,
    can,
  } = useCrm();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);

  const activeStudentsCount = students.filter(s => s.status === 'aktiv').length;
  const activeTasksCount = tasks.filter(t => t.status !== 'tamamlandi' && t.status !== 'texire_salindi').length;
  const activeLeadsCount = leads.filter(l => l.stage !== 'qeydiyyat' && l.stage !== 'imtina').length;
  const pendingExpensesCount = expenses.filter(e => e.approvalStatus === 'gozleyir').length;

  const pendingOrdersCount = inventoryOrders.filter(o => o.status === 'yeni' || o.status === 'baxilir').length;
  const pendingRequestsCount = equipmentRequests.filter(r => r.status === 'yeni' || r.status === 'nezere_alindi').length;
  const openTicketsCount = technicalTickets.filter(t => t.status !== 'tamamlandi').length;

  const navModuleMap: Partial<Record<ActiveTab, SystemModuleId>> = {
    dashboard: 'dashboard',
    students: 'students',
    contracts: 'contracts',
    groups: 'groups',
    leads: 'leads',
    attendance: 'attendance',
    'staff-attendance': 'staffAttendance',
    certificates: 'certificates',
    curriculum: 'curriculum',
    finance: 'finance',
    tasks: 'tasks',
    kpi: 'kpi',
    whatsapp: 'whatsapp',
    branches: 'branches',
    users: 'users',
    staff: 'users',
    inventory: 'inventory',
    'inventory-overview': 'inventory',
    'inventory-diy': 'inventory',
    'inventory-paid': 'inventory',
    'inventory-warehouse': 'inventory',
    'inventory-branches': 'inventory',
    'inventory-equipment': 'inventory',
    'inventory-equipment-requests': 'inventory',
    'inventory-tickets': 'inventory',
    'inventory-orders': 'inventory',
    'inventory-debts': 'inventory',
    'inventory-acts': 'inventory',
    'inventory-reports': 'inventory',
    marketing: 'marketing',
  };

  const isItemVisible = (item: NavItem) => {
    const moduleId = navModuleMap[item.id];
    if (moduleId) {
      return can('view', moduleId);
    }
    return item.roles.includes(currentRole);
  };

  // Branch Submenu Items (Filiallar alt menyusu)
  const branchSubmenuItems: NavItem[] = [
    {
      id: 'students',
      label: 'Tələbələr',
      icon: Users,
      count: activeStudentsCount,
      roles: ['direktor', 'menecer'],
    },
    {
      id: 'contracts',
      label: 'Müqavilələr',
      icon: FileSignature,
      count: contracts.filter(c => c.status === 'aktiv').length,
      roles: ['direktor', 'menecer'],
    },
    {
      id: 'leads',
      label: 'Lidlər',
      icon: UserCheck,
      count: activeLeadsCount,
      roles: ['direktor', 'menecer'],
    },
    {
      id: 'attendance',
      label: 'Davamiyyət',
      icon: CalendarCheck,
      roles: ['direktor', 'menecer', 'telimci', 'sagird'],
    },
    {
      id: 'staff-attendance',
      label: 'QR Giriş',
      icon: QrCode,
      roles: ['direktor', 'menecer', 'telimci'],
    },
    {
      id: 'groups',
      label: 'Qruplar',
      icon: GraduationCap,
      count: currentRole === 'sagird' ? 1 : groups.length,
      roles: ['direktor', 'menecer', 'telimci', 'sagird'],
    },
    {
      id: 'certificates',
      label: 'Sertifikatlar',
      icon: Award,
      count: certificates.length,
      roles: ['direktor', 'menecer', 'telimci', 'sagird'],
    },
    {
      id: 'branches',
      label: 'Filial Tənzimləmələri',
      icon: Building2,
      count: branches.length,
      roles: ['direktor'],
    },
  ];

  const visibleBranchSubmenuItems = branchSubmenuItems.filter(isItemVisible);
  const isBranchSubmenuActive = visibleBranchSubmenuItems.some(item => item.id === activeTab);

  // Inventory Submenu Items (İnventarizasiya və texniki müraciətlər)
  const inventorySubmenuItems: InventorySubMenuItem[] = [
    { id: 'inventory-overview', subTab: 'overview', label: '1. Ümumi baxış', icon: Layers, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-diy', subTab: 'diy', label: '2. DIY məhsulları', icon: Boxes, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-paid', subTab: 'paid', label: '3. Ödənişli məhsullar', icon: Package, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-warehouse', subTab: 'warehouse', label: '4. Mərkəzi anbar', icon: Building2, roles: ['direktor', 'texnobaba_meneceri'] },
    { id: 'inventory-branches', subTab: 'branches', label: '5. Filial inventarları', icon: Building2, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-equipment', subTab: 'equipment', label: '6. Avadanlıqlar', icon: Cpu, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-equipment-requests', subTab: 'equipment-requests', label: '7. Avadanlıq tələbləri', icon: Wrench, count: pendingRequestsCount > 0 ? pendingRequestsCount : undefined, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-tickets', subTab: 'tickets', label: '8. Texniki müraciətlər', icon: AlertTriangle, count: openTicketsCount > 0 ? openTicketsCount : undefined, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-orders', subTab: 'orders', label: '9. Sifarişlər və göndərişlər', icon: Truck, count: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-debts', subTab: 'debts', label: '10. Borclar və ödənişlər', icon: CreditCard, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-acts', subTab: 'acts', label: '11. Aktlar və sənədlər', icon: FileSignature, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'inventory-reports', subTab: 'reports', label: '12. Hesabatlar', icon: BarChart3, roles: ['direktor', 'texnobaba_meneceri'] },
  ];

  const visibleInventorySubmenuItems = inventorySubmenuItems.filter(item =>
    item.roles.includes(currentRole as Role)
  );

  const isInventoryAllowed = can('view', 'inventory');
  const isInventoryActive = activeTab.startsWith('inventory');

  // Auto-open submenus if navigated
  useEffect(() => {
    if (isBranchSubmenuActive) {
      setIsBranchMenuOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isInventoryActive) {
      setIsInventoryMenuOpen(true);
    }
  }, [activeTab]);

  // Bottom Navigation Items (Maliyyə və digər modullar)
  const bottomNavigation: NavItem[] = [
    {
      id: 'finance',
      label: 'Maliyyə',
      icon: Wallet,
      count: pendingExpensesCount > 0 ? pendingExpensesCount : undefined,
      roles: ['direktor', 'menecer'],
    },
    {
      id: 'curriculum',
      label: 'Kurikulum',
      icon: BookOpen,
      roles: ['direktor', 'menecer', 'telimci', 'sagird'],
    },
    {
      id: 'tasks',
      label: 'Tapşırıqlar',
      icon: ClipboardList,
      count: activeTasksCount > 0 ? activeTasksCount : undefined,
      roles: ['direktor', 'menecer', 'telimci'],
    },
    {
      id: 'kpi',
      label: 'KPI Sistemi',
      icon: Target,
      roles: ['direktor', 'menecer', 'telimci'],
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      roles: ['direktor', 'menecer'],
    },
    {
      id: 'marketing',
      label: 'Marketinq və SMM',
      icon: Share2,
      roles: ['direktor', 'menecer', 'telimci'],
    },
    {
      id: 'users',
      label: currentRole === 'menecer' ? 'Təlimçilər & Heyət' : 'İstifadəçilər',
      icon: currentRole === 'menecer' ? GraduationCap : UserCog,
      count: currentRole === 'menecer' ? staff.filter(s => s.role === 'Təlimçi').length : users.length,
      roles: ['direktor', 'menecer'],
    },
  ];

  const visibleBottomItems = bottomNavigation.filter(isItemVisible);

  const totalInventoryBadge = (pendingOrdersCount + pendingRequestsCount + openTicketsCount);

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none transition-all duration-200 relative`}
    >
      {/* Brand Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            A
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-white font-bold text-sm tracking-tight truncate leading-tight">
                AREA
              </h1>
              <p className="text-[10px] text-slate-400 truncate">CRM Tədris</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Menyunu Aç' : 'Menyunu Yığ'}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 scrollbar-thin">
        {/* 1. İdarəetmə Paneli (Dashboard) */}
        <button
          onClick={() => setActiveTab('dashboard')}
          title="İdarəetmə Paneli"
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
          } py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <LayoutDashboard
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
              }`}
            />
            {!isCollapsed && <span className="truncate">İdarəetmə Paneli</span>}
          </div>
        </button>

        {/* 2. Filiallar Section with Accordion Submenu */}
        {visibleBranchSubmenuItems.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                  setIsBranchMenuOpen(true);
                } else {
                  setIsBranchMenuOpen(prev => !prev);
                }
              }}
              title="Filiallar"
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
              } py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                isBranchSubmenuActive && !isBranchMenuOpen
                  ? 'bg-slate-800/90 text-indigo-300 font-semibold border border-indigo-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2
                  className={`w-4 h-4 shrink-0 ${
                    isBranchSubmenuActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate font-semibold">Filiallar</span>}
              </div>

              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isBranchMenuOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              )}

              {isCollapsed && isBranchSubmenuActive && (
                <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Submenu Items List */}
            {!isCollapsed && isBranchMenuOpen && (
              <div className="pl-2 pr-1 py-1 space-y-0.5 border-l border-slate-800 ml-4 bg-slate-950/40 rounded-r-lg">
                {visibleBranchSubmenuItems.map(subItem => {
                  const SubIcon = subItem.icon;
                  const isSubActive = activeTab === subItem.id;

                  return (
                    <button
                      key={subItem.id}
                      onClick={() => setActiveTab(subItem.id)}
                      title={subItem.label}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer group ${
                        isSubActive
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate text-[11.5px]">{subItem.label}</span>
                      </div>

                      {subItem.count !== undefined && (
                        <span
                          className={`text-[9.5px] font-mono-nums px-1.5 py-0.2 rounded text-center shrink-0 ${
                            isSubActive
                              ? 'bg-indigo-700 text-indigo-100'
                              : 'bg-slate-800/80 text-slate-400'
                          }`}
                        >
                          {subItem.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. İnventarizasiya və Texniki Müraciətlər (Əsas Modul Menyusu) */}
        {isInventoryAllowed && visibleInventorySubmenuItems.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                  setIsInventoryMenuOpen(true);
                } else {
                  setIsInventoryMenuOpen(prev => !prev);
                }
              }}
              title="İnventarizasiya və texniki müraciətlər"
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
              } py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer group ${
                isInventoryActive && !isInventoryMenuOpen
                  ? 'bg-slate-800/90 text-blue-300 font-semibold border border-blue-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Boxes
                  className={`w-4 h-4 shrink-0 ${
                    isInventoryActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <span className="truncate font-semibold text-blue-200">
                    İnventar & Texniki
                  </span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  {totalInventoryBadge > 0 && (
                    <span className="px-1.5 py-0.2 text-[9.5px] font-bold bg-amber-500 text-slate-950 rounded-full">
                      {totalInventoryBadge}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isInventoryMenuOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </div>
              )}

              {isCollapsed && isInventoryActive && (
                <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-slate-900" />
              )}
            </button>

            {/* Inventory Submenu Items List */}
            {!isCollapsed && isInventoryMenuOpen && (
              <div className="pl-2 pr-1 py-1 space-y-0.5 border-l border-blue-900/60 ml-4 bg-slate-950/50 rounded-r-lg">
                {visibleInventorySubmenuItems.map(subItem => {
                  const SubIcon = subItem.icon;
                  const isSubActive =
                    activeTab === subItem.id ||
                    (activeTab === 'inventory' && activeInventorySubTab === subItem.subTab);

                  return (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        setActiveTab(subItem.id);
                        setActiveInventorySubTab(subItem.subTab);
                      }}
                      title={subItem.label}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer group ${
                        isSubActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <SubIcon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate text-[11px]">{subItem.label}</span>
                      </div>

                      {subItem.count !== undefined && subItem.count > 0 && (
                        <span
                          className={`text-[9.5px] font-mono-nums px-1.5 py-0.2 rounded text-center shrink-0 ${
                            isSubActive
                              ? 'bg-blue-700 text-white font-bold'
                              : 'bg-amber-500/90 text-slate-950 font-bold'
                          }`}
                        >
                          {subItem.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Bottom Items (Maliyyə, Kurikulum, Tapşırıqlar, KPI, WhatsApp, İstifadəçilər) */}
        {visibleBottomItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-0' : 'justify-between px-2.5'
              } py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!isCollapsed && item.count !== undefined && (
                <span
                  className={`text-[10px] font-mono-nums px-1.5 py-0.2 rounded text-center shrink-0 ${
                    isActive
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              )}

              {isCollapsed && item.count !== undefined && item.count > 0 && (
                <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Authenticated User Profile at Bottom */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-900/95">
        {currentUser && (
          <button
            onClick={() => setIsProfileModalOpen(true)}
            title="Profil Tənzimləmələri"
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
            } rounded-xl hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-all cursor-pointer group`}
          >
            <div className="flex items-center gap-2.5 truncate min-w-0">
              {currentUser.photoURL || currentUser.avatarUrl ? (
                <img
                  src={currentUser.photoURL || currentUser.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className="truncate text-left min-w-0">
                  <div className="truncate text-slate-200 group-hover:text-white font-semibold text-xs leading-tight">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-indigo-400 font-medium truncate mt-0.5">
                    {ROLE_DETAILS[currentRole as Role]?.label || 'İstifadəçi'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <User className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0 ml-1" />
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
