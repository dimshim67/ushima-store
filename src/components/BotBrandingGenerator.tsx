import React, { useEffect, useRef, useState } from 'react';
import { Download, Check, Sparkles, Send, Copy, ExternalLink, RefreshCw, Smartphone, ShieldCheck, HelpCircle } from 'lucide-react';
import { BrandSettings } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface BotBrandingGeneratorProps {
  settings: BrandSettings;
  appUrl?: string;
  onPreviewClick?: () => void;
}

type AssetType = 'avatar' | 'banner' | 'chat_cover';

export const BotBrandingGenerator: React.FC<BotBrandingGeneratorProps> = ({
  settings,
  appUrl: propAppUrl,
  onPreviewClick,
}) => {
  const [assetType, setAssetType] = useState<AssetType>('avatar');
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-setup via Bot Token
  const [botToken, setBotToken] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [apiResult, setApiResult] = useState<{ success: boolean; message: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentUrl =
    propAppUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-dev-tjevymwajofd32gs2fgjow-520097545568.europe-west2.run.app');

  const cleanBot = (settings.botUsername || 'ushima_app_bot').replace(/^@/, '');

  // Render canvas based on selected asset type
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (assetType === 'avatar') {
      // 640x640 Avatar
      const size = 640;
      canvas.width = size;
      canvas.height = size;

      // Dark obsidian graphite gradient
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#06070a');
      bgGrad.addColorStop(0.5, '#0e1118');
      bgGrad.addColorStop(1, '#080a0f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Central metallic glow
      const radial = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, 280);
      radial.addColorStop(0, 'rgba(186, 215, 245, 0.22)');
      radial.addColorStop(0.5, 'rgba(100, 130, 165, 0.08)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, size, size);

      // Cyber blueprint grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 40; x < size; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
      }
      for (let y = 40; y < size; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }

      // Telegram Avatar Circular Guide (dotted circle)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, 280, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Outer Hexagon Avantgarde Frame
      const poly = [
        [320, 120],
        [480, 210],
        [480, 430],
        [320, 520],
        [160, 430],
        [160, 210],
      ];
      ctx.strokeStyle = 'rgba(240, 245, 255, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      poly.forEach(([px, py], i) => {
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.stroke();

      // Metallic Monogram / Stylized Lettering "УШИМА"
      ctx.strokeStyle = 'rgba(215, 230, 250, 0.95)';
      ctx.lineWidth = 4;
      // Central vertical axis
      ctx.beginPath();
      ctx.moveTo(320, 160);
      ctx.lineTo(320, 480);
      ctx.stroke();

      // Crossbars
      ctx.beginPath();
      ctx.moveTo(230, 290);
      ctx.lineTo(410, 290);
      ctx.moveTo(210, 370);
      ctx.lineTo(430, 370);
      ctx.stroke();

      // Dynamic diagonals
      ctx.beginPath();
      ctx.moveTo(250, 220);
      ctx.lineTo(320, 290);
      ctx.lineTo(390, 220);
      ctx.stroke();

      // Text "УШИМА" in bottom arc
      const textGrad = ctx.createLinearGradient(0, 430, 0, 480);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(1, '#94a3b8');
      ctx.fillStyle = textGrad;
      ctx.font = '900 24px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '8px';
      ctx.fillText(settings.brandName || 'УШИМА', size / 2 + 4, 465);

      // Top Tag
      ctx.fillStyle = '#64748b';
      ctx.font = '700 11px monospace';
      ctx.letterSpacing = '3px';
      ctx.fillText('ARCHIVE ATELIER', size / 2, 195);
    } else {
      // 640x360 Banner or Chat Cover
      const width = 640;
      const height = 360;
      canvas.width = width;
      canvas.height = height;

      // Dark graphite gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#07080b');
      bgGrad.addColorStop(0.5, '#101319');
      bgGrad.addColorStop(1, '#080a0e');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Radial silver glow
      const radial = ctx.createRadialGradient(width / 2, height / 2 - 10, 20, width / 2, height / 2 - 10, 260);
      radial.addColorStop(0, 'rgba(180, 195, 215, 0.18)');
      radial.addColorStop(0.5, 'rgba(100, 115, 135, 0.07)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Blueprint grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let x = 40; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 40; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Framing border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Corner crosshairs
      const drawCross = (x: number, y: number) => {
        ctx.strokeStyle = 'rgba(210, 225, 245, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 8, y);
        ctx.lineTo(x + 8, y);
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x, y + 8);
        ctx.stroke();
      };
      drawCross(28, 28);
      drawCross(width - 28, 28);
      drawCross(28, height - 28);
      drawCross(width - 28, height - 28);

      // Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fillRect(width / 2 - 110, 36, 220, 22);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(width / 2 - 110, 36, 220, 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px "Space Grotesk", monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '2px';
      ctx.fillText(
        assetType === 'chat_cover'
          ? 'ОФИЦИАЛЬНЫЙ МАГАЗИН // TELEGRAM'
          : settings.heroBadge || 'УШИМА ARCHIVE // METALLIC ATELIER',
        width / 2,
        50
      );

      // Brand Title
      const textGrad = ctx.createLinearGradient(0, 110, 0, 190);
      textGrad.addColorStop(0, '#ffffff');
      textGrad.addColorStop(0.35, '#dbe2ec');
      textGrad.addColorStop(0.7, '#8f9fb2');
      textGrad.addColorStop(1, '#c5d0dc');

      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 6;

      ctx.fillStyle = textGrad;
      ctx.font = '900 52px "Space Grotesk", sans-serif';
      ctx.letterSpacing = '14px';
      ctx.fillText(settings.heroTitle || 'У Ш И М А', width / 2 + 7, 160);

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Divider line
      const divGrad = ctx.createLinearGradient(140, 185, width - 140, 185);
      divGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      divGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.45)');
      divGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.strokeStyle = divGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(140, 185);
      ctx.lineTo(width - 140, 185);
      ctx.stroke();

      // Subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '700 13px "Space Grotesk", monospace, sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(
        assetType === 'chat_cover' ? 'КАТАЛОГ ОДЕЖДЫ & ОНЛАЙН-ЗАКАЗ' : settings.heroSubtitle || 'METALLIC SILHOUETTE.',
        width / 2 + 2,
        215
      );

      // Description line
      ctx.fillStyle = '#717d91';
      ctx.font = '400 10px "Space Grotesk", sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText(
        assetType === 'chat_cover'
          ? 'НАЖМИТЕ КНОПКУ «МЕНЮ» ИЛИ START ДЛЯ ВХОДА В МАГАЗИН'
          : 'АВАНГАРДНЫЙ ТЕКСТИЛЬ & ОДЕЖДА // TELEGRAM MINI APP',
        width / 2,
        240
      );

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('640x360 PX // RATIO 16:9', 32, height - 28);

      ctx.textAlign = 'right';
      ctx.fillText('USHIMA APPAREL 2026', width - 32, height - 28);
    }
  }, [assetType, settings]);

  const handleDownload = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const filename =
      assetType === 'avatar'
        ? 'ushima-telegram-avatar-640x640.png'
        : assetType === 'banner'
        ? 'ushima-telegram-banner-640x360.png'
        : 'ushima-chat-cover-640x360.png';

    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = imageUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(filename);
    setTimeout(() => setDownloaded(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    triggerHaptic('medium');
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  // Auto-apply Menu Button & Bot Descriptions via Bot Token directly from browser
  const handleAutoApplyViaToken = async () => {
    if (!botToken.trim()) {
      setApiResult({
        success: false,
        message: 'Пожалуйста, введите токен вашего бота (например: 7849123456:AAHx...)',
      });
      return;
    }

    setIsApplying(true);
    setApiResult(null);
    triggerHaptic('heavy');

    const cleanToken = botToken.trim();
    const tgBase = `https://api.telegram.org/bot${cleanToken}`;

    try {
      // 1. Проверяем валидность токена
      const meRes = await fetch(`${tgBase}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        throw new Error(meData.description || 'Неверный токен бота');
      }

      // 2. Устанавливаем системную кнопку Menu Button (открывает сайт внизу экрана)
      const menuRes = await fetch(`${tgBase}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: 'Каталог УШИМА 🛍️',
            web_app: { url: currentUrl },
          },
        }),
      });
      const menuData = await menuRes.json();
      if (!menuData.ok) {
        throw new Error(`Ошибка Menu Button: ${menuData.description}`);
      }

      // 3. Устанавливаем описание бота (/setdescription)
      await fetch(`${tgBase}/setMyDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: `Официальный интернет-магазин авангардной одежды и мерча УШИМА 🖤\n\n• Актуальный каталог и размеры\n• Быстрый заказ прямо в Telegram\n• Доставка по всей России\n\nНажмите кнопку внизу экрана или команду /start, чтобы открыть витрину.`,
        }),
      });

      // 4. Устанавливаем краткое описание в профиле (/setabouttext)
      await fetch(`${tgBase}/setMyShortDescription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          short_description: `УШИМА — авангардная одежда и мерч. Каталог и онлайн-заказ в Telegram Mini App.`,
        }),
      });

      // 5. Устанавливаем меню команд бота
      await fetch(`${tgBase}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: 'Открыть магазин одежды УШИМА' },
            { command: 'catalog', description: 'Каталог товаров и новинок' },
            { command: 'help', description: 'Помощь и связь с менеджером' },
          ],
        }),
      });

      triggerHaptic('medium');
      setApiResult({
        success: true,
        message: `Успех! Бот @${meData.result.username} настроен! Кнопка «Каталог УШИМА 🛍️» и описания мгновенно появились в Telegram!`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Не удалось связаться с сервером Telegram';
      setApiResult({
        success: false,
        message: `Ошибка: ${errorMsg}. Проверьте токен или настройте вручную через BotFather ниже.`,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const directTelegramLink = `https://t.me/${cleanBot}?startapp=shop`;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Overview */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111622] via-[#0f141d] to-[#0a0d14] border border-[#27354a] shadow-xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-display font-bold text-white">
                Оформление бота и кнопка открытия сайта
              </h3>
              <p className="text-xs font-mono text-[#94a3b8]">
                Чтобы бот в Telegram перестал быть пустым, настройте аватарку, описание и постоянную кнопку «Каталог УШИМА» внизу экрана.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Готово к загрузке</span>
          </span>
        </div>

        {/* Live URL bar */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-[#090b0e] border border-[#1f2633] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[#64748b] text-[11px] uppercase tracking-wider shrink-0">URL сайта:</span>
            <span className="text-[#38bdf8] truncate font-semibold select-all">{currentUrl}</span>
          </div>
          <button
            onClick={() => handleCopy(currentUrl, 'url')}
            className="px-3 py-1.5 rounded-lg bg-[#1a212e] border border-[#2e3b50] hover:bg-[#232d3f] text-white flex items-center justify-center gap-1.5 transition-colors shrink-0"
          >
            {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'url' ? 'Скопировано!' : 'Копировать URL'}</span>
          </button>
        </div>
      </div>

      {/* TWO COLUMNS: Left (Telegram Live Mockup) & Right (Graphics Generator) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Telegram Mockup (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#38bdf8]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Как бот выглядит в Telegram у покупателя:
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#64748b]">Живой мокап</span>
          </div>

          {/* Phone Frame Mockup */}
          <div className="rounded-2xl bg-[#0c0e12] border border-[#232a36] shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-w-[420px] mx-auto">
            {/* Telegram Header */}
            <div className="px-4 py-3 bg-[#171d27] border-b border-[#242d3c] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Round Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shadow-md bg-[#090b0e] shrink-0 flex items-center justify-center">
                  <img
                    src="/telegram-avatar-640x640.png"
                    alt="УШИМА"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image not yet loaded
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="font-display font-black text-xs text-white">У</span>
                </div>
                <div>
                  <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                    <span>УШИМА | Одежда</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                  </div>
                  <div className="text-[10px] font-mono text-[#7a889b]">bot • @{cleanBot}</div>
                </div>
              </div>

              <a
                href={`https://t.me/${cleanBot}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#202734] transition-colors"
                title="Открыть в Telegram"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Telegram Chat Area */}
            <div className="p-4 space-y-4 bg-gradient-to-b from-[#0e1218] via-[#0c0e13] to-[#0a0c10] min-h-[310px] flex flex-col justify-end">
              {/* Chat Cover Preview */}
              <div className="rounded-xl overflow-hidden border border-[#232c3b] shadow-lg">
                <img
                  src="/telegram-banner-640x360.png"
                  alt="Баннер"
                  className="w-full h-28 object-cover"
                />
              </div>

              {/* Bot Welcome Message */}
              <div className="rounded-2xl rounded-tl-sm bg-[#18202d] border border-[#2b3749] p-3 text-xs font-mono space-y-2.5 text-[#e2e8f0] shadow-md max-w-[92%]">
                <p className="leading-relaxed">
                  Привет! 👋 Добро пожаловать в официальный магазин авангардного бренда <strong className="text-white">УШИМА</strong> 🖤
                </p>
                <p className="text-[#94a3b8] text-[11px] leading-relaxed">
                  Здесь вы можете выбрать размеры, оформить онлайн-заказ и посмотреть лукбук прямо внутри Telegram.
                </p>

                {/* The KEY Button inside the chat: OPEN STORE */}
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    if (onPreviewClick) onPreviewClick();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-[#041a2f] font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_18px_rgba(56,189,248,0.3)]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>🛒 Открыть каталог УШИМА</span>
                </button>
              </div>
            </div>

            {/* Telegram Bottom Bar with THE MENU BUTTON! */}
            <div className="p-3 bg-[#141821] border-t border-[#232b39] flex items-center gap-2">
              {/* THE MENU BUTTON */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  if (onPreviewClick) onPreviewClick();
                }}
                className="px-3.5 py-2 rounded-xl bg-[#1e2736] border border-[#36465f] text-[#38bdf8] font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-[#253246] hover:text-white transition-all shadow-inner active:scale-95"
                title="Эта кнопка настраивается командой /setmenubutton"
              >
                <span>🛍️</span>
                <span>Меню</span>
              </button>

              {/* Fake message input */}
              <div className="flex-1 px-3 py-2 rounded-xl bg-[#0b0d11] border border-[#202633] text-[11px] text-[#556172] font-mono">
                Сообщение...
              </div>

              {/* Send icon */}
              <div className="w-8 h-8 rounded-full bg-[#1a2332] flex items-center justify-center text-[#748398]">
                <Send className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Direct Link to open */}
          <div className="p-3 rounded-xl bg-[#12151c] border border-[#212733] flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#8896a7] text-[11px]">Прямая ссылка на магазин:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(directTelegramLink, 'direct-link')}
                className="px-2.5 py-1 rounded bg-[#1c222e] text-white hover:bg-[#252c3b] flex items-center gap-1 text-[11px]"
              >
                {copiedKey === 'direct-link' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Копировать</span>
              </button>
              <a
                href={directTelegramLink}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded bg-[#38bdf8] text-[#082f49] font-bold hover:bg-[#7dd3fc] text-[11px] flex items-center gap-1"
              >
                <span>Открыть</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Graphics Generator (Avatar, Banner, Cover) (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Генератор графики для @BotFather:
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#38bdf8]">PNG высокое качество</span>
          </div>

          {/* Asset Type Switcher Tabs */}
          <div className="p-1 rounded-xl bg-[#12151b] border border-[#222731] flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                setAssetType('avatar');
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-mono font-semibold transition-all text-center ${
                assetType === 'avatar'
                  ? 'bg-[#1e2533] text-white border border-[#3b4960] shadow'
                  : 'text-[#8592a3] hover:text-white'
              }`}
            >
              <span>Аватарка</span>
              <span className="block text-[10px] opacity-75">640×640</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setAssetType('banner');
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-mono font-semibold transition-all text-center ${
                assetType === 'banner'
                  ? 'bg-[#1e2533] text-white border border-[#3b4960] shadow'
                  : 'text-[#8592a3] hover:text-white'
              }`}
            >
              <span>Баннер Mini App</span>
              <span className="block text-[10px] opacity-75">640×360</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setAssetType('chat_cover');
              }}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-mono font-semibold transition-all text-center ${
                assetType === 'chat_cover'
                  ? 'bg-[#1e2533] text-white border border-[#3b4960] shadow'
                  : 'text-[#8592a3] hover:text-white'
              }`}
            >
              <span>Обложка чата</span>
              <span className="block text-[10px] opacity-75">640×360</span>
            </button>
          </div>

          {/* Canvas Preview Container */}
          <div className="p-4 rounded-2xl bg-[#0e1116] border border-[#232935] space-y-3 flex flex-col items-center justify-center min-h-[290px]">
            <div
              className={`relative rounded-xl overflow-hidden border border-[#2e3748] shadow-2xl bg-black flex items-center justify-center ${
                assetType === 'avatar' ? 'w-[240px] h-[240px]' : 'w-full max-w-[440px] aspect-[16/9]'
              }`}
            >
              <canvas ref={canvasRef} className="w-full h-full object-contain block" />
            </div>

            <div className="text-[11px] font-mono text-[#748296] text-center">
              {assetType === 'avatar' && (
                <span>Круглая пунктирная линия показывает безопасную зону круга Telegram.</span>
              )}
              {assetType === 'banner' && (
                <span>Соотношение 16:9 для команды <code>/newapp</code> в @BotFather.</span>
              )}
              {assetType === 'chat_cover' && (
                <span>Приветственная картинка для команды <code>/setdescription</code>.</span>
              )}
            </div>
          </div>

          {/* Download Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-3 px-4 rounded-xl bg-white text-[#090b0e] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Файл скачан!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black" />
                  <span>
                    Скачать {assetType === 'avatar' ? 'аватарку 640×640' : 'картинку 640×360'} (PNG)
                  </span>
                </>
              )}
            </button>

            {assetType === 'avatar' && (
              <a
                href="/telegram-avatar-640x640.png"
                download="ushima-avatar-640x640.png"
                className="py-3 px-3.5 rounded-xl bg-[#181d26] border border-[#2b3444] text-white hover:bg-[#202734] font-mono text-xs flex items-center gap-1.5 transition-colors"
                title="Прямая ссылка на файл"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#94a3b8]" />
                <span>Файл</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* QUICK METHOD: 1-Click Auto-Setup via Bot Token */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#172033] via-[#121824] to-[#0d121b] border border-[#2f4362] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
            <span>Автоматическая настройка бота в 1 клик (через токен)</span>
          </div>
          <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/15 border border-[#38bdf8]/30 px-2 py-0.5 rounded">
            САМЫЙ БЫСТРЫЙ СПОСОБ
          </span>
        </div>

        <p className="text-xs font-mono text-[#94a3b8] leading-relaxed">
          Вставьте токен вашего бота от @BotFather (например, <code>7849123456:AAHx...</code>) и нажмите кнопку. Мы мгновенно установим системную кнопку меню «Каталог УШИМА 🛍️» и описание магазина в вашем боте через Telegram Bot API!
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Вставьте HTTP API Token от @BotFather..."
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090b0e] border border-[#2c374b] text-white text-xs font-mono focus:border-[#38bdf8] focus:outline-none"
          />

          <button
            onClick={handleAutoApplyViaToken}
            disabled={isApplying}
            className="px-5 py-2.5 rounded-xl bg-[#38bdf8] text-[#041a2f] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#7dd3fc] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] shrink-0"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Применяем...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Применить кнопку и оформление</span>
              </>
            )}
          </button>
        </div>

        {apiResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
              apiResult.success
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            {apiResult.success ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{apiResult.message}</span>
          </div>
        )}
      </div>

      {/* STEP-BY-STEP MANUAL GUIDE FOR @BotFather (With 1-Click Copy Buttons) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-[#38bdf8]" />
            <span>Ручная настройка через @BotFather (за 2 минуты):</span>
          </h4>
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-[#38bdf8] hover:underline flex items-center gap-1"
          >
            <span>Открыть @BotFather</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* STEP 1: MENU BUTTON (THE REQUESTED KEY FEATURE) */}
          <div className="p-4 rounded-xl bg-[#12151b] border border-[#2b3547] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#38bdf8] font-mono text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-bold text-xs text-white">Кнопка «Каталог» внизу экрана</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                ГЛАВНЫЙ ШАГ
              </span>
            </div>

            <p className="text-xs text-[#8c98a8] leading-relaxed">
              Делает постоянную кнопку слева от поля ввода:
            </p>

            <ol className="text-xs font-mono text-[#cbd5e1] space-y-2 pl-4 list-decimal">
              <li>
                Отправьте команду{' '}
                <button
                  onClick={() => handleCopy('/setmenubutton', 'cmd-menu')}
                  className="px-1.5 py-0.5 rounded bg-[#1e2430] text-[#38bdf8] hover:text-white font-bold inline-flex items-center gap-1"
                >
                  <code>/setmenubutton</code>
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </li>
              <li>Выберите вашего бота (например, <code>@{cleanBot}</code>)</li>
              <li>
                Вставьте ссылку на сайт:{' '}
                <button
                  onClick={() => handleCopy(currentUrl, 'cmd-url')}
                  className="px-1.5 py-0.5 rounded bg-[#1e2430] text-emerald-400 hover:text-white font-bold inline-flex items-center gap-1"
                >
                  <span>Копировать URL</span>
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </li>
              <li>
                Введите название кнопки:{' '}
                <button
                  onClick={() => handleCopy('Каталог УШИМА 🛍️', 'cmd-btn-text')}
                  className="px-1.5 py-0.5 rounded bg-[#1e2430] text-white hover:text-white font-bold inline-flex items-center gap-1"
                >
                  <span>«Каталог УШИМА 🛍️»</span>
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </li>
            </ol>
          </div>

          {/* STEP 2: USERPIC (AVATAR) */}
          <div className="p-4 rounded-xl bg-[#12151b] border border-[#222731] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1f242e] border border-[#333b49] text-white font-mono text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="font-bold text-xs text-white">Аватарка бота (/setuserpic)</span>
              </div>
            </div>

            <p className="text-xs text-[#8c98a8] leading-relaxed">
              Чтобы бот не был с пустой серой иконкой:
            </p>

            <ol className="text-xs font-mono text-[#cbd5e1] space-y-2 pl-4 list-decimal">
              <li>
                Скачайте аватар 640×640 выше или файл{' '}
                <a
                  href="/telegram-avatar-640x640.png"
                  download="ushima-avatar.png"
                  className="text-[#38bdf8] underline"
                >
                  скачать тут
                </a>
              </li>
              <li>
                Отправьте команду{' '}
                <button
                  onClick={() => handleCopy('/setuserpic', 'cmd-userpic')}
                  className="px-1.5 py-0.5 rounded bg-[#1e2430] text-[#38bdf8] hover:text-white font-bold inline-flex items-center gap-1"
                >
                  <code>/setuserpic</code>
                  <Copy className="w-2.5 h-2.5" />
                </button>
              </li>
              <li>Выберите бота и отправьте скачанное фото в чат!</li>
            </ol>
          </div>

          {/* STEP 3: DESCRIPTION */}
          <div className="p-4 rounded-xl bg-[#12151b] border border-[#222731] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1f242e] border border-[#333b49] text-white font-mono text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-bold text-xs text-white">Описание бота (/setdescription)</span>
              </div>
            </div>

            <p className="text-xs text-[#8c98a8] leading-relaxed">
              Текст, который видит человек ДО нажатия Start:
            </p>

            <div className="p-2.5 rounded-lg bg-[#0b0d11] border border-[#1e2430] text-[11px] text-[#94a3b8] font-mono flex items-start justify-between gap-2">
              <span className="line-clamp-3">
                Официальный интернет-магазин авангардной одежды и мерча УШИМА 🖤 Каталог, размеры и онлайн-заказ прямо в Telegram!
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    'Официальный интернет-магазин авангардной одежды и мерча УШИМА 🖤\n\n• Актуальный каталог и размеры\n• Быстрый заказ прямо в Telegram\n• Доставка по всей России\n\nНажмите кнопку внизу или команду /start, чтобы открыть витрину.',
                    'cmd-desc'
                  )
                }
                className="px-2 py-1 rounded bg-[#1f2633] text-white hover:bg-[#2b3548] text-[10px] shrink-0"
              >
                {copiedKey === 'cmd-desc' ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
          </div>

          {/* STEP 4: MINI APP REGISTER */}
          <div className="p-4 rounded-xl bg-[#12151b] border border-[#222731] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#1f242e] border border-[#333b49] text-white font-mono text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span className="font-bold text-xs text-white">Создание Mini App (/newapp)</span>
              </div>
            </div>

            <p className="text-xs text-[#8c98a8] leading-relaxed">
              Для регистрации приложения в Telegram:
            </p>

            <div className="space-y-1.5 text-xs font-mono text-[#cbd5e1]">
              <div className="flex items-center justify-between">
                <span>Команда:</span>
                <button
                  onClick={() => handleCopy('/newapp', 'cmd-newapp')}
                  className="px-2 py-0.5 rounded bg-[#1e2430] text-[#38bdf8] hover:text-white"
                >
                  <code>/newapp</code>
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8c98a8]">
                <span>Баннер 640×360:</span>
                <button
                  onClick={() => {
                    setAssetType('banner');
                    handleDownload();
                  }}
                  className="text-white underline hover:text-[#38bdf8]"
                >
                  Скачать баннер
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8c98a8]">
                <span>Или пропустить фото:</span>
                <button
                  onClick={() => handleCopy('/empty', 'cmd-empty')}
                  className="px-1.5 py-0.5 rounded bg-[#1e2430] text-emerald-400"
                >
                  <code>/empty</code>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
