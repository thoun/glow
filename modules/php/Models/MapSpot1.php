<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class MapSpot1 extends MapSpot {
    public /*bool*/ $canSettle; // only for side 1 : encampments

    public function __construct(int $position, array $effects, array $routes, $points = 0, $canSettle = false) {
        parent::__construct($position, $effects, $routes, $points);
        $this->canSettle = $canSettle;
    } 
}
