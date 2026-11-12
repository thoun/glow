<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class NextPlayerRecruitCompanion extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 28,
            type: StateType::GAME,
            name: 'nextPlayerRecruitCompanion',
        );
    }

    public function onEnteringState(): int|string {
        $playerId = intval($this->game->getActivePlayerId());

        $uriomIntervention = $this->game->getGlobalVariable(URIOM_INTERVENTION);
        if ($uriomIntervention !== null) {
            if ($uriomIntervention->activated === null) {
                // redirect to uriom player
                $this->game->gamestate->changeActivePlayer($uriomIntervention->uriomPlayerId);
                return UriomRecruitCompanion::class;
            } else if ($playerId == $uriomIntervention->uriomPlayerId) {
                // redirect from uriom player to previous active player
                $this->game->gamestate->changeActivePlayer($uriomIntervention->activePlayerId);
                return RecruitCompanion::class;
            } else {
                // after a uriom intervention and active player  finished its turn
                $this->game->deleteGlobalVariable(URIOM_INTERVENTION);
            }
        }

        $this->game->activeNextPlayer();

        $playerId = (int)$this->game->getActivePlayerId();
        $this->game->giveExtraTime($playerId);

        $endRecruit = $playerId == intval($this->game->getGameStateValue(FIRST_PLAYER));
        return $endRecruit ? EndRecruit::class : RecruitCompanion::class;
    }
}
