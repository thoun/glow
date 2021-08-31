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
    value: number;
    extra: boolean;
    locked: boolean;
    rolled: boolean;
}

interface MeetingTrackSpot {
    companion: Companion;
    // TODO
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
}

interface ChooseAdventurerArgs {
    adventurers: Adventurer[];
}

interface RecruitCompanionArgs {
    companions: MeetingTrackSpot[];
}

interface ChoosePlayActionArgs {
    machine: Adventurer;
    canApplyEffect: boolean;
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

interface NotifChosenAdventurerArgs {
    playerId: number;
    adventurer: Adventurer;
    dice: Die[];
}

interface NotifMachinePlayedArgs {
    playerId: number;
    machine: Adventurer;
}

interface NotifMachineRepairedArgs {
    playerId: number;
    machine: Adventurer;
    machineSpot: number;
}

interface NotifTableMoveArgs {
    moved: { [originalSpot: number]: Adventurer };
}

interface NotifPointsArgs {
    playerId: number;
    points: number;
}

interface NotifResourcesArgs {
    playerId: number;
    resourceType: number;
    count: number;
    opponentId: number;
    opponentCount: number;
}

interface NotifAddMachinesToHandArgs {
    machines: Adventurer[];
    from: number;
    remainingMachines?: number;
}

interface NotifDiscardMachinesArgs {
    machines: Adventurer[];
}

interface NotifAddWorkshopProjectsArgs {
    playerId: number;
    projects: Companion[];
}

interface NotifRemoveProjectArgs {
    playerId: number;
    project: Companion;
}