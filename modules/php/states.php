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
        $day = intval($this->getGameStateValue(DAY)) + 1;
        self::setGameStateValue(DAY, $day);

        self::DbQuery("UPDATE companion SET `reroll_used` = false");
        self::DbQuery("UPDATE player SET `applied_effects` = null, visited_spots = null");

        self::notifyAllPlayers('newDay', clienttranslate('Day ${day} begins'), [
            'day' => $day,
        ]);

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
            'cemeteryTop' => $this->getTopCemeteryCompanion(),
        ]);

        $this->rollPlayerDice();

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
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
    
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
                self::notifyAllPlayers('removeCompanion', clienttranslate('${playerName} discard Cromaug and a companion from the cemetery'), [
                    'playerId' => $playerId,
                    'playerName' => $this->getPlayerName($playerId),
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
        $args = [];

        foreach($playersIds as $playerId) {
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
        $args = [];

        foreach($playersIds as $playerId) {
            if (count($this->getPossibleRoutes($playerId)) > 0) {
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

        $nextPlayerTable = self::createNextPlayerTable(array_keys(self::loadPlayersBasicInfos()));
        $newFirstPlayer = intval($nextPlayerTable[intval($this->getGameStateValue(FIRST_PLAYER))]);
        $this->setGameStateValue(FIRST_PLAYER, $newFirstPlayer);

        self::notifyAllPlayers('newFirstPlayer', clienttranslate('${player_name} is the new First player'), [
            'playerId' => $newFirstPlayer,
            'player_name' => $this->getPlayerName($newFirstPlayer),
        ]);

        if (intval($this->companions->countCardInLocation('deck')) == 0 || intval($this->getGameStateValue(DAY)) >= 8) {
            $this->gamestate->nextState('endScore');
        } else {
            $this->gamestate->nextState('newRound');
        }
    }

    function stEndScore() {
        $playersIds = $this->getPlayersIds();
        $solo = count($playersIds) == 1;
        
        // Adventurer and companions        
        foreach($playersIds as $playerId) {
            $points = 0;
            $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId));
            if (count($adventurers) > 0) {
                $points += $adventurers[0]->points;
            }
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
            foreach($companions as $companion) {
                $points += $companion->points;
            }

            $this->incPlayerScore($playerId, $points, _('${playerName} gains ${points} bursts of light with adventurer and companions'));
        }

        // Journey board 
        $side = $this->getSide();  
        foreach($playersIds as $playerId) {
            $points = $this->getMapFinalScore($side, $playerId);

            $message = null;
            if ($side === 1) {
                $message = _('${playerName} gains ${points} bursts of light with the village where encampment is situated');
            } else if ($side === 2) {
                $message = _('${playerName} gains ${points} bursts of light with boats placed on islands');
            }

            $this->incPlayerScore($playerId, $points, $message);
        }

        // Fireflies
        foreach($playersIds as $playerId) {
            $points = $this->getPlayerFireflies($playerId);
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
            foreach($companions as $companion) {
                $points += $companion->fireflies;
            }

            // If they have as many or more fireflies than companions, they score 10 bursts of light.
            if ($points > count($companions)) {
                $this->incPlayerScore($playerId, 10, _('${playerName} gains ${points} bursts of light with fireflies (more fireflies than companions)'));
            }
        }

        //Each player scores 1 burst of light per footprint in their possession.
        foreach($playersIds as $playerId) {
            $points = $this->getPlayerFootprints($playerId);

            $this->incPlayerScore($playerId, $points, _('${playerName} gains ${points} bursts of light with footprints'));
        }
        
        if ($solo) { // solo mode
            $playerId = $playersIds[0];
            $playerScore = $this->getPlayerScore($playerId);
            $tom = $this->getTom();

            $score = (($playerScore > $tom->score) || ($playerScore == $tom->score && $this->getPlayerFootprints($playerId) > $tom->footprints)) ? 1 : 0;
            self::DbQuery("UPDATE player SET `player_score` = $score, `player_score_aux` = 0");
        } else {  
            // Tie          
            self::DbQuery("UPDATE player SET `player_score_aux` = `player_rerolls`");
        }

        $this->gamestate->nextState('endGame');
    }
}
