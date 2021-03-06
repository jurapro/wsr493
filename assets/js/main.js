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
        this.position = {
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
        this.bindKeyEvents();
    }

    createElement() {
        return $(`<div class="element ${this.constructor.name.toLowerCase()}"></div>`);
    }

    removeElement() {
        this.$element.remove();
    }

    bindKeyEvents() {
        return null;
    }

    update() {
        this.position.x += this.offsets.x;
        this.position.y += this.offsets.y;
    }

    draw() {
        this.$element.css({
            left: this.position.x + 'px',
            top: this.position.y + 'px',
            width: this.size.w + 'px',
            height: this.size.h + 'px',
        })
    }

    isCollision(elements) {
        let a = {
            x1: this.position.x,
            x2: this.position.x + this.size.w,
            y1: this.position.y,
            y2: this.position.y + this.size.h,
        }
        let b = {
            x1: elements.position.x,
            x2: elements.position.x + elements.size.w,
            y1: elements.position.y,
            y2: elements.position.y + elements.size.h,
        }
        return a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
    }

    isLeftBorderCollision() {
        return this.position.x < this.speedPerFrame;
    }

    isRightBorderCollision() {
        return this.position.x > this.game.$zone.width() - this.size.w - this.speedPerFrame;
    }

    isTopBorderCollision() {
        return this.position.y < this.speedPerFrame;
    }

    isBottomBorderCollision() {
        return this.position.y + this.speedPerFrame > this.game.$zone.height();
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
        this.position = {
            x: this.game.$zone.width() / 2 - this.size.w / 2,
            y: this.game.$zone.height() - this.size.h
        };
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false
        }
        this.speedPerFrame = 20;

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
        switch (true) {
            case this.keys.ArrowLeft:
                if (this.isLeftBorderCollision()) {
                    this.position.x = 0;
                    break;
                }
                this.position.x -= this.speedPerFrame;
                break;
            case this.keys.ArrowRight:
                if (this.isRightBorderCollision()) {
                    this.position.x = this.game.$zone.width() - this.size.w;
                    break;
                }
                this.position.x += this.speedPerFrame;
                break;
        }
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
        this.position = {
            x: this.game.$zone.width() / 2 - this.size.w / 2,
            y: this.speedPerFrame + 5,
        };

        this.offsets.y = this.speedPerFrame;
    }

    update() {
        if (this.isCollision(this.game.player)) {
            document.dispatchEvent(new CustomEvent('player-collision'));
            this.changeDirection();
        }
        if (this.isTopBorderCollision()) {
            this.changeDirection();
        }
        if (this.isLeftBorderCollision() || this.isRightBorderCollision()) {
            this.changeDirectionX();
        }
        if (this.isBottomBorderCollision()) {
            document.dispatchEvent(new CustomEvent('missed-ball'));
        }
        super.update();
    }

    //установка обработчика события столкновение с блоком
    bindKeyEvents() {
        document.addEventListener('block-collision', this.changeDirection.bind(this));
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

class Block extends Drawable {
    constructor(game) {
        super(game);
        this.size = {
            h: 50,
            w: 150
        };

    }

    update() {
        if (this.isCollision(this.game.ball)) {

            document.dispatchEvent(new CustomEvent(
                'block-collision', {
                    detail: {element: this}
                }));

            this.removeElement();
        }
        super.update();
    }
}

class Game {
    //Базовые настройки игры
    constructor() {
        this.options = {
            godMode: true,
            score: 0,
            scoreRate: 1,
            status: 'progress',
            pause: false,
            timer: {
                second: 0,
                tik: 0
            }
        };
        this.keys = {
            Escape: false,
            Space: false,
        }

        this.$panel = $('#game .panel');
        this.$zone = $('#game .elements');
        this.$endGame = $('#game .end-game');

        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
        this.blocksGenerate({rows: 1, gap: 50});
        this.bindKeyEvents();
    }

    bindKeyEvents() {
        document.addEventListener('block-collision', this.blockCollision.bind(this));
        document.addEventListener('player-collision', this.playerCollision.bind(this));
        document.addEventListener('missed-ball', this.losingGame.bind(this));
        document.addEventListener('keyup', ev => this.changeKeyStatus(ev.code));
    }

    changeKeyStatus(code) {
        if (code in this.keys) {
            this.keys[code] = !this.keys[code];
        }
    }

    // Генерация элемента
    generate(ClassName) {
        let element = new ClassName(this);
        this.elements.push(element);
        this.$zone.append(element.$element);
        return element;
    }

    blockCollision(event) {
        this.options.score += this.options.scoreRate;
        this.options.scoreRate++;
        this.remove(event);
    }

    playerCollision() {
        this.options.scoreRate = 1;
    }

    remove(event) {
        let element = event.detail.element;

        let ind = this.elements.indexOf(element);
        if (ind === -1) return false;
        return this.elements.splice(ind, 1);
    }

    // Генерация блока
    blockGenerate(position) {
        let block = this.generate(Block);
        block.position = position;
    }

    // Генерация блоков в игре
    blocksGenerate(options) {
        let {w: blockW, h: blockH} = (new Block).size;
        let {gap: gap, rows: rows} = options;

        for (let y = 1; y <= rows; y++) {
            for (let x = gap; x < this.$zone.width() - blockW; x += blockW + gap) {
                let position = {x: x, y: y * (blockH + gap)};
                this.blockGenerate(position);
            }
        }
    }

    //старт игры
    start() {
        this.loop();
    }

    //бесконечный игровой цикл
    loop() {
        requestAnimationFrame(() => {
            if (!this.options.pause) {
                this.updateElements();
                this.updateGame();
            }
            this.updatePause();
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

    updateGame() {
        if (this.options.godMode) {
            this.godMode();
        }


        if (this.isWin()) {
            this.winGame();
        }
        this.updateTime();
        this.updatePanel();
    }

    updatePause() {
        this.options.pause = this.keys.Escape;
        if (this.options.pause) {
            this.$panel.addClass('pause');
        } else {
            this.$panel.removeClass('pause');
        }
    }

    updateTime() {
        this.options.timer.tik++;
        if (this.options.timer.tik === 60) {
            this.options.timer.tik = 0;
            this.options.timer.second++;
        }
    }

    updatePanel() {
        let {min, sec} = this.getFormattedTime(this.options.timer.second);
        this.$panel.html(`<span>Количество очков: ${this.options.score}</span>
            <span> Таймер: ${min}:${sec} </span>`);
    }

    losingGame() {
        this.keys.Escape = true;
        this.options.status = 'losing';

        this.showResult();
    }

    winGame() {
        this.keys.Escape = true;
        this.options.status = 'win';

        this.showResult();
    }

    getFormattedTime(sec) {
        let min = Math.floor(sec / 60);
        min = (min < 10) ? '0' + min : min;
        sec = sec % 60;
        sec = (sec < 10) ? '0' + sec : sec;

        return {
            min: min,
            sec: sec
        }
    }

    showResult() {
        let finalResult = {
            'score': this.options.score,
            'time': this.getFormattedTime(this.options.timer.second)
        }
        let message = '';
        const result = this.$endGame.children('.result');


        switch (this.options.status) {
            case "losing":
                message = 'Вы проиграли';
                result.css({
                    backgroundColor: 'red'
                });
                break;
            case "win":
                message = 'Вы выиграли';
                result.css({
                    backgroundColor: 'green'
                });
                break;
        }

        result.html(`
            <h2>${message}</h2>
            <span>Очки: ${finalResult.score}</span>
            <span> Таймер: ${finalResult.time.min}:${finalResult.time.sec} </span>
            <button>Играть заново</button>
        `);
        const button = document.querySelector('.result button');
        button.addEventListener('click', this.restart.bind(this));

        this.$endGame.css({
            display: 'flex'
        });

        fetch('result.php')
            .then(data => data.text())
            .then(text => {
                result.append(text);
            });
    }

    isWin() {
        return this.elements.filter(el => el.constructor.name === 'Block').length === 0;
    }

    godMode() {
        switch (true) {
            case this.keys.Space:
                this.killAll();
                break;
        }
    }

    killAll() {
        let block = this.elements.filter(el => el.constructor.name === 'Block');

        block.forEach(el => {
            el.removeElement();
            document.dispatchEvent(new CustomEvent(
                'block-collision', {
                    detail: {element: el}
                }));
        });
    }

    restart() {
        this.newGame();
        this.$endGame.css('display', 'none');
    }

    newGame() {
        this.$zone.html('');
        this.options = {
            godMode: true,
            score: 0,
            scoreRate: 1,
            status: 'progress',
            pause: false,
            timer: {
                second: 0,
                tik: 0
            }
        };
        this.keys = {
            Escape: false,
            Space: false,
        }

        this.elements = [];
        this.player = this.generate(Player);
        this.ball = this.generate(Ball);
        this.blocksGenerate({rows: 1, gap: 50});
    }
}

const game = new Game();
game.start();
