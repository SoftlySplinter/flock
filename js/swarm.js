function Bird(x, y, flock) {
  this.x = x;
  this.y = y;
  this.next_x = null;
  this.next_y = null;
  this.flock = flock;
}

Bird.prototype.render = function() {
  this.x = this.next_x;
  this.y = this.next_y;
  this.flock.ctx.fillStyle = "rgb(0,0,0)";
  this.flock.ctx.fillRect(this.x, this.y, 2, 2);
}

function Flock(ctx) {
  this.ctx = ctx;
  this.flock = new Array();
}

Bird.prototype.tick = function() {
  // TODO update.
  this.next_x = this.x +  Math.random() * 2 - 1
  this.next_y = this.y +  Math.random() * 2 - 1
}

Flock.prototype.render = function() {
  this.ctx.fillStyle = "rgb(255, 255, 255)";
  this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  this.flock.forEach(function(element, index, array) { element.render(); });
}

Flock.prototype.tick = function() {
  this.flock.forEach(function(element, index, array) { element.tick(); });
}

var flock;
var canvas; 

function init(ctx) {
  flock = new Flock(ctx);
  for(var i = 0; i < (canvas.width * canvas.height) / 200; i++) {
    x = Math.floor(Math.random() * canvas.width);
    y = Math.floor(Math.random() * canvas.height);
    flock.flock.push(new Bird(x, y, flock));
  }
}

function draw() {
  canvas = document.getElementById('swarm');
  if(canvas.getContext) {
    init(canvas.getContext('2d'));
    setInterval(function() {
      flock.tick();
      flock.render();
    }, 100);
  } else {
    // TODO Write some code to handle not getting the context
  }
}

