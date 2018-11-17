import { injectAssets, injectConfig, injectLink } from "./inject.js"

export default (doc, config) => {
  injectConfig(doc, config)

  injectAssets(doc, config, [
    // Vendor code and polyfills required by app.bundle.js
    "scripts/raven.bundle.js",
    "scripts/angular.bundle.js",
    "scripts/katex.bundle.js",
    "scripts/showdown.bundle.js",
    "scripts/polyfills.bundle.js",
    "scripts/unorm.bundle.js",

    // The sidebar app
    "scripts/sidebar.bundle.js",

    "styles/angular-csp.css",
    "styles/angular-toastr.css",
    "styles/icomoon.css",
    "styles/katex.min.css",
    "styles/sidebar.css"
  ])
}
