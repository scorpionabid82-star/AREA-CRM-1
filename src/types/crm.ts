export type Role = 'direktor' | 'menecer' | 'telimci' | 'sagird' | 'texnobaba_meneceri';

export type EmploymentType = 'full_stat' | 'yarim_stat' | 'saatliq' | 'ferdi';
export type SalaryCalcType = 'sabit' | 'saatliq' | 'faiz' | 'kombine';

export interface TrainerBranchAssignment {
  branchId: string;
  branchName: string;
  employmentType?: EmploymentType; // 'full_stat' | 'yarim_stat' | 'saatliq' | 'ferdi'
  workSchedule: string; // Məs: 'B.e / Çər / Cüm · 10:00 - 18:00'
  weeklyHours?: number; // 40 (full), 20 (yarım), və ya saatlıq norma
  baseSalary?: number; // Filial üzrə fərdi baza maaşı
  calcType?: SalaryCalcType; // 'sabit' | 'saatliq' | 'faiz' | 'kombine'
  baseRate?: number; // Sabit AZN, saatlıq AZN/saat və ya faiz %
  isPrimary?: boolean;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  photoURL?: string;
  avatarUrl?: string;
  branchId?: string;
  branchName?: string;
  assignedBranchIds?: string[]; // Təlimçinin təhkim olunduğu filialların ID-ləri
  isSuperAdmin?: boolean;
  status: 'aktiv' | 'bloklanib' | 'dondurulub' | 'silinib';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  lastLogin?: string;
  linkedEntityId?: string;
  notes?: string;
  customPermissions?: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>>;
}

export interface Student {
  id: string;
  fullName: string;
  phone: string;
  parentPhone?: string;
  email: string;
  branchId?: string;
  branchName?: string;
  groupId: string;
  groupName: string;
  courseName: string;
  status: 'aktiv' | 'mezun' | 'dondurulub' | 'xaric' | 'silinib';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  balance: number; // positive = advance, negative = debt
  monthlyFee: number;
  currentMonthDebt?: number; // Cari ay üçün yaranan borc
  lastDebtCreatedAt?: string;
  enrollmentDate: string;
  finCode?: string; // FİN kod və ya ŞV nömrəsi (təkrarlanmanın qarşısını almaq üçün unikal)
  birthDate?: string;
  age?: number | string; // Tələbənin yaşı və ya təvəllüdü
  notes?: string;
  attendanceRate: number; // 0-100
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  branchId?: string;
  branchName?: string;
  trainerId: string;
  trainerName: string;
  schedule: string; // e.g., 'B.e / Çər / Cüm 19:00 - 21:00'
  lessonDays?: number[]; // [1, 3, 5] where 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 0 = Sun
  lessonStartTime?: string; // '19:00'
  lessonEndTime?: string; // '21:00'
  room: string;
  capacity: number;
  currentStudents: number;
  trainerPayPerLesson?: number; // Dərsbaşı baza ödəniş (AZN, default 15)
  bonusPerStudentOver6?: number; // 6 uşaqdan yuxarı hər şagirdə görə əlavə bonus (AZN, default 2)
  startDate: string;
  endDate: string;
  status: 'yeni' | 'davam_edir' | 'tamamlandi' | 'silinib';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  currentModuleId?: string;
  progressPercent: number;
}

export type LeadSource =
  | 'Instagram'
  | 'TikTok'
  | 'WhatsApp'
  | 'Tövsiyə'
  | 'Birbaşa gəliş'
  | 'Onlayn Qeydiyyat Portalı'
  | 'Digər';

export type LeadStage =
  | 'yeni'
  | 'elaqe_saxlanildi'
  | 'sinaq_dersi'
  | 'gozleyir'
  | 'qeydiyyat'
  | 'imtina';

export interface Lead {
  id: string;
  fullName: string;
  parentName?: string;
  studentName?: string;
  phone: string;
  applicationCode?: string; // Məs: AREA-LID-4921
  interestedCourse: string;
  source: LeadSource | string;
  stage: LeadStage;
  createdAt: string;
  nextFollowUp?: string;
  notes?: string;
  assignedManager: string;
  branchId?: string;
  branchName?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'late';

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  branchId?: string;
}

