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

function setupAdventurersCards(adventurerStock: Stock) {
    const cardsurl = `${g_gamethemeurl}img/adventurers.png`;

    for (let i=0; i<=7;i++) {
        adventurerStock.addItemType(
            i, 
            i, 
            cardsurl, 
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
    }
    return null;
}

function setupCompanionCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    const tooltip = getCompanionTooltip(type); // TODO add effect (same thing to spells & adventurers)
    if (tooltip) {
        (game as any).addTooltipHtml(cardDiv.id, tooltip);
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