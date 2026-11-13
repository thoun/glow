const POINT_CASE_SIZE = 25.5;
const BOARD_POINTS_MARGIN = 38;
const HIDDEN_TOKENS_DELAY = 2000;
const MAP1 = [
    [36, 396, 1], // 0
    [157, 382], // 1
    [204, 360], // 2
    [267, 376], // 3
    [332, 358], // 4
    [383, 388, 1], // 5
    [530, 393], // 6
    [596, 373], // 7
    [654, 341], // 8
    [771, 315], // 9
    [817, 269], // 10
    [741, 134], // 11
    [710, 44], // 12
    [766, 39], // 13
    [786, 78, 1], // 14
    [695, 164], // 15
    [720, 257], // 16
    [572, 250, 1], // 17
    [657, 201], // 18
    [615, 157], // 19
    [651, 124], // 20
    [666, 88], // 21
    [646, 37], // 22
    [561, 36], // 23
    [538, 77], // 24
    [584, 94], // 25
    [523, 133], // 26
    [529, 197], // 27
    [474, 132], // 28
    [404, 150], // 29
    [410, 201], // 30
    [467, 218], // 31
    [566, 312], // 32
    [436, 292, 1], // 33
    [380, 250], // 34
    [314, 230], // 35
    [346, 200], // 36
    [336, 155], // 37
    [222, 115, 1], // 38
    [373, 105], // 39
    [159, 40], // 40
    [289, 44], // 41
    [348, 38], // 42
    [419, 62, 1], // 43
    [78, 367], // 44
    [124, 353], // 45
    [150, 317], // 46
    [201, 313], // 47
    [227, 278], // 48
    [275, 292], // 49
    [316, 275], // 50
    [361, 304], // 51
    [227, 209], // 52
    [102, 43], // 53
    [77, 77], // 54
    [42, 105], // 55
    [70, 179], // 56
    [130, 198], // 57
    [176, 255], // 58
    [37, 233, 1], // 59
    [74, 319], // 60
];
const MAP2 = [
    [416, 204, 1], // 0
    [635, 200, 1], // 1
    [760, 132, 1], // 2
    [564, 299, 1], // 3
    [762, 355, 1], // 4
    [393, 383, 1], // 5
    [252, 300, 1], // 6
    [58, 352, 1], // 7
    [139, 196, 1], // 8
    [69, 66, 1], // 9
    [286, 69, 1], // 10
    [504, 55, 1], // 11
];
const MAPS = [null, MAP1, MAP2];
const MAP1_POINT = [
    [418, 406, 5], // 5
    [819, 98, 20], // 14
    [605, 269, 12], // 17
    [469, 312, 8], // 33
    [257, 134, 10], // 38
    [455, 79, 15], // 43
    [69, 254, 3], // 59
];
const MAP2_POINT = [
    [795, 373, 5], // 4
    [428, 402, 4], // 5
    [285, 318, 2], // 6
    [84, 369, 2], // 7
    [104, 85, 8], // 9
    [539, 72, 3], // 11
];
const MAPS_POINT = [null, MAP1_POINT, MAP2_POINT];
class Board {
    constructor(game, players, tableDice, solo) {
        this.game = game;
        this.players = players;
        this.points = new Map();
        this.meeples = [];
        let html = '';
        if (solo && this.game.getBoardSide() == 2) {
            html += `<div id="token-solo-board"></div>`;
        }
        // score contrast
        MAPS_POINT[game.getBoardSide()].forEach(point => document.getElementById('board').insertAdjacentHTML('beforeend', `<div class="score-contrast score-contrast-map" style="left: ${point[0]}px; top: ${point[1]}px;">${point[2]}</div>`));
        // points
        players.forEach(player => html += `<div id="player-${player.id}-point-marker" class="point-marker ${this.game.isColorBlindMode() ? 'color-blind' : ''}" data-player-no="${player.playerNo}" style="background: #${player.color};"></div>`);
        document.getElementById('board').insertAdjacentHTML('beforeend', html);
        players.forEach(player => {
            this.points.set(Number(player.id), Number(player.score));
            this.meeples.push(...player.meeples);
            if (Number(player.id) == 0) { // tom
                const coordinates = this.getPointsCoordinates(player.company);
                const left = coordinates[0];
                const top = coordinates[1];
                const transform = `translateX(${left}px) translateY(${top}px)`;
                document.getElementById('board').insertAdjacentHTML('beforeend', `<div id="meeple0" class="token meeple1 ${this.game.isColorBlindMode() ? 'color-blind' : ''} meeple-player-0" style="background-color: #${player.color}; transform: ${transform}"></div>`);
            }
        });
        this.movePoints();
        players.forEach(player => this.placeMeeples(player));
        tableDice.forEach(die => this.game.createOrMoveDie(die, 'table-dice'));
        document.getElementById('table-dice').addEventListener('click', event => {
            if (!this.game.gamedatas.gamestate.name.startsWith('selectSketalDie')) {
                return;
            }
            const target = event.target;
            if (!target || !target.classList.contains('die')) {
                return;
            }
            this.game.selectSketalDie(Number(target.dataset.dieId));
        });
        const boardDiv = document.getElementById('board');
        boardDiv.addEventListener('click', event => this.hideTokens(boardDiv, event));
        boardDiv.addEventListener('mousemove', event => {
            if (!this.tokensOpacityTimeout) {
                this.hideTokens(boardDiv, event);
            }
        });
        boardDiv.addEventListener('mouseleave', () => {
            if (this.tokensOpacityTimeout) {
                clearTimeout(this.tokensOpacityTimeout);
                document.getElementById('board').classList.remove('hidden-tokens');
                document.getElementById('board').classList.remove('hidden-meeples');
                this.tokensOpacityTimeout = null;
            }
        });
    }
    hideTokens(boardDiv, event) {
        const x = event.offsetX;
        const y = event.offsetY;
        //if (x < BOARD_POINTS_MARGIN || y < BOARD_POINTS_MARGIN || x > boardDiv.clientWidth - BOARD_POINTS_MARGIN || y > boardDiv.clientHeight - BOARD_POINTS_MARGIN) {
        document.getElementById('board').classList.add('hidden-tokens');
        document.getElementById('board').classList.add('hidden-meeples');
        if (this.tokensOpacityTimeout) {
            clearTimeout(this.tokensOpacityTimeout);
        }
        this.tokensOpacityTimeout = setTimeout(() => {
            document.getElementById('board').classList.remove('hidden-tokens');
            document.getElementById('board').classList.remove('hidden-meeples');
            this.tokensOpacityTimeout = null;
        }, HIDDEN_TOKENS_DELAY);
        //}
    }
    setPoints(playerId, points) {
        this.points.set(playerId, points);
        this.movePoints();
    }
    setTomCompany(company) {
        const coordinates = this.getPointsCoordinates(company);
        const left = coordinates[0];
        const top = coordinates[1];
        document.getElementById(`meeple0`).style.transform = `translateX(${left}px) translateY(${top}px)`;
    }
    getPointsCoordinates(points) {
        const pointsModulo = points % 100;
        const cases = pointsModulo === 10 ? 11 :
            (pointsModulo > 10 ? pointsModulo + 2 : pointsModulo);
        const top = cases < 86 ? Math.min(Math.max(cases - 34, 0), 17) * POINT_CASE_SIZE : (102 - cases) * POINT_CASE_SIZE;
        const left = cases < 52 ? Math.min(cases, 34) * POINT_CASE_SIZE : Math.max((33 - Math.max(cases - 52, 0)) * POINT_CASE_SIZE, 0);
        return [17 + left, 15 + top];
    }
    movePoints() {
        this.points.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-point-marker`);
            const coordinates = this.getPointsCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
            let topShift = 0;
            let leftShift = 0;
            this.points.forEach((iPoints, iPlayerId) => {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    leftShift += 5;
                }
            });
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }
    placeMeeples(player) {
        player.meeples.forEach(meeple => this.placeMeeple(meeple, player.color));
    }
    getMapSpot(spot) {
        return MAPS[this.game.getBoardSide()][spot];
    }
    placeMeeple(meeple, color) {
        const mapSpot = this.getMapSpot(meeple.position);
        const x = mapSpot[0];
        const y = mapSpot[1];
        let shift = 0;
        let transform = '';
        if (meeple.type > 0) {
            shift = this.meeples.filter(m => m.type === meeple.type && (m.playerId < meeple.playerId || (m.playerId === meeple.playerId && m.id < meeple.id))).length;
            transform = `translate(${x + shift * 5 + (meeple.type === 2 ? 50 : 0)}px, ${y + shift * 5}px)`;
        }
        else {
            shift = this.meeples.filter(m => m.type === meeple.type && m.playerId === meeple.playerId && m.id < meeple.id).length;
            const playerIndex = this.players.findIndex(player => Number(player.id) == meeple.playerId);
            transform = `translate(${x + shift * 5 + (playerIndex * 30 - 8 * (this.players.length - 1))}px, ${y + shift * 5 + 10}px)`;
        }
        const div = document.getElementById(`meeple${meeple.id}`);
        if (div) {
            div.style.transform = transform;
        }
        else {
            document.getElementById('board').insertAdjacentHTML('beforeend', `<div id="meeple${meeple.id}" class="token meeple${meeple.type} ${this.game.isColorBlindMode() ? 'color-blind' : ''} meeple-player-${meeple.playerId}" data-player-no="${this.players.find(p => Number(p.id) == meeple.playerId).playerNo}" style="background-color: #${color}; transform: ${transform}"></div>`);
        }
    }
    moveMeeple(meeple) {
        this.meeples.find(m => m.id = meeple.id).position = meeple.position;
        this.placeMeeple(meeple);
    }
    createDestinationZones(possibleDestinations) {
        Array.from(document.getElementsByClassName('destination-zone')).forEach(node => node.parentElement.removeChild(node));
        Array.from(document.getElementsByClassName('destination-arrow')).forEach(node => node.parentElement.removeChild(node));
        possibleDestinations?.forEach(possibleDestination => {
            const position = possibleDestination.destination;
            const mapSpot = this.getMapSpot(position);
            const big = mapSpot.length > 2;
            if (!document.getElementById(`destination-zone-${position}`)) {
                document.getElementById('board').insertAdjacentHTML('beforeend', `<div id="destination-zone-${position}" class="destination-zone ${mapSpot[2] ? 'big' : 'small'}" style="left: ${mapSpot[0]}px; top: ${mapSpot[1]}px;"></div>`);
            }
            const from = possibleDestination.from;
            const mapSpotFrom = this.getMapSpot(from);
            const deltaX = mapSpot[0] - mapSpotFrom[0];
            const deltaY = mapSpot[1] - mapSpotFrom[1];
            const rad = Math.atan2(deltaY, deltaX); // In radians
            let left = (mapSpot[0] + mapSpotFrom[0]) / 2;
            let top = (mapSpot[1] + mapSpotFrom[1]) / 2;
            if (!big) {
                left -= 25;
            }
            const onlyOneDestinationToSpot = possibleDestinations.filter(pd => pd.destination === possibleDestination.destination).length <= 1;
            if (!document.getElementById(`destination-arrow-${position}-from-${from}`)) {
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const scaleX = Math.min(1, distance / 180);
                const scaleY = Math.min(1, distance / 100);
                document.getElementById('board').insertAdjacentHTML('beforeend', `<div id="destination-arrow-${position}-from-${from}" class="destination-arrow" style="left: ${left}px; top: ${top}px; transform: rotate(${rad}rad) scaleX(${scaleX}) scaleY(${scaleY})"></div>`);
                document.getElementById(`destination-arrow-${position}-from-${from}`).addEventListener('click', () => this.game.selectMove(possibleDestination));
                const footprintsCost = possibleDestination.costForPlayer.filter(cost => cost > -30 && cost < -20).map(cost => (-cost) - 20).reduce((a, b) => a + b, 0);
                for (let i = 0; i < footprintsCost; i++) {
                    document.getElementById(`destination-arrow-${position}-from-${from}`).insertAdjacentHTML('beforeend', `<div class="footprint round-token" style="position: absolute; left: ${i * 10}px; top: ${i * 10}px; transform: scaleX(${(1 / scaleX) / 1.8}) scaleY(${(1 / scaleY) / 1.8})"></div>`);
                }
            }
            if (onlyOneDestinationToSpot) {
                document.getElementById(`destination-zone-${position}`).addEventListener('click', () => this.game.selectMove(possibleDestination));
            }
            document.getElementById(`destination-zone-${position}`).classList.toggle('unselectable', !onlyOneDestinationToSpot);
        });
    }
    setColor(playerId, newPlayerColor) {
        document.getElementById(`player-${playerId}-point-marker`).style.background = `#${newPlayerColor}`;
        Array.from(document.getElementsByClassName(`meeple-player-${playerId}`)).forEach(elem => elem.style.background = `#${newPlayerColor}`);
    }
}

const BgaAnimations = await globalThis.importEsmLib('bga-animations', '1.x');
const BgaCards = await globalThis.importEsmLib('bga-cards', '1.x');
const [LegacyStock, LegacyCounter, LegacyPopinDialog, legacyDojo] = await globalThis.importDojoLibs([
    'ebg/stock', 'ebg/counter', 'ebg/popindialog', 'dojo',
]);

function formatTextIcons(rawText) {
    return rawText
        .replace(/\[reroll\]/ig, '<span class="icon reroll"></span>')
        .replace(/\[point\]/ig, '<span class="icon point"></span>')
        .replace(/\[symbol(\d)\]/ig, '<span class="icon symbol$1"></span>')
        .replace(/\[die:(\d+):(\d)\]/ig, '<span class="die-icon" data-color="$1" data-face="$2"></span>');
}

