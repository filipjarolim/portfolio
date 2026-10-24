import { decode } from "jpeg-js";
import { cacheLife, cacheTag } from "next/cache";
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

/** True when both files are the same profile picture, whatever their size. */
function samePicture(leftBytes: Uint8Array, rightBytes: Uint8Array) {
  const left = decodeImage(leftBytes);
  const right = decodeImage(rightBytes);
  if (!left || !right) return false;
  const score = correlation(
    normalized(left, 0, 0, left.width, left.height),
    normalized(right, 0, 0, right.width, right.height),
  );
  return score >= 0.72;
}

function largerPicture(leftBytes: Uint8Array, rightBytes: Uint8Array) {
  const left = decodeImage(leftBytes);
  const right = decodeImage(rightBytes);
  if (!left || !right) return leftBytes;
  return left.width * left.height >= right.width * right.height ? leftBytes : rightBytes;
}

async function fetchImage(url: string, referer?: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
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
    cache: "no-store",
    redirect: "follow",
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
  return fetchImage(`https://github.com/${githubUser}.png?size=800`);
}

async function fallbackPortrait(): Promise<PortraitImage> {
  const bytes = await readFile(path.join(process.cwd(), "public/portrait.jpg"));
  return pack(new Uint8Array(bytes));
}

/**
 * The photo is the live profile picture.
 * LinkedIn wins when the two accounts show different pictures.
 * When they show the same one, the larger file is used.
 */
export async function getPortraitImage(): Promise<PortraitImage> {
  "use cache";
  cacheLife("minutes");
  cacheTag("portrait");

  try {
    const [linkedin, github] = await Promise.all([linkedinPortrait(), githubPortrait()]);

    if (linkedin && github) {
      return pack(samePicture(linkedin, github) ? largerPicture(linkedin, github) : linkedin);
    }
    if (linkedin) return pack(linkedin);
    if (github) return pack(github);
  } catch {
    // The saved file is the last picture that could be fetched.
  }
  return fallbackPortrait();
}
