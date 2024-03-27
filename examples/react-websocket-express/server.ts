import express, { json } from 'express';
import ViteExpress from 'vite-express';

import { importJWK, SignJWT } from 'jose';
import { JSONFilePreset } from 'lowdb/node';
import { DocMeta } from '@blocksuite/store';

// Constants
const appName = 'blocksuite-example';
const port = 5173;
const authPrivateKey = await importJWK(
  JSON.parse(process.env.AUTH_PRIVATE_KEY ?? '')
);
// const authPublicKey = await importJWK(
//   JSON.parse(process.env.AUTH_PUBLIC_KEY ?? '')
// );

const db = await JSONFilePreset<{ docs: DocMeta[] }>('db.json', { docs: [] });
await db.read();
await db.write();

// Create http server
const app = express();
app.use(json());

// This example server always grants read-write permission to all requests.
// Modify it to your own needs or implement the same API in your own backend!
app.get('/auth/token', async (_, res) => {
  const token = await new SignJWT({
    yuserid: 'user1', // associate the client with a unique id that can will be used to check permissions
  })
    .setProtectedHeader({
      alg: 'ES384',
    })
    .setIssuer(appName)
    .setExpirationTime(Date.now() + 1000 * 60 * 60)
    .sign(authPrivateKey);
  //
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

  await db.read();
  if (db.data.docs.findIndex(doc => doc.id === yroom) === -1) {
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
  await db.read();
  res.json(db.data);
});

// create a new doc
app.post('/api/docs', async (req, res) => {
  const newDoc: DocMeta = req.body;

  await db.read();
  db.data.docs.push(newDoc);
  await db.write();

  res.status(201);
});

app.patch('/api/docs/:id/title', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (typeof title !== 'string') return res.status(400).send('Missing title');

  await db.read();
  const doc = db.data.docs.find(doc => doc.id === id);
  if (doc) {
    doc.title = title;
    await db.write();
    res.status(200).json(doc);
  } else {
    res.status(404).send('Document not found');
  }
});

// delete a existed doc
app.delete('/api/docs/:id', async (req, res) => {
  const docId = req.params.id;

  await db.read();
  db.data.docs = db.data.docs.filter(({ id }) => id !== docId);
  await db.write();

  res.send(`Document ${docId} removed`);
});

ViteExpress.listen(app, port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);
