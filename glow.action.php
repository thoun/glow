<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * Glow implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * glow.action.php
 *
 * Glow main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/glow/glow/myAction.html", ...)
 *
 */
  
  
  class action_glow extends APP_GameAction
  { 
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( self::isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = self::getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "glow_glow";
            self::trace( "Complete reinitialization of board game" );
      }
  	}
  	
    public function chooseAdventurer() {
        self::setAjaxMode();     

        $id = self::getArg('id', AT_posint, true);

        $this->game->chooseAdventurer($id);

        self::ajaxResponse();
    }
  	
    public function recruitCompanion() {
        self::setAjaxMode();     

        $spot = self::getArg('spot', AT_posint, true);

        $this->game->recruitCompanion($spot);

        self::ajaxResponse();
    }
  	
    public function selectSketalDie() {
        self::setAjaxMode();     

        $id = self::getArg('id', AT_posint, true);

        $this->game->selectSketalDie($id);

        self::ajaxResponse();
    }
  	
    public function moveBlackDie() {
        self::setAjaxMode();     

        $spot = self::getArg('spot', AT_posint, true);

        $this->game->moveBlackDie($spot);

        self::ajaxResponse();
    }
  	
    public function removeCompanion() {
        self::setAjaxMode();     

        $spot = self::getArg('spot', AT_posint, true);

        $this->game->removeCompanion($spot);

        self::ajaxResponse();
    }

    public function rollDice() {
        self::setAjaxMode();     

        $idsStr = explode(',', self::getArg("ids", AT_numberlist, true));
        $ids = array_map(function($idStr) { return intval($idStr); }, $idsStr);
        $this->game->rollDice($ids);

        self::ajaxResponse();

    }

    public function changeDie() {
        self::setAjaxMode();     

        $id = self::getArg('id', AT_posint, true);
        $value = self::getArg('value', AT_posint, true);
        $this->game->changeDie($id, $value);

        self::ajaxResponse();

    }
  	
    public function keepDice() {
        self::setAjaxMode();

        $this->game->keepDice();

        self::ajaxResponse();
    }
    
    public function resurrect() {
        self::setAjaxMode();

        $id = self::getArg('id', AT_posint, true);

        $this->game->resurrect($id);

        self::ajaxResponse();
    } 

    public function skipResurrect() {
        self::setAjaxMode();

        $this->game->skipResurrect();

        self::ajaxResponse();
    } 

    public function resolveCard() {
        self::setAjaxMode();

        $type = self::getArg('type', AT_posint, true);
        $id = self::getArg('id', AT_posint, true);

        $this->game->resolveCard($type, $id);

        self::ajaxResponse();
    }

    public function move() {
        self::setAjaxMode();

        $destination = self::getArg('destination', AT_posint, true);
        $from = self::getArg('from', AT_posint, false);

        $this->game->move($destination, $from);

        self::ajaxResponse();
    }
  	
    public function placeEncampment() {
        self::setAjaxMode();

        $this->game->placeEncampment();

        self::ajaxResponse();
    }

  	
    public function endTurn() {
        self::setAjaxMode();

        $this->game->endTurn();

        self::ajaxResponse();
    }

  }
  

