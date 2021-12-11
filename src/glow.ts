declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;

const ROLL_DICE_ACTION_BUTTONS_IDS = [`setRollDice-button`, `setChangeDie-button`, `keepDice-button`, `cancelRollDice-button`, `change-die-faces-buttons`];
const MOVE_ACTION_BUTTONS_IDS = [`placeEncampment-button`, `endTurn-button`, `cancelMoveDiscardCampanionOrSpell-button`];

const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
const ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0];
const LOCAL_STORAGE_ZOOM_KEY = 'Glow-zoom';

const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };

class Glow implements GlowGame {
    private gamedatas: GlowGamedatas;
    private rerollCounters: Counter[] = [];
    private footprintCounters: Counter[] = [];
    private fireflyCounters: Counter[] = [];
    private companionCounters: Counter[] = [];
    private roundCounter: Counter;
    private helpDialog: any;
    private selectedDice: Die[] = [];
    private selectedDieFace: number = null;
    private diceSelectionActive: boolean = false;
    private originalTextRollDice: string;
    private originalTextMove: string;
    private isChangeDie: boolean = false;
    private selectedRoute: Route;
    private moveArgs: EnteringMoveForPlayer;

    public adventurersStock: Stock;
    public cemetaryCompanionsStock: Stock;
    private board: Board;
    private meetingTrack: MeetingTrack;
    private playersTables: PlayerTable[] = [];

    public zoom: number = 1;

    private meetingTrackClickAction: 'recruit' | 'remove';

    private DICE_FACES_TOOLTIP: string[] = [];

    constructor() {    
        const zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
        if (zoomStr) {
            this.zoom = Number(zoomStr);
        }
    }
    
    /*
        setup:

        This method must set up the game user interface according to current game situation specified
        in parameters.

        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)

        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */

    public setup(gamedatas: GlowGamedatas) {
        (this as any).dontPreloadImage('publisher.png');
        (this as any).dontPreloadImage(`side${gamedatas.side == 2 ? 1 : 2}.png`);

        log( "Starting game setup" );

        for (let color=1; color<=8; color++) {
            let facesStr = '';
            for (let face=1; face<=6; face++) {
                facesStr += `[die:${color}:${face}]`;
            }
            this.DICE_FACES_TOOLTIP[color] = `<h3>${_("Die faces")}</h3> <div>${formatTextIcons(facesStr)}</div>`;
        }
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        dojo.addClass('board', `side${gamedatas.side}`);
        this.createPlayerPanels(gamedatas);
        const players = Object.values(gamedatas.players);
        if (players.length == 1) {
            players.push(gamedatas.tom);
        }
        this.board = new Board(this, players, gamedatas.tableDice);
        this.meetingTrack = new MeetingTrack(this, gamedatas.meetingTrack, gamedatas.topDeckType, gamedatas.topDeckBType, gamedatas.topCemeteryType, gamedatas.discardedSoloTiles);
        this.createPlayerTables(gamedatas);
        if (gamedatas.day > 0) {
            this.roundCounter = new ebg.counter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(gamedatas.day);
        }

        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }

        this.addHelp();
        this.setupNotifications();

        //this.setupPreferences();

        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        (this as any).onScreenWidthChange = () => {
            this.setAutoZoom();
        }

