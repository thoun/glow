<?php

// 0 : joker
// 1/5 : color, -1/-5 : forbidden color
// +1x : fireflies
// +2x, -2x : footprints
// 30 : reroll, 33 skull, 34 black die, 35 resurect, 36 spell, 37 skull/spell
// +10x, -10x : points

class SpellCard {
    public /*object*/ $effect;
    public /*int*/ $number;
  
    public function __construct(object $effect, int $number = 1) {
        $this->effect = $effect;
        $this->number = $number;
    } 
}

class Spell {
    public $id;
    public $location;
    public $location_arg;
    public $type;
    public $visible;
    public /*Effect|null*/ $effect;

    public function __construct($dbCard, $SPELLS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->visible = boolval($dbCard['type_arg']);

        $spellCard = $SPELLS[$this->type];
        $this->effect = $spellCard->effect;
    } 
}
?>