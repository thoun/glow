<?php

require_once(__DIR__.'/objects/uriom-intervention.php');

trait ActionTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Player actions
    //////////// 
    
    /*
        Each time a player is doing some game action, one of the methods below is called.
        (note: each method below must match an input method in nicodemus.action.php)
    */

    public function applyChooseAdventurer(int $playerId, int $id, bool $soloMode) {
        $adventurer = $this->getAdventurerFromDb($this->adventurers->getCard($id));

        if ($adventurer->location != 'deck') {
            throw new BgaUserException("Adventurer not available");
        }

        $this->adventurers->moveCard($adventurer->id, 'player', $playerId);

        // take big dice
        $dice = $this->getBigDiceByColor($adventurer->color, $adventurer->dice);
        if ($adventurer->color == 8) {
            $dice = array_merge(
                $this->getBigDiceByColor(8, 1),
                $this->getBigDiceByColor(80, 2),
            );
        } else if ($adventurer->color == 11) {
            $dice = array_merge(
                $this->getBigDiceByColor(7, $adventurer->dice),
            );
        }
        $this->moveDice($dice, 'player', $playerId);

        if ($adventurer->color == 11) {
            // we create and place the 2 special yellow small dice
            $sql = "INSERT INTO dice (`color`, `small`, `die_face`, `location`) VALUES ";
            $values = [];
            $deck = $this->getPlayerSmallBoard($playerId) ? 'decksmall' : 'deck';
            foreach ([1, 2] as $i) {
                $values[] = "(11, true, ".bga_rand(1, 5).", '$deck')";
            }
    
            $sql .= implode(',', $values);
            $this->DbQuery($sql);
        }

        $newPlayerColor = $this->ADVENTURERS_COLORS[$adventurer->color];
        $this->DbQuery("UPDATE player SET `player_color` = '$newPlayerColor' WHERE player_id = $playerId");
        $this->reloadPlayersBasicInfos();

        $this->notifyAllPlayers('chosenAdventurer', clienttranslate('${player_name} chooses adventurer ${adventurerName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'adventurer' => $adventurer,
            'adventurerName' => $adventurer->name,
            'dice' => $dice,
            'newPlayerColor' => $newPlayerColor,
        ]);

        $this->setStat(1, $adventurer->name);
        $this->setStat(1, $adventurer->name, $playerId);

        if ($soloMode) {
            $movedDiceColorsToTable = [];

            if ($adventurer->color != 6) {
                $movedDiceColorsToTable[] = 6;
            }
            if ($adventurer->color != 7) {
                $movedDiceColorsToTable[] = 7;
            }

            $movedDiceToTable = array_map(fn($color) => $this->getBigDiceByColor($color, 1)[0], $movedDiceColorsToTable);

            $this->moveDice($movedDiceToTable, 'table');
            $this->notifyAllPlayers('setTableDice', '', [
                'dice' => $movedDiceToTable,
            ]);
        }
    }
    
    public function chooseAdventurer(int $id) {
        $this->checkAction('chooseAdventurer'); 
        
        $playerId = intval($this->getActivePlayerId());
        $soloMode = $this->isSoloMode();

        $this->applyChooseAdventurer($playerId, $id, $soloMode);

        if ($this->isSoloMode()) {
            $this->giveExtraTime($playerId);
            $this->gamestate->nextState('chooseTomDice');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
    }

    public function applyRecruitCompanion(int $playerId, object $companion, $spot = null) {
        $fromCemetery = $companion->location == 'cemetery' ? 5 : 0;
        $companion->location = 'player'.$playerId;
        $companion->location_arg = intval($this->getGameStateValue(DAY)) * 10 + $fromCemetery;
        $this->companions->moveCard($companion->id, $companion->location, $companion->location_arg);
        $this->DbQuery("UPDATE player SET `player_recruit_day` = (".$this->getDaySql().") where `player_id` = $playerId");  

        $dice = null;
        if ($spot !== null) {
            $dice = $this->getDiceByLocation('meeting', $spot);
            if ($playerId != $this->getPlayerWithUriom()) {
                $dice = array_values(array_filter($dice, fn($die) => $die->color != 11 || !$die->small));
            }
            $count = count($dice);
            if ($count > 0) {
                $this->moveDice($dice, 'player', $playerId);

                $this->incStat($count, 'collectedSmallDice');
                $this->incStat($count, 'collectedSmallDice', $playerId);
            }
        }

        $this->notifyAllPlayers('chosenCompanion', clienttranslate('${player_name} chooses companion ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
            'dice' => $dice,
            // new cemetaryTop if chosen from cemetary
            'cemetaryTop' => $spot == null ? $this->getTopCemeteryCompanion() : null,
        ]);
        
        if ($spot !== null) {
            $this->addPlayerFootprints($playerId, $this->getMeetingTrackFootprints($spot));
            $this->removeMeetingTrackFootprints($spot);
        }

        // take new die if Sketal
        if ($companion->die && $companion->dieColor > 0) {
            $dice = $this->getAvailableBigDice();
            foreach($dice as $die) {
                if ($die->color === $companion->dieColor) {

                    $multi = ($this->gamestate->state()['name']) == 'resurrect';
                    if ($multi) {
                        $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
                        $die->used = true;
                    }

                    $this->takeSketalDie($playerId, $die);
                    break;
                }
            }
        } else if ($companion->subType == KAAR) {
            $die = $this->getBlackDie(true);

            // black die enters the game
            if ($die->location == 'table') {
                
                $availableSpots = [];
                $spotCount = $this->getSpotCount();
                for ($i=1;$i<=$spotCount;$i++) {
                    $availableSpots[] = $i;
                }

                if ($spot !== null) {
                    $availableSpots = array_values(array_map(fn($dbLine) => 
                        intval($dbLine['card_location_arg'])
                    , $this->getCollectionFromDb("select `card_location_arg` from `companion` where `card_location` = 'meeting'")));
                }

                $dieSpot = $availableSpots[bga_rand(0, count($availableSpots) - 1)];
                
                $die->setFace($dieSpot);
                $this->persistDice([$die]);
                $this->moveDice([$die], 'meeting', $dieSpot);

                $this->notifyAllPlayers('moveBlackDie', clienttranslate('${player_name} adds black die with ${companionName}'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companionName' => $companion->name,
                    'die' => $die,
                ]);
            }
        }
    }

    function redirectAfterRecruit() {
        if ($this->getPlayerCount() == 2 && intval($this->getActivePlayerId()) == intval($this->getGameStateValue(FIRST_PLAYER))) {
            $this->gamestate->nextState('removeCompanion');
        } else {
            $this->gamestate->nextState('nextPlayer');
        }
        
    }
    
    public function recruitCompanion(int $spot, $ignoreCheck = false) {
        if (!$ignoreCheck) {
            $this->checkAction('recruitCompanion'); 
        }

        $spotCount = $this->getSpotCount();
        if ($spot < 1 || $spot > $spotCount) {
            throw new BgaUserException("Not a valid spot");
        }
        
        $playerId = $this->getActivePlayerId();

        $spotDice = $this->getDiceByLocation('meeting', $spot);
        if ($this->array_some($spotDice, fn($die) => $die->color == 11 && $die->small) && !$this->uriomHasRecruited($playerId)) {
            $this->setGlobalVariable(URIOM_INTERVENTION, new UriomIntervention($playerId, $this->getPlayerWithUriom(), $spot));
            $this->gamestate->nextState('nextPlayer');
            return;
        }

        $this->recruitCompanionAction($playerId, $spot);
    }

    public function recruitCompanionAction(int $playerId, int $spot) {
        $solo = $this->isSoloMode();
        if ($solo) {
            $soloTile = $this->getSoloTilesFromDb($this->soloTiles->getCardsInLocation('meeting', $spot))[0];
            $this->applyTomEffects($soloTile);
            $this->updateSoloDeck($spot);
        }

        $spotDice = $this->getDiceByLocation('meeting', $spot);

        if ($this->array_some($spotDice, fn($die) => $die->color == 8 && $die->small)) {
            $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('player'.$playerId, null, 'location_arg'));
            if ($this->array_some($companions, fn($companion) => $companion->subType == KAAR)) {
                $this->gamestate->nextState('moveBlackDie');
                return;
            }
        }
        
        $companion = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot))[0];

        if ($companion->location != 'meeting') {
            throw new BgaUserException("Companion not available");
        }

        $this->applyRecruitCompanion($playerId, $companion, $spot);

        
        if ($solo) {
            $this->soloEndRecruit();
        }

        if ($companion->die && $companion->dieColor === 0 && $this->canChooseSketalDie()) {
            $this->gamestate->nextState('selectSketalDie');
        } else {
            $this->redirectAfterRecruit();
        }
    }

    public function selectSketalDie(int $id) {
        $this->checkAction('selectSketalDie');
        $multi = ($this->gamestate->state()['name']) != 'selectSketalDie';

        $die = $this->getDieById($id);

        if ($die->location != 'table') {
            throw new BgaUserException("Die not available");
        }
        
        $playerId = $multi ? $this->getCurrentPlayerId() : $this->getActivePlayerId();

        if ($multi) {
            $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
            $die->used = true;
        }
        
        $this->takeSketalDie($playerId, $die);

        if ($multi) {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
        } else {
            $this->redirectAfterRecruit();
        }
    }
    
    public function moveBlackDie(int $spot) {
        $this->checkAction('moveBlackDie'); 

        $playerId = $this->getCurrentPlayerId();

        $spotCount = $this->getSpotCount();
        if ($spot < 1 || $spot > $spotCount) {
            throw new BgaUserException("Not a valid spot");
        }

        $die = $this->getBlackDie(true);
        $currentSpot = $die->location_arg;

        $die->setFace($spot);
        $this->persistDice([$die]);
        $this->moveDice([$die], 'meeting', $spot);

        $this->notifyAllPlayers('moveBlackDie', clienttranslate('${player_name} moves black die'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'die' => $die,
        ]);

        $this->recruitCompanion($currentSpot, true);
    }
    
    public function removeCompanion(int $spot) {
        $this->checkAction('removeCompanion'); 

        $playerId = intval($this->getCurrentPlayerId());

        $spotCount = $this->getSpotCount();
        if ($spot < 1 || $spot > $spotCount) {
            throw new BgaUserException("Not a valid spot");
        }

        if ($this->spotHasUriomDice($spot) && $playerId != $this->getPlayerWithUriom()) {
            throw new BgaUserException("You can't remove a card with a small yellow die"); // TODO check translation / make translatable
        }

        $companions = $this->getCompanionsFromDb($this->companions->getCardsInLocation('meeting', $spot));

        if (count($companions) == 0) {
            return;
        }

        $companion = $companions[0];

        if ($companion->location != 'meeting') {
            throw new BgaUserException("Companion not available");
        }

        $this->sendToCemetery($playerId, $companion->id);

        $this->notifyAllPlayers('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'companion' => $companion,
            'companionName' => $companion->name,
            'spot' => $spot,
        ]);
        
        $this->gamestate->nextState('nextPlayer');
    }

    public function recruitCompanionUriom() {
        $this->checkAction('recruitCompanionUriom');

        $uriomIntervention = $this->getGlobalVariable(URIOM_INTERVENTION);
        $uriomIntervention->activated = true;
        $this->setGlobalVariable(URIOM_INTERVENTION, $uriomIntervention);

        $this->recruitCompanionAction($uriomIntervention->uriomPlayerId, $uriomIntervention->spot);
    }
    
    public function passUriomRecruit() {
        $this->checkAction('passUriomRecruit');

        $uriomIntervention = $this->getGlobalVariable(URIOM_INTERVENTION);
        $uriomIntervention->activated = false;
        $this->setGlobalVariable(URIOM_INTERVENTION, $uriomIntervention);

        $this->gamestate->nextState('pass');
    }
    
    public function selectDiceToRoll() {
        $this->checkAction('selectDiceToRoll');

        $playerId = $this->getCurrentPlayerId();

        $this->gamestate->nextPrivateState($playerId, 'rollDice');
    }

    
    public function selectDieToChange() {
        $this->checkAction('selectDieToChange');

        $playerId = $this->getCurrentPlayerId();

        $this->gamestate->nextPrivateState($playerId, 'changeDie');
    }

    public function rollDice(array $ids, array $cost) {
        $this->checkAction('rollDice');

        $playerId = $this->getCurrentPlayerId();

        foreach($ids as $id) {
            $die = $this->getDieById($id);
            if ($die->location_arg != $playerId) {
                throw new BgaUserException("You can't roll this die");
            }
        }

        $this->applyRollDieCost($playerId, 1, $cost);

        $this->rollPlayerDice($playerId, $ids, clienttranslate('${player_name} rerolls dice ${originalDice} and gets ${rolledDice}'), []);

        $this->incStat(count($ids), 'rerolledDice');
        $this->incStat(count($ids), 'rerolledDice', $playerId);

        $args = $this->argRerollImmediate($playerId);
        $this->gamestate->nextPrivateState($playerId, $args['selectedDie'] !== null ? 'rerollImmediate' : 'selectDice');
    }

    public function changeDie(int $id, int $face, array $cost) {
        $this->checkAction('changeDie');

        $playerId = intval($this->getCurrentPlayerId());

        $die = $this->getDieById($id);
        if ($die->location_arg != $playerId) {
            throw new BgaUserException("You can't roll this die");
        }

        $this->applyRollDieCost($playerId, 3, $cost);
        $originalDiceStr = $this->getDieFaceLogName($die);
        $die->setFace($face);
        $rolledDiceStr = $this->getDieFaceLogName($die);

        $this->persistDice([$die]);

        $this->notifyAllPlayers('diceChanged', clienttranslate('${player_name} change die ${originalDice} to ${rolledDice}'), [
            'playerId' => $playerId,
            'player_name' => $this->getPlayerName($playerId),
            'dice' => [$die],
            'originalDice' => $originalDiceStr,
            'rolledDice' => $rolledDiceStr,
        ]);

        $this->incStat(1, 'changedDice');
        $this->incStat(1, 'changedDice', $playerId);

        $this->gamestate->nextPrivateState($playerId, 'selectDice');
    }

    public function rerollImmediate(int $id) {
        $this->checkAction('rerollImmediate');

        $playerId = $this->getCurrentPlayerId();

        $args = $this->argRerollImmediate($playerId);
        $ids = [$args['selectedDie']->id];
        if ($id > 0) {
            $ids[] = $id;
        }

        foreach($ids as $id) {
            $die = $this->getDieById($id);
            if ($die->location_arg != $playerId) {
                throw new BgaUserException("You can't roll this die");
            }
        }

        $this->rollPlayerDice($playerId, $ids, clienttranslate('${player_name} rerolls dice ${originalDice} and gets ${rolledDice}'), []);

        $this->incStat(count($ids), 'rerolledDice');
        $this->incStat(count($ids), 'rerolledDice', $playerId);

        $args = $this->argRerollImmediate($playerId);
        $this->gamestate->nextPrivateState($playerId, $args['selectedDie'] !== null ? 'rerollImmediate' : 'selectDice');
    }

    public function cancel() {
        $this->checkAction('cancel');

        $playerId = $this->getCurrentPlayerId();

        $this->gamestate->nextPrivateState($playerId, 'cancel');
    }

    public function keepDice() {
        $this->checkAction('keepDice');

        $playerId = $this->getCurrentPlayerId();

        $this->giveExtraTime($playerId);
        $this->gamestate->setPlayerNonMultiactive($playerId, 'keepDice');
    }
    
    public function swap(int $id) {
        $this->checkAction('swap');

        $playerId = intval($this->getCurrentPlayerId());

        $companion = $this->getCompanionFromDb($this->companions->getCardOnTop('malach'));
        $replaced = $this->getCompanionFromDb($this->companions->getCard($id));

        if ($companion->location != 'malach' || $replaced->location != 'player'.$playerId) {
            throw new BgaUserException("Companion not available");
        }

        $this->applyRecruitCompanion($playerId, $companion);

        $this->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 1 where `card_location` = 'malach'");
        $this->companions->moveCard($replaced->id, 'malach', 0);        
        $this->notifyAllPlayers('removeCompanion', '', [
            'playerId' => $playerId,
            'companion' => $replaced,
        ]);

        $dice = $this->getEffectiveDice($playerId);
        $unusedMalachDice = array_values(array_filter($dice, fn($die) => $die->color == 9 && $die->value == 9 && !$die->used));
        if (count($unusedMalachDice) > 0) {
            $die = $unusedMalachDice[0];
            $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
        }

        if ($companion->die && $companion->dieColor === 0 && $this->canChooseSketalDie()) {
            $this->gamestate->nextPrivateState($playerId, 'selectSketalDie'); // we don't disable player so he stays active for selectSketalDieMulti
        } else if (count($unusedMalachDice) > 1) {
            $this->gamestate->nextPrivateState($playerId, 'stay');
        } else {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
        }
    } 

    public function skipSwap() {
        $this->checkAction('skipSwap');

        $playerId = intval($this->getCurrentPlayerId());
        $companion = $this->getCompanionFromDb($this->companions->getCardOnTop('malach'));

        $dice = $this->getEffectiveDice($playerId);
        $unusedMalachDice = array_values(array_filter($dice, fn($die) => $die->color == 9 && $die->value == 9 && !$die->used));
        if (count($unusedMalachDice) > 0) {
            $die = $unusedMalachDice[0];
            $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
        }

        // put the card under the deck
        $this->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 1 where `card_location` = 'malach'");
        $this->DbQuery("UPDATE companion SET `card_location_arg` = 0 where `card_id` = $companion->id");

        if (count($unusedMalachDice) > 1) {            
            $this->gamestate->nextPrivateState($playerId, 'stay');
        } else {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
        }
    }
    
    public function resurrect(int $id) {
        $this->checkAction('resurrect');

        $playerId = intval($this->getCurrentPlayerId());

        $companion = $this->getCompanionFromDb($this->companions->getCard($id));

        if ($companion->location != 'cemetery') {
            throw new BgaUserException("Companion not available");
        }

        $this->applyRecruitCompanion($playerId, $companion);

        if ($companion->die && $companion->dieColor === 0 && $this->canChooseSketalDie()) {
            $this->gamestate->nextPrivateState($playerId, 'selectSketalDie'); // we don't disable player so he stays active for selectSketalDieMulti
        } else {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
        }
    } 

    public function skipResurrect() {
        $this->checkAction('skipResurrect');

        $playerId = intval($this->getCurrentPlayerId());

        $this->gamestate->setPlayerNonMultiactive($playerId, 'next');
    }

    public function applyResolveCard(int $playerId, int $cardType, int $id, $dieId = 0) {
        $this->applyCardEffect($playerId, $cardType, $id, $dieId);

        $resolveCardsForPlayer = $this->argResolveCardsForPlayer($playerId);
     
        $this->gamestate->nextPrivateState($playerId, 'resolve');        

        $this->incStat(1, 'resolvedCards');
        $this->incStat(1, 'resolvedCards', $playerId);

        return $resolveCardsForPlayer;
    }

    public function resolveCard(int $cardType, int $id, $dieId = 0) {
        $this->checkAction('resolveCard');

        $playerId = intval($this->getCurrentPlayerId());
        
        $resolveCardsForPlayer = $this->argResolveCardsForPlayer($playerId);
        if (!$this->array_some($resolveCardsForPlayer->remainingEffects, fn($remainingEffect) => $remainingEffect[0] == $cardType && $remainingEffect[1] == $id)) {
            throw new BgaUserException("You can't apply that effect");
        }

        $resolveCardsForPlayer = $this->applyResolveCard($playerId, $cardType, $id, $dieId);
        
        if (count($resolveCardsForPlayer->remainingEffects) === 0) {
            $this->gamestate->setPlayerNonMultiactive($playerId, 'move');
            $this->giveExtraTime($playerId);
        }
    }

    public function resolveAll() {
        $this->checkAction('resolveAll');

        $playerId = intval($this->getCurrentPlayerId());

        $resolveCardsForPlayer = $this->argResolveCardsForPlayer($playerId);
        
        while (count($resolveCardsForPlayer->remainingEffects) > 0) {
            $firstRemainingEffect = $resolveCardsForPlayer->remainingEffects[0];
            $resolveCardsForPlayer = $this->applyResolveCard($playerId, $firstRemainingEffect[0], $firstRemainingEffect[1], 0);
        }
        
        $this->gamestate->setPlayerNonMultiactive($playerId, 'move');
        $this->giveExtraTime($playerId);
    }

    private function applyMove(int $playerId, object $route) {
        // apply route & destination effects
        foreach($route->costForPlayer as $effect) {
            $this->applyEffect($playerId, $effect, 4, null);

            if ($effect >= 1 && $effect <= 5) {
                $dice = $this->getDiceByLocation('player', $playerId, false);
                $die = $this->array_find($dice, fn($die) => $die->value == $effect);
                if ($die != null) {
                    $this->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");

                    $this->notifyAllPlayers('usedDice', '', [
                        'playerId' => $playerId,
                        'dieId' => $die->id,
                    ]);
                }
            }
        }

        $side = $this->getSide();

        $footprintEffect = $this->array_find($route->costForPlayer, fn($effect) => $effect < -20 && $effect > -30);
        if ($footprintEffect != null) {
            $destination = $this->getMapSpot($side, $route->destination);
            if (!$this->array_some($destination->effects, fn($effect) => $effect < -20 && $effect > -30)) {
                // we count footprints as joker only if we are not in a spot that require footprint cost
                $footprintCost = -($footprintEffect + 20);
                $this->incStat($footprintCost, 'footprintsAsJokers');
                $this->incStat($footprintCost, 'footprintsAsJokers', $playerId);
            }
        }

        if ($side === 1) {
            $this->movePlayerCompany($playerId, $route->destination, $route->from);

            $args = $this->argMoveForPlayer($playerId);
            if (count($args->possibleRoutes) == 0 && $args->canSettle != true) {
                $this->applyEndTurn($playerId);
            } else {         
                $this->gamestate->nextPrivateState($playerId, 'move');
            }
        } else if ($side === 2) {
            $this->movePlayerBoat($playerId, $route->destination, $route->from);

            $this->applyEndTurn($playerId);
        }

        $this->incStat(1, 'moves');
        $this->incStat(1, 'moves', $playerId);
    }

    public function move(int $destination, $from = null, $type = null, $id = null) {
        // TODO add die id for companion
        $this->checkAction('move');

        $playerId = intval($this->getCurrentPlayerId());

        $possibleRoutes = $this->getPossibleRoutes($playerId);
        $route = $this->array_find($possibleRoutes, fn($possibleRoute) => $possibleRoute->destination == $destination && ($from == null || $possibleRoute->from == $from));
        if ($route == null) {
            throw new BgaUserException("Impossible to move here");
        }

        // if we pass a discard companion/spell
        if ($type != null && $id != null) {
            if ($type == 1) {
                $companion = $this->getCompanionFromDb($this->companions->getCard($id));

                if ($companion->location != 'player'.$playerId) {
                    throw new BgaUserException("Player doesn't have selected companion");
                }

                $this->sendToCemetery($playerId, $companion->id);

                $this->notifyAllPlayers('removeCompanion', clienttranslate('${player_name} removes companion ${companionName}'), [
                    'playerId' => $playerId,
                    'player_name' => $this->getPlayerName($playerId),
                    'companion' => $companion,
                    'companionName' => $companion->name,
                ]);
            } else if ($type == 2) {
                $spell = $this->getSpellFromDb($this->spells->getCard($id));

                if ($spell->location != 'player' || $spell->location_arg != $playerId) {
                    throw new BgaUserException("Player doesn't have selected spell");
                }

                $this->discardSpell($playerId, $spell);
            }
        }

        $this->applyMove($playerId, $route);
    }

    private function applyEndTurn(int $playerId) {
        $this->replaceSmallDiceOnMeetingTrack($playerId);

        $this->gamestate->setPlayerNonMultiactive($playerId, 'endRound');
        $this->giveExtraTime($playerId);
    }
  	
    public function placeEncampment() {
        $this->checkAction('placeEncampment');

        $playerId = intval($this->getCurrentPlayerId());
        $position = $this->getPlayerCompany($playerId)->position;

        if (!$this->getMapSpot(1, $position)->canSettle) {
            throw new BgaUserException("You can only place encampment in a village");
        }

        $this->movePlayerEncampment($playerId, $position);
        $this->applyEndTurn($playerId);
    }

  	
    public function endTurn() {
        $this->checkAction('endTurn');

        $playerId = intval($this->getCurrentPlayerId());

        $this->applyEndTurn($playerId);
    }
}
