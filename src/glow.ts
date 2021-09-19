declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;

const ROLL_DICE_ACTION_BUTTONS_IDS = [`setRollDice-button`, `setChangeDie-button`, `keepDice-button`, `cancelRollDice-button`, `rollDice-button`, `changeDie-button`];

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
    private companionCounter: Counter;
    private roundCounter: Counter;
    private helpDialog: any;
    private rollDiceArgs: EnteringRollDiceForPlayer;
    private selectedDice: Die[] = [];
    private diceSelectionActive: boolean = false;
    private originalTextRollDice: string;
    private isChangeDie: boolean = false;

    public adventurersStock: Stock;
    private board: Board;
    private meetingTrack: MeetingTrack;
    private playersTables: PlayerTable[] = [];

    public zoom: number = 1;

    private meetingTrackClickAction: 'recruit' | 'remove';

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
        
        this.gamedatas = gamedatas;

        log('gamedatas', gamedatas);

        dojo.addClass('board', `side${gamedatas.side}`);
        this.createPlayerPanels(gamedatas);
        this.board = new Board(this, Object.values(gamedatas.players));
        this.meetingTrack = new MeetingTrack(this, gamedatas.meetingTrack);
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

        /*this.setupPreferences();

        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }*/

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
        }
    }

    private onEnteringStateChooseAdventurer(args: ChooseAdventurerArgs) {
        const adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place(`<div id="adventurers-stock"></div>`, 'currentplayertable', 'before');
            
            this.adventurersStock = new ebg.stock() as Stock;
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(1);            
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            // this.adventurersStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupMachineCard(this, cardDiv, type);
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

        args.companions.forEach((companion, spot) =>  {
            if (spot >=1 && spot <=5) {
                this.meetingTrack.setCompanion(companion, spot);
            }
        });
        
        if((this as any).isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
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

        args.companions.forEach((companion, spot) =>  {
            if (spot >=1 && spot <=5) {
                this.meetingTrack.setCompanion(companion, spot);
            }
        });
        
        if((this as any).isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    }

    private onEnteringStateMoveBlackDie(args: EnteringMoveBlackDieArgs) {
        this.meetingTrack.setSelectableDice(args.possibleSpots);
    }

    private onEnteringStateRollDice() {
        this.setDiceSelectionActive(true);
    }

    private onEnteringStateResolveCards(possibleEffects: number[][]) {
        this.onLeavingResolveCards();

        const playerId = this.getPlayerId();
        const playerTable = this.getPlayerTable(playerId);

        possibleEffects.forEach(possibleEffect => {
            const cardType = possibleEffect[0];
            const cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(`${playerTable.adventurerStock.container_div.id}_item_${cardId}`, 'selectable');
            } else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                dojo.addClass(`${playerTable.companionsStock.container_div.id}_item_${cardId}`, 'selectable');
            } if (cardType === 2) { // spells
                /*TODO Spells playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(`${playerTable.adventurerStock.container_div.id}_item_${cardId}`, 'selectable');*/
            }
        });
    }

    private onEnteringStateMove(args: EnteringMoveForPlayer) {
        this.board.createDestinationZones(args.possibleRoutes.map(route => route.destination));
        
        if (this.gamedatas.side === 1) {
            if (!document.getElementById(`placeEncampment-button`)) {
                (this as any).addActionButton(`placeEncampment-button`, _("Place encampment"), () => this.placeEncampment());
            }
            dojo.toggleClass(`placeEncampment-button`, 'disabled', !args.canSettle);
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
            case 'recruitCompanion':
                this.onLeavingRecruitCompanion();
                break;
            case 'moveBlackDie':                
                this.onLeavingMoveBlackDie();
            case 'rollDice':
                this.onLeavingRollDice();
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

    private onLeavingResolveCards() {
        (Array.from(document.getElementsByClassName('selectable')) as HTMLElement[]).forEach(node => dojo.removeClass(node, 'selectable'));
        [...this.playersTables.map(pt => pt.adventurerStock), ...this.playersTables.map(pt => pt.companionsStock)].forEach(stock => stock.setSelectionMode(0));
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if ((this as any).isCurrentPlayerActive()) {
            switch (stateName) {
                case 'selectSketalDie':
                    this.onEnteringSelectSketalDie(args as EnteringSelectSketalDieArgs);
                    break;
                case 'rollDice':
                    this.rollDiceArgs = (args as EnteringRollDiceArgs)[this.getPlayerId()];
                    this.setActionBarRollDice(false);
                    break;
                case 'resolveCards':
                    const resolveCardsArgs = (args as EnteringResolveCardsArgs)[this.getPlayerId()];
                    this.onEnteringStateResolveCards(resolveCardsArgs);
                    break;
                case 'move':
                    const moveArgs = (args as EnteringMoveArgs)[this.getPlayerId()];
                    this.onEnteringStateMove(moveArgs);
                    break;

            }
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

        [this.adventurersStock,  ...this.playersTables.map(pt => pt.companionsStock)].forEach(stock => stock.updateDisplay());

        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;
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

    private setupPreferences() {
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

    public setHandSelectable(selectable: boolean) {
        this.adventurersStock.setSelectionMode(selectable ? 1 : 0);
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

        Object.values(gamedatas.players).forEach(player => {
            const playerId = Number(player.id);     

            // charcoalium & resources counters
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
                    <div class="icon firefly"></div> 
                    <span id="firefly-counter-${player.id}"></span>
                </div>
            </div>`, `player_board_${player.id}`);

            const rerollCounter = new ebg.counter();
            rerollCounter.create(`reroll-counter-${playerId}`);
            rerollCounter.setValue(player.rerolls);
            this.rerollCounters[playerId] = rerollCounter;

            const footprintCounter = new ebg.counter();
            footprintCounter.create(`footprint-counter-${playerId}`);
            footprintCounter.setValue(player.footprints);
            this.footprintCounters[playerId] = footprintCounter;

            const fireflyCounter = new ebg.counter();
            fireflyCounter.create(`firefly-counter-${playerId}`);
            fireflyCounter.setValue(player.fireflies);
            this.fireflyCounters[playerId] = fireflyCounter;     

            // first player token
            dojo.place(`<div id="player_board_${player.id}_firstPlayerWrapper"></div>`, `player_board_${player.id}`);

            if (gamedatas.firstPlayer === playerId) {
                this.placeFirstPlayerToken(gamedatas.firstPlayer);
            }
        });

        (this as any).addTooltipHtmlToClass('reroll-counter', _("Rerolls"));
        (this as any).addTooltipHtmlToClass('footprint-counter', _("Footprints"));
        (this as any).addTooltipHtmlToClass('firefly-counter', _("Fireflies"));
    }

    private createPlayerTables(gamedatas: GlowGamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === Number((this as any).player_id));
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;

        orderedPlayers.forEach((player, index) => 
            this.createPlayerTable(gamedatas, Number(player.id))
        );
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
    }

    public createOrMoveDie(die: Die, destinationId: string, rollClass: string = 'no-roll') {
        const dieDiv = this.getDieDiv(die);

        if (dieDiv) {
            this.setNewFace(die, true);

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
                    this.addRollToDiv(dieDiv, 'change-die-roll');
                }
            }
        }
    }

    private getDieDiv(die: Die): HTMLDivElement {
        return document.getElementById(`die${die.id}`) as HTMLDivElement;
    }

    private addRollToDiv(dieDiv: HTMLDivElement, rollClass: string, attempt: number = 0) {
        dieDiv.classList.remove('rolled');
        if (rollClass === 'odd-roll' || rollClass ==='even-roll') {
            dieDiv.classList.add('rolled');
        }

        const dieList = dieDiv.getElementsByClassName('die-list')[0] as HTMLDivElement;
        if (dieList) {
            dieList.dataset.roll = dieDiv.dataset.dieValue;
            dieList.classList.remove('no-roll');
            dieList.classList.add(rollClass);
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
        })
    }
    
    private setRollDiceGamestateDescription(property?: string, cost: number = 0) {
        if (!this.originalTextRollDice) {
            this.originalTextRollDice = document.getElementById('pagemaintitletext').innerHTML;
        }

        const originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ? 
            `${originalState['description' + property]}` + this.getRollDiceCost(cost) : 
            this.originalTextRollDice;
    }
    
    private setActionBarRollDice(fromCancel: boolean) {
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        if (fromCancel) {
            this.setRollDiceGamestateDescription();
            this.unselectDice();
        }

        const possibleRerolls = this.rollDiceArgs.rerollCompanion + this.rollDiceArgs.rerollTokens + Object.values(this.rollDiceArgs.rerollScore).length;

        (this as any).addActionButton(`setRollDice-button`, _("Reroll 1 or 2 dice") + formatTextIcons(' (1 [reroll] )'), () => this.setActionBarSelectRollDice());
        (this as any).addActionButton(`setChangeDie-button`, _("Change die face") + formatTextIcons(' (3 [reroll] )'), () => this.setActionBarSelectChangeDie());
        (this as any).addActionButton(`keepDice-button`, _("Keep"), () => this.keepDice(), null, null, 'red');

        dojo.toggleClass(`setRollDice-button`, 'disabled', possibleRerolls < 1);
        dojo.toggleClass(`setChangeDie-button`, 'disabled', possibleRerolls < 3);
    }
    

    private setActionBarSelectRollDice() {
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription(`rollDice`, 1);

        (this as any).addActionButton(`rollDice-button`, _("Reroll selected dice"), () => this.rollDice());
        (this as any).addActionButton(`cancelRollDice-button`, _("Cancel"), () => this.setActionBarRollDice(true));

        dojo.toggleClass(`rollDice-button`, 'disabled', this.selectedDice.length < 1 || this.selectedDice.length > 2);
    }
    
    private setActionBarSelectChangeDie() {
        this.isChangeDie = true;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription(`changeDie`, 3);

        (this as any).addActionButton(`cancelRollDice-button`, _("Cancel"), () => this.setActionBarRollDice(true));

        if (this.selectedDice.length === 1) {
            this.onSelectedDiceChange();
        }
    }

    private getRollDiceCost(cost: number) {
        let tokenCost = 0;
        let scoreCost = 0;
        let remainingCost = cost;

        if (remainingCost > 0 && this.rollDiceArgs.rerollCompanion > 0) {
            remainingCost = Math.max(0, remainingCost - this.rollDiceArgs.rerollCompanion);
        }
        
        if (remainingCost > 0 && this.rollDiceArgs.rerollTokens > 0) {
            tokenCost = Math.min(this.rollDiceArgs.rerollTokens, remainingCost);
            remainingCost -= tokenCost;
        }
        
        if (remainingCost > 0 && Object.values(this.rollDiceArgs.rerollScore).length > 0) {
            scoreCost = Math.min(Object.values(this.rollDiceArgs.rerollScore).length, remainingCost);
            remainingCost -= scoreCost;
        }

        if (remainingCost > 0) {
            throw Error('remainingCost is positive !');
        }

        if (tokenCost || scoreCost) {
            return ` ( ${tokenCost ? formatTextIcons(`-${tokenCost} [reroll] `) : ''}${scoreCost ? formatTextIcons(`-${this.rollDiceArgs.rerollScore[scoreCost]} [point] `) : ''} )`;
        } else {
            return '';
        }
    }

    private onSelectedDiceChange() {
        const count = this.selectedDice.length;
        if (document.getElementById(`rollDice-button`)) {
            dojo.toggleClass(`rollDice-button`, 'disabled', count < 1 || count > 2);
        }
        if (this.isChangeDie) {
            if (count === 1) {
                const die = this.selectedDice[0];
                const cancel = document.getElementById(`cancelRollDice-button`);
                cancel?.parentElement.removeChild(cancel);

                const faces = die.color <= 5 ? 5 : 6;

                for (let i=1; i<=faces; i++) {
                    const html = `<div class="die-item color${die.color} side${i}"></div>`;

                    (this as any).addActionButton(`changeDie${i}-button`, html, () => this.changeDie(i));
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

    private onDiceClick(die: Die, force: boolean = false) {
        if (!this.diceSelectionActive && !force) {
            return;
        }

        const index = this.selectedDice.findIndex(d => d.id === die.id);
        const selected = index !== -1;

        if (selected) {
            this.selectedDice.splice(index, 1);
        } else {
            this.selectedDice.push(die);
        }

        dojo.toggleClass(`die${die.id}`, 'selected', !selected);
        this.onSelectedDiceChange();
    }

    private unselectDice() {
        this.selectedDice.forEach(die => this.onDiceClick(die, true));
    }

    private setDiceSelectionActive(active: boolean) {        
        this.unselectDice();
        this.diceSelectionActive = active;        
        (Array.from(document.getElementsByClassName('die')) as HTMLElement[]).forEach(node => dojo.toggleClass(node, 'selectable', active));
    }

    private diceChangedOrRolled(dice: Die[], changed: boolean, args: EnteringRollDiceArgs) {
        dice.forEach(die => {
            dojo.removeClass(`die${die.id}`, 'selected');
            this.setNewFace(die);
            this.addRollToDiv(this.getDieDiv(die), changed ? 'change-die-roll' : (Math.random() > 0.5 ? 'odd-roll' : 'even-roll'));
        });

        if (args) {
            this.rollDiceArgs = args[this.getPlayerId()];
            this.setActionBarRollDice(true);
        }
    }

    private rollDice() {
        if(!(this as any).checkAction('rollDice')) {
            return;
        }

        this.takeAction('rollDice', { ids: this.selectedDice.map(die => die.id).join(',') });
    }
    
    private changeDie(value: number) {
        if(!(this as any).checkAction('changeDie')) {
            return;
        }

        this.takeAction('changeDie', { 
            id: this.selectedDice[0].id,
            value
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

    public resolveCard(type: number, id: number) {
        if(!(this as any).checkAction('resolveCard')) {
            return;
        }

        this.takeAction('resolveCard', {
            type,
            id,
        });
    }

    public move(destination: number) {
        if(!(this as any).checkAction('move')) {
            return;
        }

        this.takeAction('move', {
            destination
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
    
    private incPoints(playerId: number, points: number) {
        (this as any).scoreCtrl[playerId]?.incValue(points);
        this.board.incPoints(playerId, points);
    }
    
    private incRerolls(playerId: number, footprints: number) {
        this.rerollCounters[playerId]?.incValue(footprints);
    }
    
    private incFootprints(playerId: number, footprints: number) {
        this.footprintCounters[playerId]?.incValue(footprints);
    }
    
    private incFireflies(playerId: number, fireflies: number) {
        this.fireflyCounters[playerId]?.incValue(fireflies);
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
                    <table>`;
                /*.forEach((number, index) => html += `<tr><td><div id="machine${index}" class="machine"></div></td><td>${getMachineTooltip(number)}</td></tr>`);
                html += `</table>
                </div>
                <h1>${_("Projects")}</h1>
                <div id="help-projects" class="help-section">
                    <table><tr><td class="grid">`;
                PROJECTS_IDS.slice(1, 5).forEach((number, index) => html += `<div id="project${index + 1}" class="project"></div>`);
                html += `</td></tr><tr><td>${getProjectTooltip(11)}</td></tr>
                <tr><td><div id="project0" class="project"></div></td></tr><tr><td>${getProjectTooltip(10)}</td></tr><tr><td class="grid">`;
                PROJECTS_IDS.slice(6, 9).forEach((number, index) => html += `<div id="project${index + 6}" class="project"></div>`);
                html += `</td></tr><tr><td>${getProjectTooltip(21)}</td></tr>
                <tr><td><div id="project5" class="project"></div></td></tr><tr><td>${getProjectTooltip(20)}</td></tr><tr><td class="grid">`;
                PROJECTS_IDS.slice(9).forEach((number, index) => html += `<div id="project${index + 9}" class="project"></div>`);*/
                html += `</td></tr><tr><td>${getProjectTooltip(31)}</td></tr></table>
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
            ['resolveCardUpdate', 1],
            ['usedDice', 1],
            ['moveUpdate', 1],
            ['points', 1],
            ['rerolls', 1],
            ['footprints', 1],
            ['fireflies', 1],
            ['lastTurn', 1],
            ['newFirstPlayer', 1],
            ['newDay', 1],
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
    }

    notif_chosenCompanion(notif: Notif<NotifChosenCompanionArgs>) {console.log(notif.args);
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addCompanion(notif.args.companion, this.meetingTrack.getStock(notif.args.spot));
        playerTable.addDice(notif.args.dice);
        this.meetingTrack.clearFootprintTokens(notif.args.spot, notif.args.playerId);
    }

    notif_removeCompanion(notif: Notif<NotifChosenCompanionArgs>) {
        if (notif.args.spot) {
            this.meetingTrack.removeCompanion(notif.args.spot);
        } else {
            const playerTable = this.getPlayerTable(notif.args.playerId);
            playerTable.removeCompanion(notif.args.companion);
        }
        this.meetingTrack.setCemeteryTop(notif.args.companion);
    }

    notif_removeCompanions(notif: Notif<NotifRemoveCompanionsArgs>) {
        this.meetingTrack.removeCompanions();
        this.meetingTrack.setCemeteryTop(notif.args.cemeteryTop);
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
        this.incPoints(notif.args.playerId, notif.args.points);
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
        this.onEnteringStateResolveCards(notif.args.remainingEffects);
    }

    notif_usedDice(notif: Notif<NotifUsedDiceArgs>) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setUsedDie(notif.args.dieId);
    }

    notif_moveUpdate(notif: Notif<NotifMoveUpdateArgs>) {
        this.onEnteringStateMove(notif.args.args);
    }

    notif_meepleMoved(notif: Notif<NotifMeepleMovedArgs>) {
        this.board.moveMeeple(notif.args.meeple);
    }

    notif_moveBlackDie(notif: Notif<NotifMoveBlackDieArgs>) {
        this.meetingTrack.placeSmallDice([notif.args.die]);
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
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}