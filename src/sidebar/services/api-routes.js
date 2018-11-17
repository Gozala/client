'use strict';

const { retryPromiseOperation } = require('../util/retry');

/**
 * A service which fetches and caches API route metadata.
 */
// @ngInject
function apiRoutes($http, settings) {
  // Cache of route name => route metadata from API root.
  let routeCache;
  // Cache of links to pages on the service fetched from the API's "links"
  // endpoint.
  let linkCache;

  function getJSON(url) {
    return $http.get(url).then(({ status, data }) => {
      if (status !== 200) {
        throw new Error(`Fetching ${url} failed`);
      }
      return data;
    });
  }

  /**
   * Fetch and cache API route metadata.
   *
   * Routes are fetched without any authentication and therefore assumed to be
   * the same regardless of whether the user is authenticated or not.
   *
   * @return {Promise<Object>} - Map of routes to route metadata.
   */
  function routes() {
    if (!routeCache) {
      // routeCache = retryPromiseOperation(() => getJSON(settings.apiUrl))
      routeCache = Promise.resolve({"links": {"profile": {"read": {"url": "https://hypothes.is/api/profile", "method": "GET", "desc": "Fetch the user's profile"}, "update": {"url": "https://hypothes.is/api/profile", "method": "PATCH", "desc": "Update a user's preferences"}}, "search": {"url": "https://hypothes.is/api/search", "method": "GET", "desc": "Search for annotations"}, "group": {"member": {"add": {"url": "https://hypothes.is/api/groups/:pubid/members/:userid", "method": "POST", "desc": "Add the user in the request params to a group."}, "delete": {"url": "https://hypothes.is/api/groups/:pubid/members/:userid", "method": "DELETE", "desc": "Remove the current user from a group."}}}, "links": {"url": "https://hypothes.is/api/links", "method": "GET", "desc": "URL templates for generating URLs for HTML pages"}, "groups": {"read": {"url": "https://hypothes.is/api/groups", "method": "GET", "desc": "Fetch the user's groups"}}, "annotation": {"hide": {"url": "https://hypothes.is/api/annotations/:id/hide", "method": "PUT", "desc": "Hide an annotation as a group moderator."}, "unhide": {"url": "https://hypothes.is/api/annotations/:id/hide", "method": "DELETE", "desc": "Unhide an annotation as a group moderator."}, "read": {"url": "https://hypothes.is/api/annotations/:id", "method": "GET", "desc": "Fetch an annotation"}, "create": {"url": "https://hypothes.is/api/annotations", "method": "POST", "desc": "Create an annotation"}, "update": {"url": "https://hypothes.is/api/annotations/:id", "method": "PATCH", "desc": "Update an annotation"}, "flag": {"url": "https://hypothes.is/api/annotations/:id/flag", "method": "PUT", "desc": "Flag an annotation for review."}, "delete": {"url": "https://hypothes.is/api/annotations/:id", "method": "DELETE", "desc": "Delete an annotation"}}}})
        .then((index) => index.links);
    }
    return routeCache;
  }

  /**
   * Fetch and cache service page links from the API.
   *
   * @return {Promise<Object>} - Map of link name to URL
   */
  function links() {
    if (!linkCache) {
      linkCache = routes().then(routes => {
        // return getJSON(routes.links.url);
        return Promise.resolve({"account.settings": "https://hypothes.is/account/settings", "forgot-password": "https://hypothes.is/forgot-password", "groups.new": "https://hypothes.is/groups/new", "help": "https://hypothes.is/docs/help", "oauth.authorize": "https://hypothes.is/oauth/authorize", "oauth.revoke": "https://hypothes.is/oauth/revoke", "search.tag": "https://hypothes.is/search?q=tag:\":tag\"", "signup": "https://hypothes.is/signup", "user": "https://hypothes.is/u/:user"})
      });
    }
    return linkCache;
  }

  return { routes, links };
}

module.exports = apiRoutes;
