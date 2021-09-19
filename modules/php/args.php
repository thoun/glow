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

        $dice = $this->getDiceByLocation('meeting');

        for ($i=1;$i<=5;$i++) {
            $companionsFromDb = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;

            $spotDice = array_values(array_filter($dice, function($idie) use ($i) { return $idie->location_arg === $i; }));

            $footprints = $this->getMeetingTrackFootprints($i);

            $companions[$i] = new MeetingTrackSpot($companion, $spotDice, $footprints);
        }

        return [
           'companions' => $companions,
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
        
        for ($i=1;$i<=5;$i++) {
            $companionsFromDb = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;
            $companions[$i] = new MeetingTrackSpot($companion);
        }

        return [
           'companions' => $companions,
        ];
    }

    function argRollDiceForPlayer(int $playerId) {

        $rerollCompanion = $this->getPlayerCompanionRerolls($playerId);
        $rerollTokens = $this->getPlayerRerolls($playerId);
        $rerollScore = $this->getRerollScoreCost($this->getPlayerScore($playerId));

        return [
            'rerollCompanion' => $rerollCompanion,
            'rerollTokens' => $rerollTokens,
            'rerollScore' => $rerollScore,
        ];
    }

    function argRollDice() {
        $playersIds = $this->getPlayersIds();
        $args = [];

        foreach($playersIds as $playerId) {
            $args[$playerId] = $this->argRollDiceForPlayer($playerId);
        }

        return $args;
    }

    function argResolveCards() {
        $playersIds = $this->getPlayersIds();
        $args = [];

        foreach($playersIds as $playerId) {
            $args[$playerId] = $this->getRemainingEffects($playerId);
        }

        return $args;
    }

    function getPossibleRoutes(int $playerId) {
        $side = $this->getSide();
        $possibleRoutes = [];

        $meeples = $this->getPlayerMeeples($playerId);
        foreach ($meeples as $meeple) {
            if ($meeple->type < 2) {
                $possibleRoutesForMeeple = $this->getPossibleRoutesForPlayer($side, $meeple->position, $playerId);
                foreach($possibleRoutesForMeeple as $possibleRoute) {
                    if (!$this->array_some($possibleRoutes, function($p) use ($possibleRoute) { return $possibleRoute->destination == $p->destination; })) {
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

        return $args;
    }

    function argMove() {
        $playersIds = $this->getPlayersIds();
        $args = [];

        foreach($playersIds as $playerId) {
            $args[$playerId] = $this->argMoveForPlayer($playerId);
        }

        return $args;
    }

    function argMoveBlackDie() {
        $sql = "select `card_location_arg` from `companion` where `card_location` = 'meeting'";
        $availableSpots = array_values(array_map(function($dbLine) { return intval($dbLine['card_location_arg']); }, self::getCollectionFromDb($sql)));

        $die = $this->getBlackDie();
        $dieSpot = $die->location_arg;

        $possibleSpots = array_values(array_filter($availableSpots, function ($spot) use ($dieSpot) { return $spot != $dieSpot; }));

        return [
            'possibleSpots' => $possibleSpots,
        ];
    }
}