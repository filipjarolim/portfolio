import { folioHeaders } from "@/lib/folio-headers";

export type PerimeterRow = {
  name: string;
  value: string;
  note: string;
};

export type PerimeterReading = {
  id: string;
  label: string;
  url: string;
  rows: PerimeterRow[];
  error: string | null;
};

const watched: { key: string; name: string; note: string }[] = [
  {
    key: "strict-transport-security",
    name: "HTTPS",
    note: "Tells the browser to stay on HTTPS.",
  },
  {
    key: "x-frame-options",
    name: "Framing",
    note: "Says who may place the page inside a frame.",
  },
  {
    key: "x-content-type-options",
    name: "Content type",
    note: "Tells the browser to trust the declared file type.",
  },
  {
    key: "referrer-policy",
    name: "Referrer",
    note: "Limits how much of the address leaves with the next request.",
  },
  {
    key: "permissions-policy",
    name: "Permissions",
    note: "Names the device features the page may ask for.",
  },
  {
    key: "content-security-policy",
    name: "Content policy",
    note: "Names where scripts, frames, and images may come from.",
  },
];

function clip(value: string) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > 180 ? `${clean.slice(0, 177)}…` : clean;
}

function rowsFrom(headers: Headers): PerimeterRow[] {
  return watched.map((item) => {
    const value = headers.get(item.key);
    return {
      name: item.name,
      value: value ? clip(value) : "Not set",
      note: item.note,
    };
  });
}

function folioReading(): PerimeterReading {
  const headers = new Headers(folioHeaders.map((item) => [item.key, item.value]));
  return {
    id: "folio",
    label: "This site",
    url: "/",
    rows: rowsFrom(headers),
    error: null,
  };
}

export async function perimeterReadings(): Promise<PerimeterReading[]> {
  return [folioReading()];
}
