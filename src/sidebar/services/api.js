'use strict';

const get = require('lodash.get');
const events = require('../events');
const urlUtil = require('../util/url-util');

/**
 * Translate the response from a failed API call into an Error-like object.
 *
 * The details of the response are available on the `response` property of the
 * error.
 */
function translateResponseToError(response) {
  let message;
  if (response.status <= 0) {
    message = 'Service unreachable.';
  } else {
    message = response.status + ' ' + response.statusText;
    if (response.data && response.data.reason) {
      message = message + ': ' + response.data.reason;
    }
  }
  const err = new Error(message);
  err.response = response;
  return err;
}

/**
 * Return a shallow clone of `obj` with all client-only properties removed.
 * Client-only properties are marked by a '$' prefix.
 */
function stripInternalProperties(obj) {
  const result = {};

  for (const k in obj) {
    if (obj.hasOwnProperty(k) && k[0] !== '$') {
      result[k] = obj[k];
    }
  }

  return result;
}


function forEachSorted(obj, iterator, context) {
  const keys = Object.keys(obj).sort();
  for (let i = 0; i < keys.length; i++) {
    iterator.call(context, obj[keys[i]], keys[i]);
  }
  return keys;
}


function serializeValue(v) {
  if (typeof v === 'object') {
    return v instanceof Date ? v.toISOString() : JSON.stringify(v);
  }
  return v;
}


function encodeUriQuery(val) {
  return encodeURIComponent(val).replace(/%20/g, '+');
}


// Serialize an object containing parameters into a form suitable for a query
// string.
//
// This is an almost identical copy of the default Angular parameter serializer
// ($httpParamSerializer), with one important change. In Angular 1.4.x
// semicolons are not encoded in query parameter values. This is a problem for
// us as URIs around the web may well contain semicolons, which our backend will
// then proceed to parse as a delimiter in the query string. To avoid this
// problem we use a very conservative encoder, found above.
function serializeParams(params) {
  if (!params) {
    return '';
  }
  const parts = [];
  forEachSorted(params, function(value, key) {
    if (value === null || typeof value === 'undefined') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function(v) {
        parts.push(encodeUriQuery(key)  + '=' + encodeUriQuery(serializeValue(v)));
      });
    } else {
      parts.push(encodeUriQuery(key) + '=' + encodeUriQuery(serializeValue(value)));
    }
  });

  return parts.join('&');
}

/**
 * @typedef APIResponse
 * @prop {any} data - The JSON response from the API call.
 * @prop {string|null} token - The access token that was used to make the call
 *   or `null` if unauthenticated.
 */

/**
 * Options controlling how an API call is made or processed.
 *
 * @typedef APICallOptions
 * @prop [boolean] includeMetadata - If false (the default), the response is
 *   just the JSON response from the API. If true, the response is an `APIResponse`
 *   containing additional metadata about the request and response.
 */

/**
 * Function which makes an API request.
 *
 * @typedef {function} APICallFunction
 * @param [any] params - A map of URL and query string parameters to include with the request.
 * @param [any] data - The body of the request.
 * @param [APICallOptions] options
 * @return {Promise<any|APIResponse>}
 */

/**
 * Creates a function that will make an API call to a named route.
 *
 * @param $http - The Angular HTTP service
 * @param $q - The Angular Promises ($q) service.
 * @param links - Object or promise for an object mapping named API routes to
 *                URL templates and methods
 * @param route - The dotted path of the named API route (eg. `annotation.create`)
 * @param {Function} tokenGetter - Function which returns a Promise for an
 *                   access token for the API.
 * @return {APICallFunction}
 */
