interface Effect {
    conditions: number[];
    effects: number[];
}

interface Adventurer {
    id: number;
    name?: string;
    color: number;
    location: string;
    location_arg: number;
    points: number;
    dice: number;
    effect?: Effect;
}

interface Companion {
    id: number;
    name?: string;
    type: number;
    subType: number;
    location: string;
    location_arg: number;
    fireflies: number;
    effect?: Effect;
    noDieWarning?: boolean;
}

interface Spell {
    id: number;
    type: number;
    visible: boolean;
    location: string;
    location_arg: number;
}

interface SoloTileCard {
    moveCompany: number;
    moveScore: number;
    moveMeeple: number; // 0 for nothing, 1 for min, 2 for max
}

interface SoloTile extends SoloTileCard {
    id: number;
    type: number;
    location: string;
    location_arg: number;
}

interface Token {
    id: number;
    type: number;
    typeArg: number;
}

interface Die {
    id: number;
    location: string;
    location_arg: number;
    face: number;
    value: number;
    color: number;
    small: boolean;
    used: boolean;
}

interface Meeple {
    id: number;
    playerId: number;
    type: number;
    position: number;
}


interface MeetingTrackSpot {
    companion: Companion;
    dice: Die[];
    footprints: number;
    soloTile: SoloTile;
}

interface Route {
    costForPlayer: number[];
    from: number;
    destination: number;
}



interface GlowPlayer extends Player {
    playerNo: number;
    meeples: Meeple[];
    adventurer: Adventurer;
    companions: Companion[];
    spells: Spell[];
    dice: Die[];
    rerolls: number;
    footprints: number;
    fireflies: number;
    smallBoard: boolean;
    company?: number; // tom company score
    tokens?: Token[];
}

/**
 * Your game interfaces
 */

interface GlowGamedatas {
    current_player_id: string;
    decision: {decision_type: string};
    game_result_neutralized: string;
    gamestate: Gamestate;
    gamestates: { [gamestateId: number]: Gamestate };
    neutralized_player_id: string;
    notifications: {last_packet_id: string, move_nbr: string}
    playerorder: (string | number)[];
    players: { [playerId: number]: GlowPlayer };
    tablespeed: string;

    // Add here variables you set up in getAllDatas
    firstPlayer: number;
    side: number;
    day: number;
        
    tableDice: Die[];
    topDeckType: number;
    topDeckBType: number;
    topCemeteryType: number;
    discardedSoloTiles: number;

    meetingTrack: MeetingTrackSpot[];

    endTurn: boolean;

    tom: GlowPlayer;

    ADVENTURERS: Adventurer[];
    COMPANIONS: Companion[];
    SPELLS_EFFECTS: Effect[];
    SOLO_TILES: SoloTileCard[];

    expansion: boolean;
    tokensActivated: boolean;
}

interface GlowGame extends Game {
    animationManager: AnimationManager;
    adventurersStock: Stock;
    
    getPlayerId(): number;
    getBoardSide(): number;
    isColorBlindMode(): boolean;
    isExpansion(): boolean;
    chooseAdventurer(id: number): void;
    selectMeetingTrackCompanion(spot: number): void;
    //createAndPlaceDieHtml(die: Die, destinationId: string): void;    
    //getDieDiv(die: Die): HTMLDivElement;
    //addRollToDiv(dieDiv: HTMLDivElement, rollClass: string): void;
    createOrMoveDie(die: Die, destinationId: string, rollClass?: string): void;
    cardClick(type: number, id: number): void;
    selectMove(possibleDestination: Route): void;
    onMeetingTrackDiceClick(spot: number): void;
    selectSketalDie(dieId: number): void;
    isSolo(): boolean;
    tableHeightChange(): void;
    getSpotCount(): number;
}

interface EnteringChooseAdventurerArgs {
    adventurers: Adventurer[];
}

