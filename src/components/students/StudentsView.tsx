import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Filter,
  DollarSign,
  GraduationCap,
  Calendar,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Download,
  AlertCircle,
  MessageSquare,
  Eye,
  Trash2,
  Edit2,
  Archive,
  RotateCcw,
  FileSignature,
  Layers,
  Sparkles,
  Clock,
  Printer,
  Wallet,
  CreditCard,
  Check,
  Send,
  ExternalLink,
  Copy,
  Building2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Student, StudentContract, StudentDebtRecord, PaymentTransaction } from '../../types/crm';
import { formatAZN, formatDateAz, exportToCSV } from '../../utils/formatters';

interface StudentsViewProps {
  onOpenQuickPayment?: (studentId: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onOpenQuickPayment }) => {
  const {
    students,
    groups,
    contracts,
    curriculums,
    branches,
    staff,
    users,
    selectedBranchId,
    setSelectedBranchId,
    currentUser,
    currentRole,
    addStudent,
    updateStudent,
    deleteStudent,
    softDeleteStudent,
    hardDeleteStudent,
    restoreStudent,
    setActiveTab,
    confirmAction,
    addContract,
    recordPayment,
    showToast,
    can,
    studentDebts,
  } = useCrm();

  const isManager = currentUser?.role === 'menecer' || currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  const getAutoBranchId = useCallback(() => {
    if (managerBranchId) return managerBranchId;
    if (selectedBranchId && selectedBranchId !== 'all') {
      const match = branches.find(b => b.id === selectedBranchId && !b.isDeleted);
      if (match) return match.id;
    }
    const firstActiveBranch = branches.find(b => !b.isDeleted);
    return firstActiveBranch?.id || '';
  }, [managerBranchId, selectedBranchId, branches]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktiv' | 'debt' | 'mezun' | 'dondurulub' | 'archived'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // New Student form
  const [newFullName, setNewFullName] = useState('');
  const [newFinCode, setNewFinCode] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newBranchId, setNewBranchId] = useState<string>(() => getAutoBranchId());
  const [newGroupId, setNewGroupId] = useState<string>('');
  const [newMonthlyFee, setNewMonthlyFee] = useState(260);
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newLessonsPerMonth, setNewLessonsPerMonth] = useState<4 | 8>(8);

  // Auto-sync branch and group when selected branch changes in header
  useEffect(() => {
    if (!showAddModal) {
      const autoBranch = getAutoBranchId();
      if (autoBranch) {
        setNewBranchId(autoBranch);
        const bGroups = groups.filter(g => g.branchId === autoBranch);
        if (bGroups.length > 0) {
          setNewGroupId(bGroups[0].id);
        } else {
          setNewGroupId('grp-unassigned');
        }
      }
    }
  }, [selectedBranchId, showAddModal, getAutoBranchId, groups]);

  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    phone?: string;
    finCode?: string;
    monthlyFee?: string;
  }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleOpenAddModal = () => {
    setFormErrors({});
    setFormSubmitted(false);
    const autoBranch = getAutoBranchId();
    setNewBranchId(autoBranch);
    const bGroups = groups.filter(g => g.branchId === autoBranch);
    if (bGroups.length > 0) {
      setNewGroupId(bGroups[0].id);
    } else {
      setNewGroupId('grp-unassigned');
    }
    setShowAddModal(true);
  };

  // States for in-modal new program registration when existing student is matched (Multi-program enrollment)
  const [dupCurriculumId, setDupCurriculumId] = useState<string>(curriculums[0]?.id || '');
  const [dupGroupId, setDupGroupId] = useState<string>('');
  const [dupMonthlyFee, setDupMonthlyFee] = useState<number>(260);
  const [dupLessonsPerMonth, setDupLessonsPerMonth] = useState<4 | 8>(8);
  const [dupDurationMonths, setDupDurationMonths] = useState<number>(6);
  const [dupStartDate, setDupStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dupNotes, setDupNotes] = useState<string>('');

  // Edit Student form
  const [editFullName, setEditFullName] = useState('');
  const [editFinCode, setEditFinCode] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroupId, setEditGroupId] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState(260);
  const [editStatus, setEditStatus] = useState<'aktiv' | 'mezun' | 'dondurulub' | 'xaric' | 'silinib'>('aktiv');
  const [editNotes, setEditNotes] = useState('');

  // Tab inside Student Details Drawer: info, contracts, or debts
  const [detailTab, setDetailTab] = useState<'info' | 'contracts' | 'debts'>('info');

  // Quick Direct Payment Modal from Student Profile & Table
  const [paymentTargetStudent, setPaymentTargetStudent] = useState<Student | null>(null);
  const [paymentSelectedContractId, setPaymentSelectedContractId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Nagd' | 'Bank karti' | 'eManat/MilliOn' | 'Hesaba kocurme'>('Nagd');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [lastPaymentSuccess, setLastPaymentSuccess] = useState<PaymentTransaction | null>(null);

  // Quick Add Contract for Student
  const [studentForContract, setStudentForContract] = useState<Student | null>(null);
  const [contractCurriculumId, setContractCurriculumId] = useState<string>(curriculums[0]?.id || '');
  const [contractGroupId, setContractGroupId] = useState<string>('');
  const [contractMonthlyFee, setContractMonthlyFee] = useState<number>(260);
  const [contractLessonsPerMonth, setContractLessonsPerMonth] = useState<4 | 8>(8);
  const [contractDurationMonths, setContractDurationMonths] = useState<number>(6);
  const [contractStartDate, setContractStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [contractNotes, setContractNotes] = useState<string>('');

  // Uniqueness checks (FIN code and Full Name)
  const duplicateFinStudent = newFinCode.trim()
    ? students.find(
        s => !s.isDeleted && s.finCode && s.finCode.trim().toUpperCase() === newFinCode.trim().toUpperCase()
      )
    : null;

  const duplicateExistingStudent = newFullName.trim()
    ? students.find(
        s => !s.isDeleted && s.fullName.trim().toLowerCase() === newFullName.trim().toLowerCase()
      )
    : null;

  const duplicatePhoneStudent = newPhone.trim() && newPhone.replace(/\D/g, '').length >= 7
    ? students.find(
        s => !s.isDeleted && s.phone.replace(/\D/g, '') === newPhone.replace(/\D/g, '')
      )
    : null;

  const editDuplicateStudent = editingStudent && editFullName.trim()
    ? students.find(
        s => s.id !== editingStudent.id && !s.isDeleted && s.fullName.trim().toLowerCase() === editFullName.trim().toLowerCase()
      )
    : null;

  const editDuplicateFinStudent = editingStudent && editFinCode.trim()
    ? students.find(
        s => s.id !== editingStudent.id && !s.isDeleted && s.finCode && s.finCode.trim().toUpperCase() === editFinCode.trim().toUpperCase()
      )
    : null;

  const handleOpenAddContractForStudent = (student: Student) => {
    setStudentForContract(student);
    setContractCurriculumId(curriculums[0]?.id || '');
    setContractGroupId('');
    setContractMonthlyFee(student.monthlyFee || 260);
    setContractDurationMonths(6);
    setContractStartDate(new Date().toISOString().split('T')[0]);
    setContractNotes('');
  };

  const handleSaveStudentContractSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForContract) return;

    const grp = groups.find(g => g.id === contractGroupId);

    const targetCourseName = grp?.courseName || studentForContract.courseName || 'Fərdi Dərs';
    const targetCurriculumId = grp?.courseId || curriculums.find(c => c.courseName === targetCourseName)?.id || '';
    const contractNum = `AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const calcEnd = new Date(contractStartDate);
    calcEnd.setMonth(calcEnd.getMonth() + contractDurationMonths);

    addContract({
      contractNumber: contractNum,
      studentId: studentForContract.id,
      studentName: studentForContract.fullName,
      curriculumId: targetCurriculumId,
      courseName: targetCourseName,
      branchId: studentForContract.branchId || grp?.branchId,
      branchName: studentForContract.branchName || grp?.branchName,
      groupId: grp?.id,
      groupName: grp?.name || 'Fərdi / Qrup təyin edilməyib',
      startDate: contractStartDate,
      endDate: calcEnd.toISOString().split('T')[0],
      monthlyFee: contractMonthlyFee,
      lessonsPerMonth: contractLessonsPerMonth,
      scheduleTime: grp?.schedule || `Ayda ${contractLessonsPerMonth} dərs`,
      parentPhone: studentForContract.parentPhone || studentForContract.phone,
      totalMonths: contractDurationMonths,
      totalAmount: contractMonthlyFee * contractDurationMonths,
      paymentPlan: 'ayliq',
      status: 'aktiv',
      signedDate: new Date().toISOString().split('T')[0],
      notes: contractNotes.trim() || 'Tələbə üçün yeni proqram qeydiyyatı.',
    });

    setStudentForContract(null);
  };

  const handleEnrollExistingStudentDirectly = (e: React.FormEvent, existingStu: Student) => {
    e.preventDefault();
    const curr = curriculums.find(c => c.id === dupCurriculumId);
    const grp = groups.find(g => g.id === dupGroupId);
    const targetCourseName = curr?.courseName || grp?.courseName || 'Yeni Proqram';
    const contractNum = `AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const calcEnd = new Date(dupStartDate);
    calcEnd.setMonth(calcEnd.getMonth() + dupDurationMonths);

    addContract({
      contractNumber: contractNum,
      studentId: existingStu.id,
      studentName: existingStu.fullName,
      curriculumId: dupCurriculumId,
      courseName: targetCourseName,
      branchId: existingStu.branchId || grp?.branchId,
      branchName: existingStu.branchName || grp?.branchName,
      groupId: grp?.id,
      groupName: grp?.name || 'Qrup təyin edilməyib',
      startDate: dupStartDate,
      endDate: calcEnd.toISOString().split('T')[0],
      monthlyFee: dupMonthlyFee,
      lessonsPerMonth: dupLessonsPerMonth,
      scheduleTime: grp?.schedule || `Ayda ${dupLessonsPerMonth} dərs`,
      parentPhone: existingStu.parentPhone || existingStu.phone,
      totalMonths: dupDurationMonths,
      totalAmount: dupMonthlyFee * dupDurationMonths,
      paymentPlan: 'ayliq',
      status: 'aktiv',
      signedDate: new Date().toISOString().split('T')[0],
      notes: dupNotes.trim() || 'Mövcud tələbə üçün yeni fərqli proqram qeydiyyatı.',
    });

    setShowAddModal(false);
    setNewFullName('');
    setNewFinCode('');
    setNewPhone('');
    setNewParentPhone('');
    setNewEmail('');
    setNewNotes('');
    setDupNotes('');
  };

  const handleOpenQuickPaymentForStudent = (student: Student, debt?: StudentDebtRecord) => {
    setPaymentTargetStudent(student);
    const stuContracts = contracts.filter(c => c.studentId === student.id && c.status === 'aktiv');
    const targetContract = debt
      ? stuContracts.find(c => c.id === debt.contractId) || contracts.find(c => c.id === debt.contractId)
      : stuContracts[0];
    setPaymentSelectedContractId(targetContract?.id || '');

    let defAmount = 0;
    if (debt && debt.remainingAmount > 0) {
      defAmount = debt.remainingAmount;
    } else if (student.balance < 0) {
      defAmount = Math.abs(student.balance);
    } else if (student.currentMonthDebt && student.currentMonthDebt > 0) {
      defAmount = student.currentMonthDebt;
    } else {
      defAmount = targetContract?.monthlyFee || student.monthlyFee || 100;
    }
    setPaymentAmount(defAmount);
    setPaymentMethod('Nagd');
    setPaymentNotes('');
    setLastPaymentSuccess(null);
  };

  const handleConfirmDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetStudent || paymentAmount <= 0) return;

    const matchedContract = contracts.find(c => c.id === paymentSelectedContractId);
    const targetGroupId = matchedContract?.groupId || paymentTargetStudent.groupId;
    const targetGroupName = matchedContract?.groupName || paymentTargetStudent.groupName;
    const targetGroup = groups.find(g => g.id === targetGroupId);

    const tx = recordPayment({
      studentId: paymentTargetStudent.id,
      studentName: paymentTargetStudent.fullName,
      groupId: targetGroupId,
      groupName: targetGroupName,
      amount: paymentAmount,
      type: 'telim_haqqi',
      method: paymentMethod,
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Mərkəz Administratoru',
      contractId: matchedContract?.id,
      note: paymentNotes.trim() || `«${matchedContract?.courseName || paymentTargetStudent.courseName || 'Tədris Proqramı'}» üzrə təhsil haqqı ödənişi.`,
      parentPhone: paymentTargetStudent.parentPhone || paymentTargetStudent.phone,
      trainerName: targetGroup?.trainerName,
    });

    setLastPaymentSuccess(tx);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditFinCode(student.finCode || '');
    setEditPhone(student.phone);
    setEditParentPhone(student.parentPhone || '');
    setEditEmail(student.email);
    setEditGroupId(student.groupId);
    setEditMonthlyFee(student.monthlyFee);
    setEditStatus(student.status);
    setEditNotes(student.notes || '');
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editFullName.trim()) return;

    if (editDuplicateFinStudent) {
      showToast(
        `Xəta: «${editFinCode.trim()}» FİN kodlu başqa tələbə (${editDuplicateFinStudent.fullName}) artıq mövcuddur!`,
        'error'
      );
      return;
    }

    if (editDuplicateStudent) {
      showToast(
        `Xəta: «${editFullName.trim()}» adlı başqa tələbə artıq mövcuddur! Tələbə adları unikal olmalıdır.`,
        'error'
      );
      return;
    }

    const chosenGroup = editGroupId && editGroupId !== 'grp-unassigned'
      ? groups.find(g => g.id === editGroupId)
      : null;

    const newBranchIdForStudent = chosenGroup?.branchId || editingStudent.branchId;
    const newBranchNameForStudent = chosenGroup?.branchName || editingStudent.branchName || (newBranchIdForStudent ? branches.find(b => b.id === newBranchIdForStudent)?.name : undefined);

    updateStudent(editingStudent.id, {
      fullName: editFullName.trim(),
      finCode: editFinCode.trim().toUpperCase() || undefined,
      phone: editPhone,
      parentPhone: editParentPhone || undefined,
      email: editEmail,
      groupId: chosenGroup?.id || 'grp-unassigned',
      groupName: chosenGroup?.name || 'Təyin edilməyib',
      courseName: chosenGroup?.courseName || editingStudent.courseName || 'Ümumi Kurs',
      branchId: newBranchIdForStudent,
      branchName: newBranchNameForStudent,
      status: editStatus,
      monthlyFee: editMonthlyFee,
      notes: editNotes,
    });

    setEditingStudent(null);
  };

  const filteredStudents = useMemo(() => {
    return students
      .filter(student => {
        const matchesSearch =
          student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (student.finCode && student.finCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
          student.phone.includes(searchQuery) ||
          student.courseName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesGroup = selectedGroupId === 'all' || student.groupId === selectedGroupId;

        let matchesStatus = true;
        if (statusFilter === 'archived') {
          matchesStatus = !!student.isDeleted;
        } else {
          if (student.isDeleted) return false;
          if (statusFilter === 'aktiv') matchesStatus = student.status === 'aktiv';
          else if (statusFilter === 'mezun') matchesStatus = student.status === 'mezun';
          else if (statusFilter === 'dondurulub') matchesStatus = student.status === 'dondurulub';
          else if (statusFilter === 'debt') matchesStatus = student.balance < 0;
        }

        return matchesSearch && matchesGroup && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = a.createdAt || (a.enrollmentDate ? `${a.enrollmentDate}T00:00:00.000Z` : '') || a.id;
        const timeB = b.createdAt || (b.enrollmentDate ? `${b.enrollmentDate}T00:00:00.000Z` : '') || b.id;
        return timeB.localeCompare(timeA);
      });
  }, [students, searchQuery, selectedGroupId, statusFilter]);

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    const errors: { fullName?: string; phone?: string; finCode?: string } = {};

    const cleanName = newFullName.trim();
    if (!cleanName) {
      errors.fullName = 'Zəhmət olmasa tələbənin ad və soyadını daxil edin.';
    } else if (cleanName.length < 3) {
      errors.fullName = 'Tələbənin adı və soyadı ən azı 3 hərfdən ibarət olmalıdır.';
    }

    const cleanPhoneDigits = newPhone.replace(/\D/g, '');
    if (!newPhone.trim()) {
      errors.phone = 'Zəhmət olmasa tələbənin və ya valideynin əlaqə nömrəsini daxil edin.';
    } else if (cleanPhoneDigits.length < 7) {
      errors.phone = 'Əlaqə nömrəsi ən azı 7 rəqəmdən ibarət olmalıdır (məs: 050 123 45 67).';
    }

    const cleanFin = newFinCode.trim().toUpperCase();
    if (cleanFin && cleanFin.length !== 7) {
      errors.finCode = 'FİN kod standart 7 simvol olmalıdır (məsələn: 7AB12CD). Məlum deyilsə boş saxlaya bilərsiniz.';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      showToast('Zəhmət olmasa formadakı boş və ya xətalı xanaları düzəldin', 'error');
      return;
    }

    const dup = duplicateExistingStudent || duplicateFinStudent;
    if (dup) {
      showToast(
        `«${dup.fullName}» adlı tələbə artıq qeydiyyatdadır! Eyni tələbəni 2-ci dəfə daxil etmək olmaz. Yeni proqram üçün həmin tələbəyə müqavilə bağlayın.`,
        'error'
      );
      return;
    }

    const targetBranchId =
      (isManager && managerBranchId) ? managerBranchId :
      (newBranchId ? newBranchId :
      (selectedBranchId !== 'all' ? selectedBranchId :
      (branches.find(b => !b.isDeleted)?.id || 'branch-nerimanov')));

    const targetBranch = branches.find(b => b.id === targetBranchId) || branches.find(b => !b.isDeleted) || branches[0];

    const created = addStudent({
      fullName: cleanName,
      finCode: cleanFin || '',
      phone: newPhone.trim(),
      email: newEmail.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      age: newAge.trim() || undefined,
      groupId: 'grp-unassigned',
      groupName: 'Təyin edilməyib',
      courseName: 'Müqavilə gözləyir',
      branchId: targetBranch?.id || targetBranchId,
      branchName: targetBranch?.name || 'AREA Nərimanov Filialı',
      status: 'aktiv',
      balance: 0,
      monthlyFee: 0,
      enrollmentDate: new Date().toISOString().split('T')[0],
      notes: '',
    });

    setShowAddModal(false);
    setFormErrors({});
    setFormSubmitted(false);
    setNewFullName('');
    setNewFinCode('');
    setNewPhone('');
    setNewEmail('');
    setNewAge('');

    // Real-time automatic list update: clear all filters so new student is immediately visible!
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedGroupId('all');

    if (created?.id) {
      setHighlightedStudentId(created.id);
      setTimeout(() => setHighlightedStudentId(null), 5000);
    }

    // If director added student to a specific branch not currently active in top bar, switch to that branch
    if (selectedBranchId !== 'all' && targetBranchId && selectedBranchId !== targetBranchId) {
      setSelectedBranchId(targetBranchId);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Tələbələr
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono-nums">
              {students.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Reyestr, qrup bölgüsü və fərdi tədris profilləri.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() =>
              exportToCSV(
                'AREA_Telebeler',
                students.map(s => ({
                  AdSoyad: s.fullName,
                  Telefon: s.phone,
                  Email: s.email,
                  Qrup: s.groupName,
                  Ixtisas: s.courseName,
                  Status: s.status,
                  Balans: s.balance,
                  AyliqHaqq: s.monthlyFee,
                  Davamiyyet: `${s.attendanceRate}%`,
                }))
              )
            }
            title="CSV faylı ixrac et"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {can('create', 'students') && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tələbə</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Search */}
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Axtarış (ad, telefon, kurs)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Group Selector */}
        <div className="md:col-span-3">
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">Bütün Qruplar ({groups.length})</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status segmented buttons */}
        <div className="md:col-span-5 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Hamısı ({students.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('aktiv')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'aktiv'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aktiv ({students.filter(s => s.status === 'aktiv').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('debt')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'debt'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Borc ({students.filter(s => s.balance < 0).length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('mezun')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'mezun'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Məzun ({students.filter(s => s.status === 'mezun').length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === 'archived'
                ? 'bg-rose-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Arxiv ({students.filter(s => s.isDeleted).length})</span>
          </button>
        </div>
      </div>

      {/* Students Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Tələbə
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Əlaqə
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    Qrup
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                    Balans
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Davamiyyət
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    Status
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="text-slate-400">Əməliyyat</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr
                  key={student.id}
                  className={
                    highlightedStudentId === student.id
                      ? 'bg-emerald-50/90 transition-all duration-700 ring-2 ring-emerald-400'
                      : 'hover:bg-slate-50/70 transition-colors'
                  }
                >
                  {/* Name & Enrollment */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedStudentForDetail(student)}
                      className="text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {student.fullName}
                        </p>
                        {highlightedStudentId === student.id && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            Yeni əlavə edildi
                          </span>
                        )}
                        {student.finCode && (
                          <span
                            title="Şəxsiyyət vəsiqəsi FİN kodu"
                            className="font-mono text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded"
                          >
                            FİN: {student.finCode}
                          </span>
                        )}
                        {contracts.filter(c => c.studentId === student.id).length > 1 && (
                          <span
                            title="Bu tələbə 2 və daha çox tədris proqramına qeydiyyatdan keçib"
                            className="px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200"
                          >
                            {contracts.filter(c => c.studentId === student.id).length} Proqram
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono-nums mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-400" />
                          <span>{formatDateAz(student.enrollmentDate)}</span>
                        </span>
                        {student.branchName && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans font-medium text-[10px]">
                            <Building2 className="w-2.5 h-2.5 text-slate-400" />
                            {student.branchName.replace('AREA ', '').replace(' Filialı', '')}
                          </span>
                        )}
                      </div>
                    </button>
                  </td>

                  {/* Contact */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono-nums text-slate-700">
                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{student.email}</span>
                    </div>
                  </td>

                  {/* Group & Course (Multi-program support) */}
                  <td className="py-3 px-4">
                    {(() => {
                      const activeCtrs = contracts.filter(c => c.studentId === student.id && c.status === 'aktiv');
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">{student.groupName}</span>
                            <span className="text-[11px] text-slate-500">· {student.courseName}</span>
                          </div>
                          {activeCtrs.length > 1 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {activeCtrs.map(c => (
                                <span
                                  key={c.id}
                                  title={`Müqavilə: ${c.contractNumber} (${c.groupName || 'Qrup'}) · ${c.monthlyFee} ₼/ay`}
                                  className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                  ✓ {c.courseName}
                                </span>
                              ))}
                            </div>
                          )}
                          {can('create', 'contracts') && !student.isDeleted && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddContractForStudent(student);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline mt-0.5 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>+ Yeni Proqrama Yaz</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Balance */}
                  <td className="py-3 px-4">
                    {student.balance < 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono-nums font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                        <AlertCircle className="w-3 h-3 text-amber-500" />
                        {formatAZN(student.balance)}
                      </span>
                    ) : student.balance > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono-nums font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        +{formatAZN(student.balance)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                        0 ₼
                      </span>
                    )}
                  </td>

                  {/* Attendance */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-nums font-semibold text-slate-800">
                        {student.attendanceRate}%
                      </span>
                      <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            student.attendanceRate >= 90
                              ? 'bg-emerald-600'
                              : student.attendanceRate >= 75
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${student.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {student.status === 'aktiv' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Aktiv
                      </span>
                    )}
                    {student.status === 'mezun' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <GraduationCap className="w-3 h-3 text-indigo-500" />
                        Məzun
                      </span>
                    )}
                    {student.status === 'dondurulub' && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Dondurulub
                      </span>
                    )}
                    {student.status === 'xaric' && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                        Xaric
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {student.isDeleted ? (
                        <>
                          {can('delete', 'students') && (
                            <>
                              <button
                                onClick={() => restoreStudent(student.id)}
                                title="Tələbəni bərpa et"
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Tələbəni Birdəfəlik Sil',
                                    message: `"${student.fullName}" tələbəsini arxivdən birdəfəlik və fiziki olaraq silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır!`,
                                    confirmText: 'Bəli, Birdəfəlik Sil',
                                    danger: true,
                                    onConfirm: () => hardDeleteStudent(student.id),
                                  });
                                }}
                                title="Birdəfəlik fiziki sil (Hard Delete)"
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedStudentForDetail(student)}
                            title="Profilə bax"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {can('create', 'contracts') && (
                            <button
                              onClick={() => handleOpenAddContractForStudent(student)}
                              title="Bu tələbə üçün yeni proqram / müqavilə bağla"
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileSignature className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {can('edit', 'students') && (
                            <button
                              onClick={() => handleOpenEdit(student)}
                              title="Tələbəni redaktə et"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {can('delete', 'students') && (
                            <>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Tələbəni Arxivə Göndər',
                                    message: `"${student.fullName}" tələbəsini aktiv siyahıdan çıxarıb arxivə göndərmək istəyirsiniz? Tələbəni istənilən vaxt bərpa edə bilərsiniz.`,
                                    confirmText: 'Arxivə Göndər',
                                    danger: false,
                                    onConfirm: () => softDeleteStudent(student.id),
                                  });
                                }}
                                title="Arxivə göndər (Soft Delete)"
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Tələbəni Birdəfəlik Sil',
                                    message: `"${student.fullName}" tələbəsini bazadan birdəfəlik və fiziki olaraq silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır!`,
                                    confirmText: 'Bəli, Birdəfəlik Sil',
                                    danger: true,
                                    onConfirm: () => hardDeleteStudent(student.id),
                                  });
                                }}
                                title="Birdəfəlik sil (Hard Delete)"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              if (onOpenQuickPayment) onOpenQuickPayment(student.id);
                              else setActiveTab('finance');
                            }}
                            title="Ödəniş qəbul et"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`https://wa.me/${student.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp ilə əlaqə"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredStudents.length && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">
                  {students.length === 0
                    ? 'Bazada Hələ Tələbə Qeydiyyatı Yoxdur'
                    : 'Axtarışa Uyğun Tələbə Tapılmadı'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {students.length === 0
                    ? 'Sistem real məlumatlar rejiminə keçirilib və mock qeydlər təmizlənib. Yuxarıdakı "Yeni Tələbə" düyməsinə klikləyərək ilk tələbənizi qeydiyyatdan keçirə bilərsiniz.'
                    : 'Axtarış sözünü dəyişərək və ya filtrləri sıfırlayaraq yenidən yoxlayın.'}
                </p>
              </div>
              {students.length === 0 && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>İlk Tələbəni Əlavə Et</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add Student & Multi-program Registration */}
      {showAddModal && (() => {
        const dup = duplicateFinStudent || duplicateExistingStudent;
        const dupActiveContracts = dup
          ? contracts.filter(c => c.studentId === dup.id && c.status === 'aktiv')
          : [];
        const selectedCurriculum = curriculums.find(c => c.id === dupCurriculumId) || curriculums[0];
        const selectedGroup = groups.find(g => g.id === dupGroupId);
        const targetCourseName = selectedCurriculum?.courseName || selectedGroup?.courseName || 'Yeni Proqram';
        const alreadyInThisProgram = dupActiveContracts.some(
          c => c.curriculumId === dupCurriculumId || c.courseName === targetCourseName
        );

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>
                      {dup
                        ? 'Mövcud Tələbə: Fərqli Proqrama Qeydiyyat Rejimi'
                        : 'Yeni Tələbə Qeydiyyatı'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dup
                      ? 'Bir tələbə unikal 1 dəfə qeyd edilir, lakin istənilən sayda fərqli proqrama yazıla bilər.'
                      : 'Tələbə bazasına unikal profil əlavə edilməsi və ilkin müqavilə formalaşdırılması.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Informative Validation Alert Banner */}
              {formSubmitted && Object.keys(formErrors).length > 0 && !dup && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Formada tələb olunan xanalar boş və ya natamamdır:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                      {formErrors.fullName && <li>{formErrors.fullName}</li>}
                      {formErrors.phone && <li>{formErrors.phone}</li>}
                      {formErrors.finCode && <li>{formErrors.finCode}</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* Top Row: Full Name & FIN Code Inputs (Always visible to detect duplicates in real-time) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Ad və Soyad: *</span>
                    <span className="text-[10px] text-rose-500 font-normal">Məcburi</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="məs: Leyla Əliyeva"
                    value={newFullName}
                    onChange={e => {
                      setNewFullName(e.target.value);
                      if (formErrors.fullName) {
                        setFormErrors(prev => ({ ...prev, fullName: undefined }));
                      }
                    }}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 ${
                      formSubmitted && formErrors.fullName
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500 text-rose-900 ring-1 ring-rose-300'
                        : duplicateExistingStudent
                        ? 'border-amber-400 bg-amber-50/50 focus:ring-amber-500'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  {formSubmitted && formErrors.fullName && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.fullName}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>FİN Kod / ŞV Nömrəsi:</span>
                    <span className="text-[10px] text-slate-400 font-normal">7 simvol (istəyə görə)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="məs: 7A1B2C3 və ya AZE..."
                    maxLength={10}
                    value={newFinCode}
                    onChange={e => {
                      setNewFinCode(e.target.value.toUpperCase());
                      if (formErrors.finCode) {
                        setFormErrors(prev => ({ ...prev, finCode: undefined }));
                      }
                    }}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 ${
                      formSubmitted && formErrors.finCode
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500 text-rose-900 ring-1 ring-rose-300'
                        : duplicateFinStudent
                        ? 'border-amber-400 bg-amber-50/50 focus:ring-amber-500'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                  {formSubmitted && formErrors.finCode && (
                    <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{formErrors.finCode}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* BRANCH 1: DUPLICATE STUDENT DETECTED -> MULTI-PROGRAM ENROLLMENT MODE */}
              {dup ? (
                <div className="space-y-4 pt-1">
                  {/* Uniqueness restriction warning banner */}
                  <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-amber-900">
                          Unikal Tələbə Məhdudiyyəti Aktivdir (Təkrar Profil Yaranmayacaq)
                        </h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          «<strong>{dup.fullName}</strong>» {dup.finCode ? `(FİN: ${dup.finCode})` : ''} artıq bazada mövcuddur. Tələbə adı və FİN kodu ancaq 1 dəfə daxil edilə bilər.
                        </p>
                        <p className="text-[11px] text-amber-950 font-semibold">
                          💡 Eyni tələbə 5–6 fərqli proqrama (Robototexnika, Dron, Python, Veb və s.) gələ bilər. Aşağıdan yeni proqramı seçib müqavilə bağlayın:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student current status card & active programs */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-800">
                        {dup.fullName} · {dup.phone}
                      </div>
                      <span className={`font-mono-nums font-bold ${dup.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        Balans: {dup.balance} AZN
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        Hazırkı Aktiv Proqramları ({dupActiveContracts.length}):
                      </span>
                      {dupActiveContracts.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {dupActiveContracts.map(c => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px] font-medium"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{c.courseName}</span>
                              <span className="text-[10px] text-slate-400">({c.monthlyFee} ₼)</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Aktiv müqavilə tapılmadı.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct New Program Enrollment Form */}
                  <form onSubmit={e => handleEnrollExistingStudentDirectly(e, dup)} className="space-y-3">
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-indigo-950 flex items-center justify-between">
                        <span>Yeni Proqrama Qeydiyyat Şərtləri:</span>
                        <span className="text-[10px] text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                          Çoxproqramlı Sistem
                        </span>
                      </div>

                      {/* Select Curriculum */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          1. Yeni Tədris Proqramı (Kurikulum):
                        </label>
                        <select
                          value={dupCurriculumId}
                          onChange={e => setDupCurriculumId(e.target.value)}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {curriculums.map(c => {
                            const isEnrolled = dupActiveContracts.some(
                              ac => ac.curriculumId === c.id || ac.courseName === c.courseName
                            );
                            return (
                              <option key={c.id} value={c.id}>
                                {c.courseName} {isEnrolled ? '(⚠️ Artıq aktivdir)' : '(+ Yeni proqram)'}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Select Group */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          2. Təyin Olunacaq Qrup:
                        </label>
                        <select
                          value={dupGroupId}
                          onChange={e => setDupGroupId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                        >
                          <option value="">Fərdi / Qrup hələ təyin edilməyib</option>
                          {groups.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name} ({g.courseName}) · {g.currentStudents}/{g.capacity} nəfər
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Monthly Fee & Lessons Per Month */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Aylıq Haqq (AZN):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            placeholder="Məs: 85, 93, 260..."
                            value={dupMonthlyFee === 0 ? '' : dupMonthlyFee}
                            onChange={e => {
                              const val = e.target.value;
                              setDupMonthlyFee(val === '' ? 0 : parseFloat(val) || 0);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Müddət:
                          </label>
                          <select
                            value={dupDurationMonths}
                            onChange={e => setDupDurationMonths(Number(e.target.value))}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                          >
                            <option value={3}>3 Ay</option>
                            <option value={4}>4 Ay</option>
                            <option value={6}>6 Ay (Yarımillik)</option>
                            <option value={9}>9 Ay</option>
                            <option value={12}>12 Ay (İllik)</option>
                          </select>
                        </div>
                      </div>

                      {/* Lessons Frequency: 4 vs 8 lessons */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Aylıq Dərs Sayı:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDupLessonsPerMonth(8)}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                              dupLessonsPerMonth === 8
                                ? 'border-indigo-600 bg-white text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                                : 'border-slate-200 bg-white/70 text-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold">Ayda 8 Dərs</div>
                            <div className="text-[10px] text-slate-500 font-normal">Həftədə 2 dəfə</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDupLessonsPerMonth(4)}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                              dupLessonsPerMonth === 4
                                ? 'border-indigo-600 bg-white text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                                : 'border-slate-200 bg-white/70 text-slate-700'
                            }`}
                          >
                            <div className="text-xs font-bold">Ayda 4 Dərs</div>
                            <div className="text-[10px] text-slate-500 font-normal">Həftədə 1 dəfə</div>
                          </button>
                        </div>
                      </div>

                      {/* Status indicator about program */}
                      {alreadyInThisProgram ? (
                        <div className="p-2.5 bg-amber-100/80 border border-amber-300 rounded-lg text-[11px] text-amber-900 font-medium">
                          ⚠️ «{dup.fullName}» artıq «{targetCourseName}» proqramında aktivdir. Tələbəni fərqli başqa bir proqrama (Robototexnika, Python, Dron və s.) yazmağınız tövsiyə olunur.
                        </div>
                      ) : (
                        <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-lg text-[11px] text-emerald-900 font-medium">
                          ✨ Əla! «{targetCourseName}» tələbə üçün yeni proqramdır. Təsdiqlədikdə eyni tələbəyə yeni müqavilə bağlanacaq və cari ayın {dupMonthlyFee} AZN borcu balansa yazılacaq.
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setNewFullName('');
                          setNewFinCode('');
                        }}
                        className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Formu Sıfırla (Başqa Tələbə)
                      </button>

                      <button
                        type="submit"
                        disabled={alreadyInThisProgram}
                        className={`px-4 py-2.5 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                          alreadyInThisProgram
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        }`}
                      >
                        <FileSignature className="w-3.5 h-3.5" />
                        <span>«{dup.fullName}» Üçün Yeni Proqrama Qeydiyyatı Tamamla</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* BRANCH 2: NEW UNIQUE STUDENT REGISTRATION */
                <form onSubmit={handleAddStudentSubmit} className="space-y-4">
                  {duplicatePhoneStudent && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>
                        Qeyd: Bu telefon nömrəsi artıq «{duplicatePhoneStudent.fullName}» tələbəsində qeyd olunub.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Əlaqə Nömrəsi: *</span>
                        <span className="text-[10px] text-rose-500 font-normal">Məcburi</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+994 50 123 45 67"
                        value={newPhone}
                        onChange={e => {
                          setNewPhone(e.target.value);
                          if (formErrors.phone) {
                            setFormErrors(prev => ({ ...prev, phone: undefined }));
                          }
                        }}
                        className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono-nums focus:outline-none focus:ring-2 ${
                          formSubmitted && formErrors.phone
                            ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500 text-rose-900 ring-1 ring-rose-300'
                            : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                      />
                      {formSubmitted && formErrors.phone && (
                        <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        E-poçt (Email):
                      </label>
                      <input
                        type="email"
                        placeholder="leyla@gmail.com"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Yaş və ya Təvəllüd İli:
                    </label>
                    <input
                      type="text"
                      placeholder="Məsələn: 12 və ya 2014"
                      value={newAge}
                      onChange={e => setNewAge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-indigo-500"
                    />
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      <strong>Qısa qeydiyyat rejimi:</strong> Qrup təyinatı, təlimçi və aylıq ödəniş haqqı tələbə qeydiyyatdan keçdikdən sonra <strong>Müqavilə</strong> imzalanarkən müəyyən edilir.
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                    >
                      İmtina
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs rounded-lg font-bold transition-all bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs hover:shadow"
                    >
                      Tələbəni Qeydiyyata Al
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal: Student Detail Drawer */}
      {selectedStudentForDetail && (() => {
        const liveStudent = students.find(s => s.id === selectedStudentForDetail.id) || selectedStudentForDetail;
        const studentContracts = contracts.filter(c => c.studentId === liveStudent.id);
        const studentDebtsList = studentDebts.filter(d => d.studentId === liveStudent.id);
        const unpaidDebts = studentDebtsList.filter(d => d.status === 'odenilmayib' || d.status === 'qismen_odenilib');
        const calculatedDebt = unpaidDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
        const currentMonthDebtAmount = calculatedDebt > 0
          ? calculatedDebt
          : (liveStudent.balance < 0 ? Math.abs(liveStudent.balance) : (liveStudent.currentMonthDebt || 0));
        const hasDebt = currentMonthDebtAmount > 0;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-xl max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900">
                      {liveStudent.fullName}
                    </h3>
                    {liveStudent.finCode && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono uppercase font-bold border border-slate-200">
                        FİN: {liveStudent.finCode}
                      </span>
                    )}
                    {studentContracts.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                        {studentContracts.length} Fərqli Proqram
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ID: {liveStudent.id} · Əsas Qrup: {liveStudent.groupName || 'Təyin edilməyib'} · Filial: {liveStudent.branchName || 'Əsas'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedStudentForDetail(null);
                    setDetailTab('info');
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* CARI AY BORCU KARTI & BİRBAŞA ÖDƏNİŞ DÜYMƏSİ (Avtomatik Firestore Borc İnteqrasiyası) */}
              {hasDebt ? (
                <div className="bg-gradient-to-r from-rose-50 via-amber-50/60 to-orange-50 border-2 border-rose-300/80 rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-200">
                            Cari Ay Borcu
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Avtomatik Firestore Borcu
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-black text-rose-950 font-mono-nums tracking-tight">
                            {formatAZN(currentMonthDebtAmount)}
                          </span>
                          <span className="text-[11px] text-rose-700 font-medium font-mono-nums">
                            (Balans: {formatAZN(liveStudent.balance)})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Birbaşa Ödəniş Düyməsi */}
                    <button
                      type="button"
                      onClick={() => handleOpenQuickPaymentForStudent(liveStudent, unpaidDebts[0])}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Birbaşa Ödəniş Et</span>
                    </button>
                  </div>

                  {/* Program-by-program debt breakdown if student has multiple programs */}
                  {unpaidDebts.length > 0 && (
                    <div className="pt-2 border-t border-rose-200/70 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Müqavilələr üzrə Yaranan Borc Sənədləri ({unpaidDebts.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {unpaidDebts.map(d => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between bg-white/90 border border-rose-200 rounded-xl px-3 py-2 text-xs shadow-2xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-900 text-xs truncate">{d.courseName}</p>
                              <p className="text-[10px] text-slate-500 font-mono-nums">
                                Müqavilə № {d.contractNumber} · {d.month}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-rose-700 font-mono-nums text-xs">
                                {formatAZN(d.remainingAmount)}
                              </span>
                              <span className="text-[9px] text-rose-600 block">
                                {d.status === 'qismen_odenilib' ? 'Qismən ödənilib' : 'Ödənilməyib'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50/40 to-cyan-50 border border-emerald-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          Cari Ay Borcu Yoxdur
                        </span>
                        <span className="text-[11px] text-emerald-700 font-medium">Bütün Tədris Haqqları Ödənilib</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Tələbə Balansı: <strong className="text-emerald-700 font-mono-nums">{formatAZN(liveStudent.balance)}</strong>
                        {liveStudent.balance > 0 && ' (Müsbət Avans)'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenQuickPaymentForStudent(liveStudent)}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Ödəniş / Avans Qəbul Et</span>
                  </button>
                </div>
              )}

              {/* Tabs inside drawer */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailTab('info')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    detailTab === 'info'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ümumi Profil
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('contracts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    detailTab === 'contracts'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Müqavilələr ({studentContracts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailTab('debts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    detailTab === 'debts'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Borc Sənədləri ({studentDebtsList.length})</span>
                </button>
              </div>

              {/* Tab 1: Info */}
              {detailTab === 'info' && (
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Əlaqə Nömrəsi:</span>
                      <span className="font-semibold text-slate-800 font-mono-nums">
                        {liveStudent.phone}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Valideyn Əlaqə:</span>
                      <span className="font-semibold text-slate-800 font-mono-nums">
                        {liveStudent.parentPhone || 'Qeyd edilməyib'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Əsas Qrup:</span>
                      <span className="font-semibold text-slate-800">
                        {liveStudent.groupName}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Aylıq Ödəniş:</span>
                      <span className="font-semibold text-slate-800 font-mono-nums">
                        {formatAZN(liveStudent.monthlyFee)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Cari Balans:</span>
                      <span
                        className={`font-semibold font-mono-nums ${
                          liveStudent.balance < 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatAZN(liveStudent.balance)}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Davamiyyət:</span>
                      <span className="font-semibold text-slate-800 font-mono-nums">
                        {liveStudent.attendanceRate}%
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                    <span className="text-slate-500 font-semibold block">Qeydlər:</span>
                    <p className="text-slate-700">
                      {liveStudent.notes || 'Qeyd daxil edilməyib.'}
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-900">
                        Çoxproqramlı Tədris:
                      </div>
                      <p className="text-[11px] text-indigo-700">
                        Tələbə hazırda {studentContracts.length} fərqli tədris müqaviləsinə malikdir.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAddContractForStudent(liveStudent);
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Yeni Proqram Əlavə Et</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Contracts & Programs */}
              {detailTab === 'contracts' && (
                <div className="space-y-3 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      İmzaladığı Bütün Müqavilələr ({studentContracts.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddContractForStudent(liveStudent)}
                      className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Yeni Proqram / Müqavilə</span>
                    </button>
                  </div>

                  {studentContracts.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <FileSignature className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-600">
                        Bu tələbə üçün hələ ayrıca müqavilə sənədi formalaşdırılmayıb.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddContractForStudent(liveStudent)}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        İlk Müqaviləni Bağla
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {studentContracts.map(ctr => (
                        <div
                          key={ctr.id}
                          className="p-3.5 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200 rounded-xl space-y-2 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono-nums font-bold text-xs text-indigo-700">
                                  {ctr.contractNumber}
                                </span>
                                {ctr.status === 'aktiv' && (
                                  <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    Aktiv
                                  </span>
                                )}
                                {ctr.status === 'tamamlandi' && (
                                  <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                    Tamamlandı
                                  </span>
                                )}
                                {ctr.status === 'dondurulub' && (
                                  <span className="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                    Dondurulub
                                  </span>
                                )}
                              </div>
                              <h5 className="font-bold text-xs text-slate-900 mt-1">
                                {ctr.courseName}
                              </h5>
                              <p className="text-[11px] text-slate-500">
                                Qrup: {ctr.groupName || 'Fərdi'} · Filial: {ctr.branchName || 'Əsas'}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="font-bold text-xs text-slate-900 font-mono-nums block">
                                {formatAZN(ctr.monthlyFee)} / ay
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono-nums">
                                Cəmi: {formatAZN(ctr.totalAmount || ctr.monthlyFee * 6)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono-nums">
                            <span>
                              {formatDateAz(ctr.startDate)} — {formatDateAz(ctr.endDate)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForDetail(null);
                                setActiveTab('contracts');
                              }}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                            >
                              Müqavilələr bölməsində bax →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Debts & Invoices */}
              {detailTab === 'debts' && (
                <div className="space-y-3 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Firestore Borc Sənədləri ({studentDebtsList.length}):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Müqavilə təsdiqləndikdə avtomatik yaranır
                    </span>
                  </div>

                  {studentDebtsList.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-600">
                        Bu tələbə üçün hələ qeydiyyatdan keçmiş borc sənədi yoxdur.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studentDebtsList.map(debt => (
                        <div
                          key={debt.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono-nums font-bold text-xs text-slate-900">
                                  {debt.month} Ayı Borcu
                                </span>
                                {debt.status === 'tam_odenilib' && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    Tam Ödənilib
                                  </span>
                                )}
                                {debt.status === 'qismen_odenilib' && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                    Qismən Ödənilib
                                  </span>
                                )}
                                {debt.status === 'odenilmayib' && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                    Ödənilməyib
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-0.5">
                                {debt.courseName} · Müqavilə №: {debt.contractNumber}
                              </p>
                              {debt.notes && (
                                <p className="text-[10px] text-slate-400 mt-0.5 italic">
                                  {debt.notes}
                                </p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-bold text-xs font-mono-nums block text-slate-900">
                                Məbləğ: {formatAZN(debt.amount)}
                              </span>
                              <span className="text-[11px] font-bold font-mono-nums text-rose-600 block">
                                Qalıq: {formatAZN(debt.remainingAmount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                            <span className="text-slate-400 font-mono-nums">
                              Yaradılma: {formatDateAz(debt.createdAt)}
                            </span>
                            {debt.status !== 'tam_odenilib' && (
                              <button
                                type="button"
                                onClick={() => handleOpenQuickPaymentForStudent(liveStudent, debt)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Bu Borcu Ödə ({formatAZN(debt.remainingAmount)})</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Drawer Footer Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => {
                    const target = liveStudent;
                    confirmAction({
                      title: 'Tələbəni Arxivə Göndər / Sil',
                      message: `"${target.fullName}" tələbəsini arxivə göndərmək istədiyinizə əminsiniz?`,
                      confirmText: 'Bəli, Arxivlə',
                      danger: true,
                      onConfirm: () => {
                        deleteStudent(target.id);
                        setSelectedStudentForDetail(null);
                      },
                    });
                  }}
                  className="text-rose-600 hover:text-rose-800 text-xs font-semibold cursor-pointer"
                >
                  Tələbəni Sil
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const nextStatus =
                        liveStudent.status === 'aktiv' ? 'dondurulub' : 'aktiv';
                      updateStudent(liveStudent.id, { status: nextStatus });
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium cursor-pointer"
                  >
                    {liveStudent.status === 'aktiv' ? 'Dondur' : 'Aktivləşdir'}
                  </button>
                  <button
                    onClick={() => {
                      const st = liveStudent;
                      setSelectedStudentForDetail(null);
                      handleOpenEdit(st);
                    }}
                    className="px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold cursor-pointer"
                  >
                    Redaktə et
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStudentForDetail(null);
                      setActiveTab('certificates');
                    }}
                    className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer"
                  >
                    Sertifikat Ver
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Quick Direct Payment Modal (Triggered by "Birbaşa Ödəniş Et" button) */}
      {paymentTargetStudent && (() => {
        const targetStudentContracts = contracts.filter(
          c => c.studentId === paymentTargetStudent.id && c.status === 'aktiv'
        );
        const matchedContract = contracts.find(c => c.id === paymentSelectedContractId) || targetStudentContracts[0];
        const courseNameDisplay = matchedContract?.courseName || paymentTargetStudent.courseName || 'Tədris Proqramı';
        const targetGroup = groups.find(g => g.id === (matchedContract?.groupId || paymentTargetStudent.groupId));

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              {!lastPaymentSuccess ? (
                <>
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Tələbə Borc Ödənişi Qəbulu
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tələbə: <strong>{paymentTargetStudent.fullName}</strong>
                          {paymentTargetStudent.finCode && ` (FİN: ${paymentTargetStudent.finCode})`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentTargetStudent(null)}
                      className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleConfirmDirectPayment} className="space-y-3.5">
                    {/* Contract / Program Selection */}
                    {targetStudentContracts.length > 1 ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ödənişin Aid Olduğu Müqavilə / Proqram:
                        </label>
                        <select
                          value={paymentSelectedContractId}
                          onChange={e => {
                            const newCId = e.target.value;
                            setPaymentSelectedContractId(newCId);
                            const foundCtr = contracts.find(c => c.id === newCId);
                            if (foundCtr) {
                              setPaymentAmount(foundCtr.monthlyFee);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {targetStudentContracts.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.courseName} (№ {c.contractNumber}) · {c.monthlyFee} AZN/ay
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                          Tədris Proqramı:
                        </span>
                        <div className="font-bold text-slate-800 flex items-center justify-between">
                          <span>{courseNameDisplay}</span>
                          <span className="text-indigo-600 font-mono-nums">
                            {matchedContract ? `№ ${matchedContract.contractNumber}` : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Payment Amount & Method */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ödəniləcək Məbləğ (AZN):
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold font-mono-nums text-slate-900 focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Ödəniş Üsulu:
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={e => setPaymentMethod(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800"
                        >
                          <option value="Nagd">Nağd</option>
                          <option value="Bank karti">Bank Kartı (POS)</option>
                          <option value="eManat/MilliOn">eManat / MilliÖn</option>
                          <option value="Hesaba kocurme">Hesaba Köçürmə</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Əlavə Qeyd (İstəyə görə):
                      </label>
                      <input
                        type="text"
                        placeholder="məs: Oktyabr ayı təhsil haqqı"
                        value={paymentNotes}
                        onChange={e => setPaymentNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setPaymentTargetStudent(null)}
                        className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        İmtina
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Ödənişi Təsdiqlə ({formatAZN(paymentAmount)})</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                /* Payment Success View with WhatsApp Receipt and Print */
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Ödəniş Uğurla Qəbul Edildi!
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tələbə balansı dərhal yeniləndi və borc sənədi Firestore bazasında qeydə alındı.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1 font-mono-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Qəbz Nömrəsi:</span>
                      <span className="font-bold text-slate-800">{lastPaymentSuccess.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tələbə:</span>
                      <span className="font-bold text-slate-800">{paymentTargetStudent.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Proqram:</span>
                      <span className="font-bold text-slate-800">{courseNameDisplay}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Məbləğ:</span>
                      <span className="font-bold text-emerald-600">{formatAZN(lastPaymentSuccess.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Üsul:</span>
                      <span className="font-semibold text-slate-700">{lastPaymentSuccess.method}</span>
                    </div>
                  </div>

                  {/* WhatsApp Links */}
                  {(() => {
                    const parentPhoneNum = (paymentTargetStudent.parentPhone || paymentTargetStudent.phone).replace(/\D/g, '');
                    const parentWaMsg = encodeURIComponent(
                      `Salam! «${paymentTargetStudent.fullName}» adlı tələbəmizin «${courseNameDisplay}» tədris proqramı üzrə ${lastPaymentSuccess.amount} AZN təhsil haqqı ödənişi qəbul edildi.\nQəbz №: ${lastPaymentSuccess.receiptNumber}\nTarix: ${formatDateAz(lastPaymentSuccess.date)}\nTəşəkkür edirik! AREA Tədris Mərkəzi.`
                    );
                    const parentWaLink = `https://wa.me/${parentPhoneNum}?text=${parentWaMsg}`;

                    const trainerMember = staff.find(st => st.id === targetGroup?.trainerId || st.fullName === targetGroup?.trainerName) ||
                      users.find(u => u.fullName === targetGroup?.trainerName);
                    const trainerPhoneNum = (trainerMember?.phone || '').replace(/\D/g, '');
                    const trainerWaMsg = encodeURIComponent(
                      `Salam müəllim! Qrupunuzun tələbəsi «${paymentTargetStudent.fullName}» («${courseNameDisplay}») cari ay üzrə ${lastPaymentSuccess.amount} AZN təhsil haqqı ödənişini tamamladı (Qəbz: ${lastPaymentSuccess.receiptNumber}).`
                    );
                    const trainerWaLink = trainerPhoneNum ? `https://wa.me/${trainerPhoneNum}?text=${trainerWaMsg}` : null;

                    return (
                      <div className="space-y-2">
                        <a
                          href={parentWaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Valideynə WhatsApp Çeki Göndər</span>
                        </a>

                        {trainerWaLink && (
                          <a
                            href={trainerWaLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Təlimçiyə Məlumat Göndər ({targetGroup?.trainerName || 'Müəllim'})</span>
                          </a>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Çap Et</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentTargetStudent(null);
                        setLastPaymentSuccess(null);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Tamamla
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal: Quick Add Contract For Specific Student */}
      {studentForContract && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-indigo-600" />
                  <span>Yeni Tədris Proqramı Müqaviləsi</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tələbə: <strong>{studentForContract.fullName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStudentForContract(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentContractSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Qrup Seçimi:
                  </label>
                  {contractGroupId && (
                    <span className="text-[11px] text-indigo-700 font-medium">
                      Proqram: <strong className="font-semibold">{groups.find(g => g.id === contractGroupId)?.courseName}</strong>
                    </span>
                  )}
                </div>
                <select
                  value={contractGroupId}
                  onChange={e => setContractGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Fərdi / Qrup hələ təyin edilməyib</option>
                  {groups
                    .filter(g => !g.isDeleted)
                    .map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.courseName}
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Qrup seçildikdə müvafiq tədris proqramı avtomatik təyin olunur.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aylıq Tədris Haqqı (AZN):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="Məs: 85, 93, 260..."
                    value={contractMonthlyFee === 0 ? '' : contractMonthlyFee}
                    onChange={e => {
                      const val = e.target.value;
                      setContractMonthlyFee(val === '' ? 0 : parseFloat(val) || 0);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Müddət (Aylar):
                  </label>
                  <select
                    value={contractDurationMonths}
                    onChange={e => setContractDurationMonths(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  >
                    <option value={3}>3 Ay</option>
                    <option value={4}>4 Ay</option>
                    <option value={6}>6 Ay</option>
                    <option value={9}>9 Ay</option>
                    <option value={12}>12 Ay</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Dərs Cədvəli və Aylıq Dərs Sayı:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setContractLessonsPerMonth(8)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      contractLessonsPerMonth === 8
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs">Ayda 8 Dərs</div>
                    <div className="text-[10px] text-slate-500 font-normal">Həftədə 2 dəfə</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContractLessonsPerMonth(4)}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      contractLessonsPerMonth === 4
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-bold shadow-xs ring-1 ring-indigo-500'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <div className="text-xs">Ayda 4 Dərs</div>
                    <div className="text-[10px] text-slate-500 font-normal">Həftədə 1 dəfə</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Başlama Tarixi:
                </label>
                <input
                  type="date"
                  required
                  value={contractStartDate}
                  onChange={e => setContractStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeydlər:
                </label>
                <textarea
                  rows={2}
                  value={contractNotes}
                  onChange={e => setContractNotes(e.target.value)}
                  placeholder="Müqavilə üçün əlavə qeydlər..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudentForContract(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  <span>Müqaviləni Təsdiqlə</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Student */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Tələbə Məlumatlarının Redaktəsi
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ad və Soyad:
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 ${
                      editDuplicateStudent
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    FİN Kod / ŞV Nömrəsi:
                  </label>
                  <input
                    type="text"
                    placeholder="məs: 7A1B2C3"
                    maxLength={10}
                    value={editFinCode}
                    onChange={e => setEditFinCode(e.target.value.toUpperCase())}
                    className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:ring-2 ${
                      editDuplicateFinStudent
                        ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-500'
                        : 'border-slate-300 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {editDuplicateStudent && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    «{editDuplicateStudent.fullName}» adlı başqa tələbə artıq bazada mövcuddur! Tələbə adları unikal olmalıdır.
                  </span>
                </div>
              )}

              {editDuplicateFinStudent && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    «{editDuplicateFinStudent.finCode}» FİN kodlu başqa tələbə ({editDuplicateFinStudent.fullName}) artıq bazada mövcuddur!
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon:
                  </label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valideyn Telefonu:
                  </label>
                  <input
                    type="text"
                    value={editParentPhone}
                    onChange={e => setEditParentPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-poçt:
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tədris Qrupu:
                  </label>
                  <select
                    value={editGroupId}
                    onChange={e => setEditGroupId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="dondurulub">Dondurulub</option>
                    <option value="mezun">Məzun</option>
                    <option value="xaric">Xaric edilib</option>
                    <option value="silinib">Silinib (Arxiv)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aylıq Təhsil Haqqı (AZN):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editMonthlyFee}
                    onChange={e => setEditMonthlyFee(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
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
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  disabled={!!editDuplicateStudent}
                  className={`px-4 py-2 text-xs rounded-lg font-semibold transition-colors ${
                    editDuplicateStudent
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  }`}
                >
                  {editDuplicateStudent ? 'Ad Təkrardır (Bloklandı)' : 'Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
