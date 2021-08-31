class MeetingTrack {
    private companionsStocks: Stock[] = [];

    constructor(
        private game: GlowGame,
        meetingTrackSpot: MeetingTrackSpot[],
    ) {

        for (let i=1; i<=5; i++) {
            let html = `<div id="meeting-track-companion-${i}" class="meeting-track-stock" style="left: ${490 + 243*(i-1)}px;"></div>`;

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

    public setSelectionMode(mode: number) {
        for (let i=1; i<=5; i++) {
            this.companionsStocks[i].setSelectionMode(mode);
        }
    }
}