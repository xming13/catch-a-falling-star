var XMing = XMing || {};

XMing.Character = function(x, y, width, height, velocityX) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.width = width;
    this.height = height;
    this.velocityX = velocityX;
};
XMing.Character.prototype.update = function() {

    if (this.x < this.targetX) {
        if (this.x + this.velocityX > this.targetX) {
            this.x = this.targetX;
        } else {
            this.x += this.velocityX;
        }
    }
    if (this.x > this.targetX) {
        if (this.x - this.velocityX < this.targetX) {
            this.x = this.targetX;
        } else {
            this.x -= this.velocityX;
        }
    }
};
XMing.Character.prototype.render = function(context) {
    context.save();
    context.fillStyle = "yellow";
    context.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    context.restore();
};

XMing.TwinkleStar = function(canvas) {
    var randomSize = _.random(canvas.width / 20);

    this.x = _.random(canvas.width);
    this.y = _.random(canvas.height / 10 * 4);
    this.width = randomSize;
    this.height = randomSize;
};
XMing.TwinkleStar.prototype.update = function() {

};
XMing.TwinkleStar.prototype.render = function(context) {
    context.save();

    var img = new Image();
    img.src = "images/twinkle-star.png";

    context.globalAlpha = _.random(0.5, 1);
    context.translate(this.x, this.y);
    context.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

    context.restore();
};

XMing.FallingStar = function(canvas) {
    var starSize = _.random(10, canvas.width / 20);

    this.x = _.random(canvas.width);
    this.y = _.random(canvas.height / 10, canvas.height / 10 * 2);
    this.width = starSize;
    this.height = starSize;
    this.velocityY = _.random(2, canvas.height / 200);
    this.isCaught = false;
    this.rotateAngle = 0;
};
XMing.FallingStar.prototype.update = function() {
    this.y += this.velocityY;
    this.rotateAngle += 2 * Math.PI / 180;
};
XMing.FallingStar.prototype.render = function(context) {
    if (!this.isCaught) {
        context.save();

        context.translate(this.x, this.y);
        context.rotate(this.rotateAngle);
        var img = new Image();
        img.src = "images/falling-star.png";
        context.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

        context.restore();
    }
};

