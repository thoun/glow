<?php

trait UtilTrait {

    //////////////////////////////////////////////////////////////////////////////
    //////////// Utility functions
    ////////////

    function getFirstPlayerId() {
        return intval(self::getGameStateValue(FIRST_PLAYER));
    }
}
