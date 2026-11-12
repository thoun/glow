<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\CheckAction;
use Bga\GameFramework\Actions\Types\IntArrayParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class ChooseTomDice extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 12,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseTomDice',
            description: '',
            descriptionMyTurn: clienttranslate('${you} must choose Tom dice'),
        );
    }

    public function getArgs(): array {
        $adventurers = $this->game->getAdventurersFromDb($this->game->adventurers->getCardsInLocation('deck'));
        $adventurersColors = array_map(fn($adventurer) => $adventurer->color, $adventurers);
        $dice = $this->game->getAvailableBigDice();

        $availableDice = array_values(array_filter($dice, fn($die) => in_array($die->color, $adventurersColors)));

        return [
           'dice' => $availableDice,
        ];
    }

    #[PossibleAction]
    #[CheckAction(false)]
    public function actChooseTomDice(#[IntArrayParam(name: 'dice')] array $diceIds): string {
        $dice = $this->game->getDiceByIds($diceIds);

        $tom = $this->game->setTomDice($dice);

        foreach($dice as &$idie) {
            $idie->roll();
        }

        $this->game->persistDice($dice);

        $this->game->bga->notify->all('setTomDice', '', [
            'dice' => $dice,
            'newPlayerColor' => $tom->color,
        ]);

        $this->game->rollAndPlaceTomDice($dice);

        return StartRound::class;
    }

    public function zombie(int $playerId, array $args): string {
        $byColor = [];
        foreach ($args['dice'] as $die) {
            $byColor[$die->color] ??= $die;
        }
        $dice = array_values($byColor);
        $choices = [];
        foreach ($dice as $i => $first) {
            foreach (array_slice($dice, $i + 1) as $second) {
                // Tom takes two different colors, excluding the yellow/purple pair.
                if (in_array($first->color, [6, 7], true) && in_array($second->color, [6, 7], true)) {
                    continue;
                }
                $choices[] = [(int)$first->id, (int)$second->id];
            }
        }
        if ($choices === []) {
            return StartRound::class;
        }
        return $this->actChooseTomDice($this->getRandomZombieChoice($choices));
    }
}
