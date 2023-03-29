import { throttle } from '@blocksuite/blocks';
import type { CreateGraphReturned, Point } from '@blocksuite/connector';
import {
  aStarRoute,
  createGraph,
  Rectangle,
  simplifyPath,
} from '@blocksuite/connector';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;
const PADDING = 50;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const directionButton = document.querySelector('.direction') as HTMLDivElement;

function createRenderer(options: CreateGraphReturned) {
  const { rectangles, points, rulers, nodes, graph } = options;
  const { columns, rows } = rulers;

  const minX = columns[0];
  const maxX = columns[columns.length - 1];
  const minY = rows[0];
  const maxY = rows[rows.length - 1];

  const scale = 1;

  function normalizePoint(x: number, y: number): [number, number] {
    return [x / scale, y / scale];
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
      const start = graph.getNode(points[0]);
      const end = graph.getNode(points[1]);
      const path = aStarRoute(graph, start, end);
      console.log(path, simplifyPath(path));
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

async function _render(rects: Rectangle[], points: Point[]) {
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

function getPoints(rects: Rectangle[], directions: Record<string, string>) {
  const points = rects.map(r => {
    const d = directions[r.id];
    switch (d) {
      case 'top': {
        return { x: r.x + r.w / 2, y: r.y };
      }
      case 'right': {
        return { x: r.x + r.w, y: r.y + r.h / 2 };
      }
      case 'bottom': {
        return { x: r.x + r.w / 2, y: r.y + r.h };
      }
      case 'left': {
        return { x: r.x, y: r.y + r.h / 2 };
      }
    }
    return null;
  });
  return points.filter(p => !!p) as Point[];
}

async function main() {
  const rect0 = new Rectangle(30, 30, 200, 200);
  const rect1 = new Rectangle(160, 160, 300, 300);
  const rects = [rect0, rect1];
  const directions = {
    [rect0.id]: 'top',
    [rect1.id]: 'left',
  };

  render(rects, getPoints(rects, directions));

  canvas.addEventListener('mousedown', mouseDownEvent => {
    let lastX = mouseDownEvent.x;
    let lastY = mouseDownEvent.y;
    const rect = rects.find(r => r.contains(lastX, lastY));
    if (rect) {
      const mousemove = (mouseMoveEvent: MouseEvent) => {
        const deltaX = mouseMoveEvent.x - lastX;
        const deltaY = mouseMoveEvent.y - lastY;
        rect.x = rect.x + deltaX;
        rect.y = rect.y + deltaY;
        lastX = mouseMoveEvent.x;
        lastY = mouseMoveEvent.y;
        render(rects, getPoints(rects, directions));
      };
      const mouseup = () => {
        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);
      };
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
    }
  });

  let hoveredRect: Rectangle | null = null;
  directionButton.addEventListener('click', (e: MouseEvent) => {
    if (hoveredRect && e.target) {
      const direction = (e.target as HTMLDivElement).className;
      directions[hoveredRect.id] = direction;
      render(rects, getPoints(rects, directions));
    }
  });

  canvas.addEventListener('mousemove', e => {
    const rect = rects.find(r => r.contains(e.x, e.y));

    if (rect) {
      directionButton.style.left = `${rect.x}px`;
      directionButton.style.top = `${rect.y}px`;
      directionButton.style.width = `${rect.w}px`;
      directionButton.style.height = `${rect.h}px`;
      directionButton.style.display = 'block';
      hoveredRect = rect;
    } else {
      directionButton.style.display = 'none';
      hoveredRect = null;
    }
  });
}

main();
