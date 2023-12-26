import type { AllServiceKind, GetMethod } from './service-base.js';

export type ServiceConfig = {
  id: string;
  type: string;
  key: string;
  name: string;
  data: unknown;
};
export type CopilotConfigDataType = {
  service: Record<string, string>;
  serviceConfigList: ServiceConfig[];
};

export class CopilotConfig {
  _config?: CopilotConfigDataType;

  loadFromLocalStorage() {
    try {
      return JSON.parse(localStorage.getItem('copilotConfig') ?? '');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return {};
    }
  }

  get config(): CopilotConfigDataType {
    if (!this._config) {
      this._config = Object.assign(
        {
          service: {},
          serviceConfigList: [],
        } satisfies CopilotConfigDataType,
        this.loadFromLocalStorage()
      ) as CopilotConfigDataType;
    }
    return this._config;
  }

  save() {
    localStorage.setItem('copilotConfig', JSON.stringify(this.config));
  }

  getConfigList(type: string): ServiceConfig[] {
    return this.config.serviceConfigList.filter(config => config.type === type);
  }

  getConfig(id: string): ServiceConfig | undefined {
    return this.config.serviceConfigList.find(config => config.id === id);
  }

  changeService(name: string, id: string) {
    this.config.service[name] = id;
    this.save();
  }

  public addService(config: ServiceConfig) {
    this.config.serviceConfigList.push(config);
    this.save();
  }

  public getService<T extends AllServiceKind>(serviceKind: T): GetMethod<T> {
    const id = this.config.service[serviceKind.type];
    const config = this.config.serviceConfigList.find(v => v.id === id);
    if (!config) {
      throw new Error('no config');
    }
    const impl = serviceKind.getImpl(config.key);
    const method = impl?.method(config.data as never);
    return method as GetMethod<T>;
  }
}

export const copilotConfig = new CopilotConfig();