export interface LessonSessionRecord {
  id: string; // e.g. 'ls-grp-1-2026-10-29'
  groupId: string;
  groupName: string;
  courseName?: string;
  trainerId: string;
  trainerName: string;
  branchId?: string;
  branchName?: string;
  date: string; // YYYY-MM-DD
  topic?: string;
  totalStudents: number;
  attendedCount: number;
  basePay: number; // e.g. 15 AZN
  bonusPerStudentOver6: number; // e.g. 2 AZN
  bonusPay: number; // Math.max(0, attendedCount - 6) * bonusPerStudentOver6
  totalCalculatedPay: number; // basePay + bonusPay
  status: 'pending_approval' | 'approved' | 'rejected';
  submittedAt: string;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  amount: number;
  type: 'telim_haqqi' | 'derslik' | 'imtahan' | 'diger';
  method: 'Nagd' | 'Bank karti' | 'eManat/MilliOn' | 'Hesaba kocurme';
  date: string;
  receiptNumber: string;
  recordedBy: string;
  contractId?: string;
  discountAmount?: number;
  originalFee?: number;
  parentPhone?: string;
  trainerPhone?: string;
  trainerName?: string;
  note?: string;
  branchId?: string;
  branchName?: string;
}

export interface StudentDebtRecord {
  id: string;
  studentId: string;
  studentName: string;
  contractId: string;
  contractNumber: string;
  courseName: string;
  groupId?: string;
  groupName?: string;
  amount: number;
  month: string; // e.g. '2026-10'
  dueDate: string;
  status: 'odenilmayib' | 'qismen_odenilib' | 'tam_odenilib';
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  notes?: string;
}

export interface TrainerSalary {
  id: string;
  trainerId: string;
  trainerName: string;
  branchId?: string; // Filiala aid maaş təyinatı
  branchName?: string;
  role?: string;
  month: string; // '2026-03'
  employmentType?: EmploymentType; // 'full_stat' | 'yarim_stat' | 'saatliq' | 'ferdi'
  calcType: SalaryCalcType;
  baseRate: number; // monthly fixed or % or per hour AZN
  calculatedAmount: number;
  workedHoursTotal?: number; // Faktiki işlənmiş saatlar (QR və Geofence ilə toplanan)
  normHoursTotal?: number; // Aylıq norma saatlar (məs: 160, 80 və ya fərdi)
  
  // Attendance Impact on Salary
  workDaysTotal: number; // Normative work days in month (e.g. 22)
  workDaysAttended: number; // Days checked-in with QR (e.g. 21)
  lateCount: number; // Days late (e.g. 2)
  absentCount: number; // Unexcused absent days (e.g. 1)
  attendanceRate: number; // e.g. 95.5 (%)
  attendanceDeduction: number; // Deductions for absence and late (e.g. 75 AZN)
  attendanceBonus: number; // Bonus for 100% on-time attendance (e.g. 50 AZN)

  // KPI Performance Impact on Salary
  kpiScore: number; // Overall KPI performance percentage (e.g. 104)
  kpiGrade: 'A+' | 'A' | 'B' | 'C';
  kpiBonus: number; // Bonus earned from KPI targets (e.g. 150 AZN)
  kpiPenalty: number; // Deduction if KPI fell below minimum (e.g. 0 AZN)
  kpiBonusPercent?: number; // Total KPI impact as percentage of base salary (e.g. +10%)
  kpiRuleBreakdown?: {
    metricCode: string;
    metricName: string;
    category: string;
    impactPercent: number; // e.g. +3.5%
    impactAmount: number; // e.g. +52.5 AZN
    type: 'bonus' | 'penalty' | 'neutral';
    formulaNote?: string;
  }[];

  bonus: number; // Other arbitrary bonus
  penalty: number; // Other penalty
  totalPaid: number; // Final net payable amount
  status: 'odenilib' | 'gozleyir';
  paymentDate?: string;
  groupsHandled: string[];
  notes?: string;
}

