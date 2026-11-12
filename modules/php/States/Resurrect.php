<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\GameFramework\UserException;
use Bga\Games\Glow\Game;

class Resurrect extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 351,
            type: StateType::PRIVATE,
            name: 'resurrect',
            description: '',
            descriptionMyTurn: clienttranslate('${you} can take a companion from the cemetery'),
        );
    }

    public function getArgs(): array {
        $cards = $this->game->getCompanionsFromDb($this->game->companions->getCardsInLocation('cemetery'));

        foreach($cards as &$companion) {
            if ($companion && $companion->die) {
                $companion->noDieWarning = !$this->game->isBigDieAvailable($companion->dieColor);
            }
        }

        return [
            'cemeteryCards' => $cards,
        ];
    }

    #[PossibleAction]
    public function actResurrect(#[IntParam(min: 0)] int $id, int $currentPlayerId): void {
        $companion = $this->game->getCompanionFromDb($this->game->companions->getCard($id));

        if ($companion->location != 'cemetery') {
            throw new UserException("Companion not available");
        }

        $this->game->applyRecruitCompanion($currentPlayerId, $companion);

        if ($companion->die && $companion->dieColor === 0 && $this->game->canChooseSketalDie()) {
            $this->game->gamestate->nextPrivateState($currentPlayerId, SelectSketalDieMulti::class); // we don't disable player so he stays active for selectSketalDieMulti
        } else {
            $this->game->gamestate->setPlayerNonMultiactive($currentPlayerId, MultiResolveCards::class);
        }
    }

    #[PossibleAction]
    public function actSkipResurrect(int $currentPlayerId): void {
        $this->game->gamestate->setPlayerNonMultiactive($currentPlayerId, MultiResolveCards::class);
    }

    public function zombie(int $playerId, array $args): void {
        $choices = [null]; // Taking a cemetery card is optional.
        foreach ($args['cemeteryCards'] as $card) {
            $choices[] = (int)$card->id;
        }
        $id = $this->getRandomZombieChoice($choices);
        if ($id === null) {
            $this->actSkipResurrect($playerId);
        } else {
            $this->actResurrect($id, $playerId);
        }
    }
}
