[API](../../index.md) > @blocksuite/virgo

# Module: @blocksuite/virgo

## Classes

- [VEditor](classes/class.VEditor.md)
- [VText](classes/class.VText.md)
- [VirgoAttributeService](classes/class.VirgoAttributeService.md)
- [VirgoDeltaService](classes/class.VirgoDeltaService.md)
- [VirgoElement](classes/class.VirgoElement.md)
- [VirgoEventService](classes/class.VirgoEventService.md)
- [VirgoHookService](classes/class.VirgoHookService.md)
- [VirgoLine](classes/class.VirgoLine.md)
- [VirgoRangeService](classes/class.VirgoRangeService.md)

## Interfaces

- [DomPoint](interfaces/interface.DomPoint.md)
- [VBeforeinputHookCtx](interfaces/interface.VBeforeinputHookCtx.md)
- [VCompositionEndHookCtx](interfaces/interface.VCompositionEndHookCtx.md)
- [VKeyboardBinding](interfaces/interface.VKeyboardBinding.md)
- [VKeyboardBindingContext](interfaces/interface.VKeyboardBindingContext.md)
- [VRange](interfaces/interface.VRange.md)
- [VRangeProvider](interfaces/interface.VRangeProvider.md)

## Type Aliases

- [AttributeRenderer](type-aliases/type-alias.AttributeRenderer.md)
- [BaseTextAttributes](type-aliases/type-alias.BaseTextAttributes.md)
- [DeltaEntry](type-aliases/type-alias.DeltaEntry.md)
- [DeltaInsert](type-aliases/type-alias.DeltaInsert.md)
- [NativePoint](type-aliases/type-alias.NativePoint.md)
- [TextPoint](type-aliases/type-alias.TextPoint.md)
- [VHookContext](type-aliases/type-alias.VHookContext.md)
- [VKeyboardBindingHandler](type-aliases/type-alias.VKeyboardBindingHandler.md)
- [VKeyboardBindingRecord](type-aliases/type-alias.VKeyboardBindingRecord.md)
- [VRangeUpdatedProp](type-aliases/type-alias.VRangeUpdatedProp.md)
- [VirgoRootElement](type-aliases/type-alias.VirgoRootElement.md)

## Variables

- [VIRGO\_ROOT\_ATTR](variables/variable.VIRGO_ROOT_ATTR.md)
- [VKEYBOARD\_ALLOW\_DEFAULT](variables/variable.VKEYBOARD_ALLOW_DEFAULT.md)
- [VKEYBOARD\_PREVENT\_DEFAULT](variables/variable.VKEYBOARD_PREVENT_DEFAULT.md)
- [ZERO\_WIDTH\_NON\_JOINER](variables/variable.ZERO_WIDTH_NON_JOINER.md)
- [ZERO\_WIDTH\_SPACE](variables/variable.ZERO_WIDTH_SPACE.md)
- [baseTextAttributes](variables/variable.baseTextAttributes-1.md)

## Functions

- [calculateTextLength](functions/function.calculateTextLength.md)
- [createVirgoKeyDownHandler](functions/function.createVirgoKeyDownHandler.md)
- [deltaInsertsToChunks](functions/function.deltaInsertsToChunks.md)
- [domRangeToVirgoRange](functions/function.domRangeToVirgoRange.md)
- [findDocumentOrShadowRoot](functions/function.findDocumentOrShadowRoot.md)
- [getDefaultAttributeRenderer](functions/function.getDefaultAttributeRenderer.md)
- [getTextNodesFromElement](functions/function.getTextNodesFromElement.md)
- [getVEditorInsideRoot](functions/function.getVEditorInsideRoot.md)
- [isInEmbedElement](functions/function.isInEmbedElement.md)
- [isInEmbedGap](functions/function.isInEmbedGap.md)
- [isNativeTextInVText](functions/function.isNativeTextInVText.md)
- [isSelectionBackwards](functions/function.isSelectionBackwards.md)
- [isVElement](functions/function.isVElement.md)
- [isVLine](functions/function.isVLine.md)
- [isVRoot](functions/function.isVRoot.md)
- [nativePointToTextPoint](functions/function.nativePointToTextPoint.md)
- [renderElement](functions/function.renderElement.md)
- [textPointToDomPoint](functions/function.textPointToDomPoint.md)
- [transformDelta](functions/function.transformDelta.md)
- [transformInput](functions/function.transformInput.md)
- [virgoRangeToDomRange](functions/function.virgoRangeToDomRange.md)