interface EnteringRecruitCompanionArgs {
    companions: MeetingTrackSpot[];
    topDeckType: number;
}

interface EnteringRollDiceForPlayer {
    rerollCompanion: number;
    rerollCrolos: number;
    rerollTokens: number;
    rerollScore: { [rerolls: number]: number }; // number of rerolls -> cost
    grayMultiDice: boolean;
}

interface EnteringRollDiceArgs {
    [playerId: number]: EnteringRollDiceForPlayer;
}

interface EnteringSelectSketalDieArgs {
    dice: Die[];
}

interface EnteringRerollImmediateArgs {
    selectedDie: Die;
}

interface EnteringMoveBlackDieArgs {
    possibleSpots: number[];
}

interface EnteringUriomRecruitCompanionArgs {
    spot: number;
}

interface EnteringSwapArgs {
    card: Companion;
}

interface EnteringResurrectArgs {
    cemeteryCards: Companion[];
}

interface ResolveCardsForPlayer {
    remainingEffects: number[][];
    killTokenId?: number;
    disableTokenId?: number;
}

interface EnteringResolveCardsArgs {
    [playerId: number]: ResolveCardsForPlayer;
}

interface EnteringMoveForPlayer {
    possibleRoutes: Route[];
    canSettle?: boolean;
    killTokenId?: number;
    disableTokenId?: number;
}

interface EnteringRemoveTokenArgs {    
    tokens: Token[];
    count: number;
}

interface EnteringMoveArgs {
    [playerId: number]: EnteringMoveForPlayer;
}

interface NotifNewDayArgs {
    day: number;
}

interface NotifFirstPlayerArgs {
    playerId: number;
}

interface NotifChosenAdventurerArgs {
    playerId: number;
    adventurer: Adventurer;
    dice: Die[];
    newPlayerColor: string; // without #
}

interface NotifChosenCompanionArgs {
    playerId: number;
    companion: Companion;
    spot: number;
    dice: Die[];
    removedBySpell: Spell;
    cemetaryTop?: Companion;
    ignoreCemetary?: boolean;
}

interface NotifRemoveCompanionsArgs {
    topCemeteryType: number;
}

interface NotifPointsArgs {
    playerId: number;
    points: number;
    newScore: number;
    incCompany?: number;
    company?: number;
}

interface NotifRerollsArgs {
    playerId: number;
    rerolls: number;
}

interface NotifFootprintsArgs {
    playerId: number;
    footprints: number;
}

interface NotifFirefliesArgs {
    playerId: number;
    fireflies: number;
}

interface NotifDiceUpdateArgs {
    playerId: number;
    dice: Die[];
    args?: EnteringRollDiceArgs;
}

interface NotifResolveCardUpdateArgs {
    resolveCardsForPlayer: ResolveCardsForPlayer;
}

interface NotifMeepleMovedArgs {
    meeple: Meeple;
}

interface NotifUsedDiceArgs {
    playerId: number;
    dieId: number;
}

interface NotifSketalDieArgs {
    playerId: number;
    die: Die;
    remove: true;
}

interface NotifMoveBlackDieArgs {
    die: Die;
}

interface NotifGiveHiddenSpellsArgs {
    playerId: number;
    spellsIds: { [playerId: number]: number };
}

interface NotifFootprintAddedArgs {
    spot: number;
    number: number;
}

interface NotifRevealSpellsArgs {
    spells: Spell[];
}

interface NotifRemoveSpellArgs {
    playerId: number;
    spell: Spell;
}

interface NotifUpdateSoloTilesArgs {
    topDeckType: number;
    topDeckBType: number;
    discardedSoloTiles: number;
    spot: number;
    soloTile: SoloTile;
}

interface NotifScorePointArgs {
    playerId: number;
    points: number;
}

interface NotifGetTokensArgs {
    playerId: number;
    tokens: Token[];
}

interface NotifRemoveTokenArgs {
    playerId: number;
    tokenId: number;
}
