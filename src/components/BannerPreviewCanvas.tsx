import React, { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Image as ImageIcon, Check } from 'lucide-react';
import { BrandSettings } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface BannerPreviewProps {
  settings: BrandSettings;
}

export const BannerPreviewCanvas: React.FC<BannerPreviewProps> = ({ settings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed dimensions for Telegram BotFather
    const width = 640;
    const height = 360;
    canvas.width = width;
    canvas.height = height;

    // Background: dark graphite luxury gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#07080b');
    bgGrad.addColorStop(0.5, '#101319');
    bgGrad.addColorStop(1, '#080a0e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Radial silver glow from center
    const radialGlow = ctx.createRadialGradient(width / 2, height / 2 - 10, 20, width / 2, height / 2 - 10, 260);
    radialGlow.addColorStop(0, 'rgba(180, 195, 215, 0.16)');
    radialGlow.addColorStop(0.5, 'rgba(100, 115, 135, 0.06)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Subtle technical blueprint grid
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

    // Outer framing border
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

    // Top tech badge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(width / 2 - 110, 36, 220, 22);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(width / 2 - 110, 36, 220, 22);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 9px "Space Grotesk", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '2px';
    ctx.fillText(settings.heroBadge || 'U S H I M A. ARCHIVE // METALLIC ATELIER', width / 2, 50);

    // Main Brand Name: "U S H I M A." in metallic gradient
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
    const mainTitle = settings.heroTitle || 'U S H I M A.';
    ctx.fillText(mainTitle, width / 2 + 7, 160);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Metallic hairline divider
    const divGrad = ctx.createLinearGradient(120, 185, width - 120, 185);
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
    ctx.fillText(settings.heroSubtitle || 'METALLIC SILHOUETTE.', width / 2 + 2, 215);

    // Description line
    ctx.fillStyle = '#717d91';
    ctx.font = '400 10px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('АВАНГАРДНЫЙ ТЕКСТИЛЬ & ОДЕЖДА // TELEGRAM MINI APP', width / 2, 240);

    // Footer tech details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '500 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('640x360 PX // RATIO 16:9', 32, height - 28);

    ctx.textAlign = 'right';
    ctx.fillText('USHIMA APPAREL 2026', width - 32, height - 28);
  }, [settings]);

  const handleDownload = () => {
    triggerHaptic('medium');
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Generate PNG data URL and trigger download
    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'ushima-banner-640x360.png';
    link.href = imageUri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="p-4 rounded-xl bg-[#12151b] border border-[#262c38] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-semibold text-xs">
          <ImageIcon className="w-4 h-4 text-[#38bdf8]" />
          <span>Баннер для Telegram (ровно 640×360 px)</span>
        </div>
        <span className="text-[10px] font-mono text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/20 px-2 py-0.5 rounded">
          ФОРМАТ 16:9 (640x360)
        </span>
      </div>

      {/* Canvas preview */}
      <div className="relative rounded-lg overflow-hidden border border-[#2b3342] shadow-inner bg-black flex justify-center">
        <canvas
          ref={canvasRef}
          className="w-full max-w-[540px] aspect-[16/9] object-contain block"
        />
      </div>

      {/* Download and action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          onClick={handleDownload}
          className="flex-1 min-w-[200px] py-2.5 px-4 rounded-lg bg-white text-[#090a0c] font-mono text-xs font-bold hover:bg-[#e2e8f0] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Баннер скачан в PNG!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-[#090a0c]" />
              <span>Скачать баннер 640×360 (PNG)</span>
            </>
          )}
        </button>

        <a
          href="/telegram-banner-640x360.png"
          target="_blank"
          download="ushima-banner-640x360.png"
          className="py-2.5 px-3 rounded-lg bg-[#1a1f29] border border-[#2d3748] text-white font-mono text-xs hover:bg-[#252c3b] flex items-center gap-1.5 transition-colors"
          title="Открыть оригинал файла"
        >
          <ExternalLink className="w-3.5 h-3.5 text-[#94a3b8]" />
          <span>Файл</span>
        </a>
      </div>

      {/* Helpful hint for BotFather */}
      <div className="text-[11px] text-[#94a3b8] leading-relaxed bg-[#161a22] p-2.5 rounded-lg border border-[#222834]">
        <strong className="text-white block mb-0.5">Что делать с этим баннером в @BotFather:</strong>
        Нажмите кнопку <strong>«Скачать баннер 640×360 (PNG)»</strong> выше и отправьте полученную картинку боту в ответ на вопрос <em>«Please upload a photo, 640x360 pixels»</em>.
        <br />
        <span className="text-[#64748b] mt-1 block">
          * Если хотите пропустить картинку прямо сейчас, просто отправьте боту команду <code className="text-emerald-400 font-bold bg-[#0e1117] px-1 py-0.5 rounded">/empty</code>.
        </span>
      </div>
    </div>
  );
};
