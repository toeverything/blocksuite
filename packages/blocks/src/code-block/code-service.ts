import type { IService } from '../__internal__/index.js';

export class CodeBlockService implements IService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hljs: any;
  onLoad = async () => {
    // @ts-ignore
    this.hljs = await import('highlight.js');
  };
}
