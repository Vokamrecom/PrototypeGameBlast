/**
 * Конфигурация игры
 */
export class GameConfig {
    public static readonly FIELD_WIDTH = 8;
    public static readonly FIELD_HEIGHT = 8;
    public static readonly TARGET_SCORE = 1000;
    public static readonly MAX_MOVES = 30;
    public static readonly TILE_SIZE = 60;  // Уменьшено с 80 до 60
    public static readonly TILE_SPACING = 3;  // Уменьшено с 5 до 3
    
    /**
     * Формула начисления очков: количество сожженных тайлов в квадрате
     */
    public static calculateScore(burnedTiles: number): number {
        return burnedTiles * burnedTiles * 10;
    }
}