export type KpiCategory = 'tedris' | 'davamiyyet' | 'xidmet' | 'satis';

export interface KpiMetricDefinition {
  id: string;
  name: string;
  code: string; // e.g. 'RETENTION', 'ATTENDANCE', 'CURRICULUM', 'NPS', 'STAFF_PUNCTUALITY', 'COMPETITION', 'LEADS'
  target: number; // Target benchmark (e.g. 90% or 4.8)
  unit: '%' | 'bal' | 'say' | 'saat';
  weight: number; // Percentage weight in total KPI (e.g. 20%)
  category: KpiCategory;
  applicableRoles: ('Direktor' | 'Menecer' | 'Təlimçi')[];
  bonusThreshold: number; // If actual >= this, extra bonus triggers (e.g. 100%)
  penaltyThreshold: number; // If actual < this, penalty triggers (e.g. 75%)
  description: string;
}

export interface KpiMetricResult {
  metricId: string;
  metricCode: string;
  metricName: string;
  target: number;
  actual: number;
  unit: string;
  weight: number;
  achievementRate: number; // actual / target * 100
  weightedScore: number; // (achievementRate * weight) / 100
  note?: string;
}

export interface StaffKpiEvaluation {
  id: string;
  staffId: string;
  staffName: string;
  role: 'Direktor' | 'Menecer' | 'Təlimçi';
  branchId: string;
  branchName: string;
  month: string; // '2026-03' or '2026-04'
  results: KpiMetricResult[];
  totalScore: number; // e.g. 105.4 (%)
  grade: 'A+' | 'A' | 'B' | 'C';
  kpiBonusAmount: number; // Calculated bonus for salary
  kpiPenaltyAmount: number; // Calculated penalty for salary
  evaluatedBy: string;
  evaluatedAt: string;
  directorRemarks?: string;
  status: 'tesdiqlenib' | 'qaralama';
}

export type KpiRuleMode = 'formula' | 'manual_tiers';

export interface KpiMetricFinanceRule {
  id: string;
  metricCode: string; // 'STAFF_PUNCTUALITY' | 'STD_ATTENDANCE' | 'LEAD_CONVERSION' | 'NPS' | 'RETENTION' | 'CURRICULUM_PROG' | 'COMPETITION_PREP'
  metricName: string;
  category: KpiCategory;
  isActive: boolean;
  mode: KpiRuleMode;

  // 1. Automatic Formula Settings
  formulaSettings: {
    baseSalaryMultiplier: number; // e.g. 0.08 (8% of base salary is influenced by this metric)
    scaleFactor: number; // e.g. 1.2 (sensitivity factor)
    targetThreshold: number; // e.g. 95%
    bonusCapPercent: number; // Max bonus % (e.g. 15%)
    penaltyFloorPercent: number; // Max penalty % (e.g. 10%)
    formulaExpression: string; // e.g. "Bonus = BazaMaaş * 8% * ((Faktiki - Hədəf) / Hədəf * 1.5)"
  };

  // 2. Manual Tiered Scale (A+, A, B, C)
  manualTiers: {
    tierAPlusBonusPercent: number; // e.g. 10%
    tierABonusPercent: number; // e.g. 5%
    tierBBonusPercent: number; // e.g. 0%
    tierCPenaltyPercent: number; // e.g. 5%
    impactType: 'percent_of_salary' | 'fixed_azn'; // Maaşın faizi və ya Sabit AZN
  };

  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: 'icare' | 'kommunal' | 'reklam' | 'ofis_levazimati' | 'avadanliq' | 'vergi' | 'diger';
  amount: number;
  date: string;
  paidTo: string;
  responsiblePerson: string;
  receiptFile?: string;
  receiptUrl?: string; // Image base64 or link to receipt/invoice
  approvalStatus?: 'tesdiqlendi' | 'gozleyir' | 'imtina';
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  notes?: string;
  branchId?: string;
  branchName?: string;
}

