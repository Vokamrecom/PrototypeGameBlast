import { Tile } from '../models/Tile';
import { TileType, getRandomTileType } from '../models/TileType';
import { GameConfig } from '../models/GameConfig';

/**
 * Менеджер для работы с тайлами
 */
export class TileManager {
    private field: (Tile | null)[][];

    constructor() {
        this.field = [];
        this.initializeField();
    }

    /**
     * Инициализация игрового поля
     */
    private initializeField(): void {
        this.field = [];
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            this.field[row] = [];
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                this.field[row][col] = new Tile(getRandomTileType(), row, col);
            }
        }
    }

    /**
     * Получить тайл по координатам
     */
    public getTile(row: number, col: number): Tile | null {
        if (this.isValidPosition(row, col)) {
            return this.field[row][col];
        }
        return null;
    }

    /**
     * Установить тайл в позицию
     */
    public setTile(row: number, col: number, tile: Tile | null): void {
        if (this.isValidPosition(row, col)) {
            this.field[row][col] = tile;
            if (tile) {
                tile.updatePosition(row, col);
            }
        }
    }

    /**
     * Проверка валидности позиции
     */
    public isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < GameConfig.FIELD_HEIGHT &&
               col >= 0 && col < GameConfig.FIELD_WIDTH;
    }

    /**
     * Получить все тайлы игрового поля
     */
    public getField(): (Tile | null)[][] {
        return this.field;
    }

    /**
     * Найти все прилегающие тайлы того же типа (BFS)
     * Оптимизированный алгоритм BFS для поиска связанных компонент
     */
    public findConnectedTiles(startRow: number, startCol: number): Tile[] {
        const startTile = this.getTile(startRow, startCol);
        if (!startTile) {
            console.log(`[BFS] No tile at (${startRow}, ${startCol})`);
            return [];
        }

        const startType = startTile.type;
        console.log(`[BFS] Starting from (${startRow}, ${startCol}), type: ${startType}`);
        
        const connectedSet = new Set<Tile>();
        const visited: boolean[][] = [];
        const queue: { row: number; col: number }[] = [];

        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            visited[row] = [];
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                visited[row][col] = false;
            }
        }

        queue.push({ row: startRow, col: startCol });
        visited[startRow][startCol] = true;

        while (queue.length > 0) {
            const current = queue.shift()!;
            const currentTile = this.getTile(current.row, current.col);

            if (!currentTile) {
                console.log(`[BFS] No tile at (${current.row}, ${current.col})`);
                continue;
            }

            if (currentTile.type === startType) {
                connectedSet.add(currentTile);
                console.log(`[BFS] Added tile at (${current.row}, ${current.col}), type: ${currentTile.type}, total: ${connectedSet.size}`);

                const neighbors = [
                    { row: current.row - 1, col: current.col },
                    { row: current.row + 1, col: current.col },
                    { row: current.row, col: current.col - 1 },
                    { row: current.row, col: current.col + 1 }
                ];

                for (const neighbor of neighbors) {
                    if (!this.isValidPosition(neighbor.row, neighbor.col)) {
                        continue;
                    }

                    if (visited[neighbor.row][neighbor.col]) {
                        continue;
                    }

                    visited[neighbor.row][neighbor.col] = true;

                    const neighborTile = this.getTile(neighbor.row, neighbor.col);
                    
                    if (neighborTile && neighborTile.type === startType) {
                        console.log(`[BFS] Found connected neighbor at (${neighbor.row}, ${neighbor.col}), type: ${neighborTile.type}`);
                        queue.push({ row: neighbor.row, col: neighbor.col });
                    }
                }
            } else {
                console.log(`[BFS] Tile at (${current.row}, ${current.col}) has different type: ${currentTile.type} vs ${startType}`);
            }
        }

        const result = Array.from(connectedSet);
        console.log(`[BFS] Search completed. Found ${result.length} connected tiles`);
        return result;
    }

    /**
     * Удалить тайлы из поля
     */
    public removeTiles(tiles: Tile[]): void {
        for (const tile of tiles) {
            const currentTile = this.getTile(tile.row, tile.col);
            if (currentTile === tile) {
                this.setTile(tile.row, tile.col, null);
            } else {
                let found = false;
                for (let r = 0; r < GameConfig.FIELD_HEIGHT; r++) {
                    for (let c = 0; c < GameConfig.FIELD_WIDTH; c++) {
                        if (this.getTile(r, c) === tile) {
                            this.setTile(r, c, null);
                            found = true;
                            break;
                        }
                    }
                    if (found) break;
                }
            }
        }
    }

    /**
     * Опустить тайлы вниз (гравитация)
     */
    public applyGravity(): void {
        for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
            let writeIndex = GameConfig.FIELD_HEIGHT - 1;

            for (let row = GameConfig.FIELD_HEIGHT - 1; row >= 0; row--) {
                const tile = this.getTile(row, col);
                if (tile) {
                    if (writeIndex !== row) {
                        this.field[row][col] = null;
                        this.setTile(writeIndex, col, tile);
                    } else {
                        if (tile.row !== writeIndex || tile.col !== col) {
                            tile.updatePosition(writeIndex, col);
                        }
                    }
                    writeIndex--;
                }
            }
        }
    }

    /**
     * Заполнить пустые ячейки новыми тайлами
     */
    public fillEmptyCells(): void {
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                if (this.getTile(row, col) === null) {
                    const newTile = new Tile(getRandomTileType(), row, col);
                    this.setTile(row, col, newTile);
                }
            }
        }
    }

    /**
     * Проверка возможности сделать ход (есть ли группы тайлов для сжигания)
     */
    public hasPossibleMoves(): boolean {
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const connected = this.findConnectedTiles(row, col);
                if (connected.length >= 2) {
                    return true;
                }
            }
        }
        return false;
    }
}
