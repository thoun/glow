<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class EndRecruit extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 29,
            type: StateType::GAME,
            name: 'endRecruit',
        );
    }

    // It's also here dice are rolled.
    public function onEnteringState(): int|string {
        $companions = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('meeting'));

        foreach($companions as $companion) {
            $this->game->sendToCemetery(0, $companion->id);
        }

        $this->game->bga->notify->all('removeCompanions', '', [
            'topCemeteryType' => $this->game->getTopCemeteryType(),
        ]);

        $playersIds = $this->game->getPlayersIds();
        foreach($playersIds as $playerId) {
            $this->game->rollPlayerDice($playerId, null, clienttranslate('${player_name} rolls dice ${rolledDice}'));
        }

        return ST_MULTIPLAYER_CHANGE_DICE;
    }
}
