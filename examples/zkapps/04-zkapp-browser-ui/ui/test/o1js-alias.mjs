// Node module resolution hook: resolve every `o1js` import to the copy in
// ui/node_modules, also when ../contracts/build imports it.
//
// This does in Node what the `o1js` alias in next.config.mjs does in the
// browser bundle. Without it, the compiled contract would use the copy in
// contracts/node_modules, and two o1js instances do not share the active
// Mina instance.

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'o1js') {
    return nextResolve(specifier, { ...context, parentURL: import.meta.url });
  }
  return nextResolve(specifier, context);
}
