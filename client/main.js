import sidebar from "./sidebar.js"
sidebar(document, {
  buildType: "dev",
  assetRoot: "../../",

  // apiUrl: "dat://hypothesis.hashbase.io/api",
  apiUrl: new URL("/client/api.json", location.href).href,
  authDomain: "dat://id.hashbase.io/auth",
  serviceUrl: "dat://hypothesis.hashbase.io/service",

  browserIsBeaker: true,
  appType: "beaker-app"
})
