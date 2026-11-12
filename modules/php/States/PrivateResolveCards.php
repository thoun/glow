<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class PrivateResolveCards extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 42,
            type: StateType::PRIVATE,
            name: 'privateResolveCards',
            description: '',
            descriptionMyTurn: clienttranslate('${you} must resolve your cards (select the card to resolve first)'),
            transitions: [
                'removeToken' => 44,
            ],
        );
    }

    public function getArgs(int $playerId): array {
        return $this->game->argResolveCardsForPlayer($playerId);
    }

    #[PossibleAction]
    public function actResolveCard(#[IntParam(name: 'type', min: 0)] int $cardType, #[IntParam(min: 0)] int $id, int $currentPlayerId, #[IntParam(min: 0)] ?int $dieId = null): void {
        $resolveCardsForPlayer = (object)$this->game->argResolveCardsForPlayer($currentPlayerId);
        $remainingEffect = \array_find($resolveCardsForPlayer->remainingEffects, fn($remainingEffect) => $remainingEffect[0] == $cardType && $remainingEffect[1] == $id);
        if ($remainingEffect == null) {
            throw new UserException("You can't apply that effect");
        }

        if ($remainingEffect[0] == 1 && gettype($remainingEffect[2]) == 'string') {
            $redirect = $remainingEffect[2];
            if (\str_contains($redirect, 'exchangeToken')) {
                $count = intval(explode('-', $redirect)[1]);
                $this->game->addPlayerTokens($currentPlayerId, $count, clienttranslate('${player_name} ${gainsloses} ${abstokens} tokens with ${effectOrigin} effect'), ['effectOrigin' => 'companion', 'gainsloses' => clienttranslate('gains'), 'i18n' => ['gainsloses']]);
                $redirect = 'removeToken';
                $this->game->setGlobalVariable(REMOVE_TOKENS, $count);
            }

            if ($redirect != null) {
                $this->game->setSelectedCompanion($currentPlayerId, $remainingEffect[1]);
                $this->game->gamestate->nextPrivateState($currentPlayerId, $redirect);
                return;
            }
        }

        $this->applyResolveCard($currentPlayerId, $cardType, $id, $dieId);

        $this->game->checkResolveCardEnd($currentPlayerId);
    }

    #[PossibleAction]
    public function actResolveAll(int $currentPlayerId): void {
        $resolveCardsForPlayer = (object)$this->game->argResolveCardsForPlayer($currentPlayerId);

        while (count($resolveCardsForPlayer->remainingEffects) > 0) {
            $firstRemainingEffect = $resolveCardsForPlayer->remainingEffects[0];
            $resolveCardsForPlayer = $this->applyResolveCard($currentPlayerId, $firstRemainingEffect[0], $firstRemainingEffect[1], 0);
        }

        $this->game->gamestate->setPlayerNonMultiactive($currentPlayerId, 'move');
        $this->game->giveExtraTime($currentPlayerId);
    }

    private function applyResolveCard(int $playerId, int $cardType, int $id, $dieId = 0, $tokenId = 0) {
        $this->game->applyCardEffect($playerId, $cardType, $id, $dieId, $tokenId);

        $resolveCardsForPlayer = (object)$this->game->argResolveCardsForPlayer($playerId);

        $this->game->gamestate->nextPrivateState($playerId, self::class);

        $this->game->bga->tableStats->inc('resolvedCards', 1);
        $this->game->bga->playerStats->inc('resolvedCards', 1, $playerId);

        return $resolveCardsForPlayer;
    }

    public function zombie(int $playerId, array $args): void {
        $choices = [];
        foreach ($args['remainingEffects'] as $effect) {
            if (is_array($effect[2])) {
                foreach ($effect[2] as $die) {
                    $choices[] = [(int)$effect[0], (int)$effect[1], (int)$die->id];
                }
            } else {
                $choices[] = [(int)$effect[0], (int)$effect[1], null];
            }
        }
        if ($choices === []) {
            $this->actResolveAll($playerId);
            return;
        }
        [$type, $id, $dieId] = $this->getRandomZombieChoice($choices);
        $this->actResolveCard($type, $id, $playerId, $dieId);
    }
}
