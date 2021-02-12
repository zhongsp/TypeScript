# TypeScript 3.1

## 一些浏览器厂商特定的类型从`lib.d.ts`中被移除

TypeScript内置的`.d.ts`库\(`lib.d.ts`等\)现在会部分地从DOM规范的Web IDL文件中生成。 因此有一些浏览器厂商特定的类型被移除了。

点击这里查看被移除类型的完整列表：

 \* \`CanvasRenderingContext2D.mozImageSmoothingEnabled\` \* \`CanvasRenderingContext2D.msFillRule\` \* \`CanvasRenderingContext2D.oImageSmoothingEnabled\` \* \`CanvasRenderingContext2D.webkitImageSmoothingEnabled\` \* \`Document.caretRangeFromPoint\` \* \`Document.createExpression\` \* \`Document.createNSResolver\` \* \`Document.execCommandShowHelp\` \* \`Document.exitFullscreen\` \* \`Document.exitPointerLock\` \* \`Document.focus\` \* \`Document.fullscreenElement\` \* \`Document.fullscreenEnabled\` \* \`Document.getSelection\` \* \`Document.msCapsLockWarningOff\` \* \`Document.msCSSOMElementFloatMetrics\` \* \`Document.msElementsFromRect\` \* \`Document.msElementsFromPoint\` \* \`Document.onvisibilitychange\` \* \`Document.onwebkitfullscreenchange\` \* \`Document.onwebkitfullscreenerror\` \* \`Document.pointerLockElement\` \* \`Document.queryCommandIndeterm\` \* \`Document.URLUnencoded\` \* \`Document.webkitCurrentFullScreenElement\` \* \`Document.webkitFullscreenElement\` \* \`Document.webkitFullscreenEnabled\` \* \`Document.webkitIsFullScreen\` \* \`Document.xmlEncoding\` \* \`Document.xmlStandalone\` \* \`Document.xmlVersion\` \* \`DocumentType.entities\` \* \`DocumentType.internalSubset\` \* \`DocumentType.notations\` \* \`DOML2DeprecatedSizeProperty\` \* \`Element.msContentZoomFactor\` \* \`Element.msGetUntransformedBounds\` \* \`Element.msMatchesSelector\` \* \`Element.msRegionOverflow\` \* \`Element.msReleasePointerCapture\` \* \`Element.msSetPointerCapture\` \* \`Element.msZoomTo\` \* \`Element.onwebkitfullscreenchange\` \* \`Element.onwebkitfullscreenerror\` \* \`Element.webkitRequestFullScreen\` \* \`Element.webkitRequestFullscreen\` \* \`ElementCSSInlineStyle\` \* \`ExtendableEventInit\` \* \`ExtendableMessageEventInit\` \* \`FetchEventInit\` \* \`GenerateAssertionCallback\` \* \`HTMLAnchorElement.Methods\` \* \`HTMLAnchorElement.mimeType\` \* \`HTMLAnchorElement.nameProp\` \* \`HTMLAnchorElement.protocolLong\` \* \`HTMLAnchorElement.urn\` \* \`HTMLAreasCollection\` \* \`HTMLHeadElement.profile\` \* \`HTMLImageElement.msGetAsCastingSource\` \* \`HTMLImageElement.msGetAsCastingSource\` \* \`HTMLImageElement.msKeySystem\` \* \`HTMLImageElement.msPlayToDisabled\` \* \`HTMLImageElement.msPlayToDisabled\` \* \`HTMLImageElement.msPlayToPreferredSourceUri\` \* \`HTMLImageElement.msPlayToPreferredSourceUri\` \* \`HTMLImageElement.msPlayToPrimary\` \* \`HTMLImageElement.msPlayToPrimary\` \* \`HTMLImageElement.msPlayToSource\` \* \`HTMLImageElement.msPlayToSource\` \* \`HTMLImageElement.x\` \* \`HTMLImageElement.y\` \* \`HTMLInputElement.webkitdirectory\` \* \`HTMLLinkElement.import\` \* \`HTMLMetaElement.charset\` \* \`HTMLMetaElement.url\` \* \`HTMLSourceElement.msKeySystem\` \* \`HTMLStyleElement.disabled\` \* \`HTMLSummaryElement\` \* \`MediaQueryListListener\` \* \`MSAccountInfo\` \* \`MSAudioLocalClientEvent\` \* \`MSAudioLocalClientEvent\` \* \`MSAudioRecvPayload\` \* \`MSAudioRecvSignal\` \* \`MSAudioSendPayload\` \* \`MSAudioSendSignal\` \* \`MSConnectivity\` \* \`MSCredentialFilter\` \* \`MSCredentialParameters\` \* \`MSCredentials\` \* \`MSCredentialSpec\` \* \`MSDCCEvent\` \* \`MSDCCEventInit\` \* \`MSDelay\` \* \`MSDescription\` \* \`MSDSHEvent\` \* \`MSDSHEventInit\` \* \`MSFIDOCredentialParameters\` \* \`MSIceAddrType\` \* \`MSIceType\` \* \`MSIceWarningFlags\` \* \`MSInboundPayload\` \* \`MSIPAddressInfo\` \* \`MSJitter\` \* \`MSLocalClientEvent\` \* \`MSLocalClientEventBase\` \* \`MSNetwork\` \* \`MSNetworkConnectivityInfo\` \* \`MSNetworkInterfaceType\` \* \`MSOutboundNetwork\` \* \`MSOutboundPayload\` \* \`MSPacketLoss\` \* \`MSPayloadBase\` \* \`MSPortRange\` \* \`MSRelayAddress\` \* \`MSSignatureParameters\` \* \`MSStatsType\` \* \`MSStreamReader\` \* \`MSTransportDiagnosticsStats\` \* \`MSUtilization\` \* \`MSVideoPayload\` \* \`MSVideoRecvPayload\` \* \`MSVideoResolutionDistribution\` \* \`MSVideoSendPayload\` \* \`NotificationEventInit\` \* \`PushEventInit\` \* \`PushSubscriptionChangeInit\` \* \`RTCIdentityAssertionResult\` \* \`RTCIdentityProvider\` \* \`RTCIdentityProviderDetails\` \* \`RTCIdentityValidationResult\` \* \`Screen.deviceXDPI\` \* \`Screen.logicalXDPI\` \* \`SVGElement.xmlbase\` \* \`SVGGraphicsElement.farthestViewportElement\` \* \`SVGGraphicsElement.getTransformToElement\` \* \`SVGGraphicsElement.nearestViewportElement\` \* \`SVGStylable\` \* \`SVGTests.hasExtension\` \* \`SVGTests.requiredFeatures\` \* \`SyncEventInit\` \* \`ValidateAssertionCallback\` \* \`WebKitDirectoryEntry\` \* \`WebKitDirectoryReader\` \* \`WebKitEntriesCallback\` \* \`WebKitEntry\` \* \`WebKitErrorCallback\` \* \`WebKitFileCallback\` \* \`WebKitFileEntry\` \* \`WebKitFileSystem\` \* \`Window.clearImmediate\` \* \`Window.msSetImmediate\` \* \`Window.setImmediate\`

### 推荐：

如果你的运行时能够保证这些名称是可用的（比如一个仅针对IE的应用），那么可以在本地添加那些声明，例如：

对于`Element.msMatchesSelector`，在本地的`dom.ie.d.ts`文件里添加如下代码：

```typescript
interface Element {
    msMatchesSelector(selectors: string): boolean;
}
```

相似地，若要添加`clearImmediate`和`setImmediate`，你可以在本地的`dom.ie.d.ts`里添加`Window`声明：

```typescript
interface Window {
    clearImmediate(handle: number): void;
    setImmediate(handler: (...args: any[]) => void): number;
    setImmediate(handler: any, ...args: any[]): number;
}
```

## 细化的函数现在会使用`{}`，`Object`和未约束的泛型参数的交叉类型

下面的代码如今会提示`x`不能被调用：

```typescript
function foo<T>(x: T | (() => string)) {
    if (typeof x === "function") {
        x();
//      ~~~
// Cannot invoke an expression whose type lacks a call signature. Type '(() => string) | (T & Function)' has no compatible call signatures.
    }
}
```

这是因为，不同于以前的`T`会被细化掉，如今`T`会被扩展成`T & Function`。 然而，因为这个类型没有声明调用签名，类型系统无法找到通用的调用签名可以适用于`T & Function`和`() => string`。

因此，考虑使用一个更确切的类型，而不是`{}`或`Object`，并且考虑给`T`添加额外的约束条件。