export interface ExtraIncome {
  id: string;
  title: string;
  source: 'imtahan_rusumu' | 'kitab_derslik' | 'master_klass' | 'kovorkinq' | 'serfikat_yenileme' | 'diger';
  amount: number;
  date: string;
  payerName: string;
  notes?: string;
  branchId?: string;
  branchName?: string;
}

export interface BranchLocation {
  id: string;
  name: string;
  code?: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g. 120m
  phone?: string;
  managerName?: string;
  managerId?: string;
  roomCount?: number;
  monthlyRent?: number;
  status?: 'aktiv' | 'temirde' | 'planlasdirilir' | 'silinib';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: 'Direktor' | 'Menecer' | 'Təlimçi' | 'Koordinator' | 'Resepşn';
  email: string;
  phone: string;
  branchId: string;
  branchName: string;
  employmentType?: EmploymentType; // 'full_stat' | 'yarim_stat' | 'saatliq' | 'ferdi'
  weeklyHours?: number; // 40 (full), 20 (yarım)
  assignedBranches?: TrainerBranchAssignment[]; // Çoxfiliallı təyinatlar və qrafiklər
  salary: number;
  workSchedule: string; // '09:00 - 18:00'
  status: 'aktiv' | 'mezuniyyet' | 'ayrilib';
}

export interface StaffAttendanceLog {
  id: string;
  staffId: string;
  staffName: string;
  branchId: string;
  branchName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLat?: number;
  checkInLng?: number;
  distanceMeters?: number;
  isInsideGeo: boolean;
  status: 'vaxtinda' | 'gecikme' | 'erken_cixis' | 'qayib';
  workedHours?: number;
  deviceInfo?: string;
}

export interface Lesson {
  id: string;
  title: string;
  durationHours: number;
  description: string;
  homework?: string;
  resources?: { name: string; url: string }[];
  isCompleted?: boolean;
}

export interface CurriculumModule {
  id: string;
  order: number;
  title: string;
  description: string;
  durationWeeks: number;
  lessons: Lesson[];
}

export interface Curriculum {
  id: string;
  courseName: string;
  category:
    | 'Robototexnika & STEM'
    | 'Mühəndislik & Mexanika'
    | 'Dron & Aeronavtika'
    | 'Proqramlaşdırma'
    | 'Süni İntellekt & Data'
    | 'Yarış Hazırlığı'
    | 'Elektronika & Meykerlik'
    | 'Dizayn'
    | 'Biznes & Marketinq';
  totalDurationMonths: number;
  totalHours: number;
  passingGrade: number; // e.g. 75
  description: string;
  subTracks?: string[];
  isCompetitionPrep?: boolean;
  targetAge?: string;
  level?: 'Başlanğıc' | 'Orta' | 'İrəli Səviyyə (Advance)' | 'Yarış Səviyyəsi';
  equipmentNeeded?: string;
  branchesOffered?: string[];
  driveUrl?: string;
  modules: CurriculumModule[];
}

export interface CertificateTemplateItem {
  id: string;
  name: string;
  backgroundUrl: string;
  textColorTheme: 'light' | 'dark' | 'gold';
  borderStyle: 'none' | 'gold' | 'classic' | 'modern';
  overlayDarkness?: number; // 0 to 60 %
  createdAt: string;
}

export interface Certificate {
  id: string; // e.g. 'AREA-2026-FE-8120'
  studentId: string;
  studentName: string;
  courseName: string;
  groupName: string;
  curriculumId: string;
  grade: 'Fərqlənmə ilə' | 'Müvəffəqiyyətlə' | 'İştirakçı';
  issueDate: string;
  completionDate: string;
  instructorName: string;
  directorName: string;
  templateStyle: 'luxury' | 'modern' | 'cyber' | 'custom';
  language?: 'az' | 'en' | 'bilingual';
  verificationUrl: string;
  qrCodeDataUrl?: string;
  customBackgroundUrl?: string;
  hoursCompleted?: number;
  trainerSignatureUrl?: string;
  directorSignatureUrl?: string;
  textColorTheme?: 'light' | 'dark' | 'gold';
  customBorder?: 'none' | 'gold' | 'classic' | 'modern';
  overlayDarkness?: number;
}

