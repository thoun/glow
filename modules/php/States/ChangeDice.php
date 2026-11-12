<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class ChangeDice extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 31,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'changeDice',
            description: clienttranslate('Players can reroll or change their dice'),
            descriptionMyTurn: clienttranslate('${you} can reroll or change your dice'),
            initialPrivate: PrivateSelectDiceAction::class,
        );
    }

    public function onEnteringState(): void {
        $this->game->gamestate->setAllPlayersMultiactive();

        $playersIdsToSelectDiceAction = [];
        $playersIdsToRerollImmediate = [];

        $playersIds = $this->game->getPlayersIds();
        foreach($playersIds as $playerId) {
            $args = $this->game->argRerollImmediate($playerId);
            if ($args['selectedDie'] !== null) {
                $playersIdsToRerollImmediate[] = $playerId;
            } else {
                $playersIdsToSelectDiceAction[] = $playerId;
            }
        }

        if (count($playersIdsToRerollImmediate) == 0) {
            $this->game->gamestate->initializePrivateStateForAllActivePlayers();
        } else {
            $this->game->gamestate->initializePrivateStateForPlayers($playersIdsToSelectDiceAction);
            foreach ($playersIdsToRerollImmediate as $pId) {
                $this->game->gamestate->setPrivateState($pId, PrivateRerollImmediate::class);
            }
        }
    }

    public function zombie(int $playerId): void {

    }
}
