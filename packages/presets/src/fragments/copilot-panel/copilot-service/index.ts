import './open-ai.js';
import './fal.js';
import './llama2.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/block-std';
import { nanoid } from '@blocksuite/store';
import { computePosition } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../utils/selection-utils.js';
import { copilotConfig, type VendorConfig } from './copilot-config.js';
import { falVendor } from './fal.js';
import { llama2Vendor } from './llama2.js';
import { openaiVendor } from './open-ai.js';
import {
  allKindService,
  type AllServiceKind,
  type ServiceImpl,
  type Vendor,
} from './service-base.js';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const allVendor: Vendor<any>[] = [openaiVendor, falVendor, llama2Vendor];

@customElement('create-new-service')
export class CreateNewService extends WithDisposable(ShadowlessElement) {
  get serviceKind() {
    return allKindService.find(v => v.type === this.type);
  }

  @property({ attribute: false })
  accessor type!: string;

  @property({ attribute: false })
  accessor onSave!: (config: VendorConfig) => void;

  @state()
  accessor key = '';

  @state()
  accessor name = '';

  @state()
  accessor data: unknown | undefined = undefined;

  protected override render(): unknown {
    const list = this.list();
    if (!list) {
      requestAnimationFrame(() => {
        this.remove();
      });
      return;
    }
    const current = allVendor.find(v => v.key === this.key);
    if (!current) {
      if (!list[0]) {
        return html` <div>no vendor</div>`;
      }
      this.changeKey(list[0].key);
      requestAnimationFrame(() => {
        this.requestUpdate();
      });
      return;
    }
    return html`
      <div
        @click="${this.close}"
        style="position: fixed;left: 0;top: 0;width: 100vw;height: 100vh;background-color: rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;"
      >
        <div
          @click="${stopPropagation}"
          style="display:flex;flex-direction: column;background-color: white;border-radius: 8px;padding: 24px;gap: 12px;"
        >
          <div>
            <select .value="${current.key}" @change="${this.changeKeyByEvent}">
              ${repeat(
                // @ts-ignore
                list,
                item => item.key,
                item => html` <option value="${item.key}">${item.key}</option>`
              )}
            </select>
          </div>
          <div>
            <label>Name: </label>
            <input
              type="text"
              .value="${this.name}"
              @input="${this.changeName}"
            />
          </div>
          <div>
            ${current.renderConfigEditor(this.data, () => this.requestUpdate())}
          </div>
          <div>
            <button @click="${this.save}">保存</button>
          </div>
        </div>
      </div>
    `;
  }

  changeKeyByEvent(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.changeKey(select.value);
  }

  changeKey(key: string) {
    this.key = key;
    this.data = allVendor.find(v => v.key === key)?.initData();
  }

  changeName(e: Event) {
    const input = e.target as HTMLInputElement;
    this.name = input.value;
  }

  save() {
    if (!this.data) {
      return;
    }
    this.onSave({
      id: nanoid(),
      vendorKey: this.key,
      name: this.name,
      data: this.data,
    });
  }

  close() {
    this.remove();
  }

  list() {
    const set = new Set<Vendor<unknown>>();
    allKindService
      .find(v => v.type === this.type)
      ?.implList.forEach(v => {
        set.add(v.vendor);
      });
    return [...set];
  }
}

@customElement('vendor-service-select')
export class VendorServiceSelect extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .vendor-service-select {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 12px;
      color: white;
      width: max-content;
      cursor: pointer;
    }
  `;

  @property({ attribute: false })
  accessor featureKey!: string;

  @property({ attribute: false })
  accessor service!: AllServiceKind;

  protected override render(): unknown {
    const list = copilotConfig.getVendorsByService(this.service);
    if (!list) {
      return html` <div style="font-size: 12px;color: red">no service</div>`;
    }
    const current = copilotConfig.getVendor(this.featureKey, this.service);
    if (!current) {
      return html` <div style="font-size: 12px;color: red">no vendor</div>`;
    }
    const style = styleMap({
      border: '1px solid',
      borderColor: current.impl.vendor.color,
      color: current.impl.vendor.color,
    });
    return html`
      <div
        @click="${this.changeService}"
        class="vendor-service-select"
        style="${style}"
      >
        ${current.vendor.name} ${current.impl.vendor.key} ${current.impl.name}
      </div>
    `;
  }

  changeService(e: Event) {
    const options = new VendorServiceOptions();
    options.featureKey = this.featureKey;
    options.service = this.service;
    options.close = () => {
      this.requestUpdate();
    };
    const target = e.target as HTMLElement;
    document.body.append(options);
    computePosition(target, options)
      .then(pos => {
        options.style.left = `${pos.x}px`;
        options.style.top = `${pos.y}px`;
      })
      .catch(() => {
        options.remove();
      });
  }
}

@customElement('vendor-service-options')
export class VendorServiceOptions extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    vendor-service-options {
      position: fixed;
      font-family: var(--affine-font-family);
    }

    .vendor-service-option {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 12px;
      color: white;
      width: max-content;
      cursor: pointer;
    }
  `;

  @property({ attribute: false })
  accessor featureKey!: string;

  @property({ attribute: false })
  accessor service!: AllServiceKind;

  @property({ attribute: false })
  accessor close!: () => void;

  protected override render(): unknown {
    const list = copilotConfig.getVendorsByService(this.service);
    return html`
      <div
        style="background-color: var(--affine-background-overlay-panel-color);padding: 12px;display:flex;flex-direction: column;gap: 8px;"
      >
        ${repeat(list, item => {
          const style = styleMap({
            backgroundColor: item.impl.vendor.color,
          });
          const select = () => {
            this.select(item.vendor, item.impl);
          };
          return html` <div
            @click="${select}"
            class="vendor-service-option"
            style="${style}"
          >
            ${item.vendor.name} ${item.impl.vendor.key} ${item.impl.name}
          </div>`;
        })}
      </div>
    `;
  }

  select(vendor: VendorConfig, impl: ServiceImpl<unknown, unknown>) {
    copilotConfig.changeService(
      this.featureKey,
      this.service.type,
      vendor.id,
      impl.name
    );
    this.remove();
    this.close();
  }
}
