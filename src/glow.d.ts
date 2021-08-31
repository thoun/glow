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

interface Die {
    id: number;
    face: number;
    value: number;
    color: number;
    rolled: boolean;
}

interface MeetingTrackSpot {
    companion: Companion;
    dice: Die[];
    footprints: number;
}

interface GlowPlayer extends Player {
    playerNo: number;
    adventurer: Adventurer;
    companions: Companion[];
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

    meetingTrack: MeetingTrackSpot[];

    endTurn: boolean;
}

interface GlowGame extends Game {
    adventurersStock: Stock;
    
    getPlayerId(): number;
    chooseAdventurer(id: number): void;
    selectMeetingTrackCompanion(spot: number): void;
    createAndPlaceDieHtml(die: Die, destinationId: string): void;    
    getDieDiv(die: Die): HTMLDivElement;
    addRollToDiv(dieDiv: HTMLDivElement, rollClass: string): void;
}

interface ChooseAdventurerArgs {
    adventurers: Adventurer[];
}

interface RecruitCompanionArgs {
    companions: MeetingTrackSpot[];
}

interface SelectMachineArgs {
    selectableMachines: Adventurer[];
}

interface SelectResourceArgs {
    possibleCombinations: number[][];
}

interface SelectProjectArgs {
    projects: Companion[];
    remainingProjects?: number;
}

interface Exchange {
    from: number;
    to: number;
}

interface SelectExchangeArgs {
    number: number;
    possibleExchanges: Exchange[];
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
}

interface NotifPointsArgs {
    playerId: number;
    points: number;
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
