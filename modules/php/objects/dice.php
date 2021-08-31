<?php

class Dice {
    public $id;
    public $face;
    public $value;
    public $color;
    public $small;
    public $location;
    public $location_arg;

    public function __construct($dbDice) {
        $this->id = intval($dbDice['die_id']);
        $this->color = intval($dbDice['color']);
        $this->setFace(intval($dbDice['die_face'])); // after color
        $this->small = boolval($dbDice['small']);
        $this->location = $dbDice['location'];
        $this->location_arg = intval($dbDice['location_arg']);
    } 

    public function roll() {
        $this->setFace(bga_rand(1, 6));
    }

    public function setFace($face) {
        $this->face = $face;
        if ($face == 6) {
            if ($this->color === 8) {
                $this->value = -102;
            } else if ($this->color === 7) {
                $this->value = 103;
            } else if ($this->color === 6) {
                $this->value = 22;
            } else {
                $this->value = $this->color;
            }
        } else {
            $this->value = $face;
        }
    }
}
?>