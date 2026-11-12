<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class MultiMove extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 51,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'multiMove',
            description: clienttranslate('Players can move their company'),
            descriptionMyTurn: clienttranslate('${you} can move your company'),
            transitions: ['endRound' => 80],
            initialPrivate: PrivateMove::class,
        );
    }

    public function onEnteringState(): void {

        $playerWithRoutes = [];

        $playersIds = $this->game->getPlayersIds();
        $autoSkipImpossibleActions = $this->game->bga->tableOptions->isTurnBased();

        foreach($playersIds as $playerId) {
            $args = (object)$this->game->argMoveForPlayer($playerId);
            if (!$autoSkipImpossibleActions || count($args->possibleRoutes) > 0 || $args->canSettle || $args->killTokenId > 0 || $args->disableTokenId > 0) {
                $playerWithRoutes[] = $playerId;
            } else {
                // player finishes its turn, replace die
                $this->game->replaceSmallDiceOnMeetingTrack($playerId);
            }
        }

        if (count($playerWithRoutes) > 0) {
            $this->game->gamestate->setPlayersMultiactive($playerWithRoutes, 'endRound', true);
            $this->game->gamestate->initializePrivateStateForAllActivePlayers();
        } else {
            $this->game->gamestate->nextState('endRound');
        }
    }

    public function zombie(int $playerId): void {

    }
}
