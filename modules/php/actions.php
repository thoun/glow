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
        $dice = $this->getBigDiceByColor($adventurer->color, $adventurer->dice);
        $this->moveDice($dice, 'player', $playerId);

        self::notifyAllPlayers('chosenAdventurer', clienttranslate('${player_name} chooses adventurer ${adventurerName}'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'adventurer' => $adventurer,
            'adventurerName' => $adventurer->name,
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

        $companion = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot))[0];

        if ($companion->location != 'meeting') {
            throw new BgaUserException("Companion not available");
        }

        $this->companions->moveCard($companion->id, 'player', $playerId);
        self::DbQuery("UPDATE player SET `player_recruit_day` = (".$this->getDaySql().") where `player_id` = $playerId");  

        $dice = $this->getDiceByLocation('meeting', $spot);
        if (count($dice) > 0) {
            $this->moveDice($dice, 'player', $playerId);
        }

        self::notifyAllPlayers('chosenCompanion', clienttranslate('${player_name} chooses companion ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
            'dice' => $dice,
        ]);
        
        $this->addPlayerFootprints($playerId, $this->getMeetingTrackFootprints($spot));
        $this->removeMeetingTrackFootprints($spot);

        $this->gamestate->nextState($this->getPlayerCount() == 2 ? 'removeCompanion' : 'nextPlayer');
    }
    
    public function removeCompanion(int $spot) {
        self::checkAction('removeCompanion'); 

        if ($spot < 1 || $spot > 5) {
            throw new BgaUserException("Not a valid spot");
        }
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot));

        if (count($companions) == 0) {
            return;
        }

        $companion = $companions[0];

        if ($companion->location != 'meeting') {
            throw new BgaUserException("Companion not available");
        }

        $this->sendToCemetary($companion->id, 'cemetery');

        self::notifyAllPlayers('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
            'playerId' => self::getActivePlayerId(),
            'player_name' => self::getActivePlayerName(),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
        ]);
        
        $this->gamestate->nextState('nextPlayer');
    }

    public function rollDice(array $ids) {
        self::checkAction('rollDice');

        $playerId = $this->getCurrentPlayerId();

        $this->applyRollDieCost($playerId, 1);

        $params = [
            'args' => $this->argRollDice(),
        ];

        $this->rollPlayerDice($ids, $params);
    }

    public function changeDie(int $id, int $face) {
        self::checkAction('changeDie');

        $playerId = $this->getCurrentPlayerId();

        $this->applyRollDieCost($playerId, 3);

        $die = $this->getDieById($id);
        $die->setFace($face);

        $this->persistDice([$die]);

        self::notifyAllPlayers('diceChanged', '', [
            'dice' => [$die],
            'args' => $this->argRollDice(),
        ]);
    }

    public function keepDice() {
        self::checkAction('keepDice');
        $this->gamestate->setPlayerNonMultiactive( $this->getCurrentPlayerId(), 'keepDice');
    }

    public function resolveCard(int $cardType, int $id) {
        self::checkAction('resolveCard');

        $playerId = intval($this->getCurrentPlayerId());

        $this->applyCardEffect($playerId, $cardType, $id);

        $remainingEffects = $this->getRemainingEffects($playerId);
     
        self::notifyPlayer($playerId, 'resolveCardUpdate', '', [
            'remainingEffects' => $remainingEffects,
        ]);
        
        if (count($remainingEffects) === 0) {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'move');
        }
    }
}
