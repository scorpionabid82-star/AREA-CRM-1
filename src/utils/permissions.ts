import { Role, SystemModuleId, ModulePermissionRule, RolePermissionsConfig, SystemModuleMeta } from '../types/crm';

export const SYSTEM_MODULES: SystemModuleMeta[] = [
  {
    id: 'dashboard',
    label: 'İdarəetmə Paneli (Dashboard)',
    category: 'core',
    description: 'Ümumi statistik göstəricilər, qrafiklər və gündəlik icmal.',
    actions: {
      view: 'Panelə və statistikaya baxış',
      create: 'Statistika filtrləri təyin etmə',
      edit: 'Panel vidjetlərini fərdiləşdirmə',
      delete: 'Bildiriş/icmal qeydlərini təmizləmə',
    },
  },
  {
    id: 'students',
    label: 'Tələbələr Bazası',
    category: 'core',
    description: 'Tələbələrin şəxsi işləri, əlaqə vasitələri, balans və statusları.',
    actions: {
      view: 'Tələbə siyahısı və profillərinə baxış',
      create: 'Yeni tələbə qeydiyyatı (Unikal ad yoxlanışı ilə)',
      edit: 'Tələbə məlumatlarını, status və qrupunu redaktə',
      delete: 'Tələbəni arxivləşdirmə və ya bazadan silmə',
    },
  },
  {
    id: 'contracts',
    label: 'Tədris Müqavilələri',
    category: 'core',
    description: 'Proqramlar üzrə rəsmi müqavilələr, ödəniş planları və şərtlər.',
    actions: {
      view: 'Müqavilələr reyestrinə və detallara baxış',
      create: 'Yeni tədris müqaviləsi bağlama (Bir tələbəyə bir neçə proqram)',
      edit: 'Müqavilə şərtlərini, qiymət və tarixləri redaktə',
      delete: 'Müqaviləni ləğv etmə və ya silmə',
    },
  },
  {
    id: 'groups',
    label: 'Akademik Qruplar',
    category: 'academic',
    description: 'Kurslar, dərslik cədvəlləri, otaqlar və qrup heyəti.',
    actions: {
      view: 'Qruplara və dərs cədvəlinə baxış',
      create: 'Yeni tədris qrupu açma',
      edit: 'Qrup cədvəli, otaq və təlimçi dəyişikliyi',
      delete: 'Qrupu bağlama və ya ləğv etmə',
    },
  },
  {
    id: 'leads',
    label: 'Müraciətlər və Satış Qıfı (Lidlər)',
    category: 'core',
    description: 'Potensial müştərilər, sınaq dərsləri və marketinq kanalları.',
    actions: {
      view: 'Lid siyahısı və zəng tarixçəsinə baxış',
      create: 'Yeni lid qeydiyyatı və sınaq dərsinə yazma',
      edit: 'Lid statusunu və qeydləri yeniləmə',
      delete: 'Müraciəti arxivləşdirmə və ya silmə',
    },
  },
  {
    id: 'attendance',
    label: 'Tələbə Davamiyyəti',
    category: 'academic',
    description: 'Dərslər üzrə tələbələrin iştirakı, gecikmə və qayıblar.',
    actions: {
      view: 'Davamiyyət jurnalına və hesabatlara baxış',
      create: 'Dərs üzrə davamiyyəti qeyd etmə',
      edit: 'Keçmiş davamiyyət statuslarını redaktə etmə',
      delete: 'Davamiyyət qeydini silmə və ya sıfırlama',
    },
  },
  {
    id: 'staffAttendance',
    label: 'QR Giriş & İşçi Davamiyyəti',
    category: 'management',
    description: 'Ofis daxili GPS təsdiqli QR kod ilə işə gəliş-gediş terminalı.',
    actions: {
      view: 'İşçi giriş-çıxış qeydlərinə baxış',
      create: 'Giriş/çıxış üçün QR kod oxutma',
      edit: 'İş saatlarını əllə korreksiya etmə',
      delete: 'Giriş qeydini sistemdən silmə',
    },
  },
  {
    id: 'certificates',
    label: 'Sertifikat Generatoru',
    category: 'academic',
    description: 'QR kodlu rəsmi sertifikatların istehsalı və onlayn verifikasiya.',
    actions: {
      view: 'Sertifikatlar reyestrinə və şablonlara baxış',
      create: 'Yeni sertifikat generasiya etmə',
      edit: 'Sertifikat məlumatlarını redaktə etmə',
      delete: 'Verilmiş sertifikatı etibarsız etmə/silmə',
    },
  },
  {
    id: 'curriculum',
    label: 'Tədris Kurikulumu & Sillabus',
    category: 'academic',
    description: 'Kurs modulları, dərslər, ev tapşırıqları və resurslar.',
    actions: {
      view: 'Tədris planına və dərslərə baxış',
      create: 'Yeni dərs modulu və ya mövzu əlavə etmə',
      edit: 'Dərs materialları və tapşırıqları redaktə etmə',
      delete: 'Mövzu və ya resursu silmə',
    },
  },
  {
    id: 'finance',
    label: 'Maliyyə & Kassa',
    category: 'management',
    description: 'Ödənişlər, xərclər, əməkhaqqı fondu və xalis mənfəət.',
    actions: {
      view: 'Maliyyə balansı və qəbzlərə baxış',
      create: 'Ödəniş və ya xərc qeydiyyatı aparma',
      edit: 'Maliyyə kateqoriyalarını və qeydləri redaktə',
      delete: 'Maliyyə əməliyyatını ləğv etmə/silmə',
    },
  },
  {
    id: 'kpi',
    label: 'KPI & Motivasiya Sistemi',
    category: 'management',
    description: 'İşçilərin performans göstəriciləri, ballar və bonuslar.',
    actions: {
      view: 'KPI reytinqi və ballara baxış',
      create: 'Yeni KPI metriki və ya hədəf təyin etmə',
      edit: 'İşçinin performans ballarını tənzimləmə',
      delete: 'KPI qaydasını ləğv etmə',
    },
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp Avtomatlaşdırması',
    category: 'management',
    description: 'Toplu mesajlar, borc xatırlatmaları və təbriklər.',
    actions: {
      view: 'Mesaj şablonlarına və göndəriş tarixçəsinə baxış',
      create: 'Yeni bildiriş kampaniyası başlatma',
      edit: 'Mesaj mətnləri və avtomatik tətikləyiciləri redaktə',
      delete: 'Şablon və ya kampaniyanı silmə',
    },
  },
  {
    id: 'branches',
    label: 'Filiallar və Məkanlar',
    category: 'system',
    description: 'Filial məlumatları, GPS koordinatları və infrastrukturu.',
    actions: {
      view: 'Filial siyahısına və detallara baxış',
      create: 'Yeni filial açma və GPS təyin etmə',
      edit: 'Filial parametrlərini və otaqlarını redaktə',
      delete: 'Filialı arxivləşdirmə və ya sistemdən silmə',
    },
  },
  {
    id: 'users',
    label: 'İstifadəçilər & Ştat Heyəti',
    category: 'system',
    description: 'Giriş hesabları, ştat cədvəli, təlimçilər və şifrələr.',
    actions: {
      view: 'İstifadəçi və ştat siyahısına baxış',
      create: 'Yeni istifadəçi və ya təlimçi hesabı açma',
      edit: 'İstifadəçi profilini, şifrəsini və filialını redaktə',
      delete: 'Hesabı bloklama və ya ştatdan silmə',
    },
  },
  {
    id: 'tasks',
    label: 'Rəhbərlik Tapşırıq İzləmə',
    category: 'management',
    description: 'Filiallar və əməkdaşlar üzrə icra planı, tapşırıq cədvəli və Excel hesabatı.',
    actions: {
      view: 'Tapşırıqlara və icra cədvəlinə baxış',
      create: 'Yeni tapşırıq təyin etmə',
      edit: 'Tapşırıq statusunu və qeydləri yeniləmə',
      delete: 'Tapşırığı arxivləmə və ya silmə',
    },
  },
  {
    id: 'permissions',
    label: 'Rol və Səlahiyyət İdarəetməsi',
    category: 'system',
    description: 'Superadmin tərəfindən bütün rolların RBAC hüquqlarının tənzimlənməsi.',
    actions: {
      view: 'Səlahiyyətlər matrisinə baxış',
      create: 'Yeni icazə qaydaları təyin etmə',
      edit: 'Rolların baxış, əlavə, redaktə, silmə hüquqlarını dəyişmə',
      delete: 'Səlahiyyətləri standart vəziyyətə sıfırlama',
    },
  },
  {
    id: 'inventory',
    label: 'İnventarizasiya və Texniki Müraciətlər',
    category: 'management',
    description: 'DIY və ödənişli məhsullar, mərkəzi anbar, avadanlıqlar, tələblər, texniki müraciətlər, aktlar və filial borcları.',
    actions: {
      view: 'İnventar, sifariş və müraciətlərə baxış',
      create: 'Yeni sifariş, avadanlıq tələbi və ya texniki müraciət yaratma',
      edit: 'Status dəyişmə, anbar qalığını redaktə və təmir qeydi',
      delete: 'Məhsul, tələb və ya aktları arxivləşdirmə',
    },
  },
  {
    id: 'marketing',
    label: 'Marketinq və SMM',
    category: 'management',
    description: 'Filiallar və Baş ofis üzrə sosial media hesabları, linklər, metrikalar və həftəlik/aylıq paylaşımlar təqvimi.',
    actions: {
      view: 'Sosial media hesabları və post planlarına baxış',
      create: 'Yeni sosial media hesabı və ya post layihəsi əlavə etmə',
      edit: 'Hesab məlumatlarını, izləyici sayını və post statusunu yeniləmə',
      delete: 'Sosial hesabı və ya planlaşdırılan postu silmə',
    },
  },
];

