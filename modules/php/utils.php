<?php

require_once(__DIR__.'/objects/effect.php');
require_once(__DIR__.'/objects/adventurer.php');
require_once(__DIR__.'/objects/companion.php');
require_once(__DIR__.'/objects/dice.php');

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function getFirstPlayerId() {
        return intval(self::getGameStateValue(FIRST_PLAYER));
    }

    function getDaySql() {
        return "select global_value from global where global_id = 10"; // 10 = DAY global id
    }

    function getSide() {
        return intval(self::getGameStateValue(BOARD_SIDE));
    }

    function createDice() {
        $sql = "INSERT INTO dice (`color`, `small`) VALUES ";
        $values = [];
        foreach($this->DICES as $color => $counts) {
            // big
            for ($i=0; $i<$counts[0]; $i++) {
                $values[] = "($color, false)";
            }

            // small
            for ($i=0; $i<$counts[0]; $i++) {
                $values[] = "($color, true)";
            }
        }
        $sql .= implode($values, ',');
        self::DbQuery($sql);
    }

    function persistDice(array $dice) {
        foreach($dice as $idie) {
            self::DbQuery("UPDATE dice SET `die_face` = $idie->face WHERE `die_id` = $idie->id");
        }
    }

    function getAdventurerFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Adventurer doesn't exists ".json_encode($dbObject));
        }
        return new Adventurer($dbObject, $this->ADVENTURERS);
    }

    function getAdventurersFromDb(array $dbObjects) {
        return array_map(function($dbObject) { return $this->getAdventurerFromDb($dbObject); }, array_values($dbObjects));
    }

    function getCompanionFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Companion doesn't exists ".json_encode($dbObject));
        }
        return new Companion($dbObject, $this->COMPANIONS);
    }

    function getCompanionsFromDb(array $dbObjects) {
        return array_map(function($dbObject) { return $this->getCompanionFromDb($dbObject); }, array_values($dbObjects));
    }
    
    function getSmallDiceIgnoreBlack() {
        $sql = "SELECT * FROM dice WHERE `small` = true and `color` <> 8";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }
    
    function getDiceByColorAndSize(int $color = 0, bool $small = false, int $limit = 0) {
        $sql = "SELECT * FROM dice WHERE `color` = $color AND `small` = ".json_encode($small);
        if ($limit > 0) {
            $sql .= " LIMIT $limit";
        }
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }
    
    function getDiceByLocation(string $location, $locationArg = null) {
        $sql = "SELECT * FROM dice WHERE `location` = '$locationArg'";
        if ($locationArg !== null) {
            $sql .= " AND `location_arg` = $locationArg";
        }
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }

    function getDieById(int $id) {
        $sql = "SELECT * FROM dice WHERE `die_id` = $id";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices))[0];
    }

    function moveDice(array $dice, string $location, int $locationArg) {
        $ids = array_map(function ($idie) { return $idie->id; }, $dice);
        self::DbQuery("UPDATE dice SET `location` = '$location', `location_arg` = $locationArg WHERE `die_id` IN (".implode(',', $ids).")");
    }

    function getPlayerCount() {
        return intval(self::getUniqueValueFromDB("SELECT count(*) FROM player"));
    }

    function getPlayerName(int $playerId) {
        return self::getUniqueValueFromDb("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayerScore(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $incScore, $message = null, $params = []) {
        self::DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");

        if ($message != null) {
            self::notifyAllPlayers('points', $message, $params + [
                'playerId' => $playerId,
                'playerName' => $this->getPlayerName($playerId),
                'points' => $incScore,
            ]);
        }
    }

    function decPlayerScore(int $playerId, int $decScore) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        self::DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");
        return $newScore;
    }

    function getPlayerRerolls(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT `player_rerolls` FROM player where `player_id` = $playerId"));
    }

    function addPlayerRerolls(int $playerId, int $rerolls) {
        self::DbQuery("UPDATE player SET `player_rerolls` = `player_rerolls` + $rerolls WHERE `playerId` = $playerId");
    }

    function removePlayerRerolls(int $playerId, int $dec) {
        $newValue = max(0, $this->getPlayerRerolls($playerId) - $dec);
        self::DbQuery("UPDATE player SET `player_rerolls` = $newValue WHERE player_id = $playerId");
        return $newValue;
    }

    function getPlayerFootprints(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT `player_footprints` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFootprints(int $playerId, int $footprints) {
        self::DbQuery("UPDATE player SET `player_footprints` = `player_footprints` + $footprints WHERE `playerId` = $playerId");
    }

    function removePlayerFootprints(int $playerId, int $dec) {
        $newValue = max(0, $this->getPlayerFootprints($playerId) - $dec);
        self::DbQuery("UPDATE player SET `player_footprints` = $newValue WHERE player_id = $playerId");
        return $newValue;
    }

    function getPlayerFireflies(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT `player_fireflies` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFireflies(int $playerId, int $fireflies) {
        self::DbQuery("UPDATE player SET `player_fireflies` = `player_fireflies` + $fireflies WHERE `playerId` = $playerId");
    }

    function createAdventurers() {        
        foreach($this->ADVENTURERS as $type => $adventurer) {
            $adventurers[] = [ 'type' => $type, 'type_arg' => null, 'nbr' => 1];
        }
        $this->adventurers->createCards($adventurers, 'deck');
    }

    function createCompanions() {
        foreach($this->COMPANIONS as $subType => $companion) {
            $companions[] = [ 'type' => $subType > 23 ? 2 : 1, 'type_arg' => $subType, 'nbr' => 1];
        }
        $this->companions->createCards($companions, 'deck');
        $this->companions->shuffle('deck');

        // remove 3 of each face
        for ($face=1; $face<=2; $face++) {
            $removed = array_slice($this->getCompanionsFromDb($this->companions->getCardsOfTypeInLocation($face, null, 'deck')), 0, 3);
            $this->companions->moveCards(array_map(function ($companion) { return $companion->id; }, $removed), 'discard');

        }
        // set face 1 (A) before face 2 (B)
        self::DbQuery("UPDATE companion SET `card_location_arg` = `card_location_arg` + (100 * `card_type`) WHERE `card_location` = 'deck' ");
    }

    function createSpells() {
        foreach($this->EFFECTS as $type => $effect) {
            $effects[] = [ 'type' => $type, 'type_arg' => null, 'nbr' => 1];
        }
        $this->effects->createCards($effects, 'deck');
    }

    function placeCompanionsOnMeetingTrack() {
        for ($i=1;$i<=5;$i++) {
            $this->companions->pickCardForLocation('deck', 'meeting', $i);
        }
    }

    function initMeetingTrack() {
        $smallDice = $this->getSmallDiceIgnoreBlack();

        // rolls the 9 small dice
        foreach($smallDice as &$idie) {
            $idie->roll();

            // If the purple die indicates the footprint symbol, it is rerolled
            while ($idie->color === 6 && $idie->face === 6) {
                $idie->roll();
            }
        }

        for ($i=1; $i<=5; $i++) {
            $colorDice = array_values(array_filter($smallDice, function ($idie) use ($i) { return $idie->color === $i; }));
            if (count($colorDice) > 0) {
                $this->moveDice($colorDice, 'meeting', $this->MEETING_SPOT_BY_COLOR[$i]);
            } else {
                // add footprint if no die on track
            }
        }
         $this->persistDice($smallDice);
    }


        
}