function createAPICall($http, $q, links, route, tokenGetter) {
  return function (params, data, options = {}) {
    // `$q.all` is used here rather than `Promise.all` because testing code that
    // mixes native Promises with the `$q` promises returned by `$http`
    // functions gets awkward in tests.
    let accessToken;
    return $q.all([links, tokenGetter()]).then(([links, token]) => {
      const descriptor = get(links, route);
      const url = urlUtil.replaceURLParams(descriptor.url, params);
      const headers = {};

      accessToken = token;
      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }

      const req = {
        data: data ? stripInternalProperties(data) : null,
        headers: headers,
        method: descriptor.method,
        params: url.params,
        paramSerializer: serializeParams,
        url: url.url,
      };
      return $http(req);
    }).then(function (response) {
      if (options.includeMetadata) {
        return { data: response.data, token: accessToken };
      } else {
        return response.data;
      }
    }).catch(function (response) {
      // Translate the API result into an `Error` to follow the convention that
      // Promises should be rejected with an Error or Error-like object.
      //
      // Use `$q.reject` rather than just rethrowing the Error here due to
      // mishandling of errors thrown inside `catch` handlers in Angular < 1.6
      return $q.reject(translateResponseToError(response));
    });
  };
}

class Client {
  constructor() {
    this.port = null
    this.id = 0
    this.ready = this.connect()
    this.requests = {}
  }
  connect() {
    return new Promise(resolve => {
      const onConnect = (event) => {
        const {route, port} = event.data || {}
        if (route === "hypothesis/connect" && port instanceof MessagePort) {
          window.removeEventListener("message", onConnect)
          port.addEventListener("message", this)
          port.start()
          this.port = port
          resolve(port)
        } else {
          console.warn('unexpected message received', event.data)
        }
      }

      window.addEventListener("message", onConnect)
      window.top.postMessage("hypothesis/connect", window.top.origin)
    })
  }
  handleEvent({data: {id, result}}) {
    const request = this.requests[id]
    if (request == null) {
      console.warn(`Received response for unknown request ${id}`, result)
    } else {
      if (result.ok) {
        request.resolve(result.value)
      } else {
        request.reject(result.error)
      }
    }
  }
  request(route, params, data, options) {
    const id = `@${++this.id}`
    const request = { id, route, params, data, options }
    const response = this.receive(id)
    const { port } = this
    if (port) {
      port.postMessage(request)
    } else {
      this.ready.then(port => port.postMessage(request))
    }
    return response
  }
  receive(id) {
    return new Promise((resolve, reject) => {
      this.requests[id] = {resolve, reject}
    })
  }
}



/**
 * API client for the Hypothesis REST API.
 *
 * Returns an object that with keys that match the routes in
 * the Hypothesis API (see http://h.readthedocs.io/en/latest/api/). See
 * `APICallFunction` for the syntax of API calls. For example:
 *
 * ```
 * api.annotations.update({ id: '1234' }, annotation).then(ann => {
 *   // Do something with the updated annotation.
 * }).catch(err => {
 *   // Do something if the API call fails.
 * });
 * ```
 *
 * This service handles authenticated calls to the API, using the `auth` service
 * to get auth tokens. The URLs for API endpoints are fetched from the `/api`
 * endpoint, a responsibility delegated to the `apiRoutes` service which does
 * not use authentication.
 */
// @ngInject
function api($http, $q, $rootScope, apiRoutes, auth) {
  const links = apiRoutes.routes();
  const client = new Client()
  const channel = new BroadcastChannel("service")
  channel.onmessage = (message) => {
    if (message.data === "ready") {
      $rootScope.$broadcast(events.OAUTH_TOKENS_CHANGED);
      // service.profile.read({ gozala: true }, null)
    }
  }

  const apiCall = route => (params, data, options={}) =>
    client.request(route, params, data, options).then(data => {
      if (options.includeMetadata) {
        return { data }
      } else {
        return data
      }
    }).catch(error => {
      return $q.reject(translateResponseToError(error))
    })

  const service = {
    search: apiCall('search'),
    annotation: {
      create: apiCall('annotation.create'),
      delete: apiCall('annotation.delete'),
      get: apiCall('annotation.read'),
      update: apiCall('annotation.update'),
      flag: apiCall('annotation.flag'),
      hide: apiCall('annotation.hide'),
      unhide: apiCall('annotation.unhide'),
    },
    group: {
      member: {
        delete: apiCall('group.member.delete'),
      },
    },
    groups: {
      list: apiCall('group.list'),
    },
    profile: {
      groups: apiCall('profile.groups'),
      read: apiCall('profile.read'),
      update: apiCall('profile.update'),
    },

    // The `links` endpoint is not included here. Clients should fetch these
    // from the `apiRoutes` service.
  };

  return service
}

module.exports = api;
