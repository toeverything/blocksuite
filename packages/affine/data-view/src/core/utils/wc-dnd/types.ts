export type UniqueIdentifier = string;

export interface DndClientRect {
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

export type Coordinates = {
  x: number;
  y: number;
};

export interface Active {
  id: UniqueIdentifier;
  node: HTMLElement;
  rect: DndClientRect;
}

export type RectMap = Map<UniqueIdentifier, DndClientRect>;

export interface DroppableContainer {
  id: UniqueIdentifier;
  disabled: boolean;
  node: HTMLElement;
  rect: DndClientRect;
}

export interface Collision {
  id: UniqueIdentifier;
}

export type CollisionDetection = (args: {
  active: Active;
  collisionRect: DndClientRect;
  droppableRects: RectMap;
  droppableContainers: DroppableContainer[];
  pointerCoordinates: Coordinates | undefined;
}) => Collision[];
export type Translate = Coordinates;

export interface Over {
  id: UniqueIdentifier;
  rect: DndClientRect;
  disabled: boolean;
}

interface DragEvent {
  active: Active;
  collisions: Collision[] | undefined;
  delta: Translate;
  over: Over | undefined;
}

export interface DragStartEvent extends Pick<DragEvent, 'active'> {}

export interface DragMoveEvent extends DragEvent {}

export interface DragOverEvent extends DragMoveEvent {}

export interface DragEndEvent extends DragEvent {}

export interface DragCancelEvent extends DragEndEvent {}

export type Transform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
};
export type Modifier = (args: {
  active: Active | undefined;
  activeNodeRect: DndClientRect;
  over: Over | undefined;
  transform: Transform;
  overlayNodeRect: DndClientRect | undefined;
  scrollContainerRect: DndClientRect | undefined;
}) => Transform;

export type Modifiers = Modifier[];
export type SortingStrategy = (args: {
  activeNodeRect: DndClientRect | undefined;
  activeIndex: number;
  rects: DndClientRect[];
  overIndex: number;
}) => Array<Transform | undefined>;

export interface Disabled {
  draggable?: boolean;
  droppable?: boolean;
}

export type DroppableNodes = Map<UniqueIdentifier, DroppableContainer>;
export type Unsubscription = () => void;
export type DndSessionProps = {
  onStart(coordinates: Coordinates): void;
  onCancel(): void;
  onMove(coordinates: Coordinates): void;
  onEnd(): void;
};
export type DndSessionCreator = (props: DndSessionProps) => DndSession;
export type DndSession = {
  autoScrollEnabled: boolean;
};
export type Activator = (
  container: HTMLElement,
  startSession: (
    id: UniqueIdentifier,
    activeNode: HTMLElement,
    sessionCreator: DndSessionCreator
  ) => void
) => Unsubscription;
export type Sensor<T> = (config: T) => Activator;
export type Activators = Activator[];

export type DistanceMeasurement =
  | number
  | Coordinates
  | Pick<Coordinates, 'x'>
  | Pick<Coordinates, 'y'>;
