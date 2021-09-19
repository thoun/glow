<?php

// 0 : joker
// 1/5 : color, -1/-5 : forbidden color
// +1x : fireflies
// +2x, -2x : footprints
// 30 : reroll, 33 skull, 34 black die, 35 resurect, 36 spell, 37 skull/spell
// +10x, -10x : points

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

class Spell extends Effect {
    public $id;
    public $location;
    public $location_arg;
    public $type;
    public $visible;

    public function __construct($dbCard, $SPELLS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->visible = boolval($dbCard['type_arg']);

        $spellCard = $SPELLS[$this->type];
        $this->conditions = $spellCard->conditions;
        $this->effects = $spellCard->effects;
    } 
}
?>