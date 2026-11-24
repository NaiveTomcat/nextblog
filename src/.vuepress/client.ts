import { defineClientConfig } from "vuepress/client";

export default defineClientConfig({
  enhance({ app, router }) {
    if (typeof window === "undefined") return;

    // Workaround for vuepress@2.0.0-rc.32 ScrollRestoration + @vuepress/plugin-active-header-links:
    // active-header-links updates the URL hash on scroll by temporarily clearing
    // router.options.scrollBehavior around router.replace(), which does not suppress
    // vue-router's experimental ScrollRestoration plugin triggered by route.fullPath changes.
    let skipTarget: { path: string; hash: string } | null = null;

    const decodeHash = (hash: string): string => {
      try {
        return decodeURIComponent(hash);
      } catch {
        return hash;
      }
    };

    const origReplace = router.replace.bind(router);
    router.replace = ((to) => {
      const isSilentHashUpdate = router.options.scrollBehavior === undefined;
      const prev = router.currentRoute.value;

      if (isSilentHashUpdate) {
        const resolved = router.resolve(to);
        if (
          resolved.path !== prev.path ||
          decodeHash(resolved.hash) !== decodeHash(prev.hash)
        ) {
          skipTarget = {
            path: resolved.path,
            hash: decodeHash(resolved.hash),
          };
        }
      }

      const result = origReplace(to);

      if (isSilentHashUpdate) {
        result.then((failure) => {
          const cur = router.currentRoute.value;
          if (
            failure ||
            (cur.path === prev.path &&
              decodeHash(cur.hash) === decodeHash(prev.hash))
          ) {
            skipTarget = null;
          }
        });
      }

      return result;
    }) as typeof router.replace;

    const origUse = app.use.bind(app);
    app.use = ((plugin: unknown, ...args: unknown[]) => {
      const opts = args[0] as
        | {
            router?: unknown;
            capture?: (...cArgs: unknown[]) => unknown;
            restore?: (
              entry: unknown,
              to: { path?: string; hash?: string },
            ) => unknown;
          }
        | undefined;

      if (
        opts &&
        typeof opts === "object" &&
        opts.router === router &&
        typeof opts.restore === "function"
      ) {
        const origRestore = opts.restore;
        const origCapture =
          typeof opts.capture === "function" ? opts.capture : null;

        args[0] = {
          ...opts,
          ...(origCapture
            ? {
                capture(...cArgs: unknown[]) {
                  if (skipTarget !== null) return null;
                  return origCapture(...cArgs);
                },
              }
            : {}),
          restore(entry: unknown, to: { path?: string; hash?: string }) {
            if (
              skipTarget !== null &&
              to?.path === skipTarget.path &&
              decodeHash(to.hash ?? "") === skipTarget.hash
            ) {
              skipTarget = null;
              return;
            }
            skipTarget = null;
            return origRestore(entry, to);
          },
        };
        app.use = origUse;
      }

      return origUse(plugin as Parameters<typeof app.use>[0], ...args);
    }) as typeof app.use;
  },
});
