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

    function stNextPlayerRecruitCompanion() {     
        $playerId = self::getActivePlayerId();

        $this->activeNextPlayer();
    
        $playerId = self::getActivePlayerId();
        self::giveExtraTime($playerId);

        $endRecruit = intval(self::getUniqueValueFromDB("SELECT count(*) FROM player where player_recruit_day < (".$this->getDaySql().")")) == 0;
        $this->gamestate->nextState($endRecruit ? 'end' : 'nextPlayer');
    }

    function stStartRound() {
        $day = intval($this->getGameStateValue(DAY)) + 1;
        self::setGameStateValue(DAY, $day);

        // reset cards
        /*$this->animals->moveAllCardsInLocation(null, 'deck');
        $this->animals->shuffle('deck');
        $this->ferries->moveAllCardsInLocation(null, 'deck');
        $this->ferries->shuffle('deck');

        $this->setInitialCardsAndResources($this->getPlayersIds());*/

        // TODO TEMP
        //$this->debugSetup();

        $this->gamestate->nextState('morning');
    }

    function stRollDice() {
        $this->gamestate->nextState('resolve'); // TODO
    }

    function stResolveCards() {
        $this->gamestate->nextState('move'); // TODO
    }

    function stMove() {
        $this->gamestate->nextState('endRound'); // TODO
    }    

    function stEndRound() {

        $this->placeCompanionsOnMeetingTrack();

        $nextPlayerTable = self::createNextPlayerTable(array_keys(self::loadPlayersBasicInfos()));
        $newFirstPlayer = intval($nextPlayerTable[intval($this->getGameStateValue(FIRST_PLAYER))]);
        $this->setGameStateValue(FIRST_PLAYER, $newFirstPlayer);

        self::notifyAllPlayers('newFirstPlayer', clienttranslate('${player_name} is the new First player'), [
            'playerId' => $newFirstPlayer,
            'player_name' => $this->getPlayerName($newFirstPlayer),
        ]);

        if (intval($this->companions->countCardInLocation('deck')) == 0 || intval($this->getGameStateValue(DAY)) == 8) {
            $this->gamestate->nextState('endGame');
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
}
