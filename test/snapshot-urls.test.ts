import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { absolutize } from "../src/lib/snapshot-urls.ts";

const origin = "https://plavanilaviabrno.cz";

describe("absolutize", () => {
  it("rewrites the first srcset candidate as well as the later ones", () => {
    const html = `<img src="/photo.jpg" srcset="/a.jpg 1x, /b.jpg 2x">`;
    const out = absolutize(html, origin);
    assert.match(out, /src="https:\/\/plavanilaviabrno\.cz\/photo\.jpg"/);
    assert.match(out, /srcset="https:\/\/plavanilaviabrno\.cz\/a\.jpg 1x, https:\/\/plavanilaviabrno\.cz\/b\.jpg 2x"/);
  });

  it("rewrites stylesheet urls and form actions", () => {
    const html = `<link href="/app.css"><form action="/save"><div style="background:url(/bg.png)"></div>`;
    const out = absolutize(html, origin);
    assert.match(out, /href="https:\/\/plavanilaviabrno\.cz\/app\.css"/);
    assert.match(out, /action="https:\/\/plavanilaviabrno\.cz\/save"/);
    assert.match(out, /url\(https:\/\/plavanilaviabrno\.cz\/bg\.png\)/);
  });

  it("leaves absolute and protocol-relative urls alone", () => {
    const html = `<img src="https://cdn.example/a.jpg" srcset="//cdn.example/a.jpg 1x, https://cdn.example/b.jpg 2x">`;
    assert.equal(absolutize(html, origin), html);
  });

  it("does not stack a second origin onto a link that is already rooted", () => {
    const html = `<a href="${origin}/season">Season</a>`;
    assert.equal(absolutize(html, origin), html);
  });
});
