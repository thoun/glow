const POINT_CASE_SIZE = 49;

class Board {
    private points = new Map<number, number>();

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
        players.forEach(player => this.points.set(Number(player.id), Number(player.score)));
        this.movePoints();
    }

    public setPoints(playerId: number, points: number) {
        this.points.set(playerId, points);
        this.movePoints();
    }

    private movePoints() {
        this.points.forEach((points, playerId) => {
            console.log(points, playerId);
            const markerDiv = document.getElementById(`player-${playerId}-point-marker`);

            const top = 19 + (points < 84 ? Math.max(points - 32, 0) * POINT_CASE_SIZE : (100 - points) * POINT_CASE_SIZE);
            const left = 24 + (points < 50 ? Math.min(points, 32) * POINT_CASE_SIZE : 32*POINT_CASE_SIZE - Math.max(50 - points, 0));
    
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
}