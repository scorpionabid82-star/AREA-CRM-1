import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Layers,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Sparkles,
  FileText,
  Sliders,
  Users,
  Trophy,
  Cpu,
  MapPin,
  Search,
  Printer,
  Calendar,
  Wrench,
  Award,
  Filter,
  Check,
  ChevronUp,
  X,
  Edit,
  ExternalLink,
  HardDrive,
  Folder,
  Link as LinkIcon,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Curriculum, CurriculumModule, Lesson } from '../../types/crm';

export const CurriculumView: React.FC = () => {
  const {
    curriculums,
    groups,
    branches,
    selectedBranchId,
    addCurriculum,
    updateCurriculum,
    addModuleToCurriculum,
    addLessonToModule,
    updateGroupProgress,
    currentRole,
    showToast,
    can,
  } = useCrm();

  const isStudent = currentRole === 'sagird';

  // Filters
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [competitionOnlyFilter, setCompetitionOnlyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>(
    curriculums[0]?.id || ''
  );
  const [expandedModuleId, setExpandedModuleId] = useState<string>(
    curriculums[0]?.modules[0]?.id || ''
  );

  // Modal states
  const [showAddCurriculumModal, setShowAddCurriculumModal] = useState<boolean>(false);
  const [showEditCurriculumModal, setShowEditCurriculumModal] = useState<boolean>(false);
  const [showDriveUrlModal, setShowDriveUrlModal] = useState<boolean>(false);
  const [driveUrlInput, setDriveUrlInput] = useState('');
  const [showAddModuleModal, setShowAddModuleModal] = useState<boolean>(false);
  const [showAddLessonModal, setShowAddLessonModal] = useState<boolean>(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState<boolean>(false);
  const [targetModuleId, setTargetModuleId] = useState<string>('');

  // Edit curriculum form state
  const [editingCurriculumId, setEditingCurriculumId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<any>('Robototexnika & STEM');
  const [editMonths, setEditMonths] = useState(4);
  const [editHours, setEditHours] = useState(48);
  const [editPassing, setEditPassing] = useState(80);
  const [editDesc, setEditDesc] = useState('');
  const [editTargetAge, setEditTargetAge] = useState('8-14 yaş');
  const [editLevel, setEditLevel] = useState<any>('Orta');
  const [editEquipment, setEditEquipment] = useState('');
  const [editDriveUrl, setEditDriveUrl] = useState('');

  // New curriculum form
  const [newCurrTitle, setNewCurrTitle] = useState('');
  const [newCurrCategory, setNewCurrCategory] = useState<any>('Robototexnika & STEM');
  const [newCurrMonths, setNewCurrMonths] = useState(4);
  const [newCurrHours, setNewCurrHours] = useState(48);
  const [newCurrPassing, setNewCurrPassing] = useState(80);
  const [newCurrDesc, setNewCurrDesc] = useState('');
  const [newCurrSubTracks, setNewCurrSubTracks] = useState('');
  const [newCurrTargetAge, setNewCurrTargetAge] = useState('8-14 yaş');
  const [newCurrLevel, setNewCurrLevel] = useState<any>('Orta');
  const [newCurrEquipment, setNewCurrEquipment] = useState('');
  const [newCurrIsComp, setNewCurrIsComp] = useState(false);

  // New module form
  const [newModTitle, setNewModTitle] = useState('');
  const [newModDesc, setNewModDesc] = useState('');
  const [newModWeeks, setNewModWeeks] = useState(4);

  // New lesson form
  const [newLesTitle, setNewLesTitle] = useState('');
  const [newLesHours, setNewLesHours] = useState(2);
  const [newLesDesc, setNewLesDesc] = useState('');
  const [newLesHomework, setNewLesHomework] = useState('');

  // Filtered Curriculums
  const filteredCurriculums = curriculums.filter(curr => {
    // Competition filter
    if (competitionOnlyFilter && !curr.isCompetitionPrep) {
      return false;
    }
    // Category filter
    if (selectedCategoryFilter !== 'all' && curr.category !== selectedCategoryFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = curr.courseName.toLowerCase().includes(q);
      const matchDesc = curr.description.toLowerCase().includes(q);
      const matchSub = curr.subTracks?.some(s => s.toLowerCase().includes(q));
      const matchMod = curr.modules.some(m =>
        m.title.toLowerCase().includes(q) || m.lessons.some(l => l.title.toLowerCase().includes(q))
      );
      if (!matchName && !matchDesc && !matchSub && !matchMod) return false;
    }
    return true;
  });

  const currentCurriculum =
    filteredCurriculums.find(c => c.id === selectedCurriculumId) ||
    filteredCurriculums[0] ||
    curriculums[0];

  const relatedGroups = groups.filter(g => g.courseId === currentCurriculum?.id);

  const handleCreateCurriculum = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrTitle.trim()) return;

    const subTracksArray = newCurrSubTracks
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addCurriculum({
      courseName: newCurrTitle.trim(),
      category: newCurrCategory,
      totalDurationMonths: Number(newCurrMonths),
      totalHours: Number(newCurrHours),
      passingGrade: Number(newCurrPassing),
      description: newCurrDesc.trim(),
      subTracks: subTracksArray.length ? subTracksArray : undefined,
      isCompetitionPrep: newCurrIsComp,
      targetAge: newCurrTargetAge.trim() || undefined,
      level: newCurrLevel,
      equipmentNeeded: newCurrEquipment.trim() || undefined,
      branchesOffered: branches.map(b => b.name.replace('AREA ', '').replace(' Filialı', '')),
      modules: [],
    });

    setShowAddCurriculumModal(false);
    setNewCurrTitle('');
    setNewCurrDesc('');
    setNewCurrSubTracks('');
    setNewCurrEquipment('');
    showToast(`"${newCurrTitle}" kurikulumu uğurla yaradıldı!`);
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModTitle.trim() || !currentCurriculum) return;

    addModuleToCurriculum(currentCurriculum.id, {
      title: newModTitle.trim(),
      description: newModDesc.trim(),
      durationWeeks: Number(newModWeeks),
    });

    setShowAddModuleModal(false);
    setNewModTitle('');
    setNewModDesc('');
  };

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesTitle.trim() || !currentCurriculum || !targetModuleId) return;

    addLessonToModule(currentCurriculum.id, targetModuleId, {
      title: newLesTitle.trim(),
      durationHours: Number(newLesHours),
      description: newLesDesc.trim(),
    });

    setShowAddLessonModal(false);
    setNewLesTitle('');
    setNewLesDesc('');
    setNewLesHomework('');
  };

  const handleOpenEdit = (curr: Curriculum) => {
    setEditingCurriculumId(curr.id);
    setEditTitle(curr.courseName);
    setEditCategory(curr.category);
    setEditMonths(curr.totalDurationMonths);
    setEditHours(curr.totalHours);
    setEditPassing(curr.passingGrade);
    setEditDesc(curr.description);
    setEditTargetAge(curr.targetAge || '8-14 yaş');
    setEditLevel(curr.level || 'Orta');
    setEditEquipment(curr.equipmentNeeded || '');
    setEditDriveUrl(curr.driveUrl || '');
    setShowEditCurriculumModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingCurriculumId) return;

    updateCurriculum(editingCurriculumId, {
      courseName: editTitle.trim(),
      category: editCategory,
      totalDurationMonths: Number(editMonths),
      totalHours: Number(editHours),
      passingGrade: Number(editPassing),
      description: editDesc.trim(),
      targetAge: editTargetAge.trim(),
      level: editLevel,
      equipmentNeeded: editEquipment.trim(),
      driveUrl: editDriveUrl.trim() || undefined,
    });

    setShowEditCurriculumModal(false);
  };

  const handleSaveDriveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCurriculum) return;
    updateCurriculum(currentCurriculum.id, {
      driveUrl: driveUrlInput.trim(),
    });
    setShowDriveUrlModal(false);
    showToast('Google Drive qovluq keçidi yeniləndi!');
  };

  const categoriesList = [
    { id: 'all', label: 'Bütün Tədrislər' },
    { id: 'Robototexnika & STEM', label: 'Robototexnika & STEM' },
    { id: 'Mühəndislik & Mexanika', label: 'Mühəndislik & Mexanika' },
    { id: 'Dron & Aeronavtika', label: 'Dron & Aeronavtika' },
    { id: 'Proqramlaşdırma', label: 'Proqramlaşdırma' },
    { id: 'Süni İntellekt & Data', label: 'Süni İntellekt & Data' },
    { id: 'Elektronika & Meykerlik', label: 'Elektronika & Meykerlik' },
    { id: 'Yarış Hazırlığı', label: 'Yarış Hazırlığı' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Kurikulum
          </h2>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {currentCurriculum && (
            <button
              onClick={() => setShowSyllabusModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Sillabus</span>
            </button>
          )}

          {can('create', 'curriculum') && (
            <button
              onClick={() => setShowAddCurriculumModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Təlim</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Axtarış (təlim, alt ixtisas, modul)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Competition Track Quick Filter */}
            <button
              onClick={() => setCompetitionOnlyFilter(!competitionOnlyFilter)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                competitionOnlyFilter
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Yarış</span>
            </button>

            {/* Branch selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={selectedBranchFilter}
                onChange={e => setSelectedBranchFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Bütün Filiallar (9 filial)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          {categoriesList.map(cat => {
            const isActive = selectedCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Curriculum Horizontal Selector */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Tapılan Təlimlər: {filteredCurriculums.length} tədris proqramı</span>
          <span className="text-[11px] text-indigo-600 font-medium">Baxmaq üçün təlimin üzərinə klikləyin</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {filteredCurriculums.map(curr => {
            const isSelected = currentCurriculum?.id === curr.id;
            return (
              <button
                key={curr.id}
                onClick={() => {
                  setSelectedCurriculumId(curr.id);
                  if (curr.modules.length) setExpandedModuleId(curr.modules[0].id);
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {curr.category.split(' ')[0]}
                    </span>
                    {curr.isCompetitionPrep && (
                      <span
                        title="Respublika və Beynəlxalq Yarış Hazırlığı"
                        className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-amber-500'}`}
                      >
                        🏆
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold line-clamp-2 leading-tight">
                    {curr.courseName}
                  </h4>
                </div>

                <div
                  className={`mt-2 pt-2 border-t text-[10px] flex items-center justify-between ${
                    isSelected ? 'border-indigo-500 text-indigo-100' : 'border-slate-100 text-slate-400'
                  }`}
                >
                  <span>{curr.modules.length} modul</span>
                  <span>{curr.totalDurationMonths} ay</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {currentCurriculum ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Curriculum Overview & Modules Tree */}
          <div className="lg:col-span-8 space-y-6">
            {/* Curriculum Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      {currentCurriculum.category}
                    </span>
                    {currentCurriculum.isCompetitionPrep && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Trophy className="w-3 h-3 text-amber-600" />
                        <span>Yarış Hazırlığı (Beynəlxalq & Respublika)</span>
                      </span>
                    )}
                    {currentCurriculum.level && (
                      <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Səviyyə: {currentCurriculum.level}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {currentCurriculum.courseName}
                  </h3>

                  {currentCurriculum.targetAge && (
                    <p className="text-xs text-slate-500">
                      Hədəf Yaş Qrupu: <span className="font-semibold text-slate-700">{currentCurriculum.targetAge}</span>
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-end gap-1.5 text-xs text-slate-500 font-mono-nums shrink-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>{currentCurriculum.totalDurationMonths} ay ({currentCurriculum.totalHours} saat)</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Keçid Balı: {currentCurriculum.passingGrade}%
                  </span>
                  {can('edit', 'curriculum') && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(currentCurriculum)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer mt-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Kurrikulumu Redaktə Et</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-Tracks Pills */}
              {currentCurriculum.subTracks && currentCurriculum.subTracks.length > 0 && (
                <div className="space-y-1.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Tədris Olunan Alt İstiqamətlər və İxtisaslar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCurriculum.subTracks.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-lg shadow-2xs"
                      >
                        <Check className="w-3 h-3 text-indigo-600" />
                        <span>{sub}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment Needed */}
              {currentCurriculum.equipmentNeeded && (
                <div className="flex items-start gap-2.5 text-xs text-slate-600 bg-amber-50/50 border border-amber-200/60 rounded-xl p-3">
                  <Wrench className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900 block mb-0.5">Lazımi Laboratoriya Avadanlığı & Resurslar:</span>
                    <span>{currentCurriculum.equipmentNeeded}</span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                {currentCurriculum.description}
              </p>

              {/* Google Drive Integration Panel */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/80 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          AREA Tədris Materialları və Resurslar (Google Drive)
                        </h4>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full border border-blue-200">
                          Cloud Drive
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dərs təqdimatları, elektron vəsaitlər, robot montaj sxemləri və kod nümunələri.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={currentCurriculum.driveUrl || 'https://drive.google.com/drive/folders/1AREA_Robotics_STEM_Official_Archive'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Drive Qovluğunu Aç</span>
                    </a>

                    {can('edit', 'curriculum') && (
                      <button
                        type="button"
                        onClick={() => {
                          setDriveUrlInput(currentCurriculum.driveUrl || 'https://drive.google.com/drive/folders/1AREA_Robotics_STEM_Official_Archive');
                          setShowDriveUrlModal(true);
                        }}
                        className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Google Drive Linkini Redaktə Et"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-blue-100/80 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-blue-100">
                    <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Montaj Sxemləri & Təlimatlar</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-blue-100">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="truncate">Dərs Slaydları & Təqdimatlar</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-lg border border-blue-100">
                    <Cpu className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Mikrokontroller & Kodlar</span>
                  </div>
                </div>
              </div>

              {/* Branch offering notice */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Bütün filiallarda mövcuddur: <span className="font-semibold text-slate-800">9 Filial (Nərimanov, Gənclik, Əhmədli, Bakıxanov, Xırdalan, Sumqayıt, Gəncə, Şəki, Zaqatala)</span>
                  </span>
                </div>

                {can('create', 'curriculum') && (
                  <button
                    onClick={() => setShowAddModuleModal(true)}
                    className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yeni Modul Əlavə Et</span>
                  </button>
                )}
              </div>
            </div>

            {/* Modules Accordion */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Kurikulum Modulları ({currentCurriculum.modules.length} Modul)
                </h4>
                <span className="text-[11px] text-slate-400">
                  Dərsləri və tapşırıqları görmək üçün modulu açın
                </span>
              </div>

              {currentCurriculum.modules.length === 0 ? (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Bu kurikulum üçün hələ modul əlavə olunmayıb.</p>
                  {can('create', 'curriculum') && (
                    <button
                      onClick={() => setShowAddModuleModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      İlk Modulu Əlavə Et
                    </button>
                  )}
                </div>
              ) : (
                currentCurriculum.modules.map(mod => {
                  const isExpanded = expandedModuleId === mod.id;
                  return (
                    <div
                      key={mod.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
                    >
                      {/* Module Header */}
                      <div
                        onClick={() => setExpandedModuleId(isExpanded ? '' : mod.id)}
                        className="p-4 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono-nums shrink-0">
                            {mod.order}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{mod.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 max-w-lg">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
                          <span className="font-mono-nums font-medium">{mod.durationWeeks} həftə</span>
                          <span>·</span>
                          <span className="font-mono-nums font-medium">{mod.lessons.length} dərs</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Lessons List */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                          <div className="divide-y divide-slate-100">
                            {mod.lessons.map((les, index) => (
                              <div
                                key={les.id}
                                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold text-indigo-600 font-mono-nums">
                                      {index + 1}.
                                    </span>
                                    <span className="font-semibold text-slate-900">{les.title}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 pl-4">
                                    {les.description}
                                  </p>
                                  {les.homework && (
                                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded ml-4 inline-block font-medium">
                                      Ev Tapşırığı / Praktika: {les.homework}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 pl-4 sm:pl-0 shrink-0">
                                  <span className="text-[11px] font-mono-nums text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                    {les.durationHours} saat
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {can('create', 'curriculum') && (
                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                              <button
                                onClick={() => {
                                  setTargetModuleId(mod.id);
                                  setShowAddLessonModal(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Bu Modula Dərs Əlavə Et</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Groups in Branches & Curriculum Metrics */}
          <div className="lg:col-span-4 space-y-6">
            {/* Active Groups Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Bu Təlimi Keçən Qruplar ({relatedGroups.length})
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Canlı Status</span>
              </div>

              {relatedGroups.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>Bu təlim üzrə hazırda aktiv qrup yoxdur.</p>
                  <p className="text-[11px] mt-1 text-slate-400">Qruplar bölməsindən yeni qrup aça bilərsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {relatedGroups.map(grp => (
                    <div
                      key={grp.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{grp.name}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {grp.status === 'davam_edir' ? 'Davam Edir' : grp.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p>Təlimçi: <span className="font-semibold text-slate-700">{grp.trainerName}</span></p>
                        <p>Otaq: <span className="font-semibold text-slate-700">{grp.room}</span></p>
                        <p>Cədvəl: <span className="font-mono-nums">{grp.schedule}</span></p>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between text-[11px] font-medium text-slate-600">
                          <span>Kurikulum İrəliləyişi</span>
                          <span className="font-bold font-mono-nums text-indigo-600">
                            {grp.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${grp.progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {can('edit', 'curriculum') && (
                        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-500">İrəliləyişi yenilə:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                updateGroupProgress(grp.id, Math.max(0, grp.progressPercent - 10))
                              }
                              className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-slate-700 font-bold cursor-pointer"
                            >
                              -10%
                            </button>
                            <button
                              onClick={() =>
                                updateGroupProgress(grp.id, Math.min(100, grp.progressPercent + 10))
                              }
                              className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded text-indigo-700 font-bold cursor-pointer"
                            >
                              +10%
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Curriculum Stats Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 border border-slate-800 shadow-sm text-xs">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4" />
                <h4 className="font-bold text-white">Akademiya Tədris Standartı</h4>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Hər bir kurikulum STEAM, Yapon Mühəndisliyi və Beynəlxalq Olimpiada standartlarına uyğunlaşdırılmışdır. 
                Modul imtahanları və buraxılış işləri QR kodlu rəsmi sertifikatla təmin olunur.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Dərslərin Cəmi:</span>
                  <span className="font-bold text-white font-mono-nums">
                    {currentCurriculum.modules.reduce((acc, m) => acc + m.lessons.length, 0)} Dərs
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tədris Müddəti:</span>
                  <span className="font-bold text-white font-mono-nums">
                    {currentCurriculum.totalHours} Akademik Saat
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Axtarışa uyğun təlim tapılmadı</h3>
          <p className="text-xs text-slate-500">Filtrləri təmizləyin və ya fərqli açar söz daxil edin.</p>
          <button
            onClick={() => {
              setSelectedCategoryFilter('all');
              setCompetitionOnlyFilter(false);
              setSearchQuery('');
            }}
            className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Filtrləri Sıfırla
          </button>
        </div>
      )}

      {/* Modal: Add Curriculum */}
      {showAddCurriculumModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Yeni Təlim / Kurikulum Yarat</h3>
              <button
                onClick={() => setShowAddCurriculumModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCurriculum} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Təlimin Adı:</label>
                <input
                  type="text"
                  required
                  value={newCurrTitle}
                  onChange={e => setNewCurrTitle(e.target.value)}
                  placeholder="Məs: RoboMonte, Drone Soccer, Py Maker..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kateqoriya:</label>
                  <select
                    value={newCurrCategory}
                    onChange={e => setNewCurrCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="Robototexnika & STEM">Robototexnika & STEM</option>
                    <option value="Mühəndislik & Mexanika">Mühəndislik & Mexanika</option>
                    <option value="Dron & Aeronavtika">Dron & Aeronavtika</option>
                    <option value="Proqramlaşdırma">Proqramlaşdırma</option>
                    <option value="Süni İntellekt & Data">Süni İntellekt & Data</option>
                    <option value="Elektronika & Meykerlik">Elektronika & Meykerlik</option>
                    <option value="Yarış Hazırlığı">Yarış Hazırlığı</option>
                    <option value="Dizayn">Dizayn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Səviyyə:</label>
                  <select
                    value={newCurrLevel}
                    onChange={e => setNewCurrLevel(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  >
                    <option value="Başlanğıc">Başlanğıc</option>
                    <option value="Orta">Orta</option>
                    <option value="İrəli Səviyyə (Advance)">İrəli Səviyyə (Advance)</option>
                    <option value="Yarış Səviyyəsi">Yarış Səviyyəsi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Alt İstiqamətlər (Vergüllə ayırın):
                </label>
                <input
                  type="text"
                  value={newCurrSubTracks}
                  onChange={e => setNewCurrSubTracks(e.target.value)}
                  placeholder="Məs: RoboMonte Coding, Front End Jr/Sr, AI Champion..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Müddət (Ay):</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={newCurrMonths}
                    onChange={e => setNewCurrMonths(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cəmi Saat:</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={newCurrHours}
                    onChange={e => setNewCurrHours(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono-nums"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Keçid Balı (%):</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={newCurrPassing}
                    onChange={e => setNewCurrPassing(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hədəf Yaş Qrupu:</label>
                  <input
                    type="text"
                    value={newCurrTargetAge}
                    onChange={e => setNewCurrTargetAge(e.target.value)}
                    placeholder="Məs: 7-12 yaş və ya 14+ yaş"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lazımi Avadanlıq:</label>
                  <input
                    type="text"
                    value={newCurrEquipment}
                    onChange={e => setNewCurrEquipment(e.target.value)}
                    placeholder="Məs: Dron dəsti, Robot şassisi..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCompCheck"
                  checked={newCurrIsComp}
                  onChange={e => setNewCurrIsComp(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isCompCheck" className="text-slate-700 font-semibold cursor-pointer">
                  🏆 Bu təlim Respublika və ya Beynəlxalq Yarış Hazırlığıdır
                </label>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Təlimin Təsviri:</label>
                <textarea
                  rows={3}
                  value={newCurrDesc}
                  onChange={e => setNewCurrDesc(e.target.value)}
                  placeholder="Təlimin məqsədi və şagirdin qazanacağı praktiki bacarıqlar..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCurriculumModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Module */}
      {showAddModuleModal && currentCurriculum && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                "{currentCurriculum.courseName}" üçün Yeni Modul
              </h3>
              <button
                onClick={() => setShowAddModuleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Modulun Başlığı:</label>
                <input
                  type="text"
                  required
                  value={newModTitle}
                  onChange={e => setNewModTitle(e.target.value)}
                  placeholder="Məs: Modul 1: Sensorlar və Məsafə Ölçümü"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Müddət (Həftə):</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newModWeeks}
                  onChange={e => setNewModWeeks(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Modulun Təsviri:</label>
                <textarea
                  rows={3}
                  value={newModDesc}
                  onChange={e => setNewModDesc(e.target.value)}
                  placeholder="Bu modulda öyrədiləcək konseptlər..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModuleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Modulu Əlavə Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Lesson */}
      {showAddLessonModal && currentCurriculum && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Modula Dərs Əlavə Et</h3>
              <button
                onClick={() => setShowAddLessonModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dərsin Mövzusu:</label>
                <input
                  type="text"
                  required
                  value={newLesTitle}
                  onChange={e => setNewLesTitle(e.target.value)}
                  placeholder="Məs: Ultrasəs sensoru ilə labirintdən çıxış"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Müddət (Saat):</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={newLesHours}
                  onChange={e => setNewLesHours(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Dərsin Detalları:</label>
                <textarea
                  rows={2}
                  value={newLesDesc}
                  onChange={e => setNewLesDesc(e.target.value)}
                  placeholder="Öyrəniləcək alətlər və praktik iş..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Ev Tapşırığı (İxtiyari):</label>
                <input
                  type="text"
                  value={newLesHomework}
                  onChange={e => setNewLesHomework(e.target.value)}
                  placeholder="Məs: Robotun dönmə bucaqlarını sınaqdan keçirmək"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Dərsi Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable Syllabus Overview */}
      {showSyllabusModal && currentCurriculum && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-slate-900 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  AREA Robototexnika və Mühəndislik Akademiyası
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Rəsmi Tədris Sillabusu: {currentCurriculum.courseName}
                </h3>
              </div>
              <button
                onClick={() => setShowSyllabusModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Kateqoriya:</span>
                  <span className="font-bold text-slate-800">{currentCurriculum.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Müddət:</span>
                  <span className="font-bold text-slate-800 font-mono-nums">
                    {currentCurriculum.totalDurationMonths} ay ({currentCurriculum.totalHours} saat)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Keçid Balı:</span>
                  <span className="font-bold text-emerald-700 font-mono-nums">
                    {currentCurriculum.passingGrade}%
                  </span>
                </div>
              </div>

              {currentCurriculum.subTracks && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Alt İxtisaslar:</h4>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    {currentCurriculum.subTracks.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Modullar və Dərs Planı:</h4>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {currentCurriculum.modules.map(m => (
                    <div key={m.id} className="p-3 border border-slate-200 rounded-lg space-y-1.5">
                      <div className="flex justify-between items-center font-bold text-slate-900">
                        <span>{m.title}</span>
                        <span className="text-slate-400 text-[11px] font-mono-nums">{m.durationWeeks} həftə</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{m.description}</p>
                      <div className="pl-2 border-l-2 border-indigo-200 space-y-1 pt-1 text-[11px]">
                        {m.lessons.map(l => (
                          <div key={l.id} className="flex justify-between text-slate-700">
                            <span>· {l.title}</span>
                            <span className="font-mono-nums text-slate-400">{l.durationHours}s</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                onClick={() => setShowSyllabusModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Bağla
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Çap Et</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CURRICULUM */}
      {showEditCurriculumModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Kurrikulum Göstəricilərini Redaktə Et
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditCurriculumModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kursun / Təlimin Adı: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kateqoriya:
                  </label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Robototexnika & STEM">Robototexnika & STEM</option>
                    <option value="Mühəndislik & Mexanika">Mühəndislik & Mexanika</option>
                    <option value="Dron & Aeronavtika">Dron & Aeronavtika</option>
                    <option value="Proqramlaşdırma">Proqramlaşdırma</option>
                    <option value="Süni İntellekt & Data">Süni İntellekt & Data</option>
                    <option value="Elektronika & Meykerlik">Elektronika & Meykerlik</option>
                    <option value="Yarış Hazırlığı">Yarış Hazırlığı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Səviyyə:
                  </label>
                  <select
                    value={editLevel}
                    onChange={e => setEditLevel(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Başlanğıc">Başlanğıc</option>
                    <option value="Orta">Orta</option>
                    <option value="İrəli Səviyyə (Advance)">İrəli Səviyyə (Advance)</option>
                    <option value="Yarış Səviyyəsi">Yarış Səviyyəsi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Müddət (Ay):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={editMonths}
                    onChange={e => setEditMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ümumi Saat:
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={editHours}
                    onChange={e => setEditHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Keçid Balı (%):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={editPassing}
                    onChange={e => setEditPassing(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hədəf Yaş Qrupu:
                </label>
                <input
                  type="text"
                  placeholder="məs: 8-14 yaş və ya 12+ yaş"
                  value={editTargetAge}
                  onChange={e => setEditTargetAge(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lazımi Laboratoriya Avadanlığı & Dəstlər:
                </label>
                <input
                  type="text"
                  placeholder="məs: LEGO Spike Prime dəsti, Planşet/PC, Arduino Starter Kit"
                  value={editEquipment}
                  onChange={e => setEditEquipment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Drive Qovluğu (Tədris Materialları Keçidi):
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={editDriveUrl}
                  onChange={e => setEditDriveUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-blue-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kurrikulum Haqqında Təsvir:
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditCurriculumModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Dəyişiklikləri Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT GOOGLE DRIVE URL QUICK */}
      {showDriveUrlModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-blue-600 border-b border-slate-100 pb-3">
              <HardDrive className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Google Drive Qovluq Keçidi
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bu kurrikuluma aid dərs vəsaitlərinin, layihələrin və slaydların saxlanıldığı rəsmi Google Drive qovluğunun linkini daxil edin:
            </p>

            <form onSubmit={handleSaveDriveUrl} className="space-y-3">
              <div>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={driveUrlInput}
                  onChange={e => setDriveUrlInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono text-blue-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDriveUrlModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
