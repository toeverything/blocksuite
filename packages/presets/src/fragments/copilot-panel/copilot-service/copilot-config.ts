import type { AllServiceKind, GetMethod, ServiceImpl } from './service-base.js';

export type VendorConfig = {
  id: string;
  vendorKey: string;
  name: string;
  data: unknown;
};
type ServiceType = string;
export type ServiceConfigMap = Record<
  ServiceType,
  {
    vendorId: string;
    implName: string;
  }
>;
export type CopilotConfigDataType = {
  feature: Record<string, ServiceConfigMap>;
  vendors: VendorConfig[];
};

type VendorPack<T extends AllServiceKind> = {
  vendor: VendorConfig;
  impl: ServiceImpl<GetMethod<T>, unknown>;
};

/**
 * A simple PRNG, using a linear congruential generator.
 * reference link: https://en.wikipedia.org/wiki/Linear_congruential_generator
 */
class SimplePRNG {
  constructor(private seed: number) {}

  next() {
    const a = 1664525;
    const c = 1013904223;
    const m = 2 ** 32;
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }
}

function shuffleArray(array: number[], seed: number) {
  const prng = new SimplePRNG(seed);
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng.next() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function decode(encodedStr: string, seed: number) {
  const indexArray = Array.from(encodedStr).map((_, index) => index);
  shuffleArray(indexArray, seed);
  const inverseIndexArray = indexArray
    .map((originalIndex, newIndex) => [originalIndex, newIndex])
    .sort((a, b) => a[0] - b[0])
    .map(pair => pair[1]);
  return inverseIndexArray.map(index => encodedStr[index]).join('');
}

const seed = 1234567890;

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

  loadVendorFromUrl() {
    const result: VendorConfig[] = [];
    const params = new URLSearchParams(window.location.search);
    const openAIKey = params.get('openai');

    if (openAIKey) {
      result.push({
        id: 'url-openai',
        vendorKey: 'OpenAI',
        name: 'url',
        data: {
          apiKey: 'sk-' + decode(openAIKey, seed),
        },
      });
    }
    const falKey = params.get('fal');
    if (falKey) {
      result.push({
        id: 'url-fal',
        vendorKey: 'Fal',
        name: 'url',
        data: {
          apiKey: falKey,
        },
      });
    }
    const llamaUrl = params.get('llama');
    if (llamaUrl) {
      result.push({
        id: 'url-llama',
        vendorKey: 'llama',
        name: 'url',
        data: {
          host: llamaUrl,
        },
      });
    }
    return result;
  }

  get config(): CopilotConfigDataType {
    if (!this._config) {
      this._config = Object.assign(
        {
          feature: {},
          vendors: [],
        } satisfies CopilotConfigDataType,
        this.loadFromLocalStorage()
      ) as CopilotConfigDataType;
    }
    return {
      ...this._config,
      vendors: [
        ...this._config.vendors.filter(v => v.name != 'url'),
        ...this.loadVendorFromUrl(),
      ],
    };
  }

  save() {
    localStorage.setItem('copilotConfig', JSON.stringify(this.config));
  }

  changeService(
    featureKey: string,
    serviceType: string,
    vendorId: string,
    implName: string
  ) {
    this.config.feature[featureKey] = this.config.feature[featureKey] ?? {};
    this.config.feature[featureKey][serviceType] = {
      vendorId,
      implName,
    };
    this.save();
  }

  addVendor(config: VendorConfig) {
    this._config?.vendors.push(config);
    this.save();
  }

  getVendor<T extends AllServiceKind>(
    featureKey: string,
    serviceKind: T
  ): VendorPack<T> | undefined {
    const config = this.config.feature[featureKey] ?? {};
    const serviceConfig = config[serviceKind.type];
    const vendor =
      serviceConfig &&
      this.config.vendors.find(v => v.id === serviceConfig.vendorId);
    if (vendor) {
      const impl = serviceKind.getImpl(serviceConfig.implName);
      return {
        vendor,
        impl: impl as never,
      };
    } else {
      return this.getVendorsByService(serviceKind)[0];
    }
  }

  getService<T extends AllServiceKind>(
    featureKey: string,
    serviceKind: T
  ): GetMethod<T> {
    const vendorPack = this.getVendor(featureKey, serviceKind);
    if (!vendorPack) {
      throw new Error(`no vendor for ${serviceKind.type}`);
    }
    const method = vendorPack.impl.method(vendorPack.vendor.data);
    return method as GetMethod<T>;
  }

  getVendorsByService<T extends AllServiceKind>(
    serviceKind: T
  ): VendorPack<T>[] {
    return this.config.vendors.flatMap(vendor => {
      return serviceKind.implList
        .filter(impl => impl.vendor.key === vendor.vendorKey)
        .map(impl => {
          return {
            vendor: vendor,
            impl: impl as never,
          };
        });
    });
  }
}

export const copilotConfig = new CopilotConfig();
