# React WebSocket Example

This example encapsulates the BlockSuite editor and doc collection in React, demonstrating document synchronization and storage with y-websocket.

This example includes two WebSocket backends, one is a basic WebSocket server from [y-websocket](https://github.com/yjs/y-websocket), and the other is [y-redis](https://github.com/yjs/y-redis), which provides authentication and storage capabilities.

### Development

To run this example, please ensure you have installed [Docker](https://www.docker.com/).

```sh
git clone https://github.com/toeverything/blocksuite.git
cd blocksuite/examples

pnpm install
pnpm dev react-websocket
```

There are some entires for diffrent usage:

- The [localhost:5173/basic](http://localhost:5173/basic) entry is the example using basic WebSocket server for synchronization.
- The [localhost:5173/y-redis](http://localhost:5173/y-redis) entry is the example using a y-redis for synchronization.
- The [localhost:9001](http://localhost:5173/9001) entiry can be use to check the documents stored by y-redis. the user name and password is `minioadmin`

This example will remove database file and docker containers when process exiting by default. You can remove the following codes in the end of the `./src/server/main.ts` and remove the flag `--rm` of the docker continaer creation command in `package.json`.

```ts
process.on('exit', async () => {
  await fs.unlink(dbFile);
});
```

### How it works?

```
      DocMeta  ┌────────────┐
    ┌─────────▶│   Express  │ ◀ - - - ┐
    │ (auth?)  │   server   │         | (cehck auth?)
    ▼          └────────────┘         | (Y-Doc update callback?)
┌────────────┐                 ┌─────────────┐           ┌────────────┐
│   Editor   │     (auth?)     │ Y-Websocket │           │  Document  │
│   Client   │◀───────────────▶│   backend   │ - - - - -▶│  Storage   │
└────────────┘      sync       └─────────────┘           └────────────┘
```

This example is a simple C/S architecture, where the client is the BlockSuite editor, using Y-Websocket for synchronization. The Express server maintains `DocMeta` information inlcuding `id`, `title`. The actual ability of document storage is provided by Y-Websocket backend.
In this example, there two WebSocket backends. The basic WebSocket server provided by [y-websocket](https://github.com/yjs/y-websocket) only provides synchronization functionality and keeps the document data in memory. In contrast, y-redis additionally offers features such as authentication, persistence, and update callbacks, details of which can be found in the y-redis [documentation](https://github.com/yjs/y-redis).

This project is created using the `pnpm create vite-express` cli.
