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
  	
    public function removeCompanion() {
        self::setAjaxMode();     

        $spot = self::getArg('spot', AT_posint, true);

        $this->game->removeCompanion($spot);

        self::ajaxResponse();
    }

  }
  

