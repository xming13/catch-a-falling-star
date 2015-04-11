var XMing = XMing || {};

XMing.GameStateManager = new function() {
    // declare variables
    var requestID;
    var canvas;
    var context;
    var gameState;
    var character;
    var twinkleStars = [];
    var fallingStars = [];
    var messages = [];
    var score = 0;
    var gameTimer;
    var remainingTime = 30;
    var imageObj = {};

    // declare CONSTANTS
    var GAME_STATE_ENUM = {
        INITIAL: "initial",
        START: "start",
        PAUSE: "pause",
        END: "end"
    };

    this.init = function() {
        var self = this;

        FastClick.attach(document.body);

        $(".btn-play").click(function() {
            self.startGame();
        });

        $("#show-hide-lyrics").click(function() {
            if ($(".lyrics").is(":visible")) {
                $(".lyrics").hide();
                $("#show-hide-lyrics").html("Show lyrics");
            } else {
                $(".lyrics").show();
                $("#show-hide-lyrics").html("Hide lyrics");
            }
        });

        canvas = document.getElementById('canvas');
        context = canvas.getContext('2d');

        canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        //canvas.addEventListener('touchstart', this.onTouchStart.bind(this), false);
        canvas.addEventListener('touchmove', this.onMouseMove.bind(this), false);
        canvas.addEventListener('click', this.onClick.bind(this), false);
        window.addEventListener("keydown", this.onKeyDown.bind(this), false);
        window.addEventListener('resize', this.resizeCanvas.bind(this), false);

        var imgCharacter = new Image();
        imgCharacter.src = "images/character.png";
        imageObj["character"] = imgCharacter;
        var imgCharacterLeft = new Image();
        imgCharacterLeft.src = "images/character-left.png";
        imageObj["character-left"] = imgCharacterLeft;
        var imgCharacterRight = new Image();
        imgCharacterRight.src = "images/character-right.png";
        imageObj["character-right"] = imgCharacterRight;
        var imgTwinkleStar = new Image();
        imgTwinkleStar.src = "images/twinkle-star.png";
        imageObj["twinkle-star"] = imgTwinkleStar;
        var imgFallingStar = new Image();
        imgFallingStar.src = "images/falling-star.png";
        imageObj["falling-star"] = imgFallingStar;
        var imgStarWithBorder = new Image();
        imgStarWithBorder.src = "images/star-with-border.png";
        imageObj["star-with-border"] = imgStarWithBorder;

        this.initGame();
        this.update();
    };

    // The main loop where everything happens
    this.update = function() {
        requestID = requestAnimFrame(this.update.bind(this));

        if (this.isGameStateStart()) {

            if (remainingTime <= 0) {
                this.endGame();
            }

            character.update();

            twinkleStars = _.filter(twinkleStars, function() {
                return _.random(200) != 50;
            });
            for (var i = 0; i < 100; i++) {
                if (_.random(200) == 50) {
                    twinkleStars.push(new XMing.TwinkleStar(canvas));
                }
            }

            fallingStars = _.filter(fallingStars, function(fallingStar) {
                return !fallingStar.isGone && !fallingStar.isCaught;
            });

            if (_.random(50) == 25) {
                fallingStars.push(new XMing.FallingStar(canvas));
            }

            messages = _.filter(messages, function(message) {
                return message.alpha > 0;
            });
            _.each(messages, function(message) {
                message.update();
            });

            _.each(fallingStars, function(fallingStar) {
                fallingStar.update();
                if (!fallingStar.isStopped && fallingStar.x >= character.x - character.width / 2 && fallingStar.x <= character.x + character.width / 2 && fallingStar.y >= character.y - character.height / 2 && fallingStar.y <= character.y + character.height / 2) {

                    fallingStar.isCaught = true;
                    messages.push(new XMing.Message(character.x, character.y - character.height / 2, canvas.width / 30));
                    score++;
                }
            });
        } else if (this.isGameStateEnd()) {
            messages = _.filter(messages, function(message) {
                return message.alpha > 0;
            });
            _.each(messages, function(message) {
                message.update();
            });
        }
        this.render();
    };

    // render method
    this.render = function() {
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (this.isGameStateStart() || this.isGameStateEnd()) {
            character.render(context);

            _.each(fallingStars, function(fallingStar) {
                fallingStar.render(context);
            });
            _.each(twinkleStars, function(twinkleStar) {
                twinkleStar.render(context);
            });
            _.each(messages, function(message) {
                message.render(context);
            });

            context.save();
            context.fillStyle = "white";
            var baseY = canvas.height / 10 * 9;
            context.fillRect(0, baseY, canvas.width, canvas.height - baseY);
            context.restore();

            this.renderTime();
            this.renderScore();
        }
        if (this.isGameStateEnd()) {
            context.save();
            context.fillStyle = "rgba(0,0,0,.5)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "rgba(255,255,255,.5)";
            context.fillRect(canvas.width / 8, canvas.height / 8, canvas.width / 8 * 6, canvas.height / 8 * 6);
            context.font = canvas.width / 4 * 2 / 12 + "pt Calibri";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "black";
            context.wrapText("\nCongratulations! \n You have collected " + score + " stars!\n Try again!",
                canvas.width / 2, canvas.height / 8, canvas.width / 8 * 6, canvas.height / 8 * 6 / 4);
            context.restore();
        }
    };

    // render time at the top left corner
    this.renderTime = function() {
        context.save();

        context.font = canvas.width / 20 + "pt Calibri";
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = "white";
        context.fillText("Time left: " + remainingTime, 10, 0);

        context.restore();
    };

    // render score at the top right corner
    this.renderScore = function() {
        context.save();
        var img = new Image();
        img.src = "images/falling-star.png";
        context.translate(canvas.width / 20 * 17, canvas.width / 20 / 3);
        context.drawImage(img, 0, 0, canvas.width / 20, canvas.width / 20);
        context.translate(canvas.width / 20, -canvas.width / 20 / 3);
        context.font = canvas.width / 20 + "pt Calibri";
        context.textAlign = "left";
        context.textBaseline = "top";
        context.fillStyle = "white";
        context.fillText(":", 0, 0);
        context.translate(canvas.width / 20 / 2, 0);
        context.textAlign = "left";
        context.fillText("" + score, 0, 0);
        context.restore();
    };

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
    };

    // handle mouse move event
    this.onMouseMove = function(event) {

        if (this.isGameStateStart()) {
            var mousePos = this.getMousePos(event);

            if (mousePos.x < character.width / 2) {
                character.targetX = character.width / 2;
            } else if (mousePos.x > canvas.width - character.width / 2) {
                character.targetX = canvas.width - character.width / 2;
            } else {
                character.targetX = mousePos.x;
            }
        }
    };

    // handle touch start event
    this.onTouchStart = function(event) {

    };

    // handle click event
    this.onClick = function(event) {
        var mousePos = this.getMousePos(event);

        if (this.isGameStateStart()) {
            if (mousePos.x < character.width / 2) {
                character.targetX = character.width / 2;
            } else if (mousePos.x > canvas.width - character.width / 2) {
                character.targetX = canvas.width - character.width / 2;
            } else {
                character.targetX = mousePos.x;
            }
        }
        if (this.isGameStateInitial() || this.isGameStateEnd()) {
            if (mousePos.x >= canvas.width / 4 && mousePos.x <= canvas.width / 4 * 3 && mousePos.y >= canvas.height / 4 && mousePos.y <= canvas.height / 4 * 3) {
                this.startGame();
            }
        }
    };

    // get mouse position in canvas
    this.getMousePos = function(event) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    this.resizeCanvas = function() {
        var width = canvas.clientWidth;
        var height = canvas.clientHeight;

        if (canvas.width != width ||
            canvas.height != height) {

            var ratioX = width / canvas.width;
            var ratioY = height / canvas.height;

            // Change the size of the canvas to match the size it's being displayed
            canvas.width = width;
            canvas.height = height;

            if (character != null) {
                character.resize(canvas, ratioX, ratioY);
            }
            _.each(fallingStars, function(fallingStar) {
                fallingStar.resize(ratioX, ratioY);
            });
            _.each(twinkleStars, function(twinkleStar) {
                twinkleStar.resize(ratioX, ratioY);
            });
            _.each(messages, function(message) {
                message.resize(ratioX, ratioY);
            });
        }
    };

    this.getImage = function(imageName) {
        return imageObj[imageName];
    };

    // game status operation
    this.initGame = function() {
        gameState = GAME_STATE_ENUM.INITIAL;
    };

    this.startGame = function() {
        gameState = GAME_STATE_ENUM.START;

        $("#panel-main").hide();
        $("#panel-game").show();

        this.resizeCanvas();
        character = new XMing.Character(canvas);
        twinkleStars = [];

        while (twinkleStars.length < 40) {
            twinkleStars.push(new XMing.TwinkleStar(canvas));
        }
        fallingStars = [];
        messages = [];
        score = 0;
        remainingTime = 30;

        gameTimer = setInterval(function() {
            remainingTime--;
        }, 1000);

        $('html, body').animate({
            scrollTop: $("#panel-container").offset().top
        }, 'fast');
    };

    this.endGame = function() {
        gameState = GAME_STATE_ENUM.END;
        character.targetX = character.x;
        clearInterval(gameTimer);
        gameTimer = null;
    };

    // check game state
    this.isGameStateInitial = function() {
        return gameState == GAME_STATE_ENUM.INITIAL;
    };

    this.isGameStateStart = function() {
        return gameState == GAME_STATE_ENUM.START;
    };

    this.isGameStateEnd = function() {
        return gameState == GAME_STATE_ENUM.END;
    };
};

