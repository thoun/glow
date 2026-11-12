<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class CompanionCard {
    /**
     * @param Effect|null $effect
     */
    public function __construct(
        public string $name,
        public int $points,
        public $effect = null,
        public int $fireflies = 0,
        public int $reroll = 0,
        public bool $die = false,
        public int $dieColor = 0,
    ) {
    }
}
