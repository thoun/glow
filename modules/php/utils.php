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
    
    function getDiceByColorAndSize(int $color, bool $small = false, int $limit = 0) {
        $sql = "SELECT * FROM dice WHERE `color` = $color AND `small` = ".json_encode($small);
        if ($limit > 0) {
            $sql .= " LIMIT $limit";
        }
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }

    function getDieById(int $id) {
        $sql = "SELECT * FROM dice WHERE `die_id` = $id";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices))[0];
    }

    function moveDiceToPlayer(array $dice, int $playerId) {
        $ids = array_map(function ($idie) { return $idie->id; }, $dice);
        self::DbQuery("UPDATE dice SET `location` = 'player', `location_arg` = $playerId WHERE `die_id` IN (".implode(',', $ids).")");
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

    function incPlayerScore(int $playerId, int $incScore) {
        self::DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");
    }

    function decPlayerScore(int $playerId, int $decScore) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        self::DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");
        return $newScore;
    }

    function getPlayerReroll(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function addPlayerReroll(int $playerId, int $rerolls) {
        self::DbQuery("UPDATE player SET `player_rerolls` = `player_rerolls` + $rerolls WHERE `playerId` = $playerId");
    }

    function removePlayerReroll(int $playerId, int $dec) {
        $newValue = max(0, $this->getPlayerReroll($playerId) - $dec);
        self::DbQuery("UPDATE player SET `player_rerolls` = $newValue WHERE player_id = $playerId");
        return $newValue;
    }

    function createAdventurers() {        
        foreach($this->ADVENTURERS as $type => $adventurer) {
            $adventurers[] = [ 'type' => $type, 'type_arg' => null, 'nbr' => 1];
        }
        $this->adventurers->createCards($adventurers, 'deck');
    }

    function createCompanions() {
        // TODO

        // remove 3 of each face
        for ($face=1; $face<=2; $face++) {
            $removed = $this->getCompanionsFromDb($this->companions->getCardsOfTypeInLocation($face, null, 'deck'));
            $this->companions->moveCards(array_map(function ($companion) { return $companion->id; }, $removed), 'discard');

            // set face 1 (A) before face 2 (B)
            self::DbQuery("UPDATE companion SET `card_location_arg` = `card_location_arg` + ".(100 * $face)." WHERE `card_location` = 'deck' ");
        }

    }

    function createSpells() {
        // TODO
    }

    function placeCompanionsOnMeetingTrack() {
        for ($i=1;$i<=5;$i++) {
            $this->companions->pickCardForLocation('deck', 'meeting', $i);
        }
        // TODO notif
    }

    function getAdventurerName(int $color) {
        $colorName = null;
        switch ($color) {
            case 1: $colorName = 'Braccio'; break;
            case 2: $colorName = 'Taetyss'; break;
            case 3: $colorName = 'Eoles'; break;
            case 4: $colorName = 'Pocana'; break;
            case 5: $colorName = 'Moloc\'h'; break;
            case 6: $colorName = 'Noctiluca'; break;
            case 7: $colorName = 'Orium'; break;
        }
        return $colorName;
    }
}
