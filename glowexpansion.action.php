<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * GlowExpansion implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on https://boardgamearena.com.
 * See http://en.doc.boardgamearena.com/Studio for more information.
 * -----
 * 
 * glowexpansion.action.php
 *
 * GlowExpansion main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *       
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/glowexpansion/glowexpansion/myAction.html", ...)
 *
 */
  
  
  class action_glowexpansion extends APP_GameAction
  { 
    // Constructor: please do not modify
   	public function __default()
  	{
  	    if( $this->isArg( 'notifwindow') )
  	    {
            $this->view = "common_notifwindow";
  	        $this->viewArgs['table'] = $this->getArg( "table", AT_posint, true );
  	    }
  	    else
  	    {
            $this->view = "glowexpansion_glowexpansion";
            $this->trace( "Complete reinitialization of board game" );
      }
  	}
  	
    public function chooseAdventurer() {
        $this->setAjaxMode();     

        $id = $this->getArg('id', AT_posint, true);

        $this->game->chooseAdventurer($id);

        $this->ajaxResponse();
    }

    public function chooseTomDice() {
        $this->setAjaxMode();     

        $dice = $this->getArg("dice", AT_numberlist, true);

        $this->game->chooseTomDice(array_map(fn($idStr) => intval($idStr), explode(',', $dice)));

        $this->ajaxResponse();
    }
  	
    public function recruitCompanion() {
        $this->setAjaxMode();     

        $spot = $this->getArg('spot', AT_posint, true);

        $this->game->recruitCompanion($spot);

        $this->ajaxResponse();
    }
  	
    public function selectSketalDie() {
        $this->setAjaxMode();     

        $id = $this->getArg('id', AT_posint, true);

        $this->game->selectSketalDie($id);

        $this->ajaxResponse();
    }
  	
    public function moveBlackDie() {
        $this->setAjaxMode();     

        $spot = $this->getArg('spot', AT_posint, true);

        $this->game->moveBlackDie($spot);

        $this->ajaxResponse();
    }
  	
    public function removeCompanion() {
        $this->setAjaxMode();     

        $spot = $this->getArg('spot', AT_posint, true);

        $this->game->removeCompanion($spot);

        $this->ajaxResponse();
    }

    public function recruitCompanionUriom() {
        $this->setAjaxMode();     

        $this->game->recruitCompanionUriom();

        $this->ajaxResponse();
    }

    public function passUriomRecruit() {
        $this->setAjaxMode();     

        $this->game->passUriomRecruit();

        $this->ajaxResponse();
    }

    public function rollDice() {
        $this->setAjaxMode();     

        $idsStr = explode(',', $this->getArg("ids", AT_numberlist, true));
        $ids = array_map(fn($idStr) => intval($idStr), $idsStr);
        $cost = explode(',', $this->getArg("cost", AT_numberlist, true)); // cost : [companion, tokens, score]
        $this->game->rollDice($ids, $cost);

        $this->ajaxResponse();

    }

    public function selectDiceToRoll() {
        $this->setAjaxMode();     

        $this->game->selectDiceToRoll();

        $this->ajaxResponse();
    }

    public function selectDieToChange() {
        $this->setAjaxMode();

        $this->game->selectDieToChange();

        $this->ajaxResponse();
    }

    public function changeDie() {
        $this->setAjaxMode();     

        $id = $this->getArg('id', AT_posint, true);
        $value = $this->getArg('value', AT_posint, true);
        $cost = explode(',', $this->getArg("cost", AT_numberlist, true)); // cost : [companion, tokens, score]
        $this->game->changeDie($id, $value, $cost);

        $this->ajaxResponse();

    }

    public function rerollImmediate() {
        $this->setAjaxMode();     

        $id = $this->getArg('id', AT_posint, true);
        $this->game->rerollImmediate($id);

        $this->ajaxResponse();
    }    

    public function cancel() {
        $this->setAjaxMode();     

        $this->game->cancel();

        $this->ajaxResponse();

    }
  	
    public function keepDice() {
        $this->setAjaxMode();

        $this->game->keepDice();

        $this->ajaxResponse();
    }
    
    public function swap() {
        $this->setAjaxMode();

        $id = $this->getArg('id', AT_posint, true);

        $this->game->swap($id);

        $this->ajaxResponse();
    } 

    public function skipSwap() {
        $this->setAjaxMode();

        $this->game->skipSwap();

        $this->ajaxResponse();
    } 
    
    public function resurrect() {
        $this->setAjaxMode();

        $id = $this->getArg('id', AT_posint, true);

        $this->game->resurrect($id);

        $this->ajaxResponse();
    } 

    public function skipResurrect() {
        $this->setAjaxMode();

        $this->game->skipResurrect();

        $this->ajaxResponse();
    } 

    public function resolveCard() {
        $this->setAjaxMode();

        $type = $this->getArg('type', AT_posint, true);
        $id = $this->getArg('id', AT_posint, true);
        $dieId = $this->getArg('dieId', AT_posint, false);

        $this->game->resolveCard($type, $id, $dieId);

        $this->ajaxResponse();
    }

    public function resolveAll() {
        $this->setAjaxMode();

        $this->game->resolveAll();

        $this->ajaxResponse();
    }

    public function move() {
        $this->setAjaxMode();

        $destination = $this->getArg('destination', AT_posint, true);
        $from = $this->getArg('from', AT_posint, false);
        $type = $this->getArg('type', AT_posint, false);
        $id = $this->getArg('id', AT_posint, false);

        $this->game->move($destination, $from, $type, $id);

        $this->ajaxResponse();
    }
  	
    public function placeEncampment() {
        $this->setAjaxMode();

        $this->game->placeEncampment();

        $this->ajaxResponse();
    }

  	
    public function endTurn() {
        $this->setAjaxMode();

        $this->game->endTurn();

        $this->ajaxResponse();
    }

  }
  

