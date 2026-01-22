import { GameState } from '../models/GameState';
import { GameConfig } from '../models/GameConfig';
import { ResourceLoader } from '../utils/ResourceLoader';

const { ccclass, property } = cc._decorator;

/**
 * Менеджер UI
 */
@ccclass
export class UIManager extends cc.Component {
    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    movesLabel: cc.Label = null;

    @property(cc.Label)
    targetScoreLabel: cc.Label = null;

    @property(cc.Node)
    winPanel: cc.Node = null;

    @property(cc.Node)
    losePanel: cc.Node = null;

    @property(cc.Label)
    winScoreLabel: cc.Label = null;

    @property(cc.Label)
    loseMessageLabel: cc.Label = null;

    @property(cc.Button)
    restartButton: cc.Button = null;

    @property(cc.Sprite)
    movesFrameSprite: cc.Sprite = null;

    @property(cc.Sprite)
    scoreFrameSprite: cc.Sprite = null;

    /**
     * Инициализация UI
     */
    public init(): void {
        if (this.targetScoreLabel) {
            this.targetScoreLabel.string = `ОЧКИ:`;
        }
        this.updateScore(0);
        this.updateMoves(GameConfig.MAX_MOVES);
        this.hidePanels();
        this.loadBackgrounds();
    }

    /**
     * Загрузка фоновых изображений для UI
     */
    private loadBackgrounds(): void {
        // Загружаем рамку для ходов
        if (this.movesFrameSprite) {
            const path = ResourceLoader.getBackgroundPath('frame_moves');
            if (path) {
                ResourceLoader.loadSpriteFrame(path, (frame) => {
                    if (frame && this.movesFrameSprite) {
                        this.movesFrameSprite.spriteFrame = frame;
                    }
                });
            }
        }

        // Загружаем рамку для очков (можно использовать тот же или другой)
        if (this.scoreFrameSprite) {
            const path = ResourceLoader.getBackgroundPath('frame_moves');
            if (path) {
                ResourceLoader.loadSpriteFrame(path, (frame) => {
                    if (frame && this.scoreFrameSprite) {
                        this.scoreFrameSprite.spriteFrame = frame;
                    }
                });
            }
        }
    }

    /**
     * Обновление счета
     */
    public updateScore(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${score}/${GameConfig.TARGET_SCORE}`;
        }
    }

    /**
     * Обновление количества ходов
     */
    public updateMoves(moves: number): void {
        if (this.movesLabel) {
            this.movesLabel.string = `Ходы: ${moves}`;
        }
    }

    /**
     * Показать панель победы
     */
    public showWinPanel(score: number): void {
        if (this.winPanel) {
            this.winPanel.active = true;
        }
        if (this.winScoreLabel) {
            this.winScoreLabel.string = `Вы набрали ${score} очков!`;
        }
    }

    /**
     * Показать панель поражения
     */
    public showLosePanel(message: string): void {
        if (this.losePanel) {
            this.losePanel.active = true;
        }
        if (this.loseMessageLabel) {
            this.loseMessageLabel.string = message;
        }
    }

    /**
     * Скрыть все панели
     */
    public hidePanels(): void {
        if (this.winPanel) {
            this.winPanel.active = false;
        }
        if (this.losePanel) {
            this.losePanel.active = false;
        }
    }

    /**
     * Обработка нажатия кнопки перезапуска
     */
    public onRestartClick(): void {
        this.hidePanels();
        if (this.node) {
            this.node.emit('restartGame');
        }
    }
}
