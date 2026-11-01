import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Student,
  Group,
  Lead,
  StudentAttendanceRecord,
  LessonSessionRecord,
  PaymentTransaction,
  TrainerSalary,
  Expense,
  ExtraIncome,
  BranchLocation,
  StaffMember,
  TrainerBranchAssignment,
  EmploymentType,
  SalaryCalcType,
  StaffAttendanceLog,
  Curriculum,
  CurriculumModule,
  Lesson,
  Certificate,
  Role,
  AttendanceStatus,
  LeadStage,
  UserAccount,
  KpiMetricDefinition,
  StaffKpiEvaluation,
  KpiMetricFinanceRule,
  NotificationItem,
  StudentContract,
  StudentDebtRecord,
  PermissionAction,
  SystemModuleId,
  ModulePermissionRule,
  RolePermissionsConfig,
  TaskItem,
  TaskStatus,
  TaskPriority,
  InventoryProduct,
  CentralWarehouseLog,
  BranchInventoryItem,
  EquipmentItem,
  EquipmentRequest,
  EquipmentRequestStatus,
  TechnicalTicket,
  TechnicalTicketStatus,
  InventoryOrder,
  InventoryOrderStatus,
  InventoryPayment,
  InventoryAct,
  InventoryActType,
  InventoryAuditLogEntry,
  InventorySubTab,
  SmmPlatform,
  SmmSocialAccount,
  SmmContentPost,
  SmmPostContentType,
  SmmPostStatus,
} from '../types/crm';
import { DEFAULT_ROLE_PERMISSIONS, sanitizePermissions } from '../utils/permissions';
import { cleanFirestoreData } from '../utils/sanitizeFirestore';

import {
  INITIAL_BRANCHES,
  INITIAL_CURRICULUMS,
  INITIAL_GROUPS,
  INITIAL_STUDENTS,
  INITIAL_LEADS,
  INITIAL_STAFF,
  INITIAL_STAFF_ATTENDANCE,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_EXTRA_INCOME,
  INITIAL_TRAINER_SALARIES,
  INITIAL_CERTIFICATES,
  INITIAL_STUDENT_ATTENDANCE,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CONTRACTS,
  INITIAL_TASKS,
} from '../data/mockData';
import {
  INITIAL_KPI_DEFINITIONS,
  INITIAL_STAFF_KPIS,
  INITIAL_KPI_FINANCE_RULES
} from '../data/kpiData';
import {
  INITIAL_INVENTORY_PRODUCTS,
  INITIAL_WAREHOUSE_LOGS,
  INITIAL_BRANCH_INVENTORIES,
  INITIAL_EQUIPMENT_LIST,
  INITIAL_EQUIPMENT_REQUESTS,
  INITIAL_TECHNICAL_TICKETS,
  INITIAL_INVENTORY_ORDERS,
  INITIAL_INVENTORY_PAYMENTS,
  INITIAL_INVENTORY_ACTS,
  INITIAL_INVENTORY_AUDIT_LOGS,
} from '../data/inventoryMockData';
import {
  INITIAL_SMM_ACCOUNTS,
  INITIAL_SMM_POSTS,
} from '../data/smmData';
import { calculateDistanceMeters, generateDynamicQrToken } from '../utils/geo';
import { generateId } from '../utils/formatters';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { auth, googleProvider, db } from '../firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

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
  | 'inventory-reports'
  | 'marketing';

export const DIRECTOR_EMAILS: string[] = [
  'scorpionabid82@gmail.com',
  'roboticsarea@gmail.com',
  'mentor.rasulzada@gmail.com',
  'texnobabasatis@gmail.com',
  'hasanovfariz@gmail.com',
];

export const isDirectorEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return DIRECTOR_EMAILS.some(d => d.toLowerCase().trim() === clean);
};

export const REAL_AUTHORIZED_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    fullName: 'Baş Direktor (Superadmin)',
    email: 'scorpionabid82@gmail.com',
    phone: '+994 50 100 00 00',
    role: 'direktor',
    branchId: 'all',
    branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
    isSuperAdmin: true,
    status: 'aktiv',
    createdAt: '2024-01-10',
    lastLogin: 'Bugün',
    notes: 'Baş Direktor və Superadmin. Bütün filiallar üzrə tam səlahiyyət.',
  },
  {
    id: 'usr-dir-roboticsarea',
    fullName: 'Robotics AREA',
    email: 'roboticsarea@gmail.com',
    phone: '',
    role: 'direktor',
    branchId: 'all',
    branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
    isSuperAdmin: true,
    status: 'aktiv',
    createdAt: '2026-04-01',
    lastLogin: 'Qeydiyyatdan keçib',
    notes: 'Direktor və Sistem İnzibatçısı.',
  },
  {
    id: 'usr-dir-rasulzada',
    fullName: 'Mentor Rəsulzadə',
    email: 'mentor.rasulzada@gmail.com',
    phone: '',
    role: 'direktor',
    branchId: 'all',
    branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
    isSuperAdmin: true,
    status: 'aktiv',
    createdAt: '2026-04-01',
    lastLogin: 'Qeydiyyatdan keçib',
    notes: 'Direktor və Sistem İnzibatçısı.',
  },
  {
    id: 'usr-dir-texnobaba',
    fullName: 'Texnobaba Satış Direktoru',
    email: 'texnobabasatis@gmail.com',
    phone: '',
    role: 'direktor',
    branchId: 'all',
    branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
    isSuperAdmin: true,
    status: 'aktiv',
    createdAt: '2026-04-01',
    lastLogin: 'Qeydiyyatdan keçib',
    notes: 'Direktor və Satış Rəhbəri.',
  },
  {
    id: 'usr-dir-hasanovfariz',
    fullName: 'Fariz Həsənov',
    email: 'hasanovfariz@gmail.com',
    phone: '',
    role: 'direktor',
    branchId: 'all',
    branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
    isSuperAdmin: true,
    status: 'aktiv',
    createdAt: '2026-04-01',
    lastLogin: 'Qeydiyyatdan keçib',
    notes: 'Direktor və Sistem İnzibatçısı.',
  },
];

export const MOCK_ITEM_IDS = new Set([
  // Students
  'stu-1', 'stu-2', 'stu-3', 'stu-4', 'stu-5', 'stu-6', 'stu-7', 'stu-8', 'stu-9', 'stu-10',
  'stu-101', 'stu-102', 'stu-103', 'stu-104', 'stu-105', 'stu-106', 'stu-107', 'stu-108',
  // Groups
  'grp-1', 'grp-2', 'grp-3', 'grp-4', 'grp-5', 'grp-fe-24', 'grp-ai-01', 'grp-bb-01', 'grp-ds-01', 'grp-rm-01', 'grp-sc-01',
  // Leads
  'lead-1', 'lead-2', 'lead-3', 'lead-4', 'lead-5', 'lead-6',
  // Staff
  'st-1', 'st-2', 'st-3', 'st-4', 'st-5', 'st-6', 'staff-1', 'staff-2', 'staff-3', 'staff-4', 'staff-5',
  // Expenses & Extra income
  'exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5', 'exp-6', 'exp-7', 'exp-8',
  'ext-1', 'ext-2', 'ext-3',
  // Payments
  'pay-1', 'pay-2', 'pay-3', 'pay-4', 'pay-5', 'pay-6', 'pay-7', 'pay-8',
  'pay-2026-001', 'pay-2026-002', 'pay-2026-003', 'pay-2026-004',
  // Notifications
  'notif-1', 'notif-2', 'notif-3', 'notif-4', 'notif-5',
  // Certificates
  'cert-1', 'cert-2', 'cert-3', 'cert-4', 'cert-5', 'cert-6', 'AREA-2026-UX-9201', 'AREA-2026-UX-9202',
  // Contracts
  'ctr-101', 'ctr-102', 'ctr-103', 'ctr-104', 'ctr-105', 'ctr-106', 'ctr-107', 'ctr-108', 'ctr-109', 'ctr-110',
  // Attendance
  'att-1', 'att-2', 'att-3', 'att-4', 'att-5', 'att-6', 'att-st-1', 'att-st-2', 'att-st-3',
  // Trainer salaries mock
  'ts-1', 'ts-1-genclik', 'ts-2', 'ts-3', 'ts-4',
  // Template users
  'usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5', 'usr-6', 'usr-7', 'usr-8', 'usr-9', 'usr-10', 'usr-talabot',
  // Cleaned test and duplicate students/contracts/debts
  'stu-2026-9997', 'stu-2026-6276', 'stu-2026-7353', 'stu-2026-1778', 'stu-2026-9734',
  'ctr-2026-6160', 'ctr-2026-3335', 'ctr-2026-4745', 'ctr-2026-9943', 'ctr-2026-9602', 'ctr-2026-8363',
  'dbt-2026-5981', 'dbt-2026-9053', 'dbt-2026-8193', 'dbt-2026-4507',
]);

export const getDeletedItemIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('areacrm_deleted_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {
    // ignore
  }
  return new Set();
};

export const registerDeletedItemId = (id: string) => {
  try {
    const current = getDeletedItemIds();
    current.add(id);
    localStorage.setItem('areacrm_deleted_ids', JSON.stringify(Array.from(current)));
  } catch (e) {
    // ignore
  }
};

export const removeDeletedItemId = (id: string) => {
  try {
    const current = getDeletedItemIds();
    current.delete(id);
    localStorage.setItem('areacrm_deleted_ids', JSON.stringify(Array.from(current)));
  } catch (e) {
    // ignore
  }
};

export function filterUserCreated<T extends { id: string }>(items: T[]): T[] {
  const deletedIds = getDeletedItemIds();
  return items.filter(item => !MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id));
}

