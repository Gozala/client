import { injectAssets, injectConfig, injectLink } from "./inject.js"

export default (doc, config, service) => {
  const appLinkEl = doc.querySelector('link[type="application/annotator+html"]')
  if (appLinkEl) {
    return
  }

  doc.defaultView.addEventListener("message", async event => {
    if (event.data === "hypothesis/connect" && service && service.connect) {
      const port = await service.connect(event)
      if (port) {
        event.source.postMessage(
          { route: "hypothesis/connect", port },
          event.source.origin,
          [port]
        )
      }
    }
  })

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

  doc.defaultView.hypothesisConfig = function() {
    return {
      services: [
        {
          apiUrl: new URL("/client/api.json", location.href).href,
          authority: "partner.org",
          grantToken: "***",
          icon:
            "https://openclipart.org/download/272629/sihouette-animaux-10.svg",
          onLoginRequest() {
            service.login()
          },
          onLogoutRequest() {
            service.logout()
          },
          onSignupRequest() {
            service.signup()
          },
          onProfileRequest() {
            service.profile()
          },
          onHelpRequest() {
            service.help()
          }
        }
      ]
    }
  }

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
