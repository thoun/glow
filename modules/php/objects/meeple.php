<?php

class Meeple {
    public $id;
    public $playerId;
    public $type;
    public $position;

    public function __construct($dbDice) {
        $this->id = intval($dbDice['id']);
        $this->playerId = intval($dbDice['player_id']);
        $this->type = intval($dbDice['type']);
        $this->position = intval($dbDice['position']);
    } 
}
?>