<?php

class Token {
    public int $id;
    public string $location;
    public int $locationArg;
    public int $type;
    public int $typeArg;

    public function __construct($dbCard) {
        $this->id = intval($dbCard['id']);
        $this->location = $dbCard['location'];
        $this->locationArg = intval($dbCard['location_arg']);
        $this->type = intval($dbCard['type']);
        $this->typeArg = intval($dbCard['type_arg']);
    } 
}
?>