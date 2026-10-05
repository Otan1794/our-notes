'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createCategory } from '@/services/categories';

const SUGGESTED_COLORS = ['#2C5C5F', '#E2725B', '#C9A227', '#5B7DB1', '#7A5C61'];

export function AddCategoryDialog({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState(SUGGESTED_COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await createCategory({ workspaceId, name: name.trim(), icon, color });
    router.refresh();
    setSaving(false);
    setOpen(false);
    setName('');
    setIcon('📌');
    setColor(SUGGESTED_COLORS[0]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex min-h-[40px] whitespace-nowrap flex-1 items-center justify-center gap-1 glass-btn px-3 py-2 text-sm font-medium md:flex-none">
          <FolderPlus size={16} /> New Category
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-display text-lg font-semibold">New category</DialogTitle>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              className="w-14 glass-input px-2 py-2 text-center text-lg"
              aria-label="Emoji icon"
            />
            <input
              autoFocus
              placeholder="Category name (e.g. Restaurants)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 glass-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div className="flex gap-2">
            {SUGGESTED_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: color === c ? '#26282B' : 'transparent' }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full glass-btn-primary px-3 py-2 text-sm font-medium text-teal-foreground disabled:opacity-50"
          >
            Create category
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}