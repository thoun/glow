<?php

trait SoloUtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function isSoloMode() {
        return count($this->loadPlayersBasicInfos()) == 1;
    }

    function initTom() {
        $tom = new stdClass();
        $tom->id = 0;
        $tom->score = 10;
        $tom->playerNo = 2;
        $tom->company = 0;
        $tom->rerolls = 0;
        $tom->footprints = 0;
        $tom->fireflies = 0;
        $tom->scoreBeforeEnd = 0;
        $tom->scoreBoard = 0;
        $tom->scoreAfterEnd = 0;
        $tom->color = '000000';

        return $this->setTom($tom);
    }

    function setTom(object $tom) {
        $this->setGlobalVariable(TOM, $tom);
    }

    function getTom() {
        return $this->getGlobalVariable(TOM);
    }

    function setTomDice(array $dice) {
        $tom = $this->getTom();

        $tom->dice = $dice;
        $tom->color = $this->ADVENTURERS_COLORS[$dice[0]->color];

        $this->setTom($tom);

        return $tom;
    }

    function incTomCompany(int $incCompany) {
        $tom = $this->getTom();

        $tom->company += $incCompany;

        $this->setTom($tom);

        return $tom->company;
    }

    function incTomScore(int $incScore, $message = '', $params = []) {
        $tom = $this->getTom();

        $tom->score += $incScore;

        $this->setTom($tom);

        $this->notifyAllPlayers('points', $message, $params + [
            'playerId' => 0,
            'player_name' => 'Tom',
            'points' => $incScore,
            'abspoints' => $incScore,
            'newScore' => $tom->score,
        ]);
    }

    function getTomFootprints() {
        $tom = $this->getTom();

        return $tom->footprints;
    }

    function getTomFireflies() {
        $tom = $this->getTom();

        return $tom->fireflies;
    }

    function getTomRerolls() {
        $tom = $this->getTom();

        return $tom->rerolls;
    }

    function addTomFootprints(int $footprints) {
        $tom = $this->getTom();

        $tom->footprints += $footprints;

        $this->setTom($tom);
    }

    function removeTomFootprints(int $footprints) {
        $tom = $this->getTom();

        $tom->footprints = max(0, $tom->footprints - $footprints);

        $this->setTom($tom);

        return $tom->footprints;
    }
    
    function rollAndPlaceTomDice(array $dice) {
        // roll dice
        foreach($dice as &$idie) {
            //$idie->roll();
            $idie->setFace(6);
            if ($idie->value > 5) { // we apply black die "-2"
                $this->applyEffect(0, $idie->value, 3, null);
                $this->moveDice([$idie], 'meeting', 0);
            } else {
                $this->moveDice([$idie], 'meeting', $idie->value);
            }

            $this->notifyAllPlayers('moveBlackDie', '', [
                'die' => $idie,
            ]);
        }

        $this->persistDice($dice);
    }

    function placeSoloTilesOnMeetingTrack() {
        for ($i=1;$i<=5;$i++) {
            $this->soloTiles->pickCardForLocation('deck', 'meeting', $i);
        }
    }

    function getPossibleSoloRoutesForBoat(object $boat, int $moveMeeple, array $allBoats) {
        $currentDistanceFromCenter = $this->MAP2[$boat->position]->distanceFromCenter;
        $routes = $this->getRoutes(2, $boat->position);

        $route = null;
        foreach($routes as $iRoute) {
            $distanceFromCenter = $this->MAP2[$iRoute->destination]->distanceFromCenter;

            // remove backward routes
            if ($distanceFromCenter <= $currentDistanceFromCenter) {
                continue;
            }

            // remove routes leading to other boat
            if ($this->array_some($allBoats, fn($aBoat) => $aBoat->position == $iRoute->destination)) {
                continue;
            }


            if ($route == null || 
                ($moveMeeple == 1 && $iRoute->min < $route->min) || 
                ($moveMeeple == 2 && $iRoute->max > $route->max)
            ) {
                $route = $iRoute;
            }
        }
        return $route;
    }

    function applyTomCompanyEffect(int $moveCompany) {
        $company = $this->incTomCompany($moveCompany);
        $this->incTomScore($company, clienttranslate('${player_name} moves band token ${incCompany} spaces and gains ${points} bursts of light with played tile'), [
            'incCompany' => $moveCompany,
            'company' => $company,
        ]);
    }

    function applyTomScoreEffect(int $moveScore) {
        $this->incTomScore($moveScore, clienttranslate('${player_name} gains ${points} bursts of light with played tile'));
    }

    function applyTomMeepleEffectForSide1() {
        $currentPosition = $this->getPlayerEncampment(0)->position;
        $currentPoints = $this->MAP1[$currentPosition]->points;
        $mapSpot = $this->MAP1[14]; 
        $mapSpotPosition = 14;

        foreach($this->MAP1 as $position => $iMapSpot) { 
            if ($iMapSpot->points > $currentPoints && $iMapSpot->points < $mapSpot->points) {
                $mapSpot = $iMapSpot;
                $mapSpotPosition = $position;
            }
        }

        $this->movePlayerEncampment(0, $mapSpotPosition, 0);
    }

    function applyTomMeepleEffectForSide2(int $moveMeeple) {        
        $allBoats = $this->getPlayerMeeples(0);
        foreach($allBoats as $boat) {
            // remove boats that can't move (max distance or all > distances)
            if ($this->getPossibleSoloRoutesForBoat($boat, $moveMeeple, $allBoats) != null) {
                $boats[] = $boat;
            }
        }        

        // get closest to central island
        usort($boats, function($a, $b) {
            $distanceFromCenterA = $this->MAP2[$a->position]->distanceFromCenter;
            $distanceFromCenterB = $this->MAP2[$b->position]->distanceFromCenter;
            if ($distanceFromCenterA == $distanceFromCenterB) {
                return 0;
            }
            return ($distanceFromCenterA < $distanceFromCenterB) ? -1 : 1;
        });

        // select boat closest to center island
        $boat = $boats[0];

        $route = $this->getPossibleSoloRoutesForBoat($boat, $moveMeeple, $allBoats);
        $this->movePlayerBoat(0, $route->destination, $boat->position);
    }
    
    function applyTomEffects(object $soloTile) {

        if ($soloTile->location != 'meeting') {
            throw new BgaUserException("Solo tile not available");
        }

        if ($soloTile->moveCompany > 0) {
            $this->applyTomCompanyEffect($soloTile->moveCompany);
        }

        if ($soloTile->moveScore > 0) {
            $this->applyTomScoreEffect($soloTile->moveScore);
        }

        if ($soloTile->moveMeeple > 0) {            
            $side = $this->getSide();
            if ($side == 1) {
                $this->applyTomMeepleEffectForSide1();
            } else if ($side == 2) {
                $this->applyTomMeepleEffectForSide2($soloTile->moveMeeple);
            }
        }

        $this->soloTiles->moveCard($soloTile->id, 'discard');
    }

    function updateSoloDeck(int $spot) {
        if (intval($this->soloTiles->countCardInLocation('deck')) == 0) {
            $day = intval($this->getGameStateValue(SOLO_DECK));
            if ($day == 1) { // we finish solo tiles for the first time
                $this->setGameStateValue(SOLO_DECK, 2);

                $this->soloTiles->moveAllCardsInLocation('discard', 'deck');
                $this->soloTiles->shuffle('deck');

                // move all type1 companions from the deck to discard and use B cards
                $this->companions->moveAllCardsInLocation('deck', 'discard');
                $this->companions->moveAllCardsInLocation('deckB', 'deck');
            } else if ($day == 2) { // we finish solo tiles for the second time
                $this->setGameStateValue(SOLO_DECK, 3);
            }
        }

        $newSoloTileDb = $this->soloTiles->pickCardForLocation('deck', 'meeting', $spot);
        $newSoloTile = $newSoloTileDb != null ? $this->getSoloTileFromDb($newSoloTileDb) : null;

        $this->notifyAllPlayers('updateSoloTiles', '', [
            'topDeckType' => $this->getTopDeckType(),
            'topDeckBType' => intval($this->companions->countCardInLocation('deckB')) > 0 ? 2 : 0,
            'discardedSoloTiles' => intval($this->soloTiles->countCardInLocation('discard')),
            'spot' => $spot,
            'soloTile' => $newSoloTile,
        ]);
    }

    function soloEndRecruit() {
        $dice = $this->getDiceByLocation('meeting');
        $bigDice = [];
        $smallDice = [];

        // remove footprints tokens on big dice and roll big & small dice
        foreach($dice as $die) {
            if ($die->small) {
                $smallDice[] = $die;
            } else {
                $bigDice[] = $die;
                $spot = $die->location_arg;
                $this->removeMeetingTrackFootprints($spot);
            }
        }

        $this->rollAndPlaceTomDice($bigDice);

        // If a die indicates a -2 burst of light or a footprint symbol, it must be rerolled until it indicates a color
        foreach($smallDice as &$idie) {
            while ($idie->value > 6 || $idie->value < 0) {
                $idie->roll();
            }
        }

        $this->moveSmallDiceToMeetingTrack($smallDice, false);
    }

    function provinceOfShadowLastMove() {
        $villages = array_filter($this->MAP1, fn($spot) => $spot->canSettle);
        uasort($villages, fn($spot1, $spot2) => $spot1->points - $spot2->points);

        $tomEncampment = $this->getPlayerEncampment(0);

        $getNextVillage = $tomEncampment->position == 0;
        $nextVillage = null;
        foreach ($villages as $position => $village) {
            if ($getNextVillage) {
                $nextVillage = $village;
                break;
            }
            if ($tomEncampment->position == $position) {
                $getNextVillage = true;
            }
        }

        if ($nextVillage !== null && $this->canPayFootprints(0, $nextVillage->effects)) {
            $this->movePlayerEncampment(0, $position);

            $footprintsCost = 0;
            foreach($nextVillage->effects as $cost) {
                if ($cost < -20 && $cost > -30) {
                    $footprintsCost += (-$cost) - 20;
                }
            }

            $this->removePlayerFootprints(0, $footprintsCost);
        }
    }

}
