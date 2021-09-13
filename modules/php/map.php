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
        foreach($this->MAPS[$side] as $spot) {
            if ($spot->position === $position) {
                return $spot;
            }
        } 
    }

    function getMapSpotPoints(int $side, int $position) {
        $mapSpot = $this->getMapSpot(1, $position);

        $pointEffect = $this->array_find($mapSpot->effects, function($effect) { return $effect > 100; });
        if ($pointEffect !== null) {
            return $pointEffect - 100;
        } else {
            return 0;
        }
    }

    function canSettle(int $playerId, int $position) {
        $mapSpot = $this->getMapSpot(1, $position);

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
                $mapSpot = $this->getMapSpot($position);
                $points += $this->getMapSpotPoints($side, $boat->position);
            }
            
        }
        
        return $points;
    }
    
    function getRoutes(int $side, int $position) {
        $routes = [];

        foreach($this->MAPS[$side] as $spot) {
            if ($spot->position === $position) {
                $routes = array_merge($routes, $spot->routes);
            } else {
                $routeToSpot = $this->array_find($spot->routes, function ($route) use ($position) { return $route->destination == $position; });
                if ($routeToSpot !== null) {
                    $routes[] = new MapRoute($spot->position, $routeToSpot->effects, $routeToSpot->min, $routeToSpot->max);
                }
            }
        } 

        return $routes;
    }

    function getPossibleRoutesForPlayer(int $side, int $position, int $playerId) {
        $possibleRoutes = [];
        $routes = $this->getRoutes($side, $position);

        $footprints = $this->getPlayerFootprints($playerId);

        foreach($routes as $route) {

            if ($side === 1) {
    
                // TODO
    
            } else if ($side === 2) {
                $playerDice = $this->getDiceByLocation('player', $playerId, false);
                
                $groups = [];
                foreach ($playerDice as $playerDie) {
                    if ($playerDie->value <= 5) {
                        $groups[$playerDie][] = $playerDie;
                    }
                }
                $colors = count($groups);

                $canGoForFree = $route->min === null || ($colors >= $route->min && $colors <= $route->max);
                $canGoByPaying = 0;
                if (!$canGoForFree && $colors < $route->min && ($route->min - $colors) < $footprints) {
                    $canGoByPaying = $route->min - $colors;
                }
                if ($canGoForFree || $canGoByPaying > 0) {
                    $effects = array_merge($route->effects, [20 + $canGoByPaying]);
                    // TODO check player can afford $effects

                    $route->costForPlayer = $effects;

                    $possibleRoutes[] = $route;
                }
            }
        }

        return $possibleRoutes;
    }
}
