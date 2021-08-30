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

        for ($i=1;$i<=5;$i++) {
            $companions[$i] = new stdClass();
            $companionsFromDb = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companions[$i]->companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;
        }

        return [
           'companions' => $companions,
        ];
    }

    function argRemoveCompanion() {
        $companions = [];
        $companions[0] = null;
        
        for ($i=1;$i<=5;$i++) {
            $companions[$i] = new stdClass();
            $companionsFromDb = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $i));
            $companions[$i]->companion = count($companionsFromDb) > 0 ? $companionsFromDb[0] : null;
        }

        return [
           'companions' => $companions,
        ];
    }
}