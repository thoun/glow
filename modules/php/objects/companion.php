<?php

class CompanionCard {
    public string $name;
    public int $points;
    public /*EffectCard|null*/ $effect;
    public int $fireflies;
    public int $reroll;
    public bool $die;
    public int $dieColor;
  
    public function __construct(string $name, int $points, /*object|null*/ $effect = null, int $fireflies = 0, int $reroll = 0, bool $die = false, int $dieColor = 0) {
        $this->name = $name;
        $this->points = $points;
        $this->effect = $effect;
        $this->fireflies = $fireflies;
        $this->reroll = $reroll;
        $this->die = $die;
        $this->dieColor = $dieColor;
    } 
}

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
?>