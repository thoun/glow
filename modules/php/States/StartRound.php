<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class StartRound extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 15,
            type: StateType::GAME,
            name: 'startRound',
        );
    }

    public function onEnteringState(): int|string {
        $playerCount = $this->game->getPlayerCount();

        $day = intval($this->game->getGameStateValue(DAY)) + 1;
        $this->game->setGameStateValue(DAY, $day);

        $this->game->DbQuery("UPDATE companion SET `reroll_used` = 0");
        $this->game->DbQuery("UPDATE player SET `applied_effects` = null, visited_spots = null");

        $this->game->bga->notify->all('newDay', clienttranslate('Day ${day} begins'), [
            'day' => $day,
        ]);

        if ($day == 1) {
            if ($playerCount == 1) {
                $this->game->placeSoloTilesOnMeetingTrack();
            }
            $this->game->placeCompanionsOnMeetingTrack();
            $this->game->initMeetingTrackSmallDice($playerCount);
            $this->game->addFootprintsOnMeetingTrack();
        }

        $this->game->revealSpellTokens();

        return RecruitCompanion::class;
    }
}
