<?php

class MapRoute {
    public /*int*/ $destination;
    public /*int[]*/ $effects;
    public /*int*/ $min;
    public /*int*/ $max;

    public /*int[]*/ $costForPlayer;
    public /*int*/ $from;

    public function __construct(int $destination, $effects = [], $min = null, $max = null) {
        $this->destination = $destination;
        $this->effects = $effects;
        $this->min = $min;
        $this->max = $max == null ? $min : $max;
    } 
}

class MapSpot {
    public /*int*/ $position;
    public /*int[]*/ $effects;
    public /*MapRoute[]*/ $routes;
    public /*int*/ $points;
    public /*bool*/ $canSettle; // only for side 1 : encampments

    public function __construct(int $position, array $effects, array $routes, $points = 0, $canSettle = false) {
        $this->position = $position;
        $this->effects = $effects;
        $this->routes = $routes;
        $this->points = $points;
        $this->canSettle = $canSettle;
    } 
}
?>