import { stopPropagation } from '../../event.js';
import { dragHandlerDataName } from '../dnd-context.js';
import type {
  Coordinates,
  DistanceMeasurement,
  DndSession,
  DndSessionProps,
  Sensor,
} from '../types.js';
import { subtract } from '../utils/adjustment.js';
import { asHTMLElement } from '../utils/element.js';
import { preventDefault } from '../utils/events.js';
import { hasExceededDistance } from '../utils/has-exceeded-distance.js';
import { Listeners } from '../utils/listeners.js';

interface DistanceConstraint {
  distance: DistanceMeasurement;
}

export type PointerActivationConstraint = DistanceConstraint;

export type MouseSensorProps = {
  activationConstraint?: PointerActivationConstraint;
};
const findActivatorElement = (target: unknown) => {
  let ele;
  if (target instanceof HTMLElement) {
    ele = target;
  } else if (target instanceof Node) {
    ele = target.parentElement;
  } else {
    return;
  }
  while (ele) {
    const dndDraggableId = ele.dataset[dragHandlerDataName.dataset];
    if (dndDraggableId) {
      const activeNode = asHTMLElement(
        ele.closest('[data-wc-dnd-draggable-id]')
      );
      if (activeNode) {
        return { dndDraggableId, ele: activeNode };
      }
    }
    ele = ele.parentElement;
  }
  return;
};
export const mouseSensor: Sensor<MouseSensorProps> = props => {
  return (container, startSession) => {
    const mousedown = (event: Event) => {
      const result = findActivatorElement(event.target);
      if (result) {
        startSession(
          result.dndDraggableId,
          result.ele,
          sessionProps => new MouseSession(event, sessionProps, props)
        );
      }
    };
    container.addEventListener('pointerdown', mousedown);
    return () => {
      container.removeEventListener('pointerdown', mousedown);
    };
  };
};
const defaultCoordinates: Coordinates = {
  x: 0,
  y: 0,
};

export function hasViewportRelativeCoordinates(
  event: Event
): event is Event & Pick<PointerEvent, 'clientX' | 'clientY'> {
  return 'clientX' in event && 'clientY' in event;
}

function isTouchEvent(event: Event): event is TouchEvent {
  return 'TouchEvent' in globalThis && event instanceof TouchEvent;
}

const getEventCoordinates = (event: Event) => {
  if (isTouchEvent(event)) {
    if (event.touches && event.touches.length) {
      const touch = event.touches[0];
      if (!touch) return;
      const { clientX: x, clientY: y } = touch;

      return {
        x,
        y,
      };
    } else if (event.changedTouches && event.changedTouches.length) {
      const touch = event.changedTouches[0];
      if (!touch) return;
      const { clientX: x, clientY: y } = touch;

      return {
        x,
        y,
      };
    }
  }

  if (hasViewportRelativeCoordinates(event)) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }

  return null;
};

export class MouseSession implements DndSession {
  private activated: boolean = false;

  autoScrollEnabled = true;

  documentListeners = new Listeners(document);

  handleCancel = () => {
    const { onCancel } = this.sessionProps;

    this.detach();
    onCancel();
  };

  handleEnd = () => {
    const { onEnd } = this.sessionProps;

    this.detach();
    onEnd();
  };

  handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.handleCancel();
    }
  };

  handleMove = (event: Event) => {
    const { activated, initialCoordinates } = this;
    const { activationConstraint } = this.props;
    const { onMove } = this.sessionProps;

    if (!initialCoordinates) {
      return;
    }

    const coordinates = getEventCoordinates(event) ?? defaultCoordinates;

    // Constraint validation
    if (!activated && activationConstraint) {
      const delta = subtract(initialCoordinates, coordinates);
      if (
        activationConstraint.distance &&
        hasExceededDistance(delta, activationConstraint.distance)
      ) {
        return this.handleStart();
      }
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }
    event.stopPropagation();
    onMove(coordinates);
  };

  handleStart = () => {
    const { initialCoordinates } = this;
    const { onStart } = this.sessionProps;

    if (initialCoordinates) {
      this.activated = true;

      // Stop propagation of click events once activation constraints are met
      this.documentListeners.add('click', stopPropagation, {
        capture: true,
      });

      // Remove any text selection from the document
      this.removeTextSelection();

      // Prevent further text selection while dragging
      this.documentListeners.add('selectionchange', this.removeTextSelection);

      onStart(initialCoordinates);
    }
  };

  initialCoordinates: Coordinates;

  removeTextSelection = () => {
    document.getSelection()?.removeAllRanges();
  };

  windowListeners = new Listeners(window);

  constructor(
    event: Event,
    private readonly sessionProps: DndSessionProps,
    private readonly props: MouseSensorProps
  ) {
    this.initialCoordinates = getEventCoordinates(event) ?? defaultCoordinates;
    this.attach();
  }

  private attach() {
    this.windowListeners.add('pointermove', this.handleMove, {
      capture: true,
    });
    this.windowListeners.add('pointerup', this.handleEnd);
    this.windowListeners.add('resize', this.handleCancel);
    this.windowListeners.add('dragstart', preventDefault);
    this.windowListeners.add('visibilitichange', this.handleCancel);
    this.windowListeners.add('contextmenu', preventDefault);
    this.documentListeners.add('keydown', this.handleKeydown);
    const { activationConstraint } = this.props;
    if (activationConstraint && activationConstraint.distance != null) {
      return;
    }

    this.handleStart();
  }

  private detach() {
    this.windowListeners.removeAll();

    // Wait until the next event loop before removing document listeners
    // This is necessary because we listen for `click` and `selection` events on the document
    setTimeout(this.documentListeners.removeAll, 50);
  }
}
