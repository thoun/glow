<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class PrivateSelectDiceAction extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 32,
            type: StateType::PRIVATE,
            name: 'privateSelectDiceAction',
            description: '',
            descriptionMyTurn: clienttranslate('${you} can reroll or change your dice'),
        );
    }

    public function getArgs(int $playerId): array {
        return $this->game->argRollDiceForPlayer($playerId);
    }

    #[PossibleAction]
    public function actSelectDiceToRoll(int $currentPlayerId): void {
        $this->game->gamestate->nextPrivateState($currentPlayerId, PrivateRollDice::class);
    }

    #[PossibleAction]
    public function actSelectDieToChange(int $currentPlayerId): void {
        $this->game->gamestate->nextPrivateState($currentPlayerId, PrivateChangeDie::class);
    }

    #[PossibleAction]
    public function actKeepDice(int $currentPlayerId): void {
        $dice = $this->game->getEffectiveDice($currentPlayerId);
        $grayMultiDice = array_values(array_filter($dice, fn($die) => $die->color == 80 && $die->face == 6));
        if (count($grayMultiDice) > 0) {
            throw new UserException("You must change multi die face");
        }

        $this->game->giveExtraTime($currentPlayerId);
        $this->game->gamestate->setPlayerNonMultiactive($currentPlayerId, SwapMulti::class);
    }

    public function zombie(int $playerId, array $args): void {
        if ($args['grayMultiDice']) {
            // Keeping dice is forbidden until every grey multi die has a real face.
            $this->actSelectDieToChange($playerId);
            return;
        }
        $choices = ['keep'];
        if ($this->game->getDiceByLocation('player', $playerId) !== []) {
            if ($this->game->getZombieDiceCosts($args, 1) !== []) {
                $choices[] = 'roll';
            }
            if ($this->game->getZombieDiceCosts($args, 3) !== []) {
                $choices[] = 'change';
            }
        }
        match ($this->getRandomZombieChoice($choices)) {
            'roll' => $this->actSelectDiceToRoll($playerId),
            'change' => $this->actSelectDieToChange($playerId),
            'keep' => $this->actKeepDice($playerId),
            default => throw new \LogicException('Unknown zombie dice action'),
        };
    }
}
