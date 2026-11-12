<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class PrivateKillToken extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 71,
            type: StateType::PRIVATE,
            name: 'privateKillToken',
            description: '',
            descriptionMyTurn: clienttranslate('${you} must choose a companion or spell to discard'),
        );
    }

    #[PossibleAction]
    public function actKillToken(#[IntParam(min: 0)] int $id, int $currentPlayerId, #[IntParam(min: 0)] ?int $type = null): void {
        // Omission was allowed by the controller but rejected by the typed game handler.
        if ($type === null) {
            throw new \TypeError('Argument "type" must be an integer');
        }

        $this->game->applyDiscardCompanionSpell($currentPlayerId, $type, $id);
        $args = new \stdClass();
        $this->game->addActivableTokens($currentPlayerId, $args);
        $this->game->removePlayerToken($currentPlayerId, $args->killTokenId);

        $this->game->checkActivateTokenEnd($currentPlayerId);
    }

    #[PossibleAction]
    public function actCancelToken(int $currentPlayerId): void {
        $this->game->checkActivateTokenEnd($currentPlayerId);
    }

    public function zombie(int $playerId): void {
        $choices = $this->game->getZombieDiscardChoices($playerId);
        if ($choices === []) {
            $this->actCancelToken($playerId);
            return;
        }
        $choice = $this->getRandomZombieChoice($choices);
        $this->actKillToken($choice['id'], $playerId, $choice['type']);
    }
}
