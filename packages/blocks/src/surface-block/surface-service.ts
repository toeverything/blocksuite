import { BlockService } from '@blocksuite/block-std';
import { assertExists, noop, Slot } from '@blocksuite/global/utils';
import { isPlainObject, merge, recursive } from 'merge';

import type { NavigatorMode } from '../_common/edgeless/frame/consts.js';
import {
  DEFAULT_NOTE_COLOR,
  NOTE_SHADOWS,
} from '../_common/edgeless/note/consts.js';
import { type EdgelessTool, LineWidth } from '../_common/types.js';
import { buildPath } from '../_common/utils/query.js';
import {
  GET_DEFAULT_LINE_COLOR,
  GET_DEFAULT_TEXT_COLOR,
} from '../page-block/edgeless/components/panel/color-panel.js';
import { isTopLevelBlock } from '../page-block/edgeless/utils/query.js';
import {
  getViewportFromSessionCommand,
  saveViewportToSessionCommand,
} from './commands/index.js';
import {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
  ShapeStyle,
  StrokeStyle,
} from './consts.js';
import type { EdgelessElementType } from './edgeless-types.js';
import {
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
} from './elements/connector/types.js';
import {
  DEFAULT_SHAPE_FILL_COLOR,
  DEFAULT_SHAPE_STROKE_COLOR,
} from './elements/shape/consts.js';
import { TemplateJob } from './service/template.js';
import type { SurfaceBlockComponent } from './surface-block.js';
import type { SurfaceBlockModel } from './surface-model.js';

const SESSION_PROP_KEY = 'blocksuite:prop:record';

function deepAssign(
  target: Record<string, unknown>,
  source: Record<string, unknown>
) {
  Object.keys(source).forEach(key => {
    if (source[key] === undefined) return;
    if (!(key in target)) target[key] = undefined;
    if (target[key] !== undefined) return;

    if (isPlainObject(source[key])) {
      target[key] = target[key] ?? {};
      deepAssign(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else {
      target[key] = source[key];
    }
  });

  return target;
}

export class SurfaceService extends BlockService<SurfaceBlockModel> {
  TemplateJob = TemplateJob;

  slots = {
    edgelessToolUpdated: new Slot<EdgelessTool>(),
    lastPropsUpdated: new Slot<{
      type: EdgelessElementType;
      props: Record<string, unknown>;
    }>(),
  };

  lastProps: Partial<Record<EdgelessElementType, Record<string, unknown>>> = {
    connector: {
      frontEndpointStyle: DEFAULT_FRONT_END_POINT_STYLE,
      rearEndpointStyle: DEFAULT_REAR_END_POINT_STYLE,
      strokeStyle: StrokeStyle.Solid,
      stroke: GET_DEFAULT_LINE_COLOR(),
      strokeWidth: LineWidth.LINE_WIDTH_TWO,
      rough: false,
      mode: undefined,
    },
    brush: {
      color: GET_DEFAULT_LINE_COLOR(),
      lineWidth: LineWidth.Thin,
    },
    shape: {
      shapeType: 'rect',
      fillColor: DEFAULT_SHAPE_FILL_COLOR,
      strokeColor: DEFAULT_SHAPE_STROKE_COLOR,
      shapeStyle: ShapeStyle.General,
      filled: undefined,
      strokeWidth: undefined,
      strokeStyle: undefined,
      color: undefined,
      fontSize: undefined,
      fontFamily: undefined,
      fontWeight: undefined,
      fontStyle: undefined,
      textAlign: undefined,
      textHorizontalAlign: undefined,
      textVerticalAlign: undefined,
    },
    text: {
      color: GET_DEFAULT_TEXT_COLOR(),
      fontFamily: CanvasTextFontFamily.Inter,
      textAlign: 'left',
      fontWeight: CanvasTextFontWeight.Regular,
      fontStyle: CanvasTextFontStyle.Normal,
      fontSize: 24,
      hasMaxWidth: false,
    },
    ['affine:note']: {
      background: DEFAULT_NOTE_COLOR,
      hidden: false,
      edgeless: {
        style: {
          borderRadius: 8,
          borderSize: 4,
          borderStyle: StrokeStyle.Solid,
          shadowType: NOTE_SHADOWS[1],
        },
      },
    },
  };

  override mounted(): void {
    super.mounted();

    this.std.command
      .add('getViewportFromSession', getViewportFromSessionCommand)
      .add('saveViewportToSession', saveViewportToSessionCommand);

    this._tryLoadLastProps();
    this._initSlots();
  }

  private _getSurfaceView() {
    const [surface] = this.page.getBlockByFlavour('affine:surface');
    const view = this.std.view.viewFromPath(
      'block',
      buildPath(surface)
    ) as SurfaceBlockComponent;
    return view;
  }

  private _tryLoadLastProps() {
    const props = sessionStorage.getItem(SESSION_PROP_KEY);
    if (!props) return;

    try {
      const _props = JSON.parse(props);
      recursive(this.lastProps, _props);
    } catch {
      noop();
    }
  }

  private _saveLastProps() {
    sessionStorage.setItem(SESSION_PROP_KEY, JSON.stringify(this.lastProps));
  }

  private _initSlots() {
    // temporary plan for surface block not ready
    requestAnimationFrame(() => {
      const surface = this._getSurfaceView();
      surface.edgeless.slots.elementUpdated.on(({ id, props = {} }) => {
        const element = surface.pickById(id);
        assertExists(element, 'element must exist');
        this.recordLastProps(
          (isTopLevelBlock(element)
            ? element.flavour
            : element.type) as EdgelessElementType,
          props
        );
      });
    });
  }

  private _extractProps(
    props: Record<string, unknown>,
    ref: Record<string, unknown>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    Object.entries(props).forEach(([key, value]) => {
      if (!(key in ref)) return;
      if (isPlainObject(value)) {
        result[key] = this._extractProps(
          props[key] as Record<string, unknown>,
          ref[key] as Record<string, unknown>
        );
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  recordLastProps(
    type: EdgelessElementType,
    targetProps: Record<string, unknown>
  ) {
    const props = this.lastProps[type];
    if (!props) return;

    const overrideProps = this._extractProps(
      targetProps,
      this.lastProps[type] as Record<string, unknown>
    );
    if (Object.keys(overrideProps).length === 0) return;

    merge(props, overrideProps);
    this.slots.lastPropsUpdated.emit({ type, props: overrideProps });
    this._saveLastProps();
  }

  applyLastProps(
    type: EdgelessElementType,
    targetProps: Record<string, unknown>
  ) {
    const props = this.lastProps[type];
    if (!props) return;
    deepAssign(targetProps, props);
  }

  get currentTool() {
    const view = this._getSurfaceView();
    if (!view) return null;

    const { edgeless } = view;
    return edgeless.edgelessTool;
  }

  setNavigatorMode(on: boolean, mode?: NavigatorMode) {
    const view = this._getSurfaceView();
    if (!view) return;

    const { edgeless } = view;
    if (on && edgeless.edgelessTool.type === 'frameNavigator') return;
    if (!on && edgeless.edgelessTool.type !== 'frameNavigator') return;

    if (on) {
      edgeless.tools.setEdgelessTool({ type: 'frameNavigator', mode });
    } else {
      edgeless.tools.setEdgelessTool({ type: 'default' });
    }
  }
}
