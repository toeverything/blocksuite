import { DocCollectionMetaState } from '@blocksuite/store';
import express, { json } from 'express';
import ViteExpress from 'vite-express';

// Create http server
const app = express();
app.use(json());

// The data structure of the callback body is defined here.
type EmptyObject = Record<string, never>;
type BasicWsCallbackBody = {
  room: string;
  data: {
    meta: {
      type: 'Map';
      content: DocCollectionMetaState | EmptyObject;
    };
    blocks: {
      type: 'Map';
      content: Record<string, unknown> | EmptyObject;
    };
  };
};

// It is called in regular intervals when the document changes.
app.post('/basic-ws-callback', async (req, res) => {
  const { room, data } = req.body as BasicWsCallbackBody;

  if (Object.keys(data.meta.content).length !== 0) {
    console.log(`Meta doc in room "${room}" updated`);
  } else if (Object.keys(data.blocks.content).length !== 0) {
    console.log(`BlockSuite doc in room "${room}" updated`);
  }

  res.sendStatus(200);
});

// This port is the same as the port in the CALLBACK_URL in the file `.env.websocket`
const port = 5173;
ViteExpress.listen(app, 5173, () =>
  console.log(`Server listening at http://localhost:${port}`)
);
