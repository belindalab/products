import React from 'react';
import { ProductData } from '../types';
import { generateDoctorCopyText, copyToClipboard } from '../utils/format';
import VideoPlayer from './VideoPlayer';
import SmartText from './SmartText';
import {
  Copy, FileText, CheckCircle2,
  Info, FlaskConical, Stethoscope, TrendingUp, MoreHorizontal,
  ExternalLink, BookOpen, ShoppingCart, Baby,
} from 'lucide-react';

interface InfoTabProps {
  data: ProductData | null;
  loading: boolean;
  onToast: (msg: string) => void;
}

interface SectionConfig {
  t: string;
  k: string[];
  icon: React.ReactNode;
  headerBg: string;
  headerText: string;
  borderColor: string;
  labelColor: string;
}

// Detect if a string is a URL
function isUrl(val: string) {
  return typeof val === 'string' && val.trim().startsWith('http');
}

// Normalize a key: trim spaces and trailing colons/semicolons
// e.g. "Производитель:" → "производитель", "Группы:" → "группы"
function normKey(k: string) {
  return k.trim().replace(/[:\s]+$/, '').toLowerCase();
}

// Map a column key to a nice button label + color
function getLinkMeta(key: string): { label: string; color: string } {
  const k = key.toLowerCase();
  if (k.includes('саломат'))   return { label: 'В Саломат',    color: 'bg-red-600 hover:bg-red-700 text-white' };
  if (k.includes('системе') || k.includes('система'))
                                return { label: 'В системе',    color: 'bg-red-600 hover:bg-red-700 text-white' };
  if (k.includes('инструкц')) return { label: 'Инструкция',    color: 'bg-blue-600 hover:bg-blue-700 text-white' };
  if (k.includes('видео') || k.includes('video'))
                                return { label: 'Видео',         color: 'bg-purple-600 hover:bg-purple-700 text-white' };
  return { label: key,         color: 'bg-gray-700 hover:bg-gray-800 text-white' };
}

