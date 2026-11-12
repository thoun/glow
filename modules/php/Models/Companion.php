<?php
declare(strict_types=1);

namespace Bga\Games\Glow\Models;

class Companion extends CompanionCard {
    public int $id;
    public string $location;
    public int $location_arg;
    public int $type; // 1 = A, 2 = B
    public int $subType; // index (1-23)

    public /*bool|null*/ $noDieWarning;

    public function __construct($dbCard, $COMPANIONS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->subType = intval($dbCard['type_arg']);

        $companionCard = $COMPANIONS[$this->subType];
        $this->name = $companionCard->name;
        $this->points = $companionCard->points;
        $this->effect = $companionCard->effect;
        $this->reroll = $companionCard->reroll;
        $this->fireflies = $companionCard->fireflies;
        $this->die = $companionCard->die;
        $this->dieColor = $companionCard->dieColor;
    } 
}
