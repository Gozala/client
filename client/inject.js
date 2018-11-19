export const injectLink = (doc, { href, rel, type }) => {
  const link = doc.createElement("link")
  link.rel = rel || ""
  link.type = type || ""
  link.href = href || ""
  return doc.head.appendChild(link)
}

export const injectConfig = (doc, settings) => {
  const script = doc.createElement("script")
  script.textContent = JSON.stringify(settings)
  script.type = "application/json"
  script.className = "js-hypothesis-config js-hypothesis-settings"
  return doc.head.appendChild(script)
}

export function injectStylesheet(doc, href) {
  const link = doc.createElement("link")
  link.rel = "stylesheet"
  link.type = "text/css"
  link.href = href
  doc.head.appendChild(link)
}

export function injectScript(doc, src) {
  const script = doc.createElement("script")
  script.type = "text/javascript"
  script.src = src

  // Set 'async' to false to maintain execution order of scripts.
  // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
  script.async = false
  doc.head.appendChild(script)
}

export function injectAssets(doc, config, assets) {
  const manifest = config.manifest || {}
  assets.forEach(function(path) {
    const entry = manifest[path] || path
    const url = config.assetRoot + "build/" + entry
    if (url.match(/\.css/)) {
      injectStylesheet(doc, url)
    } else {
      injectScript(doc, url)
    }
  })
}
