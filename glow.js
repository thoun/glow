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
        var attachToNewParent = function () {
            if (posX !== undefined) {
                object.style.left = posX + "px";
            }
            else {
                object.style.removeProperty('left');
            }
            if (posY !== undefined) {
                object.style.top = posY + "px";
            }
            else {
                object.style.removeProperty('top');
            }
            object.style.position = (posX !== undefined || posY !== undefined) ? 'absolute' : 'relative';
            if (originalZIndex) {
                object.style.zIndex = '' + originalZIndex;
            }
            else {
                object.style.removeProperty('zIndex');
            }
            object.style.removeProperty('transform');
            object.style.removeProperty('transition');
            destination.appendChild(object);
        };
        if (document.visibilityState === 'hidden') {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        }
        else {
            object.style.transition = "transform 0.5s ease-in";
            object.style.transform = "translate(" + deltaX + "px, " + deltaY + "px)";
            var transitionend_1 = function () {
                attachToNewParent();
                object.removeEventListener('transitionend', transitionend_1);
                resolve(true);
            };
            object.addEventListener('transitionend', transitionend_1);
        }
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
var SPELL_DIAMETER = 64;
var CEMETERY = 'cemetery';
var DECK = 'deck';
var DECKB = 'deckB';
var SOLO_TILES = 'solo-tiles';
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
function setupSpellCards(spellsStock) {
    var cardsurl = g_gamethemeurl + "img/spells.png";
    for (var type = 1; type <= 7; type++) {
        spellsStock.addItemType(type, type, cardsurl, type);
    }
    spellsStock.addItemType(0, 0, cardsurl, 0);
}
function setupSoloTileCards(soloTilesStock) {
    var cardsurl = g_gamethemeurl + "img/solo-tiles.png";
    for (var type = 1; type <= 8; type++) {
        soloTilesStock.addItemType(type, type, cardsurl, type - 1);
    }
    soloTilesStock.addItemType(0, 0, cardsurl, 0);
}
function getEffectExplanation(effect) {
    if (effect > 100) {
        return dojo.string.substitute(_("Earn ${points} bursts of light."), { points: "<strong>" + (effect - 100) + "</strong>" });
    }
    else if (effect < -100) {
        return dojo.string.substitute(_("Lose ${points} bursts of light."), { points: "<strong>" + -(effect + 100) + "</strong>" });
    }
    else if (effect > 20 && effect < 30) {
        return dojo.string.substitute(_("Earn ${footprints} footprints."), { footprints: "<strong>" + (effect - 20) + "</strong>" });
    }
    else if (effect < -20 && effect > -30) {
        return dojo.string.substitute(_("Earn ${footprints} footprints."), { footprints: "<strong>" + -(effect + 20) + "</strong>" });
    }
    else if (effect > 10 && effect < 20) {
        return dojo.string.substitute(_("Earn ${fireflies} firefly."), { fireflies: "<strong>" + (effect - 10) + "</strong>" });
    }
    else if (effect === 30) {
        return _("Earn 1 reroll token.");
    }
    else if (effect === 33) {
        return _("The companion is immediately placed in the cemetery.");
    }
}
function getEffectTooltip(effect) {
    if (!effect) {
        return null;
    }
    var conditions = null;
    if (effect.conditions.every(function (condition) { return condition > 0; })) {
        conditions = dojo.string.substitute(_("${symbols} triggers the effect."), {
            symbols: formatTextIcons(effect.conditions.map(function (condition) { return "[symbol" + condition + "]"; }).join(''))
        });
    }
    else if (effect.conditions.every(function (condition) { return condition == 0; })) {
        conditions = dojo.string.substitute(formatTextIcons(effect.conditions.map(function (_) { return "[symbol0]"; }).join('')) + ' : ' + _("any ${number} identical symbols."), {
            number: "<strong>" + effect.conditions.length + "</strong>"
        });
    }
    else if (effect.conditions.every(function (condition) { return condition < 0; })) {
        conditions = dojo.string.substitute(_("If the symbols ${symbols} are not present on any of the dice, the effect is triggered."), {
            symbols: formatTextIcons(effect.conditions.map(function (condition) { return "[symbol" + -condition + "]"; }).join(''))
        });
    }
    else if (effect.conditions.some(function (condition) { return condition > 0; }) && effect.conditions.some(function (condition) { return condition < 0; })) {
        conditions = dojo.string.substitute(_("If the symbols ${forbiddenSymbols} are not present on any of the dice, ${symbols} triggers the effect."), {
            forbiddenSymbols: formatTextIcons(effect.conditions.filter(function (condition) { return condition < 0; }).map(function (condition) { return "[symbol" + -condition + "]"; }).join('')),
            symbols: formatTextIcons(effect.conditions.filter(function (condition) { return condition > 0; }).map(function (condition) { return "[symbol" + condition + "]"; }).join('')),
        });
    }
    return "\n    <div class=\"tooltip-effect-title\">" + _("Conditions") + "</div>\n    " + conditions + "\n    <hr>\n    <div class=\"tooltip-effect-title\">" + _("Effects") + "</div>\n    " + effect.effects.map(function (effect) { return getEffectExplanation(effect); }).join('<br>') + "\n    ";
}
function setupAdventurerCard(game, cardDiv, type) {
    var tooltip = getEffectTooltip(game.gamedatas.ADVENTURERS_EFFECTS[type]);
    if (tooltip) {
        game.addTooltipHtml(cardDiv.id, tooltip);
    }
}
function getCompanionTooltip(type) {
    switch (type) {
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 44: return "<p>" + _("If the player chooses a Sketal, they immediately take an additional large die from the reserve pool in the color indicated by its power. The Sketal, whose power is a multicolored die, allows the player to take a large die of their choice from those available in the reserve pool. If there are none, it has no effect. If the player forgets to take the die, they can take in a following round. If a Sketal is sent to the cemetery, the corresponding die is replaced in the reserve pool.") + "</p>";
        case 10: return "<p>" + _("If the player obtains 2 fire symbols, Xar\u2019gok is sent to the cemetery and the spells are cast:") + "</p>\n        <ol class=\"help-list\"><li>" + _("1. The other players take a spell token that they place facedown in front of them.") + "</li>\n        <li>" + _("2. At the beginning of the next round, the spell tokens are revealed.") + "</li>\n        <li>" + _("3. When a player fulfils the condition indicated on their token, the spell is triggered: its effect is applied and the token is replaced in the box.") + "</li></ol>\n        <p>" + _("<b>A spell token works in exactly the same way as a card:</b> the player chooses the order in which they resolve their cards and their spell, the trigger conditions and the effects are the same as those of the cards.") + "</p>\n        <p><div class=\"help-special-spell\"></div>" + _("Only this spell token is played differently: it must always be placed on the last companion to be recruited. The player must move the spell token each time he recruits a new companion.") + "</p>\n        <p>" + _("When the spell is triggered, the companion on which it is placed is sent to the cemetery (without applying any effects, even if it has a skull) and the player replaces the token in the box. As the player can choose the order in which the cards and the spell are resolved, they can benefit from the targeted character\u2019s effect (if their dice allow them to) before it is sent to the cemetery.") + "</p>";
        case 20: return "<p>" + _("When a player takes Kaar, they take the small black die from the reserve pool, roll it and place it on the space of the meeting track indicated by the result of the die. If the result indicates an empty space, the player must reroll the die. If no player takes Kaar, the black die does not come into play.") + "</p>\n        <p>" + _("During the rest of the game, the player with Kaar is immunized against the curse of the black die. If the black die is placed in front of the companion they want to take, they can move it in front of another companion of their choice.") + "</p>\n        <p>" + _("<b>Curse of the black die:</b> In each round, the player who rolls the black die with their other dice must apply its result: according to the obtained symbol, every other die of the player with the same symbol is not counted in the final result. If the player obtains -2 bursts of light, they move back as many spaces on the score track.") + "</p>\n        <p style=\"color: #D4111F;\">" + _("<b>Important:</b> the black die remains in play until the end of the game, even if Kaar is sent to the cemetery.") + "</p>";
        case 41: return "<p>" + _("If the player obtains an air symbol, they immediately discard Cromaug and can take another companion of their choice from the cemetery that they place in front of them. The chosen companion becomes the last companion to be recruited.") + "</p>\n        <p>" + _("If it is a Sketal, they take the additional die indicated by its power, if it is available in the reserve pool, and can roll it from the next round. If it is Kaar, the black die comes into play.") + "</p>\n        <p>" + _("If the previously obtained result of the dice allows it, they can immediately trigger the effect of this new companion.") + "</p>";
    }
    return null;
}
function setupCompanionCard(game, cardDiv, type) {
    var tooltip = getEffectTooltip(game.gamedatas.COMPANIONS_EFFECTS[type]);
    var companionTooltip = getCompanionTooltip(type);
    if (tooltip && companionTooltip) {
        game.addTooltipHtml(cardDiv.id, tooltip + "<hr>" + companionTooltip);
    }
    else if (tooltip) {
        game.addTooltipHtml(cardDiv.id, tooltip);
    }
    else if (companionTooltip) {
        game.addTooltipHtml(cardDiv.id, companionTooltip);
    }
    cardDiv.classList.add('card-inner');
    dojo.place("<div class=\"card-front\" style=\"" + cardDiv.attributes.getNamedItem('style').nodeValue.replace(/"/g, '\'') + "\"></div>", cardDiv);
    dojo.place("<div class=\"card-back back" + (type > 23 ? 'B' : 'A') + "\"></div>", cardDiv);
}
function setupSpellCard(game, cardDiv, type) {
    var tooltip = getEffectTooltip(game.gamedatas.SPELLS_EFFECTS[type]);
    if (tooltip) {
        game.addTooltipHtml(cardDiv.id, tooltip);
    }
}
function setupSoloTileCard(game, cardDiv, type) {
    var effect = game.gamedatas.SOLO_TILES[type];
    var html = "";
    if (effect.moveCompany > 0) {
        html += "<div>" + dojo.string.substitute(_("Move Tom’s band token forward ${spaces} spaces. Then Tom’s score token is moved the number of spaces corresponding to the band token’s position on the score track."), { spaces: "<strong>" + effect.moveCompany + "</strong>" }) + "</div>";
    }
    if (effect.moveScore > 0) {
        html += "<div>" + dojo.string.substitute(_("Move Tom’s score token forward ${number} shards of light"), { number: "<strong>" + effect.moveScore + "</strong>" }) + "</div>";
    }
    if (effect.moveMeeple > 0) {
        var side = game.getBoardSide();
        if (side == 1) {
            html += "<div>" + _("Move Tom’s camp to the village with a higher number of shards of light.") + "</div>";
        }
        else if (side == 2) {
            html += "<div>" + dojo.string.substitute(_("Move one of Tom’s boats via the path by the ${lowesthighest} value"), { lowesthighest: effect.moveMeeple == 2 ? _("highest") : _("lowest") }) + "</div>";
        }
    }
    if (html != "") {
        game.addTooltipHtml(cardDiv.id, html);
    }
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
        .replace(/\[point\]/ig, '<span class="icon point"></span>')
        .replace(/\[symbol(\d)\]/ig, '<span class="icon symbol$1"></span>')
        .replace(/\[die:(\d):(\d)\]/ig, '<span class="die-icon" data-color="$1" data-face="$2"></span>');
}
var POINT_CASE_SIZE = 25.5;
var BOARD_POINTS_MARGIN = 38;
var HIDDEN_TOKENS_DELAY = 2000;
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
    [416, 204, 1],
    [635, 200, 1],
    [760, 132, 1],
    [564, 299, 1],
    [762, 355, 1],
    [393, 383, 1],
    [252, 300, 1],
    [58, 352, 1],
    [139, 196, 1],
    [69, 66, 1],
    [286, 69, 1],
    [504, 55, 1], // 11
];
var MAPS = [null, MAP1, MAP2];
var Board = /** @class */ (function () {
    function Board(game, players, tableDice) {
        var _this = this;
        this.game = game;
        this.players = players;
        this.points = new Map();
        this.meeples = [];
        var html = '';
        // points
        players.forEach(function (player) {
            return html += "<div id=\"player-" + player.id + "-point-marker\" class=\"point-marker " + (_this.game.isColorBlindMode() ? 'color-blind' : '') + "\" data-player-no=\"" + player.playerNo + "\" style=\"background: #" + player.color + ";\"></div>";
        });
        dojo.place(html, 'board');
        players.forEach(function (player) {
            var _a;
            _this.points.set(Number(player.id), Number(player.score));
            (_a = _this.meeples).push.apply(_a, player.meeples);
            if (Number(player.id) == 0) { // tom
                var coordinates = _this.getPointsCoordinates(player.company);
                var left = coordinates[0];
                var top_1 = coordinates[1];
                var transform = "translateX(" + left + "px) translateY(" + top_1 + "px)";
                dojo.place("<div id=\"meeple0\" class=\"token meeple1 " + (_this.game.isColorBlindMode() ? 'color-blind' : '') + " meeple-player-0\" style=\"background-color: black; transform: " + transform + "\"></div>", 'board');
            }
        });
        this.movePoints();
        players.forEach(function (player) { return _this.placeMeeples(player); });
        tableDice.forEach(function (die) { return _this.game.createOrMoveDie(die, 'table-dice'); });
        document.getElementById('table-dice').addEventListener('click', function (event) {
            if (!_this.game.gamedatas.gamestate.name.startsWith('selectSketalDie')) {
                return;
            }
            var target = event.target;
            if (!target || !target.classList.contains('die')) {
                return;
            }
            _this.game.selectSketalDie(Number(target.dataset.dieId));
        });
        var boardDiv = document.getElementById('board');
        boardDiv.addEventListener('click', function (event) { return _this.hideTokens(boardDiv, event); });
        boardDiv.addEventListener('mousemove', function (event) {
            if (!_this.tokensOpacityTimeout) {
                _this.hideTokens(boardDiv, event);
            }
        });
        boardDiv.addEventListener('mouseleave', function () {
            if (_this.tokensOpacityTimeout) {
                clearTimeout(_this.tokensOpacityTimeout);
                dojo.removeClass('board', 'hidden-tokens');
                dojo.removeClass('board', 'hidden-meeples');
                _this.tokensOpacityTimeout = null;
            }
        });
    }
    Board.prototype.hideTokens = function (boardDiv, event) {
        var _this = this;
        var x = event.offsetX;
        var y = event.offsetY;
        //if (x < BOARD_POINTS_MARGIN || y < BOARD_POINTS_MARGIN || x > boardDiv.clientWidth - BOARD_POINTS_MARGIN || y > boardDiv.clientHeight - BOARD_POINTS_MARGIN) {
        dojo.addClass('board', 'hidden-tokens');
        dojo.addClass('board', 'hidden-meeples');
        if (this.tokensOpacityTimeout) {
            clearTimeout(this.tokensOpacityTimeout);
        }
        this.tokensOpacityTimeout = setTimeout(function () {
            dojo.removeClass('board', 'hidden-tokens');
            dojo.removeClass('board', 'hidden-meeples');
            _this.tokensOpacityTimeout = null;
        }, HIDDEN_TOKENS_DELAY);
        //}
    };
    Board.prototype.setPoints = function (playerId, points) {
        this.points.set(playerId, points);
        this.movePoints();
    };
    Board.prototype.setTomCompany = function (company) {
        var coordinates = this.getPointsCoordinates(company);
        var left = coordinates[0];
        var top = coordinates[1];
        document.getElementById("meeple0").style.transform = "translateX(" + left + "px) translateY(" + top + "px)";
    };
    Board.prototype.getPointsCoordinates = function (points) {
        var cases = points === 10 ? 11 :
            (points > 10 ? points + 2 : points);
        var top = cases < 86 ? Math.min(Math.max(cases - 34, 0), 17) * POINT_CASE_SIZE : (102 - cases) * POINT_CASE_SIZE;
        var left = cases < 52 ? Math.min(cases, 34) * POINT_CASE_SIZE : Math.max((33 - Math.max(cases - 52, 0)) * POINT_CASE_SIZE, 0);
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
            dojo.place("<div id=\"meeple" + meeple.id + "\" class=\"token meeple" + meeple.type + " " + (this.game.isColorBlindMode() ? 'color-blind' : '') + " meeple-player-" + meeple.playerId + "\" data-player-no=\"" + this.players.find(function (p) { return Number(p.id) == meeple.playerId; }).playerNo + "\" style=\"background-color: #" + color + "; transform: " + transform + "\"></div>", 'board');
        }
    };
    Board.prototype.moveMeeple = function (meeple) {
        this.meeples.find(function (m) { return m.id = meeple.id; }).position = meeple.position;
        this.placeMeeple(meeple);
    };
    Board.prototype.createDestinationZones = function (possibleDestinations) {
        var _this = this;
        Array.from(document.getElementsByClassName('destination-zone')).forEach(function (node) { return node.parentElement.removeChild(node); });
        Array.from(document.getElementsByClassName('destination-arrow')).forEach(function (node) { return node.parentElement.removeChild(node); });
        possibleDestinations === null || possibleDestinations === void 0 ? void 0 : possibleDestinations.forEach(function (possibleDestination) {
            var position = possibleDestination.destination;
            var mapSpot = _this.getMapSpot(position);
            var big = mapSpot.length > 2;
            if (!document.getElementById("destination-zone-" + position)) {
                dojo.place("<div id=\"destination-zone-" + position + "\" class=\"destination-zone " + (mapSpot[2] ? 'big' : 'small') + "\" style=\"left: " + mapSpot[0] + "px; top: " + mapSpot[1] + "px;\"></div>", 'board');
            }
            var from = possibleDestination.from;
            var mapSpotFrom = _this.getMapSpot(from);
            var deltaX = mapSpot[0] - mapSpotFrom[0];
            var deltaY = mapSpot[1] - mapSpotFrom[1];
            var rad = Math.atan2(deltaY, deltaX); // In radians
            var left = (mapSpot[0] + mapSpotFrom[0]) / 2;
            var top = (mapSpot[1] + mapSpotFrom[1]) / 2;
            if (!big) {
                left -= 25;
            }
            var onlyOneDestinationToSpot = possibleDestinations.filter(function (pd) { return pd.destination === possibleDestination.destination; }).length <= 1;
            if (!document.getElementById("destination-arrow-" + position + "-from-" + from)) {
                var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                var scaleX = Math.min(1, distance / 180);
                var scaleY = Math.min(1, distance / 100);
                dojo.place("<div id=\"destination-arrow-" + position + "-from-" + from + "\" class=\"destination-arrow\" style=\"left: " + left + "px; top: " + top + "px; transform: rotate(" + rad + "rad) scaleX(" + scaleX + ") scaleY(" + scaleY + ")\"></div>", 'board');
                document.getElementById("destination-arrow-" + position + "-from-" + from).addEventListener('click', function () { return _this.game.selectMove(possibleDestination); });
                var footprintsCost = possibleDestination.costForPlayer.filter(function (cost) { return cost > -30 && cost < -20; }).map(function (cost) { return (-cost) - 20; }).reduce(function (a, b) { return a + b; }, 0);
                for (var i = 0; i < footprintsCost; i++) {
                    dojo.place("<div class=\"footprint round-token\" style=\"position: absolute; left: " + i * 10 + "px; top: " + i * 10 + "px; transform: scaleX(" + (1 / scaleX) / 1.8 + ") scaleY(" + (1 / scaleY) / 1.8 + ")\"></div>", "destination-arrow-" + position + "-from-" + from);
                }
                console.log('footprintsCost', footprintsCost);
            }
            if (onlyOneDestinationToSpot) {
                document.getElementById("destination-zone-" + position).addEventListener('click', function () { return _this.game.selectMove(possibleDestination); });
            }
            dojo.toggleClass("destination-zone-" + position, 'unselectable', !onlyOneDestinationToSpot);
        });
    };
    Board.prototype.setColor = function (playerId, newPlayerColor) {
        document.getElementById("player-" + playerId + "-point-marker").style.background = "#" + newPlayerColor;
        Array.from(document.getElementsByClassName("meeple-player-" + playerId)).forEach(function (elem) { return elem.style.background = "#" + newPlayerColor; });
    };
    return Board;
}());
var MEETING_SPOT_BY_COLOR = [
    null,
    4,
    1,
    3,
    0,
    2,
];
var MeetingTrack = /** @class */ (function () {
    function MeetingTrack(game, meetingTrackSpot, topDeckType, topDeckBType, topCemeteryType, discardedSoloTiles) {
        var _this = this;
        this.game = game;
        this.companionsStocks = [];
        this.soloTilesStocks = [];
        var solo = this.game.isSolo();
        if (solo) {
            dojo.place("<div id=\"meeting-track-dice-0\" class=\"meeting-track-zone dice\" style=\"left: 57px;\"></div>", 'meeting-track');
            meetingTrackSpot[0].dice.forEach(function (die) { return _this.game.createOrMoveDie(die, "meeting-track-dice-0"); });
        }
        var _loop_1 = function (i) {
            var left = 245 + 135 * MEETING_SPOT_BY_COLOR[i];
            var html = "\n            <div id=\"meeting-track-dice-" + i + "\" class=\"meeting-track-zone dice\" style=\"left: " + left + "px;\"></div>\n            <div id=\"meeting-track-footprints-" + i + "\" class=\"meeting-track-zone footprints\" style=\"left: " + left + "px;\"></div>\n            <div id=\"meeting-track-companion-" + i + "\" class=\"meeting-track-stock\" style=\"left: " + left + "px;\"></div>\n            ";
            if (solo) {
                html += "<div id=\"meeting-track-soloTile-" + i + "\" class=\"meeting-track-solo-tile\" style=\"left: " + left + "px;\"></div>";
            }
            dojo.place(html, 'meeting-track');
            var spot = meetingTrackSpot[i];
            // companions
            this_1.companionsStocks[i] = new ebg.stock();
            this_1.companionsStocks[i].setSelectionAppearance('class');
            this_1.companionsStocks[i].selectionClass = 'selected';
            this_1.companionsStocks[i].create(this_1.game, $("meeting-track-companion-" + i), CARD_WIDTH, CARD_HEIGHT);
            this_1.companionsStocks[i].setSelectionMode(0);
            this_1.companionsStocks[i].onItemCreate = function (cardDiv, type) { return setupCompanionCard(game, cardDiv, type); };
            dojo.connect(this_1.companionsStocks[i], 'onChangeSelection', this_1, function (_, id) { return id && _this.game.selectMeetingTrackCompanion(i); });
            setupCompanionCards(this_1.companionsStocks[i]);
            if (spot.companion) {
                this_1.companionsStocks[i].addToStockWithId(spot.companion.subType, '' + spot.companion.id);
            }
            // footprints
            this_1.setFootprintTokens(i, spot.footprints);
            if (solo) {
                // solo tiles
                this_1.soloTilesStocks[i] = new ebg.stock();
                this_1.soloTilesStocks[i].setSelectionAppearance('class');
                this_1.soloTilesStocks[i].selectionClass = 'selected';
                this_1.soloTilesStocks[i].create(this_1.game, $("meeting-track-soloTile-" + i), CARD_WIDTH, CARD_WIDTH);
                this_1.soloTilesStocks[i].setSelectionMode(0);
                this_1.soloTilesStocks[i].onItemCreate = function (cardDiv, type) { return setupSoloTileCard(game, cardDiv, type); };
                setupSoloTileCards(this_1.soloTilesStocks[i]);
                if (spot.soloTile) {
                    this_1.soloTilesStocks[i].addToStockWithId(spot.soloTile.type, '' + spot.soloTile.id);
                }
            }
        };
        var this_1 = this;
        for (var i = 1; i <= 5; i++) {
            _loop_1(i);
        }
        var _loop_2 = function (i) {
            var spot = meetingTrackSpot[i];
            this_2.placeSmallDice(spot.dice);
            document.getElementById("meeting-track-dice-" + i).addEventListener('click', function () {
                if (dojo.hasClass("meeting-track-dice-" + i, 'selectable')) {
                    _this.game.moveBlackDie(i);
                }
            });
        };
        var this_2 = this;
        // place dice only after spots creation
        for (var i = 1; i <= 5; i++) {
            _loop_2(i);
        }
        this.setDeckTop(DECK, topDeckType);
        this.setDeckTop(DECKB, topDeckBType);
        this.setDeckTop(CEMETERY, topCemeteryType);
        if (game.isSolo()) {
            dojo.place("<div id=\"solo-tiles\" class=\"meeting-track-stock solo-tiles hidden-pile\"></div>", 'meeting-track');
            dojo.place("<div id=\"solo-tiles-discard\" class=\"meeting-track-stock solo-tiles hidden-pile " + (discardedSoloTiles ? '' : 'hidden') + "\"></div>", 'meeting-track');
            dojo.addClass('middle-band', 'solo');
        }
    }
    MeetingTrack.prototype.setCompanion = function (companion, spot) {
        var _a;
        if (!companion) {
            this.companionsStocks[spot].removeAllTo(CEMETERY);
            return;
        }
        var currentId = (_a = this.companionsStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id;
        if (currentId && Number(currentId) === companion.id) {
            return;
        }
        if (currentId && Number(currentId) != companion.id) {
            this.companionsStocks[spot].removeAllTo(CEMETERY);
        }
        this.companionsStocks[spot].addToStockWithId(companion.subType, '' + companion.id, DECK);
    };
    MeetingTrack.prototype.setSoloTile = function (meetingTrackSpot, spot) {
        var _a;
        var soloTile = meetingTrackSpot.soloTile;
        if (!soloTile) {
            this.soloTilesStocks[spot].removeAll();
            return;
        }
        var currentId = (_a = this.soloTilesStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id;
        if (currentId && Number(currentId) === soloTile.id) {
            return;
        }
        if (currentId && Number(currentId) != soloTile.id) {
            this.soloTilesStocks[spot].removeAll();
        }
        this.soloTilesStocks[spot].addToStockWithId(soloTile.type, '' + soloTile.id, SOLO_TILES);
    };
    MeetingTrack.prototype.removeCompanion = function (spot) {
        var _a;
        var id = this.companionsStocks[spot].container_div.id + "_item_" + ((_a = this.companionsStocks[spot].items[0]) === null || _a === void 0 ? void 0 : _a.id);
        var card = document.getElementById(id);
        this.companionsStocks[spot].removeAllTo(CEMETERY);
        if (card) {
            card.classList.add('flipped');
            setTimeout(function () { return card.style.visibility = 'hidden'; }, 500);
        }
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
            dojo.place("<div class=\"round-token footprint footprint-token\"></div>", zone.id);
        }
    };
    MeetingTrack.prototype.clearFootprintTokens = function (spot, toPlayer) {
        var _this = this;
        var zone = document.getElementById("meeting-track-footprints-" + spot);
        Array.from(zone.children).forEach(function (tokenDiv) { return _this.game.slideToObjectAndDestroy(tokenDiv, "player-table-" + toPlayer + "-footprint-tokens"); });
    };
    MeetingTrack.prototype.placeSmallDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) {
            return _this.game.createOrMoveDie(die, "meeting-track-dice-" + die.value);
        });
    };
    MeetingTrack.prototype.setDeckTop = function (deckId, type) {
        document.getElementById(deckId).dataset.type = "" + (type !== null && type !== void 0 ? type : 0);
    };
    MeetingTrack.prototype.setSelectableDice = function (possibleSpots) {
        var _loop_3 = function (i) {
            dojo.toggleClass("meeting-track-dice-" + i, 'selectable', possibleSpots.some(function (ps) { return ps === i; }));
        };
        for (var i = 1; i <= 5; i++) {
            _loop_3(i);
        }
    };
    MeetingTrack.prototype.updateSoloTiles = function (args) {
        this.setDeckTop(DECK, args.topDeckType);
        this.setDeckTop(DECKB, args.topDeckBType);
        dojo.toggleClass('solo-tiles-discard', 'hidden', !args.discardedSoloTiles);
        this.soloTilesStocks[args.spot].removeAllTo('solo-tiles-discard');
        if (args.soloTile) {
            this.soloTilesStocks[args.spot].addToStockWithId(args.soloTile.type, '' + args.soloTile.id, 'solo-tiles-discard');
        }
    };
    return MeetingTrack;
}());
var COMPANION_SPELL = 3;
var PlayerTable = /** @class */ (function () {
    function PlayerTable(game, player) {
        var _this = this;
        this.game = game;
        this.playerId = Number(player.id);
        var html = "\n        <div id=\"player-table-" + this.playerId + "\" class=\"player-table whiteblock\">\n            <div class=\"name-and-dice\">\n                <div id=\"player-table-" + this.playerId + "-name\" class=\"player-name\" style=\"background-color: #" + player.color + ";\">" + player.name + "</div>\n                <div class=\"player-tokens\">\n                    <div id=\"player-table-" + this.playerId + "-reroll-tokens\" class=\"player-tokens-type\"></div>\n                    <div id=\"player-table-" + this.playerId + "-footprint-tokens\" class=\"player-tokens-type\"></div>\n                    <div id=\"player-table-" + this.playerId + "-firefly-tokens\" class=\"player-tokens-type\"></div>\n                </div>\n                <div id=\"player-table-" + this.playerId + "-dice\" class=\"player-dice\"></div>\n            </div>\n            <div class=\"adventurer-and-companions\">\n                <div id=\"player-table-" + this.playerId + "-spells\" class=\"player-table-spells normal\"></div>\n                <div id=\"player-table-" + this.playerId + "-adventurer\" class=\"player-table-adventurer\"></div>\n                <div id=\"player-table-" + this.playerId + "-companions\" class=\"player-table-companions\"></div>\n            </div>\n        </div>";
        dojo.place(html, this.playerId === this.game.getPlayerId() ? 'currentplayertable' : 'playerstables');
        // adventurer        
        this.adventurerStock = new ebg.stock();
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game, $("player-table-" + this.playerId + "-adventurer"), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        this.adventurerStock.onItemCreate = function (cardDiv, type) { return setupAdventurerCard(game, cardDiv, type); };
        dojo.connect(this.adventurerStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.adventurerStock.getSelectedItems().length) {
                _this.game.cardClick(0, Number(itemId));
            }
            _this.adventurerStock.unselectAll();
        });
        setupAdventurersCards(this.adventurerStock);
        if (player.adventurer) {
            this.adventurerStock.addToStockWithId(player.adventurer.color, '' + player.adventurer.id);
        }
        // companions
        this.companionsStock = new ebg.stock();
        this.companionsStock.setSelectionAppearance('class');
        this.companionsStock.selectionClass = 'selected';
        this.companionsStock.create(this.game, $("player-table-" + this.playerId + "-companions"), CARD_WIDTH, CARD_HEIGHT);
        this.companionsStock.setSelectionMode(0);
        this.companionsStock.onItemCreate = function (cardDiv, type) { return setupCompanionCard(game, cardDiv, type); };
        dojo.connect(this.companionsStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.companionsStock.getSelectedItems().length) {
                _this.game.cardClick(1, Number(itemId));
            }
            _this.companionsStock.unselectAll();
        });
        setupCompanionCards(this.companionsStock);
        player.companions.forEach(function (companion) { return _this.companionsStock.addToStockWithId(companion.subType, '' + companion.id); });
        // spells
        this.spellsStock = new ebg.stock();
        this.spellsStock.setSelectionAppearance('class');
        this.spellsStock.selectionClass = 'selected';
        this.spellsStock.create(this.game, $("player-table-" + this.playerId + "-spells"), SPELL_DIAMETER, SPELL_DIAMETER);
        this.spellsStock.setSelectionMode(0);
        this.spellsStock.onItemCreate = function (cardDiv, type) { return setupSpellCard(game, cardDiv, type); };
        dojo.connect(this.spellsStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.spellsStock.getSelectedItems().length) {
                _this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            _this.spellsStock.unselectAll();
        });
        setupSpellCards(this.spellsStock);
        dojo.toggleClass("player-table-" + this.playerId + "-spells", 'hidden', player.spells.filter(function (spell) { return spell.type != 3 || !spell.visible; }).length == 0);
        player.spells.forEach(function (spell) {
            if (spell.visible) {
                _this.revealSpell(spell, true);
            }
            else {
                _this.addHiddenSpell(spell.id);
            }
        });
        // dice
        player.dice.forEach(function (die) {
            _this.game.createOrMoveDie(die, "player-table-" + _this.playerId + "-dice");
        });
        // tokens
        this.setTokens('reroll', player.rerolls);
        this.setTokens('footprint', player.footprints);
        this.setTokens('firefly', player.fireflies);
    }
    PlayerTable.prototype.getLastCompanionId = function () {
        var _a;
        return (_a = this.companionsStock.items[this.companionsStock.items.length - 1]) === null || _a === void 0 ? void 0 : _a.id;
    };
    PlayerTable.prototype.createCompanionSpellStock = function () {
        var _this = this;
        if (this.companionSpellStock) {
            return;
        }
        var lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }
        dojo.place("\n            <div id=\"player-table-" + this.playerId + "-companion-spell\" class=\"player-table-companion-spell\"></div>\n        ", this.companionsStock.container_div.id + "_item_" + lastItemId);
        this.companionSpellStock = new ebg.stock();
        this.companionSpellStock.centerItems = true;
        this.companionSpellStock.setSelectionAppearance('class');
        this.companionSpellStock.selectionClass = 'selected';
        this.companionSpellStock.create(this.game, $("player-table-" + this.playerId + "-companion-spell"), SPELL_DIAMETER, SPELL_DIAMETER);
        this.companionSpellStock.setSelectionMode(0);
        this.companionSpellStock.onItemCreate = function (cardDiv, type) { return setupSpellCard(_this.game, cardDiv, type); };
        dojo.connect(this.companionSpellStock, 'onChangeSelection', this, function (_, itemId) {
            if (_this.companionSpellStock.getSelectedItems().length) {
                _this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            _this.companionSpellStock.unselectAll();
        });
        setupSpellCards(this.companionSpellStock);
    };
    PlayerTable.prototype.removeCompanionSpellStock = function () {
        dojo.destroy("player-table-" + this.playerId + "-companion-spell");
        this.companionSpellStock = null;
    };
    PlayerTable.prototype.moveCompanionSpellStock = function () {
        var lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }
        if (this.companionSpellStock) {
            document.getElementById(this.companionsStock.container_div.id + "_item_" + lastItemId).appendChild(document.getElementById("player-table-" + this.playerId + "-companion-spell"));
        }
    };
    PlayerTable.prototype.setAdventurer = function (adventurer) {
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, '' + adventurer.id);
    };
    PlayerTable.prototype.addCompanion = function (companion, from) {
        moveToAnotherStock(from, this.companionsStock, companion.subType, '' + companion.id);
        this.moveCompanionSpellStock();
    };
    PlayerTable.prototype.addDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.game.createOrMoveDie(die, "player-table-" + _this.playerId + "-dice"); });
    };
    PlayerTable.prototype.removeDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.game.fadeOutAndDestroy("die" + die.id); });
    };
    PlayerTable.prototype.removeCompanion = function (companion, removedBySpell) {
        var id = this.companionsStock.container_div.id + "_item_" + companion.id;
        var card = document.getElementById(id);
        this.companionsStock.removeFromStockById('' + companion.id, CEMETERY);
        if (card) {
            card.classList.add('flipped');
            setTimeout(function () { return card.style.visibility = 'hidden'; }, 500);
        }
        if (removedBySpell) {
            this.removeSpell(removedBySpell);
        }
        else {
            this.moveCompanionSpellStock();
        }
    };
    PlayerTable.prototype.setUsedDie = function (dieId) {
        dojo.addClass("die" + dieId, 'used');
    };
    PlayerTable.prototype.clearUsedDice = function () {
        Array.from(document.getElementsByClassName('die')).forEach(function (die) { return dojo.removeClass(die, 'used'); });
    };
    PlayerTable.prototype.addHiddenSpell = function (id, fromPlayerId) {
        if (fromPlayerId === void 0) { fromPlayerId = undefined; }
        dojo.addClass("player-table-" + this.playerId + "-spells", 'hidden');
        this.spellsStock.addToStockWithId(0, 'hidden' + id, fromPlayerId ? "overall_player_board_" + fromPlayerId : undefined);
    };
    PlayerTable.prototype.revealSpell = function (spell, tableCreation) {
        if (tableCreation === void 0) { tableCreation = false; }
        var stock = this.spellsStock;
        if (spell.type === 3) {
            this.createCompanionSpellStock();
            stock = this.companionSpellStock;
        }
        var hiddenSpellId = this.spellsStock.container_div.id + "_item_hidden" + spell.id;
        stock.addToStockWithId(spell.type, '' + spell.id, document.getElementById(hiddenSpellId) ? hiddenSpellId : undefined);
        if (!tableCreation) {
            this.spellsStock.removeFromStockById('hidden' + spell.id);
        }
        dojo.toggleClass("player-table-" + this.playerId + "-spells", 'hidden', this.spellsStock.items.length == 0);
    };
    PlayerTable.prototype.removeSpell = function (spell) {
        var _a;
        this.spellsStock.removeFromStockById('' + spell.id);
        if (spell.type === 3) {
            (_a = this.companionSpellStock) === null || _a === void 0 ? void 0 : _a.removeFromStockById('' + spell.id);
            this.removeCompanionSpellStock();
        }
        dojo.toggleClass("player-table-" + this.playerId + "-spells", 'hidden', this.spellsStock.items.length == 0);
    };
    PlayerTable.prototype.setColor = function (newPlayerColor) {
        document.getElementById("player-table-" + this.playerId + "-name").style.backgroundColor = "#" + newPlayerColor;
    };
    PlayerTable.prototype.setTokens = function (type, number) {
        var zone = document.getElementById("player-table-" + this.playerId + "-" + type + "-tokens");
        while (zone.childElementCount > number) {
            zone.removeChild(zone.lastChild);
        }
        for (var i = zone.childElementCount; i < number; i++) {
            dojo.place("<div class=\"round-token " + type + "\"></div>", zone.id);
        }
    };
    return PlayerTable;
}());
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var ANIMATION_MS = 500;
var ROLL_DICE_ACTION_BUTTONS_IDS = ["setRollDice-button", "setChangeDie-button", "keepDice-button", "cancelRollDice-button", "change-die-faces-buttons"];
var MOVE_ACTION_BUTTONS_IDS = ["placeEncampment-button", "endTurn-button", "cancelMoveDiscardCampanionOrSpell-button"];
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
        this.companionCounters = [];
        this.selectedDice = [];
        this.selectedDieFace = null;
        this.diceSelectionActive = false;
        this.isChangeDie = false;
        this.playersTables = [];
        this.zoom = 1;
        this.DICE_FACES_TOOLTIP = [];
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
        var _this = this;
        this.dontPreloadImage('publisher.png');
        this.dontPreloadImage("side" + (gamedatas.side == 2 ? 1 : 2) + ".png");
        log("Starting game setup");
        for (var color = 1; color <= 8; color++) {
            var facesStr = '';
            for (var face = 1; face <= 6; face++) {
                facesStr += "[die:" + color + ":" + face + "]";
            }
            this.DICE_FACES_TOOLTIP[color] = "<h3>" + _("Die faces") + "</h3> <div>" + formatTextIcons(facesStr) + "</div>";
        }
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        dojo.addClass('board', "side" + gamedatas.side);
        this.createPlayerPanels(gamedatas);
        var players = Object.values(gamedatas.players);
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
        document.getElementById('zoom-out').addEventListener('click', function () { return _this.zoomOut(); });
        document.getElementById('zoom-in').addEventListener('click', function () { return _this.zoomIn(); });
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        this.onScreenWidthChange = function () {
            _this.setAutoZoom();
        };
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
            this.adventurersStock = null;
        }
    };
    Glow.prototype.onEnteringStateChooseAdventurer = function (args) {
        var _this = this;
        var adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            dojo.place("<div id=\"adventurers-stock\"></div>", 'currentplayertable', 'before');
            this.adventurersStock = new ebg.stock();
            this.adventurersStock.create(this, $('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(0);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = function (cardDiv, type) { return setupAdventurerCard(_this, cardDiv, type); };
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
        var solo = this.isSolo();
        args.companions.forEach(function (meetingTrackSpot, spot) {
            if (spot >= 1 && spot <= 5) {
                _this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
                _this.meetingTrack.placeSmallDice(meetingTrackSpot.dice);
                _this.meetingTrack.setFootprintTokens(spot, meetingTrackSpot.footprints);
                if (solo) {
                    _this.meetingTrack.setSoloTile(meetingTrackSpot, spot);
                }
            }
        });
        this.meetingTrack.setDeckTop(DECK, args.topDeckType);
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringChooseTomDice = function (args) {
        var _this = this;
        // remove color duplicates
        args.dice.filter(function (die, index, self) { return index === self.findIndex(function (t) { return t.color === die.color; }); }).forEach(function (die) {
            var html = "<div class=\"die-item color" + die.color + " side" + Math.min(6, die.color) + "\"></div>";
            _this.addActionButton("selectTomDie" + die.color + "-button", html, function () { return _this.onTomDiceSelection(die); }, null, null, 'gray');
        });
        this.addActionButton("confirmTomDice-button", _("Confirm"), function () { return _this.chooseTomDice(); });
        dojo.addClass("confirmTomDice-button", 'disabled');
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
        args.companions.forEach(function (meetingTrackSpot, spot) {
            if (spot >= 1 && spot <= 5) {
                _this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
            }
        });
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    };
    Glow.prototype.onEnteringStateMoveBlackDie = function (args) {
        if (this.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectableDice(args.possibleSpots);
        }
    };
    Glow.prototype.onEnteringStateRollDice = function () {
        this.setDiceSelectionActive(true);
    };
    Glow.prototype.onEnteringResurrect = function (args) {
        var _this = this;
        var companions = args.cemeteryCards;
        if (!document.getElementById('cemetary-companions-stock')) {
            dojo.place("<div id=\"cemetary-companions-stock\"></div>", 'currentplayertable', 'before');
            this.cemetaryCompanionsStock = new ebg.stock();
            this.cemetaryCompanionsStock.create(this, $('cemetary-companions-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.cemetaryCompanionsStock.setSelectionMode(0);
            this.cemetaryCompanionsStock.setSelectionAppearance('class');
            this.cemetaryCompanionsStock.selectionClass = 'nothing';
            this.cemetaryCompanionsStock.centerItems = true;
            this.cemetaryCompanionsStock.onItemCreate = function (cardDiv, type) { return setupCompanionCard(_this, cardDiv, type); };
            dojo.connect(this.cemetaryCompanionsStock, 'onChangeSelection', this, function () { return _this.onCemetarySelection(_this.cemetaryCompanionsStock.getSelectedItems()); });
            setupCompanionCards(this.cemetaryCompanionsStock);
            companions.forEach(function (companion) { return _this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id, CEMETERY); });
            this.meetingTrack.setDeckTop(CEMETERY, 0);
        }
        if (this.isCurrentPlayerActive()) {
            this.cemetaryCompanionsStock.setSelectionMode(1);
            this.addActionButton("skipResurrect-button", _("Skip"), function () { return _this.skipResurrect(); }, null, null, 'red');
        }
    };
    Glow.prototype.onEnteringStateResolveCards = function (resolveCardsForPlayer) {
        this.onLeavingResolveCards();
        var playerId = this.getPlayerId();
        var playerTable = this.getPlayerTable(playerId);
        resolveCardsForPlayer.remainingEffects.forEach(function (possibleEffect) {
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
                playerTable.spellsStock.setSelectionMode(1);
                if (document.getElementById(playerTable.spellsStock.container_div.id + "_item_" + cardId)) {
                    dojo.addClass(playerTable.spellsStock.container_div.id + "_item_" + cardId, 'selectable');
                }
                else if (playerTable.companionSpellStock && document.getElementById(playerTable.companionSpellStock.container_div.id + "_item_" + cardId)) {
                    playerTable.companionSpellStock.setSelectionMode(1);
                    dojo.addClass(playerTable.companionSpellStock.container_div.id + "_item_" + cardId, 'selectable');
                }
            }
        });
    };
    Glow.prototype.onEnteringStateMove = function () {
        var _this = this;
        var _a;
        this.board.createDestinationZones((_a = this.moveArgs.possibleRoutes) === null || _a === void 0 ? void 0 : _a.map(function (route) { return route; }));
        if (this.gamedatas.side === 1) {
            if (!document.getElementById("placeEncampment-button")) {
                this.addActionButton("placeEncampment-button", _("Place encampment"), function () { return _this.placeEncampment(); });
            }
            dojo.toggleClass("placeEncampment-button", 'disabled', !this.moveArgs.canSettle);
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
    };
    Glow.prototype.onLeavingChooseAdventurer = function () {
        this.adventurersStock.setSelectionMode(0);
    };
    Glow.prototype.onLeavingRecruitCompanion = function () {
        this.meetingTrack.setSelectionMode(0);
    };
    Glow.prototype.onLeavingMoveBlackDie = function () {
        this.meetingTrack.setSelectableDice([]);
    };
    Glow.prototype.onLeavingRollDice = function () {
        this.setDiceSelectionActive(false);
    };
    Glow.prototype.onLeavingResurrect = function () {
        if (document.getElementById('cemetary-companions-stock')) {
            this.cemetaryCompanionsStock.removeAllTo(CEMETERY);
            this.fadeOutAndDestroy('cemetary-companions-stock');
            this.cemetaryCompanionsStock = null;
        }
    };
    Glow.prototype.onLeavingResolveCards = function () {
        Array.from(document.getElementsByClassName('selectable')).forEach(function (node) { return dojo.removeClass(node, 'selectable'); });
        __spreadArray(__spreadArray(__spreadArray([], this.playersTables.map(function (pt) { return pt.adventurerStock; })), this.playersTables.map(function (pt) { return pt.companionsStock; })), this.playersTables.map(function (pt) { return pt.spellsStock; })).forEach(function (stock) { return stock.setSelectionMode(0); });
    };
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    Glow.prototype.onUpdateActionButtons = function (stateName, args) {
        var _this = this;
        if (this.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseTomDice':
                    this.onEnteringChooseTomDice(args);
                    break;
                case 'selectSketalDie':
                case 'selectSketalDieMulti':
                    this.onEnteringSelectSketalDie(args);
                    break;
                case 'rollDice':
                    this.gamedatas.gamestate.args[this.getPlayerId()] = args[this.getPlayerId()];
                    this.setActionBarRollDice(false);
                    break;
                case 'resolveCards':
                    var resolveCardsArgs = args[this.getPlayerId()];
                    this.onEnteringStateResolveCards(resolveCardsArgs);
                    this.addActionButton("resolveAll-button", _("Resolve all"), function () { return _this.resolveAll(); }, null, null, 'red');
                    break;
                case 'move':
                    this.moveArgs = args[this.getPlayerId()];
                    this.setActionBarMove(false);
                    break;
            }
        }
        switch (stateName) {
            case 'resurrect':
                this.onEnteringResurrect(args);
                break;
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
        var stocks = this.playersTables.map(function (pt) { return pt.companionsStock; });
        if (this.adventurersStock) {
            stocks.push(this.adventurersStock);
        }
        stocks.forEach(function (stock) { return stock.updateDisplay(); });
        document.getElementById('zoom-wrapper').style.height = div.getBoundingClientRect().height + "px";
        var fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 916 * zoom ? 'block' : 'flex';
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
    Glow.prototype.setAutoZoom = function () {
        var _this = this;
        var zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(function () { return _this.setAutoZoom(); }, 200);
            return;
        }
        var newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth / newZoom < 916 /* board width */) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        this.setZoom(newZoom);
    };
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
    Glow.prototype.isSolo = function () {
        return Object.keys(this.gamedatas.players).length == 1;
    };
    Glow.prototype.onTomDiceSelection = function (die) {
        var _a, _b, _c, _d;
        var index = this.selectedDice.findIndex(function (d) { return d.id == die.id; });
        if (index !== -1) {
            // we deselect
            this.selectedDice.splice(index, 1);
            if (die.color == 6) {
                (_a = document.getElementById("selectTomDie7-button")) === null || _a === void 0 ? void 0 : _a.classList.remove('disabled');
            }
            else if (die.color == 7) {
                (_b = document.getElementById("selectTomDie6-button")) === null || _b === void 0 ? void 0 : _b.classList.remove('disabled');
            }
        }
        else {
            // we select
            this.selectedDice.push(die);
            if (die.color == 6) {
                (_c = document.getElementById("selectTomDie7-button")) === null || _c === void 0 ? void 0 : _c.classList.add('disabled');
            }
            else if (die.color == 7) {
                (_d = document.getElementById("selectTomDie6-button")) === null || _d === void 0 ? void 0 : _d.classList.add('disabled');
            }
        }
        dojo.toggleClass("selectTomDie" + die.color + "-button", 'bgabutton_blue', index === -1);
        dojo.toggleClass("selectTomDie" + die.color + "-button", 'bgabutton_gray', index !== -1);
        dojo.toggleClass("confirmTomDice-button", 'disabled', this.selectedDice.length != 2);
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
    Glow.prototype.onCemetarySelection = function (items) {
        if (items.length == 1) {
            var card = items[0];
            this.resurrect(card.id);
        }
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
    Glow.prototype.isColorBlindMode = function () {
        return this.prefs[201].value == 1;
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
        var players = Object.values(gamedatas.players);
        var solo = players.length === 1;
        if (solo) {
            dojo.place("\n            <div id=\"overall_player_board_0\" class=\"player-board current-player-board\">\t\t\t\t\t\n                <div class=\"player_board_inner\" id=\"player_board_inner_982fff\">\n                    \n                    <div class=\"emblemwrap\" id=\"avatar_active_wrap_0\">\n                        <div src=\"img/gear.png\" alt=\"\" class=\"avatar avatar_active\" id=\"avatar_active_0\"></div>\n                    </div>\n                                               \n                    <div class=\"player-name\" id=\"player_name_0\">\n                        Tom\n                    </div>\n                    <div id=\"player_board_0\" class=\"player_board_content\">\n                        <div class=\"player_score\">\n                            <span id=\"player_score_0\" class=\"player_score_value\">10</span> <i class=\"fa fa-star\" id=\"icon_point_0\"></i>           \n                        </div>\n                    </div>\n                </div>\n            </div>", "overall_player_board_" + players[0].id, 'after');
            var tomScoreCounter = new ebg.counter();
            tomScoreCounter.create("player_score_0");
            tomScoreCounter.setValue(gamedatas.tom.score);
            this.scoreCtrl[0] = tomScoreCounter;
        }
        (solo ? __spreadArray(__spreadArray([], players), [gamedatas.tom]) : players).forEach(function (player) {
            var playerId = Number(player.id);
            // counters
            dojo.place("\n            <div class=\"counters\">\n                <div id=\"reroll-counter-wrapper-" + player.id + "\" class=\"reroll-counter\">\n                    <div class=\"icon reroll\"></div> \n                    <span id=\"reroll-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"footprint-counter-wrapper-" + player.id + "\" class=\"footprint-counter\">\n                    <div class=\"icon footprint\"></div> \n                    <span id=\"footprint-counter-" + player.id + "\"></span>\n                </div>\n                <div id=\"firefly-counter-wrapper-" + player.id + "\" class=\"firefly-counter\">\n                </div>\n            </div>\n            ", "player_board_" + player.id);
            var rerollCounter = new ebg.counter();
            rerollCounter.create("reroll-counter-" + playerId);
            rerollCounter.setValue(player.rerolls);
            _this.rerollCounters[playerId] = rerollCounter;
            var footprintCounter = new ebg.counter();
            footprintCounter.create("footprint-counter-" + playerId);
            footprintCounter.setValue(player.footprints);
            _this.footprintCounters[playerId] = footprintCounter;
            if (playerId != 0) {
                dojo.place("\n                    <div id=\"firefly-counter-icon-" + player.id + "\" class=\"icon firefly\"></div> \n                    <span id=\"firefly-counter-" + player.id + "\"></span>&nbsp;/&nbsp;<span id=\"companion-counter-" + player.id + "\"></span>\n                ", "firefly-counter-wrapper-" + player.id);
                var fireflyCounter = new ebg.counter();
                fireflyCounter.create("firefly-counter-" + playerId);
                var allFireflies = player.fireflies + player.companions.map(function (companion) { return companion.fireflies; }).reduce(function (a, b) { return a + b; }, 0);
                fireflyCounter.setValue(allFireflies);
                _this.fireflyCounters[playerId] = fireflyCounter;
                var companionCounter = new ebg.counter();
                companionCounter.create("companion-counter-" + playerId);
                companionCounter.setValue(player.companions.length);
                _this.companionCounters[playerId] = companionCounter;
                _this.updateFireflyCounterIcon(playerId);
            }
            if (!solo) {
                // first player token
                dojo.place("<div id=\"player_board_" + player.id + "_firstPlayerWrapper\"></div>", "player_board_" + player.id);
                if (gamedatas.firstPlayer === playerId) {
                    _this.placeFirstPlayerToken(gamedatas.firstPlayer);
                }
            }
            else if (playerId == 0) {
                dojo.place("<div id=\"tomDiceWrapper\"></div>", "player_board_" + player.id);
                if (gamedatas.tom.dice) {
                    _this.setTomDice(gamedatas.tom.dice);
                }
            }
            if (_this.isColorBlindMode() && playerId != 0) {
                dojo.place("\n            <div class=\"token meeple" + (_this.gamedatas.side == 2 ? 0 : 1) + " color-blind meeple-player-" + player.id + "\" data-player-no=\"" + player.playerNo + "\" style=\"background-color: #" + player.color + ";\"></div>\n            ", "player_board_" + player.id);
            }
        });
        this.addTooltipHtmlToClass('reroll-counter', _("Rerolls tokens"));
        this.addTooltipHtmlToClass('footprint-counter', _("Footprints tokens"));
        this.addTooltipHtmlToClass('firefly-counter', _("Fireflies (tokens + companion fireflies) / number of companions"));
    };
    Glow.prototype.updateFireflyCounterIcon = function (playerId) {
        var activated = this.fireflyCounters[playerId].getValue() >= this.companionCounters[playerId].getValue();
        document.getElementById("firefly-counter-icon-" + playerId).dataset.activated = activated.toString();
    };
    Glow.prototype.createPlayerTables = function (gamedatas) {
        var _this = this;
        var players = Object.values(gamedatas.players).sort(function (a, b) { return a.playerNo - b.playerNo; });
        var playerIndex = players.findIndex(function (player) { return Number(player.id) === Number(_this.player_id); });
        var orderedPlayers = playerIndex > 0 ? __spreadArray(__spreadArray([], players.slice(playerIndex)), players.slice(0, playerIndex)) : players;
        orderedPlayers.forEach(function (player) { return _this.createPlayerTable(gamedatas, Number(player.id)); });
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
        this.addTooltipHtml("die" + die.id, this.DICE_FACES_TOOLTIP[die.color]);
    };
    Glow.prototype.createOrMoveDie = function (die, destinationId, rollClass) {
        if (rollClass === void 0) { rollClass = '-'; }
        var dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            this.setNewFace(die, true);
            dojo.toggleClass("die" + die.id, 'used', die.used);
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
                    this.addRollToDiv(dieDiv, 'change');
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
        if (rollClass === 'odd' || rollClass === 'even') {
            dieDiv.addEventListener('animationend', function () {
                dieDiv.classList.remove('rolled');
            });
            setTimeout(function () { return dieDiv.classList.add('rolled'); }, 50);
        }
        var dieList = dieDiv.getElementsByClassName('die-list')[0];
        if (dieList) {
            dieList.dataset.rollType = '-';
            dieList.dataset.roll = dieDiv.dataset.dieValue;
            setTimeout(function () { return dieList.dataset.rollType = rollClass; }, 50);
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
        var rollDiceButtons = this.getRollDiceButtons();
        rollDiceButtons.forEach(function (elem) { return elem.parentElement.removeChild(elem); });
        var changeDieButtons = this.getChangeDieButtons();
        changeDieButtons.forEach(function (elem) { return elem.parentElement.removeChild(elem); });
    };
    Glow.prototype.setRollDiceGamestateDescription = function (property) {
        if (!this.originalTextRollDice) {
            this.originalTextRollDice = document.getElementById('pagemaintitletext').innerHTML;
        }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ?
            originalState['description' + property] :
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
        var rollDiceArgs = this.gamedatas.gamestate.args[this.getPlayerId()];
        var possibleRerolls = rollDiceArgs.rerollCompanion + rollDiceArgs.rerollTokens + Object.values(rollDiceArgs.rerollScore).length;
        this.addActionButton("setRollDice-button", _("Reroll 1 or 2 dice") + formatTextIcons(' (1 [reroll] )'), function () { return _this.setActionBarSelectRollDice(); });
        this.addActionButton("setChangeDie-button", _("Change die face") + formatTextIcons(' (3 [reroll] )'), function () { return _this.setActionBarSelectChangeDie(); });
        this.addActionButton("keepDice-button", _("Keep current dice"), function () { return _this.keepDice(); }, null, null, 'red');
        dojo.toggleClass("setRollDice-button", 'disabled', possibleRerolls < 1);
        dojo.toggleClass("setChangeDie-button", 'disabled', possibleRerolls < 3);
    };
    Glow.prototype.getPossibleCosts = function (costNumber) {
        var playerArgs = this.gamedatas.gamestate.args[this.getPlayerId()];
        var possibleCosts = [];
        var canUse = [
            playerArgs.rerollCompanion,
            playerArgs.rerollTokens,
            Object.values(playerArgs.rerollScore).length,
        ];
        [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].forEach(function (orderArray) {
            var remainingCost = costNumber;
            var _loop_4 = function (i) {
                var possibleCost = [0, 0, 0];
                orderArray.forEach(function (order, orderIndex) {
                    if (remainingCost > 0 && canUse[order] > 0) {
                        var min = Math.min(remainingCost, canUse[order]);
                        if (orderIndex === 0) {
                            min = Math.min(min, i);
                        }
                        remainingCost -= min;
                        possibleCost[order] += min;
                    }
                });
                if (possibleCost.reduce(function (a, b) { return a + b; }, 0) === costNumber && !possibleCosts.some(function (other) { return possibleCost[0] == other[0] && possibleCost[1] == other[1] && possibleCost[2] == other[2]; })) {
                    possibleCosts.push(possibleCost);
                }
            };
            for (var i = 1; i <= costNumber; i++) {
                _loop_4(i);
            }
        });
        return possibleCosts;
    };
    Glow.prototype.getRollDiceButtons = function () {
        return Array.from(document.querySelectorAll('[id^="rollDice-button"]'));
    };
    Glow.prototype.getChangeDieButtons = function () {
        return Array.from(document.querySelectorAll('[id^="changeDie-button"]'));
    };
    Glow.prototype.setActionBarSelectRollDice = function () {
        var _this = this;
        this.isChangeDie = false;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription("rollDice");
        var possibleCosts = this.getPossibleCosts(1);
        possibleCosts.forEach(function (possibleCost, index) {
            var costStr = possibleCost.map(function (cost, costTypeIndex) { return _this.getRollDiceCostStr(costTypeIndex, cost); }).filter(function (str) { return str !== null; }).join(' ');
            _this.addActionButton("rollDice-button" + index, _("Reroll selected dice") + ("(" + costStr + ")"), function () { return _this.rollDice(possibleCost); });
            dojo.toggleClass("rollDice-button" + index, 'disabled', _this.selectedDice.length < 1 || _this.selectedDice.length > 2);
        });
        this.addActionButton("cancelRollDice-button", _("Cancel"), function () { return _this.setActionBarRollDice(true); });
    };
    Glow.prototype.setActionBarSelectChangeDie = function () {
        var _this = this;
        this.isChangeDie = true;
        this.removeRollDiceActionButtons();
        this.setRollDiceGamestateDescription("changeDie");
        dojo.place("<div id=\"change-die-faces-buttons\"></div>", 'generalactions');
        var possibleCosts = this.getPossibleCosts(3);
        possibleCosts.forEach(function (possibleCost, index) {
            var costStr = possibleCost.map(function (cost, costTypeIndex) { return _this.getRollDiceCostStr(costTypeIndex, cost); }).filter(function (str) { return str !== null; }).join(' ');
            _this.addActionButton("changeDie-button" + index, _("Change selected die") + ("(" + costStr + ")"), function () { return _this.changeDie(possibleCost); });
            dojo.addClass("changeDie-button" + index, 'disabled');
        });
        this.addActionButton("cancelRollDice-button", _("Cancel"), function () { return _this.setActionBarRollDice(true); });
        if (this.selectedDice.length === 1) {
            this.onSelectedDiceChange();
        }
    };
    Glow.prototype.removeMoveActionButtons = function () {
        var ids = MOVE_ACTION_BUTTONS_IDS;
        ids.forEach(function (id) {
            var elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
    };
    Glow.prototype.setMoveGamestateDescription = function (property) {
        if (!this.originalTextMove) {
            this.originalTextMove = document.getElementById('pagemaintitletext').innerHTML;
        }
        var originalState = this.gamedatas.gamestates[this.gamedatas.gamestate.id];
        document.getElementById('pagemaintitletext').innerHTML = property ?
            originalState['description' + property] :
            this.originalTextMove;
    };
    Glow.prototype.setActionBarMove = function (fromCancel) {
        this.removeMoveActionButtons();
        if (fromCancel) {
            this.setMoveGamestateDescription();
        }
        // make cards unselectable
        this.onLeavingResolveCards();
        this.onEnteringStateMove();
    };
    Glow.prototype.setActionBarMoveDiscardCampanionOrSpell = function () {
        var _this = this;
        var _a, _b, _c, _d, _e, _f;
        this.removeMoveActionButtons();
        this.board.createDestinationZones(null);
        this.setMoveGamestateDescription("discard");
        this.addActionButton("cancelMoveDiscardCampanionOrSpell-button", _("Cancel"), function () { return _this.setActionBarMove(true); });
        // make cards selectable
        var playerTable = this.getPlayerTable(this.getPlayerId());
        (_a = playerTable.companionsStock) === null || _a === void 0 ? void 0 : _a.setSelectionMode(1);
        (_b = playerTable.companionsStock) === null || _b === void 0 ? void 0 : _b.items.forEach(function (item) { return dojo.addClass(playerTable.companionsStock.container_div.id + "_item_" + item.id, 'selectable'); });
        (_c = playerTable.spellsStock) === null || _c === void 0 ? void 0 : _c.setSelectionMode(1);
        (_d = playerTable.spellsStock) === null || _d === void 0 ? void 0 : _d.items.forEach(function (item) { return dojo.addClass(playerTable.spellsStock.container_div.id + "_item_" + item.id, 'selectable'); });
        (_e = playerTable.companionSpellStock) === null || _e === void 0 ? void 0 : _e.setSelectionMode(1);
        (_f = playerTable.companionSpellStock) === null || _f === void 0 ? void 0 : _f.items.forEach(function (item) { return dojo.addClass(playerTable.companionSpellStock.container_div.id + "_item_" + item.id, 'selectable'); });
    };
    Glow.prototype.setTomDice = function (dice) {
        var _this = this;
        dice.forEach(function (die) { return _this.createOrMoveDie(__assign(__assign({}, die), { id: 1000 + die.id }), "tomDiceWrapper"); });
    };
    Glow.prototype.getRollDiceCostStr = function (typeIndex, cost) {
        if (cost < 1) {
            return null;
        }
        switch (typeIndex) {
            case 0:
                return (cost > 1 ? cost + " " : '') + "Lumipili";
            case 1:
                return formatTextIcons("-" + cost + " [reroll]");
            case 2:
                var playerArgs = this.gamedatas.gamestate.args[this.getPlayerId()];
                return formatTextIcons("-" + playerArgs.rerollScore[cost] + " [point] ");
        }
    };
    Glow.prototype.onSelectedDiceChange = function () {
        var _this = this;
        var count = this.selectedDice.length;
        this.getRollDiceButtons().forEach(function (button) { return dojo.toggleClass(button, 'disabled', count < 1 || count > 2); });
        if (this.isChangeDie) {
            if (count === 1) {
                this.selectedDieFace = null;
                var die = this.selectedDice[0];
                var cancel = document.getElementById("cancelRollDice-button");
                cancel === null || cancel === void 0 ? void 0 : cancel.parentElement.removeChild(cancel);
                var faces = die.color <= 5 ? 5 : 6;
                var facesButtons = document.getElementById('change-die-faces-buttons');
                var _loop_5 = function (i) {
                    var html = "<div class=\"die-item color" + die.color + " side" + i + "\"></div>";
                    this_3.addActionButton("changeDie" + i + "-button", html, function () {
                        if (_this.selectedDieFace !== null) {
                            dojo.removeClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_blue');
                            dojo.addClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_gray');
                        }
                        else {
                            var changeDieButtons = _this.getChangeDieButtons();
                            changeDieButtons.forEach(function (elem) { return dojo.removeClass(elem, 'disabled'); });
                        }
                        _this.selectedDieFace = i;
                        dojo.removeClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_gray');
                        dojo.addClass("changeDie" + _this.selectedDieFace + "-button", 'bgabutton_blue');
                    }, null, null, 'gray');
                    facesButtons.appendChild(document.getElementById("changeDie" + i + "-button"));
                };
                var this_3 = this;
                for (var i = 1; i <= faces; i++) {
                    _loop_5(i);
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
        if (force === void 0) { force = null; }
        if (!this.diceSelectionActive && !force) {
            return;
        }
        var index = this.selectedDice.findIndex(function (d) { return d.id === die.id; });
        var selected = force !== null ? !force : index !== -1;
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
        this.selectedDice.forEach(function (die) { return _this.onDiceClick(die, false); });
    };
    Glow.prototype.setDiceSelectionActive = function (active) {
        this.unselectDice();
        this.diceSelectionActive = active;
        Array.from(document.getElementsByClassName('die')).forEach(function (node) { return dojo.toggleClass(node, 'selectable', active); });
    };
    Glow.prototype.diceChangedOrRolled = function (dice, changed, args) {
        var _this = this;
        this.unselectDice();
        dice.forEach(function (die) {
            dojo.removeClass("die" + die.id, 'selected');
            _this.setNewFace(die);
            _this.addRollToDiv(_this.getDieDiv(die), changed ? 'change' : (Math.random() > 0.5 ? 'odd' : 'even'));
        });
        if (args) {
            this.gamedatas.gamestate.args[this.getPlayerId()] = args[this.getPlayerId()];
            if (this.isCurrentPlayerActive()) {
                this.setActionBarRollDice(true);
            }
        }
    };
    Glow.prototype.selectMove = function (possibleDestination) {
        var _a, _b, _c;
        var mustDiscard = possibleDestination.costForPlayer.some(function (cost) { return cost == 37; });
        if (mustDiscard) {
            var playerTable = this.getPlayerTable(this.getPlayerId());
            mustDiscard = !!(((_a = playerTable.companionsStock) === null || _a === void 0 ? void 0 : _a.items.length) ||
                ((_b = playerTable.spellsStock) === null || _b === void 0 ? void 0 : _b.items.length) ||
                ((_c = playerTable.companionSpellStock) === null || _c === void 0 ? void 0 : _c.items.length));
        }
        if (mustDiscard) {
            this.selectedRoute = possibleDestination;
            this.setActionBarMoveDiscardCampanionOrSpell();
        }
        else {
            this.move(possibleDestination.destination, possibleDestination.from);
        }
    };
    Glow.prototype.cardClick = function (type, id) {
        if (this.gamedatas.gamestate.name === 'resolveCards') {
            this.resolveCard(type, id);
        }
        else if (this.gamedatas.gamestate.name === 'move') {
            this.move(this.selectedRoute.destination, this.selectedRoute.from, type, id);
        }
        else {
            console.error('No card action in the state');
        }
    };
    Glow.prototype.rollDice = function (cost) {
        if (!this.checkAction('rollDice')) {
            return;
        }
        this.takeAction('rollDice', {
            ids: this.selectedDice.map(function (die) { return die.id; }).join(','),
            cost: cost.join(','),
        });
    };
    Glow.prototype.changeDie = function (cost) {
        if (!this.checkAction('changeDie')) {
            return;
        }
        this.takeAction('changeDie', {
            id: this.selectedDice[0].id,
            value: this.selectedDieFace,
            cost: cost.join(','),
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
    Glow.prototype.chooseTomDice = function () {
        if (!this.checkAction('chooseTomDice')) {
            return;
        }
        this.takeAction('chooseTomDice', {
            dice: this.selectedDice.map(function (die) { return die.id; }).join(',')
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
    Glow.prototype.moveBlackDie = function (spot) {
        if (!this.checkAction('moveBlackDie')) {
            return;
        }
        this.takeAction('moveBlackDie', {
            spot: spot
        });
    };
    Glow.prototype.keepDice = function () {
        if (!this.checkAction('keepDice')) {
            return;
        }
        this.takeAction('keepDice');
    };
    Glow.prototype.resurrect = function (id) {
        if (!this.checkAction('resurrect')) {
            return;
        }
        this.takeAction('resurrect', {
            id: id
        });
    };
    Glow.prototype.skipResurrect = function () {
        if (!this.checkAction('skipResurrect')) {
            return;
        }
        this.takeAction('skipResurrect');
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
    Glow.prototype.resolveAll = function () {
        if (!this.checkAction('resolveAll')) {
            return;
        }
        this.takeAction('resolveAll');
    };
    Glow.prototype.move = function (destination, from, type, id) {
        if (!this.checkAction('move')) {
            return;
        }
        this.takeAction('move', {
            destination: destination,
            from: from,
            type: type,
            id: id,
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
    Glow.prototype.setPoints = function (playerId, points) {
        var _a;
        (_a = this.scoreCtrl[playerId]) === null || _a === void 0 ? void 0 : _a.toValue(points);
        this.board.setPoints(playerId, points);
    };
    Glow.prototype.incRerolls = function (playerId, footprints) {
        var _a, _b;
        (_a = this.rerollCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(footprints);
        this.getPlayerTable(playerId).setTokens('reroll', (_b = this.rerollCounters[playerId]) === null || _b === void 0 ? void 0 : _b.getValue());
    };
    Glow.prototype.incFootprints = function (playerId, footprints) {
        var _a, _b;
        (_a = this.footprintCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(footprints);
        this.getPlayerTable(playerId).setTokens('footprint', (_b = this.footprintCounters[playerId]) === null || _b === void 0 ? void 0 : _b.getValue());
    };
    Glow.prototype.incFireflies = function (playerId, fireflies) {
        var _a, _b;
        (_a = this.fireflyCounters[playerId]) === null || _a === void 0 ? void 0 : _a.incValue(fireflies);
        this.updateFireflyCounterIcon(playerId);
        this.getPlayerTable(playerId).setTokens('firefly', (_b = this.fireflyCounters[playerId]) === null || _b === void 0 ? void 0 : _b.getValue());
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
            var html = "<div id=\"help-popin\">\n                <h1>" + _("Specific companions") + "</h1>\n                <div id=\"help-companions\" class=\"help-section\">\n                    <h2>" + _('The Sketals') + "</h2>\n                    <table><tr>\n                    <td><div id=\"companion44\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(44) + "</td>\n                    </tr></table>\n                    <h2>Xar\u2019gok</h2>\n                    <table><tr>\n                        <td><div id=\"companion10\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(10) + "</td>\n                    </tr></table>\n                    <h2>" + _('Kaar and the curse of the black die') + "</h2>\n                    <table><tr>\n                        <td><div id=\"companion20\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(20) + "</td>\n                    </tr></table>\n                    <h2>Cromaug</h2>\n                    <table><tr>\n                        <td><div id=\"companion41\" class=\"companion\"></div></td>\n                        <td>" + getCompanionTooltip(41) + "</td>\n                    </tr></table>\n                </div>\n            </div>";
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
        notifs.forEach(function (notif) {
            dojo.subscribe(notif[0], _this, "notif_" + notif[0]);
            _this.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    };
    Glow.prototype.notif_chosenAdventurer = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setAdventurer(notif.args.adventurer);
        playerTable.addDice(notif.args.dice);
        var newPlayerColor = notif.args.newPlayerColor;
        var nameLink = document.getElementById("player_name_" + notif.args.playerId).getElementsByTagName('a')[0];
        if (nameLink) {
            nameLink.style.color = "#" + newPlayerColor;
        }
        /*const colorBlindToken = document.getElementById(`player-board-${notif.args.playerId}-color-blind-token`);
        if (colorBlindToken) {
            colorBlindToken.style.color = `#${newPlayerColor}`;
        };*/
        this.board.setColor(notif.args.playerId, newPlayerColor);
        playerTable.setColor(newPlayerColor);
    };
    Glow.prototype.notif_chosenCompanion = function (notif) {
        var _a, _b;
        var companion = notif.args.companion;
        var spot = notif.args.spot;
        var playerId = notif.args.playerId;
        var playerTable = this.getPlayerTable(playerId);
        var originStock = spot ? this.meetingTrack.getStock(notif.args.spot) : this.cemetaryCompanionsStock;
        playerTable.addCompanion(companion, originStock);
        if ((_a = notif.args.dice) === null || _a === void 0 ? void 0 : _a.length) {
            playerTable.addDice(notif.args.dice);
        }
        if (spot) {
            this.meetingTrack.clearFootprintTokens(spot, notif.args.playerId);
        }
        if (notif.args.cemetaryTop) {
            this.meetingTrack.setDeckTop(CEMETERY, (_b = notif.args.cemetaryTop) === null || _b === void 0 ? void 0 : _b.type);
        }
        if (companion === null || companion === void 0 ? void 0 : companion.fireflies) {
            this.fireflyCounters[playerId].incValue(companion.fireflies);
        }
        this.companionCounters[playerId].incValue(1);
        this.updateFireflyCounterIcon(playerId);
    };
    Glow.prototype.notif_removeCompanion = function (notif) {
        var _a;
        var companion = notif.args.companion;
        if (notif.args.spot) {
            this.meetingTrack.removeCompanion(notif.args.spot);
        }
        else {
            var playerId = notif.args.playerId;
            var playerTable = this.getPlayerTable(playerId);
            playerTable.removeCompanion(companion, notif.args.removedBySpell);
            if (companion === null || companion === void 0 ? void 0 : companion.fireflies) {
                this.fireflyCounters[playerId].incValue(-companion.fireflies);
            }
            this.companionCounters[playerId].incValue(-1);
            this.updateFireflyCounterIcon(playerId);
        }
        this.meetingTrack.setDeckTop(CEMETERY, (_a = notif.args.companion) === null || _a === void 0 ? void 0 : _a.type);
    };
    Glow.prototype.notif_removeCompanions = function (notif) {
        this.meetingTrack.removeCompanions();
        this.meetingTrack.setDeckTop(CEMETERY, notif.args.topCemeteryType);
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
        this.setPoints(notif.args.playerId, notif.args.newScore);
        if (notif.args.company !== undefined) {
            this.board.setTomCompany(notif.args.company);
        }
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
        dojo.place("<div id=\"new-day\"><span>" + notif.log.replace('${day}', '' + notif.args.day) + "</span></div>", document.body);
        var div = document.getElementById("new-day");
        div.addEventListener('animationend', function () { return dojo.destroy(div); });
        div.classList.add('new-day-animation');
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
        this.onEnteringStateResolveCards(notif.args.resolveCardsForPlayer);
    };
    Glow.prototype.notif_usedDice = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setUsedDie(notif.args.dieId);
    };
    Glow.prototype.notif_moveUpdate = function (notif) {
        this.moveArgs = notif.args.args;
        this.setActionBarMove(true);
    };
    Glow.prototype.notif_meepleMoved = function (notif) {
        this.board.moveMeeple(notif.args.meeple);
    };
    Glow.prototype.notif_moveBlackDie = function (notif) {
        this.meetingTrack.placeSmallDice([notif.args.die]);
    };
    Glow.prototype.notif_giveHiddenSpells = function (notif) {
        var _this = this;
        Object.keys(notif.args.spellsIds).forEach(function (playerId) {
            var playerTable = _this.getPlayerTable(Number(playerId));
            playerTable.addHiddenSpell(notif.args.spellsIds[Number(playerId)], notif.args.playerId);
        });
    };
    Glow.prototype.notif_footprintAdded = function (notif) {
        this.meetingTrack.setFootprintTokens(notif.args.spot, notif.args.number);
    };
    Glow.prototype.notif_revealSpells = function (notif) {
        var _this = this;
        notif.args.spells.forEach(function (spell) {
            var playerTable = _this.getPlayerTable(Number(spell.location_arg));
            playerTable.revealSpell(spell);
        });
    };
    Glow.prototype.notif_removeSpell = function (notif) {
        var playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.removeSpell(notif.args.spell);
    };
    Glow.prototype.notif_setTomDice = function (notif) {
        this.setTomDice(notif.args.dice);
    };
    Glow.prototype.notif_updateSoloTiles = function (notif) {
        this.meetingTrack.updateSoloTiles(notif.args);
    };
    Glow.prototype.notif_setTableDice = function (notif) {
        var _this = this;
        notif.args.dice.forEach(function (die) {
            return _this.createOrMoveDie(die, "table-dice");
        });
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
        var _a, _b, _c, _d;
        try {
            if (log && args && !args.processed) {
                if (typeof args.adventurerName == 'string' && args.adventurerName[0] != '<') {
                    args.adventurerName = "<strong style=\"color: " + this.getColor((_a = args.adventurer) === null || _a === void 0 ? void 0 : _a.color) + ";\">" + args.adventurerName + "</strong>";
                }
                if (typeof args.companionName == 'string' && args.companionName[0] != '<') {
                    args.companionName = "<strong>" + args.companionName + "</strong>";
                }
                if (typeof args.effectOrigin == 'string' && args.effectOrigin[0] != '<') {
                    if (args.adventurer) {
                        args.effectOrigin = "<strong style=\"color: " + this.getColor((_b = args.adventurer) === null || _b === void 0 ? void 0 : _b.color) + ";\">" + args.adventurer.name + "</strong>";
                    }
                    if (args.companion) {
                        args.effectOrigin = "<strong>" + args.companion.name + "</strong>";
                    }
                }
                for (var property in args) {
                    if (((_d = (_c = args[property]) === null || _c === void 0 ? void 0 : _c.indexOf) === null || _d === void 0 ? void 0 : _d.call(_c, ']')) > 0) {
                        args[property] = formatTextIcons(_(args[property]));
                    }
                }
                log = formatTextIcons(_(log));
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
