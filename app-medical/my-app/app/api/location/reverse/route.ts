import { NextResponse } from 'next/server';

function toNumber(value: string | null): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildShortName(payload: unknown): string {
  const safePayload = (payload && typeof payload === 'object' ? payload : {}) as {
    address?: Record<string, string>;
    display_name?: string;
  };
  const address = safePayload.address || {};
  const primary =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.suburb ||
    address.county ||
    '';
  const secondary = address.state_district || address.state || '';

  if (primary && secondary && primary !== secondary) {
    return `${primary}, ${secondary}`;
  }
  if (primary) return primary;
  if (secondary) return secondary;

  const displayName = String(safePayload.display_name || '').trim();
  if (!displayName) return '';
  return displayName.split(',').slice(0, 2).join(',').trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = toNumber(searchParams.get('lat'));
    const lng = toNumber(searchParams.get('lng'));

    if (lat === null || lng === null) {
      return NextResponse.json({ error: 'lat and lng are required.' }, { status: 400 });
    }

    const upstream = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        String(lat)
      )}&lon=${encodeURIComponent(String(lng))}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'NorthBengalMediSathi/1.0',
        },
        cache: 'force-cache',
      }
    );

    if (!upstream.ok) {
      return NextResponse.json({ shortName: '' }, { status: 200 });
    }

    const data = await upstream.json();
    const shortName = buildShortName(data);
    return NextResponse.json({ shortName }, { status: 200 });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return NextResponse.json({ shortName: '' }, { status: 200 });
  }
}
