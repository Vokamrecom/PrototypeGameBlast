import { TileType } from './TileType';

/**
 * Модель тайла на игровом поле
 */
export class Tile {
    public type: TileType;
    public row: number;
    public col: number;
    public node: cc.Node | null = null;

    constructor(type: TileType, row: number, col: number) {
        this.type = type;
        this.row = row;
        this.col = col;
    }

    /**
     * Проверка, является ли тайл того же типа
     */
    public isSameType(other: Tile | null): boolean {
        return other !== null && this.type === other.type;
    }

    /**
     * Обновление позиции тайла
     */
    public updatePosition(row: number, col: number): void {
        this.row = row;
        this.col = col;
    }
}
