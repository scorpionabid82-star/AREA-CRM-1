import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Download,
  CheckCircle,
  Clock,
  Printer,
  Wallet,
  Target,
  RefreshCw,
  FileText,
  Award,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  UploadCloud,
  FileImage,
  AlertTriangle,
  Trash2,
  Paperclip,
  Check,
  X,
  Eye,
  XCircle,
  Building2,
  Filter,
  MessageSquare,
  Send,
  Copy,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { PaymentTransaction, Expense, ExtraIncome, TrainerSalary } from '../../types/crm';
import { formatAZN, formatDateAz, exportToCSV } from '../../utils/formatters';

interface FinanceViewProps {
  initialSubTab?: 'payments' | 'salaries' | 'expenses' | 'extra' | 'matrix';
}

export const FinanceView: React.FC<FinanceViewProps> = ({ initialSubTab = 'payments' }) => {
  const {
    contracts,
    students,
    groups,
    branches,
    payments,
    expenses,
    extraIncomes,
    trainerSalaries,
    recordPayment,
    deletePayment,
    addExpense,
    approveExpense,
    rejectExpense,
    deleteExpense,
    addExtraIncome,
    deleteExtraIncome,
    payTrainerSalary,
    syncSalariesWithKpiAndAttendance,
    addOrUpdateSalary,
    staff,
    staffKpis,
    setActiveTab,
    currentUser,
    confirmAction,
    showToast,
    can,
  } = useCrm();

  const isDirector = currentUser?.role === 'direktor' || currentUser?.isSuperAdmin;

  const [activeSubTab, setActiveSubTab] = useState<'payments' | 'salaries' | 'expenses' | 'extra' | 'matrix'>(initialSubTab);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showExtraIncomeModal, setShowExtraIncomeModal] = useState(false);
  const [printedReceipt, setPrintedReceipt] = useState<PaymentTransaction | null>(null);

  // Expense receipt preview modal
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<Expense | null>(null);
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  // Salary slip breakdown modal & new salary modal
  const [selectedSalaryForSlip, setSelectedSalaryForSlip] = useState<TrainerSalary | null>(null);
  const [showNewSalaryModal, setShowNewSalaryModal] = useState(false);
  const [newSalaryStaffId, setNewSalaryStaffId] = useState(staff[0]?.id || '');
  const [newSalaryMonth, setNewSalaryMonth] = useState('2026-03');
  const [newSalaryBase, setNewSalaryBase] = useState(1500);
  const [newSalaryCalcType, setNewSalaryCalcType] = useState<'sabit' | 'faiz' | 'saatliq'>('sabit');
  const [newSalaryBonus, setNewSalaryBonus] = useState(0);
  const [newSalaryPenalty, setNewSalaryPenalty] = useState(0);
  const [newSalaryNotes, setNewSalaryNotes] = useState('');

  // New Payment form
  const [payStudentId, setPayStudentId] = useState(students[0]?.id || '');
  const [payContractId, setPayContractId] = useState('');
  const [payDiscount, setPayDiscount] = useState(0);
  const [payAmount, setPayAmount] = useState(260);
  const [payMethod, setPayMethod] = useState<any>('Bank karti');
  const [payType, setPayType] = useState<any>('telim_haqqi');
  const [payNote, setPayNote] = useState('Aylıq təlim haqqı');
  const [copiedReceiptText, setCopiedReceiptText] = useState(false);
  const [copiedTrainerText, setCopiedTrainerText] = useState(false);

  // New Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState(100);
  const [expCategory, setExpCategory] = useState<any>('icare');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expResponsible, setExpResponsible] = useState('Elnur Qasımzadə');
  const [expReceiptFile, setExpReceiptFile] = useState('');
  const [expReceiptUrl, setExpReceiptUrl] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // New Extra Income form
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState(50);
  const [incSource, setIncSource] = useState<any>('kitab_derslik');
  const [incPayer, setIncPayer] = useState('');

  // Approval categories for expenses
  const approvedExpenses = expenses.filter(e => e.approvalStatus === 'tesdiqlendi');
  const pendingExpenses = expenses.filter(e => e.approvalStatus === 'gozleyir');
  const rejectedExpenses = expenses.filter(e => e.approvalStatus === 'imtina');

  // Strict Rule: Yalnız rəsmi təsdiqlənmiş (qəbzli və ya rəhbərlik tərəfindən qəbul edilmiş) xərclər şirkət büdcəsindən silinir
  const totalTuition = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalExtra = extraIncomes.reduce((acc, e) => acc + e.amount, 0);
  const totalGrossIncome = totalTuition + totalExtra;
  const totalExpenses = approvedExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPendingAmount = pendingExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalTrainerSalaries = trainerSalaries.reduce((acc, s) => acc + s.totalPaid, 0);
  const totalOutflow = totalExpenses + totalTrainerSalaries;
  const netProfit = totalGrossIncome - totalOutflow;

  const cleanPhoneForWa = (phone?: string) => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '994' + digits.slice(1);
    else if (!digits.startsWith('994') && digits.length === 9) digits = '994' + digits;
    return digits;
  };

  const handleStudentSelectChange = (newStudentId: string) => {
    setPayStudentId(newStudentId);
    const curStudent = students.find(s => s.id === newStudentId);
    const activeContracts = contracts.filter(c => c.studentId === newStudentId && c.status === 'aktiv');
    const firstContract = activeContracts[0];
    const defaultMonthly = firstContract?.monthlyFee || curStudent?.monthlyFee || 260;
    setPayContractId(firstContract?.id || '');
    setPayDiscount(0);
    setPayAmount(defaultMonthly);
  };

  const handleContractSelectChange = (newContractId: string) => {
    setPayContractId(newContractId);
    const chosenContract = contracts.find(c => c.id === newContractId);
    const curStudent = students.find(s => s.id === payStudentId);
    const baseFee = chosenContract?.monthlyFee || curStudent?.monthlyFee || 260;
    setPayAmount(Math.max(0, baseFee - payDiscount));
  };

  const handleDiscountChange = (discountVal: number) => {
    const val = Math.max(0, discountVal);
    setPayDiscount(val);
    const chosenContract = contracts.find(c => c.id === payContractId);
    const curStudent = students.find(s => s.id === payStudentId);
    const baseFee = chosenContract?.monthlyFee || curStudent?.monthlyFee || 260;
    setPayAmount(Math.max(0, baseFee - val));
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExpReceiptFile(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setExpReceiptUrl(reader.result as string);
        showToast(`Qəbz əlavə olundu: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachDemoReceipt = () => {
    setExpReceiptFile('resmi_odenis_qebzi_faktura.png');
    setExpReceiptUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
    showToast('Nümunəvi rəsmi kassa çeki/invoys əlavə edildi');
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === payStudentId) || students[0];
    if (!student) {
      showToast('Ödəniş qəbul etmək üçün əvvəlcə tələbə qeydiyyatdan keçməlidir', 'error');
      return;
    }
    const selectedContract = contracts.find(c => c.id === payContractId) ||
      contracts.find(c => c.studentId === student.id && c.status === 'aktiv');
    const group = groups.find(g => g.id === (selectedContract?.groupId || student?.groupId)) || groups[0];
    const trainerMember = staff.find(st => st.id === group?.trainerId || st.fullName === group?.trainerName);
    const baseFee = selectedContract?.monthlyFee || student.monthlyFee || 260;

    const newPayment = recordPayment({
      studentId: student.id,
      studentName: student.fullName,
      groupId: group?.id || 'grp-general',
      groupName: group?.name || selectedContract?.courseName || 'Ümumi Tədris',
      contractId: selectedContract?.id,
      amount: payAmount,
      originalFee: baseFee,
      discountAmount: payDiscount > 0 ? payDiscount : undefined,
      parentPhone: student.parentPhone || student.phone,
      trainerPhone: trainerMember?.phone,
      trainerName: group?.trainerName,
      type: payType,
      method: payMethod,
      date: new Date().toISOString().split('T')[0],
      recordedBy: currentUser?.fullName || 'Menecer',
      note: payNote,
    });

    setShowPaymentModal(false);
    setPrintedReceipt(newPayment);
    setCopiedReceiptText(false);
    setCopiedTrainerText(false);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim()) return;

    addExpense({
      title: expTitle,
      category: expCategory,
      amount: expAmount,
      date: new Date().toISOString().split('T')[0],
      paidTo: expPaidTo,
      responsiblePerson: expResponsible,
      receiptFile: expReceiptFile.trim() || undefined,
      receiptUrl: expReceiptUrl.trim() || undefined,
      notes: expNotes.trim() || undefined,
    });

    setShowExpenseModal(false);
    setExpTitle('');
    setExpPaidTo('');
    setExpReceiptFile('');
    setExpReceiptUrl('');
    setExpNotes('');
  };

  const handleAddExtraIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim()) return;

    addExtraIncome({
      title: incTitle,
      source: incSource,
      amount: incAmount,
      date: new Date().toISOString().split('T')[0],
      payerName: incPayer,
    });

    setShowExtraIncomeModal(false);
    setIncTitle('');
    setIncPayer('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Maliyyə
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ödənişlər, maaşlar, xərclər və mənfəət analitikası.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activeSubTab === 'payments' && can('create', 'finance') && (
            <button
              onClick={() => {
                const firstStd = students[0];
                if (firstStd) {
                  handleStudentSelectChange(firstStd.id);
                }
                setShowPaymentModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ödəniş Qəbul Et</span>
            </button>
          )}

          {activeSubTab === 'expenses' && can('create', 'finance') && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Xərc</span>
            </button>
          )}

          {activeSubTab === 'extra' && can('create', 'finance') && (
            <button
              onClick={() => setShowExtraIncomeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Əlavə Gəlir</span>
            </button>
          )}

          {activeSubTab === 'matrix' && (
            <button
              onClick={() => {
                const matrixData = branches.map(b => {
                  const bStudents = students.filter(s => s.branchId === b.id && s.status === 'aktiv');
                  const bPayments = payments.filter(p => p.branchId === b.id || (!p.branchId && students.find(s => s.id === p.studentId)?.branchId === b.id));
                  const bTuition = bPayments.filter(p => p.type === 'telim_haqqi').reduce((acc, p) => acc + p.amount, 0);
                  const bOther = bPayments.filter(p => p.type !== 'telim_haqqi').reduce((acc, p) => acc + p.amount, 0);
                  const bExtra = extraIncomes.filter(e => e.branchId === b.id).reduce((acc, e) => acc + e.amount, 0) + bOther;
                  const grossRev = bTuition + bExtra;
                  const bExp = approvedExpenses.filter(e => e.branchId === b.id).reduce((acc, e) => acc + e.amount, 0);
                  const bStaff = staff.filter(s => s.branchId === b.id);
                  const bSalaries = trainerSalaries.filter(s => s.branchId ? s.branchId === b.id : bStaff.some(st => st.id === s.trainerId)).reduce((acc, s) => acc + s.totalPaid, 0);
                  const totalOut = bExp + bSalaries;
                  const netProf = grossRev - totalOut;
                  const margin = grossRev > 0 ? ((netProf / grossRev) * 100).toFixed(1) + '%' : '0%';
                  return {
                    Filial: b.name,
                    Kod: b.code || '-',
                    Unvan: b.address || '-',
                    AktivTelebe: bStudents.length,
                    TelimHaqqiAZN: bTuition,
                    ElaveGelirAZN: bExtra,
                    UmumiDovriyyeAZN: grossRev,
                    TesdiqlenmisXerclerAZN: bExp,
                    EmekhaqqiFonduAZN: bSalaries,
                    UmumiXercAZN: totalOut,
                    XalisMenfeetAZN: netProf,
                    RentabellikMarja: margin,
                  };
                });
                exportToCSV(`AREA_Filiallar_Maliyye_Matrisi_${new Date().toISOString().split('T')[0]}`, matrixData);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Matrisi Excel/CSV Yüklə</span>
            </button>
          )}

          {activeSubTab === 'salaries' && (
            <div className="flex items-center gap-2 flex-wrap">
              {can('edit', 'finance') && (
                <button
                  onClick={() => syncSalariesWithKpiAndAttendance('2026-03')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="Davamiyyət və KPI nəticələrinə əsasən maaşları avtomatik yenilə"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>KPI və Davamiyyətdən Yenilə</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('kpi')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                <span>KPI Sistemi</span>
              </button>
              {can('create', 'finance') && (
                <button
                  onClick={() => {
                    setNewSalaryStaffId(staff[0]?.id || '');
                    setNewSalaryBase(staff[0]?.salary || 1500);
                    setShowNewSalaryModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Maaş Qeydi</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mədaxil</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-slate-900 mt-1">
            {formatAZN(totalGrossIncome)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Təlim haqları + Əlavə
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Əməkhaqqı</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-indigo-600 mt-1">
            {formatAZN(totalTrainerSalaries)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Təlimçi və heyət
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Xərclər</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-rose-600 mt-1">
            {formatAZN(totalExpenses)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            İcarə, reklam, xərclər
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mənfəət</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono-nums text-emerald-600 mt-1">
            {formatAZN(netProfit)}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Xalis gəlir
          </span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'payments'
              ? 'bg-white text-indigo-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Ödənişlər ({payments.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('salaries')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'salaries'
              ? 'bg-white text-indigo-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Maaşlar ({trainerSalaries.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'expenses'
              ? 'bg-white text-indigo-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Xərclər ({expenses.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('extra')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'extra'
              ? 'bg-white text-indigo-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Əlavə Gəlir ({extraIncomes.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-white text-indigo-700 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Filiallar üzrə Matris ({branches.length})</span>
        </button>
      </div>

      {/* 1. Student Payments Table */}
      {activeSubTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              Tələbə Təhsil Haqqı Ödənişləri
            </h3>
            <button
              onClick={() =>
                exportToCSV(
                  'AREA_Odenisler',
                  payments.map(p => ({
                    QebzNo: p.receiptNumber,
                    Telebe: p.studentName,
                    Qrup: p.groupName,
                    Mebleg: p.amount,
                    Usul: p.method,
                    Tarix: p.date,
                    QeydEden: p.recordedBy,
                  }))
                )
              }
              className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> CSV İxrac
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Qəbz №</th>
                  <th className="py-3 px-4">Tələbə</th>
                  <th className="py-3 px-4">Qrup</th>
                  <th className="py-3 px-4">Məbləğ</th>
                  <th className="py-3 px-4">Ödəniş Üsulu</th>
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-4">Menecer</th>
                  <th className="py-3 px-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono-nums font-bold text-indigo-600">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{pay.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{pay.groupName}</td>
                    <td className="py-3 px-4 font-mono-nums font-bold text-emerald-600">
                      +{formatAZN(pay.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{pay.method}</td>
                    <td className="py-3 px-4 font-mono-nums text-slate-500">
                      {formatDateAz(pay.date)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{pay.recordedBy}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPrintedReceipt(pay)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                          title="Ödəniş qəbzini çap et"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Qəbz</span>
                        </button>
                        {can('delete', 'finance') && (
                          <button
                            onClick={() => {
                              confirmAction({
                                title: 'Ödəniş Qeydini Sil',
                                message: `"${pay.studentName}" tələbəsinin ${pay.amount} AZN məbləğində ödənişini (Qəbz № ${pay.receiptNumber}) bazadan silmək istədiyinizə əminsiniz? Bu əməliyyat tələbənin balansına təsir edə bilər.`,
                                confirmText: 'Bəli, Sil',
                                danger: true,
                                onConfirm: () => deletePayment(pay.id),
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Ödəniş qeydini sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Trainer Salaries Table */}
      {activeSubTab === 'salaries' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Əməkhaqqı Fondu və Maaşın Formalaşma Cədvəli
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  QR Davamiyyət & KPI İnteqrasiyalı
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Maaş = Baza Məbləğ - Davamiyyət Kəsintisi + İntizam Bonusu + KPI Bonusu/Kəsiri + Digər Əlavələr.
              </p>
            </div>

            <div className="text-xs font-mono-nums text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <span className="text-slate-400">Ümumi Fond:</span>
              <span className="font-bold text-slate-900">{formatAZN(totalTrainerSalaries)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Əməkdaş</th>
                  <th className="py-3 px-4">Baza Tarif</th>
                  <th className="py-3 px-4">QR Davamiyyət İntizamı</th>
                  <th className="py-3 px-4">KPI Performansı</th>
                  <th className="py-3 px-4">Digər Əlavə/Kəsir</th>
                  <th className="py-3 px-4">Yekun Xalis Maaş</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainerSalaries.map(salary => (
                  <tr key={salary.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {salary.trainerName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{salary.trainerName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {salary.role || 'Təlimçi'}
                            </span>
                            {salary.branchName && (
                              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                📍 {salary.branchName.replace('AREA ', '')}
                              </span>
                            )}
                            {salary.employmentType && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                                salary.employmentType === 'full_stat'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : salary.employmentType === 'yarim_stat'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : salary.employmentType === 'saatliq'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {salary.employmentType === 'full_stat'
                                  ? 'Full ştat · 40s'
                                  : salary.employmentType === 'yarim_stat'
                                  ? 'Yarım ştat · 20s'
                                  : salary.employmentType === 'saatliq'
                                  ? 'Saatlıq'
                                  : 'Fərdi'}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono-nums truncate max-w-[200px]">
                            {salary.month} · {salary.groupsHandled.join(', ') || 'Ümumi Ştat'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900 font-mono-nums">
                          {formatAZN(salary.calculatedAmount || salary.baseRate)}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-medium">
                          {salary.calcType === 'sabit'
                            ? 'Sabit Aylıq'
                            : salary.calcType === 'faiz'
                            ? `%${salary.baseRate} Qrup Gəlirindən`
                            : `Saatlıq (${salary.baseRate} ₼/s × ${salary.workedHoursTotal || 30} saat)`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-800 font-mono-nums text-[11px]">
                            %{salary.attendanceRate ?? 100}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono-nums">
                            {salary.employmentType === 'saatliq'
                              ? `(${salary.workedHoursTotal ?? 30}/${salary.normHoursTotal ?? 30} saat norma)`
                              : salary.employmentType === 'yarim_stat'
                              ? `(${salary.workDaysAttended ?? 14}/${salary.workDaysTotal ?? 14} gün · ${salary.workedHoursTotal ?? 56}s)`
                              : `(${salary.workDaysAttended ?? 22}/${salary.workDaysTotal ?? 22} gün)`}
                          </span>
                        </div>

                        {salary.attendanceDeduction && salary.attendanceDeduction > 0 ? (
                          <div className="text-[10px] text-rose-600 font-mono-nums font-semibold flex items-center gap-0.5">
                            <ArrowDownRight className="w-3 h-3" /> -{formatAZN(salary.attendanceDeduction)}
                            <span className="text-slate-400 font-normal">
                              ({salary.absentCount} qayıb, {salary.lateCount} gecikmə)
                            </span>
                          </div>
                        ) : salary.attendanceBonus && salary.attendanceBonus > 0 ? (
                          <div className="text-[10px] text-emerald-600 font-mono-nums font-semibold flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" /> +{formatAZN(salary.attendanceBonus)} İntizam
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Kəsinti yoxdur</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              salary.kpiGrade === 'A+'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : salary.kpiGrade === 'A'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : salary.kpiGrade === 'B'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {salary.kpiGrade || 'A'}
                          </span>
                          <span className="font-mono-nums text-[11px] text-slate-600">
                            %{salary.kpiScore ?? 100}
                          </span>
                        </div>

                        {salary.kpiBonus && salary.kpiBonus > 0 ? (
                          <span className="text-[10px] text-emerald-600 font-mono-nums font-semibold block">
                            +{formatAZN(salary.kpiBonus)} Bonus
                          </span>
                        ) : salary.kpiPenalty && salary.kpiPenalty > 0 ? (
                          <span className="text-[10px] text-rose-600 font-mono-nums font-semibold block">
                            -{formatAZN(salary.kpiPenalty)} Kəsir
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Bonus yoxdur</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono-nums">
                      {salary.bonus > 0 ? (
                        <span className="text-emerald-700">+{formatAZN(salary.bonus)}</span>
                      ) : salary.penalty > 0 ? (
                        <span className="text-rose-600">-{formatAZN(salary.penalty)}</span>
                      ) : (
                        <span className="text-slate-400">0 ₼</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono-nums font-bold text-slate-900 text-sm">
                      {formatAZN(salary.totalPaid)}
                    </td>

                    <td className="py-3 px-4">
                      {salary.status === 'odenilib' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Ödənilib
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" /> Gözləyir
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSalaryForSlip(salary)}
                          className="px-2 py-1 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                          title="Maaşın formalaşma cədvəli və kalkulyasiyası"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Vərəqə</span>
                        </button>

                        {salary.status === 'gozleyir' ? (
                          <button
                            onClick={() => payTrainerSalary(salary.id)}
                            className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium cursor-pointer"
                          >
                            Ödə
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono-nums text-[11px]">
                            {formatDateAz(salary.paymentDate || '')}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Expenses Table */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-3">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Şirkət Xərclərinin Növlər üzrə İzlənməsi və Qəbz Yoxlanışı
                </h3>
                {pendingExpenses.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{pendingExpenses.length} Təsdiq Gözləyən Qəbzsiz Xərc</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daxili qayda: Qəbzi olmayan ödənişlər rəhbərlik təsdiq etmədən rəsmi xərc kimi qəbul olunmur.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-mono-nums">
                Təsdiqlənmiş Cəmi: <strong className="text-rose-600">{formatAZN(totalExpenses)}</strong>
              </span>
            </div>
          </div>

          {/* Sub-Filters for Expenses */}
          <div className="px-4 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setExpenseFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                expenseFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bütün Xərclər ({expenses.length})
            </button>
            <button
              onClick={() => setExpenseFilter('approved')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                expenseFilter === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              <span>Təsdiqlənmiş ({approvedExpenses.length})</span>
            </button>
            <button
              onClick={() => setExpenseFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                expenseFilter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Rəhbərlik Təsdiqi Gözləyən ({pendingExpenses.length})</span>
            </button>
            <button
              onClick={() => setExpenseFilter('rejected')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                expenseFilter === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <XCircle className="w-3 h-3" />
              <span>İmtina Edilən ({rejectedExpenses.length})</span>
            </button>
          </div>

          {/* Pending Warning Banner if any unapproved expenses exist */}
          {pendingExpenses.length > 0 && expenseFilter !== 'approved' && (
            <div className="mx-4 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Diqqət:</strong> {pendingExpenses.length} ədəd xərc qəbz sənədi olmadan daxil edilmişdir. Rəhbərlik (direktor) tərəfindən xüsusi icazə verilmədən bu xərclər qəbul olunmur.
                </span>
              </div>
              <button
                onClick={() => setExpenseFilter('pending')}
                className="text-xs font-bold text-amber-800 hover:underline shrink-0"
              >
                Gözləyənlərə bax ({formatAZN(totalPendingAmount)}) →
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Xərc Təyinatı & Filial</th>
                  <th className="py-3 px-4">Kateqoriya</th>
                  <th className="py-3 px-4">Məbləğ</th>
                  <th className="py-3 px-4">Qəbz Sənədi</th>
                  <th className="py-3 px-4">Təsdiq Vəziyyəti</th>
                  <th className="py-3 px-4">Ödənilən Şəxs / Təşkilat</th>
                  <th className="py-3 px-4">Məsul Şəxs</th>
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses
                  .filter(exp => {
                    if (expenseFilter === 'approved') return exp.approvalStatus === 'tesdiqlendi';
                    if (expenseFilter === 'pending') return exp.approvalStatus === 'gozleyir';
                    if (expenseFilter === 'rejected') return exp.approvalStatus === 'imtina';
                    return true;
                  })
                  .map(exp => {
                    const hasReceipt = Boolean(exp.receiptUrl || exp.receiptFile);
                    const isPending = exp.approvalStatus === 'gozleyir';
                    const isApproved = exp.approvalStatus === 'tesdiqlendi';
                    const isRejected = exp.approvalStatus === 'imtina';

                    return (
                      <tr
                        key={exp.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isPending ? 'bg-amber-50/20' : isRejected ? 'bg-rose-50/20 opacity-80' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{exp.title}</div>
                          {exp.branchName && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-indigo-500" />
                              {exp.branchName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono-nums font-bold text-rose-600">
                          -{formatAZN(exp.amount)}
                        </td>

                        {/* Qəbz Sənədi (Receipt Column) */}
                        <td className="py-3 px-4">
                          {hasReceipt ? (
                            <button
                              onClick={() => setSelectedReceiptForPreview(exp)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors cursor-pointer border border-indigo-200"
                              title="Qəbzə və faktura sənədinə bax"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Qəbzə Bax</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Qəbz Yoxdur</span>
                            </span>
                          )}
                        </td>

                        {/* Təsdiq Vəziyyəti (Approval Status) */}
                        <td className="py-3 px-4">
                          {isApproved && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" /> Təsdiqlənib
                              </span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">
                                {exp.approvedBy || (hasReceipt ? 'Qəbz əsasında' : 'Rəhbərlik')}
                              </span>
                            </div>
                          )}

                          {isPending && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" /> Rəhbərlik Təsdiqi Gözləyir
                              </span>
                              <span className="block text-[10px] text-amber-700 mt-0.5 font-medium">
                                Qəbzsiz ödəniş (Qəbul edilməyib)
                              </span>
                            </div>
                          )}

                          {isRejected && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" /> İmtina Edildi
                              </span>
                              <span className="block text-[10px] text-rose-600 mt-0.5">
                                {exp.approvalNotes || 'Qəbzsiz imtina'}
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-700">{exp.paidTo}</td>
                        <td className="py-3 px-4 text-slate-500">{exp.responsiblePerson}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono-nums">
                          {formatDateAz(exp.date)}
                        </td>

                        {/* Əməliyyatlar (Actions: Approve, Reject, Delete) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Leadership Quick Action for Pending Expenses */}
                            {isPending && (
                              <>
                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Qəbzsiz Xərci Təsdiqlə',
                                      message: `"${exp.title}" (${exp.amount} AZN) məbləğində qəbzi olmayan xərci rəsmi olaraq qəbul etmək və şirkət büdcəsindən çıxarmaq istəyirsiniz?`,
                                      confirmText: 'Bəli, Təsdiq Et',
                                      danger: false,
                                      onConfirm: () => approveExpense(exp.id),
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                  title="Rəhbərlik kimi təsdiqlə"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Təsdiq</span>
                                </button>

                                <button
                                  onClick={() => {
                                    confirmAction({
                                      title: 'Xərcdən İmtina Et',
                                      message: `"${exp.title}" (${exp.amount} AZN) xərcindən qəbz təqdim olunmadığı üçün imtina etmək istəyirsiniz?`,
                                      confirmText: 'İmtina Et',
                                      danger: true,
                                      onConfirm: () => rejectExpense(exp.id),
                                    });
                                  }}
                                  className="px-2 py-1 rounded bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Xərci rədd et"
                                >
                                  <X className="w-3 h-3" />
                                  <span>İmtina</span>
                                </button>
                              </>
                            )}

                            {/* Delete Button with Required Confirmation Modal */}
                            <button
                              onClick={() => {
                                confirmAction({
                                  title: 'Xərci Sil',
                                  message: `"${exp.title}" (${exp.amount} AZN) xərc qeydini sistemdən birdəfəlik silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır.`,
                                  confirmText: 'Bəli, Sil',
                                  danger: true,
                                  onConfirm: () => deleteExpense(exp.id),
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Xərci sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Extra Income Table */}
      {activeSubTab === 'extra' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">
              Əsas Təlimdən Kənar Əlavə Gəlirlər
            </h3>
            <span className="text-xs text-slate-500 font-mono-nums">
              Cəmi: {formatAZN(totalExtra)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Gəlir Mənbəyi</th>
                  <th className="py-3 px-4">Növ</th>
                  <th className="py-3 px-4">Məbləğ</th>
                  <th className="py-3 px-4">Ödəyən</th>
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-4 text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extraIncomes.map(inc => (
                  <tr key={inc.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-semibold text-slate-900">{inc.title}</td>
                    <td className="py-3 px-4 text-slate-600">{inc.source}</td>
                    <td className="py-3 px-4 font-mono-nums font-bold text-emerald-600">
                      +{formatAZN(inc.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inc.payerName}</td>
                    <td className="py-3 px-4 font-mono-nums text-slate-500">
                      {formatDateAz(inc.date)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          confirmAction({
                            title: 'Əlavə Gəlir Qeydini Sil',
                            message: `"${inc.title}" (${inc.amount} AZN) əlavə gəlir qeydini silmək istədiyinizə əminsiniz?`,
                            confirmText: 'Bəli, Sil',
                            danger: true,
                            onConfirm: () => deleteExtraIncome(inc.id),
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Gəliri sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Multi-Branch Comparative Financial Matrix (Superadmin / Direktor) */}
      {activeSubTab === 'matrix' && (() => {
        // Compute matrix per branch
        const branchRows = branches.map(b => {
          const bStudents = students.filter(s => s.branchId === b.id && s.status === 'aktiv');
          const bAllStudents = students.filter(s => s.branchId === b.id);
          const bStudentIds = new Set(bAllStudents.map(s => s.id));

          const bPayments = payments.filter(p => p.branchId === b.id || (!p.branchId && bStudentIds.has(p.studentId)));
          const bTuitionIncome = bPayments.filter(p => p.type === 'telim_haqqi').reduce((acc, p) => acc + p.amount, 0);
          const bOtherPaymentIncome = bPayments.filter(p => p.type !== 'telim_haqqi').reduce((acc, p) => acc + p.amount, 0);
          const bExtraIncomeList = extraIncomes.filter(e => e.branchId === b.id);
          const bExtraIncomeTotal = bExtraIncomeList.reduce((acc, e) => acc + e.amount, 0) + bOtherPaymentIncome;
          const grossRevenue = bTuitionIncome + bExtraIncomeTotal;

          const bExpenses = approvedExpenses.filter(e => e.branchId === b.id).reduce((acc, e) => acc + e.amount, 0);
          const bStaff = staff.filter(s => s.branchId === b.id);
          const bStaffIds = new Set(bStaff.map(st => st.id));
          const bSalaries = trainerSalaries.filter(s => s.branchId ? s.branchId === b.id : bStaffIds.has(s.trainerId)).reduce((acc, s) => acc + s.totalPaid, 0);
          const totalOutflow = bExpenses + bSalaries;
          const netProfit = grossRevenue - totalOutflow;
          const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

          return {
            branch: b,
            activeStudentsCount: bStudents.length,
            totalStudentsCount: bAllStudents.length,
            tuitionIncome: bTuitionIncome,
            extraIncome: bExtraIncomeTotal,
            grossRevenue,
            expenses: bExpenses,
            salaries: bSalaries,
            totalOutflow,
            netProfit,
            margin,
          };
        });

        // Totals across entire network
        const totalNetStudents = branchRows.reduce((acc, r) => acc + r.activeStudentsCount, 0);
        const totalNetTuition = branchRows.reduce((acc, r) => acc + r.tuitionIncome, 0);
        const totalNetExtra = branchRows.reduce((acc, r) => acc + r.extraIncome, 0);
        const totalNetGross = branchRows.reduce((acc, r) => acc + r.grossRevenue, 0);
        const totalNetExpenses = branchRows.reduce((acc, r) => acc + r.expenses, 0);
        const totalNetSalaries = branchRows.reduce((acc, r) => acc + r.salaries, 0);
        const totalNetOutflow = branchRows.reduce((acc, r) => acc + r.totalOutflow, 0);
        const totalNetProfit = totalNetGross - totalNetOutflow;
        const totalAvgMargin = totalNetGross > 0 ? (totalNetProfit / totalNetGross) * 100 : 0;

        const sortedByRevenue = [...branchRows].sort((a, b) => b.grossRevenue - a.grossRevenue);
        const topRevenueBranch = sortedByRevenue[0];
        const sortedByProfit = [...branchRows].sort((a, b) => b.netProfit - a.netProfit);
        const topProfitBranch = sortedByProfit[0];

        return (
          <div className="space-y-6">
            {/* Superadmin Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Şəbəkə Əhatəsi</span>
                  <Building2 className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold font-mono-nums text-slate-900 mt-1">
                  {branches.length} <span className="text-sm font-medium text-slate-500">Filial</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>Aktiv Tələbə: <strong className="text-slate-800">{totalNetStudents}</strong></span>
                  <span>Filial Başına: <strong className="text-slate-800">{Math.round(totalNetStudents / (branches.length || 1))}</strong></span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ümumi Şəbəkə Dövriyyəsi</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono-nums text-slate-900 mt-1">
                  {formatAZN(totalNetGross)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>Təlim: {formatAZN(totalNetTuition)}</span>
                  <span>Əlavə: {formatAZN(totalNetExtra)}</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Ümumi Şəbəkə Xərci</span>
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-bold font-mono-nums text-rose-600 mt-1">
                  {formatAZN(totalNetOutflow)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span>Maaşlar: {formatAZN(totalNetSalaries)}</span>
                  <span>Təsərrüfat: {formatAZN(totalNetExpenses)}</span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Xalis Mənfəət & Marja</span>
                  <Award className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold font-mono-nums text-emerald-600 mt-1">
                  {formatAZN(totalNetProfit)}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                  <span className="text-emerald-700 font-semibold">Orta Rentabellik:</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {totalAvgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Highlights Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <Target className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Superadmin Vahid Maliyyə Matrisi</h4>
                  <p className="text-xs text-slate-300">
                    Bütün filialların gəlir, əməkhaqqı, təsərrüfat xərcləri və rentabellik marjası tək ekranda müqayisəli şəkildə əks olunur.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {topRevenueBranch && (
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Lider Filial (Dövriyyə):</span>
                    <strong className="text-white">{topRevenueBranch.branch.name} ({formatAZN(topRevenueBranch.grossRevenue)})</strong>
                  </div>
                )}
                {topProfitBranch && (
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Lider Filial (Mənfəət):</span>
                    <strong className="text-emerald-300">{topProfitBranch.branch.name} ({formatAZN(topProfitBranch.netProfit)})</strong>
                  </div>
                )}
              </div>
            </div>

            {/* The Master Financial Matrix Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Filiallar üzrə Müqayisəli Maliyyə Cədvəli</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hər filial üzrə təlim haqqı gəliri, əlavə gəlir, xərc maddələri, maaş fondu və xalis mənfəət bölgüsü.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const matrixExport = branchRows.map(r => ({
                      Filial: r.branch.name,
                      Kod: r.branch.code || '-',
                      Unvan: r.branch.address || '-',
                      AktivTelebe: r.activeStudentsCount,
                      TelimHaqqiAZN: r.tuitionIncome,
                      ElaveGelirAZN: r.extraIncome,
                      UmumiDovriyyeAZN: r.grossRevenue,
                      XerclerAZN: r.expenses,
                      MaasFonduAZN: r.salaries,
                      UmumiXercAZN: r.totalOutflow,
                      XalisMenfeetAZN: r.netProfit,
                      RentabellikFaizi: `${r.margin.toFixed(1)}%`,
                    }));
                    exportToCSV(`AREA_Filiallar_Maliyye_Matrisi_${new Date().toISOString().split('T')[0]}`, matrixExport);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Excel / CSV İxrac</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 min-w-[200px]">Filial Adı & Ünvanı</th>
                      <th className="py-3 px-4 text-center">Aktiv Tələbə</th>
                      <th className="py-3 px-4 text-right">Təlim Haqqı</th>
                      <th className="py-3 px-4 text-right">Əlavə Gəlir</th>
                      <th className="py-3 px-4 text-right font-bold text-slate-900 bg-slate-100/50">Ümumi Dövriyyə</th>
                      <th className="py-3 px-4 text-right">Təsərrüfat Xərci</th>
                      <th className="py-3 px-4 text-right">Əməkhaqqı Fondu</th>
                      <th className="py-3 px-4 text-right font-bold text-rose-700 bg-rose-50/30">Ümumi Xərc</th>
                      <th className="py-3 px-4 text-right font-bold">Xalis Mənfəət</th>
                      <th className="py-3 px-4 text-center">Rentabellik (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {branchRows.map(row => {
                      const shareOfGross = totalNetGross > 0 ? (row.grossRevenue / totalNetGross) * 100 : 0;
                      return (
                        <tr key={row.branch.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0 mt-0.5">
                                {row.branch.name.slice(0, 1)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">{row.branch.name}</span>
                                <span className="text-[11px] text-slate-400 block truncate max-w-[220px]">
                                  {row.branch.address || 'Ünvan daxil edilməyib'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono-nums font-semibold text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              {row.activeStudentsCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-nums text-slate-700">
                            {formatAZN(row.tuitionIncome)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-nums text-slate-600">
                            {row.extraIncome > 0 ? `+${formatAZN(row.extraIncome)}` : '0 AZN'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-nums font-bold text-slate-900 bg-slate-100/50">
                            <div>{formatAZN(row.grossRevenue)}</div>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {shareOfGross.toFixed(1)}% pay
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-nums text-rose-600">
                            {row.expenses > 0 ? `-${formatAZN(row.expenses)}` : '0 AZN'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-nums text-indigo-600">
                            {row.salaries > 0 ? `-${formatAZN(row.salaries)}` : '0 AZN'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-nums font-bold text-rose-600 bg-rose-50/30">
                            -{formatAZN(row.totalOutflow)}
                          </td>
                          <td className={`py-3.5 px-4 text-right font-mono-nums font-bold ${
                            row.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                            {row.netProfit >= 0 ? `+${formatAZN(row.netProfit)}` : formatAZN(row.netProfit)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.margin >= 30
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.margin >= 15
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : row.margin > 0
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {row.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td className="py-4 px-4 text-xs uppercase tracking-wider text-slate-900">
                        YEKUN CƏM (Bütün Filiallar)
                      </td>
                      <td className="py-4 px-4 text-center font-mono-nums text-xs">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 border border-indigo-200">
                          {totalNetStudents}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs">
                        {formatAZN(totalNetTuition)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs">
                        +{formatAZN(totalNetExtra)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs text-indigo-950 bg-slate-200/60">
                        {formatAZN(totalNetGross)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs text-rose-700">
                        -{formatAZN(totalNetExpenses)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs text-indigo-700">
                        -{formatAZN(totalNetSalaries)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs text-rose-800 bg-rose-100/50">
                        -{formatAZN(totalNetOutflow)}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-nums text-xs text-emerald-700">
                        +{formatAZN(totalNetProfit)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                          {totalAvgMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Turnover Contribution Progress Bars */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Filialların Ümumi Şəbəkə Dövriyyəsindəki Payı (%)
                </h4>
                <span className="text-[11px] text-slate-400">100% Cəmi: {formatAZN(totalNetGross)}</span>
              </div>
              <div className="space-y-2">
                {branchRows.map(row => {
                  const share = totalNetGross > 0 ? (row.grossRevenue / totalNetGross) * 100 : 0;
                  return (
                    <div key={row.branch.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{row.branch.name}</span>
                        <span className="font-mono-nums text-slate-500">
                          {formatAZN(row.grossRevenue)} ({share.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(2, share))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Record Student Payment */}
      {showPaymentModal && (() => {
        const selectedStudent = students.find(s => s.id === payStudentId) || students[0];
        const studentContracts = contracts.filter(c => c.studentId === selectedStudent?.id && c.status === 'aktiv');
        const activeContract = contracts.find(c => c.id === payContractId) || studentContracts[0];
        const baseMonthlyFee = activeContract?.monthlyFee || selectedStudent?.monthlyFee || 260;

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Tələbə Ödəniş Qeydiyyatı</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aylıq təhsil haqqının qəbulu və kassa qəbzi formalaşdırılması.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
                {/* 1. Select Student */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ödəyən Tələbə:
                  </label>
                  <select
                    value={payStudentId}
                    onChange={e => handleStudentSelectChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} {s.finCode ? `(FİN: ${s.finCode})` : ''} · Balans: {s.balance} ₼
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Select Program / Contract if student has contracts */}
                {studentContracts.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ödəniş Edilən Proqram / Müqavilə:
                    </label>
                    <select
                      value={payContractId || studentContracts[0]?.id}
                      onChange={e => handleContractSelectChange(e.target.value)}
                      className="w-full bg-indigo-50/60 border border-indigo-200 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-950"
                    >
                      {studentContracts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.courseName} ({c.groupName || 'Fərdi'}) · Standart: {c.monthlyFee} AZN · Ayda {c.lessonsPerMonth || 8} dərs
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Automatic Fee & Debt Status Banner */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Standart Aylıq Ödəniş:</span>
                    <span className="font-bold text-slate-900 font-mono-nums text-sm">
                      {formatAZN(baseMonthlyFee)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Cari Borc / Balans:</span>
                    <span className={`font-bold font-mono-nums text-sm ${
                      (selectedStudent?.balance || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {selectedStudent?.balance || 0} AZN
                    </span>
                  </div>
                </div>

                {/* 4. Discount & Payable Amount Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cari Ay üçün Endirim (AZN):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={baseMonthlyFee}
                      step="5"
                      value={payDiscount || ''}
                      placeholder="0 AZN"
                      onChange={e => handleDiscountChange(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Aksiya və ya qardaş/bacı güzəşti
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ödənilən Yekun Məbləğ (AZN):
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="5"
                      required
                      value={payAmount}
                      onChange={e => setPayAmount(Number(e.target.value))}
                      className="w-full bg-emerald-50/60 border border-emerald-300 rounded-lg px-3 py-2 text-xs font-mono-nums font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                      {payDiscount > 0 ? `${baseMonthlyFee} - ${payDiscount} = ${payAmount} AZN` : 'Avtomatik hazır məbləğ'}
                    </span>
                  </div>
                </div>

                {/* 5. Payment Method & Note */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ödəniş Üsulu:
                    </label>
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="Nagd">Nağd</option>
                      <option value="Bank karti">Bank Kartı (POS)</option>
                      <option value="eManat/MilliOn">eManat / MilliÖn</option>
                      <option value="Hesaba kocurme">Bank Köçürməsi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ödəniş Növü:
                    </label>
                    <select
                      value={payType}
                      onChange={e => setPayType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="telim_haqqi">Təlim Haqqı</option>
                      <option value="derslik">Dərslik / Avadanlıq</option>
                      <option value="imtahan">İmtahan Rüsumu</option>
                      <option value="diger">Digər</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qeyd / Təyinat:
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                    placeholder="Məs: Mart ayı təlim haqqı"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    İmtina
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Ödənişi Qəbul Et və Qəbz Aç</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal: New Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Yeni Şirkət Xərci
            </h3>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Xərcin Təsviri:
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: Ofis üçün yeni kompüter monitoru"
                  value={expTitle}
                  onChange={e => setExpTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kateqoriya:
                  </label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="icare">İcarə Haqqı</option>
                    <option value="kommunal">Kommunal & İnternet</option>
                    <option value="reklam">Reklam & Marketinq</option>
                    <option value="ofis_levazimati">Ofis Ləvazimatı</option>
                    <option value="avadanliq">Avadanlıq & İT</option>
                    <option value="vergi">Vergi & Dövlət Rüsumu</option>
                    <option value="diger">Digər</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Məbləğ (AZN):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expAmount}
                    onChange={e => setExpAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ödənilən Şirkət / Şəxs:
                  </label>
                  <input
                    type="text"
                    placeholder="məs: Kontakt Home"
                    value={expPaidTo}
                    onChange={e => setExpPaidTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Məsul Əməkdaş:
                  </label>
                  <select
                    value={expResponsible}
                    onChange={e => setExpResponsible(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Receipt Upload & Management Section */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Qəbz / Kassa Çeki / Faktura Sənədi</span>
                  </label>
                  {expReceiptUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpReceiptUrl('');
                        setExpReceiptFile('');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Qəbzi Sil
                    </button>
                  )}
                </div>

                {!expReceiptUrl ? (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white rounded-lg p-3.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                      <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 mb-1 transition-colors" />
                      <span className="text-xs font-semibold text-indigo-600">
                        Qəbzi yükləmək üçün klikləyin və ya faylı bura atın
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, JPEG və ya PDF (Kassa çeki, qaimə, bank invoysu)
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleReceiptFileChange}
                        className="hidden"
                      />
                    </label>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleAttachDemoReceipt}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        <span>Nümunəvi rəsmi çek qoş</span>
                      </button>
                      <span className="text-[10px] text-slate-400">və ya öz sənədinizi seçin</span>
                    </div>

                    {/* Strict Warning Banner for Missing Receipt */}
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Qəbzsiz Ödəniş Xəbərdarlığı:</span>
                      </div>
                      <p className="text-amber-800 leading-relaxed">
                        Qəbz yüklənmədikdə bu xərc <strong>rəhbərlik (direktor) tərəfindən xüsusi təsdiq edilmədən qəbul olunmur</strong> və şirkətin rəsmi xərclər balansına daxil edilmir!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                      {expReceiptUrl.startsWith('data:image') || expReceiptUrl.startsWith('http') ? (
                        <img
                          src={expReceiptUrl}
                          alt="Qəbz önbaxışı"
                          className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {expReceiptFile || 'resmi_qebz_senedi.jpg'}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle className="w-3 h-3" /> Qəbz təqdim olundu
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Rəsmi qəbz mövcud olduğu üçün xərc avtomatik təsdiqlənmiş qəbul ediləcək.</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeyd / Əsaslandırma:
                </label>
                <input
                  type="text"
                  placeholder="məs: Təcili ofis ehtiyacı üçün nağdsız ödəniş..."
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
                >
                  Xərci Təsdiqlə
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Extra Income */}
      {showExtraIncomeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Əlavə Gəlir Daxil Et
            </h3>

            <form onSubmit={handleAddExtraIncomeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gəlirin Təsviri:
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: Master-klass iştirak haqqı"
                  value={incTitle}
                  onChange={e => setIncTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gəlir Növü:
                  </label>
                  <select
                    value={incSource}
                    onChange={e => setIncSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="kitab_derslik">Kitab / Dərslik satışı</option>
                    <option value="master_klass">Master-klass / Vorkşop</option>
                    <option value="kovorkinq">Kovorkinq icarəsi</option>
                    <option value="imtahan_rusumu">İmtahan rüsumu</option>
                    <option value="diger">Digər gəlir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Məbləğ (AZN):
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={incAmount}
                    onChange={e => setIncAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ödəyən Şəxs / Təşkilat:
                </label>
                <input
                  type="text"
                  placeholder="məs: İştirakçılar qrupu"
                  value={incPayer}
                  onChange={e => setIncPayer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExtraIncomeModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Gəliri Qeyd Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Receipt View, Print & Direct WhatsApp Actions */}
      {printedReceipt && (() => {
        const student = students.find(s => s.id === printedReceipt.studentId);
        const parentPhoneRaw = printedReceipt.parentPhone || student?.parentPhone || student?.phone;
        const cleanParentPhone = cleanPhoneForWa(parentPhoneRaw);

        const currentGroup = groups.find(g => g.id === printedReceipt.groupId || g.name === printedReceipt.groupName);
        const trainerMember = staff.find(st => st.id === currentGroup?.trainerId || st.fullName === currentGroup?.trainerName || st.phone === printedReceipt.trainerPhone);
        const trainerPhoneRaw = printedReceipt.trainerPhone || trainerMember?.phone;
        const cleanTrainerPhone = cleanPhoneForWa(trainerPhoneRaw);
        const trainerName = printedReceipt.trainerName || currentGroup?.trainerName || trainerMember?.fullName || 'Təlimçi';

        const parentMsg = `Hörmətli valideyn!\nAREA Robototexnika və İnnovasiya Mərkəzi tərəfindən rəsmi ödəniş qəbul edilmişdir:\n• Tələbə: ${printedReceipt.studentName}\n• Tədris Proqramı: ${printedReceipt.groupName}\n• Qəbul Edilən Məbləğ: ${printedReceipt.amount} AZN${printedReceipt.discountAmount ? ` (Tətbiq edilən endirim: ${printedReceipt.discountAmount} AZN)` : ''}\n• Qəbz №: ${printedReceipt.receiptNumber}\n• Tarix: ${printedReceipt.date}\n• Ödəniş Üsulu: ${printedReceipt.method}\n\nÖdəniş üçün təşəkkür edirik!\nAREA Academy Tədris İnzibatçılığı`;
        const parentWaUrl = cleanParentPhone ? `https://wa.me/${cleanParentPhone}?text=${encodeURIComponent(parentMsg)}` : '';

        const trainerMsg = `Salam ${trainerName} müəllim!\nMəlumat üçün bildiririk ki, tədris etdiyiniz «${printedReceipt.groupName}» qrupunun tələbəsi «${printedReceipt.studentName}» cari ay üçün ${printedReceipt.amount} AZN təhsil haqqı ödənişini tamamladı.\n• Qəbz №: ${printedReceipt.receiptNumber}\n• Tarix: ${printedReceipt.date}\n\nAREA Tədris İdarəetmə`;
        const trainerWaUrl = cleanTrainerPhone ? `https://wa.me/${cleanTrainerPhone}?text=${encodeURIComponent(trainerMsg)}` : '';

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-sm text-slate-900">
                    Ödəniş Təsdiqi və WhatsApp Bildirişləri
                  </span>
                </div>
                <button
                  onClick={() => setPrintedReceipt(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕ Bağla
                </button>
              </div>

              {/* Official Receipt Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 text-xs">
                <div className="text-center pb-2 border-b border-slate-200">
                  <p className="font-bold text-base text-slate-900">AREA ACADEMY MMC</p>
                  <p className="text-[11px] text-slate-500 font-mono-nums">
                    Qəbz №: {printedReceipt.receiptNumber} · {formatDateAz(printedReceipt.date)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tələbə:</span>
                    <span className="font-bold text-slate-900">{printedReceipt.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tədris Qrupu / Proqram:</span>
                    <span className="font-medium text-slate-800">{printedReceipt.groupName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ödəniş Üsulu:</span>
                    <span className="text-slate-800">{printedReceipt.method}</span>
                  </div>
                  {printedReceipt.discountAmount && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Tətbiq Edilən Endirim:</span>
                      <span className="font-mono-nums font-semibold">-{printedReceipt.discountAmount} AZN</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                    <span className="font-bold text-slate-900">Ödənilmiş Məbləğ:</span>
                    <span className="font-bold font-mono-nums text-emerald-600 text-base">
                      {formatAZN(printedReceipt.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Action Buttons Grid */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Birbaşa WhatsApp Bildirişləri:
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    1 toxunuşla göndər
                  </span>
                </div>

                {/* 1. Parent WhatsApp Receipt Button */}
                <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-emerald-950">Valideynə Qəbz Göndər</span>
                      {cleanParentPhone ? (
                        <span className="font-mono text-[10px] text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded font-semibold">
                          +{cleanParentPhone}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                          Nömrə qeyd olunmayıb
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Rəsmi qəbz rekvizitləri və təşəkkür bildirişi
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                    {cleanParentPhone ? (
                      <button
                        type="button"
                        onClick={() => window.open(parentWaUrl, '_blank')}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp Qəbz Aç</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </button>
                    ) : null}

                    <button
                      type="button"
                      title="Mətni kopyala"
                      onClick={() => {
                        navigator.clipboard.writeText(parentMsg);
                        setCopiedReceiptText(true);
                        setTimeout(() => setCopiedReceiptText(false), 2000);
                        showToast('Valideyn qəbz mətni kopyalandı');
                      }}
                      className="px-2 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedReceiptText ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* 2. Trainer WhatsApp Notification Button */}
                <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-indigo-950">Təlimçiyə Məlumat Göndər</span>
                      {cleanTrainerPhone ? (
                        <span className="font-mono text-[10px] text-indigo-800 bg-indigo-100/80 px-1.5 py-0.2 rounded font-semibold">
                          {trainerName} (+{cleanTrainerPhone})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-medium">
                          {trainerName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-800 mt-0.5">
                      Tələbənin ödənişi etdiyi barədə müəllimə avtomatik məlumat
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                    {cleanTrainerPhone ? (
                      <button
                        type="button"
                        onClick={() => window.open(trainerWaUrl, '_blank')}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Təlimçiyə Göndər</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const customUrl = `https://wa.me/?text=${encodeURIComponent(trainerMsg)}`;
                          window.open(customUrl, '_blank');
                        }}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>WhatsApp Aç</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Mətni kopyala"
                      onClick={() => {
                        navigator.clipboard.writeText(trainerMsg);
                        setCopiedTrainerText(true);
                        setTimeout(() => setCopiedTrainerText(false), 2000);
                        showToast('Təlimçi bildiriş mətni kopyalandı');
                      }}
                      className="px-2 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedTrainerText ? <CheckCheck className="w-3.5 h-3.5 text-indigo-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message Preview Accordion */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-800 block">WhatsApp Şablon İcmalı:</span>
                <p className="line-clamp-2 italic text-slate-500">
                  "{parentMsg.slice(0, 110)}..."
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPrintedReceipt(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  Bağla
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Qəbzi Çap Et</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Detailed Salary Breakdown & Payslip */}
      {selectedSalaryForSlip && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Maaşın Hesablama və Kalkulyasiya Vərəqəsi
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-700 font-semibold">
                    {selectedSalaryForSlip.trainerName} ({selectedSalaryForSlip.role || 'Təlimçi'})
                  </span>
                  {selectedSalaryForSlip.branchName && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                      📍 {selectedSalaryForSlip.branchName.replace('AREA ', '')}
                    </span>
                  )}
                  {selectedSalaryForSlip.employmentType && (
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                      {selectedSalaryForSlip.employmentType === 'full_stat'
                        ? 'Full ştat · 40 saat'
                        : selectedSalaryForSlip.employmentType === 'yarim_stat'
                        ? 'Yarım ştat · 20 saat'
                        : selectedSalaryForSlip.employmentType === 'saatliq'
                        ? 'Saatlıq qrafik'
                        : 'Fərdi qrafik'}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-mono-nums">· {selectedSalaryForSlip.month}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSalaryForSlip(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Step-by-Step Payslip Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 text-xs">
              {/* 1. Baza */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <div>
                  <span className="font-bold text-slate-800 block">1. Baza Əməkhaqqı</span>
                  <span className="text-[11px] text-slate-500">
                    Model: {selectedSalaryForSlip.calcType === 'sabit'
                      ? 'Sabit Aylıq Maaş'
                      : selectedSalaryForSlip.calcType === 'faiz'
                      ? `%${selectedSalaryForSlip.baseRate} Tədris Qrup Gəlirindən`
                      : `Saatlıq (${selectedSalaryForSlip.baseRate} ₼/saat × ${selectedSalaryForSlip.workedHoursTotal || 30} saat)`}
                  </span>
                </div>
                <span className="font-bold font-mono-nums text-slate-900 text-sm">
                  +{formatAZN(selectedSalaryForSlip.calculatedAmount || selectedSalaryForSlip.baseRate)}
                </span>
              </div>

              {/* 2. Davamiyyət */}
              <div className="space-y-1.5 pb-2 border-b border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">2. QR Davamiyyət İntizamı Təsiri</span>
                    <span className="text-[11px] text-slate-500">
                      {selectedSalaryForSlip.employmentType === 'saatliq'
                        ? `Norma: ${selectedSalaryForSlip.normHoursTotal ?? 30} saat · Faktiki: ${selectedSalaryForSlip.workedHoursTotal ?? 30} saat (%${selectedSalaryForSlip.attendanceRate ?? 100})`
                        : `Norma: ${selectedSalaryForSlip.workDaysTotal ?? 22} gün · İştirak: ${selectedSalaryForSlip.workDaysAttended ?? 22} gün (%${selectedSalaryForSlip.attendanceRate ?? 100})`}
                    </span>
                  </div>
                  {selectedSalaryForSlip.attendanceBonus > 0 ? (
                    <span className="font-bold font-mono-nums text-emerald-600">
                      +{formatAZN(selectedSalaryForSlip.attendanceBonus)}
                    </span>
                  ) : selectedSalaryForSlip.attendanceDeduction > 0 ? (
                    <span className="font-bold font-mono-nums text-rose-600">
                      -{formatAZN(selectedSalaryForSlip.attendanceDeduction)}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono-nums">0 AZN</span>
                  )}
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200/60 space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Qayıb (icazəsiz buraxılmış):</span>
                    <span className={selectedSalaryForSlip.absentCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                      {selectedSalaryForSlip.absentCount} gün {selectedSalaryForSlip.absentCount > 0 && `(-${formatAZN(selectedSalaryForSlip.absentCount * Math.round(selectedSalaryForSlip.calculatedAmount / (selectedSalaryForSlip.workDaysTotal || 22)))})`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gecikmələr:</span>
                    <span className={selectedSalaryForSlip.lateCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                      {selectedSalaryForSlip.lateCount} dəfə {selectedSalaryForSlip.lateCount > 0 && `(-${formatAZN(selectedSalaryForSlip.lateCount * 10)})`}
                    </span>
                  </div>
                  {selectedSalaryForSlip.attendanceBonus > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>100% Vaxtında QR İntizam Bonusu:</span>
                      <span>+{formatAZN(selectedSalaryForSlip.attendanceBonus)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. KPI Təsiri */}
              <div className="space-y-1.5 pb-2 border-b border-slate-200/80">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">3. KPI Performans və İcraat Təsiri</span>
                    <span className="text-[11px] text-slate-500">
                      Yekun Bal: %{selectedSalaryForSlip.kpiScore ?? 100} · Dərəcə: {selectedSalaryForSlip.kpiGrade || 'A'}
                    </span>
                  </div>
                  {selectedSalaryForSlip.kpiBonus > 0 ? (
                    <span className="font-bold font-mono-nums text-emerald-600">
                      +{formatAZN(selectedSalaryForSlip.kpiBonus)}
                    </span>
                  ) : selectedSalaryForSlip.kpiPenalty > 0 ? (
                    <span className="font-bold font-mono-nums text-rose-600">
                      -{formatAZN(selectedSalaryForSlip.kpiPenalty)}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono-nums">0 AZN</span>
                  )}
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">KPI dərəcəsinə görə stimul əlavəsi:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSalaryForSlip.kpiGrade === 'A+' ? 'A+ (Maksimal hədəf üstü: +150 ₼)' :
                     selectedSalaryForSlip.kpiGrade === 'A' ? 'A (Hədəf tamamlandı: +120 ₼)' :
                     selectedSalaryForSlip.kpiGrade === 'B' ? 'B (Qənaətbəxş: +40 ₼)' : 'C (Hədəfdən kəsir: -50 ₼)'}
                  </span>
                </div>
              </div>

              {/* 4. Digər Bonus / Cərimə */}
              {(selectedSalaryForSlip.bonus > 0 || selectedSalaryForSlip.penalty > 0) && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <span className="font-bold text-slate-800">4. Digər Əlavə / Tutulma</span>
                  <div className="font-mono-nums">
                    {selectedSalaryForSlip.bonus > 0 && (
                      <span className="text-emerald-600 font-bold">+{formatAZN(selectedSalaryForSlip.bonus)} </span>
                    )}
                    {selectedSalaryForSlip.penalty > 0 && (
                      <span className="text-rose-600 font-bold">-{formatAZN(selectedSalaryForSlip.penalty)}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Yekun Net */}
              <div className="pt-2 flex items-center justify-between text-sm">
                <div>
                  <span className="font-bold text-slate-900 block">Yekun Xalis Ödəniləcək Maaş:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Status: {selectedSalaryForSlip.status === 'odenilib' ? 'Ödənilib' : 'Ödəniş gözləyir'}
                  </span>
                </div>
                <span className="text-xl font-bold font-mono-nums text-indigo-600">
                  {formatAZN(selectedSalaryForSlip.totalPaid)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedSalaryForSlip(null);
                  setActiveTab('kpi');
                }}
                className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5" />
                <span>KPI Hesabatına Keç</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedSalaryForSlip.status === 'gozleyir' && (
                  <button
                    onClick={() => {
                      payTrainerSalary(selectedSalaryForSlip.id);
                      setSelectedSalaryForSlip(prev => prev ? { ...prev, status: 'odenilib', paymentDate: new Date().toISOString().split('T')[0] } : null);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Ödənişi Təsdiq Et
                  </button>
                )}
                <button
                  onClick={() => setSelectedSalaryForSlip(null)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Bağla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Salary Record */}
      {showNewSalaryModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Yeni Əməkhaqqı Qeydi və Kalkulyasiyası
              </h3>
              <button
                onClick={() => setShowNewSalaryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetStaff = staff.find(s => s.id === newSalaryStaffId) || staff[0];
                if (!targetStaff) {
                  showToast('Əməkdaş seçilməyib və ya heç bir əməkdaş mövcud deyil', 'error');
                  return;
                }
                const matchingKpi = staffKpis.find(k => (k.staffId === targetStaff.id || k.staffName === targetStaff.fullName) && k.month === newSalaryMonth);

                const kpiScore = matchingKpi ? matchingKpi.totalScore : 100;
                const kpiGrade = matchingKpi ? matchingKpi.grade : 'A';
                const kpiBonus = matchingKpi ? matchingKpi.kpiBonusAmount : 100;
                const kpiPenalty = matchingKpi ? matchingKpi.kpiPenaltyAmount : 0;

                const totalPaid = Math.max(0, newSalaryBase + kpiBonus - kpiPenalty + newSalaryBonus - newSalaryPenalty);

                addOrUpdateSalary({
                  id: `ts-${targetStaff.id}-${newSalaryMonth}-${Date.now().toString().slice(-4)}`,
                  trainerId: targetStaff.id,
                  trainerName: targetStaff.fullName,
                  role: targetStaff.role,
                  month: newSalaryMonth,
                  calcType: newSalaryCalcType,
                  baseRate: newSalaryBase,
                  calculatedAmount: newSalaryBase,
                  workDaysTotal: 22,
                  workDaysAttended: 22,
                  lateCount: 0,
                  absentCount: 0,
                  attendanceRate: 100,
                  attendanceDeduction: 0,
                  attendanceBonus: 50,
                  kpiScore,
                  kpiGrade,
                  kpiBonus,
                  kpiPenalty,
                  bonus: newSalaryBonus,
                  penalty: newSalaryPenalty,
                  totalPaid,
                  status: 'gozleyir',
                  groupsHandled: [targetStaff.role === 'Təlimçi' ? 'Tədris Qrupu' : 'Filial İdarəetmə'],
                  notes: newSalaryNotes || `KPI Dərəcə: ${kpiGrade} (${kpiScore}%)`
                });

                setShowNewSalaryModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Əməkdaş:
                </label>
                <select
                  value={newSalaryStaffId}
                  onChange={e => {
                    setNewSalaryStaffId(e.target.value);
                    const selected = staff.find(s => s.id === e.target.value);
                    if (selected) setNewSalaryBase(selected.salary);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.role} · {s.salary} ₼)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hesabat Ayı:
                  </label>
                  <select
                    value={newSalaryMonth}
                    onChange={e => setNewSalaryMonth(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="2026-03">2026 Mart</option>
                    <option value="2026-04">2026 Aprel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hesablama Növü:
                  </label>
                  <select
                    value={newSalaryCalcType}
                    onChange={e => setNewSalaryCalcType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                  >
                    <option value="sabit">Sabit Aylıq</option>
                    <option value="faiz">Qrup Faiz (%)</option>
                    <option value="saatliq">Saatlıq</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Baza Məbləğ (AZN):
                </label>
                <input
                  type="number"
                  value={newSalaryBase}
                  onChange={e => setNewSalaryBase(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono-nums font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Digər Bonus (AZN):
                  </label>
                  <input
                    type="number"
                    value={newSalaryBonus}
                    onChange={e => setNewSalaryBonus(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Digər Cərimə (AZN):
                  </label>
                  <input
                    type="number"
                    value={newSalaryPenalty}
                    onChange={e => setNewSalaryPenalty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeyd:
                </label>
                <input
                  type="text"
                  placeholder="Məs. Əlavə qrup saatları..."
                  value={newSalaryNotes}
                  onChange={e => setNewSalaryNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewSalaryModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:text-slate-800"
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                >
                  Əməkhaqqı Qeydini Yarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Receipt & Approval Details */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Xərc Qəbzi & Təsdiq Sənədi
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptForPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Receipt Image / Document Preview */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 flex flex-col items-center justify-center min-h-56">
                {selectedReceiptForPreview.receiptUrl ? (
                  <img
                    src={selectedReceiptForPreview.receiptUrl}
                    alt="Qəbz sənədi"
                    className="max-h-72 w-auto object-contain rounded-lg shadow-xs"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">
                      {selectedReceiptForPreview.receiptFile || 'Qəbz faylı mövcud deyil'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fayl növü: PDF və ya rəsmi sənəd
                    </p>
                  </div>
                )}
              </div>

              {/* Expense Details Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-start pb-2 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Xərcin Təyinatı:
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                      {selectedReceiptForPreview.title}
                    </h4>
                    {selectedReceiptForPreview.branchName && (
                      <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                        📍 {selectedReceiptForPreview.branchName}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Məbləğ:
                    </span>
                    <span className="text-base font-bold font-mono-nums text-rose-600 block mt-0.5">
                      -{formatAZN(selectedReceiptForPreview.amount)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="text-slate-400 font-medium">Kateqoriya:</span>{' '}
                    <span className="font-semibold text-slate-800">{selectedReceiptForPreview.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Ödənilən:</span>{' '}
                    <span className="font-semibold text-slate-800">{selectedReceiptForPreview.paidTo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Məsul şəxs:</span>{' '}
                    <span className="font-semibold text-slate-800">{selectedReceiptForPreview.responsiblePerson}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Tarix:</span>{' '}
                    <span className="font-mono-nums text-slate-800">{formatDateAz(selectedReceiptForPreview.date)}</span>
                  </div>
                </div>

                {selectedReceiptForPreview.notes && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 font-medium block">Qeyd:</span>
                    <p className="text-slate-700 italic mt-0.5">{selectedReceiptForPreview.notes}</p>
                  </div>
                )}
              </div>

              {/* Status and Verification Box */}
              <div className="p-3.5 rounded-xl border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rəhbərlik Təsdiq Statusu:
                </span>

                {selectedReceiptForPreview.approvalStatus === 'tesdiqlendi' ? (
                  <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Təsdiq Edilib və Qəbul Olunub</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Təsdiq edən: {selectedReceiptForPreview.approvedBy || 'Sistem (Qəbz əsasında)'} · {selectedReceiptForPreview.approvedAt || selectedReceiptForPreview.date}
                      </p>
                      {selectedReceiptForPreview.approvalNotes && (
                        <p className="text-[10px] text-emerald-600 italic mt-0.5">{selectedReceiptForPreview.approvalNotes}</p>
                      )}
                    </div>
                  </div>
                ) : selectedReceiptForPreview.approvalStatus === 'imtina' ? (
                  <div className="flex items-start gap-2 text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Rəhbərlik tərəfindən imtina edilib</p>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        {selectedReceiptForPreview.approvalNotes || 'Qəbz təqdim olunmadığı üçün qəbul edilməyib.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-300">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs">Rəhbərlik Təsdiqi Gözlənilir</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Bu xərc üçün qəbz təqdim olunmayıb və ya əlavə rəhbərlik rəsmi razılığı tələb olunur. Təsdiq olunmadan xərc kimi qəbul olunmur.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              {/* Leadership approval buttons inside modal if pending */}
              {selectedReceiptForPreview.approvalStatus === 'gozleyir' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const target = selectedReceiptForPreview;
                      confirmAction({
                        title: 'Qəbzsiz Xərci Təsdiqlə',
                        message: `"${target.title}" (${target.amount} AZN) xərcini rəsmi olaraq təsdiqləmək və qəbul etmək istəyirsiniz?`,
                        confirmText: 'Bəli, Təsdiq Et',
                        danger: false,
                        onConfirm: () => {
                          approveExpense(target.id);
                          setSelectedReceiptForPreview(null);
                        },
                      });
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Rəhbərlik Təsdiqini Ver</span>
                  </button>

                  <button
                    onClick={() => {
                      const target = selectedReceiptForPreview;
                      confirmAction({
                        title: 'Xərcdən İmtina Et',
                        message: `"${target.title}" xərcindən qəbz olmadığı üçün imtina etmək istəyirsiniz?`,
                        confirmText: 'İmtina Et',
                        danger: true,
                        onConfirm: () => {
                          rejectExpense(target.id);
                          setSelectedReceiptForPreview(null);
                        },
                      });
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>İmtina Et</span>
                  </button>
                </div>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedReceiptForPreview(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
