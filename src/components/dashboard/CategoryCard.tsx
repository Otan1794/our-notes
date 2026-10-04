'use client';

import { useState } from 'react';
import { ChevronDown, GripVertical } from 'lucide-react';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import { ItemCard } from '@/components/items/ItemCard';

/**
 * `stacked` = mobile layout: natural height, no drag handle, and the header
 * collapses/expands the list so long categories don't bury the rest.
 */
export function CategoryCard({
  category,
  items,
  stacked = false
}: {
  category: Category;
  items: Item[];
  stacked?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const header = (
    <>
      {stacked ? (
        <ChevronDown size={16} className={`text-muted transition ${collapsed ? '-rotate-90' : ''}`} />
      ) : (
        <GripVertical size={14} className="text-muted" />
      )}
      <span className="text-lg" style={{ color: category.color }}>
        {category.icon}
      </span>
      <h2 className="font-display text-sm font-semibold text-ink">{category.name}</h2>
      <span className="ml-auto text-xs text-muted">{items.length}</span>
    </>
  );

  return (
    <div
      className={`flex flex-col rounded-card border border-border bg-card/60 p-3 shadow-pin ${stacked ? '' : 'h-full'}`}
    >
      {stacked ? (
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-h-[44px] w-full items-center gap-2 pb-2 text-left"
        >
          {header}
        </button>
      ) : (
        <div className="category-drag-handle flex cursor-grab items-center gap-2 pb-2 active:cursor-grabbing">
          {header}
        </div>
      )}

      {!(stacked && collapsed) && (
        <div className={stacked ? 'space-y-2' : 'flex-1 space-y-2 overflow-y-auto pr-1'}>
          {items.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted">Nothing here yet.</p>
          ) : (
            items.map((item) => <ItemCard key={item.id} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}