export interface StudentContract {
  id: string; // e.g. 'ctr-101'
  contractNumber: string; // e.g. 'AREA-MÜQ-2026-001'
  studentId: string;
  studentName: string;
  curriculumId?: string;
  courseName: string; // e.g. 'Robototexnika & STEM', 'Full Stack Veb'
  branchId?: string;
  branchName?: string;
  groupId?: string;
  groupName?: string;
  trainerId?: string;
  trainerName?: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  lessonsPerMonth?: 4 | 8 | number; // Ayda 4 və ya 8 dərs seçimi
  scheduleTime?: string; // e.g. 'Çərşənbə / Cümə 17:00'
  parentPhone?: string;
  totalMonths?: number;
  totalAmount?: number;
  discountPercent?: number;
  discountAmount?: number;
  paymentPlan?: 'ayliq' | 'birdefelik' | 'hisseli';
  status: 'aktiv' | 'tamamlandi' | 'dondurulub' | 'legv_edilib' | 'gozleyir';
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  signedDate: string;
  notes?: string;
  createdAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'students'
  | 'contracts'
  | 'groups'
  | 'leads'
  | 'attendance'
  | 'staff-attendance'
  | 'certificates'
  | 'curriculum'
  | 'finance'
  | 'whatsapp'
  | 'branches'
  | 'users'
  | 'staff'
  | 'tasks'
  | 'kpi'
  | 'inventory'
  | 'inventory-overview'
  | 'inventory-diy'
  | 'inventory-paid'
  | 'inventory-warehouse'
  | 'inventory-branches'
  | 'inventory-equipment'
  | 'inventory-equipment-requests'
  | 'inventory-tickets'
  | 'inventory-orders'
  | 'inventory-debts'
  | 'inventory-acts'
  | 'inventory-reports';

export type NotificationCategory = 'maliyye' | 'davamiyyet' | 'lid' | 'akademik' | 'sistem';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  timestamp: string;
  isRead: boolean;
  targetTab?: ActiveTab;
  targetId?: string;
  actionLabel?: string;
  roleScope?: Role[];
  branchId?: string;
}

// Executive Task Tracker Types
export type TaskPriority = 'yuksek' | 'orta' | 'asagi';
export type TaskStatus = 'gozleyir' | 'icradadir' | 'tamamlandi' | 'texire_salindi';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  assigneeName: string;
  assigneeRole?: string;
  branchId?: string;
  branchName?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  createdBy: string;
  completionNote?: string;
  completedAt?: string;
  tags?: string[];
}

// Role-Based Access Control (RBAC) Types
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type SystemModuleId =
  | 'dashboard'
  | 'students'
  | 'contracts'
  | 'groups'
  | 'leads'
  | 'attendance'
  | 'staffAttendance'
  | 'certificates'
  | 'curriculum'
  | 'finance'
  | 'tasks'
  | 'kpi'
  | 'whatsapp'
  | 'branches'
  | 'users'
  | 'permissions'
  | 'inventory'
  | 'marketing';

