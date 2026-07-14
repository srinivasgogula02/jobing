const ROBOTS = "User-agent: *\nAllow: /\n";

export function GET() {
  return new Response(ROBOTS, {
    headers: {
      "cache-control": "public, max-age=3600",
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}
