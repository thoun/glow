<?php

require_once(__DIR__.'/objects/effect.php');
require_once(__DIR__.'/objects/adventurer.php');
require_once(__DIR__.'/objects/companion.php');
require_once(__DIR__.'/objects/spell.php');
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

    function isTurnBased() {
        return intval($this->gamestate->table_globals[200]) >= 10;
    }

    function autoSkipImpossibleActions() {
        return $this->isTurnBased();
    }

    function getFirstPlayerId() {
        return intval(self::getGameStateValue(FIRST_PLAYER));
    }

    function getPlayersIds() {
        return array_keys($this->loadPlayersBasicInfos());
    }

    function getDaySql() {
        return "select global_value from global where global_id = 10"; // 10 = DAY global id
    }

    function getSide() {
        return intval(self::getGameStateValue(BOARD_SIDE));
    }

    function createDice(bool $solo) {
        $sql = "INSERT INTO dice (`color`, `small`, `die_face`) VALUES ";
        $values = [];
        foreach($this->DICES as $color => $counts) {
            if ($solo && $color == 8) {
                continue;
            }

            $face = min($color, 6);

            // big
            for ($i=0; $i<$counts[0]; $i++) {
                $values[] = "($color, false, $face)";
            }

            // small
            for ($i=0; $i<$counts[1]; $i++) {
                $values[] = "($color, true, $face)";
            }
        }

        $sql .= implode(',', $values);
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
        return array_map(fn($dbObject) => $this->getAdventurerFromDb($dbObject), array_values($dbObjects));
    }

    function getCompanionFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Companion doesn't exists ".json_encode($dbObject));
        }
        return new Companion($dbObject, $this->COMPANIONS);
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
    
    function getSmallDice(bool $ignoreBlack) {
        $sql = "SELECT * FROM dice WHERE `small` = true ";
        if ($ignoreBlack) {
            $sql .= " AND `color` <> 8";
        } 
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }
    
    function getBigDiceByColor(int $color, int $limit) {
        $sql = "SELECT * FROM dice WHERE `location` = 'deck' AND `color` = $color AND `small` = false LIMIT $limit";
        $dbDices = self::getCollectionFromDB($sql);
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
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function getDiceByIds(array $ids) {
        if (count($ids) === 0) {
            return [];
        }

        $sql = "SELECT * FROM dice WHERE `die_id` IN (".implode(',', $ids).")";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function getDieById(int $id) {
        $sql = "SELECT * FROM dice WHERE `die_id` = $id";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices))[0];
    }
    
    function getAvailableBigDice() {
        $sql = "SELECT * FROM dice WHERE `location` = 'table' AND `small` = false";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function getBlackDie() {
        $sql = "SELECT * FROM dice WHERE `color` = 8";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices))[0];
    }
    
    function getPlayerBigDiceByColor(int $playerId, int $dieColor) {
        $sql = "SELECT * FROM dice WHERE `location` = 'player' AND `location_arg` = $playerId AND `color` = $dieColor AND `small` = false";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(fn($dbDice) => new Dice($dbDice), array_values($dbDices));
    }

    function moveDice(array $dice, string $location, int $locationArg = 0) {
        $ids = array_map(fn($idie) => $idie->id, $dice);
        self::DbQuery("UPDATE dice SET `location` = '$location', `location_arg` = $locationArg WHERE `die_id` IN (".implode(',', $ids).")");
        foreach($dice as &$die) {
            $die->location = $location;
            $die->location_arg = $locationArg;
        }
    }

    function getPlayerCount() {
        return intval(self::getUniqueValueFromDB("SELECT count(*) FROM player"));
    }

    function getPlayerName(int $playerId) {
        if ($playerId == 0) {
            return 'Tom';
        } else {
            return self::getUniqueValueFromDb("SELECT player_name FROM player WHERE player_id = $playerId");
        }
    }

    function getPlayerScore(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $incScore, $message = '', $params = []) {
        if ($playerId == 0) {
            $this->incTomScore($incScore, $message, $params);
            return;
        }
        
        self::DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");
        

        self::notifyAllPlayers('points', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'points' => $incScore,
            'abspoints' => $incScore,
            'newScore' => $this->getPlayerScore($playerId),
        ]);
    }

    function decPlayerScore(int $playerId, int $decScore, $message = '', $params = []) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        self::DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");

        self::notifyAllPlayers('points', $message, $params + [
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

        return intval(self::getUniqueValueFromDB("SELECT `player_rerolls` FROM player where `player_id` = $playerId"));
    }

    function addPlayerRerolls(int $playerId, int $rerolls, $message = '', $params = []) {
        self::DbQuery("UPDATE player SET `player_rerolls` = `player_rerolls` + $rerolls WHERE `player_id` = $playerId");

        self::notifyAllPlayers('rerolls', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'rerolls' => $rerolls,
        ]);
    }

    function removePlayerRerolls(int $playerId, int $dec, $message = '', $params = []) {
        $newValue = max(0, $this->getPlayerRerolls($playerId) - $dec);
        self::DbQuery("UPDATE player SET `player_rerolls` = $newValue WHERE player_id = $playerId");

        self::notifyAllPlayers('rerolls', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'rerolls' => -$dec,
        ]);

        return $newValue;
    }

    function getPlayerFootprints(int $playerId) {
        if ($playerId == 0) {
            return $this->getTomFootprints();
        }

        return intval(self::getUniqueValueFromDB("SELECT `player_footprints` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFootprints(int $playerId, int $footprints, $message = '', $params = []) {
        if ($playerId == 0) {
            $this->addTomFootprints($footprints);
        } else {
            self::DbQuery("UPDATE player SET `player_footprints` = `player_footprints` + $footprints WHERE `player_id` = $playerId");
        }

        self::notifyAllPlayers('footprints', $message, $params + [
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
            self::DbQuery("UPDATE player SET `player_footprints` = $newValue WHERE player_id = $playerId");
        }

        self::notifyAllPlayers('footprints', $message, $params + [
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

        return intval(self::getUniqueValueFromDB("SELECT `player_fireflies` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFireflies(int $playerId, int $fireflies, $message = '', $params = []) {
        self::DbQuery("UPDATE player SET `player_fireflies` = `player_fireflies` + $fireflies WHERE `player_id` = $playerId");

        self::notifyAllPlayers('fireflies', $message, $params + [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'fireflies' => $fireflies,
        ]);
    }

    function createAdventurers() {        
        foreach($this->ADVENTURERS as $type => $adventurer) {
            $adventurers[] = [ 'type' => $type, 'type_arg' => null, 'nbr' => 1];
        }
        $this->adventurers->createCards($adventurers, 'deck');
    }

    function createCompanions(bool $solo) {
        $companions = [];
        $companionsB = [];
        foreach($this->COMPANIONS as $subType => $companion) {
            if ($solo && in_array($subType, $this->REMOVED_COMPANION_FOR_SOLO)) {
                continue;
            }
            $card = [ 'type' => $subType > 23 ? 2 : 1, 'type_arg' => $subType, 'nbr' => 1];
            if ($solo && $subType > 23) {
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
                $this->companions->moveCards(array_map(fn($companion) => $companion->id, $removed), 'discard');

            }
            // set face 1 (A) before face 2 (B)
            self::DbQuery("UPDATE companion SET `card_location_arg` = `card_location_arg` + (100 * (2 - `card_type`)) WHERE `card_location` = 'deck' ");
        }
    }

    function createSpells() {
        foreach($this->SPELLS as $type => $spellCard) {
            $spells[] = [ 'type' => $type, 'type_arg' => 0, 'nbr' => $spellCard->number];
        }
        $this->spells->createCards($spells, 'deck');
        $this->spells->shuffle('deck');
    }

    function createSoloTiles() {
        foreach($this->SOLO_TILES as $type => $tile) {
            $soloTiles[] = [ 'type' => $type, 'type_arg' => 0, 'nbr' => 1];
        }
        $this->soloTiles->createCards($soloTiles, 'deck');
        $this->soloTiles->shuffle('deck');
    }

    function getMeetingTrackFootprints(int $spot) {
        return intval(self::getUniqueValueFromDB("SELECT `footprints` FROM meetingtrack WHERE `spot` = $spot"));
    }

    function removeMeetingTrackFootprints(int $spot) {
        self::DbQuery("UPDATE meetingtrack SET `footprints` = 0 WHERE `spot` = $spot");

        self::notifyAllPlayers('footprintAdded', '', [
            'spot' => $spot,
            'number' => 0,
        ]);
    }

    function placeCompanionsOnMeetingTrack() {        
        $solo = $this->isSoloMode();

        for ($i=1;$i<=5;$i++) {
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
            $blackDie = $this->getBlackDie();
            $this->moveDice([$blackDie], 'table');
        }
    }

    function initMeetingTrackSmallDice() {
        self::DbQuery("INSERT INTO meetingtrack (`spot`, `footprints`) VALUES (1, 0), (2, 0), (3, 0), (4, 0), (5, 0)");

        $smallDice = $this->getSmallDice(true);

        // rolls the 9 small dice
        foreach($smallDice as &$idie) {
            $idie->roll();

            // If the purple die indicates the footprint symbol, it is rerolled
            while ($idie->color === 6 && $idie->face === 6) {
                $idie->roll();
            }
        }

        $this->moveSmallDiceToMeetingTrack($smallDice);
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

        $this->moveSmallDiceToMeetingTrack($smallDice);

        self::notifyAllPlayers('replaceSmallDice', '', [
            'dice' => $smallDice,
        ]);
    }

    private function moveSmallDiceToMeetingTrack(array $smallDice) {
        for ($i=1; $i<=5; $i++) {
            $colorDice = array_values(array_filter($smallDice, fn($idie) => $idie->value === $i));
            if (count($colorDice) > 0) {
                $this->moveDice($colorDice, 'meeting', $i);
            }
        }

        $this->persistDice($smallDice);
    }

    private function addFootprintsOnMeetingTrack() {
        for ($i=1; $i<=5; $i++) {
            $dice = $this->getDiceByLocation('meeting', $i);
            if (count($dice) === 0) {
                // add footprint if no die on track
                $footprints = 1;
                self::DbQuery("UPDATE meetingtrack SET `footprints` = `footprints` + $footprints WHERE `spot` = $i");

                self::notifyAllPlayers('footprintAdded', '', [
                    'spot' => $i,
                    'number' => intval(self::getUniqueValueFromDB("SELECT `footprints` FROM meetingtrack WHERE `spot` = $i")),
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

        self::notifyAllPlayers('diceRolled', $message, [
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
            $removedDieId = $dieId > 0 ? $dieId : intval(self::getUniqueValueFromDB("SELECT `die_id` FROM companion WHERE `card_id` = $companion->id"));
            
            if ($removedDieId) {
                $this->removeSketalDie($playerId, $companion, $this->getDieById($removedDieId));
            }
        }

        if ($playerId > 0) {
            self::incStat(1, 'discardedCompanions');
            self::incStat(1, 'discardedCompanions', $playerId);
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
        return boolval(self::getUniqueValueFromDB("SELECT `reroll_used` FROM companion WHERE `card_id` = $companion->id"));
    }

    function getPlayerCompanionRerolls(int $playerId) {
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));

        $rerolls = 0;
        foreach($companions as $companion) {
            if ($companion->reroll && !$this->getRerollUsed($companion)) {
                $rerolls++;
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
                if ($companionsFlagged < $cost[0] && $companion->reroll && !$this->getRerollUsed($companion)) {
                    self::DbQuery("UPDATE companion SET `reroll_used` = true WHERE card_id = $companion->id");
                    $companionsFlagged++;
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

            self::incStat($cost[2], 'scoreBack');
            self::incStat($cost[2], 'scoreBack', $playerId);

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

    public function isTriggeredEffectsForCard(array $dice, object $effect) {
        // we check if we have a forbidden die, preventing the effect
        foreach($effect->conditions as $condition) {
            if ($condition >= -5 && $condition <= -1 && $this->array_some($dice, fn($die) => $die->value == -$condition)) {
                return 0;
            }
        }

        $diceValues = array_map(fn($die) => $die->value, $dice);
        // we remove forbidden signs, as they have been checked before
        $effectConditions = array_values(array_filter($effect->conditions, fn ($condition) => $condition >= 0));
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
            return array_values(array_filter($dice, fn($die) => $die->value != $blackDie->value));
        } else {
            return $dice;
        }
    }

    private function mustSelectDiscardDie(int $playerId, object $companion) {
        if ($companion->die) {
            $dieId = intval(self::getUniqueValueFromDB("SELECT `die_id` FROM companion WHERE `card_id` = $companion->id"));
            
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
            $count = $this->isTriggeredEffectsForCard($dice, $adventurer->effect);
            for ($i=0; $i<$count; $i++) {
                $effectsCodes[] = [0, $adventurer->id, null];
            }
        }

        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
        foreach($companions as $companion) {
            if ($companion->effect != null) {
                $count = $this->isTriggeredEffectsForCard($dice, $companion->effect);
                $discardDieSelection = $this->mustSelectDiscardDie($playerId, $companion);
                for ($i=0; $i<$count; $i++) {
                    $effectsCodes[] = [1, $companion->id, $discardDieSelection];
                }
            }
        }

        $spells = $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId));
        foreach($spells as $spell) {
            if ($spell->visible && $this->isTriggeredEffectsForCard($dice, $spell->effect)) {
                $effectsCodes[] = [2, $spell->id, null];
            }
        }

        return $effectsCodes;
    }

    public function getRemainingEffects(int $playerId) {
        $allEffects = $this->getTriggeredEffectsForPlayer($playerId);
        $appliedEffects = [];
        $json_obj = self::getUniqueValueFromDB("SELECT `applied_effects` FROM `player` WHERE `player_id` = $playerId");
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
        $json_obj = self::getUniqueValueFromDB("SELECT `applied_effects` FROM `player` WHERE `player_id` = $playerId");
        if ($json_obj) {
            $appliedEffects = json_decode($json_obj, true);
        }
        $appliedEffects[] = $effectCode;
        $jsonObj = json_encode($appliedEffects);
        self::DbQuery("UPDATE `player` SET `applied_effects` = '$jsonObj' WHERE `player_id` = $playerId");
    }

    // card type
    // 0 adventurer
    // 1 companion
    // 2 spell
    // 3 dice
    // 4 route
    function applyEffect(int $playerId, int $effect, int $cardType, /*object|null*/ $card, /*int*/ $dieId = 0) {

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
        }
        $args['effectOrigin'] = $effectOrigin;

        if ($effect > 100) {
            $this->incPlayerScore($playerId, $effect - 100, clienttranslate('${player_name} ${gainsloses} ${abspoints} burst of light with ${effectOrigin} effect'), $args + ['gainsloses' => clienttranslate('gains'), 'i18n' => ['gainsloses']]);
        } else if ($effect < -100) {
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

        else if ($effect === 30) {
            $this->addPlayerRerolls($playerId, 1, clienttranslate('${player_name} gains ${rerolls} rerolls with ${effectOrigin} effect'), $args);
        }

        else if ($effect === 33) { // skull
            $this->sendToCemetery($playerId, $card->id, $dieId);

            $companion = $this->getCompanionFromDb($this->companions->getCard($card->id));

            self::notifyAllPlayers('removeCompanion', '', [
                'playerId' => $playerId,
                'companion' => $companion,
            ]);
        } else if ($effect === 36) { // spell
            $playersIds = $this->getPlayersIds();
            $this->giveSpellToPlayers($playerId, array_values(array_filter($playersIds, fn($pId) => $pId != $playerId)));
        }
    }

    function applyCardEffect(int $playerId, int $cardType, int $id, $dieId = 0) {

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
                self::notifyAllPlayers('resolveCardLog', clienttranslate('${player_name} resolves adventurer ${adventurerName} effects'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'adventurer' => $card,
                    'adventurerName' => $card->name,
                ]);
                break;
            case 1:
                self::notifyAllPlayers('resolveCardLog', clienttranslate('${player_name} resolves companion ${companionName} effects'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companionName' => $card->name,
                ]);
                break;
            case 2:
                self::notifyAllPlayers('resolveCardLog', clienttranslate('${player_name} resolves spell effects'), [
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

                    self::notifyAllPlayers('removeCompanion', '', [
                        'playerId' => $playerId,
                        'companion' => $lastCompanion,
                        'removedBySpell' => $spellCard,
                    ]);

                    $this->spells->moveCard($spell->id, 'discard');
                }
            } else {
                $this->applyEffect($playerId, $effect, $cardType, $card, $dieId);
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
        
        self::DbQuery("UPDATE `companion` SET `die_id` = $die->id WHERE `card_id` = $companion->id");

        self::notifyAllPlayers('takeSketalDie', clienttranslate('${player_name} takes ${companionName} die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
            'companionName' => $companion->name,
        ]);
    }
    

    public function removeSketalDie(int $playerId, object $companion, object $die) {
        $this->moveDice([$die], 'table');

        self::DbQuery("UPDATE `companion` SET `die_id` = null WHERE `die_id` = $die->id");

        self::notifyAllPlayers('removeSketalDie', clienttranslate('${player_name} loses ${companionName} die'), [
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

        self::notifyAllPlayers('giveHiddenSpells', clienttranslate('${player_name} gives spell token to ${player_name2} with ${companionName}'), [
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
                self::DbQuery("UPDATE `spells` SET `card_type_arg` = 1 WHERE `card_id` = $spell->id");
                $spell->visible = true;
                $spells[] = $spell;
            }
        }

        if (count($spells) > 0) {
            self::notifyAllPlayers('revealSpells', clienttranslate('Hidden spells are revealed !'), [
                'spells' => $spells,
            ]);
        }
    }

    public function discardSpell(int $playerId, object $spell) {
        $this->spells->moveCard($spell->id, 'discard');

        self::notifyAllPlayers('removeSpell', '', [
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
}
