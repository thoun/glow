<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class MapRoute {
    public /*int*/ $destination;
    public /*int[]*/ $effects;
    public /*int*/ $min;
    public /*int*/ $max;

    public /*int[]*/ $costForPlayer;
    public /*int*/ $from;

    public function __construct(int $destination, $effects = [], $min = null, $max = null) {
        $this->destination = $destination;
        $this->effects = $effects;
        $this->min = $min;
        $this->max = $max == null ? $min : $max;
    } 

    // keep route immutable
    public function withCostForPlayer(array $costForPlayer) {
        $newRoute = new MapRoute($this->destination, $this->effects, $this->min, $this->max);
        $newRoute->costForPlayer = $costForPlayer;
        return $newRoute;
    }
}
