<?php

class MeetingTrackSpot {
    public /*Companion*/ $companion;
    public /*Dice[]*/ $dice;
    public /*int*/ $footprints;
  
    public function __construct(/*object|null*/ $companion = null, array $dice = [], int $footprints = 0) {
        $this->companion = $companion;
        $this->dice = $dice;
        $this->footprints = $footprints;
    } 
}
?>