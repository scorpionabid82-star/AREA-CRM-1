import React from 'react';
import { Printer, X, CheckCircle2, ShieldCheck, Building2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { InventoryAct } from '../../types/crm';
import { formatAZN, formatDateAz } from '../../utils/formatters';

interface ActPrintModalProps {
  act: InventoryAct | null;
  onClose: () => void;
  onSign?: (role: 'manager' | 'texnobaba') => void;
  currentUserRole?: string;
}

export const ActPrintModal: React.FC<ActPrintModalProps> = ({
  act,
  onClose,
  onSign,
  currentUserRole,
}) => {
  if (!act) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaidType = act.type === 'odenisli_tehvil';
  const isTechnicalType = act.type === 'texniki_icra';
  const isDiyType = act.type === 'diy_tehvil';
  const isEquipmentType = act.type === 'avadanliq_tehvil';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Action Bar (No-Print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">{act.title}</h2>
              <p className="text-[11px] text-slate-300 font-mono">Akt №: {act.actNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Çap Et / PDF Yadda Saxla</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Official Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-slate-800 font-sans print:p-0 print:m-0 print:overflow-visible">
          <div className="border border-slate-300 rounded-xl p-8 bg-white shadow-xs relative print:border-none print:shadow-none print:p-2">
            {/* Watermark / Stamp Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <span className="text-8xl font-black uppercase text-slate-900 rotate-[-25deg]">
                AREA CRM
              </span>
            </div>

            {/* Document Header */}
            <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    A
                  </div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                    «AREA» TƏDRİS VƏ İNNOVASİYA MƏRKƏZİ
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mərkəzi Təchizat, İnventarizasiya və Texniki Xidmət Departamenti («Texnobaba»)
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-100 text-slate-800 border border-slate-300">
                  {act.actNumber}
                </span>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{formatDateAz(act.generatedAt)}</span>
                </p>
              </div>
            </div>

            {/* Act Title */}
            <div className="text-center my-6">
              <h2 className="text-base font-black uppercase tracking-wide text-slate-900 underline decoration-2 underline-offset-4">
                {act.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Əsas: <span className="font-semibold text-slate-700">{act.referenceNumber}</span> nömrəli əməliyyat üzrə
              </p>
            </div>

            {/* Parties Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs mb-6">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Təhvil Verən Tərəf:</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">«Texnobaba» Mərkəzi Anbarı</p>
                <p className="text-slate-600 mt-0.5">Təchizat və Texniki Xidmət Departamenti</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Qəbul Edən Tərəf:</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{act.branchName}</p>
                <p className="text-slate-600 mt-0.5">Filial Rəhbərliyi və Maddi Məsul Heyət</p>
              </div>
            </div>

            {/* Content Details: Technical Work */}
            {isTechnicalType && (
              <div className="space-y-4 mb-6 text-xs">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    1. Görülən Texniki İşlərin Təsviri:
                  </h3>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {act.details.workDone || 'Texniki diaqnostika və bərpa işləri həyata keçirilmişdir.'}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    2. Təmir Nəticəsi və Test Yoxlanışı:
                  </h3>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {act.details.repairResult || 'Bütün funksiyalar yoxlanılmış, texniki təhlükəsizlik və işləklik normaya uyğundur.'}
                  </div>
                </div>
              </div>
            )}

            {/* Content Details: Items Table (for DIY, Paid, Equipment) */}
            {(isDiyType || isPaidType || isEquipmentType) && act.details.items && (
              <div className="mb-6">
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                  Təhvil Verilən Məhsul və Materialların Siyahısı:
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">№</th>
                        <th className="py-2 px-3">Məhsul / Materialın Adı</th>
                        <th className="py-2 px-3 text-center">Miqdar</th>
                        <th className="py-2 px-3 text-center">Ölçü Vahidi</th>
                        {isPaidType && <th className="py-2 px-3 text-right">Qiymət</th>}
                        {isPaidType && <th className="py-2 px-3 text-right">Cəmi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {act.details.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{it.name}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-900">{it.quantity}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{it.unit || 'ədəd'}</td>
                          {isPaidType && (
                            <td className="py-2 px-3 text-right text-slate-600">{formatAZN(it.price || 0)}</td>
                          )}
                          {isPaidType && (
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {formatAZN((it.quantity || 0) * (it.price || 0))}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    {isPaidType && act.details.totalAmount !== undefined && (
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={5} className="py-2 px-3 text-right text-slate-700">
                            Yekun Sifariş Dəyəri:
                          </td>
                          <td className="py-2 px-3 text-right text-indigo-700 font-black">
                            {formatAZN(act.details.totalAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* Mandatory Legal Disclaimer / Notice */}
            {act.details.disclaimer && (
              <div
                className={`p-3.5 rounded-lg border text-xs mb-8 flex items-start gap-2.5 ${
                  isPaidType
                    ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="leading-relaxed font-medium">
                  <strong>HÜQUQİ QEYD:</strong> {act.details.disclaimer}
                </div>
              </div>
            )}

            {/* Signature & Seal Block */}
            <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
              {/* Texnobaba Representative */}
              <div className="space-y-3">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Təhvil Verən («Texnobaba»):
                </p>
                <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-between pb-1">
                  <span className="text-[11px] text-slate-500">İmza və Möhür:</span>
                  {act.signedByTexnobaba ? (
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {act.signedByTexnobaba}
                    </span>
                  ) : (
                    currentUserRole === 'texnobaba_meneceri' && onSign && (
                      <button
                        onClick={() => onSign('texnobaba')}
                        className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 no-print"
                      >
                        İmzala
                      </button>
                    )
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Texniki Xidmət və Mərkəzi Anbar Meneceri</p>
              </div>

              {/* Branch Manager */}
              <div className="space-y-3">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Təhvil Alan ({act.branchName}):
                </p>
                <div className="h-12 border-b border-dashed border-slate-400 flex items-end justify-between pb-1">
                  <span className="text-[11px] text-slate-500">İmza və Möhür:</span>
                  {act.signedByManager ? (
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {act.signedByManager}
                    </span>
                  ) : (
                    (currentUserRole === 'menecer' || currentUserRole === 'direktor') && onSign && (
                      <button
                        onClick={() => onSign('manager')}
                        className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 no-print"
                      >
                        İmzala
                      </button>
                    )
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Filial Meneceri / Maddi Məsul Şəxs</p>
              </div>
            </div>

            {/* System Verification Note */}
            <div className="mt-8 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>AREA CRM elektron təsdiq sistemi tərəfindən generasiya edilmişdir.</span>
              </span>
              <span className="font-mono">Tarix: {new Date(act.generatedAt).toLocaleString('az-AZ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