function formatTooltipText(template, values) {
    return template.replace(/\$\{([^\s:}]+)\}/g, (_, key) => values[key].toString());
}
const CARD_WIDTH = 129;
const CARD_HEIGHT = 240;
const SOLO_CARD_HEIGHT = 36;
const SPELL_DIAMETER = 64;
const CEMETERY = 'cemetery';
const DECK = 'deck';
const DECKB = 'deckB';
const SOLO_TILES = 'solo-tiles';
const ADVENTURERS_POINTS = [];
ADVENTURERS_POINTS[1] = 1;
ADVENTURERS_POINTS[3] = 4;
ADVENTURERS_POINTS[4] = 4;
ADVENTURERS_POINTS[5] = 3;
ADVENTURERS_POINTS[9] = 4;
const COMPANION_POINTS = [];
COMPANION_POINTS[10] = -1;
COMPANION_POINTS[11] = 6;
COMPANION_POINTS[12] = 5;
COMPANION_POINTS[13] = 1;
COMPANION_POINTS[14] = 1;
COMPANION_POINTS[16] = 1;
COMPANION_POINTS[17] = 1;
COMPANION_POINTS[20] = 4;
COMPANION_POINTS[21] = -2;
COMPANION_POINTS[22] = -5;
COMPANION_POINTS[23] = -2;
COMPANION_POINTS[24] = 4;
COMPANION_POINTS[27] = 2;
COMPANION_POINTS[28] = 2;
COMPANION_POINTS[29] = 2;
COMPANION_POINTS[30] = 5;
COMPANION_POINTS[32] = 1;
COMPANION_POINTS[34] = 4;
COMPANION_POINTS[35] = 3;
COMPANION_POINTS[36] = 3;
COMPANION_POINTS[38] = 3;
COMPANION_POINTS[39] = 2;
COMPANION_POINTS[40] = 2;
COMPANION_POINTS[41] = -1;
COMPANION_POINTS[42] = 5;
COMPANION_POINTS[43] = 5;
COMPANION_POINTS[44] = 2;
COMPANION_POINTS[45] = 1;
COMPANION_POINTS[46] = 4;
COMPANION_POINTS[102] = 2;
COMPANION_POINTS[103] = 2;
COMPANION_POINTS[106] = 1;
COMPANION_POINTS[108] = 4;
COMPANION_POINTS[201] = -2;
COMPANION_POINTS[203] = -1;
COMPANION_POINTS[204] = 1;
COMPANION_POINTS[205] = 4;
COMPANION_POINTS[207] = 2;
COMPANION_POINTS[208] = 1;
COMPANION_POINTS[301] = -4;
COMPANION_POINTS[303] = 9;
COMPANION_POINTS[304] = 2;
COMPANION_POINTS[306] = 1;
COMPANION_POINTS[308] = 2;
function setupAdventurersCards(adventurerStock) {
    const cardsurl = `${g_gamethemeurl}img/adventurers.png`;
    const cardsurlExpansion = `${g_gamethemeurl}img/adventurers-expansion1.png`;
    for (let i = 0; i <= 10; i++) {
        const expansion1 = i > 7;
        adventurerStock.addItemType(i, i, expansion1 ? cardsurlExpansion : cardsurl, expansion1 ? i - 8 : i);
    }
}
function setupCompanionCards(companionsStock) {
    companionsStock.image_items_per_row = 10;
    const cardsurl = `${g_gamethemeurl}img/companions.png`;
    for (let subType = 1; subType <= 46; subType++) {
        companionsStock.addItemType(subType, 0, cardsurl, subType + (subType > 23 ? 1 : 0));
    }
    for (let module = 1; module <= 3; module++) {
        const cardsurl = `${g_gamethemeurl}img/companions-expansion1-set${module}.png`;
        for (let subType = 1; subType <= 8; subType++) {
            companionsStock.addItemType(module * 100 + subType, 0, cardsurl, subType - 1);
        }
    }
    companionsStock.addItemType(1001, 0, cardsurl, 0);
    companionsStock.addItemType(1002, 0, cardsurl, 24);
}
function setupSpellCards(spellsStock) {
    const cardsurl = `${g_gamethemeurl}img/spells.png`;
    for (let type = 1; type <= 10; type++) {
        spellsStock.addItemType(type, type, cardsurl, type);
    }
    spellsStock.addItemType(0, 0, cardsurl, 0);
}
function setupSoloTileCards(soloTilesStock) {
    const cardsurl = `${g_gamethemeurl}img/solo-tiles.png`;
    for (let type = 1; type <= 8; type++) {
        soloTilesStock.addItemType(type, type, cardsurl, type);
    }
    soloTilesStock.addItemType(0, 0, cardsurl, 0);
}
function getEffectExplanation(effect) {
    if (effect > 100 && effect < 200) {
        return formatTooltipText(_("Earn ${points} burst(s) of light."), { points: `<strong>${effect - 100}</strong>` });
    }
    else if (effect < -100 && effect > -200) {
        return formatTooltipText(_("Lose ${points} burst(s) of light."), { points: `<strong>${-(effect + 100)}</strong>` });
    }
    else if (effect > 20 && effect < 30) {
        return formatTooltipText(_("Earn ${footprints} footprint(s)."), { footprints: `<strong>${effect - 20}</strong>` });
    }
    else if (effect < -20 && effect > -30) {
        return formatTooltipText(_("Lose ${footprints} footprint(s)."), { footprints: `<strong>${-(effect + 20)}</strong>` });
    }
    else if (effect > 10 && effect < 20) {
        return formatTooltipText(_("Earn ${fireflies} firefly(ies)."), { fireflies: `<strong>${effect - 10}</strong>` });
    }
    else if (effect < -10 && effect > -20) {
        return formatTooltipText(_("Lose ${fireflies} firefly(ies)."), { fireflies: `<strong>${-(effect + 10)}</strong>` });
    }
    else if (effect > 40 && effect < 50) {
        return formatTooltipText(_("Earn ${rerolls} reroll token(s)."), { rerolls: `<strong>${effect - 40}</strong>` });
    }
    else if (effect < -40 && effect > -50) {
        return formatTooltipText(_("Lose ${rerolls} reroll token(s)."), { rerolls: `<strong>${-(effect + 40)}</strong>` });
    }
    else if (effect > 60 && effect < 70) {
        return formatTooltipText(_("Draw ${tokens} butterfly token(s) then returns the same number of your butterfly tokens."), { tokens: `<strong>${effect - 60}</strong>` });
    }
    else if (effect > 50 && effect < 60) {
        return formatTooltipText(_("Draw ${tokens} butterfly token(s)."), { tokens: `<strong>${effect - 50}</strong>` });
    }
    else if (effect < -50 && effect > -60) {
        return formatTooltipText(_("Lose ${tokens} butterfly token(s)."), { tokens: `<strong>${-(effect + 50)}</strong>` });
    }
    else if (effect === 33) {
        return _("The companion is immediately placed in the cemetery.");
    }
    else if (effect === 37) {
        return _("Send one of your companions to the cemetery, without applying any effect, or cancel the spell if you possess one.");
    }
}
function getEffectTooltip(effect) {
    if (!effect) {
        return null;
    }
    const effectConditions = effect.conditions.filter(condition => condition > -10);
    const remainingConditions = effect.conditions.filter(condition => condition <= -10);
    let conditions = null;
    if (effectConditions.every(condition => condition > 200) && effectConditions.length == 2) {
        const message = effectConditions[0] == effectConditions[1] ?
            _("Exactly ${min} different element symbols on dice triggers the effect.") :
            _("Between ${min} and ${max} different element symbols on dice triggers the effect.");
        conditions = formatTooltipText(message, {
            min: `<strong>${effectConditions[0] - 200}</strong>`,
            max: `<strong>${effectConditions[1] - 200}</strong>`,
        });
    }
    else if (effectConditions.every(condition => condition > 0)) {
        conditions = formatTooltipText(_("${symbols} triggers the effect."), {
            symbols: formatTextIcons(effectConditions.map(condition => `[symbol${condition}]`).join(''))
        });
    }
    else if (effectConditions.every(condition => condition == 0)) {
        conditions = formatTooltipText(formatTextIcons(effectConditions.map(_ => `[symbol0]`).join('')) + ' : ' + _("any ${number} identical symbols."), {
            number: `<strong>${effectConditions.length}</strong>`
        });
    }
    else if (effectConditions.every(condition => condition < 0)) {
        conditions = formatTooltipText(_("If the symbols ${symbols} are not present on any of the dice, the effect is triggered."), {
            symbols: formatTextIcons(effectConditions.map(condition => `[symbol${-condition}]`).join(''))
        });
    }
    else if (effectConditions.some(condition => condition > 0) && effectConditions.some(condition => condition < 0)) {
        conditions = formatTooltipText(_("If the symbols ${forbiddenSymbols} are not present on any of the dice, ${symbols} triggers the effect."), {
            forbiddenSymbols: formatTextIcons(effectConditions.filter(condition => condition < 0).map(condition => `[symbol${-condition}]`).join('')),
            symbols: formatTextIcons(effectConditions.filter(condition => condition > 0).map(condition => `[symbol${condition}]`).join('')),
        });
    }
    remainingConditions.forEach(effect => conditions += `<br>${getEffectExplanation(effect)}`);
    return `
    <div class="tooltip-effect-title">${_("Conditions")}</div>
    ${conditions}
    <hr>
    <div class="tooltip-effect-title">${_("Effects")}</div>
    ${effect.effects.map(effect => getEffectExplanation(effect)).join('<br>')}
    `;
}
function getAdventurerTooltip(type) {
    switch (type) {
        //case 11: return `<p>${_(`Uriom has 2 special small yellow dice that are available only for Uriom`)}</p>`; // TODO
    }
    return null;
}
function setupAdventurerCard(game, cardDiv, type) {
    const adventurer = game.gamedatas.ADVENTURERS[type];
    const tooltip = getEffectTooltip(adventurer.effect);
    const adventurerTooltip = getAdventurerTooltip(type);
    game.bga.gameui.addTooltipHtml(cardDiv.id, `<h3>${adventurer.name}</h3>${tooltip || ''}${tooltip && adventurerTooltip ? '<hr>' : ''}${adventurerTooltip || ''}`);
    const adventurerPoints = ADVENTURERS_POINTS[type];
    if (adventurerPoints) {
        cardDiv.insertAdjacentHTML('beforeend', `<div class="score-contrast">${adventurerPoints}</div>`);
    }
}
function getCompanionTooltip(type) {
    switch (type) {
        case 13:
        case 14:
        case 15:
        case 16:
        case 17:
        case 44: return `<p>` + _(`If the player chooses a Sketal, they immediately take an additional large die from the reserve pool in the color indicated by its power. The Sketal, whose power is a multicolored die, allows the player to take a large die of their choice from those available in the reserve pool. If there are none, it has no effect. If the player forgets to take the die, they can take in a following round. If a Sketal is sent to the cemetery, the corresponding die is replaced in the reserve pool.`) + `</p>`;
        case 10: return `<p>` + _(`If the player obtains 2 fire symbols, Xar’gok is sent to the cemetery and the spells are cast:`) + `</p>
        <ol class="help-list"><li>` + _(`1. The other players take a spell token that they place facedown in front of them.`) + `</li>
        <li>` + _(`2. At the beginning of the next round, the spell tokens are revealed.`) + `</li>
        <li>` + _(`3. When a player fulfils the condition indicated on their token, the spell is triggered: its effect is applied and the token is replaced in the box.`) + `</li></ol>
        <p>` + _(`<b>A spell token works in exactly the same way as a card:</b> the player chooses the order in which they resolve their cards and their spell, the trigger conditions and the effects are the same as those of the cards.`) + `</p>
        <p><div class="help-special-spell"></div>` + _(`Only this spell token is played differently: it must always be placed on the last companion to be recruited. The player must move the spell token each time he recruits a new companion.`) + `</p>
        <p>` + _(`When the spell is triggered, the companion on which it is placed is sent to the cemetery (without applying any effects, even if it has a skull) and the player replaces the token in the box. As the player can choose the order in which the cards and the spell are resolved, they can benefit from the targeted character’s effect (if their dice allow them to) before it is sent to the cemetery.`) + `</p>`;
        case 20: return `<p>` + _(`When a player takes Kaar, they take the small black die from the reserve pool, roll it and place it on the space of the meeting track indicated by the result of the die. If the result indicates an empty space, the player must reroll the die. If no player takes Kaar, the black die does not come into play.`) + `</p>
        <p>` + _(`During the rest of the game, the player with Kaar is immunized against the curse of the black die. If the black die is placed in front of the companion they want to take, they can move it in front of another companion of their choice.`) + `</p>
        <p>` + _(`<b>Curse of the black die:</b> In each round, the player who rolls the black die with their other dice must apply its result: according to the obtained symbol, every other die of the player with the same symbol is not counted in the final result. If the player obtains -2 bursts of light, they move back as many spaces on the score track.`) + `</p>
        <p style="color: #D4111F;">` + _(`<b>Important:</b> the black die remains in play until the end of the game, even if Kaar is sent to the cemetery.`) + `</p>`;
        case 41: return `<p>` + _(`If the player obtains an air symbol, they immediately discard Cromaug and can take another companion of their choice from the cemetery that they place in front of them. The chosen companion becomes the last companion to be recruited.`) + `</p>
        <p>` + _(`If it is a Sketal, they take the additional die indicated by its power, if it is available in the reserve pool, and can roll it from the next round. If it is Kaar, the black die comes into play.`) + `</p>
        <p>` + _(`If the previously obtained result of the dice allows it, they can immediately trigger the effect of this new companion.`) + `</p>`;
        case 107: return `<p>` + _(`The player who has recruited Crolos may decide to move 2 spaces back on the score track to obtain an immediate reroll. To apply this effect, they must be  able to move backwards. They may do this as many times as they like, as long as they do not go beyond space 0 on the score track.`) + `</p>`;
    }
    return null;
}
function setupCompanionCard(game, cardDiv, type) {
    const companion = game.gamedatas.COMPANIONS[type];
    const tooltip = getEffectTooltip(companion.effect);
    const companionTooltip = getCompanionTooltip(type);
    game.bga.gameui.addTooltipHtml(cardDiv.id, `<h3>${companion.name}</h3>${tooltip || ''}${tooltip && companionTooltip ? '<hr>' : ''}${companionTooltip || ''}`);
    cardDiv.classList.add('card-inner');
    cardDiv.insertAdjacentHTML('beforeend', `<div class="card-front" style="${cardDiv.attributes.getNamedItem('style').nodeValue.replace(/"/g, '\'')}"></div>`);
    cardDiv.insertAdjacentHTML('beforeend', `<div class="card-back back${type > 23 ? 'B' : 'A'}"></div>`);
    const companionPoints = COMPANION_POINTS[type];
    if (companionPoints) {
        cardDiv.insertAdjacentHTML('beforeend', `<div class="score-contrast ${companionPoints < 0 ? 'score-contrast-glow' : ''}">${Math.abs(companionPoints)}</div>`);
        cardDiv.getElementsByClassName('card-front')[0].insertAdjacentHTML('beforeend', `<div class="score-contrast ${companionPoints < 0 ? 'score-contrast-glow' : ''}">${Math.abs(companionPoints)}</div>`);
    }
}
function setupSpellCard(game, cardDiv, type) {
    const tooltip = getEffectTooltip(game.gamedatas.SPELLS_EFFECTS[type]);
    if (tooltip) {
        game.bga.gameui.addTooltipHtml(cardDiv.id, tooltip);
    }
}
function setupSoloTileCard(game, cardDiv, type) {
    const effect = game.gamedatas.SOLO_TILES[type];
    let html = ``;
    if (effect.moveCompany > 0) {
        html += `<div>${formatTooltipText(_("Move Tom’s band token forward ${spaces} spaces. Then Tom’s score token is moved the number of spaces corresponding to the band token’s position on the score track."), { spaces: `<strong>${effect.moveCompany}</strong>` })}</div>`;
    }
    if (effect.moveScore > 0) {
        html += `<div>${formatTooltipText(_("Move Tom’s score token forward ${number} shards of light"), { number: `<strong>${effect.moveScore}</strong>` })}</div>`;
    }
    if (effect.moveMeeple > 0) {
        const side = game.getBoardSide();
        if (side == 1) {
            html += `<div>${_("Move Tom’s camp to the village with a higher number of shards of light.")}</div>`;
        }
        else if (side == 2) {
            html += `<div>${formatTooltipText(_("Move one of Tom’s boats via the path by the ${lowesthighest} value"), { lowesthighest: effect.moveMeeple == 2 ? _("highest") : _("lowest") })}</div>`;
        }
    }
    if (html != ``) {
        game.bga.gameui.addTooltipHtml(cardDiv.id, html);
    }
}
function moveToAnotherStock(sourceStock, destinationStock, uniqueId, cardId) {
    if (sourceStock === destinationStock) {
        return;
    }
    const sourceStockItemId = `${sourceStock.container_div.id}_item_${cardId}`;
    if (document.getElementById(sourceStockItemId)) {
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    }
    else {
        console.warn(`${sourceStockItemId} not found in `, sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }
    const destinationDiv = document.getElementById(`${destinationStock.container_div.id}_item_${cardId}`);
    destinationDiv.style.zIndex = '10';
    setTimeout(() => destinationDiv.style.zIndex = 'unset', 1000);
}
function addToStockWithId(destinationStock, uniqueId, cardId, from) {
    destinationStock.addToStockWithId(uniqueId, cardId, from);
    const destinationDiv = document.getElementById(`${destinationStock.container_div.id}_item_${cardId}`);
    destinationDiv.style.zIndex = '10';
    setTimeout(() => destinationDiv.style.zIndex = 'unset', 1000);
}

const MEETING_SPOT_BY_COLOR = [
    null,
    4,
    1,
    3,
    0,
    2,
];
class MeetingTrack {
    constructor(game, meetingTrackSpot, topDeckType, topDeckBType, topCemeteryType, discardedSoloTiles, playerCount) {
        this.game = game;
        this.companionsStocks = [];
        this.soloTilesStocks = [];
        const solo = playerCount == 1;
        if (playerCount >= 5) {
            document.getElementById(`meeting-track`).insertAdjacentHTML('afterbegin', `
                <div id="meeting-track-expansion" data-players="${playerCount}"></div>
            `);
        }
        if (solo) {
            document.getElementById('meeting-track').insertAdjacentHTML('beforeend', `<div id="meeting-track-dice-0" class="meeting-track-zone dice" style="left: 57px;"></div>`);
            meetingTrackSpot[0].dice.forEach(die => this.game.createOrMoveDie(die, `meeting-track-dice-0`));
        }
        let spotCount = 5;
        if (playerCount >= 5) {
            spotCount = playerCount + 2;
        }
        for (let i = 1; i <= spotCount; i++) {
            let left = 245 + 135 * MEETING_SPOT_BY_COLOR[i];
            if (i > 5) {
                left = 4 + (i - 6) * 135;
            }
            let html = `
            <div id="meeting-track-dice-${i}" class="meeting-track-zone dice" style="left: ${left}px;"></div>
            <div id="meeting-track-footprints-${i}" class="meeting-track-zone footprints" style="left: ${left}px;"></div>
            <div id="meeting-track-companion-${i}" class="meeting-track-stock" style="left: ${left}px;"></div>
            `;
            if (solo) {
                html += `<div id="meeting-track-soloTile-${i}" class="meeting-track-solo-tile" style="left: ${left}px;"></div>`;
            }
            document.getElementById(i > 5 ? 'meeting-track-expansion' : 'meeting-track').insertAdjacentHTML('beforeend', html);
            const spot = meetingTrackSpot[i];
            // companions
            this.companionsStocks[i] = new LegacyStock();
            this.companionsStocks[i].setSelectionAppearance('class');
            this.companionsStocks[i].selectionClass = 'selected';
            this.companionsStocks[i].create(this.game.bga.gameui, document.getElementById(`meeting-track-companion-${i}`), CARD_WIDTH, CARD_HEIGHT);
            this.companionsStocks[i].setSelectionMode(0);
            this.companionsStocks[i].onItemCreate = (cardDiv, type) => setupCompanionCard(game, cardDiv, type);
            this.companionsStocks[i].onChangeSelection = (_, id) => id && this.game.selectMeetingTrackCompanion(i);
            setupCompanionCards(this.companionsStocks[i]);
            if (spot.companion) {
                this.companionsStocks[i].addToStockWithId(spot.companion.subType, '' + spot.companion.id);
            }
            // footprints
            this.setFootprintTokens(i, spot.footprints);
            if (solo) {
                // solo tiles
                this.soloTilesStocks[i] = new LegacyStock();
                this.soloTilesStocks[i].setSelectionAppearance('class');
                this.soloTilesStocks[i].selectionClass = 'selected';
                this.soloTilesStocks[i].create(this.game.bga.gameui, document.getElementById(`meeting-track-soloTile-${i}`), CARD_WIDTH, SOLO_CARD_HEIGHT);
                this.soloTilesStocks[i].setSelectionMode(0);
                this.soloTilesStocks[i].onItemCreate = (cardDiv, type) => setupSoloTileCard(game, cardDiv, type);
                setupSoloTileCards(this.soloTilesStocks[i]);
                if (spot.soloTile) {
                    this.soloTilesStocks[i].addToStockWithId(spot.soloTile.type, '' + spot.soloTile.id);
                }
            }
        }
        // place dice only after spots creation
        for (let i = 1; i <= spotCount; i++) {
            const spot = meetingTrackSpot[i];
            this.placeSmallDice(spot.dice);
            document.getElementById(`meeting-track-dice-${i}`).addEventListener('click', () => {
                if (document.getElementById(`meeting-track-dice-${i}`).classList.contains('selectable')) {
                    this.game.onMeetingTrackDiceClick(i);
                }
            });
        }
        this.setDeckTop(DECK, topDeckType);
        this.setDeckTop(DECKB, topDeckBType);
        this.setDeckTop(CEMETERY, topCemeteryType);
        if (game.isSolo()) {
            document.getElementById('meeting-track').insertAdjacentHTML('beforeend', `<div id="solo-tiles" class="meeting-track-stock solo-tiles hidden-pile"></div>`);
            document.getElementById('meeting-track').insertAdjacentHTML('beforeend', `<div id="solo-tiles-discard" class="meeting-track-stock solo-tiles hidden-pile ${discardedSoloTiles ? '' : 'hidden'}"></div>`);
            document.getElementById('middle-band').classList.add('solo');
        }
    }
    setCompanion(companion, spot) {
        if (!companion) {
            this.companionsStocks[spot].removeAllTo(CEMETERY);
            return;
        }
        const currentId = this.companionsStocks[spot].items[0]?.id;
        if (currentId && Number(currentId) === companion.id) {
            return;
        }
        if (currentId && Number(currentId) != companion.id) {
            this.companionsStocks[spot].removeAllTo(CEMETERY);
        }
        this.companionsStocks[spot].addToStockWithId(companion.subType, '' + companion.id, DECK);
    }
    setSoloTile(meetingTrackSpot, spot) {
        const soloTile = meetingTrackSpot.soloTile;
        if (!soloTile) {
            this.soloTilesStocks[spot].removeAll();
            return;
        }
        const currentId = this.soloTilesStocks[spot].items[0]?.id;
        if (currentId && Number(currentId) === soloTile.id) {
            return;
        }
        if (currentId && Number(currentId) != soloTile.id) {
            this.soloTilesStocks[spot].removeAll();
        }
        this.soloTilesStocks[spot].addToStockWithId(soloTile.type, '' + soloTile.id, SOLO_TILES);
    }
    removeCompanion(spot) {
        const id = `${this.companionsStocks[spot].container_div.id}_item_${this.companionsStocks[spot].items[0]?.id}`;
        const card = document.getElementById(id);
        this.companionsStocks[spot].removeAllTo(CEMETERY);
        if (card) {
            card.classList.add('flipped');
            setTimeout(() => card.style.visibility = 'hidden', 500);
        }
    }
    removeCompanions() {
        for (let i = 1; i <= this.game.getSpotCount(); i++) {
            this.removeCompanion(i);
        }
    }
    setSelectionMode(mode) {
        for (let i = 1; i <= this.game.getSpotCount(); i++) {
            this.companionsStocks[i].setSelectionMode(mode);
        }
    }
    getStock(spot) {
        return this.companionsStocks[spot];
    }
    setFootprintTokens(spot, number) {
        const zone = document.getElementById(`meeting-track-footprints-${spot}`);
        while (zone.childElementCount > number) {
            zone.removeChild(zone.lastChild);
        }
        for (let i = zone.childElementCount; i < number; i++) {
            document.getElementById(zone.id).insertAdjacentHTML('beforeend', `<div class="round-token footprint footprint-token"></div>`);
        }
    }
    clearFootprintTokens(spot, toPlayer) {
        const zone = document.getElementById(`meeting-track-footprints-${spot}`);
        Array.from(zone.children).forEach(tokenDiv => this.game.bga.gameui.slideToObjectAndDestroy(tokenDiv, `player-table-${toPlayer}-footprint-tokens`));
    }
    placeSmallDice(dice) {
        dice.forEach(die => this.game.createOrMoveDie(die, `meeting-track-dice-${die.location_arg}`));
    }
    setDeckTop(deckId, type) {
        document.getElementById(deckId).dataset.type = `${type ?? 0}`;
    }
    setSelectableDice(possibleSpots) {
        for (let i = 1; i <= this.game.getSpotCount(); i++) {
            document.getElementById(`meeting-track-dice-${i}`).classList.toggle('selectable', possibleSpots.some(ps => ps === i));
        }
    }
    updateSoloTiles(args) {
        this.setDeckTop(DECK, args.topDeckType);
        this.setDeckTop(DECKB, args.topDeckBType);
        document.getElementById('solo-tiles-discard').classList.toggle('hidden', !args.discardedSoloTiles);
        this.soloTilesStocks[args.spot].removeAllTo('solo-tiles-discard');
        if (args.soloTile) {
            this.soloTilesStocks[args.spot].addToStockWithId(args.soloTile.type, '' + args.soloTile.id, 'solo-tiles-discard');
        }
    }
}

const COMPANION_SPELL = 3;
const SYMBOL_INDEX_TO_DIE_VALUE = [];
SYMBOL_INDEX_TO_DIE_VALUE[1] = 1;
SYMBOL_INDEX_TO_DIE_VALUE[2] = 2;
SYMBOL_INDEX_TO_DIE_VALUE[3] = 3;
SYMBOL_INDEX_TO_DIE_VALUE[4] = 4;
SYMBOL_INDEX_TO_DIE_VALUE[5] = 5;
SYMBOL_INDEX_TO_DIE_VALUE[22] = 6;
SYMBOL_INDEX_TO_DIE_VALUE[103] = 7;
SYMBOL_INDEX_TO_DIE_VALUE[-102] = 8;
class PlayerTable {
    constructor(game, player) {
        this.game = game;
        this.playerId = Number(player.id);
        let html = `
        <div id="player-table-${this.playerId}" class="player-table whiteblock">
            <div class="name-and-dice">
                <div id="player-table-${this.playerId}-name" class="player-name" style="background-color: #${player.color};">${player.name}</div>
                <div class="player-tokens">
                    <div id="player-table-${this.playerId}-reroll-tokens" class="player-tokens-type"></div>
                    <div id="player-table-${this.playerId}-footprint-tokens" class="player-tokens-type"></div>
                    <div id="player-table-${this.playerId}-firefly-tokens" class="player-tokens-type"></div>
                </div>
                <div id="player-table-${this.playerId}-dice" class="player-dice"></div>
                <div id="player-table-${this.playerId}-dice-grid" class="player-dice-grid">`;
        for (let i = 1; i <= 8; i++) {
            html += `<div id="player-table-${this.playerId}-dice-grid-symbol${i}-th" class="hidden th-symbol th-symbol${i}"><div class="icon symbol${i}"></div><sub id="player-table-${this.playerId}-dice-grid-symbol${i}-counter"></sub></div>`;
        }
        html += `<div id="player-table-${this.playerId}-dice-grid-symbol0-th" class="hidden th-symbol th-symbol0"><sub id="player-table-${this.playerId}-dice-grid-symbol0-counter"></sub></div>`;
        for (let i = 1; i <= 8; i++) {
            html += `<div id="player-table-${this.playerId}-dice-grid-symbol${i}" class="hidden"></div>`;
        }
        html += `<div id="player-table-${this.playerId}-dice-grid-symbol0" class="hidden"></div>`;
        html += `        </div>`;
        if (game.getBoardSide() === 2 || game.isExpansion()) {
            html += `<div id="player-table-${this.playerId}-symbol-count" class="player-symbol-count"></div>`;
        }
        html += `    </div>
            <div class="adventurer-and-companions">
                <div id="player-table-${this.playerId}-spells" class="player-table-spells normal"></div>
                <div id="player-table-${this.playerId}-adventurer" class="player-table-adventurer"></div>
                <div id="player-table-${this.playerId}-companions" class="player-table-companions"></div>
            </div>
        </div>`;
        document.getElementById(this.playerId === this.game.getPlayerId() ? 'currentplayertable' : 'playerstables').insertAdjacentHTML('beforeend', html);
        // adventurer
        this.adventurerStock = new LegacyStock();
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game.bga.gameui, document.getElementById(`player-table-${this.playerId}-adventurer`), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        this.adventurerStock.onItemCreate = (cardDiv, type) => setupAdventurerCard(game, cardDiv, type);
        this.adventurerStock.onChangeSelection = (_, itemId) => {
            if (this.adventurerStock.getSelectedItems().length) {
                this.game.cardClick(0, Number(itemId));
            }
            this.adventurerStock.unselectAll();
        };
        setupAdventurersCards(this.adventurerStock);
        if (player.adventurer) {
            this.adventurerStock.addToStockWithId(player.adventurer.color, '' + player.adventurer.id);
            this.addMouseEvents(this.adventurerStock, player.adventurer);
        }
        // companions
        this.companionsStock = new LegacyStock();
        this.companionsStock.setSelectionAppearance('class');
        this.companionsStock.selectionClass = 'selected';
        this.companionsStock.create(this.game.bga.gameui, document.getElementById(`player-table-${this.playerId}-companions`), CARD_WIDTH, CARD_HEIGHT);
        this.companionsStock.setSelectionMode(0);
        this.companionsStock.onItemCreate = (cardDiv, type) => setupCompanionCard(game, cardDiv, type);
        this.companionsStock.onChangeSelection = (_, itemId) => {
            if (this.companionsStock.getSelectedItems().length) {
                this.game.cardClick(1, Number(itemId));
            }
            this.companionsStock.unselectAll();
        };
        setupCompanionCards(this.companionsStock);
        const newWeights = {};
        player.companions.forEach(card => newWeights[card.subType] = card.location_arg);
        this.companionsStock.changeItemsWeight(newWeights);
        player.companions.forEach(companion => {
            this.companionsStock.addToStockWithId(companion.subType, '' + companion.id);
            this.addMouseEvents(this.companionsStock, companion);
        });
        // spells
        this.spellsStock = new LegacyStock();
        this.spellsStock.setSelectionAppearance('class');
        this.spellsStock.selectionClass = 'selected';
        this.spellsStock.create(this.game.bga.gameui, document.getElementById(`player-table-${this.playerId}-spells`), SPELL_DIAMETER, SPELL_DIAMETER);
        this.spellsStock.setSelectionMode(0);
        this.spellsStock.onItemCreate = (cardDiv, type) => setupSpellCard(game, cardDiv, type);
        this.spellsStock.onChangeSelection = (_, itemId) => {
            if (this.spellsStock.getSelectedItems().length) {
                this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            this.spellsStock.unselectAll();
        };
        setupSpellCards(this.spellsStock);
        document.getElementById(`player-table-${this.playerId}-spells`).classList.toggle('hidden', player.spells.filter(spell => spell.type != 3 || !spell.visible).length == 0);
        player.spells.forEach(spell => {
            if (spell.visible) {
                this.revealSpell(spell, true);
            }
            else {
                this.addHiddenSpell(spell.id);
            }
        });
        // dice
        player.dice.forEach(die => {
            this.game.createOrMoveDie(die, `player-table-${this.playerId}-dice`);
        });
        this.sortDice();
        // tokens
        this.setTokens('reroll', player.rerolls);
        this.setTokens('footprint', player.footprints);
        this.setTokens('firefly', player.fireflies);
        if (game.getBoardSide() === 2 || game.isExpansion()) {
            game.bga.gameui.addTooltipHtml(`player-table-${this.playerId}-symbol-count`, _('Number of different element symbols on dice. The special symbols do not count.'));
        }
    }
    getLastCompanionId() {
        return this.companionsStock.items[this.companionsStock.items.length - 1]?.id;
    }
    createCompanionSpellStock() {
        if (this.companionSpellStock) {
            return;
        }
        const lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }
        document.getElementById(`${this.companionsStock.container_div.id}_item_${lastItemId}`).insertAdjacentHTML('beforeend', `
            <div id="player-table-${this.playerId}-companion-spell" class="player-table-companion-spell"></div>
        `);
        this.companionSpellStock = new LegacyStock();
        this.companionSpellStock.centerItems = true;
        this.companionSpellStock.setSelectionAppearance('class');
        this.companionSpellStock.selectionClass = 'selected';
        this.companionSpellStock.create(this.game.bga.gameui, document.getElementById(`player-table-${this.playerId}-companion-spell`), SPELL_DIAMETER, SPELL_DIAMETER);
        this.companionSpellStock.setSelectionMode(0);
        this.companionSpellStock.onItemCreate = (cardDiv, type) => setupSpellCard(this.game, cardDiv, type);
        this.companionSpellStock.onChangeSelection = (_, itemId) => {
            if (this.companionSpellStock.getSelectedItems().length) {
                this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            this.companionSpellStock.unselectAll();
        };
        setupSpellCards(this.companionSpellStock);
    }
    removeCompanionSpellStock() {
        document.getElementById(`player-table-${this.playerId}-companion-spell`)?.remove();
        this.companionSpellStock = null;
    }
    moveCompanionSpellStock() {
        const lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }
        if (this.companionSpellStock) {
            document.getElementById(`${this.companionsStock.container_div.id}_item_${lastItemId}`).appendChild(document.getElementById(`player-table-${this.playerId}-companion-spell`));
        }
    }
    setAdventurer(adventurer) {
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, '' + adventurer.id);
        this.addMouseEvents(this.adventurerStock, adventurer);
    }
    addCompanion(companion, from) {
        const newWeights = {};
        newWeights[companion.subType] = companion.location_arg;
        this.companionsStock.changeItemsWeight(newWeights);
        if (from) {
            moveToAnotherStock(from, this.companionsStock, companion.subType, '' + companion.id);
        }
        else {
            this.companionsStock.addToStockWithId(companion.subType, '' + companion.id);
        }
        this.moveCompanionSpellStock();
        this.addMouseEvents(this.companionsStock, companion);
        this.game.tableHeightChange();
    }
    addDice(dice) {
        dice.forEach(die => this.game.createOrMoveDie(die, `player-table-${this.playerId}-dice`));
        setTimeout(() => this.sortDice(), 1000);
    }
    removeDice(dice) {
        dice.forEach(die => this.game.bga.gameui.fadeOutAndDestroy(`die${die.id}`));
    }
    removeCompanion(companion, removedBySpell, ignoreCemetary = false) {
        const id = `${this.companionsStock.container_div.id}_item_${companion.id}`;
        const card = document.getElementById(id);
        this.companionsStock.removeFromStockById('' + companion.id, ignoreCemetary ? CEMETERY : undefined);
        if (card) {
            card.classList.add('flipped');
            setTimeout(() => card.style.visibility = 'hidden', 500);
        }
        if (removedBySpell) {
            this.removeSpell(removedBySpell);
        }
        else {
            this.moveCompanionSpellStock();
        }
        this.game.tableHeightChange();
    }
    setUsedDie(dieId) {
        document.getElementById(`die${dieId}`).classList.add('used');
    }
    clearUsedDice() {
        Array.from(document.getElementsByClassName('die')).forEach(die => die.classList.remove('used'));
    }
    addHiddenSpell(id, fromPlayerId = undefined) {
        document.getElementById(`player-table-${this.playerId}-spells`).classList.remove('hidden');
        this.spellsStock.addToStockWithId(0, 'hidden' + id, fromPlayerId ? `overall_player_board_${fromPlayerId}` : undefined);
    }
    revealSpell(spell, tableCreation = false) {
        let stock = this.spellsStock;
        if (spell.type === 3) {
            this.createCompanionSpellStock();
            stock = this.companionSpellStock;
        }
        const hiddenSpellId = `${this.spellsStock.container_div.id}_item_hidden${spell.id}`;
        stock.addToStockWithId(spell.type, '' + spell.id, document.getElementById(hiddenSpellId) ? hiddenSpellId : undefined);
        if (!tableCreation) {
            this.spellsStock.removeFromStockById('hidden' + spell.id);
        }
        document.getElementById(`player-table-${this.playerId}-spells`).classList.toggle('hidden', this.spellsStock.items.length == 0);
    }
    removeSpell(spell) {
        this.spellsStock.removeFromStockById('hidden' + spell.id);
        this.spellsStock.removeFromStockById('' + spell.id);
        if (spell.type === 3) {
            this.companionSpellStock?.removeFromStockById('hidden' + spell.id);
            this.companionSpellStock?.removeFromStockById('' + spell.id);
            this.removeCompanionSpellStock();
        }
        document.getElementById(`player-table-${this.playerId}-spells`).classList.toggle('hidden', this.spellsStock.items.length == 0);
    }
    setColor(newPlayerColor) {
        document.getElementById(`player-table-${this.playerId}-name`).style.backgroundColor = `#${newPlayerColor}`;
    }
    setTokens(type, number) {
        const zone = document.getElementById(`player-table-${this.playerId}-${type}-tokens`);
        while (zone.childElementCount > Math.max(0, number)) {
            zone.removeChild(zone.lastChild);
        }
        for (let i = zone.childElementCount; i < number; i++) {
            document.getElementById(zone.id).insertAdjacentHTML('beforeend', `<div class="round-token ${type}"></div>`);
        }
    }
    addMouseEvents(stock, companionOrAdventurer) {
        const div = document.getElementById(`${stock.container_div.id}_item_${companionOrAdventurer.id}`);
        const diceDiv = document.getElementById(`player-table-${this.playerId}`);
        div.addEventListener('mouseenter', () => this.highlightDice(diceDiv, companionOrAdventurer.effect?.conditions));
        div.addEventListener('mouseleave', () => this.unhighlightDice(diceDiv));
    }
    highlightDice(diceDiv, conditions) {
        if (!conditions) {
            return;
        }
        const highlightConditions = conditions.filter(condition => condition > -10 && condition < 10);
        if (!highlightConditions.length) {
            return;
        }
        const dice = Array.from(diceDiv.querySelectorAll('.die'));
        dice.forEach(die => {
            const dieValue = Number(die.dataset.dieValue);
            if (highlightConditions.some(condition => condition === dieValue)) {
                die.classList.add('highlight-green');
            }
            if (highlightConditions.some(condition => condition === -dieValue)) {
                die.classList.add('highlight-red');
            }
        });
    }
    unhighlightDice(diceDiv) {
        const dice = Array.from(diceDiv.querySelectorAll('.die'));
        dice.forEach(die => die.classList.remove('highlight-green', 'highlight-red'));
    }
    sortDice() {
        const diceDiv = document.getElementById(`player-table-${this.playerId}`);
        const dice = Array.from(diceDiv.querySelectorAll('.die'));
        let columns = 0;
        let symbolCount = 0;
        for (let i = 1; i <= 8; i++) {
            // basic die faces
            const valueDice = dice.filter(die => SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)] === i);
            document.getElementById(`player-table-${this.playerId}-dice-grid-symbol${i}-th`).classList.toggle('hidden', valueDice.length === 0);
            const destination = document.getElementById(`player-table-${this.playerId}-dice-grid-symbol${i}`);
            destination.classList.toggle('hidden', valueDice.length === 0);
            if (valueDice.length) {
                columns++;
                if (i <= 5 && !valueDice.some(die => die.dataset.dieColor == '8')) {
                    symbolCount++;
                }
                valueDice.forEach(die => {
                    die.classList.remove('rolled');
                    destination.appendChild(die);
                });
                document.getElementById(`player-table-${this.playerId}-dice-grid-symbol${i}-counter`).innerHTML = valueDice.length > 1 ? `(${valueDice.length})` : '';
            }
        }
        // special faces
        const valueDice = dice.filter(die => !SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)]);
        document.getElementById(`player-table-${this.playerId}-dice-grid-symbol0-th`).classList.toggle('hidden', valueDice.length === 0);
        const destination = document.getElementById(`player-table-${this.playerId}-dice-grid-symbol0`);
        destination.classList.toggle('hidden', valueDice.length === 0);
        if (valueDice.length) {
            columns++;
            valueDice.forEach(die => {
                die.classList.remove('rolled');
                destination.appendChild(die);
            });
            document.getElementById(`player-table-${this.playerId}-dice-grid-symbol0-counter`).innerHTML = valueDice.length > 1 ? `(${valueDice.length})` : '';
        }
        document.getElementById(`player-table-${this.playerId}-dice-grid`).style.gridTemplateColumns = `repeat(${columns}, auto)`;
        if (this.game.getBoardSide() === 2 || this.game.isExpansion()) {
            document.getElementById(`player-table-${this.playerId}-symbol-count`).innerHTML = '' + symbolCount;
        }
        this.setForbidden();
    }
    setForbidden() {
        const diceDiv = document.getElementById(`player-table-${this.playerId}`);
        const dice = Array.from(diceDiv.querySelectorAll('.die'));
        for (let i = 1; i <= 8; i++) {
            const valueDice = dice.filter(die => SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)] === i);
            if (valueDice.length) {
                const forbidden = valueDice.some(die => die.dataset.dieColor == '8') && i <= 5;
                valueDice.forEach(die => {
                    die.classList.toggle('forbidden', forbidden && die.dataset.dieColor != '8');
                });
            }
        }
        dice.filter(die => !SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)]).forEach(die => die.classList.remove('forbidden'));
    }
}

