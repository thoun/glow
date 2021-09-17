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

    public function applyRecruitCompanion(int $playerId, object $companion, $spot = null) {
        $this->companions->moveCard($companion->id, 'player', $playerId);
        self::DbQuery("UPDATE player SET `player_recruit_day` = (".$this->getDaySql().") where `player_id` = $playerId");  

        $dice = null;
        if ($spot !== null) {
            $dice = $this->getDiceByLocation('meeting', $spot);
            if (count($dice) > 0) {
                $this->moveDice($dice, 'player', $playerId);
            }
        }

        self::notifyAllPlayers('chosenCompanion', clienttranslate('${player_name} chooses companion ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => self::getActivePlayerName(),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
            'dice' => $dice,
        ]);
        
        if ($spot !== null) {
            $this->addPlayerFootprints($playerId, $this->getMeetingTrackFootprints($spot));
            $this->removeMeetingTrackFootprints($spot);
        }

        // take new die if Sketal
        if ($companion->die && $companion->dieColor > 0) {
            $dice = $this->getAvailableBigDice();
            foreach($dice as $die) {
                if ($die->color === $companion->dieColor) {
                    $this->takeSketalDie($playerId, $die);
                    break;
                }
            }
        }
    }

    function redirectAfterRecruit() {
        $this->gamestate->nextState($this->getPlayerCount() == 2 ? 'removeCompanion' : 'nextPlayer');
    }
    
    public function recruitCompanion(int $spot) {
        self::checkAction('recruitCompanion'); 

        if ($spot < 1 || $spot > 5) {
            throw new BgaUserException("Not a valid spot");
        }
        $companion = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot))[0];

        if ($companion->location != 'meeting') {
            throw new BgaUserException("Companion not available");
        }
        
        $playerId = self::getActivePlayerId();

        $this->applyRecruitCompanion($playerId, $companion, $spot);

        if ($companion->die && $companion->dieColor === 0) {
            $this->gamestate->nextState('selectSketalDie');
        } else {
            $this->redirectAfterRecruit();
        }
    }

    public function selectSketalDie(int $id) {
        self::checkAction('selectSketalDie'); 

        $die = $this->getDieById($id);

        if ($die->location != 'deck') {
            throw new BgaUserException("Die not available");
        }
        
        $playerId = self::getActivePlayerId();

        $this->takeSketalDie($playerId, $die);

        $this->redirectAfterRecruit();
    }
    
    public function removeCompanion(int $spot) {
        self::checkAction('removeCompanion'); 

        $playerId = $this->getCurrentPlayerId();

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

        $this->sendToCemetery($playerId, $companion->id);

        self::notifyAllPlayers('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
            'playerId' => $playerId,
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

    private function applyMove(int $playerId, object $route) {
        // apply route & destination effects
        foreach($route->costForPlayer as $effect) {
            $this->applyEffect($playerId, $effect);

            if ($effect >= 1 && $effect <= 5) {
                $dice = $this->getDiceByLocation('player', $playerId, false);
                $die = $this->array_find($dice, function($die) use ($effect) { return $die->value == $effect; });
                if ($die != null) {
                    self::DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");

                    self::notifyAllPlayers('usedDice', '', [
                        'playerId' => $playerId,
                        'dieId' => $die->id,
                    ]);
                }
            }
        }

        $side = $this->getSide();
        if ($side === 1) {
            $this->movePlayerCompany($playerId, $route->destination);

            self::notifyPlayer($playerId, 'moveUpdate', '', [
                'args' => $this->argMoveForPlayer($playerId),
            ]);
        } else if ($side === 2) {
            $this->movePlayerBoat($playerId, $route->destination);

            $this->applyEndTurn($playerId);
        }
    }

    public function move(int $destination) {
        self::checkAction('move');

        $playerId = intval($this->getCurrentPlayerId());

        $possibleRoutes = $this->getPossibleRoutes($playerId);
        $route = $this->array_find($possibleRoutes, function ($possibleRoute) use ($destination) { return $possibleRoute->destination == $destination; });
        if ($route == null) {
            throw new BgaUserException("Impossible to move here");
        }

        $this->applyMove($playerId, $route);
    }

    private function applyEndTurn(int $playerId) {
        // updates possible routes -> no more possible route as it is end of turn, so empty array
        self::notifyPlayer($playerId, 'moveUpdate', '', [
            'args' => [],
        ]);

        $this->gamestate->setPlayerNonMultiactive($playerId, 'endRound');
    }
  	
    public function placeEncampment() {
        self::checkAction('placeEncampment');

        $playerId = intval($this->getCurrentPlayerId());

        $this->movePlayerEncampment($playerId, $this->getPlayerCompany($playerId)->position);
        $this->applyEndTurn($playerId);
    }

  	
    public function endTurn() {
        self::checkAction('endTurn');

        $playerId = intval($this->getCurrentPlayerId());

        $this->applyEndTurn($playerId);
    }
}