XMing.GameStateManager = new function() {
    // declare variables
    var requestID;
    var canvas;
    var context;
    var gameState;
    var character;
    var sparks = [];
    var stars = [];
    var score = 0;

    // declare CONSTANTS
    var GAME_STATE_ENUM = {
        INITIAL: "initial",
        START: "start",
        PAUSE: "pause",
        END: "end"
    };

    this.init = function() {
        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');

        canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        canvas.addEventListener('touchmove', this.onMouseMove.bind(this), false);
        canvas.addEventListener('click', this.onClick.bind(this), false);
        window.addEventListener("keydown", this.onKeyDown.bind(this), false);
        window.addEventListener('resize', this.resizeCanvas.bind(this), false);

        this.initGame();
        this.update();
    },
        // The main loop where everything happens
        this.update = function() {
            requestID = requestAnimFrame(this.update.bind(this));

            if (this.isGameStateStart()) {

                sparks = _.filter(sparks, function(spark) {
                    return _.random(200) != 50;
                });
                for (var i = 0; i < 100; i++) {
                    if (_.random(200) == 50) {
                        sparks.push(new XMing.TwinkleStar(canvas));
                    }
                }

                stars = _.filter(stars, function(star) {
                    return star.y < canvas.height / 10 * 9 && !star.isCaught
                });

                if (_.random(100) == 50) {
                    var starSize = canvas.width / 40;
                    stars.push(new XMing.FallingStar(canvas));
                }

                character.update();
                _.each(stars, function(star) {
                    star.update();
                    if (star.x >= character.x - character.width / 2 && star.x <= character.x + character.width / 2 && star.y >= character.y - character.height / 2 && star.y <= character.y + character.height / 2) {

                        star.isCaught = true;
                        score++;
                    }
                });
            }
            this.render();
        },
        // render method
        this.render = function() {
            context.clearRect(0, 0, canvas.width, canvas.height);

            if (this.isGameStateStart()) {
                character.render(context);

                _.each(stars, function(star) {
                    star.render(context);
                });
                _.each(sparks, function(spark) {
                    spark.render(context);
                });

                context.save();
                context.fillStyle = "white";
                var baseY = canvas.height / 10 * 9 + canvas.width / 20 / 2;
                context.fillRect(0, baseY, canvas.width, canvas.height - baseY);
                context.restore();

                this.renderScore();

                if (this.isGameStateEnd()) {
                    context.save();
                    context.fillStyle = "rgba(0,0,0,.5)";
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    context.fillStyle = "rgba(255,255,255,.5)";
                    context.fillRect(canvas.width / 4, canvas.height / 4, canvas.width / 4 * 2, canvas.height / 4 * 2);
                    context.font = "30pt Calibri";
                    context.textAlign = "center";
                    context.textBaseline = "top";
                    context.fillStyle = "rgba(0,0,0,1)";
                    context.wrapText("Game over \n Try again", canvas.width / 2, canvas.height / 4, canvas.width / 2, canvas.height / 4);
                    context.restore();
                }
            }
        },
        // render score at the top right corner
        this.renderScore = function() {
            context.save();
            var img = new Image();
            img.src = "images/falling-star.png";
            context.translate(canvas.width / 20 * 16, canvas.width / 20 / 3);
            context.drawImage(img, 0, 0, canvas.width / 20, canvas.width / 20);
            context.translate(canvas.width / 20, -canvas.width / 20 / 3);
            context.font = canvas.width / 20 + "pt Calibri";
            context.textAlign = "left";
            context.textBaseline = "top";
            context.fillStyle = "white";
            context.fillText(":", 0, 0);
            context.translate(canvas.width / 20 / 2, 0);
            context.textAlign = "left";
            context.fillText(score, 0, 0);
            context.restore();
        },
        // handle key down event
        this.onKeyDown = function(event) {
            var charCode = event.charCode || event.keyCode;

            if (charCode >= 47 && charCode <= 90) {
                charCode = decodeURI('%' + (charCode).toString(16)).toLowerCase();
            }

            if (this.isGameStateInitial() || this.isGameStateEnd()) {
                // enter key
                if (charCode == 13) {
                    this.startGame();
                }
            } else if (this.isGameStateStart()) {

                // left arrow
                if (charCode == 37) {
                    if (character.x - 30 * character.velocityX < character.width / 2) {
                        character.targetX = character.width / 2;
                    } else {
                        character.targetX = character.x - 30 * character.velocityX;
                    }
                }
                // right arrow
                if (charCode == 39) {
                    if (character.x + 30 * character.velocityX > canvas.width - character.width / 2) {
                        character.targetX = canvas.width - character.width / 2;
                    } else {
                        character.targetX = character.x + 30 * character.velocityX;
                    }
                }
            }
        },
        // handle mouse move event
        this.onMouseMove = function(event) {
            if (navigator.userAgent.match(/Android/i)) {
                event.preventDefault();
            }
            var mousePos = this.getMousePos(event);

            if (mousePos.x < character.width / 2) {
                character.targetX = character.width / 2;
            } else if (mousePos.x > canvas.width - character.width / 2) {
                character.targetX = canvas.width - character.width / 2;
            } else {
                character.targetX = mousePos.x;
            }
        },
        // handle touch start event
        this.onTouchStart = function(event) {
            if (navigator.userAgent.match(/Android/i)) {
                event.preventDefault();
            }
        },
        // handle click event
        this.onClick = function(event) {
            if (navigator.userAgent.match(/Android/i)) {
                event.preventDefault();
            }
            var mousePos = this.getMousePos(event);

            if (mousePos.x < character.width / 2) {
                character.targetX = character.width / 2;
            } else if (mousePos.x > canvas.width - character.width / 2) {
                character.targetX = canvas.width - character.width / 2;
            } else {
                character.targetX = mousePos.x;
            }

            if (mousePos.x >= canvas.width / 4 && mousePos.x <= canvas.width / 4 * 3 && mousePos.y >= canvas.height / 4 && mousePos.y <= canvas.height / 4 * 3) {
                if (this.isGameStateInitial() || this.isGameStateEnd()) {
                    this.startGame();
                }
            }
        },
        // get mouse position in canvas
        this.getMousePos = function(event) {
            var rect = canvas.getBoundingClientRect();
            return {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
            };
        },
        this.resizeCanvas = function() {
            var width = canvas.clientWidth;
            var height = canvas.clientHeight;
            if (canvas.width != width ||
                canvas.height != height) {
                // Change the size of the canvas to match the size it's being displayed
                canvas.width = width;
                canvas.height = height;
            }
        },
        // game status operation
        this.initGame = function() {
            gameState = GAME_STATE_ENUM.INITIAL;
        },
        this.startGame = function() {

            gameState = GAME_STATE_ENUM.START;
            this.resizeCanvas();
            character = new XMing.Character(canvas.width / 2, canvas.height / 10 * 9,
                canvas.width / 20, canvas.width / 20, canvas.width / 300);
            sparks = [];

            while (sparks.length < 50) {
                sparks.push(new XMing.TwinkleStar(canvas));
            }
            stars = [];
            score = 0;
        },
        this.endGame = function() {
            gameState = GAME_STATE_ENUM.END;
        },

        // check game state
        this.isGameStateInitial = function() {
            return gameState == GAME_STATE_ENUM.INITIAL;
        },
        this.isGameStateStart = function() {
            return gameState == GAME_STATE_ENUM.START;
        },
        this.isGameStateEnd = function() {
            return gameState == GAME_STATE_ENUM.END;
        }
}