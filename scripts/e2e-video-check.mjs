/**
 * Quick E2E check: video info + download at 1080p and 360p.
 * Usage: node scripts/e2e-video-check.mjs [baseUrl]
 */
const baseUrl = process.argv[2] ?? "http://localhost:3000";

const testUrls = [
  "https://www.youtube.com/watch?v=iUtnZpzkbG8",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "https://youtu.be/iUtnZpzkbG8",
];

async function postJson(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return { res, data: await res.json() };
  }
  const buffer = await res.arrayBuffer();
  return { res, buffer };
}

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

let failed = 0;

console.log(`\nE2E video check → ${baseUrl}\n`);

for (const url of testUrls) {
  console.log(`── ${url}`);
  const info = await postJson("/api/video/info", { url });
  if (!info.res.ok || !info.data?.ok) {
    console.log(`  ✗ info ${info.res.status}`, info.data?.error ?? info.data);
    failed += 1;
    continue;
  }
  console.log(`  ✓ info: "${info.data.data.title}" (${info.data.data.availableQualities?.join(", ")})`);

  for (const quality of ["1080p", "360p"]) {
    const dl = await postJson("/api/video/download", { url, format: "mp4", quality });
    if (!dl.res.ok || dl.buffer === undefined) {
      console.log(`  ✗ download ${quality} ${dl.res.status}`, dl.data?.error ?? dl.data);
      failed += 1;
      continue;
    }
    const size = dl.buffer.byteLength;
    const ct = dl.res.headers.get("content-type");
    console.log(`  ✓ download ${quality}: ${mb(size)} MB, ${ct}`);
    if (size < 100_000) {
      console.log(`    ⚠ file suspiciously small`);
      failed += 1;
    }
  }
}

console.log(failed === 0 ? "\nAll checks passed.\n" : `\n${failed} check(s) failed.\n`);
process.exit(failed === 0 ? 0 : 1);
