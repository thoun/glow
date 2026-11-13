<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class RemoveToken extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 44,
            type: StateType::PRIVATE,
            name: 'removeToken',
            description: '',
            descriptionMyTurn: clienttranslate('${you} must remove one of your tokens (click the token to remove)'),
        );
    }

    public function getArgs(int $playerId): array {
        $tokens = array_values(array_filter($this->game->getPlayerTokens($playerId), fn($token) => $token->type != 2));
        $companion = $this->game->getCompanionFromDb($this->game->companions->getCard($this->game->getSelectedCompanion($playerId)));
        $tokenCost = array_sum(array_map(fn($condition) => -$condition - 50, array_filter($companion->effect->conditions, fn($condition) => $condition < -50 && $condition > -60)));
        $count = $tokenCost > 0 ? $tokenCost : $this->game->getGlobalVariable(REMOVE_TOKENS);

        return [
            'tokens' => $tokens,
            'count' => $count,
        ];
    }

    #[PossibleAction]
    public function actRemoveToken(#[IntParam(name: 'id', min: 0)] int $tokenId, int $currentPlayerId): void {
        $companionId = $this->game->getSelectedCompanion($currentPlayerId);

        $resolveCardsForPlayer = (object)$this->game->argResolveCardsForPlayer($currentPlayerId);
        $remainingEffect = \array_find($resolveCardsForPlayer->remainingEffects, fn($remainingEffect) => $remainingEffect[0] == 1 && $remainingEffect[1] == $companionId);
        if ($remainingEffect == null) {
            throw new UserException("You can't apply that effect");
        }

        $availableTokens = array_filter($this->game->getPlayerTokens($currentPlayerId), fn($token) => $token->type != 2);
        if (!\array_any($availableTokens, fn($token) => $token->id === $tokenId)) {
            throw new UserException("You can't remove this token");
        }

        if ($remainingEffect[2] === 'removeToken') {
            // Pay Vorivi's cost and apply its reward together, through normal card resolution.
            $this->game->applyCardEffect($currentPlayerId, 1, $companionId, tokenId: $tokenId);
        } else {
            $count = $this->game->getGlobalVariable(REMOVE_TOKENS) - 1;
            $this->game->setGlobalVariable(REMOVE_TOKENS, $count);

            $companion = $this->game->getCompanionFromDb($this->game->companions->getCard($companionId));
            $this->game->applyEffect($currentPlayerId, -51, 1, $companion, 0, $tokenId);

            if ($count > 0) {
                $this->game->gamestate->setPrivateState($currentPlayerId, self::class);
                return;
            }
            $this->game->saveAppliedEffect($currentPlayerId, [1, $companionId]);
        }

        $this->game->bga->tableStats->inc('resolvedCards', 1);
        $this->game->bga->playerStats->inc('resolvedCards', 1, $currentPlayerId);

        $this->game->checkResolveCardEnd($currentPlayerId);
    }

    #[PossibleAction]
    public function actPassRemoveToken(int $currentPlayerId): void {
        $companionId = $this->game->getSelectedCompanion($currentPlayerId);

        $resolveCardsForPlayer = (object)$this->game->argResolveCardsForPlayer($currentPlayerId);
        $remainingEffect = \array_find($resolveCardsForPlayer->remainingEffects, fn($remainingEffect) => $remainingEffect[0] == 1 && $remainingEffect[1] == $companionId);
        if ($remainingEffect == null || $remainingEffect[2] === 'removeToken') {
            throw new UserException("You can't apply that effect");
        }

        $this->game->setGlobalVariable(REMOVE_TOKENS, 0);
        $this->game->saveAppliedEffect($currentPlayerId, [1, $companionId]);

        $this->game->bga->tableStats->inc('resolvedCards', 1);
        $this->game->bga->playerStats->inc('resolvedCards', 1, $currentPlayerId);

        $this->game->checkResolveCardEnd($currentPlayerId);
    }

    public function zombie(int $playerId, array $args): void {
        $choices = array_values($args['tokens']);
        if ($choices === []) {
            $this->actPassRemoveToken($playerId);
            return;
        }
        $token = $this->getRandomZombieChoice($choices);
        $this->actRemoveToken((int)$token->id, $playerId);
    }
}
