'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, GripVertical, MoreVertical, Pencil, Search, Trash2, X } from 'lucide-react';
import type { Category } from '@/types/category';
import type { Item, TodoMetadata } from '@/types/item';
import { ItemAccordion } from '@/components/items/ItemAccordion';
import { deleteCategory } from '@/services/categories';
import { categoryRgb } from '@/lib/category-colors';
import { EditCategoryDialog } from '@/components/categories/EditCategoryDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/** Every word typed must appear somewhere in the item (title, notes, link, tags, checklist). */
function matchesQuery(item: Item, query: string) {
  const checklist = (item.metadata as TodoMetadata | undefined)?.checklist ?? [];
  const haystack = [item.title, item.description, item.content, item.url, ...item.tags, ...checklist.map((l) => l.text)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

/**
 * Category options menu: edit (name, emoji, colour) and delete. Deleting a
 * category never deletes its items: the database sets their category to
 * null, so they reappear under "Uncategorized".
 */
function CategoryMenu({
  category,
  itemCount,
  className
}: {
  category: Category;
  itemCount: number;
  className: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    const message =
      itemCount > 0
        ? `Delete the "${category.name}" category?\n\nIts ${itemCount} item${itemCount === 1 ? '' : 's'} won't be deleted. ${itemCount === 1 ? 'It' : 'They'} will move to Uncategorized.`
        : `Delete the "${category.name}" category?`;
    if (!confirm(message)) return;
    try {
      await deleteCategory(category.id);
      router.refresh();
    } catch (err) {
      console.error('Could not delete category:', err);
      alert('Could not delete the category. Please try again.');
    }
  }

  return (
    <>
      {/* modal={false}: the menu must not lock the page itself, otherwise opening the
          edit dialog while it closes leaves the page stuck unclickable (Radix pointer-events bug). */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger aria-label={`Options for ${category.name}`} className={className}>
          <MoreVertical size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <span className="flex items-center gap-2">
              <Pencil size={14} /> Edit category
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={handleDelete}>
            <span className="flex items-center gap-2">
              <Trash2 size={14} /> Delete category
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditCategoryDialog category={category} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}

/**
 * `stacked` = phone layout: natural height, no drag handle. The header
 * collapses/expands the list, and up/down buttons reorder the category
 * (touch drag-and-drop fights with scrolling, so buttons are more reliable).
 */
export function CategoryCard({
  category,
  items,
  stacked = false,
  onMoveUp,
  onMoveDown
}: {
  category: Category;
  items: Item[];
  stacked?: boolean;
  onMoveUp?: () => void; // undefined = already first
  onMoveDown?: () => void; // undefined = already last
}) {
  const [collapsed, setCollapsed] = useState(false);
  const rgb = categoryRgb(category.color);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => (query.trim() ? items.filter((item) => matchesQuery(item, query)) : items),
    [items, query]
  );
  const isFiltering = query.trim().length > 0;

  const title = (
    <>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base"
        style={{ backgroundColor: `rgb(${rgb} / 0.22)` }}
      >
        {category.icon}
      </span>
      <h2 className="min-w-0 truncate font-display text-sm font-semibold text-ink">{category.name}</h2>
      <span className="ml-auto text-xs tabular-nums text-muted">
        {isFiltering ? `${filtered.length}/${items.length}` : items.length}
      </span>
    </>
  );

  return (
    <div
      className={`flex flex-col glass glass-tint rounded-[22px] p-3 ${stacked ? '' : 'h-full'}`}
      style={{ '--cat-rgb': rgb } as React.CSSProperties}
    >
      {stacked ? (
        <div className="flex items-center gap-1 pb-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 text-left"
          >
            <ChevronDown size={16} className={`shrink-0 text-muted transition ${collapsed ? '-rotate-90' : ''}`} />
            {title}
          </button>
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label={`Move ${category.name} up`}
            className="glass-btn flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-35"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label={`Move ${category.name} down`}
            className="glass-btn flex h-10 w-10 shrink-0 items-center justify-center disabled:opacity-35"
          >
            <ChevronDown size={18} />
          </button>
          <CategoryMenu
            category={category}
            itemCount={items.length}
            className="glass-btn flex h-10 w-10 shrink-0 items-center justify-center text-muted"
          />
        </div>
      ) : (
        // touch-none: on touch screens at tablet width, dragging the header
        // moves the card instead of scrolling the page.
        <div className="category-drag-handle flex cursor-grab touch-none items-center gap-2 pb-2 active:cursor-grabbing">
          <GripVertical size={14} className="text-muted" />
          {title}
          <CategoryMenu
            category={category}
            itemCount={items.length}
            className="no-drag flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-white/60"
          />
        </div>
      )}

      {!(stacked && collapsed) && (
        <>
          {items.length > 0 && (
            <div className="relative mb-2">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
                placeholder="Filter items…"
                aria-label={`Filter items in ${category.name}`}
                className="glass-input w-full py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-teal"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* -mx-1/px-1 leaves room for the open row's shadow, which the scroll container would otherwise clip */}
          <div className={stacked ? '' : '-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1'}>
            {items.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted">Nothing here yet.</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted">No items match &ldquo;{query.trim()}&rdquo;.</p>
            ) : (
              <ItemAccordion items={filtered} />
            )}
          </div>
        </>
      )}
    </div>
  );
}