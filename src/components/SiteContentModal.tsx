import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Sparkles, Layout, MessageSquare, Save } from 'lucide-react';
import { BrandSettings } from '../types';
import { triggerHaptic } from '../utils/telegram';

interface SiteContentModalProps {
  isOpen: boolean;
  settings: BrandSettings;
  onClose: () => void;
  onSave: (updatedSettings: BrandSettings) => void;
}

export const SiteContentModal: React.FC<SiteContentModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<BrandSettings>(settings);
  const [activeSection, setActiveSection] = useState<'hero' | 'features' | 'identity'>('hero');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('medium');
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        id="site-content-modal"
        className="relative z-10 w-full max-w-2xl bg-[#0f1115] border border-[#272d39] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#212632] flex items-center justify-between bg-gradient-to-r from-[#141720] via-[#111319] to-[#0d0e12]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e2e8f0]/10 border border-[#e2e8f0]/20 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Редактирование описания и текстов сайта
              </h3>
              <p className="text-xs font-mono text-[#8b96a7]">
                Все изменения мгновенно отображаются на витрине и в Telegram
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

        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-2 bg-[#12141a] border-b border-[#1f242e] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('hero')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeSection === 'hero'
                ? 'bg-[#1e232e] text-white border border-[#343e4f]'
                : 'text-[#8b96a7] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Главный экран (Hero)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('features')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeSection === 'features'
                ? 'bg-[#1e232e] text-white border border-[#343e4f]'
                : 'text-[#8b96a7] hover:text-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Инфо-блоки (Преимущества)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('identity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeSection === 'identity'
                ? 'bg-[#1e232e] text-white border border-[#343e4f]'
                : 'text-[#8b96a7] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Айдентика и контакты</span>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* SECTION 1: HERO */}
          {activeSection === 'hero' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Верхний бэйдж (Badge)
                </label>
                <input
                  type="text"
                  value={formData.heroBadge || ''}
                  onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                  placeholder="U S H I M A. ARCHIVE // METALLIC ATELIER"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Главный заголовок
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.heroTitle || ''}
                    onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                    placeholder="У Ш И М А."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Подзаголовок (Вторая строка)
                  </label>
                  <input
                    type="text"
                    value={formData.heroSubtitle || ''}
                    onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                    placeholder="METALLIC SILHOUETTE."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Главное описание магазина (Под заголовком)
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.heroDescription || ''}
                  onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                  placeholder="Архитектурный крой, ткани с микро-металлическим напылением..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none leading-relaxed resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-[#14171e] border border-[#212733] text-xs font-mono text-[#8b96a7]">
                💡 <strong>Совет:</strong> Это главный текст, который встречает посетителя при открытии Telegram Mini App.
              </div>
            </div>
          )}

          {/* SECTION 2: FEATURES */}
          {activeSection === 'features' && (
            <div className="space-y-4">
              {/* Block 1 */}
              <div className="p-3.5 rounded-xl bg-[#13161c] border border-[#222732] space-y-2">
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-bold tracking-wider">
                  Блок 1 (Оплата в Telegram)
                </span>
                <input
                  type="text"
                  value={formData.feature1Title || ''}
                  onChange={(e) => setFormData({ ...formData, feature1Title: e.target.value })}
                  placeholder="ОПЛАТА ЧЕРЕЗ TELEGRAM БОТА"
                  className="w-full px-3 py-1.5 rounded bg-[#0e1014] border border-[#272e3a] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={formData.feature1Text || ''}
                  onChange={(e) => setFormData({ ...formData, feature1Text: e.target.value })}
                  placeholder="Описание условий оплаты..."
                  className="w-full px-3 py-1.5 rounded bg-[#0e1014] border border-[#272e3a] text-white text-xs font-mono focus:border-white focus:outline-none resize-none"
                />
              </div>

              {/* Block 2 */}
              <div className="p-3.5 rounded-xl bg-[#13161c] border border-[#222732] space-y-2">
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-bold tracking-wider">
                  Блок 2 (О бренде и дизайне)
                </span>
                <input
                  type="text"
                  value={formData.feature2Title || ''}
                  onChange={(e) => setFormData({ ...formData, feature2Title: e.target.value })}
                  placeholder="ФИРМЕННЫЙ СТИЛЬ U S H I M A."
                  className="w-full px-3 py-1.5 rounded bg-[#0e1014] border border-[#272e3a] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={formData.feature2Text || ''}
                  onChange={(e) => setFormData({ ...formData, feature2Text: e.target.value })}
                  placeholder="Описание концепции..."
                  className="w-full px-3 py-1.5 rounded bg-[#0e1014] border border-[#272e3a] text-white text-xs font-mono focus:border-white focus:outline-none resize-none"
                />
              </div>

              {/* Block 3 */}
              <div className="p-3.5 rounded-xl bg-[#13161c] border border-[#222732] space-y-2">
                <span className="text-[10px] font-mono text-[#38bdf8] uppercase font-bold tracking-wider">
                  Блок 3 (Поддержка и контакты)
                </span>
                <input
                  type="text"
                  value={formData.feature3Title || ''}
                  onChange={(e) => setFormData({ ...formData, feature3Title: e.target.value })}
                  placeholder="МЕНЕДЖЕР В TELEGRAM 24/7"
                  className="w-full px-3 py-1.5 rounded bg-[#0e1014] border border-[#272e3a] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={formData.feature3Text || ''}
                  onChange={(e) => setFormData({ ...formData, feature3Text: e.target.value })}
                  placeholder="Текст контактов..."
                  className="w-full px-3 py-1.5 rounded bg-[#0e1014] border border-[#272e3a] text-white text-xs font-mono focus:border-white focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* SECTION 3: IDENTITY */}
          {activeSection === 'identity' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Название бренда
                </label>
                <input
                  type="text"
                  required
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="U S H I M A."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Слоган бренда
                </label>
                <input
                  type="text"
                  value={formData.brandTagline}
                  onChange={(e) => setFormData({ ...formData, brandTagline: e.target.value })}
                  placeholder="AVANT-GARDE METALLIC ARCHIVE // USHIMA"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                  Анонс в шапке (Бегущая строка)
                </label>
                <input
                  type="text"
                  value={formData.announcementText}
                  onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                  placeholder="U S H I M A. // METALLURGIC FORM // ОФОРМЛЕНИЕ И ОПЛАТА В TELEGRAM"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Telegram бот
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#64748b] font-mono text-xs">@</span>
                    <input
                      type="text"
                      required
                      value={formData.botUsername.replace(/^@/, '')}
                      onChange={(e) => setFormData({ ...formData, botUsername: e.target.value.replace(/^@/, '') })}
                      placeholder="ushima_bot"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Telegram канал
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#64748b] font-mono text-xs">@</span>
                    <input
                      type="text"
                      value={(formData.telegramChannel || '').replace(/^@/, '')}
                      onChange={(e) => setFormData({ ...formData, telegramChannel: e.target.value.replace(/^@/, '') })}
                      placeholder="ushima_channel"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#9ca3af] uppercase tracking-wider mb-1">
                    Telegram менеджер
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#64748b] font-mono text-xs">@</span>
                    <input
                      type="text"
                      required
                      value={formData.contactTelegram.replace(/^@/, '')}
                      onChange={(e) => setFormData({ ...formData, contactTelegram: e.target.value.replace(/^@/, '') })}
                      placeholder="ushima_manager"
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-[#14161c] border border-[#252b36] text-white text-xs font-mono focus:border-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Row */}
          <div className="pt-4 border-t border-[#202530] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-mono text-[#9ca3af] hover:text-white hover:bg-[#1a1e27] transition-colors"
            >
              Отмена
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e2e8f0] flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить тексты</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