XMing.Character = function(canvas) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 10 * 9 - canvas.width / 12 / 2;
    this.targetX = this.x;
    this.width = canvas.width / 12;
    this.height = canvas.width / 12;
    this.velocityX = canvas.width / 300;
    this.isStepped = false;
    this.timer = 0;
};
XMing.Character.prototype.resize = function(canvas, ratioX, ratioY) {
    console.log(ratioX + ", " + ratioY);
    this.x *= ratioX;
    this.y = canvas.height / 10 * 9 - canvas.width / 12 / 2;
    this.targetX *= ratioX;
    this.width *= ratioX;
    this.height = this.width;
    this.velocityX *= ratioX;
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

    var img;
    var numFrame = 10;

    if (this.x > this.targetX || this.x < this.targetX) {
        this.timer++;
        if (this.timer > numFrame) {
            this.timer /= numFrame;
            this.isStepped = !this.isStepped;
        }
        if (this.isStepped) {
            img = XMing.GameStateManager.getImage("character-left");
        } else {
            img = XMing.GameStateManager.getImage("character-right");
        }
    } else {
        img = XMing.GameStateManager.getImage("character");
    }
    context.translate(this.x, this.y);
    context.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

    context.restore();
};

XMing.TwinkleStar = function(canvas) {
    var randomSize = _.random(canvas.width / 20);

    this.x = _.random(canvas.width);
    this.y = _.random(canvas.height / 10 * 4);
    this.width = randomSize;
    this.height = randomSize;
};
XMing.TwinkleStar.prototype.resize = function(ratioX, ratioY) {
    this.x *= ratioX;
    this.y *= ratioY;
    this.width *= ratioX;
    this.height = this.width;
};
XMing.TwinkleStar.prototype.update = function() {

};
XMing.TwinkleStar.prototype.render = function(context) {
    context.save();

    var img = XMing.GameStateManager.getImage("twinkle-star");

    context.globalAlpha = _.random(0.5, 1);
    context.translate(this.x, this.y);
    context.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

    context.restore();
};

