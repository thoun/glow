<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class SwapMulti extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 34,
            type: StateType::MULTIPLE_ACTIVE_PLAYER,
            name: 'swapMulti',
            description: clienttranslate("Players with Hulios can swap one companion with his special deck"),
            descriptionMyTurn: clienttranslate('${you} can swap one of your companion with this card'),
            transitions: [
                'next' => 35,
            ],
            initialPrivate: Swap::class,
        );
    }

    public function getArgs(): array {
        return (new Swap($this->game))->getArgs();
    }

    public function onEnteringState(): void {
        $playerWithHuliosDiceActivated = [];

        $playersIds = $this->game->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->game->getEffectiveDice($playerId);
            $unusedHuliosDice = array_filter($dice, fn($die) => $die->color == 9 && $die->value == 9 && !$die->used);

            if (count($unusedHuliosDice) > 0) {
                $playerWithHuliosDiceActivated[] = $playerId;
            }
        }

        if (count($playerWithHuliosDiceActivated) > 0) {
            $this->game->gamestate->setPlayersMultiactive($playerWithHuliosDiceActivated, 'next', true);
            $this->game->gamestate->initializePrivateStateForAllActivePlayers();
        } else {
            $this->game->gamestate->nextState('next');
        }
    }

    public function zombie(int $playerId): void {

    }
}
