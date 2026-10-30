import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Loader2,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useCrm, isDirectorEmail } from '../../context/CrmContext';

interface LoginGatewayProps {
  onOpenPublicPortal?: () => void;
}

export const LoginGateway: React.FC<LoginGatewayProps> = () => {
  const {
    loginWithGoogle,
    authLoading,
    accessDeniedEmail,
    dismissAccessDenied
  } = useCrm();

  const handleRetryDifferentAccount = () => {
    dismissAccessDenied();
    // Allow small microtask tick then trigger Google popup
    setTimeout(() => {
      loginWithGoogle();
    }, 150);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Access Denied Modal for Non-Whitelisted / Unauthorized Gmail */}
      {accessDeniedEmail && !isDirectorEmail(accessDeniedEmail) && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Giriş İcazəniz Yoxdur və ya Hesab Qeydiyyatda Deyil
              </h3>
              <p className="text-xs text-rose-400 font-mono break-all py-1 px-2.5 bg-rose-500/10 rounded-lg inline-block border border-rose-500/20 mt-1">
                {accessDeniedEmail}
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-left">
              Bu Gmail ünvanı AREA-CRM sisteminin səlahiyyətli istifadəçilər siyahısında (whitelist) tapılmadı və ya inzibatçı tərəfindən dondurulub.
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>Rəhbərliklə Əlaqə:</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Əgər AREA Academy əməkdaşısınızsa (Baş ofis və ya regional filial), e-poçtunuzun bazaya daxil edilməsi üçün mərkəz rəhbərliyinə müraciət edin:
              </p>
              <div className="font-mono text-[10px] text-indigo-300">
                scorpionabid82@gmail.com
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleRetryDifferentAccount}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Fərqli Gmail Seç</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={dismissAccessDenied}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Bağla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Production Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 sm:p-9 text-white shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/30 mx-auto">
            A
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">
                AREA CRM
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PROD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              AREA Academy Tədris Mərkəzi İdarəetmə Portalı
            </p>
          </div>
        </div>

        {/* Primary Action: Official Google Sign-In Button */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={authLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 rounded-2xl font-bold text-sm shadow-lg shadow-white/5 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-slate-700 animate-spin" />
                <span className="text-slate-800">Google ilə əlaqə qurulur...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.44 7.37 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.56 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="font-semibold text-slate-900 group-hover:text-black">
                  Gmail ilə Daxil Ol
                </span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            1-kliklə rəsmi Google Workspace və ya Gmail hesabı ilə təhlükəsiz giriş
          </p>
        </div>

        {/* Security & Whitelist Assurance Box */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80 text-left space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Təhlükəsizlik və İcazə Qaydaları</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sistemə yalnız AREA Academy Baş ofis və regional filiallar (Zaqatala, Gəncə, Sumqayıt və s.) üzrə qeydiyyatdan keçmiş rəsmi Gmail hesabları daxil ola bilər.
          </p>
          <div className="pt-1 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              256-bit Şifrələnmiş Sessiya
            </span>
            <span className="text-emerald-400 font-medium">Whitelist Aktivdir</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-500 flex items-center justify-between">
          <span>AREA Tədris Mərkəzi</span>
          <span>Bütün hüquqlar qorunur © 2026</span>
        </div>
      </div>
    </div>
  );
};
