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
        $adventurersColors = $this->array_map(function ($adventurer) { return $adventurer->color; }, $adventurers);
        $dice = $this->getAvailableBigDice();

        $availableDice = array_filter($dice, function ($die) use ($adventurersColors) { return in_array($die->color, $adventurersColors); });

        return [
           'availableDice' => $availableDice,
        ];
    }
}