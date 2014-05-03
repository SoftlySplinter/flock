const MIN_ACCELERATION = 1;
const MAX_ACCELERATION = 4;
const MAX_TURN = Math.PI/ 100;


function CoOrdinate(x, y) {
  this.x = x;
  this.y = y;
}

CoOrdinate.prototype.equals = function(other) {
  if(other == null) {
    return false;
  }
  return this.x == other.x && this.y == other.y;
}

// Note this doesn't use sqrt as that's costly :-)
CoOrdinate.prototype.distance = function(other) {
  return Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2);
}

CoOrdinate.calcMove = function(speed, dir, pos) {
  return new CoOrdinate(speed * Math.cos(dir) + pos.x, speed * Math.sin(dir) + pos.y);
}

function Aim(x, y) {
  CoOrdinate.call(this, x, y);
}

Aim.prototype = new CoOrdinate();

function Bird(x, y, flock) {
  this.position = new CoOrdinate(x, y);
  this.next = null;

  this.target = new Aim(x, y);

  this.direction = Math.random() * Math.PI * 2;

  this.acceleration = 1;
  this.speed = this.calcSpeed(this.acceleration);

  this.flock = flock;

  this.cohesion = 100;
}

Bird.prototype.calcSpeed = function(acceleration) {
  return Math.ceil(Math.pow(acceleration, 2) / 2);
}

Bird.prototype.calcDirection = function() {
  aimDirection = this.calcAngle(this.position, this.aim);
  if(this.direction != aimDirection) {
    // Distance from our direction to the direction of the aim.
    distanceReal = aimDirection - this.direction;
    distanceWrap = distanceReal;
    if(this.direction < Math.PI) {
      distanceWrap = aimDirection - (this.direction + Math.PI * 2);
    } else {
      distanceWrap = aimDirection - (this.direction - Math.PI * 2);
    }
    distance = Math.abs(distanceReal) < Math.abs(distanceWrap) ? distanceReal : distanceWrap;
    if(Math.abs(distance) <= MAX_TURN) {
      return aimDirection;
    } else {
      if(distance < 0) {
        return this.direction - MAX_TURN;
      } else {
        return this.direction + MAX_TURN;
      }
    }
  }
  return this.direction;
}

Bird.prototype.calcAngle = function(from, to) {
  adj = from.x - to.x;
  opp = from.y - to.y;
  return Math.atan2(opp, adj) + Math.PI;
}

Bird.prototype.calcBestSpeed = function() {
  aDown = Math.max(MIN_ACCELERATION, this.acceleration - 1);
  aUp   = Math.min(MAX_ACCELERATION, this.acceleration + 1);
  speedDown = this.calcSpeed(aDown);
  speedUp =   this.calcSpeed(aUp);

  pDown = CoOrdinate.calcMove(speedDown,  this.direction, this.position);
  pCur =  CoOrdinate.calcMove(this.speed, this.direction, this.position);
  pUp =   CoOrdinate.calcMove(speedUp,    this.direction, this.position);

  dDown = pDown.distance(this.aim);
  dCur  =  pCur.distance(this.aim);
  dUp   =   pUp.distance(this.aim);

  dMin = Math.min(Math.min(dUp, dDown), dCur);


  switch(dMin) {
  case dCur:  return this.acceleration;
  case dDown: return aDown;
  case dUp:   return aUp;
  }
}


Bird.prototype.render = function() {
  if(this.next != null) {
    this.position = new CoOrdinate(this.next.x, this.next.y);
  }

  this.flock.ctx.fillStyle = "rgb(0,0,0)";
  this.flock.ctx.fillRect(this.position.x, this.position.y, 2, 2);
  this.flock.ctx.fillStyle = "rgb(0,255,0)";
  this.flock.ctx.fillRect(this.aim.x, this.aim.y, 2, 2);
}

Bird.prototype.normalise = function() {
  if(this.next.x < 0) this.next.x += canvas.width;
  if(this.next.y < 0) this.next.y += canvas.height;
  if(this.next.x > canvas.width) this.next.x -= canvas.width;
  if(this.next.y > canvas.height) this.next.y -= canvas.height;
  //console.log("Normalised to ", this.next);
}

Bird.prototype.tick = function() {
  this.aim = this.flock.mean(this, this.cohesion);
  this.cohesion = 20 * Math.min(this.flock.countNear(this, this.cohesion), 25);
  if(this.position.equals(this.aim)) {
    this.direction += MAX_TURN;
    r = Math.random();
    if(r < 0.3) this.acceleration = Math.max(MIN_ACCELERATION, this.acceleration - 1);
    if(r > 0.3) this.acceleration = Math.min(MAX_ACCELERATION, this.acceleration + 1);
  } else {
    this.direction = this.calcDirection();
    this.acceleration = this.calcBestSpeed();
  }
  this.speed = this.calcSpeed(this.acceleration);
  this.next = CoOrdinate.calcMove(this.speed, this.direction, this.position);
  this.normalise();
}

function Flock(ctx) {
  this.ctx = ctx;
  this.flock = new Array();
}

Flock.prototype.render = function() {
  this.ctx.fillStyle = "rgb(255, 255, 255)";
  this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  this.flock.forEach(function(element, index, array) { element.render(); });
}

Flock.prototype.tick = function() {
  this.flock.forEach(function(element, index, array) { element.tick(); });
}

Flock.prototype.mean = function(from, cohesion) {
  sumX = 0;
  sumY = 0;
  count = 0;

  this.flock.forEach(function(element, index, array) {
    if(element.position.distance(from.position) <= Math.pow(cohesion, 2)) {
      sumX += element.position.x;
      sumY += element.position.y;
      count ++;
    }
  });

  return new CoOrdinate(Math.round(sumX / count), Math.round(sumY / count));
}

Flock.prototype.countNear = function(from, cohesion) {
  return this.flock.filter(function(element) { 
    return element.position.distance(from.position) <= Math.pow(cohesion, 2); }
  ).length;
}

var flock;
var canvas; 

function init(ctx) {
  flock = new Flock(ctx);
  for(var i = 0; i < 100; i++) {
    x = Math.floor(Math.random() * canvas.width);
    y = Math.floor(Math.random() * canvas.height);
    flock.flock.push(new Bird(x, y, flock));
  }
}

function draw() {
  canvas = document.getElementById('swarm');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if(canvas.getContext) {
    init(canvas.getContext('2d'));
    setInterval(function() {
      flock.tick();
      flock.render();
    }, 33);
  } else {
    // TODO Write some code to handle not getting the context
  }
}

