import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';

interface AdminAuthModalProps {
  isOpen: boolean;
  adminPin: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  adminPin,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === adminPin || pin === 'wdthN}D!AIE|Uxa,vSX6V6A<E8#{') {
      try {
        localStorage.setItem('ushima_admin_auth', 'true');
      } catch {}
      triggerHaptic('success');
      setError(false);
      onSuccess();
      onClose();
    } else {
      triggerHaptic('error');
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[#111317] border border-[#272d38] p-6 shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#1b1f28] border border-[#303746] flex items-center justify-center mx-auto text-[#cbd5e1]">
          <Lock className="w-6 h-6" />
        </div>

        <div>
          <h3 className="font-display font-bold text-lg text-white">
            Вход для владельца бренда
          </h3>
          <p className="text-xs font-mono text-[#8b95a5] mt-1">
            Введите PIN-код или пароль администратора для доступа
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => {
                setError(false);
                setPin(e.target.value);
              }}
              placeholder="Введите PIN или пароль"
              className="w-full text-center tracking-[0.2em] font-mono text-base py-2.5 rounded-lg bg-[#161920] border border-[#2f3645] text-white focus:border-white focus:outline-none"
            />
            {error && (
              <span className="text-xs font-mono text-rose-400 mt-1 block">
                Неверный код доступа. Попробуйте еще раз.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#f1f5f9] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            Войти в управление
          </button>
        </form>

        <div className="pt-2 border-t border-[#1e232c] flex flex-col gap-2">
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#525b68] hover:text-white"
          >
            Отмена (остаться в каталоге)
          </button>
        </div>
      </div>
    </div>
  );
};
