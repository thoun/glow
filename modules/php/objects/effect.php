<?php

// 0 : joker
// 1/5 : color, -1/-5 : forbidden color
// +1x, -1x : points
// +2x, -2x : footprints
// 30 : reroll, 31 firefly, 32 fireflies, 33 skull, 34 black die, 35 resurect, 36 spell

class Effect {
    public /*int[]*/ $conditions;
    public /*int[]*/ $effects;
    public /*int*/ $number;
  
    public function __construct(array $conditions, array $effects, int $number = 1) {
        $this->conditions = $conditions;
        $this->effects = $effects;
        $this->number = $number;
    } 
}

class EffectToken extends Effect {
    public $id;
    public $location;
    public $location_arg;
    public $type;

    public function __construct($dbCard, $EFFECTS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);

        $effectCard = $EFFECTS[$this->type];
        $this->conditions = $effectCard->conditions;
        $this->effects = $effectCard->effects;
    } 
}
?>