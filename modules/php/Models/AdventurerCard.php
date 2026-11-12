<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class AdventurerCard {
    /**
     * @param Effect|null $effect
     */
    public function __construct(
        public string $name,
        public int $points,
        public int $dice,
        public $effect,
    ) {
    }
}
