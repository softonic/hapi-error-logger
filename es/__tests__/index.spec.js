import hapi from 'hapi';
import HapiErrorLogger from '../index';

function createServerWithPlugin(pluginOptions, replyValue, stateValue) {
  const server = new hapi.Server({ debug: false });

  server.register({
    plugin: HapiErrorLogger,
    options: pluginOptions,
  });
  server.route({
    method: 'GET',
    path: '/path',
    handler: (request, h) => {
      if (stateValue) {
        h.state('state', stateValue);
      }
      return replyValue;
    },
  });
  return { server };
}

describe('HapiErrorLogger', () => {
  it('should be a Hapi plugin', () => {
    expect(HapiErrorLogger.register).toBeInstanceOf(Function);
    expect(HapiErrorLogger.pkg.name).toBe('@softonic/hapi-error-logger');
  });

  describe('when it is registered', () => {
    it('should log an error in a request', async () => {
      const logger = {
        error: jest.fn(),
      };

      const serverError = new Error('Server error');

      const { server } = createServerWithPlugin({ logger }, serverError);

      await server.inject({
        method: 'GET',
        url: '/path',
        headers: {
          host: 'example.com',
          'x-foo': 'bar',
        },
      });

      expect(logger.error).toHaveBeenCalledWith({
        request: expect.objectContaining({
          method: 'GET',
          url: '/path',
          headers: expect.objectContaining({
            'x-foo': 'bar',
          }),
        }),
        error: serverError,
      }, 'GET example.com/path ERROR');
    });

    it('should whitelist the specified headers', async () => {
      const logger = {
        error: jest.fn(),
      };

      const serverError = new Error('Server error');

      const { server } = createServerWithPlugin({
        logger,
        whitelistRequestHeaders: [
          'host',
          'accept',
          'accept-language',
        ],
        whitelistResponseHeaders: [
          'content-type',
          'content-language',
        ],
      }, serverError);

      await server.inject({
        method: 'GET',
        url: '/path',
        headers: {
          'x-foo': 'bar',
          host: 'example.com',
          accept: 'text/plain',
          'accept-language': 'es-ES',
        },
      });

      expect(logger.error).toHaveBeenCalledWith({
        request: expect.objectContaining({
          method: 'GET',
          url: '/path',
          headers: {
            host: 'example.com',
            accept: 'text/plain',
            'accept-language': 'es-ES',
          },
        }),
        error: expect.any(Error),
      }, expect.any(String));
    });

    it('should blacklist the specified headers', async () => {
      const logger = {
        error: jest.fn(),
      };

      const serverError = new Error('Server error');

      const { server } = createServerWithPlugin({
        logger,
        blacklistRequestHeaders: [
          'accept',
          'accept-language',
        ],
        blacklistResponseHeaders: [
          'content-type',
          'content-language',
        ],
      }, serverError);

      await server.inject({
        method: 'GET',
        url: '/path',
        headers: {
          'x-foo': 'bar',
          host: 'example.com',
          accept: 'text/plain',
          'accept-language': 'es-ES',
        },
      });

      expect(logger.error).toHaveBeenCalledWith({
        request: expect.objectContaining({
          method: 'GET',
          url: '/path',
          headers: expect.objectContaining({
            'x-foo': 'bar',
            host: 'example.com',
          }),
        }),
        error: expect.any(Error),
      }, expect.any(String));

      const logEntry = logger.error.mock.calls[0][0];

      expect(logEntry.request.headers.accept).toBeUndefined();
      expect(logEntry.request.headers['accept-language']).toBeUndefined();
    });

    describe('when an "isLoggableError" option is passed', () => {
      it('should log an error that passes the filter', async () => {
        const logger = {
          error: jest.fn(),
        };

        const serverError = new Error('Server error');
        serverError.isLoggable = true;

        const { server } = createServerWithPlugin({
          logger,
          isLoggableError: error => error.isLoggable === true,
        }, serverError);

        await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            'x-foo': 'bar',
            host: 'example.com',
            accept: 'text/plain',
            'accept-language': 'es-ES',
          },
        });

        expect(logger.error).toHaveBeenCalled();
      });

      it('should NOT log an error that does not pass the filter', async () => {
        const logger = {
          error: jest.fn(),
        };

        const serverError = new Error('Server error');
        serverError.isLoggable = false;

        const { server } = createServerWithPlugin({
          logger,
          isLoggableError: error => error.isLoggable === true,
        }, serverError);

        await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            'x-foo': 'bar',
            host: 'example.com',
            accept: 'text/plain',
            'accept-language': 'es-ES',
          },
        });

        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('when the server receives a "request-error" event', () => {
      it('should log the error received with the event', async () => {
        const logger = {
          error: jest.fn(),
        };

        const { server } = createServerWithPlugin({ logger }, 'ok', {});

        await server.inject({
          method: 'GET',
          url: '/path',
          headers: {
            host: 'example.com',
            'x-foo': 'bar',
          },
        });

        expect(logger.error).toHaveBeenCalledWith({
          request: expect.objectContaining({
            method: 'GET',
            url: '/path',
            headers: expect.objectContaining({
              'x-foo': 'bar',
            }),
          }),
          error: expect.objectContaining({
            message: expect.stringMatching(/Invalid cookie value/),
          }),
        }, 'GET example.com/path REQUEST ERROR');
      });
    });
  });
});
