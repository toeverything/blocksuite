export enum DocEngineStep {
  Stopped = 0,
  Syncing = 1,
  Synced = 2,
}

export enum DocPeerStep {
  Stopped = 0,
  Retrying = 1,
  LoadingRootDoc = 2,
  LoadingSubDoc = 3,
  Loaded = 4.5,
  Syncing = 5,
  Synced = 6,
}
