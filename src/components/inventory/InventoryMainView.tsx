import React, { useState } from 'react';
import {
  Boxes,
  FileSignature,
  Wrench,
  AlertTriangle,
  Building2,
  Package,
  Layers,
  Truck,
  CreditCard,
  FileText,
  BarChart3,
  Cpu,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventorySubTab } from '../../types/crm';
import { InventoryOverview } from './InventoryOverview';
import { DiyProductsView } from './DiyProductsView';
import { PaidProductsView } from './PaidProductsView';
import { CentralWarehouseView } from './CentralWarehouseView';
import { BranchInventoriesView } from './BranchInventoriesView';
import { EquipmentRegistryView } from './EquipmentRegistryView';
import { EquipmentRequestsView } from './EquipmentRequestsView';
import { TechnicalTicketsView } from './TechnicalTicketsView';
import { OrdersShipmentsView } from './OrdersShipmentsView';
import { DebtsPaymentsView } from './DebtsPaymentsView';
import { ActsArchiveView } from './ActsArchiveView';
import { InventoryReportsView } from './InventoryReportsView';
import { ActPrintModal } from './ActPrintModal';
import { InventoryTestRunner } from './InventoryTestRunner';

interface TabItem {
  id: InventorySubTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
  roles: Array<'direktor' | 'texnobaba_meneceri' | 'menecer'>;
}

