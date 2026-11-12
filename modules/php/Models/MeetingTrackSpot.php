<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class MeetingTrackSpot {
    /**
     * @param Companion|null $companion
     * @param Dice[] $dice
     * @param SoloTile|null $soloTile
     */
    public function __construct(
        public $companion = null,
        public array $dice = [],
        public int $footprints = 0,
        public $soloTile = null,
    ) {
    }
}
