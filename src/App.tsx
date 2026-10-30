import React, { useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { StudentsView } from './components/students/StudentsView';
import { ContractsView } from './components/contracts/ContractsView';
import { GroupsView } from './components/groups/GroupsView';
import { LeadsView } from './components/leads/LeadsView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { StaffQrAttendanceView } from './components/staff-attendance/StaffQrAttendanceView';
import { CertificatesView } from './components/certificates/CertificatesView';
import { CurriculumView } from './components/curriculum/CurriculumView';
import { FinanceView } from './components/finance/FinanceView';
import { KpiView } from './components/kpi/KpiView';
import { WhatsAppView } from './components/whatsapp/WhatsAppView';
import { BranchesView } from './components/branches/BranchesView';
import { UserManagementView } from './components/users/UserManagementView';
import { TasksView } from './components/tasks/TasksView';
import { InventoryMainView } from './components/inventory/InventoryMainView';
import { MarketingSmmView } from './components/marketing/MarketingSmmView';
import { LoginGateway } from './components/auth/LoginGateway';
import { ParentRegistrationView } from './components/public/ParentRegistrationView';
import { ProfileSettingsModal } from './components/profile/ProfileSettingsModal';
import { CheckCircle2, AlertCircle, Info, ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { SystemModuleId, Role } from './types/crm';
import { ROLE_DETAILS } from './utils/permissions';

const TAB_MODULE_MAP: Partial<Record<string, SystemModuleId>> = {
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

const CrmAppContent: React.FC = () => {
  const { activeTab, setActiveTab, toast, currentUser, currentRole, can, accessDeniedEmail } = useCrm();

  const [preselectedBranch, setPreselectedBranch] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('branch') || undefined;
    }
    return undefined;
  });

  const [isPublicPortalOpen, setIsPublicPortalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('view') === 'register' || sp.get('register') === 'true' || sp.get('qeydiyyat') === 'onlayn';
    }
    return false;
  });

  const handleExitPublicPortal = () => {
    setIsPublicPortalOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      url.searchParams.delete('register');
      url.searchParams.delete('qeydiyyat');
      url.searchParams.delete('branch');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // If public registration portal is open
  if (isPublicPortalOpen) {
    return <ParentRegistrationView onExitToCrm={handleExitPublicPortal} preselectedBranchId={preselectedBranch} />;
  }

  const currentTabModule = TAB_MODULE_MAP[activeTab];
  const isTabAllowed = !currentTabModule || can('view', currentTabModule);
  const activeRoleDetails = ROLE_DETAILS[currentRole as Role] || ROLE_DETAILS.direktor;

  // If user is not logged in or an unauthorized Gmail was rejected, show the Login Gateway
  if (!currentUser || accessDeniedEmail) {
    return (
      <>
        <LoginGateway />
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-200">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
                toast.type === 'success'
                  ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                  : toast.type === 'error'
                  ? 'bg-rose-950 text-rose-100 border-rose-800'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-900 select-none">
      {/* Fixed Left Sidebar (no-print) */}
      <div className="no-print">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar (no-print) */}
        <div className="no-print">
          <Header />
        </div>

        {/* Dynamic Viewport Content with RBAC Protection */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {!isTabAllowed ? (
            <div className="h-full flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto shadow-inner">
                  <ShieldAlert className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Səlahiyyət Məhdudiyyəti (RBAC)
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Bu Bölməyə Baxış Hüququnuz Yoxdur
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Cari aktiv rolunuz (<strong className="text-indigo-600 capitalize">{activeRoleDetails.label}</strong>) üçün bu sistem moduluna baxış icazəsi Superadmin (Direktor) tərəfindən məhdudlaşdırılıb.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>İdarəetmə Panelinə Qayıt</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <OverviewDashboard />}
              {activeTab === 'students' && <StudentsView />}
              {activeTab === 'contracts' && <ContractsView />}
              {activeTab === 'groups' && <GroupsView />}
              {activeTab === 'leads' && <LeadsView onOpenPublicPortal={() => setIsPublicPortalOpen(true)} />}
              {activeTab === 'attendance' && <AttendanceView />}
              {activeTab === 'staff-attendance' && <StaffQrAttendanceView />}
              {activeTab === 'certificates' && <CertificatesView />}
              {activeTab === 'curriculum' && <CurriculumView />}
              {activeTab === 'finance' && <FinanceView />}
              {activeTab === 'tasks' && <TasksView />}
              {activeTab === 'kpi' && <KpiView />}
              {activeTab === 'whatsapp' && <WhatsAppView />}
              {activeTab === 'branches' && <BranchesView />}
              {activeTab === 'users' && <UserManagementView />}
              {activeTab === 'staff' && <UserManagementView initialTab="staff" />}
              {activeTab === 'marketing' && <MarketingSmmView />}
              {activeTab.startsWith('inventory') && <InventoryMainView />}
            </>
          )}
        </main>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-800'
                : 'bg-slate-900 text-slate-100 border-slate-800'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <CrmAppContent />
    </CrmProvider>
  );
}
