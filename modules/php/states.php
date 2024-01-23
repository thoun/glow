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
        $this->activeNextPlayer();
    
        $playerId = $this->getActivePlayerId();
        $this->giveExtraTime($playerId);

        $startRound = $playerId == intval($this->getGameStateValue(FIRST_PLAYER));
        $this->gamestate->nextState($startRound ? 'end' : 'nextPlayer');
    }

    function stStartRound() {
        $playerCount = $this->getPlayerCount();

        $day = intval($this->getGameStateValue(DAY)) + 1;
        $this->setGameStateValue(DAY, $day);

        $this->DbQuery("UPDATE companion SET `reroll_used` = 0");
        $this->DbQuery("UPDATE player SET `applied_effects` = null, visited_spots = null");

        $this->notifyAllPlayers('newDay', clienttranslate('Day ${day} begins'), [
            'day' => $day,
        ]);

        if ($day == 1) {
            if ($playerCount == 1) {
                $this->placeSoloTilesOnMeetingTrack();
            }
            $this->placeCompanionsOnMeetingTrack();
            $this->initMeetingTrackSmallDice($playerCount);
            $this->addFootprintsOnMeetingTrack();
        }

        $this->revealSpellTokens();

        $this->gamestate->nextState('morning');
    }

    function stRecuitCompanion() {
        $uriomIntervention = $this->getGlobalVariable(URIOM_INTERVENTION);
        if ($uriomIntervention !== null && $uriomIntervention->activated === false) {
            $this->recruitCompanionAction($uriomIntervention->activePlayerId, $uriomIntervention->spot);
        } else if (intval($this->getUniqueValueFromDB("SELECT player_recruit_day FROM player where `player_id` = ".$this->getActivePlayerId())) == intval($this->getGameStateValue(DAY)))  {
            // if Uriom has already played with its intervention, we skip its turn
            $this->gamestate->nextState('nextPlayer');
        }
    }

    function stNextPlayerRecruitCompanion() {
        $playerId = intval($this->getActivePlayerId());

        $uriomIntervention = $this->getGlobalVariable(URIOM_INTERVENTION);
        if ($uriomIntervention !== null) {
            if ($uriomIntervention->activated === null) {
                // redirect to uriom player
                $this->gamestate->changeActivePlayer($uriomIntervention->uriomPlayerId);
                $this->gamestate->nextState('uriomRecruit');
                return;
            } else if ($playerId == $uriomIntervention->uriomPlayerId) {
                // redirect from uriom player to previous active player
                $this->gamestate->changeActivePlayer($uriomIntervention->activePlayerId);
                $this->gamestate->nextState('nextPlayer');
                return;
            } else {
                // after a uriom intervention and active player  finished its turn
                $this->deleteGlobalVariable(URIOM_INTERVENTION);
            }
        }

        $this->activeNextPlayer();
    
        $playerId = $this->getActivePlayerId();
        $this->giveExtraTime($playerId);

        $endRecruit = $playerId == intval($this->getGameStateValue(FIRST_PLAYER));
        $this->gamestate->nextState($endRecruit ? 'end' : 'nextPlayer');
    }
    
    function stEndRecruit() {
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting'));

        foreach($companions as $companion) {
            $this->sendToCemetery(0, $companion->id);
        }

        $this->notifyAllPlayers('removeCompanions', '', [
            'topCemeteryType' => $this->getTopCemeteryType(),
        ]);

        $playersIds = $this->getPlayersIds();      
        foreach($playersIds as $playerId) {
            $this->rollPlayerDice($playerId, null, clienttranslate('${player_name} rolls dice ${rolledDice}'));
        }

        $this->gamestate->nextState('');
    }
    
    function stChangeDice() { 
        $this->gamestate->setAllPlayersMultiactive();
        
        $playersIdsToSelectDiceAction = [];
        $playersIdsToRerollImmediate = [];


        $playersIds = $this->getPlayersIds();      
        foreach($playersIds as $playerId) {
            $args = $this->argRerollImmediate($playerId);
            if ($args['selectedDie'] !== null) {
                $playersIdsToRerollImmediate[] = $playerId;
            } else {
                $playersIdsToSelectDiceAction[] = $playerId;
            }
        }

        if (count($playersIdsToRerollImmediate) == 0) {
            $this->gamestate->initializePrivateStateForAllActivePlayers(); 
        } else {
            $this->gamestate->initializePrivateStateForPlayers($playersIdsToSelectDiceAction);
            foreach ($playersIdsToRerollImmediate as $pId) {
                $this->gamestate->setPrivateState($pId, ST_PRIVATE_REROLL_IMMEDIATE);
            }
        }
    }

    function stSwap() {
        $playerWithHuliosDiceActivated = [];

        $playersIds = $this->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->getEffectiveDice($playerId);
            $unusedHuliosDice = array_filter($dice, fn($die) => $die->color == 9 && $die->value == 9 && !$die->used);

            if (count($unusedHuliosDice) > 0) {
                $playerWithHuliosDiceActivated[] = $playerId;
            }
        }

        if (count($playerWithHuliosDiceActivated) > 0) {
            $this->gamestate->setPlayersMultiactive($playerWithHuliosDiceActivated, 'next', true);
            $this->gamestate->initializePrivateStateForAllActivePlayers(); 
        } else {
            $this->gamestate->nextState('next');
        }
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
                    if ($this->isTriggeredEffectsForCard($playerId, $dice, $companion->effect)) {
                        $cromaugCard = $companion;
                        break;
                    }
                }
            }

            if ($cromaugCard !== null) {
                $playerWithCromaugActivated[] = $playerId;

                $this->sendToCemetery($playerId, $cromaugCard->id);
                $companion = $this->getCompanionFromDb($this->companions->getCard($cromaugCard->id));
                $this->notifyAllPlayers('removeCompanion', clienttranslate('${player_name} discards Cromaug and takes a companion from the cemetery'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companion' => $cromaugCard,
                ]);
            }
        }

        if (count($playerWithCromaugActivated) > 0) {
            $this->gamestate->setPlayersMultiactive($playerWithCromaugActivated, 'next', true);
            $this->gamestate->initializePrivateStateForAllActivePlayers(); 
        } else {
            $this->gamestate->nextState('next');
        }
    }

    function stMultiResolveCards() {

        $playerWithEffects = [];

        $playersIds = $this->getPlayersIds();

        foreach($playersIds as $playerId) {
            $dice = $this->getDiceByLocation('player', $playerId);

            foreach($dice as &$idie) {
                if ($idie->color > 5 && $idie->face == 6 && $idie->location == 'player') { // we apply yellow/purple/black die special effect
                    $this->applyEffect($idie->location_arg, $idie->value, 3, null);
                }
            }

            $args = $this->argResolveCardsForPlayer($playerId);
            if (count($args->remainingEffects) > 0 || $args->killTokenId > 0 || $args->disableTokenId > 0) {
                $playerWithEffects[] = $playerId;
            }
        }

        if (count($playerWithEffects) > 0) {
            $this->gamestate->setPlayersMultiactive($playerWithEffects, 'move', true);
            $this->gamestate->initializePrivateStateForAllActivePlayers(); 
        } else {
            $this->gamestate->nextState('move');
        }
    }

    function stMultiMove() { 
        
        $playerWithRoutes = [];

        $playersIds = $this->getPlayersIds();
        $autoSkipImpossibleActions = $this->autoSkipImpossibleActions();

        foreach($playersIds as $playerId) {
            $args = $this->argMoveForPlayer($playerId);
            if (!$autoSkipImpossibleActions || count($args->possibleRoutes) > 0 || $args->canSettle || $args->killTokenId > 0 || $args->disableTokenId > 0) {
                $playerWithRoutes[] = $playerId;
            } else {
                // player finishes its turn, replace die
                $this->replaceSmallDiceOnMeetingTrack($playerId);
            }
        }

        if (count($playerWithRoutes) > 0) {
            $this->gamestate->setPlayersMultiactive($playerWithRoutes, 'endRound', true);
            $this->gamestate->initializePrivateStateForAllActivePlayers(); 
        } else {
            $this->gamestate->nextState('endRound');
        }
    }

    function stEndRound() {
        // reset dice use        
        $this->DbQuery("UPDATE dice SET `used` = false");
        $this->DbQuery("UPDATE player SET `player_disabled_symbols` = '[]'");

        $this->placeCompanionsOnMeetingTrack();
        $this->addFootprintsOnMeetingTrack();

        if ($this->tokensActivated()) {
            $this->soloTiles->moveAllCardsInLocation('front', 'bag');
            $this->tokens->shuffle('bag');
        }

        $solo = $this->isSoloMode();

        if (!$solo) {
            $nextPlayerTable = $this->createNextPlayerTable(array_keys($this->loadPlayersBasicInfos()));
            $newFirstPlayer = intval($nextPlayerTable[intval($this->getGameStateValue(FIRST_PLAYER))]);

            $this->gamestate->changeActivePlayer($newFirstPlayer);

            $this->setGameStateValue(FIRST_PLAYER, $newFirstPlayer);

            $this->notifyAllPlayers('newFirstPlayer', clienttranslate('${player_name} is the new First player'), [
                'playerId' => $newFirstPlayer,
                'player_name' => $this->getPlayerName($newFirstPlayer),
            ]);

        }


        $this->incStat(1, 'days');

        $day = intval($this->getGameStateValue(DAY));
        $this->notifyAllPlayers('endDay', clienttranslate('Day ${day} ends'), [
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
                $this->DbQuery("UPDATE player SET player_score_before_end = player_score WHERE player_id = $playerId");
                $score = intval($this->getUniqueValueFromDB("SELECT player_score_before_end FROM player where player_id = $playerId"));
            }

            $this->notifyAllPlayers('scoreBeforeEnd', '', [
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

                $this->DbQuery("UPDATE player SET player_score_cards = $points WHERE player_id = $playerId");

                $this->notifyAllPlayers('scoreCards', '', [
                    'playerId' => $playerId,
                    'points' => $points,
                ]);

                $this->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with adventurer and companions'));
                
                $this->setStat($points, 'cardsEndPoints', $playerId);
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
                $this->DbQuery("UPDATE player SET player_score_board = $points WHERE player_id = $playerId");
            }

            $this->notifyAllPlayers('scoreBoard', '', [
                'playerId' => $playerId,
                'points' => $points,
            ]);

            $this->incPlayerScore($playerId, $points, $message);

            if ($playerId != 0) {
                $this->setStat($points, 'meepleEndPoints', $playerId);
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

                $this->notifyAllPlayers('scoreFireflies', '', [
                    'playerId' => $playerId,
                    'points' => $points >= $companionCount ? 10 : 0,
                ]);

                if ($playerId != 0) {
                    $this->setStat($points, 'endFirefliesTokens', $playerId);
                    $this->setStat($companionCount, 'endCompanionCount', $playerId);
                    $this->setStat($points >= $companionCount ? 1 : 0, 'endFirefliesBonus', $playerId);
                }
            }
        }

        //Each player scores 1 burst of light per footprint in their possession.
        foreach($playersIds as $playerId) {
            $points = $this->getPlayerFootprints($playerId);

            $this->notifyAllPlayers('scoreFootprints', '', [
                'playerId' => $playerId,
                'points' => $points,
            ]);

            $this->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with footprints'));

            if ($playerId != 0) {
                $this->setStat($points, 'endFootprintsCount', $playerId);
            }
        }

        if ($this->tokensActivated()) {
            foreach($playersIds as $playerId) {
                $tokens = $this->getPlayerTokens($playerId, true);
                $points = 0;
                $tokensByColor = [];
                foreach($tokens as $token) {
                    if (!array_key_exists($token->typeArg, $tokensByColor)) {
                        $tokensByColor[$token->typeArg] = 1;
                    } else {
                        $tokensByColor[$token->typeArg]++;
                    }
                }

                for($color = 1; $color <= 6; $color++) {
                    $colorTokens = array_values(array_filter($tokens, fn($token) => $token->typeArg == $color));
                    if (count($colorTokens)) {
                        $points += $this->POINTS_FOR_COLOR_TOKENS[$tokensByColor[$color] ?? 0];
                    }
                }

                if (count($tokensByColor) >= 6) {
                    $points += 10; // only once * min($tokensByColor);
                }

                $this->DbQuery("UPDATE player SET player_score_tokens = $points WHERE player_id = $playerId");
    
                $this->notifyAllPlayers('scoreTokens', '', [
                    'playerId' => $playerId,
                    'points' => $points,
                ]);
    
                $this->incPlayerScore($playerId, $points, clienttranslate('${player_name} gains ${points} bursts of light with colored tokens'));
    
                if ($playerId != 0) {
                    $this->setStat($points, 'endTokenPoints', $playerId);
                    $this->setStat(count($tokens), 'coloredTokensCount', $playerId);
                    $this->setStat(count($this->getPlayerTokens($playerId, false)), 'tokensCount', $playerId);
                }
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
                $this->DbQuery("UPDATE player SET player_score_after_end = player_score WHERE player_id = $playerId");
                $score = intval($this->getUniqueValueFromDB("SELECT player_score_after_end FROM player where player_id = $playerId"));
                $this->setStat($score, 'points', $playerId);
            }

            $this->notifyAllPlayers('scoreAfterEnd', '', [
                'playerId' => $playerId,
                'points' => $score,
            ]);

            
            $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId));
            if (count($adventurers) > 0) {
                $adventurer = $adventurers[0];
                $this->setStat($score, $adventurer->name.'Points');
                $this->setStat($score, $adventurer->name.'Points', $playerId);
            }
        }
        
        if ($solo) { // solo mode
            $playerId = $playersIds[0];
            $playerScore = $this->getPlayerScore($playerId);
            $tom = $this->getTom();

            /*$this->notifyAllPlayers('soloEndScore', clienttranslate('${player_name} ends with ${points} bursts of light'), [
                'playerId' => $playerId,
                'player_name' => $this->getPlayerName($playerId),
                'points' => $playerScore,
            ]);
            $this->notifyAllPlayers('soloEndScore', clienttranslate('${player_name} ends with ${points} bursts of light'), [
                'playerId' => 0,
                'player_name' => $this->getPlayerName(0),
                'points' => $tom->score,
            ]);*/

            $score = (($playerScore > $tom->score) || ($playerScore == $tom->score && $this->getPlayerFootprints($playerId) > $tom->footprints)) ? 1 : 0;
            $this->DbQuery("UPDATE player SET `player_score` = $score, `player_score_aux` = 0");
        } else {  
            // Tie          
            $this->DbQuery("UPDATE player SET `player_score_aux` = `player_rerolls`");
        }

        $this->gamestate->nextState('endGame');
    }

    function stPrepareAdventurerChoice() {
        if (intval($this->getGameStateValue(RANDOM_ADVENTURERS)) === 2) {
            $this->setRandomAdventurers($this->getPlayersIds());
        } else {
            $this->gamestate->nextState('chooseAdventurer');
        }
    }
}
