# React WebSocket Example

This example encapsulates the BlockSuite editor and doc collection in React, demonstrating document synchronization and storage with WebSocket.

### Development

```sh
git clone https://github.com/toeverything/blocksuite.git
cd blocksuite/examples

pnpm install
pnpm dev react-websocket
```

Here is how it works:

```
              ┌────────────┐
              │   Express  │ ◀──────┐
              │   Server   │        │ ydoc update
              └────────────┘        │ callback
                                    │
┌────────────┐             ┌─────────────┐           ┌────────────┐
│   Editor   │             │ Y-Websocket │           │  Document  │
│   Client   │◀───────────▶│   Backend   │ ─────────▶│  Storage   │
└────────────┘  ydoc room  └─────────────┘           └────────────┘
```

This WebSocket backend is provided by [y-websocket](https://github.com/yjs/y-websocket). Additionally, the yjs community also offers [y-redis](https://github.com/yjs/y-redis), an alternative WebSocket backend with authentication. You can check out the [example](https://github.com/yjs/y-redis/tree/master/demos/blocksuite) of BlockSuite in the y-redis repository.

This project is created using the `pnpm create vite-express` cli.
