'use server';

// No API key, no Google Cloud project, no billing. This works by following
// a pasted Google Maps link's redirect (short links like maps.app.goo.gl
// resolve to a full google.com/maps/place/... URL) and reading the place
// name and coordinates that Google already encodes into that URL's own
// structure — not by calling any Google API.
//
// IMPORTANT CAVEAT: this parses an undocumented, unsupported URL format
// that Google could change at any time without notice — unlike the Places
// API, there's no stability guarantee here. If it stops matching, the
// regexes below are the first thing to check and update.

export interface ParsedMapsLocation {
  name: string;
  lat?: number;
  lng?: number;
  mapsUrl: string;
}

export async function resolveMapsLink(inputUrl: string): Promise<ParsedMapsLocation | null> {
  let finalUrl = inputUrl;
  try {
    const res = await fetch(inputUrl, { redirect: 'follow' });
    finalUrl = res.url || inputUrl;
  } catch {
    return null;
  }

  const nameMatch = finalUrl.match(/\/maps\/place\/([^/@]+)/);
  const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (!nameMatch && !coordMatch) return null;

  const name = nameMatch ? decodeURIComponent(nameMatch[1].replace(/\+/g, ' ')) : 'Saved location';

  return {
    name,
    lat: coordMatch ? parseFloat(coordMatch[1]) : undefined,
    lng: coordMatch ? parseFloat(coordMatch[2]) : undefined,
    mapsUrl: finalUrl
  };
}
