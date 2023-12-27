import './open-ai.js';
import './fal.js';
import './llama2.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { nanoid } from '@blocksuite/store';
import { computePosition } from '@floating-ui/dom';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { stopPropagation } from '../utils/selection-utils.js';
import { copilotConfig, type VendorConfig } from './copilot-config.js';
import { falVendor } from './fal.js';
import { openaiVendor } from './open-ai.js';
import {
  allKindService,
  type AllServiceKind,
  type ServiceImpl,
} from './service-base.js';

export const allVendor = [openaiVendor, falVendor];

@customElement('create-new-service')
export class CreateNewService extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  type!: string;
  @property({ attribute: false })
  onSave!: (config: VendorConfig) => void;
  @state()
  key = '';
  @state()
  name = '';
  @state()
  data?: unknown;

  changeKeyByEvent(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.changeKey(select.value);
  }

  get serviceKind() {
    return allKindService.find(v => v.type === this.type);
  }

  get serviceImpl() {
    return this.serviceKind?.getImpl(this.key);
  }

  changeKey(key: string) {
    this.key = key;
    this.data = this.serviceImpl?.vendor.initData();
  }

  changeName(e: Event) {
    const input = e.target as HTMLInputElement;
    this.name = input.value;
  }

  save() {
    if (!this.data || !this.serviceImpl) {
      return;
    }
    this.onSave({
      id: nanoid('unknown'),
      vendorKey: this.serviceImpl.vendor.key,
      name: this.name,
      data: this.data,
    });
  }

  close() {
    this.remove();
  }

  protected override render(): unknown {
    const serviceKind = allKindService.find(v => v.type === this.type);
    const list = serviceKind?.implList;
    if (!list) {
      requestAnimationFrame(() => {
        this.remove();
      });
      return;
    }
    const current = serviceKind?.getImpl(this.key);
    if (!current) {
      if (!list[0]) {
        return html` <div>no vendor</div>`;
      }
      this.changeKey(list[0].name);
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
            <select .value="${current.name}" @change="${this.changeKeyByEvent}">
              ${repeat(
                // @ts-ignore
                list,
                item => item.name,
                item =>
                  html` <option value="${item.vendor.key}">
                    ${item.vendor.key}
                  </option>`
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
            ${current.vendor.renderConfigEditor(this.data, () =>
              this.requestUpdate()
            )}
          </div>
          <div>
            <button @click="${this.save}">保存</button>
          </div>
        </div>
      </div>
    `;
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
  featureKey!: string;
  @property({ attribute: false })
  service!: AllServiceKind;

  changeService(e: Event) {
    const options = new VendorServiceOptions();
    options.featureKey = this.featureKey;
    options.service = this.service;
    options.close = () => {
      this.requestUpdate();
    };
    const target = e.target as HTMLElement;
    document.body.appendChild(options);
    computePosition(target, options)
      .then(pos => {
        options.style.left = `${pos.x}px`;
        options.style.top = `${pos.y}px`;
      })
      .catch(() => {
        options.remove();
      });
  }

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
  featureKey!: string;
  @property({ attribute: false })
  service!: AllServiceKind;
  @property({ attribute: false })
  close!: () => void;

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
}
