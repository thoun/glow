<?php

trait DebugUtilTrait {

//////////////////////////////////////////////////////////////////////////////
//////////// Utility functions
////////////

    function debugSetup() {
        self::DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 200 where `card_type_arg` in (18, 45)");
        //$this->addResource(2343492, 4, 0);
        //$this->debugSetPoints(19);
        $this->debugSkipAdventurers();
        //$this->debugSetProjectInWorkshop(2343492, 2, 1);
        //$this->debugSetProjectInWorkshop(2343492, 3, 4);

        // Activate first player must be commented in setup if this is used
        $this->gamestate->changeActivePlayer(2343492);
    }

    private function debugSkipAdventurers() {
        foreach(array_keys(self::loadPlayersBasicInfos()) as $playerId) {
            $this->adventurers->pickCardForLocation('deck', 'player', $playerId);
        }
        //$this->gamestate->jumpToState(ST_START_ROUND);
    }

    /*private function debugSetPlayerPoints(int $playerId, int $score) {
        self::DbQuery("UPDATE player SET `player_score` = $score where `player_id` = $playerId");
    }

    private function debugSetPoints(int $score) {
        self::DbQuery("UPDATE player SET `player_score` = $score");
    }

    private function debugAddResources(int $playerId, int $number, int $type = -1) {
        if ($type == -1) {
            for ($i=0; $i<=3; $i++) {
                $this->addResource($playerId, $number, $i);
            }
        } else {
            $this->addResource($playerId, $number, $type);
        }
    }

    private function debugGetMachineByTypes($type, $subType, $index = 0) {
        return $this->getMachinesFromDb($this->machines->getCardsOfType($type, $subType))[$index];
    }

    private function debugSetMachineInTable($type, $subType) {
        $card = $this->debugGetMachineByTypes($type, $subType);
        $this->machines->moveCard($card->id, 'table', $this->countMachinesOnTable() + 1);
    }

    private function debugSetMachineInHand($playerId, $type, $subType, $index = 0) {
        $card = $this->debugGetMachineByTypes($type, $subType, $index);
        $this->machines->moveCard($card->id, 'hand', $playerId);
    }

    private function debugSetMachineInWorkshop($playerId, $type, $subType, $index = 0) {
        $card = $this->debugGetMachineByTypes($type, $subType, $index);
        $this->machines->moveCard($card->id, 'player', $playerId);
    }

    private function debugGetProjectByTypes($type, $subType) {
        return $this->getProjectsFromDb($this->projects->getCardsOfType($type, $subType))[0];
    }

    private function debugSetProjectInTable($type, $subType, $position = 1) {
        $card = $this->debugGetProjectByTypes($type, $subType);
        $this->projects->moveCard($card->id, 'table', $position);
    }

    private function debugSetProjectInWorkshop($playerId, $type, $subType) {
        $card = $this->debugGetProjectByTypes($type, $subType);
        $this->projects->moveCard($card->id, 'player', $playerId);
    }*/
}
