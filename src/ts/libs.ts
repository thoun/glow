const BgaAnimations: typeof globalThis.BgaAnimations = await globalThis.importEsmLib('bga-animations', '1.x');
const BgaCards: typeof globalThis.BgaCards = await globalThis.importEsmLib('bga-cards', '1.x');
const [LegacyStock, LegacyCounter, LegacyPopinDialog, legacyDojo] = await globalThis.importDojoLibs([
    'ebg/stock', 'ebg/counter', 'ebg/popindialog', 'dojo',
]) as [new () => Stock, new () => Counter, new () => PopinDialog, Dojo];

export { BgaAnimations,BgaCards,LegacyCounter,LegacyPopinDialog,LegacyStock,legacyDojo };
