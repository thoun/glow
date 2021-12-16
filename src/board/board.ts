const POINT_CASE_SIZE = 25.5;
const BOARD_POINTS_MARGIN = 38;
const HIDDEN_TOKENS_DELAY = 2000;

const MAP1: number[][] = [
    [36, 396, 1], // 0
    [157, 382], // 1
    [204, 360], // 2
    [267, 376], // 3
    [332, 358], // 4
    [383, 388, 1], // 5
    [530, 393], // 6
    [596, 373], // 7
    [654, 341], // 8
    [771, 315], // 9
    [817, 269], // 10
    [741, 134], // 11
    [710, 44], // 12
    [766, 39], // 13
    [786, 78, 1], // 14
    [695, 164], // 15
    [720, 257], // 16
    [572, 250, 1], // 17
    [657, 201], // 18
    [615, 157], // 19
    [651, 124], // 20
    [666, 88], // 21
    [646, 37], // 22
    [561, 36], // 23
    [538, 77], // 24
    [584, 94], // 25
    [523, 133], // 26
    [529, 197], // 27
    [474, 132], // 28
    [404, 150], // 29
    [410, 201], // 30
    [467, 218], // 31
    [566, 312], // 32
    [436, 292, 1], // 33
    [380, 250], // 34
    [314, 230], // 35
    [346, 200], // 36
    [336, 155], // 37
    [222, 115, 1], // 38
    [373, 105], // 39
    [159, 40], // 40
    [289, 44], // 41
    [348, 38], // 42
    [419, 62, 1], // 43
    [78, 367], // 44
    [124, 353], // 45
    [150, 317], // 46
    [201, 313], // 47
    [227, 278], // 48
    [275, 292], // 49
    [316, 275], // 50
    [361, 304], // 51
    [227, 209], // 52
    [102, 43], // 53
    [77, 77], // 54
    [42, 105], // 55
    [70, 179], // 56
    [130, 198], // 57
    [176, 255], // 58
    [37, 233, 1], // 59
    [74, 319], // 60
];

const MAP2: number[][] = [
    [416, 204, 1], // 0
    [635, 200, 1], // 1
    [760, 132, 1], // 2
    [564, 299, 1], // 3
    [762, 355, 1], // 4
    [393, 383, 1], // 5
    [252, 300, 1], // 6
    [58, 352, 1], // 7
    [139, 196, 1], // 8
    [69, 66, 1], // 9
    [286, 69, 1], // 10
    [504, 55, 1], // 11
];
const MAPS: number[][][] = [null, MAP1, MAP2];

class Board {
    private points = new Map<number, number>();
    private meeples: Meeple[] = [];
    private tomCompany: number;
    private tokensOpacityTimeout: any;

    constructor(
        private game: GlowGame, 
        private players: GlowPlayer[],
        tableDice: Die[],
    ) {
        let html = '';

        // points
        players.forEach(player =>
            html += `<div id="player-${player.id}-point-marker" class="point-marker ${this.game.isColorBlindMode() ? 'color-blind' : ''}" data-player-no="${player.playerNo}" style="background: #${player.color};"></div>`
        );
        dojo.place(html, 'board');
        players.forEach(player => {
            this.points.set(Number(player.id), Number(player.score));
            this.meeples.push(...player.meeples);

            if (Number(player.id) == 0) { // tom
                const coordinates = this.getPointsCoordinates(player.company);
                const left = coordinates[0];
                const top = coordinates[1];
                const transform = `translateX(${left}px) translateY(${top}px)`;
                dojo.place(`<div id="meeple0" class="token meeple1 ${this.game.isColorBlindMode() ? 'color-blind' : ''} meeple-player-0" style="background-color: black; transform: ${transform}"></div>`, 'board');
            }
        });
        this.movePoints();

        players.forEach(player => this.placeMeeples(player));

        tableDice.forEach(die => this.game.createOrMoveDie(die, 'table-dice'));

        document.getElementById('table-dice').addEventListener('click', event => {
            if (!(this.game as any).gamedatas.gamestate.name.startsWith('selectSketalDie')) {
                return;
            }

            const target = event.target as HTMLDivElement;
            if (!target || !target.classList.contains('die')) {
                return;
            }

            this.game.selectSketalDie(Number(target.dataset.dieId));
        });

        const boardDiv = document.getElementById('board');
        boardDiv.addEventListener('click', event => this.hideTokens(boardDiv, event));
        boardDiv.addEventListener('mousemove', event => {
            if (!this.tokensOpacityTimeout) {
                this.hideTokens(boardDiv, event);
            }
        });
        boardDiv.addEventListener('mouseleave', () => {
            if (this.tokensOpacityTimeout) {
                clearTimeout(this.tokensOpacityTimeout);
                dojo.removeClass('board', 'hidden-tokens');
                dojo.removeClass('board', 'hidden-meeples');
                this.tokensOpacityTimeout = null;
            }
        });
    }

