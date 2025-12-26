(function initFireworksEffect() {
  var canvas = document.createElement("canvas");
  canvas.id = "fireworks-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "1200";
  canvas.style.display = "none";
  canvas.style.mixBlendMode = "screen";
  document.body.appendChild(canvas);

  var ctx = canvas.getContext("2d");
  var particles = [];
  var animationId = null;
  var viewWidth = 0;
  var viewHeight = 0;
  var currentDpr = 1;

  function resizeCanvas() {
    currentDpr = window.devicePixelRatio || 1;
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(viewWidth * currentDpr));
    canvas.height = Math.max(1, Math.floor(viewHeight * currentDpr));
    canvas.style.width = viewWidth + "px";
    canvas.style.height = viewHeight + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(currentDpr, currentDpr);
  }

  function randomColor() {
    var r = Math.floor(Math.random() * 205 + 50);
    var g = Math.floor(Math.random() * 205 + 50);
    var b = Math.floor(Math.random() * 205 + 50);
    return { r: r, g: g, b: b };
  }

  function spawnFirework(x, y) {
    var color = randomColor();
    var total = 36;
    for (var i = 0; i < total; i++) {
      var angle = (Math.PI * 2 * i) / total;
      var speed = Math.random() * 3 + 2;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.012,
        color: color,
        radius: Math.random() * 2 + 1.5
      });
    }
  }

  function render() {
    animationId = null;
    ctx.clearRect(0, 0, viewWidth, viewHeight);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = "rgb(" + p.color.r + "," + p.color.g + "," + p.color.b + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (particles.length > 0) {
      animationId = window.requestAnimationFrame(render);
    } else {
      canvas.style.display = "none";
    }
  }

  function launchBurst(count) {
    if (!count || count < 1) {
      count = 4;
    }
    canvas.style.display = "block";
    for (var i = 0; i < count; i++) {
      var x = Math.random() * viewWidth * 0.8 + viewWidth * 0.1;
      var y = Math.random() * viewHeight * 0.4 + viewHeight * 0.15;
      spawnFirework(x, y);
    }
    if (!animationId) {
      animationId = window.requestAnimationFrame(render);
    }
  }

  function stop() {
    particles.length = 0;
    if (animationId) {
      window.cancelAnimationFrame(animationId);
      animationId = null;
    }
    ctx.clearRect(0, 0, viewWidth, viewHeight);
    canvas.style.display = "none";
  }

  window.addEventListener("resize", function() {
    resizeCanvas();
  });

  resizeCanvas();

  window.fireworksEffect = {
    burst: launchBurst,
    stop: stop
  };
})();