interface CrmContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  branches: BranchLocation[];
  addBranch: (branch: Omit<BranchLocation, 'id'>) => BranchLocation;
  updateBranch: (id: string, data: Partial<BranchLocation>) => void;
  deleteBranch: (id: string) => void;
  softDeleteBranch: (id: string) => void;
  hardDeleteBranch: (id: string) => void;
  restoreBranch: (id: string) => void;

  // Google / Gmail Auth & Whitelist Access Control
  currentUser: UserAccount | null;
  authLoading: boolean;
  accessDeniedEmail: string | null;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailOrUsername: (emailOrUsername: string, password?: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  dismissAccessDenied: () => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // Users (4 Roles RBAC)
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>) => UserAccount;
  updateUser: (id: string, data: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  softDeleteUser: (id: string) => void;
  hardDeleteUser: (id: string) => void;
  restoreUser: (id: string) => void;

  // Students
  students: Student[];
  allStudents: Student[];
  addStudent: (student: Omit<Student, 'id' | 'attendanceRate'>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  softDeleteStudent: (id: string) => void;
  hardDeleteStudent: (id: string) => void;
  restoreStudent: (id: string) => void;

  // Contracts & Programs
  contracts: StudentContract[];
  allContracts: StudentContract[];
  addContract: (contract: Omit<StudentContract, 'id' | 'createdAt'>) => StudentContract;
  updateContract: (id: string, data: Partial<StudentContract>) => void;
  deleteContract: (id: string, options?: { deleteAssociatedDebts?: boolean }) => void;
  softDeleteContract: (id: string, options?: { deleteAssociatedDebts?: boolean }) => void;
  hardDeleteContract: (id: string, options?: { deleteAssociatedDebts?: boolean }) => void;
  restoreContract: (id: string) => void;
  getStudentContracts: (studentId: string) => StudentContract[];
  studentDebts: StudentDebtRecord[];
  allStudentDebts?: StudentDebtRecord[];

  // Groups
  groups: Group[];
  addGroup: (group: Omit<Group, 'id' | 'currentStudents' | 'progressPercent'>) => Group;
  updateGroup: (id: string, data: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  softDeleteGroup: (id: string) => void;
  hardDeleteGroup: (id: string) => void;
  restoreGroup: (id: string) => void;

  // Leads
  leads: Lead[];
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => Lead;
  updateLeadStage: (id: string, stage: LeadStage) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  convertLeadToStudent: (leadId: string, groupId: string, monthlyFee: number) => Student | null;

  // Student Attendance & Lesson Sessions
  studentAttendance: StudentAttendanceRecord[];
  recordStudentAttendance: (record: Omit<StudentAttendanceRecord, 'id'>) => void;
  bulkRecordAttendance: (records: Omit<StudentAttendanceRecord, 'id'>[]) => void;
  lessonSessions: LessonSessionRecord[];
  submitLessonSession: (
    sessionData: Omit<LessonSessionRecord, 'id' | 'status' | 'submittedAt'>,
    records: Omit<StudentAttendanceRecord, 'id'>[]
  ) => Promise<LessonSessionRecord>;
  approveLessonSession: (sessionId: string, notes?: string) => Promise<void>;
  rejectLessonSession: (sessionId: string, reason?: string) => Promise<void>;

  // Staff & QR Attendance
  staff: StaffMember[];
  staffAttendance: StaffAttendanceLog[];
  addStaff: (newStaff: Omit<StaffMember, 'id'>) => StaffMember;
  updateStaff: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  addTrainer: (trainerData: {
    fullName: string;
    email: string;
    phone: string;
    branchId: string;
    branchName?: string;
    employmentType?: EmploymentType;
    weeklyHours?: number;
    calcType?: SalaryCalcType;
    baseRate?: number;
    assignedBranches?: TrainerBranchAssignment[];
    salary: number;
    workSchedule?: string;
    notes?: string;
  }) => { staffMember: StaffMember; userAccount: UserAccount };
  logStaffCheckIn: (
    staffId: string,
    lat: number,
    lng: number,
    deviceInfo?: string
  ) => { success: boolean; message: string; log?: StaffAttendanceLog };
  logStaffCheckOut: (staffId: string) => { success: boolean; message: string };
  dynamicQrToken: string;

  // Finance & Payroll
  payments: PaymentTransaction[];
  recordPayment: (payment: Omit<PaymentTransaction, 'id' | 'receiptNumber'>) => PaymentTransaction;
  deletePayment: (id: string) => void;
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Expense;
  approveExpense: (id: string, notes?: string) => void;
  rejectExpense: (id: string, reason?: string) => void;
  deleteExpense: (id: string) => void;
  extraIncomes: ExtraIncome[];
  addExtraIncome: (income: Omit<ExtraIncome, 'id'>) => ExtraIncome;
  deleteExtraIncome: (id: string) => void;
  trainerSalaries: TrainerSalary[];
  payTrainerSalary: (id: string) => void;
  addOrUpdateSalary: (salary: TrainerSalary) => void;
  syncSalariesWithKpiAndAttendance: (targetMonth?: string) => void;

  // KPI Management & Performance
  kpiDefinitions: KpiMetricDefinition[];
  addKpiDefinition: (kpi: Omit<KpiMetricDefinition, 'id'>) => KpiMetricDefinition;
  updateKpiDefinition: (id: string, data: Partial<KpiMetricDefinition>) => void;
  deleteKpiDefinition: (id: string) => void;
  staffKpis: StaffKpiEvaluation[];
  saveStaffKpiEvaluation: (evaluation: StaffKpiEvaluation) => void;
  kpiFinanceRules: KpiMetricFinanceRule[];
  updateKpiFinanceRule: (id: string, updates: Partial<KpiMetricFinanceRule>) => void;
  resetKpiFinanceRules: () => void;

  // Certificates
  certificates: Certificate[];
  issueCertificate: (certData: Omit<Certificate, 'id' | 'issueDate' | 'verificationUrl' | 'qrCodeDataUrl'>) => Promise<Certificate>;

  // Curriculum
  curriculums: Curriculum[];
  addCurriculum: (curr: Omit<Curriculum, 'id'>) => Curriculum;
  updateCurriculum: (id: string, data: Partial<Curriculum>) => void;
  addModuleToCurriculum: (curriculumId: string, moduleData: { title: string; description: string; durationWeeks: number }) => void;
  addLessonToModule: (curriculumId: string, moduleId: string, lessonData: { title: string; durationHours: number; description: string }) => void;
  updateGroupProgress: (groupId: string, progressPercent: number, moduleId?: string) => void;

  // Executive Task Tracker
  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id' | 'createdAt' | 'createdBy'>) => TaskItem;
  updateTaskStatus: (id: string, status: TaskStatus, note?: string) => void;
  updateTask: (id: string, data: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;

  // Notification Toast & Confirmation Dialog
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirmAction: (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  }) => void;

  // In-App Interactive Notifications Center
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;

  // Role & Permissions Management (RBAC)
  rolePermissions: RolePermissionsConfig;
  updateRolePermissions: (role: Role, moduleId: SystemModuleId, action: PermissionAction, value: boolean) => Promise<void>;
  bulkUpdateRolePermissions: (role: Role, newModuleRules: Record<SystemModuleId, ModulePermissionRule>) => Promise<void>;
  resetRolePermissions: (role?: Role) => Promise<void>;
  updateUserCustomPermission: (userId: string, moduleId: SystemModuleId, action: PermissionAction, value: boolean | null) => Promise<void>;
  bulkUpdateUserCustomPermissions: (userId: string, customRules: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>>) => Promise<void>;
  resetUserCustomPermissions: (userId: string) => Promise<void>;
  can: (action: PermissionAction, moduleId: SystemModuleId, targetRole?: Role, targetUser?: UserAccount | null) => boolean;

  // Inventory & Technical Requests Module
  inventoryProducts: InventoryProduct[];
  warehouseLogs: CentralWarehouseLog[];
  branchInventories: BranchInventoryItem[];
  equipmentList: EquipmentItem[];
  equipmentRequests: EquipmentRequest[];
  technicalTickets: TechnicalTicket[];
  inventoryOrders: InventoryOrder[];
  inventoryPayments: InventoryPayment[];
  inventoryActs: InventoryAct[];
  inventoryAuditLogs: InventoryAuditLogEntry[];
  activeInventorySubTab: InventorySubTab;
  setActiveInventorySubTab: (tab: InventorySubTab) => void;

  addInventoryProduct: (prod: {
    name: string;
    category: string;
    type: 'diy' | 'paid';
    unit: string;
    unitPrice: number;
    centralStock: number;
    minStockAlert: number;
    description?: string;
  }) => InventoryProduct;
  updateInventoryProduct: (productId: string, updates: Partial<InventoryProduct>) => void;
  adjustCentralStock: (productId: string, change: number, reason: string) => void;
  adjustBranchInventory: (branchId: string, productId: string, newStock: number, reason: string) => void;
  createInventoryOrder: (orderData: {
    branchId: string;
    type: 'diy' | 'paid';
    items: { productId: string; requestedQty: number; unitPrice: number }[];
    reason?: string;
  }) => InventoryOrder;
  reviewInventoryOrder: (
    orderId: string,
    status: InventoryOrderStatus,
    approvedQuantities?: Record<string, number>,
    rejectionReason?: string
  ) => void;
  dispatchInventoryOrder: (orderId: string) => void;
  deliverInventoryOrder: (orderId: string) => void;
  createEquipment: (item: {
    name: string;
    category: string;
    model: string;
    serialNumber?: string;
    branchId: string;
    branchName: string;
    location: string;
    technicalStatus: 'islek' | 'temirde' | 'nasaz' | 'silinib';
    notes?: string;
  }) => EquipmentItem;
  updateEquipment: (id: string, updates: Partial<EquipmentItem>) => void;
  createEquipmentRequest: (data: {
    branchId: string;
    branchName?: string;
    itemName: string;
    category: string;
    quantity: number;
    reason: string;
    priority: 'asagi' | 'orta' | 'yuksek' | 'tecili';
    createdBy?: string;
  }) => EquipmentRequest;
  reviewEquipmentRequest: (
    requestId: string,
    status: EquipmentRequestStatus,
    approvedQty?: number,
    rejectionReason?: string
  ) => void;
  dispatchEquipmentRequest: (requestId: string) => void;
  deliverEquipmentRequest: (requestId: string) => void;
  createTechnicalTicket: (ticketData: {
    branchId: string;
    branchName?: string;
    isNonInventory: boolean;
    equipmentId?: string;
    equipmentName?: string;
    title: string;
    description: string;
    priority: 'asagi' | 'orta' | 'yuksek' | 'tecili';
    createdBy?: string;
  }) => TechnicalTicket;
  updateTicketProgress: (
    ticketId: string,
    updates: {
      status: TechnicalTicketStatus;
      contactedBranch?: boolean;
      contactNote?: string;
      workDone?: string;
      repairResult?: string;
    }
  ) => void;
  confirmTicketResolution: (ticketId: string, isConfirmed: boolean, note?: string) => void;
  recordInventoryPayment: (
    branchId: string,
    amount: number,
    paymentMethod: string,
    note: string,
    orderId?: string
  ) => InventoryPayment;
  signAct: (actId: string, role: 'manager' | 'texnobaba') => void;
  resetInventoryTestData: () => void;

  // Marketing & SMM Module
  smmAccounts: SmmSocialAccount[];
  smmPosts: SmmContentPost[];
  createOrUpdateSmmAccount: (
    accountData: Partial<SmmSocialAccount> & { platform: SmmPlatform; branchId: string; handle: string; url: string }
  ) => SmmSocialAccount;
  deleteSmmAccount: (id: string) => void;
  createSmmPost: (postData: Omit<SmmContentPost, 'id' | 'createdAt'>) => SmmContentPost;
  updateSmmPostStatus: (
    id: string,
    status: SmmPostStatus,
    extra?: { publishedUrl?: string; viewsCount?: number; likesCount?: number }
  ) => void;
  updateSmmPost: (id: string, updates: Partial<SmmContentPost>) => void;
  deleteSmmPost: (id: string) => void;
  resetSmmTestData: () => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<Role>('direktor');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [branches, setBranches] = useState<BranchLocation[]>(INITIAL_BRANCHES);

  // Role-Based Access Control (RBAC) State & Firestore Persistence
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsConfig>(() => {
    try {
      const saved = localStorage.getItem('areacrm_role_permissions');
      if (saved) {
        return sanitizePermissions(JSON.parse(saved));
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_role_permissions', JSON.stringify(rolePermissions));
    } catch (e) {
      console.warn('Failed to save permissions to localStorage', e);
    }
  }, [rolePermissions]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'role_permissions'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.permissions) {
          const sanitized = sanitizePermissions(data.permissions);
          setRolePermissions(sanitized);
          try {
            localStorage.setItem('areacrm_role_permissions', JSON.stringify(sanitized));
          } catch (e) {
            // ignore
          }
        }
      }
    }, (err) => {
      console.warn('Firestore role_permissions listener:', err);
    });
    return () => unsub();
  }, []);


  // Global Confirmation Modal State for all Delete operations
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const confirmAction = (options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
    onConfirm: () => void;
  }) => {
    setConfirmModalData({
      isOpen: true,
      title: options.title || 'Silinməni Təsdiqləyin',
      message: options.message,
      confirmText: options.confirmText || 'Bəli, Sil',
      cancelText: options.cancelText || 'İmtina',
      danger: options.danger !== undefined ? options.danger : true,
      onConfirm: options.onConfirm,
    });
  };

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_students_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_students_list', JSON.stringify(students));
    } catch (e) {
      console.warn('Failed to save students to localStorage', e);
    }
  }, [students]);

  const [contracts, setContracts] = useState<StudentContract[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_contracts_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_contracts_list', JSON.stringify(contracts));
    } catch (e) {
      console.warn('Failed to save contracts to localStorage', e);
    }
  }, [contracts]);

  const [studentDebts, setStudentDebts] = useState<StudentDebtRecord[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_student_debts_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_student_debts_list', JSON.stringify(studentDebts));
    } catch (e) {
      console.warn('Failed to save student debts to localStorage', e);
    }
  }, [studentDebts]);

  const [groups, setGroups] = useState<Group[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_groups_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_groups_list', JSON.stringify(groups));
    } catch (e) {
      console.warn('Failed to save groups to localStorage', e);
    }
  }, [groups]);

  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_leads_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_leads_list', JSON.stringify(leads));
    } catch (e) {
      console.warn('Failed to save leads to localStorage', e);
    }
  }, [leads]);

  const [studentAttendance, setStudentAttendance] = useState<StudentAttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_student_attendance_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_student_attendance_list', JSON.stringify(studentAttendance));
    } catch (e) {
      console.warn('Failed to save studentAttendance to localStorage', e);
    }
  }, [studentAttendance]);

  const [lessonSessions, setLessonSessions] = useState<LessonSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_lesson_sessions_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_lesson_sessions_list', JSON.stringify(lessonSessions));
    } catch (e) {
      console.warn('Failed to save lessonSessions to localStorage', e);
    }
  }, [lessonSessions]);

  const [staff, setStaff] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_staff_list', JSON.stringify(staff));
    } catch (e) {
      console.warn('Failed to save staff to localStorage', e);
    }
  }, [staff]);

  const [staffAttendance, setStaffAttendance] = useState<StaffAttendanceLog[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_staff_attendance_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_staff_attendance_list', JSON.stringify(staffAttendance));
    } catch (e) {
      console.warn('Failed to save staffAttendance to localStorage', e);
    }
  }, [staffAttendance]);

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_payments_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_payments_list', JSON.stringify(payments));
    } catch (e) {
      console.warn('Failed to save payments to localStorage', e);
    }
  }, [payments]);

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_expenses_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_expenses_list', JSON.stringify(expenses));
    } catch (e) {
      console.warn('Failed to save expenses to localStorage', e);
    }
  }, [expenses]);

  const [extraIncomes, setExtraIncomes] = useState<ExtraIncome[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_extra_incomes_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_extra_incomes_list', JSON.stringify(extraIncomes));
    } catch (e) {
      console.warn('Failed to save extraIncomes to localStorage', e);
    }
  }, [extraIncomes]);

  const [trainerSalaries, setTrainerSalaries] = useState<TrainerSalary[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_trainer_salaries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_trainer_salaries', JSON.stringify(trainerSalaries));
    } catch (e) {
      console.warn('Failed to save trainer salaries to localStorage', e);
    }
  }, [trainerSalaries]);
  const [kpiDefinitions, setKpiDefinitions] = useState<KpiMetricDefinition[]>(INITIAL_KPI_DEFINITIONS);
  const [staffKpis, setStaffKpis] = useState<StaffKpiEvaluation[]>(INITIAL_STAFF_KPIS);
  const [kpiFinanceRules, setKpiFinanceRules] = useState<KpiMetricFinanceRule[]>(INITIAL_KPI_FINANCE_RULES);
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_certificates_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_certificates_list', JSON.stringify(certificates));
    } catch (e) {
      console.warn('Failed to save certificates to localStorage', e);
    }
  }, [certificates]);

  const [curriculums, setCurriculums] = useState<Curriculum[]>(INITIAL_CURRICULUMS);

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_tasks_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_TASKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_tasks_list', JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_notifications_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return filterUserCreated(parsed);
        }
      }
    } catch (e) {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_notifications_list', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage', e);
    }
  }, [notifications]);

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_users_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const userCreated = filterUserCreated(parsed);
          const existingEmails = new Set(userCreated.map((u: UserAccount) => u.email.toLowerCase()));
          const realDirectors = REAL_AUTHORIZED_USERS.filter(u => !existingEmails.has(u.email.toLowerCase()));
          return [...realDirectors, ...userCreated];
        }
      }
    } catch (e) {
      // fallback
    }
    return REAL_AUTHORIZED_USERS;
  });
  const usersRef = useRef<UserAccount[]>(users);
  usersRef.current = users;

  // Persist users to localStorage whenever users list updates
  useEffect(() => {
    try {
      localStorage.setItem('areacrm_users_list', JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users to localStorage', e);
    }
  }, [users]);
  const branchesRef = useRef<BranchLocation[]>(branches);
  branchesRef.current = branches;

  // Google / Gmail Auth & Whitelist Access Control
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('areacrm_active_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed.email?.toLowerCase() === 'scorpionabid82@gmail.com' && parsed.fullName?.includes('Elnur Qasımzadə')) {
        parsed.fullName = auth.currentUser?.displayName || 'scorpionabid82';
        parsed.phone = auth.currentUser?.phoneNumber || '';
        parsed.photoURL = auth.currentUser?.photoURL || undefined;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [accessDeniedEmail, setAccessDeniedEmail] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Real-time Firestore sync for users whitelist (loads unconditionally so Login screen has all users)
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        if (!snapshot.empty) {
          const dbUsers: UserAccount[] = [];
          snapshot.forEach(docSnap => {
            dbUsers.push(docSnap.data() as UserAccount);
          });
          const existingEmails = new Set(dbUsers.map(u => u.email.toLowerCase()));
          const missingUsers = REAL_AUTHORIZED_USERS.filter(u => !existingEmails.has(u.email.toLowerCase()));
          if (missingUsers.length > 0) {
            missingUsers.forEach(async mu => {
              try {
                await setDoc(doc(db, 'users', mu.id), mu);
              } catch (err) {
                console.warn('Syncing missing user error:', err);
              }
            });
            setUsers([...dbUsers, ...missingUsers]);
          } else {
            setUsers(dbUsers);
          }
        } else {
          // First-time DB initialization: seed authorized directors into Firestore
          REAL_AUTHORIZED_USERS.forEach(async u => {
            try {
              await setDoc(doc(db, 'users', u.id), u);
            } catch (err) {
              console.warn('Seeding user error:', err);
            }
          });
          setUsers(REAL_AUTHORIZED_USERS);
        }
      },
      error => {
        console.warn('Firestore users snapshot listener error:', error);
      }
    );

    return () => unsubscribeUsers();
  }, []);

  // Real-time Firestore sync for branches (loads unconditionally for global network selector and login)
  useEffect(() => {
    const unsubscribeBranches = onSnapshot(
      collection(db, 'branches'),
      snapshot => {
        if (!snapshot.empty) {
          const dbBranches: BranchLocation[] = [];
          snapshot.forEach(docSnap => {
            dbBranches.push(docSnap.data() as BranchLocation);
          });
          const existingIds = new Set(dbBranches.map(b => b.id));
          const deletedIds = getDeletedItemIds();
          const missingBranches = INITIAL_BRANCHES.filter(b => !existingIds.has(b.id) && !deletedIds.has(b.id));
          if (missingBranches.length > 0) {
            missingBranches.forEach(async mb => {
              try {
                await setDoc(doc(db, 'branches', mb.id), mb);
              } catch (err) {
                console.warn('Syncing missing branch error:', err);
              }
            });
            setBranches([...dbBranches, ...missingBranches]);
          } else {
            setBranches(dbBranches);
          }
        } else {
          // First-time DB initialization: seed non-deleted branches into Firestore
          const deletedIds = getDeletedItemIds();
          const initialToSeed = INITIAL_BRANCHES.filter(b => !deletedIds.has(b.id));
          initialToSeed.forEach(async b => {
            try {
              await setDoc(doc(db, 'branches', b.id), b);
            } catch (err) {
              console.warn('Seeding branch error:', err);
            }
          });
          setBranches(initialToSeed);
        }
      },
      error => {
        console.warn('Firestore branches snapshot listener error:', error);
      }
    );

    return () => unsubscribeBranches();
  }, []);

  // Real-time Firestore sync for Students
  useEffect(() => {
    const unsubscribeStudents = onSnapshot(
      collection(db, 'students'),
      snapshot => {
        const dbStudents: Student[] = [];
        snapshot.forEach(docSnap => {
          const item = { id: docSnap.id, ...(docSnap.data() as any) } as Student;
          if (!MOCK_ITEM_IDS.has(item.id)) {
            dbStudents.push(item);
          }
        });

        // Real-time seamless merge ensuring freshly added students never flicker or vanish
        setStudents(prev => {
          const dbMap = new Map(dbStudents.map(s => [s.id, s]));
          const localPending = prev.filter(p => !dbMap.has(p.id) && !MOCK_ITEM_IDS.has(p.id));
          const merged = [...localPending, ...dbStudents];
          return merged.sort((a, b) => {
            const timeA = a.createdAt || (a.enrollmentDate ? `${a.enrollmentDate}T00:00:00.000Z` : '') || a.id;
            const timeB = b.createdAt || (b.enrollmentDate ? `${b.enrollmentDate}T00:00:00.000Z` : '') || b.id;
            return timeB.localeCompare(timeA);
          });
        });

        try {
          localStorage.setItem('areacrm_students_list', JSON.stringify(dbStudents));
        } catch (e) {
          console.warn('Failed to save students to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore students snapshot listener error:', error);
      }
    );

    return () => unsubscribeStudents();
  }, []);

  // Real-time Firestore sync for Groups
  useEffect(() => {
    const unsubscribeGroups = onSnapshot(
      collection(db, 'groups'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbGroups: Group[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as Group;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbGroups.push(item);
          }
        });

        setGroups(dbGroups);
        try {
          localStorage.setItem('areacrm_groups_list', JSON.stringify(dbGroups));
        } catch (e) {
          console.warn('Failed to save groups to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore groups snapshot listener error:', error);
      }
    );

    return () => unsubscribeGroups();
  }, []);

  // Real-time Firestore sync for Leads
  useEffect(() => {
    const unsubscribeLeads = onSnapshot(
      collection(db, 'leads'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbLeads: Lead[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as Lead;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbLeads.push(item);
          }
        });

        setLeads(dbLeads);
        try {
          localStorage.setItem('areacrm_leads_list', JSON.stringify(dbLeads));
        } catch (e) {
          console.warn('Failed to save leads to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore leads snapshot listener error:', error);
      }
    );

    return () => unsubscribeLeads();
  }, []);

  // Real-time Firestore sync for Staff
  useEffect(() => {
    const unsubscribeStaff = onSnapshot(
      collection(db, 'staff'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbStaff: StaffMember[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as StaffMember;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbStaff.push(item);
          }
        });

        setStaff(dbStaff);
        try {
          localStorage.setItem('areacrm_staff_list', JSON.stringify(dbStaff));
        } catch (e) {
          console.warn('Failed to save staff to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore staff snapshot listener error:', error);
      }
    );

    return () => unsubscribeStaff();
  }, []);

  // Real-time Firestore sync for Student Attendance
  useEffect(() => {
    const unsubscribeAtt = onSnapshot(
      collection(db, 'studentAttendance'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbAtt: StudentAttendanceRecord[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as StudentAttendanceRecord;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbAtt.push(item);
          }
        });

        setStudentAttendance(dbAtt);
        try {
          localStorage.setItem('areacrm_student_attendance_list', JSON.stringify(dbAtt));
        } catch (e) {
          console.warn('Failed to save student attendance to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore studentAttendance snapshot listener error:', error);
      }
    );

    return () => unsubscribeAtt();
  }, []);

  // Real-time Firestore sync for Lesson Sessions
  useEffect(() => {
    const unsubscribeSessions = onSnapshot(
      collection(db, 'lessonSessions'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbSessions: LessonSessionRecord[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as LessonSessionRecord;
          if (!deletedIds.has(item.id)) {
            dbSessions.push(item);
          }
        });

        setLessonSessions(dbSessions);
        try {
          localStorage.setItem('areacrm_lesson_sessions_list', JSON.stringify(dbSessions));
        } catch (e) {
          console.warn('Failed to save lessonSessions to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore lessonSessions snapshot listener error:', error);
      }
    );

    return () => unsubscribeSessions();
  }, []);

  // Real-time Firestore sync for Staff Attendance
  useEffect(() => {
    const unsubscribeStaffAtt = onSnapshot(
      collection(db, 'staffAttendance'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbStaffAtt: StaffAttendanceLog[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as StaffAttendanceLog;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbStaffAtt.push(item);
          }
        });

        setStaffAttendance(dbStaffAtt);
        try {
          localStorage.setItem('areacrm_staff_attendance_list', JSON.stringify(dbStaffAtt));
        } catch (e) {
          console.warn('Failed to save staff attendance to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore staffAttendance snapshot listener error:', error);
      }
    );

    return () => unsubscribeStaffAtt();
  }, []);

  // Real-time Firestore sync for Payments
  useEffect(() => {
    const unsubscribePayments = onSnapshot(
      collection(db, 'payments'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbPayments: PaymentTransaction[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as PaymentTransaction;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbPayments.push(item);
          }
        });

        setPayments(dbPayments);
        try {
          localStorage.setItem('areacrm_payments_list', JSON.stringify(dbPayments));
        } catch (e) {
          console.warn('Failed to save payments to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore payments snapshot listener error:', error);
      }
    );

    return () => unsubscribePayments();
  }, []);

  // Real-time Firestore sync for Expenses
  useEffect(() => {
    const unsubscribeExpenses = onSnapshot(
      collection(db, 'expenses'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbExpenses: Expense[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as Expense;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbExpenses.push(item);
          }
        });

        setExpenses(dbExpenses);
        try {
          localStorage.setItem('areacrm_expenses_list', JSON.stringify(dbExpenses));
        } catch (e) {
          console.warn('Failed to save expenses to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore expenses snapshot listener error:', error);
      }
    );

    return () => unsubscribeExpenses();
  }, []);

  // Real-time Firestore sync for Extra Incomes
  useEffect(() => {
    const unsubscribeExtraIncomes = onSnapshot(
      collection(db, 'extraIncomes'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbIncomes: ExtraIncome[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as ExtraIncome;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbIncomes.push(item);
          }
        });

        setExtraIncomes(dbIncomes);
        try {
          localStorage.setItem('areacrm_extra_incomes_list', JSON.stringify(dbIncomes));
        } catch (e) {
          console.warn('Failed to save extra incomes to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore extraIncomes snapshot listener error:', error);
      }
    );

    return () => unsubscribeExtraIncomes();
  }, []);

  // Real-time Firestore sync for Certificates
  useEffect(() => {
    const unsubscribeCertificates = onSnapshot(
      collection(db, 'certificates'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbCerts: Certificate[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as Certificate;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbCerts.push(item);
          }
        });

        setCertificates(dbCerts);
        try {
          localStorage.setItem('areacrm_certificates_list', JSON.stringify(dbCerts));
        } catch (e) {
          console.warn('Failed to save certificates to localStorage', e);
        }
      },
      error => {
        console.warn('Firestore certificates snapshot listener error:', error);
      }
    );

    return () => unsubscribeCertificates();
  }, []);

  // Real-time Firestore sync for Contracts
  useEffect(() => {
    const unsubscribeContracts = onSnapshot(
      collection(db, 'contracts'),
      snapshot => {
        const dbContracts: StudentContract[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as StudentContract;
          if (!MOCK_ITEM_IDS.has(item.id)) {
            dbContracts.push(item);
          }
        });

        setContracts(dbContracts);
        try {
          localStorage.setItem('areacrm_contracts_list', JSON.stringify(dbContracts));
        } catch (e) {
          console.warn('Failed to save contracts to localStorage', e);
        }
      },
      error => {
        if (!error.message?.includes('offline')) {
          console.warn('Firestore contracts snapshot listener error:', error);
        }
      }
    );

    return () => unsubscribeContracts();
  }, []);

  // Real-time Firestore sync for Student Debts
  useEffect(() => {
    const unsubscribeDebts = onSnapshot(
      collection(db, 'student_debts'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbDebts: StudentDebtRecord[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as StudentDebtRecord;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbDebts.push(item);
          }
        });

        setStudentDebts(dbDebts);
        try {
          localStorage.setItem('areacrm_student_debts_list', JSON.stringify(dbDebts));
        } catch (e) {
          console.warn('Failed to save student debts to localStorage', e);
        }
      },
      error => {
        if (!error.message?.includes('offline')) {
          console.warn('Firestore student_debts snapshot listener error:', error);
        }
      }
    );

    return () => unsubscribeDebts();
  }, []);

  // Real-time Firestore sync for Curriculums
  useEffect(() => {
    const unsubscribeCurriculums = onSnapshot(
      collection(db, 'curriculums'),
      snapshot => {
        if (!snapshot.empty) {
          const dbCurrs: Curriculum[] = [];
          snapshot.forEach(docSnap => {
            dbCurrs.push(docSnap.data() as Curriculum);
          });
          const existingIds = new Set(dbCurrs.map(c => c.id));
          const deletedIds = getDeletedItemIds();
          const missingCurrs = INITIAL_CURRICULUMS.filter(c => !existingIds.has(c.id) && !deletedIds.has(c.id));
          if (missingCurrs.length > 0) {
            missingCurrs.forEach(mc => {
              setDoc(doc(db, 'curriculums', mc.id), mc, { merge: true }).catch(console.warn);
            });
            setCurriculums([...dbCurrs, ...missingCurrs]);
          } else {
            setCurriculums(dbCurrs);
          }
        } else {
          const deletedIds = getDeletedItemIds();
          const filteredInitial = INITIAL_CURRICULUMS.filter(c => !deletedIds.has(c.id));
          filteredInitial.forEach(c => {
            setDoc(doc(db, 'curriculums', c.id), c, { merge: true }).catch(console.warn);
          });
          setCurriculums(filteredInitial);
        }
      },
      error => {
        console.warn('Firestore curriculums snapshot listener error:', error);
      }
    );

    return () => unsubscribeCurriculums();
  }, []);

  // Real-time Firestore sync for Trainer Salaries
  useEffect(() => {
    const unsubscribeSalaries = onSnapshot(
      collection(db, 'trainer_salaries'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        const dbSalaries: TrainerSalary[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as TrainerSalary;
          if (!MOCK_ITEM_IDS.has(item.id) && !deletedIds.has(item.id)) {
            dbSalaries.push(item);
          }
        });
        setTrainerSalaries(dbSalaries);
        try {
          localStorage.setItem('areacrm_trainer_salaries', JSON.stringify(dbSalaries));
        } catch (e) {
          console.warn('Failed to save trainer salaries to localStorage', e);
        }
      },
      error => {
        if (!error.message?.includes('offline')) {
          console.warn('Firestore trainer_salaries snapshot listener error:', error);
        }
      }
    );

    return () => unsubscribeSalaries();
  }, []);

  // Real-time Firestore sync for Notifications
  useEffect(() => {
    const unsubscribeNotifs = onSnapshot(
      collection(db, 'notifications'),
      snapshot => {
        const dbNotifs: NotificationItem[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as NotificationItem;
          if (!MOCK_ITEM_IDS.has(item.id)) {
            dbNotifs.push(item);
          }
        });

        setNotifications(dbNotifs);
      },
      error => {
        console.warn('Firestore notifications snapshot listener error:', error);
      }
    );

    return () => unsubscribeNotifs();
  }, []);

  // Real-time Firestore sync for Tasks
  useEffect(() => {
    const unsubscribeTasks = onSnapshot(
      collection(db, 'tasks'),
      snapshot => {
        const deletedIds = getDeletedItemIds();
        if (!snapshot.empty) {
          const dbTasks: TaskItem[] = [];
          snapshot.forEach(docSnap => {
            const item = docSnap.data() as TaskItem;
            if (!deletedIds.has(item.id)) {
              dbTasks.push(item);
            }
          });
          setTasks(dbTasks);
          try {
            localStorage.setItem('areacrm_tasks_list', JSON.stringify(dbTasks));
          } catch (e) {
            console.warn(e);
          }
        } else {
          const filteredTasks = INITIAL_TASKS.filter(t => !deletedIds.has(t.id));
          setTasks(filteredTasks);
        }
      },
      error => {
        if (!error.message?.includes('offline')) {
          console.warn('Firestore tasks snapshot listener error:', error);
        }
      }
    );

    return () => unsubscribeTasks();
  }, []);

  // Sync auth state with Firebase Auth (runs once on mount)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async fbUser => {
      if (fbUser) {
        const email = (fbUser.email || fbUser.providerData?.[0]?.email || '').toLowerCase().trim();
        const realName = fbUser.displayName || fbUser.providerData?.[0]?.displayName || email.split('@')[0];
        const realPhoto = fbUser.photoURL || fbUser.providerData?.[0]?.photoURL || undefined;
        const realPhone = fbUser.phoneNumber || fbUser.providerData?.[0]?.phoneNumber || '';

        // 1. Director Rule: scorpionabid82@gmail.com, roboticsarea@gmail.com, mentor.rasulzada@gmail.com
        if (isDirectorEmail(email)) {
          const existing = usersRef.current.find(u => u.email.toLowerCase() === email);
          const defaultFullName =
            email === 'roboticsarea@gmail.com'
              ? 'Robotics AREA'
              : email === 'mentor.rasulzada@gmail.com'
              ? 'Mentor Rəsulzadə'
              : email === 'texnobabasatis@gmail.com'
              ? 'Texnobaba Satış Direktoru'
              : email === 'hasanovfariz@gmail.com'
              ? 'Fariz Həsənov'
              : 'scorpionabid82';

          const dir: UserAccount = {
            id: existing?.id || (email === 'scorpionabid82@gmail.com' ? 'usr-director-abid' : `usr-dir-${email.split('@')[0]}`),
            fullName: fbUser.displayName || (existing?.fullName && !existing.fullName.includes('Elnur Qasımzadə') ? existing.fullName : defaultFullName),
            email: email,
            phone: realPhone || (existing?.phone && !existing.phone.includes('+994 50 200 11 22') ? existing.phone : ''),
            photoURL: realPhoto || existing?.photoURL || existing?.avatarUrl,
            avatarUrl: realPhoto || existing?.photoURL || existing?.avatarUrl,
            role: 'direktor',
            branchId: 'all',
            branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
            isSuperAdmin: true,
            status: 'aktiv',
            createdAt: existing?.createdAt || '2026-04-01',
            lastLogin: 'Bugün, ' + new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
            notes: 'Baş Direktor və Superadmin. Bütün filiallar üzrə tam səlahiyyət.'
          };

          setCurrentUser(prev => {
            if (
              prev &&
              prev.id === dir.id &&
              prev.email === dir.email &&
              prev.fullName === dir.fullName &&
              prev.photoURL === dir.photoURL &&
              prev.phone === dir.phone &&
              prev.role === dir.role
            ) {
              return prev;
            }
            return dir;
          });
          setCurrentRole(r => (r !== 'direktor' ? 'direktor' : r));
          localStorage.setItem('areacrm_active_session', JSON.stringify(dir));
          setDoc(doc(db, 'users', dir.id), dir, { merge: true }).catch(console.error);
          setAccessDeniedEmail(null);
          return;
        }

        // 2. Check if email is in the DB whitelist
        let matched = usersRef.current.find(u => u.email.toLowerCase() === email);
        if (!matched) {
          try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              matched = snap.docs[0].data() as UserAccount;
            } else {
              const allSnap = await getDocs(collection(db, 'users'));
              allSnap.forEach(d => {
                const u = d.data() as UserAccount;
                if (u.email && u.email.toLowerCase() === email) {
                  matched = u;
                }
              });
            }
            if (matched) {
              setUsers(prev => {
                const updated = [matched!, ...prev.filter(u => u.id !== matched!.id)];
                try {
                  localStorage.setItem('areacrm_users_list', JSON.stringify(updated));
                } catch (e) {
                  console.warn(e);
                }
                return updated;
              });
            }
          } catch (dbErr) {
            console.warn('Error querying user onAuthStateChanged from Firestore:', dbErr);
          }
        }

        if (matched) {
          if (matched.status === 'bloklanib') {
            await signOut(auth);
            setCurrentUser(null);
            localStorage.removeItem('areacrm_active_session');
            setAccessDeniedEmail(`${email} (Hesabınız inzibatçı tərəfindən bloklanıb)`);
            return;
          }
          const updatedUser: UserAccount = {
            ...matched,
            fullName: fbUser.displayName || matched.fullName,
            photoURL: realPhoto || matched.photoURL || matched.avatarUrl,
            avatarUrl: realPhoto || matched.photoURL || matched.avatarUrl,
            phone: realPhone || matched.phone,
            lastLogin: 'Bugün, ' + new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
          };
          setCurrentUser(prev => {
            if (
              prev &&
              prev.id === updatedUser.id &&
              prev.email === updatedUser.email &&
              prev.fullName === updatedUser.fullName &&
              prev.photoURL === updatedUser.photoURL &&
              prev.role === updatedUser.role
            ) {
              return prev;
            }
            return updatedUser;
          });
          setCurrentRole(r => (r !== updatedUser.role ? updatedUser.role : r));
          localStorage.setItem('areacrm_active_session', JSON.stringify(updatedUser));
          setDoc(doc(db, 'users', matched.id), updatedUser, { merge: true }).catch(console.error);
          setAccessDeniedEmail(null);
        } else {
          // NOT in DB -> Deny access!
          await signOut(auth);
          setCurrentUser(null);
          localStorage.removeItem('areacrm_active_session');
          setAccessDeniedEmail(email);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthLoading(true);
    setAccessDeniedEmail(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = (result.user.email || result.user.providerData?.[0]?.email || '').toLowerCase().trim();
      const realName = result.user.displayName || result.user.providerData?.[0]?.displayName || email.split('@')[0];
      const realPhoto = result.user.photoURL || result.user.providerData?.[0]?.photoURL || undefined;
      const realPhone = result.user.phoneNumber || result.user.providerData?.[0]?.phoneNumber || '';

      if (isDirectorEmail(email)) {
        const existing = users.find(u => u.email.toLowerCase() === email);
        const defaultFullName =
          email === 'roboticsarea@gmail.com'
            ? 'Robotics AREA'
            : email === 'mentor.rasulzada@gmail.com'
            ? 'Mentor Rəsulzadə'
            : email === 'texnobabasatis@gmail.com'
            ? 'Texnobaba Satış Direktoru'
            : email === 'hasanovfariz@gmail.com'
            ? 'Fariz Həsənov'
            : 'scorpionabid82';

        const dir: UserAccount = {
          id: existing?.id || (email === 'scorpionabid82@gmail.com' ? 'usr-director-abid' : `usr-dir-${email.split('@')[0]}`),
          fullName: realName || (existing?.fullName || defaultFullName),
          email: email,
          phone: realPhone || (existing?.phone && !existing.phone.includes('+994 50 200 11 22') ? existing.phone : ''),
          photoURL: realPhoto || existing?.photoURL || existing?.avatarUrl,
          avatarUrl: realPhoto || existing?.photoURL || existing?.avatarUrl,
          role: 'direktor',
          branchId: 'all',
          branchName: 'Bütün Filiallar (Qlobal Şəbəkə)',
          isSuperAdmin: true,
          status: 'aktiv',
          createdAt: existing?.createdAt || '2026-04-01',
          lastLogin: 'Bugün, ' + new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
          notes: 'Baş Direktor və Superadmin. Bütün filiallar üzrə tam səlahiyyət.'
        };
        setUsers(prev => {
          const has = prev.some(u => u.id === dir.id || u.email.toLowerCase() === email);
          if (has) return prev.map(u => (u.id === dir.id || u.email.toLowerCase() === email ? dir : u));
          return [dir, ...prev];
        });
        setCurrentUser(dir);
        setCurrentRole('direktor');
        setSelectedBranchId('all');
        localStorage.setItem('areacrm_active_session', JSON.stringify(dir));
        setDoc(doc(db, 'users', dir.id), dir, { merge: true }).catch(console.error);
        showToast(`Baş Direktor (Superadmin) kimi daxil oldunuz: ${dir.fullName}!`);
        setAccessDeniedEmail(null);
        return;
      }

      let matched = users.find(u => u.email.toLowerCase() === email);
      if (!matched) {
        try {
          const q = query(collection(db, 'users'), where('email', '==', email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            matched = snap.docs[0].data() as UserAccount;
          } else {
            const allSnap = await getDocs(collection(db, 'users'));
            allSnap.forEach(d => {
              const u = d.data() as UserAccount;
              if (u.email && u.email.toLowerCase() === email) {
                matched = u;
              }
            });
          }
          if (matched) {
            setUsers(prev => {
              const updated = [matched!, ...prev.filter(u => u.id !== matched!.id)];
              try {
                localStorage.setItem('areacrm_users_list', JSON.stringify(updated));
              } catch (e) {
                console.warn(e);
              }
              return updated;
            });
          }
        } catch (dbErr) {
          console.warn('Error querying Firestore for user in loginWithGoogle:', dbErr);
        }
      }

      if (matched) {
        if (matched.status === 'bloklanib' || matched.isDeleted) {
          await signOut(auth);
          setCurrentUser(null);
          setAccessDeniedEmail(`${email} (Hesabınız inzibatçı tərəfindən bloklanıb və ya deaktiv edilib)`);
          showToast('Hesabınız bloklanıb, inzibatçı ilə əlaqə saxlayın', 'error');
          return;
        }
        const realUser: UserAccount = {
          ...matched,
          fullName: realName,
          photoURL: realPhoto || matched.photoURL || matched.avatarUrl,
          avatarUrl: realPhoto || matched.photoURL || matched.avatarUrl,
          phone: realPhone || matched.phone,
          lastLogin: 'Bugün, ' + new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
        };
        setCurrentUser(realUser);
        setCurrentRole(realUser.role);
        if (realUser.branchId) {
          setSelectedBranchId(realUser.branchId);
        }
        localStorage.setItem('areacrm_active_session', JSON.stringify(realUser));
        setDoc(doc(db, 'users', matched.id), realUser, { merge: true }).catch(console.error);
        setAccessDeniedEmail(null);
        showToast(`Xoş gəlmisiniz, ${realUser.fullName}! (${realUser.role.toUpperCase()})`);
      } else {
        await signOut(auth);
        setCurrentUser(null);
        setAccessDeniedEmail(email);
        showToast(`Giriş qadağandır: ${email} bazada qeydiyyatdan keçməyib!`, 'error');
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast(`Google giriş xətası: ${err.message}`, 'error');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithEmailOrUsername = async (
    _emailOrUsername: string,
    _password?: string
  ): Promise<{ success: boolean; message: string }> => {
    showToast('Təhlükəsizlik qaydalarına əsasən birbaşa giriş məhdudlaşdırılıb. Zəhmət olmasa "Gmail ilə Daxil Ol" düyməsindən istifadə edin.', 'error');
    return { success: false, message: 'Yalnız Google Auth ilə təsdiqlənmiş giriş icazəlidir' };
  };


  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('areacrm_active_session');
    setCurrentUser(null);
    setAccessDeniedEmail(null);
    showToast('Sistemdən çıxış edildi', 'info');
  };

  const dismissAccessDenied = () => {
    setAccessDeniedEmail(null);
  };

  const [dynamicQrToken, setDynamicQrToken] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Rotate dynamic QR code every 20 seconds for the current selected branch
  useEffect(() => {
    const updateToken = () => {
      const targetBranchId = selectedBranchId === 'all' ? (branches[0]?.id || 'branch-nerimanov') : selectedBranchId;
      setDynamicQrToken(generateDynamicQrToken(targetBranchId, Date.now()));
    };
    updateToken();
    const interval = setInterval(updateToken, 20000);
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  // Branches CRUD (Director / Superadmin only)
  const addBranch = (data: Omit<BranchLocation, 'id'>): BranchLocation => {
    const newBranch: BranchLocation = {
      ...data,
      id: generateId('branch'),
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
      status: data.status || 'aktiv',
      isDeleted: false,
    };
    setBranches(prev => [...prev, newBranch]);
    setDoc(doc(db, 'branches', newBranch.id), newBranch).catch(err => {
      console.warn('Failed to write branch to Firestore:', err);
    });
    showToast(`Yeni filial əlavə edildi: ${newBranch.name}`);
    return newBranch;
  };

  const updateBranch = (id: string, data: Partial<BranchLocation>) => {
    setBranches(prev => prev.map(b => (b.id === id ? { ...b, ...data } : b)));
    updateDoc(doc(db, 'branches', id), data).catch(err => {
      console.warn('Failed to update branch in Firestore:', err);
    });
    showToast(`Filial məlumatları yeniləndi`);
  };

  const softDeleteBranch = (id: string) => {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    const deletedAt = new Date().toISOString();
    const deletedBy = currentUser?.email || 'admin';
    setBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, isDeleted: true, status: 'silinib', deletedAt, deletedBy } : b))
    );
    updateDoc(doc(db, 'branches', id), { isDeleted: true, status: 'silinib', deletedAt, deletedBy }).catch(err => {
      console.warn('Failed to soft delete branch in Firestore:', err);
    });
    if (selectedBranchId === id) {
      setSelectedBranchId('all');
    }
    showToast(`"${branch.name}" arxive göndərildi (Soft Delete)`, 'info');
  };

  const restoreBranch = (id: string) => {
    const branch = branches.find(b => b.id === id);
    if (!branch) return;
    setBranches(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, isDeleted: false, status: 'aktiv', deletedAt: undefined, deletedBy: undefined }
          : b
      )
    );
    updateDoc(doc(db, 'branches', id), { isDeleted: false, status: 'aktiv', deletedAt: null, deletedBy: null }).catch(err => {
      console.warn('Failed to restore branch in Firestore:', err);
    });
    showToast(`"${branch.name}" uğurla bərpa edildi`, 'success');
  };

  const hardDeleteBranch = (id: string) => {
    const branch = branches.find(b => b.id === id);
    const activeRemaining = branches.filter(b => b.id !== id && !b.isDeleted);
    if (activeRemaining.length === 0) {
      showToast('Sistemdə ən azı bir aktiv filial qalmalıdır!', 'error');
      return;
    }
    registerDeletedItemId(id);
    setBranches(prev => prev.filter(b => b.id !== id));
    deleteDoc(doc(db, 'branches', id)).catch(err => {
      console.warn('Failed to hard delete branch in Firestore:', err);
    });
    if (selectedBranchId === id) {
      setSelectedBranchId('all');
    }
    showToast(`"${branch?.name || 'Filial'}" birdəfəlik fiziki silindi (Hard Delete)`, 'info');
  };

  const deleteBranch = (id: string) => {
    softDeleteBranch(id);
  };

  // Users CRUD (4 Roles RBAC) with Firestore persistence
  const addUser = (data: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const newUser: UserAccount = {
      ...data,
      id: generateId('usr'),
      createdAt: new Date().toISOString().split('T')[0],
      status: data.status || 'aktiv',
      isDeleted: false,
      lastLogin: 'Yeni qeydiyyat',
    };
    setUsers(prev => [newUser, ...prev]);
    setDoc(doc(db, 'users', newUser.id), newUser).catch(err => {
      console.warn('Failed to write user to Firestore:', err);
    });
    showToast(`Yeni istifadəçi əlavə edildi: ${newUser.fullName} (${newUser.role})`);
    return newUser;
  };

  const updateUser = (id: string, data: Partial<UserAccount>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...data } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...data };
        localStorage.setItem('areacrm_active_session', JSON.stringify(updated));
        return updated;
      });
    }
    updateDoc(doc(db, 'users', id), data).catch(err => {
      console.warn('Failed to update user in Firestore:', err);
    });
    showToast(`İstifadəçi hesabı yeniləndi`);
  };

  const softDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    const deletedAt = new Date().toISOString();
    const deletedBy = currentUser?.email || 'admin';
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, isDeleted: true, status: 'silinib', deletedAt, deletedBy } : u))
    );
    updateDoc(doc(db, 'users', id), { isDeleted: true, status: 'silinib', deletedAt, deletedBy }).catch(err => {
      console.warn('Failed to soft delete user in Firestore:', err);
    });
    showToast(`${targetUser.fullName} arxive göndərildi (Soft Delete)`, 'info');
  };

  const restoreUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return;
    setUsers(prev =>
      prev.map(u =>
        u.id === id
          ? { ...u, isDeleted: false, status: 'aktiv', deletedAt: undefined, deletedBy: undefined }
          : u
      )
    );
    updateDoc(doc(db, 'users', id), { isDeleted: false, status: 'aktiv', deletedAt: null, deletedBy: null }).catch(err => {
      console.warn('Failed to restore user in Firestore:', err);
    });
    showToast(`${targetUser.fullName} hesabı uğurla bərpa edildi`, 'success');
  };

  const hardDeleteUser = (id: string) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser?.email && isDirectorEmail(targetUser.email)) {
      const activeDirectors = users.filter(u => isDirectorEmail(u.email) && !u.isDeleted && u.id !== id);
      if (activeDirectors.length === 0) {
        showToast('Sistemdəki yeganə aktiv Baş Direktoru silmək olmaz!', 'error');
        return;
      }
    }
    registerDeletedItemId(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    deleteDoc(doc(db, 'users', id)).catch(err => {
      console.warn('Failed to hard delete user in Firestore:', err);
    });
    showToast(`${targetUser?.fullName || 'İstifadəçi'} birdəfəlik fiziki silindi (Hard Delete)`, 'info');
  };

  const deleteUser = (id: string) => {
    softDeleteUser(id);
  };

  // Students CRUD
  const addStudent = (data: Omit<Student, 'id' | 'attendanceRate'>): Student => {
    const cleanName = data.fullName.trim();
    const cleanFin = data.finCode ? data.finCode.trim().toUpperCase() : undefined;

    // Validate uniqueness of student by FIN code OR full name (cannot add same student twice)
    const existingStudent = students.find(s => {
      if (s.isDeleted) return false;
      const sameName = s.fullName.trim().toLowerCase() === cleanName.toLowerCase();
      const sameFin = cleanFin && s.finCode && s.finCode.trim().toUpperCase() === cleanFin;
      return sameFin || sameName;
    });

    if (existingStudent) {
      const matchReason = (cleanFin && existingStudent.finCode && existingStudent.finCode.trim().toUpperCase() === cleanFin)
        ? `FİN kodu (${cleanFin})`
        : `Ad və Soyadı (${cleanName})`;
      showToast(
        `Xəta: ${matchReason} üzrə "${existingStudent.fullName}" adlı tələbə artıq bazada mövcuddur! Bir tələbə yalnız bir dəfə qeydiyyata alına bilər. Yeni proqram üçün mövcud tələbəyə yeni müqavilə bağlayın.`,
        'error'
      );
      return existingStudent;
    }

    const targetGroup = groups.find(g => g.id === data.groupId);
    const assignedBranchId =
      data.branchId ||
      targetGroup?.branchId ||
      (currentUser?.role === 'menecer' && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null) ||
      (selectedBranchId !== 'all' ? selectedBranchId : null) ||
      branches.find(b => !b.isDeleted)?.id ||
      'branch-nerimanov';
    const assignedBranchName =
      data.branchName ||
      targetGroup?.branchName ||
      (assignedBranchId ? branches.find(b => b.id === assignedBranchId)?.name : null) ||
      branches.find(b => !b.isDeleted)?.name ||
      'AREA Nərimanov Filialı';

    // Initial debt when student starts classes: monthly fee is automatically billed as debt (-balance)
    const initialDebt = -(Math.abs(data.monthlyFee || 0));
    const nowIso = new Date().toISOString();

    const newStudent: Student = {
      ...data,
      fullName: cleanName,
      finCode: cleanFin,
      balance: data.balance !== undefined && data.balance !== 0 ? data.balance : initialDebt,
      currentMonthDebt: Math.abs(data.monthlyFee || 0),
      lastDebtCreatedAt: nowIso,
      id: generateId('stu'),
      attendanceRate: 100,
      isDeleted: false,
      branchId: assignedBranchId,
      branchName: assignedBranchName,
      createdAt: nowIso,
    };
    setStudents(prev => [newStudent, ...prev]);

    // Persist student to Firestore with clean object
    const cleanedStudent = cleanFirestoreData(newStudent);
    setDoc(doc(db, 'students', newStudent.id), cleanedStudent)
      .then(() => {
        try {
          const currentList = JSON.parse(localStorage.getItem('areacrm_students_list') || '[]');
          if (Array.isArray(currentList)) {
            localStorage.setItem('areacrm_students_list', JSON.stringify([newStudent, ...currentList.filter(s => s.id !== newStudent.id)]));
          }
        } catch (e) {}
      })
      .catch(err => {
        console.error('Failed to save student to Firestore:', err);
        showToast(`Xəta: Tələbə bazaya saxlanıla bilmədi (${err?.message || 'Baza xətası'}). Yenidən cəhd edin.`, 'error');
      });

    // Automatically create the initial student contract for this program with lessonsPerMonth
    const contractNum = `AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const initialContract: StudentContract = {
      id: generateId('ctr'),
      contractNumber: contractNum,
      studentId: newStudent.id,
      studentName: newStudent.fullName,
      curriculumId: targetGroup?.courseId || '',
      courseName: newStudent.courseName || targetGroup?.courseName || 'Ümumi Kurs',
      branchId: assignedBranchId,
      branchName: assignedBranchName,
      groupId: newStudent.groupId || 'grp-unassigned',
      groupName: newStudent.groupName || 'Təyin edilməyib',
      startDate: newStudent.enrollmentDate,
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyFee: newStudent.monthlyFee,
      lessonsPerMonth: 8,
      scheduleTime: targetGroup?.schedule || 'Həftədə 2 dəfə',
      parentPhone: newStudent.parentPhone || '',
      totalMonths: 6,
      totalAmount: newStudent.monthlyFee * 6,
      paymentPlan: 'ayliq',
      status: 'aktiv',
      signedDate: newStudent.enrollmentDate,
      notes: newStudent.notes || 'İlkin qeydiyyat müqaviləsi',
      createdAt: nowIso,
    };
    setContracts(prev => [initialContract, ...prev]);
    const cleanedContract = cleanFirestoreData(initialContract);
    setDoc(doc(db, 'contracts', initialContract.id), cleanedContract).catch(err => {
      console.warn('Failed to save contract to Firestore:', err);
    });

    // Formally generate StudentDebtRecord in student_debts collection
    if (newStudent.monthlyFee > 0) {
      const currentMonth = nowIso.slice(0, 7);
      const initialDebtRecord: StudentDebtRecord = {
        id: generateId('dbt'),
        studentId: newStudent.id,
        studentName: newStudent.fullName,
        contractId: initialContract.id,
        contractNumber: initialContract.contractNumber,
        courseName: initialContract.courseName,
        groupId: initialContract.groupId,
        groupName: initialContract.groupName,
        amount: newStudent.monthlyFee,
        month: currentMonth,
        dueDate: initialContract.startDate || nowIso.split('T')[0],
        status: 'odenilmayib',
        paidAmount: 0,
        remainingAmount: newStudent.monthlyFee,
        createdAt: nowIso,
        notes: `İlkin qeydiyyat və müqavilə (#${initialContract.contractNumber}) üzrə cari ayın avtomatik formalaşmış təhsil haqqı borcu.`,
      };
      setStudentDebts(prev => [initialDebtRecord, ...prev]);
      const cleanedDebt = cleanFirestoreData(initialDebtRecord);
      setDoc(doc(db, 'student_debts', initialDebtRecord.id), cleanedDebt).catch(err => {
        console.warn('Failed to save initial student debt to Firestore:', err);
      });
    }

    showToast(`${newStudent.fullName} qeydiyyata alındı və bazaya yazıldı.`);

    // Update group student count locally and in Firestore
    setGroups(prev =>
      prev.map(g => (g.id === data.groupId ? { ...g, currentStudents: g.currentStudents + 1 } : g))
    );
    if (data.groupId && targetGroup) {
      updateDoc(doc(db, 'groups', data.groupId), {
        currentStudents: (targetGroup.currentStudents || 0) + 1,
      }).catch(console.warn);
    }

    showToast(`${newStudent.fullName} uğurla qeydiyyata alındı və müqavilə (#${contractNum}) bağlandı!`);
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    if (data.fullName) {
      const cleanName = data.fullName.trim();
      const duplicate = students.find(
        s => s.id !== id && !s.isDeleted && s.fullName.trim().toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        showToast(`Xəta: "${cleanName}" adlı başqa tələbə artıq mövcuddur! Tələbə adları unikal olmalıdır.`, 'error');
        return;
      }
      data.fullName = cleanName;
    }

    setStudents(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    updateDoc(doc(db, 'students', id), data).catch(err => {
      console.warn('Failed to update student in Firestore:', err);
    });

    if (data.fullName) {
      const updatedName = data.fullName;
      setContracts(prev => prev.map(c => (c.studentId === id ? { ...c, studentName: updatedName } : c)));
      contracts.filter(c => c.studentId === id).forEach(c => {
        updateDoc(doc(db, 'contracts', c.id), { studentName: updatedName }).catch(console.warn);
      });
    }

    showToast(`Tələbə məlumatları yeniləndi`);
  };

  const softDeleteStudent = (id: string) => {
    const stu = students.find(s => s.id === id);
    if (!stu) return;
    const deletedAt = new Date().toISOString();
    const deletedBy = currentUser?.email || 'admin';
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, isDeleted: true, status: 'silinib', deletedAt, deletedBy } : s))
    );
    updateDoc(doc(db, 'students', id), { isDeleted: true, status: 'silinib', deletedAt, deletedBy }).catch(err => {
      console.warn('Failed to soft delete student in Firestore:', err);
    });
    showToast(`${stu.fullName} arxive göndərildi (Soft Delete)`, 'info');
  };

  const restoreStudent = (id: string) => {
    const stu = students.find(s => s.id === id);
    if (!stu) return;
    removeDeletedItemId(id);
    setStudents(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, isDeleted: false, status: 'aktiv', deletedAt: undefined, deletedBy: undefined }
          : s
      )
    );
    updateDoc(doc(db, 'students', id), { isDeleted: false, status: 'aktiv', deletedAt: null, deletedBy: null }).catch(err => {
      console.warn('Failed to restore student in Firestore:', err);
    });
    showToast(`${stu.fullName} tələbəsi bərpa edildi`, 'success');
  };

  const hardDeleteStudent = (id: string) => {
    const stu = students.find(s => s.id === id);
    registerDeletedItemId(id);
    setStudents(prev => {
      const remaining = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('areacrm_students_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'students', id)).catch(err => {
      console.warn('Failed to hard delete student in Firestore:', err);
    });
    if (stu?.groupId) {
      const g = groups.find(grp => grp.id === stu.groupId);
      if (g) {
        updateDoc(doc(db, 'groups', stu.groupId), {
          currentStudents: Math.max(0, g.currentStudents - 1),
        }).catch(console.warn);
      }
      setGroups(prev =>
        prev.map(grp => (grp.id === stu.groupId ? { ...grp, currentStudents: Math.max(0, grp.currentStudents - 1) } : grp))
      );
    }
    // Also remove associated contracts
    const studentContractList = contracts.filter(c => c.studentId === id);
    studentContractList.forEach(c => {
      registerDeletedItemId(c.id);
      deleteDoc(doc(db, 'contracts', c.id)).catch(console.warn);
    });
    setContracts(prev => {
      const remaining = prev.filter(c => c.studentId !== id);
      try {
        localStorage.setItem('areacrm_contracts_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    // Also remove associated student debts
    const relatedDebts = studentDebts.filter(d => d.studentId === id);
    relatedDebts.forEach(d => {
      registerDeletedItemId(d.id);
      deleteDoc(doc(db, 'student_debts', d.id)).catch(console.warn);
    });
    setStudentDebts(prev => {
      const remaining = prev.filter(d => d.studentId !== id);
      try {
        localStorage.setItem('areacrm_student_debts_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    showToast(`${stu?.fullName || 'Tələbə'} birdəfəlik fiziki silindi (Hard Delete)`, 'info');
  };

  const deleteStudent = (id: string) => {
    softDeleteStudent(id);
  };

  // Contracts CRUD
  const addContract = (data: Omit<StudentContract, 'id' | 'createdAt'>): StudentContract => {
    const student = students.find(s => s.id === data.studentId);
    const targetBranchId = data.branchId || student?.branchId || (selectedBranchId !== 'all' ? selectedBranchId : (branches[0]?.id || 'branch-nerimanov'));
    const targetBranchName = data.branchName || student?.branchName || (branches.find(b => b.id === targetBranchId)?.name || 'AREA Nərimanov Filialı');
    const newContract: StudentContract = {
      ...data,
      id: generateId('ctr'),
      studentName: student?.fullName || data.studentName,
      branchId: targetBranchId,
      branchName: targetBranchName,
      lessonsPerMonth: data.lessonsPerMonth || 8,
      createdAt: new Date().toISOString(),
    };
    setContracts(prev => [newContract, ...prev]);
    setDoc(doc(db, 'contracts', newContract.id), newContract).catch(err => {
      console.warn('Failed to save contract to Firestore:', err);
    });

    // Automatic debt generation on contract creation / student starts program
    if (student && data.monthlyFee > 0) {
      const newBal = (student.balance || 0) - data.monthlyFee;
      const nowIso = new Date().toISOString();
      const currentMonth = nowIso.slice(0, 7);

      const newDebtRecord: StudentDebtRecord = {
        id: generateId('dbt'),
        studentId: student.id,
        studentName: student.fullName,
        contractId: newContract.id,
        contractNumber: newContract.contractNumber,
        courseName: newContract.courseName,
        groupId: newContract.groupId,
        groupName: newContract.groupName,
        amount: data.monthlyFee,
        month: currentMonth,
        dueDate: newContract.startDate || nowIso.split('T')[0],
        status: 'odenilmayib',
        paidAmount: 0,
        remainingAmount: data.monthlyFee,
        createdAt: nowIso,
        notes: `«${newContract.courseName}» proqram müqaviləsi (#${newContract.contractNumber}) üzrə cari ayın avtomatik formalaşmış təhsil haqqı borcu.`,
      };

      setStudentDebts(prev => [newDebtRecord, ...prev]);
      setDoc(doc(db, 'student_debts', newDebtRecord.id), newDebtRecord).catch(err => {
        console.warn('Failed to save student debt to Firestore:', err);
      });

      const newCurrentDebt = (student.currentMonthDebt || 0) + data.monthlyFee;
      const isUnassigned = !student.groupId || student.groupId === 'grp-unassigned';
      const studentUpdates: Partial<Student> = {
        balance: newBal,
        currentMonthDebt: newCurrentDebt,
        lastDebtCreatedAt: nowIso,
        ...(isUnassigned && data.groupId ? {
          groupId: data.groupId,
          groupName: data.groupName || student.groupName,
          courseName: data.courseName || student.courseName,
          monthlyFee: data.monthlyFee,
        } : {}),
      };

      setStudents(prev =>
        prev.map(s =>
          s.id === student.id
            ? { ...s, ...studentUpdates }
            : s
        )
      );
      updateDoc(doc(db, 'students', student.id), studentUpdates).catch(err => {
        console.warn('Failed to update student balance on contract in Firestore:', err);
      });

      showToast(
        `${newContract.studentName} üçün "${newContract.courseName}" proqram müqaviləsi (#${newContract.contractNumber}) bağlandı! Cari ay üzrə ${data.monthlyFee} AZN borc avtomatik yaradıldı və bazaya yazıldı.`
      );
    } else {
      showToast(`${newContract.studentName} üçün yeni proqram müqaviləsi (#${newContract.contractNumber}) bağlandı!`);
    }

    // Update group student count locally and in Firestore
    if (data.groupId) {
      setGroups(prev =>
        prev.map(g => (g.id === data.groupId ? { ...g, currentStudents: g.currentStudents + 1 } : g))
      );
      const grp = groups.find(g => g.id === data.groupId);
      if (grp) {
        updateDoc(doc(db, 'groups', data.groupId), { currentStudents: (grp.currentStudents || 0) + 1 }).catch(console.warn);
      }
    }

    return newContract;
  };

  const updateContract = (id: string, data: Partial<StudentContract>) => {
    const target = contracts.find(c => c.id === id);
    if (target && data.status === 'aktiv' && target.status !== 'aktiv') {
      const alreadyHasDebt = studentDebts.some(d => d.contractId === id);
      const student = students.find(s => s.id === target.studentId);
      if (!alreadyHasDebt && student && target.monthlyFee > 0) {
        const nowIso = new Date().toISOString();
        const currentMonth = nowIso.slice(0, 7);
        const newDebtRecord: StudentDebtRecord = {
          id: generateId('dbt'),
          studentId: student.id,
          studentName: student.fullName,
          contractId: target.id,
          contractNumber: target.contractNumber,
          courseName: target.courseName,
          groupId: target.groupId,
          groupName: target.groupName,
          amount: target.monthlyFee,
          month: currentMonth,
          dueDate: target.startDate || nowIso.split('T')[0],
          status: 'odenilmayib',
          paidAmount: 0,
          remainingAmount: target.monthlyFee,
          createdAt: nowIso,
          notes: `«${target.courseName}» proqram müqaviləsi (#${target.contractNumber}) təsdiqləndi və cari ay borcu Firestore bazasına yazıldı.`,
        };
        setStudentDebts(prev => [newDebtRecord, ...prev]);
        setDoc(doc(db, 'student_debts', newDebtRecord.id), newDebtRecord).catch(console.warn);

        const newBal = (student.balance || 0) - target.monthlyFee;
        const newDebt = (student.currentMonthDebt || 0) + target.monthlyFee;
        setStudents(prev =>
          prev.map(s => (s.id === student.id ? { ...s, balance: newBal, currentMonthDebt: newDebt, lastDebtCreatedAt: nowIso } : s))
        );
        updateDoc(doc(db, 'students', student.id), {
          balance: newBal,
          currentMonthDebt: newDebt,
          lastDebtCreatedAt: nowIso,
        }).catch(console.warn);
      }
    }

    setContracts(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
    updateDoc(doc(db, 'contracts', id), data).catch(err => {
      console.warn('Failed to update contract in Firestore:', err);
    });
    showToast('Müqavilə məlumatları yeniləndi');
  };

  const deleteAssociatedDebtsForContract = (contractId: string) => {
    const relatedDebts = studentDebts.filter(d => d.contractId === contractId);
    if (relatedDebts.length === 0) return;

    relatedDebts.forEach(debt => {
      registerDeletedItemId(debt.id);
      deleteDoc(doc(db, 'student_debts', debt.id)).catch(console.warn);

      // If debt was unpaid, revert student balance and currentMonthDebt
      if (debt.studentId && debt.status !== 'tam_odenilib' && debt.amount > 0) {
        setStudents(prev =>
          prev.map(s => {
            if (s.id === debt.studentId) {
              const newBal = (s.balance || 0) + debt.amount;
              const newDebt = Math.max(0, (s.currentMonthDebt || 0) - debt.amount);
              updateDoc(doc(db, 'students', s.id), {
                balance: newBal,
                currentMonthDebt: newDebt,
              }).catch(console.warn);
              return { ...s, balance: newBal, currentMonthDebt: newDebt };
            }
            return s;
          })
        );
      }
    });

    setStudentDebts(prev => {
      const remaining = prev.filter(d => d.contractId !== contractId);
      try {
        localStorage.setItem('areacrm_student_debts_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    showToast(`Müqaviləyə bağlı ${relatedDebts.length} ədəd borc qeydi ləğv edildi`, 'info');
  };

  const softDeleteContract = (id: string, options?: { deleteAssociatedDebts?: boolean }) => {
    const target = contracts.find(c => c.id === id);
    if (!target) return;
    const nowIso = new Date().toISOString();
    const updated: Partial<StudentContract> = {
      isDeleted: true,
      deletedAt: nowIso,
      deletedBy: currentUser?.fullName || 'Direktor',
      status: 'legv_edilib',
    };

    setContracts(prev => {
      const updatedList = prev.map(c => (c.id === id ? { ...c, ...updated } : c));
      try {
        localStorage.setItem('areacrm_contracts_list', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    updateDoc(doc(db, 'contracts', id), updated).catch(err => {
      console.warn('Failed to soft delete contract in Firestore:', err);
    });

    if (options?.deleteAssociatedDebts) {
      deleteAssociatedDebtsForContract(id);
    }

    showToast(`Müqavilə (${target.contractNumber}) arxivə göndərildi (Soft Delete)`, 'info');
  };

  const hardDeleteContract = (id: string, options?: { deleteAssociatedDebts?: boolean }) => {
    const target = contracts.find(c => c.id === id);
    registerDeletedItemId(id);

    setContracts(prev => {
      const remaining = prev.filter(c => c.id !== id);
      try {
        localStorage.setItem('areacrm_contracts_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });

    deleteDoc(doc(db, 'contracts', id)).catch(err => {
      console.warn('Failed to hard delete contract in Firestore:', err);
    });

    if (options?.deleteAssociatedDebts) {
      deleteAssociatedDebtsForContract(id);
    }

    showToast(`Müqavilə (${target?.contractNumber || id}) birdəfəlik fiziki silindi (Hard Delete)`, 'info');
  };

  const restoreContract = (id: string) => {
    const target = contracts.find(c => c.id === id);
    if (!target) return;
    removeDeletedItemId(id);
    const updated: Partial<StudentContract> = {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      status: 'aktiv',
    };

    setContracts(prev => {
      const updatedList = prev.map(c => (c.id === id ? { ...c, ...updated } : c));
      try {
        localStorage.setItem('areacrm_contracts_list', JSON.stringify(updatedList));
      } catch (e) {}
      return updatedList;
    });

    updateDoc(doc(db, 'contracts', id), {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      status: 'aktiv',
    }).catch(err => {
      console.warn('Failed to restore contract in Firestore:', err);
    });

    showToast(`Müqavilə (${target.contractNumber}) bərpa edildi və aktiv edildi`);
  };

  const deleteContract = (id: string, options?: { deleteAssociatedDebts?: boolean }) => {
    hardDeleteContract(id, options);
  };

  const getStudentContracts = (studentId: string): StudentContract[] => {
    return contracts.filter(c => c.studentId === studentId);
  };

  // Groups CRUD
  const addGroup = (groupData: Omit<Group, 'id' | 'currentStudents' | 'progressPercent'>): Group => {
    const assignedBranchId =
      groupData.branchId ||
      (selectedBranchId !== 'all' ? selectedBranchId : (currentUser?.branchId !== 'all' ? currentUser?.branchId : (branches[0]?.id || 'branch-nerimanov')));
    const assignedBranchName =
      groupData.branchName ||
      (assignedBranchId ? branches.find(b => b.id === assignedBranchId)?.name : (branches[0]?.name || 'AREA Nərimanov Filialı'));

    const newGroup: Group = {
      ...groupData,
      id: generateId('grp'),
      currentStudents: 0,
      progressPercent: 0,
      isDeleted: false,
      branchId: assignedBranchId,
      branchName: assignedBranchName,
    };
    setGroups(prev => [newGroup, ...prev]);
    setDoc(doc(db, 'groups', newGroup.id), newGroup).catch(err => {
      console.warn('Failed to save group to Firestore:', err);
    });
    showToast(`Yeni qrup "${newGroup.name}" yaradıldı`);
    return newGroup;
  };

  const updateGroup = (id: string, data: Partial<Group>) => {
    setGroups(prev => prev.map(g => (g.id === id ? { ...g, ...data } : g)));
    updateDoc(doc(db, 'groups', id), data).catch(err => {
      console.warn('Failed to update group in Firestore:', err);
    });
    showToast(`Qrup məlumatları yeniləndi`);
  };

  const softDeleteGroup = (id: string) => {
    const grp = groups.find(g => g.id === id);
    if (!grp) return;
    const deletedAt = new Date().toISOString();
    const deletedBy = currentUser?.email || 'admin';
    setGroups(prev =>
      prev.map(g => (g.id === id ? { ...g, isDeleted: true, status: 'silinib', deletedAt, deletedBy } : g))
    );
    updateDoc(doc(db, 'groups', id), { isDeleted: true, status: 'silinib', deletedAt, deletedBy }).catch(err => {
      console.warn('Failed to soft delete group in Firestore:', err);
    });
    showToast(`"${grp.name}" qrupu arxive göndərildi (Soft Delete)`, 'info');
  };

  const restoreGroup = (id: string) => {
    const grp = groups.find(g => g.id === id);
    if (!grp) return;
    setGroups(prev =>
      prev.map(g =>
        g.id === id
          ? { ...g, isDeleted: false, status: 'davam_edir', deletedAt: undefined, deletedBy: undefined }
          : g
      )
    );
    updateDoc(doc(db, 'groups', id), { isDeleted: false, status: 'davam_edir', deletedAt: null, deletedBy: null }).catch(err => {
      console.warn('Failed to restore group in Firestore:', err);
    });
    showToast(`"${grp.name}" qrupu bərpa edildi`, 'success');
  };

  const hardDeleteGroup = (id: string) => {
    const grp = groups.find(g => g.id === id);
    registerDeletedItemId(id);
    setGroups(prev => {
      const remaining = prev.filter(g => g.id !== id);
      try {
        localStorage.setItem('areacrm_groups_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'groups', id)).catch(err => {
      console.warn('Failed to hard delete group in Firestore:', err);
    });
    showToast(`"${grp?.name || 'Qrup'}" birdəfəlik fiziki silindi (Hard Delete)`, 'info');
  };

  const deleteGroup = (id: string) => {
    softDeleteGroup(id);
  };

  // Leads
  const addLead = (leadData: Omit<Lead, 'id' | 'createdAt'>): Lead => {
    const today = new Date().toISOString().split('T')[0];
    const assignedBranchId =
      leadData.branchId ||
      (selectedBranchId !== 'all' ? selectedBranchId : (currentUser?.branchId !== 'all' ? currentUser?.branchId : undefined));
    const assignedBranchName =
      leadData.branchName ||
      (assignedBranchId ? branches.find(b => b.id === assignedBranchId)?.name : undefined);

    const appCode =
      leadData.applicationCode ||
      `AREA-LID-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLead: Lead = {
      ...leadData,
      id: generateId('lead'),
      applicationCode: appCode,
      createdAt: today,
      branchId: assignedBranchId,
      branchName: assignedBranchName,
      assignedManager:
        leadData.assignedManager ||
        (currentUser?.role === 'menecer' && currentUser.fullName ? currentUser.fullName : 'Aytən Məmmədova'),
    };
    setLeads(prev => [newLead, ...prev]);
    setDoc(doc(db, 'leads', newLead.id), newLead).catch(err => {
      console.warn('Failed to save lead to Firestore:', err);
    });
    if (appCode && appCode !== newLead.id) {
      setDoc(doc(db, 'leads', appCode), newLead).catch(console.warn);
    }

    const cleanPhone = (newLead.phone || '').replace(/\D/g, '');
    if (cleanPhone && cleanPhone.length >= 7) {
      setDoc(doc(db, 'lead_lookups', cleanPhone), {
        applicationCode: appCode,
        leadId: newLead.id,
        phone: newLead.phone,
        studentName: newLead.studentName || newLead.fullName,
        parentName: newLead.parentName || '',
        createdAt: today,
      }).catch(console.warn);
    }

    showToast(`Yeni müraciət qeydə alındı: ${newLead.fullName} (#${appCode})`);

    // In-App Notification trigger
    const newNotif: NotificationItem = {
      id: generateId('notif'),
      title: 'Yeni Müştəri Müraciəti (Lid)',
      message: `${newLead.fullName} (${newLead.interestedCourse}) müraciət etdi. Mənbə: ${newLead.source}.`,
      category: 'lid',
      priority: 'medium',
      timestamp: 'İndicə',
      isRead: false,
      targetTab: 'leads',
      targetId: newLead.id,
      actionLabel: 'Müraciətə bax',
      roleScope: ['direktor', 'menecer'],
      branchId: assignedBranchId,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.warn);

    return newLead;
  };

  const updateLeadStage = (id: string, stage: LeadStage) => {
    const target = leads.find(l => l.id === id);
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, stage } : l)));
    updateDoc(doc(db, 'leads', id), { stage }).catch(err => {
      console.warn('Failed to update lead stage in Firestore:', err);
    });
    if (target?.applicationCode) {
      updateDoc(doc(db, 'leads', target.applicationCode), { stage }).catch(console.warn);
    }
    showToast(`Müraciət statusu dəyişdirildi`);
  };

  const updateLead = (id: string, data: Partial<Lead>) => {
    const target = leads.find(l => l.id === id);
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)));
    updateDoc(doc(db, 'leads', id), data).catch(err => {
      console.warn('Failed to update lead in Firestore:', err);
    });
    if (target?.applicationCode) {
      updateDoc(doc(db, 'leads', target.applicationCode), data).catch(console.warn);
    }
    showToast(`Müraciət məlumatları yeniləndi`);
  };

  const deleteLead = (id: string) => {
    registerDeletedItemId(id);
    setLeads(prev => {
      const remaining = prev.filter(l => l.id !== id);
      try {
        localStorage.setItem('areacrm_leads_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'leads', id)).catch(err => {
      console.warn('Failed to delete lead in Firestore:', err);
    });
    showToast(`Müraciət silindi`);
  };

  const convertLeadToStudent = (leadId: string, groupId: string, monthlyFee: number): Student | null => {
    const targetLead = leads.find(l => l.id === leadId);
    const targetGroup = groups.find(g => g.id === groupId);
    if (!targetLead || !targetGroup) return null;

    const cleanLeadName = (targetLead.studentName?.trim() || targetLead.fullName).trim();
    const existing = students.find(
      s => !s.isDeleted && s.fullName.trim().toLowerCase() === cleanLeadName.toLowerCase()
    );

    if (existing) {
      showToast(
        `"${cleanLeadName}" artıq tələbə bazasında mövcuddur! Bu tələbə üçün yeni proqram müqaviləsi bağlandı.`,
        'info'
      );
      setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, stage: 'qeydiyyat' } : l)));
      updateDoc(doc(db, 'leads', leadId), { stage: 'qeydiyyat' }).catch(console.warn);

      // Create contract for existing student for this group/course
      const contractNum = `AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      addContract({
        contractNumber: contractNum,
        studentId: existing.id,
        studentName: existing.fullName,
        curriculumId: targetGroup.courseId,
        courseName: targetGroup.courseName,
        branchId: targetGroup.branchId,
        branchName: targetGroup.branchName,
        groupId: targetGroup.id,
        groupName: targetGroup.name,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        monthlyFee,
        totalMonths: 6,
        totalAmount: monthlyFee * 6,
        paymentPlan: 'ayliq',
        status: 'aktiv',
        signedDate: new Date().toISOString().split('T')[0],
        notes: `Liddən yeni proqram kimi qeydiyyata alındı.`,
      });

      return existing;
    }

    const today = new Date().toISOString().split('T')[0];
    const leadBranchId = targetGroup.branchId || (selectedBranchId !== 'all' ? selectedBranchId : (branches.find(b => !b.isDeleted)?.id || 'branch-nerimanov'));
    const leadBranchName = targetGroup.branchName || (branches.find(b => b.id === leadBranchId)?.name || 'AREA Nərimanov Filialı');

    const newStudent: Student = {
      id: generateId('stu'),
      fullName: cleanLeadName,
      phone: targetLead.phone,
      parentPhone: targetLead.parentName ? targetLead.phone : undefined,
      email: `${cleanLeadName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      courseName: targetGroup.courseName,
      branchId: leadBranchId,
      branchName: leadBranchName,
      status: 'aktiv',
      balance: 0,
      monthlyFee,
      enrollmentDate: today,
      notes: targetLead.parentName
        ? `Onlayn Valideyn Qeydiyyatı. Valideyn: ${targetLead.parentName}. Müraciət Kodu: ${targetLead.applicationCode || 'Yoxdur'}. Qeyd: ${targetLead.notes || 'Yoxdur'}`
        : `Müraciətdən çevrildi. Mənbə: ${targetLead.source}. Qeyd: ${targetLead.notes || 'Yoxdur'}`,
      attendanceRate: 100,
      isDeleted: false,
    };

    setStudents(prev => [newStudent, ...prev]);
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, stage: 'qeydiyyat' } : l)));
    setGroups(prev =>
      prev.map(g => (g.id === groupId ? { ...g, currentStudents: g.currentStudents + 1 } : g))
    );

    setDoc(doc(db, 'students', newStudent.id), newStudent).catch(console.warn);
    updateDoc(doc(db, 'leads', leadId), { stage: 'qeydiyyat' }).catch(console.warn);
    if (targetLead.applicationCode) {
      updateDoc(doc(db, 'leads', targetLead.applicationCode), { stage: 'qeydiyyat' }).catch(console.warn);
    }
    updateDoc(doc(db, 'groups', groupId), { currentStudents: (targetGroup.currentStudents || 0) + 1 }).catch(console.warn);

    // Also create initial contract
    const contractNum = `AREA-MÜQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    addContract({
      contractNumber: contractNum,
      studentId: newStudent.id,
      studentName: newStudent.fullName,
      curriculumId: targetGroup.courseId,
      courseName: targetGroup.courseName,
      branchId: targetGroup.branchId,
      branchName: targetGroup.branchName,
      groupId: targetGroup.id,
      groupName: targetGroup.name,
      startDate: today,
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyFee,
      totalMonths: 6,
      totalAmount: monthlyFee * 6,
      paymentPlan: 'ayliq',
      status: 'aktiv',
      signedDate: today,
      notes: `Lid müraciətindən qeydiyyat.`,
    });

    showToast(`${cleanLeadName} tələbə bazasına əlavə olundu və müqavilə formalaşdırıldı!`);
    return newStudent;
  };

  // Student Attendance
  const recordStudentAttendance = (record: Omit<StudentAttendanceRecord, 'id'>) => {
    const newRec: StudentAttendanceRecord = {
      ...record,
      id: generateId('att'),
    };
    setStudentAttendance(prev => {
      const filtered = prev.filter(r => !(r.studentId === record.studentId && r.date === record.date));
      return [...filtered, newRec];
    });
    setDoc(doc(db, 'studentAttendance', newRec.id), newRec).catch(err => {
      console.warn('Failed to save student attendance in Firestore:', err);
    });
  };

  const bulkRecordAttendance = (records: Omit<StudentAttendanceRecord, 'id'>[]) => {
    const newItems = records.map(r => ({ ...r, id: generateId('att') }));
    setStudentAttendance(prev => {
      const keysToReplace = new Set(records.map(r => `${r.studentId}_${r.date}`));
      const filtered = prev.filter(r => !keysToReplace.has(`${r.studentId}_${r.date}`));
      return [...filtered, ...newItems];
    });
    newItems.forEach(item => {
      setDoc(doc(db, 'studentAttendance', item.id), item).catch(err => {
        console.warn('Failed to bulk write attendance in Firestore:', err);
      });
    });
    showToast(`Davamiyyət uğurla yadda saxlanıldı`);
  };

  const submitLessonSession = async (
    sessionData: Omit<LessonSessionRecord, 'id' | 'status' | 'submittedAt'>,
    records: Omit<StudentAttendanceRecord, 'id'>[]
  ): Promise<LessonSessionRecord> => {
    if (records.length > 0) {
      bulkRecordAttendance(records);
    }

    const sessionId = `ls-${sessionData.groupId}-${sessionData.date}`;
    const newSession: LessonSessionRecord = {
      ...sessionData,
      id: sessionId,
      status: 'pending_approval',
      submittedAt: new Date().toISOString(),
      submittedBy: currentUser?.fullName || 'Təlimçi',
    };

    setLessonSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      return [newSession, ...filtered];
    });

    setDoc(doc(db, 'lessonSessions', newSession.id), newSession).catch(err => {
      console.warn('Failed to save lesson session in Firestore:', err);
    });

    // Notify Coordinators & Directors
    const notif: NotificationItem = {
      id: generateId('notif'),
      title: 'Dərs Davamiyyəti & Qazanc Təsdiqi Gözləyir',
      message: `${newSession.trainerName} tərəfindən "${newSession.groupName}" qrupu üzrə ${newSession.date} tarixli dərs davamiyyəti aparıldı (${newSession.attendedCount}/${newSession.totalStudents} nəfər). Hesablanmış təlimçi ödənişi: ${newSession.totalCalculatedPay} AZN. Koordinator təsdiqi tələb olunur.`,
      category: 'davamiyyet',
      priority: 'high',
      timestamp: 'İndicə',
      isRead: false,
      targetTab: 'attendance',
      targetId: newSession.id,
      actionLabel: 'Davamiyyəti Təsdiqlə',
      roleScope: ['menecer', 'direktor'],
      branchId: newSession.branchId,
    };
    setNotifications(prev => [notif, ...prev]);
    setDoc(doc(db, 'notifications', notif.id), notif).catch(console.warn);

    showToast(
      `Dərs davamiyyəti qeydə alındı və koordinator təsdiqinə göndərildi (Hesablanan: ${newSession.totalCalculatedPay} AZN)`
    );
    return newSession;
  };

  const approveLessonSession = async (sessionId: string, notes?: string): Promise<void> => {
    const target = lessonSessions.find(s => s.id === sessionId);
    if (!target) return;

    const today = new Date().toISOString().split('T')[0];
    const approver = currentUser?.fullName
      ? `${currentUser.fullName} (${currentUser.role === 'direktor' ? 'Direktor' : 'Koordinator/Menecer'})`
      : 'Koordinator';

    const updatedSession: LessonSessionRecord = {
      ...target,
      status: 'approved',
      approvedBy: approver,
      approvedAt: today,
      notes: notes || target.notes,
    };

    setLessonSessions(prev => prev.map(s => (s.id === sessionId ? updatedSession : s)));
    updateDoc(doc(db, 'lessonSessions', sessionId), {
      status: 'approved',
      approvedBy: approver,
      approvedAt: today,
      notes: notes || target.notes || null,
    }).catch(err => {
      console.warn('Failed to update lesson session approval in Firestore:', err);
    });

    // Auto-credit to trainer's monthly salary
    const targetMonth = target.date.slice(0, 7) || today.slice(0, 7);
    const trainerPayAmount = target.totalCalculatedPay || 0;

    if (trainerPayAmount > 0) {
      setTrainerSalaries(prev => {
        const existingIdx = prev.findIndex(
          ts =>
            (ts.trainerId === target.trainerId || ts.trainerName === target.trainerName) &&
            ts.month === targetMonth
        );

        if (existingIdx >= 0) {
          const updated = [...prev];
          const curr = updated[existingIdx];
          const newCalcAmount = (curr.calculatedAmount || 0) + trainerPayAmount;
          const newTotal = (curr.totalPaid || 0) + trainerPayAmount;
          const groupHandled = curr.groupsHandled?.includes(target.groupName)
            ? curr.groupsHandled
            : [...(curr.groupsHandled || []), target.groupName];

          const updatedTs: TrainerSalary = {
            ...curr,
            calculatedAmount: newCalcAmount,
            totalPaid: newTotal,
            groupsHandled: groupHandled,
            notes: (curr.notes ? curr.notes + '\n' : '') +
              `+${trainerPayAmount} AZN: ${target.date} [${target.groupName}] təsdiqlənmiş dərs qazancı (${target.attendedCount} şagird)`,
          };
          updated[existingIdx] = updatedTs;
          setDoc(doc(db, 'trainerSalaries', updatedTs.id), updatedTs).catch(console.warn);
          return updated;
        } else {
          const newTs: TrainerSalary = {
            id: `ts-${target.trainerId || generateId('ts')}-${targetMonth}`,
            trainerId: target.trainerId,
            trainerName: target.trainerName,
            branchId: target.branchId,
            branchName: target.branchName,
            month: targetMonth,
            employmentType: 'saatliq',
            calcType: 'saatliq',
            baseRate: target.basePay,
            calculatedAmount: trainerPayAmount,
            workDaysTotal: 12,
            workDaysAttended: 1,
            lateCount: 0,
            absentCount: 0,
            attendanceRate: 100,
            attendanceDeduction: 0,
            attendanceBonus: 0,
            kpiScore: 100,
            kpiGrade: 'A',
            kpiBonus: 0,
            kpiPenalty: 0,
            bonus: target.bonusPay || 0,
            penalty: 0,
            totalPaid: trainerPayAmount,
            status: 'gozleyir',
            groupsHandled: [target.groupName],
            notes: `Davamiyyət əsaslı qazanc: ${target.date} [${target.groupName}] (${target.attendedCount} şagird)`,
          };
          setDoc(doc(db, 'trainerSalaries', newTs.id), newTs).catch(console.warn);
          return [newTs, ...prev];
        }
      });
    }

    showToast(
      `Dərs davamiyyəti təsdiqləndi! Təlimçinin (${target.trainerName}) aylıq maaş balansına ${trainerPayAmount} AZN əlavə edildi.`
    );
  };

  const rejectLessonSession = async (sessionId: string, reason?: string): Promise<void> => {
    const target = lessonSessions.find(s => s.id === sessionId);
    if (!target) return;

    const updatedSession: LessonSessionRecord = {
      ...target,
      status: 'rejected',
      rejectionReason: reason || 'Koordinator tərəfindən imtina edildi',
    };

    setLessonSessions(prev => prev.map(s => (s.id === sessionId ? updatedSession : s)));
    updateDoc(doc(db, 'lessonSessions', sessionId), {
      status: 'rejected',
      rejectionReason: reason || 'Koordinator tərəfindən imtina edildi',
    }).catch(err => {
      console.warn('Failed to update rejection in Firestore:', err);
    });

    showToast('Dərs davamiyyətinə imtina edildi. Təlimçiyə ödəniş yazılmadı.', 'error');
  };

  // Staff QR & Geolocation Attendance
  const logStaffCheckIn = (
    staffId: string,
    lat: number,
    lng: number,
    deviceInfo = 'Veb Brauzer'
  ): { success: boolean; message: string; log?: StaffAttendanceLog } => {
    const member = staff.find(s => s.id === staffId);
    if (!member) {
      return { success: false, message: 'Heyət üzvü tapılmadı!' };
    }

    const defaultBranchFallback = { id: 'branch-default', name: 'Əsas Filial', latitude: 40.4000, longitude: 49.8500, radiusMeters: 100 };
    
    // Multi-branch resolution: check if the staff is checking in at an active/selected branch they are assigned to
    const activeTargetBranchId = effectiveBranchId || (selectedBranchId !== 'all' ? selectedBranchId : null);
    const isAssignedToActive = activeTargetBranchId && (
      member.branchId === activeTargetBranchId ||
      member.assignedBranches?.some(ab => ab.branchId === activeTargetBranchId)
    );
    const targetBranchId = isAssignedToActive ? activeTargetBranchId : member.branchId;
    const branch = branches.find(b => b.id === targetBranchId) || branches.find(b => b.id === member.branchId) || branches[0] || defaultBranchFallback;

    const distance = calculateDistanceMeters(lat, lng, branch.latitude, branch.longitude);
    const isInside = distance <= branch.radiusMeters;

    if (!isInside) {
      return {
        success: false,
        message: `Məsafə limiti aşıldı! Siz "${branch.name}" mərkəzindən ${distance} metr aralıdasınız (İcazə: ${branch.radiusMeters}m). Giriş qeydə alınmadı.`,
      };
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const dateStr = now.toISOString().split('T')[0];

    // Check if already checked in today at THIS branch
    const existing = staffAttendance.find(
      a => a.staffId === staffId && a.date === dateStr && (!a.branchId || a.branchId === branch.id)
    );
    if (existing && existing.checkInTime) {
      return {
        success: false,
        message: `${member.fullName} bu gün "${branch.name}" filialında artıq saat ${existing.checkInTime}-da giriş edib!`,
      };
    }

    // Punctuality check based on this branch's individual schedule
    const branchAssignment = member.assignedBranches?.find(ab => ab.branchId === branch.id);
    const scheduleStr = branchAssignment?.workSchedule || member.workSchedule || '09:00 - 18:00';
    let expectedStartHour = 9;
    let expectedStartMinute = 0;
    const timeMatch = scheduleStr.match(/(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      expectedStartHour = parseInt(timeMatch[1], 10);
      expectedStartMinute = parseInt(timeMatch[2], 10);
    }
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const expectedTotalMins = expectedStartHour * 60 + expectedStartMinute;
    const isLate = currentTotalMins > expectedTotalMins + 15;
    const status = isLate ? 'gecikme' : 'vaxtinda';

    const newLog: StaffAttendanceLog = {
      id: generateId('att-st'),
      staffId: member.id,
      staffName: member.fullName,
      branchId: branch.id,
      branchName: branch.name,
      date: dateStr,
      checkInTime: timeStr,
      checkInLat: lat,
      checkInLng: lng,
      distanceMeters: distance,
      isInsideGeo: true,
      status,
      deviceInfo,
    };

    setStaffAttendance(prev => [newLog, ...prev]);
    setDoc(doc(db, 'staffAttendance', newLog.id), newLog).catch(err => {
      console.warn('Failed to write staff attendance to Firestore:', err);
    });
    showToast(
      `${member.fullName} üçün [${branch.name.replace('AREA ', '')}] filialında giriş qeydə alındı! (Məsafə: ${distance}m, Status: ${status === 'vaxtinda' ? 'Vaxtında' : 'Gecikmə'})`
    );
    return { success: true, message: 'Giriş uğurla təsdiqləndi!', log: newLog };
  };

  const logStaffCheckOut = (staffId: string): { success: boolean; message: string } => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const activeTargetBranchId = effectiveBranchId || (selectedBranchId !== 'all' ? selectedBranchId : null);

    let found = false;
    let targetLogId = '';
    let updatedLogData: Partial<StaffAttendanceLog> = {};
    setStaffAttendance(prev =>
      prev.map(log => {
        if (
          log.staffId === staffId &&
          log.date === today &&
          log.checkInTime &&
          !log.checkOutTime &&
          (!activeTargetBranchId || !log.branchId || log.branchId === activeTargetBranchId)
        ) {
          found = true;
          targetLogId = log.id;
          // Calculate worked hours
          const [inH, inM] = log.checkInTime.split(':').map(Number);
          const [outH, outM] = timeStr.split(':').map(Number);
          const hours = Math.max(0.1, Number(((outH * 60 + outM - (inH * 60 + inM)) / 60).toFixed(1)));
          updatedLogData = {
            checkOutTime: timeStr,
            workedHours: hours,
          };
          return {
            ...log,
            ...updatedLogData,
          };
        }
        return log;
      })
    );

    if (found) {
      if (targetLogId) {
        updateDoc(doc(db, 'staffAttendance', targetLogId), updatedLogData).catch(err => {
          console.warn('Failed to update checkout time in Firestore:', err);
        });
      }
      showToast(`Çıxış vaxtı uğurla qeyd olundu (${timeStr})`);
      return { success: true, message: 'Çıxış qeydə alındı!' };
    } else {
      return { success: false, message: 'Bu gün üçün açıq giriş qeydi tapılmadı!' };
    }
  };

  // Staff CRUD & Trainer Management
  const addStaff = (data: Omit<StaffMember, 'id'>): StaffMember => {
    const newStaff: StaffMember = {
      ...data,
      id: generateId('st'),
      status: data.status || 'aktiv',
    };
    setStaff(prev => [newStaff, ...prev]);
    setDoc(doc(db, 'staff', newStaff.id), newStaff).catch(err => {
      console.warn('Failed to write staff to Firestore:', err);
    });
    showToast(`Yeni əməkdaş əlavə edildi: ${newStaff.fullName} (${newStaff.role})`);
    return newStaff;
  };

  const updateStaff = (id: string, data: Partial<StaffMember>) => {
    setStaff(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    updateDoc(doc(db, 'staff', id), data).catch(err => {
      console.warn('Failed to update staff in Firestore:', err);
    });

    // Extract assigned branch IDs if assignedBranches is provided
    const newAssignedBranchIds = data.assignedBranches
      ? Array.from(new Set([data.branchId || '', ...data.assignedBranches.map(ab => ab.branchId)].filter(Boolean)))
      : undefined;

    // Sync to user account if corresponding user exists
    setUsers(prev =>
      prev.map(u => {
        if (
          u.linkedEntityId === id ||
          (u.email && data.email && u.email.toLowerCase() === data.email.toLowerCase())
        ) {
          const updatedUser: UserAccount = {
            ...u,
            fullName: data.fullName || u.fullName,
            email: data.email || u.email,
            phone: data.phone || u.phone,
            branchId: data.branchId || u.branchId,
            branchName: data.branchName || u.branchName,
            assignedBranchIds: newAssignedBranchIds || u.assignedBranchIds,
            status:
              data.status === 'ayrilib'
                ? 'silinib'
                : data.status === 'mezuniyyet'
                ? 'dondurulub'
                : 'aktiv',
          };
          updateDoc(doc(db, 'users', u.id), updatedUser as any).catch(console.error);
          return updatedUser;
        }
        return u;
      })
    );

    // Sync to trainer salaries if assignedBranches is provided
    if (data.assignedBranches && data.assignedBranches.length > 0) {
      setTrainerSalaries(prev => {
        const next = [...prev];
        data.assignedBranches!.forEach(ab => {
          const matchIdx = next.findIndex(
            s => (s.trainerId === id || (data.fullName && s.trainerName === data.fullName)) && s.branchId === ab.branchId
          );
          const calculated = ab.calcType === 'saatliq'
            ? Math.round((ab.baseRate || 25) * (ab.weeklyHours || 12) * 4)
            : ab.baseSalary || ab.baseRate || 800;

          if (matchIdx >= 0) {
            next[matchIdx] = {
              ...next[matchIdx],
              trainerName: data.fullName || next[matchIdx].trainerName,
              branchName: ab.branchName || next[matchIdx].branchName,
              employmentType: ab.employmentType || next[matchIdx].employmentType || 'full_stat',
              calcType: ab.calcType || next[matchIdx].calcType || 'sabit',
              baseRate: ab.baseRate || ab.baseSalary || next[matchIdx].baseRate,
              normHoursTotal: (ab.weeklyHours || (ab.employmentType === 'yarim_stat' ? 20 : 40)) * 4,
              calculatedAmount: calculated,
              totalPaid: Math.max(
                0,
                calculated -
                  (next[matchIdx].attendanceDeduction || 0) +
                  (next[matchIdx].attendanceBonus || 0) +
                  (next[matchIdx].kpiBonus || 0) -
                  (next[matchIdx].kpiPenalty || 0) +
                  (next[matchIdx].bonus || 0) -
                  (next[matchIdx].penalty || 0)
              ),
            };
          } else {
            const newTs: TrainerSalary = {
              id: `ts-${id}-${ab.branchId}-2026-03`,
              trainerId: id,
              trainerName: data.fullName || 'Təlimçi',
              branchId: ab.branchId,
              branchName: ab.branchName,
              role: data.role || 'Təlimçi',
              month: '2026-03',
              employmentType: ab.employmentType || 'full_stat',
              calcType: ab.calcType || 'sabit',
              baseRate: ab.baseRate || ab.baseSalary || 800,
              calculatedAmount: calculated,
              workedHoursTotal: (ab.weeklyHours || 20) * 4,
              normHoursTotal: (ab.weeklyHours || 20) * 4,
              workDaysTotal: ab.employmentType === 'yarim_stat' ? 14 : 22,
              workDaysAttended: ab.employmentType === 'yarim_stat' ? 14 : 22,
              lateCount: 0,
              absentCount: 0,
              attendanceRate: 100,
              attendanceDeduction: 0,
              attendanceBonus: 30,
              kpiScore: 100,
              kpiGrade: 'A',
              kpiBonus: 50,
              kpiPenalty: 0,
              bonus: 0,
              penalty: 0,
              totalPaid: calculated + 30 + 50,
              status: 'gozleyir',
              groupsHandled: [],
              notes: `${ab.branchName.replace('AREA ', '')} üzrə ştat təyinatı`,
            };
            next.push(newTs);
          }
        });
        return next;
      });
    }

    showToast(`Əməkdaş / Təlimçi məlumatları yeniləndi`);
  };

  const deleteStaff = (id: string) => {
    const target = staff.find(s => s.id === id);
    registerDeletedItemId(id);
    setStaff(prev => {
      const remaining = prev.filter(s => s.id !== id);
      try {
        localStorage.setItem('areacrm_staff_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'staff', id)).catch(err => {
      console.warn('Failed to delete staff in Firestore:', err);
    });
    // Also update corresponding user status
    if (target) {
      setUsers(prev =>
        prev.map(u =>
          u.email.toLowerCase() === target.email.toLowerCase() || u.linkedEntityId === id
            ? { ...u, status: 'silinib', isDeleted: true }
            : u
        )
      );
    }
    showToast(`"${target?.fullName || 'Əməkdaş'}" ştatdan silindi`, 'info');
  };

  const addTrainer = (trainerData: {
    fullName: string;
    email: string;
    phone: string;
    branchId: string;
    branchName?: string;
    employmentType?: EmploymentType;
    weeklyHours?: number;
    calcType?: SalaryCalcType;
    baseRate?: number;
    assignedBranches?: TrainerBranchAssignment[];
    salary: number;
    workSchedule?: string;
    notes?: string;
  }): { staffMember: StaffMember; userAccount: UserAccount } => {
    const branch = branches.find(b => b.id === trainerData.branchId) || branches[0];
    const bName = trainerData.branchName || branch?.name || 'Filial';

    // Normalize assigned branches
    const effectiveAssignedBranches: TrainerBranchAssignment[] =
      trainerData.assignedBranches && trainerData.assignedBranches.length > 0
        ? trainerData.assignedBranches
        : [
            {
              branchId: trainerData.branchId,
              branchName: bName,
              employmentType: trainerData.employmentType || 'full_stat',
              workSchedule: trainerData.workSchedule || '10:00 - 18:00',
              weeklyHours: trainerData.weeklyHours || (trainerData.employmentType === 'yarim_stat' ? 20 : 40),
              baseSalary: trainerData.salary,
              calcType: trainerData.calcType || 'sabit',
              baseRate: trainerData.baseRate || trainerData.salary,
              isPrimary: true,
            },
          ];

    const assignedBranchIds = Array.from(
      new Set([trainerData.branchId, ...effectiveAssignedBranches.map(ab => ab.branchId)].filter(Boolean))
    );

    // 1. Create Staff record
    const staffMember: StaffMember = {
      id: generateId('st'),
      fullName: trainerData.fullName,
      role: 'Təlimçi',
      email: trainerData.email,
      phone: trainerData.phone,
      branchId: trainerData.branchId,
      branchName: bName,
      employmentType: trainerData.employmentType || 'full_stat',
      weeklyHours: trainerData.weeklyHours || 40,
      assignedBranches: effectiveAssignedBranches,
      salary: trainerData.salary,
      workSchedule: trainerData.workSchedule || '10:00 - 18:00',
      status: 'aktiv',
    };
    setStaff(prev => [staffMember, ...prev]);
    setDoc(doc(db, 'staff', staffMember.id), staffMember).catch(err => {
      console.warn('Failed to write staff member to Firestore:', err);
    });

    // 2. Create UserAccount record so trainer can log in
    const userAccount: UserAccount = {
      id: generateId('usr'),
      fullName: trainerData.fullName,
      email: trainerData.email,
      phone: trainerData.phone,
      role: 'telimci',
      branchId: trainerData.branchId,
      branchName: bName,
      assignedBranchIds,
      isSuperAdmin: false,
      status: 'aktiv',
      linkedEntityId: staffMember.id,
      notes: trainerData.notes || 'Filial üzrə təlimçi',
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Yeni qeydiyyat',
    };
    setUsers(prev => [userAccount, ...prev]);
    setDoc(doc(db, 'users', userAccount.id), userAccount).catch(err => {
      console.warn('Failed to write user account to Firestore:', err);
    });

    showToast(`Təlimçi ${trainerData.fullName} filialınıza uğurla əlavə edildi!`, 'success');
    return { staffMember, userAccount };
  };

  // Payments & Finance
  const recordPayment = (
    paymentData: Omit<PaymentTransaction, 'id' | 'receiptNumber'>
  ): PaymentTransaction => {
    const receiptNumber = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
    const assignedBranchId =
      paymentData.branchId ||
      (selectedBranchId !== 'all' ? selectedBranchId : (currentUser?.branchId !== 'all' ? currentUser?.branchId : undefined));
    const assignedBranchName =
      paymentData.branchName ||
      (assignedBranchId ? branches.find(b => b.id === assignedBranchId)?.name : undefined);

    const student = students.find(s => s.id === paymentData.studentId);
    const grp = groups.find(g => g.id === (paymentData.groupId || student?.groupId));
    const trainerMember = staff.find(st => st.id === grp?.trainerId || st.fullName === grp?.trainerName) ||
      users.find(u => u.fullName === grp?.trainerName);

    const newPayment: PaymentTransaction = {
      ...paymentData,
      id: generateId('pay'),
      receiptNumber,
      parentPhone: paymentData.parentPhone || student?.parentPhone || student?.phone,
      trainerPhone: paymentData.trainerPhone || trainerMember?.phone,
      trainerName: paymentData.trainerName || grp?.trainerName,
      branchId: assignedBranchId,
      branchName: assignedBranchName,
    };

    setPayments(prev => [newPayment, ...prev]);
    setDoc(doc(db, 'payments', newPayment.id), newPayment).catch(err => {
      console.warn('Failed to save payment to Firestore:', err);
    });

    // Automatically update student balance and reduce currentMonthDebt:
    setStudents(prev =>
      prev.map(s => {
        if (s.id === paymentData.studentId) {
          const newBal = s.balance + paymentData.amount;
          const newCurrentDebt = Math.max(0, (s.currentMonthDebt || 0) - paymentData.amount);
          updateDoc(doc(db, 'students', s.id), {
            balance: newBal,
            currentMonthDebt: newCurrentDebt,
          }).catch(err => {
            console.warn('Failed to update student balance in Firestore:', err);
          });
          return {
            ...s,
            balance: newBal,
            currentMonthDebt: newCurrentDebt,
          };
        }
        return s;
      })
    );

    // Update matching student_debts record in state and Firestore
    setStudentDebts(prev =>
      prev.map(d => {
        if (
          d.studentId === paymentData.studentId &&
          (d.status === 'odenilmayib' || d.status === 'qismen_odenilib') &&
          (!paymentData.contractId || d.contractId === paymentData.contractId)
        ) {
          const newPaid = d.paidAmount + paymentData.amount;
          const newRem = Math.max(0, d.amount - newPaid);
          const newStatus: 'odenilmayib' | 'qismen_odenilib' | 'tam_odenilib' =
            newRem === 0 ? 'tam_odenilib' : 'qismen_odenilib';
          const updated = {
            ...d,
            paidAmount: newPaid,
            remainingAmount: newRem,
            status: newStatus,
          };
          updateDoc(doc(db, 'student_debts', d.id), {
            paidAmount: newPaid,
            remainingAmount: newRem,
            status: newStatus,
          }).catch(console.warn);
          return updated;
        }
        return d;
      })
    );

    showToast(`${paymentData.studentName} üçün ${paymentData.amount} AZN ödəniş qəbul edildi!`);

    // In-App Notification trigger for payment
    const paymentNotif: NotificationItem = {
      id: generateId('notif'),
      title: 'Yeni Ödəniş Qəbul Edildi',
      message: `${paymentData.studentName} tərəfindən ${paymentData.amount} AZN məbləğində ödəniş qəbul edildi (Qəbz №: ${receiptNumber}).`,
      category: 'maliyye',
      priority: 'low',
      timestamp: 'İndicə',
      isRead: false,
      targetTab: 'finance',
      targetId: newPayment.id,
      actionLabel: 'Ödənişə bax',
      roleScope: ['direktor', 'menecer'],
      branchId: assignedBranchId,
    };
    setNotifications(prev => [paymentNotif, ...prev]);
    setDoc(doc(db, 'notifications', paymentNotif.id), paymentNotif).catch(console.warn);

    return newPayment;
  };

  const deletePayment = (id: string) => {
    registerDeletedItemId(id);
    setPayments(prev => {
      const remaining = prev.filter(p => p.id !== id);
      try {
        localStorage.setItem('areacrm_payments_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'payments', id)).catch(err => {
      console.warn('Failed to delete payment from Firestore:', err);
    });
    showToast('Ödəniş qeydi silindi');
  };

  const addExpense = (expenseData: Omit<Expense, 'id'>): Expense => {
    const assignedBranchId =
      expenseData.branchId ||
      (selectedBranchId !== 'all' ? selectedBranchId : (currentUser?.branchId !== 'all' ? currentUser?.branchId : undefined));
    const assignedBranchName =
      expenseData.branchName ||
      (assignedBranchId ? branches.find(b => b.id === assignedBranchId)?.name : undefined);

    const hasReceipt = Boolean(
      (expenseData.receiptUrl && expenseData.receiptUrl.trim().length > 0) ||
      (expenseData.receiptFile && expenseData.receiptFile.trim().length > 0)
    );
    const isDirectorOrAdmin = currentUser?.role === 'direktor' || currentUser?.isSuperAdmin;

    // Strict Rule: Qəbzi olmayan ödəniş/xərc rəhbərlik təsdiq etmədən qəbul olunmur!
    let finalStatus: 'tesdiqlendi' | 'gozleyir' | 'imtina' = 'gozleyir';
    let approvedBy = expenseData.approvedBy;
    let approvedAt = expenseData.approvedAt;

    if (hasReceipt) {
      finalStatus = 'tesdiqlendi';
      approvedBy = approvedBy || (currentUser?.fullName ? `${currentUser.fullName} (Qəbzlə)` : 'Sistem (Qəbz Əsasında)');
      approvedAt = approvedAt || new Date().toISOString().split('T')[0];
    } else if (isDirectorOrAdmin && expenseData.approvalStatus === 'tesdiqlendi') {
      finalStatus = 'tesdiqlendi';
      approvedBy = currentUser?.fullName ? `${currentUser.fullName} (Direktor)` : 'Direktor';
      approvedAt = new Date().toISOString().split('T')[0];
    } else {
      finalStatus = 'gozleyir';
      approvedBy = undefined;
      approvedAt = undefined;
    }

    const newExp: Expense = {
      ...expenseData,
      id: generateId('exp'),
      branchId: assignedBranchId,
      branchName: assignedBranchName,
      approvalStatus: finalStatus,
      approvedBy,
      approvedAt,
    };
    setExpenses(prev => [newExp, ...prev]);
    setDoc(doc(db, 'expenses', newExp.id), newExp).catch(err => {
      console.warn('Failed to save expense to Firestore:', err);
    });

    if (finalStatus === 'tesdiqlendi') {
      showToast(`Xərc qeydə alındı və qəbz əsasında təsdiqləndi: ${newExp.title} (${newExp.amount} AZN)`);
    } else {
      showToast(`Xərc qeydə alındı. Qəbzi olmadığı üçün rəhbərlik (direktor) təsdiqi tələb olunur!`, 'info');

      // Trigger High Priority Notification for Leadership
      const newNotif: NotificationItem = {
        id: generateId('notif'),
        title: 'Qəbzsiz Xərc Təsdiq Gözləyir',
        message: `${newExp.responsiblePerson || 'Əməkdaş'} tərəfindən "${newExp.title}" üçün ${newExp.amount} AZN qəbzsiz xərc daxil edilib. Rəhbərlik təsdiqi tələb olunur.`,
        category: 'maliyye',
        priority: 'high',
        timestamp: 'İndicə',
        isRead: false,
        targetTab: 'finance',
        targetId: newExp.id,
        actionLabel: 'Xərclərə bax',
        roleScope: ['direktor'],
        branchId: assignedBranchId,
      };
      setNotifications(prev => [newNotif, ...prev]);
      setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.warn);
    }
    return newExp;
  };

  const approveExpense = (id: string, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const approverName = currentUser?.fullName ? `${currentUser.fullName} (Rəhbərlik)` : 'Rəhbərlik / Direktor';
    const notesToSave = notes || 'Rəhbərlik tərəfindən qəbzsiz xərc xüsusi təsdiqlə qəbul edildi';
    setExpenses(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              approvalStatus: 'tesdiqlendi',
              approvedBy: approverName,
              approvedAt: today,
              approvalNotes: notes || e.approvalNotes || notesToSave,
            }
          : e
      )
    );
    updateDoc(doc(db, 'expenses', id), {
      approvalStatus: 'tesdiqlendi',
      approvedBy: approverName,
      approvedAt: today,
      approvalNotes: notesToSave,
    }).catch(err => {
      console.warn('Failed to approve expense in Firestore:', err);
    });

    showToast('Xərc rəhbərlik tərəfindən təsdiq edildi və rəsmi qəbul olundu');

    const exp = expenses.find(e => e.id === id);
    if (exp) {
      const approveNotif: NotificationItem = {
        id: generateId('notif'),
        title: 'Qəbzsiz Xərc Təsdiqləndi',
        message: `"${exp.title}" (${exp.amount} AZN) məbləğində qəbzsiz xərc ${approverName} tərəfindən qəbul edildi.`,
        category: 'maliyye',
        priority: 'medium',
        timestamp: 'İndicə',
        isRead: false,
        targetTab: 'finance',
        targetId: id,
        actionLabel: 'Xərclərə bax',
        roleScope: ['direktor', 'menecer'],
        branchId: exp.branchId,
      };
      setNotifications(prev => [approveNotif, ...prev]);
      setDoc(doc(db, 'notifications', approveNotif.id), approveNotif).catch(console.warn);
    }
  };

  const rejectExpense = (id: string, reason?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const rejecterName = currentUser?.fullName ? `${currentUser.fullName} (Rəhbərlik)` : 'Rəhbərlik / Direktor';
    const reasonToSave = reason || 'Qəbz təqdim edilmədiyi üçün rəhbərlik tərəfindən imtina edildi';
    setExpenses(prev =>
      prev.map(e =>
        e.id === id
          ? {
              ...e,
              approvalStatus: 'imtina',
              approvedBy: rejecterName,
              approvedAt: today,
              approvalNotes: reason || 'Qəbz təqdim edilmədiyi üçün rəhbərlik tərəfindən imtina edildi',
            }
          : e
      )
    );
    updateDoc(doc(db, 'expenses', id), {
      approvalStatus: 'imtina',
      approvedBy: rejecterName,
      approvedAt: today,
      approvalNotes: reasonToSave,
    }).catch(err => {
      console.warn('Failed to reject expense in Firestore:', err);
    });

    showToast('Xərc rəhbərlik tərəfindən rədd edildi (İmtina olundu)', 'error');

    const exp = expenses.find(e => e.id === id);
    if (exp) {
      const rejectNotif: NotificationItem = {
        id: generateId('notif'),
        title: 'Xərcə Rəhbərlik İmtinası',
        message: `"${exp.title}" (${exp.amount} AZN) xərcinə qəbz olmadığı üçün imtina edildi (${reason || 'Qəbz tələb olunur'}).`,
        category: 'maliyye',
        priority: 'high',
        timestamp: 'İndicə',
        isRead: false,
        targetTab: 'finance',
        targetId: id,
        actionLabel: 'Xərclərə bax',
        roleScope: ['direktor', 'menecer'],
        branchId: exp.branchId,
      };
      setNotifications(prev => [rejectNotif, ...prev]);
      setDoc(doc(db, 'notifications', rejectNotif.id), rejectNotif).catch(console.warn);
    }
  };

  const deleteExpense = (id: string) => {
    registerDeletedItemId(id);
    setExpenses(prev => {
      const remaining = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem('areacrm_expenses_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'expenses', id)).catch(err => {
      console.warn('Failed to delete expense from Firestore:', err);
    });
    showToast('Xərc qeydi silindi');
  };

  const addExtraIncome = (incomeData: Omit<ExtraIncome, 'id'>): ExtraIncome => {
    const assignedBranchId =
      incomeData.branchId ||
      (selectedBranchId !== 'all' ? selectedBranchId : (currentUser?.branchId !== 'all' ? currentUser?.branchId : undefined));
    const newInc: ExtraIncome = {
      ...incomeData,
      id: generateId('ext'),
      branchId: assignedBranchId,
    };
    setExtraIncomes(prev => [newInc, ...prev]);
    setDoc(doc(db, 'extraIncomes', newInc.id), newInc).catch(err => {
      console.warn('Failed to save extra income in Firestore:', err);
    });
    showToast(`Əlavə gəlir qeydə alındı: ${newInc.title} (${newInc.amount} AZN)`);
    return newInc;
  };

  const deleteExtraIncome = (id: string) => {
    registerDeletedItemId(id);
    setExtraIncomes(prev => {
      const remaining = prev.filter(e => e.id !== id);
      try {
        localStorage.setItem('areacrm_extra_incomes_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'extraIncomes', id)).catch(err => {
      console.warn('Failed to delete extra income from Firestore:', err);
    });
    showToast('Əlavə gəlir qeydi silindi');
  };

  const payTrainerSalary = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setTrainerSalaries(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'odenilib', paymentDate: today } : s))
    );
    showToast(`Əməkhaqqı ödənildi və arxivləşdirildi`);
  };

  const addOrUpdateSalary = (salary: TrainerSalary) => {
    setTrainerSalaries(prev => {
      const idx = prev.findIndex(s => s.id === salary.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = salary;
        return next;
      }
      return [salary, ...prev];
    });
    showToast(`Əməkhaqqı qeydi saxlanıldı: ${salary.trainerName} (${salary.totalPaid} AZN)`);
  };

  const syncSalariesWithKpiAndAttendance = (targetMonth: string = '2026-03') => {
    setTrainerSalaries(prevSalaries => {
      const updatedList: TrainerSalary[] = [...prevSalaries];

      staff.forEach(member => {
        const targetAssignments: TrainerBranchAssignment[] =
          member.assignedBranches && member.assignedBranches.length > 0
            ? member.assignedBranches
            : [
                {
                  branchId: member.branchId,
                  branchName: member.branchName,
                  workSchedule: member.workSchedule,
                  baseSalary: member.salary,
                  calcType: 'sabit',
                  isPrimary: true,
                },
              ];

        targetAssignments.forEach(assign => {
          const salaryId = `ts-${member.id}-${assign.branchId}-${targetMonth}`;
          const existingIdx = updatedList.findIndex(
            s =>
              (s.trainerId === member.id || s.trainerName === member.fullName) &&
              s.month === targetMonth &&
              (s.branchId ? s.branchId === assign.branchId : s.id === `ts-${member.id}-${targetMonth}`)
          );
          const existing = existingIdx >= 0 ? updatedList[existingIdx] : null;

          // 1. Attendance analysis from staffAttendance logs for this specific branch
          const staffLogs = staffAttendance.filter(
            log =>
              (log.staffId === member.id || log.staffName === member.fullName) &&
              log.date.startsWith(targetMonth) &&
              (!log.branchId || log.branchId === assign.branchId)
          );

          const workDaysTotal = existing?.workDaysTotal || 22;
          const workDaysAttended =
            staffLogs.length > 0
              ? staffLogs.filter(l => l.status === 'vaxtinda' || l.status === 'gecikme').length
              : (existing?.workDaysAttended ?? 21);
          const lateCount =
            staffLogs.length > 0
              ? staffLogs.filter(l => l.status === 'gecikme').length
              : (existing?.lateCount ?? 1);
          const absentCount =
            staffLogs.length > 0
              ? staffLogs.filter(l => l.status === 'qayib').length
              : (existing?.absentCount ?? Math.max(0, workDaysTotal - workDaysAttended));

          const employmentType: EmploymentType = existing?.employmentType || assign.employmentType || member.employmentType || 'full_stat';
          const calcType: SalaryCalcType = existing?.calcType ?? (assign.calcType || (employmentType === 'saatliq' ? 'saatliq' : 'sabit'));
          const baseRate = existing?.baseRate ?? (assign.baseRate || assign.baseSalary || member.salary);

          // Normative and worked hours calculation
          const normHoursTotal = assign.weeklyHours
            ? assign.weeklyHours * 4
            : (employmentType === 'yarim_stat' ? 80 : employmentType === 'saatliq' ? 48 : 160);

          const workedHoursFromLogs = staffLogs.reduce((acc, l) => acc + (l.workedHours || 0), 0);
          const workedHoursTotal = workedHoursFromLogs > 0
            ? Math.round(workedHoursFromLogs * 10) / 10
            : (existing?.workedHoursTotal ?? (employmentType === 'saatliq' ? 36 : workDaysAttended * (employmentType === 'yarim_stat' ? 4 : 8)));

          let calculatedAmount = existing?.calculatedAmount ?? baseRate;
          if (calcType === 'saatliq') {
            calculatedAmount = Math.round(workedHoursTotal * baseRate);
          } else if (calcType === 'sabit') {
            calculatedAmount = baseRate;
          }

          // Attendance rate based on employment type
          const attendanceRate = employmentType === 'saatliq'
            ? Math.min(100, Math.round((workedHoursTotal / Math.max(1, normHoursTotal)) * 1000) / 10)
            : Math.min(100, Math.round((workDaysAttended / workDaysTotal) * 1000) / 10);

          // Attendance deductions and basic bonus:
          const dailyPay = Math.round(baseRate / workDaysTotal);
          const latePenaltyRate = 10;
          const attendanceDeduction = absentCount * dailyPay + lateCount * latePenaltyRate;
          const attendanceBonus =
            workDaysAttended >= workDaysTotal && lateCount === 0 && absentCount === 0 ? 50 : 0;

          // 2. Dynamic KPI Evaluation & KPI Finance Rules matching
          const kpiEval = staffKpis.find(
            k =>
              (k.staffId === member.id || k.staffName === member.fullName) &&
              k.month === targetMonth &&
              (!k.branchId || k.branchId === assign.branchId)
          );

          const kpiScore = kpiEval ? kpiEval.totalScore : (existing?.kpiScore ?? 100);
          const kpiGrade = kpiEval ? kpiEval.grade : (existing?.kpiGrade ?? 'A');

          let dynamicKpiBonus = 0;
          let dynamicKpiPenalty = 0;
          const ruleBreakdown: {
            metricCode: string;
            metricName: string;
            category: string;
            impactPercent: number;
            impactAmount: number;
            type: 'bonus' | 'penalty' | 'neutral';
            formulaNote?: string;
          }[] = [];

          kpiFinanceRules
            .filter(r => r.isActive)
            .forEach(rule => {
              const metricResult = kpiEval?.results.find(res => res.metricCode === rule.metricCode);
              let actualVal = metricResult ? metricResult.actual : 100;
              if (rule.metricCode === 'STAFF_PUNCTUALITY' && !metricResult) {
                actualVal = attendanceRate;
              }

              const targetVal = rule.formulaSettings.targetThreshold;
              let metricPercentImpact = 0;
              let formulaNote = '';

              if (rule.mode === 'formula') {
                const relDiff = targetVal > 0 ? (actualVal - targetVal) / targetVal : 0;
                const rawPercent =
                  relDiff * rule.formulaSettings.scaleFactor * (rule.formulaSettings.baseSalaryMultiplier * 100);

                if (rawPercent >= 0) {
                  metricPercentImpact = Math.min(
                    rule.formulaSettings.bonusCapPercent,
                    Math.round(rawPercent * 10) / 10
                  );
                  formulaNote = `+${metricPercentImpact}% (Hədəfdən ${actualVal >= targetVal ? '+' : ''}${Math.round((actualVal - targetVal) * 10) / 10} fərq)`;
                } else {
                  metricPercentImpact = Math.max(
                    -rule.formulaSettings.penaltyFloorPercent,
                    Math.round(rawPercent * 10) / 10
                  );
                  formulaNote = `${metricPercentImpact}% (Hədəf kəsiri ${Math.round((actualVal - targetVal) * 10) / 10})`;
                }
              } else {
                if (kpiGrade === 'A+') {
                  metricPercentImpact = rule.manualTiers.tierAPlusBonusPercent;
                } else if (kpiGrade === 'A') {
                  metricPercentImpact = rule.manualTiers.tierABonusPercent;
                } else if (kpiGrade === 'B') {
                  metricPercentImpact = rule.manualTiers.tierBBonusPercent;
                } else {
                  metricPercentImpact = -rule.manualTiers.tierCPenaltyPercent;
                }
                formulaNote = `Pilləli: ${kpiGrade} (${metricPercentImpact >= 0 ? '+' : ''}${metricPercentImpact}%)`;
              }

              const metricAmount = Math.round((baseRate * Math.abs(metricPercentImpact)) / 100);

              if (metricPercentImpact > 0) {
                dynamicKpiBonus += metricAmount;
                ruleBreakdown.push({
                  metricCode: rule.metricCode,
                  metricName: rule.metricName,
                  category: rule.category,
                  impactPercent: metricPercentImpact,
                  impactAmount: metricAmount,
                  type: 'bonus',
                  formulaNote,
                });
              } else if (metricPercentImpact < 0) {
                dynamicKpiPenalty += metricAmount;
                ruleBreakdown.push({
                  metricCode: rule.metricCode,
                  metricName: rule.metricName,
                  category: rule.category,
                  impactPercent: metricPercentImpact,
                  impactAmount: metricAmount,
                  type: 'penalty',
                  formulaNote,
                });
              } else {
                ruleBreakdown.push({
                  metricCode: rule.metricCode,
                  metricName: rule.metricName,
                  category: rule.category,
                  impactPercent: 0,
                  impactAmount: 0,
                  type: 'neutral',
                  formulaNote: 'Neytral (0%)',
                });
              }
            });

          const kpiBonus =
            ruleBreakdown.length > 0
              ? dynamicKpiBonus
              : (kpiEval ? kpiEval.kpiBonusAmount : (existing?.kpiBonus ?? 100));
          const kpiPenalty =
            ruleBreakdown.length > 0
              ? dynamicKpiPenalty
              : (kpiEval ? kpiEval.kpiPenaltyAmount : (existing?.kpiPenalty ?? 0));
          const kpiBonusPercent =
            baseRate > 0 ? Math.round(((kpiBonus - kpiPenalty) / baseRate) * 1000) / 10 : 0;

          const bonus = existing?.bonus ?? 0;
          const penalty = existing?.penalty ?? 0;

          const totalPaid = Math.max(
            0,
            Math.round(
              calculatedAmount - attendanceDeduction + attendanceBonus + kpiBonus - kpiPenalty + bonus - penalty
            )
          );

          const branchGroups = groups
            .filter(
              g =>
                (g.trainerId === member.id || g.trainerName === member.fullName) &&
                (!g.branchId || g.branchId === assign.branchId)
            )
            .map(g => g.name);

          const newSalaryRecord: TrainerSalary = {
            id: existing?.id || salaryId,
            trainerId: member.id,
            trainerName: member.fullName,
            branchId: assign.branchId,
            branchName: assign.branchName,
            role: member.role,
            month: targetMonth,
            employmentType,
            calcType,
            baseRate,
            calculatedAmount,
            workedHoursTotal,
            normHoursTotal,
            workDaysTotal,
            workDaysAttended,
            lateCount,
            absentCount,
            attendanceRate,
            attendanceDeduction,
            attendanceBonus,
            kpiScore,
            kpiGrade,
            kpiBonus,
            kpiPenalty,
            kpiBonusPercent,
            kpiRuleBreakdown: ruleBreakdown,
            bonus,
            penalty,
            totalPaid,
            status: existing?.status || 'gozleyir',
            paymentDate: existing?.paymentDate,
            groupsHandled:
              branchGroups.length > 0
                ? branchGroups
                : existing?.groupsHandled || (member.role === 'Təlimçi' ? ['Tədris Qrupu'] : ['Filial İdarəetmə']),
            notes:
              existing?.notes ||
              `${assign.branchName.replace('AREA ', '')} filialı üzrə müstəqil hesablama (+${kpiBonusPercent}% KPI təsir).`,
          };

          if (existingIdx >= 0) {
            updatedList[existingIdx] = newSalaryRecord;
          } else {
            updatedList.push(newSalaryRecord);
          }
        });
      });

      return updatedList;
    });

    showToast(`Əməkhaqqı cədvəli ${targetMonth} ayı üçün 'KPI Qaydaları' və davamiyyətə əsasən avtomatik formalaşdırıldı!`, 'success');
  };

  const updateKpiFinanceRule = (id: string, updates: Partial<KpiMetricFinanceRule>) => {
    setKpiFinanceRules(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
    showToast('KPI maliyyə qaydası uğurla yeniləndi');
  };

  const resetKpiFinanceRules = () => {
    setKpiFinanceRules(INITIAL_KPI_FINANCE_RULES);
    showToast('KPI maliyyə qaydaları ilkin vəziyyətinə qaytarıldı', 'info');
  };

  // KPI Management methods
  const addKpiDefinition = (data: Omit<KpiMetricDefinition, 'id'>): KpiMetricDefinition => {
    const newKpi: KpiMetricDefinition = {
      ...data,
      id: generateId('kpi'),
    };
    setKpiDefinitions(prev => [...prev, newKpi]);
    showToast(`Yeni KPI metriki əlavə edildi: ${newKpi.name}`);
    return newKpi;
  };

  const updateKpiDefinition = (id: string, data: Partial<KpiMetricDefinition>) => {
    setKpiDefinitions(prev => prev.map(k => (k.id === id ? { ...k, ...data } : k)));
    showToast(`KPI metriki uğurla yeniləndi`);
  };

  const deleteKpiDefinition = (id: string) => {
    setKpiDefinitions(prev => prev.filter(k => k.id !== id));
    showToast(`KPI metriki silindi`);
  };

  const saveStaffKpiEvaluation = (evaluation: StaffKpiEvaluation) => {
    setStaffKpis(prev => {
      const idx = prev.findIndex(
        e => e.id === evaluation.id || (e.staffId === evaluation.staffId && e.month === evaluation.month)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = evaluation;
        return next;
      }
      return [evaluation, ...prev];
    });

    // Also automatically reflect updated KPI in TrainerSalary for that staff member & month!
    setTrainerSalaries(prev =>
      prev.map(s => {
        if ((s.trainerId === evaluation.staffId || s.trainerName === evaluation.staffName) && s.month === evaluation.month) {
          const totalPaid = Math.max(
            0,
            Math.round(
              s.calculatedAmount -
              s.attendanceDeduction +
              s.attendanceBonus +
              evaluation.kpiBonusAmount -
              evaluation.kpiPenaltyAmount +
              s.bonus -
              s.penalty
            )
          );
          return {
            ...s,
            kpiScore: evaluation.totalScore,
            kpiGrade: evaluation.grade,
            kpiBonus: evaluation.kpiBonusAmount,
            kpiPenalty: evaluation.kpiPenaltyAmount,
            totalPaid,
          };
        }
        return s;
      })
    );

    showToast(`${evaluation.staffName} üçün ${evaluation.month} ayı KPI qiymətləndirməsi və əməkhaqqı bonusu yeniləndi!`, 'success');
  };

  // Certificates
  const issueCertificate = async (
    certData: Omit<Certificate, 'id' | 'issueDate' | 'verificationUrl' | 'qrCodeDataUrl'>
  ): Promise<Certificate> => {
    const id = `AREA-2026-${certData.courseName.includes('Frontend') ? 'FE' : certData.courseName.includes('UI') ? 'UX' : 'DA'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const issueDate = new Date().toISOString().split('T')[0];
    const verificationUrl = `https://area-crm.az/verify/${id}`;

    // Generate real QR code image data
    let qrCodeDataUrl = '';
    try {
      qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
        width: 160,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.error('QR generation error:', e);
    }

    const newCert: Certificate = {
      ...certData,
      id,
      issueDate,
      verificationUrl,
      qrCodeDataUrl,
    };

    setCertificates(prev => [newCert, ...prev]);
    setDoc(doc(db, 'certificates', newCert.id), newCert).catch(err => {
      console.warn('Failed to save certificate in Firestore:', err);
    });

    // Update student status to graduate if not already
    setStudents(prev =>
      prev.map(s => {
        if (s.id === certData.studentId) {
          updateDoc(doc(db, 'students', s.id), { status: 'mezun' }).catch(console.warn);
          return { ...s, status: 'mezun' };
        }
        return s;
      })
    );

    // Fire celebration confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    showToast(`Sertifikat hazırlandı və təsdiqləndi: ${newCert.id}`);
    return newCert;
  };

  // Curriculum management
  const addCurriculum = (currData: Omit<Curriculum, 'id'>): Curriculum => {
    const newCurr: Curriculum = {
      ...currData,
      id: generateId('curr'),
    };
    setCurriculums(prev => [newCurr, ...prev]);
    showToast(`Yeni kurikulum əlavə olundu: ${newCurr.courseName}`);
    return newCurr;
  };

  const addModuleToCurriculum = (
    curriculumId: string,
    moduleData: { title: string; description: string; durationWeeks: number }
  ) => {
    setCurriculums(prev =>
      prev.map(c => {
        if (c.id === curriculumId) {
          const newMod: CurriculumModule = {
            id: generateId('mod'),
            order: c.modules.length + 1,
            title: moduleData.title,
            description: moduleData.description,
            durationWeeks: moduleData.durationWeeks,
            lessons: [],
          };
          return { ...c, modules: [...c.modules, newMod] };
        }
        return c;
      })
    );
    showToast(`Yeni modul əlavə edildi`);
  };

  const addLessonToModule = (
    curriculumId: string,
    moduleId: string,
    lessonData: { title: string; durationHours: number; description: string }
  ) => {
    setCurriculums(prev =>
      prev.map(c => {
        if (c.id === curriculumId) {
          return {
            ...c,
            modules: c.modules.map(m => {
              if (m.id === moduleId) {
                const newLes: Lesson = {
                  id: generateId('les'),
                  title: lessonData.title,
                  durationHours: lessonData.durationHours,
                  description: lessonData.description,
                };
                return { ...m, lessons: [...m.lessons, newLes] };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
    showToast(`Yeni dərs mövzusu əlavə edildi`);
  };

  const updateGroupProgress = (groupId: string, progressPercent: number, moduleId?: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            progressPercent,
            ...(moduleId ? { currentModuleId: moduleId } : {}),
            ...(progressPercent >= 100 ? { status: 'tamamlandi' } : {}),
          };
        }
        return g;
      })
    );
    showToast(`Qrupun kurikulum tərəqqisi yeniləndi (${progressPercent}%)`);
  };

  const updateCurriculum = (id: string, data: Partial<Curriculum>) => {
    setCurriculums(prev =>
      prev.map(c => (c.id === id ? { ...c, ...data } : c))
    );
    updateDoc(doc(db, 'curriculums', id), data).catch(err => {
      console.warn('Failed to update curriculum in Firestore:', err);
    });
    showToast(`Kurikulum məlumatları uğurla yeniləndi!`);
  };

  // Executive Task Tracker Functions
  const addTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'createdBy'>): TaskItem => {
    const today = new Date().toISOString().split('T')[0];
    const newTask: TaskItem = {
      ...taskData,
      id: generateId('tsk'),
      createdAt: today,
      createdBy: currentUser?.fullName || 'Direktor (Superadmin)',
    };
    setTasks(prev => [newTask, ...prev]);
    setDoc(doc(db, 'tasks', newTask.id), newTask).catch(err => {
      console.warn('Failed to save task to Firestore:', err);
    });
    showToast(`Yeni tapşırıq əlavə edildi: ${newTask.title}`);
    return newTask;
  };

  const updateTaskStatus = (id: string, status: TaskStatus, note?: string) => {
    const now = new Date().toISOString().split('T')[0];
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status,
              completionNote: note !== undefined ? note : t.completionNote,
              completedAt: status === 'tamamlandi' ? now : t.completedAt,
            }
          : t
      )
    );
    updateDoc(doc(db, 'tasks', id), {
      status,
      ...(note !== undefined && { completionNote: note }),
      ...(status === 'tamamlandi' && { completedAt: now }),
    }).catch(err => {
      console.warn('Failed to update task status in Firestore:', err);
    });
    showToast(`Tapşırıq statusu yeniləndi`);
  };

  const updateTask = (id: string, data: Partial<TaskItem>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...data } : t)));
    updateDoc(doc(db, 'tasks', id), data).catch(err => {
      console.warn('Failed to update task in Firestore:', err);
    });
    showToast(`Tapşırıq məlumatları yeniləndi`);
  };

  const deleteTask = (id: string) => {
    registerDeletedItemId(id);
    setTasks(prev => {
      const remaining = prev.filter(t => t.id !== id);
      try {
        localStorage.setItem('areacrm_tasks_list', JSON.stringify(remaining));
      } catch (e) {}
      return remaining;
    });
    deleteDoc(doc(db, 'tasks', id)).catch(err => {
      console.warn('Failed to delete task in Firestore:', err);
    });
    showToast(`Tapşırıq silindi`);
  };

  // Manager & Trainer Branch Isolation Logic
  const isManager = currentUser?.role === 'menecer' || currentRole === 'menecer';
  const managerBranchId = isManager
    ? (currentUser?.branchId && currentUser.branchId !== 'all'
        ? currentUser.branchId
        : (branches.find(b => b.name.includes('Gənclik'))?.id || branches[0]?.id || 'branch-genclik'))
    : null;
  const managerBranch = managerBranchId ? branches.find(b => b.id === managerBranchId) : null;

  const isTrainer = currentUser?.role === 'telimci' || currentRole === 'telimci';

  // Find linked staff member for trainer (to retrieve multi-branch assignments)
  const currentTrainerStaff = isTrainer
    ? staff.find(
        s =>
          (currentUser?.linkedEntityId && s.id === currentUser.linkedEntityId) ||
          (currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
      )
    : null;

  // Compute all assigned branch IDs for this trainer
  const trainerAssignedBranchIds: string[] = (() => {
    if (!isTrainer) return [];
    const set = new Set<string>();
    if (currentUser?.assignedBranchIds && currentUser.assignedBranchIds.length > 0) {
      currentUser.assignedBranchIds.forEach(id => {
        if (id && id !== 'all') set.add(id);
      });
    }
    if (currentUser?.branchId && currentUser.branchId !== 'all') {
      set.add(currentUser.branchId);
    }
    if (currentTrainerStaff?.assignedBranches && currentTrainerStaff.assignedBranches.length > 0) {
      currentTrainerStaff.assignedBranches.forEach(ab => {
        if (ab.branchId) set.add(ab.branchId);
      });
    }
    if (currentTrainerStaff?.branchId) {
      set.add(currentTrainerStaff.branchId);
    }
    return Array.from(set);
  })();

  // Enforce locked branch for managers (manager can never switch branch)
  useEffect(() => {
    if (isManager && managerBranchId) {
      if (selectedBranchId !== managerBranchId) {
        setSelectedBranchId(managerBranchId);
      }
    }
  }, [isManager, managerBranchId, selectedBranchId]);

  // If trainer has assigned branches, ensure selectedBranchId is one of them
  useEffect(() => {
    if (isTrainer && trainerAssignedBranchIds.length > 0) {
      if (!trainerAssignedBranchIds.includes(selectedBranchId)) {
        setSelectedBranchId(trainerAssignedBranchIds[0]);
      }
    }
  }, [isTrainer, trainerAssignedBranchIds.join(','), selectedBranchId]);

  const handleSetSelectedBranchId = (id: string) => {
    if (isManager && managerBranchId) {
      if (id !== managerBranchId) {
        showToast('Menecerlər yalnız öz filialına aid məlumatları idarə edə bilərlər', 'error');
        return;
      }
    }
    if (isTrainer && trainerAssignedBranchIds.length > 0) {
      if (!trainerAssignedBranchIds.includes(id)) {
        showToast('Təlimçi yalnız təyin olunduğu filiallar arasında keçid edə bilər', 'error');
        return;
      }
    }
    setSelectedBranchId(id);
  };

  // The active branch filter ID:
  // - If manager: strictly locked to managerBranchId
  // - If trainer: strictly one of their assigned branches
  // - If director / other: if selectedBranchId !== 'all', strictly filter to selectedBranchId; if 'all', null (show global network)
  const effectiveBranchId = isManager
    ? managerBranchId
    : isTrainer && trainerAssignedBranchIds.length > 0
    ? (trainerAssignedBranchIds.includes(selectedBranchId) ? selectedBranchId : trainerAssignedBranchIds[0])
    : (selectedBranchId !== 'all' ? selectedBranchId : null);

  const activeBranch = effectiveBranchId ? branches.find(b => b.id === effectiveBranchId) : null;
  const activeBranchNameKey = activeBranch
    ? activeBranch.name.replace('AREA ', '').replace(' Filialı', '').trim().toLowerCase()
    : '';

  // Helper to determine if a group belongs to the active branch
  const groupBelongsToActiveBranch = (g: Group): boolean => {
    if (!effectiveBranchId) return true;
    if (g.branchId && g.branchId === effectiveBranchId) return true;
    if (activeBranchNameKey && g.room?.toLowerCase().includes(activeBranchNameKey)) return true;
    if (activeBranch && g.branchName === activeBranch.name) return true;
    return false;
  };

  const allowedGroupIds = new Set(groups.filter(groupBelongsToActiveBranch).map(g => g.id));

  // Helper to determine if a student belongs to the active branch
  const studentBelongsToActiveBranch = (s: Student): boolean => {
    if (!effectiveBranchId) return true;
    if (s.branchId && s.branchId === effectiveBranchId) return true;
    if (activeBranch && s.branchName && s.branchName.trim().toLowerCase() === activeBranch.name.trim().toLowerCase()) return true;
    if (activeBranchNameKey && s.branchName?.toLowerCase().includes(activeBranchNameKey)) return true;
    if (allowedGroupIds.has(s.groupId)) return true;
    const g = groups.find(grp => grp.id === s.groupId);
    if (g && (g.branchId === effectiveBranchId || (activeBranchNameKey && g.room?.toLowerCase().includes(activeBranchNameKey)))) return true;
    return false;
  };

  const allowedStudentIds = new Set(students.filter(studentBelongsToActiveBranch).map(s => s.id));

  // Helper to determine if a staff member belongs to the active branch
  const staffBelongsToActiveBranch = (st: StaffMember): boolean => {
    if (!effectiveBranchId) return true;
    if (st.branchId === effectiveBranchId) return true;
    if (st.assignedBranches?.some(ab => ab.branchId === effectiveBranchId)) return true;
    if (activeBranch && st.branchName && st.branchName === activeBranch.name) return true;
    if (activeBranchNameKey && st.branchName?.toLowerCase().includes(activeBranchNameKey)) return true;
    return false;
  };

  const allowedStaffIds = new Set(staff.filter(staffBelongsToActiveBranch).map(st => st.id));

  // Helper to determine if a user account belongs to the active branch
  const userBelongsToActiveBranch = (u: UserAccount): boolean => {
    if (!effectiveBranchId) return true;
    if (currentUser?.id && u.id === currentUser.id) return true;
    if (currentUser?.email && u.email.toLowerCase() === currentUser.email?.toLowerCase()) return true;
    if (u.assignedBranchIds?.includes(effectiveBranchId)) return true;
    if (isManager) {
      // Manager only sees users in their branch
      return u.branchId === effectiveBranchId;
    }
    // Director view when branch is selected: show accounts for that branch, plus director accounts
    if (u.branchId === effectiveBranchId) return true;
    if (u.role === 'direktor') return true;
    return false;
  };

  // Helper to determine if a lead belongs to the active branch
  const leadBelongsToActiveBranch = (l: Lead): boolean => {
    if (!effectiveBranchId) return true;
    if (l.branchId && l.branchId === effectiveBranchId) return true;
    if (activeBranch && l.branchName === activeBranch.name) return true;
    if (activeBranch?.managerName && l.assignedManager === activeBranch.managerName) return true;
    if (currentUser?.fullName && l.assignedManager === currentUser.fullName) return true;
    if (activeBranchNameKey && (l.notes?.toLowerCase().includes(activeBranchNameKey) || l.interestedCourse?.toLowerCase().includes(activeBranchNameKey))) return true;
    return false;
  };

  // Filtered collections
  // Branches list:
  // - Managers see only their assigned branch
  // - Trainers see only their assigned branches
  // - Directors see all branches (so they can switch branches anytime in the header dropdown and view all branches)
  const exposedBranches = isManager && managerBranchId
    ? branches.filter(b => b.id === managerBranchId)
    : (isTrainer && trainerAssignedBranchIds.length > 0
        ? branches.filter(b => trainerAssignedBranchIds.includes(b.id))
        : branches);

  const exposedGroups = effectiveBranchId
    ? groups.filter(groupBelongsToActiveBranch)
    : groups;

  const exposedStudents = effectiveBranchId
    ? students.filter(studentBelongsToActiveBranch)
    : students;

  const exposedContracts = effectiveBranchId
    ? contracts.filter(c => c.branchId === effectiveBranchId || allowedStudentIds.has(c.studentId))
    : contracts;

  const exposedStudentDebts = effectiveBranchId
    ? studentDebts.filter(d => d.branchId === effectiveBranchId || allowedStudentIds.has(d.studentId))
    : studentDebts;

  const exposedUsers = effectiveBranchId
    ? users.filter(userBelongsToActiveBranch)
    : users;

  const exposedLeads = effectiveBranchId
    ? leads.filter(leadBelongsToActiveBranch)
    : leads;

  const exposedStudentAttendance = effectiveBranchId
    ? studentAttendance.filter(a => allowedGroupIds.has(a.groupId) || allowedStudentIds.has(a.studentId))
    : studentAttendance;

  const exposedStaff = effectiveBranchId
    ? staff.filter(staffBelongsToActiveBranch)
    : staff;

  const exposedStaffAttendance = effectiveBranchId
    ? staffAttendance.filter(sa => sa.branchId === effectiveBranchId || allowedStaffIds.has(sa.staffId))
    : staffAttendance;

  const exposedPayments = effectiveBranchId
    ? payments.filter(p => allowedGroupIds.has(p.groupId) || allowedStudentIds.has(p.studentId) || p.branchId === effectiveBranchId)
    : payments;

  const exposedExpenses = effectiveBranchId
    ? expenses.filter(e => {
        if (e.branchId && e.branchId === effectiveBranchId) return true;
        if (activeBranchNameKey && e.title?.toLowerCase().includes(activeBranchNameKey)) return true;
        if (activeBranch?.managerName && e.responsiblePerson === activeBranch.managerName) return true;
        if (currentUser?.fullName && e.responsiblePerson === currentUser.fullName) return true;
        return false;
      })
    : expenses;

  const exposedExtraIncomes = effectiveBranchId
    ? extraIncomes.filter(ei => {
        if (ei.branchId && ei.branchId === effectiveBranchId) return true;
        if (activeBranchNameKey && ei.title?.toLowerCase().includes(activeBranchNameKey)) return true;
        return false;
      })
    : extraIncomes;

  const exposedTrainerSalaries = effectiveBranchId
    ? trainerSalaries.filter(ts => {
        if (ts.branchId) return ts.branchId === effectiveBranchId;
        return allowedStaffIds.has(ts.trainerId);
      })
    : trainerSalaries;

  const exposedCertificates = effectiveBranchId
    ? certificates.filter(c => allowedStudentIds.has(c.studentId))
    : certificates;

  const exposedStaffKpis = effectiveBranchId
    ? staffKpis.filter(sk => allowedStaffIds.has(sk.staffId))
    : staffKpis;

  // IMPORTANT: Curriculums are GLOBAL across all branches ("Kurikulumdan başqa")
  const exposedCurriculums = curriculums;

  // In-App Interactive Notification Center Actions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    updateDoc(doc(db, 'notifications', id), { isRead: true }).catch(console.warn);
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    notifications.filter(n => !n.isRead).forEach(n => {
      updateDoc(doc(db, 'notifications', n.id), { isRead: true }).catch(console.warn);
    });
    showToast('Bütün bildirişlər oxunmuş kimi qeyd edildi');
  };

  const clearAllNotifications = () => {
    notifications.forEach(n => {
      deleteDoc(doc(db, 'notifications', n.id)).catch(console.warn);
    });
    setNotifications([]);
    showToast('Bütün bildirişlər təmizləndi');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteDoc(doc(db, 'notifications', id)).catch(console.warn);
    showToast('Bildiriş silindi');
  };

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: generateId('notif'),
      timestamp: 'İndicə',
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.warn);
  };

  const updateRolePermissions = async (
    role: Role,
    moduleId: SystemModuleId,
    action: PermissionAction,
    value: boolean
  ) => {
    // Safety guard: Direktor cannot lose permission management access
    if (role === 'direktor' && moduleId === 'permissions' && (action === 'view' || action === 'edit')) {
      showToast('Təhlükəsizlik xətası: Superadmin səlahiyyət idarəetmə hüququndan məhrum edilə bilməz!', 'error');
      return;
    }

    const updated: RolePermissionsConfig = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [moduleId]: {
          ...rolePermissions[role][moduleId],
          [action]: value,
        },
      },
    };

    setRolePermissions(updated);
    try {
      await setDoc(doc(db, 'system_settings', 'role_permissions'), {
        permissions: updated,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.fullName || 'Superadmin',
      }, { merge: true });
      showToast('Səlahiyyət dəyişikliyi yadda saxlanıldı', 'success');
    } catch (err) {
      console.warn('Failed to sync permissions to Firestore:', err);
      showToast('Səlahiyyət lokal yaddaşda yeniləndi (Oflayn)', 'info');
    }
  };

  const bulkUpdateRolePermissions = async (
    role: Role,
    newModuleRules: Record<SystemModuleId, ModulePermissionRule>
  ) => {
    const updated: RolePermissionsConfig = {
      ...rolePermissions,
      [role]: {
        ...newModuleRules,
      },
    };
    // Ensure safety guard for Direktor
    if (role === 'direktor') {
      updated.direktor.permissions = { view: true, create: true, edit: true, delete: true };
    }

    setRolePermissions(updated);
    try {
      await setDoc(doc(db, 'system_settings', 'role_permissions'), {
        permissions: updated,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.fullName || 'Superadmin',
      }, { merge: true });
      showToast(`${role.toUpperCase()} üçün səlahiyyətlər yeniləndi`, 'success');
    } catch (err) {
      console.warn('Failed to sync permissions to Firestore:', err);
      showToast('Səlahiyyətlər lokal olaraq saxlanıldı', 'info');
    }
  };

  const resetRolePermissions = async (targetRole?: Role) => {
    let updated: RolePermissionsConfig;
    if (targetRole) {
      updated = {
        ...rolePermissions,
        [targetRole]: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[targetRole])),
      };
    } else {
      updated = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }

    setRolePermissions(updated);
    try {
      await setDoc(doc(db, 'system_settings', 'role_permissions'), {
        permissions: updated,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.fullName || 'Superadmin',
      }, { merge: true });
      showToast(targetRole ? `${targetRole.toUpperCase()} standart qaydalara sıfırlandı` : 'Bütün rollar standart qaydalara sıfırlandı', 'success');
    } catch (err) {
      console.warn('Failed to sync reset to Firestore:', err);
      showToast('Standart qaydalar lokal olaraq bərpa edildi', 'info');
    }
  };

  const can = (
    action: PermissionAction,
    moduleId: SystemModuleId,
    targetRole?: Role,
    targetUser?: UserAccount | null
  ): boolean => {
    const user = targetUser !== undefined ? targetUser : currentUser;
    // 1. Check user-level custom override
    if (user?.customPermissions?.[moduleId]?.[action] !== undefined) {
      return !!user.customPermissions[moduleId]![action];
    }
    // 2. Otherwise fallback to role-based rules
    const effectiveRole = targetRole || user?.role || currentRole;
    if (effectiveRole === 'direktor' && moduleId === 'permissions') {
      return true;
    }
    const roleConfig = rolePermissions[effectiveRole];
    if (!roleConfig) return false;
    const moduleRule = roleConfig[moduleId];
    if (!moduleRule) return false;
    return !!moduleRule[action];
  };

  const updateUserCustomPermission = async (
    userId: string,
    moduleId: SystemModuleId,
    action: PermissionAction,
    value: boolean | null
  ) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const existingCustom = targetUser.customPermissions || {};
    const moduleCustom = { ...(existingCustom[moduleId] || {}) };

    if (value === null) {
      delete moduleCustom[action];
    } else {
      moduleCustom[action] = value;
    }

    const updatedCustom: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>> = {
      ...existingCustom,
    };

    if (Object.keys(moduleCustom).length === 0) {
      delete updatedCustom[moduleId];
    } else {
      updatedCustom[moduleId] = moduleCustom;
    }

    const updatedUser: UserAccount = {
      ...targetUser,
      customPermissions: updatedCustom,
    };

    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('areacrm_active_session', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      await setDoc(doc(db, 'users', userId), { customPermissions: updatedCustom }, { merge: true });
      showToast('Fərdi səlahiyyət yadda saxlanıldı', 'success');
    } catch (err) {
      console.warn('Failed to sync user custom permissions to Firestore:', err);
      showToast('Fərdi səlahiyyət lokal yadda saxlanıldı', 'info');
    }
  };

  const bulkUpdateUserCustomPermissions = async (
    userId: string,
    customRules: Partial<Record<SystemModuleId, Partial<ModulePermissionRule>>>
  ) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser: UserAccount = {
      ...targetUser,
      customPermissions: customRules,
    };

    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('areacrm_active_session', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      await setDoc(doc(db, 'users', userId), { customPermissions: customRules }, { merge: true });
      showToast(`${targetUser.fullName} üçün fərdi səlahiyyətlər yeniləndi`, 'success');
    } catch (err) {
      console.warn('Failed to sync user custom permissions to Firestore:', err);
      showToast('Fərdi səlahiyyətlər lokal saxlanıldı', 'info');
    }
  };

  const resetUserCustomPermissions = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const updatedUser: UserAccount = {
      ...targetUser,
      customPermissions: {},
    };

    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));

    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('areacrm_active_session', JSON.stringify(updatedUser));
      } catch (e) {
        console.warn(e);
      }
    }

    try {
      await setDoc(doc(db, 'users', userId), { customPermissions: {} }, { merge: true });
      showToast(`${targetUser.fullName} üçün bütün fərdi istisnalar silindi və rola sıfırlandı`, 'success');
    } catch (err) {
      console.warn('Failed to reset user custom permissions in Firestore:', err);
      showToast('Fərdi səlahiyyətlər lokal sıfırlandı', 'info');
    }
  };

  const exposedNotifications = notifications.filter(n => {
    const effectiveRole = currentUser?.role || currentRole;
    if (n.roleScope && n.roleScope.length > 0 && !n.roleScope.includes(effectiveRole)) {
      return false;
    }
    if (effectiveBranchId && n.branchId && n.branchId !== 'all' && n.branchId !== effectiveBranchId) {
      return false;
    }
    return true;
  });

  const exposedTasks = tasks.filter(t => {
    if (effectiveBranchId && t.branchId && t.branchId !== 'all' && t.branchId !== effectiveBranchId) {
      return false;
    }
    return true;
  });

  const unreadNotificationsCount = exposedNotifications.filter(n => !n.isRead).length;

  // --- INVENTORY & TECHNICAL REQUESTS MODULE STATE & HANDLERS ---
  const [activeInventorySubTab, setActiveInventorySubTab] = useState<InventorySubTab>('overview');

  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_inventory_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INVENTORY_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_inventory_products', JSON.stringify(inventoryProducts));
    } catch (e) {
      console.warn('Failed to save inventory products to localStorage', e);
    }
  }, [inventoryProducts]);

  const [warehouseLogs, setWarehouseLogs] = useState<CentralWarehouseLog[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_warehouse_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_WAREHOUSE_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_warehouse_logs', JSON.stringify(warehouseLogs));
    } catch (e) {
      console.warn('Failed to save warehouse logs to localStorage', e);
    }
  }, [warehouseLogs]);

  const [branchInventories, setBranchInventories] = useState<BranchInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_branch_inventories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_BRANCH_INVENTORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_branch_inventories', JSON.stringify(branchInventories));
    } catch (e) {
      console.warn('Failed to save branch inventories to localStorage', e);
    }
  }, [branchInventories]);

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_equipment_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EQUIPMENT_LIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_equipment_list', JSON.stringify(equipmentList));
    } catch (e) {
      console.warn('Failed to save equipment list to localStorage', e);
    }
  }, [equipmentList]);

  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_equipment_requests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_EQUIPMENT_REQUESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_equipment_requests', JSON.stringify(equipmentRequests));
    } catch (e) {
      console.warn('Failed to save equipment requests to localStorage', e);
    }
  }, [equipmentRequests]);

  const [technicalTickets, setTechnicalTickets] = useState<TechnicalTicket[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_technical_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TECHNICAL_TICKETS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_technical_tickets', JSON.stringify(technicalTickets));
    } catch (e) {
      console.warn('Failed to save technical tickets to localStorage', e);
    }
  }, [technicalTickets]);

  const [inventoryOrders, setInventoryOrders] = useState<InventoryOrder[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_inventory_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INVENTORY_ORDERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_inventory_orders', JSON.stringify(inventoryOrders));
    } catch (e) {
      console.warn('Failed to save inventory orders to localStorage', e);
    }
  }, [inventoryOrders]);

  const [inventoryPayments, setInventoryPayments] = useState<InventoryPayment[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_inventory_payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INVENTORY_PAYMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_inventory_payments', JSON.stringify(inventoryPayments));
    } catch (e) {
      console.warn('Failed to save inventory payments to localStorage', e);
    }
  }, [inventoryPayments]);

  const [inventoryActs, setInventoryActs] = useState<InventoryAct[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_inventory_acts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INVENTORY_ACTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_inventory_acts', JSON.stringify(inventoryActs));
    } catch (e) {
      console.warn('Failed to save inventory acts to localStorage', e);
    }
  }, [inventoryActs]);

  const [inventoryAuditLogs, setInventoryAuditLogs] = useState<InventoryAuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_inventory_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_INVENTORY_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_inventory_audit_logs', JSON.stringify(inventoryAuditLogs));
    } catch (e) {
      console.warn('Failed to save inventory audit logs to localStorage', e);
    }
  }, [inventoryAuditLogs]);

  const logInventoryAudit = (entry: Omit<InventoryAuditLogEntry, 'id' | 'timestamp' | 'user'>) => {
    const newEntry: InventoryAuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.fullName || 'Sistem İnzibatçısı',
      ...entry,
    };
    setInventoryAuditLogs(prev => [newEntry, ...prev]);
  };

  const addInventoryProduct = (prodData: {
    name: string;
    category: string;
    type: 'diy' | 'paid';
    unit: string;
    unitPrice: number;
    centralStock: number;
    minStockAlert: number;
    description?: string;
  }): InventoryProduct => {
    const newProd: InventoryProduct = {
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...prodData,
    };
    setInventoryProducts(prev => [newProd, ...prev]);

    if (prodData.centralStock > 0) {
      const logEntry: CentralWarehouseLog = {
        id: `wh-${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        type: 'daxil_olma',
        changeAmount: prodData.centralStock,
        previousStock: 0,
        newStock: prodData.centralStock,
        reason: 'Yeni məhsulun ilkin qalıqla reyestrə əlavə edilməsi',
        performedAt: new Date().toISOString(),
        performedBy: currentUser?.fullName || 'Texnobaba Meneceri',
      };
      setWarehouseLogs(prev => [logEntry, ...prev]);
    }

    logInventoryAudit({
      entityType: 'product',
      entityId: newProd.id,
      entityName: newProd.name,
      action: 'Məhsul Yaradıldı',
      details: `${newProd.name} (${newProd.type.toUpperCase()}) reyestrə əlavə edildi. Qalıq: ${newProd.centralStock} ${newProd.unit}.`,
    });

    return newProd;
  };

  const updateInventoryProduct = (productId: string, updates: Partial<InventoryProduct>) => {
    setInventoryProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
    );
    logInventoryAudit({
      entityType: 'product',
      entityId: productId,
      action: 'Məhsul Redaktə Edildi',
      details: `Parametrlər yeniləndi: ${Object.keys(updates).join(', ')}`,
    });
  };

  const adjustCentralStock = (productId: string, change: number, reason: string) => {
    const prod = inventoryProducts.find(p => p.id === productId);
    if (!prod) return;

    const previousStock = prod.centralStock;
    const newStock = Math.max(0, previousStock + change);

    setInventoryProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, centralStock: newStock } : p))
    );

    const logEntry: CentralWarehouseLog = {
      id: `wh-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      type: change >= 0 ? 'daxil_olma' : 'tənzimləmə',
      changeAmount: change,
      previousStock,
      newStock,
      reason,
      performedAt: new Date().toISOString(),
      performedBy: currentUser?.fullName || 'Texnobaba Meneceri',
    };
    setWarehouseLogs(prev => [logEntry, ...prev]);

    logInventoryAudit({
      entityType: 'product',
      entityId: prod.id,
      entityName: prod.name,
      action: 'Mərkəzi Anbar Qalığı Dəyişdirildi',
      details: `${prod.name}: ${previousStock} -> ${newStock} (${change >= 0 ? '+' : ''}${change} ${prod.unit}). Səbəb: ${reason}`,
    });
  };

  const adjustBranchInventory = (branchId: string, productId: string, newStock: number, reason: string) => {
    const branch = branches.find(b => b.id === branchId);
    const prod = inventoryProducts.find(p => p.id === productId);

    setBranchInventories(prev => {
      const existing = prev.find(i => i.branchId === branchId && i.productId === productId);
      const now = new Date().toISOString();

      if (existing) {
        const previousStock = existing.currentStock;
        const newAdjustment = {
          id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: now,
          user: currentUser?.fullName || 'Filial Meneceri',
          previousStock,
          newStock,
          difference: newStock - previousStock,
          reason,
        };
        return prev.map(item =>
          item.id === existing.id
            ? {
                ...item,
                currentStock: newStock,
                lastUpdated: now,
                adjustmentsHistory: [newAdjustment, ...(item.adjustmentsHistory || [])],
              }
            : item
        );
      } else {
        const newItem: BranchInventoryItem = {
          id: `br-inv-${Date.now()}`,
          branchId,
          branchName: branch?.name || 'Filial',
          productId,
          productName: prod?.name || 'Məhsul',
          category: prod?.category || 'Ümumi',
          unit: prod?.unit || 'ədəd',
          currentStock: newStock,
          lastUpdated: now,
          adjustmentsHistory: [
            {
              id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              date: now,
              user: currentUser?.fullName || 'Filial Meneceri',
              previousStock: 0,
              newStock,
              difference: newStock,
              reason,
            },
          ],
        };
        return [newItem, ...prev];
      }
    });

    logInventoryAudit({
      entityType: 'product',
      entityId: productId,
      entityName: prod?.name,
      branchId,
      branchName: branch?.name,
      action: 'Filial İnventarı Manual Düzəliş',
      details: `${branch?.name} filialında ${prod?.name || productId} manual düzəliş edildi: Yeni qalıq ${newStock}. Səbəb: ${reason}. (Mərkəzi anbar toxunulmaz qaldı)`,
    });
  };

  const createInventoryOrder = (orderData: {
    branchId: string;
    type: 'diy' | 'paid';
    items: { productId: string; requestedQty: number; unitPrice: number }[];
    reason?: string;
  }): InventoryOrder => {
    const branch = branches.find(b => b.id === orderData.branchId);
    const enrichedItems = orderData.items.map(item => {
      const prod = inventoryProducts.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod?.name || 'Məhsul',
        category: prod?.category || 'Təchizat',
        requestedQty: item.requestedQty,
        approvedQty: item.requestedQty,
        unitPrice: orderData.type === 'paid' ? item.unitPrice || prod?.unitPrice || 0 : 0,
        unit: prod?.unit || 'ədəd',
      };
    });

    const totalAmount = orderData.type === 'paid'
      ? enrichedItems.reduce((sum, i) => sum + i.requestedQty * i.unitPrice, 0)
      : 0;

    const newOrder: InventoryOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
      branchId: orderData.branchId,
      branchName: branch?.name || 'Filial',
      type: orderData.type,
      items: enrichedItems,
      totalAmount,
      paidAmount: 0,
      remainingDebt: totalAmount,
      reason: orderData.reason,
      status: 'yeni',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.fullName || 'Filial Meneceri',
      statusHistory: [
        {
          status: 'yeni',
          date: new Date().toISOString(),
          user: currentUser?.fullName || 'Filial Meneceri',
          note: orderData.reason || 'Sifariş formalaşdırıldı',
        },
      ],
    };

    setInventoryOrders(prev => [newOrder, ...prev]);

    logInventoryAudit({
      entityType: 'order',
      entityId: newOrder.id,
      entityName: newOrder.orderNumber,
      branchId: newOrder.branchId,
      branchName: newOrder.branchName,
      action: 'Yeni Sifariş Yaradıldı',
      details: `${newOrder.branchName} üçün ${newOrder.type.toUpperCase()} sifarişi formalaşdırıldı (${newOrder.items.length} çeşid).`,
    });

    return newOrder;
  };

  const reviewInventoryOrder = (
    orderId: string,
    status: InventoryOrderStatus,
    approvedQuantities?: Record<string, number>,
    rejectionReason?: string
  ) => {
    setInventoryOrders(prev =>
      prev.map(order => {
        if (order.id !== orderId) return order;

        let updatedItems = order.items;
        if (approvedQuantities && status !== 'reddedildi') {
          updatedItems = order.items.map(i => ({
            ...i,
            approvedQty: approvedQuantities[i.productId] !== undefined ? approvedQuantities[i.productId] : i.requestedQty,
          }));
        }

        const newTotal = order.type === 'paid'
          ? updatedItems.reduce((sum, i) => sum + i.approvedQty * i.unitPrice, 0)
          : 0;

        return {
          ...order,
          status,
          items: updatedItems,
          totalAmount: newTotal,
          remainingDebt: newTotal,
          rejectionReason: rejectionReason || order.rejectionReason,
          statusHistory: [
            {
              status,
              date: new Date().toISOString(),
              user: currentUser?.fullName || 'Texnobaba Meneceri',
              note: rejectionReason || (status === 'tesdiqlendi' ? 'Sifariş tam təsdiqləndi' : 'Sifariş qismən təsdiqləndi'),
            },
            ...order.statusHistory,
          ],
        };
      })
    );

    logInventoryAudit({
      entityType: 'order',
      entityId: orderId,
      action: 'Sifariş Nəzərdən Keçirildi',
      details: `Status: ${status}. ${rejectionReason ? `Səbəb: ${rejectionReason}` : ''}`,
    });
  };

  const dispatchInventoryOrder = (orderId: string) => {
    const order = inventoryOrders.find(o => o.id === orderId);
    if (!order) return;

    // Deduct stock from central warehouse
    setInventoryProducts(prev =>
      prev.map(p => {
        const orderItem = order.items.find(i => i.productId === p.id);
        if (orderItem && orderItem.approvedQty > 0) {
          const newStock = Math.max(0, p.centralStock - orderItem.approvedQty);
          return { ...p, centralStock: newStock };
        }
        return p;
      })
    );

    // Append warehouse movement logs
    const newLogs: CentralWarehouseLog[] = order.items
      .filter(i => i.approvedQty > 0)
      .map(i => {
        const prod = inventoryProducts.find(p => p.id === i.productId);
        const prevStock = prod ? prod.centralStock : 0;
        return {
          id: `wh-${Date.now()}-${i.productId}`,
          productId: i.productId,
          productName: i.productName,
          type: 'gonderis',
          changeAmount: -i.approvedQty,
          previousStock: prevStock,
          newStock: Math.max(0, prevStock - i.approvedQty),
          relatedOrderId: order.id,
          reason: `${order.orderNumber} saylı sifariş üzrə ${order.branchName} filialına göndəriş`,
          performedAt: new Date().toISOString(),
          performedBy: currentUser?.fullName || 'Texnobaba Meneceri',
        };
      });

    setWarehouseLogs(prev => [...newLogs, ...prev]);

    setInventoryOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'gonderildi',
              sentAt: new Date().toISOString(),
              statusHistory: [
                {
                  status: 'gonderildi',
                  date: new Date().toISOString(),
                  user: currentUser?.fullName || 'Texnobaba Meneceri',
                  note: 'Məhsullar mərkəzi anbardan çıxarıldı və kuryerə təhvil verildi',
                },
                ...o.statusHistory,
              ],
            }
          : o
      )
    );

    logInventoryAudit({
      entityType: 'order',
      entityId: order.id,
      entityName: order.orderNumber,
      branchId: order.branchId,
      branchName: order.branchName,
      action: 'Sifariş Göndərildi',
      details: `${order.orderNumber} saylı sifariş üzrə məhsullar Texnobaba mərkəzindən göndərildi.`,
    });
  };

  const deliverInventoryOrder = (orderId: string) => {
    const order = inventoryOrders.find(o => o.id === orderId);
    if (!order) return;

    // Add items to branch inventory
    setBranchInventories(prev => {
      const nextList = [...prev];
      order.items.forEach(item => {
        if (item.approvedQty <= 0) return;
        const existingIdx = nextList.findIndex(
          bi => bi.branchId === order.branchId && bi.productId === item.productId
        );
        const now = new Date().toISOString();
        if (existingIdx !== -1) {
          const exist = nextList[existingIdx];
          const newStock = exist.currentStock + item.approvedQty;
          nextList[existingIdx] = {
            ...exist,
            currentStock: newStock,
            lastUpdated: now,
            adjustmentsHistory: [
              {
                id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                date: now,
                user: currentUser?.fullName || 'Filial Meneceri',
                previousStock: exist.currentStock,
                newStock,
                difference: item.approvedQty,
                reason: `${order.orderNumber} saylı sifariş təhvil alındı`,
              },
              ...(exist.adjustmentsHistory || []),
            ],
          };
        } else {
          nextList.push({
            id: `br-inv-${Date.now()}-${item.productId}`,
            branchId: order.branchId,
            branchName: order.branchName,
            productId: item.productId,
            productName: item.productName,
            category: item.category,
            unit: item.unit,
            currentStock: item.approvedQty,
            lastUpdated: now,
            adjustmentsHistory: [
              {
                id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                date: now,
                user: currentUser?.fullName || 'Filial Meneceri',
                previousStock: 0,
                newStock: item.approvedQty,
                difference: item.approvedQty,
                reason: `${order.orderNumber} saylı sifariş təhvil alındı`,
              },
            ],
          });
        }
      });
      return nextList;
    });

    // Generate Official Act!
    const actType: InventoryActType = order.type === 'diy' ? 'diy_tehvil' : 'odenisli_tehvil';
    const actPrefix = order.type === 'diy' ? 'AKT-DIY' : 'AKT-ODN';
    const newAct: InventoryAct = {
      id: `act-${Date.now()}`,
      actNumber: `${actPrefix}-${Date.now().toString().slice(-6)}`,
      type: actType,
      title: order.type === 'diy'
        ? `DIY Tədris Materiallarının Təhvil-Təslim Aktı (${order.branchName})`
        : `Ödənişli Təchizat Mallarının Təhvil Aktı (${order.branchName})`,
      branchId: order.branchId,
      branchName: order.branchName,
      referenceId: order.id,
      referenceNumber: order.orderNumber,
      details: {
        items: order.items.map(i => ({
          name: i.productName,
          quantity: i.approvedQty,
          unit: i.unit,
          price: i.unitPrice,
        })),
        totalAmount: order.totalAmount,
        disclaimer: order.type === 'paid'
          ? 'DİQQƏT: Bu akt yalnız malların fiziki təhvil-təslimini və miqdarını təsdiq edir. Bu akt filialın borcunun ödənildiyini bildirmir. Ödəniş yalnız maliyyə qəbzi və ya bank çıxarışı ilə təsdiqlənir.'
          : undefined,
      },
      generatedAt: new Date().toISOString(),
      status: 'tesdiqlenib',
      signedByManager: currentUser?.fullName || 'Filial Meneceri',
      signedByTexnobaba: 'Texnobaba Meneceri',
    };

    setInventoryActs(prev => [newAct, ...prev]);

    setInventoryOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? {
              ...o,
              status: 'tehvil_alindi',
              deliveredAt: new Date().toISOString(),
              generatedActId: newAct.id,
              statusHistory: [
                {
                  status: 'tehvil_alindi',
                  date: new Date().toISOString(),
                  user: currentUser?.fullName || 'Filial Meneceri',
                  note: `Məhsullar filial tərəfindən qəbul edildi. ${newAct.actNumber} generasiya olundu.`,
                },
                ...o.statusHistory,
              ],
            }
          : o
      )
    );

    logInventoryAudit({
      entityType: 'order',
      entityId: order.id,
      entityName: order.orderNumber,
      branchId: order.branchId,
      branchName: order.branchName,
      action: 'Sifariş Təhvil Alındı & Akt Yaradıldı',
      details: `${order.orderNumber} filial tərəfindən təhvil alındı və ${newAct.actNumber} generasiya edildi.`,
    });
  };

  const createEquipment = (itemData: {
    name: string;
    category: string;
    model: string;
    serialNumber?: string;
    branchId: string;
    branchName: string;
    location: string;
    technicalStatus: 'islek' | 'temirde' | 'nasaz' | 'silinib';
    notes?: string;
  }): EquipmentItem => {
    const newEquip: EquipmentItem = {
      id: `EQ-${Date.now().toString().slice(-6)}`,
      addedAt: new Date().toISOString(),
      repairHistory: [],
      ...itemData,
    };
    setEquipmentList(prev => [newEquip, ...prev]);

    logInventoryAudit({
      entityType: 'equipment',
      entityId: newEquip.id,
      entityName: `${newEquip.name} (${newEquip.model})`,
      branchId: newEquip.branchId,
      branchName: newEquip.branchName,
      action: 'Yeni Avadanlıq Əlavə Edildi',
      details: `${newEquip.name} (${newEquip.id}) ${newEquip.branchName} reyestrinə qeydiyyata alındı.`,
    });

    return newEquip;
  };

  const updateEquipment = (id: string, updates: Partial<EquipmentItem>) => {
    setEquipmentList(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updates } : e))
    );
    logInventoryAudit({
      entityType: 'equipment',
      entityId: id,
      action: 'Avadanlıq Yeniləndi',
      details: `Parametrlər: ${Object.keys(updates).join(', ')}`,
    });
  };

  const createEquipmentRequest = (data: {
    branchId: string;
    branchName?: string;
    itemName: string;
    category: string;
    quantity: number;
    reason: string;
    priority: 'asagi' | 'orta' | 'yuksek' | 'tecili';
    createdBy?: string;
  }): EquipmentRequest => {
    const branch = branches.find(b => b.id === data.branchId);
    const newReq: EquipmentRequest = {
      id: `req-${Date.now()}`,
      requestNumber: `REQ-${Date.now().toString().slice(-6)}`,
      branchId: data.branchId,
      branchName: data.branchName || branch?.name || 'Filial',
      itemName: data.itemName,
      category: data.category,
      quantity: data.quantity,
      approvedQuantity: data.quantity,
      reason: data.reason,
      priority: data.priority,
      status: 'yeni',
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || currentUser?.fullName || 'Filial Meneceri',
      statusHistory: [
        {
          status: 'yeni',
          date: new Date().toISOString(),
          user: data.createdBy || currentUser?.fullName || 'Filial Meneceri',
          note: data.reason,
        },
      ],
    };

    setEquipmentRequests(prev => [newReq, ...prev]);

    logInventoryAudit({
      entityType: 'request',
      entityId: newReq.id,
      entityName: newReq.requestNumber,
      branchId: newReq.branchId,
      branchName: newReq.branchName,
      action: 'Avadanlıq Tələbi Yaradıldı',
      details: `${newReq.branchName} filialından «${newReq.itemName}» (${newReq.quantity} ədəd) tələb edildi.`,
    });

    return newReq;
  };

  const reviewEquipmentRequest = (
    requestId: string,
    status: EquipmentRequestStatus,
    approvedQty?: number,
    rejectionReason?: string
  ) => {
    setEquipmentRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status,
              approvedQuantity: approvedQty !== undefined ? approvedQty : r.quantity,
              rejectionReason: rejectionReason || r.rejectionReason,
              reviewedBy: currentUser?.fullName || 'Texnobaba Meneceri',
              reviewedAt: new Date().toISOString(),
              statusHistory: [
                {
                  status,
                  date: new Date().toISOString(),
                  user: currentUser?.fullName || 'Texnobaba Meneceri',
                  note: rejectionReason || (status === 'tesdiqlendi' ? 'Tələb tam təsdiq olundu' : 'Tələb qismən təsdiq olundu'),
                },
                ...r.statusHistory,
              ],
            }
          : r
      )
    );

    logInventoryAudit({
      entityType: 'request',
      entityId: requestId,
      action: 'Avadanlıq Tələbi Nəzərdən Keçirildi',
      details: `Status: ${status}. Təsdiq miqdarı: ${approvedQty}. ${rejectionReason ? `Rədd səbəbi: ${rejectionReason}` : ''}`,
    });
  };

  const dispatchEquipmentRequest = (requestId: string) => {
    setEquipmentRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'gonderildi',
              sentAt: new Date().toISOString(),
              statusHistory: [
                {
                  status: 'gonderildi',
                  date: new Date().toISOString(),
                  user: currentUser?.fullName || 'Texnobaba Meneceri',
                  note: 'Avadanlıq Texnobaba mərkəzindən kuryerlə göndərildi',
                },
                ...r.statusHistory,
              ],
            }
          : r
      )
    );

    logInventoryAudit({
      entityType: 'request',
      entityId: requestId,
      action: 'Avadanlıq Göndərildi',
      details: `Tələb olunan avadanlıq yola çıxdı.`,
    });
  };

  const deliverEquipmentRequest = (requestId: string) => {
    const req = equipmentRequests.find(r => r.id === requestId);
    if (!req) return;

    // Generate Avadanlıq Təhvil Aktı
    const newAct: InventoryAct = {
      id: `act-${Date.now()}`,
      actNumber: `AKT-AVD-${Date.now().toString().slice(-6)}`,
      type: 'avadanliq_tehvil',
      title: `Avadanlıq və Ehtiyat Hissələrinin Təhvil-Təslim Aktı (${req.branchName})`,
      branchId: req.branchId,
      branchName: req.branchName,
      referenceId: req.id,
      referenceNumber: req.requestNumber,
      details: {
        items: [
          {
            name: req.itemName,
            quantity: req.approvedQuantity || req.quantity,
            unit: 'ədəd',
          },
        ],
        equipmentName: req.itemName,
      },
      generatedAt: new Date().toISOString(),
      status: 'tesdiqlenib',
      signedByManager: currentUser?.fullName || 'Filial Meneceri',
      signedByTexnobaba: 'Texnobaba Meneceri',
    };

    setInventoryActs(prev => [newAct, ...prev]);

    // Register into equipment list for branch
    const newEquip: EquipmentItem = {
      id: `EQ-${Date.now().toString().slice(-6)}`,
      name: req.itemName,
      category: req.category || 'Ofis Təchizatı & Kartric',
      model: 'Təchizat Verilmiş',
      branchId: req.branchId,
      branchName: req.branchName,
      location: 'Əsas Otaq',
      technicalStatus: 'islek',
      addedAt: new Date().toISOString(),
      repairHistory: [],
      notes: `${req.requestNumber} saylı tələb əsasında mərkəzdən təhvil alınıb`,
    };
    setEquipmentList(prev => [newEquip, ...prev]);

    setEquipmentRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'tehvil_alindi',
              deliveredAt: new Date().toISOString(),
              statusHistory: [
                {
                  status: 'tehvil_alindi',
                  date: new Date().toISOString(),
                  user: currentUser?.fullName || 'Filial Meneceri',
                  note: `Avadanlıq filialda qəbul edildi. Akt №: ${newAct.actNumber}`,
                },
                ...r.statusHistory,
              ],
            }
          : r
      )
    );

    logInventoryAudit({
      entityType: 'request',
      entityId: req.id,
      entityName: req.requestNumber,
      branchId: req.branchId,
      branchName: req.branchName,
      action: 'Avadanlıq Təhvil Alındı',
      details: `Avadanlıq filial tərəfindən qəbul edildi və ${newAct.actNumber} generasiya olundu.`,
    });
  };

  const createTechnicalTicket = (ticketData: {
    branchId: string;
    branchName?: string;
    isNonInventory: boolean;
    equipmentId?: string;
    equipmentName?: string;
    title: string;
    description: string;
    priority: 'asagi' | 'orta' | 'yuksek' | 'tecili';
    createdBy?: string;
  }): TechnicalTicket => {
    const branch = branches.find(b => b.id === ticketData.branchId);
    const newTicket: TechnicalTicket = {
      id: `tck-${Date.now()}`,
      ticketNumber: `TCK-${Date.now().toString().slice(-6)}`,
      branchId: ticketData.branchId,
      branchName: ticketData.branchName || branch?.name || 'Filial',
      isNonInventory: ticketData.isNonInventory,
      equipmentId: ticketData.equipmentId,
      equipmentName: ticketData.equipmentName,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority,
      status: 'yeni',
      createdAt: new Date().toISOString(),
      createdBy: ticketData.createdBy || currentUser?.fullName || 'Filial Meneceri',
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'yeni',
          date: new Date().toISOString(),
          user: ticketData.createdBy || currentUser?.fullName || 'Filial Meneceri',
          note: ticketData.description,
        },
      ],
    };

    setTechnicalTickets(prev => [newTicket, ...prev]);

    // If equipment attached, mark it nasaz
    if (ticketData.equipmentId) {
      setEquipmentList(prev =>
        prev.map(e =>
          e.id === ticketData.equipmentId ? { ...e, technicalStatus: 'nasaz' } : e
        )
      );
    }

    logInventoryAudit({
      entityType: 'ticket',
      entityId: newTicket.id,
      entityName: newTicket.ticketNumber,
      branchId: newTicket.branchId,
      branchName: newTicket.branchName,
      action: 'Yeni Texniki Müraciət Yaradıldı',
      details: `${newTicket.branchName} üçün «${newTicket.title}» qeydiyyata alındı.`,
    });

    return newTicket;
  };

  const updateTicketProgress = (
    ticketId: string,
    updates: {
      status: TechnicalTicketStatus;
      contactedBranch?: boolean;
      contactNote?: string;
      workDone?: string;
      repairResult?: string;
    }
  ) => {
    setTechnicalTickets(prev =>
      prev.map(ticket => {
        if (ticket.id !== ticketId) return ticket;
        return {
          ...ticket,
          status: updates.status,
          contactedBranch: updates.contactedBranch !== undefined ? updates.contactedBranch : ticket.contactedBranch,
          contactNote: updates.contactNote || ticket.contactNote,
          workDone: updates.workDone || ticket.workDone,
          repairResult: updates.repairResult || ticket.repairResult,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            {
              status: updates.status,
              date: new Date().toISOString(),
              user: currentUser?.fullName || 'Texnobaba Meneceri',
              note: updates.repairResult || updates.workDone || updates.contactNote || 'Müraciət statusu yeniləndi',
            },
            ...ticket.statusHistory,
          ],
        };
      })
    );

    logInventoryAudit({
      entityType: 'ticket',
      entityId: ticketId,
      action: 'Texniki Müraciət İcrası Yeniləndi',
      details: `Status: ${updates.status}. ${updates.workDone ? `Görülən iş: ${updates.workDone}` : ''}`,
    });
  };

  const confirmTicketResolution = (ticketId: string, isConfirmed: boolean, note?: string) => {
    const ticket = technicalTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (isConfirmed) {
      // Create Texniki İcra Aktı
      const newAct: InventoryAct = {
        id: `act-${Date.now()}`,
        actNumber: `AKT-TEX-${Date.now().toString().slice(-6)}`,
        type: 'texniki_icra',
        title: `Texniki Təmir və Bərpa İşlərinin İcra Aktı (${ticket.branchName})`,
        branchId: ticket.branchId,
        branchName: ticket.branchName,
        referenceId: ticket.id,
        referenceNumber: ticket.ticketNumber,
        details: {
          workDone: ticket.workDone || 'Texniki təmir və nizamlama işləri icra olunmuşdur.',
          repairResult: ticket.repairResult || 'Bütün funksiyalar tam bərpa edilmiş və istismara yararlı vəziyyətə gətirilmişdir.',
          equipmentName: ticket.equipmentName,
          equipmentId: ticket.equipmentId,
        },
        generatedAt: new Date().toISOString(),
        status: 'tesdiqlenib',
        signedByManager: currentUser?.fullName || 'Filial Meneceri',
        signedByTexnobaba: 'Texnobaba Meneceri',
      };

      setInventoryActs(prev => [newAct, ...prev]);

      // If equipment, restore to islek and append history
      if (ticket.equipmentId) {
        setEquipmentList(prev =>
          prev.map(e =>
            e.id === ticket.equipmentId
              ? {
                  ...e,
                  technicalStatus: 'islek',
                  repairHistory: [
                    {
                      id: `rep-${Date.now()}`,
                      date: new Date().toISOString(),
                      description: ticket.workDone || 'Təmir icra olundu',
                      ticketId: ticket.id,
                      cost: 0,
                    },
                    ...(e.repairHistory || []),
                  ],
                }
              : e
          )
        );
      }

      setTechnicalTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? {
                ...t,
                status: 'tamamlandi',
                branchConfirmationNote: note,
                completedAt: new Date().toISOString(),
                generatedActId: newAct.id,
                statusHistory: [
                  {
                    status: 'tamamlandi',
                    date: new Date().toISOString(),
                    user: currentUser?.fullName || 'Filial Meneceri',
                    note: `Filial işi təsdiqlədi: ${note || 'Təmir tam qəbul edildi'}. Akt №: ${newAct.actNumber}`,
                  },
                  ...t.statusHistory,
                ],
              }
            : t
        )
      );

      logInventoryAudit({
        entityType: 'ticket',
        entityId: ticket.id,
        entityName: ticket.ticketNumber,
        branchId: ticket.branchId,
        branchName: ticket.branchName,
        action: 'Texniki Müraciət Təsdiq Edildi & Akt Yaradıldı',
        details: `${ticket.ticketNumber} filial tərəfindən rəsmən qəbul edildi və ${newAct.actNumber} generasiya olundu.`,
      });
    } else {
      // Reopened / returned
      setTechnicalTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? {
                ...t,
                status: 'geri_qaytarildi',
                reopenReason: note,
                statusHistory: [
                  {
                    status: 'geri_qaytarildi',
                    date: new Date().toISOString(),
                    user: currentUser?.fullName || 'Filial Meneceri',
                    note: `Filial narazılıq bildirdi və geri qaytardı: ${note}`,
                  },
                  ...t.statusHistory,
                ],
              }
            : t
        )
      );

      logInventoryAudit({
        entityType: 'ticket',
        entityId: ticket.id,
        entityName: ticket.ticketNumber,
        branchId: ticket.branchId,
        branchName: ticket.branchName,
        action: 'Texniki Müraciət Geri Qaytarıldı',
        details: `${ticket.ticketNumber} narazılıq səbəbilə Texnobabaya geri qaytarıldı: ${note}`,
      });
    }
  };

  const recordInventoryPayment = (
    branchId: string,
    amount: number,
    paymentMethod: string,
    note: string,
    orderId?: string
  ): InventoryPayment => {
    const branch = branches.find(b => b.id === branchId);
    const newPayment: InventoryPayment = {
      id: `pay-${Date.now()}`,
      receiptNumber: `QEBZ-${Date.now().toString().slice(-6)}`,
      branchId,
      branchName: branch?.name || 'Filial',
      amount,
      paymentDate: new Date().toISOString(),
      paymentMethod,
      note,
      recordedBy: currentUser?.fullName || 'Texnobaba Meneceri',
      orderId,
    };

    setInventoryPayments(prev => [newPayment, ...prev]);

    logInventoryAudit({
      entityType: 'debt',
      entityId: newPayment.id,
      entityName: newPayment.receiptNumber,
      branchId,
      branchName: branch?.name,
      action: 'Ödəniş Qəbul Edildi',
      details: `${branch?.name} filialından ${amount} AZN məbləğində ödəniş daxil oldu və borcdan silindi.`,
    });

    return newPayment;
  };

  const signAct = (actId: string, role: 'manager' | 'texnobaba') => {
    setInventoryActs(prev =>
      prev.map(act => {
        if (act.id !== actId) return act;
        return {
          ...act,
          signedByManager: role === 'manager' ? currentUser?.fullName || 'Filial Meneceri' : act.signedByManager,
          signedByTexnobaba: role === 'texnobaba' ? currentUser?.fullName || 'Texnobaba Baş Meneceri' : act.signedByTexnobaba,
        };
      })
    );

    logInventoryAudit({
      entityType: 'act',
      entityId: actId,
      action: 'Akt İmzalandı',
      details: `${role === 'manager' ? 'Filial Meneceri' : 'Texnobaba Meneceri'} tərəfindən elektron imza təsdiqləndi.`,
    });
  };

  const resetInventoryTestData = () => {
    setInventoryProducts(INITIAL_INVENTORY_PRODUCTS);
    setWarehouseLogs(INITIAL_WAREHOUSE_LOGS);
    setBranchInventories(INITIAL_BRANCH_INVENTORIES);
    setEquipmentList(INITIAL_EQUIPMENT_LIST);
    setEquipmentRequests(INITIAL_EQUIPMENT_REQUESTS);
    setTechnicalTickets(INITIAL_TECHNICAL_TICKETS);
    setInventoryOrders(INITIAL_INVENTORY_ORDERS);
    setInventoryPayments(INITIAL_INVENTORY_PAYMENTS);
    setInventoryActs(INITIAL_INVENTORY_ACTS);
    setInventoryAuditLogs(INITIAL_INVENTORY_AUDIT_LOGS);
    try {
      localStorage.removeItem('areacrm_inventory_products');
      localStorage.removeItem('areacrm_warehouse_logs');
      localStorage.removeItem('areacrm_branch_inventories');
      localStorage.removeItem('areacrm_equipment_list');
      localStorage.removeItem('areacrm_equipment_requests');
      localStorage.removeItem('areacrm_technical_tickets');
      localStorage.removeItem('areacrm_inventory_orders');
      localStorage.removeItem('areacrm_inventory_payments');
      localStorage.removeItem('areacrm_inventory_acts');
      localStorage.removeItem('areacrm_inventory_audit_logs');
    } catch (e) {
      // ignore
    }
    showToast('İnventar və texniki məlumatlar ilkin standart vəziyyətə sıfırlandı.', 'info');
  };

  // ========================================================
  // MARKETİNQ VƏ SMM (SOSİAL MEDİA İDARƏETMƏSİ) STATE & HANDLERS
  // ========================================================
  const [smmAccounts, setSmmAccounts] = useState<SmmSocialAccount[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_smm_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SMM_ACCOUNTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_smm_accounts', JSON.stringify(smmAccounts));
    } catch (e) {
      console.warn('Failed to save smm accounts to localStorage', e);
    }
  }, [smmAccounts]);

  const [smmPosts, setSmmPosts] = useState<SmmContentPost[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_smm_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SMM_POSTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('areacrm_smm_posts', JSON.stringify(smmPosts));
    } catch (e) {
      console.warn('Failed to save smm posts to localStorage', e);
    }
  }, [smmPosts]);

  // Firestore sync for SMM accounts
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'smm_accounts'),
      snapshot => {
        if (!snapshot.empty) {
          const dbItems: SmmSocialAccount[] = [];
          snapshot.forEach(docSnap => {
            dbItems.push(docSnap.data() as SmmSocialAccount);
          });
          const existingIds = new Set(dbItems.map(i => i.id));
          const missing = INITIAL_SMM_ACCOUNTS.filter(i => !existingIds.has(i.id));
          setSmmAccounts([...dbItems, ...missing]);
        }
      },
      err => {
        if (!err.message?.includes('offline')) {
          console.warn('Firestore smm_accounts listener warning:', err);
        }
      }
    );
    return () => unsub();
  }, []);

  // Firestore sync for SMM posts
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'smm_posts'),
      snapshot => {
        if (!snapshot.empty) {
          const dbItems: SmmContentPost[] = [];
          snapshot.forEach(docSnap => {
            dbItems.push(docSnap.data() as SmmContentPost);
          });
          const existingIds = new Set(dbItems.map(i => i.id));
          const missing = INITIAL_SMM_POSTS.filter(i => !existingIds.has(i.id));
          setSmmPosts([...dbItems, ...missing]);
        }
      },
      err => {
        if (!err.message?.includes('offline')) {
          console.warn('Firestore smm_posts listener warning:', err);
        }
      }
    );
    return () => unsub();
  }, []);

  const createOrUpdateSmmAccount = (
    accountData: Partial<SmmSocialAccount> & { platform: SmmPlatform; branchId: string; handle: string; url: string }
  ): SmmSocialAccount => {
    const branch = accountData.branchId === 'hq'
      ? { name: 'AREA Academy — Baş ofis' }
      : branches.find(b => b.id === accountData.branchId);

    const branchName = branch?.name || 'Filial';

    if (accountData.id) {
      // Update
      const existing = smmAccounts.find(a => a.id === accountData.id);
      const updated: SmmSocialAccount = {
        ...(existing || ({} as SmmSocialAccount)),
        ...accountData,
        branchName,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      setSmmAccounts(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      setDoc(doc(db, 'smm_accounts', updated.id), updated, { merge: true }).catch(console.warn);
      showToast(`${updated.accountName || updated.handle} hesabı uğurla yeniləndi!`, 'success');
      return updated;
    } else {
      // Create
      const newAcc: SmmSocialAccount = {
        id: `smm-${Date.now()}`,
        branchId: accountData.branchId,
        branchName,
        platform: accountData.platform,
        accountName: accountData.accountName || `${branchName} ${accountData.platform.toUpperCase()}`,
        handle: accountData.handle.startsWith('@') ? accountData.handle : `@${accountData.handle}`,
        url: accountData.url,
        followersCount: Number(accountData.followersCount) || 0,
        followingCount: Number(accountData.followingCount) || 0,
        postsCount: Number(accountData.postsCount) || 0,
        avgReach: Number(accountData.avgReach) || 0,
        avgEngagementRate: Number(accountData.avgEngagementRate) || 5.0,
        status: accountData.status || 'aktiv',
        managerName: accountData.managerName || currentUser?.fullName || 'SMM Meneceri',
        notes: accountData.notes || '',
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setSmmAccounts(prev => [newAcc, ...prev]);
      setDoc(doc(db, 'smm_accounts', newAcc.id), newAcc, { merge: true }).catch(console.warn);
      showToast(`Yeni sosial media hesabı (${newAcc.handle}) əlavə edildi!`, 'success');
      return newAcc;
    }
  };

  const deleteSmmAccount = (id: string) => {
    setSmmAccounts(prev => prev.filter(a => a.id !== id));
    deleteDoc(doc(db, 'smm_accounts', id)).catch(console.warn);
    showToast('Sosial media hesabı silindi', 'info');
  };

  const createSmmPost = (postData: Omit<SmmContentPost, 'id' | 'createdAt'>): SmmContentPost => {
    const branch = postData.branchId === 'hq'
      ? { name: 'AREA Academy — Baş ofis' }
      : branches.find(b => b.id === postData.branchId);

    const newPost: SmmContentPost = {
      id: `post-${Date.now()}`,
      branchId: postData.branchId,
      branchName: branch?.name || 'Filial',
      platform: postData.platform,
      title: postData.title,
      contentType: postData.contentType,
      scheduledDate: postData.scheduledDate,
      scheduledTime: postData.scheduledTime || '14:00',
      status: postData.status || 'planlasdirilib',
      caption: postData.caption || '',
      hashtags: postData.hashtags || [],
      mediaPreviewUrl: postData.mediaPreviewUrl,
      targetAudience: postData.targetAudience,
      authorName: postData.authorName || currentUser?.fullName || 'SMM Mütəxəssisi',
      publishedUrl: postData.publishedUrl,
      viewsCount: postData.viewsCount || 0,
      likesCount: postData.likesCount || 0,
      commentsCount: postData.commentsCount || 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setSmmPosts(prev => [newPost, ...prev]);
    setDoc(doc(db, 'smm_posts', newPost.id), newPost, { merge: true }).catch(console.warn);
    showToast(`"${newPost.title}" adlı post uğurla planlaşdırıldı!`, 'success');
    return newPost;
  };

  const updateSmmPostStatus = (
    id: string,
    status: SmmPostStatus,
    extra?: { publishedUrl?: string; viewsCount?: number; likesCount?: number }
  ) => {
    setSmmPosts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = {
          ...p,
          status,
          ...(extra?.publishedUrl ? { publishedUrl: extra.publishedUrl } : {}),
          ...(extra?.viewsCount !== undefined ? { viewsCount: extra.viewsCount } : {}),
          ...(extra?.likesCount !== undefined ? { likesCount: extra.likesCount } : {}),
        };
        setDoc(doc(db, 'smm_posts', id), updated, { merge: true }).catch(console.warn);
        return updated;
      })
    );
    showToast(`Post statusu yeniləndi: ${status}`, 'info');
  };

  const updateSmmPost = (id: string, updates: Partial<SmmContentPost>) => {
    setSmmPosts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        setDoc(doc(db, 'smm_posts', id), updated, { merge: true }).catch(console.warn);
        return updated;
      })
    );
    showToast('Post məlumatları yeniləndi!', 'success');
  };

  const deleteSmmPost = (id: string) => {
    setSmmPosts(prev => prev.filter(p => p.id !== id));
    deleteDoc(doc(db, 'smm_posts', id)).catch(console.warn);
    showToast('Planlaşdırılmış post silindi', 'info');
  };

  const resetSmmTestData = () => {
    setSmmAccounts(INITIAL_SMM_ACCOUNTS);
    setSmmPosts(INITIAL_SMM_POSTS);
    try {
      localStorage.removeItem('areacrm_smm_accounts');
      localStorage.removeItem('areacrm_smm_posts');
    } catch {}
    showToast('SMM məlumatları ilkin vəziyyətə sıfırlandı.', 'info');
  };

  return (
    <CrmContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentRole,
        setCurrentRole,
        selectedBranchId,
        setSelectedBranchId: handleSetSelectedBranchId,
        branches: exposedBranches,
        addBranch,
        updateBranch,
        deleteBranch,
        softDeleteBranch,
        hardDeleteBranch,
        restoreBranch,
        currentUser,
        authLoading,
        accessDeniedEmail,
        loginWithGoogle,
        loginWithEmailOrUsername,
        logout,
        dismissAccessDenied,
        isProfileModalOpen,
        setIsProfileModalOpen,
        users: exposedUsers,
        addUser,
        updateUser,
        deleteUser,
        softDeleteUser,
        hardDeleteUser,
        restoreUser,
        students: exposedStudents,
        allStudents: students,
        addStudent,
        updateStudent,
        deleteStudent,
        softDeleteStudent,
        hardDeleteStudent,
        restoreStudent,
        contracts: exposedContracts,
        allContracts: contracts,
        addContract,
        updateContract,
        deleteContract,
        softDeleteContract,
        hardDeleteContract,
        restoreContract,
        getStudentContracts,
        studentDebts: exposedStudentDebts,
        allStudentDebts: studentDebts,
        groups: exposedGroups,
        addGroup,
        updateGroup,
        deleteGroup,
        softDeleteGroup,
        hardDeleteGroup,
        restoreGroup,
        leads: exposedLeads,
        addLead,
        updateLeadStage,
        updateLead,
        deleteLead,
        convertLeadToStudent,
        studentAttendance: exposedStudentAttendance,
        recordStudentAttendance,
        bulkRecordAttendance,
        lessonSessions,
        submitLessonSession,
        approveLessonSession,
        rejectLessonSession,
        staff: exposedStaff,
        staffAttendance: exposedStaffAttendance,
        addStaff,
        updateStaff,
        deleteStaff,
        addTrainer,
        logStaffCheckIn,
        logStaffCheckOut,
        dynamicQrToken,
        payments: exposedPayments,
        recordPayment,
        deletePayment,
        expenses: exposedExpenses,
        addExpense,
        approveExpense,
        rejectExpense,
        deleteExpense,
        extraIncomes: exposedExtraIncomes,
        addExtraIncome,
        deleteExtraIncome,
        trainerSalaries: exposedTrainerSalaries,
        payTrainerSalary,
        addOrUpdateSalary,
        syncSalariesWithKpiAndAttendance,
        kpiDefinitions,
        addKpiDefinition,
        updateKpiDefinition,
        deleteKpiDefinition,
        staffKpis: exposedStaffKpis,
        saveStaffKpiEvaluation,
        kpiFinanceRules,
        updateKpiFinanceRule,
        resetKpiFinanceRules,
        certificates: exposedCertificates,
        issueCertificate,
        curriculums: exposedCurriculums,
        addCurriculum,
        updateCurriculum,
        addModuleToCurriculum,
        addLessonToModule,
        updateGroupProgress,
        tasks: exposedTasks,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        toast,
        showToast,
        confirmAction,
        notifications: exposedNotifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        deleteNotification,
        addNotification,
        rolePermissions,
        updateRolePermissions,
        bulkUpdateRolePermissions,
        resetRolePermissions,
        updateUserCustomPermission,
        bulkUpdateUserCustomPermissions,
        resetUserCustomPermissions,
        can,
        // Inventory & Technical Requests Module
        inventoryProducts,
        warehouseLogs,
        branchInventories,
        equipmentList,
        equipmentRequests,
        technicalTickets,
        inventoryOrders,
        inventoryPayments,
        inventoryActs,
        inventoryAuditLogs,
        activeInventorySubTab,
        setActiveInventorySubTab,
        addInventoryProduct,
        updateInventoryProduct,
        adjustCentralStock,
        adjustBranchInventory,
        createInventoryOrder,
        reviewInventoryOrder,
        dispatchInventoryOrder,
        deliverInventoryOrder,
        createEquipment,
        updateEquipment,
        createEquipmentRequest,
        reviewEquipmentRequest,
        dispatchEquipmentRequest,
        deliverEquipmentRequest,
        createTechnicalTicket,
        updateTicketProgress,
        confirmTicketResolution,
        recordInventoryPayment,
        signAct,
        resetInventoryTestData,
        // Marketing & SMM Module
        smmAccounts,
        smmPosts,
        createOrUpdateSmmAccount,
        deleteSmmAccount,
        createSmmPost,
        updateSmmPostStatus,
        updateSmmPost,
        deleteSmmPost,
        resetSmmTestData,
      }}
    >
      {children}
      {confirmModalData && (
        <ConfirmModal
          isOpen={confirmModalData.isOpen}
          title={confirmModalData.title}
          message={confirmModalData.message}
          confirmText={confirmModalData.confirmText}
          cancelText={confirmModalData.cancelText}
          danger={confirmModalData.danger}
          onConfirm={confirmModalData.onConfirm}
          onClose={() => setConfirmModalData(null)}
        />
      )}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
