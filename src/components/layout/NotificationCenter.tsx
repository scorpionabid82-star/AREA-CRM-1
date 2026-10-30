import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  Wallet,
  UserCheck,
  CalendarCheck,
  GraduationCap,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Filter,
  Sparkles
} from 'lucide-react';
import { useCrm, ActiveTab } from '../../context/CrmContext';
import { NotificationCategory, NotificationItem, NotificationPriority, SystemModuleId } from '../../types/crm';

const NOTIF_TAB_MODULE_MAP: Partial<Record<ActiveTab, SystemModuleId>> = {
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
  kpi: 'kpi',
  whatsapp: 'whatsapp',
  branches: 'branches',
  users: 'users',
  staff: 'users',
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    deleteNotification,
    setActiveTab,
    confirmAction,
    showToast,
    can,
  } = useCrm();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | NotificationCategory>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'unread') return !item.isRead;
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'maliyye':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'lid':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'davamiyyet':
        return <CalendarCheck className="w-4 h-4 text-amber-600" />;
      case 'akademik':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5" /> Təcili
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            Yüksək
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
            Orta
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
            Məlumat
          </span>
        );
    }
  };

  const handleActionClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    if (item.targetTab) {
      const targetModule = NOTIF_TAB_MODULE_MAP[item.targetTab];
      if (targetModule && !can('view', targetModule)) {
        showToast('Bu bildiriş bölməsinə keçid üçün rolunuzun baxış səlahiyyəti yoxdur', 'error');
        onClose();
        return;
      }
      setActiveTab(item.targetTab);
    }
    onClose();
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-12 w-96 sm:w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ maxHeight: 'calc(100vh - 80px)' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center relative">
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">Bildirişlər Mərkəzi</h3>
            <p className="text-[11px] text-slate-500">
              {unreadNotificationsCount > 0
                ? `${unreadNotificationsCount} oxunmamış bildiriş var`
                : 'Bütün bildirişlər oxunub'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              title="Hamısını oxunmuş kimi qeyd et"
              className="p-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 font-medium cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Oxundu et</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                confirmAction({
                  title: 'Bildirişləri Təmizlə',
                  message: 'Bütün bildiriş siyahısını təmizləmək istədiyinizə əminsiniz?',
                  danger: true,
                  confirmText: 'Bəli, Təmizlə',
                  onConfirm: () => clearAllNotifications(),
                });
              }}
              title="Hamısını təmizlə"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white shrink-0 scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hamısı ({notifications.length})
        </button>

        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
            activeFilter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Oxunmamış</span>
          {unreadNotificationsCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeFilter === 'unread' ? 'bg-indigo-800 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('maliyye')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'maliyye'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Maliyyə
        </button>

        <button
          onClick={() => setActiveFilter('lid')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'lid'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Lidlər
        </button>

        <button
          onClick={() => setActiveFilter('davamiyyet')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
            activeFilter === 'davamiyyet'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Davamiyyət
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              {activeFilter === 'unread' ? 'Yeni oxunmamış bildiriş yoxdur' : 'Bu kateqoriyada bildiriş yoxdur'}
            </p>
            <p className="text-xs text-slate-500 max-w-xs">
              Sistem və maliyyə əməliyyatları ilə bağlı bütün vacib hadisələr burada əks olunacaq.
            </p>
          </div>
        ) : (
          filteredNotifications.map(item => (
            <div
              key={item.id}
              className={`p-3.5 transition-colors relative group hover:bg-slate-50/80 ${
                !item.isRead ? 'bg-indigo-50/30' : 'bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Category Icon Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !item.isRead ? 'bg-white shadow-xs ring-1 ring-slate-200' : 'bg-slate-100'
                  }`}
                >
                  {getCategoryIcon(item.category)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 leading-tight">
                        {item.title}
                      </span>
                      {getPriorityBadge(item.priority)}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-400 font-mono-nums">
                        {item.timestamp}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-2">
                    {item.message}
                  </p>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1">
                    {item.targetTab ? (
                      <button
                        onClick={() => handleActionClick(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <span>{item.actionLabel || 'Ətraflı bax'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : <span />}

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!item.isRead ? (
                        <button
                          onClick={() => markNotificationAsRead(item.id)}
                          title="Oxundu kimi qeyd et"
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      <button
                        onClick={() => deleteNotification(item.id)}
                        title="Bildirişi sil"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {!item.isRead && (
                <div className="absolute top-4 left-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer Quick Status */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between shrink-0 px-4">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>AREA CRM Ağıllı Bildiriş Sistemi</span>
        </span>
        <button
          onClick={onClose}
          className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
        >
          Bağla
        </button>
      </div>
    </div>
  );
};
