import {
  formatRequest,
  stringifyRequest,
} from '@softonic/http-log-format';
import packageJSON from '../package.json';

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
 *     blacklistRequestHeaders: []
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
   * @param  {Function}     notifyRegistration
   */
  register(server, options, notifyRegistration) {
    const {
      logger,
      whitelistRequestHeaders,
      blacklistRequestHeaders,
    } = options;

    server.ext('onPreResponse', (request, reply) => {
      const response = request.response;

      if (response.isBoom) {
        const { req } = request.raw;
        const receivedTime = new Date(request.info.received);
        const extendedReq = Object.assign({}, req, {
          timestamp: receivedTime.toISOString(),
        });

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

    notifyRegistration();
  },

};

HapiErrorLogger.register.attributes = {
  pkg: packageJSON,
};

export default HapiErrorLogger;