export const InventoryMainView: React.FC = () => {
  const {
    currentRole,
    currentUser,
    branches,
    inventoryOrders,
    equipmentRequests,
    technicalTickets,
    inventoryActs,
    activeInventorySubTab,
    setActiveInventorySubTab,
  } = useCrm();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [activeModalActId, setActiveModalActId] = useState<string | null>(null);

  // RBAC checks
  const isDirector = currentRole === 'direktor';
  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const isAuthorized = isDirector || isTexnobaba || isManager;

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-600">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            İcazə Verilmədi
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sizin mövcud rolunuz üçün «İnventarizasiya və texniki müraciətlər» moduluna giriş məhdudlaşdırılıb. Zəhmət olmasa Texnobaba Meneceri və ya Administratorla əlaqə saxlayın.
          </p>
        </div>
      </div>
    );
  }

  // Branch context
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;
  const effectiveBranchId = managerBranchId || (selectedBranchFilter !== 'all' ? selectedBranchFilter : undefined);

  // Badge counts
  const pendingOrdersCount = inventoryOrders.filter(o => 
    (o.status === 'yeni' || o.status === 'baxilir') && (!effectiveBranchId || o.branchId === effectiveBranchId)
  ).length;

  const pendingRequestsCount = equipmentRequests.filter(r => 
    (r.status === 'yeni' || r.status === 'nezere_alindi') && (!effectiveBranchId || r.branchId === effectiveBranchId)
  ).length;

  const openTicketsCount = technicalTickets.filter(t => 
    t.status !== 'tamamlandi' && (!effectiveBranchId || t.branchId === effectiveBranchId)
  ).length;

  const unsignedActsCount = inventoryActs.filter(a => 
    !a.signedByTexnobaba || !a.signedByManager
  ).length;

  // Tabs configuration
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Ümumi baxış', icon: Layers, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'diy', label: 'DIY məhsulları', icon: Boxes, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'paid', label: 'Ödənişli məhsullar', icon: Package, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'warehouse', label: 'Mərkəzi anbar', icon: Building2, roles: ['direktor', 'texnobaba_meneceri'] },
    { id: 'branches', label: 'Filial inventarları', icon: Building2, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'equipment', label: 'Avadanlıqlar', icon: Cpu, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'equipment-requests', label: 'Avadanlıq tələbləri', icon: Wrench, badge: pendingRequestsCount, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'tickets', label: 'Texniki müraciətlər', icon: AlertTriangle, badge: openTicketsCount, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'orders', label: 'Sifarişlər və göndərişlər', icon: Truck, badge: pendingOrdersCount, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'debts', label: 'Borclar və ödənişlər', icon: CreditCard, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'acts', label: 'Aktlar və sənədlər', icon: FileSignature, badge: unsignedActsCount, roles: ['direktor', 'texnobaba_meneceri', 'menecer'] },
    { id: 'reports', label: 'Hesabatlar', icon: BarChart3, roles: ['direktor', 'texnobaba_meneceri'] },
  ];

  const allowedTabs = tabs.filter(t => t.roles.includes(currentRole as any));

  // If current active tab is not allowed for this role, default to 'overview'
  const activeTabSafe: InventorySubTab = allowedTabs.some(t => t.id === activeInventorySubTab)
    ? activeInventorySubTab
    : 'overview';

  const handleNavigateTab = (tab: InventorySubTab) => {
    setActiveInventorySubTab(tab);
  };

  const handleOpenTicketWithEquipment = (equipmentId: string) => {
    setActiveInventorySubTab('tickets');
  };

  const activeActModalObject = activeModalActId 
    ? inventoryActs.find(a => a.id === activeModalActId) || null
    : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar with Role & Director Branch Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  İnventarizasiya və Texniki Müraciətlər
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Mərkəzi anbar, filial inventarları, DIY/ödənişli məhsul təchizatı, texniki xidmət və rəsmi aktların vahid idarəetmə paneli
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Scoped Branch Badge for Manager */}
            {isManager && managerBranchId && (
              <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-700 dark:text-blue-300 text-sm font-medium">
                <Building2 className="w-4 h-4" />
                <span>
                  {branches.find(b => b.id === managerBranchId)?.name || 'Filialınız'} (Yalnız Səlahiyyətli Filial)
                </span>
              </div>
            )}

            {/* Director Branch Filter */}
            {isDirector && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filial Filtri:
                </span>
                <select
                  value={selectedBranchFilter}
                  onChange={(e) => setSelectedBranchFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Bütün Filiallar (Şəbəkə)</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Role indicator pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {isDirector ? 'Direktor İcmalı' : isTexnobaba ? 'Texnobaba Meneceri' : 'Filial Meneceri'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto scrollbar-thin">
          <div className="flex gap-1.5 min-w-max pb-1">
            {allowedTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTabSafe === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavigateTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-blue-700'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Verification & Test Scenarios Hub */}
      <InventoryTestRunner
        onNavigateTab={handleNavigateTab}
        onOpenActModal={(actId) => setActiveModalActId(actId)}
      />

      {/* Tab Content Display */}
      <div className="transition-all duration-200">
        {activeTabSafe === 'overview' && (
          <InventoryOverview
            onNavigateTab={handleNavigateTab}
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}

        {activeTabSafe === 'diy' && (
          <DiyProductsView
            onNavigateTab={handleNavigateTab}
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}

        {activeTabSafe === 'paid' && (
          <PaidProductsView
            onNavigateTab={handleNavigateTab}
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}

        {activeTabSafe === 'warehouse' && (
          <CentralWarehouseView />
        )}

        {activeTabSafe === 'branches' && (
          <BranchInventoriesView
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}

        {activeTabSafe === 'equipment' && (
          <EquipmentRegistryView
            selectedBranchIdFilter={selectedBranchFilter}
            onOpenTicketWithEquipment={handleOpenTicketWithEquipment}
          />
        )}

        {activeTabSafe === 'equipment-requests' && (
          <EquipmentRequestsView
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}

        {activeTabSafe === 'tickets' && (
          <TechnicalTicketsView
            selectedBranchIdFilter={selectedBranchFilter}
            onOpenActModal={(actId) => setActiveModalActId(actId)}
          />
        )}

        {activeTabSafe === 'orders' && (
          <OrdersShipmentsView
            selectedBranchIdFilter={selectedBranchFilter}
            onOpenActModal={(actId) => setActiveModalActId(actId)}
          />
        )}

        {activeTabSafe === 'debts' && (
          <DebtsPaymentsView
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}

        {activeTabSafe === 'acts' && (
          <ActsArchiveView
            selectedBranchIdFilter={selectedBranchFilter}
            initialActId={activeModalActId || undefined}
          />
        )}

        {activeTabSafe === 'reports' && (
          <InventoryReportsView
            selectedBranchIdFilter={selectedBranchFilter}
          />
        )}
      </div>

      {/* Global Printable Act Modal */}
      {activeActModalObject && (
        <ActPrintModal
          act={activeActModalObject}
          currentUserRole={currentRole}
          onClose={() => setActiveModalActId(null)}
        />
      )}
    </div>
  );
};
