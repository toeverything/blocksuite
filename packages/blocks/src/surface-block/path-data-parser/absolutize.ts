import type { Segment } from './parser.js';

// Translate relative commands to absolute commands
export function absolutize(segments: Segment[]): Segment[] {
  let cx = 0,
    cy = 0;
  let subx = 0,
    suby = 0;
  const out: Segment[] = [];
  for (const { data, key } of segments) {
    switch (key) {
      case 'M':
        out.push({ data: [...data], key: 'M' });
        [cx, cy] = data;
        [subx, suby] = data;
        break;
      case 'm':
        cx += data[0];
        cy += data[1];
        out.push({ data: [cx, cy], key: 'M' });
        subx = cx;
        suby = cy;
        break;
      case 'L':
        out.push({ data: [...data], key: 'L' });
        [cx, cy] = data;
        break;
      case 'l':
        cx += data[0];
        cy += data[1];
        out.push({ data: [cx, cy], key: 'L' });
        break;
      case 'C':
        out.push({ data: [...data], key: 'C' });
        cx = data[4];
        cy = data[5];
        break;
      case 'c': {
        const newdata = data.map((d, i) => (i % 2 ? d + cy : d + cx));
        out.push({ data: newdata, key: 'C' });
        cx = newdata[4];
        cy = newdata[5];
        break;
      }
      case 'Q':
        out.push({ data: [...data], key: 'Q' });
        cx = data[2];
        cy = data[3];
        break;
      case 'q': {
        const newdata = data.map((d, i) => (i % 2 ? d + cy : d + cx));
        out.push({ data: newdata, key: 'Q' });
        cx = newdata[2];
        cy = newdata[3];
        break;
      }
      case 'A':
        out.push({ data: [...data], key: 'A' });
        cx = data[5];
        cy = data[6];
        break;
      case 'a':
        cx += data[5];
        cy += data[6];
        out.push({
          data: [data[0], data[1], data[2], data[3], data[4], cx, cy],
          key: 'A',
        });
        break;
      case 'H':
        out.push({ data: [...data], key: 'H' });
        cx = data[0];
        break;
      case 'h':
        cx += data[0];
        out.push({ data: [cx], key: 'H' });
        break;
      case 'V':
        out.push({ data: [...data], key: 'V' });
        cy = data[0];
        break;
      case 'v':
        cy += data[0];
        out.push({ data: [cy], key: 'V' });
        break;
      case 'S':
        out.push({ data: [...data], key: 'S' });
        cx = data[2];
        cy = data[3];
        break;
      case 's': {
        const newdata = data.map((d, i) => (i % 2 ? d + cy : d + cx));
        out.push({ data: newdata, key: 'S' });
        cx = newdata[2];
        cy = newdata[3];
        break;
      }
      case 'T':
        out.push({ data: [...data], key: 'T' });
        cx = data[0];
        cy = data[1];
        break;
      case 't':
        cx += data[0];
        cy += data[1];
        out.push({ data: [cx, cy], key: 'T' });
        break;
      case 'Z':
      case 'z':
        out.push({ data: [], key: 'Z' });
        cx = subx;
        cy = suby;
        break;
    }
  }
  return out;
}
