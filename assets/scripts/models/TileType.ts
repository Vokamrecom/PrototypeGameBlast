/**
 * Типы тайлов (цвета)
 */
export enum TileType {
    RED = 0,
    GREEN = 1,
    BLUE = 2,
    YELLOW = 3,
    PURPLE = 4,
    ORANGE = 5
}

/**
 * Получить случайный тип тайла
 */
export function getRandomTileType(): TileType {
    const types = Object.values(TileType).filter(v => typeof v === 'number') as TileType[];
    return types[Math.floor(Math.random() * types.length)];
}
