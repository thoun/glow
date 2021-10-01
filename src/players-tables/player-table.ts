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
                <div class="player-name" style="color: #${player.color};">${player.name}</div>
                <div id="player-table-${this.playerId}-dice" class="player-table-dice"></div>
                <div id="player-table-${this.playerId}-spells" class="player-table-spells"></div>
            </div>
            <div class="adventurer-and-companions">
                <div id="player-table-${this.playerId}-adventurer"></div>
                <div id="player-table-${this.playerId}-companions"></div>
            </div>
        </div>`;

        dojo.place(html, this.playerId === this.game.getPlayerId() ? 'currentplayertable' : 'playerstables');

        // adventurer        

        this.adventurerStock = new ebg.stock() as Stock;
        this.adventurerStock.setSelectionAppearance('class');
        this.adventurerStock.selectionClass = 'selected';
        this.adventurerStock.create(this.game, $(`player-table-${this.playerId}-adventurer`), CARD_WIDTH, CARD_HEIGHT);
        this.adventurerStock.setSelectionMode(0);
        dojo.connect(this.adventurerStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.adventurerStock.getSelectedItems().length) {
                this.game.resolveCard(0, Number(itemId));
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
                this.game.resolveCard(1, Number(itemId));
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
        dojo.connect(this.spellsStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.spellsStock.getSelectedItems().length) {
                this.game.resolveCard(2, Number(itemId));
            }
            this.spellsStock.unselectAll();
        });
        setupSpellCards(this.spellsStock);

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
        dojo.connect(this.companionSpellStock, 'onChangeSelection', this, (_, itemId: string) => {
            if (this.companionSpellStock.getSelectedItems().length) {
                this.game.resolveCard(2, Number(itemId));
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
        this.companionsStock.removeFromStockById(''+companion.id, CEMETERY);
        
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
    }

    public removeSpell(spell: Spell) {
        this.spellsStock.removeFromStockById(''+spell.id);
        if (spell.type === 3) {
            this.companionSpellStock?.removeFromStockById(''+spell.id);
            this.removeCompanionSpellStock();
        }
    }
}