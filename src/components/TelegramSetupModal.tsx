import React, { useState } from 'react';
import { X, Send, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { BrandSettings } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface TelegramSetupModalProps {
  isOpen: boolean;
  settings: BrandSettings;
  onClose: () => void;
}

export const TelegramSetupModal: React.FC<TelegramSetupModalProps> = ({
  isOpen,
  settings,
  onClose,
}) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ваш-сайт.com';
  const cleanBot = settings.botUsername.replace(/^@/, '');

  const handleCopy = (text: string, id: string) => {
    triggerHaptic('medium');
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="telegram-setup-modal-dialog"
        className="relative z-10 w-full max-w-2xl bg-[#0f1115] border border-[#272d39] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-[#212632] flex items-center justify-between bg-gradient-to-r from-[#141720] via-[#111319] to-[#0d0e12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center text-[#38bdf8]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-white">
                Запуск магазина «УШИМА» в Telegram
              </h3>
              <p className="text-xs font-mono text-[#8b96a7]">
                Простая пошаговая настройка через @BotFather за 2 минуты
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1f242e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm font-mono text-[#cbd5e1]">
          {/* Direct App Link */}
          <div className="p-4 rounded-xl bg-[#14171e] border border-[#2b3342] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
                1. Ссылка на ваш сайт (URL для Web App):
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
                СКОПИРУЙТЕ ЭТУ ССЫЛКУ
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 px-3 py-2 rounded-lg bg-[#0b0c0e] border border-[#2c3444] text-white text-xs font-mono select-all"
              />
              <button
                onClick={() => handleCopy(appUrl, 'app-url')}
                className="px-3.5 py-2 rounded-lg bg-[#f1f5f9] text-[#090a0c] text-xs font-bold font-mono hover:bg-white flex items-center gap-1.5 transition-all"
              >
                {copiedStep === 'app-url' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedStep === 'app-url' ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>
          </div>

          {/* 3 Step Guide */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#38bdf8]" />
              3 шага для привязки к Telegram боту:
            </h4>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[#121419] border border-[#222731] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <span className="w-5 h-5 rounded-full bg-[#1e232c] border border-[#333b49] flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <span>Откройте @BotFather в Telegram</span>
                </div>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1"
                >
                  <span>Перейти к @BotFather</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-[#8c98a8] leading-relaxed">
                Если у вас ещё нет бота, отправьте команду <code className="bg-[#1a1d24] px-1.5 py-0.5 rounded text-white font-bold">/newbot</code>, задайте имя <strong className="text-white">УШИМА</strong> и юзернейм (например, <span className="text-[#38bdf8]">ushima_app_bot</span>).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-[#121419] border border-[#222731] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <span className="w-5 h-5 rounded-full bg-[#1e232c] border border-[#333b49] flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span>Создайте Mini App (команда /newapp)</span>
                </div>
                <button
                  onClick={() => handleCopy('/newapp', 'newapp-cmd')}
                  className="text-[11px] text-[#cbd5e1] hover:text-white flex items-center gap-1"
                >
                  {copiedStep === 'newapp-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Копировать команду</span>
                </button>
              </div>
              <p className="text-xs text-[#8c98a8] leading-relaxed">
                Отправьте <code className="bg-[#1a1d24] px-1.5 py-0.5 rounded text-white font-bold">/newapp</code>, выберите вашего бота и укажите:
              </p>
              <ul className="text-xs text-[#94a3b8] space-y-1 pl-4 list-disc">
                <li>Название: <strong className="text-white">УШИМА</strong></li>
                <li>Краткое описание: <strong className="text-white">Каталог одежды бренда УШИМА</strong></li>
                <li>Картинку или логотип (640x640)</li>
                <li>
                  В поле Web App URL вставьте: <span className="text-[#38bdf8] font-bold">{appUrl}</span>
                </li>
                <li>Короткое имя (short name): например, <strong className="text-white">shop</strong></li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-[#121419] border border-[#222731] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <span className="w-5 h-5 rounded-full bg-[#1e232c] border border-[#333b49] flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  <span>Включите кнопку «Каталог УШИМА» внизу чата</span>
                </div>
              </div>
              <p className="text-xs text-[#8c98a8] leading-relaxed">
                Чтобы у любого пользователя внизу экрана была кнопка открытия магазина:
              </p>
              <ol className="text-xs text-[#94a3b8] space-y-1 pl-4 list-decimal">
                <li>Отправьте команду <code className="bg-[#1a1d24] px-1.5 py-0.5 rounded text-white font-bold">/setmenubutton</code> в @BotFather</li>
                <li>Выберите вашего бота</li>
                <li>Вставьте URL сайта: <span className="text-[#38bdf8] font-bold">{appUrl}</span></li>
                <li>Текст кнопки: <strong className="text-white">Каталог УШИМА</strong></li>
              </ol>
            </div>
          </div>

          {/* Test Link */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#172333] via-[#131b26] to-[#0f141d] border border-[#27405c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-white font-bold text-xs block">
                Бот для заказов в настройках:
              </span>
              <span className="text-[11px] text-[#38bdf8]">
                @{cleanBot}
              </span>
            </div>
            <a
              href={`https://t.me/${cleanBot}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-[#38bdf8] text-[#082f49] text-xs font-bold flex items-center gap-1.5 hover:bg-[#7dd3fc] transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Открыть бота в Telegram</span>
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#212632] bg-[#121419] flex items-center justify-between">
          <span className="text-[11px] font-mono text-[#6c7786]">
            Все изменения каталога и цен сразу обновляются в Telegram
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#f1f5f9] text-[#090a0c] font-mono text-xs font-bold uppercase hover:bg-white transition-all"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
