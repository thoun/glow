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

    function debug($debugData) {
        if ($this->getBgaEnvironment() != 'studio') { 
            return;
        }die('debug data : '.json_encode($debugData));
    }

    /*
     * loadBug: in studio, type loadBug(20762) into the table chat to load a bug report from production
     * client side JavaScript will fetch each URL below in sequence, then refresh the page
     */
    public function loadBug(int $reportId)
    {
      $db = explode('_', self::getUniqueValueFromDB("SELECT SUBSTRING_INDEX(DATABASE(), '_', -2)"));
      $game = $db[0];
      $tableId = $db[1];
      self::notifyAllPlayers(
        'loadBug',
        "Trying to load <a href='https://boardgamearena.com/bug?id=$reportId' target='_blank'>bug report $reportId</a>",
        [
          'urls' => [
            // Emulates "load bug report" in control panel
            "https://studio.boardgamearena.com/admin/studio/getSavedGameStateFromProduction.html?game=$game&report_id=$reportId&table_id=$tableId",
  
            // Emulates "load 1" at this table
            "https://studio.boardgamearena.com/table/table/loadSaveState.html?table=$tableId&state=1",
  
            // Calls the function below to update SQL
            "https://studio.boardgamearena.com/1/$game/$game/loadBugSQL.html?table=$tableId&report_id=$reportId",
  
            // Emulates "clear PHP cache" in control panel
            // Needed at the end because BGA is caching player info
            "https://studio.boardgamearena.com/admin/studio/clearGameserverPhpCache.html?game=$game",
  
            // Emulates "save 1" at this table
            //"https://studio.boardgamearena.com/table/table/debugSaveState.html?table=$tableId&state=1",
          ],
        ]
      );
    }
  
    /*
     * loadBugSQL: in studio, this is one of the URLs triggered by loadBug() above
     */
    public function loadBugSQL(int $reportId)
    {
      $studioPlayer = self::getCurrentPlayerId();
      $players = self::getObjectListFromDb('SELECT player_id FROM player', true);
  
      // Change for your game
      // We are setting the current state to match the start of a player's turn if it's already game over
      $sql = ['UPDATE global SET global_value=2 WHERE global_id=1 AND global_value=99'];
      $map = [];
      foreach ($players as $pId) {
        $map[(int) $pId] = (int) $studioPlayer;
  
        // All games can keep this SQL
        $sql[] = "UPDATE player SET player_id=$studioPlayer WHERE player_id=$pId";
        $sql[] = "UPDATE global SET global_value=$studioPlayer WHERE global_value=$pId";
        $sql[] = "UPDATE stats SET stats_player_id=$studioPlayer WHERE stats_player_id=$pId";
  
        // Add game-specific SQL update the tables for your game
        $sql[] = "UPDATE dice SET location_arg=$studioPlayer WHERE location_arg = $pId";
        $sql[] = "UPDATE meeple SET player_id=$studioPlayer WHERE player_id = $pId";
        $sql[] = "UPDATE adventurer SET card_location_arg=$studioPlayer WHERE card_location_arg = $pId";
        $sql[] = "UPDATE adventurer SET card_location_arg=$studioPlayer WHERE card_location_arg = $pId";
        $sql[] = "UPDATE companion SET card_location='player$studioPlayer' WHERE card_location='player$pId'";
        $sql[] = "UPDATE spells SET card_location_arg=$studioPlayer WHERE card_location_arg = $pId";
        $sql[] = "UPDATE token SET card_location_arg=$studioPlayer WHERE card_location_arg = $pId";
  
        // This could be improved, it assumes you had sequential studio accounts before loading
        // e.g., quietmint0, quietmint1, quietmint2, etc. are at the table
        $studioPlayer++;
      }
      $msg =
        "<b>Loaded <a href='https://boardgamearena.com/bug?id=$reportId' target='_blank'>bug report $reportId</a></b><hr><ul><li>" .
        implode(';</li><li>', $sql) .
        ';</li></ul>';
      self::warn($msg);
      self::notifyAllPlayers('message', $msg, []);
  
      foreach ($sql as $q) {
        self::DbQuery($q);
      }
  
      self::reloadPlayersBasicInfos();
    }

}