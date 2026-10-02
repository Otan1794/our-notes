export type VideoProvider = 'youtube' | 'instagram' | 'facebook';
export type VideoAspect = 'horizontal' | 'vertical';

export interface ParsedVideo {
  provider: VideoProvider;
  videoId: string;
  embedUrl: string;
  thumbnailUrl?: string;
  aspect: VideoAspect;
}

/**
 * Adding another provider later: add its pattern(s) and an embed URL
 * builder below, following this same shape. Nothing in AddItemDialog,
 * EditItemDialog, or ItemCard needs to change — they only read the
 * returned provider/videoId/embedUrl/thumbnailUrl/aspect.
 */
export function parseVideoUrl(url: string): ParsedVideo | null {
  // YouTube Shorts — vertical. Checked before the general YouTube patterns
  // below since a Shorts URL would otherwise still match the /watch? style
  // pattern's video-ID group in some redirect forms.
  let match = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
  if (match) {
    const videoId = match[1];
    return {
      provider: 'youtube',
      videoId,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      aspect: 'vertical'
    };
  }

  // Standard YouTube (watch/youtu.be/embed links) — horizontal.
  const youtubeHorizontalPatterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/
  ];
  for (const pattern of youtubeHorizontalPatterns) {
    match = url.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        provider: 'youtube',
        videoId,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        aspect: 'horizontal'
      };
    }
  }

  // Instagram Reels — vertical. No public thumbnail endpoint like YouTube's
  // exists, so thumbnailUrl is left unset; ItemCard shows a placeholder
  // until the embed is played. Note: Instagram's embed can still show a
  // "log in to see more" prompt for some public posts — this is Meta's
  // embed behavior, not something fixable on this end.
  match = url.match(/instagram\.com\/reels?\/([\w-]+)/);
  if (match) {
    const videoId = match[1];
    return {
      provider: 'instagram',
      videoId,
      embedUrl: `https://www.instagram.com/reel/${videoId}/embed`,
      aspect: 'vertical'
    };
  }

  // Facebook Reels — vertical, via Facebook's public video plugin iframe.
  // Same caveat as Instagram: reliable for public posts, not guaranteed
  // for anything with restricted visibility.
  match = url.match(/facebook\.com\/reel\/(\d+)/);
  if (match) {
    return {
      provider: 'facebook',
      videoId: match[1],
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
      aspect: 'vertical'
    };
  }

  return null;
}