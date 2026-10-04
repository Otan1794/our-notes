'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ITEM_TYPE_REGISTRY } from './registry';
import { ChecklistEditor } from './ChecklistEditor';
import { parseVideoUrl } from '@/lib/video';
import { resolveMapsLink, type ParsedMapsLocation } from '@/services/maps';
import { buildEmbedUrl } from '@/lib/maps-embed';
import type { ChecklistItem, ItemType } from '@/types/item';
import { createItem } from '@/services/items';

const URL_PATTERN = /^https?:\/\//i;
const MAPS_LINK_PATTERN = /(?:maps\.app\.goo\.gl|goo\.gl\/maps|google\.[a-z.]+\/maps)/i;

export function AddItemDialog({ workspaceId, categories }: { workspaceId: string; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Location (keyless — paste a Google Maps link and resolve it)
  const [mapsLinkInput, setMapsLinkInput] = useState('');
  const [resolvedLocation, setResolvedLocation] = useState<ParsedMapsLocation | null>(null);
  const [resolvingLink, setResolvingLink] = useState(false);
  const [resolveError, setResolveError] = useState(false);

  useEffect(() => {
    if (selectedType !== 'location' || !mapsLinkInput.trim()) {
      setResolvedLocation(null);
      return;
    }
    const handle = setTimeout(async () => {
      setResolvingLink(true);
      setResolveError(false);
      try {
        const result = await resolveMapsLink(mapsLinkInput.trim());
        if (result) {
          setResolvedLocation(result);
          setTitle(result.name);
        } else {
          setResolvedLocation(null);
          setResolveError(true);
        }
      } catch {
        setResolvedLocation(null);
        setResolveError(true);
      } finally {
        setResolvingLink(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [mapsLinkInput, selectedType]);

  async function quickSave() {
    if (!quickText.trim()) return;
    setSaving(true);
    const trimmed = quickText.trim();
    const isUrl = URL_PATTERN.test(trimmed);

    // A Google Maps link (short or full) gets resolved and saved as a
    // Location, same as manually picking that type — checked before the
    // video check since a maps.google.com URL would never match a video
    // pattern anyway, but ordering here keeps the intent explicit.
    if (isUrl && MAPS_LINK_PATTERN.test(trimmed)) {
      const resolved = await resolveMapsLink(trimmed);
      if (resolved) {
        await createItem({
          workspaceId,
          categoryId: categoryId || null,
          type: 'location',
          title: resolved.name,
          url: resolved.mapsUrl,
          metadata: { lat: resolved.lat, lng: resolved.lng, mapsUrl: resolved.mapsUrl }
        });
        router.refresh();
        reset();
        return;
      }
      // Resolution failed (e.g. link format Google changed, or a network
      // hiccup) — fall through and save it as a plain link rather than
      // losing what was pasted.
    }

    const videoInfo = parseVideoUrl(trimmed);
    await createItem({
      workspaceId,
      categoryId: categoryId || null,
      type: videoInfo ? 'video' : isUrl ? 'link' : 'note',
      title: isUrl ? trimmed : trimmed.slice(0, 80),
      content: isUrl ? undefined : trimmed,
      url: isUrl ? trimmed : undefined,
      metadata: videoInfo ?? undefined
    });
    // revalidatePath (in createItem) only invalidates the cache — it doesn't
    // push new data to a page already mounted in the browser. router.refresh()
    // re-runs the current route's server components against the fresh data.
    router.refresh();
    reset();
  }

  async function fullSave() {
    if (!selectedType || !title.trim()) return;
    if (selectedType === 'location' && !resolvedLocation) return;
    setSaving(true);
    await createItem({
      workspaceId,
      categoryId: categoryId || null,
      type: selectedType,
      title: title.trim(),
      content: selectedType === 'note' ? body : undefined,
      url:
        selectedType === 'link' || selectedType === 'video'
          ? body
          : selectedType === 'location' && resolvedLocation
            ? resolvedLocation.mapsUrl
            : undefined,
      description:
        selectedType !== 'note' && selectedType !== 'todo' && selectedType !== 'video' && selectedType !== 'location'
          ? body
          : undefined,
      metadata:
        selectedType === 'todo'
          ? { checklist, dueDate: dueDate || undefined }
          : selectedType === 'video'
            ? parseVideoUrl(body) ?? {}
            : selectedType === 'location' && resolvedLocation
              ? { lat: resolvedLocation.lat, lng: resolvedLocation.lng, mapsUrl: resolvedLocation.mapsUrl }
              : undefined
    });
    router.refresh();
    reset();
  }

  function reset() {
    setSaving(false);
    setOpen(false);
    setQuickText('');
    setSelectedType(null);
    setTitle('');
    setBody('');
    setChecklist([]);
    setDueDate('');
    setCategoryId('');
    setMapsLinkInput('');
    setResolvedLocation(null);
    setResolveError(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-lg bg-teal px-4 py-2 text-sm md:flex-none font-medium text-teal-foreground hover:opacity-90">
          <Plus size={16} /> Add Item
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="font-display text-lg font-semibold">Add something</DialogTitle>

        {!selectedType ? (
          <div className="mt-4 space-y-4">
            <div>
              <textarea
                autoFocus
                placeholder="Paste a link, or jot a quick note…"
                value={quickText}
                onChange={(e) => setQuickText(e.target.value)}
                className="h-20 w-full resize-none rounded-lg border border-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-teal"
              />
              <button
                onClick={quickSave}
                disabled={saving || !quickText.trim()}
                className="mt-2 w-full rounded-lg bg-teal px-3 py-2 text-sm font-medium text-teal-foreground disabled:opacity-50"
              >
                Save
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted">
              <div className="h-px flex-1 bg-border" /> or choose a type <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ITEM_TYPE_REGISTRY) as ItemType[]).map((type) => {
                const { label, icon: Icon } = ITEM_TYPE_REGISTRY[type];
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border p-3 text-xs hover:border-teal hover:text-teal"
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {selectedType === 'location' ? (
              <div className="space-y-2">
                <input
                  autoFocus
                  placeholder="Paste a Google Maps link…"
                  value={mapsLinkInput}
                  onChange={(e) => setMapsLinkInput(e.target.value)}
                  className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
                />
                {resolvingLink && <p className="text-xs text-muted">Looking up the link…</p>}
                {resolveError && (
                  <p className="text-xs text-coral">
                    Couldn&rsquo;t read a location from that link. Try copying the link again from Google Maps&rsquo;s
                    Share button.
                  </p>
                )}
                {resolvedLocation && (
                  <div className="space-y-2 rounded-lg border border-border p-2">
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
                    />
                    {resolvedLocation.lat != null && resolvedLocation.lng != null && (
                      <div className="h-32 w-full overflow-hidden rounded-lg">
                        <iframe
                          src={buildEmbedUrl(resolvedLocation.lat, resolvedLocation.lng)}
                          className="h-full w-full border-0"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal"
              />
            )}

            {selectedType === 'location' ? null : selectedType === 'todo' ? (
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
            ) : (
              <textarea
                placeholder={
                  selectedType === 'link'
                    ? 'URL'
                    : selectedType === 'video'
                      ? 'YouTube, Instagram Reel, or Facebook Reel URL'
                      : 'Details'
                }
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
            <div className="flex gap-2">
              <button onClick={() => setSelectedType(null)} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm">
                Back
              </button>
              <button
                onClick={fullSave}
                disabled={saving || !title.trim() || (selectedType === 'location' && !resolvedLocation)}
                className="flex-1 rounded-lg bg-teal px-3 py-2 text-sm font-medium text-teal-foreground disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}