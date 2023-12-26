import './open-ai.js';
import './fal.js';
import './llama2.js';

import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import { nanoid } from '@blocksuite/store';
import { html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { type ServiceConfig } from './copilot-config.js';
import { allKindService } from './service-base.js';

@customElement('create-new-service')
export class CreateNewService extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  type!: string;
  @property({ attribute: false })
  onSave!: (config: ServiceConfig) => void;
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
    this.data = this.serviceImpl?.initData();
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
      id: nanoid('unknown'),
      type: this.type,
      key: this.key,
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
        return html` <div>no service</div>`;
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
          style="display:flex;flex-direction: column;background-color: white;border-radius: 8px;padding: 24px;gap: 12px;"
        >
          <div>
            <select .value="${current.key}" @change="${this.changeKeyByEvent}">
              ${repeat(
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
}