export interface ModulePermissionRule {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export type RolePermissionsConfig = Record<Role, Record<SystemModuleId, ModulePermissionRule>>;

export interface SystemModuleMeta {
  id: SystemModuleId;
  label: string;
  category: 'core' | 'academic' | 'management' | 'system';
  description: string;
  actions: {
    view: string;
    create: string;
    edit: string;
    delete: string;
  };
}

// ========================================================
// İNVENTARİZASİYA VƏ TEXNİKİ MÜRACİƏTLƏR MODULUNUN TİPLƏRİ
// ========================================================

export type InventorySubTab =
  | 'overview'
  | 'diy'
  | 'paid'
  | 'warehouse'
  | 'branches'
  | 'equipment'
  | 'equipment-requests'
  | 'tickets'
  | 'orders'
  | 'debts'
  | 'acts'
  | 'reports';

export interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  type: 'diy' | 'paid';
  unit: string;
  unitPrice: number; // Ödənişli məhsulun qiyməti (AZN)
  centralStock: number; // Mərkəzi anbar qalığı
  minStockAlert: number; // Minimum təhlükəsizlik həddi
  description?: string;
  photoUrl?: string;
  isArchived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CentralWarehouseLog {
  id: string;
  productId: string;
  productName: string;
  changeAmount: number; // Məsələn: +50 və ya -10
  previousStock: number;
  newStock: number;
  type: 'daxil_olma' | 'gonderis' | 'tənzimləmə';
  reason: string;
  performedBy: string;
  performedAt: string;
  relatedOrderId?: string;
}

export interface BranchInventoryAdjustment {
  id: string;
  date: string;
  user: string;
  previousStock: number;
  newStock: number;
  difference: number;
  reason: string;
}

export interface BranchInventoryItem {
  id: string;
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  currentStock: number;
  lastUpdated: string;
  adjustmentsHistory: BranchInventoryAdjustment[];
}

export interface EquipmentRepairEntry {
  id: string;
  date: string;
  description: string;
  cost?: number;
  performer?: string;
  ticketId?: string;
}

export interface EquipmentItem {
  id: string; // Məs: 'EQ-GN-001'
  name: string;
  category: string; // 'Kompüter', 'Proyektor', 'Printer', 'Elektronika', 'Digər'
  model: string;
  serialNumber?: string;
  branchId: string;
  branchName: string;
  location: string; // Otaq 3, Resepşn və s.
  technicalStatus: 'islek' | 'temirde' | 'nasaz' | 'silinib';
  photoUrl?: string;
  repairHistory: EquipmentRepairEntry[];
  relatedTicketIds?: string[];
  notes?: string;
  addedAt: string;
}

export type EquipmentRequestStatus =
  | 'yeni'
  | 'nezere_alindi'
  | 'tesdiqlendi'
  | 'qismen_tesdiqlendi'
  | 'reddedildi'
  | 'gonderildi'
  | 'tehvil_alindi';

export interface EquipmentRequestStatusHistory {
  status: EquipmentRequestStatus;
  date: string;
  user: string;
  note?: string;
}

export interface EquipmentRequest {
  id: string;
  requestNumber: string;
  branchId: string;
  branchName: string;
  itemName: string;
  category: string;
  quantity: number;
  approvedQuantity?: number;
  reason: string;
  priority: 'asagi' | 'orta' | 'yuksek' | 'tecili';
  status: EquipmentRequestStatus;
  rejectionReason?: string;
  photoUrl?: string;
  createdAt: string;
  createdBy: string;
  reviewedBy?: string;
  reviewedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  statusHistory: EquipmentRequestStatusHistory[];
}

export type TechnicalTicketStatus =
  | 'yeni'
  | 'nezere_alindi'
  | 'elaqe_saxlanildi'
  | 'icradadir'
  | 'temir_olundu'
  | 'filial_tesdiq_gozleyir'
  | 'tamamlandi'
  | 'geri_qaytarildi';

export interface TechnicalTicketStatusHistory {
  status: TechnicalTicketStatus;
  date: string;
  user: string;
  note?: string;
}

export interface TechnicalTicket {
  id: string;
  ticketNumber: string;
  branchId: string;
  branchName: string;
  equipmentId?: string;
  equipmentName?: string;
  isNonInventory: boolean; // Sınmış pəncərə, qapı, elektrik və s.
  title: string;
  description: string;
  priority: 'asagi' | 'orta' | 'yuksek' | 'tecili';
  photoUrl?: string;
  status: TechnicalTicketStatus;
  contactedBranch?: boolean;
  contactNote?: string;
  workDone?: string;
  repairResult?: string;
  branchConfirmationNote?: string;
  reopenReason?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  completedAt?: string;
  statusHistory: TechnicalTicketStatusHistory[];
  generatedActId?: string;
}

export interface InventoryOrderItem {
  productId: string;
  productName: string;
  category: string;
  requestedQty: number;
  approvedQty: number;
  unitPrice: number;
  unit: string;
}

export type InventoryOrderStatus =
  | 'yeni'
  | 'baxilir'
  | 'tesdiqlendi'
  | 'qismen_tesdiqlendi'
  | 'reddedildi'
  | 'gonderildi'
  | 'tehvil_alindi';

export interface InventoryOrderStatusHistory {
  status: InventoryOrderStatus;
  date: string;
  user: string;
  note?: string;
}

export interface InventoryOrder {
  id: string;
  orderNumber: string;
  branchId: string;
  branchName: string;
  type: 'diy' | 'paid';
  items: InventoryOrderItem[];
  totalAmount: number;
  paidAmount: number;
  remainingDebt: number;
  reason?: string;
  status: InventoryOrderStatus;
  rejectionReason?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  createdBy: string;
  statusHistory: InventoryOrderStatusHistory[];
  generatedActId?: string;
}

export interface InventoryPayment {
  id: string;
  receiptNumber: string;
  branchId: string;
  branchName: string;
  orderId?: string;
  orderNumber?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string; // 'Bank köçürməsi', 'Nağd', 'Kassa'
  note: string;
  recordedBy: string;
}

export type InventoryActType =
  | 'texniki_icra'
  | 'avadanliq_tehvil'
  | 'diy_tehvil'
  | 'odenisli_tehvil';

export interface InventoryAct {
  id: string;
  actNumber: string; // Məs: 'AKT-TI-2026-001'
  type: InventoryActType;
  title: string;
  branchId: string;
  branchName: string;
  referenceId: string; // ticketId, orderId, reqId
  referenceNumber: string;
  details: {
    items?: Array<{ name: string; quantity: number; unit?: string; price?: number }>;
    workDone?: string;
    repairResult?: string;
    equipmentName?: string;
    equipmentId?: string;
    totalAmount?: number;
    disclaimer?: string;
  };
  generatedAt: string;
  status: 'tesdiqlenib' | 'arxivlenib';
  signedByManager?: string;
  signedByTexnobaba?: string;
}

export interface InventoryAuditLogEntry {
  id: string;
  entityType: 'product' | 'order' | 'equipment' | 'request' | 'ticket' | 'debt' | 'act';
  entityId: string;
  entityName?: string;
  branchId?: string;
  branchName?: string;
  action: string;
  details: string;
  user: string;
  timestamp: string;
}

// ========================================================
// MARKETİNQ VƏ SMM (SOSİAL MEDİA İDARƏETMƏSİ) TİPLƏRİ
// ========================================================

export type SmmPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'telegram';

export interface SmmSocialAccount {
  id: string;
  branchId: string; // 'hq' for AREA Academy Baş ofis, or branch id like 'branch-zaqatala'
  branchName: string; // 'AREA Academy — Baş ofis', 'AREA Zaqatala', etc.
  platform: SmmPlatform;
  accountName: string; // Məsələn: 'AREA Academy Official', 'AREA Zaqatala Dərnəyi'
  handle: string; // '@area.academy', '@area.zaqatala'
  url: string; // Link to profile
  followersCount: number;
  followingCount?: number;
  postsCount?: number;
  avgReach?: number; // Ortalama baxış/çatımlılıq
  avgEngagementRate?: number; // Faizlə (məsələn, 4.8%)
  status: 'aktiv' | 'passiv' | 'qurasdirilir';
  managerName?: string; // Cavabdeh SMM / Menecer
  notes?: string;
  updatedAt: string;
}

export type SmmPostContentType = 'post' | 'reels' | 'story' | 'video' | 'shorts' | 'article';

export type SmmPostStatus = 'qaralama' | 'planlasdirilib' | 'tesdiqlendi' | 'derc_edildi' | 'legv';

export interface SmmContentPost {
  id: string;
  branchId: string;
  branchName: string;
  platform: SmmPlatform;
  title: string;
  contentType: SmmPostContentType;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  status: SmmPostStatus;
  caption?: string;
  hashtags?: string[];
  mediaPreviewUrl?: string;
  targetAudience?: string;
  authorName: string;
  publishedUrl?: string;
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  createdAt: string;
}



