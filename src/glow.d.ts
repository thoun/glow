interface Adventurer {
    id: number;
    color: number;
    location: string;
    location_arg: number;
    points: number;
    dice: number;
    effect: number;
}

interface Companion {
    id: number;
    type: number;
    subType: number;
    location: string;
    location_arg: number;
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

interface Die {
    id: number;
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


interface Effect {
    conditions: number[];
    effects: number[];
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
    topCemeteryType: number;

    meetingTrack: MeetingTrackSpot[];

    endTurn: boolean;

    tom: GlowPlayer;

    ADVENTURERS_EFFECTS: Effect[];
    COMPANIONS_EFFECTS: Effect[];
    SPELLS_EFFECTS: Effect[];
    SOLO_TILES: SoloTileCard[];
}

interface GlowGame extends Game {
    adventurersStock: Stock;
    
    getPlayerId(): number;
    getBoardSide(): number;
    isColorBlindMode(): boolean;
    chooseAdventurer(id: number): void;
    selectMeetingTrackCompanion(spot: number): void;
    //createAndPlaceDieHtml(die: Die, destinationId: string): void;    
    //getDieDiv(die: Die): HTMLDivElement;
    //addRollToDiv(dieDiv: HTMLDivElement, rollClass: string): void;
    createOrMoveDie(die: Die, destinationId: string, rollClass?: string): void;
    cardClick(type: number, id: number): void;
    selectMove(possibleDestination: Route): void;
    moveBlackDie(spot: number): void;
    selectSketalDie(dieId: number): void;
    isSolo(): boolean;
}

interface ChooseAdventurerArgs {
    adventurers: Adventurer[];
}

interface RecruitCompanionArgs {
    companions: MeetingTrackSpot[];
    topDeckType: number;
}

interface EnteringRollDiceForPlayer {
    rerollCompanion: number;
    rerollTokens: number;
    rerollScore: { [rerolls: number]: number }; // number of rerolls -> cost
}

interface EnteringRollDiceArgs {
    [playerId: number]: EnteringRollDiceForPlayer;
}

interface EnteringSelectSketalDieArgs {
    dice: Die[];
}

interface EnteringMoveBlackDieArgs {
    possibleSpots: number[];
}

interface EnteringResurrectArgs {
    cemeteryCards: Companion[];
}

interface ResolveCardsForPlayer {
    remainingEffects: number[][];
}

interface EnteringResolveCardsArgs {
    [playerId: number]: ResolveCardsForPlayer;
}

interface EnteringMoveForPlayer {
    possibleRoutes: Route[];
    canSettle?: boolean;
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
}

interface NotifChosenCompanionArgs {
    playerId: number;
    companion: Companion;
    spot: number;
    dice: Die[];
    removedBySpell: Spell;
    cemetaryTop?: Companion;
}

interface NotifRemoveCompanionsArgs {
    topCemeteryType: Companion;
}

interface NotifPointsArgs {
    playerId: number;
    points: number;
    incCompany?: number;
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
    dice: Die[];
    args?: EnteringRollDiceArgs;
}

interface NotifResolveCardUpdateArgs {
    resolveCardsForPlayer: ResolveCardsForPlayer;
}

interface NotifMoveUpdateArgs {
    args: EnteringMoveForPlayer;
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
