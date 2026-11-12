<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class PrivateRerollImmediate extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 333,
            type: StateType::PRIVATE,
            name: 'privateRerollImmediate',
            description: '',
            descriptionMyTurn: clienttranslate('${you} can select a die to reroll with the pink die'),
            transitions: [
                'rerollImmediate' => 333,
                'selectDice' => 32,
            ],
        );
    }

    public function getArgs(int $playerId): array {
        return $this->game->argRerollImmediate($playerId);
    }

    #[PossibleAction]
    public function actRerollImmediate(#[IntParam(min: 0)] int $id, int $currentPlayerId): void {
        $args = $this->game->argRerollImmediate($currentPlayerId);
        $ids = [$args['selectedDie']->id];
        if ($id > 0) {
            $ids[] = $id;
        }

        foreach($ids as $id) {
            $die = $this->game->getDieById($id);
            if ($die->location_arg != $currentPlayerId) {
                throw new UserException("You can't roll this die");
            }
        }

        $this->game->rollPlayerDice($currentPlayerId, $ids, clienttranslate('${player_name} rerolls dice ${originalDice} and gets ${rolledDice}'), []);

        $this->game->bga->tableStats->inc('rerolledDice', count($ids));
        $this->game->bga->playerStats->inc('rerolledDice', count($ids), $currentPlayerId);

        $args = $this->game->argRerollImmediate($currentPlayerId);
        $this->game->gamestate->nextPrivateState($currentPlayerId, $args['selectedDie'] !== null ? 'rerollImmediate' : 'selectDice');
    }

    public function zombie(int $playerId, array $args): void {
        if ($args['selectedDie'] === null) {
            // No immediate reroll remains; use the existing select-dice destination.
            $this->game->gamestate->nextPrivateState($playerId, PrivateSelectDiceAction::class);
            return;
        }
        $choices = [0]; // Reroll only the pink die.
        foreach ($this->game->getDiceByLocation('player', $playerId) as $die) {
            if ($die->id != $args['selectedDie']->id) {
                $choices[] = (int)$die->id;
            }
        }
        $this->actRerollImmediate($this->getRandomZombieChoice($choices), $playerId);
    }
}
