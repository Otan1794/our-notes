/**
 * Builds a keyless embeddable map URL from coordinates, using the same
 * `pb=` parameter format Google's own "Share → Embed a map" feature
 * generates (not the deprecated `output=embed` trick, which several
 * sources report no longer works). This is still an unofficial, undocumented
 * format — if Google changes it, this is the one function to fix; nothing
 * else in the app depends on its internals. Pure computation, no fetch, so
 * it doesn't need to be a server action and can run in either environment.
 */
export function buildEmbedUrl(lat: number, lng: number): string {
  const zoomDistance = 2000; // smaller = more zoomed in; ~2000 gives a close street-level view
  const ts = Date.now();
  return (
    'https://www.google.com/maps/embed?pb=' +
    `!1m18!1m12!1m3!1d${zoomDistance}!2d${lng}!3d${lat}` +
    '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0!2s' +
    `!5e0!3m2!1sen!2sen!4v${ts}!5m2!1sen!2sen`
  );
}
