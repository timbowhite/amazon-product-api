var generateQueryString = require('./utils').generateQueryString,
  request = require('request'),
  parseXML = require('xml2js').parseString,
  Promise = require('es6-promise').Promise;

var runQuery = function (credentials, method, opt) {
  opt = opt || {};
  opt.request = opt.request || {};

  return function (query, cb, opt) {
    if (typeof(cb) !== 'function'){
        opt = cb;
        cb = undefined;
    }
    opt = opt || {};
    opt.request = opt.request || {};
    opt.request.url = generateQueryString(query, method, credentials);
    var results;

    if (typeof cb === 'function') {
      request(opt.request, function (err, response, body) {

        if (err) {
          cb(err);
        } else if (!response) {
          cb("No response (check internet connection)");
        } else if (response.statusCode !== 200) {
          parseXML(body, function (err, resp) {
            if (err) {
              cb(err);
            }
            cb(resp[method + 'ErrorResponse']);
          });
        } else {
          parseXML(body, function (err, resp) {
            if (method === 'BrowseNodeLookup' && resp[method + 'Response'].BrowseNodes && resp[method + 'Response'].BrowseNodes.length > 0) {
              results = resp[method + 'Response'].BrowseNodes[0].BrowseNode;
            } else {
              results = resp[method + 'Response'].Items[0].Item;
            }
            cb(null, results);
          });
        }
      });
      return;
    }

    var promise = new Promise(function (resolve, reject) {

      request(opt.request, function (err, response, body) {

        if (err) {
          reject(err);
        } else if (!response) {
          reject("No response (check internet connection)");
        } else if (response.statusCode !== 200) {
          parseXML(body, function (err, resp) {
            if (err) {
              reject(err);
            }
            reject(resp[method + 'ErrorResponse']);
          });
        } else {
          parseXML(body, function (err, resp) {
            var results = null;
            var responseObject = resp[method + 'Response'];
            if (responseObject.Items && responseObject.Items.length > 0) {
              results = responseObject.Items[0].Item;
            } else if (responseObject.BrowseNodes && responseObject.BrowseNodes.length > 0) {
              results = responseObject.BrowseNodes[0].BrowseNode;
            }
            resolve(results);
          });
        }
      });
    });

    return promise;
  };
};

var createClient = function (credentials) {
  return {
    itemSearch: runQuery(credentials, 'ItemSearch'),
    itemLookup: runQuery(credentials, 'ItemLookup'),
    browseNodeLookup: runQuery(credentials, 'BrowseNodeLookup')
  };
};

exports.createClient = createClient;
