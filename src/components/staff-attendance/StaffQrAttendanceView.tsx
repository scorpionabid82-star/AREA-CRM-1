import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Download,
  Smartphone,
  Monitor,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { calculateDistanceMeters } from '../../utils/geo';
import { formatDateAz, exportToCSV } from '../../utils/formatters';

export const StaffQrAttendanceView: React.FC = () => {
  const {
    staff,
    staffAttendance,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    logStaffCheckIn,
    logStaffCheckOut,
    dynamicQrToken,
    showToast,
    can,
    currentUser,
    currentRole,
  } = useCrm();

  const isTrainer = currentUser?.role === 'telimci' || currentRole === 'telimci';
  const myTrainerStaff = staff.find(
    s =>
      (currentUser?.linkedEntityId && s.id === currentUser.linkedEntityId) ||
      (currentUser?.email && s.email.toLowerCase() === currentUser.email.toLowerCase())
  );

  const [activeSubTab, setActiveSubTab] = useState<'kiosk' | 'scanner' | 'timesheet'>('scanner');
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    myTrainerStaff?.id || staff[1]?.id || staff[0]?.id || ''
  );

  useEffect(() => {
    if (isTrainer && myTrainerStaff && selectedStaffId !== myTrainerStaff.id) {
      setSelectedStaffId(myTrainerStaff.id);
    }
  }, [isTrainer, myTrainerStaff?.id]);

  const [qrTerminalDataUrl, setQrTerminalDataUrl] = useState<string>('');

  // Geolocation states
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [simulationMode, setSimulationMode] = useState<'real' | 'inside' | 'outside'>('inside');

  const fallbackBranch = {
    id: 'branch-default',
    name: 'Əsas Filial',
    address: 'Bakı şəhəri',
    phone: '+994 12 000 00 00',
    latitude: 40.4000,
    longitude: 49.8500,
    radiusMeters: 100,
    createdAt: new Date().toISOString(),
  };

  const currentBranch = branches.find(b => b.id === selectedBranchId) || branches[0] || fallbackBranch;
  const currentStaff = staff.find(s => s.id === selectedStaffId) || staff[0];

  // Generate QR code for kiosk terminal
  useEffect(() => {
    if (dynamicQrToken) {
      QRCode.toDataURL(dynamicQrToken, {
        width: 280,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => setQrTerminalDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [dynamicQrToken]);

  // Handle GPS detection
  const requestRealGps = () => {
    setGeoLoading(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Brauzeriniz geolokasiyanı dəstəkləmir');
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoLoading(false);
        showToast('Real GPS koordinatları əldə edildi');
      },
      err => {
        console.warn('GPS Error:', err.message);
        setGeoError('GPS icazəsi verilmədi və ya siqnal zəifdir. Zəhmət olmasa icazə verin və ya simulyasiya rejimini seçin.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Determine effective coordinates based on simulation mode
  const getEffectiveCoords = (): { lat: number; lng: number } => {
    if (simulationMode === 'inside') {
      // 15 meters offset from target branch
      return {
        lat: currentBranch.latitude + 0.0001,
        lng: currentBranch.longitude + 0.00008,
      };
    } else if (simulationMode === 'outside') {
      // ~2.5 km away
      return {
        lat: currentBranch.latitude + 0.022,
        lng: currentBranch.longitude + 0.025,
      };
    } else if (userCoords) {
      return userCoords;
    }
    // Fallback inside
    return {
      lat: currentBranch.latitude + 0.00005,
      lng: currentBranch.longitude + 0.00005,
    };
  };

  const coords = getEffectiveCoords();
  const currentDistance = calculateDistanceMeters(
    coords.lat,
    coords.lng,
    currentBranch.latitude,
    currentBranch.longitude
  );
  const isInsideAllowedRadius = currentDistance <= currentBranch.radiusMeters;

  // Check-in handler
  const handleCheckIn = () => {
    const res = logStaffCheckIn(selectedStaffId, coords.lat, coords.lng, 'AREA Mobile/Web QR Skaner');
    if (!res.success) {
      showToast(res.message, 'error');
    }
  };

  // Check-out handler
  const handleCheckOut = () => {
    const res = logStaffCheckOut(selectedStaffId);
    if (!res.success) {
      showToast(res.message, 'error');
    }
  };

  // Check today's status for currently selected staff
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = staffAttendance.find(
    a => a.staffId === selectedStaffId && a.date === todayStr
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              QR Giriş
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            GPS geofence təsdiqi və dinamik QR kod ilə işçi qeydiyyatı.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveSubTab('scanner')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'scanner'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobil Skaner</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kiosk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'kiosk'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Kiosk Terminalı</span>
          </button>

          <button
            onClick={() => setActiveSubTab('timesheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeSubTab === 'timesheet'
                ? 'bg-white text-indigo-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tabel Jurnalı</span>
          </button>
        </div>
      </div>

      {/* SubTab 1: Staff Scanner & GPS verification */}
      {activeSubTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Staff Check-in Panel */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Əməkdaş Giriş / Çıxış Qeydiyyatı
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-mono-nums">
                  Tarix: {formatDateAz(todayStr)}
                </span>
              </div>

              {/* Staff Selector */}
              {isTrainer ? (
                <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-950 block">
                        {currentStaff?.fullName || currentUser?.fullName}
                      </span>
                      {(() => {
                        const bAssign = currentStaff?.assignedBranches?.find(ab => ab.branchId === currentBranch.id);
                        const empType = bAssign?.employmentType || currentStaff?.employmentType;
                        const wHours = bAssign?.weeklyHours || currentStaff?.weeklyHours;
                        if (!empType) return null;
                        return (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                            empType === 'full_stat'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : empType === 'yarim_stat'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : empType === 'saatliq'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {empType === 'full_stat'
                              ? `Full ştat · ${wHours || 40}s`
                              : empType === 'yarim_stat'
                              ? `Yarım ştat · ${wHours || 20}s`
                              : empType === 'saatliq'
                              ? `Saatlıq · ${wHours || 12}s norma`
                              : 'Fərdi qrafik'}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-[11px] text-indigo-700 font-medium block">
                      📍 {currentBranch.name} · Cədvəl: <span className="font-semibold">{currentStaff?.assignedBranches?.find(ab => ab.branchId === currentBranch.id)?.workSchedule || currentStaff?.workSchedule || '10:00 - 18:00'}</span>
                    </span>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 font-bold bg-indigo-600 text-white rounded-full shrink-0 shadow-2xs">
                    Təlimçi Kabineti
                  </span>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Əməkdaşı Seçin:
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {staff.map(s => {
                      const bAssign = s.assignedBranches?.find(ab => ab.branchId === currentBranch.id);
                      const empType = bAssign?.employmentType || s.employmentType || 'full_stat';
                      const empLabel = empType === 'saatliq' ? 'Saatlıq' : empType === 'yarim_stat' ? 'Yarım ştat' : empType === 'ferdi' ? 'Fərdi' : 'Full ştat';
                      const schedInfo = bAssign ? ` · ${bAssign.workSchedule}` : (s.branchId === currentBranch.id ? ` · ${s.workSchedule}` : '');
                      return (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.role} · {empLabel}) · {s.branchName}{schedInfo}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Geolocation Radius Status Card */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  isInsideAllowedRadius
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50/80 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isInsideAllowedRadius ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}

                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm">
                      {isInsideAllowedRadius
                        ? 'Geolokasiya Təsdiqləndi: Tədris Mərkəzindəsiniz'
                        : 'Xəta: Tədris Mərkəzinin Radiusundan Kənardasınız!'}
                    </p>
                    <p className="text-slate-600">
                      Mərkəzə qədər olan cari məsafəniz:{' '}
                      <strong className="font-mono-nums font-bold text-slate-900">
                        {currentDistance} metr
                      </strong>{' '}
                      (İcazə verilən maksimal radius: {currentBranch.radiusMeters}m).
                    </p>

                    <p className="text-[11px] text-slate-500 font-mono-nums pt-1">
                      Filial: {currentBranch.name} · ({currentBranch.latitude.toFixed(4)}, {currentBranch.longitude.toFixed(4)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Giriş & Çıxış */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCheckIn}
                  disabled={!can('create', 'staffAttendance') || !isInsideAllowedRadius || !!todayRecord?.checkInTime}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    !can('create', 'staffAttendance') || !isInsideAllowedRadius || todayRecord?.checkInTime
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={!can('create', 'staffAttendance') ? 'Giriş qeydiyyatı üçün səlahiyyətiniz yoxdur' : undefined}
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {!can('create', 'staffAttendance')
                      ? 'Səlahiyyət Məhduddur'
                      : todayRecord?.checkInTime
                      ? `Giriş Qeydə Alınıb (${todayRecord.checkInTime})`
                      : 'QR Kod & GPS İlə Giriş Et'}
                  </span>
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={!can('create', 'staffAttendance') || !todayRecord?.checkInTime || !!todayRecord?.checkOutTime}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    !can('create', 'staffAttendance') || !todayRecord?.checkInTime || todayRecord?.checkOutTime
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-800 hover:bg-slate-900 text-white'
                  }`}
                  title={!can('create', 'staffAttendance') ? 'Çıxış qeydiyyatı üçün səlahiyyətiniz yoxdur' : undefined}
                >
                  <Clock className="w-4 h-4" />
                  <span>
                    {!can('create', 'staffAttendance')
                      ? 'Səlahiyyət Məhduddur'
                      : todayRecord?.checkOutTime
                      ? `Çıxış Edilib (${todayRecord.checkOutTime})`
                      : 'İş Gününü Bitir (Çıxış)'}
                  </span>
                </button>
              </div>

              {/* Current Employee Today's Status Box */}
              {todayRecord && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>{currentStaff?.fullName || 'Əməkdaş'} üçün bugünkü status:</span>
                    <span
                      className={`font-semibold ${
                        todayRecord.status === 'vaxtinda' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {todayRecord.status === 'vaxtinda' ? 'Vaxtında Gəlib' : 'Gecikmə'}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono-nums flex items-center gap-4 text-[11px]">
                    <span>Giriş: {todayRecord.checkInTime}</span>
                    <span>Çıxış: {todayRecord.checkOutTime || 'Aktivdir'}</span>
                    {todayRecord.workedHours && <span>İş saatı: {todayRecord.workedHours} saat</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: GPS Verification & Testing Simulator */}
          <div className="lg:col-span-5 space-y-6">
            {/* GPS Simulator Controls (for easy testing without walking) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Geolokasiya Test Paneli və Tənzimləmə
                  </h4>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Sistemin geofence yoxlanışını sınaqdan keçirmək üçün aşağıdakı rejimlərdən istifadə edə bilərsiniz:
              </p>

              <div className="space-y-2">
                <label
                  onClick={() => setSimulationMode('inside')}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    simulationMode === 'inside'
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="sim"
                    checked={simulationMode === 'inside'}
                    onChange={() => setSimulationMode('inside')}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Mərkəz Daxilində (12-18 metr məsafə)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      GPS filialın təyin edilmiş radiusuna (150m) tam uyğun gəlir. Giriş uğurlu olacaq.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setSimulationMode('outside')}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    simulationMode === 'outside'
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="sim"
                    checked={simulationMode === 'outside'}
                    onChange={() => setSimulationMode('outside')}
                    className="mt-0.5 text-rose-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Mərkəz Xaricində (2.5 km uzaqda)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Əməkdaş ofisdən uzaqdadır. Sistem təhlükəsizlik xətası verəcək və girişi bloklayacaq.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => {
                    setSimulationMode('real');
                    requestRealGps();
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    simulationMode === 'real'
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="sim"
                    checked={simulationMode === 'real'}
                    onChange={() => {
                      setSimulationMode('real');
                      requestRealGps();
                    }}
                    className="mt-0.5 text-indigo-600"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Cihazın Canlı GPS Siqnalı
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Brauzerdən `navigator.geolocation` sorğulayır.
                    </p>
                  </div>
                </label>
              </div>

              {geoError && (
                <div className="p-2.5 rounded bg-amber-50 text-amber-800 text-[11px] border border-amber-200 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{geoError}</span>
                </div>
              )}

              {/* Branch Coords info */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Filialın Enlem/Uzunluğu:</span>
                  <span className="font-mono-nums font-medium text-slate-800">
                    {currentBranch.latitude}, {currentBranch.longitude}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Hesablanmış İstifadəçi GPS:</span>
                  <span className="font-mono-nums font-medium text-slate-800">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Academy Kiosk / Big QR Terminal */}
      {activeSubTab === 'kiosk' && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 max-w-2xl mx-auto text-center space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold">
              {currentBranch.name}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Heyət Giriş / Çıxış QR Terminalı
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Bu ekran mərkəzin qəbul masasında (Resepşn planşetində) açıq qalır. QR kod hər 20 saniyədən bir avtomatik fırlanır və saxtakarlığın qarşısını alır.
            </p>
          </div>

          {/* Big QR Container */}
          <div className="inline-block p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-indigo-200 shadow-inner">
            {qrTerminalDataUrl ? (
              <img
                src={qrTerminalDataUrl}
                alt="Heyət Davamiyyət QR Kodu"
                className="w-64 h-64 mx-auto rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-slate-400">
                QR hazırlanır...
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
              Dinamik təhlükəsizlik şifrəsi aktivdir
            </span>
            <span>·</span>
            <span className="font-mono-nums text-slate-700 font-semibold">
              Radius: {currentBranch.radiusMeters}m
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center gap-3">
            <button
              onClick={() => setActiveSubTab('scanner')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Telefonla Skan Et / Girişi Sına
            </button>
          </div>
        </div>
      )}

      {/* SubTab 3: Attendance Timesheet / Log */}
      {activeSubTab === 'timesheet' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Heyət Davamiyyət Tarixçəsi və İş Saatları
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bütün geolokasiyalı girişlər, gecikmələr və qeydə alınmış iş saatları
              </p>
            </div>

            <button
              onClick={() =>
                exportToCSV(
                  'AREA_Heyet_Davamiyyeti',
                  staffAttendance.map(a => ({
                    Tarix: a.date,
                    Emekdas: a.staffName,
                    Filial: a.branchName,
                    GirisSaati: a.checkInTime || '',
                    CixisSaati: a.checkOutTime || '',
                    Mesafem: a.distanceMeters || '',
                    IsSaati: a.workedHours || '',
                    Status: a.status === 'vaxtinda' ? 'Vaxtında' : 'Gecikmə',
                  }))
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV Eksport</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tarix</th>
                  <th className="py-3 px-4">Əməkdaş</th>
                  <th className="py-3 px-4">Filial</th>
                  <th className="py-3 px-4">Giriş Saatı</th>
                  <th className="py-3 px-4">Çıxış Saatı</th>
                  <th className="py-3 px-4">İş Müddəti</th>
                  <th className="py-3 px-4">GPS Məsafəsi</th>
                  <th className="py-3 px-4">Geofence</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffAttendance.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono-nums text-slate-600">
                      {formatDateAz(log.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{log.staffName}</td>
                    <td className="py-3 px-4 text-slate-600">{log.branchName}</td>
                    <td className="py-3 px-4 font-mono-nums text-slate-800 font-medium">
                      {log.checkInTime || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono-nums text-slate-800 font-medium">
                      {log.checkOutTime || 'Aktivdir'}
                    </td>
                    <td className="py-3 px-4 font-mono-nums text-slate-700">
                      {log.workedHours ? `${log.workedHours} saat` : 'Davam edir'}
                    </td>
                    <td className="py-3 px-4 font-mono-nums text-slate-600">
                      {log.distanceMeters !== undefined ? `${log.distanceMeters} m` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {log.isInsideGeo ? (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mərkəz daxili
                        </span>
                      ) : (
                        <span className="text-rose-700 font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Kənardan
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {log.status === 'vaxtinda' ? (
                        <span className="text-emerald-700 font-medium">Vaxtında</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Gecikmə</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
