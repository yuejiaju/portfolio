import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
const mediaBase = (process.env.MEDIA_BASE_URL || "/media")
  .trim()
  .replace(/\/+$/, "");

if (!/^(https?:\/\/|\/)/i.test(mediaBase)) {
  throw new Error(
    "MEDIA_BASE_URL must be an absolute URL or a root-relative path such as /media."
  );
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

function skipAsset(source) {
  const name = path.basename(source);
  return !name.startsWith(".") && !/\.(mp4|mov)$/i.test(name);
}

fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), {
  recursive: true,
  filter: skipAsset,
});

for (const file of [
  "styles.css",
  "script.js",
  "robots.txt",
  "_headers",
  "_worker.js",
  "_routes.json"
]) {
  const source = path.join(root, file);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, path.join(dist, file));
  }
}

let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
let rewritten = 0;

html = html.replace(
  /assets\/(videos|game-ads|product-ads)\/([A-Za-z0-9._-]+\.mp4)/g,
  (_match, _folder, file) => {
    rewritten += 1;
    return `${mediaBase}/${file}`;
  }
);

if (!rewritten) {
  throw new Error("No video paths were rewritten. Check the index.html media paths.");
}

if (/assets\/(videos|game-ads|product-ads)\/[^"']+\.mp4/.test(html)) {
  throw new Error("Some .mp4 paths still point to local assets after the build rewrite.");
}

fs.writeFileSync(path.join(dist, "index.html"), html, "utf8");

console.log(`Built ${dist}`);
console.log(`Rewrote ${rewritten} video references to ${mediaBase}`);
console.log("Large video files were not copied into dist; upload them to the GitHub release separately.");
