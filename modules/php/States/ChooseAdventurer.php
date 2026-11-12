<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class ChooseAdventurer extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 10,
            type: StateType::ACTIVE_PLAYER,
            name: 'chooseAdventurer',
            description: clienttranslate('${actplayer} must choose an adventurer'),
            descriptionMyTurn: clienttranslate('${you} must choose an adventurer'),
        );
    }

    public function getArgs(): array {
        $adventurers = $this->game->getAdventurersFromDb($this->game->adventurers->getCardsInLocation('deck'));

        return [
           'adventurers' => $adventurers,
        ];
    }

    #[PossibleAction]
    public function actChooseAdventurer(#[IntParam(min: 0)] int $id, int $activePlayerId): int|string {
        $soloMode = $this->game->isSoloMode();

        $this->game->applyChooseAdventurer($activePlayerId, $id, $soloMode);

        if ($this->game->isSoloMode()) {
            $this->game->giveExtraTime($activePlayerId);
            return ChooseTomDice::class;
        } else {
            return NextPlayerChooseAdventurer::class;
        }
    }

    public function zombie(int $playerId, array $args): int|string {
        $choices = array_values($args['adventurers']);
        if ($choices === []) {
            return NextPlayerChooseAdventurer::class;
        }
        $adventurer = $this->getRandomZombieChoice($choices);
        return $this->actChooseAdventurer((int)$adventurer->id, $playerId);
    }
}
