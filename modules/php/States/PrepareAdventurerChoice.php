<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class PrepareAdventurerChoice extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 5,
            type: StateType::GAME,
            name: 'prepareAdventurerChoice',
        );
    }

    public function onEnteringState(): int|string {
        if ($this->game->isRandomAdventurersEnabled()) {
            return $this->setRandomAdventurers($this->game->getPlayersIds());
        } else {
            return ChooseAdventurer::class;
        }
    }

    private function setRandomAdventurers(array $playersIds): string {
        $soloMode = $this->game->isSoloMode();

        $possibleAdventurers = array_keys($this->game->ADVENTURERS);
        $affectedAdventurers = [];

        foreach ($playersIds as $playerId) {

            $adventurer = $possibleAdventurers[bga_rand(1, count($possibleAdventurers)) - 1];
            while (in_array($adventurer, $affectedAdventurers)) {
                $adventurer = $possibleAdventurers[bga_rand(1, count($possibleAdventurers)) - 1];
            }
            $affectedAdventurers[] = $adventurer;

            $this->game->applyChooseAdventurer($playerId, $adventurer, $soloMode);
        }

        if ($soloMode) {
            return ChooseTomDice::class;
        } else {
            return StartRound::class;
        }
    }
}
