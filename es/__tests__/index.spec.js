import hapi from 'hapi';
import HapiErrorLogger from '../index';

function createServerWithPlugin(options) {
  const server = new hapi.Server();
  server.connection();
  server.register({
    register: HapiErrorLogger,
    options,
  });
  server.route({
    method: 'GET',
    path: '/path',
    handler: (request, reply) => (
      reply(request.app.replyValue)
    ),
  });
  return { server };
}

describe('HapiErrorLogger', () => {
  it('should be a Hapi plugin', () => {
    expect(HapiErrorLogger.register).toBeInstanceOf(Function);
    expect(HapiErrorLogger.register.attributes.pkg.name).toBe('@softonic/hapi-error-logger');
  });

  describe('when it is registered', () => {
    it('should log an error in a request', async () => {
      const logger = {
        error: jest.fn(),
      };
      const { server } = createServerWithPlugin({ logger });

      const serverError = new Error('Server error');

      await server.inject({
        method: 'GET',
        url: '/path',
        headers: {
          host: 'example.com',
          'x-foo': 'bar',
        },
        app: {
          replyValue: serverError,
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
      });

      const serverError = new Error('Server error');

      await server.inject({
        method: 'GET',
        url: '/path',
        headers: {
          'x-foo': 'bar',
          host: 'example.com',
          accept: 'text/plain',
          'accept-language': 'es-ES',
        },
        app: {
          replyValue: serverError,
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
      });

      const serverError = new Error('Server error');

      await server.inject({
        method: 'GET',
        url: '/path',
        headers: {
          'x-foo': 'bar',
          host: 'example.com',
          accept: 'text/plain',
          'accept-language': 'es-ES',
        },
        app: {
          replyValue: serverError,
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
  });
});
