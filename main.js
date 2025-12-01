const canvas = document.getElementById('game');
const gl = canvas.getContext('2d'); // 2D for simplicity; swap to WebGL/Three.js later

// Resize
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener('resize', resize);
resize();

// Input
const keys = new Set();
let mouseLocked = false;
let mx = 0, my = 0;
canvas.addEventListener('click', () => canvas.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  mouseLocked = document.pointerLockElement === canvas;
});
document.addEventListener('mousemove', e => {
  if (!mouseLocked) return;
  mx += e.movementX * 0.002;
  my += e.movementY * 0.002;
  my = Math.max(-1.2, Math.min(1.2, my));
});
document.addEventListener('keydown', e => keys.add(e.code));
document.addEventListener('keyup', e => keys.delete(e.code));

// Player
const player = {
  pos: { x: 0, y: 1.8, z: 0 },
  vel: { x: 0, y: 0, z: 0 },
  yaw: 0, pitch: 0,
  onGround: false,
  dashCooldown: 0,
  slide: false
};

function vecForward(yaw, pitch=0) {
  return {
    x: Math.cos(yaw) * Math.cos(pitch),
    y: Math.sin(pitch),
    z: Math.sin(yaw) * Math.cos(pitch)
  };
}
function vecRight(yaw) { return { x: -Math.sin(yaw), y: 0, z: Math.cos(yaw) }; }

let last = performance.now();
function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000);
  last = t;

  // Camera angles
  player.yaw = mx;
  player.pitch = my;

  // Movement input
  const f = vecForward(player.yaw, 0);
  const r = vecRight(player.yaw);
  let ax = 0, az = 0;
  if (keys.has('KeyW')) { ax += f.x; az += f.z; }
  if (keys.has('KeyS')) { ax -= f.x; az -= f.z; }
  if (keys.has('KeyA')) { ax -= r.x; az -= r.z; }
  if (keys.has('KeyD')) { ax += r.x; az += r.z; }

  // Normalize accel
  const len = Math.hypot(ax, az) || 1;
  ax /= len; az /= len;

  // Speeds
  const baseSpeed = 10;
  const airControl = 0.35;
  const accel = player.onGround ? 50 : 25 * airControl;
  player.vel.x += ax * accel * dt;
  player.vel.z += az * accel * dt;

  // Friction
  const friction = player.onGround ? 12 : 0.2;
  player.vel.x *= 1 - friction * dt;
  player.vel.z *= 1 - friction * dt;

  // Jump
  if (keys.has('Space') && player.onGround) {
    player.vel.y = 9;
    player.onGround = false;
  }

  // Gravity
  player.vel.y -= 22 * dt;

  // Dash
  player.dashCooldown -= dt;
  if (keys.has('ShiftLeft') && player.dashCooldown <= 0) {
    const fwd = vecForward(player.yaw, 0);
    player.vel.x += fwd.x * 25;
    player.vel.z += fwd.z * 25;
    player.dashCooldown = 1.1;
    document.getElementById('dash').textContent = 'COOLDOWN';
  }
  if (player.dashCooldown <= 0) document.getElementById('dash').textContent = 'READY';

  // Simple ground plane at y=0
  player.pos.x += player.vel.x * dt;
  player.pos.y += player.vel.y * dt;
  player.pos.z += player.vel.z * dt;
  if (player.pos.y <= 1.0) {
    player.pos.y = 1.0;
    player.vel.y = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Draw fake 3D (sky + floor horizon) as placeholder
  gl.clearRect(0,0,canvas.width,canvas.height);
  // Sky
  gl.fillStyle = '#111';
  gl.fillRect(0,0,canvas.width,canvas.height/2);
  // Floor
  gl.fillStyle = '#222';
  gl.fillRect(0,canvas.height/2,canvas.width,canvas.height/2);
  // Gun UI
  gl.fillStyle = '#e6e6e6';
  gl.fillRect(canvas.width-160, canvas.height-80, 120, 8);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
