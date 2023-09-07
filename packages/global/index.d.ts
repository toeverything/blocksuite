declare type BlockSuiteFlags = {
  enable_set_remote_flag: boolean;
  enable_block_hub: boolean;

  enable_toggle_block: boolean;
  enable_edgeless_toolbar: boolean;
  enable_bookmark_operation: boolean;
  enable_note_index: boolean;

  readonly: Record<string, boolean>;
};
