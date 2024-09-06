class TokensManager extends CardManager<Token> {
    constructor (public game: GlowGame) {
        super(game, {
            animationManager: game.animationManager,
            getId: (card) => `module-token-${card.id}`,
            setupDiv: (card: Token, div: HTMLElement) => {
                div.classList.add('module-token');
                div.dataset.cardId = ''+card.id;
                div.dataset.type = ''+card.type;
                div.dataset.typeArg = ''+card.typeArg;
            },
            setupFrontDiv: (card: Token, div: HTMLElement) => {},
            setupBackDiv: (card: Token, div: HTMLElement) => {}
        });
    }
}