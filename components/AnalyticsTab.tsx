import React, { useEffect, useState } from 'react';
import { AnalyticsData, AnalyticsItem, AnalyticsCountryItem } from '../types';
import { apiService } from '../services/apiService';
import {
  Package, Sparkles, Globe, Layers, ShieldCheck,
  ChevronDown, ChevronUp, BarChart2, Loader2, Filter,
  Package2, ChevronRight,
} from 'lucide-react';

// ── Horizontal bar chart ────────────────────────────────────────────────────
const PALETTE = [
  'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-orange-500',
];

const BarChart: React.FC<{ items: AnalyticsItem[]; max?: number }> = ({ items, max }) => {
  const peak = max ?? Math.max(...items.map(i => i.count), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const pct = Math.round((item.count / peak) * 100);
        const color = PALETTE[idx % PALETTE.length];
        return (
          <div key={item.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-700 font-medium truncate max-w-[70%]">{item.label}</span>
              <span className="text-gray-500 font-semibold ml-2 flex-shrink-0">{item.count}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Stat card ───────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  iconBg: string;
  iconColor: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, iconBg, iconColor }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <span className={iconColor}>{icon}</span>
    </div>
    <div className="min-w-0">
      <div className="text-2xl font-bold text-gray-800 leading-tight">{value}</div>
      <div className="text-sm font-medium text-gray-500 truncate">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  </div>
);

// ── Section wrapper ─────────────────────────────────────────────────────────
interface SectionProps {
  title: string;
  icon: React.ReactNode;
  headerBg: string;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ title, icon, headerBg, children }) => (
  <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
    <div className={`${headerBg} text-white px-5 py-3 flex items-center gap-2`}>
      {icon}
      <span className="text-xs font-bold uppercase tracking-widest">{title}</span>
    </div>
    <div className="bg-white p-5">{children}</div>
  </div>
);

interface AnalyticsTabProps {
  selectedGroup: string;
}

// ── Main component ──────────────────────────────────────────────────────────
const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ selectedGroup }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setData(null);
    setSelectedCountry(null);
    apiService.getAnalytics(selectedGroup).then(d => {
      setData(d);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, [selectedGroup]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-400">
        <Loader2 size={36} className="animate-spin text-primary-500" />
        <p className="text-sm">Загружаем аналитику...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray-400">
        <BarChart2 size={48} className="opacity-30" />
        <p className="text-sm">Не удалось загрузить данные</p>
        <button
          onClick={load}
          className="text-xs px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  const newCount = data.newProducts.length;
  const year = new Date().getFullYear();
  const isFiltered = selectedGroup !== 'Все';

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in">

      {/* ── Active group filter badge ───────────────────────────────── */}
      {isFiltered && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
          <Filter size={15} className="text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-700 font-medium">
            Категория: <strong>{selectedGroup}</strong>
          </span>
        </div>
      )}

      {/* ── Top stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Package size={22} />}
          label="Всего продуктов"
          value={data.total}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={<Sparkles size={22} />}
          label="Новинок"
          value={newCount}
          sub={`статус "Новый"`}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <StatCard
          icon={<Globe size={22} />}
          label="Стран-производителей"
          value={data.byCountry.length}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* ── New products list ───────────────────────────────────────── */}
      {newCount > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-rose-100">
          <button
            onClick={() => setNewOpen(o => !o)}
            className="w-full bg-rose-600 text-white px-5 py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Новые продукты {year}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-white/20 rounded-full px-2 py-0.5">
                {newCount}
              </span>
              {newOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {newOpen && (
            <div className="bg-white divide-y divide-gray-50">
              {data.newProducts.map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-800 font-medium">{p.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                    {p.group}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── By group (only when showing all) ──────────────────────── */}
      {!isFiltered && data.byGroup.length > 0 && (
        <Section
          title="По категориям"
          icon={<Layers size={15} />}
          headerBg="bg-blue-600"
        >
          <BarChart items={data.byGroup} />
        </Section>
      )}

      {/* ── By country (clickable → products right under country) ─────── */}
      {data.byCountry.length > 0 && (
        <Section
          title="Страны-производители"
          icon={<Globe size={15} />}
          headerBg="bg-emerald-600"
        >
          <div className="space-y-2.5">
            {(data.byCountry as AnalyticsCountryItem[]).map((item, idx) => {
              const max = Math.max(...data.byCountry.map(c => c.count), 1);
              const pct = Math.round((item.count / max) * 100);
              const color = PALETTE[idx % PALETTE.length];
              const isSelected = selectedCountry === item.label;
              const products = item.products ?? [];
              return (
                <div key={item.label} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCountry(prev => prev === item.label ? null : item.label)}
                    className={`w-full text-left rounded-xl p-2 -m-1 transition-all ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="text-gray-700 font-medium truncate flex-1">{item.label}</span>
                      <span className="text-gray-500 font-semibold text-xs flex-shrink-0 flex items-center gap-1">
                        {item.count}
                        <ChevronRight size={14} className={isSelected ? 'rotate-90' : ''} />
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>

                  {/* Products block — сразу под выбранной страной */}
                  {isSelected && products.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 overflow-hidden ml-0">
                      <div className="px-3 py-2 flex items-center gap-2 border-b border-emerald-200/80">
                        <Package2 size={16} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-emerald-800">Продукты</span>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-100 rounded-full px-2 py-0.5">
                          {products.length}
                        </span>
                      </div>
                      <div className="p-3 flex flex-wrap gap-2">
                        {products.map((p, i) => (
                          <div
                            key={i}
                            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-100 text-sm text-gray-800 shadow-sm"
                          >
                            <span className="font-medium">{p.name}</span>
                            {p.group && (
                              <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                                {p.group}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── By dispensing conditions ────────────────────────────────── */}
      {data.byConditions.length > 0 && (
        <Section
          title="Условия отпуска"
          icon={<ShieldCheck size={15} />}
          headerBg="bg-violet-600"
        >
          <BarChart items={data.byConditions} />
        </Section>
      )}
    </div>
  );
};

export default AnalyticsTab;
