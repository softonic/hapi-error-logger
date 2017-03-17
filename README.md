# @softonic/hapi-error-logger

Hapi plugin to log errors on requests

## Installation

```bash
npm install @softonic/hapi-error-logger
```

## Usage

```js
// CommonJS
// const HapiErrorLogger = require('@softonic/hapi-error-logger');

// ES2015
import HapiErrorLogger from '@softonic/hapi-error-logger';

server.register({
  register: HapiErrorLogger,
  options: {
    logger: bunyan.createLogger({ name: "myapp" }),
    // whitelistHeaders and blacklistHeaders should not be used together
    whitelistRequestHeaders: [ 'host', 'accept', 'content-type'  ],
    blacklistRequestHeaders: [ 'authorization' ],
  }
});
```

## Testing

Clone the repository and execute:

```bash
npm test
```

## Contribute

1. Fork it: `git clone https://github.com/softonic/@softonic/hapi-error-logger.git`
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Added some feature'`
4. Check the build: `npm run build`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D
