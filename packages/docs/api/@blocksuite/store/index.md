[API](../../index.md) > @blocksuite/store

# Module: @blocksuite/store

## Namespaces

- [Utils](namespaces/namespace.Utils/index.md)
- [Y](namespaces/namespace.Y/index.md)

## Enumerations

- [Generator](enumerations/enumeration.Generator.md)

## Classes

- [ASTWalker](classes/class.ASTWalker.md)
- [AssetsManager](classes/class.AssetsManager.md)
- [AwarenessStore](classes/class.AwarenessStore.md)
- [BaseAdapter](classes/class.BaseAdapter.md)
- [BaseBlockModel](classes/class.BaseBlockModel.md)
- [BaseBlockTransformer](classes/class.BaseBlockTransformer.md)
- [BlockSuiteDoc](classes/class.BlockSuiteDoc.md)
- [Boxed](classes/class.Boxed.md)
- [Job](classes/class.Job.md)
- [MemoryBlobManager](classes/class.MemoryBlobManager.md)
- [Page](classes/class.Page.md)
- [Schema](classes/class.Schema.md)
- [Slice](classes/class.Slice.md)
- [Space](classes/class.Space.md)
- [Store](classes/class.Store.md)
- [Text](classes/class.Text.md)
- [Workspace](classes/class.Workspace.md)

## Interfaces

- [ActiveDocProvider](interfaces/interface.ActiveDocProvider.md)
- [AwarenessEvent](interfaces/interface.AwarenessEvent.md)
- [BaseDocProvider](interfaces/interface.BaseDocProvider.md)
- [BlobManager](interfaces/interface.BlobManager.md)
- [BlobStorage](interfaces/interface.BlobStorage.md)
- [BlobStorageCRUD](interfaces/interface.BlobStorageCRUD.md)
- [InternalPrimitives](interfaces/interface.InternalPrimitives.md)
- [OptionalAttributes](interfaces/interface.OptionalAttributes.md)
- [PageMeta](interfaces/interface.PageMeta.md)
- [PassiveDocProvider](interfaces/interface.PassiveDocProvider.md)
- [SerializedStore](interfaces/interface.SerializedStore.md)
- [StackItem](interfaces/interface.StackItem.md)
- [StoreOptions](interfaces/interface.StoreOptions.md)
- [UserInfo](interfaces/interface.UserInfo.md)

## Type Aliases

