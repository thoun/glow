<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }

        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (44, 13, 14, 15, 16, 17)"); // Sketals
        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10)"); // Xar'gok
        //$this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (41)"); // Cromaug
        $this->DbQuery("UPDATE companion SET `card_location` = 'deck', `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (20)"); // Kaar
        //$this->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (10, 20, 41, 44)");
        //$this->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 500 where `card_type_arg` in (37)");
        $this->DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (44, 13, 14, 15, 16, 17)");
        //$this->DbQuery("UPDATE companion SET `card_location` = 'cemetery' where `card_type_arg` in (17)");
        $this->debugSetCompanionForPlayer(2343492, 41);
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
        foreach(array_keys($this->loadPlayersBasicInfos()) as $playerId) {
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
        $meepleId = intval($this->getUniqueValueFromDB("SELECT id from meeple WHERE `player_id` = $playerId LIMIT 1 OFFSET $index"));
        $this->DbQuery("UPDATE meeple SET `position` = $spot where `id` = $meepleId");
    }

    function debugSetFootprints($number) {
        $this->DbQuery("UPDATE player SET `player_footprints` = $number");
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
		/*$ids = [
			20260903,
            89065765,
            89988159,
		];*/
        $ids = array_map(fn($dbPlayer) => intval($dbPlayer['player_id']), array_values($this->getCollectionFromDb('select player_id from player order by player_no')));

		// Id of the first player in BGA Studio
		$sid = 2343492;
		
		foreach ($ids as $id) {
			// basic tables
			$this->DbQuery("UPDATE player SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE global SET global_value=$sid WHERE global_value = $id" );
			$this->DbQuery("UPDATE stats SET stats_player_id=$sid WHERE stats_player_id = $id" );

			// 'other' game specific tables. example:
			// tables specific to your schema that use player_ids
			$this->DbQuery("UPDATE dice SET location_arg=$sid WHERE location_arg = $id" );
			$this->DbQuery("UPDATE meeple SET player_id=$sid WHERE player_id = $id" );
			$this->DbQuery("UPDATE adventurer SET card_location_arg=$sid WHERE card_location_arg = $id" );
			$this->DbQuery("UPDATE adventurer SET card_location_arg=$sid WHERE card_location_arg = $id" );
			$this->DbQuery("UPDATE companion SET card_location='player$sid' WHERE card_location='playersid'" );
			$this->DbQuery("UPDATE spells SET card_location_arg=$sid WHERE card_location_arg = $id" );
			
			++$sid;
		}
	}

}