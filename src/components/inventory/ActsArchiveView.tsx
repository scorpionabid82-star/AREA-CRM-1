import React, { useState } from 'react';
import {
  FileSignature,
  Printer,
  Search,
  Filter,
  Eye,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Tag,
  Boxes,
  Cpu,
  PackageCheck,
  Wrench,
  Clock
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventoryAct, InventoryActType } from '../../types/crm';
import { formatDateAz } from '../../utils/formatters';
import { ActPrintModal } from './ActPrintModal';
import { Tooltip } from '../common/Tooltip';

interface ActsArchiveViewProps {
  selectedBranchIdFilter?: string;
  initialActId?: string;
}

export const ActsArchiveView: React.FC<ActsArchiveViewProps> = ({
  selectedBranchIdFilter,
  initialActId,
}) => {
  const {
    inventoryActs,
    branches,
    currentRole,
    currentUser,
    signAct,
  } = useCrm();

  const isDirector = currentRole === 'direktor';
  const isTexnobaba = currentRole === 'texnobaba_meneceri';
  const isManager = currentRole === 'menecer';
  const managerBranchId = isManager && currentUser?.branchId && currentUser.branchId !== 'all' ? currentUser.branchId : null;

  const [activeBranchId, setActiveBranchId] = useState<string>(
    managerBranchId || selectedBranchIdFilter || 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | InventoryActType>('all');

  const [openedAct, setOpenedAct] = useState<InventoryAct | null>(() => {
    if (initialActId) {
      return inventoryActs.find(a => a.id === initialActId) || null;
    }
    return null;
  });

  const effectiveBranchId = managerBranchId || activeBranchId;

  const filteredActs = inventoryActs.filter(act => {
    if (isManager && act.branchId !== managerBranchId) return false;
    if (!isManager && effectiveBranchId !== 'all' && act.branchId !== effectiveBranchId) return false;

    const matchesSearch =
      act.actNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.branchName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || act.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getActTypeBadge = (t: InventoryActType) => {
    switch (t) {
      case 'texniki_icra':
        return (
          <Tooltip content="Texniki Təmir və Bərpa İşlərinin İcra Aktı">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Wrench className="w-3 h-3 text-blue-600" />
              <span>Texniki İcra</span>
            </span>
          </Tooltip>
        );
      case 'avadanliq_tehvil':
        return (
          <Tooltip content="Avadanlıq və Ehtiyat Hissələrinin Təhvil-Təslim Aktı">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              <Cpu className="w-3 h-3 text-purple-600" />
              <span>Avadanlıq</span>
            </span>
          </Tooltip>
        );
      case 'diy_tehvil':
        return (
          <Tooltip content="Dövri DIY Tədris Materiallarının Təhvil Aktı">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Boxes className="w-3 h-3 text-indigo-600" />
              <span>DIY Təhvil</span>
            </span>
          </Tooltip>
        );
      case 'odenisli_tehvil':
        return (
          <Tooltip content="Ödənişli Təchizat Mallarının Təhvil Aktı (Borcu silmir)">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <PackageCheck className="w-3 h-3 text-amber-600" />
              <span>Ödənişli Təhvil</span>
            </span>
          </Tooltip>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Rəsmi Aktlar və Elektron Sənəd Arxivi</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Elektron İmza & Çap
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Texniki işlərin icrası, avadanlıqların və tədris materiallarının təhvil-təslim aktları reyestri
          </p>
        </div>

        {!isManager && (
          <select
            value={effectiveBranchId}
            onChange={e => setActiveBranchId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-900 cursor-pointer"
          >
            <option value="all">Bütün Filiallar ({inventoryActs.length})</option>
            {branches
              .filter(b => !b.isDeleted)
              .map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
          </select>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Akt nömrəsi (AKT-...), sənəd adı və ya əməliyyat əsası axtar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 cursor-pointer"
        >
          <option value="all">Bütün Akt Növləri (4 Növ)</option>
          <option value="texniki_icra">Texniki İşlərin İcra Aktı</option>
          <option value="avadanliq_tehvil">Avadanlıq Təhvil-Təslim Aktı</option>
          <option value="diy_tehvil">DIY Tədris Təhvil Aktı</option>
          <option value="odenisli_tehvil">Ödənişli Təchizat Təhvil Aktı</option>
        </select>
      </div>

      {/* Acts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Akt № / Tarix</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Sənədin Başlığı</th>
                <th className="py-3 px-4">Aktın Növü</th>
                <th className="py-3 px-4">Əlaqəli Əməliyyat</th>
                <th className="py-3 px-4">İmzalanma Vəziyyəti</th>
                <th className="py-3 px-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Axtarışa uyğun arxiv aktı tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredActs.map(act => (
                  <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{act.actNumber}</span>
                      <span className="text-[11px] text-slate-400">{formatDateAz(act.generatedAt)}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {act.branchName.replace('AREA ', '')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{act.title}</p>
                      {act.type === 'odenisli_tehvil' && (
                        <p className="text-[10px] text-amber-700 font-medium">
                          * Borcun ödənildiyini təsdiq etmir (təchizat qəbulu)
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">{getActTypeBadge(act.type)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {act.referenceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {act.signedByManager && act.signedByTexnobaba ? (
                        <Tooltip content={`Elektron imza təsdiqlənib: ${act.signedByManager} & ${act.signedByTexnobaba}`}>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>İmzalanıb</span>
                          </span>
                        </Tooltip>
                      ) : (
                        <Tooltip content={act.signedByTexnobaba ? 'Texnobaba təsdiq edib, filial imzası gözlənilir' : 'Filial qəbul edib, Texnobaba imzası gözlənilir'}>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Gözləyir</span>
                          </span>
                        </Tooltip>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Tooltip content="Aktı tam ekran aç və A4 formatında çap et">
                        <button
                          onClick={() => setOpenedAct(act)}
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Printable Act Modal */}
      {openedAct && (
        <ActPrintModal
          act={openedAct}
          currentUserRole={currentRole}
          onClose={() => setOpenedAct(null)}
          onSign={role => {
            signAct(openedAct.id, role);
            // Refresh local state
            setOpenedAct(prev =>
              prev
                ? {
                    ...prev,
                    signedByManager: role === 'manager' ? currentUser?.fullName || 'Filial Meneceri' : prev.signedByManager,
                    signedByTexnobaba: role === 'texnobaba' ? currentUser?.fullName || 'Texnobaba Baş Meneceri' : prev.signedByTexnobaba,
                  }
                : null
            );
          }}
        />
      )}
    </div>
  );
};
