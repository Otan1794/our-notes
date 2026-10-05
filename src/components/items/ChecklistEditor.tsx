'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { ChecklistItem } from '@/types/item';

export function ChecklistEditor({
  items,
  onChange
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function addLine() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: crypto.randomUUID(), text, done: false }]);
    setDraft('');
  }

  function removeLine(id: string) {
    onChange(items.filter((line) => line.id !== id));
  }

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((line) => (
            <li key={line.id} className="flex items-center gap-2 glass-input px-2 py-1.5">
              <span className="flex-1 text-sm text-ink">{line.text}</span>
              <button onClick={() => removeLine(line.id)} aria-label="Remove line item">
                <X size={14} className="text-muted hover:text-coral" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addLine();
            }
          }}
          placeholder="Add a line item…"
          className="flex-1 glass-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
        />
        <button
          onClick={addLine}
          type="button"
          className="flex items-center gap-1 glass-btn px-3 py-2 text-sm"
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}