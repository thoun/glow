<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class NextPlayerChooseAdventurer extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 11,
            type: StateType::GAME,
            name: 'nextPlayerChooseAdventurer',
        );
    }

    public function onEnteringState(): int|string {
        $this->game->activeNextPlayer();

        $playerId = (int)$this->game->getActivePlayerId();
        $this->game->giveExtraTime($playerId);

        $startRound = $playerId == intval($this->game->getGameStateValue(FIRST_PLAYER));
        return $startRound ? StartRound::class : ChooseAdventurer::class;
    }
}
