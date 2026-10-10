'use client';

import { Check } from 'lucide-react';
import { CATEGORY_COLORS, SUGGESTED_EMOJI, categoryRgb, firstGrapheme } from '@/lib/category-colors';

/** Name + emoji + colour fields with a live preview. Shared by the New and Edit dialogs. */
export function CategoryFormFields({
  name,
  onNameChange,
  icon,
  onIconChange,
  color,
  onColorChange
}: {
  name: string;
  onNameChange: (name: string) => void;
  icon: string;
  onIconChange: (icon: string) => void;
  color: string;
  onColorChange: (color: string) => void;
}) {
  const rgb = categoryRgb(color);

  return (
    <div className="space-y-4">
      {/* Live preview: shows exactly how the card header will look */}
      <div
        className="glass glass-tint flex items-center gap-3 rounded-2xl p-3"
        style={{ '--cat-rgb': rgb } as React.CSSProperties}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: `rgb(${rgb} / 0.22)` }}
        >
          {icon || '📌'}
        </span>
        <span className="min-w-0 truncate font-display text-sm font-semibold text-ink">{name.trim() || 'Category name'}</span>
      </div>

      <div className="flex gap-2">
        <input
          value={icon}
          onChange={(e) => onIconChange(firstGrapheme(e.target.value))}
          className="w-14 glass-input px-2 py-2 text-center text-lg"
          aria-label="Emoji icon"
        />
        <input
          autoFocus
          placeholder="Category name (e.g. Restaurants)"
          value={name}
          maxLength={60}
          onChange={(e) => onNameChange(e.target.value)}
          aria-label="Category name"
          className="flex-1 glass-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
        />
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick emoji">
        {SUGGESTED_EMOJI.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onIconChange(emoji)}
            aria-label={`Use ${emoji}`}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${
              icon === emoji ? 'bg-white/90 shadow-sm ring-1 ring-teal/40' : 'hover:bg-white/60'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Colour</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category colour">
          {CATEGORY_COLORS.map((c) => {
            const selected = color.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={c.name}
                title={c.name}
                onClick={() => onColorChange(c.hex)}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/80 shadow-sm transition active:scale-95"
                style={{
                  backgroundColor: c.hex,
                  boxShadow: selected ? `0 0 0 2px #fff, 0 0 0 4px ${c.hex}` : undefined
                }}
              >
                {selected && <Check size={16} className="text-white" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