function slideToObjectAndAttach(game, object, destinationId, posX, posY) {
    const destination = document.getElementById(destinationId);
    if (destination.contains(object)) {
        return Promise.resolve(true);
    }
    return new Promise(resolve => {
        const originalZIndex = Number(object.style.zIndex);
        object.style.zIndex = '10';
        const objectCR = object.getBoundingClientRect();
        const destinationCR = destination.getBoundingClientRect();
        const deltaX = destinationCR.left - objectCR.left + (posX ?? 0);
        const deltaY = destinationCR.top - objectCR.top + (posY ?? 0);
        const attachToNewParent = () => {
            if (posX !== undefined) {
                object.style.left = `${posX}px`;
            }
            else {
                object.style.removeProperty('left');
            }
            if (posY !== undefined) {
                object.style.top = `${posY}px`;
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
        if (document.visibilityState === 'hidden' || game.bga.gameui.instantaneousMode) {
            // if tab is not visible, we skip animation (else they could be delayed or cancelled by browser)
            attachToNewParent();
        }
        else {
            object.style.transition = `transform 0.5s ease-in`;
            object.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            let securityTimeoutId = null;
            const transitionend = () => {
                attachToNewParent();
                object.removeEventListener('transitionend', transitionend);
                resolve(true);
                if (securityTimeoutId) {
                    clearTimeout(securityTimeoutId);
                }
            };
            object.addEventListener('transitionend', transitionend);
            // security check : if transition fails, we force tile to destination
            securityTimeoutId = setTimeout(() => {
                if (!destination.contains(object)) {
                    attachToNewParent();
                    object.removeEventListener('transitionend', transitionend);
                    resolve(true);
                }
            }, 700);
        }
    });
}

class TokensManager extends BgaCards.Manager {
    constructor(game) {
        super({
            cardWidth: 64,
            cardHeight: 62,
            animationManager: game.animationManager,
            getId: (card) => `module-token-${card.id}`,
            setupDiv: (card, div) => {
                div.classList.add('module-token');
                div.dataset.cardId = '' + card.id;
                div.dataset.type = '' + card.type;
                div.dataset.typeArg = '' + card.typeArg;
            },
            setupFrontDiv: (card, div) => { },
            setupBackDiv: (card, div) => { }
        });
        this.game = game;
    }
}

const ANIMATION_MS = 500;
const SCORE_MS = 1500;
const ROLL_DICE_ACTION_BUTTONS_IDS = [`setRollDice-button`, `setChangeDie-button`, `keepDice-button`, `cancelRollDice-button`, `change-die-faces-buttons`];
const RESOLVE_ACTION_BUTTONS_IDS = [`resolveAll-button`, `cancelResolveDiscardDie-button`];
const MOVE_ACTION_BUTTONS_IDS = [`placeEncampment-button`, `endTurn-button`, `cancelMoveDiscardCampanionOrSpell-button`];
const ZOOM_LEVELS = [0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5];
const ZOOM_LEVELS_MARGIN = [-300, -166, -100, -60, -33, -14, 0, 20, 33.34];
const LOCAL_STORAGE_ZOOM_KEY = 'Glow-zoom';
const isDebug = window.location.host == 'studio.boardgamearena.com';
const log = isDebug ? console.log.bind(window.console) : function () { };
class Game {
    constructor(bga) {
        this.rerollCounters = [];
        this.footprintCounters = [];
        this.fireflyCounters = [];
        this.fireflyTokenCounters = [];
        this.companionCounters = [];
        this.selectedDice = [];
        this.selectedDieFace = null;
        this.diceSelectionActive = false;
        this.playersTables = [];
        this.playersTokens = [];
        //private zoomManager: ZoomManager;
        this.zoom = 1;
        this.DICE_FACES_TOOLTIP = [];
        this.onGameUserPreferenceChanged = (prefId, prefValue) => {
            switch (prefId) {
                case 202:
                    document.getElementById('full-table').dataset.highContrastPoints = '' + prefValue;
                    break;
                case 204:
                    document.getElementById('full-table').insertAdjacentElement('afterbegin', document.getElementById(prefValue == 2 ? 'currentplayertable' : 'full-board-wrapper'));
                    break;
            }
        };
        this.bga = bga;
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
    setup(gamedatas) {
        this.bga.images.dontPreloadImage(`side${gamedatas.side == 2 ? 1 : 2}.png`);
        this.bga.images.dontPreloadImage('side1-hd.png');
        this.bga.images.dontPreloadImage('side2-hd.png');
        const playerCount = Object.keys(gamedatas.players).length;
        if (playerCount != 5) {
            this.bga.images.dontPreloadImage('meeting-track-little-board-5p.png');
        }
        if (playerCount != 6) {
            this.bga.images.dontPreloadImage('meeting-track-little-board-6p.png');
        }
        if (!gamedatas.expansion) {
            this.bga.images.dontPreloadImage('companions-expansion1-set1.png');
            this.bga.images.dontPreloadImage('companions-expansion1-set2.png');
            this.bga.images.dontPreloadImage('companions-expansion1-set3.png');
        }
        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="score">
                <div id="tabble-wrapper">
                    <table>
                        <thead>
                            <tr id="scoretr"></tr>
                        </thead>
                        <tbody id="score-table-body">
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="zoom-wrapper">
                <div id="full-table">

                    <div id="currentplayertable"></div>

                    <div id="full-board-wrapper">
                        <div id="full-board">
                            <div id="board">
                                <div id="table-dice"></div>
                            </div>
                            <div id="middle-band">
                                <div id="round-counter-wrapper">
                                    ${_("Day")} <span id="round-counter">-</span><span id="round-counter-wrapper-max-days">&nbsp;/&nbsp;8</span>
                                </div>
                            </div>
                            <div id="meeting-track">
                                <div id="deckB" class="meeting-track-stock hidden-pile"></div>
                                <div id="deck" class="meeting-track-stock hidden-pile"></div>
                                <div id="cemetery" class="meeting-track-stock hidden-pile"></div>
                            </div>
                        </div>
                    </div>

                    <div id="playerstables"></div>
                </div>
                <div id="zoom-controls">
                    <button id="zoom-out"></button>
                    <button id="zoom-in" class="disabled"></button>
                </div>
            </div>
        `);
        log("Starting game setup");
        [1, 2, 3, 4, 5, 6, 7, 8, 80, 9, 10].forEach(color => {
            let facesStr = '';
            for (let face = 1; face <= 6; face++) {
                facesStr += `[die:${color}:${face}]`;
            }
            this.DICE_FACES_TOOLTIP[color] = `<h3>${_("Die faces")}</h3> <div>${formatTextIcons(facesStr)}</div>`;
        });
        this.gamedatas = gamedatas;
        log('gamedatas', gamedatas);
        document.getElementById('board').classList.add(`side${gamedatas.side}`);
        this.animationManager = new BgaAnimations.Manager({ animationsActive: () => this.bga.gameui.bgaAnimationsActive() });
        this.tokensManager = new TokensManager(this);
        this.createPlayerPanels(gamedatas);
        const players = Object.values(gamedatas.players);
        const solo = players.length == 1;
        if (solo) {
            players.push(gamedatas.tom);
        }
        this.board = new Board(this, players, gamedatas.tableDice, solo);
        this.meetingTrack = new MeetingTrack(this, gamedatas.meetingTrack, gamedatas.topDeckType, gamedatas.topDeckBType, gamedatas.topCemeteryType, gamedatas.discardedSoloTiles, playerCount);
        this.createPlayerTables(gamedatas);
        if (gamedatas.day > 0) {
            this.roundCounter = new LegacyCounter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(gamedatas.day);
        }
        if (gamedatas.endTurn) {
            this.notif_lastTurn();
        }
        if (Number(gamedatas.gamestate.id) >= 80) { // score or end
            this.onEnteringShowScore(true);
        }
        this.addHelp();
        this.setupNotifications();
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        if (this.zoom !== 1) {
            this.setZoom(this.zoom);
        }
        this.bga.gameui.onScreenWidthChange = () => {
            this.setAutoZoom();
        };
        log("Ending game setup");
    }
    ///////////////////////////////////////////////////
    //// Game & client states
    // onEnteringState: this method is called each time we are entering into a new game state.
    //                  You can use this method to perform some user interface changes at this moment.
    //
    onEnteringState(stateName, args) {
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
            case 'uriomRecruitCompanion':
                this.onEnteringStateUriomRecruitCompanion(args.args);
                break;
            case 'privateSelectDiceAction':
                this.setDiceSelectionActive(false);
                break;
            case 'rollDice':
            case 'privateRollDice':
            case 'privateChangeDie':
                this.onEnteringStateRollDice();
                break;
            case 'privateRerollImmediate':
                this.onEnteringStateRerollImmediate(args.args);
                break;
            case 'removeToken':
                this.onEnteringRemoveToken();
                break;
            case 'move':
                this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive()
                    ? (this.gamedatas.side === 2 ? _('${you} can move one of your boats') : _('${you} can move your company'))
                    : (this.gamedatas.side === 2 ? _('Players can move one of their boats') : _('Players can move their company')));
                break;
            case 'multiMove':
                this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive()
                    ? (this.gamedatas.side === 2 ? _('${you} can move one of your boats') : _('${you} can move your company'))
                    : (this.gamedatas.side === 2 ? _('Players can move one of their boats') : _('Players can move their company')));
                this.onLeavingResolveCards();
                break;
            case 'privateMove':
                this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive()
                    ? (this.gamedatas.side === 2 ? _('${you} can move one of your boats') : _('${you} can move your company'))
                    : (this.gamedatas.side === 2 ? _('Players can move one of their boats') : _('Players can move their company')));
                this.onEnteringStatePrivateMove(args.args);
                break;
            case 'discardCompanionSpell':
            case 'privateKillToken':
                this.onEnteringStateDiscardCompanionSpell();
                break;
            case 'endRound':
                const playerTable = this.getPlayerTable(this.getPlayerId());
                playerTable?.clearUsedDice();
                break;
            case 'endScore':
                this.onEnteringShowScore();
                break;
            case 'gameEnd':
                const lastTurnBar = document.getElementById('last-round');
                if (lastTurnBar) {
                    lastTurnBar.style.display = 'none';
                }
                break;
        }
    }
    onEnteringStateStartRound() {
        if (document.getElementById('adventurers-stock')) {
            document.getElementById('adventurers-stock')?.remove();
            this.adventurersStock = null;
        }
    }
    onEnteringStateChooseAdventurer(args) {
        const adventurers = args.adventurers;
        if (!document.getElementById('adventurers-stock')) {
            document.getElementById('currentplayertable').insertAdjacentHTML('beforebegin', `<div id="adventurers-stock"></div>`);
            this.adventurersStock = new LegacyStock();
            this.adventurersStock.create(this.bga.gameui, document.getElementById('adventurers-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.adventurersStock.setSelectionMode(0);
            this.adventurersStock.setSelectionAppearance('class');
            this.adventurersStock.selectionClass = 'nothing';
            this.adventurersStock.centerItems = true;
            this.adventurersStock.onItemCreate = (cardDiv, type) => setupAdventurerCard(this, cardDiv, type);
            this.adventurersStock.onChangeSelection = () => this.onAdventurerSelection(this.adventurersStock.getSelectedItems());
            setupAdventurersCards(this.adventurersStock);
            adventurers.forEach(adventurer => this.adventurersStock.addToStockWithId(adventurer.color, '' + adventurer.id));
        }
        else {
            this.adventurersStock.items.filter(item => !adventurers.some(adventurer => adventurer.color == item.type)).forEach(item => this.adventurersStock.removeFromStockById(item.id));
        }
        if (this.bga.players.isCurrentPlayerActive()) {
            this.adventurersStock.setSelectionMode(1);
        }
    }
    onEnteringStateRecruitCompanion(args) {
        if (!args) {
            return;
        }
        this.meetingTrackClickAction = 'recruit';
        const solo = this.isSolo();
        args.companions.forEach((meetingTrackSpot, spot) => {
            if (spot >= 1 && spot <= this.getSpotCount()) {
                this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
                this.meetingTrack.placeSmallDice(meetingTrackSpot.dice);
                this.meetingTrack.setFootprintTokens(spot, meetingTrackSpot.footprints);
                if (solo) {
                    this.meetingTrack.setSoloTile(meetingTrackSpot, spot);
                }
            }
        });
        this.meetingTrack.setDeckTop(DECK, args.topDeckType);
        if (this.bga.players.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    }
    onEnteringChooseTomDice(args) {
        // remove color duplicates
        args.dice.filter((die, index, self) => index === self.findIndex((t) => t.color === die.color)).forEach(die => {
            const html = `<div class="die-item color${die.color} side${Math.min(6, die.color)}"></div>`;
            this.bga.gameui.addActionButton(`selectTomDie${die.color}-button`, html, () => this.onTomDiceSelection(die), null, null, 'gray');
        });
        this.bga.gameui.addActionButton(`confirmTomDice-button`, _("Confirm"), () => this.chooseTomDice());
        document.getElementById(`confirmTomDice-button`).classList.add('disabled');
    }
    onEnteringSelectSketalDie(args) {
        // remove color duplicates
        args.dice.filter((die, index, self) => index === self.findIndex((t) => t.color === die.color)).forEach(die => {
            const html = `<div class="die-item color${die.color} side${Math.min(6, die.color)}"></div>`;
            this.bga.gameui.addActionButton(`selectSketalDie${die.id}-button`, html, () => this.selectSketalDie(die.id));
        });
    }
    onEnteringStateRemoveCompanion(args) {
        this.meetingTrackClickAction = 'remove';
        args.companions.forEach((meetingTrackSpot, spot) => {
            if (spot >= 1 && spot <= this.getSpotCount()) {
                this.meetingTrack.setCompanion(meetingTrackSpot.companion, spot);
            }
        });
        if (this.bga.players.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectionMode(1);
        }
    }
    onEnteringStateMoveBlackDie(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectableDice(args.possibleSpots);
        }
    }
    onEnteringStateUriomRecruitCompanion(args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            this.meetingTrack.setSelectableDice([args.spot]);
        }
    }
    onEnteringStateRollDice() {
        this.setDiceSelectionActive(true);
        setTimeout(() => this.playersTables.forEach(playerTable => playerTable.sortDice()), 500);
    }
    onEnteringStateRerollImmediate(args) {
        this.onEnteringStateRollDice();
        this.getDieDiv(args.selectedDie).classList.add('selected-pink');
    }
    onEnteringSwap(args) {
        const companion = args.card;
        if (!document.getElementById('cemetary-companions-stock')) {
            document.getElementById('currentplayertable').insertAdjacentHTML('beforebegin', `<div id="cemetary-companions-stock"></div>`);
            this.cemetaryCompanionsStock = new LegacyStock();
            this.cemetaryCompanionsStock.create(this.bga.gameui, document.getElementById('cemetary-companions-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.cemetaryCompanionsStock.setSelectionMode(0);
            this.cemetaryCompanionsStock.setSelectionAppearance('class');
            this.cemetaryCompanionsStock.selectionClass = 'nothing';
            this.cemetaryCompanionsStock.centerItems = true;
            this.cemetaryCompanionsStock.onItemCreate = (cardDiv, type) => setupCompanionCard(this, cardDiv, type);
            setupCompanionCards(this.cemetaryCompanionsStock);
            this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id);
        }
        else {
            this.cemetaryCompanionsStock.removeAll();
            this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id);
        }
        if (this.bga.players.isCurrentPlayerActive()) {
            this.getCurrentPlayerTable().companionsStock.setSelectionMode(1);
            this.bga.gameui.addActionButton(`skipSwap-button`, _("Skip"), () => this.skipSwap(), null, null, 'red');
        }
        this.tableHeightChange();
    }
    onEnteringResurrect(args) {
        const companions = args.cemeteryCards;
        if (!document.getElementById('cemetary-companions-stock')) {
            document.getElementById('currentplayertable').insertAdjacentHTML('beforebegin', `<div id="cemetary-companions-stock"></div>`);
            this.cemetaryCompanionsStock = new LegacyStock();
            this.cemetaryCompanionsStock.create(this.bga.gameui, document.getElementById('cemetary-companions-stock'), CARD_WIDTH, CARD_HEIGHT);
            this.cemetaryCompanionsStock.setSelectionMode(0);
            this.cemetaryCompanionsStock.setSelectionAppearance('class');
            this.cemetaryCompanionsStock.selectionClass = 'nothing';
            this.cemetaryCompanionsStock.centerItems = true;
            this.cemetaryCompanionsStock.onItemCreate = (cardDiv, type) => setupCompanionCard(this, cardDiv, type);
            this.cemetaryCompanionsStock.onChangeSelection = () => this.onCemetarySelection(this.cemetaryCompanionsStock.getSelectedItems());
            setupCompanionCards(this.cemetaryCompanionsStock);
            companions.forEach(companion => this.cemetaryCompanionsStock.addToStockWithId(companion.subType, '' + companion.id, CEMETERY));
            this.meetingTrack.setDeckTop(CEMETERY, 0);
        }
        if (this.bga.players.isCurrentPlayerActive()) {
            this.cemetaryCompanionsStock.setSelectionMode(1);
            this.bga.gameui.addActionButton(`skipResurrect-button`, _("Skip"), () => this.skipResurrect(), null, null, 'red');
        }
        this.tableHeightChange();
    }
    onEnteringRemoveToken() {
        document.getElementById(`tokens-${this.getPlayerId()}`).classList.add('selectable');
    }
    onEnteringStateResolveCards() {
        const resolveArgs = this.getResolveArgs();
        this.onLeavingResolveCards();
        const playerId = this.getPlayerId();
        const playerTable = this.getPlayerTable(playerId);
        resolveArgs.remainingEffects.forEach(possibleEffect => {
            const cardType = possibleEffect[0];
            const cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                document.getElementById(`${playerTable.adventurerStock.container_div.id}_item_${cardId}`).classList.add('selectable');
            }
            else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                document.getElementById(`${playerTable.companionsStock.container_div.id}_item_${cardId}`).classList.add('selectable');
            }
            if (cardType === 2) { // spells
                playerTable.spellsStock.setSelectionMode(1);
                if (document.getElementById(`${playerTable.spellsStock.container_div.id}_item_${cardId}`)) {
                    document.getElementById(`${playerTable.spellsStock.container_div.id}_item_${cardId}`).classList.add('selectable');
                }
                else if (playerTable.companionSpellStock && document.getElementById(`${playerTable.companionSpellStock.container_div.id}_item_${cardId}`)) {
                    playerTable.companionSpellStock.setSelectionMode(1);
                    document.getElementById(`${playerTable.companionSpellStock.container_div.id}_item_${cardId}`).classList.add('selectable');
                }
            }
        });
        if (!document.getElementById(`resolveAll-button`)) {
            this.bga.gameui.addActionButton(`resolveAll-button`, resolveArgs.remainingEffects.length ? _("Resolve all") : _("Pass"), () => this.resolveAll(), null, null, 'red');
        }
        document.getElementById(`resolveAll-button`).classList.toggle('disabled', resolveArgs.remainingEffects.some(remainingEffect => remainingEffect[2]));
    }
    onEnteringStatePrivateResolveCards(resolveArgs) {
        this.onLeavingResolveCards();
        const playerId = this.getPlayerId();
        const playerTable = this.getPlayerTable(playerId);
        resolveArgs.remainingEffects.forEach(possibleEffect => {
            const cardType = possibleEffect[0];
            const cardId = possibleEffect[1];
            if (cardType === 0) { // adventurer
                playerTable.adventurerStock.setSelectionMode(1);
                document.getElementById(`${playerTable.adventurerStock.container_div.id}_item_${cardId}`).classList.add('selectable');
            }
            else if (cardType === 1) { // adventurer
                playerTable.companionsStock.setSelectionMode(1);
                document.getElementById(`${playerTable.companionsStock.container_div.id}_item_${cardId}`).classList.add('selectable');
            }
            if (cardType === 2) { // spells
                playerTable.spellsStock.setSelectionMode(1);
                if (document.getElementById(`${playerTable.spellsStock.container_div.id}_item_${cardId}`)) {
                    document.getElementById(`${playerTable.spellsStock.container_div.id}_item_${cardId}`).classList.add('selectable');
                }
                else if (playerTable.companionSpellStock && document.getElementById(`${playerTable.companionSpellStock.container_div.id}_item_${cardId}`)) {
                    playerTable.companionSpellStock.setSelectionMode(1);
                    document.getElementById(`${playerTable.companionSpellStock.container_div.id}_item_${cardId}`).classList.add('selectable');
                }
            }
        });
        if (!document.getElementById(`resolveAll-button`)) {
            this.bga.gameui.addActionButton(`resolveAll-button`, resolveArgs.remainingEffects.length ? _("Resolve all") : _("Pass"), () => this.resolveAll(), null, null, 'red');
        }
        document.getElementById(`resolveAll-button`).classList.toggle('disabled', resolveArgs.remainingEffects.some(remainingEffect => remainingEffect[2]));
    }
    onEnteringStateMove(args) {
        this.board.createDestinationZones(args.possibleRoutes?.map(route => route));
        if (this.gamedatas.side === 1) {
            if (!document.getElementById(`placeEncampment-button`)) {
                this.bga.gameui.addActionButton(`placeEncampment-button`, _("Place encampment"), () => this.placeEncampment());
            }
            document.getElementById(`placeEncampment-button`).classList.toggle('disabled', !args.canSettle);
        }
        if (!document.getElementById(`endTurn-button`)) {
            this.bga.statusBar.addActionButton(_("End turn"), () => this.endTurn(), {
                id: 'endTurn-button',
                color: 'alert',
                autoclick: !!args.possibleRoutes && !args.possibleRoutes.length && !args.canSettle && !args.killTokenId && !args.disableTokenId && this.bga.userPreferences.get(203) != 2,
            });
        }
    }
    onEnteringStatePrivateMove(moveArgs) {
        //console.log('onEnteringStatePrivateMove', moveArgs);
        this.board.createDestinationZones(moveArgs.possibleRoutes?.map(route => route));
        if (this.gamedatas.side === 1) {
            if (!document.getElementById(`placeEncampment-button`)) {
                this.bga.gameui.addActionButton(`placeEncampment-button`, _("Place encampment"), () => this.placeEncampment());
            }
            document.getElementById(`placeEncampment-button`).classList.toggle('disabled', !moveArgs.canSettle);
        }
        if (!document.getElementById(`endTurn-button`)) {
            this.bga.statusBar.addActionButton(_("End turn"), () => this.endTurn(), {
                id: 'endTurn-button',
                color: 'alert',
                autoclick: !!moveArgs.possibleRoutes && !moveArgs.possibleRoutes.length && !moveArgs.canSettle && !moveArgs.killTokenId && !moveArgs.disableTokenId && this.bga.userPreferences.get(203) != 2,
            });
        }
    }
    onEnteringStateDiscardCompanionSpell() {
        // make cards selectable
        const playerTable = this.getCurrentPlayerTable();
        playerTable.companionsStock?.setSelectionMode(1);
        playerTable.companionsStock?.items.forEach(item => document.getElementById(`${playerTable.companionsStock.container_div.id}_item_${item.id}`).classList.add('selectable'));
        playerTable.spellsStock?.setSelectionMode(1);
        playerTable.spellsStock?.items.forEach(item => document.getElementById(`${playerTable.spellsStock.container_div.id}_item_${item.id}`).classList.add('selectable'));
        playerTable.companionSpellStock?.setSelectionMode(1);
        playerTable.companionSpellStock?.items.forEach(item => document.getElementById(`${playerTable.companionSpellStock.container_div.id}_item_${item.id}`).classList.add('selectable'));
    }
    onEnteringShowScore(fromReload = false) {
        const lastTurnBar = document.getElementById('last-round');
        if (lastTurnBar) {
            lastTurnBar.style.display = 'none';
        }
        document.getElementById('score').style.display = 'flex';
        const headers = document.getElementById('scoretr');
        if (!headers.childElementCount) {
            let html = `
                <th></th>
                <th id="th-before-end-score" class="before-end-score">${_("Score at last day")}</th>
                <th id="th-cards-score" class="cards-score">${_("Adventurer and companions")}</th>
                <th id="th-board-score" class="board-score">${_("Journey board")}</th>
                <th id="th-fireflies-score" class="fireflies-score">${_("Fireflies")}</th>
                <th id="th-footprints-score" class="footprints-score">${_("Footprint tokens")}</th>`;
            if (this.gamedatas.tokensActivated) {
                html += `
                    <th id="th-tokens-score" class="tokens-score">${_("Tokens score")}</th>
                `;
            }
            html += `
                <th id="th-after-end-score" class="after-end-score">${_("Final score")}</th>
            `;
            headers.insertAdjacentHTML('beforeend', html);
        }
        const players = Object.values(this.gamedatas.players);
        if (players.length == 1) {
            players.push(this.gamedatas.tom);
        }
        players.forEach(player => {
            //if we are a reload of end state, we display values, else we wait for notifications
            const playerScore = fromReload ? player : null;
            const firefliesScore = fromReload && Number(player.id) > 0 ? (this.fireflyCounters[player.id].getValue() >= this.companionCounters[player.id].getValue() ? 10 : 0) : undefined;
            const footprintsScore = fromReload ? this.footprintCounters[player.id].getValue() : undefined;
            let html = `
                <tr id="score${player.id}">
                <td class="player-name" style="color: #${player.color}">${Number(player.id) == 0 ? 'Tom' : player.name}</td>
                <td id="before-end-score${player.id}" class="score-number before-end-score">${playerScore?.scoreBeforeEnd !== undefined ? playerScore.scoreBeforeEnd : ''}</td>
                <td id="cards-score${player.id}" class="score-number cards-score">${playerScore?.scoreCards !== undefined ? playerScore.scoreCards : ''}</td>
                <td id="board-score${player.id}" class="score-number board-score">${playerScore?.scoreBoard !== undefined ? playerScore.scoreBoard : ''}</td>
                <td id="fireflies-score${player.id}" class="score-number fireflies-score">${firefliesScore !== undefined ? firefliesScore : ''}</td>
                <td id="footprints-score${player.id}" class="score-number footprints-score">${footprintsScore !== undefined ? footprintsScore : ''}</td>`;
            if (this.gamedatas.tokensActivated) {
                html += `<td id="tokens-score${player.id}" class="score-number tokens-score">${playerScore?.scoreTokens !== undefined ? playerScore.scoreTokens : ''}</td>`;
            }
            html += `
                <td id="after-end-score${player.id}" class="score-number after-end-score total">${playerScore?.scoreAfterEnd !== undefined ? playerScore.scoreAfterEnd : ''}</td>
            </tr>
            `;
            document.getElementById('score-table-body').insertAdjacentHTML('beforeend', html);
        });
        this.bga.gameui.addTooltipHtmlToClass('before-end-score', _("Score before the final count."));
        this.bga.gameui.addTooltipHtmlToClass('cards-score', _("Total number of bursts of light on adventurer and companions."));
        this.bga.gameui.addTooltipHtmlToClass('board-score', this.gamedatas.side == 1 ?
            _("Number of bursts of light indicated on the village where encampment is situated.") :
            _("Number of bursts of light indicated on the islands on which players have placed their boats."));
        this.bga.gameui.addTooltipHtmlToClass('fireflies-score', _("Total number of fireflies in player possession, represented on companions and tokens. If there is many or more fireflies than companions, player score an additional 10 bursts of light."));
        if (this.gamedatas.tokensActivated) {
            this.bga.gameui.addTooltipHtmlToClass('tokens-score', _("For each color, the player earns 1/3/6/10/15/21 shards of light if he got 1/2/3/4/5/6 tokens of the same color and a bonus of 10 shards of light if the player got at least 1 butterfly token in each of the 6 colors."));
        }
        this.bga.gameui.addTooltipHtmlToClass('footprints-score', _("1 burst of light per footprint in player possession."));
    }
    // onLeavingState: this method is called each time we are leaving a game state.
    //                 You can use this method to perform some user interface changes at this moment.
    //
    onLeavingState(stateName) {
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
            case 'uriomRecruitCompanion':
                this.onLeavingUriomRecruitCompanion();
                break;
            case 'rollDice':
            case 'changeDice':
            case 'privateSelectDiceAction':
                this.onLeavingRollDice();
                break;
            case 'privateRerollImmediate':
                this.onLeavingRerollImmediate();
                break;
            case 'swapMulti':
                this.onLeavingSwap();
                break;
            case 'resurrect':
                this.onLeavingResurrect();
                break;
            case 'removeToken':
                this.onLeavingRemoveToken();
                break;
            case 'resolveCards':
            case 'multiResolveCards':
                this.onLeavingResolveCards();
                break;
            case 'multiMove':
                this.board.createDestinationZones(null);
                break;
            case 'discardCompanionSpell':
            case 'privateKillToken':
                this.onLeavingResolveCards();
                break;
        }
    }
    onLeavingChooseAdventurer() {
        this.adventurersStock.setSelectionMode(0);
    }
    onLeavingRecruitCompanion() {
        this.meetingTrack.setSelectionMode(0);
    }
    onLeavingMoveBlackDie() {
        this.meetingTrack.setSelectableDice([]);
    }
    onLeavingUriomRecruitCompanion() {
        this.meetingTrack.setSelectableDice([]);
    }
    onLeavingRollDice() {
        this.setDiceSelectionActive(false);
    }
    onLeavingRerollImmediate() {
        this.onLeavingRollDice();
        Array.from(document.getElementsByClassName('selected-pink')).forEach(elem => elem.classList.remove('selected-pink'));
    }
    onLeavingSwap() {
        if (document.getElementById('cemetary-companions-stock')) {
            this.cemetaryCompanionsStock?.removeAll();
            this.bga.gameui.fadeOutAndDestroy('cemetary-companions-stock');
            this.cemetaryCompanionsStock = null;
            setTimeout(() => this.tableHeightChange(), 200);
            this.getCurrentPlayerTable()?.companionsStock.setSelectionMode(0);
        }
    }
    onLeavingResurrect() {
        if (document.getElementById('cemetary-companions-stock')) {
            this.cemetaryCompanionsStock?.removeAllTo(CEMETERY);
            this.bga.gameui.fadeOutAndDestroy('cemetary-companions-stock');
            this.cemetaryCompanionsStock = null;
            setTimeout(() => this.tableHeightChange(), 200);
        }
    }
    onLeavingRemoveToken() {
        document.getElementById(`tokens-${this.getPlayerId()}`).classList.remove('selectable');
    }
    onLeavingResolveCards() {
        Array.from(document.getElementsByClassName('selectable')).forEach(node => node.classList.remove('selectable'));
        [...this.playersTables.map(pt => pt.adventurerStock), ...this.playersTables.map(pt => pt.companionsStock), ...this.playersTables.map(pt => pt.spellsStock)].forEach(stock => stock.setSelectionMode(0));
    }
    // onUpdateActionButtons: in this method you can manage "action buttons" that are displayed in the
    //                        action status bar (ie: the HTML links in the status bar).
    //
    onUpdateActionButtons(stateName, args) {
        if (this.bga.players.isCurrentPlayerActive()) {
            switch (stateName) {
                case 'chooseTomDice':
                    this.onEnteringChooseTomDice(args);
                    break;
                case 'selectSketalDie':
                case 'selectSketalDieMulti':
                    this.onEnteringSelectSketalDie(args);
                    break;
                case 'uriomRecruitCompanion':
                    this.bga.gameui.addActionButton(`recruitCompanionUriom-button`, _("Recruit selected companion"), () => this.recruitCompanionUriom());
                    this.bga.gameui.addActionButton(`passUriomRecruit-button`, _("Pass"), () => this.passUriomRecruit());
                    break;
                case 'privateSelectDiceAction':
                    this.currentDieAction = null;
                    const rollDiceArgs = args;
                    const possibleRerolls = rollDiceArgs.rerollCompanion + rollDiceArgs.rerollCrolos + rollDiceArgs.rerollTokens + Object.values(rollDiceArgs.rerollScore).length;
                    this.bga.gameui.addActionButton(`setRollDice-button`, _("Reroll 1 or 2 dice") + formatTextIcons(' (1 [reroll] )'), () => this.selectDiceToRoll());
                    this.bga.gameui.addActionButton(`setChangeDie-button`, _("Change die face") + formatTextIcons(` (3 [reroll]${rollDiceArgs.grayMultiDice ? ' / ' + _('free for ${symbol}').replace('${symbol}', '[symbol0]') : ''})`), () => this.selectDieToChange());
                    this.bga.gameui.addActionButton(`keepDice-button`, _("Keep current dice") + (rollDiceArgs.grayMultiDice ? formatTextIcons(` (${_('change ${symbol} face before').replace('${symbol}', '[symbol0]')})`) : ''), () => this.keepDice(), null, null, 'red');
                    document.getElementById(`setRollDice-button`).classList.toggle('disabled', possibleRerolls < 1);
                    document.getElementById(`setChangeDie-button`).classList.toggle('disabled', possibleRerolls < 3 && !rollDiceArgs.grayMultiDice);
                    document.getElementById(`keepDice-button`).classList.toggle('disabled', rollDiceArgs.grayMultiDice);
                    break;
                case 'privateRollDice':
                    this.currentDieAction = 'roll';
                    const possibleCostsRollDice = this.getPossibleCosts(1);
                    possibleCostsRollDice.forEach((possibleCost, index) => {
                        const costStr = possibleCost.map((cost, costTypeIndex) => this.getRollDiceCostStr(costTypeIndex, cost)).filter(str => str !== null).join(' ');
                        this.bga.gameui.addActionButton(`rollDice-button${index}`, _("Reroll selected dice") + ` (${costStr})`, () => this.rollDice(possibleCost));
                        document.getElementById(`rollDice-button${index}`).classList.toggle('disabled', this.selectedDice.length < 1 || this.selectedDice.length > 2);
                    });
                    this.bga.gameui.addActionButton(`cancel-button`, _("Cancel"), () => this.cancel());
                    break;
                case 'privateChangeDie':
                    this.currentDieAction = 'change';
                    document.getElementById('generalactions').insertAdjacentHTML('beforeend', `<div id="change-die-faces-buttons"></div>`);
                    this.createChangeDieButtons();
                    if (this.selectedDice.length === 1) {
                        this.onSelectedDiceChange();
                    }
                    break;
                case 'privateRerollImmediate':
                    this.currentDieAction = 'rerollImmediate';
                    this.bga.gameui.addActionButton(`rerollImmediate-button`, _("Reroll selected and pink dice"), () => this.rerollImmediate());
                    this.bga.gameui.addActionButton(`rerollImmediateOnlyPink-button`, _("Reroll only pink dice"), () => this.rerollImmediate(true));
                    document.getElementById(`rerollImmediate-button`).classList.add('disabled');
                    if (this.selectedDice.length === 1) {
                        this.onSelectedDiceChange();
                    }
                    break;
                case 'resolveCards':
                    this.setActionBarResolve(false);
                    break;
                case 'privateResolveCards':
                    // make cards unselectable
                    this.onLeavingResolveCards();
                    this.onEnteringStatePrivateResolveCards(args);
                    break;
                case 'removeToken':
                    const removeTokenArgs = args;
                    if (removeTokenArgs.tokens.length === 0 && removeTokenArgs.count) {
                        this.bga.gameui.addActionButton(`passRemoveToken-button`, _("Pass (no token to remove)"), () => this.passRemoveToken());
                    }
                    break;
                case 'move':
                    this.onEnteringStateMove(args);
                    break;
                case 'multiMove':
                    this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive()
                        ? (this.gamedatas.side === 2 ? _('${you} can move one of your boats') : _('${you} can move your company'))
                        : (this.gamedatas.side === 2 ? _('Players can move one of their boats') : _('Players can move their company')));
                    break;
                case 'privateMove':
                    this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive()
                        ? (this.gamedatas.side === 2 ? _('${you} can move one of your boats') : _('${you} can move your company'))
                        : (this.gamedatas.side === 2 ? _('Players can move one of their boats') : _('Players can move their company')));
                    this.onEnteringStatePrivateMove(args);
                    break;
                case 'discardCompanionSpell':
                case 'privateKillToken':
                    this.bga.gameui.addActionButton(`cancel-button`, _("Cancel"), () => stateName == 'privateKillToken' ? this.cancelToken() : this.cancelDiscardCompanionSpell(), null, null, 'gray');
                    break;
                case 'privateDisableToken':
                    for (let i = 1; i <= 5; i++) {
                        this.bga.gameui.addActionButton(`disableSymbol${i}-button`, formatTextIcons(`[symbol${i}]`), () => this.disableToken(i), null, null, 'gray');
                    }
                    this.bga.gameui.addActionButton(`cancel-button`, _("Cancel"), () => this.cancelToken(), null, null, 'gray');
                    break;
            }
        }
        else {
            switch (stateName) {
                case 'multiMove':
                    this.board.createDestinationZones(null);
                    break;
            }
        }
        switch (stateName) {
            case 'swap':
                this.onEnteringSwap(args);
                break;
            case 'resurrect':
                this.onEnteringResurrect(args);
                break;
            case 'privateResolveCards':
            case 'privateMove':
                const tokenArgs = args;
                if (tokenArgs.killTokenId) {
                    this.bga.gameui.addActionButton(`useKillToken-button`, _("Use ${token}").replace('${token}', `<div class="module-token" data-type-arg="37"></div>`), () => this.activateToken(tokenArgs.killTokenId), null, null, 'gray');
                }
                if (tokenArgs.disableTokenId) {
                    this.bga.gameui.addActionButton(`useDisableToken-button`, _("Use ${token}").replace('${token}', `<div class="module-token" data-type-arg="0"></div>`), () => this.activateToken(tokenArgs.disableTokenId), null, null, 'gray');
                }
                break;
        }
    }
    ///////////////////////////////////////////////////
    //// Utility methods
    ///////////////////////////////////////////////////
    setZoom(zoom = 1) {
        this.zoom = zoom;
        localStorage.setItem(LOCAL_STORAGE_ZOOM_KEY, '' + this.zoom);
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom);
        document.getElementById('zoom-in').classList.toggle('disabled', newIndex === ZOOM_LEVELS.length - 1);
        document.getElementById('zoom-out').classList.toggle('disabled', newIndex === 0);
        const div = document.getElementById('full-table');
        div.style.transform = zoom === 1 ? '' : `scale(${zoom})`;
        div.style.marginRight = `${ZOOM_LEVELS_MARGIN[newIndex]}%`;
        this.tableHeightChange();
        document.getElementById('board').classList.toggle('hd', this.zoom > 1);
        const stocks = this.playersTables.map(pt => pt.companionsStock);
        if (this.adventurersStock) {
            stocks.push(this.adventurersStock);
        }
        stocks.forEach(stock => stock.updateDisplay());
        document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;
        const fullBoardWrapperDiv = document.getElementById('full-board-wrapper');
        fullBoardWrapperDiv.style.display = fullBoardWrapperDiv.clientWidth < 916 * zoom ? 'block' : 'flex';
    }
    tableHeightChange() {
        setTimeout(() => {
            const div = document.getElementById('full-table');
            document.getElementById('zoom-wrapper').style.height = `${div.getBoundingClientRect().height}px`;
        }, 500);
    }
    zoomIn() {
        if (this.zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) + 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }
    zoomOut() {
        if (this.zoom === ZOOM_LEVELS[0]) {
            return;
        }
        const newIndex = ZOOM_LEVELS.indexOf(this.zoom) - 1;
        this.setZoom(ZOOM_LEVELS[newIndex]);
    }
    setAutoZoom() {
        const zoomWrapperWidth = document.getElementById('zoom-wrapper').clientWidth;
        if (!zoomWrapperWidth) {
            setTimeout(() => this.setAutoZoom(), 200);
            return;
        }
        let newZoom = this.zoom;
        while (newZoom > ZOOM_LEVELS[0] && zoomWrapperWidth / newZoom < 916 /* board width */) {
            newZoom = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(newZoom) - 1];
        }
        this.setZoom(newZoom);
    }
    isSolo() {
        return Object.keys(this.gamedatas.players).length == 1;
    }
    onTomDiceSelection(die) {
        const index = this.selectedDice.findIndex(d => d.id == die.id);
        if (index !== -1) {
            // we deselect
            this.selectedDice.splice(index, 1);
            if (die.color == 6) {
                document.getElementById(`selectTomDie7-button`)?.classList.remove('disabled');
            }
            else if (die.color == 7) {
                document.getElementById(`selectTomDie6-button`)?.classList.remove('disabled');
            }
        }
        else {
            // we select
            this.selectedDice.push(die);
            if (die.color == 6) {
                document.getElementById(`selectTomDie7-button`)?.classList.add('disabled');
            }
            else if (die.color == 7) {
                document.getElementById(`selectTomDie6-button`)?.classList.add('disabled');
            }
        }
        document.getElementById(`selectTomDie${die.color}-button`).classList.toggle('bgabutton_blue', index === -1);
        document.getElementById(`selectTomDie${die.color}-button`).classList.toggle('bgabutton_gray', index !== -1);
        document.getElementById(`confirmTomDice-button`).classList.toggle('disabled', this.selectedDice.length != 2);
    }
    placeFirstPlayerToken(playerId) {
        const firstPlayerToken = document.getElementById('firstPlayerToken');
        if (firstPlayerToken) {
            slideToObjectAndAttach(this, firstPlayerToken, `player_board_${playerId}_firstPlayerWrapper`);
        }
        else {
            document.getElementById(`player_board_${playerId}_firstPlayerWrapper`).insertAdjacentHTML('beforeend', '<div id="firstPlayerToken"></div>');
            this.bga.gameui.addTooltipHtml('firstPlayerToken', _("First Player token"));
        }
    }
    onCemetarySelection(items) {
        if (items.length == 1) {
            const card = items[0];
            this.resurrect(card.id);
        }
    }
    onAdventurerSelection(items) {
        if (items.length == 1) {
            const card = items[0];
            this.chooseAdventurer(card.id);
        }
    }
    getPlayerId() {
        return this.bga.players.getCurrentPlayerId();
    }
    getBoardSide() {
        return this.gamedatas.side;
    }
    isColorBlindMode() {
        return this.bga.userPreferences.get(201) == 1;
    }
    isExpansion() {
        return this.gamedatas.expansion;
    }
    getOpponentId(playerId) {
        return Number(Object.values(this.gamedatas.players).find(player => Number(player.id) != playerId).id);
    }
    getPlayerScore(playerId) {
        return this.bga.playerPanels.getScoreCounter(playerId).getValue() ?? Number(this.gamedatas.players[playerId].score);
    }
    getPlayerTable(playerId) {
        return this.playersTables.find(playerTable => playerTable.playerId === playerId);
    }
    getCurrentPlayerTable() {
        return this.playersTables.find(playerTable => playerTable.playerId === this.getPlayerId());
    }
    createPlayerPanels(gamedatas) {
        const players = Object.values(gamedatas.players);
        const solo = players.length === 1;
        if (solo) {
            this.bga.playerPanels.addAutomataPlayerPanel(0, 'Tom', {
                iconClass: 'tom-avatar',
                score: Number(gamedatas.tom.score),
            });
        }
        (solo ? [...players, gamedatas.tom] : players).forEach(player => {
            const playerId = Number(player.id);
            // counters
            this.bga.playerPanels.getElement(playerId).innerHTML = `
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
            <div id="tokens-${player.id}" class="tokens-stock"></div>
            `;
            const rerollCounter = new LegacyCounter();
            rerollCounter.create(`reroll-counter-${playerId}`);
            rerollCounter.setValue(player.rerolls);
            this.rerollCounters[playerId] = rerollCounter;
            const footprintCounter = new LegacyCounter();
            footprintCounter.create(`footprint-counter-${playerId}`);
            footprintCounter.setValue(player.footprints);
            this.footprintCounters[playerId] = footprintCounter;
            if (gamedatas.tokensActivated) {
                this.playersTokens[playerId] = new BgaCards.LineStock(this.tokensManager, document.getElementById(`tokens-${player.id}`), {
                    center: false,
                    gap: '0',
                });
                this.playersTokens[playerId].onCardClick = card => {
                    if (this.gamedatas.gamestate.private_state?.name == 'removeToken') {
                        if (card.type != 2) {
                            this.removeToken(card.id);
                        }
                    }
                    else if (card.type == 3) {
                        this.activateToken(card.id);
                    }
                };
                this.playersTokens[playerId].addCards(player.tokens);
                player.tokens.filter(token => token.type == 2).forEach(token => this.tokensManager.getCardElement(token).classList.add('applied-token'));
            }
            if (playerId != 0) {
                document.getElementById(`firefly-counter-wrapper-${player.id}`).insertAdjacentHTML('beforeend', `
                    <div id="firefly-counter-icon-${player.id}" class="icon firefly"></div>
                    <span id="firefly-counter-${player.id}"></span>&nbsp;/&nbsp;<span id="companion-counter-${player.id}"></span>
                `);
                const fireflyCounter = new LegacyCounter();
                fireflyCounter.create(`firefly-counter-${playerId}`);
                const allFireflies = player.fireflies + player.companions.map(companion => companion.fireflies).reduce((a, b) => a + b, 0);
                fireflyCounter.setValue(allFireflies);
                this.fireflyCounters[playerId] = fireflyCounter;
                this.fireflyTokenCounters[playerId] = player.fireflies;
                const companionCounter = new LegacyCounter();
                companionCounter.create(`companion-counter-${playerId}`);
                companionCounter.setValue(player.companions.length);
                this.companionCounters[playerId] = companionCounter;
                this.updateFireflyCounterIcon(playerId);
            }
            if (!solo) {
                if (player.smallBoard) {
                    document.getElementById(`player_board_${player.id}`).insertAdjacentHTML('beforeend', `<div id="player_board_${player.id}_meeting_track" class="meeting-track-icon" data-players="${players.length}"></div>`);
                    this.bga.gameui.addTooltipHtml(`player_board_${player.id}_meeting_track`, _("This player will place its small dice on the meeting track small board"));
                }
                // first player token
                document.getElementById(`player_board_${player.id}`).insertAdjacentHTML('beforeend', `<div id="player_board_${player.id}_firstPlayerWrapper"></div>`);
                if (gamedatas.firstPlayer === playerId) {
                    this.placeFirstPlayerToken(gamedatas.firstPlayer);
                }
            }
            else if (playerId == 0) {
                document.getElementById(`player_board_${player.id}`).insertAdjacentHTML('beforeend', `<div id="tomDiceWrapper"></div>`);
                if (gamedatas.tom.dice) {
                    this.setTomDice(gamedatas.tom.dice);
                }
            }
            if (this.isColorBlindMode() && playerId != 0) {
                document.getElementById(`player_board_${player.id}`).insertAdjacentHTML('beforeend', `
            <div class="token meeple${this.gamedatas.side == 2 ? 0 : 1} color-blind meeple-player-${player.id}" data-player-no="${player.playerNo}" style="background-color: #${player.color};"></div>
            `);
            }
        });
        this.bga.gameui.addTooltipHtmlToClass('reroll-counter', _("Rerolls tokens"));
        this.bga.gameui.addTooltipHtmlToClass('footprint-counter', _("Footprints tokens"));
        this.bga.gameui.addTooltipHtmlToClass('firefly-counter', _("Fireflies (tokens + companion fireflies) / number of companions"));
    }
    updateFireflyCounterIcon(playerId) {
        const activated = this.fireflyCounters[playerId].getValue() >= this.companionCounters[playerId].getValue();
        document.getElementById(`firefly-counter-icon-${playerId}`).dataset.activated = activated.toString();
    }
    createPlayerTables(gamedatas) {
        const players = Object.values(gamedatas.players).sort((a, b) => a.playerNo - b.playerNo);
        const playerIndex = players.findIndex(player => Number(player.id) === this.bga.players.getCurrentPlayerId());
        const orderedPlayers = playerIndex > 0 ? [...players.slice(playerIndex), ...players.slice(0, playerIndex)] : players;
        orderedPlayers.forEach(player => this.createPlayerTable(gamedatas, Number(player.id)));
    }
    createPlayerTable(gamedatas, playerId) {
        const playerTable = new PlayerTable(this, gamedatas.players[playerId]);
        this.playersTables.push(playerTable);
    }
    createAndPlaceDieHtml(die, destinationId) {
        let html = `<div id="die${die.id}" class="die ${die.small ? 'small' : ''} ${die.used ? 'used' : ''}" data-die-id="${die.id}" data-die-color="${die.color}" data-die-face="${die.face}" data-die-value="${die.value}">
        <ol class="die-list" data-roll="${die.face}">`;
        for (let dieFace = 1; dieFace <= 6; dieFace++) {
            html += `<li class="die-item color${die.color} side${dieFace}" data-side="${dieFace}"></li>`;
        }
        html += `   </ol>
        </div>`;
        // security to destroy pre-existing die with same id
        //const dieDiv = document.getElementById(`die${die.id}`);
        //dieDiv?.parentNode.removeChild(dieDiv);
        document.getElementById(destinationId).insertAdjacentHTML('beforeend', html);
        document.getElementById(`die${die.id}`).addEventListener('click', () => this.onDiceClick(die));
        this.bga.gameui.addTooltipHtml(`die${die.id}`, this.DICE_FACES_TOOLTIP[die.color]);
    }
    createOrMoveDie(die, destinationId, rollClass = '-') {
        const dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            this.setNewFace(die, true);
            dieDiv.classList.remove('used', 'forbidden');
            slideToObjectAndAttach(this, dieDiv, destinationId).then(() => this.playersTables.forEach(playerTable => playerTable.sortDice()));
        }
        else {
            this.createAndPlaceDieHtml(die, destinationId);
            if (rollClass) {
                this.addRollToDiv(this.getDieDiv(die), rollClass);
            }
        }
    }
    setNewFace(die, addChangeDieRoll = false) {
        const dieDiv = this.getDieDiv(die);
        if (dieDiv) {
            dieDiv.dataset.dieValue = '' + die.value;
            const currentFace = Number(dieDiv.dataset.dieFace);
            if (currentFace != die.face) {
                dieDiv.dataset.dieFace = '' + die.face;
                if (addChangeDieRoll) {
                    this.addRollToDiv(dieDiv, 'change');
                }
            }
        }
    }
    getDieDiv(die) {
        return document.getElementById(`die${die.id}`);
    }
    addRollToDiv(dieDiv, rollClass, attempt = 0) {
        dieDiv.classList.remove('rolled');
        if (rollClass === 'odd' || rollClass === 'even') {
            dieDiv.addEventListener('animationend', () => {
                dieDiv.classList.remove('rolled');
            });
            setTimeout(() => dieDiv.classList.add('rolled'), 50);
        }
        const dieList = dieDiv.getElementsByClassName('die-list')[0];
        if (dieList) {
            dieList.dataset.rollType = '-';
            dieList.dataset.roll = dieDiv.dataset.dieFace;
            setTimeout(() => dieList.dataset.rollType = rollClass, 50);
        }
        else if (attempt < 5) {
            setTimeout(() => this.addRollToDiv(dieDiv, rollClass, attempt + 1), 200);
        }
    }
    getSpotCount() {
        let spotCount = 5;
        const playerCount = Object.keys(this.gamedatas.players).length;
        if (playerCount >= 5) {
            spotCount = playerCount + 2;
        }
        return spotCount;
    }
    removeRollDiceActionButtons() {
        const ids = ROLL_DICE_ACTION_BUTTONS_IDS;
        for (let i = 1; i <= 6; i++) {
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
    getResolveArgs() {
        return this.gamedatas.gamestate.args?.[this.getPlayerId()] || this.gamedatas.gamestate.private_state?.args;
    }
    getMoveArgs() {
        //console.log('getMoveArgs', this.gamedatas.gamestate);
        return this.gamedatas.gamestate.args?.[this.getPlayerId()] || this.gamedatas.gamestate.private_state.args;
    }
    permute(permutation) {
        var length = permutation.length, result = [permutation.slice()], c = new Array(length).fill(0), i = 1, k, p;
        while (i < length) {
            if (c[i] < i) {
                k = i % 2 && c[i];
                p = permutation[i];
                permutation[i] = permutation[k];
                permutation[k] = p;
                ++c[i];
                i = 1;
                result.push(permutation.slice());
            }
            else {
                c[i] = 0;
                ++i;
            }
        }
        return result;
    }
    getPossibleCosts(costNumber) {
        const playerArgs = this.gamedatas.gamestate.private_state.args;
        const possibleCosts = [];
        const canUse = [
            playerArgs.rerollCompanion,
            playerArgs.rerollTokens,
            Object.values(playerArgs.rerollScore).length,
            playerArgs.rerollCrolos,
        ];
        const permutations = this.permute([0, 1, 2, 3]);
        permutations.forEach(orderArray => {
            let remainingCost = costNumber;
            for (let i = 1; i <= costNumber; i++) {
                const possibleCost = [0, 0, 0, 0];
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
                if (possibleCost.reduce((a, b) => a + b, 0) === costNumber && !possibleCosts.some(other => possibleCost[0] == other[0] && possibleCost[1] == other[1] && possibleCost[2] == other[2] && possibleCost[3] == other[3])) {
                    possibleCosts.push(possibleCost);
                }
            }
        });
        // costs : [companion, tokens, moves backwards, crolos]
        // remove "duplicates" if only negative points, and costs more or equal
        const pointCosts = possibleCosts.map(possibleCost => possibleCost[0] > 0 || possibleCost[1] > 0 ? -1 : (possibleCost[2] ? playerArgs.rerollScore[possibleCost[2]] : 0) + possibleCost[3] * 2);
        let i = 0;
        while (i < possibleCosts.length) {
            if (pointCosts[i] > 0 && pointCosts.some((pointCost, index) => pointCost !== -1 && (pointCost < pointCosts[i] || (pointCost == pointCosts[i] && index < i)))) {
                possibleCosts.splice(i, 1);
                pointCosts.splice(i, 1);
            }
            else {
                i++;
            }
        }
        return possibleCosts;
    }
    getRollDiceButtons() {
        return Array.from(document.querySelectorAll('[id^="rollDice-button"]'));
    }
    getChangeDieButtons() {
        return Array.from(document.querySelectorAll('[id^="changeDie-button"]'));
    }
    createChangeDieButtons(free = false) {
        const changeDieButtons = this.getChangeDieButtons();
        changeDieButtons.forEach(elem => elem.parentElement.removeChild(elem));
        document.getElementById(`cancelRollDice-button`)?.remove();
        if (free) {
            this.bga.gameui.addActionButton(`changeDie-buttonFree`, _("Change selected die") + ` (${_('free')})`, () => this.changeDie([]));
        }
        else {
            const possibleCosts = this.getPossibleCosts(3);
            possibleCosts.forEach((possibleCost, index) => {
                const costStr = possibleCost.map((cost, costTypeIndex) => this.getRollDiceCostStr(costTypeIndex, cost)).filter(str => str !== null).join(' ');
                this.bga.gameui.addActionButton(`changeDie-button${index}`, _("Change selected die") + ` (${costStr})`, () => this.changeDie(possibleCost));
                document.getElementById(`changeDie-button${index}`).classList.add('disabled');
            });
        }
        this.bga.gameui.addActionButton(`cancelRollDice-button`, _("Cancel"), () => this.cancel());
    }
    removeResolveActionButtons() {
        const ids = RESOLVE_ACTION_BUTTONS_IDS;
        ids.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
        document.querySelectorAll(`.action-button[id^="selectDiscardDie"]`).forEach(elem => elem.parentElement.removeChild(elem));
    }
    setActionBarResolve(fromCancel) {
        this.removeResolveActionButtons();
        if (fromCancel) {
            this.bga.statusBar.setTitle(this.bga.players.isCurrentPlayerActive()
                ? _('${you} must resolve your cards (select the card to resolve first)')
                : _('Players must resolve their cards'), this.getResolveArgs());
        }
        // make cards unselectable
        this.onLeavingResolveCards();
        this.onEnteringStateResolveCards();
    }
    setActionBarResolveDiscardDie(type, id, dice) {
        this.removeResolveActionButtons();
        this.bga.statusBar.setTitle(_("Choose a die to discard"));
        dice.forEach(die => {
            const html = `<div class="die-item color${die.color} side${die.face}"></div>`;
            this.bga.gameui.addActionButton(`selectDiscardDie${die.id}-button`, html, () => {
                this.resolveCard(type, id, die.id);
                this.setActionBarResolve(true);
            }, null, null, 'gray');
        });
        this.bga.gameui.addActionButton(`cancelResolveDiscardDie-button`, _("Cancel"), () => this.setActionBarResolve(true));
    }
    removeMoveActionButtons() {
        const ids = MOVE_ACTION_BUTTONS_IDS;
        ids.forEach(id => {
            const elem = document.getElementById(id);
            if (elem) {
                elem.parentElement.removeChild(elem);
            }
        });
    }
    setTomDice(dice) {
        dice.forEach(die => this.createOrMoveDie({ ...die, id: 1000 + die.id }, `tomDiceWrapper`));
    }
    getRollDiceCostStr(typeIndex, cost) {
        if (cost < 1) {
            return null;
        }
        switch (typeIndex) {
            case 0:
                return `${cost > 1 ? `${cost} ` : ''}${_('use companion')}`;
            case 1:
                return formatTextIcons(`-${cost} [reroll]`);
            case 2:
                const playerArgs = this.gamedatas.gamestate.private_state.args;
                return formatTextIcons(`-${playerArgs.rerollScore[cost]} [point] `);
            case 3:
                return formatTextIcons(`-${cost * 2} [point] (Krolos)`);
        }
    }
    onSelectedDiceChange() {
        const count = this.selectedDice.length;
        this.getRollDiceButtons().forEach(button => button?.classList.toggle('disabled', count < 1 || count > 2));
        if (this.currentDieAction == 'change') {
            console.log(this.selectedDice);
            this.createChangeDieButtons(count === 1 && this.selectedDice[0].color == 80 && this.selectedDice[0].face == 6);
            if (count === 1) {
                this.selectedDieFace = null;
                const die = this.selectedDice[0];
                const faces = die.color <= 5 || die.color == 80 ? 5 : 6;
                const facesButtons = document.getElementById('change-die-faces-buttons');
                for (let i = 1; i <= faces; i++) {
                    const html = `<div class="die-item color${die.color} side${i}"></div>`;
                    this.bga.gameui.addActionButton(`changeDie${i}-button`, html, () => {
                        if (this.selectedDieFace !== null) {
                            document.getElementById(`changeDie${this.selectedDieFace}-button`).classList.remove('bgabutton_blue');
                            document.getElementById(`changeDie${this.selectedDieFace}-button`).classList.add('bgabutton_gray');
                        }
                        else {
                            const changeDieButtons = this.getChangeDieButtons();
                            changeDieButtons.forEach(elem => elem?.classList.remove('disabled'));
                        }
                        this.selectedDieFace = i;
                        document.getElementById(`changeDie${this.selectedDieFace}-button`).classList.remove('bgabutton_gray');
                        document.getElementById(`changeDie${this.selectedDieFace}-button`).classList.add('bgabutton_blue');
                    }, null, null, 'gray');
                    facesButtons.appendChild(document.getElementById(`changeDie${i}-button`));
                }
            }
            else {
                for (let i = 1; i <= 6; i++) {
                    const elem = document.getElementById(`changeDie${i}-button`);
                    elem?.parentElement.removeChild(elem);
                }
            }
        }
        else if (this.currentDieAction == 'rerollImmediate') {
            document.getElementById(`rerollImmediate-button`).classList.toggle('disabled', count !== 1);
            document.getElementById(`rerollImmediateOnlyPink-button`).classList.toggle('disabled', count !== 0);
        }
    }
    onDiceClick(die, forceValue = null) {
        if (forceValue === null && (!this.diceSelectionActive || !this.dieIsOnPlayerTable(die))) {
            return;
        }
        const index = this.selectedDice.findIndex(d => d.id === die.id);
        const selected = forceValue !== null ? !forceValue : index !== -1;
        if (selected) {
            this.selectedDice.splice(index, 1);
        }
        else {
            die.face = Number(document.getElementById(`die${die.id}`).dataset.dieFace);
            this.selectedDice.push(die);
        }
        document.getElementById(`die${die.id}`).classList.toggle('selected', !selected);
        this.onSelectedDiceChange();
    }
    dieIsOnPlayerTable(die) {
        const playerTableDiv = document.getElementById(`player-table-${this.getPlayerId()}`);
        if (!playerTableDiv) {
            return false;
        }
        else {
            return this.getDieDiv(die).closest(`#player-table-${this.getPlayerId()}`) != null;
        }
    }
    unselectDice() {
        this.selectedDice.forEach(die => this.onDiceClick(die, false));
    }
    setDiceSelectionActive(active) {
        this.unselectDice();
        this.diceSelectionActive = active;
        Array.from(document.getElementsByClassName('die')).forEach(node => node?.classList.toggle('selectable', active));
    }
    diceChangedOrRolled(dice, changed, args, playerId) {
        const isCurrentPlayer = playerId == this.getPlayerId();
        if (isCurrentPlayer) {
            this.unselectDice();
        }
        dice.forEach(die => {
            if (isCurrentPlayer) {
                document.getElementById(`die${die.id}`).classList.remove('selected');
            }
            this.setNewFace(die);
            this.addRollToDiv(this.getDieDiv(die), changed ? 'change' : (Math.random() > 0.5 ? 'odd' : 'even'));
        });
    }
    selectMove(possibleDestination) {
        this.move(possibleDestination.destination, possibleDestination.from);
    }
    cardClick(type, id) {
        if (this.gamedatas.gamestate.private_state?.name === 'privateKillToken' || this.gamedatas.gamestate.name === 'privateKillToken') {
            this.killToken(type, id);
            return;
        }
        if (['resolveCards', 'multiResolveCards', 'privateResolveCards'].includes(this.gamedatas.gamestate.name)) {
            const args = this.getResolveArgs();
            const remainingEffect = args.remainingEffects.find(re => re[0] == type && re[1] == id);
            if (remainingEffect) {
                if (Array.isArray(remainingEffect[2])) {
                    this.setActionBarResolveDiscardDie(type, id, remainingEffect[2]);
                }
                else {
                    this.resolveCard(type, id);
                }
            }
        }
        else if (['move', 'multiMove', 'privateMove'].includes(this.gamedatas.gamestate.name)) {
            this.discardCompanionSpell(type, id);
        }
        else if (['swap', 'swapMulti'].includes(this.gamedatas.gamestate.name)) {
            this.swap(id);
        }
        else {
            console.error('No card action in the state', this.gamedatas.gamestate.name);
        }
    }
    onMeetingTrackDiceClick(spot) {
        const stateName = this.gamedatas.gamestate.name;
        if (stateName === 'moveBlackDie') {
            this.moveBlackDie(spot);
        }
        else if (stateName === 'uriomRecruitCompanion' && spot == this.gamedatas.gamestate.args.spot) {
            this.recruitCompanionUriom();
        }
    }
    selectDiceToRoll() {
        if (!this.bga.actions.checkAction('actSelectDiceToRoll')) {
            return;
        }
        this.takeNoLockAction('actSelectDiceToRoll', {
            ids: this.selectedDice.map(die => die.id),
        });
    }
    selectDieToChange() {
        if (!this.bga.actions.checkAction('actSelectDieToChange')) {
            return;
        }
        this.takeNoLockAction('actSelectDieToChange', {
            ids: this.selectedDice.map(die => die.id),
        });
    }
    rollDice(cost) {
        if (!this.bga.actions.checkAction('actRollDice')) {
            return;
        }
        this.takeNoLockAction('actRollDice', {
            ids: this.selectedDice.map(die => die.id),
            cost: cost,
        });
    }
    changeDie(cost) {
        if (!this.bga.actions.checkAction('actChangeDie')) {
            return;
        }
        this.takeNoLockAction('actChangeDie', {
            id: this.selectedDice[0].id,
            value: this.selectedDieFace,
            cost: cost,
        });
    }
    rerollImmediate(onlyPink = false) {
        if (!this.bga.actions.checkAction('actRerollImmediate')) {
            return;
        }
        this.takeNoLockAction('actRerollImmediate', {
            id: onlyPink ? 0 : this.selectedDice[0].id,
        });
    }
    passRemoveToken() {
        if (!this.bga.actions.checkAction('actPassRemoveToken')) {
            return;
        }
        this.takeNoLockAction('actPassRemoveToken');
    }
    cancel() {
        if (!this.bga.actions.checkAction('actCancel')) {
            return;
        }
        this.takeNoLockAction('actCancel');
    }
    selectMeetingTrackCompanion(spot) {
        if (this.meetingTrackClickAction === 'remove') {
            this.removeCompanion(spot);
        }
        else {
            this.recruitCompanion(spot);
        }
    }
    chooseAdventurer(id) {
        if (!this.bga.actions.checkAction('actChooseAdventurer')) {
            return;
        }
        this.takeAction('actChooseAdventurer', {
            id
        });
    }
    chooseTomDice() {
        if (!this.bga.actions.checkAction('actChooseTomDice')) {
            return;
        }
        this.takeAction('actChooseTomDice', {
            dice: this.selectedDice.map(die => die.id)
        });
    }
    recruitCompanion(spot, warningPrompted = false) {
        if (!this.bga.actions.checkAction('actRecruitCompanion')) {
            return;
        }
        if (!warningPrompted) {
            const args = this.gamedatas.gamestate.args;
            if (args.companions[spot].companion.noDieWarning) {
                this.bga.gameui.confirmationDialog(_("Are you sure you want to take that card? There is no available big die for it."), () => this.recruitCompanion(spot, true));
                return;
            }
        }
        this.takeAction('actRecruitCompanion', {
            spot
        });
    }
    selectSketalDie(id) {
        if (!this.bga.actions.checkAction('actSelectSketalDie')) {
            return;
        }
        this.takeAction('actSelectSketalDie', {
            id
        });
    }
    removeCompanion(spot) {
        if (!this.bga.actions.checkAction('actRemoveCompanion')) {
            return;
        }
        this.takeAction('actRemoveCompanion', {
            spot
        });
    }
    moveBlackDie(spot) {
        if (!this.bga.actions.checkAction('actMoveBlackDie')) {
            return;
        }
        this.takeAction('actMoveBlackDie', {
            spot
        });
    }
    recruitCompanionUriom() {
        if (!this.bga.actions.checkAction('actRecruitCompanionUriom')) {
            return;
        }
        this.takeAction('actRecruitCompanionUriom');
    }
    passUriomRecruit() {
        if (!this.bga.actions.checkAction('actPassUriomRecruit')) {
            return;
        }
        this.takeAction('actPassUriomRecruit');
    }
    keepDice() {
        if (!this.bga.actions.checkAction('actKeepDice')) {
            return;
        }
        this.takeNoLockAction('actKeepDice');
    }
    swap(id, warningPrompted = false) {
        if (!this.bga.actions.checkAction('actSwap')) {
            return;
        }
        if (!warningPrompted) {
            const args = this.gamedatas.gamestate.args;
            if (args.card.noDieWarning) {
                this.bga.gameui.confirmationDialog(_("Are you sure you want to take that card? There is no available big die for it."), () => this.swap(id, true));
                return;
            }
        }
        this.takeAction('actSwap', {
            id
        });
    }
    skipSwap() {
        if (!this.bga.actions.checkAction('actSkipSwap')) {
            return;
        }
        this.takeAction('actSkipSwap');
    }
    resurrect(id, warningPrompted = false) {
        if (!this.bga.actions.checkAction('actResurrect')) {
            return;
        }
        if (!warningPrompted) {
            const args = this.gamedatas.gamestate.args;
            if (args.cemeteryCards.find(card => card.id == id).noDieWarning) {
                this.bga.gameui.confirmationDialog(_("Are you sure you want to take that card? There is no available big die for it."), () => this.resurrect(id, true));
                return;
            }
        }
        this.takeAction('actResurrect', {
            id
        });
    }
    skipResurrect() {
        if (!this.bga.actions.checkAction('actSkipResurrect')) {
            return;
        }
        this.takeAction('actSkipResurrect');
    }
    resolveCard(type, id, dieId) {
        if (!this.bga.actions.checkAction('actResolveCard')) {
            return;
        }
        this.takeNoLockAction('actResolveCard', {
            type,
            id,
            dieId,
        });
    }
    resolveAll() {
        if (!this.bga.actions.checkAction('actResolveAll')) {
            return;
        }
        this.takeNoLockAction('actResolveAll');
    }
    removeToken(id) {
        if (!this.bga.actions.checkAction('actRemoveToken')) {
            return;
        }
        this.takeAction('actRemoveToken', {
            id,
        });
    }
    activateToken(id) {
        this.takeAction('actActivateToken', {
            id,
        });
    }
    killToken(type, id) {
        if (!this.bga.actions.checkAction('actKillToken')) {
            return;
        }
        this.takeAction('actKillToken', {
            type,
            id,
        });
    }
    disableToken(symbol) {
        if (!this.bga.actions.checkAction('actDisableToken')) {
            return;
        }
        this.takeAction('actDisableToken', {
            symbol,
        });
    }
    cancelToken() {
        if (!this.bga.actions.checkAction('actCancelToken')) {
            return;
        }
        this.takeAction('actCancelToken');
    }
    discardCompanionSpell(type, id) {
        if (!this.bga.actions.checkAction('actDiscardCompanionSpell')) {
            return;
        }
        this.takeAction('actDiscardCompanionSpell', {
            type,
            id,
        });
    }
    cancelDiscardCompanionSpell() {
        if (!this.bga.actions.checkAction('actCancelDiscardCompanionSpell')) {
            return;
        }
        this.takeAction('actCancelDiscardCompanionSpell');
    }
    move(destination, from) {
        if (!this.bga.actions.checkAction('actMove')) {
            return;
        }
        this.takeNoLockAction('actMove', {
            destination,
            from,
        });
    }
    placeEncampment() {
        if (!this.bga.actions.checkAction('actPlaceEncampment')) {
            return;
        }
        this.takeNoLockAction('actPlaceEncampment');
    }
    endTurn() {
        if (!this.bga.actions.checkAction('actEndTurn')) {
            return;
        }
        this.takeNoLockAction('actEndTurn');
    }
    takeAction(action, data) {
        data = data || {};
        this.bga.actions.performAction(action, data, { checkAction: false });
    }
    takeNoLockAction(action, data) {
        data = data || {};
        this.bga.actions.performAction(action, data, { checkAction: false, lock: false });
    }
    setPoints(playerId, points) {
        this.bga.playerPanels.getScoreCounter(playerId).toValue(points);
        this.board.setPoints(playerId, points);
    }
    limitCounterToZero(counter) {
        if (counter && counter.getValue() < 0) {
            counter.toValue(0);
        }
    }
    incRerolls(playerId, rerolls) {
        this.rerollCounters[playerId]?.incValue(rerolls);
        this.limitCounterToZero(this.rerollCounters[playerId]);
        this.getPlayerTable(playerId)?.setTokens('reroll', this.rerollCounters[playerId]?.getValue());
    }
    incFootprints(playerId, footprints) {
        this.footprintCounters[playerId]?.incValue(footprints);
        this.limitCounterToZero(this.footprintCounters[playerId]);
        this.getPlayerTable(playerId)?.setTokens('footprint', this.footprintCounters[playerId]?.getValue());
    }
    incFireflies(playerId, fireflies) {
        this.fireflyCounters[playerId]?.incValue(fireflies);
        this.limitCounterToZero(this.fireflyCounters[playerId]);
        this.fireflyTokenCounters[playerId] += fireflies;
        this.updateFireflyCounterIcon(playerId);
        this.getPlayerTable(playerId)?.setTokens('firefly', this.fireflyTokenCounters[playerId]);
    }
    addHelp() {
        document.getElementById('left-side').insertAdjacentHTML('beforeend', `<button id="glow-help-button">?</button>`);
        document.getElementById('glow-help-button').addEventListener('click', () => this.showHelp());
    }
    showHelp() {
        if (!this.helpDialog) {
            this.helpDialog = new LegacyPopinDialog();
            this.helpDialog.create('glowHelpDialog');
            this.helpDialog.setTitle(_("Cards help"));
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
                your modules/php/Game.php file.

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
            ['meepleMoved', 1],
            ['takeSketalDie', ANIMATION_MS],
            ['removeSketalDie', ANIMATION_MS],
            ['moveBlackDie', ANIMATION_MS],
            ['giveHiddenSpells', ANIMATION_MS],
            ['revealSpells', ANIMATION_MS],
            ['removeSpell', ANIMATION_MS],
            ['updateSoloTiles', ANIMATION_MS],
            ['resolveCardUpdate', 1],
            ['usedDice', 1],
            ['points', 1],
            ['rerolls', 1],
            ['footprints', 1],
            ['fireflies', 1],
            ['lastTurn', 1],
            ['newFirstPlayer', 1],
            ['newDay', 2500],
            ['setTomDice', 1],
            ['setTableDice', 1],
            ['getTokens', ANIMATION_MS],
            ['removeToken', ANIMATION_MS],
            ['scoreBeforeEnd', SCORE_MS],
            ['scoreCards', SCORE_MS],
            ['scoreBoard', SCORE_MS],
            ['scoreFireflies', SCORE_MS],
            ['scoreFootprints', SCORE_MS],
            ['scoreTokens', SCORE_MS],
            ['scoreAfterEnd', SCORE_MS],
        ];
        notifs.forEach((notif) => {
            legacyDojo.subscribe(notif[0], (...args) => this[`notif_${notif[0]}`](...args));
            this.bga.gameui.notifqueue.setSynchronous(notif[0], notif[1]);
        });
    }
    notif_chosenAdventurer(notif) {
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
        setTimeout(() => playerTable.sortDice(), ANIMATION_MS);
    }
    notif_chosenCompanion(notif) {
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
    notif_removeCompanion(notif) {
        const companion = notif.args.companion;
        if (notif.args.spot) {
            this.meetingTrack.removeCompanion(notif.args.spot);
        }
        else {
            const playerId = notif.args.playerId;
            const playerTable = this.getPlayerTable(playerId);
            playerTable.removeCompanion(companion, notif.args.removedBySpell, notif.args.ignoreCemetary);
            if (companion?.fireflies) {
                this.fireflyCounters[playerId].incValue(-companion.fireflies);
            }
            this.companionCounters[playerId].incValue(-1);
            this.updateFireflyCounterIcon(playerId);
        }
        if (!notif.args.ignoreCemetary) {
            this.meetingTrack.setDeckTop(CEMETERY, notif.args.companion?.type);
        }
    }
    notif_removeCompanions(notif) {
        this.meetingTrack.removeCompanions();
        this.meetingTrack.setDeckTop(CEMETERY, notif.args.topCemeteryType);
    }
    notif_takeSketalDie(notif) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.addDice([notif.args.die]);
    }
    notif_removeSketalDie(notif) {
        if (notif.args.remove) {
            this.getDieDiv(notif.args.die).remove();
        }
        else {
            this.createOrMoveDie(notif.args.die, 'table-dice');
        }
    }
    notif_points(notif) {
        this.setPoints(notif.args.playerId, notif.args.newScore);
        if (notif.args.company !== undefined) {
            this.board.setTomCompany(notif.args.company);
        }
    }
    notif_rerolls(notif) {
        this.incRerolls(notif.args.playerId, notif.args.rerolls);
    }
    notif_footprints(notif) {
        this.incFootprints(notif.args.playerId, notif.args.footprints);
    }
    notif_fireflies(notif) {
        this.incFireflies(notif.args.playerId, notif.args.fireflies);
    }
    notif_newFirstPlayer(notif) {
        this.placeFirstPlayerToken(notif.args.playerId);
    }
    notif_newDay(notif) {
        const day = notif.args.day;
        if (!this.roundCounter) {
            this.roundCounter = new LegacyCounter();
            this.roundCounter.create('round-counter');
            this.roundCounter.setValue(day);
        }
        else {
            this.roundCounter.toValue(day);
        }
        document.body.insertAdjacentHTML('beforeend', `<div id="new-day"><span>${_(notif.log).replace('${day}', '' + notif.args.day)}</span></div>`);
        const div = document.getElementById(`new-day`);
        div.addEventListener('animationend', () => div?.remove());
        div.classList.add('new-day-animation');
    }
    notif_replaceSmallDice(notif) {
        this.meetingTrack.placeSmallDice(notif.args.dice);
    }
    notif_diceRolled(notif) {
        this.diceChangedOrRolled(notif.args.dice, false, notif.args.args, notif.args.playerId);
        setTimeout(() => this.getPlayerTable(notif.args.playerId).sortDice(), ANIMATION_MS + 1000);
    }
    notif_diceChanged(notif) {
        this.diceChangedOrRolled(notif.args.dice, true, notif.args.args, notif.args.playerId);
        setTimeout(() => this.getPlayerTable(notif.args.playerId).sortDice(), ANIMATION_MS + 1000);
    }
    notif_resolveCardUpdate(notif) {
        this.gamedatas.gamestate.args[this.getPlayerId()] = notif.args.resolveCardsForPlayer;
        this.onEnteringStateResolveCards();
    }
    notif_usedDice(notif) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.setUsedDie(notif.args.dieId);
    }
    notif_meepleMoved(notif) {
        this.board.moveMeeple(notif.args.meeple);
    }
    notif_moveBlackDie(notif) {
        this.meetingTrack.placeSmallDice([notif.args.die]);
    }
    notif_giveHiddenSpells(notif) {
        Object.keys(notif.args.spellsIds).forEach(playerId => {
            const playerTable = this.getPlayerTable(Number(playerId));
            playerTable.addHiddenSpell(notif.args.spellsIds[Number(playerId)], notif.args.playerId);
        });
    }
    notif_footprintAdded(notif) {
        this.meetingTrack.setFootprintTokens(notif.args.spot, notif.args.number);
    }
    notif_revealSpells(notif) {
        notif.args.spells.forEach(spell => {
            const playerTable = this.getPlayerTable(Number(spell.location_arg));
            playerTable.revealSpell(spell);
        });
    }
    notif_removeSpell(notif) {
        const playerTable = this.getPlayerTable(notif.args.playerId);
        playerTable.removeSpell(notif.args.spell);
    }
    notif_setTomDice(notif) {
        this.setTomDice(notif.args.dice);
        const newPlayerColor = notif.args.newPlayerColor;
        document.getElementById(`player_name_0`).style.color = `#${newPlayerColor}`;
        this.board.setColor(0, newPlayerColor);
        this.gamedatas.tom.color = newPlayerColor;
    }
    notif_updateSoloTiles(notif) {
        this.meetingTrack.updateSoloTiles(notif.args);
    }
    notif_setTableDice(notif) {
        notif.args.dice.forEach(die => this.createOrMoveDie(die, `table-dice`));
    }
    notif_getTokens(notif) {
        const { tokens, playerId } = notif.args;
        this.playersTokens[playerId].addCards(tokens);
        tokens.forEach(token => this.tokensManager.getCardElement(token)?.classList.add('new-token'));
        tokens.filter(token => token.type == 2).forEach(token => setTimeout(() => this.tokensManager.getCardElement(token).classList.add('applied-token'), 5000));
    }
    notif_removeToken(notif) {
        this.playersTokens[notif.args.playerId].removeCard({ id: notif.args.tokenId });
    }
    notif_lastTurn() {
        if (document.getElementById('last-round')) {
            return;
        }
        document.getElementById('page-title').insertAdjacentHTML('beforeend', `<div id="last-round">
            ${_("This is the last round of the game!")}
        </div>`);
    }
    setScore(playerId, column, score) {
        const cell = document.getElementById(`score${playerId}`).getElementsByTagName('td')[column];
        cell.innerHTML = `${score}`;
    }
    notif_scoreBeforeEnd(notif) {
        log('notif_scoreBeforeEnd', notif.args);
        this.setScore(notif.args.playerId, 1, notif.args.points);
    }
    notif_scoreCards(notif) {
        log('notif_scoreCards', notif.args);
        this.setScore(notif.args.playerId, 2, notif.args.points);
    }
    notif_scoreBoard(notif) {
        log('notif_scoreBoard', notif.args);
        this.setScore(notif.args.playerId, 3, notif.args.points);
    }
    notif_scoreFireflies(notif) {
        log('notif_scoreFireflies', notif.args);
        this.setScore(notif.args.playerId, 4, notif.args.points);
    }
    notif_scoreFootprints(notif) {
        log('notif_scoreFootprints', notif.args);
        this.setScore(notif.args.playerId, 5, notif.args.points);
    }
    notif_scoreTokens(notif) {
        log('notif_scoreTokens', notif.args);
        this.setScore(notif.args.playerId, 6, notif.args.points);
    }
    notif_scoreAfterEnd(notif) {
        log('notif_scoreAfterEnd', notif.args);
        this.setScore(notif.args.playerId, this.gamedatas.tokensActivated ? 7 : 6, notif.args.points);
    }
    getColor(color) {
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
    bgaFormatText(log, args) {
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
        }
        catch (e) {
            console.error(log, args, "Exception thrown", e.stack);
        }
        return { log, args };
    }
}

export { Game };
