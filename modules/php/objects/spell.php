<?php

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