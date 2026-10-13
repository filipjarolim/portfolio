import { decode, encode } from "jpeg-js";
import { cacheLife } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { githubUser, links } from "@/content/selection";

export type PortraitImage = {
  base64: string;
  contentType: string;
};

function pack(bytes: Uint8Array, contentType = "image/jpeg"): PortraitImage {
  return { base64: Buffer.from(bytes).toString("base64"), contentType };
}

type Decoded = { data: Uint8Array; width: number; height: number };

function decodeImage(bytes: Uint8Array): Decoded | null {
  try {
    const image = decode(bytes, {
      useTArray: true,
      tolerantDecoding: true,
      maxResolutionInMP: 5,
    });
    if (!image.width || !image.height) return null;
    return { data: image.data, width: image.width, height: image.height };
  } catch {
    return null;
  }
}

function normalized(image: Decoded, x0: number, y0: number, x1: number, y1: number) {
  const samples = new Float64Array(24 * 24);
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const px = Math.min(image.width - 1, Math.floor(x0 + ((x + 0.5) * (x1 - x0)) / 24));
      const py = Math.min(image.height - 1, Math.floor(y0 + ((y + 0.5) * (y1 - y0)) / 24));
      const index = (py * image.width + px) * 4;
      samples[y * 24 + x] =
        image.data[index] * 0.299 +
        image.data[index + 1] * 0.587 +
        image.data[index + 2] * 0.114;
    }
  }
  let mean = 0;
  for (const value of samples) mean += value;
  mean /= samples.length;
  let energy = 0;
  for (let index = 0; index < samples.length; index++) {
    samples[index] -= mean;
    energy += samples[index] * samples[index];
  }
  return { samples, norm: Math.sqrt(energy) || 1 };
}

function correlation(
  left: { samples: Float64Array; norm: number },
  right: { samples: Float64Array; norm: number },
) {
  let score = 0;
  for (let index = 0; index < left.samples.length; index++) {
    score += left.samples[index] * right.samples[index];
  }
  return score / (left.norm * right.norm);
}

/**
 * LinkedIn publishes a crop. When GitHub still has that same picture at a
 * higher resolution, return the matching region instead of the small file.
 */
function sharperCopy(linkedinBytes: Uint8Array, githubBytes: Uint8Array): Uint8Array | null {
  const linkedin = decodeImage(linkedinBytes);
  const github = decodeImage(githubBytes);
  if (!linkedin || !github || github.width <= linkedin.width) return null;

  const target = normalized(linkedin, 0, 0, linkedin.width, linkedin.height);
  let best = { score: -1, scale: 1, ox: 0, oy: 0 };

  const consider = (scale: number, ox: number, oy: number) => {
    const width = github.width * scale;
    const height = github.height * scale;
    const score = correlation(
      target,
      normalized(
        github,
        ox * github.width,
        oy * github.height,
        ox * github.width + width,
        oy * github.height + height,
      ),
    );
    if (score > best.score) best = { score, scale, ox, oy };
  };

  for (let scale = 0.55; scale <= 1.001; scale += 0.1) {
    for (let oy = 0; oy <= 1 - scale + 0.001; oy += 0.1) {
      for (let ox = 0; ox <= 1 - scale + 0.001; ox += 0.1) consider(scale, ox, oy);
    }
  }
  const scaleMin = Math.max(0.5, best.scale - 0.1);
  const scaleMax = Math.min(1, best.scale + 0.1);
  for (let scale = scaleMin; scale <= scaleMax + 0.001; scale += 0.02) {
    const oyMin = Math.max(0, best.oy - 0.1);
    const oyMax = Math.min(1 - scale, best.oy + 0.1);
    for (let oy = oyMin; oy <= oyMax + 0.001; oy += 0.02) {
      const oxMin = Math.max(0, best.ox - 0.1);
      const oxMax = Math.min(1 - scale, best.ox + 0.1);
      for (let ox = oxMin; ox <= oxMax + 0.001; ox += 0.02) consider(scale, ox, oy);
    }
  }

  if (best.score < 0.75) return null;
  if (best.scale >= 0.96) return githubBytes;

  const size = Math.max(1, Math.round(Math.min(github.width, github.height) * best.scale));
  const x = Math.min(github.width - size, Math.max(0, Math.round(best.ox * github.width)));
  const y = Math.min(github.height - size, Math.max(0, Math.round(best.oy * github.height)));
  const pixels = new Uint8Array(size * size * 4);
  for (let row = 0; row < size; row++) {
    const start = ((y + row) * github.width + x) * 4;
    pixels.set(github.data.subarray(start, start + size * 4), row * size * 4);
  }
  return new Uint8Array(encode({ data: pixels, width: size, height: size }, 92).data);
}

async function fetchImage(url: string, referer?: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "image/jpeg,image/*",
        "User-Agent": "Mozilla/5.0",
        ...(referer ? { Referer: referer } : {}),
      },
    });
    if (!response.ok) return null;
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return null;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function linkedinPortrait(): Promise<Uint8Array | null> {
  const response = await fetch(links.linkedin, {
    headers: {
      Accept: "text/html",
      "User-Agent": "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    },
  });
  if (!response.ok) return null;
  const html = await response.text();
  const match = html.match(/property="og:image" content="([^"]+)"/);
  if (!match) return null;
  const url = match[1].replaceAll("&amp;", "&");
  if (!url.startsWith("https://media.licdn.com/") || !url.includes("profile-displayphoto")) {
    return null;
  }

  const sizes = ["scale_800_800", "shrink_800_800", "scale_400_400", "shrink_400_400"];
  let best: { bytes: Uint8Array; width: number } | null = null;
  const originals = [url, ...sizes.map((size) => url.replace(/profile-displayphoto-(?:scale|shrink)_\d+_\d+/, `profile-displayphoto-${size}`))];
  for (const candidate of originals) {
    const bytes = await fetchImage(candidate, "https://www.linkedin.com/");
    const image = bytes ? decodeImage(bytes) : null;
    if (!bytes || !image) continue;
    if (!best || image.width > best.width) best = { bytes, width: image.width };
  }
  return best?.bytes ?? null;
}

async function githubPortrait(): Promise<Uint8Array | null> {
  const response = await fetch(`https://api.github.com/users/${githubUser}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "filip-folio",
    },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { avatar_url?: string };
  if (!data.avatar_url) return null;
  const avatar = new URL(data.avatar_url);
  avatar.searchParams.set("s", "800");
  return fetchImage(avatar.toString());
}

async function fallbackPortrait(): Promise<PortraitImage> {
  const bytes = await readFile(path.join(process.cwd(), "public/portrait.jpg"));
  return pack(new Uint8Array(bytes));
}

/**
 * LinkedIn is the photo that should change when the profile picture changes.
 * GitHub currently hosts the same picture at a higher resolution, so that file
 * is used only while the two pictures still match.
 */
export async function getPortraitImage(): Promise<PortraitImage> {
  "use cache";
  cacheLife("minutes");

  try {
    const [linkedin, github] = await Promise.all([linkedinPortrait(), githubPortrait()]);

    if (linkedin && github) {
      const sharp = sharperCopy(linkedin, github);
      if (sharp) return pack(sharp);
      return pack(linkedin);
    }
    if (linkedin) return pack(linkedin);
    if (github) return pack(github);
  } catch {
    // The saved file is the same portrait.
  }
  return fallbackPortrait();
}
