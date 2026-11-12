<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class MapSpot {
    /**
     * @param int[] $effects
     * @param MapRoute[] $routes
     * @param int $points
     */
    public function __construct(
        public int $position,
        public array $effects,
        public array $routes,
        public $points = 0,
    ) {
    }
}
