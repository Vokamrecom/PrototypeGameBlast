import { GameManager } from '../managers/GameManager';
import { GameFieldView } from '../views/GameFieldView';
import { UIManager } from '../views/UIManager';
import { Tile } from '../models/Tile';
import { GameState } from '../models/GameState';

const { ccclass, property } = cc._decorator;

/**
 * Главный контроллер игры
 */
@ccclass
export class GameController extends cc.Component {
    @property(GameFieldView)
    gameFieldView: GameFieldView = null;

    @property(UIManager)
    uiManager: UIManager = null;

    private gameManager: GameManager;

    onLoad(): void {
        this.gameManager = GameManager.getInstance();
        
        if (!this.gameManager) {
            return;
        }
        
        this.setupEventListeners();
        this.startGame();
    }

    /**
     * Настройка слушателей событий
     */
    private setupEventListeners(): void {
        if (!this.gameManager) {
            return;
        }
        
        this.gameManager.on('gameStarted', () => this.onGameStarted(), this);
        this.gameManager.on('scoreChanged', (score: number) => this.onScoreChanged(score), this);
        this.gameManager.on('tilesBurned', (tiles: Tile[]) => this.onTilesBurned(tiles), this);
        this.gameManager.on('gravityApplied', () => this.onGravityApplied(), this);
        this.gameManager.on('tilesFilled', () => this.onTilesFilled(), this);
        this.gameManager.on('gameWon', () => this.onGameWon(), this);
        this.gameManager.on('gameLost', (message: string) => this.onGameLost(message), this);

        if (this.uiManager && this.uiManager.node) {
            this.uiManager.node.on('restartGame', this.startGame, this);
        }
    }

    /**
     * Начать игру
     */
    private startGame(): void {
        if (this.gameManager) {
            this.gameManager.startNewGame();
        }
    }

    /**
     * Обработка начала игры
     */
    private onGameStarted(): void {
        const tileManager = this.gameManager.getTileManager();
        
        if (this.gameFieldView) {
            this.gameFieldView.init(tileManager, (row: number, col: number) => {
                this.gameManager.onTileClick(row, col);
            });
        }

        if (this.uiManager) {
            this.uiManager.init();
            this.uiManager.updateScore(this.gameManager.getScore());
            this.uiManager.updateMoves(this.gameManager.getRemainingMoves());
        }
    }

    /**
     * Обработка изменения счета
     */
    private onScoreChanged(score: number): void {
        if (this.uiManager) {
            this.uiManager.updateScore(score);
            this.uiManager.updateMoves(this.gameManager.getRemainingMoves());
        }
    }

    /**
     * Обработка сжигания тайлов
     */
    private onTilesBurned(tiles: Tile[]): void {
        if (this.gameFieldView) {
            this.gameFieldView.playBurnAnimation(tiles, () => {
                // После анимации сжигания поле уже обновлено в GameManager
                // Просто обновляем визуальное представление
                this.gameFieldView.refreshField();
            });
        }
    }

    /**
     * Обработка применения гравитации
     */
    private onGravityApplied(): void {
        if (this.gameFieldView) {
            // Сначала обновляем поле, чтобы получить актуальные позиции
            this.gameFieldView.refreshField();
            // Затем запускаем анимацию падения
            this.scheduleOnce(() => {
                this.gameFieldView.playFallAnimation(() => {
                    // После анимации обновляем еще раз для синхронизации
                    this.gameFieldView.refreshField();
                });
            }, 0.1);
        }
    }

    /**
     * Обработка заполнения тайлов
     */
    private onTilesFilled(): void {
        if (this.gameFieldView) {
            // Обновляем поле после заполнения
            this.gameFieldView.updateAfterFill();
        }
    }

    /**
     * Обработка победы
     */
    private onGameWon(): void {
        if (this.uiManager) {
            this.uiManager.showWinPanel(this.gameManager.getScore());
        }
    }

    /**
     * Обработка поражения
     */
    private onGameLost(message: string): void {
        if (this.uiManager) {
            this.uiManager.showLosePanel(message);
        }
    }

    onDestroy(): void {
        // Отписываемся от событий
        this.gameManager.off('gameStarted', this.onGameStarted, this);
        this.gameManager.off('scoreChanged', this.onScoreChanged, this);
        this.gameManager.off('tilesBurned', this.onTilesBurned, this);
        this.gameManager.off('gravityApplied', this.onGravityApplied, this);
        this.gameManager.off('tilesFilled', this.onTilesFilled, this);
        this.gameManager.off('gameWon', this.onGameWon, this);
        this.gameManager.off('gameLost', this.onGameLost, this);
    }
}
