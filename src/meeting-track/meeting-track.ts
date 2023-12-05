const MEETING_SPOT_BY_COLOR = [
    null,
    4,
    1,
    3,
    0,
    2,
  ];

class MeetingTrack {
    private companionsStocks: Stock[] = [];
    private soloTilesStocks: Stock[] = [];

    constructor(
        private game: GlowGame,
        meetingTrackSpot: MeetingTrackSpot[],
        topDeckType: number,
        topDeckBType: number,
        topCemeteryType: number,
        discardedSoloTiles: number,
        playerCount: number,
    ) {
        const solo = playerCount == 1;

        if (playerCount >= 5) {
            document.getElementById(`meeting-track`).insertAdjacentHTML('afterbegin', `
                <div id="meeting-track-expansion" data-players="${playerCount}">
                    <div class="label">${_('${playerCount} players').replace('${playerCount}', playerCount)}</div>
                </div>
            `);
        }

        if (solo) {
            dojo.place(`<div id="meeting-track-dice-0" class="meeting-track-zone dice" style="left: 57px;"></div>`, 'meeting-track');
            meetingTrackSpot[0].dice.forEach(die => this.game.createOrMoveDie(die, `meeting-track-dice-0`));
        }

        let spotCount = 5;
        if (playerCount >= 5) {
            spotCount = playerCount + 2;
        }

        for (let i=1; i<=spotCount; i++) {
            
            let left = 245 + 135*MEETING_SPOT_BY_COLOR[i];
            if (i > 5) {
                left = 4 + (i-6) * 135;
            }

            let html = `
            <div id="meeting-track-dice-${i}" class="meeting-track-zone dice" style="left: ${left}px;"></div>
            <div id="meeting-track-footprints-${i}" class="meeting-track-zone footprints" style="left: ${left}px;"></div>
            <div id="meeting-track-companion-${i}" class="meeting-track-stock" style="left: ${left}px;"></div>
            `;
            if (solo) {
                html += `<div id="meeting-track-soloTile-${i}" class="meeting-track-solo-tile" style="left: ${left}px;"></div>`;
            }
            dojo.place(html, i > 5 ? 'meeting-track-expansion' : 'meeting-track');

            const spot = meetingTrackSpot[i];

            // companions

            this.companionsStocks[i] = new ebg.stock() as Stock;
            this.companionsStocks[i].setSelectionAppearance('class');
            this.companionsStocks[i].selectionClass = 'selected';
            this.companionsStocks[i].create(this.game, $(`meeting-track-companion-${i}`), CARD_WIDTH, CARD_HEIGHT);
            this.companionsStocks[i].setSelectionMode(0);
            this.companionsStocks[i].onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupCompanionCard(game, cardDiv, type);
            dojo.connect(this.companionsStocks[i], 'onChangeSelection', this, (_, id) => id && this.game.selectMeetingTrackCompanion(i));

            setupCompanionCards(this.companionsStocks[i]);
    
            if (spot.companion) {
                this.companionsStocks[i].addToStockWithId(spot.companion.subType, ''+spot.companion.id);
            }

            // footprints

            this.setFootprintTokens(i, spot.footprints);

            if (solo) {
                // solo tiles

                this.soloTilesStocks[i] = new ebg.stock() as Stock;
                this.soloTilesStocks[i].setSelectionAppearance('class');
                this.soloTilesStocks[i].selectionClass = 'selected';
                this.soloTilesStocks[i].create(this.game, $(`meeting-track-soloTile-${i}`), CARD_WIDTH, SOLO_CARD_HEIGHT);
                this.soloTilesStocks[i].setSelectionMode(0);
                this.soloTilesStocks[i].onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupSoloTileCard(game, cardDiv, type);

                setupSoloTileCards(this.soloTilesStocks[i]);
        
                if (spot.soloTile) {
                    this.soloTilesStocks[i].addToStockWithId(spot.soloTile.type, ''+spot.soloTile.id);
                }
            }
        }
        
        // place dice only after spots creation
        for (let i=1; i<=spotCount; i++) {
            const spot = meetingTrackSpot[i];
            this.placeSmallDice(spot.dice);

            document.getElementById(`meeting-track-dice-${i}`).addEventListener('click', () => {
                if (dojo.hasClass(`meeting-track-dice-${i}`, 'selectable')) {
                    this.game.onMeetingTrackDiceClick(i);
                }
            });
        }

        this.setDeckTop(DECK, topDeckType);
        this.setDeckTop(DECKB, topDeckBType);
        this.setDeckTop(CEMETERY, topCemeteryType);

        if (game.isSolo()) {
            dojo.place(`<div id="solo-tiles" class="meeting-track-stock solo-tiles hidden-pile"></div>`, 'meeting-track');
            dojo.place(`<div id="solo-tiles-discard" class="meeting-track-stock solo-tiles hidden-pile ${discardedSoloTiles ? '' : 'hidden'}"></div>`, 'meeting-track');
            dojo.addClass('middle-band', 'solo');
        }
    }
    
