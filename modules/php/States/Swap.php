<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class Swap extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 341,
            type: StateType::PRIVATE,
            name: 'swap',
            description: '',
            descriptionMyTurn: clienttranslate('${you} can swap one of your companion with this card'),
        );
    }

    public function getArgs(): array {
        $companion = null;
        $dbCard = $this->game->companions->getCardOnTop('hulios');
        if ($dbCard) {
            $companion = $this->game->getCompanionFromDb($dbCard);
        }

        if ($companion && $companion->die) {
            $companion->noDieWarning = !$this->game->isBigDieAvailable($companion->dieColor);
        }

        return [
            'card' => $companion,
        ];
    }

    #[PossibleAction]
    public function actSwap(#[IntParam(min: 0)] int $id, int $currentPlayerId): void {
        $companion = $this->game->getCompanionFromDb($this->game->companions->getCardOnTop('hulios'));
        $replaced = $this->game->getCompanionFromDb($this->game->companions->getCard($id));

        if ($companion->location != 'hulios' || $replaced->location != 'player'.$currentPlayerId) {
            throw new UserException("Companion not available");
        }

        $this->game->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 1 where `card_location` = 'hulios'");
        $this->game->companions->moveCard($replaced->id, 'hulios', 0);
        $this->game->afterDiscardCompanion($currentPlayerId, $replaced);

        $this->game->bga->notify->all('removeCompanion', '', [
            'playerId' => $currentPlayerId,
            'companion' => $replaced,
        ]);

        $this->game->applyRecruitCompanion($currentPlayerId, $companion);

        $dice = $this->game->getEffectiveDice($currentPlayerId);
        $unusedHuliosDice = array_values(array_filter($dice, fn($die) => $die->color == 9 && $die->value == 9 && !$die->used));
        if (count($unusedHuliosDice) > 0) {
            $die = $unusedHuliosDice[0];
            $this->game->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
        }

        if ($companion->die && $companion->dieColor === 0 && $this->game->canChooseSketalDie()) {
            $this->game->gamestate->nextPrivateState($currentPlayerId, SelectSketalDieMulti::class); // we don't disable player so he stays active for selectSketalDieMulti
        } else if (count($unusedHuliosDice) > 1) {
            $this->game->gamestate->nextPrivateState($currentPlayerId, Swap::class);
        } else {
            $this->game->gamestate->setPlayerNonMultiactive($currentPlayerId, ResurrectMulti::class);
        }
    }

    #[PossibleAction]
    public function actSkipSwap(int $currentPlayerId): void {
        $companion = $this->game->getCompanionFromDb($this->game->companions->getCardOnTop('hulios'));

        $dice = $this->game->getEffectiveDice($currentPlayerId);
        $unusedHuliosDice = array_values(array_filter($dice, fn($die) => $die->color == 9 && $die->value == 9 && !$die->used));
        if (count($unusedHuliosDice) > 0) {
            $die = $unusedHuliosDice[0];
            $this->game->DbQuery("UPDATE dice SET `used` = true WHERE die_id = $die->id");
        }

        // put the card under the deck
        $this->game->DbQuery("UPDATE companion SET `card_location_arg` = card_location_arg + 1 where `card_location` = 'hulios'");
        $this->game->DbQuery("UPDATE companion SET `card_location_arg` = 0 where `card_id` = $companion->id");

        if (count($unusedHuliosDice) > 1) {
            $this->game->gamestate->nextPrivateState($currentPlayerId, Swap::class);
        } else {
            $this->game->gamestate->setPlayerNonMultiactive($currentPlayerId, ResurrectMulti::class);
        }
    }

    public function zombie(int $playerId, array $args): void {
        if ($args['card'] === null) {
            $this->game->gamestate->setPlayerNonMultiactive($playerId, ResurrectMulti::class);
            return;
        }
        $choices = [null]; // Skipping a swap is legal.
        foreach ($this->game->companions->getCardsInLocation('player'.$playerId) as $card) {
            $choices[] = (int)$card['id'];
        }
        $id = $this->getRandomZombieChoice($choices);
        if ($id === null) {
            $this->actSkipSwap($playerId);
        } else {
            $this->actSwap($id, $playerId);
        }
    }
}
