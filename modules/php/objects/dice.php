<?php

class Dice {
    public $id;
    public $value;
    public $color;
    public $small;
    public $location;
    public $location_arg;

    public function __construct($dbDice) {
        $this->id = intval($dbDice['die_id']);
        $this->value = intval($dbDice['die_value']);
        $this->color = intval($dbDice['color']);
        $this->small = boolval($dbDice['small']);
        $this->location = $dbDice['location'];
        $this->location_arg = intval($dbDice['location_arg']);
    } 
}
?>