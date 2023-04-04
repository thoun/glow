<?php

require_once(__DIR__.'/objects/effect.php');
require_once(__DIR__.'/objects/adventurer.php');
require_once(__DIR__.'/objects/companion.php');
require_once(__DIR__.'/objects/spell.php');
require_once(__DIR__.'/objects/token.php');
require_once(__DIR__.'/objects/solo-tile.php');
require_once(__DIR__.'/objects/dice.php');
require_once(__DIR__.'/objects/meeple.php');
require_once(__DIR__.'/objects/meeting-track-spot.php');

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function array_find(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return $value;
            }
        }
        return null;
    }

    function array_findIndex(array $array, callable $fn) {
        $index = 0;
        foreach ($array as $value) {
            if($fn($value)) {
                return $index;
            }
            $index++;
        }
        return null;
    }

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
    }
        
    function array_every(array $array, callable $fn) {
        foreach ($array as $value) {
            if(!$fn($value)) {
                return false;
            }
        }
        return true;
    }

    function setGlobalVariable(string $name, /*object|array*/ $obj) {
        /*if ($obj == null) {
            throw new \Error('Global Variable null');
        }*/
        $jsonObj = json_encode($obj);
        $this->DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('$name', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getGlobalVariable(string $name, $asArray = null) {
        $json_obj = $this->getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = '$name'");
        if ($json_obj) {
            $object = json_decode($json_obj, $asArray);
            return $object;
        } else {
            return null;
        }
    }

    function deleteGlobalVariable(string $name) {
        $this->DbQuery("DELETE FROM `global_variables` where `name` = '$name'");
    }

    function isTurnBased() {
        return intval($this->gamestate->table_globals[200]) >= 10;
    }

    function autoSkipImpossibleActions() {
        return $this->isTurnBased();
    }

    function getFirstPlayerId() {
        return intval($this->getGameStateValue(FIRST_PLAYER));
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getDaySql() {
        return "select global_value from global where global_id = 10"; // 10 = DAY global id
    }

    function getSide() {
        return intval($this->getGameStateValue(BOARD_SIDE));
    }

    function isExpansion() {
        return intval($this->getGameStateValue(OPTION_EXPANSION)) >= 2;
    }

    function createDice(bool $isExpansion, int $playerCount) {
        $sql = "INSERT INTO dice (`color`, `small`, `die_face`, `location`) VALUES ";
        $values = [];

        $DICE = $this->DICES;
        if ($isExpansion) {
            foreach($this->DICES_EXPANSION1 as $color => $numbers) {
                $DICE[$color] = $numbers;
            }
        }

        foreach($DICE as $color => $counts) {

            $face = min($color, 6);

            // big
            for ($i=0; $i<$counts[0]; $i++) {
                $values[] = "($color, false, $face, 'deck')";
            }

            if ($playerCount == 1 && $color == 8) {
                continue;
            }

            // small
            for ($i=0; $i<$counts[1]; $i++) {
                $values[] = "($color, true, $face, 'deck')";
            }
        }

        if ($playerCount >= 5) {
            foreach ([1, 2, 3, 6] as $color) {
                $values[] = "($color, true, $face, 'decksmall')";
            }

            if ($playerCount >= 6) {
                foreach ([4, 5] as $color) {
                    $values[] = "($color, true, $face, 'decksmall')";
                }
            }
        }

        $sql .= implode(',', $values);
        $this->DbQuery($sql);
    }

    function persistDice(array $dice) {
        foreach($dice as $idie) {
            $this->DbQuery("UPDATE dice SET `die_face` = $idie->face WHERE `die_id` = $idie->id");
        }
    }

    function getAdventurerFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Adventurer doesn't exists ".json_encode($dbObject));
        }
        return new Adventurer($dbObject, $this->ADVENTURERS);
    }

    function getAdventurersFromDb(array $dbObjects) {
        return array_map(fn($dbObject) => $this->getAdventurerFromDb($dbObject), array_values($dbObjects));
    }

    function getAllCompanions() {
        $COMPANIONS = $this->COMPANIONS;
        foreach ([1, 2, 3] as $moduleNumber) {
            $COMPANIONS = $COMPANIONS + $this->COMPANIONS_EXPANSION1_SETS[$moduleNumber]['adds'];
        }
        return $COMPANIONS;
    }

    function getCompanionFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Companion doesn't exists ".json_encode($dbObject));
        }

        return new Companion($dbObject, $this->getAllCompanions());
    }

    function getCompanionsFromDb(array $dbObjects) {
        return array_map(fn($dbObject) => $this->getCompanionFromDb($dbObject), array_values($dbObjects));
    }

    function getSpellFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Spell doesn't exists ".json_encode($dbObject));
        }
        return new Spell($dbObject, $this->SPELLS);
    }

    function getSpellsFromDb(array $dbObjects) {
        return array_map(fn($dbObject) => $this->getSpellFromDb($dbObject), array_values($dbObjects));
    }

    function getSoloTileFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Solo tile doesn't exists ".json_encode($dbObject));
        }
        return new SoloTile($dbObject, $this->SOLO_TILES);
    }

    function getSoloTilesFromDb(array $dbObjects) {
        return array_map(fn($dbObject) => $this->getSoloTileFromDb($dbObject), array_values($dbObjects));
    }

    function getTokenFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Token doesn't exists ".json_encode($dbObject));
        }
        return new Token($dbObject);
    }

    function getTokensFromDb(array $dbObjects) {
        return array_map(fn($dbObject) => $this->getTokenFromDb($dbObject), array_values($dbObjects));
    }
    
    function getSmallDice(bool $ignoreBlack, string $location) {
        $sql = "SELECT * FROM dice WHERE `small` = true AND `location` = '$location' ";
        if ($ignoreBlack) {
            $sql .= " AND `color` <> 8";
        }
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }
    
    function getBigDiceByColor(int $color, int $limit) {
        $sql = "SELECT * FROM dice WHERE `location` = 'deck' AND `color` = $color AND `small` = false LIMIT $limit";
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }
    
    function getDiceByLocation(string $location, $locationArg = null, $used = null) {
        $sql = "SELECT * FROM dice WHERE `location` = '$location'";
        if ($locationArg !== null) {
            $sql .= " AND `location_arg` = $locationArg";
        }
        if ($used !== null) {
            $sql .= " AND `used` = ".json_encode($used);
        }
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function getDiceByIds(array $ids) {
        if (count($ids) === 0) {
            return [];
        }

        $sql = "SELECT * FROM dice WHERE `die_id` IN (".implode(',', $ids).")";
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function getDieById(int $id) {
        $sql = "SELECT * FROM dice WHERE `die_id` = $id";
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices))[0];
    }
    
    function getAvailableBigDice() {
        $sql = "SELECT * FROM dice WHERE `location` = 'table' AND `small` = false";
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function getSmallBlackDie() {
        $sql = "SELECT * FROM dice WHERE `color` = 8 AND `small` = true";
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices))[0];
    }
    
    function getPlayerBigDiceByColor(int $playerId, int $dieColor) {
        $sql = "SELECT * FROM dice WHERE `location` = 'player' AND `location_arg` = $playerId AND `color` = $dieColor AND `small` = false";
        $dbDices = $this->getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function moveDice(array $dice, string $location, int $locationArg = 0) {
        $ids = array_map(fn($idie) => $idie->id, $dice);
        $this->DbQuery("UPDATE dice SET `location` = '$location', `location_arg` = $locationArg WHERE `die_id` IN (".implode(',', $ids).")");
        foreach($dice as &$die) {
            $die->location = $location;
            $die->location_arg = $locationArg;
        }
    }

    function getPlayerCount() {
        return intval($this->getUniqueValueFromDB("SELECT count(*) FROM player"));
    }

    function getSpotCount() {
        $spotCount = 5;
        $playerCount = $this->getPlayerCount();
        if ($playerCount >= 5) {
            $spotCount = $playerCount + 2;
        }
        return  $spotCount;
    }        

    function getPlayerName(int $playerId) {
        if ($playerId == 0) {
            return 'Tom';
        } else {
            return $this->getUniqueValueFromDb("SELECT player_name FROM player WHERE player_id = $playerId");
        }
    }

    function getPlayerScore(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function getPlayerSmallBoard(int $playerId) {
        if ($playerId == 0) {
            return false;
        } else {
            return boolval($this->getUniqueValueFromDb("SELECT player_small_board FROM player WHERE player_id = $playerId"));
        }
    }

    function incPlayerScore(int $playerId, int $incScore, $message = '', $params = []) {
        if ($playerId == 0) {
            $this->incTomScore($incScore, $message, $params);
            return;
        }
        
        $this->DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");
        

        $this->notifyAllPlayers('points', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'points' => $incScore,
            'abspoints' => $incScore,
            'newScore' => $this->getPlayerScore($playerId),
        ]);
    }

    function decPlayerScore(int $playerId, int $decScore, $message = '', $params = []) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        $this->DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");

        $this->notifyAllPlayers('points', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'points' => -$decScore,
            'abspoints' => $decScore,
            'newScore' => $newScore,
        ]);

        return $newScore;
    }

    function getPlayerRerolls(int $playerId) {
        if ($playerId == 0) {
            return $this->getTomRerolls();
        }

        return intval($this->getUniqueValueFromDB("SELECT `player_rerolls` FROM player where `player_id` = $playerId"));
    }

    function addPlayerRerolls(int $playerId, int $rerolls, $message = '', $params = []) {
        $this->DbQuery("UPDATE player SET `player_rerolls` = `player_rerolls` + $rerolls WHERE `player_id` = $playerId");

        $this->notifyAllPlayers('rerolls', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'rerolls' => $rerolls,
            'absrerolls' => $rerolls,
        ]);
    }

    function removePlayerRerolls(int $playerId, int $dec, $message = '', $params = []) {
        $newValue = max(0, $this->getPlayerRerolls($playerId) - $dec);
        $this->DbQuery("UPDATE player SET `player_rerolls` = $newValue WHERE player_id = $playerId");

        $this->notifyAllPlayers('rerolls', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'rerolls' => -$dec,
            'absrerolls' => $dec,
        ]);

        return $newValue;
    }

    function getPlayerFootprints(int $playerId) {
        if ($playerId == 0) {
            return $this->getTomFootprints();
        }

        return intval($this->getUniqueValueFromDB("SELECT `player_footprints` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFootprints(int $playerId, int $footprints, $message = '', $params = []) {
        if ($playerId == 0) {
            $this->addTomFootprints($footprints);
        } else {
            $this->DbQuery("UPDATE player SET `player_footprints` = `player_footprints` + $footprints WHERE `player_id` = $playerId");
        }

        $this->notifyAllPlayers('footprints', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'footprints' => $footprints,
            'absfootprints' => $footprints,
        ]);
    }

    function removePlayerFootprints(int $playerId, int $dec, $message = '', $params = []) {
        if ($playerId == 0) {
            $newValue = $this->removeTomFootprints($dec);
        } else {
            $newValue = max(0, $this->getPlayerFootprints($playerId) - $dec);
            $this->DbQuery("UPDATE player SET `player_footprints` = $newValue WHERE player_id = $playerId");
        }

        $this->notifyAllPlayers('footprints', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'footprints' => -$dec,
            'absfootprints' => $dec,
        ]);

        return $newValue;
    }

    function getPlayerFireflies(int $playerId) {
        if ($playerId == 0) {
            return $this->getTomFireflies();
        }

        return intval($this->getUniqueValueFromDB("SELECT `player_fireflies` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFireflies(int $playerId, int $fireflies, $message = '', $params = []) {
        $this->DbQuery("UPDATE player SET `player_fireflies` = `player_fireflies` + $fireflies WHERE `player_id` = $playerId");

        $this->notifyAllPlayers('fireflies', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'fireflies' => $fireflies,
        ]);
    }

    function createAdventurers(bool $expansion, bool $solo) {        
        foreach($this->ADVENTURERS as $type => $adventurer) {
            $create = $expansion || $type <= 7;
            if ($solo && $type == 9) {
                $create = false;
            }
            if ($create) {
                $adventurers[] = [ 'type' => $type, 'type_arg' => null, 'nbr' => 1];
            }
        }
        $this->adventurers->createCards($adventurers, 'deck');
    }

    function createCompanions(bool $solo, array $addedCompanions, array $removedCompanions) {
        $companions = [];
        $companionsB = [];
        foreach ($this->COMPANIONS as $subType => $companion) {
            if (in_array($subType, $removedCompanions) || ($solo && in_array($subType, $this->REMOVED_COMPANION_FOR_SOLO))) {
                continue;
            }
            $typeB = $subType > 23;
            $card = [ 'type' => $typeB ? 2 : 1, 'type_arg' => $subType, 'nbr' => 1];
            if ($solo && $typeB) {
                $companionsB[] = $card;
            } else {
                $companions[] = $card;
            }
        }
        foreach ($addedCompanions as $subType => $companion) {
            $typeB = $subType % 100 > 4;
            $card = [ 'type' => $typeB ? 2 : 1, 'type_arg' => $subType, 'nbr' => 1];
            if ($solo && $typeB) {
                $companionsB[] = $card;
            } else {
                $companions[] = $card;
            }
        }
        $this->companions->createCards($companions, 'deck');
        $this->companions->shuffle('deck');
        if (count($companionsB) > 0) {
            $this->companions->createCards($companionsB, 'deckB');
            $this->companions->shuffle('deckB');
        } 

        if (!$solo) {
            // remove 3 of each face
            for ($face=1; $face<=2; $face++) {
                $removed = array_slice($this->getCompanionsFromDb($this->companions->getCardsOfTypeInLocation($face, null, 'deck')), 0, 3);
                $this->companions->moveCards(array_map(fn($companion) => $companion->id, $removed), 'malach');
            }
            // set face 1 (A) before face 2 (B)
            $this->DbQuery("UPDATE companion SET `card_location_arg` = `card_location_arg` + (1000 * (2 - `card_type`)) WHERE `card_location` IN ('deck', 'malach') ");
        }
    }

    function createSpells() {
        $spells = [];

        foreach($this->SPELLS as $type => $spellCard) {
            $spells[] = [ 'type' => $type, 'type_arg' => 0, 'nbr' => $spellCard->number];
        }
        $this->spells->createCards($spells, 'deck');
        $this->spells->shuffle('deck');
    }

    function createSoloTiles() {
        $soloTiles = [];

        foreach($this->SOLO_TILES as $type => $tile) {
            $soloTiles[] = [ 'type' => $type, 'type_arg' => 0, 'nbr' => 1];
        }
        $this->soloTiles->createCards($soloTiles, 'deck');
        $this->soloTiles->shuffle('deck');
    }

    function createTokens() {
        $tokens = [
            [ 'type' => 2, 'type_arg' => 41, 'nbr' => 3],
            [ 'type' => 2, 'type_arg' => 21, 'nbr' => 2],
            [ 'type' => 2, 'type_arg' => 12, 'nbr' => 1],
            [ 'type' => 3, 'type_arg' => 37, 'nbr' => 1],
            [ 'type' => 3, 'type_arg' => 0, 'nbr' => 2],
        ];
        
        for($color = 1; $color <= 6; $color++) {
            $tokens[] = [ 'type' => 1, 'type_arg' => $color, 'nbr' => 6];
        }
        $this->tokens->createCards($tokens, 'bag');
        $this->tokens->shuffle('bag');
    }

    function tokensActivated() {
        return intval($this->getGameStateValue(OPTION_EXPANSION + 2)) == 2;
    }

    function getMeetingTrackFootprints(int $spot) {
        return intval($this->getUniqueValueFromDB("SELECT `footprints` FROM meetingtrack WHERE `spot` = $spot"));
    }

    function removeMeetingTrackFootprints(int $spot) {
        $this->DbQuery("UPDATE meetingtrack SET `footprints` = 0 WHERE `spot` = $spot");

        $this->notifyAllPlayers('footprintAdded', '', [
            'spot' => $spot,
            'number' => 0,
        ]);
    }

    function placeCompanionsOnMeetingTrack() {        
        $solo = $this->isSoloMode();
        $spotCount = $this->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $bigDieInSpot = false;
            if ($solo) {
                $dice = $this->getDiceByLocation('meeting', $i);
                foreach($dice as $die) {
                    if (!$die->small) {
                        $bigDieInSpot = true;
                    }
                }
            }
            if (!$bigDieInSpot) {
                $this->companions->pickCardForLocation('deck', 'meeting', $i);
            }
        }
    }
    
    function setDiceOnTable(bool $solo) {
        for ($i=1; $i<=5; $i++) {
            $bigDie = $this->getBigDiceByColor($i, 1)[0];            
            $this->moveDice([$bigDie], 'table');
        }
        if (!$solo) {
            $blackDie = $this->getSmallBlackDie();
            $this->moveDice([$blackDie], 'table');
        }
    }

    function intRollAndPlaceSmallDice(bool $smallBoard) {
        $smallDice = $this->getSmallDice(true, $smallBoard ? 'decksmall' : 'deck');

        // rolls the 9 small dice
        foreach($smallDice as &$idie) {
            $idie->roll();

            // If the purple die indicates the footprint symbol, it is rerolled
            while (in_array($idie->color, [6, 11]) && $idie->face === 6) {
                $idie->roll();
            }
        }

        $this->moveSmallDiceToMeetingTrack($smallDice, $smallBoard);
    }

    function initMeetingTrackSmallDice(int $playerCount) {
        $this->DbQuery("INSERT INTO meetingtrack (`spot`, `footprints`) VALUES (1, 0), (2, 0), (3, 0), (4, 0), (5, 0)");

        $this->intRollAndPlaceSmallDice(false);

        if ($playerCount >= 5) {
            $this->DbQuery("INSERT INTO meetingtrack (`spot`, `footprints`) VALUES (6, 0), (7, 0)");
            if ($playerCount >= 6) {
                $this->DbQuery("INSERT INTO meetingtrack (`spot`, `footprints`) VALUES (8, 0)");
            }

            $this->intRollAndPlaceSmallDice(true);
        }
    }

    
    function replaceSmallDiceOnMeetingTrack(int $playerId) {
        $playerDice = $this->getDiceByLocation('player', $playerId);
        $smallDice = array_values(array_filter($playerDice, fn($die) => $die->small));

        // If a die indicates a -2 burst of light or a footprint symbol, it must be rerolled until it indicates a color
        foreach($smallDice as &$idie) {
            while ($idie->value > 6 || $idie->value < 0) {
                $idie->roll();
            }
        }

        $this->moveSmallDiceToMeetingTrack($smallDice, $this->getPlayerSmallBoard($playerId));

        $this->notifyAllPlayers('replaceSmallDice', '', [
            'dice' => $smallDice,
        ]);
    }

    private function moveSmallDiceToMeetingTrack(array $smallDice, bool $toSmallBoard) {
        $playerCount = $this->getPlayerCount();

        for ($i=1; $i<=5; $i++) {
            $colorDice = array_values(array_filter($smallDice, fn($idie) => $idie->value === $i));
            if (count($colorDice) > 0) {
                $this->moveDice($colorDice, 'meeting', $toSmallBoard ? $this->SMALL_BOARD_COLOR[$playerCount][$i] : $i);
            }
        }

        $this->persistDice($smallDice);
    }

    private function addFootprintsOnMeetingTrack() {        
        $spotCount = $this->getSpotCount();
        for ($i=1;$i<=$spotCount;$i++) {
            $dice = $this->getDiceByLocation('meeting', $i);
            $dice = array_values(array_filter($dice, fn($die) => $die->color != 11 || !$die->small));
            if (count($dice) === 0) {
                // add footprint if no die on track
                $footprints = 1;
                $this->DbQuery("UPDATE meetingtrack SET `footprints` = `footprints` + $footprints WHERE `spot` = $i");

                $this->notifyAllPlayers('footprintAdded', '', [
                    'spot' => $i,
                    'number' => intval($this->getUniqueValueFromDB("SELECT `footprints` FROM meetingtrack WHERE `spot` = $i")),
                ]);
            }
        }
    }

    function getDieFaceLogName(object $die) {
        return "[die:$die->color:$die->face]";
    }

    function rollPlayerDice(int $playerId, $ids = null, $message = '', $params = []) {
        $dice = $ids === null ? $this->getDiceByLocation('player', $playerId) : $this->getDiceByIds($ids);

        $originalDiceStr = '';
        $rolledDiceStr = '';
        foreach($dice as &$idie) {
            $originalDiceStr .= $this->getDieFaceLogName($idie);
            $idie->roll();
            $rolledDiceStr .= $this->getDieFaceLogName($idie);
        }

        $this->persistDice($dice);

        $this->notifyAllPlayers('diceRolled', $message, [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'dice' => $dice,
            'originalDice' => $originalDiceStr,
            'rolledDice' => $rolledDiceStr,
        ] + $params);
    }

    function sendToCemetery(int $playerId, int $companionId, /*int*/ $dieId = 0) {
        $this->companions->moveCard($companionId, 'cemetery', intval($this->companions->countCardInLocation('cemetery')));

        $companion = $this->getCompanionFromDb($this->companions->getCard($companionId));
        if ($companion->die) {
            $removedDieId = $dieId > 0 ? $dieId : intval($this->getUniqueValueFromDB("SELECT `die_id` FROM companion WHERE `card_id` = $companion->id"));
            
            if ($removedDieId) {
                $this->removeSketalDie($playerId, $companion, $this->getDieById($removedDieId));
            }
        }

        if ($companion->subType == KAAR) {   
            $playersIds = $this->getPlayersIds();
            foreach($playersIds as $pId) {
                $adventurers = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $pId));
                $adventurer = count($adventurers) > 0 ? $adventurers[0] : null;
                // get back the big black die if Kaar is removed
                if ($adventurer->color == 8) {
                    $dbDices = $this->getCollectionFromDB("SELECT * FROM dice WHERE `location` = 'richard' AND `color` = 8 AND `small` = false");
                    $bigBlackDice = array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
                    if (count($bigBlackDice) > 0) {
                        $bigBlackDie = $bigBlackDice[0];
                        $this->moveDice([$bigBlackDie], 'player', $pId);

                        $this->notifyAllPlayers('takeSketalDie', clienttranslate('${player_name} takes back the black die'), [
                            'playerId' => $playerId,
                            'player_name' => $this->getPlayerName($playerId),
                            'die' => $bigBlackDie,
                        ]);
                    }
                }
            }
        }

        if ($playerId > 0) {
            $this->incStat(1, 'discardedCompanions');
            $this->incStat(1, 'discardedCompanions', $playerId);
        }
    }
        
    private function getTopCompanion(string $location) {
        $companionDb = $this->companions->getCardOnTop($location);
        
        if ($companionDb != null) {
            return $this->getCompanionFromDb($companionDb);
        } else {
            return null;
        }
    }
        
    function getTopDeckType() {
        $topDeckCompanion = $this->getTopCompanion('deck');
        return $topDeckCompanion != null ? $topDeckCompanion->type : null;
    }
        
    function getTopCemeteryType() {
        $topDeckCompanion = $this->getTopCompanion('cemetery');
        return $topDeckCompanion != null ? $topDeckCompanion->type : null;
    }
        
    function getTopCemeteryCompanion() {
        return $this->getTopCompanion('cemetery');
    }

    function getRerollScoreCost(int $score) {
        // list of points with reroll, under current score, top first
        $scoreTrackRerolls = array_values(array_reverse(array_filter($this->SCORE_TRACK_REROLLS, fn($p) => $p < $score)));

        $result = [];
        $i = 1;
        foreach($scoreTrackRerolls as $scoreTrackReroll) {
            $result[$i] = $score - $scoreTrackReroll;
            $i++;
        }

        return $result;
    }

    function getRerollUsed(object $companion) {
        return intval($this->getUniqueValueFromDB("SELECT `reroll_used` FROM companion WHERE `card_id` = $companion->id"));
    }

    function getPlayerCompanionRerolls(int $playerId) {
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));

        $rerolls = 0;
        foreach($companions as $companion) {
            if ($companion->reroll > 0) {
                $used = $this->getRerollUsed($companion);
                if ($used < $companion->reroll) {
                    $rerolls += ($companion->reroll - $used);
                }
            }
        }

        return $rerolls;
    }

    public function applyRollDieCost(int $playerId, int $costNumber, array $cost) {
        $costNumberSum = array_reduce($cost, fn($carry, $item) => $carry + $item, 0);
        if ($costNumberSum != $costNumber) {
            throw new BgaUserException('Invalid roll die cost');
        }

        $args = $this->argRollDiceForPlayer($playerId);

        if ($cost[0] > 0) {
            if ($args['rerollCompanion'] < $cost[0]) {
                throw new BgaUserException('Not enough reroll available (companion)');
            }

            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
            $companionsFlagged = 0;
            foreach($companions as $companion) {
                if ($companionsFlagged < $cost[0] && $companion->reroll > 0) {
                    $used = $this->getRerollUsed($companion);
                    if ($used < $companion->reroll) {
                        $diff = min($cost[0] - $companionsFlagged, $companion->reroll - $used);
                        $this->DbQuery("UPDATE companion SET `reroll_used` = `reroll_used` + $diff WHERE card_id = $companion->id");
                        $companionsFlagged += $diff;
                    }
                }
            }
        }

        if ($cost[1] > 0) {
            if ($args['rerollTokens'] < $cost[1]) {
                throw new BgaUserException('Not enough reroll available (token)');
            }

            $this->removePlayerRerolls($playerId, $cost[1]);
        }

        if ($cost[2] > 0) {
            if (count($args['rerollScore']) < $cost[2]) {
                throw new BgaUserException('Not enough reroll available (score)');
            }

            $this->incStat($cost[2], 'scoreBack');
            $this->incStat($cost[2], 'scoreBack', $playerId);

            $this->decPlayerScore($playerId, $args['rerollScore'][$cost[2]]);
        }        
    }

    private function countRepetitionInDiceForEffectCondition(array $diceValues, array $conditions) { // here conditions are always >=1 and <=5
        $unusedValues = $diceValues;
        foreach ($conditions as $condition) {
            $index = array_search($condition, $unusedValues);

            if ($index === false) {
                return 0;
            } else {
                array_splice($unusedValues, $index, 1);
            }
        }
        
        return 1 + $this->countRepetitionInDiceForEffectCondition($unusedValues, $conditions);
    }

    public function getDiceDifferentColors(array $dice) {
        $groups = [];
        foreach ($dice as $playerDie) {
            if ($playerDie->value <= 5) {
                $groups[$playerDie->value] = true;
            }
        }
        $colors = count($groups);
        return $colors;
    }

    public function isTriggeredEffectsForCard(int $playerId, array $dice, object $effect) {
        // we check if we have a forbidden die, preventing the effect
        foreach($effect->conditions as $condition) {
            if ($condition >= -5 && $condition <= -1 && $this->array_some($dice, fn($die) => $die->value == -$condition)) {
                return 0;
            }
        }

        // we check if card needs to remove tokens we don't have
        $allEffectsOnCard = array_merge($effect->conditions, $effect->effects);
        $negativeFootprintsEffects = array_filter($allEffectsOnCard, fn($effect) => $effect < -20 && $effect > -30);
        $negativeFootprints = array_reduce(array_map(fn($effect) => -$effect -20, $negativeFootprintsEffects), fn($a, $b) => $a + $b, 0);
        if ($negativeFootprints > 0 && $this->getPlayerFootprints($playerId) < $negativeFootprints) {
            return false;
        }
        
        $negativeRerollEffects = array_filter($allEffectsOnCard, fn($effect) => $effect < -40 && $effect > -50);
        $negativeRerolls = array_reduce(array_map(fn($effect) => -$effect -40, $negativeRerollEffects), fn($a, $b) => $a + $b, 0);
        if ($negativeRerolls > 0 && $this->getPlayerRerolls($playerId) < $negativeRerolls) {
            return false;
        }

        $negativeTokensEffects = array_filter($allEffectsOnCard, fn($effect) => $effect < -50 && $effect > -60);
        $negativeTokens = array_reduce(array_map(fn($effect) => -$effect -50, $negativeTokensEffects), fn($a, $b) => $a + $b, 0);
        if ($negativeTokens > 0 && count($this->getPlayerTokens($playerId)) < $negativeTokens) {
            return false;
        }

        if ($this->array_every($effect->conditions, fn($condition) => $condition > 200)) { // number of colors
            $colors = $this->getDiceDifferentColors($dice);

            $min = $effect->conditions[0] - 200;
            $max = $effect->conditions[1] - 200;
            
            return $colors >= $min && $colors <= $max ? 1 : 0;
        }

        $diceValues = array_map(fn($die) => $die->value, $dice);
        // we remove forbidden signs, as they have been checked before
        $effectConditions = array_values(array_filter($effect->conditions, fn($condition) => $condition >= 0));
        if (count($effectConditions) === 0) {
            return 1;
        }

        if ($this->array_some($effect->conditions, fn($condition) => $condition == 0)) { // serie of same color
            $count = 0;
            foreach ([1, 2, 3, 4, 5, 22, 103] as $i) {
                $conditions = array_map(fn($condition) => $condition == 0 ? $i : $condition, $effectConditions);
                $count += $this->countRepetitionInDiceForEffectCondition($diceValues, $conditions);
            }
            return $count;
        } else {
            $count = $this->countRepetitionInDiceForEffectCondition($diceValues, $effectConditions);
            if ($this->array_some($effect->conditions, fn($condition) => $condition >= -5 && $condition <= -1)) {
                return min(1, $count);
            } else {
                return $count;
            }
        }
    }

    function getEffectiveDice(int $playerId, $used = null) {
        $dice = $this->getDiceByLocation('player', $playerId, $used);
        $blackDie = $this->array_find($dice, fn($die) => $die->color == 8);
        if ($blackDie != null) { // got black Die
            $dice = array_values(array_filter($dice, fn($die) => $die->value != $blackDie->value));
        }

        $disabledSymbols = $this->getDisabledSymbol($playerId);
        if (count($disabledSymbols) > 0) {
            $dice = array_values(array_filter($dice, fn($die) => !in_array($die->value, $disabledSymbols)));
        }

        return $dice;
    }

    private function mustSelectDiscardDie(int $playerId, object $companion) {
        if ($companion->die) {
            $dieId = intval($this->getUniqueValueFromDB("SELECT `die_id` FROM companion WHERE `card_id` = $companion->id"));
            
            if ($dieId) {
                $die = $this->getDieById($dieId);
                $dieColor = $die->color;
                $bigDice = $this->getPlayerBigDiceByColor($playerId, $dieColor);
                return count($bigDice) > 1 ? $bigDice : null;
            }
        }
        return null;
    }

    public function getTriggeredEffectsForPlayer(int $playerId) {
        $effectsCodes = [];
        $dice = $this->getEffectiveDice($playerId, false);

        $adventurer = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId))[0];
        if ($adventurer->effect != null) {
            $count = $this->isTriggeredEffectsForCard($playerId, $dice, $adventurer->effect);
            for ($i=0; $i<$count; $i++) {
                $effectsCodes[] = [0, $adventurer->id, null];
            }
        }

        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
        foreach($companions as $companion) {
            if ($companion->effect != null) {
                $count = $this->isTriggeredEffectsForCard($playerId, $dice, $companion->effect);
                $discardDieSelection = $this->mustSelectDiscardDie($playerId, $companion);
                $exchangeToken = count(array_filter($companion->effect->effects, fn($effect) => $effect == 50)) > 0;
                $removeToken = count(array_filter($companion->effect->effects, fn($effect) => $effect < -50 && $effect > -60)) > 0;

                for ($i=0; $i<$count; $i++) {
                    $effectsCodes[] = [1, $companion->id, $discardDieSelection ?? ($exchangeToken ? 'exchangeToken' : ($removeToken ? 'removeToken' : null))];
                    //$effectsCodes[] = [1, $companion->id, $discardDieSelection ? 'discard' : ($exchangeToken ? 'exchangeToken' : ($removeToken ? 'removeToken' : null))];
                }
            }
        }

        $spells = $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId));
        foreach($spells as $spell) {
            if ($spell->visible && $this->isTriggeredEffectsForCard($playerId, $dice, $spell->effect)) {
                $effectsCodes[] = [2, $spell->id, null];
            }
        }

        return $effectsCodes;
    }

    public function getRemainingEffects(int $playerId) {
        $allEffects = $this->getTriggeredEffectsForPlayer($playerId);
        $appliedEffects = [];
        $json_obj = $this->getUniqueValueFromDB("SELECT `applied_effects` FROM `player` WHERE `player_id` = $playerId");
        if ($json_obj) {
            $appliedEffects = json_decode($json_obj, true);
        }

        $remainingEffects = $allEffects;
        foreach($appliedEffects as $effect) {
            $index = $this->array_findIndex($remainingEffects, fn($remainingEffect) => $remainingEffect[0] == $effect[0] && $remainingEffect[1] == $effect[1]);
            unset($remainingEffects[$index]); 
            $remainingEffects = array_values($remainingEffects);
        }

        return $remainingEffects;
    }


    function saveAppliedEffect(int $playerId, array $effectCode) {
        $appliedEffects = [];
        $json_obj = $this->getUniqueValueFromDB("SELECT `applied_effects` FROM `player` WHERE `player_id` = $playerId");
        if ($json_obj) {
            $appliedEffects = json_decode($json_obj, true);
        }
        $appliedEffects[] = $effectCode;
        $jsonObj = json_encode($appliedEffects);
        $this->DbQuery("UPDATE `player` SET `applied_effects` = '$jsonObj' WHERE `player_id` = $playerId");
    }

    // card type
    // 0 adventurer
    // 1 companion
    // 2 spell
    // 3 dice
    // 4 route
    function applyEffect(int $playerId, int $effect, int $cardType, /*object|null*/ $card = null, /*int*/ $dieId = 0, /*int*/ $tokenId = 0) {

        $args = [];
        switch ($cardType) {
            case 0: 
                $effectOrigin = 'adventurer';
                $args['adventurer'] = $card;
                $args['preserve'] = ['adventurer'];
                break;
            case 1:
                $effectOrigin = 'companion';
                $args['companion'] = $card;
                $args['preserve'] = ['companion'];
                break;
            case 2:
                $effectOrigin = _('spell');
                break;
            case 3:
                $effectOrigin = _('rolled die');
                break;
            case 4:
                $effectOrigin = _('route');
                break;
            case 5:
                $effectOrigin = _('token');
                break;
        }
        $args['effectOrigin'] = $effectOrigin;

        if ($effect > 100 && $effect < 200) {
            $this->incPlayerScore($playerId, $effect - 100, clienttranslate('${player_name} ${gainsloses} ${abspoints} burst of light with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('gains'), 'i18n' => ['gainsloses']]);
        } else if ($effect < -100 && $effect > -200) {
            $this->decPlayerScore($playerId, -($effect + 100), clienttranslate('${player_name} ${gainsloses} ${abspoints} burst of light with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('loses'), 'i18n' => ['gainsloses']]);
        }

        else if ($effect > 20 && $effect < 30) {
            $this->addPlayerFootprints($playerId, $effect - 20, clienttranslate('${player_name} ${gainsloses} ${absfootprints} footprints with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('gains'), 'i18n' => ['gainsloses']]);
        } else if ($effect < -20 && $effect > -30) {
            $this->removePlayerFootprints($playerId, -($effect + 20), clienttranslate('${player_name} ${gainsloses} ${absfootprints} footprints with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('loses'), 'i18n' => ['gainsloses']]);
        }

        else if ($effect > 10 && $effect < 20) {
            $this->addPlayerFireflies($playerId, $effect - 10, clienttranslate('${player_name} gains ${fireflies} fireflies with ${effectOrigin} effect'), $args);
        }

        else if ($effect > 40 && $effect < 50) {
            $this->addPlayerRerolls($playerId, $effect - 40, clienttranslate('${player_name} ${gainsloses} ${absrerolls} rerolls with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('gains'), 'i18n' => ['gainsloses']]);
        } else if ($effect < -40 && $effect > -50) {
            $this->removePlayerRerolls($playerId, -($effect + 40), clienttranslate('${player_name} ${gainsloses} ${absrerolls} rerolls with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('loses'), 'i18n' => ['gainsloses']]);
        }

        if ($effect == 50) {
            //$this->addPlayerTokens($playerId, 1, clienttranslate('${player_name} ${gainsloses} ${abstokens} tokens with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('loses'), 'i18n' => ['gainsloses']]);
            $this->removePlayerToken($playerId, $tokenId, clienttranslate('${player_name} lose 1 token with ${effectOrigin} effect'), $args);
        } else if ($effect > 50 && $effect < 60) {
            $this->addPlayerTokens($playerId, $effect - 50, clienttranslate('${player_name} ${gainsloses} ${abstokens} tokens with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('gains'), 'i18n' => ['gainsloses']]);
        } else if ($effect < -50 && $effect > -60) {
            $this->removePlayerToken($playerId, $tokenId, clienttranslate('${player_name} lose 1 token with ${effectOrigin} effect'), $args);
        }

        else if ($effect === 33) { // skull
            $this->sendToCemetery($playerId, $card->id, $dieId);

            $companion = $this->getCompanionFromDb($this->companions->getCard($card->id));

            $this->notifyAllPlayers('removeCompanion', '', [
                'playerId' => $playerId,
                'companion' => $companion,
            ]);
        } else if ($effect === 36) { // spell
            $playersIds = $this->getPlayersIds();
            $this->giveSpellToPlayers($playerId, array_values(array_filter($playersIds, fn($pId) => $pId != $playerId)));
        }
    }

    function applyCardEffect(int $playerId, int $cardType, int $id, $dieId = 0, $tokenId = 0) {

        $card = null;
        $cardEffect = null;
        $spellCard = null;
        switch ($cardType) {
            case 0:
                $adventurer = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId))[0];
                if ($adventurer->id == $id) {
                    $card = $adventurer;
                    $cardEffect = $adventurer->effect;
                }
                break;
            case 1:
                $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
                foreach($companions as $companion) {
                    if ($companion->id == $id) {
                        $card = $companion;
                        $cardEffect = $companion->effect;
                    }
                }
                break;
            case 2:
                $spells = $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId));
                foreach($spells as $spell) {
                    if ($spell->id == $id) {
                        $card = $spell;
                        $cardEffect = $spell->effect;
                        $spellCard = $spell;
                    }
                }
                break;
        }

        if ($cardEffect === null) {
            throw new BgaUserException("Selected effect is not available");
        }

        switch ($cardType) {
            case 0:
                $this->notifyAllPlayers('resolveCardLog', clienttranslate('${player_name} resolves adventurer ${adventurerName} effects'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'adventurer' => $card,
                    'adventurerName' => $card->name,
                ]);
                break;
            case 1:
                $this->notifyAllPlayers('resolveCardLog', clienttranslate('${player_name} resolves companion ${companionName} effects'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companionName' => $card->name,
                ]);
                break;
            case 2:
                $this->notifyAllPlayers('resolveCardLog', clienttranslate('${player_name} resolves spell effects'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                ]);
                break;
        }

        foreach($cardEffect->effects as $effect) {
            if ($spellCard != null && $spellCard->type == COMPANION_SPELL) {
                $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
                if (count($companions) > 0) {
                    $lastCompanion = $companions[count($companions) - 1];
                    $this->sendToCemetery($playerId, $lastCompanion->id);

                    $this->notifyAllPlayers('removeCompanion', '', [
                        'playerId' => $playerId,
                        'companion' => $lastCompanion,
                        'removedBySpell' => $spellCard,
                    ]);

                    $this->spells->moveCard($spell->id, 'discard');
                }
            } else {
                $this->applyEffect($playerId, $effect, $cardType, $card, $dieId, $tokenId);
            }
        }

        if ($cardType == 2 && $spellCard->type != COMPANION_SPELL) { // spells are discarded after usage
            $this->discardSpell($playerId, $spellCard);
        }
        

        $this->saveAppliedEffect($playerId, [$cardType, $id]);
    }

    public function takeSketalDie(int $playerId, object $die) {
        $this->moveDice([$die], 'player', $playerId);

        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
        
        $companion = $companions[count($companions) - 1];
        
        $this->DbQuery("UPDATE `companion` SET `die_id` = $die->id WHERE `card_id` = $companion->id");

        $this->notifyAllPlayers('takeSketalDie', clienttranslate('${player_name} takes ${companionName} die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
            'companionName' => $companion->name,
        ]);
    }
    

    public function removeSketalDie(int $playerId, object $companion, object $die) {
        $this->moveDice([$die], 'table');

        $this->DbQuery("UPDATE `companion` SET `die_id` = null WHERE `die_id` = $die->id");

        $this->notifyAllPlayers('removeSketalDie', clienttranslate('${player_name} loses ${companionName} die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
            'companionName' => $companion->name,
        ]);
    }

    private function giveSpellToPlayers(int $originPlayerId, array $playersIds) {
        $spellsIds = [];

        foreach($playersIds as $playerId) {
            $spellsIds[$playerId] = $this->getSpellFromDb($this->spells->pickCardForLocation('deck', 'player', $playerId))->id;
        }

        $this->notifyAllPlayers('giveHiddenSpells', clienttranslate('${player_name} gives spell token to ${player_name2} with ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($originPlayerId),
            'player_name2' => $this->getPlayerName($playerId),
            'companionName' => $this->COMPANIONS[XARGOK]->name,
            'spellsIds' => $spellsIds,
        ]);
    }

    public function revealSpellTokens() {
        $allSpells = $this->getSpellsFromDb($this->spells->getCardsInLocation('player'));
        $spells = [];
        foreach ($allSpells as &$spell) {
            if (!$spell->visible) {
                $this->DbQuery("UPDATE `spells` SET `card_type_arg` = 1 WHERE `card_id` = $spell->id");
                $spell->visible = true;
                $spells[] = $spell;
            }
        }

        if (count($spells) > 0) {
            $this->notifyAllPlayers('revealSpells', clienttranslate('Hidden spells are revealed !'), [
                'spells' => $spells,
            ]);
        }
    }

    public function discardSpell(int $playerId, object $spell) {
        $this->spells->moveCard($spell->id, 'discard');

        $this->notifyAllPlayers('removeSpell', '', [
            'playerId' => $playerId,
            'spell' => $spell,
        ]);
    }

    public function canChooseSketalDie() {
        $dice = $this->getAvailableBigDice();

        return count($dice) > 0;
    }

    private function isBigDieAvailable(int $dieColor) {
        $dice = $this->getAvailableBigDice();
        if ($dieColor == 0) {
            return count($dice) > 0;
        } else {
            return count(array_filter($dice, fn($die) => $die->color == $dieColor)) > 0;
        }
    }

    public function setRandomAdventurers(array $playersIds) {
        $soloMode = $this->isSoloMode();

        $possibleAdventurers = array_keys($this->ADVENTURERS);
        $affectedAdventurers = [];

        foreach ($playersIds as $playerId) {

            $adventurer = $possibleAdventurers[bga_rand(1, count($possibleAdventurers)) - 1];
            while (in_array($adventurer, $affectedAdventurers)) {
                $adventurer = $possibleAdventurers[bga_rand(1, count($possibleAdventurers)) - 1];
            }
            $affectedAdventurers[] = $adventurer;

            $this->applyChooseAdventurer($playerId, $adventurer, $soloMode);
        }

        if ($soloMode) {
            $this->gamestate->nextState('chooseTomDice');
        } else {
            $this->gamestate->nextState('recruit');
        }
    }

    public function spotHasUriomDice(int $spot) {
        $spotDice = $this->getDiceByLocation('meeting', $spot);

        return $this->array_some($spotDice, fn($die) => $die->color == 11 && $die->small);
    }

    public function getPlayerWithUriom() {
        return intval($this->getUniqueValueFromDB("SELECT card_location_arg FROM adventurer where `card_location` = 'player' AND `card_type` = 11"));
    }

    public function uriomHasRecruited(int $playerId) {
        $playerWithUriom = $this->getPlayerWithUriom();
        // ignore this check if no Uriom, or if the active player is the one with Uriom
        if ($playerWithUriom == 0 || $playerWithUriom == $playerId) {
            return true;
        }
        return intval($this->getUniqueValueFromDB("SELECT player_recruit_day FROM player where player_id = $playerWithUriom")) == intval($this->getGameStateValue(DAY));
    }

    public function getExpansionCompanions(int $playerCount) {
        $addedCompanions = [];
        $removedCompanions = [];

        $activatedModules = [];
        $removedModules = [];

        if ($playerCount === 1) {
            foreach ([1, 3] as $moduleNumber) {
                if (intval($this->getGameStateValue(OPTION_EXPANSION + $moduleNumber)) >= 2) {
                    $this->setGameStateValue(OPTION_EXPANSION + $moduleNumber, 1);

                    $this->notifyAllPlayers('log', clienttranslate('The expansion module ${number} have been disabled (not available in solo mode)'), [
                        'number' => $moduleNumber,
                    ]);
                }
            }
        }

        foreach ([1, 2, 3] as $moduleNumber) {
            if (intval($this->getGameStateValue(OPTION_EXPANSION + $moduleNumber)) >= 2) {
                $activatedModules[] = $moduleNumber;
            }
        }

        $minSets = 0;
        if ($playerCount < 5) {
            $removedModules = $activatedModules;
        } else {
            $minSets = $playerCount - 3;
            while (count($activatedModules) < $minSets) {
                $unactivatedModule = array_values(array_filter([1, 2, 3], fn($m) => !in_array($m, $activatedModules)));
                $moduleNumber = $unactivatedModule[bga_rand(0, count($unactivatedModule) -1)];
                $activatedModules[] = $moduleNumber;
                $this->setGameStateValue(OPTION_EXPANSION + $moduleNumber, 2);

                $this->notifyAllPlayers('log', clienttranslate('Expansion cards from expansion module ${number} have been added to the deck'), [
                    'number' => $moduleNumber,
                ]);
            }

            if ($playerCount == 5 && count($activatedModules) == 3) {
                $moduleNumber = bga_rand(1, 3);
                $removedModules[] = $moduleNumber;
                
                $this->notifyAllPlayers('log', clienttranslate('Replaced cards from expansion module ${number} are removed from the deck'), [
                    'number' => $moduleNumber,
                ]);
            }
        }

        foreach ($activatedModules as $moduleNumber) {
            $addedCompanions = $addedCompanions + $this->COMPANIONS_EXPANSION1_SETS[$moduleNumber]['adds'];
        }

        foreach ($removedModules as $moduleNumber) {
            $removedCompanions = array_merge($removedCompanions, $this->COMPANIONS_EXPANSION1_SETS[$moduleNumber]['removes']);
        }

        return [$addedCompanions, $removedCompanions];
    }

    function getPlayerTokens(int $playerId, bool $colorOnly = false) {
        $tokens = $this->getTokensFromDb($this->tokens->getCardsInLocation('player', $playerId));
        if ($colorOnly) {
            $tokens = array_values(array_filter($tokens, fn($token) => $token->type == 1));
        }
        return $tokens;
    }

    function addPlayerTokens(int $playerId, int $inc, $message = '', $params = []) {
        $tokens = $this->getTokensFromDb($this->tokens->pickCardsForLocation($inc, 'bag', 'player', $playerId));

        $this->notifyAllPlayers('getTokens', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'tokens' => $tokens,
            'abstokens' => count($tokens),
        ]);

        foreach ($tokens as $token) {
            if ($token->type == 2) {
                $effect = $token->typeArg;
                $this->applyEffect($playerId, $effect, 5);
                $this->tokens->moveCard($token->id, 'front');
            }
        }
    }

    function removePlayerToken(int $playerId, int $tokenId, $message = '', $params = []) {
        $this->tokens->moveCard($tokenId, 'front');

        $this->notifyAllPlayers('removeToken', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'tokenId' => $tokenId,
        ]);
    }

    function getMartyPosition() {
        $val = intval($this->getGameStateValue(MARTY_POSITION));
        return $val === -1 ? null : $val;
    }

    function setPlayerMarty(int $playerId) {
        $martyPosition = $this->getPlayerScore($playerId) - 10;
        $this->setGameStateValue(MARTY_POSITION, $martyPosition);

        $this->notifyAllPlayers('placeMartyToken', clienttranslate('${player_name} places Marty token on position ${martyPosition}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'martyPosition' => $martyPosition, // for logs
            'position' => $martyPosition,
        ]);

        $this->DbQuery("UPDATE player SET player_score = 10 WHERE player_id = $playerId");

        $this->notifyAllPlayers('points', clienttranslate('${player_name} goes back to 10 bursts of light with Marty power'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'newScore' => 10,
        ]);
    }

    function getSelectedCompanion(int $playerId) {
        return intval($this->getUniqueValueFromDB("SELECT player_selected_companion FROM player where `player_id` = $playerId"));
    }

    function setSelectedCompanion(int $playerId, /*int|null*/ $companionId) {
        $this->DbQuery("UPDATE player SET player_selected_companion = ".($companionId !== null ? $companionId : 'NULL')." WHERE player_id = $playerId");
    }

    function getDisabledSymbol(int $playerId) {
        return json_decode($this->getUniqueValueFromDB("SELECT player_disabled_symbols FROM player where `player_id` = $playerId") ?? '[]');
    }

    function addDisabledSymbol(int $playerId, int $symbol) {
        $symbols = $this->getDisabledSymbol($playerId);
        if (!in_array($symbol, $symbols)) {
            $symbols[] = $symbol;
            $this->DbQuery("UPDATE player SET player_disabled_symbols = '".json_encode($symbols)."' WHERE player_id = $playerId");
        }
    }
}
