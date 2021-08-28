<?php

class AdventurerCard {
    public /*int*/ $points;
    public /*int*/ $dice;
    public /*int*/ $effect;
  
    public function __construct(int $points, int $dice, int $effect) {
        $this->points = $points;
        $this->dice = $dice;
        $this->effect = $effect;
    } 
}

class Adventurer extends AdventurerCard {
    public $id;
    public $location;
    public $location_arg;
    public $color; // = type

    public function __construct($dbCard, $ADVENTURERS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->color = intval($dbCard['type']);

        $AdventurerCard = $ADVENTURERS[$this->color];
        $this->points = $AdventurerCard->points;
        $this->dice = $AdventurerCard->dice;
        $this->effect = $AdventurerCard->effect;
    } 
}
?>