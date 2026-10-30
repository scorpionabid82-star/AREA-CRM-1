import React, { useState, useMemo } from 'react';
import {
  Share2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  Video,
  Image as ImageIcon,
  Sparkles,
  Building2,
  Award,
  Layers,
  BarChart3,
  Filter,
  Check,
  X,
  Copy,
  Send,
  MessageCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  SmmPlatform,
  SmmSocialAccount,
  SmmContentPost,
  SmmPostContentType,
  SmmPostStatus
} from '../../types/crm';
import { Tooltip } from '../common/Tooltip';
import { SmmInteractiveTestPanel } from './SmmInteractiveTestPanel';

// Platform branding helpers & icons
const PLATFORM_CONFIG: Record<
  SmmPlatform,
  {
    name: string;
    color: string;
    bgLight: string;
    borderColor: string;
    iconSvg: (className?: string) => React.ReactElement;
  }
> = {
  instagram: {
    name: 'Instagram',
    color: 'text-pink-600',
    bgLight: 'bg-pink-50',
    borderColor: 'border-pink-200',
    iconSvg: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconSvg: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
    ),
  },
  tiktok: {
    name: 'TikTok',
    color: 'text-slate-900',
    bgLight: 'bg-slate-100',
    borderColor: 'border-slate-300',
    iconSvg: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    color: 'text-rose-600',
    bgLight: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconSvg: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path>
        <polygon points="10 15 15 12 10 9 10 15"></polygon>
      </svg>
    ),
  },
  linkedin: {
    name: 'LinkedIn',
    color: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    iconSvg: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
        <rect x="2" y="9" width="4" height="12"></rect>
        <circle cx="4" cy="4" r="2"></circle>
      </svg>
    ),
  },
  telegram: {
    name: 'Telegram',
    color: 'text-sky-600',
    bgLight: 'bg-sky-50',
    borderColor: 'border-sky-200',
    iconSvg: (cls = 'w-4 h-4') => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    ),
  },
};

type SmmTab = 'accounts' | 'planner' | 'analytics';

