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

        return $this->setTom($tom);
    }

    function setTom(object $tom) {
        $jsonObj = json_encode($tom);
        self::DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('TOM', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getTom() {
        $json_obj = self::getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = 'TOM'");
        if ($json_obj) {
            $tom = json_decode($json_obj);
            return $tom;
        } else {
            return null;
        }
    }

    function setTomDice(array $dice) {
        $tom = $this->getTom();

        $tom->dice = $dice;

        $this->setTom($tom);
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

        self::notifyAllPlayers('points', $message, $params + [
            'playerId' => 0,
            'player_name' => 'Tom',
            'points' => $incScore,
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

    function placeSoloTilesOnMeetingTrack() {
        for ($i=1;$i<=5;$i++) {
            $this->soloTiles->pickCardForLocation('deck', 'meeting', $i);
        }
    }
    
    function applyTomEffects(int $spot) {
        $soloTile = $this->getSoloTilesFromDb($this->soloTiles->getCardsInLocation('meeting', $spot))[0];

        if ($soloTile->location != 'meeting') {
            throw new BgaUserException("Solo tile not available");
        }

        if ($soloTile->moveCompany > 0) {
            $company = $this->incTomCompany($soloTile->moveCompany);
            $this->incTomScore($company, _('${player_name} moves band token ${incCompany} spaces and gains ${points} bursts of light with played tile'), [
                'incCompany' => $soloTile->moveCompany,
                'company' => $company,
            ]);
        }

        if ($soloTile->moveScore > 0) {
            $this->incTomScore($soloTile->moveScore, _('${player_name} gains ${points} bursts of light with played tile'));
        }

        if ($soloTile->moveMeeple > 0) {            
            $side = $this->getSide();
            if ($side == 1) {
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

                $this->movePlayerCompany(0, $mapSpotPosition, 0);
            } else if ($side == 2) {
                /*$this->movePlayerBoat($playerId, $route->destination, $route->from);*/
                // TODO `<div>${dojo.string.substitute(_("Move one of Tom’s boats via the path by the ${lowesthighest} value"), { lowesthighest: $soloTile->moveMeeple == 2 ? _("highest") : _("lowest") })}</div>`;
                /*
                Important: the path with a value of 1/2 on the right of the
central island is forbidden.
Example: from the central island, if the tile is marked
“max” the player moves one of the boats to the next island
via the path with a value of 4. If the tile is marked “min”,
the player moves it via the path with a value of 1/2 on the
bottom left.
Choosing which boat to move:
Take into account all boats which can still move away
from the central island. A boat that has gone as far as
possible from the central island cannot be moved any
more.
First move a boat that is on the central island. If there is
none, move the one closest to that island. If there is more
than one boat to choose from, the choice is yours.
*/
            }
        }

        $this->soloTiles->moveCard($soloTile->id, 'discard');

        if (intval($this->soloTiles->countCardInLocation('deck')) == 0) {
            $day = intval($this->getGameStateValue(DAY));
            if ($day == 1) { // we finish solo tiles for the first time
                self::setGameStateValue(DAY, 2);

                $this->soloTiles->moveAllCardsInLocation('discard', 'deck');
                $this->soloTiles->shuffle('deck');

                // TODO move all type1 companions from the deck to discard

                // TODO notif
            } else if ($day == 2) { // we finish solo tiles for the second time
                self::setGameStateValue(DAY, 3);
            }
        }

        $this->soloTiles->pickCardForLocation('deck', 'meeting', $spot);
        // TODO notif
    }

}