    private hideTokens(boardDiv: HTMLElement, event: MouseEvent) {
        const x = event.offsetX;
        const y = event.offsetY;

        //if (x < BOARD_POINTS_MARGIN || y < BOARD_POINTS_MARGIN || x > boardDiv.clientWidth - BOARD_POINTS_MARGIN || y > boardDiv.clientHeight - BOARD_POINTS_MARGIN) {
            dojo.addClass('board', 'hidden-tokens');
            dojo.addClass('board', 'hidden-meeples');

            if (this.tokensOpacityTimeout) {
                clearTimeout(this.tokensOpacityTimeout);
            }
            this.tokensOpacityTimeout = setTimeout(() => {
                dojo.removeClass('board', 'hidden-tokens');
                dojo.removeClass('board', 'hidden-meeples');
                this.tokensOpacityTimeout = null;
            }, HIDDEN_TOKENS_DELAY);
        //}
    }

    public setPoints(playerId: number, points: number) {
        this.points.set(playerId, points);
        this.movePoints();
    }

    public setTomCompany(company: number) {
        const coordinates = this.getPointsCoordinates(company);
        const left = coordinates[0];
        const top = coordinates[1];
        document.getElementById(`meeple0`).style.transform = `translateX(${left}px) translateY(${top}px)`;
    }

    private getPointsCoordinates(points: number) {
        const pointsModulo = points % 100;
        const cases = pointsModulo === 10 ? 11 :
            (pointsModulo > 10 ? pointsModulo + 2 : pointsModulo);

        const top = cases < 86 ? Math.min(Math.max(cases - 34, 0), 17) * POINT_CASE_SIZE : (102 - cases) * POINT_CASE_SIZE;
        const left = cases < 52 ? Math.min(cases, 34) * POINT_CASE_SIZE : Math.max((33 - Math.max(cases - 52, 0))*POINT_CASE_SIZE, 0);

        return [17 + left, 15 + top];
    }

    private movePoints() {
        this.points.forEach((points, playerId) => {
            const markerDiv = document.getElementById(`player-${playerId}-point-marker`);

            const coordinates = this.getPointsCoordinates(points);
            const left = coordinates[0];
            const top = coordinates[1];
    
            let topShift = 0;
            let leftShift = 0;
            this.points.forEach((iPoints, iPlayerId) => {
                if (iPoints === points && iPlayerId < playerId) {
                    topShift += 5;
                    leftShift += 5;
                }
            });
    
            markerDiv.style.transform = `translateX(${left + leftShift}px) translateY(${top + topShift}px)`;
        });
    }

    private placeMeeples(player: GlowPlayer) {
        player.meeples.forEach(meeple => this.placeMeeple(meeple, player.color));
    }

    private getMapSpot(spot: number): number[] {
        return MAPS[this.game.getBoardSide()][spot];
    }

