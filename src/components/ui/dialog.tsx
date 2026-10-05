'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-[6px]" />
      <RadixDialog.Content
        className={cn(
          // w-[calc(100%-2rem)] keeps a 16px gutter on phones; max-h + overflow-y-auto
          // lets tall forms scroll instead of running off-screen (dvh = iOS-safe viewport height).
          'fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto glass-strong rounded-[22px] p-4 sm:p-6',
          className
        )}
      >
        {children}
        <RadixDialog.Close className="absolute right-4 top-4 text-muted hover:text-ink">
          <X size={18} />
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;