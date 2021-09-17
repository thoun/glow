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
var CARD_WIDTH = 129;
var CARD_HEIGHT = 240;
var PROJECT_WIDTH = 134;
var PROJECT_HEIGHT = 93;
function setupAdventurersCards(adventurerStock) {
    var cardsurl = g_gamethemeurl + "img/adventurers.png";
    for (var i = 0; i <= 7; i++) {
        adventurerStock.addItemType(i, i, cardsurl, i);
    }
}
function setupCompanionCards(companionsStock) {
    companionsStock.image_items_per_row = 10;
    var cardsurl = g_gamethemeurl + "img/companions.png";
    for (var subType = 1; subType <= 46; subType++) {
        companionsStock.addItemType(subType, 0, cardsurl, subType + (subType > 23 ? 1 : 0));
    }
    companionsStock.addItemType(1001, 0, cardsurl, 0);
    companionsStock.addItemType(1002, 0, cardsurl, 24);
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
        .replace(/\[reroll\]/ig, '<span class="icon reroll"></span>')
        .replace(/\[point\]/ig, '<span class="icon point"></span>');
}
var POINT_CASE_SIZE = 25.5;
var MAP1 = [
    [36, 396, 1],
    [157, 382],
    [204, 360],
    [267, 376],
    [332, 358],
    [383, 388, 1],
    [530, 393],
    [596, 373],
    [654, 341],
    [771, 315],
    [817, 269],
    [741, 134],
    [710, 44],
    [766, 39],
    [786, 78, 1],
    [695, 164],
    [720, 257],
    [572, 250, 1],
    [657, 201],
    [615, 157],
    [651, 124],
    [666, 88],
    [646, 37],
    [561, 36],
    [538, 77],
    [584, 94],
    [523, 133],
    [529, 197],
    [474, 132],
    [404, 150],
    [410, 201],
    [467, 218],
    [566, 312],
    [436, 292, 1],
    [380, 250],
    [314, 230],
    [346, 200],
    [336, 155],
    [222, 115, 1],
    [373, 105],
    [159, 40],
    [289, 44],
    [348, 38],
    [419, 62, 1],
    [78, 367],
    [124, 353],
    [150, 317],
    [201, 313],
    [227, 278],
    [275, 292],
    [316, 275],
    [361, 304],
    [227, 209],
    [102, 43],
    [77, 77],
    [42, 105],
    [70, 179],
    [130, 198],
    [176, 255],
    [37, 233, 1],
    [74, 319], // 60
];
var MAP2 = [
    [419, 212, 1],
    [628, 212, 1],
    [752, 142, 1],
    [559, 302, 1],
    [750, 355, 1],
    [397, 386, 1],
    [257, 306, 1],
    [63, 355, 1],
    [150, 208, 1],
    [79, 77, 1],
    [288, 83, 1],
    [503, 67, 1], // 11
];
var MAPS = [null, MAP1, MAP2];
var Board = /** @class */ (function () {
    function Board(game, players) {
        var _this = this;
        this.game = game;
        this.points = new Map();
        this.meeples = [];
        var html = '';
        // points
        players.forEach(function (player) {
            return html += "<div id=\"player-" + player.id + "-point-marker\" class=\"point-marker\" style=\"background: #" + player.color + ";\"></div>";
        });
        dojo.place(html, 'board');
        players.forEach(function (player) {
            var _a;
            _this.points.set(Number(player.id), Number(player.score));
            (_a = _this.meeples).push.apply(_a, player.meeples);
        });
        this.movePoints();
        players.forEach(function (player) { return _this.placeMeeples(player); });
    }
    Board.prototype.incPoints = function (playerId, points) {
        this.points.set(playerId, this.points.get(playerId) + points);
        this.movePoints();
    };
    Board.prototype.getPointsCoordinates = function (points) {
        var cases = points === 10 ? 11 :
            (points > 10 ? points + 2 : points);
        var top = cases < 86 ? Math.min(Math.max(cases - 34, 0), 17) * POINT_CASE_SIZE : (102 - cases) * POINT_CASE_SIZE;
        var left = cases < 52 ? Math.min(cases, 34) * POINT_CASE_SIZE : (33 - Math.max(cases - 52, 0)) * POINT_CASE_SIZE;
        return [17 + left, 15 + top];
    };
    Board.prototype.movePoints = function () {
        var _this = this;
        this.points.forEach(function (points, playerId) {
            var markerDiv = document.getElementById("player-" + playerId + "-point-marker");
            var coordinates = _this.getPointsCoordinates(points);
            var left = coordinates[0];
            var top = coordinates[1];
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
    Board.prototype.placeMeeples = function (player) {
        var _this = this;
        player.meeples.forEach(function (meeple) { return _this.placeMeeple(meeple, player.color); });
    };
    Board.prototype.getMapSpot = function (spot) {
        return MAPS[this.game.getBoardSide()][spot];
    };
    Board.prototype.placeMeeple = function (meeple, color) {
        var mapSpot = this.getMapSpot(meeple.position);
        var x = mapSpot[0];
        var y = mapSpot[1];
        var shift = this.meeples.filter(function (m) { return m.type === meeple.type && (m.playerId < meeple.playerId || (m.playerId === meeple.playerId && m.id < meeple.id)); }).length;
        var div = document.getElementById("meeple" + meeple.id);
        var transform = "translate(" + (x + shift * 5 + (meeple.type === 2 ? 50 : 0)) + "px, " + (y + shift * 5) + "px)";
        if (div) {
            div.style.transform = transform;
        }
        else {
            dojo.place("<div id=\"meeple" + meeple.id + "\" class=\"token meeple" + meeple.type + "\" style=\"background-color: #" + color + "; transform: " + transform + "\"></div>", 'board');
        }
    };
    Board.prototype.moveMeeple = function (meeple) {
        this.meeples.find(function (m) { return m.id = meeple.id; }).position = meeple.position;
        this.placeMeeple(meeple);
    };
    Board.prototype.createDestinationZones = function (possibleDestinations) {
        var _this = this;
        Array.from(document.getElementsByClassName('destination-zone')).forEach(function (node) { return node.parentElement.removeChild(node); });
        possibleDestinations.forEach(function (position) {
            var mapSpot = _this.getMapSpot(position);
            dojo.place("<div id=\"destination-zone-" + position + "\" class=\"destination-zone " + (mapSpot[2] ? 'big' : 'small') + "\" style=\"left: " + mapSpot[0] + "px; top: " + mapSpot[1] + "px;\"></div>", 'board');
            document.getElementById("destination-zone-" + position).addEventListener('click', function () { return _this.game.move(position); });
        });
    };
    return Board;
}());
var MEETING_SPOT_BY_COLOR = [
    null,
    5,
    2,
    4,
    1,
    3,
];
var MeetingTrack = /** @class */ (function () {
    function MeetingTrack(game, meetingTrackSpot) {
        var _this = this;
        this.game = game;
        this.companionsStocks = [];
        var _loop_1 = function (i) {
            var html = '';
            var cemetery = i === 0;
            if (!cemetery) {
                var left_1 = 240 + 135 * (MEETING_SPOT_BY_COLOR[i] - 1);
                html += "<div id=\"meeting-track-dice-" + i + "\" class=\"meeting-track-zone dice\" style=\"left: " + left_1 + "px;\"></div>\n                <div id=\"meeting-track-footprints-" + i + "\" class=\"meeting-track-zone footprints\" style=\"left: " + left_1 + "px;\"></div>";
            }
            var left = cemetery ? 50 : 240 + 135 * (i - 1);
            html += "<div id=\"meeting-track-companion-" + i + "\" class=\"meeting-track-stock\" style=\"left: " + left + "px;\"></div>";
            dojo.place(html, 'meeting-track');
            var spot = meetingTrackSpot[i];
            this_1.companionsStocks[i] = new ebg.stock();
            this_1.companionsStocks[i].setSelectionAppearance('class');
            this_1.companionsStocks[i].selectionClass = 'selected';
            this_1.companionsStocks[i].create(this_1.game, $("meeting-track-companion-" + i), CARD_WIDTH, CARD_HEIGHT);
            this_1.companionsStocks[i].setSelectionMode(0);
            dojo.connect(this_1.companionsStocks[i], 'onChangeSelection', this_1, function () { return _this.game.selectMeetingTrackCompanion(i); });
            setupCompanionCards(this_1.companionsStocks[i]);
            if (cemetery) {
                this_1.setCemeteryTop(spot.companion);
            }
            else {
                if (spot.companion) {
                    this_1.companionsStocks[i].addToStockWithId(spot.companion.subType, '' + spot.companion.id);
                }
                this_1.setFootprintTokens(i, spot.footprints);
            }
        };
        var this_1 = this;
        for (var i = 0; i <= 5; i++) {
            _loop_1(i);
        }
        for (var i = 1; i <= 5; i++) {
            var spot = meetingTrackSpot[i];
            this.placeSmallDice(spot.dice);
        }
    }
    MeetingTrack.prototype.setCompanion = function (meetingTrackSpot, spot) {
        var _a;
        var companion = meetingTrackSpot.companion;
        if (!companion) {
            this.companionsStocks[spot].removeAllTo(Cemetery);
            return;
        }
        var currentId = (_a = this.companionsStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id;
        if (currentId && Number(currentId) === companion.id) {
            return;
        }
        if (currentId && Number(currentId) != companion.id) {
            this.companionsStocks[spot].removeAllTo(Cemetery);
        }
        this.companionsStocks[spot].addToStockWithId(companion.subType, '' + companion.id);
    };
    MeetingTrack.prototype.removeCompanion = function (spot) {
        if (spot == 0) {
            debugger;
        }
        this.companionsStocks[spot].removeAllTo(Cemetery);
    };
    MeetingTrack.prototype.removeCompanions = function () {
        for (var i = 1; i <= 5; i++) {
            this.removeCompanion(i);
        }
    };
    MeetingTrack.prototype.setSelectionMode = function (mode) {
        for (var i = 1; i <= 5; i++) {
            this.companionsStocks[i].setSelectionMode(mode);
        }
    };
    MeetingTrack.prototype.getStock = function (spot) {
        return this.companionsStocks[spot];
    };
    MeetingTrack.prototype.setFootprintTokens = function (spot, number) {
        var zone = document.getElementById("meeting-track-footprints-" + spot);
        while (zone.childElementCount > number) {
            zone.removeChild(zone.lastChild);
        }
        for (var i = zone.childElementCount; i < number; i++) {
            dojo.place("<div class=\"footprint-token\"></div>", zone.id);
        }
    };
    MeetingTrack.prototype.clearFootprintTokens = function (spot, toPlayer) {
        var _this = this;
        var zone = document.getElementById("meeting-track-footprints-" + spot);
        Array.from(zone.children).forEach(function (tokenDiv) { return _this.game.slideToObjectAndDestroy(tokenDiv, "footprint-counter-" + toPlayer); });
    };
    MeetingTrack.prototype.placeSmallDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) {
            _this.game.createOrMoveDie(die, "meeting-track-dice-" + die.value);
        });
    };
    MeetingTrack.prototype.setCemeteryTop = function (companion) {
        if (companion) {
            if (!this.companionsStocks[0].items.length) {
                this.companionsStocks[0].addToStockWithId(1000 + companion.type, '' + companion.type);
            }
            else if (this.companionsStocks[0].items[0].id !== '' + companion.type) {
                this.companionsStocks[0].removeAll();
                this.companionsStocks[0].addToStockWithId(1000 + companion.type, '' + companion.type);
            }
        }
        else {
            this.companionsStocks[0].removeAll();
        }
    };
    return MeetingTrack;
}());
var Cemetery = 'meeting-track-companion-0';
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table whiteblock\" >\n            <div class=\"name-column\">\n                <div class=\"player-name\" style=\"color: #" + player.color + ";\">" + player.name + "</div>\n                <div id=\"player-table-" + this.playerId + "-dice\" class=\"player-table-dice\"></div>\n            </div>\n            <div class=\"adventurer-and-companions\">\n                <div id=\"player-table-" + this.playerId + "-adventurer\"></div>\n                <div id=\"player-table-" + this.playerId + "-companions\"></div>\n            </div>\n        </div>";
        dojo.place(html, this.playerId === this.game.getPlayerId() ? 'currentplayertable' : 'playerstables');
        // adventurer        
        this.adventurerStock = new ebg.stock();
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game, $("player-table-" + this.playerId + "-adventurer"), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        //this.adventurerStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupProjectCard(game, cardDiv, type);
        dojo.connect(this.adventurerStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.adventurerStock.getSelectedItems().length) {
                _this.game.resolveCard(0, Number(itemId));
            }
            _this.adventurerStock.unselectAll();
        });
        setupAdventurersCards(this.adventurerStock);
        if (player.adventurer) {
            this.adventurerStock.addToStockWithId(player.adventurer.color, '' + player.adventurer.id);
        } /* else {
            this.adventurerStock.addToStockWithId(0, '0');
        }*/
        // companions
        this.companionsStock = new ebg.stock();
        this.companionsStock.setSelectionAppearance('class');
        this.companionsStock.selectionClass = 'selected';
        this.companionsStock.create(this.game, $("player-table-" + this.playerId + "-companions"), CARD_WIDTH, CARD_HEIGHT);
        this.companionsStock.setSelectionMode(0);
        dojo.connect(this.companionsStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.companionsStock.getSelectedItems().length) {
                _this.game.resolveCard(1, Number(itemId));
            }
            _this.companionsStock.unselectAll();
        });
        setupCompanionCards(this.companionsStock);
        player.companions.forEach(function (companion) { return _this.companionsStock.addToStockWithId(companion.subType, '' + companion.id); });
        player.dice.forEach(function (die) {
            _this.game.createOrMoveDie(die, "player-table-" + _this.playerId + "-dice");
        });
    }
    PlayerTable.prototype.setAdventurer = function (adventurer) {
        //this.adventurerStock.removeAll();
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, '' + adventurer.id);
    };
    PlayerTable.prototype.addCompanion = function (companion, from) {
        moveToAnotherStock(from, this.companionsStock, companion.subType, '' + companion.id);
    };
    PlayerTable.prototype.addDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.game.createOrMoveDie(die, "player-table-" + _this.playerId + "-dice"); });
    };
    PlayerTable.prototype.removeDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.game.fadeOutAndDestroy("die" + die.id); });
    };
    PlayerTable.prototype.removeCompanion = function (companion) {
        this.companionsStock.removeFromStockById('' + companion.id, Cemetery);
    };
    PlayerTable.prototype.setUsedDie = function (dieId) {
        dojo.addClass("die" + dieId, 'used');
    };
    PlayerTable.prototype.clearUsedDice = function () {
        Array.from(document.getElementsByClassName('die')).forEach(function (die) { return dojo.removeClass(die, 'used'); });
    };
    return PlayerTable;
}());
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var ANIMATION_MS = 500;
var ROLL_DICE_ACTION_BUTTONS_IDS = ["setRollDice-button", "setChangeDie-button", "keepDice-button", "cancelRollDice-button", "rollDice-button", "changeDie-button"];
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
        this.selectedDice = [];
        this.diceSelectionActive = false;
        this.isChangeDie = false;
        this.playersTables = [];
        this.zoom = 1;
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
                this.onEnteringStateStartRound();
                break;
            case 'recruitCompanion':
                this.onEnteringStateRecruitCompanion(args.args);
                break;
            case 'removeCompanion':
                this.onEnteringStateRemoveCompanion(args.args);
                break;
            case 'rollDice':
                this.onEnteringStateRollDice();
            case 'move':
                this.setGamestateDescription(this.gamedatas.side === 2 ? 'boat' : '');
                break;
            case 'endRound':
                var playerTable = this.getPlayerTable(this.getPlayerId());
                playerTable === null || playerTable === void 0 ? void 0 : playerTable.clearUsedDice();
                break;
            case 'gameEnd':
                var lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    };
    Glow.prototype.setGamestateDescription = function (property) {
        if (property === void 0) { property = ''; }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        this.gamedatas.gamestate.description = "" + originalState['description' + property];
        this.gamedatas.gamestate.descriptionmyturn = "" + originalState['descriptionmyturn' + property];
        this.updatePageTitle();
    };
    Glow.prototype.onEnteringStateStartRound = function () {
        if (document.getElementById('adventurers-stock')) {
            dojo.destroy('adventurers-stock');
        }
    };
    Glow.prototype.onEnteringStateChooseAdventurer = function (args) {
        var _this = this;
        var adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place("<div id=\"adventurers-stock\"></div>", 'currentplayertable', 'before');
            this.adventurersStock = new ebg.stock();
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(1);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            // this.adventurersStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupMachineCard(this, cardDiv, type);
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
    Glow.prototype.onEnteringStateRecruitCompanion = function (args) {
        var _this = this;
        this.meetingTrackClickAction = 'recruit';
        args.companions.forEach(function (companion, spot) {
            if (spot >= 1 && spot <= 5) {
                _this.meetingTrack.setCompanion(companion, spot);
            }
        });
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringSelectSketalDie = function (args) {
        var _this = this;
        // remove color duplicates
        args.dice.filter(function (die, index, self) { return index === self.findIndex(function (t) { return t.color === die.color; }); }).forEach(function (die) {
            var html = "<div class=\"die-item color" + die.color + " side" + Math.min(6, die.color) + "\"></div>";
            _this.addActionButton("selectSketalDie" + die.id + "-button", html, function () { return _this.selectSketalDie(die.id); });
        });
    };
    Glow.prototype.onEnteringStateRemoveCompanion = function (args) {
        var _this = this;
        this.meetingTrackClickAction = 'remove';
        args.companions.forEach(function (companion, spot) {
            if (spot >= 1 && spot <= 5) {
                _this.meetingTrack.setCompanion(companion, spot);
            }
        });
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringStateRollDice = function () {
        this.setDiceSelectionActive(true);
    };
    Glow.prototype.onEnteringStateResolveCards = function (possibleEffects) {
        this.onLeavingResolveCards();
        var playerId = this.getPlayerId();
        var playerTable = this.getPlayerTable(playerId);
        possibleEffects.forEach(function (possibleEffect) {
            var cardType = possibleEffect[0];
            var cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(playerTable.adventurerStock.container_div.id + "_item_" + cardId, 'selectable');
            }
            else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                dojo.addClass(playerTable.companionsStock.container_div.id + "_item_" + cardId, 'selectable');
            }
            if (cardType === 2) { // spells
                /*TODO Spells playerTable.adventurerStock.setSelectionMode(1);
                dojo.addClass(`${playerTable.adventurerStock.container_div.id}_item_${cardId}`, 'selectable');*/
            }
        });
    };
    Glow.prototype.onEnteringStateMove = function (args) {
        var _this = this;
        this.board.createDestinationZones(args.possibleRoutes.map(function (route) { return route.destination; }));
        if (this.gamedatas.side === 1) {
            if (!document.getElementById("placeEncampment-button")) {
                this.addActionButton("placeEncampment-button", _("Place encampment"), function () { return _this.placeEncampment(); });
            }
            dojo.toggleClass("placeEncampment-button", 'disabled', !args.canSettle);
        }
        if (!document.getElementById("endTurn-button")) {
            this.addActionButton("endTurn-button", _("End turn"), function () { return _this.endTurn(); }, null, null, 'red');
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
            case 'recruitCompanion':
                this.onLeavingRecruitCompanion();
                break;
            case 'rollDice':
                this.onLeavingRollDice();
                break;
            case 'resolveCards':
                this.onLeavingResolveCards();
                break;
        }
    };
    Glow.prototype.onLeavingChooseAdventurer = function () {
        this.adventurersStock.setSelectionMode(0);
    };
    Glow.prototype.onLeavingRecruitCompanion = function () {
        this.meetingTrack.setSelectionMode(0);
    };
    Glow.prototype.onLeavingRollDice = function () {
        this.setDiceSelectionActive(false);
    };
    Glow.prototype.onLeavingResolveCards = function () {
        Array.from(document.getElementsByClassName('selectable')).forEach(function (node) { return dojo.removeClass(node, 'selectable'); });
        __spreadArray(__spreadArray([], this.playersTables.map(function (pt) { return pt.adventurerStock; })), this.playersTables.map(function (pt) { return pt.companionsStock; })).forEach(function (stock) { return stock.setSelectionMode(0); });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Glow.prototype.onUpdateActionButtons = function (stateName, args) {
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'selectSketalDie':
                    this.onEnteringSelectSketalDie(args);
                    break;
                case 'rollDice':
                    this.rollDiceArgs = args[this.getPlayerId()];
                    this.setActionBarRollDice(false);
                    break;
                case 'resolveCards':
                    var resolveCardsArgs = args[this.getPlayerId()];
                    this.onEnteringStateResolveCards(resolveCardsArgs);
                    break;
                case 'move':
                    var moveArgs = args[this.getPlayerId()];
                    this.onEnteringStateMove(moveArgs);
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
    Glow.prototype.placeFirstPlayerToken = function (playerId) {
        var firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(firstPlayerToken, "player_board_" + playerId + "_firstPlayerWrapper");
        }
        else {
            dojo.place('<div id="firstPlayerToken"></div>', "player_board_" + playerId + "_firstPlayerWrapper");
            this.addTooltipHtml('firstPlayerToken', _("First Player token"));
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
    Glow.prototype.getBoardSide = function () {
        return this.gamedatas.side;
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
            // first player token
            dojo.place("<div id=\"player_board_" + player.id + "_firstPlayerWrapper\"></div>", "player_board_" + player.id);
            if (gamedatas.firstPlayer === playerId) {
                _this.placeFirstPlayerToken(gamedatas.firstPlayer);
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
    Glow.prototype.createAndPlaceDieHtml = function (die, destinationId) {
        var _this = this;
        var html = "<div id=\"die" + die.id + "\" class=\"die die" + die.face + " " + (die.small ? 'small' : '') + " " + (die.used ? 'used' : '') + "\" data-die-id=\"" + die.id + "\" data-die-value=\"" + die.face + "\">\n        <ol class=\"die-list\" data-roll=\"" + die.face + "\">";
        for (var dieFace = 1; dieFace <= 6; dieFace++) {
            html += "<li class=\"die-item color" + die.color + " side" + dieFace + "\" data-side=\"" + dieFace + "\"></li>";
        }
        html += "   </ol>\n        </div>";
        // security to destroy pre-existing die with same id
        //const dieDiv = document.getElementById(`die${die.id}`);
        //dieDiv?.parentNode.removeChild(dieDiv);
        dojo.place(html, destinationId);
        document.getElementById("die" + die.id).addEventListener('click', function () { return _this.onDiceClick(die); });
    };
    Glow.prototype.createOrMoveDie = function (die, destinationId, rollClass) {
        if (rollClass === void 0) { rollClass = 'no-roll'; }
        var dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            this.setNewFace(die, true);
            slideToObjectAndAttach(dieDiv, destinationId);
        }
        else {
            this.createAndPlaceDieHtml(die, destinationId);
            if (rollClass) {
                this.addRollToDiv(this.getDieDiv(die), rollClass);
            }
        }
    };
    Glow.prototype.setNewFace = function (die, addChangeDieRoll) {
        if (addChangeDieRoll === void 0) { addChangeDieRoll = false; }
        var dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            var currentValue = Number(dieDiv.dataset.dieValue);
            if (currentValue != die.face) {
                dieDiv.classList.remove("die" + currentValue);
                dieDiv.classList.add("die" + die.face);
                dieDiv.dataset.dieValue = '' + die.face;
                if (addChangeDieRoll) {
                    this.addRollToDiv(dieDiv, 'change-die-roll');
                }
            }
        }
    };
    Glow.prototype.getDieDiv = function (die) {
        return document.getElementById("die" + die.id);
    };
    Glow.prototype.addRollToDiv = function (dieDiv, rollClass, attempt) {
        var _this = this;
        if (attempt === void 0) { attempt = 0; }
        dieDiv.classList.remove('rolled');
        if (rollClass === 'odd-roll' || rollClass === 'even-roll') {
            dieDiv.classList.add('rolled');
        }
        var dieList = dieDiv.getElementsByClassName('die-list')[0];
        if (dieList) {
            dieList.dataset.roll = dieDiv.dataset.dieValue;
            dieList.classList.remove('no-roll');
            dieList.classList.add(rollClass);
        }
        else if (attempt < 5) {
            setTimeout(function () { return _this.addRollToDiv(dieDiv, rollClass, attempt + 1); }, 200);
        }
    };
    Glow.prototype.removeRollDiceActionButtons = function () {
        var ids = ROLL_DICE_ACTION_BUTTONS_IDS;
        for (var i = 1; i <= 6; i++) {
            ids.push("changeDie" + i + "-button");
        }
        ids.forEach(function (id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
    };
    Glow.prototype.setRollDiceGamestateDescription = function (property, cost) {
        if (cost === void 0) { cost = 0; }
        if (!this.originalTextRollDice) {
            this.originalTextRollDice = document.getElementById('pagemaintitletext').innerHTML;
        }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ?
            "" + originalState['description' + property] + this.getRollDiceCost(cost) :
            this.originalTextRollDice;
    };
    Glow.prototype.setActionBarRollDice = function (fromCancel) {
        var _this = this;
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        if (fromCancel) {
            this.setRollDiceGamestateDescription();
            this.unselectDice();
        }
        var possibleRerolls = this.rollDiceArgs.rerollCompanion + this.rollDiceArgs.rerollTokens + Object.values(this.rollDiceArgs.rerollScore).length;
        this.addActionButton("setRollDice-button", _("Reroll 1 or 2 dice") + formatTextIcons(' (1 [reroll] )'), function () { return _this.setActionBarSelectRollDice(); });
        this.addActionButton("setChangeDie-button", _("Change die face") + formatTextIcons(' (3 [reroll] )'), function () { return _this.setActionBarSelectChangeDie(); });
        this.addActionButton("keepDice-button", _("Keep"), function () { return _this.keepDice(); }, null, null, 'red');
        dojo.toggleClass("setRollDice-button", 'disabled', possibleRerolls < 1);
        dojo.toggleClass("setChangeDie-button", 'disabled', possibleRerolls < 3);
    };
    Glow.prototype.setActionBarSelectRollDice = function () {
        var _this = this;
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription("rollDice", 1);
        this.addActionButton("rollDice-button", _("Reroll selected dice"), function () { return _this.rollDice(); });
        this.addActionButton("cancelRollDice-button", _("Cancel"), function () { return _this.setActionBarRollDice(true); });
        dojo.toggleClass("rollDice-button", 'disabled', this.selectedDice.length < 1 || this.selectedDice.length > 2);
    };
    Glow.prototype.setActionBarSelectChangeDie = function () {
        var _this = this;
        this.isChangeDie = true;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription("changeDie", 3);
        this.addActionButton("cancelRollDice-button", _("Cancel"), function () { return _this.setActionBarRollDice(true); });
        if (this.selectedDice.length === 1) {
            this.onSelectedDiceChange();
        }
    };
    Glow.prototype.getRollDiceCost = function (cost) {
        var tokenCost = 0;
        var scoreCost = 0;
        var remainingCost = cost;
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
            return " ( " + (tokenCost ? formatTextIcons("-" + tokenCost + " [reroll] ") : '') + (scoreCost ? formatTextIcons("-" + this.rollDiceArgs.rerollScore[scoreCost] + " [point] ") : '') + " )";
        }
        else {
            return '';
        }
    };
    Glow.prototype.onSelectedDiceChange = function () {
        var _this = this;
        var count = this.selectedDice.length;
        if (document.getElementById("rollDice-button")) {
            dojo.toggleClass("rollDice-button", 'disabled', count < 1 || count > 2);
        }
        if (this.isChangeDie) {
            if (count === 1) {
                var die = this.selectedDice[0];
                var cancel = document.getElementById("cancelRollDice-button");
                cancel === null || cancel === void 0 ? void 0 : cancel.parentElement.removeChild(cancel);
                var faces = die.color <= 5 ? 5 : 6;
                var _loop_2 = function (i) {
                    var html = "<div class=\"die-item color" + die.color + " side" + i + "\"></div>";
                    this_2.addActionButton("changeDie" + i + "-button", html, function () { return _this.changeDie(i); });
                };
                var this_2 = this;
                for (var i = 1; i <= faces; i++) {
                    _loop_2(i);
                }
                this.addActionButton("cancelRollDice-button", _("Cancel"), function () { return _this.setActionBarRollDice(true); });
            }
            else {
                for (var i = 1; i <= 6; i++) {
                    var elem = document.getElementById("changeDie" + i + "-button");
                    elem === null || elem === void 0 ? void 0 : elem.parentElement.removeChild(elem);
                }
            }
        }
    };
    Glow.prototype.onDiceClick = function (die, force) {
        if (force === void 0) { force = false; }
        if (!this.diceSelectionActive && !force) {
            return;
        }
        var index = this.selectedDice.findIndex(function (d) { return d.id === die.id; });
        var selected = index !== -1;
        if (selected) {
            this.selectedDice.splice(index, 1);
        }
        else {
            this.selectedDice.push(die);
        }
        dojo.toggleClass("die" + die.id, 'selected', !selected);
        this.onSelectedDiceChange();
    };
    Glow.prototype.unselectDice = function () {
        var _this = this;
        this.selectedDice.forEach(function (die) { return _this.onDiceClick(die, true); });
    };
    Glow.prototype.setDiceSelectionActive = function (active) {
        this.unselectDice();
        this.diceSelectionActive = active;
        Array.from(document.getElementsByClassName('die')).forEach(function (node) { return dojo.toggleClass(node, 'selectable', active); });
    };
    Glow.prototype.diceChangedOrRolled = function (dice, changed, args) {
        var _this = this;
        dice.forEach(function (die) {
            dojo.removeClass("die" + die.id, 'selected');
            _this.setNewFace(die);
            _this.addRollToDiv(_this.getDieDiv(die), changed ? 'change-die-roll' : (Math.random() > 0.5 ? 'odd-roll' : 'even-roll'));
        });
        if (args) {
            this.rollDiceArgs = args[this.getPlayerId()];
            this.setActionBarRollDice(true);
        }
    };
    Glow.prototype.rollDice = function () {
        if (!this.checkAction('rollDice')) {
            return;
        }
        this.takeAction('rollDice', { ids: this.selectedDice.map(function (die) { return die.id; }).join(',') });
    };
    Glow.prototype.changeDie = function (value) {
        if (!this.checkAction('changeDie')) {
            return;
        }
        this.takeAction('changeDie', {
            id: this.selectedDice[0].id,
            value: value
        });
    };
    Glow.prototype.selectMeetingTrackCompanion = function (spot) {
        if (this.meetingTrackClickAction === 'remove') {
            this.removeCompanion(spot);
        }
        else {
            this.recruitCompanion(spot);
        }
    };
    Glow.prototype.chooseAdventurer = function (id) {
        if (!this.checkAction('chooseAdventurer')) {
            return;
        }
        this.takeAction('chooseAdventurer', {
            id: id
        });
    };
    Glow.prototype.recruitCompanion = function (spot) {
        if (!this.checkAction('recruitCompanion')) {
            return;
        }
        this.takeAction('recruitCompanion', {
            spot: spot
        });
    };
    Glow.prototype.selectSketalDie = function (id) {
        if (!this.checkAction('selectSketalDie')) {
            return;
        }
        this.takeAction('selectSketalDie', {
            id: id
        });
    };
    Glow.prototype.removeCompanion = function (spot) {
        if (!this.checkAction('removeCompanion')) {
            return;
        }
        this.takeAction('removeCompanion', {
            spot: spot
        });
    };
    Glow.prototype.keepDice = function () {
        if (!this.checkAction('keepDice')) {
            return;
        }
        this.takeAction('keepDice');
    };
    Glow.prototype.resolveCard = function (type, id) {
        if (!this.checkAction('resolveCard')) {
            return;
        }
        this.takeAction('resolveCard', {
            type: type,
            id: id,
        });
    };
    Glow.prototype.move = function (destination) {
        if (!this.checkAction('move')) {
            return;
        }
        this.takeAction('move', {
            destination: destination
        });
    };
    Glow.prototype.placeEncampment = function () {
        if (!this.checkAction('placeEncampment')) {
            return;
        }
        this.takeAction('placeEncampment');
    };
    Glow.prototype.endTurn = function () {
        if (!this.checkAction('endTurn')) {
            return;
        }
        this.takeAction('endTurn');
    };
    Glow.prototype.takeAction = function (action, data) {
        data = data || {};
        data.lock = true;
        this.ajaxcall("/glow/glow/" + action + ".html", data, this, function () { });
    };
    Glow.prototype.incPoints = function (playerId, points) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(points);
        this.board.incPoints(playerId, points);
    };
    Glow.prototype.incRerolls = function (playerId, footprints) {
        var _a;
        (_a = this.rerollCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(footprints);
    };
    Glow.prototype.incFootprints = function (playerId, footprints) {
        var _a;
        (_a = this.footprintCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(footprints);
    };
    Glow.prototype.incFireflies = function (playerId, fireflies) {
        var _a;
        (_a = this.fireflyCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(fireflies);
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
            var html = "<div id=\"help-popin\">\n                <h1>" + _("Specific companions") + "</h1>\n                <div id=\"help-companions\" class=\"help-section\">\n                    <table>";
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
            html += "</td></tr><tr><td>" + getProjectTooltip(31) + "</td></tr></table>\n                </div>\n            </div>";
            // Show the dialog
            this.helpDialog.setContent(html);
        }
        this.helpDialog.show();
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
            ['chosenCompanion', ANIMATION_MS],
            ['removeCompanion', ANIMATION_MS],
            ['removeCompanions', ANIMATION_MS],
            ['replaceSmallDice', ANIMATION_MS],
            ['diceRolled', ANIMATION_MS],
            ['diceChanged', ANIMATION_MS],
            ['meepleMoved', ANIMATION_MS],
            ['takeSketalDie', ANIMATION_MS],
            ['removeSketalDie', ANIMATION_MS],
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
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Glow.prototype.notif_chosenAdventurer = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setAdventurer(notif.args.adventurer);
        playerTable.addDice(notif.args.dice);
    };
    Glow.prototype.notif_chosenCompanion = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addCompanion(notif.args.companion, this.meetingTrack.getStock(notif.args.spot));
        playerTable.addDice(notif.args.dice);
        this.meetingTrack.clearFootprintTokens(notif.args.spot, notif.args.playerId);
    };
    Glow.prototype.notif_removeCompanion = function (notif) {
        if (notif.args.spot) {
            this.meetingTrack.removeCompanion(notif.args.spot);
        }
        else {
            var playerTable = this.getPlayerTable(notif.args.playerId);
            playerTable.removeCompanion(notif.args.companion);
        }
        this.meetingTrack.setCemeteryTop(notif.args.companion);
    };
    Glow.prototype.notif_removeCompanions = function (notif) {
        this.meetingTrack.removeCompanions();
        this.meetingTrack.setCemeteryTop(notif.args.cemeteryTop);
    };
    Glow.prototype.notif_takeSketalDie = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addDice([notif.args.die]);
    };
    Glow.prototype.notif_removeSketalDie = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.removeDice([notif.args.die]);
    };
    Glow.prototype.notif_points = function (notif) {
        this.incPoints(notif.args.playerId, notif.args.points);
    };
    Glow.prototype.notif_rerolls = function (notif) {
        this.incRerolls(notif.args.playerId, notif.args.rerolls);
    };
    Glow.prototype.notif_footprints = function (notif) {
        this.incFootprints(notif.args.playerId, notif.args.footprints);
    };
    Glow.prototype.notif_fireflies = function (notif) {
        this.incFireflies(notif.args.playerId, notif.args.fireflies);
    };
    Glow.prototype.notif_newFirstPlayer = function (notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
    };
    Glow.prototype.notif_newDay = function (notif) {
        var day = notif.args.day;
        if (!this.roundCounter) {
            this.roundCounter = new ebg.counter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(day);
        }
        else {
            this.roundCounter.toValue(day);
        }
    };
    Glow.prototype.notif_replaceSmallDice = function (notif) {
        this.meetingTrack.placeSmallDice(notif.args.dice);
    };
    Glow.prototype.notif_diceRolled = function (notif) {
        this.diceChangedOrRolled(notif.args.dice, false, notif.args.args);
    };
    Glow.prototype.notif_diceChanged = function (notif) {
        this.diceChangedOrRolled(notif.args.dice, true, notif.args.args);
    };
    Glow.prototype.notif_resolveCardUpdate = function (notif) {
        this.onEnteringStateResolveCards(notif.args.remainingEffects);
    };
    Glow.prototype.notif_usedDice = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setUsedDie(notif.args.dieId);
    };
    Glow.prototype.notif_moveUpdate = function (notif) {
        this.onEnteringStateMove(notif.args.args);
    };
    Glow.prototype.notif_meepleMoved = function (notif) {
        this.board.moveMeeple(notif.args.meeple);
    };
    Glow.prototype.notif_lastTurn = function () {
        if (document.getElementById('last-round')) {
            return;
        }
        dojo.place("<div id=\"last-round\">\n            " + _("This is the last round of the game!") + "\n        </div>", 'page-title');
    };
    Glow.prototype.getColor = function (color) {
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
    };
    /* This enable to inject translatable styled things to logs or action bar */
    /* @Override */
    Glow.prototype.format_string_recursive = function (log, args) {
        var _a;
        try {
            if (log && args && !args.processed) {
                if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = "<strong style=\"color: " + this.getColor((_a = args.adventurer) === null || _a === void 0 ? void 0 : _a.color) + ";\">" + args.adventurerName + "</strong>";
                }
                if (typeof args.companionName == 'string' && args.companionName[0] != '<') {
                    args.companionName = "<strong>" + args.companionName + "</strong>";
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
