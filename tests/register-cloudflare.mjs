import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "cloudflare:workers") {
      return {
        shortCircuit: true,
        url: "data:text/javascript,export const env = new Proxy({}, { get(_target, key) { return (globalThis.__ONE_CORE_TEST_ENV__ ?? {})[key]; } });",
      };
    }
    if (specifier.startsWith(".") && context.parentURL?.includes("/site/lib/") && !specifier.endsWith(".ts")) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
