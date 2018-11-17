import sidebar from "./sidebar.js"
sidebar(document, {
  buildType: "dev",
  assetRoot: "../../",

  apiUrl: "dat://hypothesis.hashbase.io/api",
  authDomain: "dat://id.hashbase.io/auth",
  serviceUrl: "dat://hypothesis.hashbase.io/service",

  browserIsBeaker: true,
  appType: "beaker-app"
})
