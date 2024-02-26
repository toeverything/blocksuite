const BASE_URL = new URL(import.meta.env.PLAYGROUND_SERVER);
export async function generateRoomId(): Promise<string> {
  return fetch(new URL('/room/', BASE_URL), {
    method: 'post',
  })
    .then(res => res.json())
    .then(({ id }) => id);
}
