"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { SiteCopy } from "@/lib/site-copy";

type Catalog = { repo: string; stack: string; dates: string | null };

const input = "mt-2 w-full border border-black bg-white px-3 py-2 text-sm";

export function AdminEditor() {
  const [copy, setCopy] = useState<SiteCopy | null>(null);
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [free, setFree] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/content");
    if (response.status === 401) {
      setAuthed(false);
      setCopy(null);
      return;
    }
    const body = (await response.json()) as { free: boolean; copy: SiteCopy; catalog: Catalog[] };
    setFree(body.free);
    setAuthed(true);
    setCopy(body.copy);
    setCatalog(body.catalog);
  }

  useEffect(() => {
    const frame = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(frame);
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password, remember }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not sign in.");
      return;
    }
    setPassword("");
    await load();
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    setAuthed(false);
    setCopy(null);
  }

  async function save() {
    if (!copy) return;
    setBusy(true);
    setError("");
    setStatus("");
    const response = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(copy),
    });
    const body = (await response.json().catch(() => null)) as { detail?: string; error?: string; copy?: SiteCopy } | null;
    setBusy(false);
    if (!response.ok) {
      setError(body?.error ?? "Save failed.");
      return;
    }
    if (body?.copy) setCopy(body.copy);
    setStatus(body?.detail ?? "Saved.");
  }

  function patch(partial: Partial<SiteCopy>) {
    setCopy((current) => (current ? { ...current, ...partial } : current));
  }

  function patchProject(repo: string, partial: Partial<SiteCopy["projects"][string]>) {
    setCopy((current) => {
      if (!current) return current;
      return {
        ...current,
        projects: { ...current.projects, [repo]: { ...current.projects[repo], ...partial } },
      };
    });
  }

  function move(repo: string, dir: -1 | 1) {
    setCopy((current) => {
      if (!current) return current;
      const order = [...current.projectOrder];
      const index = order.indexOf(repo);
      const next = index + dir;
      if (index < 0 || next < 0 || next >= order.length) return current;
      [order[index], order[next]] = [order[next], order[index]];
      return { ...current, projectOrder: order };
    });
  }

  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-24">
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Admin</h1>
        <form className="mt-8" onSubmit={signIn}>
          <label className="block font-mono text-xs tracking-[0.14em] uppercase" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={input}
          />
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            Remember me on this device
          </label>
          {error ? <p className="mt-4 text-sm">{error}</p> : null}
          <button type="submit" disabled={busy} className="mt-6 border border-black px-4 py-3 text-sm font-bold">
            {busy ? "Checking" : "Enter"}
          </button>
        </form>
      </main>
    );
  }

  if (!copy) return <main className="px-4 py-24 font-mono text-xs">Loading</main>;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-24 pb-16 sm:px-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-4xl font-bold tracking-[-0.04em]">Admin</h1>
        <a href="/" className="text-sm font-bold">
          View site
        </a>
      </div>
      <p className="mt-4 max-w-xl text-sm leading-relaxed">
        {free
          ? "This machine can edit without a password. Save writes the copy into the repo and pushes it to GitHub."
          : "Edits are stored in the GitHub repo. There is no database."}
      </p>

      <section className="mt-12 border-t border-black pt-6">
        <h2 className="font-mono text-xs tracking-[0.16em] uppercase">Introduction</h2>
        <label className="mt-6 block text-sm font-bold" htmlFor="headline">
          Headline
        </label>
        <input id="headline" value={copy.headline} onChange={(event) => patch({ headline: event.target.value })} className={input} />
        <label className="mt-6 block text-sm font-bold" htmlFor="intro">
          Introduction
        </label>
        <textarea id="intro" value={copy.intro} rows={5} onChange={(event) => patch({ intro: event.target.value })} className={input} />
        <label className="mt-6 block text-sm font-bold" htmlFor="note">
          Note
        </label>
        <textarea id="note" value={copy.note} rows={3} onChange={(event) => patch({ note: event.target.value })} className={input} />
        <label className="mt-6 block text-sm font-bold" htmlFor="focus">
          Focus, one per line
        </label>
        <textarea
          id="focus"
          value={copy.focus.join("\n")}
          rows={3}
          onChange={(event) => patch({ focus: event.target.value.split("\n") })}
          className={input}
        />
      </section>

      <section className="mt-12 border-t border-black pt-6">
        <h2 className="font-mono text-xs tracking-[0.16em] uppercase">Projects</h2>
        <ol className="mt-6">
          {copy.projectOrder.map((repo, index) => {
            const project = copy.projects[repo];
            const meta = catalog.find((item) => item.repo === repo);
            if (!project) return null;
            return (
              <li key={repo} className="border-t border-black py-6">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-[11px] tracking-[0.14em]">
                    {String(index + 1).padStart(2, "0")} {meta?.stack}
                    {meta?.dates ? ` · ${meta.dates}` : ""}
                  </p>
                  <span className="flex gap-3 text-sm font-bold">
                    <button type="button" onClick={() => move(repo, -1)} disabled={index === 0}>
                      Up
                    </button>
                    <button type="button" onClick={() => move(repo, 1)} disabled={index === copy.projectOrder.length - 1}>
                      Down
                    </button>
                  </span>
                </div>
                <label className="mt-4 block text-sm font-bold" htmlFor={`${repo}-title`}>
                  Title
                </label>
                <input
                  id={`${repo}-title`}
                  value={project.title}
                  onChange={(event) => patchProject(repo, { title: event.target.value })}
                  className={input}
                />
                <label className="mt-4 block text-sm font-bold" htmlFor={`${repo}-intro`}>
                  Introduction
                </label>
                <textarea
                  id={`${repo}-intro`}
                  value={project.intro}
                  rows={4}
                  onChange={(event) => patchProject(repo, { intro: event.target.value })}
                  className={input}
                />
                <label className="mt-4 block text-sm font-bold" htmlFor={`${repo}-summary`}>
                  Short line
                </label>
                <input
                  id={`${repo}-summary`}
                  value={project.summary}
                  onChange={(event) => patchProject(repo, { summary: event.target.value })}
                  className={input}
                />
                <label className="mt-4 block text-sm font-bold" htmlFor={`${repo}-tags`}>
                  Tags, comma separated. Mobile opens on the phone, Web on the laptop.
                </label>
                <input
                  id={`${repo}-tags`}
                  value={project.tags.join(", ")}
                  onChange={(event) => patchProject(repo, { tags: event.target.value.split(",") })}
                  className={input}
                />
                <label className="mt-4 block text-sm font-bold" htmlFor={`${repo}-bullets`}>
                  Points, one per line
                </label>
                <textarea
                  id={`${repo}-bullets`}
                  value={project.bullets.join("\n")}
                  rows={4}
                  onChange={(event) => patchProject(repo, { bullets: event.target.value.split("\n") })}
                  className={input}
                />
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={project.hidden}
                    onChange={(event) => patchProject(repo, { hidden: event.target.checked })}
                  />
                  Hide from the page
                </label>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mt-12 border-t border-black pt-6">
        <h2 className="font-mono text-xs tracking-[0.16em] uppercase">About</h2>
        <label className="mt-6 block text-sm font-bold" htmlFor="practice">
          Coding
        </label>
        <textarea
          id="practice"
          value={copy.practice}
          rows={4}
          onChange={(event) => patch({ practice: event.target.value })}
          className={input}
        />
        <label className="mt-6 block text-sm font-bold" htmlFor="likes">
          I like, one per line
        </label>
        <textarea
          id="likes"
          value={copy.likes.join("\n")}
          rows={4}
          onChange={(event) => patch({ likes: event.target.value.split("\n") })}
          className={input}
        />
        {copy.skills.map((skill, index) => (
          <div key={skill.label} className="mt-4 grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <input
              value={skill.label}
              aria-label={`${skill.label} label`}
              onChange={(event) => {
                const skills = copy.skills.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, label: event.target.value } : item,
                );
                patch({ skills });
              }}
              className={input}
            />
            <input
              value={skill.value}
              aria-label={`${skill.label} value`}
              onChange={(event) => {
                const skills = copy.skills.map((item, itemIndex) =>
                  itemIndex === index ? { ...item, value: event.target.value } : item,
                );
                patch({ skills });
              }}
              className={input}
            />
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 mt-10 flex flex-wrap items-center gap-4 border-t border-black bg-white py-4">
        <button type="button" onClick={() => void save()} disabled={busy} className="border border-black px-4 py-3 text-sm font-bold">
          {busy ? "Saving" : "Save"}
        </button>
        {free ? null : (
          <button type="button" onClick={() => void signOut()} className="text-sm font-bold">
            Sign out
          </button>
        )}
        {status ? <p className="text-sm">{status}</p> : null}
        {error ? <p className="text-sm">{error}</p> : null}
      </div>
    </main>
  );
}
