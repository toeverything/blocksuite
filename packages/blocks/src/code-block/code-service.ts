import { BaseService } from '../__internal__/service.js';

export class CodeBlockService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hljs: any;
  onLoad = async () => {
    // @ts-ignore
    this.hljs = await import('highlight.js');
  };
}
