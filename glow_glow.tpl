{OVERALL_GAME_HEADER}

<div id="score">
    <div id="tabble-wrapper">
        <table>
            <thead>
                <tr id="scoretr"></tr>
            </thead>
            <tbody id="score-table-body">
            </tbody>
        </table>
    </div>
</div>

<div id="zoom-wrapper">
    <div id="full-table">

        <div id="currentplayertable"></div>

        <div id="full-board-wrapper">
            <div id="full-board">
                <div id="board">
                    <div id="table-dice"></div>
                </div>
                <div id="middle-band">
                    <div id="round-counter-wrapper">
                        {DAY} <span id="round-counter">-</span><span id="round-counter-wrapper-max-days">&nbsp;/&nbsp;8</span>
                    </div>
                </div>
                <div id="meeting-track">
                    <div id="deckB" class="meeting-track-stock hidden-pile"></div>
                    <div id="deck" class="meeting-track-stock hidden-pile"></div>
                    <div id="cemetery" class="meeting-track-stock hidden-pile"></div>
                </div>
            </div>
        </div>

        <div id="playerstables"></div>
    </div>
    <div id="zoom-controls">
        <button id="zoom-out"></button>
        <button id="zoom-in" class="disabled"></button>
    </div>
</div>

{OVERALL_GAME_FOOTER}
