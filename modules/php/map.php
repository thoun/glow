<?php

require_once(__DIR__.'/objects/map-spot.php');

trait MapTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function createMeeples(array $playersIds) {
        $side = $this->getSide();

        $sql = "INSERT INTO meeple (`player_id`, `type`) VALUES ";
        $values = [];
        
        foreach($playersIds as $playerId) {
            if ($side === 1) {
                $values[] = "($playerId, 1)"; // company
                $values[] = "($playerId, 2)"; // encampment
            } else if ($side === 2) {
                for ($i=0; $i<4; $i++) {
                    $values[] = "($playerId, 0)"; // boat
                }
            }
        }

        $sql .= implode($values, ',');
        self::DbQuery($sql);
    }    

    function getPlayerMeeples(int $playerId, $type = null) {
        $sql = "SELECT * FROM meeple WHERE `player_id` = $playerId";
        if ($type !== null) {
            $sql .= " AND `type` = $type";
        }
        $dbMeeples = self::getCollectionFromDB($sql);
        return array_map(function($dbMeeples) { return new Meeple($dbMeeples); }, array_values($dbMeeples));
    }

    function getPlayerCompany(int $playerId) {
        return $this->getPlayerMeeples($playerId, 1)[0];
    }

    function getPlayerEncampment(int $playerId) {
        return $this->getPlayerMeeples($playerId, 2)[0];
    }

    function getMapSpot(int $side, int $position) {
        foreach($this->MAP[$side] as $spot) {
            if ($spot->position === $position) {
                return $spot;
            }
        } 
    }

    function getMapSpotPoints(int $side, int $position) {
        $mapSpot = $this->getMapSpot(1, $poition);

        $pointEffect = $this->array_find($encampment->effects, function($effect) { return $effect > 100; });
        if (!$pointEffect !== null) {
            return $pointEffect - 100;
        } else {
            return 0;
        }
    }

    function canSettle(int $playerId, int $position) {
        $mapSpot = $this->getMapSpot(1, $poition);

        if (!$mapSpot->canSettle) {
            return false;
        }

        $encampment = $this->getPlayerEncampment($playerId);

        return $encampment->position != $position; // TODO check conditions here ?
    }

    function getMapFinalScore(int $side, int $playerId) {
        $points = 0;

        if ($side === 1) {

            $encampment = $this->getPlayerEncampment($playerId);
            $points = $this->getMapSpotPoints($side, $encampment->position);

        } else if ($side === 2) {
            
            $boats = $this->getPlayerMeeples($playerId, 0);
            foreach($boats as $boat) {
                $mapSpot = $this->getMapSpot($poition);
                $points += $this->getMapSpotPoints($side, $boat->position);
            }
            
        }
        
        return $points;
    }
        
}
