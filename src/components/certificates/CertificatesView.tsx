import React, { useState, useMemo, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Award,
  Printer,
  Search,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Download,
  Share2,
  Eye,
  FileCheck,
  Users,
  UserCheck,
  Globe,
  MessageCircle,
  Linkedin,
  Filter,
  X,
  Copy,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  Palette,
  Trash2,
  Check,
  FileText,
  Sliders,
  Plus,
  RefreshCw,
  Clock,
  Maximize2,
  FileDown
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Certificate, Student, CertificateTemplateItem } from '../../types/crm';
import { formatDateAz, exportToCSV } from '../../utils/formatters';

// Default starter templates
const DEFAULT_CUSTOM_TEMPLATES: CertificateTemplateItem[] = [
  {
    id: 'tmpl-royal-gold',
    name: 'Klassik Qızılı Çərçivə (Akademiya)',
    backgroundUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
    textColorTheme: 'light',
    borderStyle: 'gold',
    overlayDarkness: 20,
    createdAt: '2026-01-10',
  },
  {
    id: 'tmpl-clean-diploma',
    name: 'Minimal Fil Dişi Diplom',
    backgroundUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&q=80',
    textColorTheme: 'dark',
    borderStyle: 'classic',
    overlayDarkness: 10,
    createdAt: '2026-02-05',
  },
];

