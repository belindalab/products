import React, { useRef, useState, useEffect } from 'react';

interface SmartTextProps {
  text: string;
  labelColor?: string;
}

type Line =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'text'; text: string }
  | { type: 'spacer' };

// ── Parse raw text into typed lines ────────────────────────────────────────
function parseLines(text: string): Line[] {
  return text.split('\n').map(raw => {
    const line = raw.trim();
    if (!line) return { type: 'spacer' } as Line;
    if (line.endsWith(':') && line.length <= 60)
      return { type: 'heading', text: line.slice(0, -1) };
    if (/^[-•*]\s+/.test(line))
      return { type: 'bullet', text: line.replace(/^[-•*]\s+/, '') };
    return { type: 'text', text: line };
  });
}

// ── Group lines into sections [{heading, items}] ─────────────────────────
interface Section {
  heading: string;
  items: { type: 'bullet' | 'text'; text: string }[];
}

function groupIntoSections(lines: Line[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    if (line.type === 'heading') {
      if (current) sections.push(current);
      current = { heading: line.text, items: [] };
    } else if (line.type === 'bullet' || line.type === 'text') {
      if (!current) current = { heading: '', items: [] };
      current.items.push({ type: line.type, text: line.text });
    }
    // spacers are ignored between items
  }
  if (current) sections.push(current);
  return sections;
}

// ── Card colors cycling ────────────────────────────────────────────────────
const CARD_THEMES = [
  { bg: 'bg-rose-50',   border: 'border-rose-200',   title: 'text-rose-600',   dot: 'bg-rose-400',   bullet: 'bg-rose-400' },
  { bg: 'bg-blue-50',   border: 'border-blue-200',   title: 'text-blue-600',   dot: 'bg-blue-400',   bullet: 'bg-blue-400' },
  { bg: 'bg-emerald-50',border: 'border-emerald-200',title: 'text-emerald-600',dot: 'bg-emerald-400',bullet: 'bg-emerald-400' },
  { bg: 'bg-violet-50', border: 'border-violet-200', title: 'text-violet-600', dot: 'bg-violet-400', bullet: 'bg-violet-400' },
  { bg: 'bg-amber-50',  border: 'border-amber-200',  title: 'text-amber-600',  dot: 'bg-amber-400',  bullet: 'bg-amber-400' },
];

// ── Carousel renderer ──────────────────────────────────────────────────────
const Carousel: React.FC<{ sections: Section[] }> = ({ sections }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Track which card is visible via IntersectionObserver
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = Array.from(container.children) as HTMLElement[];

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const idx = cards.indexOf(e.target as HTMLElement);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );
    cards.forEach(c => obs.observe(c));
    return () => obs.disconnect();
  }, [sections.length]);

  const scrollTo = (idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.children[idx] as HTMLElement;
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  return (
    <div>
      {/* Scrollable cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 no-scrollbar"
        style={{ scrollbarWidth: 'none' }}
      >
        {sections.map((sec, i) => {
          const theme = CARD_THEMES[i % CARD_THEMES.length];
          return (
            <div
              key={i}
              className={`snap-center flex-shrink-0 w-[85%] rounded-2xl border p-4 ${theme.bg} ${theme.border}`}
            >
              {sec.heading && (
                <p className={`font-bold text-sm mb-3 ${theme.title}`}>
                  {sec.heading}
                </p>
              )}
              <div className="space-y-2">
                {sec.items.map((item, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm text-gray-700">
                    {item.type === 'bullet' && (
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${theme.bullet}`} />
                    )}
                    <span className="leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      {sections.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {sections.map((_, i) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            return (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  active === i
                    ? `w-5 h-2 ${theme.dot}`
                    : 'w-2 h-2 bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Plain fallback renderer ───────────────────────────────────────────────
const PlainText: React.FC<{ lines: Line[]; labelColor: string }> = ({ lines, labelColor }) => {
  type Block =
    | { type: 'heading'; text: string }
    | { type: 'bullets'; items: string[] }
    | { type: 'text'; text: string }
    | { type: 'spacer' };

  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.type === 'spacer') {
      if (blocks.length && blocks[blocks.length - 1].type !== 'spacer')
        blocks.push({ type: 'spacer' });
      i++; continue;
    }
    if (l.type === 'heading') { blocks.push({ type: 'heading', text: l.text }); i++; continue; }
    if (l.type === 'bullet') {
      const items: string[] = [];
      while (i < lines.length && lines[i].type === 'bullet') {
        items.push((lines[i] as { type: 'bullet'; text: string }).text);
        i++;
      }
      blocks.push({ type: 'bullets', items }); continue;
    }
    blocks.push({ type: 'text', text: (l as { type: 'text'; text: string }).text });
    i++;
  }
  while (blocks.length && blocks[0].type === 'spacer') blocks.shift();
  while (blocks.length && blocks[blocks.length - 1].type === 'spacer') blocks.pop();

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((b, idx) => {
        if (b.type === 'spacer') return <div key={idx} className="h-1" />;
        if (b.type === 'heading') return <p key={idx} className={`font-semibold mt-1 ${labelColor}`}>{b.text}</p>;
        if (b.type === 'bullets') return (
          <ul key={idx} className="space-y-1 pl-1">
            {b.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-gray-700">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${labelColor.replace('text-', 'bg-')}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
        return <p key={idx} className="text-gray-800">{(b as { type: 'text'; text: string }).text}</p>;
      })}
    </div>
  );
};

// ── Main export ───────────────────────────────────────────────────────────
const SmartText: React.FC<SmartTextProps> = ({ text, labelColor = 'text-gray-700' }) => {
  if (!text) return null;

  const lines = parseLines(text);
  const sections = groupIntoSections(lines);

  // Use carousel when there are 2+ named sections
  const namedSections = sections.filter(s => s.heading !== '');
  if (namedSections.length >= 2) {
    return <Carousel sections={namedSections} />;
  }

  return <PlainText lines={lines} labelColor={labelColor} />;
};

export default SmartText;
