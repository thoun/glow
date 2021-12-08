<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }

        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (44, 13, 14, 15, 16, 17)");
        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (20)");
        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10, 20, 41, 44)");
        self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (37)");
        //self::DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (44, 13, 14, 15, 16, 17)");
        //self::DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (17)");
        //$this->debugSetCompanionForPlayer(2343492, 41);
        //$this->debugSetPoints(19);
        //$this->debugSkipAdventurers();

        //$this->debugMoveMeeple(2343492, 15, 0);
        //$this->debugMoveMeeple(2343493, 40, 0);

        //$this->debugAddSpell(2343492, 1);

        // Activate first player must be commented in setup if this is used
        //$this->gamestate->changeActivePlayer(2343492);
    }

    private function debugSkipAdventurers() {
        foreach(array_keys(self::loadPlayersBasicInfos()) as $playerId) {
            $this->adventurers->pickCardForLocation('deck', 'player', $playerId);
        }
        //$this->gamestate->jumpToState(ST_START_ROUND);
    }

    private function debugSetCompanionForPlayer($playerId, $subType) {
        $card = $this->getCompanionsFromDb($this->companions->getCardsOfType($subType <= 23 ? 1 : 2, $subType))[0];
        $this->companions->moveCard($card->id, 'player', $playerId);
    }

    private function debugAddSpell($playerId, $type) {
        $card = $this->getSpellsFromDb($this->spells->getCardsOfType($type))[0];
        $this->spells->moveCard($card->id, 'player', $playerId);
    }

    private function debugMoveMeeple($playerId, $spot, $index) {
        $meepleId = intval(self::getUniqueValueFromDB("SELECT id from meeple WHERE `player_id` = $playerId LIMIT 1 OFFSET $index"));
        self::DbQuery("UPDATE meeple SET `position` = $spot where `id` = $meepleId");
    }

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
}