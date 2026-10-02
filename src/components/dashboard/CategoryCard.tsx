'use client';

import { GripVertical } from 'lucide-react';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import { ItemCard } from '@/components/items/ItemCard';

export function CategoryCard({ category, items }: { category: Category; items: Item[] }) {
  return (
    <div className="flex h-full flex-col rounded-card border border-border bg-card/60 p-3 shadow-pin">
      <div className="category-drag-handle flex cursor-grab items-center gap-2 pb-2 active:cursor-grabbing">
        <GripVertical size={14} className="text-muted" />
        <span className="text-lg" style={{ color: category.color }}>
          {category.icon}
        </span>
        <h2 className="font-display text-sm font-semibold text-ink">{category.name}</h2>
        <span className="ml-auto text-xs text-muted">{items.length}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted">Nothing here yet.</p>
        ) : (
          items.map((item) => <ItemCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
