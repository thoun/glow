<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

// 0 : joker
// 1/5 : color, -1/-5 : forbidden color
// +1x : fireflies
// +2x, -2x : footprints
// 33 skull, 34 black die, 35 resurect, 36 spell, 37 skull/spell
// +4x, -4x: rerolls
// +5x, -50x tokens
// +6x : exchange tokens
// +10x, -10x : points
// 20x, 20y : min/max colors

class Effect {
    /**
     * @param int[] $conditions
     * @param int[] $effects
     */
    public function __construct(
        public array $conditions,
        public array $effects,
        int $number = 1,
    ) {
    }
}