        log( "Ending game setup" );
    }

    ///////////////////////////////////////////////////
    //// Game & client states

    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    public onEnteringState(stateName: string, args: any) {
        log( 'Entering state: '+stateName , args.args );

        switch (stateName) {
            case 'chooseAdventurer':
                this.onEnteringStateChooseAdventurer(args.args);
                break;
            case 'startRound':
                this.onEnteringStateStartRound();
                break;
            case 'recruitCompanion':
                this.onEnteringStateRecruitCompanion(args.args);
                break;
            case 'removeCompanion':
                this.onEnteringStateRemoveCompanion(args.args);
                break;
            case 'moveBlackDie':                
                this.onEnteringStateMoveBlackDie(args.args);
                break;
            case 'rollDice':
                this.onEnteringStateRollDice();
                break;
            case 'move':
                this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                break;
            case 'endRound':
                const playerTable = this.getPlayerTable(this.getPlayerId());
                playerTable?.clearUsedDice();
                break;
            case 'gameEnd':
                const lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    }
    
    private setGamestateDescription(property: string = '') {
        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = `${originalState['description' + property]}`; 
        this.gamedatas.gamestate.descriptionmyturn = `${originalState['descriptionmyturn' + property]}`; 
        (this as any).updatePageTitle();        
    }

    private onEnteringStateStartRound() {
        if (document.getElementById('adventurers-stock')) {
            dojo.destroy('adventurers-stock');
            this.adventurersStock = null;
        }
    }

    private onEnteringStateChooseAdventurer(args: ChooseAdventurerArgs) {
        const adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place(`<div id="adventurers-stock"></div>`, 'currentplayertable', 'before');
            
            this.adventurersStock = new ebg.stock() as Stock;
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(0);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupAdventurerCard(this, cardDiv, type);
            dojo.connect(this.adventurersStock, 'onChangeSelection', this, () => this.onAdventurerSelection(this.adventurersStock.getSelectedItems()));

            setupAdventurersCards(this.adventurersStock);

            adventurers.forEach(adventurer => this.adventurersStock.addToStockWithId(adventurer.color, ''+adventurer.id));
        } else {
            this.adventurersStock.items.filter(item => !adventurers.some(adventurer => adventurer.color == item.type)).forEach(item => this.adventurersStock.removeFromStockById(item.id));
        }

        
        if((this as any).isCurrentPlayerActive()) {
            this.adventurersStock.setSelectionMode(1);
        }
    }

    private onEnteringStateRecruitCompanion(args: RecruitCompanionArgs) {
        this.meetingTrackClickAction = 'recruit';

        const solo = this.isSolo();

        args.companions.forEach((meetingTrackSpot, spot) =>  {
            if (spot >=1 && spot <=5) {
                this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
                this.meetingTrack.placeSmallDice(meetingTrackSpot.dice);
                this.meetingTrack.setFootprintTokens(spot, meetingTrackSpot.footprints);
                if (solo) {
                    this.meetingTrack.setSoloTile(meetingTrackSpot, spot);
                }
            }
        });

        this.meetingTrack.setDeckTop(DECK, args.topDeckType);
        
        if((this as any).isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    }

    private onEnteringChooseTomDice(args: EnteringSelectSketalDieArgs) {
        // remove color duplicates
        args.dice.filter((die, index, self) => index === self.findIndex((t) => t.color === die.color)).forEach(die => {
            const html = `<div class="die-item color${die.color} side${Math.min(6, die.color)}"></div>`;

            (this as any).addActionButton(`selectTomDie${die.color}-button`, html, () => this.onTomDiceSelection(die), null, null, 'gray');
        });

        (this as any).addActionButton(`confirmTomDice-button`, _("Confirm"), () => this.chooseTomDice());
        dojo.addClass(`confirmTomDice-button`, 'disabled');
    }

    private onEnteringSelectSketalDie(args: EnteringSelectSketalDieArgs) {
        // remove color duplicates
        args.dice.filter((die, index, self) => index === self.findIndex((t) => t.color === die.color)).forEach(die => {
            const html = `<div class="die-item color${die.color} side${Math.min(6, die.color)}"></div>`;

            (this as any).addActionButton(`selectSketalDie${die.id}-button`, html, () => this.selectSketalDie(die.id));
        });
    }

    private onEnteringStateRemoveCompanion(args: RecruitCompanionArgs) {
        this.meetingTrackClickAction = 'remove';

        args.companions.forEach((meetingTrackSpot, spot) =>  {
            if (spot >=1 && spot <=5) {
                this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
            }
        });
        
        if((this as any).isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    }

    private onEnteringStateMoveBlackDie(args: EnteringMoveBlackDieArgs) {
        if ((this as any).isCurrentPlayerActive()) {
            this.meetingTrack.setSelectableDice(args.possibleSpots);
        }
    }

    private onEnteringStateRollDice() {
        this.setDiceSelectionActive(true);
    }

    private onEnteringResurrect(args: EnteringResurrectArgs) {
        
        const companions = args.cemeteryCards;
        if (!document.getElementById('cemetary-companions-stock')) {
            dojo.place(`<div id="cemetary-companions-stock"></div>`, 'currentplayertable', 'before');
            
            this.cemetaryCompanionsStock = new ebg.stock() as Stock;
            this.cemetaryCompanionsStock.create(this, $('cemetary-companions-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.cemetaryCompanionsStock.setSelectionMode(0);            
            this.cemetaryCompanionsStock.setSelectionAppearance('class');
            this.cemetaryCompanionsStock.selectionClass = 'nothing';
            this.cemetaryCompanionsStock.centerItems = true;
            this.cemetaryCompanionsStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupCompanionCard(this, cardDiv, type);
            dojo.connect(this.cemetaryCompanionsStock, 'onChangeSelection', this, () => this.onCemetarySelection(this.cemetaryCompanionsStock.getSelectedItems()));

            setupCompanionCards(this.cemetaryCompanionsStock);

            companions.forEach(companion => this.cemetaryCompanionsStock.addToStockWithId(companion.subType, ''+companion.id, CEMETERY));

            this.meetingTrack.setDeckTop(CEMETERY, 0);
        }
        
        if((this as any).isCurrentPlayerActive()) {
            this.cemetaryCompanionsStock.setSelectionMode(1);

            (this as any).addActionButton(`skipResurrect-button`, _("Skip"), () => this.skipResurrect(), null, null, 'red');
        }
        
    }

    private onEnteringStateResolveCards(resolveCardsForPlayer: ResolveCardsForPlayer) {
        this.onLeavingResolveCards();

        const playerId = this.getPlayerId();
        const playerTable = this.getPlayerTable(playerId);
        
        resolveCardsForPlayer.remainingEffects.forEach(possibleEffect => {
            const cardType = possibleEffect[0];
            const cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(`${playerTable.adventurerStock.container_div.id}_item_${cardId}`, 'selectable');
            } else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                dojo.addClass(`${playerTable.companionsStock.container_div.id}_item_${cardId}`, 'selectable');
            } if (cardType === 2) { // spells
                playerTable.spellsStock.setSelectionMode(1);
                if (document.getElementById(`${playerTable.spellsStock.container_div.id}_item_${cardId}`)) {
                    dojo.addClass(`${playerTable.spellsStock.container_div.id}_item_${cardId}`, 'selectable');
                } else if (playerTable.companionSpellStock && document.getElementById(`${playerTable.companionSpellStock.container_div.id}_item_${cardId}`)) {
                    playerTable.companionSpellStock.setSelectionMode(1);
                    dojo.addClass(`${playerTable.companionSpellStock.container_div.id}_item_${cardId}`, 'selectable');
                }
            }
        });
    }

    private onEnteringStateMove() {
        this.board.createDestinationZones(this.moveArgs.possibleRoutes?.map(route => route));
        
        if (this.gamedatas.side === 1) {
            if (!document.getElementById(`placeEncampment-button`)) {
                (this as any).addActionButton(`placeEncampment-button`, _("Place encampment"), () => this.placeEncampment());
            }
            dojo.toggleClass(`placeEncampment-button`, 'disabled', !this.moveArgs.canSettle);
        }

        if (!document.getElementById(`endTurn-button`)) {
            (this as any).addActionButton(`endTurn-button`, _("End turn"), () => this.endTurn(), null, null, 'red');
        }
    }

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'chooseAdventurer':
                this.onLeavingChooseAdventurer();
                break;
            case 'chooseTomDice':
                this.selectedDice = [];
                break;
            case 'recruitCompanion':
                this.onLeavingRecruitCompanion();
                break;
            case 'moveBlackDie':                
                this.onLeavingMoveBlackDie();
                break;
            case 'rollDice':
                this.onLeavingRollDice();
                break;
            case 'resurrect':
                this.onLeavingResurrect();
                break;
            case 'resolveCards':
                this.onLeavingResolveCards();
                break;
        }
    }

    private onLeavingChooseAdventurer() {
        this.adventurersStock.setSelectionMode(0);
    }

    private onLeavingRecruitCompanion() {
        this.meetingTrack.setSelectionMode(0);
    }

    private onLeavingMoveBlackDie() {
        this.meetingTrack.setSelectableDice([]);
    }

    private onLeavingRollDice() {
        this.setDiceSelectionActive(false);
    }

    private onLeavingResurrect() {
        if (document.getElementById('cemetary-companions-stock')) {
            this.cemetaryCompanionsStock.removeAllTo(CEMETERY);
            (this as any).fadeOutAndDestroy('cemetary-companions-stock');
            this.cemetaryCompanionsStock = null;
        }
    }

    private onLeavingResolveCards() {
        (Array.from(document.getElementsByClassName('selectable')) as HTMLElement[]).forEach(node => dojo.removeClass(node, 'selectable'));
        [...this.playersTables.map(pt => pt.adventurerStock), ...this.playersTables.map(pt => pt.companionsStock), ...this.playersTables.map(pt => pt.spellsStock)].forEach(stock => stock.setSelectionMode(0));
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseTomDice':
                    this.onEnteringChooseTomDice(args as EnteringSelectSketalDieArgs);
                    break;
                case 'selectSketalDie': case 'selectSketalDieMulti':
                    this.onEnteringSelectSketalDie(args as EnteringSelectSketalDieArgs);
                    break;
                case 'rollDice':
                    this.gamedatas.gamestate.args[this.getPlayerId()] = (args as EnteringRollDiceArgs)[this.getPlayerId()];
                    this.setActionBarRollDice(false);
                    break;
                case 'resolveCards':
                    const resolveCardsArgs = (args as EnteringResolveCardsArgs)[this.getPlayerId()];
                    this.onEnteringStateResolveCards(resolveCardsArgs);
                    (this as any).addActionButton(`resolveAll-button`, _("Resolve all"), () => this.resolveAll(), null, null, 'red');
                    break;
                case 'move':
                    this.moveArgs = (args as EnteringMoveArgs)[this.getPlayerId()];
                    this.setActionBarMove(false);
                    break;

            }
        }

        switch (stateName) {
            case 'resurrect':
                this.onEnteringResurrect(args as EnteringResurrectArgs);
                break;
        }
    }  

    ///////////////////////////////////////////////////
    //// Utility methods


    ///////////////////////////////////////////////////

    private setZoom(zoom: number = 1) {
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, ''+this.zoom);
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);

        const div = document.getElementById('full-table');
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
        } else {
            div.style.transform = `scale(${zoom})`;
            div.style.margin = `0 ${ZOOM_LEVELS_MARGIN[newIndex]}% ${(1-zoom)*-100}% 0`;
        }

        const stocks = this.playersTables.map(pt => pt.companionsStock);
        if (this.adventurersStock) {
            stocks.push(this.adventurersStock);
        }
        stocks.forEach(stock => stock.updateDisplay());

        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;

        const fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 916*zoom ? 'block' : 'flex';
    }

    public zoomIn() {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public zoomOut() {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }

    public setAutoZoom() {
        
        const zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;

        if (!zoomWrapperWidth) {
            setTimeout(() => this.setAutoZoom(), 200);
            return;
        }

        let newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth/newZoom < 916 /* board width */) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        this.setZoom(newZoom);
    }

    /*private setupPreferences() {
        // Extract the ID and value from the UI control
        const onchange = (e) => {
          var match = e.target.id.match(/^preference_control_(\d+)$/);
          if (!match) {
            return;
          }
          var prefId = +match[1];
          var prefValue = +e.target.value;
          (this as any).prefs[prefId].value = prefValue;
          this.onPreferenceChange(prefId, prefValue);
        }
        
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        
        // Call onPreferenceChange() now
        dojo.forEach(
          dojo.query("#ingame_menu_content .preference_control"),
          el => onchange({ target: el })
        );
    }
      
    private onPreferenceChange(prefId: number, prefValue: number) {
        switch (prefId) {
            // KEEP
            case 201: 
                document.getElementById('full-table').appendChild(document.getElementById(prefValue == 2 ? 'table-wrapper' : 'playerstables'));
                break;
        }
    }*/

    public isSolo(): boolean {
        return Object.keys(this.gamedatas.players).length == 1;
    }

    private onTomDiceSelection(die: Die) {
        const index = this.selectedDice.findIndex(d => d.id == die.id);
        if (index !== -1) {
            // we deselect
            this.selectedDice.splice(index, 1);

            if (die.color == 6) {
                document.getElementById(`selectTomDie7-button`)?.classList.remove('disabled');
            } else if (die.color == 7) {
                document.getElementById(`selectTomDie6-button`)?.classList.remove('disabled');
            }
        } else {
            // we select
            this.selectedDice.push(die);

            if (die.color == 6) {
                document.getElementById(`selectTomDie7-button`)?.classList.add('disabled');
            } else if (die.color == 7) {
                document.getElementById(`selectTomDie6-button`)?.classList.add('disabled');
            }
        }

        dojo.toggleClass(`selectTomDie${die.color}-button`, 'bgabutton_blue', index === -1);
        dojo.toggleClass(`selectTomDie${die.color}-button`, 'bgabutton_gray', index !== -1);

        dojo.toggleClass(`confirmTomDice-button`, 'disabled', this.selectedDice.length != 2);
    }

    placeFirstPlayerToken(playerId: number) {
        const firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(firstPlayerToken, `player_board_${playerId}_firstPlayerWrapper`);
        } else {
            dojo.place('<div id="firstPlayerToken"></div>', `player_board_${playerId}_firstPlayerWrapper`);

            (this as any).addTooltipHtml('firstPlayerToken', _("First Player token"));
        }
    }

    public onCemetarySelection(items: any) {
        if (items.length == 1) {
            const card = items[0];
            this.resurrect(card.id);
        }
    }

    public onAdventurerSelection(items: any) {
        if (items.length == 1) {
            const card = items[0];
            this.chooseAdventurer(card.id);
        }
    }

    public getPlayerId(): number {
        return Number((this as any).player_id);
    }

    
    public getBoardSide(): number {
        return this.gamedatas.side;
    }
    public isColorBlindMode(): boolean {
        return (this as any).prefs[201].value == 1;
    }

    public getOpponentId(playerId: number): number {
        return Number(Object.values(this.gamedatas.players).find(player => Number(player.id) != playerId).id);
    }

    public getPlayerScore(playerId: number): number {
        return (this as any).scoreCtrl[playerId]?.getValue() ?? Number(this.gamedatas.players[playerId].score);
    }

    private getPlayerTable(playerId: number): PlayerTable {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }

    private createPlayerPanels(gamedatas: GlowGamedatas) {

        const players = Object.values(gamedatas.players);
        const solo = players.length === 1;

        if (solo) {
            dojo.place(`
            <div id="overall_player_board_0" class="player-board current-player-board">					
                <div class="player_board_inner" id="player_board_inner_982fff">
                    
                    <div class="emblemwrap" id="avatar_active_wrap_0">
                        <div src="img/gear.png" alt="" class="avatar avatar_active" id="avatar_active_0"></div>
                    </div>
                                               
                    <div class="player-name" id="player_name_0">
                        Tom
                    </div>
                    <div id="player_board_0" class="player_board_content">
                        <div class="player_score">
                            <span id="player_score_0" class="player_score_value">10</span> <i class="fa fa-star" id="icon_point_0"></i>           
                        </div>
                    </div>
                </div>
            </div>`, `overall_player_board_${players[0].id}`, 'after');

            const tomScoreCounter = new ebg.counter();
            tomScoreCounter.create(`player_score_0`);
            tomScoreCounter.setValue(gamedatas.tom.score);
            (this as any).scoreCtrl[0] = tomScoreCounter;
        }

        (solo ? [...players, gamedatas.tom] : players).forEach(player => {
            const playerId = Number(player.id);     

            // counters
            dojo.place(`
            <div class="counters">
                <div id="reroll-counter-wrapper-${player.id}" class="reroll-counter">
                    <div class="icon reroll"></div> 
                    <span id="reroll-counter-${player.id}"></span>
                </div>
                <div id="footprint-counter-wrapper-${player.id}" class="footprint-counter">
                    <div class="icon footprint"></div> 
                    <span id="footprint-counter-${player.id}"></span>
                </div>
                <div id="firefly-counter-wrapper-${player.id}" class="firefly-counter">
                </div>
            </div>
            `, `player_board_${player.id}`);

            const rerollCounter = new ebg.counter();
            rerollCounter.create(`reroll-counter-${playerId}`);
            rerollCounter.setValue(player.rerolls);
            this.rerollCounters[playerId] = rerollCounter;

            const footprintCounter = new ebg.counter();
            footprintCounter.create(`footprint-counter-${playerId}`);
            footprintCounter.setValue(player.footprints);
            this.footprintCounters[playerId] = footprintCounter;

            if (playerId != 0) {
                dojo.place(`
                    <div id="firefly-counter-icon-${player.id}" class="icon firefly"></div> 
                    <span id="firefly-counter-${player.id}"></span>&nbsp;/&nbsp;<span id="companion-counter-${player.id}"></span>
                `, `firefly-counter-wrapper-${player.id}`);

                const fireflyCounter = new ebg.counter();
                fireflyCounter.create(`firefly-counter-${playerId}`);
                const allFireflies = player.fireflies + player.companions.map(companion => companion.fireflies).reduce((a, b) => a + b, 0);
                fireflyCounter.setValue(allFireflies);
                this.fireflyCounters[playerId] = fireflyCounter;

                const companionCounter = new ebg.counter();
                companionCounter.create(`companion-counter-${playerId}`);
                companionCounter.setValue(player.companions.length);
                this.companionCounters[playerId] = companionCounter;

                this.updateFireflyCounterIcon(playerId);
            }
            
            if (!solo) {
                // first player token
                dojo.place(`<div id="player_board_${player.id}_firstPlayerWrapper"></div>`, `player_board_${player.id}`);

                if (gamedatas.firstPlayer === playerId) {
                    this.placeFirstPlayerToken(gamedatas.firstPlayer);
                }

            } else if (playerId == 0) {
                dojo.place(`<div id="tomDiceWrapper"></div>`, `player_board_${player.id}`);
                if (gamedatas.tom.dice) {
                    this.setTomDice(gamedatas.tom.dice);
                }
            }
            
            if (this.isColorBlindMode() && playerId != 0) {
            dojo.place(`
            <div class="token meeple${this.gamedatas.side == 2 ? 0 : 1} color-blind meeple-player-${player.id}" data-player-no="${player.playerNo}" style="background-color: #${player.color};"></div>
            `, `player_board_${player.id}`);
            }
        });

        (this as any).addTooltipHtmlToClass('reroll-counter', _("Rerolls tokens"));
        (this as any).addTooltipHtmlToClass('footprint-counter', _("Footprints tokens"));
        (this as any).addTooltipHtmlToClass('firefly-counter', _("Fireflies (tokens + companion fireflies) / number of companions"));
    }
    
    private updateFireflyCounterIcon(playerId: number) {
        const activated = this.fireflyCounters[playerId].getValue() >= this.companionCounters[playerId].getValue();
        
        document.getElementById(`firefly-counter-icon-${playerId}`).dataset.activated = activated.toString();
    }

    private createPlayerTables(gamedatas: GlowGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;

        orderedPlayers.forEach(player => this.createPlayerTable(gamedatas, Number(player.id)) );
    }

    private createPlayerTable(gamedatas: GlowGamedatas, playerId: number) {
        const playerTable = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(playerTable);
    }

    private createAndPlaceDieHtml(die: Die, destinationId: string) {
        let html = `<div id="die${die.id}" class="die die${die.face} ${die.small ? 'small' : ''} ${die.used ? 'used' : ''}" data-die-id="${die.id}" data-die-value="${die.face}">
        <ol class="die-list" data-roll="${die.face}">`;
        for (let dieFace=1; dieFace<=6; dieFace++) {
            html += `<li class="die-item color${die.color} side${dieFace}" data-side="${dieFace}"></li>`;
        }
        html += `   </ol>
        </div>`;

        // security to destroy pre-existing die with same id
        //const dieDiv = document.getElementById(`die${die.id}`);
        //dieDiv?.parentNode.removeChild(dieDiv);
        dojo.place(html, destinationId);

        document.getElementById(`die${die.id}`).addEventListener('click', () => this.onDiceClick(die));

        (this as any).addTooltipHtml(`die${die.id}`, this.DICE_FACES_TOOLTIP[die.color]);        
    }

    public createOrMoveDie(die: Die, destinationId: string, rollClass: string = '-') {
        const dieDiv = this.getDieDiv(die);

        if (dieDiv) {
            this.setNewFace(die, true);
            dojo.toggleClass(`die${die.id}`, 'used', die.used);

            slideToObjectAndAttach(dieDiv, destinationId);
        } else {
            this.createAndPlaceDieHtml(die, destinationId);
            if (rollClass) {
                this.addRollToDiv(this.getDieDiv(die), rollClass);
            }
        }
    }

    private setNewFace(die: Die, addChangeDieRoll: boolean = false) {
        const dieDiv = this.getDieDiv(die);

        if (dieDiv) {
            const currentValue = Number(dieDiv.dataset.dieValue);
            if (currentValue != die.face) {
                dieDiv.classList.remove(`die${currentValue}`);
                dieDiv.classList.add(`die${die.face}`);
                dieDiv.dataset.dieValue = ''+die.face;

                if (addChangeDieRoll) {
                    this.addRollToDiv(dieDiv, 'change');
                }
            }
        }
    }

    private getDieDiv(die: Die): HTMLDivElement {
        return document.getElementById(`die${die.id}`) as HTMLDivElement;
    }

    private addRollToDiv(dieDiv: HTMLDivElement, rollClass: string, attempt: number = 0) {
        dieDiv.classList.remove('rolled');
        if (rollClass === 'odd' || rollClass ==='even') {
            dieDiv.addEventListener('animationend', () => {
                dieDiv.classList.remove('rolled');
            })
            setTimeout(() => dieDiv.classList.add('rolled'), 50);
        }

        const dieList = dieDiv.getElementsByClassName('die-list')[0] as HTMLDivElement;
        if (dieList) {
            dieList.dataset.rollType = '-';
            dieList.dataset.roll = dieDiv.dataset.dieValue;
            setTimeout(() => dieList.dataset.rollType = rollClass, 50);
        } else if (attempt < 5) {
            setTimeout(() => this.addRollToDiv(dieDiv, rollClass, attempt + 1), 200); 
        }
    }

    private removeRollDiceActionButtons() {
        const ids = ROLL_DICE_ACTION_BUTTONS_IDS;
        for (let i=1; i<=6; i++) {
            ids.push(`changeDie${i}-button`);
        }
        ids.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });

        const rollDiceButtons = this.getRollDiceButtons();
        rollDiceButtons.forEach(elem => elem.parentElement.removeChild(elem));
        const changeDieButtons = this.getChangeDieButtons();
        changeDieButtons.forEach(elem => elem.parentElement.removeChild(elem));
    }
    
    private setRollDiceGamestateDescription(property?: string) {
        if (!this.originalTextRollDice) {
            this.originalTextRollDice = document.getElementById('pagemaintitletext').innerHTML;
        }

        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ? 
            originalState['description' + property] : 
            this.originalTextRollDice;
    }
    
    private setActionBarRollDice(fromCancel: boolean) {
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        if (fromCancel) {
            this.setRollDiceGamestateDescription();
            this.unselectDice();
        }

        const rollDiceArgs = this.gamedatas.gamestate.args[this.getPlayerId()];
        const possibleRerolls = rollDiceArgs.rerollCompanion + rollDiceArgs.rerollTokens + Object.values(rollDiceArgs.rerollScore).length;

        (this as any).addActionButton(`setRollDice-button`, _("Reroll 1 or 2 dice") + formatTextIcons(' (1 [reroll] )'), () => this.setActionBarSelectRollDice());
        (this as any).addActionButton(`setChangeDie-button`, _("Change die face") + formatTextIcons(' (3 [reroll] )'), () => this.setActionBarSelectChangeDie());
        (this as any).addActionButton(`keepDice-button`, _("Keep current dice"), () => this.keepDice(), null, null, 'red');

        dojo.toggleClass(`setRollDice-button`, 'disabled', possibleRerolls < 1);
        dojo.toggleClass(`setChangeDie-button`, 'disabled', possibleRerolls < 3);
    }
    
    private getPossibleCosts(costNumber: number) {
        const playerArgs: EnteringRollDiceForPlayer = this.gamedatas.gamestate.args[this.getPlayerId()];

        const possibleCosts = [];
        const canUse = [
            playerArgs.rerollCompanion,
            playerArgs.rerollTokens,
            Object.values(playerArgs.rerollScore).length,
        ];        
        
        [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].forEach(orderArray => {
            let remainingCost = costNumber;

            for (let i = 1; i <= costNumber; i++) {
                const possibleCost = [0, 0, 0];
                orderArray.forEach((order, orderIndex) => {
                    if (remainingCost > 0 && canUse[order] > 0) {
                        let min = Math.min(remainingCost, canUse[order]);
                        if (orderIndex === 0) {
                            min = Math.min(min, i);
                        }
                        remainingCost -= min;
                        possibleCost[order] += min;
                    }
                });
                if (possibleCost.reduce((a, b) => a + b, 0) === costNumber && !possibleCosts.some(other => possibleCost[0] == other[0] && possibleCost[1] == other[1] && possibleCost[2] == other[2])) {
                    possibleCosts.push(possibleCost);
                }
            }
        });

        return possibleCosts;
    }

    private getRollDiceButtons(): HTMLElement[] {
        return Array.from(document.querySelectorAll('[id^="rollDice-button"]'));
    }

    private getChangeDieButtons(): HTMLElement[] {
        return Array.from(document.querySelectorAll('[id^="changeDie-button"]'));
    }

    private setActionBarSelectRollDice() {
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription(`rollDice`);

        const possibleCosts = this.getPossibleCosts(1);
        possibleCosts.forEach((possibleCost, index) => {
            const costStr = possibleCost.map((cost, costTypeIndex) => this.getRollDiceCostStr(costTypeIndex, cost)).filter(str => str !== null).join(' ');
            (this as any).addActionButton(`rollDice-button${index}`, _("Reroll selected dice") + ` (${costStr})`, () => this.rollDice(possibleCost));
            dojo.toggleClass(`rollDice-button${index}`, 'disabled', this.selectedDice.length < 1 || this.selectedDice.length > 2);

        });
        (this as any).addActionButton(`cancelRollDice-button`, _("Cancel"), () => this.setActionBarRollDice(true));
    }
    
    private setActionBarSelectChangeDie() {
        this.isChangeDie = true;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription(`changeDie`);

        dojo.place(`<div id="change-die-faces-buttons"></div>`, 'generalactions');

        const possibleCosts = this.getPossibleCosts(3);
        possibleCosts.forEach((possibleCost, index) => {
            const costStr = possibleCost.map((cost, costTypeIndex) => this.getRollDiceCostStr(costTypeIndex, cost)).filter(str => str !== null).join(' ');
            (this as any).addActionButton(`changeDie-button${index}`, _("Change selected die") + `(${costStr})`, () => this.changeDie(possibleCost));
            dojo.addClass(`changeDie-button${index}`, 'disabled');
        });
        (this as any).addActionButton(`cancelRollDice-button`, _("Cancel"), () => this.setActionBarRollDice(true));

        if (this.selectedDice.length === 1) {
            this.onSelectedDiceChange();
        }
    }

    private removeMoveActionButtons() {
        const ids = MOVE_ACTION_BUTTONS_IDS;
        ids.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        })
    }
    
    private setMoveGamestateDescription(property?: string) {
        if (!this.originalTextMove) {
            this.originalTextMove = document.getElementById('pagemaintitletext').innerHTML;
        }

        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ? 
            originalState['description' + property] : 
            this.originalTextMove;
    }
    
    private setActionBarMove(fromCancel: boolean) {
        this.removeMoveActionButtons();
        if (fromCancel) {
            this.setMoveGamestateDescription();
        }            
        // make cards unselectable
        this.onLeavingResolveCards();
        
        this.onEnteringStateMove();
    }
    

    private setActionBarMoveDiscardCampanionOrSpell() {
        this.removeMoveActionButtons();
        this.board.createDestinationZones(null);
        this.setMoveGamestateDescription(`discard`);

        (this as any).addActionButton(`cancelMoveDiscardCampanionOrSpell-button`, _("Cancel"), () => this.setActionBarMove(true));

        // make cards selectable
        const playerTable = this.getPlayerTable(this.getPlayerId());
        playerTable.companionsStock?.setSelectionMode(1);
        playerTable.companionsStock?.items.forEach(item => dojo.addClass(`${playerTable.companionsStock.container_div.id}_item_${item.id}`, 'selectable'));
        playerTable.spellsStock?.setSelectionMode(1);
        playerTable.spellsStock?.items.forEach(item => dojo.addClass(`${playerTable.spellsStock.container_div.id}_item_${item.id}`, 'selectable'));
        playerTable.companionSpellStock?.setSelectionMode(1);
        playerTable.companionSpellStock?.items.forEach(item => dojo.addClass(`${playerTable.companionSpellStock.container_div.id}_item_${item.id}`, 'selectable'));
    }

    private setTomDice(dice: Die[]) {
        dice.forEach(die => this.createOrMoveDie({...die, id: 1000 + die.id}, `tomDiceWrapper`));
    }

    private getRollDiceCostStr(typeIndex: number, cost: number) {
        if (cost < 1) {
            return null;
        }
        switch (typeIndex) {
            case 0:
                return `${cost > 1 ? `${cost} ` : ''}Lumipili`;
            case 1:
                return formatTextIcons(`-${cost} [reroll]`);
            case 2:
                const playerArgs: EnteringRollDiceForPlayer = this.gamedatas.gamestate.args[this.getPlayerId()];
                return formatTextIcons(`-${playerArgs.rerollScore[cost]} [point] `);
        }
    }

    private onSelectedDiceChange() {
        const count = this.selectedDice.length;
        this.getRollDiceButtons().forEach(button => dojo.toggleClass(button, 'disabled', count < 1 || count > 2));

        if (this.isChangeDie) {
            if (count === 1) {
                this.selectedDieFace = null;
                const die = this.selectedDice[0];
                const cancel = document.getElementById(`cancelRollDice-button`);
                cancel?.parentElement.removeChild(cancel);

                const faces = die.color <= 5 ? 5 : 6;
                const facesButtons = document.getElementById('change-die-faces-buttons');

                for (let i=1; i<=faces; i++) {
                    const html = `<div class="die-item color${die.color} side${i}"></div>`;

                    (this as any).addActionButton(`changeDie${i}-button`, html, () => {
                        if (this.selectedDieFace !== null) {
                            dojo.removeClass(`changeDie${this.selectedDieFace}-button`, 'bgabutton_blue');
                            dojo.addClass(`changeDie${this.selectedDieFace}-button`, 'bgabutton_gray');
                        } else {
                            const changeDieButtons = this.getChangeDieButtons();
                            changeDieButtons.forEach(elem => dojo.removeClass(elem, 'disabled'));
                        }

                        this.selectedDieFace = i;
                        dojo.removeClass(`changeDie${this.selectedDieFace}-button`, 'bgabutton_gray');
                        dojo.addClass(`changeDie${this.selectedDieFace}-button`, 'bgabutton_blue');
                    }, null, null, 'gray');
                    facesButtons.appendChild(document.getElementById(`changeDie${i}-button`));                    
                }

                (this as any).addActionButton(`cancelRollDice-button`, _("Cancel"), () => this.setActionBarRollDice(true));
            } else {
                for (let i=1; i<=6; i++) {
                    const elem = document.getElementById(`changeDie${i}-button`);
                    elem?.parentElement.removeChild(elem);
                }
            }
        }
    }

    private onDiceClick(die: Die, force: boolean = null) {
        if (!this.diceSelectionActive && !force) {
            return;
        }

        const index = this.selectedDice.findIndex(d => d.id === die.id);
        const selected = force !== null ? !force : index !== -1;

        if (selected) {
            this.selectedDice.splice(index, 1);
        } else {
            this.selectedDice.push(die);
        }

        dojo.toggleClass(`die${die.id}`, 'selected', !selected);

        this.onSelectedDiceChange();
    }

    private unselectDice() {
        this.selectedDice.forEach(die => this.onDiceClick(die, false));
    }

    private setDiceSelectionActive(active: boolean) {        
        this.unselectDice();
        this.diceSelectionActive = active;        
        (Array.from(document.getElementsByClassName('die')) as HTMLElement[]).forEach(node => dojo.toggleClass(node, 'selectable', active));
    }

    private diceChangedOrRolled(dice: Die[], changed: boolean, args: EnteringRollDiceArgs) {
        this.unselectDice();
        dice.forEach(die => {
            dojo.removeClass(`die${die.id}`, 'selected');
            this.setNewFace(die);
            this.addRollToDiv(this.getDieDiv(die), changed ? 'change' : (Math.random() > 0.5 ? 'odd' : 'even'));
        });

        if (args) {
            this.gamedatas.gamestate.args[this.getPlayerId()] = args[this.getPlayerId()];
            if((this as any).isCurrentPlayerActive()) {
                this.setActionBarRollDice(true);
            }
        }
    }

    public selectMove(possibleDestination: Route): void {
        let mustDiscard = possibleDestination.costForPlayer.some(cost => cost == 37);
        
        if (mustDiscard) {
            const playerTable = this.getPlayerTable(this.getPlayerId());
            mustDiscard = !!(playerTable.companionsStock?.items.length || 
                playerTable.spellsStock?.items.length || 
                playerTable.companionSpellStock?.items.length);
        }

        if (mustDiscard) {
            this.selectedRoute = possibleDestination;
            
            this.setActionBarMoveDiscardCampanionOrSpell();
        } else {
            this.move(possibleDestination.destination, possibleDestination.from);
        }
    }

    public cardClick(type: number, id: number) {
        if (this.gamedatas.gamestate.name === 'resolveCards') {
            this.resolveCard(type, id);
        } else if (this.gamedatas.gamestate.name === 'move') {
            this.move(this.selectedRoute.destination, this.selectedRoute.from, type, id);
        } else {
            console.error('No card action in the state');
        }
    }

    private rollDice(cost: number[]) {
        if(!(this as any).checkAction('rollDice')) {
            return;
        }

        this.takeAction('rollDice', { 
            ids: this.selectedDice.map(die => die.id).join(','),
            cost: cost.join(','),
        });
    }
    
    private changeDie(cost: number[]) {
        if(!(this as any).checkAction('changeDie')) {
            return;
        }

        this.takeAction('changeDie', { 
            id: this.selectedDice[0].id,
            value : this.selectedDieFace,
            cost: cost.join(','),
        });
    }

    public selectMeetingTrackCompanion(spot: number) {
        if (this.meetingTrackClickAction === 'remove') {
            this.removeCompanion(spot);
        } else {
            this.recruitCompanion(spot);
        }
    }

    public chooseAdventurer(id: number) {
        if(!(this as any).checkAction('chooseAdventurer')) {
            return;
        }

        this.takeAction('chooseAdventurer', {
            id
        });
    }

    
    public chooseTomDice() {
        if(!(this as any).checkAction('chooseTomDice')) {
            return;
        }

        this.takeAction('chooseTomDice', {
            dice: this.selectedDice.map(die => die.id).join(',')
        });
    }

    public recruitCompanion(spot: number) {
        if(!(this as any).checkAction('recruitCompanion')) {
            return;
        }

        this.takeAction('recruitCompanion', {
            spot
        });
    }

    public selectSketalDie(id: number) {
        if(!(this as any).checkAction('selectSketalDie')) {
            return;
        }

        this.takeAction('selectSketalDie', {
            id
        });
    }

    public removeCompanion(spot: number) {
        if(!(this as any).checkAction('removeCompanion')) {
            return;
        }

        this.takeAction('removeCompanion', {
            spot
        });
    }

    public moveBlackDie(spot: number) {
        if(!(this as any).checkAction('moveBlackDie')) {
            return;
        }

        this.takeAction('moveBlackDie', {
            spot
        });
    }

    public keepDice() {
        if(!(this as any).checkAction('keepDice')) {
            return;
        }

        this.takeAction('keepDice');
    }

    public resurrect(id: number) {
        if(!(this as any).checkAction('resurrect')) {
            return;
        }

        this.takeAction('resurrect', {
            id
        });
    }

    public skipResurrect() {
        if(!(this as any).checkAction('skipResurrect')) {
            return;
        }

        this.takeAction('skipResurrect');
    }

    public resolveCard(type: number, id: number) {
        if(!(this as any).checkAction('resolveCard')) {
            return;
        }

        this.takeAction('resolveCard', {
            type,
            id,
        });
    }

    public resolveAll() {
        if(!(this as any).checkAction('resolveAll')) {
            return;
        }

        this.takeAction('resolveAll');
    }

    public move(destination: number, from?: number, type?: number, id?: number) {
        if(!(this as any).checkAction('move')) {
            return;
        }

        this.takeAction('move', {
            destination,
            from,
            type,
            id,
        });
    }

    public placeEncampment() {
        if(!(this as any).checkAction('placeEncampment')) {
            return;
        }

        this.takeAction('placeEncampment');
    }

    public endTurn() {
        if(!(this as any).checkAction('endTurn')) {
            return;
        }

        this.takeAction('endTurn');
    } 

    public takeAction(action: string, data?: any) {
        data = data || {};
        data.lock = true;
        (this as any).ajaxcall(`/glow/glow/${action}.html`, data, this, () => {});
    }
    
    private setPoints(playerId: number, points: number) {
        (this as any).scoreCtrl[playerId]?.toValue(points);
        this.board.setPoints(playerId, points);
    }
    
    private incRerolls(playerId: number, footprints: number) {
        this.rerollCounters[playerId]?.incValue(footprints);
        this.getPlayerTable(playerId).setTokens('reroll', this.rerollCounters[playerId]?.getValue());
    }
    
    private incFootprints(playerId: number, footprints: number) {
        this.footprintCounters[playerId]?.incValue(footprints);
        this.getPlayerTable(playerId).setTokens('footprint', this.footprintCounters[playerId]?.getValue());
    }
    
    private incFireflies(playerId: number, fireflies: number) {
        this.fireflyCounters[playerId]?.incValue(fireflies);
        this.updateFireflyCounterIcon(playerId);
        this.getPlayerTable(playerId).setTokens('firefly', this.fireflyCounters[playerId]?.getValue());
    }

    private addHelp() {
        dojo.place(`<button id="glow-help-button">?</button>`, 'left-side');
        dojo.connect( $('glow-help-button'), 'onclick', this, () => this.showHelp());
    }

    private showHelp() {
        if (!this.helpDialog) {
            this.helpDialog = new ebg.popindialog();
            this.helpDialog.create( 'glowHelpDialog' );
            this.helpDialog.setTitle( _("Cards help") );
            
            var html = `<div id="help-popin">
                <h1>${_("Specific companions")}</h1>
                <div id="help-companions" class="help-section">
                    <h2>${_('The Sketals')}</h2>
                    <table><tr>
                    <td><div id="companion44" class="companion"></div></td>
                        <td>${getCompanionTooltip(44)}</td>
                    </tr></table>
                    <h2>Xar’gok</h2>
                    <table><tr>
                        <td><div id="companion10" class="companion"></div></td>
                        <td>${getCompanionTooltip(10)}</td>
                    </tr></table>
                    <h2>${_('Kaar and the curse of the black die')}</h2>
                    <table><tr>
                        <td><div id="companion20" class="companion"></div></td>
                        <td>${getCompanionTooltip(20)}</td>
                    </tr></table>
                    <h2>Cromaug</h2>
                    <table><tr>
                        <td><div id="companion41" class="companion"></div></td>
                        <td>${getCompanionTooltip(41)}</td>
                    </tr></table>
                </div>
            </div>`;
            
            // Show the dialog
            this.helpDialog.setContent(html);
        }

        this.helpDialog.show();
    }

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your glow.game.php file.

    */
    setupNotifications() {
        //log( 'notifications subscriptions setup' );

        const notifs = [
            ['chosenAdventurer', ANIMATION_MS],
            ['chosenCompanion', ANIMATION_MS],
            ['removeCompanion', ANIMATION_MS],
            ['removeCompanions', ANIMATION_MS],
            ['replaceSmallDice', ANIMATION_MS],
            ['diceRolled', ANIMATION_MS],
            ['diceChanged', ANIMATION_MS],
            ['meepleMoved', ANIMATION_MS],
            ['takeSketalDie', ANIMATION_MS],
            ['removeSketalDie', ANIMATION_MS],
            ['moveBlackDie', ANIMATION_MS],
            ['giveHiddenSpells', ANIMATION_MS],
            ['revealSpells', ANIMATION_MS],
            ['removeSpell', ANIMATION_MS],
            ['updateSoloTiles', ANIMATION_MS],
            ['resolveCardUpdate', 1],
            ['usedDice', 1],
            ['moveUpdate', 1],
            ['points', 1],
            ['rerolls', 1],
            ['footprints', 1],
            ['fireflies', 1],
            ['lastTurn', 1],
            ['newFirstPlayer', 1],
            ['newDay', 2500],
            ['setTomDice', 1],
            ['setTableDice', 1],
        ];

        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }

    notif_chosenAdventurer(notif: Notif<NotifChosenAdventurerArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setAdventurer(notif.args.adventurer);
        playerTable.addDice(notif.args.dice);

        const newPlayerColor = notif.args.newPlayerColor;
        const nameLink = document.getElementById(`player_name_${notif.args.playerId}`).getElementsByTagName('a')[0];
        if (nameLink) {
            nameLink.style.color = `#${newPlayerColor}`;
        }
        /*const colorBlindToken = document.getElementById(`player-board-${notif.args.playerId}-color-blind-token`);
        if (colorBlindToken) {
            colorBlindToken.style.color = `#${newPlayerColor}`;
        };*/
        this.board.setColor(notif.args.playerId, newPlayerColor);
        playerTable.setColor(newPlayerColor);
        this.gamedatas.players[notif.args.playerId].color = newPlayerColor;
    }

    notif_chosenCompanion(notif: Notif<NotifChosenCompanionArgs>) {
        const companion = notif.args.companion;
        const spot = notif.args.spot;
        const playerId = notif.args.playerId;
        const playerTable = this.getPlayerTable(playerId);
        const originStock = spot ? this.meetingTrack.getStock(notif.args.spot) : this.cemetaryCompanionsStock;
        playerTable.addCompanion(companion, originStock);
        if (notif.args.dice?.length) {
            playerTable.addDice(notif.args.dice);
        }
        if (spot) {
            this.meetingTrack.clearFootprintTokens(spot, notif.args.playerId);
        }
        if (notif.args.cemetaryTop) {
            this.meetingTrack.setDeckTop(CEMETERY, notif.args.cemetaryTop?.type);
        }

        if (companion?.fireflies) {
            this.fireflyCounters[playerId].incValue(companion.fireflies);
        }
        this.companionCounters[playerId].incValue(1);
        this.updateFireflyCounterIcon(playerId);
    }

    notif_removeCompanion(notif: Notif<NotifChosenCompanionArgs>) {
        const companion = notif.args.companion;
        if (notif.args.spot) {
            this.meetingTrack.removeCompanion(notif.args.spot);
        } else {
            const playerId = notif.args.playerId;
            const playerTable = this.getPlayerTable(playerId);
            playerTable.removeCompanion(companion, notif.args.removedBySpell);

            if (companion?.fireflies) {
                this.fireflyCounters[playerId].incValue(-companion.fireflies);
            }
            this.companionCounters[playerId].incValue(-1);
            this.updateFireflyCounterIcon(playerId);
        }
        this.meetingTrack.setDeckTop(CEMETERY, notif.args.companion?.type);
    }

    notif_removeCompanions(notif: Notif<NotifRemoveCompanionsArgs>) {
        this.meetingTrack.removeCompanions();
        this.meetingTrack.setDeckTop(CEMETERY, notif.args.topCemeteryType);
    }

    notif_takeSketalDie(notif: Notif<NotifSketalDieArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addDice([notif.args.die]);
    }

    notif_removeSketalDie(notif: Notif<NotifSketalDieArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.removeDice([notif.args.die]);
    }

    notif_points(notif: Notif<NotifPointsArgs>) {
        this.setPoints(notif.args.playerId, notif.args.newScore);
        if (notif.args.company !== undefined) {
            this.board.setTomCompany(notif.args.company);
        }
    }

    notif_rerolls(notif: Notif<NotifRerollsArgs>) {
        this.incRerolls(notif.args.playerId, notif.args.rerolls);
    }

    notif_footprints(notif: Notif<NotifFootprintsArgs>) {
        this.incFootprints(notif.args.playerId, notif.args.footprints);
    }

    notif_fireflies(notif: Notif<NotifFirefliesArgs>) {
        this.incFireflies(notif.args.playerId, notif.args.fireflies);
    }    

    notif_newFirstPlayer(notif: Notif<NotifFirstPlayerArgs>) {
        this.placeFirstPlayerToken(notif.args.playerId);
    }

    notif_newDay(notif: Notif<NotifNewDayArgs>) {
        const day = notif.args.day;
        if (!this.roundCounter) {
            this.roundCounter = new ebg.counter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(day);
        } else {
            this.roundCounter.toValue(day);
        }

        dojo.place(`<div id="new-day"><span>${notif.log.replace('${day}', ''+notif.args.day)}</span></div>`, document.body);
        const div = document.getElementById(`new-day`);
        div.addEventListener('animationend', () => dojo.destroy(div));
        div.classList.add('new-day-animation');
    }

    notif_replaceSmallDice(notif: Notif<NotifDiceUpdateArgs>) {
        this.meetingTrack.placeSmallDice(notif.args.dice);
    }

    notif_diceRolled(notif: Notif<NotifDiceUpdateArgs>) {
        this.diceChangedOrRolled(notif.args.dice, false, notif.args.args);
    }

    notif_diceChanged(notif: Notif<NotifDiceUpdateArgs>) {
        this.diceChangedOrRolled(notif.args.dice, true, notif.args.args);
    }

    notif_resolveCardUpdate(notif: Notif<NotifResolveCardUpdateArgs>) {
        this.onEnteringStateResolveCards(notif.args.resolveCardsForPlayer);
    }

    notif_usedDice(notif: Notif<NotifUsedDiceArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setUsedDie(notif.args.dieId);
    }

    notif_moveUpdate(notif: Notif<NotifMoveUpdateArgs>) {
        this.moveArgs = notif.args.args;
        this.setActionBarMove(true);
    }

    notif_meepleMoved(notif: Notif<NotifMeepleMovedArgs>) {
        this.board.moveMeeple(notif.args.meeple);
    }

    notif_moveBlackDie(notif: Notif<NotifMoveBlackDieArgs>) {
        this.meetingTrack.placeSmallDice([notif.args.die]);
    }

    notif_giveHiddenSpells(notif: Notif<NotifGiveHiddenSpellsArgs>) {
        Object.keys(notif.args.spellsIds).forEach(playerId => {
            const playerTable = this.getPlayerTable(Number(playerId));
            playerTable.addHiddenSpell(notif.args.spellsIds[Number(playerId)], notif.args.playerId);
        })
    }

    notif_footprintAdded(notif: Notif<NotifFootprintAddedArgs>) {
        this.meetingTrack.setFootprintTokens(notif.args.spot, notif.args.number);
    }

    notif_revealSpells(notif: Notif<NotifRevealSpellsArgs>) {
        notif.args.spells.forEach(spell => {
            const playerTable = this.getPlayerTable(Number(spell.location_arg));
            playerTable.revealSpell(spell);
        });
    }

    notif_removeSpell(notif: Notif<NotifRemoveSpellArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.removeSpell(notif.args.spell);
    }

    notif_setTomDice(notif: Notif<NotifChosenAdventurerArgs>) {
        this.setTomDice(notif.args.dice);
    }

    notif_updateSoloTiles(notif: Notif<NotifUpdateSoloTilesArgs>) {
        this.meetingTrack.updateSoloTiles(notif.args);
    }

    notif_setTableDice(notif: Notif<NotifDiceUpdateArgs>) {
        notif.args.dice.forEach(die => 
            this.createOrMoveDie(die, `table-dice`)
        )
    }

    notif_lastTurn() {
        if (document.getElementById('last-round')) {
            return;
        }
        
        dojo.place(`<div id="last-round">
            ${_("This is the last round of the game!")}
        </div>`, 'page-title');
    }

    private getColor(color: number) {
        switch (color) {
            case 1: return '#00995c';
            case 2: return '#0077ba';
            case 3: return '#57cbf5';
            case 4: return '#bf1e2e';
            case 5: return '#ea7d28';
            case 6: return '#8a298a';
            case 7: return '#ffd503';
            case 8: return '#000000';
        }
        return null;
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = `<strong style="color: ${this.getColor(args.adventurer?.color)};">${args.adventurerName}</strong>`;
                }
                if (typeof args.companionName == 'string' && args.companionName[0] != '<') {
                    args.companionName = `<strong>${args.companionName}</strong>`;
                }

                if (typeof args.effectOrigin == 'string' && args.effectOrigin[0] != '<') {
                    if (args.adventurer) {
                        args.effectOrigin = `<strong style="color: ${this.getColor(args.adventurer?.color)};">${args.adventurer.name}</strong>`;
                    }
                    if (args.companion) {
                        args.effectOrigin = `<strong>${args.companion.name}</strong>`;
                    }
                }

                for (const property in args) {
                    if (args[property]?.indexOf?.(']') > 0) {
                        args[property] = formatTextIcons(_(args[property]));
                    }
                }

                log = formatTextIcons(_(log));
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}