<?php

class CompanionCard {
    public /*string*/ $name;
    public /*int*/ $points;
    public /*EffectCard|null*/ $effect;
    public /*bool*/ $reroll;
    public /*int*/ $fireflies;
    public /*bool*/ $die;
    public /*int*/ $dieColor;
  
    public function __construct(string $name, int $points, /*object|null*/ $effect = null, bool $reroll = false, int $fireflies = 0, bool $die = false, int $dieColor = 0) {
        $this->name = $name;
        $this->points = $points;
        $this->effect = $effect;
        $this->reroll = $reroll;
        $this->fireflies = $fireflies;
        $this->die = $die;
        $this->dieColor = $dieColor;
    } 
}

class Companion extends CompanionCard {
    public $id;
    public $location;
    public $location_arg;
    public $type; // 1 = A, 2 = B
    public $subType; // index (1-23)
    public /*bool*/ $rerollUsed;

    public function __construct($dbCard, $COMPANIONS) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->subType = intval($dbCard['type_arg']);
        $this->rerollUsed = boolval($dbCard['reroll_used']);


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