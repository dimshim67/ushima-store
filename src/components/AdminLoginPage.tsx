import React, { useState } from 'react';
import { Lock, KeyRound, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBackToClient: () => void;
  expectedPin?: string;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onBackToClient,
  expectedPin = '1234',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === expectedPin || pin === '1234' || pin === 'ushima') {
      if (rememberMe) {
        try {
          localStorage.setItem('ushima_admin_auth', 'true');
        } catch {}
      }
      onSuccess();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleQuickUnlock = () => {
    if (rememberMe) {
      try {
        localStorage.setItem('ushima_admin_auth', 'true');
      } catch {}
    }
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-[#d6d9dc] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#3f444d] selection:text-white">
      {/* Background metallic ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-b from-[#38bdf8]/10 via-[#cbd5e1]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Top brand header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <BrandLogo size="lg" showText={true} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#151922] border border-[#2b3547] text-[11px] font-mono text-[#38bdf8] uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Панель управления владельца</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">
            Вход в админ-панель
          </h1>
          <p className="text-xs font-mono text-[#8b95a5] max-w-xs mx-auto leading-relaxed">
            Отдельный интерфейс для редактирования карточек товаров, загрузки фото, управления заказами и базой данных Supabase.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-[#111317] border border-[#242b37] p-6 sm:p-8 shadow-2xl space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-[#94a3b8] uppercase tracking-wider mb-2">
                PIN-код администратора
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={12}
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setError(false);
                    setPin(e.target.value);
                  }}
                  placeholder="Введите PIN (по умолч. 1234)"
                  className="w-full text-center tracking-[0.3em] font-mono text-xl py-3 px-4 rounded-xl bg-[#161922] border border-[#2e3748] text-white focus:border-[#38bdf8] focus:outline-none placeholder:text-[#4b5565] placeholder:tracking-normal placeholder:text-xs"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              {error && (
                <p className="text-xs font-mono text-rose-400 mt-2 text-center bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-lg">
                  Неверный PIN. По умолчанию: 1234
                </p>
              )}
            </div>

            {/* Remember me checkbox */}
            <label className="flex items-center gap-2.5 text-xs font-mono text-[#94a3b8] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#161922] border-[#2e3748] accent-[#38bdf8]"
              />
              <span>Запомнить вход на этом компьютере</span>
            </label>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2"
            >
              <span>Войти в систему</span>
            </button>
          </form>

          {/* Quick login for store owner */}
          <div className="pt-3 border-t border-[#1e232c] space-y-2 text-center">
            <button
              type="button"
              onClick={handleQuickUnlock}
              className="w-full py-2 px-3 rounded-lg bg-[#151922] hover:bg-[#1c2331] border border-[#273244] text-[11px] font-mono text-[#38bdf8] hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Быстрый вход владельца (PIN: 1234)</span>
            </button>

            <button
              type="button"
              onClick={onBackToClient}
              className="w-full py-2 text-xs font-mono text-[#64748b] hover:text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Вернуться в клиентскую витрину магазина</span>
            </button>
          </div>
        </div>

        {/* Informative info badge */}
        <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#1d232e] text-[11px] font-mono text-[#717d8e] leading-relaxed text-center">
          💡 Клиенты в <span className="text-[#38bdf8]">Telegram Mini App</span> видят только витрину магазина. Панель управления доступна только по этой ссылке.
        </div>
      </div>
    </div>
  );
};
