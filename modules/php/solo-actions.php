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

        $tom = $this->setTomDice($dice);

        foreach($dice as &$idie) {
            $idie->roll();
        }

        $this->persistDice($dice);

        $this->notifyAllPlayers('setTomDice', '', [
            'dice' => $dice,
            'newPlayerColor' => $tom->color,
        ]);

        $this->rollAndPlaceTomDice($dice);

        $this->gamestate->nextState('startRound');
    }
}
