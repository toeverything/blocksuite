# React WebSocket Example

This example encapsulates the BlockSuite editor and doc collection in React, demonstrating document synchronization and storage with WebSocket. It provides two WebSocket backends to switch between:

1. A basic server using [y-websocket](https://github.com/yjs/y-websocket).
2. A server using [y-redis](https://github.com/yjs/y-redis) that supports auth and persists the docs.

### Development

To run this example, please ensure you have installed [Docker](https://www.docker.com/).

```sh
git clone https://github.com/toeverything/blocksuite.git
cd blocksuite/examples

pnpm install
pnpm dev react-websocket
```

There are multiple entries:

- The [localhost:5173/basic](http://localhost:5173/basic) entry is the example using basic WebSocket server for synchronization.
- The [localhost:5173/y-redis](http://localhost:5173/y-redis) entry is the example using a y-redis for synchronization.
- The [localhost:9001](http://localhost:9001) entry can be used to check the documents stored by y-redis. the user name and password are both `minioadmin`.

Here is how it works:

```
    doc list   ┌────────────┐
    ┌─────────▶│   Express  │ ◀ - - - ┐
    │          │   Server   │         | save ydocs
    ▼          └────────────┘         |
┌────────────┐                 ┌─────────────┐           ┌────────────┐
│   Editor   │                 │ Y-Websocket │           │  Document  │
│   Client   │◀───────────────▶│   Backend   │ - - - - -▶│  Storage   │
└────────────┘    ydoc room    └─────────────┘           └────────────┘
```

This project is created using the `pnpm create vite-express` cli.
