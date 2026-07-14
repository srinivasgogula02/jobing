const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#C6F24E"/><path d="M37 12h11v28c0 10-6 15-16 15-8 0-14-4-16-11l11-4c1 3 3 5 6 5s4-2 4-6V12Z" fill="#0E1219"/></svg>`;

export function GET() {
  return new Response(ICON, {
    headers: {
      "cache-control": "public, max-age=86400, immutable",
      "content-type": "image/svg+xml; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
