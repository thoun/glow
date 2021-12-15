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

        $newPlayerColor = $this->ADVENTURERS_COLORS[$adventurer->color];
        self::DbQuery("UPDATE player SET `player_color` = '$newPlayerColor' WHERE player_id = $playerId");
        self::reloadPlayersBasicInfos();

        self::notifyAllPlayers('chosenAdventurer', clienttranslate('${player_name} chooses adventurer ${adventurerName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'adventurer' => $adventurer,
            'adventurerName' => $adventurer->name,
            'dice' => $dice,
            'newPlayerColor' => $newPlayerColor,
        ]);

        self::setStat(1, $adventurer->name);
        self::setStat(1, $adventurer->name, $playerId);

        if ($this->isSoloMode()) {
            $movedDiceColorsToTable = [];

            if ($adventurer->color != 6) {
                $movedDiceColorsToTable[] = 6;
            }
            if ($adventurer->color != 7) {
                $movedDiceColorsToTable[] = 7;
            }

            $movedDiceToTable = array_map(function($color) {
                return $this->getBigDiceByColor($color, 1)[0];
            }, $movedDiceColorsToTable);

            $this->moveDice($movedDiceToTable, 'table');
            self::notifyAllPlayers('setTableDice', '', [
                'dice' => $movedDiceToTable,
            ]);

            self::giveExtraTime($playerId);
            $this->gamestate->nextState('chooseTomDice');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    public function applyRecruitCompanion(int $playerId, object $companion, $spot = null) {
        $this->companions->moveCard($companion->id, 'player', $playerId);
        self::DbQuery("UPDATE player SET `player_recruit_day` = (".$this->getDaySql().") where `player_id` = $playerId");  

        $dice = null;
        if ($spot !== null) {
            $dice = $this->getDiceByLocation('meeting', $spot);
            $count = count($dice);
            if ($count > 0) {
                $this->moveDice($dice, 'player', $playerId);

                self::incStat($count, 'collectedSmallDice');
                self::incStat($count, 'collectedSmallDice', $playerId);
            }
        }

        self::notifyAllPlayers('chosenCompanion', clienttranslate('${player_name} chooses companion ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
            'dice' => $dice,
            // new cemetaryTop if chosen from cemetary
            'cemetaryTop' => $spot == null ? $this->getTopCemeteryCompanion() : null,
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

                    $multi = ($this->gamestate->state()['name']) == 'resurrect';
                    if ($multi) {
                        self::DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
                        $die->used = true;
                    }

                    $this->takeSketalDie($playerId, $die);
                    break;
                }
            }
        } else if ($companion->subType == KAAR && $spot !== null) {
            // black die enters the game
            $sql = "select `card_location_arg` from `companion` where `card_location` = 'meeting'";
            $availableSpots = array_values(array_map(function($dbLine) { return intval($dbLine['card_location_arg']); }, self::getCollectionFromDb($sql)));

            $dieSpot = $availableSpots[bga_rand(0, count($availableSpots) - 1)];
            $die = $this->getBlackDie();
            $die->setFace($dieSpot);
            $this->persistDice([$die]);
            $this->moveDice([$die], 'meeting', $dieSpot);

            self::notifyAllPlayers('moveBlackDie', clienttranslate('${player_name} adds black die with ${companionName}'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'companionName' => $companion->name,
                'die' => $die,
            ]);
        }
    }

    function redirectAfterRecruit() {
        if ($this->getPlayerCount() == 2 && intval(self::getActivePlayerId()) == intval(self::getGameStateValue(FIRST_PLAYER))) {
            $this->gamestate->nextState('removeCompanion');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
        
    }
    
    public function recruitCompanion(int $spot, $ignoreCheck = false) {
        if (!$ignoreCheck) {
            self::checkAction('recruitCompanion'); 
        }

        if ($spot < 1 || $spot > 5) {
            throw new BgaUserException("Not a valid spot");
        }
        
        $playerId = self::getActivePlayerId();
        $solo = $this->isSoloMode();
        if ($solo) {
            $soloTile = $this->getSoloTilesFromDb($this->soloTiles->getCardsInLocation('meeting', $spot))[0];
            $this->applyTomEffects($soloTile);
            $this->updateSoloDeck($spot);
        }

        $spotDice = $this->getDiceByLocation('meeting', $spot);
        if ($this->array_some($spotDice, function($die) { return $die->color == 8; })) {
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
            if ($this->array_some($companions, function($companion) { return $companion->subType == KAAR; })) {
                $this->gamestate->nextState('moveBlackDie');
                return;
            }
        }
        
        $companion = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot))[0];

        if ($companion->location != 'meeting') {
            throw new BgaUserException("Companion not available");
        }

        $this->applyRecruitCompanion($playerId, $companion, $spot);

        
        if ($solo) {
            $this->soloEndRecruit();
        }

        if ($companion->die && $companion->dieColor === 0) {
            $this->gamestate->nextState('selectSketalDie');
        } else {
            $this->redirectAfterRecruit();
        }
    }

    public function selectSketalDie(int $id) {
        self::checkAction('selectSketalDie');
        $multi = ($this->gamestate->state()['name']) == 'selectSketalDieMulti';

        $die = $this->getDieById($id);

        if ($die->location != 'table') {
            throw new BgaUserException("Die not available");
        }
        
        $playerId = $multi ? self::getCurrentPlayerId() : self::getActivePlayerId();

        if ($multi) {
            self::DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
            $die->used = true;
        }
        
        $this->takeSketalDie($playerId, $die);

        if ($multi) {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'resolveCards');
        } else {
            $this->redirectAfterRecruit();
        }
    }
    
    public function moveBlackDie(int $spot) {
        self::checkAction('moveBlackDie'); 

        $playerId = $this->getCurrentPlayerId();

        if ($spot < 1 || $spot > 5) {
            throw new BgaUserException("Not a valid spot");
        }

        $die = $this->getBlackDie();
        $currentSpot = $die->location_arg;

        $die->setFace($spot);
        $this->persistDice([$die]);
        $this->moveDice([$die], 'meeting', $spot);

        self::notifyAllPlayers('moveBlackDie', clienttranslate('${player_name} moves black die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
        ]);

        $this->recruitCompanion($currentSpot, true);
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
            'player_name' => $this->getPlayerName($playerId),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
        ]);
        
        $this->gamestate->nextState('nextPlayer');
    }

    public function rollDice(array $ids, array $cost) {
        self::checkAction('rollDice');

        $playerId = $this->getCurrentPlayerId();

        $this->applyRollDieCost($playerId, 1, $cost);

        $params = [
            'args' => $this->argRollDice(),
        ];

        $this->rollPlayerDice($playerId, $ids, clienttranslate('${player_name} rerolls dice ${originalDice} and gets ${rolledDice}'), $params);

        self::incStat(count($ids), 'rerolledDice');
        self::incStat(count($ids), 'rerolledDice', $playerId);
    }

    public function changeDie(int $id, int $face, array $cost) {
        self::checkAction('changeDie');

        $playerId = $this->getCurrentPlayerId();

        $this->applyRollDieCost($playerId, 3, $cost);

        $die = $this->getDieById($id);
        $originalDiceStr = $this->getDieFaceLogName($die);
        $die->setFace($face);
        $rolledDiceStr = $this->getDieFaceLogName($die);

        $this->persistDice([$die]);

        self::notifyAllPlayers('diceChanged', clienttranslate('${player_name} change die ${originalDice} to ${rolledDice}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'dice' => [$die],
            'args' => $this->argRollDice(),
            'originalDice' => $originalDiceStr,
            'rolledDice' => $rolledDiceStr,
        ]);

        self::incStat(1, 'changedDice');
        self::incStat(1, 'changedDice', $playerId);
    }

    public function keepDice() {
        self::checkAction('keepDice');
        $this->gamestate->setPlayerNonMultiactive($this->getCurrentPlayerId(), 'keepDice');
    }

    
    
    public function resurrect(int $id) {
        self::checkAction('resurrect');

        $playerId = intval($this->getCurrentPlayerId());

        $companion = $this->getCompanionFromDb($this->companions->getCard($id));

        if ($companion->location != 'cemetery') {
            throw new BgaUserException("Companion not available");
        }

        $this->applyRecruitCompanion($playerId, $companion);

        if ($companion->die && $companion->dieColor === 0) {
            $this->gamestate->nextState('selectSketalDie'); // we don't disable player so he stays active for selectSketalDieMulti
        } else {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'resolveCards');
        }
    } 

    public function skipResurrect() {
        self::checkAction('skipResurrect');

        $playerId = intval($this->getCurrentPlayerId());

        $this->gamestate->setPlayerNonMultiactive($playerId, 'resolveCards');
    }

    public function applyResolveCard(int $playerId, int $cardType, int $id) {
        $this->applyCardEffect($playerId, $cardType, $id);

        $resolveCardsForPlayer = $this->argResolveCardsForPlayer($playerId);
     
        self::notifyPlayer($playerId, 'resolveCardUpdate', '', [
            'resolveCardsForPlayer' => $resolveCardsForPlayer,
        ]);

        self::incStat(1, 'resolvedCards');
        self::incStat(1, 'resolvedCards', $playerId);

        return $resolveCardsForPlayer;
    }

    public function resolveCard(int $cardType, int $id) {
        self::checkAction('resolveCard');

        $playerId = intval($this->getCurrentPlayerId());
        
        $resolveCardsForPlayer = $this->argResolveCardsForPlayer($playerId);
        if (!$this->array_some($resolveCardsForPlayer->remainingEffects, function($remainingEffect) use ($cardType, $id) { return $remainingEffect[0] == $cardType && $remainingEffect[1] == $id; })) {
            throw new BgaUserException("You can't apply that effect");
        }

        $resolveCardsForPlayer = $this->applyResolveCard($playerId, $cardType, $id);
        
        if (count($resolveCardsForPlayer->remainingEffects) === 0) {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'move');
        }
    }

    public function resolveAll() {
        self::checkAction('resolveAll');

        $playerId = intval($this->getCurrentPlayerId());

        $resolveCardsForPlayer = $this->argResolveCardsForPlayer($playerId);
        
        while (count($resolveCardsForPlayer->remainingEffects) > 0) {
            $firstRemainingEffect = $resolveCardsForPlayer->remainingEffects[0];
            $resolveCardsForPlayer = $this->applyResolveCard($playerId, $firstRemainingEffect[0], $firstRemainingEffect[1]);
        }
        
        $this->gamestate->setPlayerNonMultiactive($playerId, 'move');
    }

    private function applyMove(int $playerId, object $route) {
        // apply route & destination effects
        foreach($route->costForPlayer as $effect) {
            $this->applyEffect($playerId, $effect, 4, null);

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

        $footprintEffect = $this->array_find($route->costForPlayer, function($effect) { return $effect < -20 && $effect > -30; });
        if ($footprintEffect != null) {
            $destination = $this->getMapSpot($side, $route->destination);
            if (!$this->array_some($destination->effects, function($effect) { return $effect < -20 && $effect > -30; })) {
                // we count footprints as joker only if we are not in a spot that require footprint cost
                $footprintCost = -($footprintEffect + 20);
                self::incStat($footprintCost, 'footprintsAsJokers');
                self::incStat($footprintCost, 'footprintsAsJokers', $playerId);
            }
        }

        if ($side === 1) {
            $this->movePlayerCompany($playerId, $route->destination, $route->from);

            $args = $this->argMoveForPlayer($playerId);
            if (count($args->possibleRoutes) == 0 && $args->canSettle != true) {
                $this->applyEndTurn($playerId);
            } else {                
                self::notifyPlayer($playerId, 'moveUpdate', '', [
                    'args' => $args,
                ]);
            }
        } else if ($side === 2) {
            $this->movePlayerBoat($playerId, $route->destination, $route->from);

            $this->applyEndTurn($playerId);
        }

        self::incStat(1, 'moves');
        self::incStat(1, 'moves', $playerId);
    }

    public function move(int $destination, $from = null, $type = null, $id = null) {
        // TODO add die id for companion
        self::checkAction('move');

        $playerId = intval($this->getCurrentPlayerId());

        $possibleRoutes = $this->getPossibleRoutes($playerId);
        $route = $this->array_find($possibleRoutes, function ($possibleRoute) use ($destination, $from) { return $possibleRoute->destination == $destination && ($from == null || $possibleRoute->from == $from); });
        if ($route == null) {
            throw new BgaUserException("Impossible to move here");
        }

        // if we pass a discard companion/spell
        if ($type != null && $id != null) {
            if ($type == 1) {
                $companion = $this->getCompanionFromDb($this->companions->getCard($id));

                if ($companion->location != 'player' || $companion->location_arg != $playerId) {
                    throw new BgaUserException("Player doesn't have selected companion");
                }

                $this->sendToCemetery($playerId, $companion->id);

                self::notifyAllPlayers('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companion' => $companion,
                    'companionName' => $companion->name,
                ]);
            } else if ($type == 2) {
                $spell = $this->getSpellFromDb($this->spells->getCard($id));

                if ($spell->location != 'player' || $spell->location_arg != $playerId) {
                    throw new BgaUserException("Player doesn't have selected spell");
                }

                $this->discardSpell($playerId, $spell);
            }
        }

        $this->applyMove($playerId, $route);
    }

    private function applyEndTurn(int $playerId) {
        // updates possible routes -> no more possible route as it is end of turn, so empty array
        self::notifyPlayer($playerId, 'moveUpdate', '', [
            'args' => [],
        ]);

        $this->replaceSmallDiceOnMeetingTrack($playerId);

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
