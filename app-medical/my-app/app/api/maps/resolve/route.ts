import { NextResponse } from 'next/server';
import { parseLatLngFromMapsUrl } from '@/lib/chamber';

export const dynamic = 'force-dynamic';

// Only Google Maps hosts are ever fetched, so this endpoint can't be used to probe other servers.
const GOOGLE_HOST_RE = /^(?:[a-z0-9-]+\.)*(?:google\.com|google\.co\.in|goo\.gl|g\.co)$/i;
const MAX_REDIRECTS = 6;

function toGoogleUrl(value: string, base?: string): URL | null {
  try {
    const url = new URL(value, base);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!GOOGLE_HOST_RE.test(url.hostname)) return null;
    url.protocol = 'https:';
    return url;
  } catch {
    return null;
  }
}

const notFound = () =>
  NextResponse.json(
    { error: "Couldn't read the location from this link. Use the \"Use my current GPS location\" button while at the chamber." },
    { status: 422 }
  );

// POST { url } → { lat, lng, resolvedUrl } | 422 when the link carries no coordinates.
// No Google API is used: short links (maps.app.goo.gl) are expanded by following their redirects,
// and coordinates are read from the expanded URL. The page HTML is deliberately NOT parsed — without
// JavaScript it only contains a viewport guessed from the server's IP, which would pin the wrong place.
export async function POST(req: Request) {
  try {
    const { url } = await req.json().catch(() => ({}));
    const input = typeof url === 'string' ? url.trim() : '';
    if (!input) return NextResponse.json({ error: 'Paste a Google Maps link.' }, { status: 400 });

    const direct = parseLatLngFromMapsUrl(input);
    if (direct) return NextResponse.json({ ...direct, resolvedUrl: input });

    const start = toGoogleUrl(input);
    if (!start) return NextResponse.json({ error: 'Only Google Maps links are supported.' }, { status: 400 });
    let current: URL = start;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept-Language': 'en-IN,en;q=0.9',
    };

    for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
      const res: Response = await fetch(current, { redirect: 'manual', headers, signal: AbortSignal.timeout(8000), cache: 'no-store' });
      res.body?.cancel().catch(() => {});

      if (res.status < 300 || res.status >= 400) break;
      const location: string | null = res.headers.get('location');
      const next: URL | null = location ? toGoogleUrl(location, current.toString()) : null;
      if (!next) break;

      const coords = parseLatLngFromMapsUrl(next.toString());
      if (coords) return NextResponse.json({ ...coords, resolvedUrl: next.toString() });
      current = next;
    }

    return notFound();
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    const timedOut = name === 'TimeoutError' || name === 'AbortError';
    return NextResponse.json(
      { error: timedOut ? 'Google Maps took too long to respond. Try again or use the GPS button.' : 'Failed to read the map link.' },
      { status: timedOut ? 504 : 500 }
    );
  }
}
