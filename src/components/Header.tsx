import React from 'react';
import { ShoppingBag, ShieldCheck, User, Sparkles, Send, HelpCircle } from 'lucide-react';
import { BrandSettings, ViewMode } from '../types';
import { isInsideTelegram, getTelegramUser, triggerHaptic } from '../utils/telegram';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  settings: BrandSettings;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenAdminAuth: () => void;
  onOpenTelegramSetup: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  viewMode,
  onToggleViewMode,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAdminAuth,
  onOpenTelegramSetup,
}) => {
  const tgUser = getTelegramUser();
  const inTelegram = isInsideTelegram();

  const handleCartClick = () => {
    triggerHaptic('light');
    onOpenCart();
  };

  const handleModeClick = () => {
    triggerHaptic('medium');
    if (viewMode === 'client') {
      onOpenAdminAuth();
    } else {
      onToggleViewMode();
    }
  };

  const handleSetupClick = () => {
    triggerHaptic('light');
    onOpenTelegramSetup();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21252b] bg-[#0c0d0fe6] backdrop-blur-xl transition-all">
      {/* Top micro banner */}
      {settings.announcementText && (
        <div className="w-full bg-[#14161a] border-b border-[#1f2329] px-3 py-1.5 text-center">
          <p className="text-[10px] md:text-[11px] font-mono tracking-widest text-[#9ca3af] uppercase flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#cbd5e1] animate-pulse" />
            {settings.announcementText}
          </p>
        </div>
      )}

      {/* Main navigation container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <BrandLogo size="md" showText={true} />

          {/* Telegram badge indicator / quick guide */}
          <button
            onClick={handleSetupClick}
            title="Инструкция по запуску в Telegram"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2b3444] bg-[#151821] hover:bg-[#1a1f2c] hover:border-[#38bdf8]/50 text-[11px] text-[#94a3b8] hover:text-white font-mono transition-all group"
          >
            <Send className="w-3 h-3 text-[#38bdf8] group-hover:scale-110 transition-transform" />
            <span>{inTelegram ? 'TG Mini App' : 'Запуск в TG'}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#222938] text-[#38bdf8]">2 мин</span>
            {tgUser?.first_name && (
              <span className="text-white border-l border-[#2e343d] pl-1.5 font-medium truncate max-w-[90px]">
                @{tgUser.username || tgUser.first_name}
              </span>
            )}
          </button>
        </div>

        {/* Right actions: Mode toggle & Cart button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick TG setup button for mobile */}
          <button
            onClick={handleSetupClick}
            className="sm:hidden p-2 rounded-lg border border-[#262c37] bg-[#14171d] text-[#38bdf8] hover:bg-[#1c222c] transition-colors"
            title="Инструкция TG"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Mode Switcher Button: Client vs Brand Owner */}
          <button
            id="view-mode-toggle-btn"
            onClick={handleModeClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono tracking-wider transition-all duration-200 ${
              viewMode === 'admin'
                ? 'bg-[#e2e8f0] text-[#0f172a] border-[#e2e8f0] font-bold shadow-[0_0_18px_rgba(226,232,240,0.25)]'
                : 'bg-[#181c24] text-[#cbd5e1] border-[#333d4e] hover:border-white hover:text-white hover:bg-[#202632]'
            }`}
            title={viewMode === 'admin' ? 'Вернуться в режим покупателя' : 'Панель управления (редактирование товаров, цен, фото)'}
          >
            {viewMode === 'admin' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[#0f172a]" />
                <span className="hidden xs:inline">Панель:</span>
                <span>Владелец</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="font-semibold">Админка</span>
              </>
            )}
          </button>

          {/* Cart trigger (shown in client view or accessible in admin) */}
          <button
            id="cart-drawer-trigger-btn"
            onClick={handleCartClick}
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181b20] border border-[#2b313a] text-white hover:border-[#47505e] hover:bg-[#20242b] transition-all duration-200"
            aria-label="Корзина"
          >
            <ShoppingBag className="w-4 h-4 text-[#cbd5e1]" />
            <span className="text-xs font-mono font-medium hidden sm:inline">
              {cartTotal > 0 ? `${cartTotal.toLocaleString('ru-RU')} ${settings.currency}` : 'Корзина'}
            </span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#f1f5f9] text-[#090a0c] text-[11px] font-bold font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