    public setCompanion(companion: Companion, spot: number): void {
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

        this.companionsStocks[spot].addToStockWithId(companion.subType, ''+companion.id, DECK);
    }
    
    public setSoloTile(meetingTrackSpot: MeetingTrackSpot, spot: number): void {
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

        this.soloTilesStocks[spot].addToStockWithId(soloTile.type, ''+soloTile.id, SOLO_TILES);
    }

    public removeCompanion(spot: number) {
        const id = `${this.companionsStocks[spot].container_div.id}_item_${this.companionsStocks[spot].items[0]?.id}`;
        const card = document.getElementById(id);
        this.companionsStocks[spot].removeAllTo(CEMETERY);
        if (card) {
            card.classList.add('flipped');
            setTimeout(() => card.style.visibility = 'hidden', 500);
        }
    }

    public removeCompanions() {
        for (let i=1; i<=this.game.getSpotCount(); i++) {
            this.removeCompanion(i);
        }
    }

    public setSelectionMode(mode: number) {
        for (let i=1; i<=this.game.getSpotCount(); i++) {
            this.companionsStocks[i].setSelectionMode(mode);
        }
    }

    public getStock(spot: number): Stock {
        return this.companionsStocks[spot];
    }

    public setFootprintTokens(spot: number, number: number) {
        const zone = document.getElementById(`meeting-track-footprints-${spot}`) as HTMLDivElement;
        while (zone.childElementCount > number) {
            zone.removeChild(zone.lastChild);
        }
        for (let i = zone.childElementCount; i<number; i++) {
            dojo.place(`<div class="round-token footprint footprint-token"></div>`, zone.id);
        }
    }

    public clearFootprintTokens(spot: number, toPlayer: number) {
        const zone = document.getElementById(`meeting-track-footprints-${spot}`) as HTMLDivElement;
        Array.from(zone.children).forEach(
            tokenDiv => (this.game as any).slideToObjectAndDestroy(tokenDiv, `player-table-${toPlayer}-footprint-tokens`)
        );
    }
    
    public placeSmallDice(dice: Die[]) {
        dice.forEach(die => 
            this.game.createOrMoveDie(die, `meeting-track-dice-${die.location_arg}`)
        );
    }

    public setDeckTop(deckId: string, type?: number) {
        document.getElementById(deckId).dataset.type = `${type ?? 0}`;
    }
    
    public setSelectableDice(possibleSpots: number[]) {
        for (let i=1; i<=this.game.getSpotCount(); i++) {
            dojo.toggleClass(`meeting-track-dice-${i}`, 'selectable', possibleSpots.some(ps => ps === i));
        }
    }
    
    public updateSoloTiles(args: NotifUpdateSoloTilesArgs) {
        this.setDeckTop(DECK, args.topDeckType);
        this.setDeckTop(DECKB, args.topDeckBType);
        dojo.toggleClass('solo-tiles-discard', 'hidden', !args.discardedSoloTiles);
        this.soloTilesStocks[args.spot].removeAllTo('solo-tiles-discard');
        if (args.soloTile) {
            this.soloTilesStocks[args.spot].addToStockWithId(args.soloTile.type, ''+args.soloTile.id, 'solo-tiles-discard');
        }
    }
}