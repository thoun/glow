<?php

require_once(__DIR__.'/objects/effect.php');
require_once(__DIR__.'/objects/adventurer.php');
require_once(__DIR__.'/objects/companion.php');
require_once(__DIR__.'/objects/dice.php');
require_once(__DIR__.'/objects/meeple.php');
require_once(__DIR__.'/objects/meeting-track-spot.php');
require_once(__DIR__.'/objects/cromaug-arg.php');

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

    function array_some(array $array, callable $fn) {
        foreach ($array as $value) {
            if($fn($value)) {
                return true;
            }
        }
        return false;
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

    function createDice() {
        $sql = "INSERT INTO dice (`color`, `small`, `die_face`) VALUES ";
        $values = [];
        foreach($this->DICES as $color => $counts) {
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

    function getSpellFromDb($dbObject) {
        if (!$dbObject || !array_key_exists('id', $dbObject)) {
            throw new BgaSystemException("Spell doesn't exists ".json_encode($dbObject));
        }
        return new Spell($dbObject, $this->SPELLS);
    }

    function getSpellsFromDb(array $dbObjects) {
        return array_map(function($dbObject) { return $this->getSpellFromDb($dbObject); }, array_values($dbObjects));
    }
    
    function getSmallDice(bool $ignoreBlack) {
        $sql = "SELECT * FROM dice WHERE `small` = true ";
        if ($ignoreBlack) {
            $sql .= " AND `color` <> 8";
        } 
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }
    
    function getBigDiceByColor(int $color = 0, int $limit = 0) {
        $sql = "SELECT * FROM dice WHERE `color` = $color AND `small` = false";
        if ($limit > 0) {
            $sql .= " LIMIT $limit";
        }
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
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
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }

    function getDiceByIds(array $ids) {
        if (count($ids) === 0) {
            return [];
        }

        $sql = "SELECT * FROM dice WHERE `die_id` IN (".implode(',', $ids).")";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }

    function getDieById(int $id) {
        $sql = "SELECT * FROM dice WHERE `die_id` = $id";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices))[0];
    }
    
    function getAvailableBigDice() {
        $sql = "SELECT * FROM dice WHERE `location` = 'deck' AND `small` = false";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices));
    }

    function getBlackDie() {
        $sql = "SELECT * FROM dice WHERE `color` = 8";
        $dbDices = self::getCollectionFromDB($sql);
        return array_map(function($dbDice) { return new Dice($dbDice); }, array_values($dbDices))[0];
    }

    function moveDice(array $dice, string $location, int $locationArg = 0) {
        $ids = array_map(function ($idie) { return $idie->id; }, $dice);
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
        return self::getUniqueValueFromDb("SELECT player_name FROM player WHERE player_id = $playerId");
    }

    function getPlayerScore(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT player_score FROM player where `player_id` = $playerId"));
    }

    function incPlayerScore(int $playerId, int $incScore, $message = '', $params = []) {
        self::DbQuery("UPDATE player SET player_score = player_score + $incScore WHERE player_id = $playerId");

        self::notifyAllPlayers('points', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'points' => $incScore,
        ]);
    }

    function decPlayerScore(int $playerId, int $decScore, $message = '', $params = []) {
        $newScore = max(0, $this->getPlayerScore($playerId) - $decScore);
        self::DbQuery("UPDATE player SET player_score = $newScore WHERE player_id = $playerId");

        self::notifyAllPlayers('points', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'points' => -$decScore,
        ]);

        return $newScore;
    }

    function getPlayerRerolls(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT `player_rerolls` FROM player where `player_id` = $playerId"));
    }

    function addPlayerRerolls(int $playerId, int $rerolls, $message = '', $params = []) {
        self::DbQuery("UPDATE player SET `player_rerolls` = `player_rerolls` + $rerolls WHERE `player_id` = $playerId");

        self::notifyAllPlayers('rerolls', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'rerolls' => $rerolls,
        ]);
    }

    function removePlayerRerolls(int $playerId, int $dec, $message = '', $params = []) {
        $newValue = max(0, $this->getPlayerRerolls($playerId) - $dec);
        self::DbQuery("UPDATE player SET `player_rerolls` = $newValue WHERE player_id = $playerId");

        self::notifyAllPlayers('rerolls', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'rerolls' => -$dec,
        ]);

        return $newValue;
    }

    function getPlayerFootprints(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT `player_footprints` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFootprints(int $playerId, int $footprints, $message = '', $params = []) {
        self::DbQuery("UPDATE player SET `player_footprints` = `player_footprints` + $footprints WHERE `player_id` = $playerId");

        self::notifyAllPlayers('footprints', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'footprints' => $footprints,
        ]);
    }

    function removePlayerFootprints(int $playerId, int $dec, $message = '', $params = []) {
        $newValue = max(0, $this->getPlayerFootprints($playerId) - $dec);
        self::DbQuery("UPDATE player SET `player_footprints` = $newValue WHERE player_id = $playerId");

        self::notifyAllPlayers('footprints', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'footprints' => -$dec,
        ]);

        return $newValue;
    }

    function getPlayerFireflies(int $playerId) {
        return intval(self::getUniqueValueFromDB("SELECT `player_fireflies` FROM player where `player_id` = $playerId"));
    }

    function addPlayerFireflies(int $playerId, int $fireflies, $message = '', $params = []) {
        self::DbQuery("UPDATE player SET `player_fireflies` = `player_fireflies` + $fireflies WHERE `player_id` = $playerId");

        self::notifyAllPlayers('fireflies', $message, $params + [
            'playerId' => $playerId,
            'playerName' => $this->getPlayerName($playerId),
            'fireflies' => $fireflies,
        ]);
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
        self::DbQuery("UPDATE companion SET `card_location_arg` = `card_location_arg` + (100 * (2 - `card_type`)) WHERE `card_location` = 'deck' ");
    }

    function createSpells() {
        foreach($this->SPELLS as $type => $effect) {if ($type == 3)
            $spells[] = [ 'type' => $type, 'type_arg' => 0, 'nbr' => 1];
        }
        $this->spells->createCards($spells, 'deck');
    }

    function getMeetingTrackFootprints(int $spot) {
        return intval(self::getUniqueValueFromDB("SELECT `footprints` FROM meetingtrack WHERE `spot` = $spot"));
    }

    function removeMeetingTrackFootprints(int $spot) {
        self::DbQuery("UPDATE meetingtrack SET `footprints` = 0 WHERE `spot` = $spot");
    }

    function placeCompanionsOnMeetingTrack() {
        for ($i=1;$i<=5;$i++) {
            $this->companions->pickCardForLocation('deck', 'meeting', $i);
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
        $smallDice = array_values(array_filter($playerDice, function($die) { return $die->small; }));

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
            $colorDice = array_values(array_filter($smallDice, function ($idie) use ($i) { return $idie->value === $i; }));
            $footprints = 0;
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

    function rollPlayerDice($ids = null, $params = []) {
        $dice = $ids === null ? $this->getDiceByLocation('player') : $this->getDiceByIds($ids);

        foreach($dice as &$idie) {
            $idie->roll();
        }

        $this->persistDice($dice);

        self::notifyAllPlayers('diceRolled', '', [
            'dice' => $dice,
        ] + $params);

        foreach($dice as &$idie) {
            if ($idie->color == 8 && $idie->face == 6 && $idie->location == 'player') { // we apply black die "-2"
                $this->applyEffect($idie->location_arg, $idie->value);
            }
        }
    }

    function sendToCemetery(int $playerId, int $companionId) {
        $this->companions->moveCard($companionId, 'cemetery', intval($this->companions->countCardInLocation('cemetery')));

        $companion = $this->getCompanionFromDb($this->companions->getCard($companionId));
        if ($companion->die) {
            $dieId = intval(self::getUniqueValueFromDB("SELECT `die_id` FROM companion WHERE `card_id` = $companion->id"));
            if ($dieId) {
                $this->removeSketalDie($playerId, $this->getDieById($dieId));
            }
        }
    }
        
    function getTopCemeteryCompanion() {
        $companionDb = $this->companions->getCardOnTop('cemetery');
        
        if ($companionDb != null) {
            return $this->getCompanionFromDb($companionDb);
        } else {
            return null;
        }
    }

    function getRerollScoreCost(int $score) {
        // list of points with reroll, under current score, top first
        $scoreTrackRerolls = array_values(array_reverse(array_filter($this->SCORE_TRACK_REROLLS, function($p) use ($score) { return $p < $score; })));

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
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));

        $rerolls = 0;
        foreach($companions as $companion) {
            if ($companion->reroll && !$this->getRerollUsed($companion)) {
                $rerolls++;
            }
        }

        return $rerolls;
    }

    public function applyRollDieCost(int $playerId, int $cost) {
        $args = $this->argRollDiceForPlayer($playerId);
        $remainingCost = $cost;

        if ($remainingCost > 0 && $args['rerollCompanion'] > 0) {
            $companionsToFlag = min($args['rerollCompanion'], $remainingCost);

            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
            $companionsFlagged = 0;
            foreach($companions as $companion) {
                if ($companionsFlagged < $companionsToFlag && $companion->reroll && !$this->getRerollUsed($companion)) {
                    self::DbQuery("UPDATE companion SET `reroll_used` = true WHERE card_id = $companion->id");
                    $companionsFlagged++;
                }
            }

            $remainingCost = max(0, $remainingCost - $companionsFlagged);
        }
        
        if ($remainingCost > 0 && $args['rerollTokens'] > 0) {
            $tokenCost = min($args['rerollTokens'], $remainingCost);

            $this->removePlayerRerolls($playerId, $tokenCost);

            $remainingCost -= $tokenCost;
        }
        
        if ($remainingCost > 0 && count($args['rerollScore']) > 0) {
            $scoreCost = min(count($args['rerollScore']), $remainingCost);

            $this->decPlayerScore($playerId, $args['rerollScore'][$scoreCost]);

            $remainingCost -= $scoreCost;
        }

        if ($remainingCost > 0) {
            throw new BgaUserException('Not enough reroll available');
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
            if ($condition >= -5 && $condition <= -1 && $this->array_some($dice, function ($die) use ($condition) { return $die->value == -$condition; })) {
                return 0;
            }
        }

        $effects = [];

        $diceValues = array_map(function($die) { return $die->value; }, $dice);
        // we remove forbidden signs, as they have been checked before
        $effectConditions = array_values(array_filter($effect->conditions, function ($condition) { return $condition >= 0; }));
        if (count($effectConditions) === 0) {
            return 1;
        }

        if ($this->array_some($effect->conditions, function ($condition) { return $condition == 0; })) { // serie of same color
            $count = 0;
            foreach ([1, 2, 3, 4, 5, 22, 103] as $i) {
                $conditions = array_map(function($condition) use ($i) { return $condition == 0 ? $i : $condition; }, $effectConditions);
                $count += $this->countRepetitionInDiceForEffectCondition($diceValues, $conditions);
            }
            return $count;
        } else {
            return $this->countRepetitionInDiceForEffectCondition($diceValues, $effectConditions);
        }
    }

    function getEffectiveDice(int $playerId, $used = null) {
        $dice = $this->getDiceByLocation('player', $playerId, $used);
        $blackDie = $this->array_find($dice, function($die) { return $die->color == 8; });
        if ($blackDie != null) { // got black Die
            return array_values(array_filter($dice), function($die) use ($blackDie) { return $die->value != $blackDie->value; });
        } else {
            return $dice;
        }
    }

    public function getTriggeredEffectsForPlayer(int $playerId) {
        $effectsCodes = [];
        $dice = $this->getEffectiveDice($playerId);

        $adventurer = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId))[0];
        if ($adventurer->effect != null) {
            $count = $this->isTriggeredEffectsForCard($dice, $adventurer->effect);
            for ($i=0; $i<$count; $i++) {
                $effectsCodes[] = [0, $adventurer->id];
            }
        }

        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
        foreach($companions as $companion) {
            if ($companion->effect != null) {
                $count = $this->isTriggeredEffectsForCard($dice, $companion->effect);
                for ($i=0; $i<$count; $i++) {
                    $effectsCodes[] = [1, $companion->id];
                }
            }
        }

        $spells = $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId));
        foreach($spells as $spell) {
            if ($spell->visible && $this->isTriggeredEffectsForCard($dice, $spell->effect)) {
                $effectsCodes[] = [2, $spell->id];
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

        $remainingEffects = [];
        foreach($allEffects as $effect) {
            if (!$this->array_some($appliedEffects, function ($appliedEffect) use ($effect) { return $appliedEffect[0] == $effect[0] && $appliedEffect[1] == $effect[1]; })) {
                $remainingEffects[] = $effect;
            }
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

    function applyEffect(int $playerId, int $effect, $cardId = null) {
        if ($effect > 100) {
            $this->incPlayerScore($playerId, $effect - 100);
        } else if ($effect < -100) {
            $this->decPlayerScore($playerId, -($effect + 100));
        }

        else if ($effect > 20 && $effect < 30) {
            $this->addPlayerFootprints($playerId, $effect - 20);
        } else if ($effect < -20 && $effect > -30) {
            $this->removePlayerFootprints($playerId, -($effect + 20));
        }

        else if ($effect > 10 && $effect < 20) {
            $this->addPlayerFireflies($playerId, $effect - 10);
        }

        else if ($effect === 30) {
            $this->addPlayerRerolls($playerId, 1);
        }

        else if ($effect === 33) { // skull
            $this->sendToCemetery($playerId, $cardId);

            $companion = $this->getCompanionFromDb($this->companions->getCard($cardId));

            self::notifyAllPlayers('removeCompanion', '', [
                'playerId' => $playerId,
                'companion' => $companion,
            ]);
        } else if ($effect === 36) { // spell
            $playersIds = $this->getPlayersIds();
            $this->giveSpellToPlayers(array_values(array_filter($playersIds, function($pId) use ($playerId) { return $pId != $playerId; })));
        } else {
            // TODO 37 skull/spell
        }
    }

    function applyCardEffect(int $playerId, int $cardType, int $id) {
        $cardEffect = null;
        $spellCard = null;
        switch ($cardType) {
            case 0:
                $adventurer = $this->getAdventurersFromDb($this->adventurers->getCardsInLocation('player', $playerId))[0];
                if ($adventurer->id == $id) {
                    $cardEffect = $adventurer->effect;
                }
                break;
            case 1:
                $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
                foreach($companions as $companion) {
                    if ($companion->id == $id) {
                        $cardEffect = $companion->effect;
                    }
                }
                break;
            case 2:
                $spells = $this->getSpellsFromDb($this->spells->getCardsInLocation('player', $playerId));
                foreach($spells as $spell) {
                    if ($spell->id == $id) {
                        $cardEffect = $spell->effect;
                        $spellCard = $spell;
                    }
                }
                break;
        }

        if ($cardEffect === null) {
            throw new BgaUserException("Selected effect is not available");
        }

        foreach($cardEffect->effects as $effect) {
            if ($spellCard != null && $spellCard->type == COMPANION_SPELL) {
                $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
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
                $this->applyEffect($playerId, $effect, $id);
            }
        }

        if ($cardType == 2 && $spellCard->type != COMPANION_SPELL) { // spells are discarded after usage
            $this->discardSpell($playerId, $spellCard);
        }

        $this->saveAppliedEffect($playerId, [$cardType, $id]);
    }

    public function takeSketalDie(int $playerId, object $die) {
        $this->moveDice([$die], 'player', $playerId);

        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));
        $companion = $companions[count($companions) - 1];
        self::DbQuery("UPDATE `companion` SET `die_id` = $die->id WHERE `card_id` = $companion->id");

        self::notifyAllPlayers('takeSketalDie', clienttranslate('${player_name} takes ${companionName} die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
            'companionName' => $companion->name,
        ]);
    }
    

    public function removeSketalDie(int $playerId, object $die) {
        $this->moveDice([$die], 'deck');

        $companionId = intval(self::getUniqueValueFromDB("SELECT `card_id` FROM `companion` WHERE `die_id` = $die->id"));
        $companion = $this->getCompanionFromDb($this->companions->getCard($companionId));

        self::DbQuery("UPDATE `companion` SET `die_id` = null WHERE `die_id` = $die->id");

        self::notifyAllPlayers('removeSketalDie', clienttranslate('${player_name} loses ${companionName} die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
            'companionName' => $companion->name,
        ]);
    }

    private function giveSpellToPlayers(array $playersIds) {
        $spellsIds = [];

        foreach($playersIds as $playerId) {
            $spellsIds[$playerId] = $this->getSpellFromDb($this->spells->pickCardForLocation('deck', 'player', $playerId))->id;
        }

        self::notifyAllPlayers('giveHiddenSpells', clienttranslate('${player_name} gives spell token to other players with ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
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

    public function getCromaugArg(int $playerId) {
        $dice = $this->getEffectiveDice($playerId);
        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player', $playerId));

        $cromaugCard = null;

        foreach($companions as $companion) {
            if ($companion->subType == 41) { // Cromaug
                if ($this->isTriggeredEffectsForCard($dice, $companion->effect)) {
                    $cromaugCard = $companion;
                    break;
                }
            }
        }

        if ($cromaugCard == null) {
            return null;
        } else {
            $this->sendToCemetery($playerId, $cromaugCard->id);
            $companion = $this->getCompanionFromDb($this->companions->getCard($cromaugCard->id));
            self::notifyAllPlayers('removeCompanion', clienttranslate('${playerName} discard Cromaug and a companion from the cemetery'), [
                'playerId' => $playerId,
                'playerName' => $this->getPlayerName($playerId),
                'companion' => $cromaugCard,
            ]);

            $cromaugArg = new stdClass();
            $cromaugArg->cemeteryCards = $this->getCompanionsFromDb($this->companions->getCardsInLocation('cemetery'));
            return $cromaugArg;
        }
    }
}
