import type { Block, GraphElement, Point } from '@blocksuite/connector';
import { Graph, search } from '@blocksuite/connector';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;

async function draw(blocks: Block[], start: Point, end: Point) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 600, 400);
  ctx.lineWidth = 1;

  const graph = new Graph(blocks, start, end);
  // @ts-expect-error global variable for debug
  window.graph = graph;

  const { cols, rows } = graph.grid as { cols: number[]; rows: number[] };

  const minX = cols[0];
  const maxX = cols[cols.length - 1];
  const minY = rows[0];
  const maxY = rows[rows.length - 1];

  const scale = Math.max((maxX - minX) / 500, (maxY - minY) / 300);
  // const scale = 0.5;

  function normalizePoint(x: number, y: number): [number, number] {
    return [(x - minX) / scale + 50, (y - minY) / scale + 50];
  }

  function normalizeRect(
    x: number,
    y: number,
    w: number,
    h: number
  ): [number, number, number, number] {
    return [...normalizePoint(x, y), w / scale, h / scale];
  }

  /* draw grid start */
  cols.forEach(col => {
    ctx.moveTo(...normalizePoint(col, minY));
    ctx.lineTo(...normalizePoint(col, maxY));
  });

  rows.forEach(row => {
    ctx.moveTo(...normalizePoint(minX, row));
    ctx.lineTo(...normalizePoint(maxX, row));
  });

  ctx.strokeStyle = '#ddd';
  ctx.stroke();
  /* draw grid end */
  await new Promise(res => setTimeout(res, 100));

  /* draw block start */
  ctx.beginPath();
  blocks.forEach(b => {
    const { x, y, w, h } = b;
    ctx.rect(...normalizeRect(x, y, w, h));
  });
  ctx.strokeStyle = '#f00';
  ctx.stroke();
  /* draw block end */
  await new Promise(res => setTimeout(res, 100));

  /* draw connector path start */
  const startElement = graph.getElement(start.x, start.y) as GraphElement;
  const endElement = graph.getElement(end.x, end.y) as GraphElement;
  const path = search(graph, startElement, endElement);
  console.log('path', { path, startElement, endElement });

  ctx.beginPath();
  ctx.moveTo(...normalizePoint(start.x, start.y));
  path.forEach((p: GraphElement) => {
    const xVal = cols[p.x];
    const yVal = rows[p.y];
    ctx.lineTo(...normalizePoint(xVal, yVal));
  });
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 4;
  ctx.stroke();
  /* draw connector path end */

  /* draw finding process start */
  for (let i = 0; i < graph.debugStack.length; i++) {
    const s = graph.debugStack[i];
    await new Promise(res => setTimeout(res, 100));
    const xVal = cols[s.x];
    const yVal = rows[s.y];
    ctx.beginPath();
    ctx.ellipse(...normalizePoint(xVal, yVal), 1, 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillText(`${i}:${s.f}`, ...normalizePoint(xVal, yVal));
  }
  /* draw finding process start */
}

async function main() {
  await draw(
    [
      { x: 10, y: 10, w: 10, h: 10 },
      { x: 30, y: 30, w: 10, h: 10 },
    ],
    { x: 15, y: 10 },
    { x: 40, y: 35 }
  );
  await new Promise(res => setTimeout(res, 1000));

  await draw(
    [
      { x: 10, y: 10, w: 100, h: 100 },
      { x: 30, y: 30, w: 100, h: 100 },
    ],
    { x: 20, y: 10 },
    { x: 30, y: 50 }
  );
  await new Promise(res => setTimeout(res, 1000));

  await draw(
    [
      { x: 10, y: 10, w: 100, h: 100 },
      { x: 30, y: 30, w: 50, h: 50 },
    ],
    { x: 10, y: 10 },
    { x: 30, y: 50 }
  );
  await new Promise(res => setTimeout(res, 1000));

  await draw(
    [
      { x: 10, y: 10, w: 100, h: 100 },
      { x: 30, y: 30, w: 100, h: 100 },
    ],
    { x: 130, y: 80 },
    { x: 10, y: 50 }
  );
}

main();
