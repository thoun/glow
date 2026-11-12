<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

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
        $this->name = $AdventurerCard->name;
        $this->points = $AdventurerCard->points;
        $this->dice = $AdventurerCard->dice;
        $this->effect = $AdventurerCard->effect;
    } 
}
