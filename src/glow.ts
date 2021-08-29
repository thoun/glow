declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;

const ANIMATION_MS = 500;

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
    private projectCounter: Counter;
    private helpDialog: any;

    public adventurersStock: Stock;
    private board: Board;
    private playersTables: PlayerTable[] = [];

    private selectedPlayerProjectsIds: number[] = []; 
    private selectedTableProjectsIds: number[] = [];

    public zoom: number = 1;

    public clickAction: 'play' | 'select' = 'play';

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
        this.createPlayerTables(gamedatas);

        /*this.machineCounter = new ebg.counter();
        this.machineCounter.create('remaining-machine-counter');
        this.setRemainingMachines(gamedatas.remainingMachines);

        this.projectCounter = new ebg.counter();
        this.projectCounter.create('remaining-project-counter');
        this.setRemainingProjects(gamedatas.remainingProjects);*/

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
                if (document.getElementById('adventurers-stock')) {
                    dojo.destroy('adventurers-stock');
                }
                break;
            case 'gameEnd':
                const lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    }

    private onEnteringStateChooseAdventurer(args: ChooseAdventurerArgs) {
        const adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place(`<div id="adventurers-stock"></div>`, 'board', 'before');
            
            this.adventurersStock = new ebg.stock() as Stock;
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(1);            
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupMachineCard(this, cardDiv, type);
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

    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    public onLeavingState(stateName: string) {
        log( 'Leaving state: '+stateName );

        switch (stateName) {
            case 'chooseAdventurer':
                this.onLeavingChooseAdventurer();
                break;
        }
    }

    onLeavingChooseAdventurer() {
        this.adventurersStock.setSelectionMode(0);
    }

    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    public onUpdateActionButtons(stateName: string, args: any) {
        if((this as any).isCurrentPlayerActive()) {
            switch (stateName) {                
                case 'choosePlayAction': 
                    const choosePlayActionArgs = args as ChoosePlayActionArgs;
                    (this as any).addActionButton('getCharcoalium-button', _('Get charcoalium') + formatTextIcons(` (${choosePlayActionArgs.machine.points} [resource0])`), () => this.getCharcoalium());
                    if (choosePlayActionArgs.machine.dice == 9) {
                        for (let i=1; i<=3; i++) {
                            (this as any).addActionButton(`getResource${i}-button`, _('Get resource') + formatTextIcons(` ([resource${i}])`), () => this.getResource(i));
                        }
                    } else {
                        (this as any).addActionButton('getResource-button', _('Get resource') + formatTextIcons(` ([resource${choosePlayActionArgs.machine.dice}])`), () => this.getResource(choosePlayActionArgs.machine.dice));
                        if (choosePlayActionArgs.machine.color == 1 || choosePlayActionArgs.machine.dice == 0) {
                            // for those machines, getting 1 resource is not the best option, so we "unlight" them
                            dojo.removeClass('getResource-button', 'bgabutton_blue');
                            dojo.addClass('getResource-button', 'bgabutton_gray');
                        }
                    }
                    (this as any).addActionButton('applyEffect-button', _('Apply effect') + ` <div class="effect effect${MACHINES_IDS.indexOf(0)}"></div>`, () => this.applyEffect());
                    if (!choosePlayActionArgs.canApplyEffect) {
                        dojo.addClass('applyEffect-button', 'disabled');
                    }
                    (this as any).addTooltipHtml('applyEffect-button', getMachineTooltip(0));
                    break;

                case 'selectResource':
                    const selectResourceArgs = args as SelectResourceArgs;
                    selectResourceArgs.possibleCombinations.forEach((combination, index) => 
                        (this as any).addActionButton(`selectResourceCombination${index}-button`, formatTextIcons(combination.map(type => `[resource${type}]`).join('')), () => this.selectResource(combination))
                    );
                    break;

                case 'selectProject':
                    const selectProjectArgs = args as SelectProjectArgs;
                    selectProjectArgs.projects.forEach(project => 
                        (this as any).addActionButton(`selectProject${project.id}-button`, `<div class="project project${PROJECTS_IDS.indexOf(getUniqueId(project))}"></div>`, () => this.selectProject(project.id))
                    );
                    break;

                case 'selectExchange':
                    const selectExchangeArgs = args as SelectExchangeArgs;
                    selectExchangeArgs.possibleExchanges.forEach((possibleExchange, index) => 
                        (this as any).addActionButton(`selectExchange${index}-button`, formatTextIcons(`[resource${possibleExchange.from}] &#x21E8; [resource${possibleExchange.to}]`), () => this.selectExchange(possibleExchange))
                    );
                    (this as any).addActionButton('skipExchange-button', _('Skip'), () => this.skipExchange(), null, null, 'red');
                    break;

                case 'chooseProjectDiscardedMachine':
                    (this as any).addActionButton('selectProjectDiscardedMachine-button', _('Discard selected machines'), () => this.discardSelectedMachines());
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

            if (player.playerNo == 1) {
                dojo.place(`<div id="player-icon-first-player" class="player-icon first-player"></div>`, `player_board_${player.id}`);
                (this as any).addTooltipHtml('player-icon-first-player', _("First player"));
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

    public chooseAdventurer(id: number) {
        if(!(this as any).checkAction('chooseAdventurer')) {
            return;
        }

        this.takeAction('chooseAdventurer', {
            id
        });
    }

    public getCharcoalium() {
        if(!(this as any).checkAction('getCharcoalium')) {
            return;
        }

        this.takeAction('getCharcoalium');
    }

    public getResource(resource: number) {
        if(!(this as any).checkAction('getResource')) {
            return;
        }

        this.takeAction('getResource', {
            resource
        });
    }

    public applyEffect() {
        if(!(this as any).checkAction('applyEffect')) {
            return;
        }

        this.takeAction('applyEffect');
    }

    private selectProjects(ids: number[]) {
        if(!(this as any).checkAction('selectProjects')) {
            return;
        }

        this.takeAction('selectProjects', { 
            ids: ids.join(',')
        });
    }

    public skipSelectProjects() {
        if(!(this as any).checkAction('skipSelectProjects')) {
            return;
        }

        this.takeAction('skipSelectProjects');
    }

    public selectResource(resourcesTypes: number[]) {
        if(!(this as any).checkAction('selectResource')) {
            return;
        }

        this.takeAction('selectResource', { 
            resourcesTypes: resourcesTypes.join(',')
        });
    }

    public selectMachine(id: number) {
        if(!(this as any).checkAction('selectMachine')) {
            return;
        }

        this.takeAction('selectMachine', {
            id
        });
    }

    public selectProject(id: number) {
        if(!(this as any).checkAction('selectProject')) {
            return;
        }

        this.takeAction('selectProject', {
            id
        });
    }

    public selectExchange(exchange: Exchange) {
        if(!(this as any).checkAction('selectExchange')) {
            return;
        }

        this.takeAction('selectExchange', exchange);
    }

    public skipExchange() {
        if(!(this as any).checkAction('skipExchange')) {
            return;
        }

        this.takeAction('skipExchange');
    }

    public discardSelectedMachines() {
        if(!(this as any).checkAction('discardSelectedMachines')) {
            return;
        }

        const base64 = btoa(JSON.stringify(/*this.discardedMachineSelector.getCompleteProjects()*/'TODO'));

        this.takeAction('discardSelectedMachines', {
            completeProjects: base64
        });        
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
                <h1>${_("Machines effects")}</h1>
                <div id="help-machines" class="help-section">
                    <table>`;
                MACHINES_IDS.forEach((number, index) => html += `<tr><td><div id="machine${index}" class="machine"></div></td><td>${getMachineTooltip(number)}</td></tr>`);
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
                PROJECTS_IDS.slice(9).forEach((number, index) => html += `<div id="project${index + 9}" class="project"></div>`);
                html += `</td></tr><tr><td>${getProjectTooltip(31)}</td></tr></table>
                </div>
            </div>`;
            
            // Show the dialog
            this.helpDialog.setContent(html);
        }

        this.helpDialog.show();
    }

    private setRemainingMachines(remainingMachines: number) {
        this.companionCounter.setValue(remainingMachines);
        const visibility = remainingMachines > 0 ? 'visible' : 'hidden';
        document.getElementById('machine-deck').style.visibility = visibility;
        document.getElementById('remaining-machine-counter').style.visibility = visibility;
    }

    private setRemainingProjects(remainingProjects: number) {
        this.projectCounter.setValue(remainingProjects);
        const visibility = remainingProjects > 0 ? 'visible' : 'hidden';
        document.getElementById('project-deck').style.visibility = visibility;
        document.getElementById('remaining-project-counter').style.visibility = visibility;
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
            ['points', 1],
            ['lastTurn', 1],
        ];

        notifs.forEach((notif) => {
            dojo.subscribe(notif[0], this, `notif_${notif[0]}`);
            (this as any).notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }


    notif_chosenAdventurer(notif: Notif<NotifChosenAdventurerArgs>) {
        this.getPlayerTable(notif.args.playerId).setAdventurer(notif.args.adventurer);
    }

    notif_points(notif: Notif<NotifPointsArgs>) {
        this.setPoints(notif.args.playerId, notif.args.points);
    }

    notif_lastTurn() {
        if (document.getElementById('last-round')) {
            return;
        }
        
        dojo.place(`<div id="last-round">
            ${_("This is the last round of the game!")}
        </div>`, 'page-title');
    }

    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    public format_string_recursive(log: string, args: any) {
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = `<strong >${args.adventurerName}</strong>`;
                }
            }
        } catch (e) {
            console.error(log,args,"Exception thrown", e.stack);
        }
        return (this as any).inherited(arguments);
    }
}