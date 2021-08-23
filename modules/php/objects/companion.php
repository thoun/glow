<?php

class CompanionCard {
    public /*int*/ $points;
    public /*int*/ $produce; // 0 = charcoalium, 1 = wood, 2 = copper, 3 = crystal, 9 = *
    public /*array*/ $cost;
  
    public function __construct(int $points, int $produce, array $cost) {
        $this->points = $points;
        $this->produce = $produce;
        $this->cost = $cost;
    } 
}

class Companion extends CompanionCard {
    public $id;
    public $location;
    public $location_arg;
    public $type; // color : 1 = blue, 2 = purple, 3 = red, 4 = yellow
    public $subType; // index (1-based) on rulebook
    public $resources; //array?
    public $payments; //array?

    public function __construct($dbCard, $CompanionS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->subType = intval($dbCard['type_arg']);

        $CompanionCard = $CompanionS[$this->type * 10 + $this->subType];
        $this->points = $CompanionCard->points;
        $this->produce = $CompanionCard->produce;
        $this->cost = $CompanionCard->cost;
    } 
}
?>