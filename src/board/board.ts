const POINT_CASE_SIZE = 46;

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

        return [19 + left, 24 + top];
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

    private placeMeeple(meeple: Meeple, color: string) {
        const x = 122;
        const y = 754;
        const shift = this.meeples.filter(m => m.playerId < meeple.playerId || (m.playerId === meeple.playerId && m.position < meeple.position)).length;

        dojo.place(`<div class="token meeple${meeple.type}" style="background-color: #${color}; transform: translate(${x + shift*5 + (meeple.type === 2 ? 50 : 0)}px, ${y + shift*5}px)"></div>`, 'board');
    }
}