export const MarketingSmmView: React.FC = () => {
  const {
    smmAccounts,
    smmPosts,
    branches,
    currentRole,
    currentUser,
    createOrUpdateSmmAccount,
    deleteSmmAccount,
    createSmmPost,
    updateSmmPostStatus,
    updateSmmPost,
    deleteSmmPost,
    resetSmmTestData,
    showToast,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  // Active view states
  const [activeTab, setActiveTab] = useState<SmmTab>('accounts');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(
    managerBranchId || 'all'
  );
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isTestPanelOpen, setIsTestPanelOpen] = useState(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SmmSocialAccount | null>(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SmmContentPost | null>(null);

  // Form states for account
  const [accBranchId, setAccBranchId] = useState<string>('hq');
  const [accPlatform, setAccPlatform] = useState<SmmPlatform>('instagram');
  const [accName, setAccName] = useState<string>('');
  const [accHandle, setAccHandle] = useState<string>('');
  const [accUrl, setAccUrl] = useState<string>('');
  const [accFollowers, setAccFollowers] = useState<number>(0);
  const [accAvgReach, setAccAvgReach] = useState<number>(0);
  const [accEngagement, setAccEngagement] = useState<number>(5.0);
  const [accManager, setAccManager] = useState<string>('');
  const [accNotes, setAccNotes] = useState<string>('');
  const [accStatus, setAccStatus] = useState<'aktiv' | 'passiv' | 'qurasdirilir'>('aktiv');

  // Form states for post
  const [postBranchId, setPostBranchId] = useState<string>('hq');
  const [postPlatform, setPostPlatform] = useState<SmmPlatform>('instagram');
  const [postTitle, setPostTitle] = useState<string>('');
  const [postContentType, setPostContentType] = useState<SmmPostContentType>('reels');
  const [postScheduledDate, setPostScheduledDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [postScheduledTime, setPostScheduledTime] = useState<string>('18:00');
  const [postCaption, setPostCaption] = useState<string>('');
  const [postHashtags, setPostHashtags] = useState<string>('#AreaAcademy #Robotics');
  const [postStatus, setPostStatus] = useState<SmmPostStatus>('planlasdirilib');

  // Effective branch scope
  const effectiveBranchId = managerBranchId || selectedBranchFilter;

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return smmAccounts.filter(acc => {
      // Branch filter
      if (effectiveBranchId !== 'all' && acc.branchId !== effectiveBranchId) {
        return false;
      }
      // Platform filter
      if (selectedPlatformFilter !== 'all' && acc.platform !== selectedPlatformFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = acc.accountName.toLowerCase().includes(q);
        const matchHandle = acc.handle.toLowerCase().includes(q);
        const matchBranch = acc.branchName.toLowerCase().includes(q);
        return matchName || matchHandle || matchBranch;
      }
      return true;
    });
  }, [smmAccounts, effectiveBranchId, selectedPlatformFilter, searchQuery]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return smmPosts.filter(post => {
      if (effectiveBranchId !== 'all' && post.branchId !== effectiveBranchId) {
        return false;
      }
      if (selectedPlatformFilter !== 'all' && post.platform !== selectedPlatformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchBranch = post.branchName.toLowerCase().includes(q);
        const matchCaption = (post.caption || '').toLowerCase().includes(q);
        return matchTitle || matchBranch || matchCaption;
      }
      return true;
    });
  }, [smmPosts, effectiveBranchId, selectedPlatformFilter, searchQuery]);

  // Network metrics calculations
  const totalFollowers = useMemo(() => {
    return smmAccounts.reduce((sum, acc) => sum + (acc.followersCount || 0), 0);
  }, [smmAccounts]);

  const totalActiveAccounts = useMemo(() => {
    return smmAccounts.filter(acc => acc.status === 'aktiv').length;
  }, [smmAccounts]);

  const scheduledPostsCount = useMemo(() => {
    return smmPosts.filter(p => p.status === 'planlasdirilib' || p.status === 'tesdiqlendi').length;
  }, [smmPosts]);

  const publishedPostsCount = useMemo(() => {
    return smmPosts.filter(p => p.status === 'derc_edildi').length;
  }, [smmPosts]);

  // Open modal handlers
  const handleOpenNewAccountModal = () => {
    setEditingAccount(null);
    setAccBranchId(managerBranchId || 'hq');
    setAccPlatform('instagram');
    setAccName('');
    setAccHandle('@area.');
    setAccUrl('https://instagram.com/area.');
    setAccFollowers(1000);
    setAccAvgReach(600);
    setAccEngagement(5.5);
    setAccManager(currentUser?.fullName || 'SMM Mütəxəssisi');
    setAccNotes('');
    setAccStatus('aktiv');
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (acc: SmmSocialAccount) => {
    setEditingAccount(acc);
    setAccBranchId(acc.branchId);
    setAccPlatform(acc.platform);
    setAccName(acc.accountName);
    setAccHandle(acc.handle);
    setAccUrl(acc.url);
    setAccFollowers(acc.followersCount);
    setAccAvgReach(acc.avgReach || 0);
    setAccEngagement(acc.avgEngagementRate || 5.0);
    setAccManager(acc.managerName || '');
    setAccNotes(acc.notes || '');
    setAccStatus(acc.status);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accHandle.trim() || !accUrl.trim()) {
      showToast('Zəhmət olmasa istifadəçi adı (@handle) və keçid linkini daxil edin.', 'error');
      return;
    }

    createOrUpdateSmmAccount({
      id: editingAccount ? editingAccount.id : undefined,
      branchId: accBranchId,
      platform: accPlatform,
      accountName: accName.trim(),
      handle: accHandle.trim(),
      url: accUrl.trim(),
      followersCount: Number(accFollowers) || 0,
      avgReach: Number(accAvgReach) || 0,
      avgEngagementRate: Number(accEngagement) || 5.0,
      managerName: accManager.trim(),
      notes: accNotes.trim(),
      status: accStatus,
    });

    setIsAccountModalOpen(false);
  };

  const handleOpenNewPostModal = () => {
    setEditingPost(null);
    setPostBranchId(managerBranchId || 'hq');
    setPostPlatform('instagram');
    setPostTitle('');
    setPostContentType('reels');
    setPostScheduledDate(new Date().toISOString().split('T')[0]);
    setPostScheduledTime('18:00');
    setPostCaption('');
    setPostHashtags('#AreaAcademy #RoboticsAzerbaijan');
    setPostStatus('planlasdirilib');
    setIsPostModalOpen(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      showToast('Zəhmət olmasa postun mövzusunu və ya başlığını qeyd edin.', 'error');
      return;
    }

    if (editingPost) {
      updateSmmPost(editingPost.id, {
        branchId: postBranchId,
        platform: postPlatform,
        title: postTitle.trim(),
        contentType: postContentType,
        scheduledDate: postScheduledDate,
        scheduledTime: postScheduledTime,
        caption: postCaption.trim(),
        hashtags: postHashtags.split(' ').filter(h => h.trim().length > 0),
        status: postStatus,
      });
    } else {
      createSmmPost({
        branchId: postBranchId,
        branchName: postBranchId === 'hq' ? 'AREA Academy — Baş ofis' : (branches.find(b => b.id === postBranchId)?.name || 'Filial'),
        platform: postPlatform,
        title: postTitle.trim(),
        contentType: postContentType,
        scheduledDate: postScheduledDate,
        scheduledTime: postScheduledTime,
        status: postStatus,
        caption: postCaption.trim(),
        hashtags: postHashtags.split(' ').filter(h => h.trim().length > 0),
        authorName: currentUser?.fullName || 'SMM Mütəxəssisi',
      });
    }

    setIsPostModalOpen(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} panoya kopyalandı: ${text}`, 'info');
  };

  // Content type badge renderer
  const getContentTypeBadge = (type: SmmPostContentType) => {
    switch (type) {
      case 'reels':
      case 'shorts':
        return (
          <Tooltip content="Reels / Shorts (Qısa Video Kontenti)">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200">
              <Video className="w-3 h-3 text-pink-600" />
              <span>{type.toUpperCase()}</span>
            </span>
          </Tooltip>
        );
      case 'video':
        return (
          <Tooltip content="Uzun Video / YouTube İcmalı">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              <Video className="w-3 h-3 text-rose-600" />
              <span>Video</span>
            </span>
          </Tooltip>
        );
      case 'story':
        return (
          <Tooltip content="24 saatlıq Hekayə (Story)">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Story</span>
            </span>
          </Tooltip>
        );
      case 'article':
        return (
          <Tooltip content="Məqalə / LinkedIn Postu">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>Məqalə</span>
            </span>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content="Standart Şəkilli Paylaşım (Post)">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              <ImageIcon className="w-3 h-3 text-blue-600" />
              <span>Post</span>
            </span>
          </Tooltip>
        );
    }
  };

  // Post status badge renderer
  const getPostStatusBadge = (status: SmmPostStatus) => {
    switch (status) {
      case 'derc_edildi':
        return (
          <Tooltip content="Uğurla sosial şəbəkədə dərc edilib">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Dərc Edildi</span>
            </span>
          </Tooltip>
        );
      case 'tesdiqlendi':
        return (
          <Tooltip content="Direktor/Baş ofis tərəfindən təsdiqlənib, yayıma hazırdır">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              <Check className="w-3 h-3 text-blue-600" />
              <span>Təsdiqləndi</span>
            </span>
          </Tooltip>
        );
      case 'planlasdirilib':
        return (
          <Tooltip content="Təqvimdə planlaşdırılıb, vaxtı gözləyir">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Planlaşdırılıb</span>
            </span>
          </Tooltip>
        );
      case 'legv':
        return (
          <Tooltip content="Paylaşım ləğv edildi">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              <X className="w-3 h-3 text-rose-600" />
              <span>Ləğv</span>
            </span>
          </Tooltip>
        );
      default:
        return (
          <Tooltip content="Qaralama halında, hazırlanır">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              <FileText className="w-3 h-3 text-slate-500" />
              <span>Qaralama</span>
            </span>
          </Tooltip>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Marketinq və SMM İdarəetməsi</h1>
              <p className="text-xs text-slate-500">
                AREA Academy Baş ofis və bütün regional filialların rəsmi sosial media hesabları, linklər və post planlaması
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTestPanelOpen(!isTestPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer border ${
              isTestPanelOpen
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isTestPanelOpen ? 'Test Panelini Gizlət' : '🧪 Funksional Test Paneli'}</span>
          </button>

          {activeTab === 'accounts' ? (
            <button
              onClick={handleOpenNewAccountModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Sosial Hesab Əlavə Et</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewPostModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Post Planlaşdır</span>
            </button>
          )}

          <Tooltip content="SMM məlumatlarını standart ilkin vəziyyətə sıfırla">
            <button
              onClick={resetSmmTestData}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              aria-label="Sıfırla"
            >
              <Layers className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Interactive SMM Audit & Test Panel */}
      <SmmInteractiveTestPanel
        isOpen={isTestPanelOpen}
        onClose={() => setIsTestPanelOpen(false)}
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cəmi Şəbəkə İzləyicisi</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono tabular-nums mt-2">
            {totalFollowers.toLocaleString('az-AZ')}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Bütün rəsmi kanallar üzrə</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Aktiv Sosial Hesablar</span>
            <Share2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono tabular-nums mt-2">
            {totalActiveAccounts} <span className="text-xs font-normal text-slate-400">kanal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Baş ofis və 9 filial üzrə</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Planlaşdırılmış Postlar</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono tabular-nums mt-2">
            {scheduledPostsCount} <span className="text-xs font-normal text-slate-400">kontent</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Reels, Video, Post və Story</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dərc Edilmiş Paylaşımlar</span>
            <CheckCircle2 className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-black text-pink-600 font-mono tabular-nums mt-2">
            {publishedPostsCount} <span className="text-xs font-normal text-slate-400">yayımlandı</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Bu ay üçün aktiv nəticə</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'accounts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Sosial Şəbəkə Hesabları ({smmAccounts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kontent Planı & Təqvim ({smmPosts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Filial Reytinqi & Metrikalar</span>
            </button>
          </div>

          {/* Branch & Platform Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Branch Selector */}
            {!isManager && (
              <select
                value={selectedBranchFilter}
                onChange={e => setSelectedBranchFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 cursor-pointer"
              >
                <option value="all">Bütün Filiallar (Qlobal Şəbəkə)</option>
                <option value="hq">AREA Academy — Baş ofis</option>
                <option value="branch-zaqatala">AREA Zaqatala</option>
                <option value="branch-gence">AREA Gəncə</option>
                <option value="branch-sumqayit">AREA Sumqayıt</option>
                <option disabled>──────────</option>
                {branches
                  .filter(b => !['branch-zaqatala', 'branch-gence', 'branch-sumqayit'].includes(b.id) && !b.isDeleted)
                  .map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            )}

            {/* Platform Filter */}
            <select
              value={selectedPlatformFilter}
              onChange={e => setSelectedPlatformFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-800 cursor-pointer"
            >
              <option value="all">Bütün Platformalar</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="tiktok">TikTok</option>
              <option value="youtube">YouTube</option>
              <option value="linkedin">LinkedIn</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Sosial hesab adı, istifadəçi adı (@handle), filial və ya mövzu axtarın..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-pink-500 bg-white"
          />
        </div>
      </div>

      {/* TAB 1: ACCOUNTS CATALOG */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map(account => {
              const cfg = PLATFORM_CONFIG[account.platform] || PLATFORM_CONFIG.instagram;
              return (
                <div
                  key={account.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                >
                  <div>
                    {/* Header with platform icon and branch */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${cfg.bgLight} ${cfg.color} flex items-center justify-center shrink-0`}>
                          {cfg.iconSvg('w-4 h-4')}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            {cfg.name}
                          </span>
                          <span className="text-xs font-bold text-slate-900 block truncate max-w-[170px]">
                            {account.branchName}
                          </span>
                        </div>
                      </div>

                      <Tooltip content={account.status === 'aktiv' ? 'Aktiv hesab' : 'Quraşdırılır'}>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            account.status === 'aktiv'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {account.status === 'aktiv' ? 'Aktiv' : 'Hazırlanır'}
                        </span>
                      </Tooltip>
                    </div>

                    {/* Account handle and direct link */}
                    <div className="mt-3.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-xs font-mono font-bold text-slate-900 block truncate">
                          {account.handle}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {account.accountName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Tooltip content="İstifadəçi adını kopyala">
                          <button
                            onClick={() => copyToClipboard(account.handle, 'İstifadəçi adı')}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer"
                            aria-label="Kopyala"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>

                        <Tooltip content="Birbaşa sosial media profilinə keç">
                          <a
                            href={account.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-white transition-colors"
                            aria-label="Keçid"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Follower and reach metrics */}
                    <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-slate-100 text-center">
                      <div className="bg-slate-50/70 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">İzləyici</span>
                        <span className="text-xs font-black text-slate-900 font-mono tabular-nums">
                          {account.followersCount.toLocaleString('az-AZ')}
                        </span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Baxış/Çatım</span>
                        <span className="text-xs font-black text-slate-900 font-mono tabular-nums">
                          {account.avgReach ? account.avgReach.toLocaleString('az-AZ') : '—'}
                        </span>
                      </div>
                      <div className="bg-slate-50/70 p-2 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Aktivlik</span>
                        <span className="text-xs font-black text-emerald-600 font-mono tabular-nums">
                          %{account.avgEngagementRate || 5.0}
                        </span>
                      </div>
                    </div>

                    {account.notes && (
                      <p className="text-[11px] text-slate-500 mt-3 line-clamp-2 leading-relaxed italic">
                        "{account.notes}"
                      </p>
                    )}
                  </div>

                  {/* Card footer actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                      Cavabdeh: {account.managerName || 'Menecer'}
                    </span>

                    <div className="flex items-center gap-1">
                      <Tooltip content="Məlumatları redaktə et">
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                          aria-label="Düzəliş et"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>

                      {isDirector && (
                        <Tooltip content="Hesabı reyestrdən sil">
                          <button
                            onClick={() => deleteSmmAccount(account.id)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            aria-label="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAccounts.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900">Sosial media hesabı tapılmadı</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Axtarış və ya filtr meyarlarına uyğun sosial hesab qeydi mövcud deyil.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTENT PLANNER & CALENDAR */}
      {activeTab === 'planner' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Planlaşdırılmış Paylaşımlar Cədvəli</h3>
              </div>
              <span className="text-xs text-slate-400">{filteredPosts.length} post planı</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tarix & Saat</th>
                    <th className="py-3 px-4">Filial</th>
                    <th className="py-3 px-4">Platforma</th>
                    <th className="py-3 px-4">Növ</th>
                    <th className="py-3 px-4">Mövzu & Başlıq</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Planlaşdırılmış post tapılmadı.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map(post => {
                      const cfg = PLATFORM_CONFIG[post.platform] || PLATFORM_CONFIG.instagram;
                      return (
                        <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <span className="font-bold text-slate-900 block">{post.scheduledDate}</span>
                            <span className="text-[10px] text-slate-400">{post.scheduledTime || '18:00'}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {post.branchName}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={cfg.color}>{cfg.iconSvg('w-3.5 h-3.5')}</span>
                              <span className="font-medium text-slate-700">{cfg.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{getContentTypeBadge(post.contentType)}</td>
                          <td className="py-3 px-4 max-w-md">
                            <span className="font-bold text-slate-900 block">{post.title}</span>
                            {post.caption && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{post.caption}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">{getPostStatusBadge(post.status)}</td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {post.status !== 'derc_edildi' && (
                              <Tooltip content="Postu dərc edildi kimi qeyd et">
                                <button
                                  onClick={() => updateSmmPostStatus(post.id, 'derc_edildi')}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                                  aria-label="Dərc et"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>
                            )}

                            <Tooltip content="Postu redaktə et">
                              <button
                                onClick={() => {
                                  setEditingPost(post);
                                  setPostBranchId(post.branchId);
                                  setPostPlatform(post.platform);
                                  setPostTitle(post.title);
                                  setPostContentType(post.contentType);
                                  setPostScheduledDate(post.scheduledDate);
                                  setPostScheduledTime(post.scheduledTime || '18:00');
                                  setPostCaption(post.caption || '');
                                  setPostHashtags((post.hashtags || []).join(' '));
                                  setPostStatus(post.status);
                                  setIsPostModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                aria-label="Redaktə et"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>

                            <Tooltip content="Postu sil">
                              <button
                                onClick={() => deleteSmmPost(post.id)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                aria-label="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BRANCH LEADERBOARD & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Branch Audience Leaderboard */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">Filiallar Üzrə Auditoriya Reytinqi</h3>
                </div>
                <span className="text-xs text-slate-400">İzləyici sayı üzrə sıralama</span>
              </div>

              <div className="space-y-3">
                {/* Aggregate by branch */}
                {Array.from(new Set(smmAccounts.map(a => a.branchName)))
                  .map(branchName => {
                    const bAccs = smmAccounts.filter(a => a.branchName === branchName);
                    const bTotal = bAccs.reduce((s, a) => s + (a.followersCount || 0), 0);
                    return { branchName, totalFollowers: bTotal, accountsCount: bAccs.length };
                  })
                  .sort((a, b) => b.totalFollowers - a.totalFollowers)
                  .map((bItem, idx) => {
                    const percentage = totalFollowers > 0 ? Math.round((bItem.totalFollowers / totalFollowers) * 100) : 0;
                    return (
                      <div key={bItem.branchName} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : idx === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{bItem.branchName}</span>
                            <span className="text-[10px] text-slate-400 block">{bItem.accountsCount} rəsmi hesab</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-900 block tabular-nums">
                            {bItem.totalFollowers.toLocaleString('az-AZ')}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">%{percentage} pay</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-pink-600" />
                    <h3 className="text-sm font-bold text-slate-900">Platformalar Üzrə Pay Bölgüsü</h3>
                  </div>
                  <span className="text-xs text-slate-400">Şəbəkə kanalları</span>
                </div>

                <div className="space-y-3">
                  {(['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'telegram'] as SmmPlatform[]).map(plat => {
                    const cfg = PLATFORM_CONFIG[plat];
                    const pAccs = smmAccounts.filter(a => a.platform === plat);
                    const pTotal = pAccs.reduce((s, a) => s + (a.followersCount || 0), 0);
                    const percentage = totalFollowers > 0 ? Math.round((pTotal / totalFollowers) * 100) : 0;

                    return (
                      <div key={plat} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={cfg.color}>{cfg.iconSvg('w-3.5 h-3.5')}</span>
                            <span className="font-semibold text-slate-800">{cfg.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({pAccs.length} səhifə)</span>
                          </div>
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {pTotal.toLocaleString('az-AZ')} (%{percentage})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              plat === 'instagram'
                                ? 'bg-pink-500'
                                : plat === 'tiktok'
                                ? 'bg-slate-900'
                                : plat === 'facebook'
                                ? 'bg-blue-600'
                                : plat === 'youtube'
                                ? 'bg-rose-600'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 bg-pink-50/50 p-3 rounded-xl border border-pink-100 text-xs text-pink-900">
                <span className="font-bold block">SMM Strategiyası Qeydi:</span>
                <p className="text-[11px] text-pink-800 mt-0.5 leading-relaxed">
                  TikTok və Instagram Reels kanalları ən yüksək orqanik çatımlılığa və tələbə cəlbinə malikdir. Regional filialların həftədə ən az 3 video paylaşımı tövsiyə olunur.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SOCIAL ACCOUNT */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingAccount ? 'Sosial Media Hesabını Redaktə Et' : 'Yeni Sosial Media Hesabı Əlavə Et'}
                </h3>
              </div>
              <button
                onClick={() => setIsAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Filial:</label>
                  <select
                    value={accBranchId}
                    onChange={e => setAccBranchId(e.target.value)}
                    disabled={isManager}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="hq">AREA Academy — Baş ofis</option>
                    <option value="branch-zaqatala">AREA Zaqatala</option>
                    <option value="branch-gence">AREA Gəncə</option>
                    <option value="branch-sumqayit">AREA Sumqayıt</option>
                    {branches
                      .filter(b => !['branch-zaqatala', 'branch-gence', 'branch-sumqayit'].includes(b.id) && !b.isDeleted)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Platforma:</label>
                  <select
                    value={accPlatform}
                    onChange={e => setAccPlatform(e.target.value as SmmPlatform)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hesabın Rəsmi Adı:</label>
                <input
                  type="text"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  placeholder="Məsələn: AREA Zaqatala Dərnəyi"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">İstifadəçi Adı (@handle):</label>
                  <input
                    type="text"
                    value={accHandle}
                    onChange={e => setAccHandle(e.target.value)}
                    placeholder="@area.zaqatala"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Profil Keçid Linki (URL):</label>
                  <input
                    type="url"
                    value={accUrl}
                    onChange={e => setAccUrl(e.target.value)}
                    placeholder="https://instagram.com/area.zaqatala"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">İzləyici Sayı:</label>
                  <input
                    type="number"
                    min="0"
                    value={accFollowers}
                    onChange={e => setAccFollowers(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Ortalama Baxış:</label>
                  <input
                    type="number"
                    min="0"
                    value={accAvgReach}
                    onChange={e => setAccAvgReach(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Aktivlik (%) :</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={accEngagement}
                    onChange={e => setAccEngagement(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cavabdeh Şəxs / SMM:</label>
                  <input
                    type="text"
                    value={accManager}
                    onChange={e => setAccManager(e.target.value)}
                    placeholder="Filial Meneceri və ya SMM"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Status:</label>
                  <select
                    value={accStatus}
                    onChange={e => setAccStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="aktiv">Aktiv</option>
                    <option value="passiv">Passiv</option>
                    <option value="qurasdirilir">Quraşdırılır / Hazırlanır</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Qeyd və Hədəflər:</label>
                <textarea
                  rows={2}
                  value={accNotes}
                  onChange={e => setAccNotes(e.target.value)}
                  placeholder="Hesabla bağlı xüsusi qeydlər..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingAccount ? 'Yeniləyin' : 'Hesabı Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT CONTENT POST */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPost ? 'Post Planını Redaktə Et' : 'Yeni Paylaşım Planlaşdır'}
                </h3>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleSavePost} className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Filial:</label>
                  <select
                    value={postBranchId}
                    onChange={e => setPostBranchId(e.target.value)}
                    disabled={isManager}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="hq">AREA Academy — Baş ofis</option>
                    <option value="branch-zaqatala">AREA Zaqatala</option>
                    <option value="branch-gence">AREA Gəncə</option>
                    <option value="branch-sumqayit">AREA Sumqayıt</option>
                    {branches
                      .filter(b => !['branch-zaqatala', 'branch-gence', 'branch-sumqayit'].includes(b.id) && !b.isDeleted)
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Platforma:</label>
                  <select
                    value={postPlatform}
                    onChange={e => setPostPlatform(e.target.value as SmmPlatform)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Post Başlığı / Mövzusu:</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  placeholder="Məsələn: Zaqatala şagirdlərinin hazırladığı maneədən qaçan robot"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kontent Növü:</label>
                  <select
                    value={postContentType}
                    onChange={e => setPostContentType(e.target.value as SmmPostContentType)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="reels">Reels / Shorts</option>
                    <option value="post">Standart Post</option>
                    <option value="story">Story</option>
                    <option value="video">Tam Video</option>
                    <option value="article">Məqalə</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Plan Tarixi:</label>
                  <input
                    type="date"
                    value={postScheduledDate}
                    onChange={e => setPostScheduledDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Saat:</label>
                  <input
                    type="time"
                    value={postScheduledTime}
                    onChange={e => setPostScheduledTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mətn və Təsvir (Caption):</label>
                <textarea
                  rows={3}
                  value={postCaption}
                  onChange={e => setPostCaption(e.target.value)}
                  placeholder="Paylaşımın altına yazılacaq mətn..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Həştəqlər:</label>
                <input
                  type="text"
                  value={postHashtags}
                  onChange={e => setPostHashtags(e.target.value)}
                  placeholder="#AreaAcademy #Robotics #Stem"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status:</label>
                <select
                  value={postStatus}
                  onChange={e => setPostStatus(e.target.value as SmmPostStatus)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="qaralama">Qaralama</option>
                  <option value="planlasdirilib">Planlaşdırılıb</option>
                  <option value="tesdiqlendi">Təsdiqləndi</option>
                  <option value="derc_edildi">Dərc Edildi</option>
                  <option value="legv">Ləğv Edildi</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {editingPost ? 'Yeniləyin' : 'Postu Planlaşdır'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
