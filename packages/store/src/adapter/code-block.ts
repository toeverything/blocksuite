import type { DeltaInsert } from '@blocksuite/virgo/types';

import type { BlockSnapshot, PageSnapshot, SliceSnapshot } from '../index.js';
import {
  BaseAdapter,
  type FromBlockSnapshotPayload,
  type FromBlockSnapshotResult,
  type FromPageSnapshotPayload,
  type FromPageSnapshotResult,
  type FromSliceSnapshotPayload,
  type FromSliceSnapshotResult,
  type ToBlockSnapshotPayload,
  type ToPageSnapshotPayload,
  type ToSliceSnapshotPayload,
} from './base.js';

export class CodeBlockAdapter extends BaseAdapter<string> {
  override toSliceSnapshot(
    _payload: ToSliceSnapshotPayload<string>
  ): Promise<SliceSnapshot> {
    throw new Error('not implemented.');
  }
  override fromPageSnapshot(
    _payload: FromPageSnapshotPayload
  ): Promise<FromPageSnapshotResult<string>> {
    throw new Error('not implemented');
  }

  override toPageSnapshot(
    _payload: ToPageSnapshotPayload<string>
  ): Promise<PageSnapshot> {
    throw new Error('not implemented');
  }

  override fromBlockSnapshot(
    _payload: FromBlockSnapshotPayload
  ): Promise<FromBlockSnapshotResult<string>> {
    throw new Error('not implemented');
  }

  override toBlockSnapshot(
    _payload: ToBlockSnapshotPayload<string>
  ): Promise<BlockSnapshot> {
    throw new Error('not implemented');
  }

  override async fromSliceSnapshot(
    payload: FromSliceSnapshotPayload
  ): Promise<FromSliceSnapshotResult<string>> {
    const snapshot = payload.snapshot;
    const codeBlockText: string = snapshot.content
      .map(snapshot => {
        const text = (snapshot.props.text ?? { delta: [] }) as {
          delta: DeltaInsert[];
        };
        switch (snapshot.flavour) {
          case 'affine:code': {
            return text.delta.map(delta => delta.insert).join('');
          }
          default:
            return undefined;
        }
      })
      .filter(x => x !== undefined)
      .join('\n');
    return {
      file: codeBlockText,
      assetsIds: [],
    };
  }
}
