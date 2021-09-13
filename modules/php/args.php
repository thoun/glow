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

    function argRollDice() {
        $playerId = self::getCurrentPlayerId();

        $rerollCompanion = $this->getPlayerCompanionRerolls($playerId);
        $rerollTokens = $this->getPlayerRerolls($playerId);
        $rerollScore = $this->getRerollScoreCost($this->getPlayerScore($playerId));

        return [
            'rerollCompanion' => $rerollCompanion,
            'rerollTokens' => $rerollTokens,
            'rerollScore' => $rerollScore,
        ];
    }
}