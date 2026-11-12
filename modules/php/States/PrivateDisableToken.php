<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class PrivateDisableToken extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 72,
            type: StateType::PRIVATE,
            name: 'privateDisableToken',
            description: '',
            descriptionMyTurn: clienttranslate('${you} must choose a symbol to ignore'),
        );
    }

    #[PossibleAction]
    public function actDisableToken(#[IntParam(min: 0)] int $symbol, int $currentPlayerId): void {
        $this->game->addDisabledSymbol($currentPlayerId, $symbol);
        $args = new \stdClass();
        $this->game->addActivableTokens($currentPlayerId, $args);
        $this->game->removePlayerToken($currentPlayerId, $args->disableTokenId);

        $this->game->bga->notify->all('symbolDisabled', clienttranslate('${player_name} disable symbol ${disabledSymbol} on its dice until the end of the round'), [
            'playerId' => $currentPlayerId,
            'player_name' => $this->game->getPlayerName($currentPlayerId),
            'symbol' => $symbol,
            'disabledSymbol' => "[symbol$symbol]", // for log
        ]);

        $this->game->checkActivateTokenEnd($currentPlayerId);
    }

    #[PossibleAction]
    public function actCancelToken(int $currentPlayerId): void {
        $this->game->checkActivateTokenEnd($currentPlayerId);
    }

    public function zombie(int $playerId): void {
        $this->actDisableToken($this->getRandomZombieChoice(range(1, 5)), $playerId);
    }
}
