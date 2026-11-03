// The Node Firebase SDK ignores NO_PROXY. Keep environment proxies intact and
// bypass its per-socket proxy option only for local emulator connections.
const websocket = require("faye-websocket");
const OriginalClient = websocket.Client;
websocket.Client = class EmulatorClient extends OriginalClient {
  constructor(url, protocols, options) {
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(
      new URL(url).hostname,
    );
    const connectionOptions = { ...options };
    if (local) delete connectionOptions.proxy;
    super(url, protocols, connectionOptions);
  }
};
