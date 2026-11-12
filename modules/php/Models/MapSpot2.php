<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class MapSpot2 extends MapSpot {
    public /*int*/ $distanceFromCenter; // only for side 2 & solo mode

    public function __construct(int $position, array $effects, array $routes, $points, $distanceFromCenter) {
        parent::__construct($position, $effects, $routes, $points);
        $this->distanceFromCenter = $distanceFromCenter;
    } 
}
