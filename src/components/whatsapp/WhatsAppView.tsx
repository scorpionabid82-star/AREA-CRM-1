import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  AlertCircle,
  Gift,
  Calendar,
  Award,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Student } from '../../types/crm';
import { formatAZN } from '../../utils/formatters';

export const WhatsAppView: React.FC = () => {
  const { students, showToast, setActiveTab, can } = useCrm();

  const [templateType, setTemplateType] = useState<'debt' | 'birthday' | 'schedule' | 'certificate'>('debt');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students.find(s => s.balance < 0)?.id || students[0]?.id || ''
  );
  const [customMessage, setCustomMessage] = useState<string>('');

  const currentStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const debtStudents = students.filter(s => s.balance < 0);

  // Generate dynamic message text based on template
  const getRenderedMessage = (student?: Student) => {
    if (customMessage.trim()) return customMessage;
    if (!student) {
      return 'Bildiriş göndərmək üçün sistemdə heç bir tələbə qeydiyyatdan keçməyib.';
    }

    switch (templateType) {
      case 'debt':
        return `Salam hörmətli ${student.fullName}! AREA Academy-dən bildiririk ki, "${student.groupName}" qrupu üzrə cari ay üçün ${Math.abs(student.balance)} AZN məbləğində ödəniş borcunuz mövcuddur. Zəhmət olmasa yaxın günlərdə ödənişi təsdiqləməyiniz xahiş olunur. Təşəkkür edirik!`;
      case 'birthday':
        return `Əziz ${student.fullName}! AREA Academy ailəsi olaraq Sizi doğum gününüz münasibətilə səmimi qəlbdən təbrik edirik! Sizə təhsilinizdə və gələcək peşəkar karyeranızda böyük uğurlar arzulayırıq! 🎉🎂`;
      case 'schedule':
        return `Hörmətli ${student.fullName}! "${student.groupName}" qrupumuzun növbəti dərsi cədvələ uyğun olaraq saat 19:00-da mərkəzimizdə baş tutacaqdır. Dərsə vaxtında qatılmağınız xahiş olunur.`;
      case 'certificate':
        return `Təbriklər ${student.fullName}! "${student.courseName}" proqramını uğurla başa vurduğunuz üçün rəsmi QR təsdiqli sertifikatınız hazırlanmışdır. Sertifikatınızı mərkəzimizdən və ya onlayn link vasitəsilə əldə edə bilərsiniz! 🎓`;
      default:
        return '';
    }
  };

  const renderedText = getRenderedMessage(currentStudent);

  // Clean phone number for wa.me (remove spaces, +, etc.)
  const cleanPhone = (phoneStr: string) => {
    return phoneStr.replace(/\D/g, '');
  };

  const handleSendWhatsApp = (phone: string, text: string) => {
    if (!phone) {
      showToast('Tələbənin əlaqə nömrəsi qeyd olunmayıb', 'error');
      return;
    }
    const cleaned = cleanPhone(phone);
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    showToast(`WhatsApp mesaj pəncərəsi açıldı: ${cleaned}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              WhatsApp
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fərdi və qrup bildirişləri, borc xatırlatması və ad günü təbrikləri.
          </p>
        </div>

        {debtStudents.length > 0 && (
          <div className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{debtStudents.length} Borclu Tələbə</span>
          </div>
        )}
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Sistemdə Qeydiyyatlı Tələbə Yoxdur</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              WhatsApp bildirişləri, borc xatırlatmaları və ad günü təbrikləri göndərmək üçün əvvəlcə tələbə qeydiyyatdan keçməlidir.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('students')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Tələbələr Bölməsinə Keç</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selection & Controls */}
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                Bildiriş Şablonu
              </h3>

              {/* Template options */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setTemplateType('debt');
                    setCustomMessage('');
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    templateType === 'debt'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs">Borc Xatırlatması</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Aylıq ödəniş gecikməsi
                  </p>
                </button>

                <button
                  onClick={() => {
                    setTemplateType('birthday');
                    setCustomMessage('');
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    templateType === 'birthday'
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs">Ad Günü Təbriki</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Tələbələrə bayram mesajı
                  </p>
                </button>

                <button
                  onClick={() => {
                    setTemplateType('schedule');
                    setCustomMessage('');
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    templateType === 'schedule'
                      ? 'border-blue-500 bg-blue-50/70 text-blue-950 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-xs">Dərs Cədvəli</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Dərsin vaxtı və dəyişiklik bildirişi
                  </p>
                </button>

                <button
                  onClick={() => {
                    setTemplateType('certificate');
                    setCustomMessage('');
                  }}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    templateType === 'certificate'
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs">Sertifikat Bildirişi</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">
                    Məzun tələbəyə sertifikat hazırlandı xəbəri
                  </p>
                </button>
              </div>

              {/* Target student selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alıcı Tələbəni Seçin:
                </label>
                <select
                  value={selectedStudentId || currentStudent?.id || ''}
                  onChange={e => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                >
                  {templateType === 'debt' && debtStudents.length > 0 ? (
                    <optgroup label="Borclu Tələbələr">
                      {debtStudents.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} · Borc: {Math.abs(s.balance)} ₼ ({s.phone})
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  <optgroup label="Bütün Tələbələr">
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.groupName}) · {s.phone}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Message edit box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mesaj Mətni {!can('edit', 'whatsapp') && '(Yalnız baxış)'}:
                </label>
                <textarea
                  rows={4}
                  value={customMessage || renderedText}
                  onChange={e => setCustomMessage(e.target.value)}
                  disabled={!can('edit', 'whatsapp')}
                  className={`w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-indigo-500 ${
                    !can('edit', 'whatsapp') ? 'opacity-75 cursor-not-allowed bg-slate-100' : ''
                  }`}
                />
              </div>

              <button
                onClick={() => handleSendWhatsApp(currentStudent?.phone || '', renderedText)}
                disabled={!can('create', 'whatsapp')}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                  !can('create', 'whatsapp')
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={!can('create', 'whatsapp') ? 'WhatsApp bildirişi göndərmək səlahiyyətiniz yoxdur' : undefined}
              >
                <Send className="w-4 h-4" />
                <span>
                  {!can('create', 'whatsapp')
                    ? 'Göndərmə Səlahiyyəti Yoxdur'
                    : `WhatsApp ilə Göndər (${currentStudent?.phone || 'Seçilməyib'})`}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: Live WhatsApp Chat Simulation */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#EFEAE2] rounded-2xl border border-slate-300 overflow-hidden shadow-sm flex flex-col h-[460px]">
              {/* WhatsApp Header */}
              <div className="bg-[#005C4B] text-white px-4 py-3 flex items-center justify-between shadow">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                    {currentStudent?.fullName ? currentStudent.fullName.substring(0, 2) : 'AA'}
                  </div>
                  <div>
                    <p className="font-bold text-xs">{currentStudent?.fullName || 'Tələbə Seçilməyib'}</p>
                    <p className="text-[10px] text-emerald-200 font-mono-nums">
                      {currentStudent?.phone || 'Nömrə yoxdur'} · Online
                    </p>
                  </div>
                </div>

                <span className="text-[11px] text-emerald-200">AREA Academy CRM</span>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 flex flex-col justify-end">
                <div className="text-center">
                  <span className="text-[10px] bg-white/80 text-slate-600 px-2 py-0.5 rounded shadow-2xs font-mono-nums">
                    Bugün
                  </span>
                </div>

                {/* Message Bubble */}
                <div className="self-end max-w-[85%] bg-[#D9FDD3] text-slate-800 rounded-xl rounded-tr-xs p-3 shadow-2xs space-y-1.5 text-xs">
                  <p className="leading-relaxed whitespace-pre-wrap">{renderedText}</p>
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500 font-mono-nums">
                    <span>14:32</span>
                    <CheckCircle2 className="w-3 h-3 text-sky-600" />
                  </div>
                </div>
              </div>

              {/* Chat Footer */}
              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate">
                  Mesaj hazırlandı · Göndərmək üçün sol paneldəki düyməni sıxın
                </span>
                <button
                  onClick={() => handleSendWhatsApp(currentStudent?.phone || '', renderedText)}
                  className="text-emerald-700 hover:text-emerald-800 font-bold ml-2 shrink-0 flex items-center gap-1"
                >
                  Göndər <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
