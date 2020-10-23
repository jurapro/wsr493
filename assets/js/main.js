function random(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//базовый класс для всех отображаемых объектов в игре
class Drawable {
    constructor(game) {
        this.game = game;
        this.$element = this.createElement();
        this.postion = {
            x: 0,
            y: 0,
        }
        this.size = {
            w: 0,
            h: 0,
        }
        this.offsets = {
            x: 0,
            y: 0,
        }
        this.speedPerFrame = 0;
    }

    createElement() {
        let $element = $(`<div class="element ${this.constructor.name.toLowerCase()}"></div>`);
        this.game.$zone.append($element);
        return $element;
    }

    update() {
        this.postion.x += this.offsets.x;
        this.postion.y += this.offsets.y;
    }

    draw() {
        this.$element.css({
            left: this.postion.x + 'px',
            top: this.postion.y + 'px',
            width: this.size.w + 'px',
            height: this.size.h + 'px',
        })
    }

    isCollision(elements) {
        let a = {
            x1: this.postion.x,
            x2: this.postion.x + this.size.w,
            y1: this.postion.y,
            y2: this.postion.y + this.size.h,
        }
        let b = {
            x1: elements.postion.x,
            x2: elements.postion.x + elements.size.w,
            y1: elements.postion.y,
            y2: elements.postion.y + elements.size.h,
        }
        return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
    }

    isLeftBorderCollision() {
        return this.postion.x < this.speedPerFrame;
    }

    isRightBorderCollision() {
        return this.postion.x > this.game.$zone.width() - this.size.w - this.speedPerFrame;
    }

    isTopBorderCollision() {
        return this.postion.y < this.speedPerFrame;
    }
}

//класс для игрока
class Player extends Drawable {

    constructor(game) {
        super(game);
        this.size = {
            h: 20,
            w: 100
        };
        this.postion = {
            x: this.game.$zone.width() / 2 - this.size.w / 2,
            y: this.game.$zone.height() - this.size.h
        };
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false
        }
        this.speedPerFrame = 20;
        this.bindKeyEvents();
    }

    bindKeyEvents() {
        document.addEventListener('keydown', ev => this.changeKeyStatus(ev.code, true));
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code, false));
    }

    changeKeyStatus(code, value) {
        if (code in this.keys) {
            this.keys[code] = value;
        }
    }

    update() {
        if (this.isLeftBorderCollision() && this.keys.ArrowLeft ) {
            this.postion.x = 0;
            return;
        }
        if (this.isRightBorderCollision() && this.keys.ArrowRight) {
            this.postion.x = this.game.$zone.width() - this.size.w;
            return;
        }

        switch (true) {
            case this.keys.ArrowLeft:
                this.offsets.x = -this.speedPerFrame;
                break;
            case this.keys.ArrowRight:
                this.offsets.x = this.speedPerFrame;
                break;
            default:
                this.offsets.x = 0;
        }

        super.update();
    }
}

class Ball extends Drawable {
    constructor(game) {
        super(game);
        this.speedPerFrame = 5;
        this.size = {
            h: 20,
            w: 20
        };
        this.postion = {
            x: this.game.$zone.width() / 2 - this.size.w / 2,
            y: this.speedPerFrame + 5,
        };

        this.offsets.y = this.speedPerFrame;
    }

    update() {
        if (this.isCollision(this.game.player)) {
            this.changeDirection();
        }
        if (this.isTopBorderCollision()) {
            this.changeDirection();
        }

        if (this.isLeftBorderCollision() || this.isRightBorderCollision()) {
            this.changeDirectionX();
        }

        super.update();
    }

    changeDirectionY() {
        this.offsets.y *= -1;
    }

    changeDirection() {
        if (random(0, 1)) {
            this.changeDirectionY();
        } else {
            this.changeDirectionY();
            this.offsets.x = random(-5, 5);
        }
    }

    changeDirectionX() {
        this.offsets.x *= -1;
    }
}

class Game {
    //Базовые настройки игры
    constructor() {
        this.$zone = $('#game .elements');
        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
    }

    // Генерация элемента
    generate(ClassName) {
        let element = new ClassName(this);
        this.elements.push(element);
        return element;
    }

    //старт игры
    start() {
        this.loop();
    }

    //бесконечный игровой цикл
    loop() {
        requestAnimationFrame(() => {
            this.updateElements();
            this.loop();
        });
    }

    //обновление всех игровых элементов
    updateElements() {
        this.elements.forEach(element => {
            element.update();
            element.draw();
        })
    }
}

const game = new Game();
game.start();
