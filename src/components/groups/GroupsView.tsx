import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  MoreVertical,
  BookOpen,
  Edit2,
  Trash2,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Group } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import {
  WEEKDAYS,
  SCHEDULE_PRESETS,
  parseScheduleDays,
  buildScheduleString
} from '../../utils/scheduleHelper';

export const GroupsView: React.FC = () => {
  const {
    groups,
    students,
    staff,
    curriculums,
    branches,
    addGroup,
    updateGroup,
    softDeleteGroup,
    hardDeleteGroup,
    restoreGroup,
    setActiveTab,
    confirmAction,
    can,
  } = useCrm();

  const [activeTabFilter, setActiveTabFilter] = useState<'active' | 'archived'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroupRoster, setSelectedGroupRoster] = useState<Group | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [branchId, setBranchId] = useState(branches[0]?.id || 'branch-nerimanov');
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(curriculums[0]?.id || '');
  const [trainerId, setTrainerId] = useState(staff.find(s => s.role === 'Təlimçi')?.id || staff[0]?.id || '');
  const [lessonDays, setLessonDays] = useState<number[]>([1, 3, 5]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [schedule, setSchedule] = useState('B.e / Çər / Cüm · 19:00 - 21:00');
  const [room, setRoom] = useState('Laboratoriya 1 (Nizami)');
  const [capacity, setCapacity] = useState(14);
  const [trainerPayPerLesson, setTrainerPayPerLesson] = useState<number>(15);
  const [bonusPerStudentOver6, setBonusPerStudentOver6] = useState<number>(2);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('2026-09-30');

  // Edit Group Form
  const [editName, setEditName] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [editTrainerId, setEditTrainerId] = useState('');
  const [editLessonDays, setEditLessonDays] = useState<number[]>([1, 3, 5]);
  const [editStartTime, setEditStartTime] = useState('19:00');
  const [editEndTime, setEditEndTime] = useState('21:00');
  const [editSchedule, setEditSchedule] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editCapacity, setEditCapacity] = useState(14);
  const [editTrainerPayPerLesson, setEditTrainerPayPerLesson] = useState<number>(15);
  const [editBonusPerStudentOver6, setEditBonusPerStudentOver6] = useState<number>(2);
  const [editStatus, setEditStatus] = useState<'yeni' | 'davam_edir' | 'tamamlandi' | 'silinib'>('davam_edir');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const trainers = staff.filter(s => s.role === 'Təlimçi' || s.role === 'Direktor');

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditCourseId(group.courseId);
    setEditTrainerId(group.trainerId);
    const days = group.lessonDays && group.lessonDays.length > 0 ? group.lessonDays : parseScheduleDays(group.schedule);
    setEditLessonDays(days);
    const sTime = group.lessonStartTime || '19:00';
    const eTime = group.lessonEndTime || '21:00';
    setEditStartTime(sTime);
    setEditEndTime(eTime);
    setEditSchedule(group.schedule || buildScheduleString(days, sTime, eTime));
    setEditRoom(group.room);
    setEditCapacity(group.capacity);
    setEditTrainerPayPerLesson(group.trainerPayPerLesson ?? 15);
    setEditBonusPerStudentOver6(group.bonusPerStudentOver6 ?? 2);
    setEditStatus(group.status);
    setEditStartDate(group.startDate);
    setEditEndDate(group.endDate);
  };

  const handleUpdateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editName.trim()) return;

    const course = curriculums.find(c => c.id === editCourseId) || curriculums[0];
    const trainer = staff.find(s => s.id === editTrainerId) || staff[0];
    const finalSchedule = editSchedule || buildScheduleString(editLessonDays, editStartTime, editEndTime);

    updateGroup(editingGroup.id, {
      name: editName,
      courseId: course?.id || editCourseId || 'course-default',
      courseName: course?.courseName || 'Ümumi Kurs',
      trainerId: trainer?.id || 'staff-unassigned',
      trainerName: trainer?.fullName || 'Təyin Edilməyib',
      schedule: finalSchedule,
      lessonDays: editLessonDays,
      lessonStartTime: editStartTime,
      lessonEndTime: editEndTime,
      room: editRoom,
      capacity: editCapacity,
      trainerPayPerLesson: editTrainerPayPerLesson,
      bonusPerStudentOver6: editBonusPerStudentOver6,
      status: editStatus,
      startDate: editStartDate,
      endDate: editEndDate,
    });

    setEditingGroup(null);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const course = curriculums.find(c => c.id === courseId) || curriculums[0];
    const trainer = staff.find(s => s.id === trainerId) || staff[0];
    const targetBranch = branches.find(b => b.id === branchId) || branches[0];
    const finalSchedule = schedule || buildScheduleString(lessonDays, startTime, endTime);

    addGroup({
      name,
      courseId: course?.id || courseId || 'course-default',
      courseName: course?.courseName || 'Ümumi Kurs',
      trainerId: trainer?.id || 'staff-unassigned',
      trainerName: trainer?.fullName || 'Təyin Edilməyib',
      branchId: targetBranch?.id,
      branchName: targetBranch?.name,
      schedule: finalSchedule,
      lessonDays,
      lessonStartTime: startTime,
      lessonEndTime: endTime,
      room,
      capacity,
      trainerPayPerLesson,
      bonusPerStudentOver6,
      startDate,
      endDate,
      status: 'davam_edir',
    });

    setShowAddModal(false);
    setName('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Qruplar
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono-nums">
              {groups.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cədvəl, auditoriya tutumu, qrup redaktəsi və soft/hard silinməsi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active / Archive Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTabFilter('active')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                activeTabFilter === 'active'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aktiv Qruplar ({groups.filter(g => !g.isDeleted).length})
            </button>
            <button
              onClick={() => setActiveTabFilter('archived')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                activeTabFilter === 'archived'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arxiv / Zibil Qutusu ({groups.filter(g => g.isDeleted).length})</span>
            </button>
          </div>

          {can('create', 'groups') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Qrup</span>
            </button>
          )}
        </div>
      </div>

      {/* Groups Grid */}
      {groups.filter(g => (activeTabFilter === 'active' ? !g.isDeleted : g.isDeleted)).length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {activeTabFilter === 'active'
                ? (groups.length === 0 ? 'Bazada Hələ Tədris Qrupu Yoxdur' : 'Aktiv Qrup Tapılmadı')
                : 'Arxivdə Heç Bir Qrup Yoxdur'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTabFilter === 'active' && groups.length === 0
                ? 'Sistem real məlumat rejiminə keçirilib. Yuxarıdakı "Yeni Qrup Yarat" düyməsi ilə ilk tədris qrupunuzu aça bilərsiniz.'
                : 'Seçilmiş filter üzrə qrup tapılmadı.'}
            </p>
          </div>
          {activeTabFilter === 'active' && groups.length === 0 && can('create', 'groups') && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>İlk Qrupu Yarat</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups
            .filter(grp => (activeTabFilter === 'active' ? !grp.isDeleted : grp.isDeleted))
            .map(grp => {
              const groupStudents = students.filter(s => s.groupId === grp.id && !s.isDeleted);
              const occupancyPercent = Math.round((grp.currentStudents / grp.capacity) * 100);

              return (
                <div
                  key={grp.id}
                  className={`bg-white rounded-xl border p-5 space-y-4 transition-all flex flex-col justify-between ${
                    grp.isDeleted
                      ? 'border-rose-200 bg-rose-50/20 opacity-90'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 block">
                          {grp.courseName}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">{grp.name}</h3>
                      </div>

                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          grp.isDeleted
                            ? 'bg-rose-100 text-rose-800'
                            : grp.status === 'davam_edir'
                            ? 'bg-emerald-50 text-emerald-700'
                            : grp.status === 'yeni'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          grp.isDeleted
                            ? 'bg-rose-500'
                            : grp.status === 'davam_edir'
                            ? 'bg-emerald-500 animate-pulse'
                            : grp.status === 'yeni'
                            ? 'bg-indigo-500'
                            : 'bg-slate-400'
                        }`} />
                        {grp.isDeleted
                          ? 'Silinib (Arxiv)'
                          : grp.status === 'davam_edir'
                          ? 'Davam edir'
                          : grp.status === 'yeni'
                          ? 'Yeni'
                          : 'Tamamlandı'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="text-slate-800 font-medium">{grp.trainerName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{grp.schedule}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{grp.room}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono-nums">
                          {formatDateAz(grp.startDate)} — {formatDateAz(grp.endDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-100 mt-1">
                        <span className="font-bold">
                          💰 Dərsbaşı: {grp.trainerPayPerLesson ?? 15} ₼
                        </span>
                        <span className="text-[10px] text-emerald-700">
                          &gt;6 şagird: +{grp.bonusPerStudentOver6 ?? 2} ₼/nəfər
                        </span>
                      </div>
                    </div>

                    {/* Capacity Meter */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-500 inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          Tutum:
                        </span>
                        <span className="font-mono-nums font-semibold text-slate-800">
                          {grp.currentStudents}/{grp.capacity} ({occupancyPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            occupancyPercent >= 90
                              ? 'bg-amber-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setSelectedGroupRoster(grp)}
                      className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Tələbələr ({groupStudents.length})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {grp.isDeleted ? (
                        <>
                          {can('delete', 'groups') && (
                            <>
                              <button
                                onClick={() => restoreGroup(grp.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-md transition-colors cursor-pointer"
                                title="Qrupu bərpa et"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Bərpa</span>
                              </button>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Qrupu Birdəfəlik Sil',
                                    message: `"${grp.name}" qrupunu bazadan birdəfəlik və fiziki olaraq silmək istəyirsiniz? Bütün əlaqəli jurnallar silinəcək və bu əməliyyat geri qaytarılmır!`,
                                    confirmText: 'Bəli, Birdəfəlik Sil',
                                    danger: true,
                                    onConfirm: () => hardDeleteGroup(grp.id),
                                  });
                                }}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                                title="Birdəfəlik fiziki sil (Hard Delete)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {can('edit', 'groups') && (
                            <button
                              onClick={() => handleOpenEdit(grp)}
                              title="Qrupu Redaktə Et"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {can('delete', 'groups') && (
                            <>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Qrupu Arxivlə',
                                    message: `"${grp.name}" qrupunu aktiv siyahıdan çıxarıb arxivə göndərmək istəyirsiniz? İstənilən vaxt bərpa edə bilərsiniz.`,
                                    confirmText: 'Arxivlə',
                                    danger: false,
                                    onConfirm: () => softDeleteGroup(grp.id),
                                  });
                                }}
                                title="Qrupu Arxivlə (Soft Delete)"
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  confirmAction({
                                    title: 'Qrupu Birdəfəlik Sil',
                                    message: `"${grp.name}" qrupunu birdəfəlik bazadan silmək istəyirsiniz? Bu əməliyyat geri qaytarılmır!`,
                                    confirmText: 'Bəli, Birdəfəlik Sil',
                                    danger: true,
                                    onConfirm: () => hardDeleteGroup(grp.id),
                                  });
                                }}
                                title="Birdəfəlik sil (Hard Delete)"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Modal: Group Students Roster */}
      {selectedGroupRoster && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedGroupRoster.name} — Qrup Tələbələri
                </h3>
                <p className="text-xs text-slate-500">
                  Təlimçi: {selectedGroupRoster.trainerName} · {selectedGroupRoster.schedule}
                </p>
              </div>

              <button
                onClick={() => setSelectedGroupRoster(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Bağla
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {students
                .filter(s => s.groupId === selectedGroupRoster.id)
                .map(st => (
                  <div
                    key={st.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{st.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono-nums">{st.phone}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono-nums font-semibold ${
                          st.balance < 0 ? 'text-amber-600' : 'text-slate-700'
                        }`}
                      >
                        {st.balance < 0 ? `Borc: ${Math.abs(st.balance)} ₼` : 'Borc yoxdur'}
                      </span>
                      <p className="text-[10px] text-slate-400">Davamiyyət: {st.attendanceRate}%</p>
                    </div>
                  </div>
                ))}

              {!students.filter(s => s.groupId === selectedGroupRoster.id).length && (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  Bu qrupda hələ tələbə qeydiyyatı yoxdur.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Group */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Yeni Qrup Açılışı
            </h3>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filial:
                  </label>
                  <select
                    value={branchId}
                    onChange={e => setBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-900"
                  >
                    {branches.filter(b => !b.isDeleted).map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qrupun Adı / Kodu:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="məs: FE-106 (Axşam Qrupu)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tədris Proqramı / Kurikulum:
                  </label>
                  <select
                    value={courseId}
                    onChange={e => setCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {curriculums.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Təyin Olunan Təlimçi:
                  </label>
                  <select
                    value={trainerId}
                    onChange={e => setTrainerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {trainers.map(t => {
                      const bAssign = t.assignedBranches?.find(ab => ab.branchId === branchId);
                      const schedLabel = bAssign ? ` · ${bAssign.workSchedule}` : (t.branchId === branchId ? ` · ${t.workSchedule}` : '');
                      return (
                        <option key={t.id} value={t.id}>
                          {t.fullName}{schedLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dərs Günləri və Cədvəl Seçimi */}
              <div className="space-y-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-950">
                    Dərs Günləri və Cədvəl:
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {schedule || buildScheduleString(lessonDays, startTime, endTime)}
                  </span>
                </div>

                {/* Sürətli Şablonlar */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                    Sürətli Şablonlar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SCHEDULE_PRESETS.map(preset => {
                      const isSelected =
                        preset.days.length === lessonDays.length &&
                        preset.days.every(d => lessonDays.includes(d));
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setLessonDays(preset.days);
                            setSchedule(buildScheduleString(preset.days, startTime, endTime));
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Həftənin Günləri Düymələri */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                    Həftənin Günləri:
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map(w => {
                      const isSelected = lessonDays.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            const newDays = isSelected
                              ? lessonDays.filter(d => d !== w.id)
                              : [...lessonDays, w.id];
                            setLessonDays(newDays);
                            setSchedule(buildScheduleString(newDays, startTime, endTime));
                          }}
                          className={`py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={w.name}
                        >
                          {w.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dərs Saatları */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Başlama Saatı:
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => {
                        const val = e.target.value;
                        setStartTime(val);
                        setSchedule(buildScheduleString(lessonDays, val, endTime));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Bitmə Saatı:
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => {
                        const val = e.target.value;
                        setEndTime(val);
                        setSchedule(buildScheduleString(lessonDays, startTime, val));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auditoriya / Otaq:
                  </label>
                  <input
                    type="text"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tələbə Tutumu (Maksimal):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="30"
                    value={capacity}
                    onChange={e => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              {/* Təlimçi Dərs Ödənişi və Bonus Parametrləri */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950">
                    Təlimçi Dərs Haqqı və Şagird Bonusu:
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Davamiyyətə əsaslanan
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Dərsə görə ödəniş (AZN):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={trainerPayPerLesson}
                      onChange={e => setTrainerPayPerLesson(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      6 uşaqdan artıq bonus (AZN/nəfər):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={bonusPerStudentOver6}
                      onChange={e => setBonusPerStudentOver6(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-800">
                  ℹ️ Dərsdə 6-dan çox uşaq iştirak etdikdə, 6-dan artıq hər şagird üçün əlavə dərsbaşı sabit bonus hesablanır.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Başlama Tarixi:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planlaşdırılan Bitmə Tarixi:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  İmtina
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Qrupu Təsdiqlə
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Group */}
      {editingGroup && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Qrupun Redaktə Edilməsi ({editingGroup.name})
              </h3>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateGroupSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qrupun Adı / Kodu:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tədris Proqramı / Kurikulum:
                  </label>
                  <select
                    value={editCourseId}
                    onChange={e => setEditCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {curriculums.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Təyin Olunan Təlimçi:
                  </label>
                  <select
                    value={editTrainerId}
                    onChange={e => setEditTrainerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  >
                    {trainers.map(t => {
                      const bAssign = t.assignedBranches?.find(ab => ab.branchId === editingGroup?.branchId);
                      const schedLabel = bAssign ? ` · ${bAssign.workSchedule}` : (t.branchId === editingGroup?.branchId ? ` · ${t.workSchedule}` : '');
                      return (
                        <option key={t.id} value={t.id}>
                          {t.fullName}{schedLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Dərs Günləri və Cədvəl Seçimi (Redaktə) */}
              <div className="space-y-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-950">
                    Dərs Günləri və Cədvəl:
                  </label>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    {editSchedule || buildScheduleString(editLessonDays, editStartTime, editEndTime)}
                  </span>
                </div>

                {/* Sürətli Şablonlar */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                    Sürətli Şablonlar:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SCHEDULE_PRESETS.map(preset => {
                      const isSelected =
                        preset.days.length === editLessonDays.length &&
                        preset.days.every(d => editLessonDays.includes(d));
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setEditLessonDays(preset.days);
                            setEditSchedule(buildScheduleString(preset.days, editStartTime, editEndTime));
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Həftənin Günləri Düymələri */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                    Həftənin Günləri:
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map(w => {
                      const isSelected = editLessonDays.includes(w.id);
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            const newDays = isSelected
                              ? editLessonDays.filter(d => d !== w.id)
                              : [...editLessonDays, w.id];
                            setEditLessonDays(newDays);
                            setEditSchedule(buildScheduleString(newDays, editStartTime, editEndTime));
                          }}
                          className={`py-1.5 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs ring-1 ring-indigo-500'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={w.name}
                        >
                          {w.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dərs Saatları */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Başlama Saatı:
                    </label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={e => {
                        const val = e.target.value;
                        setEditStartTime(val);
                        setEditSchedule(buildScheduleString(editLessonDays, val, editEndTime));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Bitmə Saatı:
                    </label>
                    <input
                      type="time"
                      value={editEndTime}
                      onChange={e => {
                        const val = e.target.value;
                        setEditEndTime(val);
                        setEditSchedule(buildScheduleString(editLessonDays, editStartTime, val));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Auditoriya / Otaq:
                  </label>
                  <input
                    type="text"
                    value={editRoom}
                    onChange={e => setEditRoom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tələbə Tutumu:
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={editCapacity}
                    onChange={e => setEditCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              {/* Təlimçi Dərs Ödənişi və Bonus Parametrləri (Edit) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-950">
                    Təlimçi Dərs Haqqı və Şagird Bonusu:
                  </label>
                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                    Davamiyyətə əsaslanan
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      Dərsə görə ödəniş (AZN):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={editTrainerPayPerLesson}
                      onChange={e => setEditTrainerPayPerLesson(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">
                      6 uşaqdan artıq bonus (AZN/nəfər):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={editBonusPerStudentOver6}
                      onChange={e => setEditBonusPerStudentOver6(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono-nums font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-emerald-800">
                  ℹ️ Dərsdə 6-dan çox uşaq iştirak etdikdə, 6-dan artıq hər şagird üçün əlavə dərsbaşı sabit bonus hesablanır.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qrup Statusu:
                  </label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                  >
                    <option value="davam_edir">Davam edir</option>
                    <option value="yeni">Yeni</option>
                    <option value="tamamlandi">Tamamlandı</option>
                    <option value="silinib">Silinib (Arxiv)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Başlama Tarixi:
                  </label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bitmə Tarixi:
                  </label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
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
    </div>
  );
};
