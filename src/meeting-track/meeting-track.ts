const MEETING_SPOT_BY_COLOR = [
    null,
    5,
    2,
    4,
    1,
    3,
  ];

class MeetingTrack {
    private companionsStocks: Stock[] = [];

    constructor(
        private game: GlowGame,
        meetingTrackSpot: MeetingTrackSpot[],
    ) {

        for (let i=0; i<=5; i++) {
            let html = '';
            const cemetery = i === 0;
            
            if (!cemetery) {
                html += `<div id="meeting-track-dice-${i}" class="meeting-track-dice" style="left: ${490 + 243*(i-1)}px;"></div>`
            }
            const left = cemetery ? 200 : 490 + 243*(i-1);
            html += `<div id="meeting-track-companion-${i}" class="meeting-track-stock" style="left: ${left}px;"></div>`;

            dojo.place(html, 'meeting-track');

            const spot = meetingTrackSpot[i];

            this.companionsStocks[i] = new ebg.stock() as Stock;
            this.companionsStocks[i].setSelectionAppearance('class');
            this.companionsStocks[i].selectionClass = 'selected';
            this.companionsStocks[i].create(this.game, $(`meeting-track-companion-${i}`), CARD_WIDTH, CARD_HEIGHT);
            this.companionsStocks[i].setSelectionMode(0);
            dojo.connect(this.companionsStocks[i], 'onChangeSelection', this, () => this.game.selectMeetingTrackCompanion(i));

            setupCompanionCards(this.companionsStocks[i]);
    
            if (cemetery) {
                // TODO show last companion on cemetery back
                //this.companionsStocks[i].addToStockWithId(1001, '1');
                //this.companionsStocks[i].addToStockWithId(1002, '2');
            } else {
                if (spot.companion) {
                    this.companionsStocks[i].addToStockWithId(spot.companion.subType, ''+spot.companion.id);
                }

                this.placeSmallDice(spot.dice);
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

    public removeCompanion(spot: number) {
        this.companionsStocks[spot].removeAll();
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

    public clearFootprintTokens() {
        // TODO
    }
    
    public placeSmallDice(dice: Die[]) {
        dice.forEach(die => {
            this.game.createOrMoveDie(die, `meeting-track-dice-${MEETING_SPOT_BY_COLOR[die.color]}`);
        });
    }
}