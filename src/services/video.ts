'use server';

import { parseVideoUrl, type ParsedVideo } from '@/lib/video';

// Only these hosts are ever fetched. Without this check, a server action that
// fetches whatever URL it is given could be used to make your server request
// arbitrary addresses.
const ALLOWED_HOSTS = /^(?:(?:www|m|web|l)\.)?(?:facebook\.com|fb\.watch|fb\.com|instagram\.com)$/i;

// Only links that hide the video ID behind a redirect need resolving:
//   facebook.com/share/r/XXXX, facebook.com/share/v/XXXX, fb.watch/XXXX,
//   instagram.com/share/reel/XXXX
function isShareLink(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host.endsWith('fb.watch')) return true;
  return url.pathname.startsWith('/share/');
}

// Pulls a reel URL out of text (used on the page body if the redirect
// itself didn't land on a /reel/ URL).
const REEL_URL_IN_TEXT = /https?:\/\/(?:www\.)?(?:facebook\.com\/reel\/\d+|instagram\.com\/(?:[\w.]+\/)?reels?\/[\w-]+)/;

/**
 * Turns a pasted video link into embed info. Handles everything parseVideoUrl
 * handles, plus Facebook/Instagram share links, by following the redirect to
 * the real reel URL and parsing that.
 *
 * Best effort: Facebook and Instagram can answer a server request with a
 * login page instead of the redirect. In that case this returns null and the
 * item is saved as a normal clickable link, same as before.
 */
export async function resolveVideoUrl(inputUrl: string): Promise<ParsedVideo | null> {
  const direct = parseVideoUrl(inputUrl);
  if (direct) return direct;

  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return null;
  }
  if (!ALLOWED_HOSTS.test(parsed.hostname) || !isShareLink(parsed)) return null;

  try {
    const res = await fetch(inputUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    // 1. The redirect landed on the real reel URL (the usual case).
    const fromFinalUrl = parseVideoUrl(res.url);
    if (fromFinalUrl) return fromFinalUrl;

    // 2. It landed on a login page that carries the real URL in ?next=...
    try {
      const next = new URL(res.url).searchParams.get('next');
      if (next) {
        const fromNext = parseVideoUrl(decodeURIComponent(next));
        if (fromNext) return fromNext;
      }
    } catch {
      // ignore, try the page body next
    }

    // 3. Last resort: look for a reel URL in the page itself.
    const text = (await res.text()).slice(0, 500_000).replace(/\\\//g, '/');
    const found = text.match(REEL_URL_IN_TEXT);
    if (found) return parseVideoUrl(found[0]);
  } catch {
    // network error or timeout: fall back to saving as a plain link
  }

  return null;
}
