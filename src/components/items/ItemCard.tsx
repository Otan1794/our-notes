'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Star, MoreVertical, Archive, Trash2, Pencil, Play, Clock } from 'lucide-react';
import type { Item, TodoMetadata, VideoMetadata, LocationMetadata } from '@/types/item';
import { getItemTypeIcon } from './registry';
import { toggleFavorite, archiveItem, deleteItem, toggleTodoItem } from '@/services/items';
import { buildEmbedUrl } from '@/lib/maps-embed';
import { getDueDateUrgency, formatDueDate } from '@/lib/due-date';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EditItemDialog } from './EditItemDialog';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins || 1}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * `bare` = rendered inside an accordion row: no card surface of its own, and
 * no title (the row header already shows it).
 */
export function ItemCard({ item, bare = false }: { item: Item; bare?: boolean }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const Icon = getItemTypeIcon(item.type);

  const linkMeta = item.type === 'link' ? (item.metadata as any) : null;
  const videoMeta = item.type === 'video' ? (item.metadata as VideoMetadata) : null;

  // Notes store their body in `content`; every other type (except todo and
  // video, which use their own metadata) stores it in `description`.
  const bodyText = item.type === 'note' ? item.content : item.description;
  const checklist = item.type === 'todo' ? (item.metadata as TodoMetadata)?.checklist ?? [] : [];

  // Local copy so a tick shows instantly instead of waiting for the server
  // round trip. Re-synced from the server whenever the item is updated.
  const [lines, setLines] = useState(checklist);
  const [syncedAt, setSyncedAt] = useState(item.updatedAt);
  if (syncedAt !== item.updatedAt) {
    setSyncedAt(item.updatedAt);
    setLines(checklist);
  }

  async function handleToggleChecklistItem(checklistItemId: string) {
    setLines((prev) => prev.map((l) => (l.id === checklistItemId ? { ...l, done: !l.done } : l)));
    try {
      await toggleTodoItem(item.id, checklistItemId);
      router.refresh();
    } catch (err) {
      console.error('Could not update checklist item:', err);
      setLines(checklist); // revert to what the server last told us
    }
  }

  async function handleToggleFavorite() {
    await toggleFavorite(item.id, !item.isFavorite);
    router.refresh();
  }

  async function handleArchive() {
    await archiveItem(item.id);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    await deleteItem(item.id);
    router.refresh();
  }

  return (
    <div className={bare ? 'group min-w-0' : 'group min-w-0 glass-inner rounded-2xl p-4 transition hover:-translate-y-0.5'}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted">
          <Icon size={16} />
          <span className="text-xs uppercase tracking-wide">{item.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleFavorite}
            className="-m-1 p-2"
            aria-label={item.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Star size={16} className={item.isFavorite ? 'fill-coral text-coral' : 'text-muted'} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger aria-label="More options" className="-m-1 p-2">
              <MoreVertical size={16} className="text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault(); // avoid Radix racing the dropdown's close against the dialog's open
                  setEditOpen(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <Pencil size={14} /> Edit
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleArchive}>
                <span className="flex items-center gap-2">
                  <Archive size={14} /> Archive
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem destructive onSelect={handleDelete}>
                <span className="flex items-center gap-2">
                  <Trash2 size={14} /> Delete
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {linkMeta?.ogImage && (
        <div className="relative mt-3 h-32 w-full overflow-hidden rounded-lg bg-muted/10">
          <Image src={linkMeta.ogImage} alt="" fill className="object-cover" />
        </div>
      )}

      {/* Video: click-to-play. Sized by the parsed aspect ratio — vertical
          for Shorts/Reels, horizontal for standard YouTube — instead of
          forcing every video into 16:9. */}
      {videoMeta?.videoId && (
        <div
          className={`relative mt-3 w-full overflow-hidden rounded-lg bg-muted/10 ${
            videoMeta.aspect === 'vertical' ? 'aspect-[9/16] max-w-[240px]' : 'aspect-video'
          }`}
        >
          {playing ? (
            <iframe
              src={videoMeta.embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="group/play relative h-full w-full"
              aria-label={`Play ${item.title}`}
            >
              {videoMeta.thumbnailUrl ? (
                <Image src={videoMeta.thumbnailUrl} alt={item.title} fill className="object-cover" />
              ) : (
                // Instagram/Facebook don't expose a public thumbnail endpoint
                // the way YouTube does — show a labeled placeholder instead.
                <div className="flex h-full w-full items-center justify-center bg-ink/90 text-xs uppercase tracking-wide text-paper/70">
                  {videoMeta.provider}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition group-hover/play:bg-ink/30">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper/90">
                  <Play size={20} className="ml-0.5 text-ink" fill="currentColor" />
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {item.imagePath && (
        <div className="relative mt-3 h-40 w-full overflow-hidden rounded-lg bg-muted/10">
          <Image src={item.imagePath} alt={item.title} fill className="object-cover" />
        </div>
      )}

      {!bare && <h3 className="mt-3 break-words font-display text-base font-semibold text-ink">{item.title}</h3>}
      {bodyText && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{bodyText}</p>}

      {item.type === 'todo' && (item.metadata as TodoMetadata)?.dueDate && (
        <DueDateBadge dueDate={(item.metadata as TodoMetadata).dueDate!} />
      )}

      {/* Each row is a <label>, so tapping the text toggles it too, and the
          row is 44px tall on phones (Apple's minimum comfortable touch target). */}
      {item.type === 'todo' && lines.length > 0 && (
        <ul className="mt-2">
          {lines.map((line) => (
            <li key={line.id}>
              <label className="-mx-2 flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-2 md:min-h-[32px] md:gap-2">
                <input
                  type="checkbox"
                  checked={line.done}
                  onChange={() => handleToggleChecklistItem(line.id)}
                  className="h-5 w-5 shrink-0 accent-teal md:h-4 md:w-4"
                />
                <span className={line.done ? 'text-sm text-muted line-through' : 'text-sm text-ink'}>{line.text}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* Videos that aren't recognized as YouTube fall back to a plain link,
          same as the Link type, so an unsupported platform's URL still works. */}
      {/* Videos that aren't recognized as YouTube fall back to a plain link,
          same as the Link type, so an unsupported platform's URL still works.
          Location items get their own block below instead of a raw link. */}
      {item.url && item.type !== 'location' && (item.type !== 'video' || !videoMeta?.videoId) && (
        <a href={item.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-teal underline">
          {linkMeta?.domain ?? item.url}
        </a>
      )}

      {/* Location: no API, no fetch — just an embedded mini map built from
          the coordinates already stored in metadata, plus a real link out
          to the original Google Maps page for anything not shown here. */}
      {item.type === 'location' &&
        (() => {
          const loc = item.metadata as LocationMetadata;
          return (
            <div className="mt-2 space-y-2">
              {loc.lat != null && loc.lng != null && (
                <div className="h-40 w-full overflow-hidden rounded-lg">
                  <iframe src={buildEmbedUrl(loc.lat, loc.lng)} className="h-full w-full border-0" loading="lazy" />
                </div>
              )}
              <a href={loc.mapsUrl} target="_blank" rel="noreferrer" className="block text-xs font-medium text-teal underline">
                Open in Google Maps
              </a>
            </div>
          );
        })()}

      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-teal/10 px-2 py-0.5 text-xs text-teal">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        Added by {item.createdByName} · {timeAgo(item.createdAt)}
      </p>

      <EditItemDialog item={item} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function DueDateBadge({ dueDate }: { dueDate: string }) {
  const urgency = getDueDateUrgency(dueDate);
  const styles = {
    overdue: 'border-coral/40 bg-coral/10 text-coral',
    soon: 'border-amber-300 bg-amber-100 text-amber-700',
    normal: 'border-border bg-muted/10 text-muted'
  }[urgency];
  const label = urgency === 'overdue' ? 'Overdue' : urgency === 'soon' ? 'Due soon' : 'Due';

  return (
    <span className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${styles}`}>
      <Clock size={12} /> {label} · {formatDueDate(dueDate)}
    </span>
  );
}