const InfoTab: React.FC<InfoTabProps> = ({ data, loading, onToast }) => {
  const [copied, setCopied] = React.useState(false);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-52 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-10 bg-gray-200 rounded-xl w-full"></div>
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-28 bg-gray-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>Информация отсутствует</p>
      </div>
    );
  }

  // ── Media keys ──────────────────────────────────────────────────────────────
  const imgKey = Object.keys(data).find(k => k.toLowerCase() === 'фото') ||
                 Object.keys(data).find(k => k.toLowerCase() === 'photo') ||
                 Object.keys(data).find(k =>
                   typeof data[k] === 'string' &&
                   data[k].startsWith('http') &&
                   !k.toLowerCase().includes('видео') &&
                   !k.toLowerCase().includes('video') &&
                   !k.toLowerCase().includes('инструкц') &&
                   !k.toLowerCase().includes('саломат') &&
                   !k.toLowerCase().includes('системе')
                 );

  const vidKey = Object.keys(data).find(k =>
    k.toLowerCase().includes('видео') || k.toLowerCase().includes('video')
  );

  // ── URL / link columns → rendered as buttons ─────────────────────────────
  const linkKeys = Object.keys(data).filter(k => {
    const kl = k.toLowerCase();
    return (
      isUrl(String(data[k])) &&
      k !== imgKey &&
      k !== vidKey &&
      (kl.includes('саломат') || kl.includes('системе') || kl.includes('инструкц'))
    );
  });

  // ── Info section definitions ──────────────────────────────────────────────
  const labelMapping: Record<string, string> = {
    'group': 'Группа', 'category': 'Группа',
    'mnn': 'МНН', 'price': 'Цена',
    'composition': 'Состав',
    'indications': 'Показания к применению',
    'contraindications': 'Противопоказания',
    'dosage': 'Способ применения и дозы',
  };

  const sections: SectionConfig[] = [
    {
      t: 'Общая информация',
      k: ['Торговое название', 'Частное название', 'Международное непатентованное название',
          'МНН', 'Группа', 'Группы', 'group', 'category', 'Фармакотерапевтическая группа',
          'Производитель', 'Условия отпуска', 'Цена'],
      icon: <Info size={15} />,
      headerBg: 'bg-blue-600',
      headerText: 'text-white',
      borderColor: 'border-blue-100',
      labelColor: 'text-blue-500',
    },
    {
      t: 'Состав и форма выпуска',
      k: ['Состав', 'Лекарственная форма и форма выпуска', 'Форма выпуска'],
      icon: <FlaskConical size={15} />,
      headerBg: 'bg-emerald-600',
      headerText: 'text-white',
      borderColor: 'border-emerald-100',
      labelColor: 'text-emerald-600',
    },
    {
      t: 'Применение',
      k: ['Показания к применению', 'Способ применения и дозы', 'Характеристики дозы',
          'Основное применение', 'Беременность и лактация', 'СПВ', 'СИВ'],
      icon: <Stethoscope size={15} />,
      headerBg: 'bg-rose-600',
      headerText: 'text-white',
      borderColor: 'border-rose-100',
      labelColor: 'text-rose-600',
    },
    {
      t: 'Маркетинг',
      k: ['Позиционирование', 'Аналоги', 'Аналог', 'Особые примечания', 'Рекомендации'],
      icon: <TrendingUp size={15} />,
      headerBg: 'bg-violet-600',
      headerText: 'text-white',
      borderColor: 'border-violet-100',
      labelColor: 'text-violet-600',
    },
  ];

  const allSectionKeys = sections.flatMap(s => s.k).map(k => normKey(k));
  const alwaysSkip = new Set(['фото', 'photo', 'дата', 'статус', 'в системе', 'инструкция']);
  const shownKeys = new Set<string>();

  const handleCopyForDoctor = async () => {
    const content = generateDoctorCopyText(data);
    if (content) {
      const success = await copyToClipboard(content.text, content.html);
      if (success) {
        setCopied(true);
        onToast('Скопировано для врача!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  // Collect all action buttons (links + copy)
  const hasActions = linkKeys.length > 0 || !!generateDoctorCopyText(data);

  return (
    <div className="pb-24 p-4 space-y-4 animate-fade-in">

      {/* ── Product image ─────────────────────────────────────────────── */}
      {imgKey && data[imgKey] && (
        <div className="rounded-2xl overflow-hidden shadow-lg bg-white border border-gray-100 flex items-center justify-center p-3"
             style={{ minHeight: '180px', maxHeight: '280px' }}>
          <img
            src={data[imgKey]}
            alt="Product"
            className="w-full h-full object-contain"
            style={{ maxHeight: '260px' }}
          />
        </div>
      )}

      {/* ── Info sections ─────────────────────────────────────────────── */}
      {sections.map(section => {
        const validItems: { label: string; value: string }[] = [];

        section.k.forEach(key => {
          const realKey = Object.keys(data).find(
            dk => normKey(dk) === normKey(key)
          );
          if (realKey && data[realKey]) {
            // Use a clean label: strip trailing colon from the real key
            const cleanKey = realKey.trim().replace(/[:\s]+$/, '');
            const label = labelMapping[normKey(key)] || cleanKey;
            if (!validItems.some(i => i.label === label)) {
              validItems.push({ label, value: String(data[realKey]) });
              shownKeys.add(normKey(realKey));
            }
          }
        });

        if (validItems.length === 0) return null;

        return (
          <div
            key={section.t}
            className={`rounded-2xl overflow-hidden shadow-sm border ${section.borderColor}`}
          >
            {/* Colored header */}
            <div className={`${section.headerBg} ${section.headerText} px-5 py-3 flex items-center gap-2`}>
              {section.icon}
              <span className="text-xs font-bold uppercase tracking-widest">{section.t}</span>
            </div>

            {/* Content */}
            <div className="bg-white p-5 space-y-4">
              {validItems.map((item, idx) => {
                const isAnalogs = item.label === 'Аналоги' || item.label === 'Аналог';
                const isPregnancy = item.label === 'Беременность и лактация';
                const tagItems = isAnalogs
                  ? item.value.split(/\n|,/).map(s => s.trim()).filter(Boolean)
                  : [];
                return (
                  <div key={`${item.label}-${idx}`}>
                    {isPregnancy ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                          <Baby size={24} className="text-rose-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">
                            {item.label}
                          </div>
                          <SmartText text={item.value} labelColor="text-rose-600" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={`text-xs font-semibold uppercase mb-2 ${section.labelColor}`}>
                          {item.label}
                        </div>
                        {isAnalogs && tagItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {tagItems.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-violet-100 text-violet-800 border border-violet-200/80"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <SmartText text={item.value} labelColor={section.labelColor} />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ── Catch-all: columns not in any group ───────────────────────── */}
      {(() => {
        const extra = Object.keys(data).filter(k => {
          const nk = normKey(k);
          return (
            !shownKeys.has(nk) &&
            !alwaysSkip.has(nk) &&
            !allSectionKeys.includes(nk) &&
            !linkKeys.includes(k) &&
            k !== vidKey &&
            k !== imgKey &&
            data[k] &&
            String(data[k]).trim() !== ''
          );
        });

        if (extra.length === 0) return null;

        return (
          <div className="rounded-2xl overflow-hidden shadow-sm border border-amber-100">
            <div className="bg-amber-500 text-white px-5 py-3 flex items-center gap-2">
              <MoreHorizontal size={15} />
              <span className="text-xs font-bold uppercase tracking-widest">Дополнительно</span>
            </div>
            <div className="bg-white p-5 space-y-4">
              {extra.map(key => {
                const val = String(data[key]);
                const nk = normKey(key);
                const isAnalogs = nk === 'аналоги' || nk === 'аналог';
                const isPregnancy = nk === 'беременность и лактация';
                const tagItems = isAnalogs ? val.split(/\n|,/).map(s => s.trim()).filter(Boolean) : [];
                return (
                  <div key={key}>
                    {isPregnancy ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                          <Baby size={24} className="text-rose-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">{key.replace(/[:\s]+$/, '')}</div>
                          <SmartText text={val} labelColor="text-rose-600" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="text-xs font-semibold text-amber-600 uppercase mb-2">{key}</div>
                        {isAnalogs && tagItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {tagItems.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200/80"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <SmartText text={val} labelColor="text-amber-600" />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Video ─────────────────────────────────────────────────────── */}
      {vidKey && <VideoPlayer url={data[vidKey]} />}

      {/* ── Action buttons (after video): column on mobile, row on desktop ─ */}
      {hasActions && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {linkKeys.map(key => {
            const { label, color } = getLinkMeta(key);
            return (
              <a
                key={key}
                href={String(data[key])}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 ${color}`}
              >
                {key.toLowerCase().includes('инструкц') ? (
                  <BookOpen size={16} className="flex-shrink-0" />
                ) : key.toLowerCase().includes('саломат') || key.toLowerCase().includes('системе') ? (
                  <ShoppingCart size={16} className="flex-shrink-0" />
                ) : (
                  <ExternalLink size={16} className="flex-shrink-0" />
                )}
                <span className="min-w-0 sm:truncate">{label}</span>
              </a>
            );
          })}
          {generateDoctorCopyText(data) && (
            <button
              onClick={handleCopyForDoctor}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all active:scale-95 border col-span-full sm:col-span-1 ${
                copied
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {copied ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <Copy size={16} className="flex-shrink-0" />}
              <span className="min-w-0 sm:truncate">{copied ? 'Скопировано' : 'Скопировать для врача'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoTab;
