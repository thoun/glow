<?php

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */
    
    public function chooseAdventurer(int $id) {
        self::checkAction('chooseAdventurer'); 
        
        $playerId = intval(self::getActivePlayerId());

        $adventurer = $this->getAdventurerFromDb($this->adventurers->getCard($id));

        if ($adventurer->location != 'deck') {
            throw new BgaUserException("Adventurer not available");
        }

        $this->adventurers->moveCard($adventurer->id, 'player', $playerId);

        // take big dice
        $dice = $this->getDiceByColorAndSize($adventurer->color, false, $adventurer->dice);
        $this->moveDiceToPlayer($dice, $playerId);

        self::notifyAllPlayers('chosenAdventurer', clienttranslate('${player_name} chooses adventurer ${adventurerName}'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'adventurerName' => $this->getAdventurerName($adventurer->color),
            'dice' => $dice,
        ]);

        $this->gamestate->nextState('nextPlayer');
    }
    
    public function recruitCompanion(int $spot) {
        self::checkAction('recruitCompanion'); 

        if ($spot < 1 || $spot > 5) {
            throw new BgaUserException("Not a valid spot");
        }
        
        $playerId = intval(self::getActivePlayerId());

        // TODO get companion & stuff with it

        $this->gamestate->nextState($this->getPlayerCount() == 2 ? 'removeCompanion' : 'nextPlayer');
    }
    
    public function removeCompanion(int $spot) {
        self::checkAction('removeCompanion'); 

        if ($spot < 1 || $spot > 5) {
            throw new BgaUserException("Not a valid spot");
        }
        
        $playerId = intval(self::getActivePlayerId());

        // TODO remove companion leave stuff with it
        
        $this->gamestate->nextState('nextPlayer');
    }
}
