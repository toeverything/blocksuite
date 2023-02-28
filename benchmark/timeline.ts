/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFile } from 'fs/promises';

interface Timingresult {
  type: string;
  ts: number;
  dur: number;
  end: number;
  mem?: number;
  evt?: unknown;
}

export function extractRelevantEvents(entries: any[]) {
  const filteredEvents: Timingresult[] = [];

  entries.forEach(x => {
    const e = x;
    if (e.name === 'EventDispatch') {
      if (e.args.data.type === 'click') {
        filteredEvents.push({
          type: 'click',
          ts: +e.ts,
          dur: +e.dur,
          end: +e.ts + e.dur,
        });
      }
    } else if (e.name === 'CompositeLayers' && e.ph === 'X') {
      filteredEvents.push({
        type: 'compositelayers',
        ts: +e.ts,
        dur: +e.dur,
        end: +e.ts + e.dur,
        evt: JSON.stringify(e),
      });
    } else if (e.name === 'Layout' && e.ph === 'X') {
      filteredEvents.push({
        type: 'layout',
        ts: +e.ts,
        dur: +e.dur,
        end: +e.ts + e.dur,
        evt: JSON.stringify(e),
      });
    } else if (e.name === 'Paint' && e.ph === 'X') {
      filteredEvents.push({
        type: 'paint',
        ts: +e.ts,
        dur: +e.dur,
        end: +e.ts + e.dur,
        evt: JSON.stringify(e),
      });
    } else if (e.name === 'FireAnimationFrame' && e.ph === 'X') {
      filteredEvents.push({
        type: 'fireAnimationFrame',
        ts: +e.ts,
        dur: +e.dur,
        end: +e.ts + e.dur,
        evt: JSON.stringify(e),
      });
    } else if (e.name === 'UpdateLayoutTree' && e.ph === 'X') {
      filteredEvents.push({
        type: 'updateLayoutTree',
        ts: +e.ts,
        dur: +e.dur,
        end: +e.ts + e.dur,
        evt: JSON.stringify(e),
      });
    } else if (e.name === 'RequestAnimationFrame') {
      filteredEvents.push({
        type: 'requestAnimationFrame',
        ts: +e.ts,
        dur: 0,
        end: +e.ts,
        evt: JSON.stringify(e),
      });
    }
  });
  return filteredEvents;
}

async function fetchEventsFromPerformanceLog(
  fileName: string
): Promise<Timingresult[]> {
  let timingResults: Timingresult[] = [];
  const entries = [];
  do {
    const contents = await readFile(fileName, { encoding: 'utf8' });
    const json = JSON.parse(contents);
    const entries = json['traceEvents'];
    const filteredEvents = extractRelevantEvents(entries);
    timingResults = timingResults.concat(filteredEvents);
  } while (entries.length > 0);
  return timingResults;
}

function type_eq(requiredType: string) {
  return (e: Timingresult) => e.type === requiredType;
}

export async function computeResultsCPU(fileName: string): Promise<number> {
  const perfLogEvents = await fetchEventsFromPerformanceLog(fileName);
  const eventsDuringBenchmark = perfLogEvents.sort(
    (a, b) => (a.end ?? 0) - (b.end ?? 0)
  );

  const layouts = eventsDuringBenchmark.filter(type_eq('layout'));
  const paints = eventsDuringBenchmark.filter(type_eq('paint'));

  const lastPaint = paints[paints.length - 1];
  const firstLayout = layouts[0];

  // last paint to first layout
  const duration = (lastPaint.end - firstLayout.ts) / 1000.0;

  const fafs = eventsDuringBenchmark.filter(type_eq('fireAnimationFrame'));

  // console.log('faf', fafs.length);
  // console.log('paint', paints.length);
  // console.log('layout', layouts.length);

  return duration;
}
