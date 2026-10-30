import React, { useState } from 'react';
import {
  Wallet,
  DollarSign,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingDown,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { formatAZN, formatDateAz } from '../../utils/formatters';
import { Tooltip } from '../common/Tooltip';

interface DebtsPaymentsViewProps {
  selectedBranchIdFilter?: string;
}

export const DebtsPaymentsView: React.FC<DebtsPaymentsViewProps> = ({
  selectedBranchIdFilter,
}) => {
  const {
    inventoryOrders,
    inventoryPayments,
    branches,
    currentRole,
    currentUser,
    recordInventoryPayment,
    showToast,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  const [activeBranchId, setActiveBranchId] = useState<string>(
    managerBranchId || selectedBranchIdFilter || 'all'
  );

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payBranchId, setPayBranchId] = useState(() => branches.find(b => !b.isDeleted)?.id || 'branch-genclik');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Bank köçürməsi');
  const [payNote, setPayNote] = useState('');
  const [payOrderId, setPayOrderId] = useState('');

  const effectiveBranchId = managerBranchId || activeBranchId;

  // Compute branch balances
  const visibleBranches = branches.filter(b => {
    if (b.isDeleted) return false;
    if (isManager) return b.id === managerBranchId;
    if (effectiveBranchId !== 'all') return b.id === effectiveBranchId;
    return true;
  });

  const branchFinancialSummaries = visibleBranches.map(br => {
    const brOrders = inventoryOrders.filter(
      o => o.branchId === br.id && o.type === 'paid' && o.status === 'tehvil_alindi'
    );
    const totalAccrued = brOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const brPayments = inventoryPayments.filter(p => p.branchId === br.id);
    const totalPaid = brPayments.reduce((sum, p) => sum + p.amount, 0);

    const remainingDebt = Math.max(0, totalAccrued - totalPaid);

    return {
      branch: br,
      totalAccrued,
      totalPaid,
      remainingDebt,
      deliveredOrdersCount: brOrders.length,
      paymentsCount: brPayments.length,
    };
  });

  const totalAllAccrued = branchFinancialSummaries.reduce((s, b) => s + b.totalAccrued, 0);
  const totalAllPaid = branchFinancialSummaries.reduce((s, b) => s + b.totalPaid, 0);
  const totalAllDebt = branchFinancialSummaries.reduce((s, b) => s + b.remainingDebt, 0);

  const filteredPayments = inventoryPayments.filter(p => {
    if (isManager && p.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && p.branchId !== effectiveBranchId) return false;
    return true;
  });

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      showToast('Ödəniş məbləği 0-dan böyük olmalıdır.', 'error');
      return;
    }
    if (!payNote.trim()) {
      showToast('Ödəniş qeydini və ya qəbz nömrəsini daxil edin.', 'error');
      return;
    }

    recordInventoryPayment(
      payBranchId,
      payAmount,
      payMethod,
      payNote.trim(),
      payOrderId || undefined
    );

    showToast(`${formatAZN(payAmount)} məbləğində faktiki ödəniş uğurla qəbul edildi və borcdan silindi!`, 'success');
    setShowPaymentModal(false);
    setPayAmount(0);
    setPayNote('');
    setPayOrderId('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Filial Borcları və Ödənişlər Hesabı</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              Maliyyə Qalığı
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ödənişli təchizat mallarının faktiki təhvili əsasında yaranan borclar və daxil olan ödənişlərin uçotu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isManager && (
            <select
              value={effectiveBranchId}
              onChange={e => setActiveBranchId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
            >
              <option value="all">Bütün Filiallar ({branches.length})</option>
              {branches
                .filter(b => !b.isDeleted)
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          )}

          {isTexnobaba && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Faktiki Ödəniş Qəbul Et</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Təhvil Alınmış Malların Cəmi Dəyəri</span>
          <div className="text-2xl font-black text-slate-900 font-mono-nums mt-2">
            {formatAZN(totalAllAccrued)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Təhvil aktı imzalanmış rəsmi təchizat</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Faktiki Ödənilmiş Məbləğ</span>
          <div className="text-2xl font-black text-emerald-600 font-mono-nums mt-2">
            {formatAZN(totalAllPaid)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Texnobabaya daxil olmuş ödənişlər</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Qalıq Borc Məbləği</span>
          <div className="text-2xl font-black text-rose-600 font-mono-nums mt-2">
            {formatAZN(totalAllDebt)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ödənilməsi gözlənilən xalis borc</p>
        </div>
      </div>

      {/* Branch Balances Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">Filiallar Üzrə Borc və Balans Cədvəli</h3>
          <span className="text-xs text-slate-400">Yalnız təhvil alınmış ödənişli sifarişlər uçota alınır</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4 text-center">Təhvil Sayı</th>
                <th className="py-3 px-4 text-right">Uçota Alınmış Dəyər</th>
                <th className="py-3 px-4 text-right">Faktiki Ödənilmiş</th>
                <th className="py-3 px-4 text-right">Qalıq Borc</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branchFinancialSummaries.map(item => (
                <tr key={item.branch.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span>{item.branch.name}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                    {item.deliveredOrdersCount} sifariş
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatAZN(item.totalAccrued)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                    {formatAZN(item.totalPaid)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                    {formatAZN(item.remainingDebt)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Tooltip
                      content={
                        item.remainingDebt === 0
                          ? 'Bütün ödənişli təchizatlar tam ödənilib'
                          : `Cari ödənilməli qalıq borc: ${formatAZN(item.remainingDebt)}`
                      }
                    >
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.remainingDebt === 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.remainingDebt === 0 ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{item.remainingDebt === 0 ? 'Qapalı' : 'Borclu'}</span>
                      </span>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Daxil Olmuş Ödəniş Qəbzləri Tarixçəsi</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{filteredPayments.length} qəbz</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Qəbz № / Tarix</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Ödəniş Üsulu</th>
                <th className="py-3 px-4">Təyinat / Qeyd</th>
                <th className="py-3 px-4 text-right">Ödənilən Məbləğ</th>
                <th className="py-3 px-4 text-right">Qəbul Edən</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Ödəniş qeydi tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{pay.receiptNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDateAz(pay.paymentDate)}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {pay.branchName.replace('AREA ', '')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{pay.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs">{pay.note}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-600">
                      +{formatAZN(pay.amount)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">{pay.recordedBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal for Texnobaba */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Filialdan Faktiki Ödəniş Qəbulu</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ödənilmiş məbləğin sistemə daxil edilməsi və borcdan silinməsi</p>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Ödəyən Filial:</label>
                <select
                  value={payBranchId}
                  onChange={e => setPayBranchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  {branches
                    .filter(b => !b.isDeleted)
                    .map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Faktiki Ödənilən Məbləğ (AZN):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={payAmount || ''}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Məs: 150"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Ödəniş Metodu:</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Bank köçürməsi">Bank köçürməsi (Hesaba)</option>
                  <option value="Nağd / Kassa">Nağd / Filial Kassasından</option>
                  <option value="Korporativ Kart">Korporativ Kart</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Qəbz Nömrəsi və İzah Qeydi:</label>
                <textarea
                  required
                  rows={2}
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  placeholder="Məs: Oktyabr ayı 3D printer materialları üzrə 150 AZN hissəvi ödəniş, bank çıxarışı #5541..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Ləğv Et
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Ödənişi Qeydə Al
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
