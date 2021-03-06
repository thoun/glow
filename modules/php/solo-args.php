<?php


trait SoloArgsTrait {
    
//////////////////////////////////////////////////////////////////////////////
//////////// Game state arguments
////////////

    /*
        Here, you can create methods defined as "game state arguments" (see "args" property in states.inc.php).
        These methods function is to return some additional information that is specific to the current
        game state.
    */

    function argChooseTomDice() {
        $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('deck'));
        $adventurersColors = array_map(fn($adventurer) => $adventurer->color, $adventurers);
        $dice = $this->getAvailableBigDice();

        $availableDice = array_values(array_filter($dice, fn($die) => in_array($die->color, $adventurersColors)));

        return [
           'dice' => $availableDice,
        ];
    }
}