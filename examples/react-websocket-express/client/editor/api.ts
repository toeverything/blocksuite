import { DocMeta } from '@blocksuite/store';

export class ApiClient {
  constructor(readonly baseUrl: string) {}

  async getAuth() {
    return (await fetch(`${this.baseUrl}/auth/token`)).text();
  }

  async getDocMetas(): Promise<DocMeta[]> {
    const { docs } = await (await fetch(`${this.baseUrl}/api/docs`)).json();
    return docs;
  }

  async createDoc(): Promise<DocMeta> {
    return (await fetch(`${this.baseUrl}/api/docs`, { method: 'POST' })).json();
  }

  async deleteDoc(docId: string) {
    const res = await fetch(`${this.baseUrl}/api/docs/${docId}`, {
      method: 'DELETE',
    });
    return res.status === 200;
  }

  async updateTitle(docId: string, title: string) {
    await fetch(`${this.baseUrl}/api/docs/${docId}/title`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
  }
}
