import { WithDisposable } from '@blocksuite/lit';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('affine-pie-node')
export class PieNode extends WithDisposable(LitElement) {}
