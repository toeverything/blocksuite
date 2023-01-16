import type { AsyncService } from '../__internal__/index.js';

export class CodeBlockService implements AsyncService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hljs: any;
  isLoaded = false;
  load = async () => {
    // @ts-ignore
    this.hljs = await import('highlight.js');
  };
}

export default CodeBlockService;
