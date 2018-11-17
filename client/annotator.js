import { injectAssets, injectConfig, injectLink } from "./inject.js"

export default (doc, config) => {
  const appLinkEl = doc.querySelector('link[type="application/annotator+html"]')
  if (appLinkEl) {
    return
  }

  // Register the URL of the sidebar app which the Hypothesis client should load.
  // The <link> tag is also used by browser extensions etc. to detect the
  // presence of the Hypothesis client on the page.
  const sidebarUrl = injectLink(doc, {
    href: config.sidebarAppUrl,
    rel: "sidebar",
    type: "application/annotator+html"
  })

  // Register the URL of the annotation client which is currently being used to drive
  // annotation interactions.
  const clientUrl = injectLink(doc, {
    rel: "hypothesis-client",
    href: config.assetRoot + "client/annotator.js",
    type: "application/annotator+javascript"
  })

  injectConfig(doc, config)

  injectAssets(doc, config, [
    // Vendor code and polyfills
    "scripts/polyfills.bundle.js",
    "scripts/jquery.bundle.js",

    // Main entry point for the client
    "scripts/annotator.bundle.js",

    "styles/icomoon.css",
    "styles/annotator.css",
    "styles/pdfjs-overrides.css"
  ])
}
