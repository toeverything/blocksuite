import 'dotenv/config';
import express, { json } from 'express';
import ViteExpress from 'vite-express';

import * as jwt from 'lib0/crypto/jwt';
import * as ecdsa from 'lib0/crypto/ecdsa';
import { DocMeta } from '@blocksuite/store';
import * as fs from 'fs/promises';
import { JSONDatabase } from './db.js';

// Constants
const appName = 'blocksuite-example';
const port = 5173;
const authPrivateKey = await ecdsa.importKeyJwk(
  JSON.parse(process.env.AUTH_PRIVATE_KEY ?? '')
);
// const authPublicKey = await ecdsa.importKeyJwk(
//   JSON.parse(process.env.AUTH_PUBLIC_KEY ?? '')
// );

const dbFile = 'db.json';
const db = await JSONDatabase.init('db.json');

// Create http server
const app = express();
app.use(json());

// This example server always grants read-write permission to all requests.
// Modify it to your own needs or implement the same API in your own backend!
app.get('/auth/token', async (_, res) => {
  const token = await jwt.encodeJwt(authPrivateKey, {
    iss: appName,
    exp: Date.now() + 1000 * 60 * 60, // access expires in an hour
    yuserid: 'user1', // associate the client with a unique id that can will be used to check permissions
  });

  res.send(token);
});

// This endpoint is called in regular intervals when the document changes.
// The request contains a multi-part formdata field that can be read, for example, with formidable:
app.use('/ydoc/:room', async (_, res) => {
  //   const room = req.params.room;

  res.sendStatus(200);
});

// This api is called to check whether a specific user (identified by the unique "yuserid") has
// access to a specific room. This rest endpoint is called by the yredis server, not the client.
app.get('/auth/perm/:room/:userid', async (req, res) => {
  const yroom = req.params.room;
  const yuserid = req.params.userid;

  let yaccess = 'rw';

  if ((await db.getDocMeta(yroom)) === null) {
    yaccess = 'no-access';
  }

  // This sample-server always grants full acess
  res.send(
    JSON.stringify({
      yroom,
      yaccess, // alternatively, specify "read-only" or "no-access"
      yuserid,
    })
  );
});

app.get('/api/docs', async (_, res) => {
  res.json(await db.getDocMetas());
});

// create a new doc
app.post('/api/docs', async (req, res) => {
  const newDoc: DocMeta = req.body;

  const result = await db.addDocMeta(newDoc);
  if (result) {
    res.status(201).json(result);
  } else {
    res.status(500).send('Failed to create document');
  }
});

app.patch('/api/docs/:id/title', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (typeof title !== 'string') return res.status(400).send('Missing title');

  const result = await db.updateDocMeta(id, { title });

  if (result) {
    res.json(result);
  } else {
    res.status(500).send('Failed to update document');
  }
});

// delete a existed doc
app.delete('/api/docs/:id', async (req, res) => {
  const docId = req.params.id;

  const success = await db.deleteDocMeta(docId);
  if (!success) {
    res.status(404).send(`Document ${docId} not found`);
  }
  res.send(`Document ${docId} removed`);
});

ViteExpress.listen(app, port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);

process.on('exit', async () => {
  await fs.unlink(dbFile);
});
