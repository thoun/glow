<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class SoloTileCard {
    /**
     * @param int $moveMeeple 0 for nothing, 1 for min, 2 for max
     */
    public function __construct(
        public int $moveCompany = 0,
        public int $moveScore = 0,
        public int $moveMeeple = 0,
    ) {
    }
}
