<?php

class MapRoute {
    public /*int*/ $destination;
    public /*int[]*/ $effects;
    public /*int*/ $min;
    public /*int*/ $max;

    public /*int[]*/ $costForPlayer;

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
    public /*MapRoute*/ $routes;
    public /*bool*/ $canSettle; // only for side 1 : encampments

    public function __construct($position, $effects, $routes, $canSettle = false) {
        $this->position = $position;
        $this->effects = $effects;
        $this->routes = $routes;
        $this->canSettle = $canSettle;
    } 
}
?>