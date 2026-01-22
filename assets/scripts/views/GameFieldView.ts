import { TileManager } from '../managers/TileManager';
import { Tile } from '../models/Tile';
import { TileView } from './TileView';
import { GameConfig } from '../models/GameConfig';
import { ResourceLoader } from '../utils/ResourceLoader';

const { ccclass, property } = cc._decorator;

/**
 * Представление игрового поля
 */
@ccclass
export class GameFieldView extends cc.Component {
    @property(cc.Prefab)
    tilePrefab: cc.Prefab = null;

    @property(cc.Sprite)
    backgroundSprite: cc.Sprite = null;

    private tileViews: (TileView | null)[][] = [];
    private tileManager: TileManager | null = null;
    private onClickCallback: (row: number, col: number) => void = null;

    /**
     * Инициализация поля
     */
    public init(tileManager: TileManager, onClick: (row: number, col: number) => void): void {
        this.tileManager = tileManager;
        this.onClickCallback = onClick;
        
        TileView.preloadTileFrames(() => {
            this.loadBackground();
            this.createField();
        });
    }

    /**
     * Загрузка фонового изображения
     */
    private loadBackground(): void {
        if (this.backgroundSprite) {
            const path = ResourceLoader.getBackgroundPath('frame_play');
            if (path) {
                ResourceLoader.loadSpriteFrame(path, (frame) => {
                    if (frame && this.backgroundSprite && this.backgroundSprite.node) {
                        this.backgroundSprite.spriteFrame = frame;
                        
                        const fieldWidth = GameConfig.FIELD_WIDTH * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) - GameConfig.TILE_SPACING;
                        const fieldHeight = GameConfig.FIELD_HEIGHT * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) - GameConfig.TILE_SPACING;
                        const padding = 20;
                        
                        this.backgroundSprite.node.setContentSize(fieldWidth + padding * 2, fieldHeight + padding * 2);
                        this.backgroundSprite.node.setPosition(0, 0);
                        this.backgroundSprite.node.setSiblingIndex(0);
                    }
                });
            }
        }
    }

    /**
     * Создание игрового поля
     */
    private createField(): void {
        this.clearField();
        this.tileViews = [];
        const field = this.tileManager.getField();

        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            this.tileViews[row] = [];
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const tile = field[row][col];
                if (tile) {
                    this.createTileView(tile, row, col);
                }
            }
        }
        
    }

    /**
     * Очистка поля
     */
    private clearField(): void {
        const children = this.node.children.slice();
        for (let i = 0; i < children.length; i++) {
            children[i].destroy();
        }
        
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const tileView = this.tileViews[row] ? this.tileViews[row][col] : null;
                if (tileView && tileView.node && cc.isValid(tileView.node)) {
                    tileView.node.destroy();
                }
            }
        }
        
        this.tileViews = [];
    }

    /**
     * Создание представления тайла
     */
    private createTileView(tile: Tile, row: number, col: number): void {
        let node: cc.Node;
        let tileView: TileView;

        if (this.tilePrefab) {
            try {
                node = cc.instantiate(this.tilePrefab);
                tileView = node.getComponent(TileView);
                node.setContentSize(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE);
                
                let spriteComponent = node.getComponent(cc.Sprite);
                
                if (!spriteComponent) {
                    spriteComponent = node.addComponent(cc.Sprite);
                    if (tileView && spriteComponent) {
                        tileView.sprite = spriteComponent;
                    }
                } else {
                    if (tileView && !tileView.sprite) {
                        tileView.sprite = spriteComponent;
                    }
                }
                
                if (spriteComponent) {
                    spriteComponent.type = cc.Sprite.Type.SIMPLE;
                    spriteComponent.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                }
                
                if (spriteComponent && !spriteComponent.spriteFrame) {
                    const frameIndex = tile.type;
                    if (TileView.loadedFrames && TileView.loadedFrames[frameIndex]) {
                        spriteComponent.spriteFrame = TileView.loadedFrames[frameIndex];
                    } else {
                        const color = this.getColorForTileType(tile.type);
                        node.color = color;
                    }
                }
            } catch (e) {
                return;
            }
        } else {
            node = new cc.Node('Tile');
            node.setContentSize(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE);
            this.setupSimpleTile(node, tile, row, col, null);
            return;
        }

        this.node.addChild(node);
        
        if (node.getContentSize().width === 0 || node.getContentSize().height === 0) {
            node.setContentSize(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE);
        }
        
        const finalSprite = node.getComponent(cc.Sprite);
        if (finalSprite) {
            finalSprite.type = cc.Sprite.Type.SIMPLE;
            finalSprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            
            if (!finalSprite.spriteFrame) {
                const frameIndex = tile.type;
                if (TileView.loadedFrames && TileView.loadedFrames[frameIndex]) {
                    finalSprite.spriteFrame = TileView.loadedFrames[frameIndex];
                } else {
                    const color = this.getColorForTileType(tile.type);
                    node.color = color;
                }
            }
        }
        
        if (tileView) {
            tileView.init(tile, this.onClickCallback);
            tileView.updateNodePosition(row, col);
            this.tileViews[row][col] = tileView;
            
            if (!finalSprite) {
                console.error(`[ERROR] TileView initialized but no Sprite component found for tile at ${row}, ${col}`);
            }
        } else {
            const tempTileView = {
                node: node,
                tile: tile,
                currentRow: row,
                currentCol: col,
                updateNodePosition: (r: number, c: number) => {
                    tempTileView.currentRow = r;
                    tempTileView.currentCol = c;
                    const startX = -(GameConfig.FIELD_WIDTH * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING)) / 2;
                    const startY = (GameConfig.FIELD_HEIGHT * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING)) / 2;
                    const x = startX + c * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) + GameConfig.TILE_SIZE / 2;
                    const y = startY - r * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) - GameConfig.TILE_SIZE / 2;
                    node.setPosition(x, y);
                },
                updateVisual: () => {
                    if (finalSprite && tile) {
                        const frameIndex = tile.type;
                        if (TileView.loadedFrames && TileView.loadedFrames[frameIndex]) {
                            finalSprite.spriteFrame = TileView.loadedFrames[frameIndex];
                        } else {
                            const color = this.getColorForTileType(tile.type);
                            node.color = color;
                        }
                    }
                },
                playBurnAnimation: (callback?: () => void) => {
                    const scaleUp = cc.scaleTo(0.1, 1.2);
                    const scaleDown = cc.scaleTo(0.1, 0);
                    const fadeOut = cc.fadeOut(0.2);
                    const spawn = cc.spawn(scaleDown, fadeOut);
                    const removeAction = callback ? cc.callFunc(callback) : null;
                    
                    if (removeAction) {
                        node.runAction(cc.sequence(scaleUp, spawn, removeAction));
                    } else {
                        node.runAction(cc.sequence(scaleUp, spawn));
                    }
                },
                playFallAnimation: (targetY: number, duration: number, callback?: () => void) => {
                    const moveAction = cc.moveTo(duration, node.x, targetY);
                    const completeAction = callback ? cc.callFunc(callback) : null;
                    
                    if (completeAction) {
                        node.runAction(cc.sequence(moveAction, completeAction));
                    } else {
                        node.runAction(moveAction);
                    }
                }
            } as any;
            
            if (this.onClickCallback) {
                node.on(cc.Node.EventType.TOUCH_END, () => {
                    console.log(`[TEMP_CLICK] TempTileView clicked, using stored position (${tempTileView.currentRow}, ${tempTileView.currentCol})`);
                    this.onClickCallback(tempTileView.currentRow, tempTileView.currentCol);
                });
            }
            
            this.tileViews[row][col] = tempTileView;
            tempTileView.updateNodePosition(row, col);
            this.addTileEffects(node);
        }
    }

    private setupSimpleTile(node: cc.Node, tile: Tile, row: number, col: number, sprite: cc.Sprite | null): void {
        node.setContentSize(GameConfig.TILE_SIZE, GameConfig.TILE_SIZE);
        
        const fieldWidth = GameConfig.FIELD_WIDTH * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING);
        const fieldHeight = GameConfig.FIELD_HEIGHT * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING);
        const startX = -fieldWidth / 2 + GameConfig.TILE_SIZE / 2;
        const startY = fieldHeight / 2 - GameConfig.TILE_SIZE / 2;
        const x = startX + col * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING);
        const y = startY - row * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING);

        node.setPosition(x, y);
        
        const color = this.getColorForTileType(tile.type);
        node.color = color;
        
        node.on(cc.Node.EventType.TOUCH_END, () => {
            if (this.onClickCallback) {
                this.onClickCallback(row, col);
            }
        });
        
        let spriteComponent = node.getComponent(cc.Sprite);
        if (!spriteComponent) {
            try {
                spriteComponent = node.addComponent(cc.Sprite);
                if (!spriteComponent) {
                    return;
                }
            } catch (e) {
                return;
            }
        }
        
        if (spriteComponent) {
            spriteComponent.type = cc.Sprite.Type.SIMPLE;
            spriteComponent.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        }
        
        if (!spriteComponent) {
            return;
        }
        
        const frameIndex = tile.type;
        if (TileView.loadedFrames && TileView.loadedFrames[frameIndex]) {
            spriteComponent.spriteFrame = TileView.loadedFrames[frameIndex];
        } else if (!spriteComponent.spriteFrame) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = GameConfig.TILE_SIZE;
                canvas.height = GameConfig.TILE_SIZE;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, GameConfig.TILE_SIZE, GameConfig.TILE_SIZE);
                
                const texture = new cc.Texture2D();
                texture.initWithElement(canvas);
                texture.handleLoadedTexture();
                
                const spriteFrame = new cc.SpriteFrame();
                spriteFrame.setTexture(texture);
                spriteFrame.setRect(cc.rect(0, 0, GameConfig.TILE_SIZE, GameConfig.TILE_SIZE));
                spriteComponent.spriteFrame = spriteFrame;
            } catch (e) {
            }
        }
        
        node.color = color;
        spriteComponent.enabled = true;
        node.active = true;
        this.node.addChild(node);
    }


    /**
     * Получить цвет для типа тайла
     */
    private getColorForTileType(type: number): cc.Color {
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
     * Добавить визуальные эффекты для тайла
     */
    private addTileEffects(node: cc.Node): void {
        node.setScale(0.95);
        node.opacity = 0;
        const fadeIn = cc.fadeIn(0.2);
        const scaleTo = cc.scaleTo(0.2, 1.0);
        node.runAction(cc.spawn(fadeIn, scaleTo));
    }

    /**
     * Обновление поля после изменений
     * Оптимизированная версия - обновляет только измененные тайлы, чтобы избежать мерцания
     */
    public refreshField(): void {
        if (!this.tileManager) {
            console.warn('[REFRESH] No tileManager, cannot refresh field');
            return;
        }

        const field = this.tileManager.getField();
        const tileViewMap = new Map<Tile, any>();
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            if (this.tileViews[row]) {
                for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                    const view = this.tileViews[row][col];
                    if (view && view.tile) {
                        tileViewMap.set(view.tile, view);
                    }
                }
            }
        }

        const newTileViews: (TileView | null)[][] = [];
        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            newTileViews[row] = [];
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                newTileViews[row][col] = null;
            }
        }

        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const tile = field[row][col];

                if (tile) {
                    if (tile.row !== row || tile.col !== col) {
                        tile.updatePosition(row, col);
                    }

                    let existingView = tileViewMap.get(tile);

                    if (existingView && existingView.node && cc.isValid(existingView.node)) {
                        if (existingView.updatePosition) {
                            existingView.updatePosition(row, col);
                        } else if (existingView.updateNodePosition) {
                            existingView.updateNodePosition(row, col);
                            if (existingView.currentRow !== undefined) {
                                existingView.currentRow = row;
                                existingView.currentCol = col;
                            }
                        }
                        
                        if (existingView.updateVisual) {
                            existingView.updateVisual();
                        } else {
                            const sprite = existingView.node.getComponent(cc.Sprite);
                            if (sprite && tile) {
                                const frameIndex = tile.type;
                                if (TileView.loadedFrames && TileView.loadedFrames[frameIndex]) {
                                    sprite.spriteFrame = TileView.loadedFrames[frameIndex];
                                } else {
                                    const color = this.getColorForTileType(tile.type);
                                    existingView.node.color = color;
                                }
                            }
                        }
                        
                        existingView.tile = tile;
                        newTileViews[row][col] = existingView;
                    } else {
                        this.createTileView(tile, row, col);
                        newTileViews[row][col] = this.tileViews[row] ? this.tileViews[row][col] : null;
                    }
                } else {
                    newTileViews[row][col] = null;
                }
            }
        }

        for (const [tile, view] of tileViewMap.entries()) {
            let found = false;
            for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
                for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                    if (newTileViews[row][col] === view) {
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            
            if (!found && view && view.node && cc.isValid(view.node)) {
                view.node.destroy();
            }
        }

        this.tileViews = newTileViews;
    }

    /**
     * Анимация сжигания тайлов
     */
    public playBurnAnimation(tiles: Tile[], callback?: () => void): void {
        let completed = 0;
        const total = tiles.length;

        if (total === 0) {
            if (callback) callback();
            return;
        }

        for (const tile of tiles) {
            let tileView: any = null;

            for (let r = 0; r < GameConfig.FIELD_HEIGHT; r++) {
                if (this.tileViews[r]) {
                    for (let c = 0; c < GameConfig.FIELD_WIDTH; c++) {
                        const view = this.tileViews[r][c];
                        if (view && view.tile === tile) {
                            tileView = view;
                            break;
                        }
                    }
                    if (tileView) break;
                }
            }

            if (tileView && tileView.playBurnAnimation) {
                tileView.playBurnAnimation(() => {
                    completed++;
                    if (completed === total && callback) {
                        callback();
                    }
                });
            } else {
                completed++;
                if (completed === total && callback) {
                    callback();
                }
            }
        }
    }

    /**
     * Анимация падения тайлов
     */
    public playFallAnimation(callback?: () => void): void {
        if (!this.tileManager) {
            if (callback) callback();
            return;
        }

        const field = this.tileManager.getField();
        let animationsCount = 0;
        let completedAnimations = 0;

        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const tile = field[row][col];
                const oldTileView = this.tileViews[row] ? this.tileViews[row][col] : null;
                
                if (tile && oldTileView) {
                    const targetY = this.calculateYPosition(row);
                    const currentY = oldTileView.node.y;
                    
                    if (Math.abs(targetY - currentY) > 1) {
                        animationsCount++;
                    }
                }
            }
        }

        if (animationsCount === 0) {
            if (callback) callback();
            return;
        }

        for (let row = 0; row < GameConfig.FIELD_HEIGHT; row++) {
            for (let col = 0; col < GameConfig.FIELD_WIDTH; col++) {
                const tile = field[row][col];
                const oldTileView = this.tileViews[row] ? this.tileViews[row][col] : null;
                
                if (tile && oldTileView) {
                    const targetY = this.calculateYPosition(row);
                    const currentY = oldTileView.node.y;
                    
                    if (Math.abs(targetY - currentY) > 1) {
                        oldTileView.playFallAnimation(targetY, 0.3, () => {
                            completedAnimations++;
                            if (completedAnimations === animationsCount && callback) {
                                callback();
                            }
                        });
                    }
                }
            }
        }
    }

    /**
     * Вычисление Y позиции для строки
     */
    private calculateYPosition(row: number): number {
        const startY = (GameConfig.FIELD_HEIGHT * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING)) / 2;
        return startY - row * (GameConfig.TILE_SIZE + GameConfig.TILE_SPACING) - GameConfig.TILE_SIZE / 2;
    }

    /**
     * Обновление представления после заполнения пустых ячеек
     */
    public updateAfterFill(): void {
        this.scheduleOnce(() => {
            this.refreshField();
        }, 0.1);
    }
}
