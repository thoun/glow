<?php
declare(strict_types=1);

namespace Bga\Games\Glow\States;

use Bga\GameFramework\States\GameState;
use Bga\GameFramework\States\PossibleAction;
use Bga\GameFramework\StateType;
use Bga\Games\Glow\Game;

class UriomRecruitCompanion extends GameState {
    public function __construct(protected Game $game) {
        parent::__construct($game,
            id: 25,
            type: StateType::ACTIVE_PLAYER,
            name: 'uriomRecruitCompanion',
            description: /*clienttranslate TODOURIOM */('${actplayer} can recruit the selected companion (Uriom power)'),
            descriptionMyTurn: /*clienttranslate TODOURIOM */('${you} can recruit the selected companion (Uriom power)'),
            transitions: [
                'moveBlackDie' => 23,
                'selectSketalDie' => 22,
                'nextPlayer' => 28,
                'removeCompanion' => 21,
            ],
        );
    }

    public function getArgs(): array {
        $uriomIntervention = $this->game->getGlobalVariable(URIOM_INTERVENTION);
        return [
            'spot' => $uriomIntervention->spot,
        ];
    }

    #[PossibleAction]
    public function actRecruitCompanionUriom(): void {
        $uriomIntervention = $this->game->getGlobalVariable(URIOM_INTERVENTION);
        $uriomIntervention->activated = true;
        $this->game->setGlobalVariable(URIOM_INTERVENTION, $uriomIntervention);

        $this->game->recruitCompanionAction($uriomIntervention->uriomPlayerId, $uriomIntervention->spot);
    }

    #[PossibleAction]
    public function actPassUriomRecruit(): string {
        $uriomIntervention = $this->game->getGlobalVariable(URIOM_INTERVENTION);
        $uriomIntervention->activated = false;
        $this->game->setGlobalVariable(URIOM_INTERVENTION, $uriomIntervention);

        return NextPlayerRecruitCompanion::class;
    }

    public function zombie(int $playerId, array $args): ?string {
        $choices = ['pass'];
        $companions = $this->game->companions->getCardsInLocation('meeting', (int)$args['spot']);
        if ($companions !== []) {
            $choices[] = 'recruit';
        }
        if ($this->getRandomZombieChoice($choices) === 'pass') {
            return $this->actPassUriomRecruit();
        }
        $this->actRecruitCompanionUriom();
        return null;
    }
}
