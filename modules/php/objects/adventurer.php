<?php

class AdventurerCard {
    public /*int*/ $points;
    public /*int*/ $produce; // 0 = charcoalium, 1 = wood, 2 = copper, 3 = crystal, 9 = *
    public /*array*/ $cost;
  
    public function __construct(int $points, int $produce, array $cost) {
        $this->points = $points;
        $this->produce = $produce;
        $this->cost = $cost;
    } 
}

class Adventurer extends AdventurerCard {
    public $id;
    public $location;
    public $location_arg;
    public $type; // color : 1 = blue, 2 = purple, 3 = red, 4 = yellow
    public $subType; // index (1-based) on rulebook
    public $resources; //array?
    public $payments; //array?

    public function __construct($dbCard, $AdventurerS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->subType = intval($dbCard['type_arg']);

        $AdventurerCard = $AdventurerS[$this->type * 10 + $this->subType];
        $this->points = $AdventurerCard->points;
        $this->produce = $AdventurerCard->produce;
        $this->cost = $AdventurerCard->cost;
    } 
}
?>