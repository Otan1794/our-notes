'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createCategory } from '@/services/categories';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/category-colors';
import { CategoryFormFields } from './CategoryFormFields';

export function AddCategoryDialog({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createCategory({ workspaceId, name: name.trim(), icon, color });
      router.refresh();
      setOpen(false);
      setName('');
      setIcon('📌');
      setColor(DEFAULT_CATEGORY_COLOR);
    } catch (err) {
      console.error('Could not create category:', err);
      alert('Could not create the category. Please try again.');
    } finally {
      setSaving(false);
    }
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
        <div className="mt-4 space-y-4">
          <CategoryFormFields
            name={name}
            onNameChange={setName}
            icon={icon}
            onIconChange={setIcon}
            color={color}
            onColorChange={setColor}
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="w-full glass-btn-primary px-3 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create category'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}