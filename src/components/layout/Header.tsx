import React, { useState } from 'react';
import {
  Bell,
  MapPin,
  Globe,
  ShieldCheck,
  ChevronDown,
  LogOut,
  User,
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
  FileSignature,
  LucideIcon
} from 'lucide-react';
import { useCrm, ActiveTab } from '../../context/CrmContext';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  onOpenQuickPayment?: () => void;
  onOpenQuickStudent?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    activeTab,
    currentRole,
    selectedBranchId,
    setSelectedBranchId,
    branches,
    currentUser,
    logout,
    loginWithGoogle,
    setIsProfileModalOpen,
    showToast,
    unreadNotificationsCount,
  } = useCrm();

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const isGlobal = selectedBranchId === 'all';
  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
  const isManager = currentUser?.role === 'menecer' || currentRole === 'menecer';
  const managerBranch = isManager
    ? branches.find(b => b.id === currentUser?.branchId) || currentBranch
    : null;

  const getTabInfo = (): { title: string; icon: LucideIcon } => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'İdarəetmə Paneli', icon: LayoutDashboard };
      case 'students':
        return { title: 'Tələbələr', icon: Users };
      case 'contracts':
        return { title: 'Müqavilələr & Tədris Proqramları', icon: FileSignature };
      case 'groups':
        return { title: 'Qruplar', icon: GraduationCap };
      case 'leads':
        return { title: 'Lidlər & CRM', icon: UserCheck };
      case 'attendance':
        return { title: 'Davamiyyət Jurnalı', icon: CalendarCheck };
      case 'staff-attendance':
        return { title: 'QR Terminal & Davamiyyət', icon: QrCode };
      case 'certificates':
        return { title: 'Sertifikatlar', icon: Award };
      case 'curriculum':
        return { title: 'Kurikulum & Sillabus', icon: BookOpen };
      case 'finance':
        return { title: 'Maliyyə & Balans', icon: Wallet };
      case 'whatsapp':
        return { title: 'WhatsApp Bildiriş', icon: MessageSquare };
      case 'branches':
        return { title: 'Filiallar', icon: Building2 };
      case 'users':
        return {
          title: isManager ? 'Filial Təlimçiləri & Heyət' : 'İstifadəçilər & Giriş',
          icon: isManager ? GraduationCap : UserCog,
        };
      default:
        return { title: 'AREA-CRM', icon: LayoutDashboard };
    }
  };

  const tabInfo = getTabInfo();
  const TabIcon = tabInfo.icon;

  const initials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const isTrainer = currentUser?.role === 'telimci' || currentRole === 'telimci';

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-5 flex items-center justify-between shrink-0 select-none">
      {/* Left: Tab Title & Active Branch */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TabIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">
            {tabInfo.title}
          </span>
        </div>

        {/* Branch / Global Network Selector */}
        {isTrainer ? (
          <div className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/80 pl-2 pr-1.5 py-1 rounded-lg border border-indigo-200 transition-colors shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={selectedBranchId}
              onChange={e => {
                setSelectedBranchId(e.target.value);
                const bObj = branches.find(b => b.id === e.target.value);
                showToast(`Filial dəyişdirildi: ${bObj?.name || e.target.value}`);
              }}
              className="bg-transparent text-xs font-semibold text-indigo-950 border-none outline-none cursor-pointer pr-1"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  📍 {b.name.replace('AREA ', '').replace(' Filialı', '')} Filialı
                </option>
              ))}
            </select>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-indigo-700 font-bold ml-1 border border-indigo-200 shrink-0">
              {branches.length > 1 ? `${branches.length} Filialda Aktiv` : 'Təyin Olunmuş Filial'}
            </span>
          </div>
        ) : isManager ? (
          <div className="flex items-center gap-1.5 bg-slate-100 pl-2.5 pr-2.5 py-1 rounded-lg border border-slate-200 cursor-default select-none shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">
              {managerBranch?.name ? managerBranch.name.replace('AREA ', '') : 'Gənclik Filialı'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold ml-1 border border-indigo-200">
              Təyin Edilmiş Filialınız
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/90 pl-2 pr-1.5 py-1 rounded-lg border border-slate-200 transition-colors">
            {isGlobal ? (
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            )}
            <select
              value={selectedBranchId}
              onChange={e => {
                setSelectedBranchId(e.target.value);
                showToast(
                  e.target.value === 'all'
                    ? 'Bütün filiallar (Qlobal şəbəkə) rejiminə keçildi'
                    : `Filial seçildi: ${branches.find(b => b.id === e.target.value)?.name}`
                );
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 border-none outline-none cursor-pointer pr-1"
            >
              <option value="all">🌐 Bütün Filiallar (Qlobal Şəbəkə)</option>
              {branches
                .filter(b => !b.isDeleted)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name.replace('AREA ', '').replace(' Filialı', '')}
                  </option>
                ))}
            </select>
          </div>
        )}

        {/* Superadmin Indicator Badge */}
        {(currentUser?.isSuperAdmin || currentUser?.role === 'direktor') && (
          <span className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>Superadmin</span>
          </span>
        )}

        {/* Live Firestore Cloud Sync Badge */}
        <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Baza: Real Firestore Cloud DB (Canlı)">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real Baza (Canlı)</span>
        </span>
      </div>

      {/* Right: Notification, User Profile, and Logout */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Icon & Center */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(prev => !prev)}
            title="Bildirişlər Mərkəzi"
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              isNotificationOpen
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-in zoom-in-50 duration-150">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            ) : null}
          </button>

          <NotificationCenter
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* User Profile */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="Profil Tənzimləmələri"
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              {currentUser.photoURL || currentUser.avatarUrl ? (
                <img
                  src={currentUser.photoURL || currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover shadow-xs border border-slate-200 shrink-0"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0"
                >
                  {initials}
                </div>
              )}
              <div className="hidden md:flex flex-col">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px] leading-tight">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-slate-500 capitalize font-medium">
                  {currentUser.role === 'direktor'
                    ? '👑 Direktor'
                    : currentUser.role === 'menecer'
                    ? '💼 Menecer'
                    : currentUser.role === 'telimci'
                    ? '🎓 Təlimçi'
                    : '🎒 Şagird'}
                </span>
              </div>
            </button>

            <button
              onClick={logout}
              title="Çıxış"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Giriş</span>
          </button>
        )}
      </div>
    </header>
  );
};
