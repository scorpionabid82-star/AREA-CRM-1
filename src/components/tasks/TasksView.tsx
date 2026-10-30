import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Plus,
  Filter,
  Download,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  Tag,
  Search,
  Check,
  ChevronRight,
  ArrowRight,
  Kanban,
  Table as TableIcon,
  ShieldCheck,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/crm';
import { formatDateAz, exportToCSV } from '../../utils/formatters';

interface TasksViewProps {}

export const TasksView: React.FC<TasksViewProps> = () => {
  const {
    tasks,
    branches,
    staff,
    selectedBranchId,
    addTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    currentUser,
    confirmAction,
    can,
    showToast,
  } = useCrm();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [branchFilter, setBranchFilter] = useState<string>(selectedBranchId !== 'all' ? selectedBranchId : 'all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [completionModalTask, setCompletionModalTask] = useState<TaskItem | null>(null);
  const [completionNote, setCompletionNote] = useState('');

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAssigneeId, setFormAssigneeId] = useState(staff[0]?.id || '');
  const [formBranchId, setFormBranchId] = useState(branches[0]?.id || '');
  const [formPriority, setFormPriority] = useState<TaskPriority>('orta');
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [formTags, setFormTags] = useState('');

  const stages: { id: TaskStatus; label: string; color: string; badgeClass: string; icon: any }[] = [
    {
      id: 'gozleyir',
      label: 'Gözləyir',
      color: 'border-t-slate-400 bg-slate-50/70',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Clock,
    },
    {
      id: 'icradadir',
      label: 'İcradadır',
      color: 'border-t-indigo-500 bg-indigo-50/20',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: AlertCircle,
    },
    {
      id: 'tamamlandi',
      label: 'Tamamlandı',
      color: 'border-t-emerald-500 bg-emerald-50/20',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    {
      id: 'texire_salindi',
      label: 'Təxirə Salındı',
      color: 'border-t-rose-400 bg-rose-50/20',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
    },
  ];

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = (t.description || '').toLowerCase().includes(q);
        const matchesAssignee = (t.assigneeName || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAssignee) return false;
      }
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (branchFilter !== 'all' && t.branchId && t.branchId !== branchFilter) return false;
      if (assigneeFilter !== 'all' && t.assigneeId !== assigneeFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, branchFilter, assigneeFilter]);

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormAssigneeId(staff[0]?.id || '');
    setFormBranchId(selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id || ''));
    setFormPriority('orta');
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setFormDueDate(d.toISOString().split('T')[0]);
    setFormTags('İnzibati, Tədris');
    setShowAddModal(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormAssigneeId(task.assigneeId || staff[0]?.id || '');
    setFormBranchId(task.branchId || branches[0]?.id || '');
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setFormTags(task.tags?.join(', ') || '');
    setShowAddModal(true);
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Zəhmət olmasa tapşırıq başlığını daxil edin', 'error');
      return;
    }

    const assignedStaff = staff.find(s => s.id === formAssigneeId);
    const assignedBranch = branches.find(b => b.id === formBranchId);
    const splitTags = formTags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDesc.trim(),
        assigneeId: assignedStaff?.id,
        assigneeName: assignedStaff?.fullName || 'Təyin olunmayıb',
        assigneeRole: assignedStaff?.role,
        branchId: assignedBranch?.id,
        branchName: assignedBranch?.name,
        priority: formPriority,
        dueDate: formDueDate,
        tags: splitTags,
      });
    } else {
      addTask({
        title: formTitle.trim(),
        description: formDesc.trim(),
        assigneeId: assignedStaff?.id,
        assigneeName: assignedStaff?.fullName || 'Təyin olunmayıb',
        assigneeRole: assignedStaff?.role,
        branchId: assignedBranch?.id,
        branchName: assignedBranch?.name,
        priority: formPriority,
        status: 'gozleyir',
        dueDate: formDueDate,
        tags: splitTags,
      });
    }

    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredTasks.map((t, idx) => ({
      '№': idx + 1,
      'Tapşırıq ID': t.id,
      'Tapşırıq Adı': t.title,
      'İzah': t.description,
      'İcraçı Şəxs': t.assigneeName,
      'İcraçı Vəzifəsi': t.assigneeRole || 'Əməkdaş',
      'Filial': t.branchName || 'Ümumi',
      'Prioritet': t.priority === 'yuksek' ? 'Yüksək' : t.priority === 'orta' ? 'Orta' : 'Aşağı',
      'Status':
        t.status === 'tamamlandi'
          ? 'Tamamlandı'
          : t.status === 'icradadir'
          ? 'İcradadır'
          : t.status === 'texire_salindi'
          ? 'Təxirə Salındı'
          : 'Gözləyir',
      'Təyin Tarixi': t.createdAt,
      'Son İcra Tarixi (Deadline)': t.dueDate,
      'İcra Tarixi': t.completedAt || '-',
      'İcraçı Qeydi': t.completionNote || '-',
      'Teqlər': t.tags?.join('; ') || '',
    }));

    exportToCSV(`AREA_Rehberlik_Tapsiriq_Izleme_${new Date().toISOString().split('T')[0]}`, exportData);
    showToast('Rəhbərlik tapşırıq cədvəli Excel formatında endirildi!');
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'yuksek':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <Flame className="w-3 h-3 text-rose-600" />
            <span>Yüksək</span>
          </span>
        );
      case 'orta':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <span>Orta</span>
          </span>
        );
      case 'asagi':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            <span>Aşağı</span>
          </span>
        );
    }
  };

  const isOverdue = (task: TaskItem) => {
    if (task.status === 'tamamlandi') return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Rəhbərlik Tapşırıq İzləmə Paneli
                </h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {filteredTasks.length} tapşırıq
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Filiallar, koordinatorlar və rəhbərlik üzrə tapşırıqların icra cədvəli və monitorinqi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Lövhəsi"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cədvəl Baxışı"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Excel / CSV formatında endir"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel İxracı</span>
          </button>

          {/* New Task Button */}
          {can('create', 'tasks') && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Tapşırıq Təyin Et</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Axtarış (ad, izah, icraçı)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Bütün Filiallar</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <select
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Bütün İcraçılar</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Bütün Prioritetlər</option>
              <option value="yuksek">Yüksək Prioritet</option>
              <option value="orta">Orta Prioritet</option>
              <option value="asagi">Aşağı Prioritet</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Bütün Statuslar</option>
              <option value="gozleyir">Gözləyir</option>
              <option value="icradadir">İcradadır</option>
              <option value="tamamlandi">Tamamlandı</option>
              <option value="texire_salindi">Təxirə Salındı</option>
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageTasks = filteredTasks.filter(t => t.status === stage.id);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={`rounded-2xl p-3 flex flex-col min-w-[270px] border-t-4 ${stage.color} border border-slate-200/80 shadow-2xs space-y-3`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-900">{stage.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs border border-slate-200">
                    {stageTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-3 flex-1 min-h-[350px]">
                  {stageTasks.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-[11px] text-slate-400 italic">
                      Bu sütunda tapşırıq yoxdur
                    </div>
                  ) : (
                    stageTasks.map(task => {
                      const overdue = isOverdue(task);

                      return (
                        <div
                          key={task.id}
                          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 text-xs group"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {getPriorityBadge(task.priority)}
                                {overdue && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                    <Clock className="w-2.5 h-2.5" /> Vaxtı keçib
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-slate-900 text-xs leading-snug">
                                {task.title}
                              </h4>
                            </div>

                            {/* Dropdown / Edit */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {can('edit', 'tasks') && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(task)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Düzəliş et"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {can('delete', 'tasks') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Tapşırığı Sil',
                                      message: `"${task.title}" tapşırığını silmək istədiyinizə əminsiniz?`,
                                      confirmText: 'Bəli, Sil',
                                      danger: true,
                                      onConfirm: () => deleteTask(task.id),
                                    });
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* Completion note if done */}
                          {task.completionNote && (
                            <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[10px] text-emerald-900">
                              <span className="font-bold block">İcraçı rəyi:</span>
                              <span>{task.completionNote}</span>
                            </div>
                          )}

                          {/* Meta: Assignee & Branch */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1 font-medium text-slate-700">
                                <User className="w-3 h-3 text-slate-400" />
                                {task.assigneeName}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                {task.branchName ? task.branchName.replace('AREA ', '') : 'Ümumi'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`flex items-center gap-1 ${overdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                <Calendar className="w-3 h-3" />
                                Son tarix: {formatDateAz(task.dueDate)}
                              </span>
                            </div>
                          </div>

                          {/* Quick Status Action Buttons */}
                          <div className="pt-1 flex items-center justify-end gap-1.5">
                            {task.status !== 'tamamlandi' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletionModalTask(task);
                                  setCompletionNote('');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check className="w-3 h-3" />
                                <span>İcranı Tamamla</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateTaskStatus(task.id, 'icradadir')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium cursor-pointer transition-colors"
                              >
                                Yenidən Aç
                              </button>
                            )}

                            {task.status === 'gozleyir' && (
                              <button
                                type="button"
                                onClick={() => updateTaskStatus(task.id, 'icradadir')}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-bold cursor-pointer transition-colors"
                              >
                                İcraya Başla
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">№</th>
                  <th className="py-3 px-4">Tapşırıq Adı & İzah</th>
                  <th className="py-3 px-4">Məsul Şəxs</th>
                  <th className="py-3 px-4">Filial</th>
                  <th className="py-3 px-4">Prioritet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Son İcra Tarixi</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Heç bir tapşırıq tapılmadı
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task, idx) => {
                    const overdue = isOverdue(task);
                    const stage = stages.find(s => s.id === task.status);

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-4 max-w-sm">
                          <div className="font-bold text-slate-900">{task.title}</div>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {task.description}
                            </p>
                          )}
                          {task.completionNote && (
                            <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                              ✓ {task.completionNote}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <div>{task.assigneeName}</div>
                          <span className="text-[10px] text-slate-400 block">{task.assigneeRole || 'Əməkdaş'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {task.branchName ? task.branchName.replace('AREA ', '') : 'Ümumi'}
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${stage?.badgeClass}`}>
                            {stage?.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-mono text-[11px] ${overdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {formatDateAz(task.dueDate)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {task.status !== 'tamamlandi' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletionModalTask(task);
                                  setCompletionNote('');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold cursor-pointer"
                                title="İcranı Tamamla"
                              >
                                Tamamla
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateTaskStatus(task.id, 'icradadir')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] cursor-pointer"
                              >
                                Aç
                              </button>
                            )}
                            {can('edit', 'tasks') && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(task)}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                title="Redaktə et"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {can('delete', 'tasks') && (
                              <button
                                type="button"
                                onClick={() => {
                                  confirmAction({
                                    title: 'Tapşırığı Sil',
                                    message: `"${task.title}" tapşırığını silmək istədiyinizə əminsiniz?`,
                                    confirmText: 'Bəli, Sil',
                                    danger: true,
                                    onConfirm: () => deleteTask(task.id),
                                  });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT TASK */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingTask ? 'Tapşırığa Düzəliş Et' : 'Yeni Tapşırıq Təyin Et'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tapşırığın Başlığı: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: Gənclik filialında sınaq dərsi avadanlıqlarının yoxlanılması"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ətraflı İzah və Təlimat:
                </label>
                <textarea
                  rows={3}
                  placeholder="Görüləcək işlərin tələbləri, texniki göstəricilər..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Məsul İcraçı (Əməkdaş):
                  </label>
                  <select
                    value={formAssigneeId}
                    onChange={e => setFormAssigneeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial:
                  </label>
                  <select
                    value={formBranchId}
                    onChange={e => setFormBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioritet:
                  </label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="yuksek">Yüksək (Təcili)</option>
                    <option value="orta">Orta</option>
                    <option value="asagi">Aşağı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Son İcra Tarixi (Deadline): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kateqoriya / Teqlər (vergüllə ayırın):
                </label>
                <input
                  type="text"
                  placeholder="məs: Təsərrüfat, Avadanlıq, İmtahan"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  {editingTask ? 'Yenilə' : 'Tapşırığı Təsdiqlə'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE TASK WITH NOTE */}
      {completionModalTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-3">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Tapşırığı Tamamlandı Kimi Qeyd Et
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              «<strong className="text-slate-900">{completionModalTask.title}</strong>» tapşırığı üzrə icra qeydinizi əlavə edin:
            </p>

            <div>
              <textarea
                rows={3}
                placeholder="Görülən işlərin yekun nəticəsi, hesabat qeydi və ya sənəd nömrəsi..."
                value={completionNote}
                onChange={e => setCompletionNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCompletionModalTask(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => {
                  updateTaskStatus(completionModalTask.id, 'tamamlandi', completionNote.trim());
                  setCompletionModalTask(null);
                }}
                className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Tamamlandı Olarak Yadda Saxla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
