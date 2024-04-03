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

This project is created using the `pnpm create vite-express` cli.
