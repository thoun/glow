<?php

trait SoloUtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    /*function isSoloMode() {
        return count($this->loadPlayersBasicInfos()) == 1;
    }*/

    function initTom() {
        $tom = new stdClass();
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
}
