import { throttle } from '@blocksuite/blocks';
import type { CreateGraphReturned } from '@blocksuite/connector';
import { createGraph, Rectangle, search } from '@blocksuite/connector';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;
const PADDING = 50;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function createRenderer(options: CreateGraphReturned) {
  const { rectangles, points, rulers, nodes, graph } = options;
  const { columns, rows } = rulers;

  const stageBound = canvas?.getBoundingClientRect() as DOMRect;

  const minX = columns[0];
  const maxX = columns[columns.length - 1];
  const minY = rows[0];
  const maxY = rows[rows.length - 1];

  // const scale = Math.max(
  //   (maxX - minX) / (stageBound.width - PADDING * 2),
  //   (maxY - minY) / (stageBound.height - PADDING * 2)
  // );
  const scale = 1;

  function normalizePoint(x: number, y: number): [number, number] {
    return [x / scale + PADDING, y / scale + PADDING];
  }

  function normalizeRect(
    x: number,
    y: number,
    w: number,
    h: number
  ): [number, number, number, number] {
    return [...normalizePoint(x, y), w / scale, h / scale];
  }

  return {
    clear() {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    },
    renderRulers() {
      ctx.save();
      const path = new Path2D();
      columns.forEach(col => {
        path.moveTo(...normalizePoint(col, minY - PADDING));
        path.lineTo(...normalizePoint(col, maxY + PADDING));
      });

      rows.forEach(row => {
        path.moveTo(...normalizePoint(minX - PADDING, row));
        path.lineTo(...normalizePoint(maxX + PADDING, row));
      });

      ctx.strokeStyle = '#ddd';
      ctx.setLineDash([4, 4]);
      ctx.lineDashOffset = 4;
      ctx.stroke(path);
      ctx.restore();
    },
    renderRectangles() {
      ctx.save();
      const path = new Path2D();
      rectangles.forEach(rect => {
        const { x, y, w, h } = rect;
        path.rect(...normalizeRect(x, y, w, h));
      });
      ctx.fillStyle = 'rgba(0, 0, 256, 0.5)';
      ctx.fill(path);
      ctx.restore();
    },
    renderPoints() {
      ctx.save();
      const path = new Path2D();
      points.forEach(p => {
        path.ellipse(...normalizePoint(p.x, p.y), 4, 4, 0, 0, Math.PI * 2);
      });
      ctx.fillStyle = 'rgba(256, 0, 0)';
      ctx.fill(path);
      ctx.restore();
    },
    renderNodes() {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 256, 0)';
      nodes.forEach(n => {
        const path = new Path2D();
        path.ellipse(...normalizePoint(n.x, n.y), 4, 4, 0, 0, Math.PI * 2);
        ctx.fill(path);
      });
      ctx.restore();
    },
    renderGraphConnections() {
      ctx.save();
      const path = new Path2D();
      graph.connections.forEach(([a, b]) => {
        path.moveTo(...normalizePoint(a.x, a.y));
        path.lineTo(...normalizePoint(b.x, b.y));
      });
      ctx.strokeStyle = '#333';
      ctx.stroke(path);
      ctx.restore();
    },
    renderPath() {
      ctx.save();
      const start = graph.nodes[`${points[0].x}:${points[0].y}`];
      const end = graph.nodes[`${points[1].x}:${points[1].y}`];
      const path = search(graph, start, end);
      console.log(path);
      const path2d = new Path2D();
      path2d.moveTo(...normalizePoint(start.x, start.y));
      path.forEach(p => {
        path2d.lineTo(...normalizePoint(p.x, p.y));
      });
      ctx.strokeStyle = '#0ff';
      ctx.lineWidth = 4;
      ctx.stroke(path2d);
      ctx.restore();
    },
  };
}

async function _render(rects: Rectangle[], points: { x: number; y: number }[]) {
  const g = createGraph(rects, points);
  // @ts-expect-error global variable for testing
  window.g = g;

  const renderer = createRenderer(g);
  renderer.clear();
  renderer.renderRulers();
  renderer.renderRectangles();
  renderer.renderNodes();
  renderer.renderPoints();
  renderer.renderGraphConnections();
  renderer.renderPath();
}
const render = throttle(_render, 50);

async function main() {
  const rect0 = new Rectangle(30, 30, 200, 200);
  const rect1 = new Rectangle(160, 160, 300, 300);
  const point0 = { x: 80, y: 30 };
  const point1 = { x: 160, y: 210 };
  render([rect0, rect1], [point0, point1]);

  canvas.addEventListener('mousedown', mouseDownEvent => {
    let lastX = mouseDownEvent.x;
    let lastY = mouseDownEvent.y;
    const rect = [rect0, rect1].find(r => r.contains(lastX, lastY));
    if (rect) {
      const mousemove = (mouseMoveEvent: MouseEvent) => {
        const deltaX = mouseMoveEvent.x - lastX;
        const deltaY = mouseMoveEvent.y - lastY;
        rect.x = rect.x + deltaX;
        rect.y = rect.y + deltaY;
        lastX = mouseMoveEvent.x;
        lastY = mouseMoveEvent.y;
        render(
          [rect0, rect1],
          [
            {
              x: rect0.x + rect0.w / 2,
              y: rect0.y,
            },
            {
              x: rect1.x,
              y: rect1.y + rect1.h / 2,
            },
          ]
        );
      };
      const mouseup = () => {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
      };
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
    }
  });
}

main();
