<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class UriomIntervention {
    public function __construct(
        public int $activePlayerId,
        public int $uriomPlayerId,
        public int $spot,
    ) {
    }

    public /*bool|null*/ $activated = null;
}
