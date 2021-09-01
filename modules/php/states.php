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

        self::notifyAllPlayers('newDay', clienttranslate('Day ${day} begins'), [
            'day' => $day,
        ]);

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

        $this->companions->moveCards(array_map(function($companion) { return $companion->id; }, $companions), 'cemetery');

        self::notifyAllPlayers('removeCompanions', '', []);

        $this->gamestate->nextState('');
    }

    function stRollDice() {
        $this->gamestate->setAllPlayersMultiactive();
    }

    function stResolveCards() {
        $this->gamestate->nextState('move'); // TODO
    }

    function stMove() {
        $this->gamestate->nextState('endRound'); // TODO
    }    

    function stEndRound() {

        $this->placeCompanionsOnMeetingTrack();
        $this->replaceSmallDiceOnMeetingTrack();

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

        /*// count points remaining in hands
        $playersIds = $this->getPlayersIds();
        foreach($playersIds as $playerId) {
            $animals = $this->getAnimalsFromDb($this->animals->getCardsInLocation('hand', $playerId));
            $points = array_reduce($animals, function ($carry, $item) { return $carry + $item->points; }, 0);
            $this->incPlayerScore($playerId, $points);
        }
        
        // player with highest score starts        
        $sql = "SELECT player_id FROM player where player_score=(select min(player_score) from player) limit 1";
        $minScorePlayerId = self::getUniqueValueFromDB($sql);
        $this->gamestate->changeActivePlayer($minScorePlayerId);
        self::giveExtraTime($minScorePlayerId);

        $roundNumber = intval(self::getGameStateValue(ROUND_NUMBER));

        $endGame = null;
        if ($this->isVariant()) {
            $endGame = $this->getMaxPlayerScore() >= 26;
        } else {
            $endGame = $roundNumber >= 3;
        }

        if ($endGame) {
            $this->gamestate->nextState('endGame');
        } else {
            $this->gamestate->nextState('newRound');
        }*/
    }

    function stEndScore() {
        $playersIds = self::createNextPlayerTable(array_keys(self::loadPlayersBasicInfos()));
        
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

            $this->incPlayerScore($playerId, $points, _('${playerName} gains ${points} with adventurer and companions'));
        }

        // Journey board TODO
        $side = $this->getSide();  
        foreach($playersIds as $playerId) {
            $points = 0;

            if ($side === 1) {
                /*The Province of Shadows journey
                Each player moves forward on the score track the number
                of bursts of light indicated on the village where their
                encampment is situated, independently of where their
                company is placed.*/
            } else if ($side === 2) {
                /*The Archipelago of Darkness journey
                Each player adds together the number of bursts of light
                indicated on the islands on which they have placed their
                boats. They move forward the corresponding number of
                spaces on the score track.*/ 
            }
        }

        // Fireflies
        foreach($playersIds as $playerId) {
            $points = $this->getPlayerFireflies($playerId);
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
            foreach($companions as $companion) {
                $points += $companion->fireflies;
            }

            $this->incPlayerScore($playerId, $points, _('${playerName} gains ${points} bursts of light with fireflies'));

            // If they have as many or more fireflies than companions, they score an additional 10 bursts of light.
            if ($points > count($companions)) {
                $this->incPlayerScore($playerId, 10, _('${playerName} gains additional ${points} bursts of light (more fireflies than companions)'));
            }
        }

        //Each player scores 1 burst of light per footprint in their possession.
        foreach($playersIds as $playerId) {
            $points = $this->getPlayerFootprints($playerId);

            $this->incPlayerScore($playerId, $points, _('${playerName} gains ${points} bursts of light with footprints'));
        }

        // Tie
        self::DbQuery("UPDATE player SET `player_score_aux` = `player_rerolls`");

        $this->gamestate->nextState('endGame');
    }
}
