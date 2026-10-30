import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Phone,
  User,
  Users,
  GraduationCap,
  Building2,
  Calendar,
  Send,
  Search,
  Clock,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Lead } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface ParentRegistrationViewProps {
  onExitToCrm?: () => void;
  preselectedBranchId?: string;
}

export const ParentRegistrationView: React.FC<ParentRegistrationViewProps> = ({
  onExitToCrm,
  preselectedBranchId,
}) => {
  const { branches, curriculums, addLead, leads, showToast } = useCrm();

  const [activeTab, setActiveTab] = useState<'register' | 'track'>('register');

  // Registration Form State
  const [parentName, setParentName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [phone, setPhone] = useState('+994 ');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [interestedCourse, setInterestedCourse] = useState('');
  const [studentAge, setStudentAge] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success State after submission
  const [submittedLead, setSubmittedLead] = useState<Lead | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Tracking State
  const [trackingQuery, setTrackingQuery] = useState('');
  const [searchedResults, setSearchedResults] = useState<Lead[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);
  const [mySavedLeads, setMySavedLeads] = useState<Lead[]>(() => {
    try {
      const localSaved = localStorage.getItem('area_parent_my_leads');
      return localSaved ? JSON.parse(localSaved) : [];
    } catch {
      return [];
    }
  });

  // Default selections
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      if (preselectedBranchId && branches.some(b => b.id === preselectedBranchId)) {
        setSelectedBranchId(preselectedBranchId);
      } else {
        setSelectedBranchId(branches[0].id);
      }
    }
  }, [branches, preselectedBranchId, selectedBranchId]);

  useEffect(() => {
    if (curriculums.length > 0 && !interestedCourse) {
      setInterestedCourse(curriculums[0].courseName);
    }
  }, [curriculums, interestedCourse]);

  // Form submission handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentName.trim() || !studentName.trim() || !phone.trim() || phone.replace(/\D/g, '').length < 9) {
      showToast('Zəhmət olmasa adları və əlaqə nömrəsini tam daxil edin.', 'error');
      return;
    }

    setIsSubmitting(true);

    const targetBranch = branches.find(b => b.id === selectedBranchId) || branches[0];
    const generatedAppCode = `AREA-LID-${Math.floor(1000 + Math.random() * 9000)}`;

    const combinedNotes = [
      studentAge ? `Yaş/Təhsil: ${studentAge}` : '',
      notes.trim() ? `Valideyn qeydi: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    try {
      const created = addLead({
        fullName: studentName.trim(),
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        phone: phone.trim(),
        applicationCode: generatedAppCode,
        interestedCourse: interestedCourse || 'Robototexnika və Mühəndislik',
        branchId: targetBranch?.id,
        branchName: targetBranch?.name,
        source: 'Onlayn Qeydiyyat Portalı',
        stage: 'yeni',
        notes: combinedNotes || 'Valideyn onlayn qeydiyyat portalından müraciət edib.',
        assignedManager: 'Qəbul Şöbəsi',
      });

      setSubmittedLead(created);
      setIsSubmitting(false);

      try {
        const localSaved = localStorage.getItem('area_parent_my_leads');
        const list: Lead[] = localSaved ? JSON.parse(localSaved) : [];
        const updatedList = [created, ...list.filter(x => x.applicationCode !== created.applicationCode)];
        localStorage.setItem('area_parent_my_leads', JSON.stringify(updatedList.slice(0, 10)));
        setMySavedLeads(updatedList);
      } catch (e) {
        console.warn('Saving to local storage error:', e);
      }

      showToast('Müraciətiniz qəbul edildi!');
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      showToast('Müraciət göndərilərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.', 'error');
    }
  };

  // Tracking Search - Checks local context, localStorage, and Firestore directly
  const handleSearchTracking = async (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    const query = (directCode || trackingQuery).trim().toLowerCase();
    if (!query) return;

    setIsSearchingDoc(true);
    setHasSearched(true);

    const queryDigits = query.replace(/\D/g, '');
    const foundMap = new Map<string, Lead>();

    // 1. Search in memory leads from useCrm
    leads.forEach(l => {
      const matchCode = l.applicationCode && l.applicationCode.toLowerCase().includes(query);
      const leadPhoneDigits = (l.phone || '').replace(/\D/g, '');
      const matchPhone = queryDigits.length >= 7 && leadPhoneDigits.includes(queryDigits);
      if (matchCode || matchPhone) {
        foundMap.set(l.applicationCode || l.id, l);
      }
    });

    // 2. Search in localStorage saved leads on this device
    try {
      const localSaved = localStorage.getItem('area_parent_my_leads');
      if (localSaved) {
        const list: Lead[] = JSON.parse(localSaved);
        list.forEach(l => {
          const matchCode = l.applicationCode && l.applicationCode.toLowerCase().includes(query);
          const leadPhoneDigits = (l.phone || '').replace(/\D/g, '');
          const matchPhone = queryDigits.length >= 7 && leadPhoneDigits.includes(queryDigits);
          if (matchCode || matchPhone) {
            foundMap.set(l.applicationCode || l.id, l);
          }
        });
      }
    } catch (err) {
      console.warn(err);
    }

    // 3. Direct Firestore document query (works for public users without full leads list)
    try {
      const upperQuery = query.toUpperCase();
      const directLeadSnap = await getDoc(doc(db, 'leads', upperQuery));
      if (directLeadSnap.exists()) {
        const data = directLeadSnap.data() as Lead;
        foundMap.set(data.applicationCode || data.id, data);
      }

      // Check phone lookup in lead_lookups
      if (queryDigits.length >= 7) {
        const lookupVariants = [
          queryDigits,
          queryDigits.startsWith('994') ? queryDigits.slice(3) : `994${queryDigits.replace(/^0/, '')}`,
          queryDigits.replace(/^0/, ''),
        ];

        for (const variant of lookupVariants) {
          try {
            const lookupSnap = await getDoc(doc(db, 'lead_lookups', variant));
            if (lookupSnap.exists()) {
              const lookupData = lookupSnap.data();
              if (lookupData?.applicationCode) {
                const leadSnap = await getDoc(doc(db, 'leads', lookupData.applicationCode));
                if (leadSnap.exists()) {
                  const data = leadSnap.data() as Lead;
                  foundMap.set(data.applicationCode || data.id, data);
                }
              }
            }
          } catch (err) {
            console.warn('Lookup check error:', err);
          }
        }
      }
    } catch (err) {
      console.warn('Firestore direct search error:', err);
    }

    const finalResults = Array.from(foundMap.values());
    setSearchedResults(finalResults);
    setIsSearchingDoc(false);

    // Update localStorage with fresh status
    if (finalResults.length > 0) {
      try {
        const localSaved = localStorage.getItem('area_parent_my_leads');
        const existing: Lead[] = localSaved ? JSON.parse(localSaved) : [];
        const merged = [...finalResults];
        existing.forEach(ex => {
          if (!merged.some(m => m.applicationCode === ex.applicationCode)) {
            merged.push(ex);
          }
        });
        localStorage.setItem('area_parent_my_leads', JSON.stringify(merged.slice(0, 10)));
        setMySavedLeads(merged);
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'yeni':
        return {
          title: 'Yeni Müraciət (Baxışdadır)',
          desc: 'Müraciətiniz qəbul edilib. Menecerimiz qısa zamanda əlaqə saxlayacaq.',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          dot: 'bg-indigo-500',
        };
      case 'elaqe_saxlanildi':
        return {
          title: 'Əlaqə Saxlanıldı',
          desc: 'Tədris proqramı, dərslərin saatları və ödəniş şərtləri haqqında məlumat təqdim olunub.',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'sinaq_dersi':
        return {
          title: 'Sınaq Dərsi Təyin Edildi',
          desc: 'Övladınız ödənişsiz sınaq dərsinə dəvət olunub. Dərs vaxtı qeyd edilib.',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
        };
      case 'gozleyir':
        return {
          title: 'Qərar Gözlənilir',
          desc: 'Sınaq dərsindən sonra valideynin yekun rəyi və qrup saatlarının uyğunlaşdırılması.',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
        };
      case 'qeydiyyat':
        return {
          title: 'Təbriklər! Qrupa Qəbul Edildi',
          desc: 'Övladınız rəsmi olaraq AREA Akademiyasının tələbəsi oldu və qrupa daxil edildi.',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
          dot: 'bg-emerald-500',
        };
      case 'imtina':
        return {
          title: 'Müraciət Arxivləndi',
          desc: 'Bu müraciət üzrə proses yekunlaşıb və ya qeydiyyat təxirə salınıb.',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
        };
      default:
        return {
          title: 'İcrada',
          desc: 'Müraciətiniz üzrə iş gedir.',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Brand Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base text-white">AREA</span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  Akademiya
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Azərbaycan Robototexnika və Mühəndislik Akademiyası
              </p>
            </div>
          </div>

          {onExitToCrm && (
            <button
              onClick={onExitToCrm}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CRM Panelə Qayıt</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Banner Section */}
        <div className="text-center space-y-2 pt-2 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Valideyn və Tələbə Qeydiyyat Portalı
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Övladınızın gələcəyin ən perspektivli sahələrinə — Robototexnika, Proqramlaşdırma və Mühəndisliyə ilk addımını atması üçün formu doldurun.
          </p>

          {/* Navigation Pill Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Yeni Müraciət Göndər</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Müraciəti İzlə</span>
            </button>
          </div>
        </div>

        {/* TAB 1: REGISTRATION FORM */}
        {activeTab === 'register' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            {!submittedLead ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Qeydiyyat Forması</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Bütün sahələr vacibdir</span>
                </div>

                {/* Parent & Child Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Valideynin Adı və Soyadı: <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="məs: Leyla Əliyeva"
                        value={parentName}
                        onChange={e => setParentName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Övladınızın (Tələbənin) Adı və Soyadı: <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="məs: Murad Əliyev"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone & Child Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Əlaqə Telefonu (WhatsApp aktiv olan): <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+994 50 123 45 67"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 font-mono-nums focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Menecerimiz bu nömrə ilə əlaqə saxlayacaq.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Uşağın Yaşı və ya Sinfi (İstəyə görə):
                    </label>
                    <input
                      type="text"
                      placeholder="məs: 9 yaş, 4-cü sinif"
                      value={studentAge}
                      onChange={e => setStudentAge(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Branch & Course Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Sizə Uyğun Filial: <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={selectedBranchId}
                        onChange={e => setSelectedBranchId(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                            {b.name} ({b.address})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Maraqlandığınız Tədris Proqramı: <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={interestedCourse}
                        onChange={e => setInterestedCourse(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
                      >
                        {curriculums.map(c => (
                          <option key={c.id} value={c.courseName} className="bg-slate-900 text-slate-200">
                            {c.courseName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Xüsusi İstək və ya Qeyd (İstəyə görə):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Məsələn: Dərslərin həftəsonu və ya günortadan sonra olması arzuolunandır..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                </div>

                {/* Privacy Guarantee Note */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <strong>Məxfilik Təminatı:</strong> Daxil etdiyiniz məlumatlar tam qorunur və heç bir kənar şəxsə göstərilmir. Qeydiyyatdan sonra sizə xüsusi müraciət kodu təqdim olunacaq və yalnız siz öz müraciətinizin statusunu izləyə biləcəksiniz.
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Qeydiyyat Göndərilir...' : 'Müraciəti Göndər və Qeydiyyatdan Keç'}</span>
                </button>
              </form>
            ) : (
              /* Confirmation Screen After Successful Submission */
              <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                    Müraciətiniz Uğurla Qəbul Edildi!
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Təşəkkür edirik, {submittedLead.parentName || 'Hörmətli Valideyn'}!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    «{submittedLead.studentName || submittedLead.fullName}» üçün «{submittedLead.interestedCourse}» proqramı üzrə sorğunuz qəbul şöbəsinə yönləndirildi.
                  </p>
                </div>

                {/* Application Code Box */}
                <div className="bg-slate-950 border-2 border-indigo-500/40 rounded-2xl p-4 max-w-md mx-auto space-y-2">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Fərdi Müraciət Kodunuz:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-mono font-black text-indigo-400 tracking-wider">
                      {submittedLead.applicationCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(submittedLead.applicationCode || '')}
                      title="Kodu kopyala"
                      className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Bu kodu və ya telefon nömrənizi «Müraciəti İzlə» bölməsində yazaraq nəticəni istənilən vaxt yoxlaya bilərsiniz.
                  </p>
                </div>

                {/* WhatsApp Notification Button */}
                {(() => {
                  const centerPhone = '994501234567';
                  const waText = encodeURIComponent(
                    `Salam! Mən AREA Tədris Mərkəzinin onlayn portalından övladım «${submittedLead.studentName || submittedLead.fullName}» üçün qeydiyyatdan keçdim.\nMüraciət Kodu: ${submittedLead.applicationCode}\nKurs: ${submittedLead.interestedCourse}\nFilial: ${submittedLead.branchName || 'Əsas'}\nZəhmət olmasa sınaq dərsi vaxtı barədə məlumat verəsiniz.`
                  );
                  const waUrl = `https://wa.me/${centerPhone}?text=${waText}`;

                  return (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Mərkəzə WhatsApp ilə Bildir</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('track');
                          setTrackingQuery(submittedLead.applicationCode || '');
                          setSearchedResults([submittedLead]);
                          setHasSearched(true);
                        }}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Search className="w-4 h-4" />
                        <span>Müraciətin Statusunu İzlə</span>
                      </button>
                    </div>
                  );
                })()}

                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedLead(null);
                      setParentName('');
                      setStudentName('');
                      setNotes('');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
                  >
                    + Başqa bir övladınız üçün yeni müraciət göndərin
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: APPLICATION STATUS CHECKER */}
        {activeTab === 'track' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-sm">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Müraciət Statusunu Yoxla</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Yalnız sizə aid olan müraciəti görmək üçün qeydiyyat zamanı verilmiş <strong>Müraciət Kodunu</strong> və ya <strong>Telefon nömrənizi</strong> daxil edin.
              </p>
            </div>

            {/* Search Input Box */}
            <form onSubmit={handleSearchTracking} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="məs: AREA-LID-1234 və ya 050 123 45 67"
                  value={trackingQuery}
                  onChange={e => setTrackingQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono-nums"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingDoc}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSearchingDoc ? 'Yoxlanılır...' : 'Yoxla'}
              </button>
            </form>

            {/* Quick access to locally saved submissions */}
            {!hasSearched && mySavedLeads.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Bu cihazdan qeydiyyatdan keçirilmiş müraciətlər ({mySavedLeads.length}):
                  </span>
                  <span className="text-[10px] text-slate-500">Məxfi yalnız sizə görünür</span>
                </div>
                <div className="space-y-2">
                  {mySavedLeads.map(item => (
                    <div
                      key={item.applicationCode || item.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/60">
                            #{item.applicationCode}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            {item.studentName || item.fullName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Kurs: {item.interestedCourse} · Filial: {item.branchName || 'Əsas'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingQuery(item.applicationCode || '');
                          handleSearchTracking(undefined, item.applicationCode);
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>Canlı Status</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Section */}
            {hasSearched && (
              <div className="space-y-4 pt-2">
                {searchedResults && searchedResults.length > 0 ? (
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-400 block">
                      Tapılan Müraciətiniz ({searchedResults.length}):
                    </span>

                    {searchedResults.map(lead => {
                      const badge = getStageBadge(lead.stage);

                      return (
                        <div
                          key={lead.id}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs text-indigo-400 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/60">
                                  #{lead.applicationCode || lead.id.slice(-6)}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Tarix: {formatDateAz(lead.createdAt)}
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white mt-1">
                                {lead.studentName || lead.fullName}
                              </h4>
                              {lead.parentName && (
                                <p className="text-xs text-slate-400">
                                  Valideyn: <span className="text-slate-200">{lead.parentName}</span>
                                </p>
                              )}
                            </div>

                            <div className="text-left sm:text-right">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${badge.color}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                                <span>{badge.title}</span>
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                            <div>
                              <span className="text-slate-500 block text-[10px]">Tədris Proqramı:</span>
                              <span className="font-semibold text-slate-200">{lead.interestedCourse}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Filial:</span>
                              <span className="font-semibold text-slate-200">{lead.branchName || 'Əsas Filial'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[10px]">Məsul Şöbə:</span>
                              <span className="font-semibold text-slate-200">{lead.assignedManager}</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 text-xs text-indigo-200 flex items-start gap-2">
                            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed">{badge.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <h5 className="text-sm font-bold text-white">Müraciət Tapılmadı</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Daxil etdiyiniz «{trackingQuery}» üzrə aktiv qeydiyyat tapılmadı. Zəhmət olmasa nömrənizi və ya kodu düzgün daxil etdiyinizdən əmin olun.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} AREA — Azərbaycan Robototexnika Mühəndislik Akademiyası.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Robototexnika</span>
            <span>·</span>
            <span>Proqramlaşdırma</span>
            <span>·</span>
            <span>Dron Mühəndisliyi</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
