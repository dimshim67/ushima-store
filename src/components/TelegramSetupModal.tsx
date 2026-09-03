import React, { useState } from 'react';
import { X, Send, Code, Sparkles, Terminal, Copy, Check } from 'lucide-react';
import { BrandSettings } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { BotBrandingGenerator } from './BotBrandingGenerator';

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
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'code'>('branding');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ваш-сайт.com';
  const cleanBot = (settings.botUsername || 'ushima_app_bot').replace(/^@/, '');

  const botCodeSnippet = `// Запуск автоответчика Telegram для УШИМА (Node.js 18+)
// Отвечает на /start и открывает сайт по кнопке

const BOT_TOKEN = "ВАШ_ТОКЕН_ОТ_BOTFATHER";
const APP_URL = "${appUrl}";

async function start() {
  console.log("Бот запущен!");
  let offset = 0;
  
  while (true) {
    try {
      const res = await fetch(\`https://api.telegram.org/bot\${BOT_TOKEN}/getUpdates?offset=\${offset}&timeout=30\`);
      const data = await res.json();
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message?.text?.startsWith("/start")) {
            await fetch(\`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: update.message.chat.id,
                text: "Привет! Добро пожаловать в магазин **УШИМА** 🖤\\nНажмите кнопку ниже, чтобы открыть каталог одежды:",
                parse_mode: "Markdown",
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "🛒 Открыть каталог УШИМА", web_app: { url: APP_URL } }]
                  ]
                }
              })
            });
          }
        }
      }
    } catch (e) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

start();`;

  const handleCopyCode = () => {
    triggerHaptic('medium');
    navigator.clipboard.writeText(botCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="telegram-setup-modal-dialog"
        className="relative z-10 w-full max-w-4xl bg-[#0d0f14] border border-[#272f3d] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden my-6 flex flex-col max-h-[94vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#212632] flex items-center justify-between bg-gradient-to-r from-[#141822] via-[#10131b] to-[#0b0d12]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Оформление Telegram-бота & Кнопка сайта</span>
                <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30 px-2 py-0.5 rounded">
                  Web App
                </span>
              </h3>
              <p className="text-xs font-mono text-[#8b96a7]">
                Настройте аватарку, описание и кнопку открытия магазина в Telegram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1f242e] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-[#11141b] border-b border-[#1f2532] flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('branding');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
              activeSubTab === 'branding'
                ? 'bg-[#202838] text-white border border-[#3c4b66] shadow'
                : 'text-[#8290a3] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Оформление & Кнопка меню</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveSubTab('code');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
              activeSubTab === 'code'
                ? 'bg-[#202838] text-white border border-[#3c4b66] shadow'
                : 'text-[#8290a3] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span>Код автоответчика /start (Node.js)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm font-mono text-[#cbd5e1]">
          {activeSubTab === 'branding' ? (
            <BotBrandingGenerator
              settings={settings}
              appUrl={appUrl}
              onPreviewClick={() => {
                onClose();
              }}
            />
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141820] border border-[#273243] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold text-xs flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Быстрый запуск бота (ответ на /start с кнопкой магазина)</span>
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-[#f1f5f9] text-[#090a0c] text-xs font-bold font-mono hover:bg-white flex items-center gap-1.5 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Скопировано!' : 'Копировать скрипт'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#8c98a8]">
                  Если хотите, чтобы при нажатии <code>/start</code> бот мгновенно отправлял клиенту сообщение с инлайн-кнопкой <strong>«🛒 Открыть каталог УШИМА»</strong>:
                </p>
                <div className="p-3 rounded-lg bg-black border border-[#222b39] text-xs font-mono text-emerald-400 overflow-x-auto">
                  <code>node scripts/start_bot.js &lt;ВАШ_ТОКЕН_БОТА&gt;</code>
                </div>
                <p className="text-[11px] text-[#6c7b91]">
                  * Скрипт уже создан в вашем проекте (<code>scripts/start_bot.js</code>). Он автоматически настраивает кнопку меню, аватар и слушает команду /start.
                </p>
              </div>

              {/* Code display block */}
              <div className="relative rounded-xl overflow-hidden border border-[#252f40] bg-[#090b0e]">
                <div className="px-4 py-2 bg-[#12161f] border-b border-[#202734] flex items-center justify-between text-xs font-mono text-[#8b98aa]">
                  <span>bot.js</span>
                  <span>JavaScript (ESM / Node 18+)</span>
                </div>
                <pre className="p-4 text-xs font-mono text-[#93c5fd] overflow-x-auto leading-relaxed max-h-[340px]">
                  {botCodeSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#212632] bg-[#0f1217] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-[#6c7786] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Все изменения в каталоге автоматически видны в Telegram</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={`https://t.me/${cleanBot}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-[#1a2332] text-[#38bdf8] border border-[#2c3f5c] hover:bg-[#223045] font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Проверить @{cleanBot}</span>
            </a>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-[#f1f5f9] text-[#090a0c] font-mono text-xs font-bold uppercase hover:bg-white transition-all"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
