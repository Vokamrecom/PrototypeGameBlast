import { TileManager } from './TileManager';
import { Tile } from '../models/Tile';
import { GameConfig } from '../models/GameConfig';
import { GameState } from '../models/GameState';

/**
 * Главный менеджер игры
 */
export class GameManager {
    private static instance: GameManager;
    private tileManager: TileManager;
    private score: number = 0;
    private moves: number = 0;
    private state: GameState = GameState.MENU;
    private isProcessing: boolean = false;

    private constructor() {
        this.tileManager = new TileManager();
    }

    public static getInstance(): GameManager {
        if (!GameManager.instance) {
            GameManager.instance = new GameManager();
        }
        return GameManager.instance;
    }

    /**
     * Начать новую игру
     */
    public startNewGame(): void {
        this.tileManager = new TileManager();
        this.score = 0;
        this.moves = 0;
        this.state = GameState.PLAYING;
        this.isProcessing = false;
        this.emit('gameStarted');
    }

    /**
     * Обработка клика на тайл
     */
    public onTileClick(row: number, col: number): void {
        if (this.state !== GameState.PLAYING || this.isProcessing) {
            console.log(`[CLICK] Ignored: state=${this.state}, isProcessing=${this.isProcessing}`);
            return;
        }

        const connectedTiles = this.tileManager.findConnectedTiles(row, col);
        console.log(`[CLICK] Clicked at (${row}, ${col}), found ${connectedTiles.length} connected tiles`);
        
        if (connectedTiles.length < 2) {
            console.log(`[CLICK] Not enough tiles (need 2, found ${connectedTiles.length})`);
            return;
        }

        console.log(`[CLICK] Processing burn of ${connectedTiles.length} tiles`);
        this.isProcessing = true;
        this.processTileBurn(connectedTiles);
    }

    /**
     * Обработка сжигания тайлов
     */
    private processTileBurn(tiles: Tile[]): void {
        // Увеличиваем количество ходов
        this.moves++;

        // Удаляем тайлы
        this.tileManager.removeTiles(tiles);

        // Начисляем очки
        const points = GameConfig.calculateScore(tiles.length);
        this.score += points;
        this.emit('scoreChanged', this.score);

        // Анимация сжигания (будет реализована в View)
        this.emit('tilesBurned', tiles);

        // После анимации применяем гравитацию и заполняем пустые ячейки
        setTimeout(() => {
            this.applyGravityAndFill();
        }, 500);
    }

    /**
     * Применение гравитации и заполнение пустых ячеек
     */
    private applyGravityAndFill(): void {
        // Применяем гравитацию
        this.tileManager.applyGravity();
        this.emit('gravityApplied');

        // Заполняем пустые ячейки
        setTimeout(() => {
            this.tileManager.fillEmptyCells();
            this.emit('tilesFilled');

            // Проверяем условия победы/поражения
            this.checkGameConditions();
        }, 300);
    }

    /**
     * Проверка условий победы/поражения
     */
    private checkGameConditions(): void {
        // Проверка победы
        if (this.score >= GameConfig.TARGET_SCORE) {
            this.state = GameState.WIN;
            this.emit('gameWon');
            this.isProcessing = false;
            return;
        }

        // Проверка поражения по ходам
        if (this.moves >= GameConfig.MAX_MOVES) {
            this.state = GameState.LOSE;
            this.emit('gameLost', 'Закончились ходы!');
            this.isProcessing = false;
            return;
        }

        // Проверка возможности сделать ход
        if (!this.tileManager.hasPossibleMoves()) {
            this.state = GameState.LOSE;
            this.emit('gameLost', 'Нет возможных ходов!');
            this.isProcessing = false;
            return;
        }

        this.isProcessing = false;
    }

    /**
     * Получить текущий счет
     */
    public getScore(): number {
        return this.score;
    }

    /**
     * Получить оставшиеся ходы
     */
    public getRemainingMoves(): number {
        return Math.max(0, GameConfig.MAX_MOVES - this.moves);
    }

    /**
     * Получить состояние игры
     */
    public getState(): GameState {
        return this.state;
    }

    /**
     * Получить менеджер тайлов
     */
    public getTileManager(): TileManager {
        return this.tileManager;
    }

    /**
     * Простая система событий
     */
    private eventListeners: { [key: string]: Function[] } = {};

    public on(event: string, callback: Function): void {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    public off(event: string, callback: Function): void {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }

    private emit(event: string, ...args: any[]): void {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(...args));
        }
    }

}
