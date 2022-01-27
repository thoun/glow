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

        $sql .= implode(',', $values);
        self::DbQuery($sql);
    }    

    function getPlayerMeeples(int $playerId, $type = null) {
        $sql = "SELECT * FROM meeple WHERE `player_id` = $playerId";
        if ($type !== null) {
            $sql .= " AND `type` = $type";
        }
        $dbMeeples = self::getCollectionFromDB($sql);
        return array_map(fn($dbMeeples) => new Meeple($dbMeeples), array_values($dbMeeples));
    }

    function getPlayerCompany(int $playerId) {
        return $this->getPlayerMeeples($playerId, 1)[0];
    }

    function getPlayerEncampment(int $playerId) {
        return $this->getPlayerMeeples($playerId, 2)[0];
    }

    function movePlayerCompany(int $playerId, int $position, int $from) {
        self::DbQuery("UPDATE meeple SET `position` = $position WHERE `player_id` = $playerId AND `type` = 1");
        
        $this->addVisitedMapSpot($playerId, $from);
        
        self::notifyAllPlayers('meepleMoved', '', [
            'meeple' => $this->getPlayerCompany($playerId),
        ]);
    }

    function movePlayerEncampment(int $playerId, int $position) {
        self::DbQuery("UPDATE meeple SET `position` = $position WHERE `player_id` = $playerId AND `type` = 2");
        
        self::notifyAllPlayers('meepleMoved', '', [
            'meeple' => $this->getPlayerEncampment($playerId),
        ]);
    }

    function movePlayerBoat(int $playerId, int $position, int $from) {
        $boats = $this->getPlayerMeeples($playerId, 0);
        $boat = $this->array_find($boats, fn($b) => $b->position == $from);

        $boat->position = $position;
        $sql = "UPDATE meeple SET `position` = $position WHERE `id` = $boat->id";
        if ($from != null) {
            $sql .= " AND `position` = $from";
        }
        self::DbQuery($sql);
        
        self::notifyAllPlayers('meepleMoved', '', [
            'meeple' => $boat,
        ]);
    }

    function getMapSpot(int $side, int $position) {
        foreach($this->MAPS[$side] as $spot) {
            if ($spot->position === $position) {
                return $spot;
            }
        } 
    }

    function getMapSpotPoints(int $side, int $position) {
        $mapSpot = $this->getMapSpot($side, $position);
        return $mapSpot->points;
    }

    function canSettle(int $playerId) {
        $company = $this->getPlayerCompany($playerId);
        $position = $company->position;
        $mapSpot = $this->getMapSpot(1, $position);

        if (!$mapSpot->canSettle) {
            return false;
        }

        $encampment = $this->getPlayerEncampment($playerId);

        return $encampment->position != $position;
    }

    function getMapFinalScore(int $side, int $playerId) {
        $points = 0;

        if ($side === 1) {

            $encampment = $this->getPlayerEncampment($playerId);
            $points = $this->getMapSpotPoints($side, $encampment->position);

        } else if ($side === 2) {
            
            $boats = $this->getPlayerMeeples($playerId, 0);
            foreach($boats as $boat) {
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
                $routeToSpot = $this->array_find($spot->routes, fn($route) => $route->destination == $position);
                if ($routeToSpot !== null) {
                    $routes[] = new MapRoute($spot->position, $routeToSpot->effects, $routeToSpot->min, $routeToSpot->max);
                }
            }
        } 

        return $routes;
    }

    function getVisitedMapSpots(int $playerId) {
        $json_obj = self::getUniqueValueFromDB("SELECT `visited_spots` FROM `player` WHERE `player_id` = $playerId");
        if ($json_obj) {
            return json_decode($json_obj, true);
        } else {
            return [];
        }
    }

    function addVisitedMapSpot(int $playerId, int $position) {
        $visitedSpots = $this->getVisitedMapSpots($playerId);
        $visitedSpots[] = $position;
        $jsonObj = json_encode($visitedSpots);
        self::DbQuery("UPDATE `player` SET `visited_spots` = '$jsonObj' WHERE `player_id` = $playerId");
    }

    private function canPayFootprints(int $playerId, array $costForPlayer) {
        $footprintsCost = 0;
        foreach($costForPlayer as $cost) {
            if ($cost < -20 && $cost > -30) {
                $footprintsCost += (-$cost) - 20;
            }
        }

        return $footprintsCost == 0 ? 
            true : 
            $footprintsCost <= $this->getPlayerFootprints($playerId);
    }

    function getPossibleRoutesForPlayer(int $side, int $position, int $playerId) {
        $possibleRoutes = [];
        $routes = $this->getRoutes($side, $position);

        if ($side === 1) {
            $visitedSpots = $this->getVisitedMapSpots($playerId);
            $routes = array_values(array_filter($routes, fn($route) => !in_array($route->destination, $visitedSpots)));
        }

        $footprints = $this->getPlayerFootprints($playerId);
        $dice = $this->getEffectiveDice($playerId, false);

        foreach($routes as $route) {

            if ($side === 1) {
                $effects = $this->getMapSpot($side, $route->destination)->effects;

                $allDice = $this->getEffectiveDice($playerId, null);
                
                $canGoToDestination = true;
                $usedFootprints = 0;

                foreach($effects as $effect) {
                    if ($effect >= -5 && $effect <= -1 && $this->array_some($allDice, fn($die) => $die->value == -$effect)) {
                        if ($usedFootprints < $footprints) {
                            $usedFootprints++;
                        } else {
                            $canGoToDestination = false;
                        }
                    } else if ($effect < -20 && $effect > -30 && $footprints < -($effect + 20)) {
                        $canGoToDestination = false;
                    } else if ($effect >= 1 && $effect <= 5 && !$this->array_some($dice, fn($die) => $die->value == $effect)) {
                        if ($usedFootprints < $footprints) {
                            $usedFootprints++;
                        } else {
                            $canGoToDestination = false;
                        }
                    }
                }

                if ($canGoToDestination) {
                    $routeWithCost = $route->withCostForPlayer(array_merge($effects, $route->effects));
                    if ($usedFootprints > 0) {
                        $routeWithCost = $routeWithCost->withCostForPlayer(array_merge($routeWithCost->costForPlayer, [-20 - $usedFootprints]));
                    } 

                    $canPayFootprints = $this->canPayFootprints($playerId, $routeWithCost->costForPlayer);
                    if ($canPayFootprints) {
                        $possibleRoutes[] = $routeWithCost;
                    }
                }
    
            } else if ($side === 2) {
                
                $groups = [];
                foreach ($dice as $playerDie) {
                    if ($playerDie->value <= 5) {
                        $groups[$playerDie->value] = true;
                    }
                }
                $colors = count($groups);

                $canGoForFree = $route->min === null || ($colors >= $route->min && $colors <= $route->max);
                $canGoByPaying = 0;
                if (!$canGoForFree && $colors < $route->min && ($route->min - $colors) <= $footprints) {
                    $canGoByPaying = $route->min - $colors;
                }
                
                if ($canGoForFree || $canGoByPaying > 0) {
                    $effects = $canGoByPaying > 0 ? array_merge($route->effects, [-20 - $canGoByPaying]) : $route->effects;

                    $destinationEffects = $this->getMapSpot($side, $route->destination)->effects;
                    $routeWithCost = $route->withCostForPlayer(array_merge($effects, $destinationEffects));

                    $canPayFootprints = $this->canPayFootprints($playerId, $routeWithCost->costForPlayer);
                    if ($canPayFootprints) {
                        $possibleRoutes[] = $routeWithCost;
                    }
                }
            }
        }

        return $possibleRoutes;
    }
}
