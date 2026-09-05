import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, KeyRound, ArrowLeft, ShieldCheck, Check, Sparkles, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { api } from '../services/api';

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
  const [authMethod, setAuthMethod] = useState<'password' | 'pin'>('password');
  const [email, setEmail] = useState('dimshim67@gmail.com');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await api.adminLogin({ email: email.trim(), password });
      if (res.success) {
        if (rememberMe) {
          try {
            localStorage.setItem('ushima_admin_auth', 'true');
            if (res.user?.email) {
              localStorage.setItem('ushima_admin_user', res.user.email);
            }
          } catch {}
        }
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Неверный email или пароль');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка связи с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.adminLogin({ pin: pin.trim() });
      if (res.success) {
        if (rememberMe) {
          try {
            localStorage.setItem('ushima_admin_auth', 'true');
            localStorage.setItem('ushima_admin_user', 'dimshim67@gmail.com');
          } catch {}
        }
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Неверный PIN-код доступа');
        setPin('');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ошибка связи с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-[#d6d9dc] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-[#3f444d] selection:text-white">
      {/* Background metallic ambient light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-b from-[#38bdf8]/10 via-[#cbd5e1]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

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
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Вход в админ-панель
          </h1>
          <p className="text-xs font-mono text-[#8b95a5] max-w-sm mx-auto leading-relaxed">
            Авторизация администратора по Email & Паролю с поддержкой облака Supabase.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-[#111317] border border-[#242b37] p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Method tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#161922] border border-[#262f40]">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-mono font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'password'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b95a5] hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email и Пароль</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('pin');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-mono font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMethod === 'pin'
                  ? 'bg-white text-black shadow-md'
                  : 'text-[#8b95a5] hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Быстрый PIN</span>
            </button>
          </div>

          {/* Form: Email + Password */}
          {authMethod === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] uppercase tracking-wider mb-1.5">
                  Email администратора
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setErrorMessage(null);
                      setEmail(e.target.value);
                    }}
                    placeholder="dimshim67@gmail.com"
                    className="w-full font-mono text-sm py-2.5 pl-10 pr-4 rounded-xl bg-[#161922] border border-[#2e3748] text-white focus:border-[#38bdf8] focus:outline-none placeholder:text-[#4b5565]"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-[#94a3b8] uppercase tracking-wider">
                    Пароль администратора
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setErrorMessage(null);
                      setPassword(e.target.value);
                    }}
                    placeholder="Введите пароль..."
                    className="w-full font-mono text-sm py-2.5 pl-10 pr-10 rounded-xl bg-[#161922] border border-[#2e3748] text-white focus:border-[#38bdf8] focus:outline-none placeholder:text-[#4b5565]"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

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
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Проверка доступа...</span>
                  </>
                ) : (
                  <span>Войти в админ-панель</span>
                )}
              </button>
            </form>
          ) : (
            /* Form: PIN code */
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-[#94a3b8] uppercase tracking-wider mb-2">
                  Резервный PIN-код владельца
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={12}
                    autoFocus
                    value={pin}
                    onChange={(e) => {
                      setErrorMessage(null);
                      setPin(e.target.value);
                    }}
                    placeholder="Введите секретный PIN"
                    className="w-full text-center tracking-[0.3em] font-mono text-xl py-3 px-4 rounded-xl bg-[#161922] border border-[#2e3748] text-white focus:border-[#38bdf8] focus:outline-none placeholder:text-[#4b5565] placeholder:tracking-normal placeholder:text-xs"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs font-mono text-rose-400 mt-2 text-center bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-lg">
                    {errorMessage}
                  </p>
                )}
              </div>

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
                <span>Войти по PIN-коду</span>
              </button>
            </form>
          )}

          {/* Quick login & Back to store buttons */}
          <div className="pt-3 border-t border-[#1e232c] space-y-2 text-center">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full py-1.5 text-[11px] font-mono text-[#8b95a5] hover:text-[#38bdf8] transition-colors flex items-center justify-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showGuide ? 'Скрыть инструкцию по Supabase' : 'Как настроить авторизацию в Supabase?'}</span>
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

        {/* Supabase Auth step-by-step accordion guide */}
        {showGuide && (
          <div className="p-4 rounded-xl bg-[#11141a] border border-[#273244] text-xs font-mono space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
              <span>Настройка авторизации в Supabase</span>
            </div>
            <ol className="space-y-2 text-[#94a3b8] list-decimal list-inside leading-relaxed text-[11px]">
              <li>
                Откройте проект в <strong className="text-white">Supabase Dashboard</strong>.
              </li>
              <li>
                В меню слева выберите раздел <strong className="text-white">Authentication → Users</strong>.
              </li>
              <li>
                Нажмите зеленую кнопку <strong className="text-white">Add user → Create user</strong>.
              </li>
              <li>
                Укажите Email: <code className="text-[#38bdf8]">dimshim67@gmail.com</code> (или email сотрудника) и ваш пароль администратора.
              </li>
              <li>
                Поставьте галочку <strong className="text-white">Auto Confirm User?</strong> (чтобы не ждать подтверждения почты) и нажмите кнопку <strong className="text-white">Create user</strong>.
              </li>
            </ol>
            <div className="pt-2 border-t border-[#1d2533] text-[10px] text-[#64748b]">
              ✨ После этого вы и любой добавленный администратор сможете входить под своей учетной записью.
            </div>
          </div>
        )}

        {/* Informative info badge */}
        <div className="p-3.5 rounded-xl bg-[#0e1117] border border-[#1d232e] text-[11px] font-mono text-[#717d8e] leading-relaxed text-center">
          💡 Покупатели в <span className="text-[#38bdf8]">Telegram Mini App</span> видят только витрину и каталог одежды. Панель управления доступна только владельцу.
        </div>
      </div>
    </div>
  );
};
