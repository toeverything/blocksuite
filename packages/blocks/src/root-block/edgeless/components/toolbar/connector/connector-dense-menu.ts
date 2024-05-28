import {
  ConnectorIcon,
  CurveLineIcon,
  ElbowedLineIcon,
  StraightLineIcon,
} from '../../../../../_common/icons/edgeless.js';
import { ConnectorMode } from '../../../../../surface-block/index.js';
import type { DenseMenuBuilder } from '../common/type.js';

export const buildConnectorDenseMenu: DenseMenuBuilder = edgeless => {
  const createSelect = (mode: ConnectorMode) => () => {
    edgeless.tools.setEdgelessTool({ type: 'connector', mode });
    edgeless.service.editPropsStore.record('connector', { mode });
  };

  return {
    type: 'sub-menu',
    name: 'Connector',
    icon: ConnectorIcon,
    options: {
      items: [
        {
          type: 'action',
          name: 'Curve',
          icon: CurveLineIcon,
          select: createSelect(ConnectorMode.Curve),
        },
        {
          type: 'action',
          name: 'Elbowed',
          icon: ElbowedLineIcon,
          select: createSelect(ConnectorMode.Orthogonal),
        },
        {
          type: 'action',
          name: 'Straight',
          icon: StraightLineIcon,
          select: createSelect(ConnectorMode.Straight),
        },
      ],
    },
  };
};
