const Cemetery = 'meeting-track-companion-0';

class PlayerTable {
    public playerId: number;
    public adventurerStock: Stock;
    public companionsStock: Stock;
    public spellsStock: Stock;

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
        //this.adventurerStock.onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupProjectCard(game, cardDiv, type);
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

        player.spells.forEach(spell => this.spellsStock.addToStockWithId(spell.visible ? spell.type : 0, ''+spell.id));

        // dice

        player.dice.forEach(die => {
            this.game.createOrMoveDie(die, `player-table-${this.playerId}-dice`);
        });
    }

    public setAdventurer(adventurer: Adventurer) {
        //this.adventurerStock.removeAll();
        moveToAnotherStock(this.game.adventurersStock, this.adventurerStock, adventurer.color, ''+adventurer.id);
    }
    
    public addCompanion(companion: Companion, from: Stock) {
        moveToAnotherStock(from, this.companionsStock, companion.subType, ''+companion.id);
    }
    
    public addDice(dice: Die[]) {
        dice.forEach(die => this.game.createOrMoveDie(die, `player-table-${this.playerId}-dice`));
    }

    public removeDice(dice: Die[]) {
        dice.forEach(die => (this.game as any).fadeOutAndDestroy(`die${die.id}`));
    }
    
    public removeCompanion(companion: Companion) {
        this.companionsStock.removeFromStockById(''+companion.id, Cemetery);
    }

    public setUsedDie(dieId: number) {
        dojo.addClass(`die${dieId}`, 'used');
    }
    
    public clearUsedDice() {
        (Array.from(document.getElementsByClassName('die')) as HTMLElement[]).forEach(die => dojo.removeClass(die, 'used'));
    }

    public addHiddenSpell(id: number, fromPlayerId: number) {
        this.spellsStock.addToStockWithId(0, ''+id, `overall_player_board_${fromPlayerId}`);
    }

    public revealSpell(spell: Spell) {
        this.spellsStock.removeFromStockById('0');
        this.spellsStock.addToStockWithId(spell.type, ''+spell.id);
    }
}