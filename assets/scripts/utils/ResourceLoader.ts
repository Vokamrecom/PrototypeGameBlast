/**
 * Утилита для загрузки ресурсов (спрайтов)
 */
export class ResourceLoader {
    /**
     * Загрузить спрайт-фрейм по пути
     */
    public static loadSpriteFrame(path: string, callback: (frame: cc.SpriteFrame) => void): void {
        if (typeof cc !== 'undefined' && cc.resources && typeof cc.resources.load === 'function') {
            cc.resources.load(path, cc.SpriteFrame, (err: Error, spriteFrame: cc.SpriteFrame) => {
                if (err) {
                    this.tryAssetManagerLoad(path, callback);
                } else {
                    callback(spriteFrame);
                }
            });
        } else {
            this.tryAssetManagerLoad(path, callback);
        }
    }
    
    private static tryAssetManagerLoad(path: string, callback: (frame: cc.SpriteFrame) => void): void {
        if (typeof cc !== 'undefined' && cc.assetManager && cc.assetManager.resources) {
            const resources = cc.assetManager.resources;
            if (resources && typeof resources.load === 'function') {
                try {
                    resources.load(path, cc.SpriteFrame, (err: Error, spriteFrame: cc.SpriteFrame) => {
                        if (err) {
                            callback(null);
                        } else {
                            callback(spriteFrame);
                        }
                    });
                } catch (e) {
                    callback(null);
                }
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    }

    /**
     * Загрузить несколько спрайт-фреймов
     */
    public static loadSpriteFrames(paths: string[], callback: (frames: cc.SpriteFrame[]) => void): void {
        const frames: cc.SpriteFrame[] = [];
        let loaded = 0;
        const total = paths.length;

        if (total === 0) {
            callback([]);
            return;
        }

        paths.forEach((path, index) => {
            this.loadSpriteFrame(path, (frame) => {
                frames[index] = frame;
                loaded++;
                if (loaded === total) {
                    callback(frames);
                }
            });
        });
    }

    /**
     * Получить путь к спрайту тайла по типу
     */
    public static getTileSpritePath(type: number): string {
        const paths = [
            'maket/block_red',
            'maket/block_green',
            'maket/block_blue',
            'maket/block_yellow',
            'maket/block_purpure',
            'maket/block_yellow' // ORANGE используем желтый как запасной
        ];
        return paths[type] || paths[0];
    }

    /**
     * Получить пути ко всем спрайтам тайлов
     */
    public static getTileSpritePaths(): string[] {
        return [
            'maket/block_red',
            'maket/block_green',
            'maket/block_blue',
            'maket/block_yellow',
            'maket/block_purpure',
            'maket/block_yellow' // ORANGE
        ];
    }

    /**
     * Получить путь к фоновому изображению
     */
    public static getBackgroundPath(name: string): string {
        const paths: { [key: string]: string } = {
            'booster': 'maket/bg_booster',
            'frame_moves': 'maket/bg_frame_moves',
            'frame_play': 'maket/bg_frame_play',
            'moves': 'maket/bg_moves',
            'slot_booster': 'maket/slot_booster',
            'slot_frame_moves': 'maket/slot_frame_moves'
        };
        return paths[name] || '';
    }
}