- [BeforeExportPayload](type-aliases/type-alias.BeforeExportPayload.md)
- [BeforeImportPayload](type-aliases/type-alias.BeforeImportPayload.md)
- [BlockProps](type-aliases/type-alias.BlockProps.md)
- [BlockSchemaType](type-aliases/type-alias.BlockSchemaType.md)
- [BlockSnapshot](type-aliases/type-alias.BlockSnapshot.md)
- [BlockSuiteDocAllowedValue](type-aliases/type-alias.BlockSuiteDocAllowedValue.md)
- [BlockSuiteDocData](type-aliases/type-alias.BlockSuiteDocData.md)
- [DeltaOperation](type-aliases/type-alias.DeltaOperation.md)
- [DocProvider](type-aliases/type-alias.DocProvider.md)
- [DocProviderCreator](type-aliases/type-alias.DocProviderCreator.md)
- [FinalPayload](type-aliases/type-alias.FinalPayload.md)
- [FromBlockSnapshotPayload](type-aliases/type-alias.FromBlockSnapshotPayload.md)
- [FromBlockSnapshotResult](type-aliases/type-alias.FromBlockSnapshotResult.md)
- [FromPageSnapshotPayload](type-aliases/type-alias.FromPageSnapshotPayload.md)
- [FromPageSnapshotResult](type-aliases/type-alias.FromPageSnapshotResult.md)
- [FromSliceSnapshotPayload](type-aliases/type-alias.FromSliceSnapshotPayload.md)
- [FromSliceSnapshotResult](type-aliases/type-alias.FromSliceSnapshotResult.md)
- [FromSnapshotPayload](type-aliases/type-alias.FromSnapshotPayload.md)
- [IdGenerator](type-aliases/type-alias.IdGenerator.md)
- [JobConfig](type-aliases/type-alias.JobConfig.md)
- [JobMiddleware](type-aliases/type-alias.JobMiddleware.md)
- [JobSlots](type-aliases/type-alias.JobSlots.md)
- [MigrationRunner](type-aliases/type-alias.MigrationRunner.md)
- [Native2Y](type-aliases/type-alias.Native2Y.md)
- [PageSnapshot](type-aliases/type-alias.PageSnapshot.md)
- [PropsFromGetter](type-aliases/type-alias.PropsFromGetter.md)
- [PropsGetter](type-aliases/type-alias.PropsGetter.md)
- [ProxyOptions](type-aliases/type-alias.ProxyOptions.md)
- [RawAwarenessState](type-aliases/type-alias.RawAwarenessState.md)
- [RoleType](type-aliases/type-alias.RoleType.md)
- [SchemaToModel](type-aliases/type-alias.SchemaToModel.md)
- [SliceSnapshot](type-aliases/type-alias.SliceSnapshot.md)
- [SnapshotReturn](type-aliases/type-alias.SnapshotReturn.md)
- [SubdocEvent](type-aliases/type-alias.SubdocEvent.md)
- [ToBlockSnapshotPayload](type-aliases/type-alias.ToBlockSnapshotPayload.md)
- [ToPageSnapshotPayload](type-aliases/type-alias.ToPageSnapshotPayload.md)
- [ToSliceSnapshotPayload](type-aliases/type-alias.ToSliceSnapshotPayload.md)
- [ToSnapshotPayload](type-aliases/type-alias.ToSnapshotPayload.md)
- [UnRecord](type-aliases/type-alias.UnRecord.md)
- [WorkspaceInfoSnapshot](type-aliases/type-alias.WorkspaceInfoSnapshot.md)
- [WorkspaceOptions](type-aliases/type-alias.WorkspaceOptions.md)

## Variables

- [BlockSchema](variables/variable.BlockSchema.md)
- [BlockSnapshotSchema](variables/variable.BlockSnapshotSchema.md)
- [PageSnapshotSchema](variables/variable.PageSnapshotSchema.md)
- [SliceSnapshotSchema](variables/variable.SliceSnapshotSchema.md)
- [WorkspaceInfoSnapshotSchema](variables/variable.WorkspaceInfoSnapshotSchema.md)
- [internalPrimitives](variables/variable.internalPrimitives-1.md)
- [pageMigrations](variables/variable.pageMigrations.md)
- [workspaceMigrations](variables/variable.workspaceMigrations.md)

## Functions

- [createAutoIncrementIdGenerator](functions/function.createAutoIncrementIdGenerator.md)
- [createAutoIncrementIdGeneratorByClientId](functions/function.createAutoIncrementIdGeneratorByClientId.md)
- [createIndexeddbStorage](functions/function.createIndexeddbStorage.md)
- [createMemoryStorage](functions/function.createMemoryStorage.md)
- [createSimpleServerStorage](functions/function.createSimpleServerStorage.md)
- [createYProxy](functions/function.createYProxy.md)
- [defineBlockSchema](functions/function.defineBlockSchema.md)
- [fromJSON](functions/function.fromJSON.md)
- [getAssetName](functions/function.getAssetName.md)
- [isPureObject](functions/function.isPureObject.md)
- [nanoid](functions/function.nanoid.md)
- [native2Y](functions/function.native2Y-1.md)
- [sha](functions/function.sha.md)
- [toJSON](functions/function.toJSON.md)
- [uuidv4](functions/function.uuidv4.md)
- [y2Native](functions/function.y2Native.md)
