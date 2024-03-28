import { DocMeta } from '@blocksuite/store';

export async function getAuth() {
  return (await fetch(`/auth/token`)).text();
}

export async function getDocMetas(): Promise<DocMeta[]> {
  const { docMetas } = await (await fetch(`/api/docs`)).json();
  return docMetas;
}

export async function createDoc(docMeta: DocMeta) {
  await fetch(`/api/docs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(docMeta),
  });
}

export async function deleteDoc(docId: string) {
  const res = await fetch(`/api/docs/${docId}`, {
    method: 'DELETE',
  });
  return res.status === 200;
}

export async function updateTitle(docId: string, title: string) {
  await fetch(`/api/docs/${docId}/title`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
}
