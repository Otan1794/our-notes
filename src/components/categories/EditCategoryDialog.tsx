'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Category } from '@/types/category';
import { updateCategory } from '@/services/categories';
import { CategoryFormFields } from './CategoryFormFields';

export function EditCategoryDialog({
  category,
  open,
  onOpenChange
}: {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon);
  const [color, setColor] = useState(category.color);
  const [saving, setSaving] = useState(false);

  // Start from the saved values every time the dialog opens, so cancelling an
  // earlier edit never leaves half-typed changes behind. (The dialog is opened
  // from the parent through the `open` prop, so watch that prop directly.)
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateCategory(category.id, { name, icon, color });
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      console.error('Could not update category:', err);
      alert('Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="font-display text-lg font-semibold">Edit category</DialogTitle>
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
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
