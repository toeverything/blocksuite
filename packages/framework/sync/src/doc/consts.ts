export enum DocEngineStep {
  Stopped = 0,
  Synced = 2,
  Syncing = 1,
}

export enum DocPeerStep {
  Loaded = 4.5,
  LoadingRootDoc = 2,
  LoadingSubDoc = 3,
  Retrying = 1,
  Stopped = 0,
  Synced = 6,
  Syncing = 5,
}