XMing.FallingStar = function(canvas) {
    var starSize = _.random(10, canvas.width / 20);

    this.x = _.random(starSize / 2, canvas.width - starSize / 2);
    this.y = _.random(canvas.height / 10, canvas.height / 10 * 2);
    this.width = starSize;
    this.height = starSize;
    this.velocityY = _.random(2, canvas.height / 200);
    this.destY = canvas.height / 10 * 9 - this.height / 2;
    this.isCaught = false;
    this.isStopped = false;
    this.isGone = false;
    this.rotateAngle = 0;
};
XMing.FallingStar.prototype.resize = function(ratioX, ratioY) {
    this.x *= ratioX;
    this.y *= ratioY;
    this.width *= ratioX;
    this.height = this.width;
    this.velocityY *= ratioY;
};
XMing.FallingStar.prototype.update = function() {
    if (this.y < this.destY) {
        if (this.y + this.velocityY >= this.destY) {
            this.y = this.destY;
            this.isStopped = true;
        } else {
            this.y += this.velocityY;
            this.rotateAngle += 2 * Math.PI / 180;
        }
    }
};
XMing.FallingStar.prototype.render = function(context) {
    if (!this.isCaught) {
        context.save();

        context.translate(this.x, this.y);
        context.rotate(this.rotateAngle);

        var img;
        if (this.isStopped) {
            context.globalAlpha = 0.5;
            img = XMing.GameStateManager.getImage("star-with-border");
        } else {
            img = XMing.GameStateManager.getImage("falling-star");
        }
        context.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

        context.restore();
    }
};

XMing.Message = function(x, y, fontSize) {
    this.x = x;
    this.y = y;
    this.text = "+ 1";
    this.alpha = 1.0;
    this.fontSize = fontSize;
};
XMing.Message.prototype.resize = function(ratioX, ratioY) {
    this.x *= ratioX;
    this.y *= ratioY;
    this.fontSize *= ratioX;
};
XMing.Message.prototype.update = function() {
    this.y--;
    this.alpha -= 0.01;
};
XMing.Message.prototype.render = function(context) {
    if (this.alpha > 0) {
        context.save();
        context.globalAlpha = this.alpha;
        context.font = this.fontSize + "pt Calibri";
        context.textAlign = "left";
        context.textBaseline = "bottom";
        context.fillStyle = "white";
        context.fillText(this.text, this.x, this.y);
        context.restore();
    }
};

$(function() {
    XMing.GameStateManager.init();
})
