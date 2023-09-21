declare type BlockSuiteFlags = {
  enable_set_remote_flag: boolean;
  enable_block_hub: boolean;

  enable_transformer_clipboard: boolean;

  enable_expand_database_block: boolean;

  enable_toggle_block: boolean;
  enable_bookmark_operation: boolean;
  enable_note_index: boolean;

  enable_bultin_ledits: boolean;
  readonly: Record<string, boolean>;
};
