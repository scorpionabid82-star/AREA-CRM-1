import React, { useState } from 'react';
import {
  FileSignature,
  Search,
  Plus,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  Trash2,
  Edit2,
  Printer,
  Sparkles,
  BookOpen,
  Building2,
  Users,
  GraduationCap,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  Archive,
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { StudentContract } from '../../types/crm';
import { formatAZN, formatDateAz, exportToCSV } from '../../utils/formatters';

interface ContractsViewProps {
  initialStudentId?: string;
  onSelectStudent?: (studentId: string) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  initialStudentId,
  onSelectStudent,
}) => {
  const {
    contracts,
    students,
    curriculums,
    groups,
    branches,
    addContract,
    updateContract,
    deleteContract,
    softDeleteContract,
    hardDeleteContract,
    restoreContract,
    studentDebts,
    confirmAction,
    setActiveTab,
    can,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktiv' | 'gozleyir' | 'tamamlandi' | 'dondurulub' | 'legv_edilib' | 'archived'>('all');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewContract, setPreviewContract] = useState<StudentContract | null>(null);
  const [editingContract, setEditingContract] = useState<StudentContract | null>(null);
  const [debtModalContract, setDebtModalContract] = useState<{
    contract: StudentContract;
    isHardDelete: boolean;
    unpaidDebts: typeof studentDebts;
  } | null>(null);

  // Form states for New Contract
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || (students[0]?.id || ''));
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>(
    `AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [monthlyFee, setMonthlyFee] = useState<number>(260);
  const [lessonsPerMonth, setLessonsPerMonth] = useState<4 | 8>(8);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentPlan, setPaymentPlan] = useState<'ayliq' | 'birdefelik' | 'hisseli'>('ayliq');
  const [notes, setNotes] = useState<string>('');

  // Edit form states
  const [editMonthlyFee, setEditMonthlyFee] = useState<number>(260);
  const [editStatus, setEditStatus] = useState<StudentContract['status']>('aktiv');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editGroupId, setEditGroupId] = useState<string>('');

  // Handle open add modal
  const handleOpenAddModal = (presetStudentId?: string) => {
    const targetStudentId = presetStudentId || selectedStudentId || (students[0]?.id || '');
    if (targetStudentId) {
      setSelectedStudentId(targetStudentId);
      const stu = students.find(s => s.id === targetStudentId);
      if (stu) {
        if (stu.groupId) setSelectedGroupId(stu.groupId);
        if (stu.monthlyFee) setMonthlyFee(stu.monthlyFee);
      }
    }
    setContractNumber(`AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setShowAddModal(true);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const stu = students.find(s => s.id === studentId);
    if (stu) {
      if (stu.groupId) setSelectedGroupId(stu.groupId);
      if (stu.monthlyFee) setMonthlyFee(stu.monthlyFee);
    }
  };

  // Compute calculated end date
  const computeEndDate = (start: string, months: number) => {
    try {
      const d = new Date(start);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const calculatedEndDate = computeEndDate(startDate, durationMonths);
  const subtotal = monthlyFee * durationMonths;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Group contracts by student to identify multi-program students
  const studentContractsCount: Record<string, number> = {};
  contracts.forEach(c => {
    studentContractsCount[c.studentId] = (studentContractsCount[c.studentId] || 0) + 1;
  });

  const multiProgramStudentsCount = Object.values(studentContractsCount).filter(count => count > 1).length;
  const activeContractsCount = contracts.filter(c => c.status === 'aktiv').length;
  const totalMonthlyVolume = contracts
    .filter(c => !c.isDeleted && c.status === 'aktiv')
    .reduce((sum, c) => sum + (c.monthlyFee || 0), 0);

  const archivedContractsCount = contracts.filter(c => c.isDeleted).length;

  // Filtering
  const filteredContracts = contracts.filter(ctr => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ctr.studentName.toLowerCase().includes(q) ||
      ctr.contractNumber.toLowerCase().includes(q) ||
      ctr.courseName.toLowerCase().includes(q) ||
      (ctr.groupName && ctr.groupName.toLowerCase().includes(q));

    let matchesStatus = true;
    if (statusFilter === 'archived') {
      matchesStatus = !!ctr.isDeleted;
    } else {
      if (ctr.isDeleted) return false;
      if (statusFilter !== 'all') {
        matchesStatus = ctr.status === statusFilter;
      }
    }

    const matchesGroup =
      selectedGroupFilter === 'all' ||
      (selectedGroupFilter === 'individual' ? !ctr.groupId : ctr.groupId === selectedGroupFilter);
    const matchesBranch = selectedBranchFilter === 'all' || ctr.branchId === selectedBranchFilter;

    return matchesSearch && matchesStatus && matchesGroup && matchesBranch;
  });

  const handleInitiateDelete = (ctr: StudentContract, isHardDelete: boolean) => {
    const unpaid = studentDebts.filter(d => d.contractId === ctr.id && d.status !== 'tam_odenilib');
    if (unpaid.length > 0) {
      setDebtModalContract({ contract: ctr, isHardDelete, unpaidDebts: unpaid });
    } else {
      if (isHardDelete) {
        confirmAction({
          title: 'Müqaviləni Birdəfəlik Sil (Hard Delete)',
          message: `"${ctr.contractNumber}" nömrəli müqaviləni (${ctr.studentName} - ${ctr.courseName}) sistemdən tamamilə silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır.`,
          confirmText: 'Bəli, Birdəfəlik Sil',
          danger: true,
          onConfirm: () => hardDeleteContract(ctr.id),
        });
      } else {
        confirmAction({
          title: 'Müqaviləni Arxivə Göndər (Soft Delete)',
          message: `"${ctr.contractNumber}" nömrəli müqaviləni (${ctr.studentName} - ${ctr.courseName}) arxivə göndərmək və ləğv etmək istəyirsiniz? İstənilən vaxt Arxiv bölməsindən bərpa edə bilərsiniz.`,
          confirmText: 'Arxivə Göndər',
          danger: false,
          onConfirm: () => softDeleteContract(ctr.id),
        });
      }
    }
  };

  const handleCreateContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const group = groups.find(g => g.id === selectedGroupId);

    const targetCourseName = group?.courseName || student.courseName || 'Fərdi Dərs';
    const targetCurriculumId = group?.courseId || curriculums.find(c => c.courseName === targetCourseName)?.id || '';
    const targetBranchId = group?.branchId || student.branchId || branches[0]?.id;
    const targetBranchName = group?.branchName || student.branchName || branches[0]?.name;

    addContract({
      contractNumber: contractNumber.trim(),
      studentId: student.id,
      studentName: student.fullName,
      curriculumId: targetCurriculumId,
      courseName: targetCourseName,
      branchId: targetBranchId,
      branchName: targetBranchName,
      groupId: group?.id,
      groupName: group?.name || 'Fərdi / Qrup təyin edilməyib',
      trainerId: group?.trainerId,
      trainerName: group?.trainerName,
      startDate,
      endDate: calculatedEndDate,
      monthlyFee,
      lessonsPerMonth,
      scheduleTime: group?.schedule || `Ayda ${lessonsPerMonth} dərs`,
      parentPhone: student.parentPhone || student.phone,
      totalMonths: durationMonths,
      totalAmount,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      paymentPlan,
      status: 'aktiv',
      signedDate: new Date().toISOString().split('T')[0],
      notes: notes.trim(),
    });

    setShowAddModal(false);
    setNotes('');
  };

  const handleOpenEdit = (ctr: StudentContract) => {
    setEditingContract(ctr);
    setEditMonthlyFee(ctr.monthlyFee);
    setEditStatus(ctr.status);
    setEditNotes(ctr.notes || '');
    setEditGroupId(ctr.groupId || '');
  };

  const handleUpdateContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract) return;

    const grp = groups.find(g => g.id === editGroupId);

    updateContract(editingContract.id, {
      monthlyFee: editMonthlyFee,
      status: editStatus,
      notes: editNotes,
      groupId: grp?.id,
      groupName: grp?.name || editingContract.groupName,
    });

    setEditingContract(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>Müqavilələr & Tədris Proqramları</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono-nums">
                  {contracts.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tələbələrin fərqli vaxtlarda qoşulduğu bütün proqramların rəsmi müqavilə reyestri.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() =>
              exportToCSV(
                'AREA_Muqavileler',
                contracts.map(c => ({
                  MuqavileNo: c.contractNumber,
                  Telebe: c.studentName,
                  Proqram: c.courseName,
                  Qrup: c.groupName || 'Təyin edilməyib',
                  Filial: c.branchName || 'Əsas',
                  Baslama: c.startDate,
                  Bitme: c.endDate,
                  AyliqHaqq: c.monthlyFee,
                  UmumiMebleg: c.totalAmount || c.monthlyFee * 6,
                  Status: c.status,
                  Imzalanma: c.signedDate,
                }))
              )
            }
            title="CSV faylı ixrac et"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {can('create', 'contracts') && (
            <button
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Müqavilə Bağla</span>
            </button>
          )}
        </div>
      </div>

      {/* Principle Callout */}
      <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Tələbə və Çoxproqramlı Müqavilə Qaydası</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                Sistem Qaydası
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-3xl">
              Hər bir tələbə şəxsiyyəti sistemə <strong>yalnız 1 dəfə</strong> daxil edilir. Lakin həmin tələbə üçün istənilən qədər (5–6 fərqli proqram: Robototexnika, Dron, Veb Proqramlaşdırma, Python & AI, UI/UX və s.) eyni vaxtda və ya ardıcıl olaraq müstəqil müqavilələr bağlana bilər.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('students')}
          className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Tələbələr Reyestrinə Bax</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ümumi Müqavilələr
            </span>
            <FileSignature className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums">
            {contracts.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Bütün imzalanmış tədris razılaşmaları
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aktiv Tədris Proqramları
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono-nums">
            {activeContractsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            Hal-hazırda dərsləri davam edən müqavilələr
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Çoxproqramlı Tələbələr
            </span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono-nums">
            {multiProgramStudentsCount}
          </div>
          <p className="text-[11px] text-slate-500">
            2 və ya daha çox proqramda oxuyan tələbələr
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Aylıq Müqavilə Dövriyyəsi
            </span>
            <GraduationCap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono-nums">
            {formatAZN(totalMonthlyVolume)}
          </div>
          <p className="text-[11px] text-slate-500">
            Aktiv proqramlar üzrə aylıq gözlənilən təhsil haqqı
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Axtarış (tələbə, müqavilə №, proqram, qrup)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Group Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedGroupFilter}
            onChange={e => setSelectedGroupFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Bütün Qruplar ({groups.filter(g => !g.isDeleted).length})</option>
            <option value="individual">Fərdi / Qrup təyin edilməyib</option>
            {groups
              .filter(g => !g.isDeleted)
              .map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.courseName})
                </option>
              ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div className="md:col-span-2">
          <select
            value={selectedBranchFilter}
            onChange={e => setSelectedBranchFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Bütün Filiallar</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name.replace('AREA ', '')}
              </option>
            ))}
          </select>
        </div>

        {/* Status segmented buttons */}
        <div className="md:col-span-3 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Hamısı
          </button>
          <button
            onClick={() => setStatusFilter('aktiv')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'aktiv'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Aktiv
          </button>
          <button
            onClick={() => setStatusFilter('tamamlandi')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'tamamlandi'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tamamlandı
          </button>
          <button
            onClick={() => setStatusFilter('dondurulub')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'dondurulub'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dondurulub
          </button>
          <button
            onClick={() => setStatusFilter('legv_edilib')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'legv_edilib'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ləğv edilən
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'archived'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-rose-600 hover:bg-rose-50'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arxiv ({archivedContractsCount})</span>
          </button>
        </div>
      </div>

      {/* Contracts Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Müqavilə №</th>
                <th className="py-3 px-4">Tələbə</th>
                <th className="py-3 px-4">Qrup & Filial</th>
                <th className="py-3 px-4">Tədris Müddəti</th>
                <th className="py-3 px-4">Aylıq / Ümumi Məbləğ</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map(ctr => {
                const isMulti = (studentContractsCount[ctr.studentId] || 0) > 1;

                return (
                  <tr key={ctr.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Contract Number */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <FileSignature className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="font-mono-nums font-bold text-slate-900">
                          {ctr.contractNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        İmza: {formatDateAz(ctr.signedDate)}
                      </span>
                    </td>

                    {/* Student */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{ctr.studentName}</span>
                            {isMulti && (
                              <span
                                title="Bu tələbə 2 və ya daha çox proqramda iştirak edir"
                                className="px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200"
                              >
                                {studentContractsCount[ctr.studentId]} Müqavilə
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono-nums">
                            ID: {ctr.studentId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Group & Branch */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{ctr.groupName || 'Fərdi / Təyin edilməyib'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[220px] mt-0.5 flex items-center gap-1.5">
                        <span className="text-indigo-700 font-medium">{ctr.courseName}</span>
                        <span>·</span>
                        <span className="text-slate-400">{ctr.branchName || 'Əsas Filial'}</span>
                      </div>
                    </td>

                    {/* Duration & Dates */}
                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-mono-nums">
                        {formatDateAz(ctr.startDate)} — {formatDateAz(ctr.endDate)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {ctr.totalMonths ? `${ctr.totalMonths} ay` : ''} · Ayda {ctr.lessonsPerMonth || 8} dərs
                      </div>
                    </td>

                    {/* Fees */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono-nums">
                        {formatAZN(ctr.monthlyFee)} <span className="text-[10px] text-slate-400 font-normal">/ ay</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-nums">
                        Cəmi: {formatAZN(ctr.totalAmount || ctr.monthlyFee * 6)}
                        {ctr.discountPercent ? ` (${ctr.discountPercent}% endirim)` : ''}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {ctr.isDeleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full">
                          <Archive className="w-3 h-3 text-rose-500" />
                          Arxivdə / Silinib
                        </span>
                      ) : (
                        <>
                          {ctr.status === 'aktiv' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Aktiv
                            </span>
                          )}
                          {ctr.status === 'gozleyir' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-500" />
                              Gözləyir
                            </span>
                          )}
                          {ctr.status === 'tamamlandi' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                              Tamamlandı
                            </span>
                          )}
                          {ctr.status === 'dondurulub' && (
                            <span className="inline-flex items-center text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                              Dondurulub
                            </span>
                          )}
                          {ctr.status === 'legv_edilib' && (
                            <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                              Ləğv edilib
                            </span>
                          )}
                        </>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ctr.isDeleted ? (
                          <>
                            {can('delete', 'contracts') && (
                              <>
                                <button
                                  onClick={() => restoreContract(ctr.id)}
                                  title="Müqaviləni aktivə qaytar / bərpa et"
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleInitiateDelete(ctr, true)}
                                  title="Birdəfəlik fiziki sil (Hard Delete)"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setPreviewContract(ctr)}
                              title="Rəsmi Müqavilə Blankına Bax və Çap Et"
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {can('edit', 'contracts') && (
                              <button
                                onClick={() => handleOpenEdit(ctr)}
                                title="Müqaviləni redaktə et"
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {can('delete', 'contracts') && (
                              <>
                                <button
                                  onClick={() => handleInitiateDelete(ctr, false)}
                                  title="Arxivə göndər / Ləğv et (Soft Delete)"
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleInitiateDelete(ctr, true)}
                                  title="Birdəfəlik sil (Hard Delete)"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredContracts.length && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <FileSignature className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  {contracts.length === 0
                    ? 'Hələ heç bir proqram müqaviləsi bağlanmayıb'
                    : 'Axtarışa uyğun müqavilə tapılmadı'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {contracts.length === 0
                    ? 'Yuxarıdakı "Yeni Müqavilə Bağla" düyməsinə klikləyərək istənilən mövcud tələbə üçün yeni tədris proqramı üzrə müqavilə formalaşdıra bilərsiniz.'
                    : 'Axtarış filtrlərini dəyişərək yenidən cəhd edin.'}
                </p>
              </div>
              {contracts.length === 0 && (
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>İlk Müqaviləni Bağla</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Yeni Müqavilə Bağla */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-indigo-600" />
                  <span>Yeni Tədris Proqramı Müqaviləsi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mövcud tələbə üçün yeni proqram / kurs qeydiyyatı.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContractSubmit} className="space-y-4">
              {/* Select Existing Student */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-indigo-950">
                  1. Tələbəni Seçin (Yalnız bazada mövcud tələbələr):
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={e => handleStudentSelect(e.target.value)}
                  className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {students
                    .filter(s => !s.isDeleted)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} {s.finCode ? `[FİN: ${s.finCode}]` : ''} ({s.phone}) — {s.courseName}
                      </option>
                    ))}
                </select>

                {(() => {
                  const currStu = students.find(s => s.id === selectedStudentId);
                  const activeCtrs = contracts.filter(c => c.studentId === selectedStudentId && c.status === 'aktiv' && !c.isDeleted);
                  const chosenGroup = groups.find(g => g.id === selectedGroupId);

                  return (
                    <div className="p-2.5 bg-white/90 rounded-lg border border-indigo-100 text-xs space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-950">
                          {currStu?.fullName} {currStu?.finCode ? `(FİN: ${currStu.finCode})` : ''}
                        </span>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          {activeCtrs.length} Aktiv Müqavilə
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] text-slate-500">Mövcud Qrupları:</span>
                        {activeCtrs.length > 0 ? (
                          activeCtrs.map(c => (
                            <span key={c.id} className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                              ✓ {c.groupName || c.courseName}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Hələ aktiv müqaviləsi yoxdur</span>
                        )}
                      </div>
                      {chosenGroup && (
                        <div className="text-[11px] text-indigo-900 bg-indigo-50/80 p-2 rounded-lg border border-indigo-100 font-medium flex items-center justify-between mt-1">
                          <span>Seçilmiş Qrup: <strong>{chosenGroup.name}</strong> ({chosenGroup.courseName})</span>
                          <span className="text-slate-500 text-[10px]">{chosenGroup.branchName || 'Əsas Filial'}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="text-[11px] text-indigo-700 flex items-center justify-between pt-0.5">
                  <span>
                    ℹ️ Qaydaya əsasən tələbə adı və FİN kodu 1 dəfə daxil edilir. Bir tələbə üçün bir neçə qrup üzrə ayrıca müqavilə bağlana bilər.
                  </span>
                </div>
              </div>

              {/* 2. Group Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    2. Qrup Seçimi:
                  </label>
                  {selectedGroupId && (() => {
                    const selGroup = groups.find(g => g.id === selectedGroupId);
                    return selGroup ? (
                      <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Proqram: {selGroup.courseName} · Təlimçi: {selGroup.trainerName}
                      </span>
                    ) : null;
                  })()}
                </div>
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Fərdi / Qrup hələ təyin edilməyib</option>
                  {groups
                    .filter(g => !g.isDeleted)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.courseName} · Təlimçi: {g.trainerName} {g.schedule ? `(${g.schedule})` : ''}
                      </option>
                    ))}
                </select>

                {selectedGroupId && (() => {
                  const selGroup = groups.find(g => g.id === selectedGroupId);
                  if (!selGroup) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Tədris Proqramı:</span>
                        <span className="font-bold text-indigo-950">{selGroup.courseName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Təyin Olunan Təlimçi:</span>
                        <span className="font-bold text-slate-900">{selGroup.trainerName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Filial & Otaq:</span>
                        <span className="font-medium text-slate-800">{selGroup.branchName?.replace('AREA ', '') || 'Əsas'} ({selGroup.room})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Dərs Cədvəli:</span>
                        <span className="font-medium text-slate-800">{selGroup.schedule}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Contract Number & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Müqavilə №:
                  </label>
                  <input
                    type="text"
                    required
                    value={contractNumber}
                    onChange={e => setContractNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Başlama Tarixi:
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Müddət:
                  </label>
                  <select
                    value={durationMonths}
                    onChange={e => setDurationMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  >
                    <option value={1}>1 Ay (Sınaq / Mini)</option>
                    <option value={3}>3 Ay (Rüb)</option>
                    <option value={4}>4 Ay</option>
                    <option value={6}>6 Ay (Yarımillik)</option>
                    <option value={9}>9 Ay (Akademik İl)</option>
                    <option value={12}>12 Ay (Tam Kurs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bitmə Tarixi:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={calculatedEndDate}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono-nums text-slate-700 font-semibold cursor-not-allowed"
                    title="Müddətə əsasən avtomatik hesablanır"
                  />
                </div>
              </div>

              {/* Lesson Frequency Selection (4 vs 8 lessons per month) */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950">
                    Aylıq Dərs Sayı və Cədvəl Rejimi:
                  </label>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    {lessonsPerMonth === 8 ? '8 Dərs (Həftədə 2 dəfə)' : '4 Dərs (Həftədə 1 dəfə)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLessonsPerMonth(8)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      lessonsPerMonth === 8
                        ? 'border-indigo-600 bg-white text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white/70 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Ayda 8 Dərs</div>
                    <div className="text-[10px] text-slate-500 font-normal">Həftədə 2 dəfə (Standart intensiv)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLessonsPerMonth(4)}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      lessonsPerMonth === 4
                        ? 'border-indigo-600 bg-white text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white/70 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Ayda 4 Dərs</div>
                    <div className="text-[10px] text-slate-500 font-normal">Həftədə 1 dəfə (Fərdi / Modul)</div>
                  </button>
                </div>
              </div>

              {/* Financial Terms */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-semibold text-xs text-slate-800">
                  Maliyyə və Ödəniş Şərtləri:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Aylıq Təhsil Haqqı (AZN):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      placeholder="Məs: 85, 93, 260..."
                      value={monthlyFee === 0 ? '' : monthlyFee}
                      onChange={e => {
                        const val = e.target.value;
                        setMonthlyFee(val === '' ? 0 : parseFloat(val) || 0);
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Endirim (%):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={e => setDiscountPercent(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Ödəniş Qaydası:
                    </label>
                    <select
                      value={paymentPlan}
                      onChange={e => setPaymentPlan(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs"
                    >
                      <option value="ayliq">Hər ayın əvvəli (Aylıq)</option>
                      <option value="birdefelik">Tam öncədən (Birdəfəlik)</option>
                      <option value="hisseli">2 mərhələdə (Hissəli)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs font-semibold">
                  <span className="text-slate-600">
                    Müqavilənin Ümumi Dəyəri ({durationMonths} ay):
                  </span>
                  <span className="font-mono-nums text-indigo-700 font-bold text-sm">
                    {formatAZN(totalAmount)}
                    {discountAmount > 0 && (
                      <span className="text-[11px] text-emerald-600 font-normal ml-1">
                        (Endirim: -{formatAZN(discountAmount)})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xüsusi Qeydlər və Fərdi Şərtlər:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Məs: Şagird paralel olaraq Dron mühəndisliyinə də qatılır, 10% ailə endirimi tətbiq edildi..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Müqaviləni İmzala & Qeyd Et</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Contract */}
      {editingContract && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Müqavilə Redaktəsi (#{editingContract.contractNumber})
              </h3>
              <button
                type="button"
                onClick={() => setEditingContract(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateContractSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tələbə & Proqram:
                </label>
                <p className="text-xs text-slate-800 font-semibold p-2 bg-slate-50 rounded-lg">
                  {editingContract.studentName} · {editingContract.courseName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aylıq Haqq (AZN):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Məs: 85, 93, 260..."
                    value={editMonthlyFee === 0 ? '' : editMonthlyFee}
                    onChange={e => {
                      const val = e.target.value;
                      setEditMonthlyFee(val === '' ? 0 : parseFloat(val) || 0);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status:
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                  >
                    <option value="aktiv">Aktiv</option>
                    <option value="gozleyir">Gözləyir</option>
                    <option value="tamamlandi">Tamamlandı</option>
                    <option value="dondurulub">Dondurulub</option>
                    <option value="legv_edilib">Ləğv edilib</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Təyin Olunan Qrup:
                </label>
                <select
                  value={editGroupId}
                  onChange={e => setEditGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="">Fərdi / Təyin edilməyib</option>
                  {groups
                    .filter(g => !g.isDeleted)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.courseName}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeydlər:
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingContract(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Printable Contract Preview */}
      {previewContract && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header controls (no-print) */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rəsmi Müqavilə Sənədi (#{previewContract.contractNumber})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    A4 formatında çap etmək və ya arxivləşdirmək üçün hazırdır
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Çap Et (Print)</span>
                </button>
                <button
                  onClick={() => setPreviewContract(null)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Bağla
                </button>
              </div>
            </div>

            {/* Contract Body (Printable A4 Content) */}
            <div className="p-8 sm:p-12 overflow-y-auto space-y-6 text-slate-900 text-xs leading-relaxed font-serif select-text">
              {/* Official Header */}
              <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
                <h1 className="text-base font-extrabold tracking-wider uppercase font-sans">
                  AREA — AZƏRBAYCAN ROBOTOTEXNİKA VƏ MÜHƏNDİSLİK AKADEMİYASI
                </h1>
                <p className="text-[11px] text-slate-600 font-sans">
                  İnnovativ Mühəndislik, Robototexnika və İnformasiya Texnologiyaları Tədris Mərkəzi
                </p>
                <p className="text-[10px] text-slate-500 font-mono-nums font-sans">
                  {previewContract.branchName || 'Bakı Baş Filialı'} · VÖEN: 1402894561 · Tel: +994 12 567 10 20
                </p>
              </div>

              {/* Title & Metadata */}
              <div className="text-center space-y-1 pt-2">
                <h2 className="text-sm font-bold uppercase tracking-wide underline font-sans">
                  TƏDRİS XİDMƏTLƏRİNİN GÖSTƏRİLMƏSİ HAQQINDA MÜQAVİLƏ
                </h2>
                <div className="flex justify-between items-center text-[11px] font-mono-nums text-slate-700 pt-2 font-sans">
                  <span>Müqavilə №: <strong>{previewContract.contractNumber}</strong></span>
                  <span>Tarix: <strong>{formatDateAz(previewContract.signedDate || previewContract.startDate)}</strong></span>
                </div>
              </div>

              {/* 1. Tərəflər */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 uppercase font-sans text-[11px]">
                  1. Müqavilənin Tərəfləri
                </h4>
                <p className="text-justify">
                  Bir tərəfdən bundan sonra <strong>«İcraçı»</strong> adlandırılan «AREA Robototexnika və Mühəndislik Akademiyası», digər tərəfdən bundan sonra <strong>«Sifarişçi / Tələbə»</strong> adlandırılan <strong>{previewContract.studentName}</strong> (Tələbə ID: {previewContract.studentId}) aşağıdakı şərtlər daxilində bu müqaviləni bağladılar:
                </p>
              </div>

              {/* 2. Predmet */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase font-sans text-[11px]">
                  2. Müqavilənin Predmeti
                </h4>
                <p className="text-justify">
                  2.1. İcraçı Sifarişçiyə <strong>«{previewContract.courseName}»</strong> tədris proqramı üzrə nəzəri və praktiki dərslər təşkil etməyi, Sifarişçi isə müəyyən edilmiş tədris haqqını vaxtında ödəməyi və dərslərdə fəal iştirak etməyi öhdəsinə götürür.
                </p>
                <p className="text-justify">
                  2.2. Tədris qrupu: <strong>{previewContract.groupName || 'Fərdi Qrafik'}</strong>.
                </p>
                <p className="text-justify">
                  2.3. Tədrisin müddəti: <strong>{formatDateAz(previewContract.startDate)}</strong> tarixindən <strong>{formatDateAz(previewContract.endDate)}</strong> tarixinədək (Cəmi {previewContract.totalMonths || 6} ay).
                </p>
              </div>

              {/* 3. Ödəniş */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase font-sans text-[11px]">
                  3. Xidmət Haqqı və Ödəniş Qaydaları
                </h4>
                <p className="text-justify">
                  3.1. Bu müqavilə üzrə aylıq təhsil haqqı <strong>{formatAZN(previewContract.monthlyFee)}</strong> təşkil edir.
                </p>
                <p className="text-justify">
                  3.2. Müqavilənin ümumi dəyəri: <strong>{formatAZN(previewContract.totalAmount || previewContract.monthlyFee * 6)}</strong>{previewContract.discountPercent ? ` (${previewContract.discountPercent}% endirim daxil)` : ''}.
                </p>
                <p className="text-justify">
                  3.3. Ödənişlər hər təqvim ayının ilk 5 (beş) iş günü ərzində nağd və ya bank köçürməsi yolu ilə İcraçının hesabına ödənilir.
                </p>
              </div>

              {/* 4. Hüquq və Vəzifələr */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase font-sans text-[11px]">
                  4. Tərəflərin Hüquq və Vəzifələri
                </h4>
                <p className="text-justify">
                  4.1. İcraçı tədris prosesini təsdiq olunmuş sillabus və tələblərə uyğun yüksək səviyyəli mütəxəssislər tərəfindən aparmağa zəmanət verir.
                </p>
                <p className="text-justify">
                  4.2. Kursu müvəffəqiyyətlə başa vuran və davamiyyəti 80%-dən yuxarı olan tələbəyə rəsmi AREA QR-verifikasiyalı Sertifikatı təqdim edilir.
                </p>
                <p className="text-justify">
                  4.3. Sifarişçi tədris laboratoriyasında olan avadanlıq və robototexnika ləvazimatları ilə ehtiyatla davranmalı və daxili nizam-intizam qaydalarına riayət etməlidir.
                </p>
              </div>

              {/* 5. Rekvizitlər və İmzalar */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 font-sans">
                <div className="space-y-4">
                  <div className="font-bold text-slate-900 text-[11px] uppercase">
                    İCRAÇI:
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-1">
                    <p className="font-bold">«AREA Mühəndislik Akademiyası»</p>
                    <p>Filial: {previewContract.branchName || 'Bakı Baş Filialı'}</p>
                    <p>Məsul Şəxs: Direktorluq</p>
                  </div>
                  <div className="pt-6">
                    <div className="w-44 border-b border-slate-800 text-[10px] text-slate-500 pb-1">
                      İmza: ____________________ (M.Y.)
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-bold text-slate-900 text-[11px] uppercase">
                    SİFARİŞÇİ / TƏLƏBƏ:
                  </div>
                  <div className="text-[11px] text-slate-700 space-y-1">
                    <p className="font-bold">{previewContract.studentName}</p>
                    <p>Tələbə ID: {previewContract.studentId}</p>
                    <p>Proqram: {previewContract.courseName}</p>
                  </div>
                  <div className="pt-6">
                    <div className="w-44 border-b border-slate-800 text-[10px] text-slate-500 pb-1">
                      İmza: ____________________
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Əlaqəli Borc Qeydləri və Müqavilə Silinməsi Təsdiq Modalı */}
      {debtModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    debtModalContract.isHardDelete ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {debtModalContract.isHardDelete
                      ? 'Müqavilənin Birdəfəlik Silinməsi (Hard Delete)'
                      : 'Müqavilənin Arxivlənməsi (Soft Delete)'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bu müqavilə ilə bağlı ödənilməmiş borc qeydləri aşkar edilmişdir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDebtModalContract(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Info Summary */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Müqavilə №:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {debtModalContract.contract.contractNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tələbə:</span>
                <span className="font-semibold text-slate-800">
                  {debtModalContract.contract.studentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tədris Proqramı:</span>
                <span className="font-semibold text-slate-800">
                  {debtModalContract.contract.courseName}
                </span>
              </div>
            </div>

            {/* Debts Warning Card */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 mb-5 text-xs text-amber-900 space-y-2.5">
              <div className="flex items-center gap-2 font-semibold text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {debtModalContract.unpaidDebts.length} ədəd ödənilməmiş borc qeydi (Cəmi:{' '}
                  {formatAZN(
                    debtModalContract.unpaidDebts.reduce(
                      (sum, d) => sum + (d.remainingAmount ?? d.amount),
                      0
                    )
                  )}
                  )
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                {debtModalContract.unpaidDebts.map(d => (
                  <div
                    key={d.id}
                    className="flex justify-between items-center bg-white/90 px-3 py-1.5 rounded-lg border border-amber-100 text-[11px]"
                  >
                    <span className="text-slate-700 font-medium">
                      {d.month || d.dueDate || 'Aylıq ödəniş'}
                    </span>
                    <span className="font-bold text-amber-800 font-mono-nums">
                      {formatAZN(d.remainingAmount ?? d.amount)}
                      <span className="font-normal text-slate-400 ml-1">
                        ({d.status === 'qismen_odenilib' ? 'Qismən' : 'Ödənilməyib'})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-amber-800/80 pt-1">
                Müqavilə silindikdə onunla bağlı borc qeydləri necə tənzimlənsin?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (debtModalContract.isHardDelete) {
                    hardDeleteContract(debtModalContract.contract.id, {
                      deleteAssociatedDebts: true,
                    });
                  } else {
                    softDeleteContract(debtModalContract.contract.id, {
                      deleteAssociatedDebts: true,
                    });
                  }
                  setDebtModalContract(null);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  debtModalContract.isHardDelete
                    ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500'
                    : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {debtModalContract.isHardDelete
                    ? 'Müqavilə və Bütün Əlaqəli Borcları Sil (Tövsiyə olunur)'
                    : 'Müqaviləni Arxivlə və Əlaqəli Borcları Ləğv Et'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (debtModalContract.isHardDelete) {
                    hardDeleteContract(debtModalContract.contract.id, {
                      deleteAssociatedDebts: false,
                    });
                  } else {
                    softDeleteContract(debtModalContract.contract.id, {
                      deleteAssociatedDebts: false,
                    });
                  }
                  setDebtModalContract(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer text-center"
              >
                Yalnız Müqaviləni {debtModalContract.isHardDelete ? 'Sil' : 'Arxivlə'} (Borcları Tələbədə Saxla)
              </button>

              <button
                type="button"
                onClick={() => setDebtModalContract(null)}
                className="w-full py-2 px-4 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors cursor-pointer text-center"
              >
                İmtina
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
