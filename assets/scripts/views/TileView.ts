import { Tile } from '../models/Tile';
import { TileType } from '../models/TileType';
import { GameConfig } from '../models/GameConfig';
import { ResourceLoader } from '../utils/ResourceLoader';

const { ccclass, property } = cc._decorator;

/**
 * Представление тайла на сцене
 */
@ccclass
export class TileView extends cc.Component {
    @property(cc.Sprite)
    sprite: cc.Sprite = null;

    @property([cc.SpriteFrame])
    tileFrames: cc.SpriteFrame[] = [];

    private tile: Tile | null = null;
    private onClickCallback: (row: number, col: number) => void = null;
    private currentRow: number = -1;
    private currentCol: number = -1;
    private static loadedFrames: cc.SpriteFrame[] = [];
    private static framesLoaded: boolean = false;

    /**
     * Предзагрузка спрайтов тайлов
     */
    public static preloadTileFrames(callback?: () => void): void {
        if (this.framesLoaded) {
            if (callback) callback();
            return;
        }

        const paths = ResourceLoader.getTileSpritePaths();
        ResourceLoader.loadSpriteFrames(paths, (frames) => {
            this.loadedFrames = frames;
            this.framesLoaded = true;
            if (callback) callback();
        });
    }

    /**
     * Инициализация тайла
     */
    public init(tile: Tile, onClick: (row: number, col: number) => void): void {
        this.tile = tile;
        this.currentRow = tile.row;
        this.currentCol = tile.col;
        this.onClickCallback = onClick;
        this.updateVisual();
        this.setupClickHandler();
        this.addAppearAnimation();
    }

    /**
     * Анимация появления тайла
     */
    private addAppearAnimation(): void {
        this.node.setScale(0.95);
        this.node.opacity = 0;
        const fadeIn = cc.fadeIn(0.2);
        const scaleTo = cc.scaleTo(0.2, 1.0);
        this.node.runAction(cc.spawn(fadeIn, scaleTo));
    }

    /**
     * Обновление визуального представления
     */
    public updateVisual(): void {
        if (this.tile && this.sprite) {
            const frameIndex = this.tile.type;
            
            if (TileView.loadedFrames[frameIndex]) {
                this.sprite.spriteFrame = TileView.loadedFrames[frameIndex];
                return;
            }

            if (this.tileFrames && this.tileFrames[frameIndex]) {
                this.sprite.spriteFrame = this.tileFrames[frameIndex];
                return;
            }

            const path = ResourceLoader.getTileSpritePath(frameIndex);
            ResourceLoader.loadSpriteFrame(path, (frame) => {
                if (frame && this.sprite) {
                    this.sprite.spriteFrame = frame;
                } else if (this.sprite) {
                    this.sprite.node.color = this.getColorForType(this.tile.type);
                }
            });
        }
    }

    /**
     * Получить цвет для типа тайла
     */
    private getColorForType(type: TileType): cc.Color {
        const colors = [
            cc.Color.RED,      // RED
            cc.Color.GREEN,    // GREEN
            cc.Color.BLUE,     // BLUE
            cc.Color.YELLOW,   // YELLOW
            new cc.Color(128, 0, 128), // PURPLE
            new cc.Color(255, 165, 0)  // ORANGE
        ];
        return colors[type] || cc.Color.WHITE;
    }

    /**
     * Настройка обработчика клика
     */
    private setupClickHandler(): void {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTileClick, this);
    }

    /**
     * Обработка клика на тайл
     */
    private onTileClick(): void {
        if (this.onClickCallback && this.currentRow >= 0 && this.currentCol >= 0) {
            console.log(`[TILE_CLICK] TileView clicked at stored position (${this.currentRow}, ${this.currentCol}), tile position (${this.tile?.row}, ${this.tile?.col})`);
            this.onClickCallback(this.currentRow, this.currentCol);
        }
    }

    /**
     * Анимация сжигания тайла
     */
    public playBurnAnimation(callback?: () => void): void {
        // Добавляем эффект свечения перед исчезновением
        const scaleUp = cc.scaleTo(0.1, 1.2);
        const scaleDown = cc.scaleTo(0.1, 0);
        const fadeOut = cc.fadeOut(0.2);
        const spawn = cc.spawn(scaleDown, fadeOut);
        const removeAction = cc.callFunc(() => {
            if (callback) {
                callback();
            }
        });

        this.node.runAction(cc.sequence(scaleUp, spawn, removeAction));
    }

    /**
     * Анимация падения тайла
     */
    public playFallAnimation(targetY: number, duration: number, callback?: () => void): void {
        const moveAction = cc.moveTo(duration, this.node.x, targetY);
        const completeAction = callback ? cc.callFunc(callback) : null;
        
        if (completeAction) {
            this.node.runAction(cc.sequence(moveAction, completeAction));
        } else {
            this.node.runAction(moveAction);
        }
    }

    /**
     * Обновить позицию тайла
     */
    public updatePosition(row: number, col: number): void {
        if (this.tile) {
            this.tile.updatePosition(row, col);
        }
        this.updateNodePosition(row, col);
    }

    /**
     * Обновить позицию узла на сцене
     */
    public updateNodePosition(row: number, col: number): void {
        const startX = -(GameConfig.FIELD_WIDTH * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING)) / 2;
        const startY = (GameConfig.FIELD_HEIGHT * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING)) / 2;

        const x = startX + col * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) + GameConfig.TILE_SIZE / 2;
        const y = startY - row * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) - GameConfig.TILE_SIZE / 2;

        this.node.setPosition(x, y);
    }

    /**
     * Очистка
     */
    onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTileClick, this);
    }
}
