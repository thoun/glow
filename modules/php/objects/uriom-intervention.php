<?php

class UriomIntervention {
    public int $activePlayerId;
    public int $uriomPlayerId;
    public int $spot;
    public /*bool|null*/ $activated = null;
  
    public function __construct(int $activePlayerId, int $uriomPlayerId, int $spot) {
        $this->activePlayerId = $activePlayerId;
        $this->uriomPlayerId = $uriomPlayerId;
        $this->spot = $spot;
    } 
}
?>