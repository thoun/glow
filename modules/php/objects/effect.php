<?php

// 0 : joker
// 1/5 : color, -1/-5 : forbidden color
// +1x : fireflies
// +2x, -2x : footprints
// 33 skull, 34 black die, 35 resurect, 36 spell, 37 skull/spell
// +4x, -4x: rerolls
// +10x, -10x : points
// 20x, 20y : min/max colors
// 300 : exchange token, +30x, -30x tokens

class Effect {
    public /*int[]*/ $conditions;
    public /*int[]*/ $effects;
  
    public function __construct(array $conditions, array $effects, int $number = 1) {
        $this->conditions = $conditions;
        $this->effects = $effects;
    } 
}
?>