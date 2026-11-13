const root = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let name = specifier.slice(2);
    if (!/\.[a-z]+$/i.test(name)) name += ".ts";
    return nextResolve(new URL(name, root).href, context);
  }
  return nextResolve(specifier, context);
}