    private placeMeeple(meeple: Meeple, color?: string) {
        const mapSpot = this.getMapSpot(meeple.position);
        const x = mapSpot[0];
        const y = mapSpot[1];
        const shift = this.meeples.filter(m => m.type === meeple.type && (m.playerId < meeple.playerId || (m.playerId === meeple.playerId  && m.id < meeple.id))).length;

        const div = document.getElementById(`meeple${meeple.id}`);
        const transform = `translate(${x + shift*5 + (meeple.type === 2 ? 50 : 0)}px, ${y + shift*5}px)`;
        if (div) {
            div.style.transform = transform;
        } else {
            dojo.place(`<div id="meeple${meeple.id}" class="token meeple${meeple.type} ${this.game.isColorBlindMode() ? 'color-blind' : ''} meeple-player-${meeple.playerId}" data-player-no="${this.players.find(p => Number(p.id) == meeple.playerId).playerNo}" style="background-color: #${color}; transform: ${transform}"></div>`, 'board');
        }
    }

    public moveMeeple(meeple: Meeple) {
        this.meeples.find(m => m.id = meeple.id).position = meeple.position;

        this.placeMeeple(meeple);
    }

    public createDestinationZones(possibleDestinations: Route[]) {
        (Array.from(document.getElementsByClassName('destination-zone')) as HTMLElement[]).forEach(node => node.parentElement.removeChild(node));
        (Array.from(document.getElementsByClassName('destination-arrow')) as HTMLElement[]).forEach(node => node.parentElement.removeChild(node));

        possibleDestinations?.forEach(possibleDestination => {
            const position = possibleDestination.destination;
            const mapSpot = this.getMapSpot(position);
            const big = mapSpot.length > 2;
            if (!document.getElementById(`destination-zone-${position}`)) {
                dojo.place(`<div id="destination-zone-${position}" class="destination-zone ${mapSpot[2] ? 'big' : 'small'}" style="left: ${mapSpot[0]}px; top: ${mapSpot[1]}px;"></div>`, 'board');
            }

            const from = possibleDestination.from;
            const mapSpotFrom = this.getMapSpot(from);

            const deltaX = mapSpot[0] - mapSpotFrom[0];
            const deltaY = mapSpot[1] - mapSpotFrom[1];
            const rad = Math.atan2(deltaY, deltaX); // In radians
            let left = (mapSpot[0] + mapSpotFrom[0]) / 2;
            let top = (mapSpot[1] + mapSpotFrom[1]) / 2;
            if (!big) {
                left -= 25;
            }
            const onlyOneDestinationToSpot = possibleDestinations.filter(pd => pd.destination === possibleDestination.destination).length <= 1;

            if (!document.getElementById(`destination-arrow-${position}-from-${from}`)) {
                const distance = Math.sqrt( deltaX*deltaX + deltaY*deltaY );
                const scaleX = Math.min(1, distance / 180);
                const scaleY = Math.min(1, distance / 100);

                dojo.place(`<div id="destination-arrow-${position}-from-${from}" class="destination-arrow" style="left: ${left}px; top: ${top}px; transform: rotate(${rad}rad) scaleX(${scaleX}) scaleY(${scaleY})"></div>`, 'board');
                document.getElementById(`destination-arrow-${position}-from-${from}`).addEventListener('click', () => this.game.selectMove(possibleDestination));

                const footprintsCost = possibleDestination.costForPlayer.filter(cost => cost > -30 && cost < -20).map(cost => (-cost) - 20).reduce((a, b) => a + b, 0);

                for (let i=0; i<footprintsCost; i++) {
                    dojo.place(`<div class="footprint round-token" style="position: absolute; left: ${i*10}px; top: ${i*10}px; transform: scaleX(${(1/scaleX) / 1.8}) scaleY(${(1/scaleY) / 1.8})"></div>`, `destination-arrow-${position}-from-${from}`);
                }
            }
            if (onlyOneDestinationToSpot) {
                document.getElementById(`destination-zone-${position}`).addEventListener('click', () => this.game.selectMove(possibleDestination));
            }
            dojo.toggleClass(`destination-zone-${position}`, 'unselectable', !onlyOneDestinationToSpot);
        });
        
    }

    public setColor(playerId: number, newPlayerColor: string) {
        document.getElementById(`player-${playerId}-point-marker`).style.background = `#${newPlayerColor}`;
        (Array.from(document.getElementsByClassName(`meeple-player-${playerId}`)) as HTMLDivElement[]).forEach(elem => elem.style.background = `#${newPlayerColor}`);
    }
}