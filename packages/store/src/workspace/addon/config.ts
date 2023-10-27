import { addOnFactory } from './shared.js';

type ConfigKey = keyof BlockSuite.WorkspaceConfig;
type ConfigValue = BlockSuite.WorkspaceConfig[ConfigKey];
class ConfigManager {
  constructor() {}

  private _config = new Map<ConfigKey, ConfigValue>();

  set<K extends ConfigKey>(key: K, value: ConfigValue) {
    this._config.set(key, value);
  }

  get<K extends ConfigKey>(key: K) {
    return this._config.get(key) as BlockSuite.WorkspaceConfig[K];
  }
}

export interface ConfigAddon {
  config: ConfigManager;
}

export const config = addOnFactory<keyof ConfigAddon>(
  originalClass =>
    class extends originalClass {
      config = new ConfigManager();
    }
);

declare global {
  namespace BlockSuite {
    interface WorkspaceConfig {}
  }
}
