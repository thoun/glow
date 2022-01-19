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
        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (44)");
        //self::DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10)"); // Xar'gok
        self::DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (41)"); // Cromaug
        self::DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (20)"); // Kaar
        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10, 20, 41, 44)");
        //self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (37)");
        //self::DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (44, 13, 14, 15, 16, 17)");
        //self::DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (17)");
        //$this->debugSetCompanionForPlayer(2343492, 41);
        //$this->debugSetPoints(19);
        $this->debugSetFootprints(30);
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
        $this->companions->moveCard($card->id, 'player'.$playerId, 0);
    }

    private function debugAddSpell($playerId, $type) {
        $card = $this->getSpellsFromDb($this->spells->getCardsOfType($type))[0];
        $this->spells->moveCard($card->id, 'player', $playerId);
    }

    private function debugMoveMeeple($playerId, $spot, $index) {
        $meepleId = intval(self::getUniqueValueFromDB("SELECT id from meeple WHERE `player_id` = $playerId LIMIT 1 OFFSET $index"));
        self::DbQuery("UPDATE meeple SET `position` = $spot where `id` = $meepleId");
    }

    function debugSetFootprints($number) {
        self::DbQuery("UPDATE player SET `player_footprints` = $number");
    }

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }
    

    public function debugReplacePlayersIds() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        } 

		// These are the id's from the BGAtable I need to debug.
		$ids = [
			20260903,
            89065765,
            89988159,
		];

		// Id of the first player in BGA Studio
		$sid = 2343492;
		
		foreach ($ids as $id) {
			// basic tables
			self::DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id" );
			self::DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id" );
			self::DbQuery("UPDATE stats SET stats_player_id=$sid WHERE stats_player_id = $id" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			self::DbQuery("UPDATE dice SET location_arg=$sid WHERE location_arg = $id" );
			self::DbQuery("UPDATE meeple SET player_id=$sid WHERE player_id = $id" );
			self::DbQuery("UPDATE adventurer SET card_location_arg=$sid WHERE card_location_arg = $id" );
			self::DbQuery("UPDATE adventurer SET card_location_arg=$sid WHERE card_location_arg = $id" );
			self::DbQuery("UPDATE companion SET card_location='player$sid' WHERE card_location='playersid'" );
			self::DbQuery("UPDATE spells SET card_location_arg=$sid WHERE card_location_arg = $id" );
			
			++$sid;
		}
	}

}