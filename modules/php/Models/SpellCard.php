<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class SpellCard {
    public function __construct(
        public object $effect,
        public int $number = 1,
    ) {
    }
}
