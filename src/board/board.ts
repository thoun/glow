const POINT_CASE_SIZE = 25.5;

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
    [419, 212, 1], // 0
    [628, 212, 1], // 1
    [752, 142, 1], // 2
    [559, 302, 1], // 3
    [750, 355, 1], // 4
    [397, 386, 1], // 5
    [257, 306, 1], // 6
    [63, 355, 1], // 7
    [150, 208, 1], // 8
    [79, 77, 1], // 9
    [288, 83, 1], // 10
    [503, 67, 1], // 11
];
const MAPS: number[][][] = [null, MAP1, MAP2];

class Board {
    private points = new Map<number, number>();
    private meeples: Meeple[] = [];

    constructor(
        private game: GlowGame, 
        players: GlowPlayer[],
    ) {
        let html = '';

        // points
        players.forEach(player =>
            html += `<div id="player-${player.id}-point-marker" class="point-marker" style="background: #${player.color};"></div>`
        );
        dojo.place(html, 'board');
        players.forEach(player => {
            this.points.set(Number(player.id), Number(player.score));
            this.meeples.push(...player.meeples);
        });
        this.movePoints();

        players.forEach(player => this.placeMeeples(player));
    }

    public incPoints(playerId: number, points: number) {
        this.points.set(playerId, this.points.get(playerId) + points);
        this.movePoints();
    }

    private getPointsCoordinates(points: number) {
        const cases = points === 10 ? 11 :
            (points > 10 ? points + 2 : points);

        const top = cases < 86 ? Math.min(Math.max(cases - 34, 0), 17) * POINT_CASE_SIZE : (102 - cases) * POINT_CASE_SIZE;
        const left = cases < 52 ? Math.min(cases, 34) * POINT_CASE_SIZE : (33 - Math.max(cases - 52, 0))*POINT_CASE_SIZE;

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
            dojo.place(`<div id="meeple${meeple.id}" class="token meeple${meeple.type}" style="background-color: #${color}; transform: ${transform}"></div>`, 'board');
        }
    }

    public moveMeeple(meeple: Meeple) {
        this.meeples.find(m => m.id = meeple.id).position = meeple.position;

        this.placeMeeple(meeple);
    }

    public createDestinationZones(possibleDestinations: number[]) {
        (Array.from(document.getElementsByClassName('destination-zone')) as HTMLElement[]).forEach(node => node.parentElement.removeChild(node));

        possibleDestinations.forEach(position => {
            const mapSpot = this.getMapSpot(position);
            dojo.place(`<div id="destination-zone-${position}" class="destination-zone ${mapSpot[2] ? 'big' : 'small'}" style="left: ${mapSpot[0]}px; top: ${mapSpot[1]}px;"></div>`, 'board');
            document.getElementById(`destination-zone-${position}`).addEventListener('click', () => this.game.move(position));
        });
        
    }
}