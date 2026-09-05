import React from 'react';
import { ShoppingBag, ShieldCheck, User, Send, RefreshCw, Lock } from 'lucide-react';
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
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  viewMode,
  onToggleViewMode,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenAdminAuth,
  onRefresh,
  isRefreshing = false,
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#21252b] bg-[#0c0d0fe6] backdrop-blur-xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <BrandLogo size="md" showText={true} />

          {/* Telegram status indicator (when running inside Telegram Mini App) */}
          {inTelegram && tgUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#232a36] bg-[#11141a] text-[11px] text-[#8895a7] font-mono shrink-0">
              <Send className="w-3 h-3 text-[#38bdf8]" />
              <span>Mini App</span>
              <span className="text-white border-l border-[#2e343d] pl-1.5 font-medium truncate max-w-[90px]">
                @{tgUser.username || tgUser.first_name}
              </span>
            </div>
          )}
        </div>

        {/* Right actions: Mode toggle & Cart button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Refresh/Sync button */}
          {onRefresh && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onRefresh();
              }}
              disabled={isRefreshing}
              className={`h-9 w-9 flex items-center justify-center rounded-xl border border-[#262c37] bg-[#14171d] text-[#94a3b8] hover:text-white hover:bg-[#1c222c] hover:border-[#38bdf8]/50 transition-all ${
                isRefreshing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              title="Обновить каталог из базы данных"
              aria-label="Обновить каталог"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#38bdf8]' : ''}`} />
            </button>
          )}

          {/* Mode Switcher: Only shown in admin mode so admin can preview storefront */}
          {viewMode === 'admin' && (
            <button
              id="view-mode-toggle-btn"
              onClick={handleModeClick}
              className="h-9 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-mono tracking-wider transition-all duration-200 bg-[#e2e8f0] text-[#0f172a] border-[#e2e8f0] font-bold shadow-[0_0_18px_rgba(226,232,240,0.25)] hover:bg-white"
              title="Вернуться в витрину магазина"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0f172a]" />
              <span className="hidden xs:inline">Витрина</span>
            </button>
          )}

          {/* Cart trigger */}
          <button
            id="cart-drawer-trigger-btn"
            onClick={handleCartClick}
            className="h-9 relative flex items-center gap-2 px-3 sm:px-3.5 rounded-xl bg-[#14171d] border border-[#262c37] text-white hover:border-[#47505e] hover:bg-[#1c222c] transition-all duration-200"
            aria-label="Корзина"
          >
            <ShoppingBag className="w-4 h-4 text-[#cbd5e1]" />
            <span className="text-xs font-mono font-medium hidden sm:inline">
              {cartTotal > 0 ? `${cartTotal.toLocaleString('ru-RU')} ${settings.currency}` : 'Корзина'}
            </span>
            {cartCount > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#f1f5f9] text-[#090a0c] text-[11px] font-bold font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
