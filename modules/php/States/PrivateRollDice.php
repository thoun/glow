<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntArrayParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class PrivateRollDice extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 331,
            type: StateType::PRIVATE,
            name: 'privateRollDice',
            description: '',
            descriptionMyTurn: clienttranslate('Select 1 or 2 dice to reroll'),
            transitions: [
                'rerollImmediate' => 333,
                'selectDice' => 32,
            ],
        );
    }

    public function getArgs(int $playerId): array {
        return $this->game->argRollDiceForPlayer($playerId);
    }

    #[PossibleAction]
    public function actRollDice(#[IntArrayParam] array $ids, #[IntArrayParam] array $cost, int $currentPlayerId): void {
        foreach($ids as $id) {
            $die = $this->game->getDieById($id);
            if ($die->location_arg != $currentPlayerId) {
                throw new UserException("You can't roll this die");
            }
        }

        $this->game->applyRollDieCost($currentPlayerId, 1, $cost);

        $this->game->rollPlayerDice($currentPlayerId, $ids, clienttranslate('${player_name} rerolls dice ${originalDice} and gets ${rolledDice}'), []);

        $this->game->bga->tableStats->inc('rerolledDice', count($ids));
        $this->game->bga->playerStats->inc('rerolledDice', count($ids), $currentPlayerId);

        $args = $this->game->argRerollImmediate($currentPlayerId);
        $this->game->gamestate->nextPrivateState($currentPlayerId, $args['selectedDie'] !== null ? 'rerollImmediate' : 'selectDice');
    }

    #[PossibleAction]
    public function actCancel(int $currentPlayerId): void {
        $this->game->gamestate->nextPrivateState($currentPlayerId, PrivateSelectDiceAction::class);
    }

    public function zombie(int $playerId, array $args): void {
        $dice = array_values($this->game->getDiceByLocation('player', $playerId));
        $selections = [];
        foreach ($dice as $i => $die) {
            $selections[] = [(int)$die->id];
            foreach (array_slice($dice, $i + 1) as $second) {
                $selections[] = [(int)$die->id, (int)$second->id];
            }
        }
        $choices = [];
        foreach ($this->game->getZombieDiceCosts($args, 1) as $cost) {
            foreach ($selections as $ids) {
                $choices[] = ['ids' => $ids, 'cost' => $cost];
            }
        }
        if ($choices === []) {
            $this->actCancel($playerId);
            return;
        }
        $choice = $this->getRandomZombieChoice($choices);
        $this->actRollDice($choice['ids'], $choice['cost'], $playerId);
    }
}
