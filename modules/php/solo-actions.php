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

        self::notifyAllPlayers('diceRolled', '', [
            'dice' => $dice,
        ]);

        // roll dice
        foreach($dice as &$idie) {
            if ($idie->value > 5) { // we apply black die "-2"
                $this->applyEffect(0, $idie->value);
                $this->moveDice([$idie], 'table');
            } else {
                $this->moveDice([$idie], 'meeting', $idie->value);

                self::notifyAllPlayers('moveBlackDie', '', [
                    'die' => $idie,
                ]);
            }
        }

        $this->gamestate->nextState('startRound');
    }
}
