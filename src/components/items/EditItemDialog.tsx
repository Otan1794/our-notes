'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { updateItem } from '@/services/items';
import { getCategories } from '@/services/categories';
import { ChecklistEditor } from './ChecklistEditor';
import { parseVideoUrl } from '@/lib/video';
import type { ChecklistItem, Item, TodoMetadata } from '@/types/item';

export function EditItemDialog({
  item,
  open,
  onOpenChange
}: {
  item: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isLinkLike = item.type === 'link' || item.type === 'video';
  const isTodo = item.type === 'todo';

  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(isLinkLike ? item.url ?? '' : item.description ?? '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>((item.metadata as TodoMetadata)?.checklist ?? []);
  const [dueDate, setDueDate] = useState((item.metadata as TodoMetadata)?.dueDate ?? '');
  const [categoryId, setCategoryId] = useState(item.categoryId ?? '');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch the category list only when the dialog actually opens, rather than
  // threading `categories` as a prop through every ItemCard call site.
  useEffect(() => {
    if (!open) return;
    getCategories(item.workspaceId).then(setCategories).catch(() => setCategories([]));
  }, [open, item.workspaceId]);

  // Reset fields to the item's current values each time the dialog re-opens,
  // in case it was edited elsewhere since the last time it was open.
  useEffect(() => {
    if (!open) return;
    setTitle(item.title);
    setBody(item.type === 'note' ? item.content ?? '' : isLinkLike ? item.url ?? '' : item.description ?? '');
    setChecklist((item.metadata as TodoMetadata)?.checklist ?? []);
    setDueDate((item.metadata as TodoMetadata)?.dueDate ?? '');
    setCategoryId(item.categoryId ?? '');
  }, [open, item, isLinkLike]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await updateItem(item.id, {
      title: title.trim(),
      categoryId: categoryId || null,
      content: item.type === 'note' ? body : undefined,
      url: isLinkLike ? body : undefined,
      description: item.type !== 'note' && !isTodo && item.type !== 'video' && item.type !== 'location' ? body : undefined,
      metadata: isTodo ? { checklist, dueDate: dueDate || undefined } : item.type === 'video' ? parseVideoUrl(body) ?? {} : undefined
    });
    router.refresh();
    setSaving(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="font-display text-lg font-semibold">Edit {item.type}</DialogTitle>
        <div className="mt-4 space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
          />

          {isTodo ? (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block text-xs text-muted">Deadline (optional)</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <ChecklistEditor items={checklist} onChange={setChecklist} />
            </div>
          ) : item.type === 'location' ? (
            <p className="text-xs text-muted">
              To change the place itself, delete this item and add it again — only the title and category can be edited here.
            </p>
          ) : (
            <textarea
              placeholder={item.type === 'link' ? 'URL' : item.type === 'video' ? 'YouTube, Instagram Reel, or Facebook Reel URL' : 'Details'}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="h-24 w-full resize-none rounded-lg border border-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-teal"
            />
          )}

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="w-full rounded-lg bg-teal px-3 py-2 text-sm font-medium text-teal-foreground disabled:opacity-50"
          >
            Save changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}