import { PriorityQueue } from '@datastructures-js/priority-queue';

interface CrawlerQueueItem {
  priority: number;
  id: string;
}

interface Crawler {
  init(scheduler: CrawlerScheduler): Promise<void>;

  revaluate(id: string, scheduler: CrawlerScheduler): Promise<void>;
}

export class CrawlerScheduler {
  constructor(private readonly behavior: Crawler) {}

  PRIORITY_HIGH = 10;
  PRIORITY_LOW = 0;

  queue = new PriorityQueue<CrawlerQueueItem>(
    (a, b) => b.priority - a.priority,
    []
  );

  async init() {
    await this.behavior.init(this);
  }

  requestRevaluate(id: string, priority: number = this.PRIORITY_HIGH) {
    this.queue.push({ priority, id });
  }

  enqueue(id: string) {
    this.queue.remove(item => item.id === id);
  }

  async crawl() {
    const item = this.queue.pop();

    if (item) {
      await this.behavior.revaluate(item.id, this);
    }

    return !!item;
  }
}
