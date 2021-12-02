const COMPANION_SPELL = 3;

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
            <div class="name-column">
                <div id="player-table-${this.playerId}-name" class="player-name" style="background-color: #${player.color};">${player.name}</div>
                <div class="player-table-tokens">
                    <div id="player-table-${this.playerId}-reroll-tokens" class="player-table-tokens-type"></div>
                    <div id="player-table-${this.playerId}-footprint-tokens" class="player-table-tokens-type"></div>
                    <div id="player-table-${this.playerId}-firefly-tokens" class="player-table-tokens-type"></div>
                </div>
                <div id="player-table-${this.playerId}-dice" class="player-table-dice"></div>
            </div>
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

        player.companions.forEach(companion => this.companionsStock.addToStockWithId(companion.subType, ''+companion.id));

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

        // tokens
        this.setTokens('reroll', player.rerolls);
        this.setTokens('footprint', player.footprints);
        this.setTokens('firefly', player.fireflies);
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
    }
    
    public addCompanion(companion: Companion, from: Stock) {
        moveToAnotherStock(from, this.companionsStock, companion.subType, ''+companion.id);
        this.moveCompanionSpellStock();
    }
    
    public addDice(dice: Die[]) {
        dice.forEach(die => this.game.createOrMoveDie(die, `player-table-${this.playerId}-dice`));
    }

    public removeDice(dice: Die[]) {
        dice.forEach(die => (this.game as any).fadeOutAndDestroy(`die${die.id}`));
    }
    
    public removeCompanion(companion: Companion, removedBySpell?: Spell) {
        const id = `${this.companionsStock.container_div.id}_item_${companion.id}`;
        const card = document.getElementById(id);
        this.companionsStock.removeFromStockById(''+companion.id, CEMETERY);
        if (card) {
            card.classList.add('flipped');
            setTimeout(() => card.style.visibility = 'hidden', 500);
        }        
        
        if (removedBySpell) {
            this.removeSpell(removedBySpell);
        } else {
            this.moveCompanionSpellStock();
        }
    }

    public setUsedDie(dieId: number) {
        dojo.addClass(`die${dieId}`, 'used');
    }
    
    public clearUsedDice() {
        (Array.from(document.getElementsByClassName('die')) as HTMLElement[]).forEach(die => dojo.removeClass(die, 'used'));
    }

    public addHiddenSpell(id: number, fromPlayerId: number = undefined) {
        dojo.addClass(`player-table-${this.playerId}-spells`, 'hidden');
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
        this.spellsStock.removeFromStockById(''+spell.id);
        if (spell.type === 3) {
            this.companionSpellStock?.removeFromStockById(''+spell.id);
            this.removeCompanionSpellStock();
        }
        dojo.toggleClass(`player-table-${this.playerId}-spells`, 'hidden', this.spellsStock.items.length == 0);
    }
    
    public setColor(newPlayerColor: string) {
        document.getElementById(`player-table-${this.playerId}-name`).style.color = `#${newPlayerColor}`;
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
}