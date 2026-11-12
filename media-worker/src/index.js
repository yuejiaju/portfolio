const RELEASE_BASE =
  "https://github.com/yuejiaju/portfolio/releases/download/media-v1";

const VIDEO_FILES = new Set([
  "short-drama-01-original.mp4",
  "short-drama-02-original.mp4",
  "short-drama-03-original.mp4",
  "short-drama-04-original.mp4",
  "short-drama-05-original.mp4",
  "short-drama-06-original.mp4",
  "game-ad-01.mp4",
  "game-ad-02.mp4",
  "game-ad-03.mp4",
  "renovation-01.mp4",
  "renovation-02.mp4",
  "renovation-03.mp4",
  "cleaning-01.mp4",
  "cleaning-02.mp4",
  "cleaning-03.mp4"
]);

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range",
    "Access-Control-Expose-Headers":
      "Accept-Ranges, Content-Length, Content-Range, Content-Type"
  };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);
    const file = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    if (!VIDEO_FILES.has(file)) {
      return new Response("Not found", {
        status: 404,
        headers: corsHeaders()
      });
    }

    const upstreamHeaders = new Headers();
    const range = request.headers.get("Range");
    if (range) upstreamHeaders.set("Range", range);
    upstreamHeaders.set("Accept", "video/mp4,video/*;q=0.9,*/*;q=0.8");

    const upstream = await fetch(`${RELEASE_BASE}/${encodeURIComponent(file)}`, {
      method: request.method,
      headers: upstreamHeaders,
      redirect: "follow"
    });

    const headers = new Headers(corsHeaders());
    headers.set("Content-Type", "video/mp4");
    headers.set("Content-Disposition", "inline");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=86400");

    for (const key of ["Content-Length", "Content-Range", "Last-Modified", "ETag"]) {
      const value = upstream.headers.get(key);
      if (value) headers.set(key, value);
    }

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Video unavailable", {
        status: upstream.status === 404 ? 404 : 502,
        headers: corsHeaders()
      });
    }

    return new Response(request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers
    });
  }
};
