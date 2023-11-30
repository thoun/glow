<?php

require_once(__DIR__.'/objects/adventurer.php');

trait ArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argChooseAdventurer() {
        $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('deck'));

        return [
           'adventurers' => $adventurers,
        ];
    }

    function argRecuitCompanion() {
        $companions = [];
        $companions[0] = null;
        
        $solo = $this->isSoloMode();

        $dice = $this->getDiceByLocation('meeting');

        $spotCount = $this->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $companionsFromDb = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;

            if ($companion && $companion->die) {
                $companion->noDieWarning = !$this->isBigDieAvailable($companion->dieColor);
            }

            $spotDice = array_values(array_filter($dice, fn($idie) => $idie->location_arg === $i));

            $footprints = $this->getMeetingTrackFootprints($i);

            $soloTile = null;
            if ($solo) {
                $soloTilesFromDb = $this->getSoloTilesFromDb($this->soloTiles->getCardsInLocation('meeting', $i));
                $soloTile = count($soloTilesFromDb) > 0 ? $soloTilesFromDb[0] : null;
            }

            $companions[$i] = new MeetingTrackSpot($companion, $spotDice, $footprints, $soloTile);
        }

        return [
           'companions' => $companions,
           'topDeckType' => $this->getTopDeckType(),
        ];
    }

    function argSelectSketalDie() {
        $dice = $this->getAvailableBigDice();

        return [
           'dice' => $dice,
        ];
    }

    function argRemoveCompanion() {
        $companions = [];
        $companions[0] = null;
        
        $spotCount = $this->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $companionsFromDb = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;
            $companions[$i] = new MeetingTrackSpot($companion);
        }

        return [
           'companions' => $companions,
        ];
    }

    function argRollDiceForPlayer(int $playerId) {
        $playerScore = $this->getPlayerScore($playerId);

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

    function argSwap() {
        $companion = null;
        $dbCard = $this->companions->getCardOnTop('hulios');
        if ($dbCard) {
            $companion = $this->getCompanionFromDb($dbCard);
        }

        if ($companion && $companion->die) {
            $companion->noDieWarning = !$this->isBigDieAvailable($companion->dieColor);
        }

        return [
            'card' => $companion,
        ];
    }

    function argResurrect() {
        $cards = $this->getCompanionsFromDb($this->companions->getCardsInLocation('cemetery'));

        foreach($cards as &$companion) {
            if ($companion && $companion->die) {
                $companion->noDieWarning = !$this->isBigDieAvailable($companion->dieColor);
            }
        }

        return [
            'cemeteryCards' => $cards,
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
        $resolveCardsForPlayer = new stdClass();
        $resolveCardsForPlayer->remainingEffects = $this->getRemainingEffects($playerId);
        $this->addActivableTokens($playerId, $resolveCardsForPlayer);
        return $resolveCardsForPlayer;
    }

    function argRemoveToken(int $playerId) {
        return [
            'tokens' => $this->getPlayerTokens($playerId),
        ];
    }

    function getPossibleRoutes(int $playerId) {
        $side = $this->getSide();
        $possibleRoutes = [];

        $meeples = $this->getPlayerMeeples($playerId);
        foreach ($meeples as $meeple) {
            if ($meeple->type < 2) {
                $possibleRoutesForMeeple = $this->getPossibleRoutesForPlayer($side, $meeple->position, $playerId);
                foreach($possibleRoutesForMeeple as &$possibleRoute) {
                    $possibleRoute->from = $meeple->position;

                    if (
                        !$this->array_some($possibleRoutes, fn($p) => $possibleRoute->from == $p->from && $possibleRoute->destination == $p->destination)
                        && !$this->array_some($meeples, fn($m) => $possibleRoute->destination == $m->position && $m->type < 2)
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

        $args = new stdClass();
        $args->possibleRoutes = $this->getPossibleRoutes($playerId);
        $args->canSettle = $side == 1 ? $this->canSettle($playerId) : null;
        $this->addActivableTokens($playerId, $args);

        return $args;
    }

    function argMoveBlackDie() {
        $sql = "select `card_location_arg` from `companion` where `card_location` = 'meeting'";
        $availableSpots = array_values(array_map(fn($dbLine) => intval($dbLine['card_location_arg']), $this->getCollectionFromDb($sql)));

        $die = $this->getSmallBlackDie();
        $dieSpot = $die->location_arg;

        $possibleSpots = array_values(array_filter($availableSpots, fn($spot) => $spot != $dieSpot));

        return [
            'possibleSpots' => $possibleSpots,
        ];
    }

    function argUriomRecruitCompanion() {
        $uriomIntervention = $this->getGlobalVariable(URIOM_INTERVENTION);
        return [
            'spot' => $uriomIntervention->spot,
        ];
    }
}