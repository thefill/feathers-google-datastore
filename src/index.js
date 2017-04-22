// import errors from 'feathers-errors';
import makeDebug from 'debug';

const debug = makeDebug('feathers-google-datastore');

export default function init () {
  debug('Initializing feathers-google-datastore plugin');
  return 'feathers-google-datastore';
}