export const DEFAULT_ROLE_PERMISSIONS: RolePermissionsConfig = {
  direktor: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    students: { view: true, create: true, edit: true, delete: true },
    contracts: { view: true, create: true, edit: true, delete: true },
    groups: { view: true, create: true, edit: true, delete: true },
    leads: { view: true, create: true, edit: true, delete: true },
    attendance: { view: true, create: true, edit: true, delete: true },
    staffAttendance: { view: true, create: true, edit: true, delete: true },
    certificates: { view: true, create: true, edit: true, delete: true },
    curriculum: { view: true, create: true, edit: true, delete: true },
    finance: { view: true, create: true, edit: true, delete: true },
    tasks: { view: true, create: true, edit: true, delete: true },
    kpi: { view: true, create: true, edit: true, delete: true },
    whatsapp: { view: true, create: true, edit: true, delete: true },
    branches: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    permissions: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, create: false, edit: false, delete: false },
    marketing: { view: true, create: true, edit: true, delete: true },
  },
  menecer: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    students: { view: true, create: true, edit: true, delete: false },
    contracts: { view: true, create: true, edit: true, delete: false },
    groups: { view: true, create: true, edit: true, delete: false },
    leads: { view: true, create: true, edit: true, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
    staffAttendance: { view: true, create: true, edit: false, delete: false },
    certificates: { view: true, create: true, edit: false, delete: false },
    curriculum: { view: true, create: false, edit: false, delete: false },
    finance: { view: true, create: true, edit: false, delete: false },
    tasks: { view: true, create: true, edit: true, delete: false },
    kpi: { view: true, create: false, edit: false, delete: false },
    whatsapp: { view: true, create: true, edit: true, delete: false },
    branches: { view: true, create: false, edit: false, delete: false },
    users: { view: true, create: true, edit: true, delete: false },
    permissions: { view: false, create: false, edit: false, delete: false },
    inventory: { view: true, create: true, edit: true, delete: false },
    marketing: { view: true, create: true, edit: true, delete: false },
  },
  texnobaba_meneceri: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    students: { view: false, create: false, edit: false, delete: false },
    contracts: { view: false, create: false, edit: false, delete: false },
    groups: { view: false, create: false, edit: false, delete: false },
    leads: { view: false, create: false, edit: false, delete: false },
    attendance: { view: false, create: false, edit: false, delete: false },
    staffAttendance: { view: false, create: false, edit: false, delete: false },
    certificates: { view: false, create: false, edit: false, delete: false },
    curriculum: { view: false, create: false, edit: false, delete: false },
    finance: { view: false, create: false, edit: false, delete: false },
    tasks: { view: true, create: true, edit: true, delete: false },
    kpi: { view: false, create: false, edit: false, delete: false },
    whatsapp: { view: false, create: false, edit: false, delete: false },
    branches: { view: true, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    permissions: { view: false, create: false, edit: false, delete: false },
    inventory: { view: true, create: true, edit: true, delete: true },
    marketing: { view: false, create: false, edit: false, delete: false },
  },
  telimci: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    students: { view: true, create: false, edit: false, delete: false },
    contracts: { view: false, create: false, edit: false, delete: false },
    groups: { view: true, create: false, edit: true, delete: false },
    leads: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: true, edit: true, delete: false },
    staffAttendance: { view: true, create: true, edit: false, delete: false },
    certificates: { view: true, create: true, edit: false, delete: false },
    curriculum: { view: true, create: true, edit: true, delete: false },
    finance: { view: false, create: false, edit: false, delete: false },
    tasks: { view: true, create: false, edit: true, delete: false },
    kpi: { view: true, create: false, edit: false, delete: false },
    whatsapp: { view: false, create: false, edit: false, delete: false },
    branches: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    permissions: { view: false, create: false, edit: false, delete: false },
    inventory: { view: false, create: false, edit: false, delete: false },
    marketing: { view: true, create: false, edit: false, delete: false },
  },
  sagird: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    students: { view: false, create: false, edit: false, delete: false },
    contracts: { view: true, create: false, edit: false, delete: false },
    groups: { view: true, create: false, edit: false, delete: false },
    leads: { view: false, create: false, edit: false, delete: false },
    attendance: { view: true, create: false, edit: false, delete: false },
    staffAttendance: { view: false, create: false, edit: false, delete: false },
    certificates: { view: true, create: false, edit: false, delete: false },
    curriculum: { view: true, create: false, edit: false, delete: false },
    finance: { view: true, create: false, edit: false, delete: false },
    tasks: { view: false, create: false, edit: false, delete: false },
    kpi: { view: false, create: false, edit: false, delete: false },
    whatsapp: { view: false, create: false, edit: false, delete: false },
    branches: { view: false, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    permissions: { view: false, create: false, edit: false, delete: false },
    inventory: { view: false, create: false, edit: false, delete: false },
    marketing: { view: false, create: false, edit: false, delete: false },
  },
};

