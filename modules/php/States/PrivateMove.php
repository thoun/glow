<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class PrivateMove extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 52,
            type: StateType::PRIVATE,
            name: 'privateMove',
            description: '',
            descriptionMyTurn: clienttranslate('${you} can move your company'),
        );
    }

    public function getArgs(int $playerId): array {
        return $this->game->argMoveForPlayer($playerId);
    }

    #[PossibleAction]
    public function actMove(#[IntParam(min: 0)] int $destination, int $currentPlayerId, #[IntParam(min: 0)] ?int $from = null, #[IntParam(min: 0)] ?int $type = null, #[IntParam(min: 0)] ?int $id = null): void {
        // TODO add die id for companion

        $possibleRoutes = $this->game->getPossibleRoutes($currentPlayerId);
        $route = \array_find($possibleRoutes, fn($possibleRoute) => $possibleRoute->destination == $destination && ($from == null || $possibleRoute->from == $from));
        if ($route == null) {
            throw new UserException("Impossible to move here");
        }

        if ((in_array(37, $route->effects) || in_array(37, $route->costForPlayer)) && $this->game->canDiscardCompanionSpell($currentPlayerId)) {
            $this->game->DbQuery("UPDATE player SET player_selected_destination = '".json_encode([$from !== null ? intval($from) : null, $destination])."' WHERE player_id = $currentPlayerId");
            $this->game->gamestate->nextPrivateState($currentPlayerId, DiscardCompanionSpell::class);
            return;
        }

        $this->game->applyMove($currentPlayerId, $route);
    }

    #[PossibleAction]
    public function actPlaceEncampment(int $currentPlayerId): void {
        $position = $this->game->getPlayerCompany($currentPlayerId)->position;

        if (!$this->game->getMapSpot(1, $position)->canSettle) {
            throw new UserException("You can only place encampment in a village");
        }

        $this->game->movePlayerEncampment($currentPlayerId, $position);
        $this->game->applyEndTurn($currentPlayerId);
    }

    #[PossibleAction]
    public function actEndTurn(int $currentPlayerId): void {
        $this->game->applyEndTurn($currentPlayerId);
    }

    public function zombie(int $playerId, array $args): void {
        $choices = [['action' => 'end']];
        if ($args['canSettle']) {
            $choices[] = ['action' => 'settle'];
        }
        foreach ($args['possibleRoutes'] as $route) {
            $choices[] = ['action' => 'move', 'destination' => (int)$route->destination, 'from' => (int)$route->from];
        }
        $choice = $this->getRandomZombieChoice($choices);
        match ($choice['action']) {
            'end' => $this->actEndTurn($playerId),
            'settle' => $this->actPlaceEncampment($playerId),
            'move' => $this->actMove($choice['destination'], $playerId, $choice['from']),
            default => throw new \LogicException('Unknown zombie movement action'),
        };
    }
}
