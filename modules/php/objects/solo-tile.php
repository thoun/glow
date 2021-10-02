<?php

class SoloTileCard {
    public /*int*/ $moveCompany;
    public /*int*/ $moveScore;
    public /*int*/ $moveMeeple; // 0 for nothing, 1 for min, 2 for max
  
    public function __construct(int $moveCompany = 0, int $moveScore = 0, int $moveMeeple = 0) {
        $this->moveCompany = $moveCompany;
        $this->moveScore = $moveScore;
        $this->moveMeeple = $moveMeeple;
    } 
}

class SoloTile {
    public $id;
    public $location;
    public $location_arg;
    public $type;
    public /*int*/ $moveCompany;
    public /*int*/ $moveScore;
    public /*int*/ $moveMeeple; // 0 for nothing, 1 for min, 2 for max

    public function __construct($dbCard, $SOLO_TILES) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->location_arg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);

        $soloTileCard = $SOLO_TILES[$this->type];
        $this->moveCompany = $soloTileCard->moveCompany;
        $this->moveScore = $soloTileCard->moveScore;
        $this->moveMeeple = $soloTileCard->moveMeeple;
    } 
}
?>