/*declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;*/

const CARD_WIDTH = 129;
const CARD_HEIGHT = 240;

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
COMPANION_POINTS[101] = 2;
COMPANION_POINTS[102] = -1;
COMPANION_POINTS[103] = -1;
COMPANION_POINTS[104] = -1;
COMPANION_POINTS[106] = 1;
COMPANION_POINTS[107] = '?';
COMPANION_POINTS[108] = 4;
COMPANION_POINTS[201] = -3;
COMPANION_POINTS[205] = 3;
COMPANION_POINTS[207] = 2;
COMPANION_POINTS[208] = 2;
COMPANION_POINTS[301] = -3;
COMPANION_POINTS[303] = 6;
COMPANION_POINTS[306] = 3;
COMPANION_POINTS[307] = 1;
COMPANION_POINTS[308] = 3;

function setupAdventurersCards(adventurerStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/adventurers.png`;
    const cardsurlExpansion = `${g_gamethemeurl}img/adventurers-expansion1.png`;

    for (let i=0; i<=11;i++) {
        adventurerStock.addItemType(
            i, 
            i, 
            i > 7 ? cardsurlExpansion : cardsurl, 
            i
        );
    }
}

function setupCompanionCards(companionsStock: Stock) {
    companionsStock.image_items_per_row = 10;

    const cardsurl = `${g_gamethemeurl}img/companions.png`;

    for (let subType=1; subType<=46;subType++) {
        companionsStock.addItemType(
            subType, 
            0, 
            cardsurl, 
            subType + (subType > 23 ? 1 : 0)
        );
    }

    for (let module=1; module<=3;module++) {
        const cardsurl = `${g_gamethemeurl}img/companions-expansion1-set${module}.png`;
        for (let subType=1; subType<=8;subType++) {
            companionsStock.addItemType(
                module*100 + subType, 
                0, 
                cardsurl, 
                subType - 1
            );
        }
    }

    companionsStock.addItemType(1001,  0, cardsurl, 0);
    companionsStock.addItemType(1002,  0, cardsurl, 24);
}

function setupSpellCards(spellsStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/spells.png`;

    for (let type=1; type<=7;type++) {
        spellsStock.addItemType(
            type, 
            type, 
            cardsurl, 
            type
        );
    }

    spellsStock.addItemType(0,  0, cardsurl, 0);
}

