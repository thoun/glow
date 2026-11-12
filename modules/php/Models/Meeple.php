<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

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
