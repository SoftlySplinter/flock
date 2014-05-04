//const MIN_ACCELERATION = 1;
//const MAX_ACCELERATION = 1;
const MAX_TURN = Math.PI/ 25;


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

function Aim(x, y, type) {
  CoOrdinate.call(this, x, y);
  this.type = type;
}

Aim.prototype = CoOrdinate.prototype;

function Bird(x, y, flock) {
  this.position = new CoOrdinate(x, y);
  this.next = null;

  this.target = new Aim(x, y);

  this.direction = Math.random() * Math.PI * 2;
  this.nextDirection = this.direction;

//  this.acceleration = 1;
  this.speed = 1//this.calcSpeed(this.acceleration);

  this.flock = flock;

  this.separation = 25;
  this.alignment = 250;
  this.cohesion = Number.MAX_VALUE;
}

Bird.prototype.calcSpeed = function(acceleration) {
  return Math.ceil(Math.pow(acceleration, 2) / 2);
}

Bird.prototype.calcDirection = function() {
  aimDirection = 0;
  if(this.aim.equals(this.position)) {
    aimDirection = Math.random() * Math.PI * 2;
  } else {
    aimDirection = this.calcAngle(this.position, this.aim);
  }

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

/*Bird.prototype.calcBestSpeed = function() {
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
}*/


Bird.prototype.render = function() {
  this.position = new CoOrdinate(this.next.x, this.next.y);
  this.direction = this.nextDirection;
  

  this.flock.ctx.fillStyle = "rgb(255,255,255)";
  this.flock.ctx.fillRect(this.position.x, this.position.y, 2, 2);
  if(this.aim.type == "separation") {
    this.flock.ctx.fillStyle = "rgb(200, 0, 0)";
  } else if(this.aim.type == "alignment") {
    this.flock.ctx.fillStyle = "rgb(0, 200, 0)";
  } else if(this.aim.type == "cohesion") {
    this.flock.ctx.fillStyle = "rgb(0, 0, 200)";
  } else {
    this.flock.ctx.fillStyle = "rgb(100, 100, 100)";
  }
  this.flock.ctx.fillRect(this.aim.x, this.aim.y, 1, 1);
}

Bird.prototype.normalise = function() {
  if(this.next.x < 0) this.next.x += canvas.width;
  if(this.next.y < 0) this.next.y += canvas.height;
  if(this.next.x > canvas.width) this.next.x -= canvas.width;
  if(this.next.y > canvas.height) this.next.y -= canvas.height;
}

Bird.prototype.calcAim = function() {
  near = this.flock.within(this, this.separation);
  if(near.length > 0) {
    // Aim away
    heading = new Aim(-1, -1, "separation");
    distance = Number.MAX_VALUE;
    near.forEach(function(elem) {
      dX = elem.position.distance(this);
      if(Math.abs(dX) < Math.abs(distance)) {
        distance = dX;
        heading.x = elem.position.x;
        heading.y = elem.position.y;
      }
    }, this.position);

    heading.x = this.position.x + (this.position.x - heading.x);
    heading.y = this.position.y + (this.position.y - heading.y);
    
    return heading;
  }

  mid = this.flock.within(this, this.alignment);
  if(mid.length > 0) {
    // Aim towards average heading.
    heading = new Aim(0, 0, "alignment");
    mid.forEach(function(elem) {
      heading.x += elem.speed * Math.cos(elem.direction) + elem.position.x;
      heading.y += elem.speed * Math.sin(elem.direction) + elem.position.y;
    });
    heading.x /= (mid.length);
    heading.y /= (mid.length);
    return heading;
  }

  far = this.flock.within(this, this.cohesion);
  if(far.length > 0) {
    heading = new Aim(0, 0, "cohesion");
    far.forEach(function(elem) {
      heading.x += elem.position.x;
      heading.y += elem.position.y;
    });
    heading.x /= far.length;
    heading.y /= far.length;
    return heading;
  }

  return this.position;
}

Bird.prototype.tick = function() {
  this.aim = this.calcAim();
//  this.aim = this.flock.mean(this, this.cohesion);
  this.nextDirection = this.calcDirection();
//  this.acceleration = this.calcBestSpeed();
//  this.speed = this.calcSpeed(this.acceleration);
  this.next = CoOrdinate.calcMove(this.speed, this.direction, this.position);
  this.normalise();
}

function Flock(ctx) {
  this.ctx = ctx;
  this.flock = new Array();
}

Flock.prototype.render = function() {
  this.ctx.fillStyle = "rgb(0, 0, 0)";
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

  return new CoOrdinate(sumX / count, sumY / count);
}

Flock.prototype.within = function(bird, distance) {
  return this.flock.filter(function(elem) {
    return elem.position.distance(bird.position) <= Math.pow(distance, 2) && elem != bird;
  });
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
  no = Math.round((canvas.width * canvas.height) / 2500);
  document.title = "Flock (" + no + " birds)";
  document.getElementById('info').innerHTML = document.title;
  for(var i = 0; i < no; i++) {
    x = Math.floor(Math.random() * canvas.width);
    y = Math.floor(Math.random() * canvas.height);
    flock.flock.push(new Bird(x, y, flock));
  }
}

function draw() {
  canvas = document.getElementById('swarm');
  update();
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

window.onresize = draw;

function update() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
