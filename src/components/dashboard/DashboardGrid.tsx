'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import GridLayout, { type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import type { Category } from '@/types/category';
import type { Item } from '@/types/item';
import { CategoryCard } from './CategoryCard';
import { saveLayout, type GridLayoutItem } from '@/services/layouts';
import { AddCategoryDialog } from '@/components/categories/AddCategoryDialog';
import { ItemCard } from '@/components/items/ItemCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useContainerWidth } from '@/hooks/useContainerWidth';

export function DashboardGrid({
  workspaceId,
  categories,
  items,
  initialLayout
}: {
  workspaceId: string;
  categories: Category[];
  items: Item[];
  initialLayout: GridLayoutItem[];
}) {
  // Phones/small tablets get a simple stacked list with up/down buttons.
  // md and up (>= 768px) gets the draggable grid.
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [gridRef, width] = useContainerWidth<HTMLDivElement>();

  // Local copy of the saved layout so reordering responds instantly; it
  // re-syncs whenever the server sends a fresh one.
  const [savedLayout, setSavedLayout] = useState<GridLayoutItem[]>(initialLayout);
  useEffect(() => setSavedLayout(initialLayout), [initialLayout]);

  const layout: Layout[] = useMemo(() => {
    const known = new Map(savedLayout.map((l) => [l.i, l]));
    const bottom = savedLayout.reduce((max, l) => Math.max(max, l.y + l.h), 0);
    let extra = 0; // categories created after the layout was last saved
    return categories.map((c, i) => {
      const existing = known.get(c.id);
      if (existing) return existing;
      if (!savedLayout.length) {
        // sensible default: 2 columns, stacked in creation order
        return { i: c.id, x: (i % 2) * 6, y: Math.floor(i / 2) * 8, w: 6, h: 8 };
      }
      const n = extra++;
      return { i: c.id, x: (n % 2) * 6, y: bottom + Math.floor(n / 2) * 8, w: 6, h: 8 };
    });
  }, [savedLayout, categories]);

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const key = item.categoryId ?? 'uncategorized';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  // Stacked order on mobile follows the saved desktop layout (top to bottom,
  // then left to right) so both views read in the same order.
  const orderedCategories = useMemo(() => {
    const pos = new Map(layout.map((l) => [l.i, l]));
    return [...categories].sort((a, b) => {
      const pa = pos.get(a.id);
      const pb = pos.get(b.id);
      if (!pa || !pb) return 0;
      return pa.y - pb.y || pa.x - pb.x;
    });
  }, [categories, layout]);

  const uncategorizedItems = itemsByCategory.get('uncategorized') ?? [];

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      const simplified: GridLayoutItem[] = newLayout.map((l) => ({ i: l.i, x: l.x, y: l.y, w: l.w, h: l.h }));
      setSavedLayout(simplified);
      saveLayout(workspaceId, simplified).catch((err) => console.error('Could not save layout:', err));
    },
    [workspaceId]
  );

  // Phone reordering: swap this category's grid position with its neighbour's.
  // The stacked order is "top to bottom, then left to right", so swapping x/y
  // swaps their order in both the phone list and the desktop grid.
  const moveCategory = useCallback(
    (categoryId: string, direction: -1 | 1) => {
      const index = orderedCategories.findIndex((c) => c.id === categoryId);
      const neighbour = orderedCategories[index + direction];
      if (index < 0 || !neighbour) return;
      const a = layout.find((l) => l.i === categoryId)!;
      const b = layout.find((l) => l.i === neighbour.id)!;
      const next: GridLayoutItem[] = layout.map((l) => {
        const base = { i: l.i, x: l.x, y: l.y, w: l.w, h: l.h };
        if (l.i === a.i) return { ...base, x: b.x, y: b.y };
        if (l.i === b.i) return { ...base, x: a.x, y: a.y };
        return base;
      });
      setSavedLayout(next);
      saveLayout(workspaceId, next).catch((err) => console.error('Could not save layout:', err));
    },
    [layout, orderedCategories, workspaceId]
  );

  return (
    <div>
      {/* Items with no category always show here — they're never lost,
          even before any category exists. This section isn't draggable;
          only category cards go in the grid below. */}
      {uncategorizedItems.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 font-display text-sm font-semibold text-muted">Uncategorized</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorizedItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center glass-inner rounded-[22px] py-16 text-center">
          <p className="text-sm text-muted">
            No categories yet. Create one to start organizing your dashboard —
            or just keep adding items and sort them later.
          </p>
          <div className="mt-4">
            <AddCategoryDialog workspaceId={workspaceId} />
          </div>
        </div>
      ) : (
        <div ref={gridRef}>
          {isDesktop === null ? null : isDesktop ? (
            <GridLayout
              className="layout"
              layout={layout}
              cols={12}
              rowHeight={40}
              width={width}
              onDragStop={handleLayoutChange}
              onResizeStop={handleLayoutChange}
              draggableHandle=".category-drag-handle"
              draggableCancel=".no-drag"
            >
              {categories.map((category) => (
                <div key={category.id}>
                  <CategoryCard category={category} items={itemsByCategory.get(category.id) ?? []} />
                </div>
              ))}
            </GridLayout>
          ) : (
            <div className="space-y-3">
              {orderedCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  items={itemsByCategory.get(category.id) ?? []}
                  stacked
                  onMoveUp={index > 0 ? () => moveCategory(category.id, -1) : undefined}
                  onMoveDown={index < orderedCategories.length - 1 ? () => moveCategory(category.id, 1) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}