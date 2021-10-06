<?php

trait SoloActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function chooseTomDice(array $diceIds) {
        $dice = $this->getDiceByIds($diceIds);

        $this->setTomDice($dice);

        foreach($dice as &$idie) {
            $idie->roll();
        }

        $this->persistDice($dice);

        self::notifyAllPlayers('setTomDice', '', [
            'dice' => $dice,
        ]);

        $this->rollAndPlaceTomDice($dice);

        $this->gamestate->nextState('startRound');
    }
}
