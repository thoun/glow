class MeetingTrack {
    private companionsStocks: Stock[] = [];

    constructor(
        private game: GlowGame,
        meetingTrackSpot: MeetingTrackSpot[],
    ) {

        for (let i=1; i<=5; i++) {
            let html = `
                <div id="meeting-track-dice-${i}" class="meeting-track-dice" style="left: ${490 + 243*(i-1)}px;"></div>
                <div id="meeting-track-companion-${i}" class="meeting-track-stock" style="left: ${490 + 243*(i-1)}px;"></div>
            `;

            dojo.place(html, 'meeting-track');

            const spot = meetingTrackSpot[i];

            this.companionsStocks[i] = new ebg.stock() as Stock;
            this.companionsStocks[i].setSelectionAppearance('class');
            this.companionsStocks[i].selectionClass = 'selected';
            this.companionsStocks[i].create(this.game, $(`meeting-track-companion-${i}`), CARD_WIDTH, CARD_HEIGHT);
            this.companionsStocks[i].setSelectionMode(0);
            dojo.connect(this.companionsStocks[i], 'onChangeSelection', this, () => this.game.selectMeetingTrackCompanion(i));

            setupCompanionCards(this.companionsStocks[i]);
    
            if (spot.companion) {
                this.companionsStocks[i].addToStockWithId(spot.companion.subType, ''+spot.companion.id);
            }

            spot.dice.forEach(die => {
                this.game.createAndPlaceDieHtml(die, `meeting-track-dice-${i}`);
                this.game.addRollToDiv(this.game.getDieDiv(die), 'no-roll');
            })
        }
    }
    
    public setCompanion(meetingTrackSpot: MeetingTrackSpot, spot: number): void {
        const companion = meetingTrackSpot.companion;
        if (!companion) {
            this.companionsStocks[spot].removeAll();
            return;
        }
        
        const currentId = this.companionsStocks[spot].items[0]?.id;
        if (currentId && Number(currentId) === companion.id) {
            return;
        }

        if (currentId && Number(currentId) != companion.id) {
            this.companionsStocks[spot].removeAll();
        }

        this.companionsStocks[spot].addToStockWithId(companion.subType, ''+companion.id);
    }

    public removeCompanion(spot: number) {
        this.companionsStocks[spot].removeAll();
    }

    removeCompanions() {
        for (let i=1; i<=5; i++) {
            this.removeCompanion(i);
        }
    }

    public setSelectionMode(mode: number) {
        for (let i=1; i<=5; i++) {
            this.companionsStocks[i].setSelectionMode(mode);
        }
    }

    getStock(spot: number): Stock {
        return this.companionsStocks[spot];
    }
}