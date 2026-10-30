import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Users,
  CheckSquare,
  GraduationCap,
  UserCheck,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Award,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  FileCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { AttendanceStatus } from '../../types/crm';
import { exportToCSV, formatDateAz } from '../../utils/formatters';
import {
  WEEKDAYS,
  SCHEDULE_PRESETS,
  parseScheduleDays,
  buildScheduleString,
  generateGroupLessonDates,
  formatYearMonthAz
} from '../../utils/scheduleHelper';

export const AttendanceView: React.FC = () => {
  const {
    groups,
    students,
    studentAttendance,
    recordStudentAttendance,
    bulkRecordAttendance,
    lessonSessions,
    submitLessonSession,
    approveLessonSession,
    rejectLessonSession,
    updateGroup,
    currentRole,
    currentUser,
    showToast,
    can,
  } = useCrm();

  const isStudent = currentRole === 'sagird';
  const isTrainer = currentRole === 'telimci';
  const isCoordinator =
    currentUser?.role === 'direktor' ||
    currentUser?.role === 'menecer' ||
    currentRole === 'direktor' ||
    currentRole === 'menecer';
  const canEditAttendance = can('edit', 'attendance') || can('create', 'attendance');

  // Find linked student record if logged in as student
  const studentRecord = isStudent
    ? students.find(
        s =>
          s.id === currentUser?.linkedEntityId ||
          s.fullName.toLowerCase() === currentUser?.fullName.toLowerCase() ||
          s.email.toLowerCase() === currentUser?.email.toLowerCase()
      ) || students[0]
    : null;

  // Filter groups: Trainer only sees their groups; Student only sees their enrolled group
  const accessibleGroups = isTrainer
    ? groups.filter(
        g =>
          g.trainerName.toLowerCase().includes(currentUser?.fullName.toLowerCase() || '') ||
          g.trainerId === currentUser?.linkedEntityId
      )
    : isStudent && studentRecord
    ? groups.filter(g => g.id === studentRecord.groupId)
    : groups;

  const currentGroupsList = accessibleGroups.length ? accessibleGroups : groups;

  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    isStudent && studentRecord
      ? studentRecord.groupId
      : currentGroupsList[0]?.id || groups[0]?.id || ''
  );

  const [subTab, setSubTab] = useState<'journal' | 'approvals'>('journal');
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>('');
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectionModalSessionId, setRejectionModalSessionId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentYearMonth = useMemo(() => todayStr.slice(0, 7), [todayStr]);
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(currentYearMonth);

  const currentGroup =
    currentGroupsList.find(g => g.id === selectedGroupId) || currentGroupsList[0] || groups[0];
  const allGroupStudents = students.filter(s => s.groupId === currentGroup?.id);

  // If student, display their own record or group
  const groupStudents = isStudent && studentRecord
    ? allGroupStudents.filter(s => s.id === studentRecord.id)
    : allGroupStudents;

  // Active lesson days of the group (or parsed from schedule)
  const activeLessonDays = useMemo(() => {
    if (currentGroup?.lessonDays && currentGroup.lessonDays.length > 0) {
      return currentGroup.lessonDays;
    }
    return parseScheduleDays(currentGroup?.schedule);
  }, [currentGroup?.lessonDays, currentGroup?.schedule]);

  // Dynamic lesson dates generated for the selected month starting from group's startDate
  const lessonDates = useMemo(() => {
    if (!currentGroup) return [];
    return generateGroupLessonDates(
      currentGroup.startDate,
      currentGroup.endDate,
      activeLessonDays,
      selectedYearMonth
    );
  }, [currentGroup?.startDate, currentGroup?.endDate, activeLessonDays, selectedYearMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    const [y, m] = selectedYearMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedYearMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedYearMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newY = nextDate.getFullYear();
    const newM = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedYearMonth(`${newY}-${newM}`);
  };

  const handleCurrentMonth = () => {
    setSelectedYearMonth(currentYearMonth);
  };

  // Update group's lesson days directly from AttendanceView
  const handleUpdateGroupDays = (newDays: number[]) => {
    if (!currentGroup) return;
    const sTime = currentGroup.lessonStartTime || '19:00';
    const eTime = currentGroup.lessonEndTime || '21:00';
    const newSchedule = buildScheduleString(newDays, sTime, eTime);

    updateGroup(currentGroup.id, {
      lessonDays: newDays,
      schedule: newSchedule,
    });
    showToast(`"${currentGroup.name}" qrupunun dərs günləri yeniləndi`);
  };

  // Helper to find attendance status
  const getStatus = (studentId: string, date: string): AttendanceStatus | 'none' => {
    const rec = studentAttendance.find(a => a.studentId === studentId && a.date === date);
    return rec ? rec.status : 'none';
  };

  // Mathematical percentage calculation based on actual monthly lesson count
  const calculateStudentRate = (studentId: string): number => {
    if (lessonDates.length === 0) {
      const foundStd = students.find(s => s.id === studentId);
      return foundStd?.attendanceRate || 100;
    }

    let score = 0;
    let anyRecorded = false;
    lessonDates.forEach(date => {
      const st = getStatus(studentId, date);
      if (st !== 'none') {
        anyRecorded = true;
        if (st === 'present') score += 1;
        else if (st === 'late') score += 0.8;
        else if (st === 'excused') score += 1;
      }
    });

    if (!anyRecorded) {
      const foundStd = students.find(s => s.id === studentId);
      return foundStd?.attendanceRate || 100;
    }

    return Math.min(100, Math.round((score / lessonDates.length) * 100));
  };

  // Toggle status cycle
  const toggleAttendance = (studentId: string, studentName: string, date: string) => {
    const current = getStatus(studentId, date);
    let next: AttendanceStatus = 'present';
    if (current === 'present') next = 'late';
    else if (current === 'late') next = 'absent';
    else if (current === 'absent') next = 'excused';
    else if (current === 'excused') next = 'present';

    if (!currentGroup) return;

    recordStudentAttendance({
      studentId,
      studentName,
      groupId: currentGroup.id,
      date,
      status: next,
    });
  };

  // Mark all students present for a specific date
  const handleMarkAllPresentForDate = (targetDate: string) => {
    if (!currentGroup || groupStudents.length === 0) return;
    const records = groupStudents.map(s => ({
      studentId: s.id,
      studentName: s.fullName,
      groupId: currentGroup.id,
      date: targetDate,
      status: 'present' as AttendanceStatus,
    }));
    bulkRecordAttendance(records);
    showToast(`${targetDate} dərsi üçün bütün tələbələr iştirak etdi qeyd olundu`);
  };

  // Short month label helper
  const getMonthShortAz = (mStr: string) => {
    const map: Record<string, string> = {
      '01': 'Yan',
      '02': 'Fev',
      '03': 'Mar',
      '04': 'Apr',
      '05': 'May',
      '06': 'İyn',
      '07': 'İyl',
      '08': 'Avq',
      '09': 'Sen',
      '10': 'Okt',
      '11': 'Noy',
      '12': 'Dek',
    };
    return map[mStr] || mStr;
  };

  // Weekday short label helper
  const getDayOfWeekShort = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const wId = dt.getDay();
    return WEEKDAYS.find(w => w.id === wId)?.short || '';
  };

  // Determine target date for general "Hamı İştirak" button
  const effectiveMarkDate = useMemo(() => {
    if (lessonDates.includes(todayStr)) return todayStr;
    // Otherwise pick the nearest or first lesson date in month
    return lessonDates[0] || todayStr;
  }, [lessonDates, todayStr]);

  const activeSessionDate = selectedSessionDate || effectiveMarkDate;

  // Attended students count on activeSessionDate (present or late)
  const attendedStudentsCount = useMemo(() => {
    return groupStudents.filter(s => {
      const st = getStatus(s.id, activeSessionDate);
      return st === 'present' || st === 'late';
    }).length;
  }, [groupStudents, activeSessionDate, studentAttendance]);

  const basePayPerLesson = currentGroup?.trainerPayPerLesson ?? 15;
  const bonusRateOver6 = currentGroup?.bonusPerStudentOver6 ?? 2;
  const bonusStudentsCount = Math.max(0, attendedStudentsCount - 6);
  const calculatedBonusPay = bonusStudentsCount * bonusRateOver6;
  const calculatedTotalPay = basePayPerLesson + calculatedBonusPay;

  const currentLessonSession = useMemo(() => {
    if (!currentGroup || !activeSessionDate) return null;
    return lessonSessions.find(s => s.groupId === currentGroup.id && s.date === activeSessionDate) || null;
  }, [lessonSessions, currentGroup?.id, activeSessionDate]);

  const pendingApprovalsCount = useMemo(() => {
    return lessonSessions.filter(s => s.status === 'pending_approval').length;
  }, [lessonSessions]);

  const handleSubmitActiveSession = () => {
    if (!currentGroup || !activeSessionDate) return;
    const records = groupStudents.map(s => ({
      studentId: s.id,
      studentName: s.fullName,
      groupId: currentGroup.id,
      date: activeSessionDate,
      status: (getStatus(s.id, activeSessionDate) === 'none' ? 'absent' : getStatus(s.id, activeSessionDate)) as AttendanceStatus,
    }));

    submitLessonSession(
      {
        groupId: currentGroup.id,
        groupName: currentGroup.name,
        courseName: currentGroup.courseName,
        trainerId: currentGroup.trainerId,
        trainerName: currentGroup.trainerName,
        branchId: currentGroup.branchId,
        branchName: currentGroup.branchName,
        date: activeSessionDate,
        totalStudents: groupStudents.length,
        attendedCount: attendedStudentsCount,
        basePay: basePayPerLesson,
        bonusPerStudentOver6: bonusRateOver6,
        bonusPay: calculatedBonusPay,
        totalCalculatedPay: calculatedTotalPay,
      },
      records
    );
  };

  const handleConfirmRejection = () => {
    if (!rejectionModalSessionId) return;
    rejectLessonSession(rejectionModalSessionId, rejectionReasonText.trim() || undefined);
    setRejectionModalSessionId(null);
    setRejectionReasonText('');
  };

  const filteredApprovals = useMemo(() => {
    return lessonSessions.filter(s => {
      if (approvalStatusFilter === 'pending') return s.status === 'pending_approval';
      if (approvalStatusFilter === 'approved') return s.status === 'approved';
      if (approvalStatusFilter === 'rejected') return s.status === 'rejected';
      return true;
    }).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }, [lessonSessions, approvalStatusFilter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header with SubTabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Davamiyyət və Dərs Təsdiqi
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono-nums">
              {currentGroup?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Davamiyyət qeydiyyatı, 6+ şagird bonusu və koordinator təsdiqi ilə avtomatik təlimçi qazancı.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSubTab('journal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                subTab === 'journal'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Davamiyyət Jurnalı
            </button>
            <button
              type="button"
              onClick={() => setSubTab('approvals')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                subTab === 'approvals'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Koordinator Təsdiq Növbəsi</span>
              {pendingApprovalsCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>

          {subTab === 'journal' && canEditAttendance && lessonDates.length > 0 && (
            <button
              onClick={() => handleMarkAllPresentForDate(effectiveMarkDate)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title={`${effectiveMarkDate} tarixi üçün hamını iştirak qeyd et`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>
                {effectiveMarkDate === todayStr ? 'Bugün Hamı İştirak' : 'Dərsi İştirak Qeyd Et'}
              </span>
            </button>
          )}

          {subTab === 'journal' && (
            <button
              onClick={() =>
                exportToCSV(
                  `AREA_Davamiyyet_${currentGroup?.name || 'Qrup'}_${selectedYearMonth}`,
                  groupStudents.map(s => {
                    const rate = calculateStudentRate(s.id);
                    return {
                      Telebe: s.fullName,
                      Telefon: s.phone,
                      Qrup: currentGroup?.name || 'Qrup',
                      Filial: currentGroup?.branchName || 'Əsas',
                      Ay: formatYearMonthAz(selectedYearMonth),
                      DersSayi: `${lessonDates.length} dərs`,
                      DavamiyyetFaizi: `${rate}%`,
                    };
                  })
                )
              }
              title="CSV ixrac"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors border border-slate-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          )}
        </div>
      </div>

      {subTab === 'journal' ? (
        <div className="space-y-5">
          {/* Group Selector & Month Navigation & Weekday Adjuster Card */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Group Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Qrup:
            </span>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              disabled={isStudent}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 cursor-pointer max-w-xs sm:max-w-md truncate"
            >
              {currentGroupsList.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.courseName} ({g.trainerName})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Əvvəlki ay"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-900 min-w-[110px] text-center font-sans">
                {formatYearMonthAz(selectedYearMonth)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Növbəti ay"
              className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {selectedYearMonth !== currentYearMonth && (
              <button
                type="button"
                onClick={handleCurrentMonth}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Bu Ay
              </button>
            )}
          </div>
        </div>

        {/* Group Lesson Days Configuration Bar */}
        {canEditAttendance && currentGroup && (
          <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1 shrink-0">
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                Dərs Günləri:
              </span>

              {/* 7 Weekday Buttons */}
              <div className="flex items-center gap-1">
                {WEEKDAYS.map(w => {
                  const isSelected = activeLessonDays.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        const newDays = isSelected
                          ? activeLessonDays.filter(d => d !== w.id)
                          : [...activeLessonDays, w.id];
                        handleUpdateGroupDays(newDays);
                      }}
                      title={`${w.name} (Dərsi aktiv/deaktiv et)`}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {w.short}
                    </button>
                  );
                })}
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                {SCHEDULE_PRESETS.slice(0, 3).map(preset => {
                  const isSelected =
                    preset.days.length === activeLessonDays.length &&
                    preset.days.every(d => activeLessonDays.includes(d));
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleUpdateGroupDays(preset.days)}
                      className={`text-[10px] px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {preset.days.map(d => WEEKDAYS.find(w => w.id === d)?.short).join('-')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule details & Start date indicator */}
            <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap self-start lg:self-auto">
              <span className="font-semibold text-slate-700">Cədvəl:</span>
              <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                {currentGroup.schedule ||
                  buildScheduleString(
                    activeLessonDays,
                    currentGroup.lessonStartTime || '19:00',
                    currentGroup.lessonEndTime || '21:00'
                  )}
              </span>
              {currentGroup.startDate && (
                <span className="text-slate-500">
                  · Başlama: <strong className="text-slate-700 font-mono-nums">{currentGroup.startDate}</strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info & Notification Banner */}
      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-indigo-950 font-medium">
          <CalendarCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong className="text-indigo-900 font-bold">{formatYearMonthAz(selectedYearMonth)}</strong> üzrə{' '}
            <strong className="text-indigo-700 font-bold">{lessonDates.length} dərs</strong> təqvimdə avtomatik
            hesablanıb. Davamiyyət faizləri seçilmiş ayın dərslərinə əsasən hesablanır.
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono-nums flex items-center gap-1.5">
          <span>Qrup tələbələri: <strong className="text-slate-800">{groupStudents.length}</strong></span>
          <span>·</span>
          <span>Dərs sayı: <strong className="text-indigo-700 font-bold">{lessonDates.length}</strong></span>
        </div>
      </div>

      {/* Role Notice Banners */}
      {isStudent && (
        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">Şagird Kabineti:</span>
            <span>Yalnız fərdi davamiyyətə baxış rejimi.</span>
          </div>
          <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
            Baxış
          </span>
        </div>
      )}

      {isTrainer && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900">
          <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">Təlimçi Rejimi:</span>
          <span>Statusu dəyişmək üçün xanalara klikləyin (P = İştirak, G = Gecikmə, Q = Qayıb, İ = İcazəli).</span>
        </div>
      )}

      {/* Active Session & Trainer Earning / Approval Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Seçilmiş Dərs: {activeSessionDate}
              </span>
              <span className="text-xs text-slate-300">
                {currentGroup?.name} · {currentGroup?.courseName} ({currentGroup?.trainerName})
              </span>
              {currentLessonSession?.status === 'approved' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Koordinator Təsdiqləyib ({currentLessonSession.approvedBy})
                </span>
              ) : currentLessonSession?.status === 'pending_approval' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Koordinator Təsdiqi Gözləyir
                </span>
              ) : currentLessonSession?.status === 'rejected' ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  İmtina Edildi ({currentLessonSession.rejectionReason || 'Səbəb göstərilməyib'})
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700/50 text-slate-300 border border-slate-600">
                  Təsdiqə Göndərilməyib
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Qayda: Təlimçi davamiyyət aparmasa ona ödəniş yazılmır. Təsdiq mütləq koordinator tərəfindən verilməlidir.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap bg-white/5 p-3 rounded-xl border border-white/10">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">İştirak Edən</div>
              <div className="text-lg font-bold text-white font-mono-nums flex items-baseline gap-1">
                {attendedStudentsCount} <span className="text-xs font-normal text-slate-400">/ {groupStudents.length}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Dərs Baza Ödənişi</div>
              <div className="text-lg font-bold text-indigo-300 font-mono-nums">
                {basePayPerLesson} ₼
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Bonus (&gt;6 Şagird)</div>
              <div className="text-lg font-bold text-amber-300 font-mono-nums">
                {calculatedBonusPay > 0 ? `+${calculatedBonusPay} ₼` : '0 ₼'}
                {bonusStudentsCount > 0 && (
                  <span className="text-[10px] font-normal text-amber-200 ml-1">
                    ({bonusStudentsCount} × {bonusRateOver6}₼)
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Yekun Qazanc</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono-nums">
                {calculatedTotalPay} ₼
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Cədvəl başlıqlarından hər hansı tarixə klikləyərək həmin günün dərs qazancına baxa bilərsiniz.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Trainer / Teacher can submit attendance for approval */}
            {canEditAttendance && (!currentLessonSession || currentLessonSession.status === 'rejected') && (
              <button
                type="button"
                onClick={handleSubmitActiveSession}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Davamiyyəti Təsdiqə Göndər ({calculatedTotalPay} ₼)</span>
              </button>
            )}

            {/* Coordinator actions directly from journal */}
            {isCoordinator && currentLessonSession?.status === 'pending_approval' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => approveLessonSession(currentLessonSession.id)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Təsdiqlə və Maaşa Əlavə Et ({currentLessonSession.totalCalculatedPay} ₼)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRejectionModalSessionId(currentLessonSession.id)}
                  className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>İmtina Et</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Davamiyyət Jurnalı İşarələri:
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            P (İştirak)
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            G (Gecikmə · 80%)
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Q (Qayıb · 0%)
          </span>

          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            İ (İcazəli · 100%)
          </span>
        </div>
      </div>

      {/* Attendance Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {lessonDates.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              {formatYearMonthAz(selectedYearMonth)} ayında dərs günü tapılmadı
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {currentGroup?.startDate && selectedYearMonth < currentGroup.startDate.slice(0, 7)
                ? `Bu qrup ${currentGroup.startDate} tarixində başlayır. Qrupun başlama tarixindən sonrakı ayları seçin.`
                : 'Qrup üçün həftənin günləri seçilməyib və ya ay üzrə uyğun dərs yoxdur. Aşağıdakı sürətli şablonlardan birini seçə bilərsiniz:'}
            </p>
            {canEditAttendance && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateGroupDays([1, 3, 5])}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                >
                  1-3-5 Şablonu Təyin Et (B.e - Çər - Cüm)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateGroupDays([2, 4, 6])}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  2-4-6 Şablonu Təyin Et (Ç.a - C.a - Şən)
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sticky left-0 bg-slate-50 z-20 min-w-[200px] border-r border-slate-200">
                    Tələbə Adı
                  </th>
                  {lessonDates.map((date, idx) => {
                    const dayNum = date.split('-')[2];
                    const monthShort = getMonthShortAz(date.split('-')[1]);
                    const dayShort = getDayOfWeekShort(date);
                    const isToday = date === todayStr;
                    const isSelected = date === activeSessionDate;

                    return (
                      <th
                        key={date}
                        onClick={() => setSelectedSessionDate(date)}
                        title={`Bu dərsi seç: ${date}`}
                        className={`py-2 px-2 text-center font-mono-nums transition-all min-w-[76px] cursor-pointer select-none ${
                          isSelected
                            ? 'bg-indigo-100/90 ring-2 ring-indigo-600 z-10'
                            : isToday
                            ? 'bg-indigo-50/90 border-x-2 border-indigo-500'
                            : 'border-r border-slate-100 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            D{idx + 1}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-bold text-white bg-indigo-600 px-1 py-0.2 rounded">
                              Bugün
                            </span>
                          )}
                          {isSelected && !isToday && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-200 px-1 py-0.2 rounded">
                              Aktiv
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-slate-800">
                          {dayNum} {monthShort}
                        </div>
                        <div className="text-[10px] text-indigo-600 font-semibold">
                          ({dayShort})
                        </div>
                        {canEditAttendance && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllPresentForDate(date);
                            }}
                            title={`${date} tarixindəki dərsi bütün tələbələr üçün iştirak (P) qeyd et`}
                            className="mt-1 text-[9px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors"
                          >
                            Hamı P
                          </button>
                        )}
                      </th>
                    );
                  })}
                  <th className="py-3 px-4 text-center min-w-[130px] border-l border-slate-200">
                    İştirak ({lessonDates.length} Dərs)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupStudents.map(student => {
                  const dynRate = calculateStudentRate(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200">
                        {student.fullName}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {student.phone}
                        </span>
                      </td>

                      {lessonDates.map(date => {
                        const status = getStatus(student.id, date);
                        const isToday = date === todayStr;

                        return (
                          <td
                            key={date}
                            className={`py-2 px-1 text-center ${
                              isToday ? 'bg-indigo-50/30 border-x-2 border-indigo-200' : 'border-r border-slate-100'
                            }`}
                          >
                            <button
                              onClick={
                                !canEditAttendance
                                  ? undefined
                                  : () => toggleAttendance(student.id, student.fullName, date)
                              }
                              disabled={!canEditAttendance}
                              className={`w-7 h-7 rounded text-[11px] font-bold font-mono inline-flex items-center justify-center ${
                                !canEditAttendance
                                  ? 'cursor-default'
                                  : 'transition-transform active:scale-90 cursor-pointer shadow-2xs'
                              } ${
                                status === 'present'
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                  : status === 'late'
                                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                                  : status === 'absent'
                                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                                  : status === 'excused'
                                  ? 'bg-sky-500 text-white hover:bg-sky-600'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                              title={
                                !canEditAttendance
                                  ? 'İştirak statusu'
                                  : `${date}: Statusu dəyişmək üçün klikləyin (P -> G -> Q -> İ)`
                              }
                            >
                              {status === 'present'
                                ? 'P'
                                : status === 'late'
                                ? 'G'
                                : status === 'absent'
                                ? 'Q'
                                : status === 'excused'
                                ? 'İ'
                                : '·'}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center font-mono-nums font-bold text-slate-800 border-l border-slate-200">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            dynRate >= 85
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : dynRate >= 70
                              ? 'bg-sky-50 text-indigo-700 border border-indigo-200'
                              : dynRate >= 50
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {dynRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {!groupStudents.length && (
                  <tr>
                    <td
                      colSpan={lessonDates.length + 2}
                      className="py-10 text-center text-slate-400 text-xs"
                    >
                      Bu qrupda hələ tələbə qeydiyyatı aparılmayıb.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  ) : (
    /* Coordinator Approvals Queue */
        <div className="space-y-5">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">Toplam Dərs Qeydləri</span>
                <Layers className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono-nums">
                {lessonSessions.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Sistemdəki bütün qrup dərsləri</div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
                <span className="font-bold">Təsdiq Gözləyən</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-extrabold text-amber-900 font-mono-nums">
                {pendingApprovalsCount}
              </div>
              <div className="text-[11px] text-amber-700 mt-1">Koordinator baxışı tələb edir</div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
                <span className="font-bold">Təsdiqlənmiş Dərslər</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-900 font-mono-nums">
                {lessonSessions.filter(s => s.status === 'approved').length}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">Maaş balansına oturulub</div>
            </div>

            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-indigo-800 mb-1">
                <span className="font-bold">Cəmi Təsdiqlənən Qazanc</span>
                <DollarSign className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-extrabold text-indigo-950 font-mono-nums">
                {lessonSessions
                  .filter(s => s.status === 'approved')
                  .reduce((sum, s) => sum + (s.totalCalculatedPay || 0), 0)}{' '}
                ₼
              </div>
              <div className="text-[11px] text-indigo-700 mt-1">Təlimçilərə hesablanan məbləğ</div>
            </div>
          </div>

          {/* Filter Pills & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Status:
              </span>
              <button
                type="button"
                onClick={() => setApprovalStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  approvalStatusFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Hamısı ({lessonSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setApprovalStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  approvalStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Gözləyir ({pendingApprovalsCount})
              </button>
              <button
                type="button"
                onClick={() => setApprovalStatusFilter('approved')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  approvalStatusFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Təsdiqləndi ({lessonSessions.filter(s => s.status === 'approved').length})
              </button>
              <button
                type="button"
                onClick={() => setApprovalStatusFilter('rejected')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  approvalStatusFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                İmtina ({lessonSessions.filter(s => s.status === 'rejected').length})
              </button>
            </div>

            <div className="text-xs text-slate-500">
              {isCoordinator
                ? 'Siz koordinator olaraq dərsləri təsdiq edib təlimçinin maaşına oturda bilərsiniz.'
                : 'Yalnız direktor və menecerlər təsdiq verə bilər.'}
            </div>
          </div>

          {/* Sessions Queue Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredApprovals.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Göstəriləcək dərs qeydi yoxdur</h4>
                <p className="text-xs text-slate-500">
                  Təlimçilər davamiyyəti apardıqdan sonra təsdiq üçün buraya göndəriləcək.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Dərs Tarixi</th>
                      <th className="py-3 px-4">Qrup & Filial</th>
                      <th className="py-3 px-4">Fənn / Kurs</th>
                      <th className="py-3 px-4">Təlimçi</th>
                      <th className="py-3 px-4 text-center">İştirak Sayı</th>
                      <th className="py-3 px-4">Hesablanan Maaş</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Əməliyyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApprovals.map(session => {
                      const isPending = session.status === 'pending_approval';
                      const isApproved = session.status === 'approved';
                      const isRejected = session.status === 'rejected';

                      return (
                        <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            {session.date}
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {session.submittedAt ? session.submittedAt.slice(0, 16).replace('T', ' ') : ''}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800">{session.groupName}</span>
                            <span className="block text-[10px] text-slate-500">{session.branchName}</span>
                          </td>
                          <td className="py-3.5 px-4 text-indigo-700 font-medium">
                            {session.courseName}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {session.trainerName}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 font-mono-nums font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full text-xs">
                              <Users className="w-3 h-3 text-slate-500" />
                              {session.attendedCount} / {session.totalStudents}
                            </span>
                            {session.attendedCount > 6 && (
                              <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                                +{session.attendedCount - 6} bonus uşaq
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono-nums font-bold text-emerald-600 text-sm">
                              {session.totalCalculatedPay} ₼
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono-nums">
                              Baza: {session.basePay}₼
                              {session.bonusPay > 0 && ` + Bonus: ${session.bonusPay}₼`}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-500" />
                                Gözləyir
                              </span>
                            )}
                            {isApproved && (
                              <div className="text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  Təsdiqləndi
                                </span>
                                {session.approvedBy && (
                                  <span className="block text-[9px] text-slate-400 mt-0.5 truncate max-w-[120px] mx-auto">
                                    {session.approvedBy}
                                  </span>
                                )}
                              </div>
                            )}
                            {isRejected && (
                              <div className="text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-500" />
                                  İmtina
                                </span>
                                {session.rejectionReason && (
                                  <span className="block text-[9px] text-rose-500 mt-0.5 truncate max-w-[120px] mx-auto" title={session.rejectionReason}>
                                    {session.rejectionReason}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isPending && isCoordinator ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => approveLessonSession(session.id)}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="Dərsi təsdiqlə və təlimçinin maaş balansına əlavə et"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Təsdiqlə</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectionModalSessionId(session.id)}
                                  className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="İmtina et"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>İmtina</span>
                                </button>
                              </div>
                            ) : isApproved ? (
                              <span className="text-[11px] text-emerald-700 font-medium inline-flex items-center gap-1">
                                <Check className="w-3 h-3" /> Balansa yazıldı
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedGroupId(session.groupId);
                                  setSelectedSessionDate(session.date);
                                  setSubTab('journal');
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                Jurnalda aç <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModalSessionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dərs Davamiyyətindən İmtina</h3>
                <p className="text-xs text-slate-500">
                  Bu dərsin təsdiqindən imtina edilir və təlimçiyə bu dərs üzrə ödəniş yazılmayacaq.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                İmtina Səbəbi (Təlimçiyə bildiriləcək):
              </label>
              <textarea
                value={rejectionReasonText}
                onChange={e => setRejectionReasonText(e.target.value)}
                placeholder="Məs: Davamiyyət tam doldurulmayıb, dərs baş tutmayıb..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setRejectionModalSessionId(null);
                  setRejectionReasonText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Ləğv Et
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                İmtinanı Təsdiq Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
