import annotator from "./annotator.js"
import Service from "./service.js"

annotator(
  document,
  {
    assetRoot: "../../",
    sidebarAppUrl: "../../client/app.html",
    enableExperimentalNewNoteButton: true,

    apiUrl: new URL("/client/api.json", location.href).href,
    authDomain: new URL("/client/auth.json", location.href).href,
    serviceUrl: new URL("/client/service.json", location.href).href
  },
  {
    connect() {
      const { port1, port2 } = new MessageChannel()
      Service.spawn(port1)
      return port2
    },
    login() {
      console.log("login")
      window.loggedIn = true
      const channel = new BroadcastChannel("service")
      channel.postMessage("ready")
    },
    logout() {
      console.log("logout")
    },
    signup() {
      console.log("signup")
    },
    profile() {
      console.log("profile")
    },
    help() {
      console.log("help")
    }
  }
)
