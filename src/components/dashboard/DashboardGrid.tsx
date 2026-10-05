'use client';

import { useCallback, useMemo } from 'react';
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
  // Phones/small tablets get a simple stacked list (touch-friendly, no
  // drag-and-drop). md and up (>= 768px) gets the draggable grid.
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [gridRef, width] = useContainerWidth<HTMLDivElement>();

  const layout: Layout[] = useMemo(() => {
    if (initialLayout.length) return initialLayout;
    // sensible default: 2 columns, stacked in creation order
    return categories.map((c, i) => ({
      i: c.id,
      x: (i % 2) * 6,
      y: Math.floor(i / 2) * 6,
      w: 6,
      h: 6
    }));
  }, [initialLayout, categories]);

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
      saveLayout(workspaceId, simplified);
    },
    [workspaceId]
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
            >
              {categories.map((category) => (
                <div key={category.id}>
                  <CategoryCard category={category} items={itemsByCategory.get(category.id) ?? []} />
                </div>
              ))}
            </GridLayout>
          ) : (
            <div className="space-y-3">
              {orderedCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  items={itemsByCategory.get(category.id) ?? []}
                  stacked
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}