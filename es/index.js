import {
  formatRequest,
  stringifyRequest,
} from '@softonic/http-log-format';
import packageJSON from '../package.json';

/**
 * @param {hapi.Request} request
 * @return {Object}
 */
function buildExtendedRequest(request) {
  const { req } = request.raw;
  const receivedTime = new Date(request.info.received);
  const extendedReq = Object.assign({}, req, {
    timestamp: receivedTime.toISOString(),
  });
  return extendedReq;
}

/**
 * Hapi plugin to log errors on requests
 *
 * @example
 *
 * // Registration
 * server.register({
 *   register: HapiErrorLogger,
 *   options: {
 *     logger: bunyan.createLogger({ name: 'error-log' }),
 *     whitelistRequestHeaders: [],
 *     blacklistRequestHeaders: [],
 *     isLoggableError: error => error.output.statusCode >= 500
 *   }
 * }, (error) => {});
 *
 * @type {Object}
 */
const HapiErrorLogger = {

  /**
   * Registers the plugin in the Hapi server
   * @param  {hapi.Server}  server
   * @param  {Object}       options
   * @param  {Logger}       options.logger
   * @param  {string[]}     [options.whitelistRequestHeaders]
   * @param  {string[]}     [options.blacklistRequestHeaders]
   * @param  {Function}     [options.isLoggableError] Determines if an error should be logged.
   *                                                  All errors are logged by default.
   * @param  {Function}     notifyRegistration
   */
  register(server, options, notifyRegistration) {
    const {
      logger,
      whitelistRequestHeaders,
      blacklistRequestHeaders,
      isLoggableError = () => true,
    } = options;

    server.ext('onPreResponse', (request, reply) => {
      const { response } = request;

      if (response.isBoom && isLoggableError(response)) {
        const extendedReq = buildExtendedRequest(request);

        const loggableRequest = formatRequest(extendedReq, {
          whitelistHeaders: whitelistRequestHeaders,
          blacklistHeaders: blacklistRequestHeaders,
        });

        const message = `${stringifyRequest(extendedReq)} ERROR`;

        logger.error({
          request: loggableRequest,
          error: response,
        }, message);
      }

      reply.continue();
    });

    server.on('request-error', (request, error) => {
      if (isLoggableError(error)) {
        const extendedReq = buildExtendedRequest(request);

        const loggableRequest = formatRequest(extendedReq, {
          whitelistHeaders: whitelistRequestHeaders,
          blacklistHeaders: blacklistRequestHeaders,
        });

        const message = `${stringifyRequest(extendedReq)} REQUEST ERROR`;

        logger.error({
          request: loggableRequest,
          error,
        }, message);
      }
    });

    notifyRegistration();
  },

};

HapiErrorLogger.register.attributes = {
  pkg: packageJSON,
};

export default HapiErrorLogger;