export const ROLE_DETAILS: Record<Role, {
  label: string;
  badge: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  description: string;
}> = {
  direktor: {
    label: 'Direktor (Superadmin)',
    badge: 'SUPERADMIN',
    colorClass: 'from-indigo-600 to-indigo-700 text-white',
    bgLightClass: 'bg-indigo-50 text-indigo-700',
    borderClass: 'border-indigo-200',
    textClass: 'text-indigo-700',
    description: 'Sistem rəhbəri. Bütün filiallar, maliyyə, ştat və səlahiyyətlər üzrə tam mütləq idarəetmə hüququ.',
  },
  texnobaba_meneceri: {
    label: 'Texnobaba meneceri',
    badge: 'TEXNOBABA',
    colorClass: 'from-amber-600 to-amber-700 text-white',
    bgLightClass: 'bg-amber-50 text-amber-700',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
    description: 'İnventar, mərkəzi anbar, məhsul sifarişləri, avadanlıq tələbləri və texniki müraciətlər üzrə baş idarəçi.',
  },
  menecer: {
    label: 'Menecer',
    badge: 'MENECER',
    colorClass: 'from-blue-600 to-blue-700 text-white',
    bgLightClass: 'bg-blue-50 text-blue-700',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-700',
    description: 'Filial idarəçisi. Tələbə qeydiyyatı, müqavilələr, satış qıfı və təlimçi heyətinin koordinasiyası.',
  },
  telimci: {
    label: 'Təlimçi / Müəllim',
    badge: 'MÜƏLLİM',
    colorClass: 'from-amber-600 to-amber-700 text-white',
    bgLightClass: 'bg-amber-50 text-amber-700',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
    description: 'Tədris heyəti. Tələbə davamiyyəti jurnalı, kurikulum mövzuları və dərslərin aparılması.',
  },
  sagird: {
    label: 'Şagird / Tələbə',
    badge: 'TƏLƏBƏ',
    colorClass: 'from-emerald-600 to-emerald-700 text-white',
    bgLightClass: 'bg-emerald-50 text-emerald-700',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-700',
    description: 'Öyrənən şəxs. Şəxsi tədris cədvəli, dərslər, ev tapşırıqları və qazanılan sertifikatlar.',
  },
};

export const sanitizePermissions = (input: unknown): RolePermissionsConfig => {
  const result: RolePermissionsConfig = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  if (!input || typeof input !== 'object') return result;

  const roles: Role[] = ['direktor', 'menecer', 'telimci', 'sagird'];
  const modules: SystemModuleId[] = SYSTEM_MODULES.map(m => m.id);

  const typedInput = input as Record<string, Record<string, Partial<ModulePermissionRule>>>;

  for (const role of roles) {
    if (typedInput[role] && typeof typedInput[role] === 'object') {
      for (const mod of modules) {
        if (typedInput[role][mod] && typeof typedInput[role][mod] === 'object') {
          result[role][mod] = {
            view: !!typedInput[role][mod].view,
            create: !!typedInput[role][mod].create,
            edit: !!typedInput[role][mod].edit,
            delete: !!typedInput[role][mod].delete,
          };
        }
      }
    }
  }

  // Safety guard: Direktor MUST ALWAYS have full permissions for 'permissions' module
  result.direktor.permissions = {
    view: true,
    create: true,
    edit: true,
    delete: true,
  };

  return result;
};
