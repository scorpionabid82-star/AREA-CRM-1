import { Curriculum } from '../types/crm';

const ALL_BRANCH_NAMES = [
  'Nərimanov',
  'Gənclik',
  'Əhmədli',
  'Bakıxanov',
  'Xırdalan',
  'Sumqayıt',
  'Gəncə',
  'Şəki',
  'Zaqatala'
];

export const INITIAL_CURRICULUMS: Curriculum[] = [
  {
    id: 'curr-robomonte',
    courseName: 'RoboMonte & RoboMonte Coding',
    category: 'Robototexnika & STEM',
    subTracks: ['RoboMonte Əsasları', 'RoboMonte Coding (Blok & Mətn Kodlaşdırma)'],
    isCompetitionPrep: false,
    targetAge: '6-10 yaş',
    level: 'Başlanğıc',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 75,
    equipmentNeeded: 'RoboMonte Robotik Təlim Dəsti, Sensorlar, Planşet / PC',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Kiçik yaşlı mühəndislər üçün robot quruculuğu, mexaniki bəndlər və RoboMonte Coding mühitində əyləncəli alqoritmik proqramlaşdırma.',
    modules: [
      {
        id: 'mod-rm-1',
        order: 1,
        title: 'Modul 1: RoboMonte ilə Tanışlıq və Sadə Mexanizmlər',
        description: 'Robot komponentləri, təkərlər, oxlar və ilk hərəkətli avtomobil konstruksiyası.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-rm-1', title: 'Robot nədir? RoboMonte blokları və birləşmə qaydaları', durationHours: 2, description: 'Təhlükəsizlik qaydaları və əsas konstruktiv detallar.', homework: 'Evdə sadə ling modeli dizayn etmək' },
          { id: 'les-rm-2', title: 'Motorlar və fırlanma hərəkətinin ötürülməsi', durationHours: 2, description: 'DC motorun iş prinsipi və sürət tənzimlənməsi.', homework: 'Dişli təkərlərin sürətə təsirini test etmək' },
          { id: 'les-rm-3', title: 'İlk Hərəkətli Maşın: İki mühərrikli platforma', durationHours: 2, description: 'Şassi yığılması və balansın qorunması.', homework: 'Dönmə radiusunu ölçmək' },
          { id: 'les-rm-4', title: 'Layihə 1: Təmizləyici Robot prototipi', durationHours: 2, description: 'Kollektiv mexaniki tapşırıq və sınaq yarışı.' }
        ]
      },
      {
        id: 'mod-rm-2',
        order: 2,
        title: 'Modul 2: RoboMonte Coding və Sensor İdarəetməsi',
        description: 'Blok əsaslı kodlaşdırma, dövrlər, işıq və ultrasəs məsafə sensorları.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-rm-5', title: 'RoboMonte Coding interfeysi və blok əmrləri', durationHours: 2, description: 'İrəli, geri, dönmə və gözləmə əmrlərinin yazılması.' },
          { id: 'les-rm-6', title: 'Ultrasəs Sensoru: Maneələrdən qaçan robot', durationHours: 2, description: 'Məsafənin təyini və "əgər-əks halda" şərt bloku.', homework: 'Labirintdən çıxış alqoritmi qurmaq' },
          { id: 'les-rm-7', title: 'İşıq və Rəng Sensoru: Xətt izləməyə giriş', durationHours: 2, description: 'Qara və ağ kontrastının oxunması və trayektoriya.' },
          { id: 'les-rm-8', title: 'Layihə 2: Ağıllı Kuryer Robotu təqdimatı', durationHours: 2, description: 'Otaq daxilində yük daşıyan avtonom robot.' }
        ]
      },
      {
        id: 'mod-rm-3',
        order: 3,
        title: 'Modul 3: Funksional Robotlar və Mexatronika',
        description: 'Qaldırıcı kranlar, mexaniki qol (gripper) və ağıllı qapı sistemləri.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-rm-9', title: 'Mexaniki qol (Gripper) mexanizmi və servo motor', durationHours: 2, description: 'Obyektləri tutma və yer dəyişdirmə mexanikası.' },
          { id: 'les-rm-10', title: 'Ağıllı Şlaqbaum və Avtomobil Dayanacağı', durationHours: 2, description: 'Hərəkət sensoru ilə inteqrasiya olunmuş qapı.' },
          { id: 'les-rm-11', title: 'Dövrələr və ardıcıl məntiqi əmrlər zənciri', durationHours: 2, description: 'Kodun optimizasiyası və təkrar blokları.' },
          { id: 'les-rm-12', title: 'Layihə 3: Ağıllı Şəhər (Smart City) maketi', durationHours: 2, description: 'Qrup layihəsi: Şəhər infrastrukturu simulyasiyası.' }
        ]
      },
      {
        id: 'mod-rm-4',
        order: 4,
        title: 'Modul 4: İrəli Səviyyə RoboMonte Coding və Final Sınağı',
        description: 'Mürəkkəb tapşırıqlar, vaxt yarışları və diplom sertifikatı imtahanı.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-rm-13', title: 'Çoxfunksiyalı təlimat blokları və dəyişənlər', durationHours: 2, description: 'Hesablayıcı və xal toplayıcı robot funksiyası.' },
          { id: 'les-rm-14', title: 'Qaranlıqda işıqlanan avtomatik mayak layihəsi', durationHours: 2, description: 'RGB LED və fotosensor sinerjisi.' },
          { id: 'les-rm-15', title: 'Taktiki Maneə Zolağında Robot Rallisi', durationHours: 2, description: 'Vaxta qarşı avtonom sürüş yarışması.' },
          { id: 'les-rm-16', title: 'Buraxılış İşi Müdafiəsi və Nailiyyət Sertifikatı', durationHours: 2, description: 'Valideynlər və müəllimlər qarşısında canlı nümayiş.' }
        ]
      }
    ]
  },
  {
    id: 'curr-genesis',
    courseName: 'Genesis (Japanese Engineering)',
    category: 'Mühəndislik & Mexanika',
    subTracks: ['Yapon Mexanika Standartları', 'Dişli Çarxlar və Transmissiya', 'Kinematik Heykəllər və Maşınlar'],
    isCompetitionPrep: false,
    targetAge: '7-12 yaş',
    level: 'Orta',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 80,
    equipmentNeeded: 'Genesis Orijinal Yapon Mühəndislik Dəsti, Ölçü alətləri',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Yaponiyanın qabaqcıl mühəndislik fəlsəfəsinə əsaslanan tətbiqi mexanika kursu. Şagirdlər dişli çarxlar, sarkaçlar, differensiallar və mürəkkəb ötürücülər qururlar.',
    modules: [
      {
        id: 'mod-gen-1',
        order: 1,
        title: 'Modul 1: Yapon Mühəndislik Fəlsəfəsi və Transmissiya Əsasları',
        description: 'Tork, fırlanma anı, qüvvə balansı və dişli çarx nisbətləri (Gear Ratio).',
        durationWeeks: 4,
        lessons: [
          { id: 'les-gen-1', title: 'Genesis Mühəndislik Standartları və Dəqiqlik', durationHours: 2, description: 'Dəqiqlik anlayışı, sürtünmə və podşipniklər.' },
          { id: 'les-gen-2', title: 'Düz və Konusvari Dişli Çarxlar: İstiqamət dəyişmə', durationHours: 2, description: '90 dərəcəlik fırlanma bucağı ötürücüləri.' },
          { id: 'les-gen-3', title: 'Sonsuz vint (Worm Gear) və Yüksək Tork Mexanizmi', durationHours: 2, description: 'Özünü kilidləyən mexanizmlərin sirri.' },
          { id: 'les-gen-4', title: 'Layihə 1: Ağır Yük Qaldıran Super-Vinç', durationHours: 2, description: 'Maksimum çəki qaldırma sınağı və tork testi.' }
        ]
      },
      {
        id: 'mod-gen-2',
        order: 2,
        title: 'Modul 2: Kinematika və Mürəkkəb Bağlantılar (Linkages)',
        description: 'Düzxətli hərəkəti fırlanmaya çevirən Yapon kranları və mexaniki gəzintilər.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-gen-5', title: 'Klann və Jansen Mexanizmləri: Dörd ayaqlı yeriyən', durationHours: 2, description: 'Bionik yerimə kinematikası.' },
          { id: 'les-gen-6', title: 'Krank-Şatun və Piston Simulyasiyası', durationHours: 2, description: 'Mühərrik silindrlərinin mexaniki modeli.' },
          { id: 'les-gen-7', title: 'Differensial Mexanizmi: Dönmə zamanı təkər sürətləri', durationHours: 2, description: 'Avtomobil differensialının açılışı və rolu.' },
          { id: 'les-gen-8', title: 'Layihə 2: 4WD Dağ Keçisi Avtomobili', durationHours: 2, description: 'Maneəli pilləkənləri dırmaşma testi.' }
        ]
      },
      {
        id: 'mod-gen-3',
        order: 3,
        title: 'Modul 3: Saat Mexanizmləri, Rəqqaslar və Enerji Yığımı',
        description: 'Potensial enerji, yay mexanizmləri və saniyəölçən dişli sistemləri.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-gen-9', title: 'Mexaniki Saatın Anatomiyası: Əqrəblər və lövbər', durationHours: 2, description: 'Dəqiq zaman ölçmə prinsipi.' },
          { id: 'les-gen-10', title: 'İnersiya və Volan (Flywheel) ilə Hərəkət Saxlama', durationHours: 2, description: 'Kinetik enerjinin toplanması.' },
          { id: 'les-gen-11', title: 'Rube Goldberg tipli zəncirvari reaksiya maşını', durationHours: 2, description: '10 pilləli fiziki reaksiya konstruksiyası.' },
          { id: 'les-gen-12', title: 'Layihə 3: Mühəndislik Şedevri Yarışı', durationHours: 2, description: 'Ən səmərəli enerji istifadəsi yarışması.' }
        ]
      }
    ]
  },
  {
    id: 'curr-boxbot',
    courseName: 'BOXBOT (Robot Döyüşü və Yarış Hazırlığı)',
    category: 'Yarış Hazırlığı',
    subTracks: ['Döyüş Robotu Konstruksiyası', 'Zərbə & Qorunma Mexanizmləri', 'Ring Taktikası və Radio İdarəetmə'],
    isCompetitionPrep: true,
    targetAge: '9-16 yaş',
    level: 'Yarış Səviyyəsi',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 85,
    equipmentNeeded: 'BOXBOT Çempionat Arenası, Döyüş Robotu Şassiləri, Radio Pultlar',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Respublika və beynəlxalq BOXBOT robot döyüşləri çempionatına hazırlıq. Şagirdlər metal/karbon zirehli, dönən silahlı və taran tipli robotlar hazırlayırlar.',
    modules: [
      {
        id: 'mod-bb-1',
        order: 1,
        title: 'Modul 1: BOXBOT Standartları, Qaydalar və Şassi Mühəndisliyi',
        description: 'Çəki kateqoriyaları, ölçü limitləri, zireh materialları və ağırlıq mərkəzi.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-bb-1', title: 'BOXBOT Döyüş Qaydaları və Təhlükəsizlik Reqlamenti', durationHours: 2, description: 'Arena qaydaları, xalların hesablanması və nokaut şərtləri.' },
          { id: 'les-bb-2', title: 'Aşağı Ağırlıq Mərkəzi və Çevrilməyən Şassi', durationHours: 2, description: 'Tərsinə çevrildikdə belə hərəkət edən robot dizaynı.' },
          { id: 'les-bb-3', title: 'Yüksək Dövriyyəli Motorlar və Rezin Təkərlər', durationHours: 2, description: 'Arenada maksimum yapışma və ani start taktikası.' },
          { id: 'les-bb-4', title: 'Layihə 1: Taran Robotu və Qüvvət İtişməsi Sınağı', durationHours: 2, description: 'Ring daxilində sumo və təkan yarışı.' }
        ]
      },
      {
        id: 'mod-bb-2',
        order: 2,
        title: 'Modul 2: Aktiv Silah Mexanizmləri (Spinner, Lifter, Flipper)',
        description: 'Fırlanan zərbə diskləri, pnevmatik və servo qaldırıcı linglər.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-bb-5', title: 'Şaquli və Üfüqi Spinner (Fırlanan Silah) Mühəndisliyi', durationHours: 2, description: 'Kinetik zərbə enerjisinin hesablanması.' },
          { id: 'les-bb-6', title: 'Qaldırıcı və Tullayıcı (Flipper) Mexanizmi', durationHours: 2, description: 'Rəqibi ringdən kənara atma taktikası.' },
          { id: 'les-bb-7', title: 'Zərbə Emicilər və Elektronikanın Mühafizəsi', durationHours: 2, description: 'Batareya və qəbuledicinin titrəmədən qorunması.' },
          { id: 'les-bb-8', title: 'Arenada Test Döyüşləri və Dağıntı Analizi', durationHours: 2, description: 'Zəif nöqtələrin tapılması və zirehin gücləndirilməsi.' }
        ]
      },
      {
        id: 'mod-bb-3',
        order: 3,
        title: 'Modul 3: Pult İdarəetməsi, Pilotaj və Çempionat Strategiyası',
        description: '2.4GHz radio rabitə, reaksiyanın sürətləndirilməsi və turnir simulyasiyası.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-bb-9', title: 'Döyüş Pilotajı: Künc sıxışdırması və rəqibin zəif cinahı', durationHours: 2, description: 'Taktiki idarəetmə və fəndlər.' },
          { id: 'les-bb-10', title: 'Pitinq Təmiri: 3 dəqiqə ərzində sürətli təmir sınağı', durationHours: 2, description: 'Raundlar arası motor və dişli dəyişdirilməsi.' },
          { id: 'les-bb-11', title: 'BOXBOT Çempionatı Qrup Mərhələsi Simulyasiyası', durationHours: 2, description: 'Hakimlər qarşısında rəsmi reytinq döyüşləri.' },
          { id: 'les-bb-12', title: 'Böyük Final və Kubok Mükafatlandırması', durationHours: 2, description: 'Filiallararası çempionat və sertifikatlaşdırma.' }
        ]
      }
    ]
  },
  {
    id: 'curr-scratch',
    courseName: 'Scratch Proqramlaşdırma və Oyun Dizaynı',
    category: 'Proqramlaşdırma',
    subTracks: ['Blok Alqoritmləri', '2D Oyun Mexanikası', 'Fizika Simulyasiyası və Xallar'],
    isCompetitionPrep: false,
    targetAge: '7-11 yaş',
    level: 'Başlanğıc',
    totalDurationMonths: 3,
    totalHours: 36,
    passingGrade: 75,
    equipmentNeeded: 'Kompüter / Planşet, Scratch 3.0',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'MIT laboratoriyasının uşaqlar üçün yaratdığı vizual blok proqramlaşdırma platforması. Məntiqi düşüncə, animasiya, musiqi və mini-oyunların kodlaşdırılması.',
    modules: [
      {
        id: 'mod-sc-1',
        order: 1,
        title: 'Modul 1: Scratch Alətləri, Sprytlar və İlk Animasiya',
        description: 'Koordinat sistemi (X, Y), geyimlər (costumes), səslər və hadisələr.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-sc-1', title: 'Scratch interfeysi və Sprytın canlandırılması', durationHours: 2, description: 'Görünüş blokları və addım əmrləri.' },
          { id: 'les-sc-2', title: 'X və Y koordinat oxları üzrə naviqasiya', durationHours: 2, description: 'Kursor və klaviatura ilə spryt idarəsi.' },
          { id: 'les-sc-3', title: 'Dövrələr: "Həmişə" və "10 dəfə təkrarla" blokları', durationHours: 2, description: 'Sonsuz fon hərəkəti və qaçış animasiyası.' },
          { id: 'les-sc-4', title: 'Layihə 1: İnteraktiv Şəxsi Nağıl / Cizgi Filmi', durationHours: 2, description: 'Danışan və hərəkət edən qəhrəmanlar.' }
        ]
      },
      {
        id: 'mod-sc-2',
        order: 2,
        title: 'Modul 2: Şərtlər, Sensorlar və Klassik Oyunlar',
        description: 'Şərt operatorları (Əgər-Onda), rəngə toxunma, klonlama və xal sayğacı.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-sc-5', title: 'Labirint Oyunu: Divarlara toxunduqda uduzmaq', durationHours: 2, description: 'Sensor blokları və cəza sistemi.' },
          { id: 'les-sc-6', title: 'Dəyişənlər (Variables): Xal, Can və Taymer', durationHours: 2, description: 'Xal toplama və vaxt bitdikdə Game Over.' },
          { id: 'les-sc-7', title: 'Klonlama (Clones): Göydən yağan almalar və ulduzlar', durationHours: 2, description: 'Eyni obyektdən yüzlərlə kopyanın idarəsi.' },
          { id: 'les-sc-8', title: 'Layihə 2: Flappy Bird və ya Dino Runner klonu', durationHours: 2, description: 'Qravitasiya və tullanma fizikasının kodu.' }
        ]
      },
      {
        id: 'mod-sc-3',
        order: 3,
        title: 'Modul 3: Çoxsəviyyəli Oyunlar və Buraxılış Şousu',
        description: 'Boss döyüşləri, musiqi effektləri və proyektin paylaşılması.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-sc-9', title: 'Səviyyələr (Levels) və Qələbə ekranları', durationHours: 2, description: 'Fərqli fonların dəyişməsi və çətinliyin artması.' },
          { id: 'les-sc-10', title: 'Süni İntellekt rəqib: Sprytı təqib edən düşmən', durationHours: 2, description: 'Sadə təqib alqoritmi.' },
          { id: 'les-sc-11', title: 'Səs və musiqi sinxronizasiyası', durationHours: 2, description: 'Oyun atmosferi və səs effektləri.' },
          { id: 'les-sc-12', title: 'Layihə 3: Final Oyun Təqdimatı və Scratch Sertifikatı', durationHours: 2, description: 'Bütün sinif yoldaşlarının oyunlarını oynaması.' }
        ]
      }
    ]
  },
  {
    id: 'curr-drone-pilot',
    courseName: 'I am Pilot (Dron İdarəetməsi və Aeronavtika)',
    category: 'Dron & Aeronavtika',
    subTracks: ['Uçuş Qaydaları və Təhlükəsizlik', 'FPV və Vizual Pilotaj', 'Aerodinamika və Manevr'],
    isCompetitionPrep: false,
    targetAge: '10-16 yaş',
    level: 'Orta',
    totalDurationMonths: 3,
    totalHours: 36,
    passingGrade: 80,
    equipmentNeeded: 'Təlim dronları, Qoruyucu şəbəkə, Maneə halqaları, Radio pultlar',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Kvadrokopterlərin aerodinamikası, pərlərin fırlanma mexanikası, radio pultla vizual və FPV pilotaj. Şagirdlər havada sabit saxlama, 8 fiquru və təmiz eniş vərdişləri qazanırlar.',
    modules: [
      {
        id: 'mod-dp-1',
        order: 1,
        title: 'Modul 1: Dron Anatomiyası və Uçuş Təhlükəsizliyi',
        description: '4 mühərrikin qüvvə balansı, akkumulyator (LiPo) təhlükəsizliyi və pult kalibrasiyası.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-dp-1', title: 'Dron necə uçur? Bernulli prinsipi və itələmə qüvvəsi', durationHours: 2, description: 'Pərlərin fırlanma istiqaməti (CW və CCW).' },
          { id: 'les-dp-2', title: 'Pultun Stick-ləri: Throttle, Yaw, Pitch və Roll', durationHours: 2, description: '4 əsas uçuş oxu və əl koordinasiyası.' },
          { id: 'les-dp-3', title: 'Hovering: Havada 1 metr yüksəklikdə sabit qalma', durationHours: 2, description: 'Dronun sürüşməsinin qarşısını almaq.' },
          { id: 'les-dp-4', title: 'Layihə 1: Təhlükəsiz Meydança Enişi Sınağı', durationHours: 2, description: 'Nişangaha dəqiq toxunuş imtahanı.' }
        ]
      },
      {
        id: 'mod-dp-2',
        order: 2,
        title: 'Modul 2: Mürəkkəb Fiqurlar və Manevr Pilotajı',
        description: 'Kvadrat, dairə, "8" fiquru və arxası ilə uçuş texnikası.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-dp-5', title: 'Kvadrat və Dairəvi Uçuş Trayektoriyası', durationHours: 2, description: 'Dönüş bucaqlarının sabitlənməsi.' },
          { id: 'les-dp-6', title: 'Nose-In Pilotajı: Dron sənə baxanda idarəetmə', durationHours: 2, description: 'İstiqamətin tərsinə çevrilməsi psixologiyası.' },
          { id: 'les-dp-7', title: '"8" Fiquru: Çətin manevrlər zənciri', durationHours: 2, description: 'Sürət və hündürlüyün eyni vaxtda idarəsi.' },
          { id: 'les-dp-8', title: 'Layihə 2: Qapalı Zalda Dron Slalomu', durationHours: 2, description: 'Dirəklər arasından ilanvari keçid vaxt yarışı.' }
        ]
      },
      {
        id: 'mod-dp-3',
        order: 3,
        title: 'Modul 3: Halqalardan Keçid və Pilot Sertifikatı',
        description: 'İşıqlandırılmış halqalar, FPV kamera eynəkləri və xilasedici missiya.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-dp-9', title: 'Hava Halqaları: Yüksəklik və bucaq dəqiqliyi', durationHours: 2, description: 'Halqanın mərkəzindən sürətlə keçmək.' },
          { id: 'les-dp-10', title: 'Külək və maneə simulyasiyası', durationHours: 2, description: 'Qəfil hava axınına qarşı balans.' },
          { id: 'les-dp-11', title: 'Xilasedici Dron Missiyası: Yük daşıma və buraxma', durationHours: 2, description: 'Humanitar yardım qutusunun hədəfə çatdırılması.' },
          { id: 'les-dp-12', title: 'I am Pilot Rəsmi İmtahanı və Pilot Vəsiqəsi', durationHours: 2, description: 'Dron Akademiyası lisenziyalaşdırma testi.' }
        ]
      }
    ]
  },
  {
    id: 'curr-drone-soccer',
    courseName: 'Drone Soccer (Dron Futbolu və Çempionat Hazırlığı)',
    category: 'Yarış Hazırlığı',
    subTracks: ['Kürəvi Qoruyucu Karkas Mühəndisliyi', 'Striker (Hücumçu) və Qapıçı Taktikaları', 'FIMPA Dünya Reqlamenti'],
    isCompetitionPrep: true,
    targetAge: '10-18 yaş',
    level: 'Yarış Səviyyəsi',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 85,
    equipmentNeeded: 'FIMPA Standartlı Dron Soccer Topları, Dron Arenası, Qol Halqaları',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Dünya miqyasında sürətlə yayılan rəsmi hava idmanı. Qoruyucu kürə daxilindəki dronlarla rəqib komandanın asılı qapı halqasına qol vurmaq və çempionat hazırlığı.',
    modules: [
      {
        id: 'mod-ds-1',
        order: 1,
        title: 'Modul 1: Drone Soccer Qaydaları və Kürəvi Mexanika',
        description: 'FIMPA reqlamenti, 3v3 və ya 5v5 komanda rolu: Striker (Hücumçu), Keeper (Qapıçı), Defender (Müdafiəçi).',
        durationWeeks: 4,
        lessons: [
          { id: 'les-ds-1', title: 'Drone Soccer Nədir? Rəsmi Oyun Qaydaları', durationHours: 2, description: '3 dəqiqəlik setlər, xal sistemi və qol meyarları.' },
          { id: 'les-ds-2', title: 'Kürəvi Karbon/Plastik Qəfəs Konstruksiyası', durationHours: 2, description: 'Zərbəyə davamlı karkas montajı və balans.' },
          { id: 'les-ds-3', title: 'Havada Toqquşma Dinamikası: Rəqibi bloklamaq', durationHours: 2, description: 'Kürələrin toqquşması zamanı sabitliyi qorumaq.' },
          { id: 'les-ds-4', title: 'Layihə 1: Təkbaşına Qol Vurma Dəqiqlik Testi', durationHours: 2, description: 'Fərqli bucaqlardan halqaya daxil olma.' }
        ]
      },
      {
        id: 'mod-ds-2',
        order: 2,
        title: 'Modul 2: Komanda Taktikası və Mövqe İdarəetməsi',
        description: 'Hücumçunu qorumaq, qapı önündə hava qalxanı qurmaq və əks-hücumlar.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-ds-5', title: 'Striker Strategiyası: Sürətli manevrlə qola keçid', durationHours: 2, description: 'Hücumçunun yeganə qol vuran pilotsuz aparat olması.' },
          { id: 'les-ds-6', title: 'Qapıçı Taktikası: Halqanın daxilində asılı qalma', durationHours: 2, description: 'Halqanı bədənlə bağlamaq və zərbəni dəf etmək.' },
          { id: 'les-ds-7', title: 'Müdafiəçilərin Bloku: Rəqib hücumçunu zərərsizləşdirmək', durationHours: 2, description: 'Komanda rabitəsi və səsli siqnallar.' },
          { id: 'les-ds-8', title: 'Matç Simulyasiyası: 3 dəqiqəlik gərgin qarşılaşma', durationHours: 2, description: 'Batareya dəyişmə və taym-aut qaydaları.' }
        ]
      },
      {
        id: 'mod-ds-3',
        order: 3,
        title: 'Modul 3: Turnir Mərhələsi və Çempionat Liqası',
        description: 'Filiallararası yarışlar, beynəlxalq dərəcəli hakimlik və kubok.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-ds-9', title: 'Sürətli Pitinq və Pər Dəyişdirilməsi Təlimi', durationHours: 2, description: '1 dəqiqəlik fasilədə drona texniki qulluq.' },
          { id: 'les-ds-10', title: 'Penalti və Standart Vəziyyətlərdən İstifadə', durationHours: 2, description: 'Cərimə zərbələri zamanı hücum sxemləri.' },
          { id: 'les-ds-11', title: 'Böyük AREA Drone Soccer Çempionatı', durationHours: 2, description: '9 filialın komandalarının canlı yarışı.' },
          { id: 'les-ds-12', title: 'Kubok Təqdimatı və Milli Komanda Seçimləri', durationHours: 2, description: 'Beynəlxalq turnirlərə namizədlərin elanı.' }
        ]
      }
    ]
  },
  {
    id: 'curr-py-maker',
    courseName: 'Py Maker (MicroPython & DIY Cihazlar)',
    category: 'Elektronika & Meykerlik',
    subTracks: ['MicroPython Əsasları', 'Raspberry Pi Pico / ESP32', 'Sensorlar və IoT Ağıllı Ev'],
    isCompetitionPrep: false,
    targetAge: '11-16 yaş',
    level: 'Orta',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 80,
    equipmentNeeded: 'Raspberry Pi Pico, ESP32, Breadboard, OLED ekran, Relay, Sensorlar',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Python proqramlaşdırma dilinin fiziki mühəndislikdə tətbiqi. MicroPython vasitəsilə mikrokontrollerlər, ağıllı ev cihazları, meteoroloji stansiyalar və robot beyinləri yaradılır.',
    modules: [
      {
        id: 'mod-pm-1',
        order: 1,
        title: 'Modul 1: MicroPython və Raspberry Pi Pico Dünyası',
        description: 'Thonny IDE, GPIO pinləri, rəqəmsal çıxışlar və LED animasiyaları.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-pm-1', title: 'MicroPython nədir? Pico lövhəsinin pin xəritəsi', durationHours: 2, description: 'Proqramın mikrokontrollerə yüklənməsi.' },
          { id: 'les-pm-2', title: 'GPIO Pin İdarəsi: İşıqfor və yanıb-sönən LED-lər', durationHours: 2, description: 'time.sleep() və dövrlər.' },
          { id: 'les-pm-3', title: 'Düymələr və Rəqəmsal Girişlər (Pull-Up / Pull-Down)', durationHours: 2, description: 'İstifadəçi toxunuşunun qeydə alınması.' },
          { id: 'les-pm-4', title: 'Layihə 1: Reaksiyanı Ölçən Morze və Oyun Konsolu', durationHours: 2, description: 'İki oyunçulu sürətli düymə oyunu.' }
        ]
      },
      {
        id: 'mod-pm-2',
        order: 2,
        title: 'Modul 2: Analoq Siqnallar, Sensorlar və Ekranlar',
        description: 'ADC (Analoq-Rəqəm çevirici), temperatur, işıq sensoru və I2C OLED ekran.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-pm-5', title: 'Potensiometr və PWM ilə İşıq Parlaqlığının Tənzimlənməsi', durationHours: 2, description: 'Dəyişən analoq siqnallar.' },
          { id: 'les-pm-6', title: 'DHT11 Temperatur və Rütubət Sensorunun Oxunması', durationHours: 2, description: 'Real mühit göstəricilərinin emalı.' },
          { id: 'les-pm-7', title: 'I2C Protokolu və 0.96 OLED Ekrana Qrafik Çıxarma', durationHours: 2, description: 'Mətn, ikon və dinamik qrafiklər.' },
          { id: 'les-pm-8', title: 'Layihə 2: Masaüstü Ağıllı Hava Stansiyası', durationHours: 2, description: 'OLED ekranda saat və otaq iqlimi göstəriciləri.' }
        ]
      },
      {
        id: 'mod-pm-3',
        order: 3,
        title: 'Modul 3: Wi-Fi, Bluetooth və IoT İnternet İdarəetməsi',
        description: 'ESP32 ilə veb-server qurmaq, Telegram botu ilə otaq işıqlarını yandırmaq.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-pm-9', title: 'ESP32 Wi-Fi şəbəkəsinə qoşulma və HTTP sorğuları', durationHours: 2, description: 'İnternetə bağlanan cihazlar.' },
          { id: 'les-pm-10', title: 'Veb-Server qurulması: Telefonda saytla lampanı yandırmaq', durationHours: 2, description: 'Relay modulu və yüksək gərginlik təhlükəsizliyi.' },
          { id: 'les-pm-11', title: 'Telegram Botu ilə Cihaz Əlaqəsi: Bildiriş göndərən qapı', durationHours: 2, description: 'Təhlükəsizlik xəbərdarlıq sistemi.' },
          { id: 'les-pm-12', title: 'Layihə 3: Tam Ağıllı Ev (Smart Home) Sistemi Müdafiəsi', durationHours: 2, description: 'Sərbəst IoT layihəsi təqdimatı.' }
        ]
      }
    ]
  },
  {
    id: 'curr-python-ai',
    courseName: 'Python AI & Beynəlxalq Yarış Hazırlığı',
    category: 'Süni İntellekt & Data',
    subTracks: ['AI Champion (Respublika və Dünya Çempionatı)', 'AI CHINA (Beynəlxalq Olimpiada)', 'Kompüter Görməsi (OpenCV)', 'Neyron Şəbəkələr'],
    isCompetitionPrep: true,
    targetAge: '12-18 yaş',
    level: 'Yarış Səviyyəsi',
    totalDurationMonths: 6,
    totalHours: 72,
    passingGrade: 85,
    equipmentNeeded: 'AI Laboratoriya Kompüteri, Veb-kamera, Python 3.12, OpenCV, MediaPipe',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Qabaqcıl Süni İntellekt mühəndisliyi və beynəlxalq olimpiadalara hazırlıq. Şagirdlər üz və əl tanıma, jestlərlə idarə olunan sistemlər və avtonom AI modelləri hazırlayırlar.',
    modules: [
      {
        id: 'mod-pai-1',
        order: 1,
        title: 'Modul 1: Python ilə Data və Kompüter Görməsinə (OpenCV) Giriş',
        description: 'Şəkillərin pikselləri, rəng fəzaları (RGB, BGR, HSV), filtrlər və kənarların aşkarlanması.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-pai-1', title: 'Kompüter şəkli necə görür? Matrislər və NumPy əsasları', durationHours: 2, description: 'Piksel koordinatları və rəng kanalları.' },
          { id: 'les-pai-2', title: 'OpenCV ilə Canlı Kamera Yayımı və Kadrarxası emal', durationHours: 2, description: 'Video oxuma və filtr tətbiqi.' },
          { id: 'les-pai-3', title: 'Rəngə Görə Obyekt İzləmə (Color Masking)', durationHours: 2, description: 'Mavi və ya qırmızı topun ekranda koordinatını tapmaq.' },
          { id: 'les-pai-4', title: 'Konturlar və Həndəsi Fiqurların Təyini', durationHours: 2, description: 'Dairə, kvadrat və üçbucağı avtomatik tanıyan kod.' },
          { id: 'les-pai-5', title: 'Layihə 1: Virtual Rəssam (Barmaqla havada rəsm çəkmək)', durationHours: 2, description: 'Kamera önündə rəngli qələmsiz rəsm.' }
        ]
      },
      {
        id: 'mod-pai-2',
        order: 2,
        title: 'Modul 2: MediaPipe ilə İnsan Skeleti, Əl və Üz Tanıma',
        description: '21 əl nöqtəsinin izlənməsi, jestlərin analizi, göz qırpma və mimika təyini.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-pai-6', title: 'Google MediaPipe Hands arxitekturası və 21 nöqtə', durationHours: 2, description: 'Barmaqların bükülmə bucaqlarının hesablanması.' },
          { id: 'les-pai-7', title: 'Virtual Səs və Parlaqlıq İdarəsi (Jestlərlə kompüter pultu)', durationHours: 2, description: 'Baş və şəhadət barmağı məsafəsi ilə səsi qaldırmaq.' },
          { id: 'les-pai-8', title: 'FaceMesh: 468 üz nöqtəsi ilə sürücü yuxulama detektoru', durationHours: 2, description: 'Göz qapaqlarının bağlanması siqnalı.' },
          { id: 'les-pai-9', title: 'Duruş (Pose Estimation) ilə İdman Təlimçisi AI', durationHours: 2, description: 'Qaçış və jim hərəkətlərinin düzgün sayılması.' },
          { id: 'les-pai-10', title: 'Layihə 2: Jestlərlə İdarə Olunan Dron və ya BOXBOT', durationHours: 2, description: 'Əl hərəkəti ilə robota əmr ötürülməsi.' }
        ]
      },
      {
        id: 'mod-pai-3',
        order: 3,
        title: 'Modul 3: AI Champion və AI CHINA Çempionat Hazırlığı',
        description: 'Olimpiada tapşırıqları, YOLOv8 obyekt deteksiyası, sürət və optimizasiya.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-pai-11', title: 'AI Champion və AI CHINA Müsabiqə Reqlamenti', durationHours: 2, description: 'Dünya çempionatının qiymətləndirmə kriteriyaları.' },
          { id: 'les-pai-12', title: 'YOLOv8 ilə 80 fərqli obyekti 30 FPS sürətlə tanımaq', durationHours: 2, description: 'Real vaxtda avtomobil, insan, işıqfor təyini.' },
          { id: 'les-pai-13', title: 'Öz AI Modelimizi Öyrətmək (Custom Dataset Annotation)', durationHours: 2, description: 'Roboflow ilə unikal obyektlərin etiketlənməsi.' },
          { id: 'les-pai-14', title: 'Olimpiada Simulyasiyası: Sürət və dəqiqlik xalları', durationHours: 2, description: 'Komanda daxilində sınaq müdafiəsi.' },
          { id: 'les-pai-15', title: 'Final AI Layihəsi və Beynəlxalq Namizədlik Sertifikatı', durationHours: 2, description: 'AREA Elmi Şurası qarşısında təqdimat.' }
        ]
      }
    ]
  },
  {
    id: 'curr-foster',
    courseName: 'Foster & Foster Advance (Yarış Hazırlığı)',
    category: 'Robototexnika & STEM',
    subTracks: ['Foster Əsasları', 'Foster Advance (Yarış Hazırlığı)', 'Xətt İzləmə və Avtonom Labirint'],
    isCompetitionPrep: true,
    targetAge: '9-15 yaş',
    level: 'İrəli Səviyyə (Advance)',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 80,
    equipmentNeeded: 'Foster Robotik Platforması, Çoxkanallı xətt sensorları, Enkoderli motorlar',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Respublika robototexnika olimpiadalarının favorit platforması. Foster və Foster Advance dəstləri ilə yüksək sürətli xətt izləyən, labirint həll edən və yük çeşidləyən avtonom robotlar.',
    modules: [
      {
        id: 'mod-fo-1',
        order: 1,
        title: 'Modul 1: Foster Platforması və Enkoderli Hərəkət İdarəsi',
        description: 'Təkər dövrlərinin dəqiq sayılması, PID tənzimləməyə giriş və kalibrasiya.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-fo-1', title: 'Foster Robot Şassisi və Motor Sürücüləri', durationHours: 2, description: 'Platformanın mexaniki dayanıqlığı.' },
          { id: 'les-fo-2', title: 'Enkoderlər: Robotun qət etdiyi santimetrləri ölçmək', durationHours: 2, description: 'Dəqiq məsafə qət etmə alqoritmi.' },
          { id: 'les-fo-3', title: '90 və 180 dərəcə Dəqiq Dönüşlər', durationHours: 2, description: 'İnertsiya kompensasiyası.' },
          { id: 'les-fo-4', title: 'Layihə 1: Kvadrat və Ulduz Marşrutu Dəqiqlik Testi', durationHours: 2, description: 'Xətasız trayektoriya yarışı.' }
        ]
      },
      {
        id: 'mod-fo-2',
        order: 2,
        title: 'Modul 2: Foster Advance ilə Çoxkanallı Xətt İzləmə və PID',
        description: '5 və 8 kanallı infraqırmızı sensor barı ilə xəttin mərkəzində sürətlə qalmaq.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-fo-5', title: 'Xətt Sensoru Kalibrasiyası (Ağ və Qara fon fərqi)', durationHours: 2, description: 'Maksimum və minimum həddlərin təyini.' },
          { id: 'les-fo-6', title: 'P-Tənzimləyici: Xətanın dərəcəsinə görə sükan idarəsi', durationHours: 2, description: 'Yumşaq döngələrdən keçid.' },
          { id: 'les-fo-7', title: 'PID Alqoritmi: Proportional, Integral, Derivative', durationHours: 2, description: 'Sürətin 2 qat artırılması zamanı titrəmənin qarşısını almaq.' },
          { id: 'les-fo-8', title: 'Layihə 2: Foster Sürət Rallisi (Line Follower)', durationHours: 2, description: 'Saniyəölçənlə çempionat trasında vaxt sınağı.' }
        ]
      },
      {
        id: 'mod-fo-3',
        order: 3,
        title: 'Modul 3: Avtonom Labirint və Tapşırıq Zonaları',
        description: 'Ultrasəs və lazer məsafəölçənlərlə kor divarlardan qaçış və qovşaq seçimləri.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-fo-9', title: 'Labirint Qaydası: "Həmişə sağ divarı izlə" alqoritmi', durationHours: 2, description: 'Avtonom çıxış məntiqi.' },
          { id: 'les-fo-10', title: 'Rəngli Kubiklərin Qaldırılması və Çeşidlənməsi', durationHours: 2, description: 'Manipulyator qol ilə inteqrasiya.' },
          { id: 'les-fo-11', title: 'Foster Advance Çempionat Trasında İmtahan', durationHours: 2, description: 'Bütün sensorların sinxron işi.' },
          { id: 'les-fo-12', title: 'Nəticələrin Təsdiqi və Məzuniyyət Sertifikatı', durationHours: 2, description: 'Olimpiada komandasına qəbul.' }
        ]
      }
    ]
  },
  {
    id: 'curr-elektronika',
    courseName: 'Praktiki Elektronika və Dövrələr',
    category: 'Elektronika & Meykerlik',
    subTracks: ['Om Qanunu və Komponentlər', 'Lehimləmə və Montaj', 'Rəqəmsal Məntiq və İnteqral Sxemlər'],
    isCompetitionPrep: false,
    targetAge: '10-16 yaş',
    level: 'Orta',
    totalDurationMonths: 3,
    totalHours: 36,
    passingGrade: 75,
    equipmentNeeded: 'Lehimləmə stansiyası, Multimetr, Breadboard, Rezistorlar, Tranzistorlar, Kondensatorlar',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Cərəyan, gərginlik, müqavimət, analoq sxemlər, lehimləmə sənəti və çap lövhələri (PCB). Şagirdlər öz əlləri ilə real işləyən audio gücləndiricilər və siqnalizasiya cihazları yığırlar.',
    modules: [
      {
        id: 'mod-el-1',
        order: 1,
        title: 'Modul 1: Elektrik Cərəyanı, Komponentlər və Təhlükəsizlik',
        description: 'Statik elektrik, qapalı dövrə, rezistorların rəng kodu və multimetrlə ölçmələr.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-el-1', title: 'Elektrik nədir? Atom quruluşu və sərbəst elektronlar', durationHours: 2, description: 'Gərginlik (V), Cərəyan şiddəti (A) və Müqavimət (R).' },
          { id: 'les-el-2', title: 'Om Qanunu və Rezistorların rəng zolaqları ilə oxunması', durationHours: 2, description: 'Multimetr ilə real müqavimət ölçülməsi.' },
          { id: 'les-el-3', title: 'Ardıcıl və Paralel Birləşmələr (Breadboard laboratoriyası)', durationHours: 2, description: 'Gərginliyin və cərəyanın paylanması.' },
          { id: 'les-el-4', title: 'Layihə 1: Fənər və Tənzimlənən İşıq Reostati', durationHours: 2, description: 'Potensiometrlə işıq şiddətinin idarəsi.' }
        ]
      },
      {
        id: 'mod-el-2',
        order: 2,
        title: 'Modul 2: Yarımkeçiricilər (Diodlar, LED-lər və Tranzistorlar)',
        description: 'P-N keçidi, cərəyanın biristiqamətli axını, gücləndirici və elektron açar kimi tranzistor.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-el-5', title: 'Diodlar və LED-lər: Qoruyucu rezistorun hesablanması', durationHours: 2, description: 'Düz və tərs qütbləşmə.' },
          { id: 'les-el-6', title: 'Kondensatorlar: Elektrik enerjisinin toplanması və boşalması', durationHours: 2, description: 'Taymer və filtr sxemlərində rolu.' },
          { id: 'les-el-7', title: 'Bipolyar Tranzistor (NPN / PNP) elektron açar kimi', durationHours: 2, description: 'Kiçik cərəyanla böyük yükün idarəsi.' },
          { id: 'les-el-8', title: 'Layihə 2: Qaranlıqda Avtomatik Yanan Küçə Fənəri', durationHours: 2, description: 'Fotorezistor və tranzistorlu avtomatika.' }
        ]
      },
      {
        id: 'mod-el-3',
        order: 3,
        title: 'Modul 3: Praktiki Lehimləmə və Çap Lövhəsi (PCB) Quraşdırılması',
        description: 'Qalay, kanifol, lehim ucluqları və ilk daimi işləyən mini cihazın yığılması.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-el-9', title: 'Lehimləmə Təhlükəsizliyi və Düzgün Birləşmə Texnikası', durationHours: 2, description: 'Soyuq lehim qüsurlarının qarşısının alınması.' },
          { id: 'les-el-10', title: '555 Taymer Mikrosxemi ilə Multivibrator Sxemi', durationHours: 2, description: 'Sayrışan polis mayakı dövrəsi.' },
          { id: 'les-el-11', title: 'Səs Gücləndirici (Mini Audio Amplifier) montajı', durationHours: 2, description: 'Dinamik və səs siqnalının gücləndirilməsi.' },
          { id: 'les-el-12', title: 'Layihə 3: Hazır Cihazın Korpuslanması və Təqdimat', durationHours: 2, description: 'Elektronika Mühəndisi İlkin Sertifikatı.' }
        ]
      }
    ]
  },
  {
    id: 'curr-areaduino',
    courseName: 'AREAduino (Arduino Mühəndisliyi və Robotika)',
    category: 'Mühəndislik & Mexanika',
    subTracks: ['C++ Əsasları Arduino üçün', 'Servo və Step Motorlar', 'Avtonom Mobil Robotlar'],
    isCompetitionPrep: false,
    targetAge: '11-17 yaş',
    level: 'Orta',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 80,
    equipmentNeeded: 'AREAduino Tədris Dəsti, Arduino IDE, Sensor dəsti, Şassi, Bluetooth modulu',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'AREA-nın xüsusi Arduino əsaslı mühəndislik proqramı. C++ dilində kodlaşdırma, elektron sxemlərin mikrokontrollerlə birləşməsi və ağıllı mexatronika sistemlərinin yaradılması.',
    modules: [
      {
        id: 'mod-ad-1',
        order: 1,
        title: 'Modul 1: AREAduino və C++ Proqramlaşdırma Əsasları',
        description: 'setup(), loop(), pinMode(), digitalWrite(), Serial Monitor və dəyişənlər.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-ad-1', title: 'AREAduino lövhəsi və Mikrokontroller arxitekturası', durationHours: 2, description: 'ATmega328P çipi, portlar və qidalanma.' },
          { id: 'les-ad-2', title: 'C++ Dəyişənləri (int, float, bool) və Serial Monitor', durationHours: 2, description: 'Kompüterlə ikiistiqamətli rabitə.' },
          { id: 'les-ad-3', title: 'Rəqəmsal və Analoq Girişlər (digitalRead, analogRead)', durationHours: 2, description: 'Düymələr və sensorlardan məlumat oxumaq.' },
          { id: 'les-ad-4', title: 'Layihə 1: Ağıllı Seyf (Şifrəli Kod Kilidi)', durationHours: 2, description: 'Buzzer və düymələrlə daxilolma sistemi.' }
        ]
      },
      {
        id: 'mod-ad-2',
        order: 2,
        title: 'Modul 2: Motorlar və Mexaniki Aktuatorlar',
        description: 'SG90 Servo motorlar, L298N motor drayveri və pilləli (Stepper) mühərriklər.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-ad-5', title: 'Servo Motor Kitabxanası (#include <Servo.h>)', durationHours: 2, description: '0-dan 180 dərəcəyə dəqiq bucaq idarəsi.' },
          { id: 'les-ad-6', title: 'L298N H-Bridge Drayveri ilə DC Motorların İkiistiqamətli Fırlanması', durationHours: 2, description: 'Təkərlərin sürət və istiqamət kontrolu.' },
          { id: 'les-ad-7', title: 'Ultrasəs Sensoru (HC-SR04) ilə Məsafə Ölçümü', durationHours: 2, description: 'Səs dalğasının yayılma sürəti riyaziyyatı.' },
          { id: 'les-ad-8', title: 'Layihə 2: Maneələrdən Yan Keçən Avtonom Maşın', durationHours: 2, description: 'Önündə maneə görəndə dayanıb yön dəyişən robot.' }
        ]
      },
      {
        id: 'mod-ad-3',
        order: 3,
        title: 'Modul 3: Simsiz Rabitə və Bluetooth İdarəetməsi',
        description: 'HC-05/06 Bluetooth modulu ilə smartfondan robota əmrlər göndərilməsi.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-ad-9', title: 'UART Serial Rabitə və Bluetooth Modulunun Qoşulması', durationHours: 2, description: 'Simsiz məlumat ötürülməsi.' },
          { id: 'les-ad-10', title: 'Smartfon üçün Bluetooth RC Controller Tətbiqi', durationHours: 2, description: 'Telefon ekranından pult kimi istifadə.' },
          { id: 'les-ad-11', title: 'İşıqlar, Siqnal və Sürət pillələrinin inteqrasiyası', durationHours: 2, description: 'Tam təchizatlı mobil robot.' },
          { id: 'les-ad-12', title: 'Layihə 3: AREAduino Çempionatı və Final Müdafiəsi', durationHours: 2, description: 'Texniki layihə sənədləşməsi və sertifikat.' }
        ]
      }
    ]
  },
  {
    id: 'curr-fullstack',
    courseName: 'Full Stack Veb Proqramlaşdırma (Front End & Back End)',
    category: 'Proqramlaşdırma',
    subTracks: ['Front End Jr (HTML/CSS/JS)', 'Front End Sr (React 19, TypeScript, Tailwind)', 'Back End Jr (Node.js, Express)', 'Back End Sr (PostgreSQL, REST API, Cloud)'],
    isCompetitionPrep: false,
    targetAge: '14+ yaş və Tələbələr',
    level: 'İrəli Səviyyə (Advance)',
    totalDurationMonths: 6,
    totalHours: 144,
    passingGrade: 80,
    equipmentNeeded: 'Noutbuk / PC, VS Code, Git/GitHub, Node.js mühiti',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Junior və Senior səviyyəli peşəkar veb proqramlaşdırma təhsili. HTML/CSS/JS əsaslarından React 19, TypeScript, Node.js serverləri və verilənlər bazalarına qədər real layihələrlə tam tədris.',
    modules: [
      {
        id: 'mod-fs-1',
        order: 1,
        title: 'Modul 1: Front End Jr — Semantik HTML5, CSS3 və Müasir Tailwind CSS',
        description: 'Responsiv veb dizayn, Flexbox, CSS Grid, animasiyalar və təmiz kod standartları.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-fs-1', title: 'İnternet arxitekturası, Semantik HTML5 və SEO əsasları', durationHours: 2, description: 'Veb səhifənin skeleti və əlçatanlıq.' },
          { id: 'les-fs-2', title: 'Müasir CSS: Flexbox və CSS Grid ilə 2D layout', durationHours: 2, description: 'Mobil və masaüstü uyğunlaşma.' },
          { id: 'les-fs-3', title: 'Tailwind CSS konfiqurasiyası və Utility-First metodologiyası', durationHours: 2, description: 'Sürətli və müasir interfeys quruculuğu.' },
          { id: 'les-fs-4', title: 'Git və GitHub: Versiya nəzarəti və komanda işi', durationHours: 2, description: 'Commit, push, pull və branch idarəsi.' },
          { id: 'les-fs-5', title: 'Layihə 1: Şəxsi Portfolio və Landing Page Saytı', durationHours: 2, description: 'Canlı serverdə yayımlanan adaptiv veb səhifə.' }
        ]
      },
      {
        id: 'mod-fs-2',
        order: 2,
        title: 'Modul 2: JavaScript ES6+ və Asinxron Veb Proqramlaşdırma',
        description: 'Dəyişənlər, array metodları, DOM manipulyasiyası, Promises, Async/Await və Fetch API.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-fs-6', title: 'Müasir JavaScript (ES6+): Closures, destructuring, spread', durationHours: 2, description: 'Funksional proqramlaşdırma prinsipləri.' },
          { id: 'les-fs-7', title: 'DOM Hadisələri və Dinamik İnterfeys Elementləri', durationHours: 2, description: 'Modal pəncərələr, form validasiyası və filtrlər.' },
          { id: 'les-fs-8', title: 'Asinxron JS: REST API sorğuları və JSON emalı', durationHours: 2, description: 'Xəritə, hava və xəbər API-lərinin inteqrasiyası.' },
          { id: 'les-fs-9', title: 'Layihə 2: Valyuta Məzənnələri və Kripto Tracker tətbiqi', durationHours: 2, description: 'Canlı məlumatlarla işləyən interaktiv tətbiq.' }
        ]
      },
      {
        id: 'mod-fs-3',
        order: 3,
        title: 'Modul 3: Front End Sr — React 19, TypeScript və State Management',
        description: 'Komponent əsaslı arxitektura, Custom Hooks, Context API və TypeScript statik tipləmə.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-fs-10', title: 'React 19 Əsasları: JSX, Props və State', durationHours: 2, description: 'Vite layihəsi və komponent həyat dövrü.' },
          { id: 'les-fs-11', title: 'TypeScript inteqrasiyası: İnterfeyslər və güclü tipləmə', durationHours: 2, description: 'Xətasız və korporativ standartlı kod.' },
          { id: 'les-fs-12', title: 'Hooks: useEffect, useMemo, useCallback və Custom Hooks', durationHours: 2, description: 'Performans optimizasiyası.' },
          { id: 'les-fs-13', title: 'Layihə 3: E-Ticarət Mağazası Səbət və Ödəniş UI Sistemi', durationHours: 2, description: 'Məhsul kataloqu, filtrasiya və səbət axını.' }
        ]
      },
      {
        id: 'mod-fs-4',
        order: 4,
        title: 'Modul 4: Back End Jr & Sr — Node.js, Express, Verilənlər Bazası və Deploy',
        description: 'Server qurulması, RESTful API marşrutları, PostgreSQL/MongoDB, JWT autentifikasiya və bulud.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-fs-14', title: 'Node.js və Express Serverinin Arxitekturası', durationHours: 2, description: 'Middlewares, routing və CORS tənzimləmələri.' },
          { id: 'les-fs-15', title: 'Verilənlər Bazası (PostgreSQL / Relational DB)', durationHours: 2, description: 'Cədvəllər, əlaqələr və SQL sorğuları.' },
          { id: 'les-fs-16', title: 'İstifadəçi Girişi: JWT Token və Şifrələrin Hetşlənməsi (Bcrypt)', durationHours: 2, description: 'Təhlükəsiz qeydiyyat və login sistemi.' },
          { id: 'les-fs-17', title: 'Buraxılış Diplom Layihəsi: Tam Funksional SaaS Tətbiqi', durationHours: 2, description: 'Frontend və Backend-in birləşdirilməsi və canlı müdafiə.' }
        ]
      }
    ]
  },
  {
    id: 'curr-python-prog',
    courseName: 'Python Proqramlaşdırma (Alqoritmlər və OOP)',
    category: 'Proqramlaşdırma',
    subTracks: ['Dəyişənlər və Şərtlər', 'Funksiyalar və Kolleksiyalar', 'Obyekt Yönümlü Proqramlaşdırma (OOP)', 'Alqoritmik Məsələ Həlli'],
    isCompetitionPrep: false,
    targetAge: '11-18 yaş',
    level: 'Orta',
    totalDurationMonths: 4,
    totalHours: 48,
    passingGrade: 75,
    equipmentNeeded: 'Kompüter / Noutbuk, Python 3.12, PyCharm və ya VS Code',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Dünyanın ən populyar proqramlaşdırma dili. Şagirdlər təməl sintaksisdən başlayaraq alqoritmlər, verilənlər strukturları, fayllarla iş və OOP yanaşmasını mənimsəyirlər.',
    modules: [
      {
        id: 'mod-pp-1',
        order: 1,
        title: 'Modul 1: Python Təməlləri və İdarəetmə Strukturları',
        description: 'Giriş-çıxış (input/print), riyazi əməliyyatlar, məntiqi şərtlər (if-elif-else) və dövrlər (for/while).',
        durationWeeks: 4,
        lessons: [
          { id: 'les-pp-1', title: 'Python Mühiti və Məlumat Tipləri (int, float, str, bool)', durationHours: 2, description: 'Dəyişənlər və tip çevirmələri.' },
          { id: 'les-pp-2', title: 'Şərt Operatorları və Məntiqi Əlaqələr', durationHours: 2, description: 'and, or, not operatorları ilə qərarlar vermək.' },
          { id: 'les-pp-3', title: 'Dövrlər: For və While dövrləri ilə hesablama', durationHours: 2, description: 'range() funksiyası və sayğaclar.' },
          { id: 'les-pp-4', title: 'Layihə 1: Bankomat və Valyuta Dönüşdürmə Proqramı', durationHours: 2, description: 'Konsol əsaslı interaktiv maliyyə köməkçisi.' }
        ]
      },
      {
        id: 'mod-pp-2',
        order: 2,
        title: 'Modul 2: Kolleksiyalar (List, Tuple, Set, Dict) və Funksiyalar',
        description: 'Siyahılar, lüğətlər, çoxluqlar, def ilə funksiya yaratmaq və modullar.',
        durationWeeks: 4,
        lessons: [
          { id: 'les-pp-5', title: 'Siyahılar (Lists) və onların metodları (append, pop, sort)', durationHours: 2, description: 'İndeksləmə və dilimləmə (slicing).' },
          { id: 'les-pp-6', title: 'Lüğətlər (Dictionaries): Açar-dəyər cütlükləri', durationHours: 2, description: 'İstifadəçi bazası və JSON oxşar strukturlar.' },
          { id: 'les-pp-7', title: 'Xüsusi Funksiyalar (def), Parametrlər və Return dəyərləri', durationHours: 2, description: 'Kodun təkrar istifadəsi və təmiz arxitektura.' },
          { id: 'les-pp-8', title: 'Layihə 2: Şagird Qiymətləndirmə və Test İmtahan Sistemi', durationHours: 2, description: 'Avtomatik bal hesablayan proqram.' }
        ]
      },
      {
        id: 'mod-pp-3',
        order: 3,
        title: 'Modul 3: Fayllarla İş və Obyekt Yönümlü Proqramlaşdırma (OOP)',
        description: 'Faylların oxunması/yazılması (txt, csv), Siniflər (Classes), Obyektlər və Miras (Inheritance).',
        durationWeeks: 4,
        lessons: [
          { id: 'les-pp-9', title: 'Fayllarla İş: Məlumatların daimi yaddaşda saxlanması', durationHours: 2, description: 'open(), read(), write() əməliyyatları.' },
          { id: 'les-pp-10', title: 'OOP Əsasları: Class, __init__ və Metodlar', durationHours: 2, description: 'Real dünya obyektlərinin proqramlaşdırılması.' },
          { id: 'les-pp-11', title: 'Miras (Inheritance) və Kapsulyasiya prinsipləri', durationHours: 2, description: 'Törəmə siniflər və kod iyerarxiyası.' },
          { id: 'les-pp-12', title: 'Layihə 3: Kitabxana İdarəetmə Sistemi və Məzuniyyət İmtahanı', durationHours: 2, description: 'OOP əsaslı tam tətbiq nümayişi.' }
        ]
      }
    ]
  },
  {
    id: 'curr-ai-eng',
    courseName: 'AI Engineering (Dərin Öyrənmə və LLM Sistemləri)',
    category: 'Süni İntellekt & Data',
    subTracks: ['Machine Learning Əsasları', 'Dərin Neyron Şəbəkələr (PyTorch)', 'Böyük Dil Modelləri (LLM) və Agentlər', 'Model Deploy və API İnteqrasiyası'],
    isCompetitionPrep: false,
    targetAge: '16+ yaş və Tələbələr',
    level: 'İrəli Səviyyə (Advance)',
    totalDurationMonths: 6,
    totalHours: 72,
    passingGrade: 85,
    equipmentNeeded: 'GPU iş stansiyası / Google Colab Pro, PyTorch, Hugging Face, LangChain',
    branchesOffered: ALL_BRANCH_NAMES,
    description: 'Müasir süni intellekt mühəndisliyi: Dərin neyron şəbəkələri, Generativ AI, RAG (Retrieval-Augmented Generation) sistemləri və avtonom AI agentlərinin qurulması.',
    modules: [
      {
        id: 'mod-aie-1',
        order: 1,
        title: 'Modul 1: Machine Learning Təməlləri və Riyazi Əsaslar',
        description: 'Xətti cəbr, Qradiyent enişi, reqressiya, təsnifat və model qiymətləndirmə meyarları.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-aie-1', title: 'AI Mühəndisliyi Nədir? ML, DL və GenAI fərqləri', durationHours: 2, description: 'Model təlimi həyat dövrü.' },
          { id: 'les-aie-2', title: 'Xətti Reqressiya və İtkilər Funksiyası (Loss Function)', durationHours: 2, description: 'Ev qiymətlərinin proqnozlaşdırılması modeli.' },
          { id: 'les-aie-3', title: 'Loqistik Reqressiya və Qərar Ağacları (Random Forest)', durationHours: 2, description: 'Müştəri itkisinin (Churn) təyini.' },
          { id: 'les-aie-4', title: 'Model Metrikaları: Precision, Recall, F1-Score və ROC-AUC', durationHours: 2, description: 'Dəqiqlik analizləri.' },
          { id: 'les-aie-5', title: 'Layihə 1: Maliyyə Risklərini Qiymətləndirən ML Modeli', durationHours: 2, description: 'Kredit müraciətlərinin avtomatik qərar sistemi.' }
        ]
      },
      {
        id: 'mod-aie-2',
        order: 2,
        title: 'Modul 2: Dərin Öyrənmə (Deep Learning) və PyTorch',
        description: 'Perseptronlar, Çoxlaylı Neyron Şəbəkələri (MLP), Geri Yayılma (Backpropagation) və CNN.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-aie-6', title: 'Neyron Şəbəkələrin Qurulması: Tenzorlar və PyTorch', durationHours: 2, description: 'GPU üzərində hesablama sürətləndirilməsi.' },
          { id: 'les-aie-7', title: 'Aktivasiya Funksiyaları (ReLU, Sigmoid, Softmax) və Optimizasiya', durationHours: 2, description: 'Adam optimizatoru.' },
          { id: 'les-aie-8', title: 'Konvolusiya Neyron Şəbəkələri (CNN): Tibbi rentgen analizi', durationHours: 2, description: 'Görüntü təsnifatı.' },
          { id: 'les-aie-9', title: 'Layihə 2: Əlyazma Rəqəmlərini Tanıyan Dərin Model', durationHours: 2, description: 'MNIST verilənlər dəsti ilə 99% dəqiqlik.' }
        ]
      },
      {
        id: 'mod-aie-3',
        order: 3,
        title: 'Modul 3: LLM, Prompt Engineering, RAG və AI Agentləri',
        description: 'Transformer arxitekturası, Vektor verilənlər bazaları (Chroma/Pinecone), RAG və API.',
        durationWeeks: 6,
        lessons: [
          { id: 'les-aie-10', title: 'Transformerlər və Diqqət Mexanizmi (Attention is all you need)', durationHours: 2, description: 'LLM modellərinin iş prinsipi.' },
          { id: 'les-aie-11', title: 'RAG Arxitekturası: Şirkətin PDF sənədləri ilə danışan AI', durationHours: 2, description: 'Embeddings və vektor axtarışı.' },
          { id: 'les-aie-12', title: 'Avtonom AI Agentləri: Funksiya çağırma və alətlərlə iş', durationHours: 2, description: 'İnternetdə axtarış edib hesabat hazırlayan agent.' },
          { id: 'les-aie-13', title: 'Buraxılış İşi: Müəssisə üçün İntellektual AI Köməkçi Platforması', durationHours: 2, description: 'Canlı deploy və diplom təqdimatı.' }
        ]
      }
    ]
  }
];
