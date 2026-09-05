import React, { useState } from 'react';
import { Database, Cloud, Server, Check, AlertCircle, RefreshCw, Copy, ExternalLink, HardDrive, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { triggerHaptic } from '../utils/telegram';

interface DatabaseSettingsProps {
  initialConfig?: {
    url?: string;
    anonKey?: string;
    enabled?: boolean;
  };
  productsCount: number;
  ordersCount: number;
  onRefreshData: () => Promise<void>;
  onResetData: () => Promise<void>;
  showToast: (msg: string) => void;
}

const SUPABASE_SQL_SCHEMA = `-- USHIMA STORE // SUPABASE SQL SCHEMA
-- Выполните этот скрипт в Supabase -> SQL Editor (1 клик 'Run'):

create table if not exists ushima_products (
  id text primary key,
  title text not null,
  subtitle text,
  price numeric not null,
  original_price numeric,
  category text not null,
  images text[],
  description text,
  composition text,
  sizes text[],
  in_stock boolean default true,
  is_featured boolean default false,
  created_at bigint
);

create table if not exists ushima_orders (
  id text primary key,
  items jsonb not null,
  total_amount numeric not null,
  status text not null,
  customer_info jsonb not null,
  created_at text
);

create table if not exists ushima_settings (
  id text primary key default 'brand_settings',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Разрешить чтение и запись с anon ключом приложения
alter table ushima_products enable row level security;
drop policy if exists "Allow all on products" on ushima_products;
create policy "Allow all on products" on ushima_products for all using (true) with check (true);

alter table ushima_orders enable row level security;
drop policy if exists "Allow all on orders" on ushima_orders;
create policy "Allow all on orders" on ushima_orders for all using (true) with check (true);

alter table ushima_settings enable row level security;
drop policy if exists "Allow all on settings" on ushima_settings;
create policy "Allow all on settings" on ushima_settings for all using (true) with check (true);
`;

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({
  initialConfig,
  productsCount,
  ordersCount,
  onRefreshData,
  onResetData,
  showToast,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig?.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(initialConfig?.anonKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);

  const handlePushToCloud = async () => {
    triggerHaptic('medium');
    setIsPushingCloud(true);
    try {
      const res = await api.pushToSupabase();
      if (res.success) {
        showToast(res.message);
      } else {
        showToast(res.message || 'Ошибка выгрузки в Supabase');
      }
    } catch (err: any) {
      showToast(err.message || 'Ошибка соединения с сервером');
    } finally {
      setIsPushingCloud(false);
    }
  };

  const handlePullFromCloud = async () => {
    triggerHaptic('medium');
    setIsPullingCloud(true);
    try {
      const res = await api.pullFromSupabase();
      if (res.success) {
        await onRefreshData();
        showToast(res.message);
      } else {
        showToast(res.message || 'Ошибка загрузки из Supabase');
      }
    } catch (err: any) {
      showToast(err.message || 'Ошибка соединения с сервером');
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      showToast('Укажите Supabase URL и Anon Key');
      return;
    }
    triggerHaptic('light');
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await api.testSupabase(supabaseUrl.trim(), supabaseAnonKey.trim());
      setTestResult(res);
      if (res.success) {
        showToast('Подключение успешно!');
        await api.saveSupabaseConfig({
          url: supabaseUrl.trim(),
          anonKey: supabaseAnonKey.trim(),
          enabled: true,
        });
      } else {
        showToast('Ошибка подключения');
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Ошибка сети' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfigOnly = async () => {
    try {
      await api.saveSupabaseConfig({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
        enabled: Boolean(supabaseUrl.trim() && supabaseAnonKey.trim()),
      });
      showToast('Конфигурация Supabase сохранена');
    } catch {
      showToast('Не удалось сохранить настройки');
    }
  };

  const handleCopySql = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopiedSql(true);
    showToast('SQL-скрипт скопирован в буфер');
    setTimeout(() => setIsCopiedSql(false), 2500);
  };

  const handleRefresh = async () => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    try {
      await onRefreshData();
      showToast('Данные синхронизированы с базой данных');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 1. Header & Live Status */}
      <div className="p-5 rounded-xl bg-[#121419] border border-[#242933]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a2333] border border-[#2d476f] flex items-center justify-center text-[#38bdf8]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <span>База данных и Синхронизация</span>
                <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </h3>
              <p className="text-xs text-[#8c98a8] font-mono mt-0.5">
                Все изменения товаров, заказов и настроек сохраняются в реальную базу на сервере
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1a1f2c] hover:bg-[#242c3d] text-white font-mono text-xs border border-[#2e394d] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38bdf8] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Синхронизировать</span>
          </button>
        </div>

        {/* Live Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#1d232e]">
          <div className="p-3 rounded-lg bg-[#0e1117] border border-[#1e2430]">
            <div className="text-[11px] font-mono text-[#717d8e] uppercase">Товаров в БД</div>
            <div className="text-lg font-display font-bold text-white mt-0.5">{productsCount} шт.</div>
          </div>
          <div className="p-3 rounded-lg bg-[#0e1117] border border-[#1e2430]">
            <div className="text-[11px] font-mono text-[#717d8e] uppercase">Заказов в БД</div>
            <div className="text-lg font-display font-bold text-white mt-0.5">{ordersCount} шт.</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-[#0e1117] border border-[#1e2430]">
            <div className="text-[11px] font-mono text-[#717d8e] uppercase">Хранилище</div>
            <div className="text-xs font-mono text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full-Stack DB (JSON/API)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Supabase Cloud Integration (Optional / Direct) */}
      <div className="p-5 rounded-xl bg-[#121419] border border-[#242933] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#14231f] border border-[#1d4d3d] flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <span>Подключение к Supabase (Cloud PostgreSQL)</span>
              </h4>
              <p className="text-xs text-[#8c98a8] font-mono mt-0.5">
                Бесплатная облачная база данных с панелью управления PostgreSQL
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-mono text-[#38bdf8] hover:underline"
          >
            <span>supabase.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-mono text-[#8b96a7] uppercase mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://abcdefghijkl.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1117] border border-[#262c37] text-white font-mono text-xs focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-[#8b96a7] uppercase">
                Supabase Anon Key (Публичный ключ)
              </label>
              <span className="text-[11px] font-mono text-emerald-400">Секретный ключ НЕ нужен!</span>
            </div>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e1117] border border-[#262c37] text-white font-mono text-xs focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          {/* Step-by-step instructions where to get them */}
          <div className="p-3.5 rounded-lg bg-[#0a0d13] border border-[#1d2432] space-y-2 text-xs font-mono text-[#8f9cae]">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>📍 Где взять Project URL и Anon Key в Supabase (1 минута):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#8492a6] leading-relaxed">
              <li>Зайдите на <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-[#38bdf8] underline">supabase.com</a> и создайте бесплатный проект.</li>
              <li>Слева внизу нажмите на иконку шестерёнки <strong>«Project Settings»</strong>.</li>
              <li>В меню настроек перейдите в раздел <strong>«API»</strong> (или <strong>«Data API»</strong>).</li>
              <li>В блоке <strong>«Project URL»</strong> скопируйте URL (например: <code className="text-emerald-400">https://xxxx.supabase.co</code>).</li>
              <li>В блоке <strong>«Project API keys»</strong> найдите ключ с ярлыком <span className="px-1.5 py-0.5 rounded bg-[#1e293b] text-white">anon public</span> и скопируйте его. Секретный ключ (service_role) вводить <strong>не требуется</strong>.</li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isTesting ? 'Проверка...' : 'Проверить и активировать'}
            </button>

            <button
              onClick={handleSaveConfigOnly}
              className="px-3.5 py-2 rounded-lg bg-[#1a2333] hover:bg-[#223046] text-white font-mono text-xs border border-[#2d476f] transition-colors"
            >
              Сохранить ключи
            </button>

            {initialConfig?.enabled && (
              <>
                <button
                  onClick={handlePushToCloud}
                  disabled={isPushingCloud}
                  className="px-3.5 py-2 rounded-lg bg-[#15233b] hover:bg-[#1d3154] text-[#38bdf8] font-mono text-xs border border-[#2b4b7c] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isPushingCloud ? 'Выгрузка...' : 'Выгрузить товары в Supabase'}</span>
                </button>

                <button
                  onClick={handlePullFromCloud}
                  disabled={isPullingCloud}
                  className="px-3.5 py-2 rounded-lg bg-[#121c2c] hover:bg-[#19273e] text-white font-mono text-xs border border-[#243754] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#38bdf8] ${isPullingCloud ? 'animate-spin' : ''}`} />
                  <span>{isPullingCloud ? 'Загрузка...' : 'Загрузить из Supabase'}</span>
                </button>
              </>
            )}
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-lg font-mono text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/40 border border-red-800 text-red-300'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">{testResult.success ? 'Успешно' : 'Внимание'}</div>
                <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{testResult.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Supabase SQL schema copy button */}
        <div className="pt-2 border-t border-[#1e2430]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-mono text-[#8b96a7]">
              Таблицы для Supabase (SQL Script):
            </span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1 text-xs font-mono text-[#38bdf8] hover:text-white transition-colors"
            >
              {isCopiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopiedSql ? 'Скопировано!' : 'Копировать SQL'}</span>
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-[#090b0e] border border-[#1b202a] text-[10px] font-mono text-[#94a3b8] overflow-x-auto max-h-36 scrollbar-thin">
            {SUPABASE_SQL_SCHEMA}
          </pre>
        </div>
      </div>

      {/* 3. Emergency Maintenance / Factory Reset */}
      <div className="p-5 rounded-xl bg-[#121419] border border-[#242933]">
        <h4 className="font-display font-bold text-sm text-white mb-1">
          Сброс данных до начального каталога
        </h4>
        <p className="text-xs text-[#8c98a8] font-mono mb-3">
          Если вы хотите вернуть все исходные позиции и настройки бренда УШИМА:
        </p>
        <button
          onClick={() => {
            if (window.confirm('Сбросить базу данных до заводских товаров УШИМА?')) {
              onResetData();
            }
          }}
          className="px-3.5 py-2 rounded-lg bg-[#261616] hover:bg-[#381e1e] text-red-400 font-mono text-xs border border-[#4a2424] transition-colors"
        >
          Сбросить до шаблона УШИМА
        </button>
      </div>
    </div>
  );
};
