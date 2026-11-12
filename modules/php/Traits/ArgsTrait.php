<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Traits;

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Shared argument builders are used by state classes and game services.
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argSelectSketalDie() {
        $dice = $this->getAvailableBigDice();

        return [
           'dice' => $dice,
        ];
    }

    function argRollDiceForPlayer(int $playerId) {
        $playerScore = $this->bga->playerScore->get($playerId);

        $rerollCompanion = $this->getPlayerCompanionRerolls($playerId);
        $rerollCrolos = $this->getPlayerCrolosRerolls($playerId, $playerScore);
        $rerollTokens = $this->getPlayerRerolls($playerId);
        $rerollScore = $this->getRerollScoreCost($playerScore);

        $dice = $this->getEffectiveDice($playerId);
        $grayMultiDice = array_values(array_filter($dice, fn($die) => $die->color == 80 && $die->face == 6));

        return [
            'rerollCompanion' => $rerollCompanion,
            'rerollCrolos' => $rerollCrolos,
            'rerollTokens' => $rerollTokens,
            'rerollScore' => $rerollScore,
            'grayMultiDice' => count($grayMultiDice) > 0,
        ];
    }

    function argRerollImmediate(int $playerId) {
        $dice = $this->getEffectiveDice($playerId);
        $rerollImmediateDice = array_values(array_filter($dice, fn($die) => $die->color == 10 && $die->face == 6));
        $die = count($rerollImmediateDice) > 0 ? $rerollImmediateDice[0] : null;

        return [
            'selectedDie' => $die,
        ];
    }

    function addActivableTokens(int $playerId, Object &$args) {
        $args->killTokenId = 0;
        $args->disableTokenId = 0;
        
        if (!$this->tokensActivated()) {
            return;
        }

        $tokens = $this->getPlayerTokens($playerId);

        foreach ($tokens as $token) {
            if ($token->type == 3) {
                $effect = $token->typeArg;
                if ($effect == 37 && $this->canDiscardCompanionSpell($playerId)) {
                    $args->killTokenId = $token->id;
                } else if ($effect == 0) {
                    $args->disableTokenId = $token->id;
                }
            }
        }
    }

    function argKillToken(int $playerId) {
        return [
            //'companions' => $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId), null, 'location_arg'),
            //'spells' => $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId)),
        ];
    }

    function argDisableToken(int $playerId) {
        return [
            //'symbols' => [1,2,3,4,5],
        ];
    }

    function argResolveCardsForPlayer(int $playerId) {
        $resolveCardsForPlayer = new \stdClass();
        $resolveCardsForPlayer->remainingEffects = $this->getRemainingEffects($playerId);
        $this->addActivableTokens($playerId, $resolveCardsForPlayer);
        return (array)$resolveCardsForPlayer;
    }

    function getPossibleRoutes(int $playerId) {
        $side = $this->getSide();
        $solo = $this->isSoloMode();
        $possibleRoutes = [];

        $meeples = $this->getPlayerMeeples($playerId);
        foreach ($meeples as $meeple) {
            if ($meeple->type < 2) {
                $possibleRoutesForMeeple = $this->getPossibleRoutesForPlayer($side, $meeple->position, $playerId, $solo);
                foreach($possibleRoutesForMeeple as &$possibleRoute) {
                    $possibleRoute->from = $meeple->position;

                    if (
                        !\array_any($possibleRoutes, fn($p) => $possibleRoute->from == $p->from && $possibleRoute->destination == $p->destination)
                        && !\array_any($meeples, fn($m) => $possibleRoute->destination == $m->position && $m->type < 2)
                    ) {
                        $possibleRoutes[] = $possibleRoute;
                    }
                }
            }
        }

        return $possibleRoutes;
    }

    function argMoveForPlayer(int $playerId) {
        $side = $this->getSide();

        $args = new \stdClass();
        $args->possibleRoutes = $this->getPossibleRoutes($playerId);
        $args->canSettle = $side == 1 ? $this->canSettle($playerId) : null;
        $this->addActivableTokens($playerId, $args);

        return (array)$args;
    }

}