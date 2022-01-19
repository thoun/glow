<?php

trait StateTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Game state actions
////////////

    /*
        Here, you can create methods defined as "game state actions" (see "action" property in states.inc.php).
        The action method of state X is called everytime the current game state is set to X.
    */

    function stNextPlayerChooseAdventurer() {     
        $playerId = self::getActivePlayerId();

        $this->activeNextPlayer();
    
        $playerId = self::getActivePlayerId();
        self::giveExtraTime($playerId);

        $startRound = intval(self::getUniqueValueFromDB("SELECT count(*) FROM player where not exists(select * from adventurer where adventurer.card_location_arg = player.player_id)")) == 0;
        $this->gamestate->nextState($startRound ? 'end' : 'nextPlayer');
    }

    function stStartRound() {
        $solo = $this->isSoloMode();

        $day = intval($this->getGameStateValue(DAY)) + 1;
        self::setGameStateValue(DAY, $day);

        self::DbQuery("UPDATE companion SET `reroll_used` = false");
        self::DbQuery("UPDATE player SET `applied_effects` = null, visited_spots = null");

        self::notifyAllPlayers('newDay', clienttranslate('Day ${day} begins'), [
            'day' => $day,
        ]);

        if ($day == 1) {
            if ($solo) {
                $this->placeSoloTilesOnMeetingTrack();
            }
            $this->placeCompanionsOnMeetingTrack();
            $this->initMeetingTrackSmallDice();
            $this->addFootprintsOnMeetingTrack();
        }

        $this->revealSpellTokens();

        $this->gamestate->nextState('morning');
    }

    function stNextPlayerRecruitCompanion() {     
        $playerId = self::getActivePlayerId();

        $this->activeNextPlayer();
    
        $playerId = self::getActivePlayerId();
        self::giveExtraTime($playerId);

        $endRecruit = intval(self::getUniqueValueFromDB("SELECT count(*) FROM player where player_recruit_day < (".$this->getDaySql().")")) == 0;
        $this->gamestate->nextState($endRecruit ? 'end' : 'nextPlayer');
    }
    
    function stEndRecruit() {
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting'));

        foreach($companions as $companion) {
            $this->sendToCemetery(0, $companion->id);
        }

        self::notifyAllPlayers('removeCompanions', '', [
            'topCemeteryType' => $this->getTopCemeteryType(),
        ]);

        $playersIds = $this->getPlayersIds();      
        foreach($playersIds as $playerId) {
            $this->rollPlayerDice($playerId, null, clienttranslate('${player_name} rolls dice ${rolledDice}'));
        }

        $this->gamestate->nextState('');
    }

    function stRollDice() {
        $this->gamestate->setAllPlayersMultiactive();
    }

    function stResurrect() {
        $playerWithCromaugActivated = [];

        $playersIds = $this->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->getEffectiveDice($playerId);
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
    
            $cromaugCard = null;
    
            foreach($companions as $companion) {
                if ($companion->subType == 41) { // Cromaug
                    if ($this->isTriggeredEffectsForCard($dice, $companion->effect)) {
                        $cromaugCard = $companion;
                        break;
                    }
                }
            }

            if ($cromaugCard !== null) {
                $playerWithCromaugActivated[] = $playerId;

                $this->sendToCemetery($playerId, $cromaugCard->id);
                $companion = $this->getCompanionFromDb($this->companions->getCard($cromaugCard->id));
                self::notifyAllPlayers('removeCompanion', clienttranslate('${player_name} discards Cromaug and takes a companion from the cemetery'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companion' => $cromaugCard,
                ]);
            }
        }

        if (count($playerWithCromaugActivated) > 0) {
            
            $this->gamestate->setPlayersMultiactive($playerWithCromaugActivated, 'resolveCards', true);
        } else {
            $this->gamestate->nextState('resolveCards');
        }
    }

    function stResolveCards() {

        $playerWithEffects = [];

        $playersIds = $this->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->getDiceByLocation('player', $playerId);

            foreach($dice as &$idie) {
                if ($idie->color > 5 && $idie->face == 6 && $idie->location == 'player') { // we apply yellow/purple/black die special effect
                    $this->applyEffect($idie->location_arg, $idie->value, 3, null);
                }
            }


            if (count($this->getRemainingEffects($playerId)) > 0) {
                $playerWithEffects[] = $playerId;
            }
        }

        if (count($playerWithEffects) > 0) {
            $this->gamestate->setPlayersMultiactive($playerWithEffects, 'move', true);
        } else {
            $this->gamestate->nextState('move');
        }
    }

    function stMove() {
        $playerWithRoutes = [];

        $playersIds = $this->getPlayersIds();
        $autoSkipImpossibleActions = $this->autoSkipImpossibleActions();

        foreach($playersIds as $playerId) {
            if (!$autoSkipImpossibleActions || count($this->getPossibleRoutes($playerId)) > 0) {
                $playerWithRoutes[] = $playerId;
            } else {
                // player finishes its turn, replace die
                $this->replaceSmallDiceOnMeetingTrack($playerId);
            }
        }

        if (count($playerWithRoutes) > 0) {
            $this->gamestate->setPlayersMultiactive($playerWithRoutes, 'endRound', true);
        } else {
            $this->gamestate->nextState('endRound');
        }
    }    

    function stEndRound() {
        // reset dice use        
        self::DbQuery("UPDATE dice SET `used` = false");

        $this->placeCompanionsOnMeetingTrack();
        $this->addFootprintsOnMeetingTrack();

        $solo = $this->isSoloMode();

        if (!$solo) {
            $nextPlayerTable = self::createNextPlayerTable(array_keys(self::loadPlayersBasicInfos()));
            $newFirstPlayer = intval($nextPlayerTable[intval($this->getGameStateValue(FIRST_PLAYER))]);

            $this->gamestate->changeActivePlayer($newFirstPlayer);

            $this->setGameStateValue(FIRST_PLAYER, $newFirstPlayer);

            self::notifyAllPlayers('newFirstPlayer', clienttranslate('${player_name} is the new First player'), [
                'playerId' => $newFirstPlayer,
                'player_name' => $this->getPlayerName($newFirstPlayer),
            ]);

        }


        self::incStat(1, 'days');

        $day = intval($this->getGameStateValue(DAY));
        self::notifyAllPlayers('endDay', clienttranslate('Day ${day} ends'), [
            'day' => $day,
        ]);

        $end = false;
        if ($solo) {
            $end = intval($this->getGameStateValue(SOLO_DECK)) > 2; 
        } else {
            $end = $day >= 8;
        }

        if ($end) {
            $this->gamestate->nextState('endScore');
        } else {
            $this->gamestate->nextState('newRound');
        }
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();
        $solo = count($playersIds) == 1;

        if ($solo) {
            $playersIds[] = 0;

            if ($this->getSide() == 1) {
                $this->provinceOfShadowLastMove();
            }
        }

        foreach($playersIds as $playerId) {
            $score = 0;
            if ($playerId == 0) {
                $tom = $this->getTom();
                $tom->scoreBeforeEnd = $tom->score;
                $score = $tom->scoreBeforeEnd;
                $this->setTom($tom);
            } else {
                self::DbQuery("UPDATE player SET player_score_before_end = player_score WHERE player_id = $playerId");
                $score = intval(self::getUniqueValueFromDB("SELECT player_score_before_end FROM player where player_id = $playerId"));
            }

            self::notifyAllPlayers('scoreBeforeEnd', '', [
                'playerId' => $playerId,
                'points' => $score,
            ]);
        }
        
        // Adventurer and companions        
        foreach($playersIds as $playerId) {
            if ($playerId != 0) {
                $points = 0;
                $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId));
                if (count($adventurers) > 0) {
                    $points += $adventurers[0]->points;
                }
                $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
                foreach($companions as $companion) {
                    $points += $companion->points;
                }

                self::DbQuery("UPDATE player SET player_score_cards = $points WHERE player_id = $playerId");

                self::notifyAllPlayers('scoreCards', '', [
                    'playerId' => $playerId,
                    'points' => $points,
                ]);

                $this->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with adventurer and companions'));
                
                self::setStat($points, 'cardsEndPoints', $playerId);
            }
        }

        // Journey board 
        $side = $this->getSide();  
        foreach($playersIds as $playerId) {
            $points = $this->getMapFinalScore($side, $playerId);

            $message = null;
            if ($side === 1) {
                $message = clienttranslate('${player_name} gains ${points} bursts of light with the village where encampment is situated');
            } else if ($side === 2) {
                $message = clienttranslate('${player_name} gains ${points} bursts of light with boats placed on islands');
            }

            if ($playerId == 0) {
                $tom = $this->getTom();
                $tom->scoreBoard = $points;        
                $this->setTom($tom);
            } else {
                self::DbQuery("UPDATE player SET player_score_board = $points WHERE player_id = $playerId");
            }

            self::notifyAllPlayers('scoreBoard', '', [
                'playerId' => $playerId,
                'points' => $points,
            ]);

            $this->incPlayerScore($playerId, $points, $message);

            if ($playerId != 0) {
                self::setStat($points, 'meepleEndPoints', $playerId);
            }
        }

        // Fireflies
        foreach($playersIds as $playerId) {
            if ($playerId != 0) {
                $points = $this->getPlayerFireflies($playerId);
                $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
                $companionCount = count($companions);

                foreach($companions as $companion) {
                    $points += $companion->fireflies;
                }

                // If they have as many or more fireflies than companions, they score 10 bursts of light.
                if ($points >= $companionCount) {
                    $this->incPlayerScore($playerId, 10, clienttranslate('${player_name} gains ${points} bursts of light with fireflies (more fireflies than companions)'));
                }

                self::notifyAllPlayers('scoreFireflies', '', [
                    'playerId' => $playerId,
                    'points' => $points >= $companionCount ? 10 : 0,
                ]);

                if ($playerId != 0) {
                    self::setStat($points, 'endFirefliesTokens', $playerId);
                    self::setStat($companionCount, 'endCompanionCount', $playerId);
                    self::setStat($points >= $companionCount ? 1 : 0, 'endFirefliesBonus', $playerId);
                }
            }
        }

        //Each player scores 1 burst of light per footprint in their possession.
        foreach($playersIds as $playerId) {
            $points = $this->getPlayerFootprints($playerId);

            self::notifyAllPlayers('scoreFootprints', '', [
                'playerId' => $playerId,
                'points' => $points,
            ]);

            $this->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with footprints'));

            if ($playerId != 0) {
                self::setStat($points, 'endFootprintsCount', $playerId);
            }
        }

        foreach($playersIds as $playerId) {
            $score = 0;
            if ($playerId == 0) {
                $tom = $this->getTom();
                $tom->scoreAfterEnd = $tom->score;
                $score = $tom->scoreAfterEnd;
                $this->setTom($tom);
            } else {
                self::DbQuery("UPDATE player SET player_score_after_end = player_score WHERE player_id = $playerId");
                $score = intval(self::getUniqueValueFromDB("SELECT player_score_after_end FROM player where player_id = $playerId"));
            }

            self::notifyAllPlayers('scoreAfterEnd', '', [
                'playerId' => $playerId,
                'points' => $score,
            ]);
        }
        
        if ($solo) { // solo mode
            $playerId = $playersIds[0];
            $playerScore = $this->getPlayerScore($playerId);
            $tom = $this->getTom();

            /*self::notifyAllPlayers('soloEndScore', clienttranslate('${player_name} ends with ${points} bursts of light'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'points' => $playerScore,
            ]);
            self::notifyAllPlayers('soloEndScore', clienttranslate('${player_name} ends with ${points} bursts of light'), [
                'playerId' => 0,
                'player_name' => $this->getPlayerName(0),
                'points' => $tom->score,
            ]);*/

            $score = (($playerScore > $tom->score) || ($playerScore == $tom->score && $this->getPlayerFootprints($playerId) > $tom->footprints)) ? 1 : 0;
            self::DbQuery("UPDATE player SET `player_score` = $score, `player_score_aux` = 0");
        } else {  
            // Tie          
            self::DbQuery("UPDATE player SET `player_score_aux` = `player_rerolls`");
        }

        $this->gamestate->nextState('endGame');
    }
}
