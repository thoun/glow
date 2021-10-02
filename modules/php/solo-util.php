<?php

trait SoloUtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function isSoloMode() {
        return count($this->loadPlayersBasicInfos()) == 1;
    }

    function initTom() {
        $tom = new stdClass();
        $tom->id = 0;
        $tom->score = 0;
        $tom->rerolls = 0;
        $tom->footprints = 0;
        $tom->fireflies = 0;

        return $this->setTom($tom);
    }

    function setTom(object $tom) {
        $jsonObj = json_encode($tom);
        self::DbQuery("INSERT INTO `global_variables`(`name`, `value`)  VALUES ('TOM', '$jsonObj') ON DUPLICATE KEY UPDATE `value` = '$jsonObj'");
    }

    function getTom() {
        $json_obj = self::getUniqueValueFromDB("SELECT `value` FROM `global_variables` where `name` = 'TOM'");
        if ($json_obj) {
            $tom = json_decode($json_obj);
            return $tom;
        } else {
            return null;
        }
    }

    function setTomDice(array $dice) {
        $tom = $this->getTom();

        $tom->dice = $dice;

        $this->setTom($tom);
    }

    function placeSoloTilesOnMeetingTrack() {
        for ($i=1;$i<=5;$i++) {
            $this->soloTiles->pickCardForLocation('deck', 'meeting', $i);
        }
    }
}
