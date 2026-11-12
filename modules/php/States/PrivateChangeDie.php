<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntArrayParam;
use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class PrivateChangeDie extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 332,
            type: StateType::PRIVATE,
            name: 'privateChangeDie',
            description: '',
            descriptionMyTurn: clienttranslate('Select 1 die to change'),
        );
    }

    public function getArgs(int $playerId): array {
        return $this->game->argRollDiceForPlayer($playerId);
    }

    #[PossibleAction]
    public function actChangeDie(#[IntParam(min: 0)] int $id, #[IntParam(name: 'value', min: 0)] int $face, #[IntArrayParam] array $cost, int $currentPlayerId): void {
        $die = $this->game->getDieById($id);
        if ($die->location_arg != $currentPlayerId) {
            throw new UserException("You can't roll this die");
        }

        $free = $die->color == 80 && $die->face == 6;
        if (!$free) {
            $this->game->applyRollDieCost($currentPlayerId, 3, $cost);
        }
        $originalDiceStr = $this->game->getDieFaceLogName($die);
        $die->setFace($face);
        $rolledDiceStr = $this->game->getDieFaceLogName($die);

        $this->game->persistDice([$die]);

        $this->game->bga->notify->all('diceChanged', clienttranslate('${player_name} change die ${originalDice} to ${rolledDice}'), [
            'playerId' => $currentPlayerId,
            'player_name' => $this->game->getPlayerName($currentPlayerId),
            'dice' => [$die],
            'originalDice' => $originalDiceStr,
            'rolledDice' => $rolledDiceStr,
        ]);

        $this->game->bga->tableStats->inc('changedDice', 1);
        $this->game->bga->playerStats->inc('changedDice', 1, $currentPlayerId);

        $this->game->gamestate->nextPrivateState($currentPlayerId, PrivateSelectDiceAction::class);
    }

    #[PossibleAction]
    public function actCancel(int $currentPlayerId): void {
        $this->game->gamestate->nextPrivateState($currentPlayerId, PrivateSelectDiceAction::class);
    }

    public function zombie(int $playerId, array $args): void {
        $choices = [];
        $dice = array_values($this->game->getDiceByLocation('player', $playerId));
        $forcedDice = array_values(array_filter($dice, fn($die) => $die->color == 80 && $die->face == 6));
        foreach ($forcedDice !== [] ? $forcedDice : $dice as $die) {
            $costs = $die->color == 80 && $die->face == 6
                ? [[0, 0, 0, 0]] : $this->game->getZombieDiceCosts($args, 3);
            $faces = $die->color <= 5 || $die->color == 80 ? 5 : 6;
            foreach ($costs as $cost) {
                foreach (range(1, $faces) as $face) {
                    $choices[] = ['id' => (int)$die->id, 'face' => $face, 'cost' => $cost];
                }
            }
        }
        if ($choices === []) {
            $this->actCancel($playerId);
            return;
        }
        $choice = $this->getRandomZombieChoice($choices);
        $this->actChangeDie($choice['id'], $choice['face'], $choice['cost'], $playerId);
    }
}
