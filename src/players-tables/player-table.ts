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
    public playerId: number;
    public adventurerStock: Stock;
    public companionsStock: Stock;
    public spellsStock: Stock;
    public companionSpellStock?: Stock;

    constructor(
        private game: GlowGame, 
        player: GlowPlayer) {

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
        for (let i=1; i<=8; i++) { html += `<div id="player-table-${this.playerId}-dice-grid-symbol${i}-th" class="hidden th-symbol th-symbol${i}"><div class="icon symbol${i}"></div><sub id="player-table-${this.playerId}-dice-grid-symbol${i}-counter"></sub></div>`; }
        for (let i=1; i<=8; i++) { html += `<div id="player-table-${this.playerId}-dice-grid-symbol${i}" class="hidden"></div>`; }
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

        dojo.place(html, this.playerId === this.game.getPlayerId() ? 'currentplayertable' : 'playerstables');

        // adventurer        

        this.adventurerStock = new ebg.stock() as Stock;
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game, $(`player-table-${this.playerId}-adventurer`), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        this.adventurerStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupAdventurerCard(game, cardDiv, type);
        dojo.connect(this.adventurerStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.adventurerStock.getSelectedItems().length) {
                this.game.cardClick(0, Number(itemId));
            }
            this.adventurerStock.unselectAll();
        });
        setupAdventurersCards(this.adventurerStock);

        if (player.adventurer) {
            this.adventurerStock.addToStockWithId(player.adventurer.color, ''+player.adventurer.id);
            this.addMouseEvents(this.adventurerStock, player.adventurer);
        }

        // companions

        this.companionsStock = new ebg.stock() as Stock;
        this.companionsStock.setSelectionAppearance('class');
        this.companionsStock.selectionClass = 'selected';
        this.companionsStock.create(this.game, $(`player-table-${this.playerId}-companions`), CARD_WIDTH, CARD_HEIGHT);
        this.companionsStock.setSelectionMode(0);
        this.companionsStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupCompanionCard(game, cardDiv, type);
        dojo.connect(this.companionsStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.companionsStock.getSelectedItems().length) {
                this.game.cardClick(1, Number(itemId));
            }
            this.companionsStock.unselectAll();
        });
        setupCompanionCards(this.companionsStock);

        const newWeights = {};
        player.companions.forEach(card => newWeights[card.subType] = card.location_arg);
        this.companionsStock.changeItemsWeight(newWeights);

        player.companions.forEach(companion => {
            this.companionsStock.addToStockWithId(companion.subType, ''+companion.id);
            this.addMouseEvents(this.companionsStock, companion);
        });

        // spells

        this.spellsStock = new ebg.stock() as Stock;
        this.spellsStock.setSelectionAppearance('class');
        this.spellsStock.selectionClass = 'selected';
        this.spellsStock.create(this.game, $(`player-table-${this.playerId}-spells`), SPELL_DIAMETER, SPELL_DIAMETER);
        this.spellsStock.setSelectionMode(0);
        this.spellsStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupSpellCard(game, cardDiv, type);
        dojo.connect(this.spellsStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.spellsStock.getSelectedItems().length) {
                this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            this.spellsStock.unselectAll();
        });
        setupSpellCards(this.spellsStock);

        dojo.toggleClass(`player-table-${this.playerId}-spells`, 'hidden', player.spells.filter(spell => spell.type != 3 || !spell.visible).length == 0);
        player.spells.forEach(spell => {
            if (spell.visible) {
                this.revealSpell(spell, true);
            } else {
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
            (game as any).addTooltipHtml(`player-table-${this.playerId}-symbol-count`, _('Number of different element symbols on dice. The special symbols do not count.'));
        }        
    }

    private getLastCompanionId() {
        return this.companionsStock.items[this.companionsStock.items.length - 1]?.id;
    }

    private createCompanionSpellStock() {
        if (this.companionSpellStock) {
            return;
        }

        const lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }

        dojo.place(`
            <div id="player-table-${this.playerId}-companion-spell" class="player-table-companion-spell"></div>
        `, `${this.companionsStock.container_div.id}_item_${lastItemId}`);

        this.companionSpellStock = new ebg.stock() as Stock;
        this.companionSpellStock.centerItems = true;
        this.companionSpellStock.setSelectionAppearance('class');
        this.companionSpellStock.selectionClass = 'selected';
        this.companionSpellStock.create(this.game, $(`player-table-${this.playerId}-companion-spell`), SPELL_DIAMETER, SPELL_DIAMETER);
        this.companionSpellStock.setSelectionMode(0);
        this.companionSpellStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupSpellCard(this.game, cardDiv, type);
        dojo.connect(this.companionSpellStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.companionSpellStock.getSelectedItems().length) {
                this.game.cardClick(2, Number(itemId.replace('hidden', '')));
            }
            this.companionSpellStock.unselectAll();
        });
        setupSpellCards(this.companionSpellStock);
    }

    private removeCompanionSpellStock() {
        dojo.destroy(`player-table-${this.playerId}-companion-spell`);
        this.companionSpellStock = null;
    }
    
    private moveCompanionSpellStock() {
        const lastItemId = this.getLastCompanionId();
        if (!lastItemId) {
            return;
        }

        if (this.companionSpellStock) {
            document.getElementById(`${this.companionsStock.container_div.id}_item_${lastItemId}`).appendChild(
                document.getElementById(`player-table-${this.playerId}-companion-spell`)
            );
        }
    }

    public setAdventurer(adventurer: Adventurer) {
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, ''+adventurer.id);
        this.addMouseEvents(this.adventurerStock, adventurer);
    }
    
    public addCompanion(companion: Companion, from?: Stock) {
        const newWeights = {};
        newWeights[companion.subType] = companion.location_arg;
        this.companionsStock.changeItemsWeight(newWeights);

        if (from) {
            moveToAnotherStock(from, this.companionsStock, companion.subType, ''+companion.id);
        } else {
            this.companionsStock.addToStockWithId(companion.subType, ''+companion.id);
        }
        this.moveCompanionSpellStock();
        this.addMouseEvents(this.companionsStock, companion);

        this.game.tableHeightChange();
    }
    
    public addDice(dice: Die[]) {
        dice.forEach(die => this.game.createOrMoveDie(die, `player-table-${this.playerId}-dice`));
            
        setTimeout(() => this.sortDice(), 1000);
    }

    public removeDice(dice: Die[]) {
        dice.forEach(die => (this.game as any).fadeOutAndDestroy(`die${die.id}`));
    }
    
    public removeCompanion(companion: Companion, removedBySpell?: Spell, ignoreCemetary: boolean = false) {
        const id = `${this.companionsStock.container_div.id}_item_${companion.id}`;
        const card = document.getElementById(id);
        this.companionsStock.removeFromStockById(''+companion.id, ignoreCemetary ? CEMETERY : undefined);
        if (card) {
            card.classList.add('flipped');
            setTimeout(() => card.style.visibility = 'hidden', 500);
        }        
        
        if (removedBySpell) {
            this.removeSpell(removedBySpell);
        } else {
            this.moveCompanionSpellStock();
        }

        this.game.tableHeightChange();
    }

    public setUsedDie(dieId: number) {
        dojo.addClass(`die${dieId}`, 'used');
    }
    
    public clearUsedDice() {
        (Array.from(document.getElementsByClassName('die')) as HTMLElement[]).forEach(die => dojo.removeClass(die, 'used'));
    }

    public addHiddenSpell(id: number, fromPlayerId: number = undefined) {
        dojo.removeClass(`player-table-${this.playerId}-spells`, 'hidden');
        this.spellsStock.addToStockWithId(0, 'hidden'+id, fromPlayerId ? `overall_player_board_${fromPlayerId}` : undefined);
    }

    public revealSpell(spell: Spell, tableCreation: boolean = false) {
        let stock = this.spellsStock;
        if (spell.type === 3) {
            this.createCompanionSpellStock();
            stock = this.companionSpellStock;
        }
        
        const hiddenSpellId = `${this.spellsStock.container_div.id}_item_hidden${spell.id}`;
        stock.addToStockWithId(spell.type, ''+spell.id, document.getElementById(hiddenSpellId) ? hiddenSpellId : undefined );
        if (!tableCreation) {
            this.spellsStock.removeFromStockById('hidden'+spell.id);
        }
        dojo.toggleClass(`player-table-${this.playerId}-spells`, 'hidden', this.spellsStock.items.length == 0);
    }

    public removeSpell(spell: Spell) {
        this.spellsStock.removeFromStockById('hidden'+spell.id);
        this.spellsStock.removeFromStockById(''+spell.id);
        if (spell.type === 3) {
            this.companionSpellStock?.removeFromStockById('hidden'+spell.id);
            this.companionSpellStock?.removeFromStockById(''+spell.id);
            this.removeCompanionSpellStock();
        }
        dojo.toggleClass(`player-table-${this.playerId}-spells`, 'hidden', this.spellsStock.items.length == 0);
    }
    
    public setColor(newPlayerColor: string) {
        document.getElementById(`player-table-${this.playerId}-name`).style.backgroundColor = `#${newPlayerColor}`;
    }

    public setTokens(type: 'reroll' | 'footprint' | 'firefly', number: number) {
        const zone = document.getElementById(`player-table-${this.playerId}-${type}-tokens`) as HTMLDivElement;
        while (zone.childElementCount > number) {
            zone.removeChild(zone.lastChild);
        }
        for (let i = zone.childElementCount; i<number; i++) {
            dojo.place(`<div class="round-token ${type}"></div>`, zone.id);
        }
    }
    
    private addMouseEvents(stock: Stock, companionOrAdventurer: Companion | Adventurer) {
        const div = document.getElementById(`${stock.container_div.id}_item_${companionOrAdventurer.id}`);
        const diceDiv = document.getElementById(`player-table-${this.playerId}`) as HTMLDivElement;     

        div.addEventListener('mouseenter', () => this.highlightDice(diceDiv, companionOrAdventurer.effect?.conditions));
        div.addEventListener('mouseleave', () => this.unhighlightDice(diceDiv));
    }

    private highlightDice(diceDiv: HTMLDivElement, conditions: number[]) {
        if (!conditions) {
            return;
        }
        const highlightConditions = conditions.filter(condition => condition > -10 && condition < 10);
        if (!highlightConditions.length) {
            return;
        }
        const dice = Array.from(diceDiv.querySelectorAll('.die')) as HTMLDivElement[];
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

    private unhighlightDice(diceDiv: HTMLDivElement) {
        const dice = Array.from(diceDiv.querySelectorAll('.die')) as HTMLDivElement[];
        dice.forEach(die => die.classList.remove('highlight-green', 'highlight-red'));
    }
    
    public sortDice(): void {
        const diceDiv = document.getElementById(`player-table-${this.playerId}`);
        const dice = Array.from(diceDiv.querySelectorAll('.die')) as HTMLDivElement[];
        let columns = 0;
        let symbolCount = 0;
        for (let i = 1; i <= 8; i++) {
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
        document.getElementById(`player-table-${this.playerId}-dice-grid`).style.gridTemplateColumns = `repeat(${columns}, auto)`;

        if (this.game.getBoardSide() === 2 || this.game.isExpansion()) {
            document.getElementById(`player-table-${this.playerId}-symbol-count`).innerHTML = ''+symbolCount;
        }

        this.setForbidden();
    }
    
    public setForbidden(): void {
        const diceDiv = document.getElementById(`player-table-${this.playerId}`);
        const dice = Array.from(diceDiv.querySelectorAll('.die')) as HTMLDivElement[];
        for (let i = 1; i <= 8; i++) {
            const valueDice = dice.filter(die => SYMBOL_INDEX_TO_DIE_VALUE[Number(die.dataset.dieValue)] === i);
            if (valueDice.length) {
                const forbidden = valueDice.some(die => die.dataset.dieColor == '8') && i <= 5;
                valueDice.forEach(die => {
                    die.classList.toggle('forbidden', forbidden && die.dataset.dieColor != '8');
                });
            }
        }
    }
}