function setupSoloTileCards(soloTilesStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/solo-tiles.png`;

    for (let type=1; type<=8;type++) {
        soloTilesStock.addItemType(
            type, 
            type, 
            cardsurl, 
            type - 1
        );
    }

    soloTilesStock.addItemType(0,  0, cardsurl, 0);
}

function getEffectExplanation(effect: number) {    
    if (effect > 100 && effect < 200) {
        return dojo.string.substitute(_("Earn ${points} burst(s) of light."), { points: `<strong>${effect - 100}</strong>` });
    } else if (effect < -100 && effect > -200) {
        return dojo.string.substitute(_("Lose ${points} burst(s) of light."), { points: `<strong>${-(effect + 100)}</strong>` });
    }

    else if (effect > 20 && effect < 30) {
        return dojo.string.substitute(_("Earn ${footprints} footprint(s)."), { footprints: `<strong>${effect - 20}</strong>` });
    } else if (effect < -20 && effect > -30) {
        return dojo.string.substitute(_("Lose ${footprints} footprint(s)."), { footprints: `<strong>${-(effect + 20)}</strong>` });
    }

    else if (effect > 10 && effect < 20) {
        return dojo.string.substitute(_("Earn ${fireflies} firefly(ies)."), { fireflies: `<strong>${effect - 10}</strong>` });
    }

    else if (effect > 40 && effect < 50) {
        return dojo.string.substitute(_("Earn ${rerolls} reroll token(s)."), { rerolls: `<strong>${effect - 40}</strong>` });
    } else if (effect < -40 && effect > -50) {
        return dojo.string.substitute(_("Lose ${rerolls} reroll token(s)."), { rerolls: `<strong>${-(effect + 40)}</strong>` });
    }

    else if (effect == 50) {
        return _("Earn 1 token and place back 1 token in front of the bag");
    } else if (effect > 50 && effect < 60) {
        return dojo.string.substitute(_("Earn ${tokens} token(s)."), { tokens: `<strong>${effect - 50}</strong>` });
    } else if (effect < -50 && effect > -60) {
        return dojo.string.substitute(_("Lose ${tokens} token(s)."), { tokens: `<strong>${-(effect + 50)}</strong>` });
    }

    else if (effect === 33) {
        return _("The companion is immediately placed in the cemetery.");
    }
}

function getEffectTooltip(effect: Effect) {
    if (!effect) {
        return null;
    }

    let conditions = null;
    if (effect.conditions.every(condition => condition > 200) && effect.conditions.length == 2) {
        const message = effect.conditions[0] == effect.conditions[1] ?
            _("Exactly ${min} different element symbols on dice triggers the effect.") :
            _("Between ${min} and ${max} different element symbols on dice triggers the effect.");

        conditions = dojo.string.substitute(message, { 
            min: `<strong>${effect.conditions[0] - 200}</strong>` ,
            max: `<strong>${effect.conditions[1] - 200}</strong>` ,
        });
    } else if (effect.conditions.every(condition => condition > 0)) {
        conditions = dojo.string.substitute(_("${symbols} triggers the effect."), { 
            symbols: formatTextIcons(effect.conditions.map(condition => `[symbol${condition}]`).join('')) 
        });
    } else if (effect.conditions.every(condition => condition == 0)) {
        conditions = dojo.string.substitute(formatTextIcons(effect.conditions.map(_ => `[symbol0]`).join('')) + ' : ' + _("any ${number} identical symbols."), { 
            number: `<strong>${effect.conditions.length}</strong>` 
        });
    } else if (effect.conditions.every(condition => condition < 0)) {
        conditions = dojo.string.substitute(_("If the symbols ${symbols} are not present on any of the dice, the effect is triggered."), { 
            symbols: formatTextIcons(effect.conditions.map(condition => `[symbol${-condition}]`).join('')) 
        });
    } else if (effect.conditions.some(condition => condition > 0) && effect.conditions.some(condition => condition < 0)) {
        conditions = dojo.string.substitute(_("If the symbols ${forbiddenSymbols} are not present on any of the dice, ${symbols} triggers the effect."), { 
            forbiddenSymbols: formatTextIcons(effect.conditions.filter(condition => condition < 0).map(condition => `[symbol${-condition}]`).join('')),  
            symbols: formatTextIcons(effect.conditions.filter(condition => condition > 0).map(condition => `[symbol${condition}]`).join('')) ,
        });
    }
    
    return `
    <div class="tooltip-effect-title">${_("Conditions")}</div>
    ${conditions}
    <hr>
    <div class="tooltip-effect-title">${_("Effects")}</div>
    ${effect.effects.map(effect => getEffectExplanation(effect)).join('<br>')}
    `;
}

function getAdventurerTooltip(type: number) {
    switch (type) {
        //case 11: return `<p>${_(`Uriom has 2 special small yellow dice that are available only for Uriom`)}</p>`; // TODO
    }
    return null;
}

function setupAdventurerCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    const adventurer = ((game as any).gamedatas as GlowGamedatas).ADVENTURERS[type];
    const tooltip = getEffectTooltip(adventurer.effect);
    const adventurerTooltip = getAdventurerTooltip(type);
    (game as any).addTooltipHtml(cardDiv.id, `<h3>${adventurer.name}</h3>${tooltip || ''}${tooltip && adventurerTooltip ? '<hr>' : ''}${adventurerTooltip || ''}`);

    const adventurerPoints = ADVENTURERS_POINTS[type];
    if (adventurerPoints) {
        dojo.place(`<div class="score-contrast">${adventurerPoints}</div>`, cardDiv);
    }
}

function getCompanionTooltip(type: number) {
    switch (type) {
        case 13: case 14: case 15: case 16: case 17: case 44: return `<p>` + _(`If the player chooses a Sketal, they immediately take an additional large die from the reserve pool in the color indicated by its power. The Sketal, whose power is a multicolored die, allows the player to take a large die of their choice from those available in the reserve pool. If there are none, it has no effect. If the player forgets to take the die, they can take in a following round. If a Sketal is sent to the cemetery, the corresponding die is replaced in the reserve pool.`) + `</p>`;

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
        <p style="color: #D4111F;">` + _(`<b>Important:</b> the black die remains in play until the end of the game, even if Kaar is sent to the cemetery.`) + `</p>`
        
        case 41: return `<p>` + _(`If the player obtains an air symbol, they immediately discard Cromaug and can take another companion of their choice from the cemetery that they place in front of them. The chosen companion becomes the last companion to be recruited.`) + `</p>
        <p>` + _(`If it is a Sketal, they take the additional die indicated by its power, if it is available in the reserve pool, and can roll it from the next round. If it is Kaar, the black die comes into play.`) + `</p>
        <p>` + _(`If the previously obtained result of the dice allows it, they can immediately trigger the effect of this new companion.`) + `</p>`;

        case 107: return `<p>` + _(`go back to 10VP (record how many VP you went back), play normally and retrieve your VPs at the end.`) + `</p>`; // TODO
    }
    return null;
}

function setupCompanionCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    const companion = ((game as any).gamedatas as GlowGamedatas).COMPANIONS[type];
    const tooltip = getEffectTooltip(companion.effect);
    const companionTooltip = getCompanionTooltip(type);
    (game as any).addTooltipHtml(cardDiv.id, `<h3>${companion.name}</h3>${tooltip || ''}${tooltip && companionTooltip ? '<hr>' : ''}${companionTooltip || ''}`);

    cardDiv.classList.add('card-inner');
    dojo.place(`<div class="card-front" style="${cardDiv.attributes.getNamedItem('style').nodeValue.replace(/"/g, '\'')}"></div>`, cardDiv);
    dojo.place(`<div class="card-back back${type > 23 ? 'B' : 'A'}"></div>`, cardDiv);

    const companionPoints = COMPANION_POINTS[type];
    if (companionPoints) {
        dojo.place(`<div class="score-contrast ${companionPoints < 0 ? 'score-contrast-glow' : ''}">${Math.abs(companionPoints)}</div>`, cardDiv);
        dojo.place(`<div class="score-contrast ${companionPoints < 0 ? 'score-contrast-glow' : ''}">${Math.abs(companionPoints)}</div>`, cardDiv.getElementsByClassName('card-front')[0] as HTMLElement);
    }
}

function setupSpellCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    const tooltip = getEffectTooltip(((game as any).gamedatas as GlowGamedatas).SPELLS_EFFECTS[type]);
    if (tooltip) {
        (game as any).addTooltipHtml(cardDiv.id, tooltip);
    }
}

function setupSoloTileCard(game: GlowGame, cardDiv: HTMLDivElement, type: number) {
    const effect = ((game as any).gamedatas as GlowGamedatas).SOLO_TILES[type];

    let html = ``;

    if (effect.moveCompany > 0) {
        html += `<div>${dojo.string.substitute(_("Move Tom’s band token forward ${spaces} spaces. Then Tom’s score token is moved the number of spaces corresponding to the band token’s position on the score track."), { spaces: `<strong>${effect.moveCompany}</strong>` })}</div>`;
    }

    if (effect.moveScore > 0) {
        html += `<div>${dojo.string.substitute(_("Move Tom’s score token forward ${number} shards of light"), { number: `<strong>${effect.moveScore}</strong>` })}</div>`;
    }

    if (effect.moveMeeple > 0) {
        const side = game.getBoardSide();
        if (side == 1) {
            html += `<div>${_("Move Tom’s camp to the village with a higher number of shards of light.")}</div>`;
        } else if (side == 2) {
            html += `<div>${dojo.string.substitute(_("Move one of Tom’s boats via the path by the ${lowesthighest} value"), { lowesthighest: effect.moveMeeple == 2 ? _("highest") : _("lowest") })}</div>`;
        }
    }

    if (html != ``) {
        (game as any).addTooltipHtml(cardDiv.id, html);
    }
}

function moveToAnotherStock(sourceStock: Stock, destinationStock: Stock, uniqueId: number, cardId: string) {
    if (sourceStock === destinationStock) {
        return;
    }
    
    const sourceStockItemId = `${sourceStock.container_div.id}_item_${cardId}`;    

    if (document.getElementById(sourceStockItemId)) {        
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStockItemId);
        sourceStock.removeFromStockById(cardId);
    } else {
        console.warn(`${sourceStockItemId} not found in `, sourceStock);
        destinationStock.addToStockWithId(uniqueId, cardId, sourceStock.container_div.id);
    }

    const destinationDiv = document.getElementById(`${destinationStock.container_div.id}_item_${cardId}`);
    destinationDiv.style.zIndex = '10';
    setTimeout(() => destinationDiv.style.zIndex = 'unset', 1000);
}

function addToStockWithId(destinationStock: Stock, uniqueId: number, cardId: string, from: string) {  

    destinationStock.addToStockWithId(uniqueId, cardId, from);

    const destinationDiv = document.getElementById(`${destinationStock.container_div.id}_item_${cardId}`);
    destinationDiv.style.zIndex = '10';
    setTimeout(() => destinationDiv.style.zIndex = 'unset', 1000);
}