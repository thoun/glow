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

    constructor(
        private game: GlowGame,
        meetingTrackSpot: MeetingTrackSpot[],
        topDeckType: number,
        topCemeteryType: number,
    ) {

        for (let i=1; i<=5; i++) {
            
            const left = 245 + 135*MEETING_SPOT_BY_COLOR[i];
            const html = `
            <div id="meeting-track-dice-${i}" class="meeting-track-zone dice" style="left: ${left}px;"></div>
            <div id="meeting-track-footprints-${i}" class="meeting-track-zone footprints" style="left: ${left}px;"></div>
            <div id="meeting-track-companion-${i}" class="meeting-track-stock" style="left: ${left}px;"></div>
            `;
            dojo.place(html, 'meeting-track');


            const spot = meetingTrackSpot[i];

            this.companionsStocks[i] = new ebg.stock() as Stock;
            this.companionsStocks[i].setSelectionAppearance('class');
            this.companionsStocks[i].selectionClass = 'selected';
            this.companionsStocks[i].create(this.game, $(`meeting-track-companion-${i}`), CARD_WIDTH, CARD_HEIGHT);
            this.companionsStocks[i].setSelectionMode(0);
            this.companionsStocks[i].onItemCreate = (cardDiv: HTMLDivElement, type: number) => setupCompanionCard(game, cardDiv, type);
            dojo.connect(this.companionsStocks[i], 'onChangeSelection', this, () => this.game.selectMeetingTrackCompanion(i));

            setupCompanionCards(this.companionsStocks[i]);
    
            if (spot.companion) {
                this.companionsStocks[i].addToStockWithId(spot.companion.subType, ''+spot.companion.id);
            }
            this.setFootprintTokens(i, spot.footprints);
        }
        
        // place dice only after spots creation
        for (let i=1; i<=5; i++) {
            const spot = meetingTrackSpot[i];
            this.placeSmallDice(spot.dice);

            document.getElementById(`meeting-track-dice-${i}`).addEventListener('click', () => {
                if (dojo.hasClass(`meeting-track-dice-${i}`, 'selectable')) {
                    this.game.moveBlackDie(i);
                }
            });
        }

        this.setDeckTop(DECK, topDeckType);
        this.setDeckTop(CEMETERY, topCemeteryType);
    }
    
    public setCompanion(meetingTrackSpot: MeetingTrackSpot, spot: number): void {
        const companion = meetingTrackSpot.companion;
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

    public removeCompanion(spot: number) {
        if (spot == 0) {
            debugger;
        }
        this.companionsStocks[spot].removeAllTo(CEMETERY);
    }

    public removeCompanions() {
        for (let i=1; i<=5; i++) {
            this.removeCompanion(i);
        }
    }

    public setSelectionMode(mode: number) {
        for (let i=1; i<=5; i++) {
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
            dojo.place(`<div class="footprint-token"></div>`, zone.id);
        }
    }

    public clearFootprintTokens(spot: number, toPlayer: number) {
        const zone = document.getElementById(`meeting-track-footprints-${spot}`) as HTMLDivElement;
        Array.from(zone.children).forEach(
            tokenDiv => (this.game as any).slideToObjectAndDestroy(tokenDiv, `footprint-counter-${toPlayer}`)
        );
    }
    
    public placeSmallDice(dice: Die[]) {
        dice.forEach(die => {
            this.game.createOrMoveDie(die, `meeting-track-dice-${die.value}`);
        });
    }

    public setDeckTop(deckId: string, type?: number) {
        document.getElementById(deckId).dataset.type = `${type ?? 0}`;
    }
    
    public setSelectableDice(possibleSpots: number[]) {
        for (let i=1; i<=5; i++) {
            dojo.toggleClass(`meeting-track-dice-${i}`, 'selectable', possibleSpots.some(ps => ps === i));
        }
    }
}