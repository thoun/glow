<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        global $g_config;
        if (!$g_config['debug_from_chat']) { 
            return;
        } 

        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (44, 13, 14, 15, 16, 17)");
        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (20)");
        self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10)");
        //$this->debugSetPoints(19);
        //$this->debugSkipAdventurers();

        // Activate first player must be commented in setup if this is used
        //$this->gamestate->changeActivePlayer(2343492);
    }

    private function debugSkipAdventurers() {
        foreach(array_keys(self::loadPlayersBasicInfos()) as $playerId) {
            $this->adventurers->pickCardForLocation('deck', 'player', $playerId);
        }
        //$this->gamestate->jumpToState(ST_START_ROUND);
    }
}
