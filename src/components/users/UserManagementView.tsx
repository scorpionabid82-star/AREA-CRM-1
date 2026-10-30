import React, { useState } from 'react';
import {
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Key,
  LogIn,
  Edit2,
  Trash2,
  Filter,
  GraduationCap,
  Users,
  Building2,
  Sparkles,
  Info,
  Clock,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  UserCheck,
  Archive,
  RotateCcw,
  MapPin
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { UserAccount, Role, StaffMember, TrainerBranchAssignment, EmploymentType, SalaryCalcType } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';
import { RolePermissionsManager } from './RolePermissionsManager';
import { UserPermissionsModal } from './UserPermissionsModal';

interface UserManagementViewProps {
  initialTab?: 'users' | 'staff' | 'matrix';
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  initialTab = 'users',
}) => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    softDeleteUser,
    hardDeleteUser,
    restoreUser,
    currentUser,
    staff,
    addStaff,
    updateStaff,
    deleteStaff,
    addTrainer,
    currentRole,
    setCurrentRole,
    branches,
    selectedBranchId,
    showToast,
    confirmAction,
    can,
  } = useCrm();

  const isManager = currentUser?.role === 'menecer' || currentRole === 'menecer';
  const managerBranchId = isManager
    ? (currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : (branches[0]?.id || 'branch-genclik'))
    : null;
  const managerBranch = managerBranchId ? (branches.find(b => b.id === managerBranchId) || branches[0]) : null;
  const activeBranch = selectedBranchId !== 'all' ? branches.find(b => b.id === selectedBranchId) : null;

  const [activeTab, setActiveTab] = useState<'users' | 'staff' | 'matrix'>(
    isManager || (initialTab === 'matrix' && !can('view', 'permissions')) ? 'staff' : initialTab
  );
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [userTabFilter, setUserTabFilter] = useState<'active' | 'archived'>('active');
  const [staffRoleFilter, setStaffRoleFilter] = useState<'all' | 'Direktor' | 'Menecer' | 'Təlimçi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [managingPermissionsUser, setManagingPermissionsUser] = useState<UserAccount | null>(null);

  // Dedicated Add Trainer Form States (Manager & Director)
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false);
  interface FormBranchAssignment {
    branchId: string;
    employmentType: EmploymentType;
    workSchedule: string;
    weeklyHours: number;
    calcType: SalaryCalcType;
    baseRate: number;
    baseSalary: number;
  }

  const getEmploymentTypeDefaults = (type: EmploymentType) => {
    switch (type) {
      case 'full_stat':
        return {
          weeklyHours: 40,
          workSchedule: 'B.e - Cümə · 10:00 - 18:00',
          calcType: 'sabit' as SalaryCalcType,
          baseRate: 1000,
          baseSalary: 1000,
        };
      case 'yarim_stat':
        return {
          weeklyHours: 20,
          workSchedule: 'B.e / Çər / Cüm · 14:00 - 18:00',
          calcType: 'sabit' as SalaryCalcType,
          baseRate: 600,
          baseSalary: 600,
        };
      case 'saatliq':
        return {
          weeklyHours: 12,
          workSchedule: 'Dərs cədvəli üzrə saatlıq',
          calcType: 'saatliq' as SalaryCalcType,
          baseRate: 25,
          baseSalary: 1200, // 25 * 12 * 4
        };
      case 'ferdi':
        return {
          weeklyHours: 16,
          workSchedule: 'Xüsusi modul qrafiki',
          calcType: 'faiz' as SalaryCalcType,
          baseRate: 40,
          baseSalary: 800,
        };
    }
  };

  const renderEmploymentBadge = (type?: EmploymentType, weeklyHours?: number) => {
    switch (type) {
      case 'full_stat':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Full ştat · {weeklyHours || 40}s
          </span>
        );
      case 'yarim_stat':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Yarım ştat · {weeklyHours || 20}s
          </span>
        );
      case 'saatliq':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Saatlıq {weeklyHours ? `· ${weeklyHours}s` : '· Tarif'}
          </span>
        );
      case 'ferdi':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Fərdi qrafik
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
            Full ştat · 40s
          </span>
        );
    }
  };

  const [trainerFullName, setTrainerFullName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('+994 50 ');
  const [trainerNotes, setTrainerNotes] = useState('');
  const [trainerBranchAssignments, setTrainerBranchAssignments] = useState<FormBranchAssignment[]>([
    {
      branchId: managerBranchId || (selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || 'branch-nerimanov'),
      employmentType: 'full_stat',
      workSchedule: 'B.e - Cümə · 10:00 - 18:00',
      weeklyHours: 40,
      calcType: 'sabit',
      baseRate: 1000,
      baseSalary: 1000,
    },
  ]);

  // Edit Staff Member State
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [editStaffFullName, setEditStaffFullName] = useState('');
  const [editStaffEmail, setEditStaffEmail] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffStatus, setEditStaffStatus] = useState<'aktiv' | 'mezuniyyet' | 'ayrilib'>('aktiv');
  const [editStaffRole, setEditStaffRole] = useState<StaffMember['role']>('Təlimçi');
  const [editStaffBranchAssignments, setEditStaffBranchAssignments] = useState<FormBranchAssignment[]>([]);

  // Form states for general User
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+994 50 ');
  const [role, setRole] = useState<Role>(isManager ? 'telimci' : 'sagird');
  const [branchId, setBranchId] = useState(managerBranchId || branches[0]?.id || 'all');
  const [tempPassword, setTempPassword] = useState('AreaPass2026!');
  const [notes, setNotes] = useState('');

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesTab = userTabFilter === 'archived' ? !!user.isDeleted : !user.isDeleted;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    return matchesTab && matchesRole && matchesSearch;
  });

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (staffRoleFilter === 'all') return true;
    return s.role === staffRoleFilter;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const targetBId = isManager && managerBranchId ? managerBranchId : branchId;
    const isAll = targetBId === 'all';
    const branch = isAll ? null : (branches.find(b => b.id === targetBId) || branches[0]);

    addUser({
      fullName,
      email,
      phone,
      role,
      branchId: isAll ? 'all' : branch?.id,
      branchName: isAll ? 'Bütün Filiallar (Qlobal Şəbəkə)' : branch?.name,
      isSuperAdmin: role === 'direktor',
      status: 'aktiv',
      notes,
    });

    setShowAddModal(false);
    resetForm();
  };

  const handleCreateTrainerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerFullName.trim() || !trainerEmail.trim()) {
      showToast('Ad və Email mütləq daxil edilməlidir!', 'error');
      return;
    }

    if (trainerBranchAssignments.length === 0) {
      showToast('Ən azı 1 filial təyinatı seçilməlidir!', 'error');
      return;
    }

    const primaryAssignment = trainerBranchAssignments[0];
    const primaryBranch = branches.find(b => b.id === primaryAssignment.branchId) || branches[0];

    const formattedAssignments: TrainerBranchAssignment[] = trainerBranchAssignments.map((a, idx) => {
      const bObj = branches.find(b => b.id === a.branchId) || branches[0];
      return {
        branchId: a.branchId,
        branchName: bObj?.name || 'Filial',
        employmentType: a.employmentType || 'full_stat',
        workSchedule: a.workSchedule.trim() || '10:00 - 18:00',
        weeklyHours: Number(a.weeklyHours) || 40,
        calcType: a.calcType || 'sabit',
        baseRate: Number(a.baseRate) || Number(a.baseSalary) || 0,
        baseSalary: Number(a.baseSalary) || 0,
        isPrimary: idx === 0,
      };
    });

    const totalSalary = formattedAssignments.reduce((acc, a) => acc + (a.baseSalary || 0), 0);

    addTrainer({
      fullName: trainerFullName.trim(),
      email: trainerEmail.trim(),
      phone: trainerPhone.trim(),
      branchId: primaryBranch.id,
      branchName: primaryBranch.name,
      employmentType: primaryAssignment.employmentType || 'full_stat',
      weeklyHours: Number(primaryAssignment.weeklyHours) || 40,
      calcType: primaryAssignment.calcType || 'sabit',
      baseRate: Number(primaryAssignment.baseRate) || Number(primaryAssignment.baseSalary) || 800,
      assignedBranches: formattedAssignments,
      salary: totalSalary,
      workSchedule: primaryAssignment.workSchedule.trim() || '10:00 - 18:00',
      notes: trainerNotes.trim(),
    });

    setShowAddTrainerModal(false);
    setTrainerFullName('');
    setTrainerEmail('');
    setTrainerPhone('+994 50 ');
    setTrainerBranchAssignments([
      {
        branchId: managerBranchId || (selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || 'branch-nerimanov'),
        employmentType: 'full_stat',
        workSchedule: 'B.e - Cümə · 10:00 - 18:00',
        weeklyHours: 40,
        calcType: 'sabit',
        baseRate: 1000,
        baseSalary: 1000,
      },
    ]);
    setTrainerNotes('');
  };

  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaffMember(member);
    setEditStaffFullName(member.fullName);
    setEditStaffEmail(member.email);
    setEditStaffPhone(member.phone);
    setEditStaffStatus(member.status);
    setEditStaffRole(member.role);

    const initialAssignments: FormBranchAssignment[] = (member.assignedBranches && member.assignedBranches.length > 0)
      ? member.assignedBranches.map(ab => ({
          branchId: ab.branchId,
          employmentType: ab.employmentType || member.employmentType || 'full_stat',
          workSchedule: ab.workSchedule || member.workSchedule,
          weeklyHours: ab.weeklyHours || (ab.employmentType === 'yarim_stat' ? 20 : 40),
          calcType: ab.calcType || 'sabit',
          baseRate: ab.baseRate || ab.baseSalary || member.salary,
          baseSalary: ab.baseSalary || member.salary,
        }))
      : [
          {
            branchId: member.branchId,
            employmentType: member.employmentType || 'full_stat',
            workSchedule: member.workSchedule,
            weeklyHours: member.weeklyHours || 40,
            calcType: 'sabit',
            baseRate: member.salary,
            baseSalary: member.salary,
          },
        ];
    setEditStaffBranchAssignments(initialAssignments);
  };

  const handleUpdateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffMember || !editStaffFullName.trim()) return;

    const formattedAssignments: TrainerBranchAssignment[] = editStaffBranchAssignments.map((a, idx) => {
      const bObj = branches.find(b => b.id === a.branchId) || branches[0];
      return {
        branchId: a.branchId,
        branchName: bObj?.name || 'Filial',
        employmentType: a.employmentType || 'full_stat',
        workSchedule: a.workSchedule.trim() || '10:00 - 18:00',
        weeklyHours: Number(a.weeklyHours) || 40,
        calcType: a.calcType || 'sabit',
        baseRate: Number(a.baseRate) || Number(a.baseSalary) || 0,
        baseSalary: Number(a.baseSalary) || 0,
        isPrimary: idx === 0,
      };
    });

    const primaryAssignment = formattedAssignments[0] || {
      branchId: editingStaffMember.branchId,
      branchName: editingStaffMember.branchName,
      employmentType: editingStaffMember.employmentType || 'full_stat',
      workSchedule: editingStaffMember.workSchedule,
      weeklyHours: editingStaffMember.weeklyHours || 40,
      baseSalary: editingStaffMember.salary,
      calcType: 'sabit',
      baseRate: editingStaffMember.salary,
    };

    const totalSalary = formattedAssignments.length > 0
      ? formattedAssignments.reduce((acc, a) => acc + (a.baseSalary || 0), 0)
      : editingStaffMember.salary;

    updateStaff(editingStaffMember.id, {
      fullName: editStaffFullName.trim(),
      email: editStaffEmail.trim(),
      phone: editStaffPhone.trim(),
      branchId: primaryAssignment.branchId,
      branchName: primaryAssignment.branchName,
      employmentType: primaryAssignment.employmentType || 'full_stat',
      weeklyHours: primaryAssignment.weeklyHours || 40,
      assignedBranches: formattedAssignments,
      salary: totalSalary,
      workSchedule: primaryAssignment.workSchedule,
      status: editStaffStatus,
      role: editStaffRole,
    });

    setEditingStaffMember(null);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !fullName.trim()) return;

    const targetBId = isManager && managerBranchId ? managerBranchId : branchId;
    const isAll = targetBId === 'all';
    const branch = isAll ? null : (branches.find(b => b.id === targetBId) || branches[0]);

    updateUser(editingUser.id, {
      fullName,
      email,
      phone,
      role,
      branchId: isAll ? 'all' : branch?.id,
      branchName: isAll ? 'Bütün Filiallar (Qlobal Şəbəkə)' : branch?.name,
      isSuperAdmin: role === 'direktor',
      notes,
    });

    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('+994 50 ');
    setRole('sagird');
    setTempPassword('AreaPass2026!');
    setNotes('');
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setFullName(user.fullName);
    setEmail(user.email);
    setPhone(user.phone);
    setRole(user.role);
    setBranchId(user.branchId || branches[0]?.id || '');
    setNotes(user.notes || '');
  };

  const handleImpersonateRole = (targetRole: Role, userName: string) => {
    setCurrentRole(targetRole);
    showToast(`Giriş rolu dəyişdirildi: ${userName} (${targetRole.toUpperCase()})`);
  };

  // Role stats
  const directorCount = users.filter(u => u.role === 'direktor').length;
  const managerCount = users.filter(u => u.role === 'menecer').length;
  const trainerCount = users.filter(u => u.role === 'telimci').length;
  const studentCount = users.filter(u => u.role === 'sagird').length;
  const totalPayroll = staff.reduce((acc, s) => acc + s.salary, 0);

  // Permissions Matrix Definition
  const permissions = [
    {
      action: 'Filialların yaradılması və ləğvi',
      direktor: true,
      menecer: false,
      telimci: false,
      sagird: false,
      desc: 'GPS koordinatları, icarə və infrastruktur idarəsi',
    },
    {
      action: 'İstifadəçi idarəetməsi və Rol təyinatı (RBAC)',
      direktor: true,
      menecer: false,
      telimci: false,
      sagird: false,
      desc: 'Hesab yaratma, şifrə sıfırlama, səlahiyyət matrisi',
    },
    {
      action: 'Şirkət maliyyəsi, xərclər və xalis mənfəət',
      direktor: true,
      menecer: false,
      telimci: false,
      sagird: false,
      desc: 'Büdcə hesabatları, əməliyyat xərcləri və təlimçi maaşları',
    },
    {
      action: 'Müraciətlər qıfı və Tələbəyə çevirmə (CRM)',
      direktor: true,
      menecer: true,
      telimci: false,
      sagird: false,
      desc: 'Potensial tələbələr, sınaq dərsləri və satış kanalları',
    },
    {
      action: 'Tələbə ödənişləri qəbulu və qəbz çapı',
      direktor: true,
      menecer: true,
      telimci: false,
      sagird: false,
      desc: 'Ödəniş qeydiyyatı və balans avtomatik tənzimlənməsi',
    },
    {
      action: 'WhatsApp avtomatlaşdırılmış bildirişlər',
      direktor: true,
      menecer: true,
      telimci: false,
      sagird: false,
      desc: 'Borc xatırlatması, təbriklər və toplu bildirişlər',
    },
    {
      action: 'Avtomatlaşdırılmış Sertifikat Generatoru',
      direktor: true,
      menecer: true,
      telimci: true,
      sagird: false,
      desc: 'Yeni sertifikat istehsalı, şablon seçimi və təsdiq',
    },
    {
      action: 'Heyət QR Davamiyyət Terminalı və GPS qeydiyyatı',
      direktor: true,
      menecer: true,
      telimci: true,
      sagird: false,
      desc: 'Ofis daxili GPS təsdiqlənməsi ilə iş saatlarının qeydi',
    },
    {
      action: 'Tələbə dərslərində davamiyyət yazılması',
      direktor: true,
      menecer: true,
      telimci: true,
      sagird: false,
      desc: 'Aylıq qrup jurnalında P/G/Q statuslarının qeyd edilməsi',
    },
    {
      action: 'Kurikulum modulları və dərslərin redaktəsi',
      direktor: true,
      menecer: false,
      telimci: true,
      sagird: false,
      desc: 'Sillabus dərslərinin tərtibatı və ev tapşırıqları',
    },
    {
      action: 'Şəxsi qrup tədris cədvəli və sillabus baxışı',
      direktor: true,
      menecer: true,
      telimci: true,
      sagird: true,
      desc: 'Hər bir istifadəçi öz qrupunun dərslərini izləyə bilər',
    },
    {
      action: 'Şəxsi sertifikatın onlayn doğrulanması və yüklənməsi',
      direktor: true,
      menecer: true,
      telimci: true,
      sagird: true,
      desc: 'QR kod və ID ilə rəsmi sertifikat sənədini əldə etmə',
    },
    {
      action: 'Şəxsi təhsil balansı və ödəniş tarixçəsi',
      direktor: true,
      menecer: true,
      telimci: false,
      sagird: true,
      desc: 'Şagird öz şəxsi balansını və qəbzlərini yoxlayır',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            {isManager ? (
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            ) : (
              <UserCog className="w-5 h-5 text-indigo-600" />
            )}
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {isManager ? 'Filial Təlimçiləri & Heyət İdarəetməsi' : 'İstifadəçilər'}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono-nums">
              {isManager ? `${filteredStaff.length} Əməkdaş` : `${users.length} Hesab`}
            </span>
            {isManager && managerBranch && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                {managerBranch.name.replace('AREA ', '')}
              </span>
            )}
            {!isManager && activeBranch && selectedBranchId !== 'all' && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                Filial: {activeBranch.name.replace('AREA ', '')}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isManager
              ? `Təyin olunduğunuz filial (${managerBranch?.name || 'Filialınız'}) üzrə təlimçiləri əlavə edin, maaş və iş qrafiklərini tənzimləyin.`
              : selectedBranchId !== 'all' && activeBranch
              ? `"${activeBranch.name}" filialı üzrə təlimçilər, ştat heyəti və giriş hesabları.`
              : 'Sistem rolları, giriş hüquqları və Gmail icazələri.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Main View Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'staff'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isManager ? 'Təlimçilər & Ştat' : 'Ştat'} ({filteredStaff.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isManager ? 'Giriş Hesabları' : 'Hesablar'} ({filteredUsers.length})</span>
            </button>

            {can('view', 'permissions') && (
              <button
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'matrix'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Səlahiyyətlər & Rollar</span>
              </button>
            )}
          </div>

          {/* Quick Add Trainer Button (Primary for Managers & Available for Directors) */}
          {can('create', 'users') && (
            <button
              onClick={() => {
                const initBranchId = managerBranchId || (selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || 'branch-nerimanov');
                const def = getEmploymentTypeDefaults('full_stat');
                setTrainerBranchAssignments([
                  {
                    branchId: initBranchId,
                    employmentType: 'full_stat',
                    workSchedule: def.workSchedule,
                    weeklyHours: def.weeklyHours,
                    calcType: def.calcType,
                    baseRate: def.baseRate,
                    baseSalary: def.baseSalary,
                  },
                ]);
                setShowAddTrainerModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Təlimçi Əlavə Et</span>
            </button>
          )}

          {!isManager && can('create', 'users') && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>İstifadəçi</span>
            </button>
          )}
        </div>
      </div>

      {/* Role / Branch Overview Cards */}
      {isManager ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Branch Trainers */}
          <div
            onClick={() => {
              setActiveTab('staff');
              setStaffRoleFilter('Təlimçi');
            }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
              activeTab === 'staff' && staffRoleFilter === 'Təlimçi'
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                Filial Təlimçiləri
              </span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-slate-900">
              {staff.filter(s => s.role === 'Təlimçi').length} nəfər
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Dərsləri aparan və qruplara təyin edilən müəllimlər
            </span>
          </div>

          {/* Card 2: Branch Students */}
          <div
            onClick={() => {
              setActiveTab('users');
              setRoleFilter('sagird');
            }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
              activeTab === 'users' && roleFilter === 'sagird'
                ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Filial Tələbələri
              </span>
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-slate-900">
              {users.filter(u => u.role === 'sagird').length} tələbə
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Şəxsi kabinet və qrup tədris girişləri
            </span>
          </div>

          {/* Card 3: Branch Payroll */}
          <div
            onClick={() => {
              setActiveTab('staff');
              setStaffRoleFilter('all');
            }}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                Aylıq Əməkhaqqı Fondu
              </span>
              <DollarSign className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-emerald-600">
              {formatAZN(filteredStaff.reduce((acc, s) => acc + s.salary, 0))}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Filial heyətinin aylıq baza ştat fondu
            </span>
          </div>

          {/* Card 4: Branch Info */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                Təyin Olunmuş Filialınız
              </span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 truncate">
              {managerBranch?.name ? managerBranch.name.replace('AREA ', '') : 'Gənclik Filialı'}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium mt-1 block">
              Yalnız bu filialın məlumatlarını görürsünüz
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Role 1: Direktor */}
          <div
            onClick={() => {
              setActiveTab('users');
              setRoleFilter('direktor');
            }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
              roleFilter === 'direktor' && activeTab === 'users'
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
                1. Direktorlar
              </span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-slate-900">
              {directorCount} hesab
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Tam superadmin və maliyyə çıxışı
            </span>
          </div>

          {/* Role 2: Menecer */}
          <div
            onClick={() => {
              setActiveTab('users');
              setRoleFilter('menecer');
            }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
              roleFilter === 'menecer' && activeTab === 'users'
                ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                2. Menecerlər
              </span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-slate-900">
              {managerCount} hesab
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Tələbə qeydiyyatı, satış qıfı və ödənişlər
            </span>
          </div>

          {/* Role 3: Təlimçi */}
          <div
            onClick={() => {
              setActiveTab('users');
              setRoleFilter('telimci');
            }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
              roleFilter === 'telimci' && activeTab === 'users'
                ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                3. Təlimçilər
              </span>
              <GraduationCap className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-slate-900">
              {trainerCount} hesab
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Tədris jurnalları, kurikulum və dərslər
            </span>
          </div>

          {/* Role 4: Şagird */}
          <div
            onClick={() => {
              setActiveTab('users');
              setRoleFilter('sagird');
            }}
            className={`p-4 bg-white rounded-xl border transition-all cursor-pointer ${
              roleFilter === 'sagird' && activeTab === 'users'
                ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                4. Şagirdlər
              </span>
              <UserCog className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono-nums text-slate-900">
              {studentCount} hesab
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Şəxsi tədris kabineti, dərslər və sertifikat
            </span>
          </div>
        </div>
      )}

      {/* Tab 1: User Accounts (4 Roles Directory) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-3">
          {/* Security & Whitelist Banner */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-900/10 via-indigo-50 to-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-950">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Gmail Təhlükəsizlik Rejimi:</strong> Yalnız bu cədvələ əlavə etdiyiniz Gmail hesabları Google ilə daxil ola bilər. Baş Direktorlar: <strong className="font-mono text-indigo-700">scorpionabid82@gmail.com, roboticsarea@gmail.com, mentor.rasulzada@gmail.com, texnobabasatis@gmail.com</strong>
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-100 font-semibold px-2.5 py-0.5 rounded self-start sm:self-auto shrink-0">
              Google DB Whitelist Aktivdir
            </span>
          </div>

          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Ad, email və ya telefon nömrəsi ilə axtarış..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Hamısı ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter('direktor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === 'direktor'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Direktor ({directorCount})
              </button>
              <button
                onClick={() => setRoleFilter('menecer')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === 'menecer'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Menecer ({managerCount})
              </button>
              <button
                onClick={() => setRoleFilter('telimci')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === 'telimci'
                    ? 'bg-amber-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Təlimçi ({trainerCount})
              </button>
              <button
                onClick={() => setRoleFilter('sagird')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  roleFilter === 'sagird'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Şagird ({studentCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">İstifadəçi</th>
                  <th className="py-3 px-4">Sistem Rolu</th>
                  <th className="py-3 px-4">Filial</th>
                  <th className="py-3 px-4">Əlaqə</th>
                  <th className="py-3 px-4">Son Daxilolma</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(user => {
                  const getRoleStyle = (r: Role) => {
                    switch (r) {
                      case 'direktor':
                        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                      case 'menecer':
                        return 'bg-blue-50 text-blue-700 border-blue-200';
                      case 'telimci':
                        return 'bg-amber-50 text-amber-800 border-amber-200';
                      case 'sagird':
                        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    }
                  };

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {user.photoURL || user.avatarUrl ? (
                            <img
                              src={user.photoURL || user.avatarUrl}
                              alt={user.fullName}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">{user.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono-nums">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleStyle(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                          {user.customPermissions && Object.keys(user.customPermissions).length > 0 && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              <span>{Object.keys(user.customPermissions).length} fərdi istisna</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {user.branchName || 'Bütün Filiallar'}
                      </td>

                      <td className="py-3 px-4 font-mono-nums text-slate-700">
                        {user.phone}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono-nums">
                        {user.lastLogin || 'Məlum deyil'}
                      </td>

                      <td className="py-3 px-4">
                        {user.status === 'aktiv' ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktiv
                          </span>
                        ) : (
                          <span className="text-rose-700 font-medium flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Bloklanıb
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setManagingPermissionsUser(user)}
                            className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-indigo-200"
                            title="Bu istifadəçinin fərdi səhifə və əməliyyat səlahiyyətlərini tənzimlə"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Səlahiyyətlər</span>
                          </button>
                          <button
                            onClick={() => handleImpersonateRole(user.role, user.fullName)}
                            className="px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors flex items-center gap-1 cursor-pointer"
                            title="Bu istifadəçinin hüququ ilə sistemə bax"
                          >
                            <LogIn className="w-3 h-3" />
                            <span>Rola Keç</span>
                          </button>

                          {can('edit', 'users') && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1 text-slate-500 hover:text-indigo-600 rounded cursor-pointer"
                                title="Redaktə et"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  const newStatus = user.status === 'aktiv' ? 'bloklanib' : 'aktiv';
                                  updateUser(user.id, { status: newStatus });
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                                title={user.status === 'aktiv' ? 'Hesabı blokla' : 'Hesabı aktivləşdir'}
                              >
                                {user.status === 'aktiv' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-emerald-600" />}
                              </button>
                            </>
                          )}

                          {can('delete', 'users') && (
                            <button
                              onClick={() => {
                                confirmAction({
                                  title: 'İstifadəçi Hesabını Sil',
                                  message: `"${user.fullName}" (${user.email} · ${user.role.toUpperCase()}) hesabını sistemdən silmək istədiyinizə əminsiniz?`,
                                  confirmText: 'Bəli, Hesabı Sil',
                                  danger: true,
                                  onConfirm: () => deleteUser(user.id),
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="İstifadəçini sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Tab 2: Staff & Payroll Directory */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Staff summary info banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold">Akademiya Əməkdaşları və Aylıq Ştat Fondu</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rəsmi əmək müqaviləsi və qrafik üzrə çalışan pedaqoji və inzibati heyət.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono-nums">
              <div>
                <span className="text-slate-400 block text-[10px]">Cəmi Əməkdaş:</span>
                <strong className="text-base text-white">{staff.length} nəfər</strong>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px]">Aylıq Əməkhaqqı Fondu:</span>
                <strong className="text-base text-emerald-400">{formatAZN(totalPayroll)}</strong>
              </div>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {isManager ? 'Filial Təlimçiləri & Ştat Siyahısı' : 'Əməkdaşlar Siyahısı'} ({filteredStaff.length})
                </h3>
                <button
                  onClick={() => {
                    const initBranchId = managerBranchId || (selectedBranchId !== 'all' ? selectedBranchId : branches[0]?.id || 'branch-nerimanov');
                    const def = getEmploymentTypeDefaults('full_stat');
                    setTrainerBranchAssignments([
                      {
                        branchId: initBranchId,
                        employmentType: 'full_stat',
                        workSchedule: def.workSchedule,
                        weeklyHours: def.weeklyHours,
                        calcType: def.calcType,
                        baseRate: def.baseRate,
                        baseSalary: def.baseSalary,
                      },
                    ]);
                    setShowAddTrainerModal(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Təlimçi Əlavə Et</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStaffRoleFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    staffRoleFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Hamısı
                </button>
                {!isManager && (
                  <button
                    onClick={() => setStaffRoleFilter('Direktor')}
                    className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      staffRoleFilter === 'Direktor' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Direktorlar
                  </button>
                )}
                {!isManager && (
                  <button
                    onClick={() => setStaffRoleFilter('Menecer')}
                    className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                      staffRoleFilter === 'Menecer' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Menecerlər
                  </button>
                )}
                <button
                  onClick={() => setStaffRoleFilter('Təlimçi')}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                    staffRoleFilter === 'Təlimçi' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Təlimçilər
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Təlimçi / Əməkdaş</th>
                    <th className="py-3 px-4">Vəzifə / Ştat</th>
                    <th className="py-3 px-4">Təyin Olunduğu Filial</th>
                    <th className="py-3 px-4">Əlaqə</th>
                    <th className="py-3 px-4">İş Qrafiki</th>
                    <th className="py-3 px-4">Aylıq Əməkhaqqı</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Bu filialda hələ ki təlimçi və ya əməkdaş tapılmadı. Yuxarıdakı "Təlimçi Əlavə Et" düyməsi ilə əlavə edə bilərsiniz.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{member.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono-nums">{member.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                            {member.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {member.assignedBranches && member.assignedBranches.length > 1 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span>{member.assignedBranches.length} Filialda Aktiv:</span>
                              </div>
                              <div className="space-y-0.5 pl-3">
                                {member.assignedBranches.map((ab, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-700 font-medium">
                                    · {ab.branchName.replace('AREA ', '')}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span>{member.branchName}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono-nums text-slate-700">{member.phone}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {member.assignedBranches && member.assignedBranches.length > 1 ? (
                            <div className="space-y-1.5">
                              {member.assignedBranches.map((ab, idx) => (
                                <div key={idx} className="text-[11px] text-slate-700 font-medium flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900">{ab.branchName.replace('AREA ', '').replace(' Filialı', '')}:</span>
                                  {renderEmploymentBadge(ab.employmentType, ab.weeklyHours)}
                                  <span className="text-slate-600 font-mono-nums">{ab.workSchedule}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {renderEmploymentBadge(member.employmentType, member.weeklyHours)}
                              <span>{member.workSchedule}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono-nums font-bold text-slate-900">
                          {member.assignedBranches && member.assignedBranches.length > 1 ? (
                            <div>
                              <div>{formatAZN(member.salary)} <span className="text-[10px] text-slate-400 font-normal">(Cəm)</span></div>
                              <div className="text-[10px] text-slate-500 font-normal space-y-0.5 mt-0.5">
                                {member.assignedBranches.map((ab, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <span className="text-slate-700">{ab.branchName.replace('AREA ', '').replace(' Filialı', '')}:</span>
                                    <span>
                                      {ab.calcType === 'saatliq'
                                        ? `${ab.baseRate || 25} ₼/saat (~${formatAZN(ab.baseSalary || 0)})`
                                        : ab.calcType === 'faiz'
                                        ? `%${ab.baseRate || 40} Gəlirdən`
                                        : formatAZN(ab.baseSalary || 0)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div>{formatAZN(member.salary)}</div>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {member.employmentType === 'saatliq' ? 'Saatlıq tarif' : 'Sabit baza'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {member.status === 'aktiv' ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">
                              Aktiv
                            </span>
                          ) : member.status === 'mezuniyyet' ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                              Məzuniyyət
                            </span>
                          ) : (
                            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                              Ayrılıb
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {can('edit', 'users') && (
                              <button
                                onClick={() => handleOpenEditStaff(member)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                                title="Təlimçi məlumatlarını və maaşını redaktə et"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {can('delete', 'users') && (
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Əməkdaşı Ştatdan Sil',
                                    message: `"${member.fullName}" (${member.role} · ${member.branchName}) əməkdaşını ştat cədvəlindən və sistemdən silmək istədiyinizə əminsiniz?`,
                                    confirmText: 'Bəli, Ştatdan Sil',
                                    danger: true,
                                    onConfirm: () => deleteStaff(member.id),
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Ştatdan sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions & Roles Manager (Səlahiyyətlər & Rollar İdarəetmə Paneli) */}
      {activeTab === 'matrix' && can('view', 'permissions') && (
        <RolePermissionsManager />
      )}

      {/* Modal: Add New User */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Yeni İstifadəçi Hesabının Açılması
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad və Soyad:
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: Nərmin Əhmədova"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Giriş Logini):
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nermin@areacrm.az"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon Nömrəsi:
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sistem Rolu:
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    {!isManager && <option value="direktor">1. Direktor (Superadmin)</option>}
                    {!isManager && <option value="menecer">2. Menecer (Tədris & CRM)</option>}
                    <option value="telimci">3. Təlimçi (Müəllim / Mentor)</option>
                    <option value="sagird">4. Şagird (Tələbə / Məzun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Təhkim Olunacaq Filial:
                  </label>
                  {isManager ? (
                    <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{managerBranch?.name || 'Filialınız'} (Təyin edilmiş)</span>
                    </div>
                  ) : (
                    <select
                      value={branchId}
                      onChange={e => setBranchId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="all">Bütün Filiallar (Qlobal)</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Müvəqqəti Giriş Şifrəsi:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setTempPassword(`Area${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                  >
                    Yeni Kod
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeydlər:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  placeholder="İstifadəçi haqqında xüsusi təyinat və ya qrup məlumatı..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Hesabı Yarat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                İstifadəçi Məlumatlarının Redaktəsi
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad və Soyad:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon:
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sistem Rolu:
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as Role)}
                    disabled={isManager && (editingUser.role === 'direktor' || editingUser.role === 'menecer')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                  >
                    {!isManager && <option value="direktor">1. Direktor (Superadmin)</option>}
                    {!isManager && <option value="menecer">2. Menecer (Tədris & CRM)</option>}
                    <option value="telimci">3. Təlimçi (Müəllim / Mentor)</option>
                    <option value="sagird">4. Şagird (Tələbə / Məzun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Təhkim Olunduğu Filial:
                  </label>
                  {isManager ? (
                    <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{managerBranch?.name || 'Filialınız'}</span>
                    </div>
                  ) : (
                    <select
                      value={branchId}
                      onChange={e => setBranchId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="all">Bütün Filiallar (Qlobal)</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeydlər:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
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

      {/* Modal: Add New Trainer (Managers & Directors) */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Yeni Təlimçi Əlavə Edin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isManager
                      ? `${managerBranch?.name || 'Filialınız'} üzrə ştata və sistemə qeydiyyat`
                      : 'Təlimçinin həm ştata, həm də CRM sisteminə əlavə edilməsi'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTrainerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleCreateTrainerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Təlimçinin Ad və Soyadı:
                </label>
                <input
                  type="text"
                  required
                  placeholder="məs: Murad İsmayılov"
                  value={trainerFullName}
                  onChange={e => setTrainerFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Sistem Girişi üçün):
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="murad@areacrm.az"
                    value={trainerEmail}
                    onChange={e => setTrainerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Əlaqə Telefonu:
                  </label>
                  <input
                    type="text"
                    required
                    value={trainerPhone}
                    onChange={e => setTrainerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              {/* Multi-Branch Assignments & Individual Schedules */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Filial Təyinatları & Fərdi İş Cədvəlləri</span>
                  </div>
                  {!isManager && (
                    <button
                      type="button"
                      onClick={() => {
                        const availableBranch = branches.find(b => !trainerBranchAssignments.some(a => a.branchId === b.id)) || branches[0];
                        const def = getEmploymentTypeDefaults('saatliq');
                        setTrainerBranchAssignments(prev => [
                          ...prev,
                          {
                            branchId: availableBranch.id,
                            employmentType: 'saatliq',
                            workSchedule: def.workSchedule,
                            weeklyHours: def.weeklyHours,
                            calcType: def.calcType,
                            baseRate: def.baseRate,
                            baseSalary: def.baseSalary,
                          },
                        ]);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Başqa Filial Əlavə Et</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {trainerBranchAssignments.map((assignment, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          {idx === 0 ? '📍 Əsas Filial (Primary)' : `📍 Əlavə Filial #${idx + 1}`}
                        </span>
                        {trainerBranchAssignments.length > 1 && !isManager && (
                          <button
                            type="button"
                            onClick={() => {
                              setTrainerBranchAssignments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold cursor-pointer"
                          >
                            Sil
                          </button>
                        )}
                      </div>

                      {/* 1. Branch selection */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Filialı Seçin:</label>
                        {isManager && idx === 0 ? (
                          <div className="w-full bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{managerBranch?.name || 'Filialınız'}</span>
                          </div>
                        ) : (
                          <select
                            value={assignment.branchId}
                            onChange={e => {
                              const val = e.target.value;
                              setTrainerBranchAssignments(prev =>
                                prev.map((a, i) => (i === idx ? { ...a, branchId: val } : a))
                              );
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                          >
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.name.replace('AREA ', '')}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* 2. Employment Type (İş Qrafiki / Ştat Növü) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-semibold text-slate-700">İş Qrafiki (Ştat Növü):</label>
                          <span className="text-[10px] text-indigo-600 font-medium">Əməkhaqqı avtomatik uyğunlaşır</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'full_stat', label: 'Full Ştat', desc: '40 saat / həftə' },
                            { id: 'yarim_stat', label: 'Yarım Ştat', desc: '20 saat / həftə' },
                            { id: 'saatliq', label: 'Saatlıq', desc: 'Tariflə / saat' },
                            { id: 'ferdi', label: 'Fərdi Qrafik', desc: 'Sərbəst / layihə' },
                          ].map(t => {
                            const isSel = (assignment.employmentType || 'full_stat') === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  const def = getEmploymentTypeDefaults(t.id as EmploymentType);
                                  setTrainerBranchAssignments(prev =>
                                    prev.map((a, i) =>
                                      i === idx
                                        ? {
                                            ...a,
                                            employmentType: t.id as EmploymentType,
                                            weeklyHours: def.weeklyHours,
                                            workSchedule: def.workSchedule,
                                            calcType: def.calcType,
                                            baseRate: def.baseRate,
                                            baseSalary: def.baseSalary,
                                          }
                                        : a
                                    )
                                  );
                                }}
                                className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-400/30'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                                }`}
                              >
                                <span className="block text-[11px] leading-tight">{t.label}</span>
                                <span className="block text-[9px] text-slate-400 font-normal">{t.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Schedule string & Weekly hours norm */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Dəqiq İş Saatları və Günlər:</label>
                          <input
                            type="text"
                            required
                            placeholder="B.e - Cümə · 10:00 - 18:00"
                            value={assignment.workSchedule}
                            onChange={e => {
                              const val = e.target.value;
                              setTrainerBranchAssignments(prev =>
                                prev.map((a, i) => (i === idx ? { ...a, workSchedule: val } : a))
                              );
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Həftəlik Norma:</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={assignment.weeklyHours || (assignment.employmentType === 'yarim_stat' ? 20 : 40)}
                              onChange={e => {
                                const h = Number(e.target.value);
                                setTrainerBranchAssignments(prev =>
                                  prev.map((a, i) => {
                                    if (i === idx) {
                                      const newBase = a.calcType === 'saatliq' ? (a.baseRate || 25) * h * 4 : a.baseSalary;
                                      return { ...a, weeklyHours: h, baseSalary: newBase };
                                    }
                                    return a;
                                  })
                                );
                              }}
                              className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                            />
                            <span className="text-[10px] text-slate-500">saat/həftə</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Flexible Compensation Type & Rate / Base Salary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 mb-1">Əməkhaqqı Modeli:</label>
                          <select
                            value={assignment.calcType || 'sabit'}
                            onChange={e => {
                              const ct = e.target.value as SalaryCalcType;
                              setTrainerBranchAssignments(prev =>
                                prev.map((a, i) => {
                                  if (i === idx) {
                                    const newRate = ct === 'faiz' ? 40 : ct === 'saatliq' ? 25 : 800;
                                    const newBase = ct === 'saatliq' ? newRate * (a.weeklyHours || 12) * 4 : newRate;
                                    return { ...a, calcType: ct, baseRate: newRate, baseSalary: newBase };
                                  }
                                  return a;
                                })
                              );
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800"
                          >
                            <option value="sabit">💵 Sabit Aylıq Maaş (AZN)</option>
                            <option value="saatliq">⏱️ Saathesabı Məzənnə (AZN / saat)</option>
                            <option value="faiz">📊 Tədris Gəlirindən Faiz (%)</option>
                            <option value="kombine">⚡ Kombinə (Baza + Faiz)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                            {assignment.calcType === 'saatliq'
                              ? 'Saatlıq Tarif (AZN / saat):'
                              : assignment.calcType === 'faiz'
                              ? 'Tədrisdən Faiz Payı (%):'
                              : 'Filial Aylıq Baza Maaşı (AZN):'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step={assignment.calcType === 'faiz' ? 1 : 5}
                              required
                              value={assignment.calcType === 'sabit' ? assignment.baseSalary : assignment.baseRate}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setTrainerBranchAssignments(prev =>
                                  prev.map((a, i) => {
                                    if (i === idx) {
                                      if (a.calcType === 'saatliq') {
                                        const est = val * (a.weeklyHours || 12) * 4;
                                        return { ...a, baseRate: val, baseSalary: est };
                                      } else if (a.calcType === 'faiz') {
                                        return { ...a, baseRate: val };
                                      } else {
                                        return { ...a, baseRate: val, baseSalary: val };
                                      }
                                    }
                                    return a;
                                  })
                                );
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold text-slate-900"
                            />
                            {assignment.calcType === 'saatliq' && (
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono-nums font-medium">
                                ~{formatAZN(assignment.baseSalary || 0)}/ay
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1.5 border-t border-slate-200">
                  <span className="font-medium">Ümumi Aylıq Baza Maaş Fondu:</span>
                  <span className="font-bold text-slate-900 font-mono-nums">
                    {formatAZN(trainerBranchAssignments.reduce((acc, a) => acc + (Number(a.baseSalary) || 0), 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qeydlər və İxtisaslaşma:
                </label>
                <textarea
                  rows={2}
                  value={trainerNotes}
                  onChange={e => setTrainerNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  placeholder="Robototexnika, Python və ya VEX təlimləri üzrə..."
                />
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Təlimçi həm ştat cədvəlinə (maaş və QR giriş), həm də CRM sisteminə (tədris qruplarına təyin edilməsi və sistemə girişi) avtomatik əlavə olunacaq.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTrainerModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Təlimçini Əlavə Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Staff Member / Trainer */}
      {editingStaffMember && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Təlimçi / Əməkdaş Məlumatlarının Redaktəsi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Məlumatları, aylıq baza maaşını və statusu yeniləyin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStaffMember(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <form onSubmit={handleUpdateStaffSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ad və Soyad:
                </label>
                <input
                  type="text"
                  required
                  value={editStaffFullName}
                  onChange={e => setEditStaffFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={editStaffEmail}
                    onChange={e => setEditStaffEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon:
                  </label>
                  <input
                    type="text"
                    required
                    value={editStaffPhone}
                    onChange={e => setEditStaffPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  İş Statusu:
                </label>
                <select
                  value={editStaffStatus}
                  onChange={e => setEditStaffStatus(e.target.value as 'aktiv' | 'mezuniyyet' | 'ayrilib')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold"
                >
                  <option value="aktiv">Aktiv Ştat</option>
                  <option value="mezuniyyet">Məzuniyyətdə</option>
                  <option value="ayrilib">Ştatdan Ayrılıb</option>
                </select>
              </div>

              {/* Multi-Branch Assignments & Individual Schedules Editor */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Filial Təyinatları, Ştat Növləri & Əməkhaqqı Modelləri</span>
                  </div>
                  {!isManager && (
                    <button
                      type="button"
                      onClick={() => {
                        const availableBranch = branches.find(b => !editStaffBranchAssignments.some(a => a.branchId === b.id)) || branches[0];
                        const def = getEmploymentTypeDefaults('saatliq');
                        setEditStaffBranchAssignments(prev => [
                          ...prev,
                          {
                            branchId: availableBranch.id,
                            employmentType: 'saatliq',
                            workSchedule: def.workSchedule,
                            weeklyHours: def.weeklyHours,
                            calcType: def.calcType,
                            baseRate: def.baseRate,
                            baseSalary: def.baseSalary,
                          },
                        ]);
                      }}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Başqa Filial Əlavə Et</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {editStaffBranchAssignments.map((assignment, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          {idx === 0 ? '📍 Əsas Filial (Primary)' : `📍 Əlavə Filial #${idx + 1}`}
                        </span>
                        {editStaffBranchAssignments.length > 1 && !isManager && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditStaffBranchAssignments(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold cursor-pointer"
                          >
                            Filialı Sil
                          </button>
                        )}
                      </div>

                      {/* 1. Branch Selector */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-1">Filial Seçin:</label>
                        {isManager && idx === 0 ? (
                          <div className="w-full bg-slate-100 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-800 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span className="truncate">{managerBranch?.name || 'Filialınız'}</span>
                          </div>
                        ) : (
                          <select
                            value={assignment.branchId}
                            onChange={e => {
                              const val = e.target.value;
                              setEditStaffBranchAssignments(prev =>
                                prev.map((a, i) => (i === idx ? { ...a, branchId: val } : a))
                              );
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium"
                          >
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>
                                {b.name.replace('AREA ', '')}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* 2. Employment Type (İş Qrafiki / Ştat Növü) */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-semibold text-slate-700">İş Qrafiki (Ştat Növü):</label>
                          <span className="text-[10px] text-indigo-600 font-medium">Əməkhaqqı avtomatik uyğunlaşır</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {[
                            { id: 'full_stat', label: 'Full Ştat', desc: '40 saat / həftə' },
                            { id: 'yarim_stat', label: 'Yarım Ştat', desc: '20 saat / həftə' },
                            { id: 'saatliq', label: 'Saatlıq', desc: 'Tariflə / saat' },
                            { id: 'ferdi', label: 'Fərdi Qrafik', desc: 'Sərbəst / layihə' },
                          ].map(t => {
                            const isSel = (assignment.employmentType || 'full_stat') === t.id;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  const def = getEmploymentTypeDefaults(t.id as EmploymentType);
                                  setEditStaffBranchAssignments(prev =>
                                    prev.map((a, i) =>
                                      i === idx
                                        ? {
                                            ...a,
                                            employmentType: t.id as EmploymentType,
                                            weeklyHours: def.weeklyHours,
                                            workSchedule: def.workSchedule,
                                            calcType: def.calcType,
                                            baseRate: def.baseRate,
                                            baseSalary: def.baseSalary,
                                          }
                                        : a
                                    )
                                  );
                                }}
                                className={`px-2 py-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                                  isSel
                                    ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold shadow-2xs ring-1 ring-indigo-400/30'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                                }`}
                              >
                                <span className="block text-[11px] leading-tight">{t.label}</span>
                                <span className="block text-[9px] text-slate-400 font-normal">{t.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Schedule string & Weekly hours norm */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Dəqiq İş Saatları və Günlər:</label>
                          <input
                            type="text"
                            required
                            placeholder="B.e - Cümə · 10:00 - 18:00"
                            value={assignment.workSchedule}
                            onChange={e => {
                              const val = e.target.value;
                              setEditStaffBranchAssignments(prev =>
                                prev.map((a, i) => (i === idx ? { ...a, workSchedule: val } : a))
                              );
                            }}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">Həftəlik Norma:</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={60}
                              value={assignment.weeklyHours || (assignment.employmentType === 'yarim_stat' ? 20 : 40)}
                              onChange={e => {
                                const h = Number(e.target.value);
                                setEditStaffBranchAssignments(prev =>
                                  prev.map((a, i) => {
                                    if (i === idx) {
                                      const newBase = a.calcType === 'saatliq' ? (a.baseRate || 25) * h * 4 : a.baseSalary;
                                      return { ...a, weeklyHours: h, baseSalary: newBase };
                                    }
                                    return a;
                                  })
                                );
                              }}
                              className="w-16 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                            />
                            <span className="text-[10px] text-slate-500">saat/həftə</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. Flexible Compensation Type & Rate / Base Salary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 mb-1">Əməkhaqqı Modeli:</label>
                          <select
                            value={assignment.calcType || 'sabit'}
                            onChange={e => {
                              const ct = e.target.value as SalaryCalcType;
                              setEditStaffBranchAssignments(prev =>
                                prev.map((a, i) => {
                                  if (i === idx) {
                                    const newRate = ct === 'faiz' ? 40 : ct === 'saatliq' ? 25 : 800;
                                    const newBase = ct === 'saatliq' ? newRate * (a.weeklyHours || 12) * 4 : newRate;
                                    return { ...a, calcType: ct, baseRate: newRate, baseSalary: newBase };
                                  }
                                  return a;
                                })
                              );
                            }}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800"
                          >
                            <option value="sabit">Sabit Aylıq Maaş (AZN)</option>
                            <option value="saatliq">Saathesabı Tarif (AZN/saat)</option>
                            <option value="faiz">Tədris Gəlirindən Faiz (%)</option>
                            <option value="kombine">Kombinə (Baza + Bonus)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                            {assignment.calcType === 'faiz'
                              ? 'Faiz Dərəcəsi (%):'
                              : assignment.calcType === 'saatliq'
                              ? 'Saatlıq Tarif (AZN/saat):'
                              : 'Baza Aylıq Məbləğ (AZN):'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step={assignment.calcType === 'faiz' ? 5 : assignment.calcType === 'saatliq' ? 1 : 50}
                              required
                              value={assignment.baseRate || assignment.baseSalary || 0}
                              onChange={e => {
                                const rate = Number(e.target.value);
                                setEditStaffBranchAssignments(prev =>
                                  prev.map((a, i) => {
                                    if (i === idx) {
                                      const base = a.calcType === 'saatliq' ? rate * (a.weeklyHours || 12) * 4 : rate;
                                      return { ...a, baseRate: rate, baseSalary: base };
                                    }
                                    return a;
                                  })
                                );
                              }}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold text-slate-900"
                            />
                            {assignment.calcType === 'saatliq' && (
                              <span className="text-[10px] text-slate-500 shrink-0 font-mono-nums font-medium">
                                ~{formatAZN(assignment.baseSalary || 0)}/ay
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1.5 border-t border-slate-200">
                  <span className="font-medium">Ümumi Aylıq Baza Əməkhaqqı:</span>
                  <span className="font-bold text-slate-900 font-mono-nums">
                    {formatAZN(editStaffBranchAssignments.reduce((acc, a) => acc + (Number(a.baseSalary) || 0), 0))}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaffMember(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Yadda Saxla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User-Level Custom Permissions Management Modal */}
      <UserPermissionsModal
        user={managingPermissionsUser}
        isOpen={!!managingPermissionsUser}
        onClose={() => setManagingPermissionsUser(null)}
      />
    </div>
  );
};
