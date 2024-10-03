<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }

        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 5000 where `card_type_arg` in (44, 13, 14, 15, 16, 17)"); // Sketals
        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 5000 where `card_type_arg` in (10)"); // Xar'gok
        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 5000 where `card_type_arg` in (41)"); // Cromaug
        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 5000 where `card_type_arg` in (20)"); // Kaar
        $this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 5000 where `card_type_arg` in (107)"); // Crolos
        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 5000 where `card_type_arg` in (206, 207)");
        //$this->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10, 20, 41, 44)");
        //$this->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (37)");
        //$this->DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (44, 13, 14, 15, 16, 17)");
        //$this->DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (17)");
        //$this->debugSetCompanionForPlayer(2343492, 201);
        //$this->debugSetCompanionForPlayer(2343492, 202);
        //$this->debugSetCompanionForPlayer(2343492, 203);
        //$this->debugSetCompanionForPlayer(2343492, 204);
        //$this->debugSetCompanionForPlayer(2343492, 304);
        //$this->debugSetPoints(19);
        //$this->debugSetFootprints(2);
        //$this->debugSetFireflies(2);
        //$this->debugSetRerolls(30);
        //$this->debugSetScore(45);
        //$this->addPlayerTokens(2343492, 22);
        //$this->addPlayerTokens(2343493, 22);
        //$this->debugSkipAdventurers();

        //$this->debugMoveMeeple(2343492, 15, 0);
        //$this->debugMoveMeeple(2343493, 40, 0);

        //$this->debugAddSpell(2343492, 5);
        //$this->debugAddSpell(2343492, 9);
        //$this->debugAddSpell(2343492, 10);
        //$this->debugLastDay();

        // Activate first player must be commented in setup if this is used
        //$this->gamestate->changeActivePlayer(2343492);
    }

    function debugSkipAdventurers() {
        foreach(array_keys($this->loadPlayersBasicInfos()) as $playerId) {
            $this->adventurers->pickCardForLocation('deck', 'player', $playerId);
        }
        //$this->gamestate->jumpToState(ST_START_ROUND);
    }

    function debugSetCompanionForPlayer($playerId, $subType) {
        $type = ($subType > 100 ? ($subType % 100 <= 4) : $subType <= 23) ? 1 : 2;
        $card = $this->getCompanionsFromDb($this->companions->getCardsOfType($type, $subType))[0];
        $this->companions->moveCard($card->id, 'player'.$playerId, 0);
    }

    function debugAddSpell($playerId, $type) {
        $card = $this->getSpellsFromDb($this->spells->getCardsOfType($type))[0];
        $this->spells->moveCard($card->id, 'player', $playerId);
    }

    function debugMoveMeeple($playerId, $spot, $index) {
        $meepleId = intval($this->getUniqueValueFromDB("SELECT id from meeple WHERE `player_id` = $playerId LIMIT 1 OFFSET $index"));
        $this->DbQuery("UPDATE meeple SET `position` = $spot where `id` = $meepleId");
    }

    function debugSetFootprints($number) {
        $this->DbQuery("UPDATE player SET `player_footprints` = $number");
    }

    function debugSetRerolls($number) {
        $this->DbQuery("UPDATE player SET `player_rerolls` = $number");
    }

    function debugSetFireflies($number) {
        $this->DbQuery("UPDATE player SET `player_fireflies` = $number");
    }

    function debugSetScore($number) {
        $this->DbQuery("UPDATE player SET `player_score` = $number");
    }

    function debugLastDay() {
        $this->setGameStateValue(DAY, 8);
    }

    function debug_reactivateCurrentPlayer() {
        $this->gamestate->setPlayersMultiactive([$this->getCurrentPlayerId()], 'move');
        $this->gamestate->jumpToState(ST_MULTIPLAYER_PRIVATE_MOVE);
    }

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }

}