export const CertificatesView: React.FC = () => {
  const {
    students,
    groups,
    certificates,
    issueCertificate,
    currentRole,
    currentUser,
    showToast,
    can,
  } = useCrm();

  const isStudent = currentRole === 'sagird';
  const canCreateCert = can('create', 'certificates');

  // Navigation tab: 'generate' | 'templates' | 'archive' | 'verify'
  const [activeTab, setActiveTab] = useState<'generate' | 'templates' | 'archive' | 'verify'>(
    canCreateCert ? 'generate' : 'archive'
  );

  // Generation mode: 'single' (Individual student) | 'bulk' (Whole group graduation)
  const [generateMode, setGenerateMode] = useState<'single' | 'bulk'>('single');

  // Form states for Single student
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [grade, setGrade] = useState<'Fərqlənmə ilə' | 'Müvəffəqiyyətlə' | 'İştirakçı'>('Fərqlənmə ilə');
  const [templateStyle, setTemplateStyle] = useState<'luxury' | 'modern' | 'cyber' | 'custom'>('luxury');
  const [language, setLanguage] = useState<'az' | 'en' | 'bilingual'>('az');
  const [instructorName, setInstructorName] = useState<string>('Fərid Əliyev');
  const [directorName, setDirectorName] = useState<string>('Elnur Qasımzadə');
  const [completionDate, setCompletionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hoursCompleted, setHoursCompleted] = useState<number>(72);

  // Signatures
  const [trainerSignatureUrl, setTrainerSignatureUrl] = useState<string>('');
  const [directorSignatureUrl, setDirectorSignatureUrl] = useState<string>('');

  // Bulk generation states
  const [selectedGroupId, setSelectedGroupId] = useState<string>(groups[0]?.id || '');
  const [bulkGrades, setBulkGrades] = useState<Record<string, 'Fərqlənmə ilə' | 'Müvəffəqiyyətlə' | 'İştirakçı'>>({});
  const [bulkIsIssuing, setBulkIsIssuing] = useState(false);

  // Template Upload & Library states
  const [customTemplates, setCustomTemplates] = useState<CertificateTemplateItem[]>(() => {
    try {
      const saved = localStorage.getItem('areacrm_custom_cert_templates');
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_TEMPLATES;
    } catch {
      return DEFAULT_CUSTOM_TEMPLATES;
    }
  });

  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string>(
    customTemplates[0]?.id || 'tmpl-royal-gold'
  );

  // Custom template fine-tuning
  const [customTextColorTheme, setCustomTextColorTheme] = useState<'light' | 'dark' | 'gold'>('light');
  const [customBorderStyle, setCustomBorderStyle] = useState<'none' | 'gold' | 'classic' | 'modern'>('gold');
  const [customOverlayDarkness, setCustomOverlayDarkness] = useState<number>(15);

  // New Template Upload Form state
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePreview, setNewTemplatePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trainerSigInputRef = useRef<HTMLInputElement>(null);
  const directorSigInputRef = useRef<HTMLInputElement>(null);

  // Selected student details
  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const currentGroup = groups.find(g => g.id === currentStudent?.groupId);

  // Active certificate being previewed or issued
  const [previewCert, setPreviewCert] = useState<Certificate | null>(certificates[0] || null);

  // Full Screen Preview Modal
  const [modalCert, setModalCert] = useState<Certificate | null>(null);

  // Verification tab state
  const [verifySearchId, setVerifySearchId] = useState<string>('');
  const [verifiedResult, setVerifiedResult] = useState<Certificate | null>(null);

  // Archive search and filters
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveGroupFilter, setArchiveGroupFilter] = useState<string>('all');
  const [archiveGradeFilter, setArchiveGradeFilter] = useState<string>('all');

  // Export / Download loading state
  const [isDownloading, setIsDownloading] = useState(false);

  // Persist custom templates
  useEffect(() => {
    try {
      localStorage.setItem('areacrm_custom_cert_templates', JSON.stringify(customTemplates));
    } catch (e) {
      console.warn('Storage quota exceeded for custom templates', e);
    }
  }, [customTemplates]);

  // Active custom template object
  const activeCustomTemplate = useMemo(() => {
    return customTemplates.find(t => t.id === selectedCustomTemplateId) || customTemplates[0];
  }, [customTemplates, selectedCustomTemplateId]);

  // Sync settings when selecting custom template
  useEffect(() => {
    if (activeCustomTemplate) {
      setCustomTextColorTheme(activeCustomTemplate.textColorTheme);
      setCustomBorderStyle(activeCustomTemplate.borderStyle);
      setCustomOverlayDarkness(activeCustomTemplate.overlayDarkness ?? 15);
    }
  }, [activeCustomTemplate]);

  // Students in selected group for bulk issuance
  const bulkGroupStudents = useMemo(() => {
    return students.filter(s => s.groupId === selectedGroupId);
  }, [students, selectedGroupId]);

  // Handle single certificate generation
  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    try {
      const newCert = await issueCertificate({
        studentId: currentStudent.id,
        studentName: currentStudent.fullName,
        courseName: currentStudent.courseName,
        groupName: currentStudent.groupName,
        curriculumId: currentGroup?.courseId || 'curr-fe',
        grade,
        completionDate,
        instructorName,
        directorName,
        templateStyle,
        language,
        customBackgroundUrl: templateStyle === 'custom' ? activeCustomTemplate?.backgroundUrl : undefined,
        textColorTheme: templateStyle === 'custom' ? customTextColorTheme : undefined,
        customBorder: templateStyle === 'custom' ? customBorderStyle : undefined,
        overlayDarkness: templateStyle === 'custom' ? customOverlayDarkness : undefined,
        hoursCompleted,
        trainerSignatureUrl: trainerSignatureUrl || undefined,
        directorSignatureUrl: directorSignatureUrl || undefined,
      });

      setPreviewCert(newCert);

      // Trigger celebration confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(`${currentStudent.fullName} üçün rəsmi sertifikat hazırlandı və reyestrə yazıldı!`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Sertifikat yaradılarkən xəta baş verdi', 'error');
    }
  };

  // Handle bulk group graduation
  const handleBulkIssue = async () => {
    if (!bulkGroupStudents.length) {
      showToast('Bu qrupda tələbə yoxdur', 'error');
      return;
    }

    try {
      setBulkIsIssuing(true);
      let lastIssued: Certificate | null = null;

      for (const std of bulkGroupStudents) {
        const studentGrade = bulkGrades[std.id] || 'Müvəffəqiyyətlə';
        lastIssued = await issueCertificate({
          studentId: std.id,
          studentName: std.fullName,
          courseName: std.courseName,
          groupName: std.groupName,
          curriculumId: currentGroup?.courseId || 'curr-fe',
          grade: studentGrade,
          completionDate,
          instructorName,
          directorName,
          templateStyle,
          language,
          customBackgroundUrl: templateStyle === 'custom' ? activeCustomTemplate?.backgroundUrl : undefined,
          textColorTheme: templateStyle === 'custom' ? customTextColorTheme : undefined,
          customBorder: templateStyle === 'custom' ? customBorderStyle : undefined,
          overlayDarkness: templateStyle === 'custom' ? customOverlayDarkness : undefined,
          hoursCompleted,
          trainerSignatureUrl: trainerSignatureUrl || undefined,
          directorSignatureUrl: directorSignatureUrl || undefined,
        });
      }

      if (lastIssued) {
        setPreviewCert(lastIssued);
      }

      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
      });

      showToast(`Qrupun ${bulkGroupStudents.length} tələbəsi üçün sertifikatlar uğurla qeydiyyata alındı!`, 'success');
      setActiveTab('archive');
    } catch (e) {
      console.error(e);
      showToast('Toplu sertifikat hazırlanmasında xəta', 'error');
    } finally {
      setBulkIsIssuing(false);
    }
  };

  // Handle file upload for template background
  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Faylın həcmi 8 MB-dan artıq olmamalıdır!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setNewTemplatePreview(base64);
      if (!newTemplateName.trim()) {
        const autoName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewTemplateName(autoName);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save new custom template to library
  const handleSaveNewTemplate = () => {
    if (!newTemplatePreview) {
      showToast('Zəhmət olmasa şablon şəklini seçin!', 'error');
      return;
    }

    const name = newTemplateName.trim() || `Fərdi Şablon ${customTemplates.length + 1}`;
    const newTmpl: CertificateTemplateItem = {
      id: `tmpl-${Date.now()}`,
      name,
      backgroundUrl: newTemplatePreview,
      textColorTheme: customTextColorTheme,
      borderStyle: customBorderStyle,
      overlayDarkness: customOverlayDarkness,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newTmpl, ...customTemplates];
    setCustomTemplates(updated);
    setSelectedCustomTemplateId(newTmpl.id);
    setTemplateStyle('custom');
    setNewTemplatePreview('');
    setNewTemplateName('');
    showToast(`«${name}» şablonu uğurla əlavə edildi və aktivləşdirildi!`, 'success');
  };

  // Delete custom template
  const handleDeleteTemplate = (id: string, name: string) => {
    if (customTemplates.length <= 1) {
      showToast('Ən azı 1 şablon saxlanılmalıdır!', 'error');
      return;
    }
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    if (selectedCustomTemplateId === id) {
      setSelectedCustomTemplateId(updated[0]?.id || '');
    }
    showToast(`«${name}» şablonu silindi`, 'info');
  };

  // Handle upload signature
  const handleSignatureUpload = (type: 'trainer' | 'director', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (type === 'trainer') {
        setTrainerSignatureUrl(base64);
        showToast('Təlimçi imza şəkli təyin edildi', 'success');
      } else {
        setDirectorSignatureUrl(base64);
        showToast('Direktor imza şəkli təyin edildi', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Download High-Resolution PNG
  const handleDownloadPng = async (cert: Certificate | null) => {
    const el = document.getElementById('certificate-print-area');
    if (!el) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const studentName = cert?.studentName || currentStudent?.fullName || 'Telebe';
      link.download = `AREA_Sertifikat_${studentName.replace(/\s+/g, '_')}_${cert?.id || '2026'}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Sertifikat yüksək keyfiyyətli PNG şəkli kimi yükləndi!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Şəkil yüklənərkən xəta baş verdi', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download Official PDF (A4 Landscape)
  const handleDownloadPdf = async (cert: Certificate | null) => {
    const el = document.getElementById('certificate-print-area');
    if (!el) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      const studentName = cert?.studentName || currentStudent?.fullName || 'Telebe';
      pdf.save(`AREA_Sertifikat_${studentName.replace(/\s+/g, '_')}_${cert?.id || '2026'}.pdf`);
      showToast('Sertifikat A4 formatında PDF kimi yükləndi!', 'success');
    } catch (err) {
      console.error(err);
      showToast('PDF hazırlanarkən xəta baş verdi', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Copy verification link
  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('Doğrulama linki kopyalandı!', 'success');
  };

  // Handle Verify Search
  const handleVerify = (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    const found = certificates.find(
      c => c.id.toLowerCase() === idToVerify.trim().toLowerCase()
    );
    if (found) {
      setVerifiedResult(found);
      showToast('Sertifikat təsdiqləndi!', 'success');
    } else {
      setVerifiedResult(null);
      showToast('Bu nömrə ilə aktiv sertifikat tapılmadı', 'error');
    }
  };

  // Filtered Archive Certificates
  const displayCertificates = useMemo(() => {
    return certificates.filter(c => {
      if (isStudent && currentUser?.email) {
        if (!c.studentName.toLowerCase().includes(currentUser.fullName.toLowerCase())) {
          return false;
        }
      }
      const matchesSearch =
        c.studentName.toLowerCase().includes(archiveSearch.toLowerCase()) ||
        c.id.toLowerCase().includes(archiveSearch.toLowerCase()) ||
        c.courseName.toLowerCase().includes(archiveSearch.toLowerCase());
      const matchesGroup = archiveGroupFilter === 'all' || c.groupName === archiveGroupFilter;
      const matchesGrade = archiveGradeFilter === 'all' || c.grade === archiveGradeFilter;
      return matchesSearch && matchesGroup && matchesGrade;
    });
  }, [certificates, archiveSearch, archiveGroupFilter, archiveGradeFilter, isStudent, currentUser]);

  // Distinct groups in certificates
  const distinctGroups = useMemo(() => {
    const setG = new Set<string>();
    certificates.forEach(c => {
      if (c.groupName) setG.add(c.groupName);
    });
    return Array.from(setG);
  }, [certificates]);

  // Helper text strings based on language
  const getCertText = (lang: 'az' | 'en' | 'bilingual' = 'az') => {
    if (lang === 'en') {
      return {
        brand: 'AREA ACADEMY · EDUCATION & INNOVATION CENTER',
        title: 'Certificate of Completion',
        subtitle: 'OFFICIAL ACCREDITATION & GRADUATION DIPLOMA',
        certifyLead: 'This is to officially certify that',
        courseLead: 'has successfully completed the comprehensive training program in',
        andAchieved: 'with outstanding academic performance and dedicated project defense.',
        trainerTitle: 'Lead Instructor',
        directorTitle: 'Academy Director',
        verifyLabel: 'Official Online Verification',
      };
    }

    if (lang === 'bilingual') {
      return {
        brand: 'AREA ACADEMY · TƏDRİS VƏ İNNOVASİYA MƏRKƏZİ / INNOVATION CENTER',
        title: 'Məzuniyyət Sertifikatı / Certificate',
        subtitle: 'RƏSMİ PEŞƏKAR TƏSDİQNAMƏ / OFFICIAL ACCREDITATION',
        certifyLead: 'Bu sənəd rəsmi olaraq təsdiq edir ki / This is to certify that',
        courseLead: 'tədris proqramını və praktiki layihələrini uğurla başa vurmuşdur / successfully completed',
        andAchieved: 'Yekun Qiymətləndirmə / Standing Grade:',
        trainerTitle: 'Aparıcı Təlimçi / Lead Instructor',
        directorTitle: 'Akademiya Direktoru / Director',
        verifyLabel: 'Rəsmi Doğrulama / Verified QR',
      };
    }

    return {
      brand: 'AREA ACADEMY · TƏDRİS VƏ İNNOVASİYA MƏRKƏZİ',
      title: 'Məzuniyyət Sertifikatı',
      subtitle: 'PEŞƏKAR MƏZUNİYYƏT VƏ BİTİRMƏ DİPLOMU',
      certifyLead: 'Bu rəsmi sənəd təsdiq edir ki,',
      courseLead: 'peşəkar tədris proqramını və laboratoriya layihələrini',
      andAchieved: 'müvəffəqiyyət dərəcəsi ilə uğurla tamamlamışdır.',
      trainerTitle: 'Aparıcı Təlimçi',
      directorTitle: 'Akademiya Direktoru',
      verifyLabel: 'Rəsmi Onlayn Doğrulama',
    };
  };

  // Helper renderer for Certificate Canvas
  const renderCertificateCanvas = (certData: Certificate | null) => {
    const certLang = certData?.language || language;
    const texts = getCertText(certLang);
    const style = certData?.templateStyle || templateStyle;
    const certStudentName = certData?.studentName || currentStudent?.fullName || 'Tələbə Adı';
    const certCourse = certData?.courseName || currentStudent?.courseName || 'Full-Stack Web Development';
    const certGrade = certData?.grade || grade;
    const certTrainer = certData?.instructorName || instructorName;
    const certDirector = certData?.directorName || directorName;
    const certQr = certData?.qrCodeDataUrl || previewCert?.qrCodeDataUrl;
    const certId = certData?.id || previewCert?.id || 'AREA-2026-CERT';
    const certHours = certData?.hoursCompleted || hoursCompleted;

    // Custom background and theme handling
    const bgUrl = certData?.customBackgroundUrl || activeCustomTemplate?.backgroundUrl;
    const theme = certData?.textColorTheme || customTextColorTheme;
    const border = certData?.customBorder || customBorderStyle;
    const overlayDark = certData?.overlayDarkness ?? customOverlayDarkness;
    const trainerSig = certData?.trainerSignatureUrl || trainerSignatureUrl;
    const directorSig = certData?.directorSignatureUrl || directorSignatureUrl;

    // Determine container classes
    let containerStyle: React.CSSProperties = {};
    let borderClass = '';
    let textPrimaryClass = '';
    let textSecondaryClass = '';
    let textAccentClass = '';
    let studentUnderline = '';

    if (style === 'luxury') {
      borderClass = 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-8 border-double border-amber-400/80';
      textPrimaryClass = 'text-white';
      textSecondaryClass = 'text-slate-300';
      textAccentClass = 'text-amber-400';
      studentUnderline = 'border-amber-400/60 text-white';
    } else if (style === 'modern') {
      borderClass = 'bg-white text-slate-900 border-8 border-slate-200 border-l-emerald-600';
      textPrimaryClass = 'text-slate-900';
      textSecondaryClass = 'text-slate-600';
      textAccentClass = 'text-emerald-700';
      studentUnderline = 'border-emerald-500 text-slate-900';
    } else if (style === 'cyber') {
      borderClass = 'bg-slate-950 text-cyan-50 border-4 border-cyan-500 shadow-cyan-500/20';
      textPrimaryClass = 'text-cyan-400';
      textSecondaryClass = 'text-cyan-100/80';
      textAccentClass = 'text-cyan-300';
      studentUnderline = 'border-cyan-500 text-cyan-300';
    } else {
      // CUSTOM TEMPLATE
      containerStyle = {
        backgroundImage: bgUrl ? `url(${bgUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };

      if (border === 'gold') borderClass = 'border-8 border-double border-amber-400/90 shadow-xl';
      else if (border === 'classic') borderClass = 'border-8 border-slate-800 shadow-xl';
      else if (border === 'modern') borderClass = 'border-4 border-emerald-500 shadow-xl';
      else borderClass = 'border-0 shadow-xl';

      if (theme === 'dark') {
        textPrimaryClass = 'text-slate-950';
        textSecondaryClass = 'text-slate-800';
        textAccentClass = 'text-amber-900 font-bold';
        studentUnderline = 'border-slate-900 text-slate-950';
      } else if (theme === 'gold') {
        textPrimaryClass = 'text-amber-300';
        textSecondaryClass = 'text-amber-100';
        textAccentClass = 'text-amber-400 font-bold';
        studentUnderline = 'border-amber-400 text-amber-300';
      } else {
        // Light text (for dark backgrounds)
        textPrimaryClass = 'text-white';
        textSecondaryClass = 'text-slate-200';
        textAccentClass = 'text-amber-300 font-bold';
        studentUnderline = 'border-amber-300 text-white';
      }
    }

    return (
      <div
        id="certificate-print-area"
        style={containerStyle}
        className={`w-[780px] h-[550px] shrink-0 rounded-xl p-10 relative flex flex-col justify-between select-none shadow-2xl transition-all overflow-hidden ${borderClass}`}
      >
        {/* Custom Background Darkness Overlay */}
        {style === 'custom' && overlayDark > 0 && (
          <div
            className="absolute inset-0 bg-black pointer-events-none transition-opacity"
            style={{ opacity: overlayDark / 100 }}
          />
        )}

        {/* Watermark Seal Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Award className="w-[420px] h-[420px]" />
        </div>

        {/* Top Ornaments & Brand */}
        <div className="text-center space-y-1.5 relative z-10">
          <div className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest uppercase">
            <span className={textAccentClass}>
              {texts.brand}
            </span>
          </div>

          <h1
            className={`text-3xl md:text-4xl font-extrabold tracking-wider uppercase font-serif ${
              style === 'luxury'
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100'
                : textPrimaryClass
            }`}
          >
            {texts.title}
          </h1>

          <p className="text-[10px] tracking-widest uppercase opacity-80">
            {texts.subtitle}
          </p>
        </div>

        {/* Middle: Student Full Name & Award Statement */}
        <div className="text-center space-y-3 relative z-10 my-auto">
          <p className={`text-xs italic ${textSecondaryClass}`}>{texts.certifyLead}</p>

          <h2
            className={`text-2xl md:text-3xl font-bold tracking-tight font-serif border-b-2 inline-block px-10 pb-1 ${studentUnderline}`}
          >
            {certStudentName}
          </h2>

          <p className={`text-xs max-w-xl mx-auto leading-relaxed pt-2 ${textSecondaryClass}`}>
            AREA Academy-də{' '}
            <strong className={`${textPrimaryClass} font-bold`}>"{certCourse}"</strong>{' '}
            {texts.courseLead}{' '}
            <strong className={textAccentClass}>
              {certGrade}
            </strong>{' '}
            {texts.andAchieved}
            {certHours > 0 && (
              <span className="block mt-1 text-[11px] font-mono-nums opacity-90">
                (Tədris həcmi: {certHours} akademik saat)
              </span>
            )}
          </p>
        </div>

        {/* Bottom Row: Signatures, Gold Official Seal, and Verified QR Code */}
        <div className="flex items-end justify-between pt-6 border-t border-slate-500/40 relative z-10">
          {/* Trainer Signature */}
          <div className="text-center space-y-1 w-44">
            <div className="min-h-[36px] flex items-center justify-center">
              {trainerSig ? (
                <img src={trainerSig} alt="Təlimçi İmzası" className="max-h-9 object-contain mx-auto filter drop-shadow-xs" />
              ) : (
                <div className={`font-serif text-sm italic ${textSecondaryClass}`}>
                  ✍️ {certTrainer}
                </div>
              )}
            </div>
            <div className="w-full border-t border-slate-400/50 pt-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${textPrimaryClass}`}>
                {certTrainer}
              </span>
              <span className={`text-[9px] block ${textSecondaryClass}`}>
                {texts.trainerTitle}
              </span>
            </div>
          </div>

          {/* Center: AREA Gold Accredited Seal Badge */}
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-0.5 shadow-lg mx-auto flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center text-amber-300 p-1">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-[7px] font-extrabold uppercase tracking-tight">AREA</span>
                <span className="text-[5px] text-amber-200 font-mono-nums">VERIFIED</span>
              </div>
            </div>
            <span className="text-[8px] font-mono-nums tracking-widest text-amber-400/90 font-bold block uppercase">
              № {certId}
            </span>
          </div>

          {/* Director Signature */}
          <div className="text-center space-y-1 w-44">
            <div className="min-h-[36px] flex items-center justify-center">
              {directorSig ? (
                <img src={directorSig} alt="Direktor İmzası" className="max-h-9 object-contain mx-auto filter drop-shadow-xs" />
              ) : (
                <div className={`font-serif text-sm italic ${textSecondaryClass}`}>
                  ✍️ {certDirector}
                </div>
              )}
            </div>
            <div className="w-full border-t border-slate-400/50 pt-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider block ${textPrimaryClass}`}>
                {certDirector}
              </span>
              <span className={`text-[9px] block ${textSecondaryClass}`}>
                {texts.directorTitle}
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="text-right shrink-0">
            {certQr ? (
              <div className="bg-white p-1 rounded-md shadow-md inline-block">
                <img src={certQr} alt="QR Code" className="w-14 h-14" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-white/20 rounded flex items-center justify-center text-[8px]">
                QR KOD
              </div>
            )}
            <span className={`text-[8px] font-mono-nums tracking-wider block mt-1 ${textSecondaryClass}`}>
              {formatDateAz(certData?.issueDate || completionDate)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible !important;
          }
          #certificate-print-area {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 2.5rem !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Sertifikatlar & Məzuniyyət
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono-nums">
              {certificates.length} Verilib
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            QR kodlu rəsmi məzuniyyət sertifikatlarının verilməsi, fərdi şablonların yüklənməsi və verifikasiya.
          </p>
        </div>

        {/* View toggle tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
          {canCreateCert && (
            <>
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'generate'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Sertifikat Ver</span>
              </button>

              <button
                onClick={() => setActiveTab('templates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'templates'
                    ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Şablon Yüklə ({customTemplates.length})</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{isStudent ? 'Sertifikatlarım' : `Arxiv (${certificates.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              activeTab === 'verify'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Yoxla (QR)</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GENERATE & LIVE PREVIEW                            */}
      {/* ========================================================= */}
      {activeTab === 'generate' && canCreateCert && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form & Template Controls (no-print) */}
          <div className="lg:col-span-4 space-y-5 no-print">
            {/* Mode Switcher: Single vs Bulk Group */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setGenerateMode('single')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  generateMode === 'single'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tək Tələbə</span>
              </button>
              <button
                type="button"
                onClick={() => setGenerateMode('bulk')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  generateMode === 'bulk'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bütün Qrup</span>
              </button>
            </div>

            {/* FORM 1: Single Student Mode */}
            {generateMode === 'single' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  Fərdi Sertifikat Parametrləri
                </h3>

                <form onSubmit={handleGenerateCertificate} className="space-y-4">
                  {/* Select Student */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Məzun Tələbə:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} · {s.courseName} ({s.groupName})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grade / Achievement */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Müvəffəqiyyət Dərəcəsi:
                    </label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Fərqlənmə ilə">Fərqlənmə ilə (With Honors)</option>
                      <option value="Müvəffəqiyyətlə">Müvəffəqiyyətlə (Success)</option>
                      <option value="İştirakçı">İştirakçı Sertifikatı (Attendance)</option>
                    </select>
                  </div>

                  {/* Language Mode Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Sertifikatın Dili:</span>
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLanguage('az')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          language === 'az'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        🇦🇿 Azərbaycanca
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          language === 'en'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('bilingual')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          language === 'bilingual'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        🌐 İkidilli (AZ/EN)
                      </button>
                    </div>
                  </div>

                  {/* Template Style Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Dizayn Şablonu:
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab('templates')}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Yeni Şablon Yüklə</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTemplateStyle('luxury')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          templateStyle === 'luxury'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        👑 Qızılı Prestij
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateStyle('modern')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          templateStyle === 'modern'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        🌿 Müasir Minimal
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateStyle('cyber')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          templateStyle === 'cyber'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        ⚡ Texno Kiber
                      </button>
                      <button
                        type="button"
                        onClick={() => setTemplateStyle('custom')}
                        className={`p-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                          templateStyle === 'custom'
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs ring-2 ring-indigo-300'
                            : 'border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        🖼️ Fərdi Şablon ({customTemplates.length})
                      </button>
                    </div>
                  </div>

                  {/* Custom Template Fine-Tuning Controls (When Custom is Selected) */}
                  {templateStyle === 'custom' && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                          Fərdi Şablon Tənzimləmələri
                        </span>
                        <select
                          value={selectedCustomTemplateId}
                          onChange={e => setSelectedCustomTemplateId(e.target.value)}
                          className="text-[11px] bg-white border border-indigo-200 rounded px-2 py-1 font-semibold text-indigo-900"
                        >
                          {customTemplates.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Text Color Theme */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Mətn Rəngi:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setCustomTextColorTheme('light')}
                            className={`p-1.5 rounded border text-center cursor-pointer ${
                              customTextColorTheme === 'light'
                                ? 'bg-slate-900 text-white font-bold border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            Açıq (Ağ)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomTextColorTheme('dark')}
                            className={`p-1.5 rounded border text-center cursor-pointer ${
                              customTextColorTheme === 'dark'
                                ? 'bg-slate-900 text-white font-bold border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            Tünd (Qara)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomTextColorTheme('gold')}
                            className={`p-1.5 rounded border text-center cursor-pointer ${
                              customTextColorTheme === 'gold'
                                ? 'bg-amber-500 text-white font-bold border-amber-600'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            Qızılı
                          </button>
                        </div>
                      </div>

                      {/* Border Style */}
                      <div>
                        <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Çərçivə:
                        </span>
                        <div className="grid grid-cols-4 gap-1 text-[10px]">
                          {(['none', 'gold', 'classic', 'modern'] as const).map(b => (
                            <button
                              key={b}
                              type="button"
                              onClick={() => setCustomBorderStyle(b)}
                              className={`p-1 rounded border text-center capitalize cursor-pointer ${
                                customBorderStyle === b
                                  ? 'bg-indigo-600 text-white font-bold border-indigo-600'
                                  : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              {b === 'none' ? 'Yoxdur' : b === 'gold' ? 'Qızılı' : b === 'classic' ? 'Klassik' : 'Müasir'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Overlay Darkness Slider */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-700 mb-1">
                          <span>Fon Qaraltması (Oxunaqlıq):</span>
                          <span className="font-bold text-indigo-700 font-mono-nums">{customOverlayDarkness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="60"
                          step="5"
                          value={customOverlayDarkness}
                          onChange={e => setCustomOverlayDarkness(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hours and Signatures */}
                  <div className="space-y-3 pt-1 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Tədris Həcmi (Akademik Saat):</span>
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={hoursCompleted}
                        onChange={e => setHoursCompleted(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono-nums"
                        placeholder="Məs: 72"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Təlimçi Adı:
                        </label>
                        <input
                          type="text"
                          value={instructorName}
                          onChange={e => setInstructorName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Direktor Adı:
                        </label>
                        <input
                          type="text"
                          value={directorName}
                          onChange={e => setDirectorName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Digital Signatures Upload (Optional PNG) */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="block font-medium text-slate-600 mb-1">Təlimçi İmzası (PNG):</span>
                        <input
                          type="file"
                          ref={trainerSigInputRef}
                          accept="image/*"
                          onChange={e => handleSignatureUpload('trainer', e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => trainerSigInputRef.current?.click()}
                          className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 truncate cursor-pointer text-left"
                        >
                          {trainerSignatureUrl ? '✓ İmza Yüklənib' : '+ Şəkil Seç'}
                        </button>
                      </div>

                      <div>
                        <span className="block font-medium text-slate-600 mb-1">Direktor İmzası (PNG):</span>
                        <input
                          type="file"
                          ref={directorSigInputRef}
                          accept="image/*"
                          onChange={e => handleSignatureUpload('director', e)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => directorSigInputRef.current?.click()}
                          className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 truncate cursor-pointer text-left"
                        >
                          {directorSignatureUrl ? '✓ İmza Yüklənib' : '+ Şəkil Seç'}
                        </button>
                      </div>
                    </div>

                    {/* Completion Date */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bitmə Tarixi:
                      </label>
                      <input
                        type="date"
                        value={completionDate}
                        onChange={e => setCompletionDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono-nums"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Sertifikatı Təsdiqlə və Reyestrə Yaz</span>
                  </button>
                </form>
              </div>
            )}

            {/* FORM 2: Bulk Group Mode */}
            {generateMode === 'bulk' && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Qrup Məzuniyyət Reyestri
                  </h3>
                  <span className="text-xs font-mono-nums text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                    {bulkGroupStudents.length} Tələbə
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Məzun Olan Qrupu Seçin:
                    </label>
                    <select
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} · {g.courseName} ({g.currentStudents} tələbə)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Template for Bulk */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Qrup Üçün Dizayn Şablonu:
                    </label>
                    <select
                      value={templateStyle}
                      onChange={e => setTemplateStyle(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="luxury">Qızılı Prestij (Standart)</option>
                      <option value="modern">Müasir Minimal</option>
                      <option value="cyber">Texno Kiber</option>
                      <option value="custom">Fərdi Yüklənmiş Şablon ({activeCustomTemplate?.name})</option>
                    </select>
                  </div>

                  {/* Students in Group list with grade selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Qrup Tələbələri və Qiymətlər:
                    </label>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                      {bulkGroupStudents.map(std => {
                        const currentVal = bulkGrades[std.id] || 'Müvəffəqiyyətlə';
                        return (
                          <div key={std.id} className="pt-1.5 flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900 truncate max-w-[140px]">
                              {std.fullName}
                            </span>
                            <select
                              value={currentVal}
                              onChange={e =>
                                setBulkGrades(prev => ({
                                  ...prev,
                                  [std.id]: e.target.value as any,
                                }))
                              }
                              className="text-[11px] bg-white border border-slate-300 rounded px-2 py-1 font-medium"
                            >
                              <option value="Fərqlənmə ilə">Fərqlənmə</option>
                              <option value="Müvəffəqiyyətlə">Müvəffəqiyyət</option>
                              <option value="İştirakçı">İştirakçı</option>
                            </select>
                          </div>
                        );
                      })}
                      {!bulkGroupStudents.length && (
                        <p className="text-xs text-slate-400 italic text-center py-3">
                          Bu qrupda tələbə yoxdur.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkIssue}
                    disabled={bulkIsIssuing || !bulkGroupStudents.length}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Award className="w-4 h-4 text-emerald-200" />
                    <span>
                      {bulkIsIssuing
                        ? 'Sertifikatlar hazırlanır...'
                        : `Bütün Qrupu Məzun Et (${bulkGroupStudents.length} Sertifikat)`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Certificate Canvas Preview */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Canlı Sertifikat Baxışı (A4 Landscape · Real-vaxt)
                </h3>
              </div>

              {/* Action Buttons: PNG, PDF, Print, Share */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => handleDownloadPng(previewCert)}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="Yüksək keyfiyyətli PNG şəkli kimi yüklə"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG Yüklə</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(previewCert)}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  title="A4 formatında rəsmi PDF yüklə"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>PDF Yüklə</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  title="A4 printerdə çap et"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Çap Et</span>
                </button>

                {previewCert && (
                  <button
                    onClick={() => setModalCert(previewCert)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                    title="Tam ekranda aç"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Rendered Certificate Canvas Container */}
            <div className="bg-slate-100/90 p-4 md:p-8 rounded-2xl border border-slate-300/80 overflow-x-auto shadow-inner flex justify-center">
              {renderCertificateCanvas(previewCert)}
            </div>

            {/* Information Card */}
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Hər bir sertifikat unikal <strong>AREA-2026</strong> nömrəsi və rəsmi doğrulama QR kodu ilə təmin edilir.
                </span>
              </div>
              <button
                onClick={() => setActiveTab('templates')}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2 shrink-0 cursor-pointer ml-2"
              >
                Şablon Yükləməyə Get →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TEMPLATES MANAGEMENT & UPLOAD (NEW!)              */}
      {/* ========================================================= */}
      {activeTab === 'templates' && canCreateCert && (
        <div className="space-y-6">
          {/* Upload Banner & Drag-and-Drop Area */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Yeni Sertifikat Şablonu Yüklə
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Akademiyanızın rəsmi blankını və ya fərdi dizayn edilmiş sertifikat fonunu (A4 Landscape · PNG, JPG, WebP) yükləyin.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kompüterdən Şəkil Seç</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleTemplateFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* If New Template Preview is Loaded */}
            {newTemplatePreview ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Thumbnail Preview */}
                  <div className="w-64 h-44 rounded-lg overflow-hidden border-2 border-indigo-500 shadow-md relative shrink-0">
                    <img
                      src={newTemplatePreview}
                      alt="Yeni Şablon Önbaxışı"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] bg-black/70 text-white font-mono">
                      Önbaxış
                    </span>
                  </div>

                  {/* Template Meta Form */}
                  <div className="flex-1 space-y-3 w-full">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Şablonun Adı:
                      </label>
                      <input
                        type="text"
                        value={newTemplateName}
                        onChange={e => setNewTemplateName(e.target.value)}
                        placeholder="Məs: 2026 Robototexnika Final Diplomu"
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block font-semibold text-slate-700 mb-1">Mətn Rəng Teması:</span>
                        <select
                          value={customTextColorTheme}
                          onChange={e => setCustomTextColorTheme(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
                        >
                          <option value="light">Açıq / Ağ (Tünd fonlar üçün)</option>
                          <option value="dark">Tünd / Qara (Açıq fonlar üçün)</option>
                          <option value="gold">Qızılı Prestij</option>
                        </select>
                      </div>

                      <div>
                        <span className="block font-semibold text-slate-700 mb-1">Çərçivə Rejimi:</span>
                        <select
                          value={customBorderStyle}
                          onChange={e => setCustomBorderStyle(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5"
                        >
                          <option value="none">Çərçivəsiz (Şəkildə artıq var)</option>
                          <option value="gold">Qoşa Qızılı Çərçivə</option>
                          <option value="classic">Tünd Klassik</option>
                          <option value="modern">Müasir Yaşıl</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveNewTemplate}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Şablonu Yadda Saxla və Əlavə Et</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setNewTemplatePreview('');
                          setNewTemplateName('');
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Ləğv Et
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20 rounded-xl p-8 text-center cursor-pointer transition-all space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">
                  Şəkil faylını buraya sürükləyin və ya klikləyib seçin
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tövsiyə olunan format: PNG və ya JPG, minimum 1920x1080 (A4 Landşaft nisbəti). Həcm: max 8MB.
                </p>
              </div>
            )}
          </div>

          {/* Existing Templates Library Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" />
                Mövcud Şablonlar Kitabxanası ({customTemplates.length + 3} Şablon)
              </h3>
              <span className="text-xs text-slate-500">
                Seçilmiş şablon sertifikat tərtibatında dərhal istifadə edilir.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Built-in Presets */}
              <div
                onClick={() => {
                  setTemplateStyle('luxury');
                  setActiveTab('generate');
                  showToast('Qızılı Prestij şablonu seçildi');
                }}
                className={`bg-white rounded-xl border p-4 shadow-xs hover:border-indigo-500 transition-all cursor-pointer relative ${
                  templateStyle === 'luxury' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'
                }`}
              >
                <div className="h-36 rounded-lg bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-400 p-3 flex flex-col justify-between text-white mb-3">
                  <div className="text-[9px] uppercase tracking-wider text-amber-400 font-bold">AREA ACADEMY</div>
                  <div className="text-center font-serif text-sm font-bold text-amber-200">Məzuniyyət Sertifikatı</div>
                  <div className="flex justify-between items-end text-[8px] text-slate-400">
                    <span>Qızılı Prestij</span>
                    <span>Standart</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Qızılı Prestij (Kral)</h4>
                    <span className="text-[10px] text-slate-500">Baza Təhlükəsiz Sistem Şablonu</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Sistem
                  </span>
                </div>
              </div>

              <div
                onClick={() => {
                  setTemplateStyle('modern');
                  setActiveTab('generate');
                  showToast('Müasir Minimal şablonu seçildi');
                }}
                className={`bg-white rounded-xl border p-4 shadow-xs hover:border-indigo-500 transition-all cursor-pointer relative ${
                  templateStyle === 'modern' ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'
                }`}
              >
                <div className="h-36 rounded-lg bg-white border-4 border-slate-200 border-l-emerald-600 p-3 flex flex-col justify-between text-slate-900 mb-3 shadow-2xs">
                  <div className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold">AREA ACADEMY</div>
                  <div className="text-center font-serif text-sm font-bold text-slate-900">Məzuniyyət Sertifikatı</div>
                  <div className="flex justify-between items-end text-[8px] text-slate-400">
                    <span>Müasir Minimal</span>
                    <span>Standart</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Müasir Minimal</h4>
                    <span className="text-[10px] text-slate-500">Açıq rəngli zümrüd zərifliyi</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Sistem
                  </span>
                </div>
              </div>

              {/* User Custom Uploaded Templates */}
              {customTemplates.map(tmpl => {
                const isSelected = templateStyle === 'custom' && selectedCustomTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    className={`bg-white rounded-xl border p-4 shadow-xs transition-all relative ${
                      isSelected ? 'ring-2 ring-indigo-600 border-indigo-600' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      style={{
                        backgroundImage: `url(${tmpl.backgroundUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                      className="h-36 rounded-lg border border-slate-300 p-3 flex flex-col justify-between relative overflow-hidden mb-3 shadow-2xs"
                    >
                      <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: (tmpl.overlayDarkness || 15) / 100 }}
                      />
                      <div className="relative z-10 text-[9px] uppercase tracking-wider text-amber-300 font-bold">
                        AREA ACADEMY
                      </div>
                      <div className="relative z-10 text-center font-serif text-sm font-bold text-white drop-shadow-sm">
                        {tmpl.name}
                      </div>
                      <div className="relative z-10 flex justify-between items-end text-[8px] text-white/90 font-mono-nums">
                        <span>{tmpl.textColorTheme === 'dark' ? 'Tünd Mətn' : 'Açıq Mətn'}</span>
                        <span>{tmpl.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{tmpl.name}</h4>
                        <span className="text-[10px] text-indigo-600 font-semibold block">Fərdi Yüklənmiş Şablon</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomTemplateId(tmpl.id);
                            setTemplateStyle('custom');
                            setActiveTab('generate');
                            showToast(`«${tmpl.name}» şablonu seçildi!`);
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors cursor-pointer"
                        >
                          İstifadə Et
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tmpl.id, tmpl.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Şablonu Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CERTIFICATE ARCHIVE & REGISTRY                     */}
      {/* ========================================================= */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tələbə adı, Sertifikat ID və ya kurs axtarın..."
                  value={archiveSearch}
                  onChange={e => setArchiveSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Group Filter */}
              <select
                value={archiveGroupFilter}
                onChange={e => setArchiveGroupFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="all">Bütün Qruplar</option>
                {distinctGroups.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Grade Filter */}
              <select
                value={archiveGradeFilter}
                onChange={e => setArchiveGradeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="all">Bütün Dərəcələr</option>
                <option value="Fərqlənmə ilə">Fərqlənmə ilə</option>
                <option value="Müvəffəqiyyətlə">Müvəffəqiyyətlə</option>
                <option value="İştirakçı">İştirakçı</option>
              </select>

              {/* CSV Export */}
              <button
                onClick={() =>
                  exportToCSV(
                    'AREA_Sertifikatlar_Reyestri',
                    displayCertificates.map(c => ({
                      SertifikatID: c.id,
                      Telebe: c.studentName,
                      Kurs: c.courseName,
                      Qrup: c.groupName,
                      Derece: c.grade,
                      Tarix: c.issueDate,
                      Link: c.verificationUrl,
                    }))
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {isStudent ? 'Sizə Təqdim Edilmiş Rəsmi Sertifikatlar' : 'Verilmiş Sertifikatların Rəsmi Reyestri'}
              </h3>
              <span className="text-xs text-slate-500 font-mono-nums font-semibold">
                Cəmi: {displayCertificates.length} sertifikat
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Sertifikat ID</th>
                    <th className="py-3 px-4">Tələbə</th>
                    <th className="py-3 px-4">Tədris Kursu</th>
                    <th className="py-3 px-4">Qrup</th>
                    <th className="py-3 px-4">Dərəcə</th>
                    <th className="py-3 px-4">Verilmə Tarixi</th>
                    <th className="py-3 px-4 text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayCertificates.map(cert => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono-nums font-bold text-indigo-600">
                        {cert.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{cert.studentName}</td>
                      <td className="py-3 px-4 text-slate-600">{cert.courseName}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono-nums">{cert.groupName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            cert.grade === 'Fərqlənmə ilə'
                              ? 'bg-amber-100 text-amber-800'
                              : cert.grade === 'Müvəffəqiyyətlə'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {cert.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono-nums text-slate-500">
                        {formatDateAz(cert.issueDate)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Modal */}
                          <button
                            onClick={() => setModalCert(cert)}
                            title="Tam Ekranda Bax"
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Print / Download Quick */}
                          <button
                            onClick={() => {
                              setModalCert(cert);
                            }}
                            title="Çap və ya PDF/PNG Yüklə"
                            className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* WhatsApp Share */}
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Salam! AREA Academy-də «${cert.courseName}» proqramı üzrə rəsmi sertifikatıma keçid: ${cert.verificationUrl}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            title="WhatsApp ilə göndər"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Verify Portal Link */}
                          <button
                            onClick={() => {
                              setVerifySearchId(cert.id);
                              handleVerify(cert.id);
                              setActiveTab('verify');
                            }}
                            title="Rəsmi Yoxlama"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!displayCertificates.length && (
                <div className="p-10 text-center space-y-2">
                  <Award className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    {isStudent
                      ? 'Adınıza hələ rəsmi sertifikat tərtib edilməyib. Kurs tamamlandıqdan sonra burada əks olunacaq.'
                      : 'Axtarışa uyğun sertifikat tapılmadı.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ONLINE VERIFICATION PORTAL                         */}
      {/* ========================================================= */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                AREA Sertifikat Həqiqiliyinin Yoxlanılması
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                İşəgötürənlər, tərəfdaşlar və tələbələr üçün rəsmi QR və ya Sertifikat ID ilə dərhal bazadan yoxlama.
              </p>
            </div>

            {/* Input & Search */}
            <div className="flex gap-2">
              <input
                type="text"
                value={verifySearchId}
                onChange={e => setVerifySearchId(e.target.value)}
                placeholder="Məsələn: AREA-2026-FE-104"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-xs text-slate-900 font-mono-nums uppercase focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleVerify(verifySearchId)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Yoxla</span>
              </button>
            </div>
          </div>

          {/* Verification Result Card */}
          {verifiedResult && (
            <div className="bg-white rounded-xl border-2 border-emerald-500 p-6 space-y-5 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Sertifikat Həqiqidir və Qüvvədədir
                    </h4>
                    <p className="text-xs text-slate-500">
                      AREA Academy rəsmi tədris bazasında təsdiq olunmuş elektron akkreditasiyadır.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalCert(verifiedResult)}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Sertifikata Bax</span>
                  </button>
                  <button
                    onClick={() => handleCopyLink(verifiedResult.verificationUrl)}
                    className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 px-2.5 py-1 rounded cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Linki Kopyala</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tələbənin Tam Adı:</span>
                  <strong className="text-slate-900 text-sm font-semibold">
                    {verifiedResult.studentName}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Sertifikat ID:</span>
                  <strong className="font-mono-nums text-indigo-600 text-sm">
                    {verifiedResult.id}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tədris Kursu:</span>
                  <span className="text-slate-800 font-medium">{verifiedResult.courseName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Nəticə / Dərəcə:</span>
                  <span className="text-emerald-700 font-semibold">{verifiedResult.grade}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Təsdiq Tarixi:</span>
                  <span className="font-mono-nums text-slate-700">
                    {formatDateAz(verifiedResult.issueDate)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tədris Mərkəzi:</span>
                  <span className="text-slate-800 font-medium">AREA Academy</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL CERTIFICATE MODAL PREVIEW                            */}
      {/* ========================================================= */}
      {modalCert && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-4xl w-full text-white shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Rəsmi Sertifikat Nüsxəsi · {modalCert.id}
                </h3>
              </div>
              <button
                onClick={() => setModalCert(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Render */}
            <div className="flex justify-center overflow-x-auto py-2">
              {renderCertificateCanvas(modalCert)}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPng(modalCert)}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>PNG Yüklə</span>
                </button>

                <button
                  onClick={() => handleDownloadPdf(modalCert)}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>PDF Yüklə</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>A4 Çap Et</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleCopyLink(modalCert.verificationUrl);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Linki Kopyala</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Salam! AREA Academy-də «${modalCert.courseName}» kursu üzrə sertifikatıma keçid: ${modalCert.verificationUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
