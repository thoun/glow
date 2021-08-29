function slideToObjectAndAttach(object, destinationId, posX, posY) {
    var destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
        var originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';
        var objectCR = object.getBoundingClientRect();
        var destinationCR = destination.getBoundingClientRect();
        var deltaX = destinationCR.left - objectCR.left + (posX !== null && posX !== void 0 ? posX : 0);
        var deltaY = destinationCR.top - objectCR.top + (posY !== null && posY !== void 0 ? posY : 0);
        //object.id == 'tile98' && console.log(object, destination, objectCR, destinationCR, destinationCR.left - objectCR.left, );
        object.style.transition = "transform 0.5s ease-in";
        object.style.transform = "translate(" + deltaX + "px, " + deltaY + "px)";
        var transitionend = function () {
            object.style.top = posY !== undefined ? posY + "px" : 'unset';
            object.style.left = posX !== undefined ? posX + "px" : 'unset';
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            object.style.zIndex = originalZIndex ? '' + originalZIndex : 'unset';
            object.style.transform = 'unset';
            object.style.transition = 'unset';
            destination.appendChild(object);
            object.removeEventListener('transitionend', transitionend);
            resolve(true);
        };
        object.addEventListener('transitionend', transitionend);
    });
}
/*declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;*/
var MACHINES_IDS = [
    // blue
    11,
    12,
    13,
    14,
    15,
    // purple
    21,
    22,
    23,
    24,
    25,
    // red
    31,
    32,
    33,
    34,
    // yellow
    41,
    42,
];
var PROJECTS_IDS = [
    // colors
    10,
    11,
    12,
    13,
    14,
    // points
    20,
    21,
    22,
    23,
    // resources
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
];
var CARD_WIDTH = 129;
var CARD_HEIGHT = 240;
var PROJECT_WIDTH = 134;
var PROJECT_HEIGHT = 93;
function getUniqueId(object) {
    return object.type * 10 + object.subType;
}
function setupAdventurersCards(adventurerStock) {
    var cardsurl = g_gamethemeurl + "img/adventurers.png";
    for (var i = 0; i <= 7; i++) {
        adventurerStock.addItemType(i, i, cardsurl, i);
    }
}
function setupCompanionCards(companionsStock) {
    var cardsurl = g_gamethemeurl + "img/companions.png";
    PROJECTS_IDS.forEach(function (cardId, index) {
        return companionsStock.addItemType(cardId, 0, cardsurl, index);
    });
}
function getMachineTooltip(type) {
    switch (type) {
        // blue
        case 11: return _("Earn 1 wood for each machine on the Bric-a-brac with wood in its production zone, including this one.");
        case 12: return _("Earn 1 charcoalium for each machine on the Bric-a-brac with charcoalium in its production zone, including this one.");
        case 13: return _("Earn 1 copper for each machine on the Bric-a-brac with copper in its production zone, including this one.");
        case 14: return _("Earn 1 crystal for each machine on the Bric-a-brac with crystal in its production zone, including this one.");
        case 15: return formatTextIcons(_("Choose a type of resource ([resource1]|[resource2]|[resource3]). Earn 1 resource of this type for each machine on the Bric-a-brac with the [resource9] symbol in its production zone, including this one."));
        // purple
        case 21: return _("Discard a machine from your hand and earn 2 resources of your choice from those needed to repair it.");
        case 22: return _("Discard 1 of the last 3 machines added to the Bric-a-brac before this one and earn 1 resource of your choice from those needed to repair it.");
        case 23: return _("Discard 1 of the last 2 machines added to the Bric-a-brac before this one and earn 1 resource of your choice from those needed to repair it and 1 charcoalium.");
        case 24: return _("You can exchange 1 charcoalium for 1 resource of your choice from the reserve and/or vice versa, up to three times total.");
        case 25: return _("Discard the last machine added to the Bric-a-brac before this one and earn 2 resources of your choice from those needed to repair it.");
        // red
        case 31: return _("Steal from your opponent 1 charcoalium and 1 machine taken randomly from their hand.");
        case 32: return _("Steal from your opponent 1 resource of your choice and 1 machine taken randomly from their hand.");
        case 33: return _("Your opponent must randomly discard all but 2 machines from their hand and return 2 charcoalium to the reserve.");
        case 34: return _("Your opponent must return 2 resources of your choice to the reserve.");
        // yellow
        case 41: return _("Draw 2 of the unused project tiles. Choose 1 to place face up in your workshop and return the other to the box. Only you can complete the project in your workshop.");
        case 42: return _("Copy the effect of 1 machine from the Bric-a-brac of your choice.");
    }
    return null;
}
function setupMachineCard(game, cardDiv, type) {
    game.addTooltipHtml(cardDiv.id, getMachineTooltip(type));
}
function getProjectTooltip(type) {
    switch (type) {
        // colors
        case 10: return _("You must have at least 1 machine of each color in your workshop.");
        case 11:
        case 12:
        case 13:
        case 14: return _("You must have at least 2 machines of the indicated color in your workshop.");
        // points
        case 20: return _("You must have at least 2 identical machines in your workshop.");
        case 21:
        case 22:
        case 23: return _("You must have at least 2 machines worth the indicated number of victory points in your workshop.");
        // resources
        case 31:
        case 32:
        case 33:
        case 34:
        case 35:
        case 36:
        case 37:
        case 38: return formatTextIcons(_("You must have machines in your workshop that have the indicated resources and/or charcoalium in their production zones. [resource9] resources do not count towards these objectives."));
    }
    return null;
}
function setupProjectCard(game, cardDiv, type) {
    game.addTooltipHtml(cardDiv.id, getProjectTooltip(type));
}
function moveToAnotherStock(sourceStock, destinationStock, uniqueId, cardId) {
    if (sourceStock === destinationStock) {
        return;
    }
    var sourceStockItemId = sourceStock.container_div.id + "_item_" + cardId;
    if (document.getElementById(sourceStockItemId)) {
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    }
    else {
        console.warn(sourceStockItemId + " not found in ", sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }
    var destinationDiv = document.getElementById(destinationStock.container_div.id + "_item_" + cardId);
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function addToStockWithId(destinationStock, uniqueId, cardId, from) {
    destinationStock.addToStockWithId(uniqueId, cardId, from);
    var destinationDiv = document.getElementById(destinationStock.container_div.id + "_item_" + cardId);
    destinationDiv.style.zIndex = '10';
    setTimeout(function () { return destinationDiv.style.zIndex = 'unset'; }, 1000);
}
function formatTextIcons(rawText) {
    return rawText
        .replace(/\[resource0\]/ig, '<span class="icon charcoalium"></span>')
        .replace(/\[resource1\]/ig, '<span class="icon wood"></span>')
        .replace(/\[resource2\]/ig, '<span class="icon copper"></span>')
        .replace(/\[resource3\]/ig, '<span class="icon crystal"></span>')
        .replace(/\[resource9\]/ig, '<span class="icon joker"></span>');
}
var POINT_CASE_SIZE = 49;
var Board = /** @class */ (function () {
    function Board(game, players) {
        var _this = this;
        this.game = game;
        this.points = new Map();
        var html = '';
        // points
        players.forEach(function (player) {
            return html += "<div id=\"player-" + player.id + "-point-marker\" class=\"point-marker\" style=\"background: #" + player.color + ";\"></div>";
        });
        dojo.place(html, 'board');
        players.forEach(function (player) { return _this.points.set(Number(player.id), Number(player.score)); });
        this.movePoints();
    }
    Board.prototype.setPoints = function (playerId, points) {
        this.points.set(playerId, points);
        this.movePoints();
    };
    Board.prototype.movePoints = function () {
        var _this = this;
        this.points.forEach(function (points, playerId) {
            console.log(points, playerId);
            var markerDiv = document.getElementById("player-" + playerId + "-point-marker");
            var top = 19 + (points < 84 ? Math.max(points - 32, 0) * POINT_CASE_SIZE : (100 - points) * POINT_CASE_SIZE);
            var left = 24 + (points < 50 ? Math.min(points, 32) * POINT_CASE_SIZE : 32 * POINT_CASE_SIZE - Math.max(50 - points, 0));
            var topShift = 0;
            var leftShift = 0;
            _this.points.forEach(function (iPoints, iPlayerId) {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    leftShift += 5;
                }
            });
            markerDiv.style.transform = "translateX(" + (left + leftShift) + "px) translateY(" + (top + topShift) + "px)";
        });
    };
    return Board;
}());
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table whiteblock\" >\n            <div class=\"name-column\">\n                <div class=\"player-name\" style=\"color: #" + player.color + ";\">" + player.name + "</div>\n            </div>\n            <div class=\"adventurer-and-companions\">\n                <div id=\"player-table-" + this.playerId + "-adventurer\"></div>\n                <div id=\"player-table-" + this.playerId + "-companions\"></div>\n            </div>\n        </div>";
        dojo.place(html, 'playerstables');
        // adventurer        
        this.adventurerStock = new ebg.stock();
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game, $("player-table-" + this.playerId + "-adventurer"), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        this.adventurerStock.onItemCreate = function (cardDiv, type) { return setupProjectCard(game, cardDiv, type); };
        setupAdventurersCards(this.adventurerStock);
        if (player.adventurer) {
            this.adventurerStock.addToStockWithId(player.adventurer.color, '' + player.adventurer.id);
        }
        else {
            this.adventurerStock.addToStockWithId(0, '0');
        }
        // companions
        this.companionsStock = new ebg.stock();
        this.companionsStock.setSelectionAppearance('class');
        this.companionsStock.selectionClass = 'selected';
        this.companionsStock.create(this.game, $("player-table-" + this.playerId + "-companions"), CARD_WIDTH, CARD_HEIGHT);
        this.companionsStock.setSelectionMode(0);
        setupCompanionCards(this.companionsStock);
        player.companions.forEach(function (companion) { return _this.companionsStock.addToStockWithId(getUniqueId(companion), '' + companion.id); });
    }
    PlayerTable.prototype.setAdventurer = function (adventurer) {
        this.adventurerStock.removeAll();
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, '' + adventurer.id);
    };
    return PlayerTable;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var ANIMATION_MS = 500;
var ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
var ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0];
var LOCAL_STORAGE_ZOOM_KEY = 'Glow-zoom';
var isDebug = window.location.host == 'studio.boardgamearena.com';
var log = isDebug ? console.log.bind(window.console) : function () { };
var Glow = /** @class */ (function () {
    function Glow() {
        this.rerollCounters = [];
        this.footprintCounters = [];
        this.fireflyCounters = [];
        this.playersTables = [];
        this.selectedPlayerProjectsIds = [];
        this.selectedTableProjectsIds = [];
        this.zoom = 1;
        this.clickAction = 'play';
        var zoomStr = localStorage.getItem(LOCAL_STORAGE_ZOOM_KEY);
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
    Glow.prototype.setup = function (gamedatas) {
        this.dontPreloadImage('publisher.png');
        this.dontPreloadImage("side" + (gamedatas.side == 2 ? 1 : 2) + ".png");
        log("Starting game setup");
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        dojo.addClass('board', "side" + gamedatas.side);
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
        log("Ending game setup");
    };
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    Glow.prototype.onEnteringState = function (stateName, args) {
        log('Entering state: ' + stateName, args.args);
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
                var lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    };
    Glow.prototype.onEnteringStateChooseAdventurer = function (args) {
        var _this = this;
        var adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place("<div id=\"adventurers-stock\"></div>", 'board', 'before');
            this.adventurersStock = new ebg.stock();
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(1);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = function (cardDiv, type) { return setupMachineCard(_this, cardDiv, type); };
            dojo.connect(this.adventurersStock, 'onChangeSelection', this, function () { return _this.onAdventurerSelection(_this.adventurersStock.getSelectedItems()); });
            setupAdventurersCards(this.adventurersStock);
            adventurers.forEach(function (adventurer) { return _this.adventurersStock.addToStockWithId(adventurer.color, '' + adventurer.id); });
        }
        else {
            this.adventurersStock.items.filter(function (item) { return !adventurers.some(function (adventurer) { return adventurer.color == item.type; }); }).forEach(function (item) { return _this.adventurersStock.removeFromStockById(item.id); });
        }
        if (this.isCurrentPlayerActive()) {
            this.adventurersStock.setSelectionMode(1);
        }
    };
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    Glow.prototype.onLeavingState = function (stateName) {
        log('Leaving state: ' + stateName);
        switch (stateName) {
            case 'chooseAdventurer':
                this.onLeavingChooseAdventurer();
                break;
        }
    };
    Glow.prototype.onLeavingChooseAdventurer = function () {
        this.adventurersStock.setSelectionMode(0);
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Glow.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'choosePlayAction':
                    var choosePlayActionArgs_1 = args;
                    this.addActionButton('getCharcoalium-button', _('Get charcoalium') + formatTextIcons(" (" + choosePlayActionArgs_1.machine.points + " [resource0])"), function () { return _this.getCharcoalium(); });
                    if (choosePlayActionArgs_1.machine.dice == 9) {
                        var _loop_1 = function (i) {
                            this_1.addActionButton("getResource" + i + "-button", _('Get resource') + formatTextIcons(" ([resource" + i + "])"), function () { return _this.getResource(i); });
                        };
                        var this_1 = this;
                        for (var i = 1; i <= 3; i++) {
                            _loop_1(i);
                        }
                    }
                    else {
                        this.addActionButton('getResource-button', _('Get resource') + formatTextIcons(" ([resource" + choosePlayActionArgs_1.machine.dice + "])"), function () { return _this.getResource(choosePlayActionArgs_1.machine.dice); });
                        if (choosePlayActionArgs_1.machine.color == 1 || choosePlayActionArgs_1.machine.dice == 0) {
                            // for those machines, getting 1 resource is not the best option, so we "unlight" them
                            dojo.removeClass('getResource-button', 'bgabutton_blue');
                            dojo.addClass('getResource-button', 'bgabutton_gray');
                        }
                    }
                    this.addActionButton('applyEffect-button', _('Apply effect') + (" <div class=\"effect effect" + MACHINES_IDS.indexOf(0) + "\"></div>"), function () { return _this.applyEffect(); });
                    if (!choosePlayActionArgs_1.canApplyEffect) {
                        dojo.addClass('applyEffect-button', 'disabled');
                    }
                    this.addTooltipHtml('applyEffect-button', getMachineTooltip(0));
                    break;
                case 'selectResource':
                    var selectResourceArgs = args;
                    selectResourceArgs.possibleCombinations.forEach(function (combination, index) {
                        return _this.addActionButton("selectResourceCombination" + index + "-button", formatTextIcons(combination.map(function (type) { return "[resource" + type + "]"; }).join('')), function () { return _this.selectResource(combination); });
                    });
                    break;
                case 'selectProject':
                    var selectProjectArgs = args;
                    selectProjectArgs.projects.forEach(function (project) {
                        return _this.addActionButton("selectProject" + project.id + "-button", "<div class=\"project project" + PROJECTS_IDS.indexOf(getUniqueId(project)) + "\"></div>", function () { return _this.selectProject(project.id); });
                    });
                    break;
                case 'selectExchange':
                    var selectExchangeArgs = args;
                    selectExchangeArgs.possibleExchanges.forEach(function (possibleExchange, index) {
                        return _this.addActionButton("selectExchange" + index + "-button", formatTextIcons("[resource" + possibleExchange.from + "] &#x21E8; [resource" + possibleExchange.to + "]"), function () { return _this.selectExchange(possibleExchange); });
                    });
                    this.addActionButton('skipExchange-button', _('Skip'), function () { return _this.skipExchange(); }, null, null, 'red');
                    break;
                case 'chooseProjectDiscardedMachine':
                    this.addActionButton('selectProjectDiscardedMachine-button', _('Discard selected machines'), function () { return _this.discardSelectedMachines(); });
                    break;
            }
        }
    };
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    Glow.prototype.setZoom = function (zoom) {
        if (zoom === void 0) { zoom = 1; }
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        dojo.toggleClass('zoom-in', 'disabled', newIndex === ZOOM_LEVELS.length - 1);
        dojo.toggleClass('zoom-out', 'disabled', newIndex === 0);
        var div = document.getElementById('full-table');
        if (zoom === 1) {
            div.style.transform = '';
            div.style.margin = '';
        }
        else {
            div.style.transform = "scale(" + zoom + ")";
            div.style.margin = "0 " + ZOOM_LEVELS_MARGIN[newIndex] + "% " + (1 - zoom) * -100 + "% 0";
        }
        __spreadArray([this.adventurersStock], this.playersTables.map(function (pt) { return pt.companionsStock; })).forEach(function (stock) { return stock.updateDisplay(); });
        document.getElementById('zoom-wrapper').style.height = div.getBoundingClientRect().height + "px";
    };
    Glow.prototype.zoomIn = function () {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Glow.prototype.zoomOut = function () {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        var newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    };
    Glow.prototype.setupPreferences = function () {
        var _this = this;
        // Extract the ID and value from the UI control
        var onchange = function (e) {
            var match = e.target.id.match(/^preference_control_(\d+)$/);
            if (!match) {
                return;
            }
            var prefId = +match[1];
            var prefValue = +e.target.value;
            _this.prefs[prefId].value = prefValue;
            _this.onPreferenceChange(prefId, prefValue);
        };
        // Call onPreferenceChange() when any value changes
        dojo.query(".preference_control").connect("onchange", onchange);
        // Call onPreferenceChange() now
        dojo.forEach(dojo.query("#ingame_menu_content .preference_control"), function (el) { return onchange({ target: el }); });
    };
    Glow.prototype.onPreferenceChange = function (prefId, prefValue) {
        switch (prefId) {
            // KEEP
            case 201:
                document.getElementById('full-table').appendChild(document.getElementById(prefValue == 2 ? 'table-wrapper' : 'playerstables'));
                break;
        }
    };
    Glow.prototype.setHandSelectable = function (selectable) {
        this.adventurersStock.setSelectionMode(selectable ? 1 : 0);
    };
    Glow.prototype.onAdventurerSelection = function (items) {
        if (items.length == 1) {
            var card = items[0];
            this.chooseAdventurer(card.id);
        }
    };
    Glow.prototype.getPlayerId = function () {
        return Number(this.player_id);
    };
    Glow.prototype.getOpponentId = function (playerId) {
        return Number(Object.values(this.gamedatas.players).find(function (player) { return Number(player.id) != playerId; }).id);
    };
    Glow.prototype.getPlayerScore = function (playerId) {
        var _a, _b;
        return (_b = (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.getValue()) !== null && _b !== void 0 ? _b : Number(this.gamedatas.players[playerId].score);
    };
    Glow.prototype.getPlayerTable = function (playerId) {
        return this.playersTables.find(function (playerTable) { return playerTable.playerId === playerId; });
    };
    Glow.prototype.createPlayerPanels = function (gamedatas) {
        var _this = this;
        Object.values(gamedatas.players).forEach(function (player) {
            var playerId = Number(player.id);
            // charcoalium & resources counters
            dojo.place("\n            <div class=\"counters\">\n                <div id=\"reroll-counter-wrapper-" + player.id + "\" class=\"reroll-counter\">\n                    <div class=\"icon reroll\"></div> \n                    <span id=\"reroll-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"footprint-counter-wrapper-" + player.id + "\" class=\"footprint-counter\">\n                    <div class=\"icon footprint\"></div> \n                    <span id=\"footprint-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"firefly-counter-wrapper-" + player.id + "\" class=\"firefly-counter\">\n                    <div class=\"icon firefly\"></div> \n                    <span id=\"firefly-counter-" + player.id + "\"></span>\n                </div>\n            </div>", "player_board_" + player.id);
            var rerollCounter = new ebg.counter();
            rerollCounter.create("reroll-counter-" + playerId);
            rerollCounter.setValue(player.rerolls);
            _this.rerollCounters[playerId] = rerollCounter;
            var footprintCounter = new ebg.counter();
            footprintCounter.create("footprint-counter-" + playerId);
            footprintCounter.setValue(player.footprints);
            _this.footprintCounters[playerId] = footprintCounter;
            var fireflyCounter = new ebg.counter();
            fireflyCounter.create("firefly-counter-" + playerId);
            fireflyCounter.setValue(player.fireflies);
            _this.fireflyCounters[playerId] = fireflyCounter;
            if (player.playerNo == 1) {
                dojo.place("<div id=\"player-icon-first-player\" class=\"player-icon first-player\"></div>", "player_board_" + player.id);
                _this.addTooltipHtml('player-icon-first-player', _("First player"));
            }
        });
        this.addTooltipHtmlToClass('reroll-counter', _("Rerolls"));
        this.addTooltipHtmlToClass('footprint-counter', _("Footprints"));
        this.addTooltipHtmlToClass('firefly-counter', _("Fireflies"));
    };
    Glow.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex)), players.slice(0, playerIndex)) : players;
        orderedPlayers.forEach(function (player, index) {
            return _this.createPlayerTable(gamedatas, Number(player.id));
        });
    };
    Glow.prototype.createPlayerTable = function (gamedatas, playerId) {
        var playerTable = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(playerTable);
    };
    Glow.prototype.chooseAdventurer = function (id) {
        if (!this.checkAction('chooseAdventurer')) {
            return;
        }
        this.takeAction('chooseAdventurer', {
            id: id
        });
    };
    Glow.prototype.getCharcoalium = function () {
        if (!this.checkAction('getCharcoalium')) {
            return;
        }
        this.takeAction('getCharcoalium');
    };
    Glow.prototype.getResource = function (resource) {
        if (!this.checkAction('getResource')) {
            return;
        }
        this.takeAction('getResource', {
            resource: resource
        });
    };
    Glow.prototype.applyEffect = function () {
        if (!this.checkAction('applyEffect')) {
            return;
        }
        this.takeAction('applyEffect');
    };
    Glow.prototype.selectProjects = function (ids) {
        if (!this.checkAction('selectProjects')) {
            return;
        }
        this.takeAction('selectProjects', {
            ids: ids.join(',')
        });
    };
    Glow.prototype.skipSelectProjects = function () {
        if (!this.checkAction('skipSelectProjects')) {
            return;
        }
        this.takeAction('skipSelectProjects');
    };
    Glow.prototype.selectResource = function (resourcesTypes) {
        if (!this.checkAction('selectResource')) {
            return;
        }
        this.takeAction('selectResource', {
            resourcesTypes: resourcesTypes.join(',')
        });
    };
    Glow.prototype.selectMachine = function (id) {
        if (!this.checkAction('selectMachine')) {
            return;
        }
        this.takeAction('selectMachine', {
            id: id
        });
    };
    Glow.prototype.selectProject = function (id) {
        if (!this.checkAction('selectProject')) {
            return;
        }
        this.takeAction('selectProject', {
            id: id
        });
    };
    Glow.prototype.selectExchange = function (exchange) {
        if (!this.checkAction('selectExchange')) {
            return;
        }
        this.takeAction('selectExchange', exchange);
    };
    Glow.prototype.skipExchange = function () {
        if (!this.checkAction('skipExchange')) {
            return;
        }
        this.takeAction('skipExchange');
    };
    Glow.prototype.discardSelectedMachines = function () {
        if (!this.checkAction('discardSelectedMachines')) {
            return;
        }
        var base64 = btoa(JSON.stringify(/*this.discardedMachineSelector.getCompleteProjects()*/ 'TODO'));
        this.takeAction('discardSelectedMachines', {
            completeProjects: base64
        });
    };
    Glow.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/glow/glow/" + action + ".html", data, this, function () { });
    };
    Glow.prototype.setPoints = function (playerId, points) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(points);
        this.board.setPoints(playerId, points);
    };
    Glow.prototype.addHelp = function () {
        var _this = this;
        dojo.place("<button id=\"glow-help-button\">?</button>", 'left-side');
        dojo.connect($('glow-help-button'), 'onclick', this, function () { return _this.showHelp(); });
    };
    Glow.prototype.showHelp = function () {
        if (!this.helpDialog) {
            this.helpDialog = new ebg.popindialog();
            this.helpDialog.create('glowHelpDialog');
            this.helpDialog.setTitle(_("Cards help"));
            var html = "<div id=\"help-popin\">\n                <h1>" + _("Machines effects") + "</h1>\n                <div id=\"help-machines\" class=\"help-section\">\n                    <table>";
            MACHINES_IDS.forEach(function (number, index) { return html += "<tr><td><div id=\"machine" + index + "\" class=\"machine\"></div></td><td>" + getMachineTooltip(number) + "</td></tr>"; });
            html += "</table>\n                </div>\n                <h1>" + _("Projects") + "</h1>\n                <div id=\"help-projects\" class=\"help-section\">\n                    <table><tr><td class=\"grid\">";
            PROJECTS_IDS.slice(1, 5).forEach(function (number, index) { return html += "<div id=\"project" + (index + 1) + "\" class=\"project\"></div>"; });
            html += "</td></tr><tr><td>" + getProjectTooltip(11) + "</td></tr>\n                <tr><td><div id=\"project0\" class=\"project\"></div></td></tr><tr><td>" + getProjectTooltip(10) + "</td></tr><tr><td class=\"grid\">";
            PROJECTS_IDS.slice(6, 9).forEach(function (number, index) { return html += "<div id=\"project" + (index + 6) + "\" class=\"project\"></div>"; });
            html += "</td></tr><tr><td>" + getProjectTooltip(21) + "</td></tr>\n                <tr><td><div id=\"project5\" class=\"project\"></div></td></tr><tr><td>" + getProjectTooltip(20) + "</td></tr><tr><td class=\"grid\">";
            PROJECTS_IDS.slice(9).forEach(function (number, index) { return html += "<div id=\"project" + (index + 9) + "\" class=\"project\"></div>"; });
            html += "</td></tr><tr><td>" + getProjectTooltip(31) + "</td></tr></table>\n                </div>\n            </div>";
            // Show the dialog
            this.helpDialog.setContent(html);
        }
        this.helpDialog.show();
    };
    Glow.prototype.setRemainingMachines = function (remainingMachines) {
        this.companionCounter.setValue(remainingMachines);
        var visibility = remainingMachines > 0 ? 'visible' : 'hidden';
        document.getElementById('machine-deck').style.visibility = visibility;
        document.getElementById('remaining-machine-counter').style.visibility = visibility;
    };
    Glow.prototype.setRemainingProjects = function (remainingProjects) {
        this.projectCounter.setValue(remainingProjects);
        var visibility = remainingProjects > 0 ? 'visible' : 'hidden';
        document.getElementById('project-deck').style.visibility = visibility;
        document.getElementById('remaining-project-counter').style.visibility = visibility;
    };
    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications
    /*
        setupNotifications:

        In this method, you associate each of your game notifications with your local method to handle it.

        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your glow.game.php file.

    */
    Glow.prototype.setupNotifications = function () {
        //log( 'notifications subscriptions setup' );
        var _this = this;
        var notifs = [
            ['chosenAdventurer', ANIMATION_MS],
            ['points', 1],
            ['lastTurn', 1],
        ];
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Glow.prototype.notif_chosenAdventurer = function (notif) {
        this.getPlayerTable(notif.args.playerId).setAdventurer(notif.args.adventurer);
    };
    Glow.prototype.notif_points = function (notif) {
        this.setPoints(notif.args.playerId, notif.args.points);
    };
    Glow.prototype.notif_lastTurn = function () {
        if (document.getElementById('last-round')) {
            return;
        }
        dojo.place("<div id=\"last-round\">\n            " + _("This is the last round of the game!") + "\n        </div>", 'page-title');
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Glow.prototype.format_string_recursive = function (log, args) {
        try {
            if (log && args && !args.processed) {
                // Representation of the color of a card
                if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = "<strong >" + args.adventurerName + "</strong>";
                }
            }
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return this.inherited(arguments);
    };
    return Glow;
}());
define([
    "dojo", "dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter",
    "ebg/stock"
], function (dojo, declare) {
    return declare("bgagame.glow", ebg.core.gamegui, new Glow());
});