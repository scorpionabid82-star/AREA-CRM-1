import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  CreditCard,
  Wrench,
  Boxes,
  Building2,
  Printer,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventorySubTab, Role } from '../../types/crm';

interface InventoryTestRunnerProps {
  onNavigateTab: (tab: InventorySubTab) => void;
  onOpenActModal: (actId: string) => void;
}

export const InventoryTestRunner: React.FC<InventoryTestRunnerProps> = ({
  onNavigateTab,
  onOpenActModal,
}) => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    branches,
    inventoryProducts,
    branchInventories,
    equipmentList,
    technicalTickets,
    inventoryOrders,
    inventoryPayments,
    inventoryActs,
    warehouseLogs,
    createInventoryOrder,
    reviewInventoryOrder,
    dispatchInventoryOrder,
    deliverInventoryOrder,
    recordInventoryPayment,
    createTechnicalTicket,
    updateTicketProgress,
    confirmTicketResolution,
    adjustCentralStock,
    adjustBranchInventory,
    resetInventoryTestData,
    showToast,
  } = useCrm();

  const [isOpen, setIsOpen] = useState(false);
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [lastExecutedResult, setLastExecutedResult] = useState<{
    title: string;
    description: string;
    targetTab: InventorySubTab;
    actId?: string;
  } | null>(null);

  // Role switching simulation
  const handleSwitchRole = (role: Role, branchId?: string) => {
    setCurrentRole(role);
    if (currentUser) {
      if (branchId) {
        currentUser.branchId = branchId;
        currentUser.branchName = branches.find(b => b.id === branchId)?.name || 'Filial';
      } else if (role === 'direktor' || role === 'texnobaba_meneceri') {
        currentUser.branchId = 'all';
        currentUser.branchName = 'Bütün Filiallar (Qlobal Şəbəkə)';
      }
    }
    showToast(`İstifadəçi rolu dəyişdirildi: ${role.toUpperCase()}`, 'info');
  };

  // Scenario 1: Full DIY Order Lifecycle
  const runScenarioDiyFlow = () => {
    setRunningScenario('diy');
    try {
      const genclikBranch = branches.find(b => b.name.includes('Gənclik')) || branches[0];
      const scissorsProd = inventoryProducts.find(p => p.type === 'diy' && p.name.includes('Qayçı')) || inventoryProducts[0];
      const cardboardProd = inventoryProducts.find(p => p.type === 'diy' && p.name.includes('Karton')) || inventoryProducts[1];

      // Step 1: Filial creates order
      const order = createInventoryOrder({
        branchId: genclikBranch.id,
        type: 'diy',
        items: [
          { productId: scissorsProd.id, requestedQty: 5, unitPrice: 0 },
          { productId: cardboardProd.id, requestedQty: 30, unitPrice: 0 },
        ],
        reason: 'Ucdan-Uca Test Ssenarisi: Gənclik filialı üçün həftəlik DIY material tələbatı',
      });

      // Step 2: Texnobaba approves
      reviewInventoryOrder(order.id, 'tesdiqlendi', {
        [scissorsProd.id]: 5,
        [cardboardProd.id]: 30,
      });

      // Step 3: Texnobaba dispatches
      dispatchInventoryOrder(order.id);

      // Step 4: Filial receives order -> generates act & updates branch inventory
      deliverInventoryOrder(order.id);

      // Find the generated act
      const latestAct = inventoryActs[0];

      setLastExecutedResult({
        title: 'Ssenari 1: DIY Material Dövriyyəsi Tam İcra Edildi',
        description: `${genclikBranch.name} üçün 5 ədəd Qayçı və 30 ədəd Karton sifariş edildi -> Texnobaba tərəfindən təsdiqləndi -> Mərkəzi anbardan çıxarıldı -> Filial təhvil aldı və Rəsmi Təhvil Aktı tərtib olundu.`,
        targetTab: 'orders',
        actId: latestAct?.id,
      });

      showToast('Ssenari 1 uğurla tamamlandı! Sifariş və Akt formalaşdırıldı.', 'success');
    } catch (e: any) {
      showToast(`Xəta baş verdi: ${e?.message}`, 'error');
    } finally {
      setRunningScenario(null);
    }
  };

  // Scenario 2: Paid Products, Debt Generation & Payment
  const runScenarioPaidFlow = () => {
    setRunningScenario('paid');
    try {
      const nerimanovBranch = branches.find(b => b.name.includes('Nərimanov')) || branches[1] || branches[0];
      const filament = inventoryProducts.find(p => p.type === 'paid' && p.name.includes('Filament')) || inventoryProducts[2];
      const arduino = inventoryProducts.find(p => p.type === 'paid' && p.name.includes('Arduino')) || inventoryProducts[3] || inventoryProducts[2];

      const requestedQtyFilament = 2;
      const requestedQtyArduino = 1;
      const totalAmount = requestedQtyFilament * filament.unitPrice + requestedQtyArduino * arduino.unitPrice;

      // 1. Create paid order
      const order = createInventoryOrder({
        branchId: nerimanovBranch.id,
        type: 'paid',
        items: [
          { productId: filament.id, requestedQty: requestedQtyFilament, unitPrice: filament.unitPrice },
          { productId: arduino.id, requestedQty: requestedQtyArduino, unitPrice: arduino.unitPrice },
        ],
        reason: 'Ucdan-Uca Test Ssenarisi: Nərimanov filialının xüsusi layihə ləvazimatları',
      });

      // 2. Review and approve
      reviewInventoryOrder(order.id, 'tesdiqlendi', {
        [filament.id]: requestedQtyFilament,
        [arduino.id]: requestedQtyArduino,
      });

      // 3. Dispatch
      dispatchInventoryOrder(order.id);

      // 4. Deliver (Increases branch stock, generates act, updates branch debt)
      deliverInventoryOrder(order.id);

      // 5. Pay partial amount (e.g., 50 AZN paid via bank transfer)
      const paymentAmount = Math.min(50, totalAmount);
      recordInventoryPayment(
        nerimanovBranch.id,
        paymentAmount,
        'Bank Köçürməsi (PAŞA Bank)',
        `№${order.orderNumber} saylı sifariş üzrə ilkin avans ödənişi`,
        order.id
      );

      setLastExecutedResult({
        title: 'Ssenari 2: Ödənişli Təchizat, Borclanma və Ödəniş Tamamlandı',
        description: `${nerimanovBranch.name} üçün ${totalAmount} AZN məbləğində sifariş təhvil verildi -> Filialın borcu ${totalAmount} AZN artdı -> ${paymentAmount} AZN rəsmi ödəniş qəbul edildi -> Qalıq borc ${totalAmount - paymentAmount} AZN təşkil edir.`,
        targetTab: 'debts',
      });

      showToast('Ssenari 2 uğurla icra olundu! Borc və ödəniş qeydləri yeniləndi.', 'success');
    } catch (e: any) {
      showToast(`Xəta baş verdi: ${e?.message}`, 'error');
    } finally {
      setRunningScenario(null);
    }
  };

  // Scenario 3: Equipment Repair Cycle
  const runScenarioRepairFlow = () => {
    setRunningScenario('repair');
    try {
      const genclikBranch = branches.find(b => b.name.includes('Gənclik')) || branches[0];
      const printer = equipmentList.find(e => e.name.includes('Printer')) || equipmentList[0];

      // 1. Create ticket
      const ticket = createTechnicalTicket({
        branchId: genclikBranch.id,
        branchName: genclikBranch.name,
        isNonInventory: false,
        equipmentId: printer?.id,
        equipmentName: printer ? `${printer.name} (${printer.model})` : 'Creality Ender 3 V2',
        title: '3D Printer nozzle və qızdırıcı blok tıxanması',
        description: 'Ucdan-uca test ssenarisi: Filament axını dayanıb, ekstruder blokunda temperatur qeyri-sabitdir.',
        priority: 'tecili',
        createdBy: 'Gənclik Filial Meneceri',
      });

      // 2. Texnobaba updates progress
      updateTicketProgress(ticket.id, {
        status: 'filial_tesdiq_gozleyir',
        contactedBranch: true,
        contactNote: 'Filialla əlaqə saxlanıldı, təmir briqadası nozzle və blok qızdırıcısını tam yenilədi.',
        workDone: '0.4mm nozzle dəyişdirildi, PTFE borusu yeniləndi, ekstruder kalibrasiya olundu.',
        repairResult: 'Cihaz sınaqdan keçirildi, çap keyfiyyəti 100% bərpa edildi.',
      });

      // 3. Filial manager confirms resolution
      confirmTicketResolution(
        ticket.id,
        true,
        'Filial sınaq çapı etdi, cihaz ideal işləyir. Təmir rəsmən qəbul edilir.'
      );

      setLastExecutedResult({
        title: 'Ssenari 3: Texniki Müraciət və Təmir Dövrü Tamamlandı',
        description: `${printer?.name || 'Avadanlıq'} üçün təcili müraciət açıldı -> Cihaz nasaz statusuna keçdi -> Texnobaba təmiri apardı -> Filial yoxlayıb təsdiqlədi -> Cihaz işlək vəziyyətə qayıtdı və Rəsmi Texniki İcra Aktı tərtib olundu.`,
        targetTab: 'tickets',
      });

      showToast('Ssenari 3 tamamlandı! Avadanlıq bərpa olundu və Akt formalaşdı.', 'success');
    } catch (e: any) {
      showToast(`Xəta baş verdi: ${e?.message}`, 'error');
    } finally {
      setRunningScenario(null);
    }
  };

  // Scenario 4: Warehouse Intake & Branch Audit Discrepancy
  const runScenarioWarehouseAudit = () => {
    setRunningScenario('warehouse');
    try {
      const glueStickProd = inventoryProducts.find(p => p.name.includes('Silikon') || p.name.includes('Karton')) || inventoryProducts[0];
      const genclikBranch = branches.find(b => b.name.includes('Gənclik')) || branches[0];

      // 1. Central warehouse intake
      adjustCentralStock(
        glueStickProd.id,
        100,
        'Təchizatçı şirkətdən yeni partiya daxilolması (№INV-882 rəsmi faktura)'
      );

      // 2. Branch manual inventory adjustment with reason
      adjustBranchInventory(
        genclikBranch.id,
        glueStickProd.id,
        18,
        'Dövri inventarizasiya audit yoxlaması: Dərslər zamanı köhnəlmiş 2 ədəd silindi, faktiki say 18 təsdiqləndi.'
      );

      setLastExecutedResult({
        title: 'Ssenari 4: Mərkəzi Anbar Qəbulu və Filial Auditi İcra Edildi',
        description: `Mərkəzi anbara 100 ədəd «${glueStickProd.name}» daxil edildi və log yazıldı. ${genclikBranch.name} filialında isə manual inventarizasiya aparıldı (Mərkəzi anbar qalığı toxunulmaz qaldı).`,
        targetTab: 'warehouse',
      });

      showToast('Ssenari 4 uğurla icra olundu! Anbar və Filial jurnalları yeniləndi.', 'success');
    } catch (e: any) {
      showToast(`Xəta baş verdi: ${e?.message}`, 'error');
    } finally {
      setRunningScenario(null);
    }
  };

  // Scenario 5: Print preview of latest official act
  const runScenarioPrintAct = () => {
    if (inventoryActs.length === 0) {
      showToast('Hələ generasiya olunmuş akt yoxdur. Əvvəlcə Ssenari 1 və ya 2-ni icra edin.', 'info');
      return;
    }
    const actToPrint = inventoryActs[0];
    onOpenActModal(actToPrint.id);
  };

  return (
    <div className="bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
      {/* Top Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                İnteraktiv Verifikasiya və Ucdan-Uca Test Mərkəzi
              </h3>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-full text-[11px] font-bold">
                12/12 Alt Bölmə İşləkdir
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Rollar arasında sürətli keçid edin, real ssenariləri 1 kliklə icra edərək dövriyyəni, aktları və borcları canlı yoxlayın.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
          >
            <span>{isOpen ? 'Test Panelini Gizlət' : 'Test Ssenarilərini Aç'}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <button
            onClick={resetInventoryTestData}
            title="Bütün test qeydlərini sıfırla və ilkin bazaya qayıt"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">İlkin Vəziyyətə Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Expanded Test Controls */}
      {isOpen && (
        <div className="mt-5 pt-4 border-t border-blue-200/50 dark:border-blue-900/40 space-y-5">
          {/* 1. Quick Persona Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                1. Rol və Səlahiyyət Simulyatoru (Canlı RBAC Yoxlanışı)
              </span>
              <span className="text-[11px] text-slate-500">
                Cari Rol: <strong className="text-blue-600">{currentRole.toUpperCase()}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => handleSwitchRole('direktor')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentRole === 'direktor'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <div className="text-xs font-bold">Direktor</div>
                <div className={`text-[10px] mt-0.5 ${currentRole === 'direktor' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Tam Qlobal Nəzarət & Bütün Filiallar
                </div>
              </button>

              <button
                onClick={() => handleSwitchRole('texnobaba_meneceri')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentRole === 'texnobaba_meneceri'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
              >
                <div className="text-xs font-bold">Texnobaba Meneceri</div>
                <div className={`text-[10px] mt-0.5 ${currentRole === 'texnobaba_meneceri' ? 'text-amber-100' : 'text-slate-500'}`}>
                  Mərkəzi Anbar, Təsdiq & Təmir
                </div>
              </button>

              <button
                onClick={() => handleSwitchRole('menecer', branches.find(b => b.name.includes('Gənclik'))?.id || branches[0]?.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentRole === 'menecer' && currentUser?.branchId === (branches.find(b => b.name.includes('Gənclik'))?.id || branches[0]?.id)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                }`}
              >
                <div className="text-xs font-bold">Filial Meneceri</div>
                <div className={`text-[10px] mt-0.5 ${currentRole === 'menecer' ? 'text-indigo-100' : 'text-slate-500'}`}>
                  Gənclik (Yalnız öz filialı)
                </div>
              </button>

              <button
                onClick={() => handleSwitchRole('menecer', branches.find(b => b.name.includes('Nərimanov'))?.id || branches[1]?.id)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentRole === 'menecer' && currentUser?.branchId === (branches.find(b => b.name.includes('Nərimanov'))?.id || branches[1]?.id)
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                }`}
              >
                <div className="text-xs font-bold">Filial Meneceri</div>
                <div className={`text-[10px] mt-0.5 ${currentRole === 'menecer' ? 'text-purple-100' : 'text-slate-500'}`}>
                  Nərimanov (Yalnız öz filialı)
                </div>
              </button>

              <button
                onClick={() => handleSwitchRole('telimci')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  currentRole === 'telimci' || currentRole === 'sagird'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-red-400'
                }`}
              >
                <div className="text-xs font-bold">Müəllim / Şagird</div>
                <div className={`text-[10px] mt-0.5 ${currentRole === 'telimci' || currentRole === 'sagird' ? 'text-red-100' : 'text-slate-500'}`}>
                  Giriş Tam Bloklanıb (403 Testi)
                </div>
              </button>
            </div>
          </div>

          {/* 2. One-Click Real Life Scenarios */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2.5">
              <Play className="w-3.5 h-3.5 text-emerald-600" />
              2. Real Ucdan-Uca Əməliyyat Ssenariləri (Dinamik Canlı İcra)
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Scenario 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold text-xs flex items-center justify-center">1</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">DIY Material Tələbi və Təhvili</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Səbət sifarişi ➔ Texnobaba təsdiqi ➔ Göndəriş ➔ Filial təhvili ➔ Filial inventarının artması & Rəsmi DIY Aktı.
                  </p>
                </div>
                <button
                  onClick={runScenarioDiyFlow}
                  disabled={runningScenario !== null}
                  className="mt-3 w-full py-1.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-600 hover:text-white text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Ssenarini İcra Et</span>
                </button>
              </div>

              {/* Scenario 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold text-xs flex items-center justify-center">2</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Ödənişli Təchizat & Borc Zənciri</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ödənişli sifariş ➔ Filial borcunun yaranması ➔ Təhvil aktı ➔ Faktiki ödəniş daxilolması & Qalıq borc.
                  </p>
                </div>
                <button
                  onClick={runScenarioPaidFlow}
                  disabled={runningScenario !== null}
                  className="mt-3 w-full py-1.5 px-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Ssenarini İcra Et</span>
                </button>
              </div>

              {/* Scenario 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nasazlıq, Təmir və Təsdiq</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Printer nasazlığı müraciəti ➔ Texnobaba təmiri ➔ Filial sınağı və təsdiqi ➔ Təmir aktının formalaşması.
                  </p>
                </div>
                <button
                  onClick={runScenarioRepairFlow}
                  disabled={runningScenario !== null}
                  className="mt-3 w-full py-1.5 px-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-600 hover:text-white text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Ssenarini İcra Et</span>
                </button>
              </div>

              {/* Scenario 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs flex items-center justify-center">4</span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Anbar Qəbulu & Audit Fərqi</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mərkəzi anbar idxalı (+100 ədəd) ➔ Filial inventarizasiya manual düzəlişi ➔ Toxunulmazlıq sübutu.
                  </p>
                </div>
                <button
                  onClick={runScenarioWarehouseAudit}
                  disabled={runningScenario !== null}
                  className="mt-3 w-full py-1.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3 h-3" />
                  <span>Ssenarini İcra Et</span>
                </button>
              </div>
            </div>
          </div>

          {/* Last Executed Result Card */}
          {lastExecutedResult && (
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/80 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {lastExecutedResult.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {lastExecutedResult.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {lastExecutedResult.actId && (
                  <button
                    onClick={() => onOpenActModal(lastExecutedResult.actId!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Aktı A4 Çap Et</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigateTab(lastExecutedResult.targetTab)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <span>Müvafiq Bölməyə Bax</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 3. Live 12/12 Module Diagnostics Health Meter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-slate-400" />
                3. Canlı 12/12 Modul Diaqnostikası və Cari Qeyd Sayları
              </span>
              <button
                onClick={runScenarioPrintAct}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                Sonuncu Aktı A4 Çap Rejimində Sınaqdan Keçir
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center">
              <div
                onClick={() => onNavigateTab('warehouse')}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-slate-500">Mərkəzi Anbar</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {inventoryProducts.length} çeşid
                </div>
                <div className="text-[9px] text-blue-600 font-medium">Baxmaq üçün kliklə</div>
              </div>

              <div
                onClick={() => onNavigateTab('branches')}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-slate-500">Filial İnventarları</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {branchInventories.length} qeyd
                </div>
                <div className="text-[9px] text-blue-600 font-medium">Baxmaq üçün kliklə</div>
              </div>

              <div
                onClick={() => onNavigateTab('orders')}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-slate-500">Sifariş & Göndəriş</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {inventoryOrders.length} sifariş
                </div>
                <div className="text-[9px] text-blue-600 font-medium">Baxmaq üçün kliklə</div>
              </div>

              <div
                onClick={() => onNavigateTab('equipment')}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-slate-500">Avadanlıqlar</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {equipmentList.length} ədəd
                </div>
                <div className="text-[9px] text-blue-600 font-medium">Baxmaq üçün kliklə</div>
              </div>

              <div
                onClick={() => onNavigateTab('tickets')}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-slate-500">Texniki Müraciət</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {technicalTickets.length} bilet
                </div>
                <div className="text-[9px] text-blue-600 font-medium">Baxmaq üçün kliklə</div>
              </div>

              <div
                onClick={() => onNavigateTab('acts')}
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-400 cursor-pointer transition-colors"
              >
                <div className="text-[10px] text-slate-500">Generasiya Aktlar</div>
                <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {inventoryActs.length} rəsmi akt
                </div>
                <div className="text-[9px] text-emerald-600 font-medium">Çapa hazır</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
