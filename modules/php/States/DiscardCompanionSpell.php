<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class DiscardCompanionSpell extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 55,
            type: StateType::PRIVATE,
            name: 'discardCompanionSpell',
            description: '',
            descriptionMyTurn: clienttranslate('${you} must choose a companion or spell to discard'),
        );
    }

    #[PossibleAction]
    public function actDiscardCompanionSpell(#[IntParam(min: 0)] int $type, #[IntParam(min: 0)] int $id, int $currentPlayerId): void {
        $this->game->applyDiscardCompanionSpell($currentPlayerId, $type, $id);

        $routeParams = json_decode($this->game->getUniqueValueFromDB("SELECT player_selected_destination FROM player where `player_id` = $currentPlayerId") ?? '[]');
        $from = $routeParams[0];
        $destination = $routeParams[1];
        $possibleRoutes = $this->game->getPossibleRoutes($currentPlayerId);
        $route = \array_find($possibleRoutes, fn($possibleRoute) => $possibleRoute->destination == $destination && ($from == null || $possibleRoute->from == $from));

        $this->game->applyMove($currentPlayerId, $route);
    }

    #[PossibleAction]
    public function actCancelDiscardCompanionSpell(int $currentPlayerId): void {
        $this->game->gamestate->nextPrivateState($currentPlayerId, PrivateMove::class);
    }

    public function zombie(int $playerId): void {
        // Do not remove a die or restore Kaar's black die before paying a pending route.
        $choices = $this->game->getZombieDiscardChoices($playerId, true);
        $choices[] = null; // Cancelling the pending move is always legal.
        $choice = $this->getRandomZombieChoice($choices);
        if ($choice === null) {
            $this->actCancelDiscardCompanionSpell($playerId);
        } else {
            $this->actDiscardCompanionSpell($choice['type'], $choice['id'], $playerId);
        }
    }
}
