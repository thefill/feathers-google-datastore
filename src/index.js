/**
 * Google Datastore adapter for Feathers JavaScript framework.
 */

// import errors from 'feathers-errors';
import makeDebug from 'debug';

// get datastore model
var datastoreModel = require('@google-cloud/datastore');

// get debugger
const debug = makeDebug('feathers-google-datastore');

// get error
const error = require('feathers-errors');


// // You can wrap existing errors
// const existing = new errors.GeneralError(new Error('I exist'));

// // You can also pass additional data
// const data = new errors.BadRequest('Invalid email', {email: 'sergey@google.com'});

/**
 *
 * @param {*} options Initial configuration object
 *                    Initial options in GCE environment:
 *                    If you are running this client on Google Compute Engine,
 *                    Google handles authentication for you with no configuration.
 *                    Initial options outside of GCE environment:
 *                    If you are running this client outside of  Google Compute Engine,
 *                    Google requires you to provide configuration object.
 *                    Guide here: https://googlecloudplatform.github.io/google-cloud-node/#/docs/datastore/1.0.0/guides/authentication
 */
const datastoreAdapter = function (options) {
  // config represents the data required for connection to the datasource.
  const Config = typeof options != "undefined" && typeof options.model != "undefined" ? resolveConfig(options.model) : false;
  var datastore = null;

  // if config provided
  if (Config) {
    // pass config
    datastore = datastoreModel(Config);
  } else {
    // don't pass config
    debug('Config for datastore not provided or invalid - initialising without config.');
    datastore = datastoreModel();
  }

  // Return an object that implements the service interface.
  return {
    find: find,
    get: get,
    create: create,
    update: update,
    patch: patch,
    remove: remove,
    setup: setup
  }

  // implementation of adapters methods
  function find(params) {}

  function get(id, params) {
    id = resolveId(id);
    var key = datastore.key(['Tag', 5634472569470976]);

    return datastore.get(key);
  }

  function create(data, params) {}

  function update(id, data, params) {}

  function patch(id, data, params) {}

  function remove(id, params) {}

  function setup(app, path) {}


}

debug('Initializing feathers-google-datastore plugin');
module.exports = datastoreAdapter;

/**
 * Resolves initial config passed to adapter:
 * A config object is not required if you are in an environment which
 * supports Application Default Credentials. This could be your own
 * development machine when using the gcloud SDK or within
 * Google App Engine and Compute Engine.
 *
 * If this doesn't describe your environment, the config object expects
 * the following properties:
 *   1. Credentials data:
 *      - credentials object containing client_email and private_key properties.
 *      - keyFilename path to a .json, .pem, or .p12 key file.
 *      Option: no keyFilename, in exchange GOOGLE_APPLICATION_CREDENTIALS
 *              environment variable with a full path to your key file.
 *    2. projectId
 *       If you wish, you can set an environment variable (GCLOUD_PROJECT)
 *       in place of specifying this inline. Or, if you have provided a service
 *       account JSON key file as the config.keyFilename property explained above,
 *       your project ID will be detected automatically.
 *
 * Note: When using a .pem or .p12 key file, config.email is also required.
 *
 * @param {object} config object
 * @param {object} debug debugger to use
 * @param {object} error error handler to use
 */
function resolveConfig(config, debug, error) {
  var config = {};

  // get project id (config object takes priority)
  var projectId = typeof config.projectId != "undefined" ? config.projectId : (process.env.GCLOUD_PROJECT || false);

  // if no project id provided via config or env variable
  if (projectId === false) {
    debug('Project ID for datastore not provided - ignoring whole config.');
    // bailout
    return false;
  } else {
    config.projectId = projectId;
  }

  // get credential keyfile path or env variable (config object takes priority)
  var keyFilename = typeof config.keyFilename != "undefined" ? config.keyFilename : (process.env.GOOGLE_APPLICATION_CREDENTIALS || false);

  // if no credential keyfile path provided via config or env variable
  if (keyFilename === false) {
    // lets check if explicit credentials provided
    var credentials = typeof config.credentials != "undefined" &&
      config.credentials.client_email != "undefined" &&
      config.credentials.private_key != "undefined";
    // if valid credentials provided
    if (keyFilename === false) {
      debug('Credential keyfile path for datastore not provided - using provided explicit credentials.');
      config.credentials = credentials;
    } else {
      debug('Credential keyfile path for datastore not provided - ignoring whole config.');
      // bailout
      return false;
    }
  } else {
    config.keyFilename = keyFilename;
  }

  // return completed config object
  return config;
}
