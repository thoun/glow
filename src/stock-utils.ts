/*declare const define;
declare const ebg;
declare const $;
declare const dojo: Dojo;
declare const _;
declare const g_gamethemeurl;

declare const board: HTMLDivElement;*/

const CARD_WIDTH = 129;
const CARD_HEIGHT = 240;

const PROJECT_WIDTH = 134;
const PROJECT_HEIGHT = 93;

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

    for (let type=1; type<=2;type++) {
        for (let subType=1; subType<=23;subType++) {
            companionsStock.addItemType(
                subType, 
                0, 
                cardsurl, 
                type + (subType - 2)
            );
        }
    }
}

function getMachineTooltip(type: number) {
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

function setupMachineCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    (game as any).addTooltipHtml(cardDiv.id, getMachineTooltip(type));
}

function getProjectTooltip(type: number) {
    switch (type) {        
        // colors
        case 10: return _("You must have at least 1 machine of each color in your workshop.");
        case 11: case 12: case 13: case 14: return _("You must have at least 2 machines of the indicated color in your workshop.");

        // points
        case 20: return _("You must have at least 2 identical machines in your workshop.");
        case 21: case 22: case 23: return _("You must have at least 2 machines worth the indicated number of victory points in your workshop.");

        // resources
        case 31: case 32: case 33: case 34: case 35: case 36: case 37: case 38: return formatTextIcons(_("You must have machines in your workshop that have the indicated resources and/or charcoalium in their production zones. [resource9] resources do not count towards these objectives."));
    }
    return null;
}

function setupProjectCard(game: Game, cardDiv: HTMLDivElement, type: number) {
    (game as any).addTooltipHtml(cardDiv.id, getProjectTooltip(type));
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