/**
 * Google Datastore adapter for Feathers JavaScript framework.
 */

// import errors from 'feathers-errors';
import makeDebug from 'debug';
// get datastore model
const Datastore = require('@google-cloud/datastore');
// get debugger
const debug = makeDebug('feathers-google-datastore');
// get error
const errors = require('feathers-errors');


// // You can wrap existing errors
// const existing = new errors.GeneralError(new Error('I exist'));

// // You can also pass additional data
// const data = new errors.BadRequest('Invalid email', {email: 'sergey@google.com'});

/**
 * Adapter factory generator
 * @param {*} options Initial configuration object
 *                    Initial options in GCE environment:
 *                    If you are running this client on Google Compute Engine,
 *                    Google handles authentication for you with no configuration.
 *                    Initial options outside of GCE environment:
 *                    If you are running this client outside of  Google Compute Engine,
 *                    Google requires you to provide configuration object.
 *
 *                    Guide here:
 *                    https://googlecloudplatform.github.io/google-cloud-node/#/docs/datastore/1.0.0/guides/authentication
 */
const datastoreAdapter = function (options) {
    // adapter factory
    let adapter = {
        // config represents the data required for connection to the datasource.
        config: null,
        // datastore contains refference to Google Datastore object initialised with provided credentials
        datastore: null,
        // default Kind for calls - used if none provided in params
        defaultKind: false,
        // do we allow custom kind passed in params? For the security reasons: no!
        allowKindOverwrite: false,
        // default namespace for calls - used if none provided in params
        defaultNamespace: false,
        // do we allow custom namespace passed in params? For the security reasons: no!
        allowNamespaceOverwrite: false,
        // definition of required adapter interface methods
        find: find,
        get: get,
        create: create,
        update: update,
        patch: patch,
        remove: remove,
        setup: setup,
        // utils
        resolveConfig: resolveConfig,
        resolveId: resolveId,
        resolveKind: resolveKind,
        resolveErrorData: resolveErrorData,
        isValidKind: isValidKind,
        resolvePreKey: resolvePreKey,
        resolveNamespace: resolveNamespace,
        // misc properities
        // refference to feathers app
        app: null,
        // path for which feathers app was registered on
        path: ''
    };

    // set config using provided options or env variables if provided
    if (typeof options != "undefined" && typeof options.model != "undefined") {
        // find out which options & env variables to use in config
        adapter.config = adapter.resolveConfig(options.model);
    } else {
        // if config or model not provided
        adapter.config = false;
    }

    // if config provided
    if (adapter.config) {
        // pass config
        adapter.datastore = Datastore(adapter.config);
    } else {
        // don't pass config
        debug('Config for datastore not provided or invalid - initialising without config.');
        adapter.datastore = Datastore();
    }

    // set default kind if provided (string or array of strings)
    if (typeof options != "undefined" && adapter.isValidKind(options.defaultKind)) {
        debug('Default Kind provided - each call will fallback to it.');
        adapter.defaultKind = options.defaultKind;
    } else {
        debug('Default Kind not provided - each call to adapter will require Kind (if allowKindOverwrite true).');
    }

    // set permission to swap kind if permission provided
    if (typeof options != "undefined" && typeof options.allowKindOverwrite != "undefined" && options.allowKindOverwrite) {
        debug('Service allows to use kind from params.');
        adapter.allowKindOverwrite = true;
    } else {
        debug('Service will use only defined kind.');
    }

    // set default namespace if provided (string)
    if (typeof options != "undefined" && typeof options.defaultNamespace == "string") {
        debug('Default Namespace provided - each call will fallback to it.');
        adapter.defaultNamespace = options.defaultNamespace;
    } else {
        debug('Default Namespace not provided - each call to adapter can optionally provide it (if allowNamespaceOverwrite true).');
    }

    // set permission to swap namespace if permission provided
    if (typeof options != "undefined" && typeof options.allowNamespaceOverwrite != "undefined" && options.allowNamespaceOverwrite) {
        debug('Service allows to use namespace from params.');
        adapter.allowNamespaceOverwrite = true;
    } else {
        debug('Service will use only defined namespace.');
    }

    // Return an object that implements the service interface.
    return {
        find: adapter.find,
        get: adapter.get,
        create: adapter.create,
        update: adapter.update,
        patch: adapter.patch,
        remove: adapter.remove,
        setup: adapter.setup
    }

    /**
     * Retrieves a single resource with the given id from the service.
     * @param {*} id Valid id in form of a number
     * @param {*} params additional params
     * @returns {promise} Promise resolved to returned data.
     */
    function get(id, params) {
        // TODO:
        debug('Method "Get" called.');

        // set new promise
        let deferred = new Promise((resolve, reject) => {

            // prepare id
            let processedId = adapter.resolveId(id);
            // if id after processing is a string - then an error
            if (typeof processedId == "string") {
                // reject with returned error
                // return error
                let serviceError = new errors.BadRequest(
                    processedId,
                    adapter.resolveErrorData(id, adapter.resolveKind(params), params)
                );
                reject(serviceError);
            }
            // prepare kind
            let kind = adapter.resolveKind(params);
            // generate datastore key
            let key = adapter.datastore.key(adapter.resolvePreKey(processedId, kind, params));

            // make request using key
            adapter.datastore.get(key)
                .then((result) => {
                    // if any result returned (and if one result returned check if not undefined)
                    if (result.length > 1 || (result.length == 1 && typeof result[0] != "undefined")) {
                        // return result
                        resolve(result);
                    } else {
                        // return error
                        let serviceError = new errors.NotFound(
                            "Requested entity does not exist.",
                            adapter.resolveErrorData(id, kind, params)
                        );
                        reject(serviceError);
                    }
                })
                .catch((error) => {
                    debug(error);
                    // embed returned error in feathers error
                    let serviceError = new errors.GeneralError(
                        "Datastore returned error while requesting entity.",
                        adapter.resolveErrorData(id, kind, params)
                    );
                    reject(serviceError);
                });
        });

        return deferred;
    }

    // implementation of adapters methods
    function find(params) {
        // TODO:
    }

    function create(data, params) {
        // this.emit('status', { status: 'created' });
        // TODO:
    }

    function update(id, data, params) {
        // this.emit('status', { status: 'updated' });
        // TODO:
    }

    function patch(id, data, params) {
        // this.emit('status', { status: 'patched' });
        // TODO:
    }

    function remove(id, params) {
        // this.emit('status', { status: 'removed' });
        // TODO:
    }

    /**
     * Service setup
     * @param {object} app refference to feathers app
     * @param {string} path path for which feathers app has been registered on
     */
    function setup(app, path) {
        adapter.app = app;
        adapter.path = path;
    }

    /**
     * Generate datastore composite for key.
     * Generates:
     *    - an incomplete key with a kind:
     *      e.g. 'Company'
     *    - a complete key with a kind and id:
     *      e.g. ['Company', 123]
     *    - a complete key with a kind and name (array of strings)
     *      e.g. ['Company', 'Google']
     *    - a complete key from a provided namespace and path
     *      e.g. { namespace: 'My-NS', path: ['Company', 123] }
     * @param {string} id Id in string format. shoud be a number converted to string
     * @param {string | array} kind sting or array of kinds
     * @param {object} params Object of passed params
     * @return {number | string} Number if id correct, error string if not
     */
    function resolvePreKey(id, kind, params) {
        // get namespace
        let namespace = adapter.resolveNamespace(params);
        // merge kind & id to create path
        let path = [].concat(kind, id);

        // if namespace not empty
        if (namespace) {
            return {
                namespace: namespace,
                path: path
            }
        }

        // if no namespace just return path
        return path;
    }

    /**
     * Parse params to get provided kind or if not found use default kind
     * provided with a config.
     * @param {object} params Object of passed params
     * @returns {string | array} kind in form of a string
     */
    function resolveKind(params) {
        // if model allows for kind provided via params
        if (adapter.allowKindOverwrite) {
            // if kind provided in params
            if (typeof params.kind != undefined && adapter.isValidKind(params.kind)) {
                return params.kind;
            }
        }
        // fallback to default
        return adapter.defaultKind;
    }

    /**
     * Parse params to get provided namespace or if not found use default namespace
     * provided with a config.
     * @param {object} params Object of passed params
     * @returns {string} namespace in form of a string
     */
    function resolveNamespace(params) {
        // if model allows for namespace provided via params
        if (adapter.allowNamespaceOverwrite) {
            // if namespace provided in params
            if (typeof params.namespace != undefined && typeof params.namespace == "string") {
                return params.namespace;
            }
        }
        // fallback to default
        return adapter.defaultNamespace;
    }

    /**
     * Checks if provided kind is in correct format.
     * @param {string | array} kind in the form of string or array of strings
     * @returns {boolean} true or false
     */
    function isValidKind(kind) {
        return typeof kind == "string" || (Array.isArray(kind) && kind.length);
    }

    /**
     * Generate error data returned when request fails
     * @param {string} id Id in string format. shoud be a number converted to string
     * @param {string | array} kind sting or array of kinds
     * @param {object} params Object of passed params
     * @return {number | string} Number if id correct, error string if not
     */
    function resolveErrorData(id, kind, params) {
        // build error data
        let errorData = {
            id: id
        };

        // if kind different than default then we can return it in error data
        // because it was provided by the user
        if (kind !== adapter.defaultKind) {
            errorData.kind = kind;
        }

        // if query provided
        if (typeof params != "undefined" && typeof params.query != "undefined" && params.query.hasOwnProperty()) {
            errorData.query = params.query;
        }

        // return processed data
        return errorData;
    }

    /**
     * Resolves request id
     * @param {string} id Id in string format. shoud be a number converted to string
     * @return {object | string} Datastore special integer Number if id correct, error string if not
     */
    function resolveId(id) {
        // if string id in valid format (only numbers)
        let validNumber = !isNaN(id);
        // if parse successful
        if (validNumber) {
            // convert to special long integer
            return adapter.datastore.int(id);
        } else {
            // return error string
            return 'Invalid id format, should be a number e.g. 5634472569470976, provided: ' + id;
        }
    }

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
     * @returns {object} parsed config object
     */
    function resolveConfig(options) {
        let config = {};

        // get project id (config object takes priority)
        // if project id provided via config or env variable
        if (typeof options.projectId != "undefined" && options.projectId) {
            config.projectId = options.projectId;
        } else {
            // if no project id provided via config lets check env variables
            if (process.env.GCLOUD_PROJECT) {
                config.projectId = process.env.GCLOUD_PROJECT;
            } else {
                // if not defined
                debug('Project ID for datastore not provided - ignoring whole config.');
                return false;
            }
        }

        // get credential keyfile path or env variable (config object takes priority)
        // if keyFilename provided via config or env variable
        if (typeof options.keyFilename != "undefined" && options.keyFilename) {
            config.keyFilename = options.keyFilename;
        } else {
            // if no keyFilename provided vai config lets check env variables
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            } else {
                // if no credential keyfile path provided via config or env variable
                // lets check if explicit credentials provided
                if (typeof options.credentials != "undefined" &&
                    typeof options.credentials.client_email != "undefined" &&
                    typeof options.credentials.private_key != "undefined") {
                    // if valid credentials provided
                    debug('Credential keyfile path for datastore not provided - using provided credentials.');
                    config.credentials = options.credentials;
                } else {
                    debug('Credential keyfile path for datastore not provided - ignoring whole config.');
                    // bailout
                    return false;
                }
                return false;
            }
        }

        // return completed config object
        return config;
    }
}

// export of the factory generator
debug('Initializing feathers-google-datastore plugin');
module.exports = datastoreAdapter;
