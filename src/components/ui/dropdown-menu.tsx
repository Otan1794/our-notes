'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align="end"
        sideOffset={4}
        className={cn(
          'z-50 min-w-[10rem] rounded-lg border border-border bg-card p-1 shadow-pin',
          className
        )}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: React.ComponentProps<typeof RadixDropdown.Item> & { destructive?: boolean }) {
  return (
    <RadixDropdown.Item
      className={cn(
        'cursor-pointer rounded-md px-2 py-1.5 text-sm outline-none transition',
        destructive ? 'text-coral hover:bg-coral/10' : 'text-ink hover:bg-teal/10',
        className
      )}
      {...props}
    />
  );
}
