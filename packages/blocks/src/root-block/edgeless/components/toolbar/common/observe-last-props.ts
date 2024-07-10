import type {
  LastProps,
  LastPropsKey,
} from '../../../../../surface-block/managers/edit-session.js';
import type { EdgelessRootService } from '../../../edgeless-root-service.js';

export const observeLastProps = <T extends LastPropsKey>(
  edgelessService: EdgelessRootService,
  toolType: T,
  fields: Array<keyof LastProps[T]>,
  initStates: Record<string, unknown>,
  onChange?: (
    updates: Partial<LastProps[T]>,
    originalProps: Record<string, unknown>
  ) => void
) => {
  const _prevStates = { ...initStates };
  return edgelessService.editPropsStore.slots.lastPropsUpdated.on(
    ({ type, props }) => {
      if (type !== toolType) return;
      const updates = fields
        .filter(_key => {
          const key = _key as string;
          return props[key] !== _prevStates[key] && props[key] != undefined;
        })
        .reduce((acc, key) => ({ ...acc, [key]: props[key as string] }), {});

      Object.assign(_prevStates, updates);
      onChange?.(updates, props);
    }
  );
};

export const applyLastProps = <T extends LastPropsKey>(
  service: EdgelessRootService,
  toolType: T,
  fields: Array<keyof LastProps[T]>,
  initStates: Record<string, unknown>
) => {
  const attrs = service.editPropsStore.getLastProps(toolType);
  const object = fields.reduce(
    (acc, key) => ({ ...acc, [key]: attrs[key] }),
    initStates
  );
  Object.assign(initStates, object);
  return object;
};
