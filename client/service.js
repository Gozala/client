export default class Service {
  static spawn(port, routes) {
    const self = new Service(port)
    self.initialize()
  }
  terminate() {
    this.port.removeEventListener("message", this)
    this.port.removeEventListener("close", this)
    delete this.requests
    delete this.port
  }
  initialize() {
    this.requests = {}
    this.port.addEventListener("message", this)
    this.port.addEventListener("close", this)
    this.port.start()
  }
  handleEvent(event) {
    switch (event.type) {
      case "message": {
        return this.onMessage(event.data)
      }
      case "close": {
        return this.onClose(event.data)
      }
    }
  }
  onClose() {
    this.terminate()
  }
  async onMessage(request) {
    try {
      console.log(">>>", request)
      const value = await this.handle(request)
      console.log("<<<", value)
      this.port.postMessage({ id: request.id, result: { ok: true, value } })
    } catch ({ message, stack }) {
      console.error("<<<", message, stack)
      this.port.postMessage({
        id: request.id,
        result: { ok: false, error: { message, stack } }
      })
    }
  }
  handle(request) {
    switch (request.route) {
      case "profile.read":
        return readProfile(request)
      case "group.list":
        return listGroups(request)
      case "search":
        return search(request)
      case "annotation.create":
        return createAnnotation(request)
      default:
        throw Error(`Unknown API endpoint ${request.route}`)
    }
  }
  constructor(port) {
    this.port = port
  }
}

const readProfile = async request => {
  if (!window.loggedIn) {
    return {
      preferences: {},
      userid: null,
      groups: [{ public: true, name: "Public", id: "__world__" }],
      authority: "hypothes.is",
      features: {
        api_render_user_info: true,
        filter_highlights: false,
        overlay_highlighter: false,
        embed_cachebuster: false,
        client_display_names: false
      }
    }
  } else {
    return {
      user_info: {
        display_name: "gozala"
      },
      preferences: {},
      groups: [
        {
          public: true,
          name: "Public",
          id: "__world__"
        }
      ],
      userid: "acct:gozala@hypothes.is",
      authority: "hypothes.is",
      features: {
        api_render_user_info: true,
        filter_highlights: false,
        overlay_highlighter: false,
        embed_cachebuster: false,
        client_display_names: false
      }
    }
  }
}

const listGroups = async request => {
  return [
    {
      name: "Public",
      links: { html: "https://hypothes.is/groups/__world__/public" },
      id: "__world__",
      groupid: null,
      scoped: false,
      organization: {
        default: true,
        logo: "https://hypothes.is/organizations/__default__/logo",
        id: "__default__",
        name: "Hypothesis"
      },
      type: "open",
      public: true
    }
  ]
  return [
    {
      name: "Public",
      links: {
        html: "https://hypothes.is/groups/__world__/public"
      },
      id: "__world__",
      groupid: null,
      scoped: false,
      organization: {
        default: true,
        logo: "/client/organizations/__default__/logo.svg",
        id: "__default__",
        name: "Hypothesis"
      },
      type: "open",
      public: false
    }
  ]
}

const search = async request => {
  return { rows: [], total: 0, replies: [] }
}

const createAnnotation = async request => {
  console.log(request)
}
