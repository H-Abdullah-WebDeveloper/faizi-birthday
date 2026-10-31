/* Faizi's Birthday Surprise — vanilla JS, no dependencies */
(function () {
  "use strict";
  var C = window.FAIZI_CONFIG || {};
  var COLORS = C.colors || ["#FF4F9A", "#FFC5DE", "#A78BFA", "#FFD166", "#F7F4F8"];
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return document.getElementById(id); };
  var timers = [];
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------------- Canvas helpers ---------------- */
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var pCv = $("particles"), pCtx = pCv.getContext("2d");
  var fCv = $("fx"), fCtx = fCv.getContext("2d");
  var W = 0, H = 0;
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    [pCv, fCv].forEach(function (c) { c.width = W * DPR; c.height = H * DPR; });
    pCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    fCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------------- Ambient stars & sparkles ---------------- */
  var stars = [];
  var starCount = reduce ? 14 : (C.particleCount || 34);
  for (var i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random(), y: Math.random(), r: rand(.6, 2.2), tw: rand(0, 6.28), sp: rand(.6, 1.8),
      vy: rand(.004, .018), spark: Math.random() < .22, c: COLORS[(Math.random() * COLORS.length) | 0]
    });
  }
  function drawSpark(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
  }
  function drawStars(t) {
    pCtx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!reduce) { s.y -= s.vy * .016; if (s.y < -0.02) s.y = 1.02; }
      var a = .35 + .65 * (.5 + .5 * Math.sin(t / 1000 * s.sp + s.tw));
      pCtx.globalAlpha = a; pCtx.fillStyle = s.c;
      if (s.spark) drawSpark(pCtx, s.x * W, s.y * H, s.r * 3.4);
      else { pCtx.beginPath(); pCtx.arc(s.x * W, s.y * H, s.r, 0, 6.283); pCtx.fill(); }
    }
    pCtx.globalAlpha = 1;
  }

  /* ---------------- Confetti & fireworks ---------------- */
  var conf = [], rockets = [], sparks = [];
  function confettiBurst(x, y, n, spread, power) {
    if (reduce) n = Math.min(n, 18);
    for (var i = 0; i < n; i++) {
      var ang = -Math.PI / 2 + rand(-spread, spread), v = rand(power * .45, power);
      conf.push({
        x: x, y: y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, w: rand(5, 10), h: rand(3, 6),
        rot: rand(0, 6.28), vr: rand(-.3, .3), c: COLORS[(Math.random() * COLORS.length) | 0],
        life: 1, decay: rand(.0035, .007), round: Math.random() < .25
      });
    }
    if (conf.length > 260) conf.splice(0, conf.length - 260);
  }
  function confettiRain(ms) {
    if (reduce) return;
    var end = performance.now() + ms;
    (function step() {
      if (performance.now() > end) return;
      for (var i = 0; i < 2; i++) {
        conf.push({
          x: rand(0, W), y: -10, vx: rand(-.6, .6), vy: rand(1.2, 2.6), w: rand(5, 9), h: rand(3, 5), rot: rand(0, 6.28),
          vr: rand(-.2, .2), c: COLORS[(Math.random() * COLORS.length) | 0], life: 1, decay: .003, round: Math.random() < .2
        });
      }
      setTimeout(step, 90);
    })();
  }
  function launchRocket(x) {
    rockets.push({ x: x, y: H + 10, vx: rand(-.6, .6), vy: -rand(H * .016, H * .021), ty: rand(H * .14, H * .38), c: COLORS[(Math.random() * 4) | 0] });
  }
  function explode(x, y, c) {
    var n = reduce ? 14 : 34, c2 = COLORS[(Math.random() * COLORS.length) | 0];
    for (var i = 0; i < n; i++) {
      var a = (i / n) * 6.283 + rand(-.1, .1), v = rand(1.4, 4.2);
      sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: i % 3 ? c : c2, d: rand(.014, .024) });
    }
    if (sparks.length > 360) sparks.splice(0, sparks.length - 360);
  }
  var fireworksUntil = 0, nextRocket = 0;
  function fireworksFor(ms) { if (!reduce) { fireworksUntil = performance.now() + ms; } else { explode(W * .5, H * .25, COLORS[0]); } }

  function drawFx(t, dt) {
    fCtx.clearRect(0, 0, W, H);
    var k = Math.min(dt / 16.7, 2.5);
    // rockets
    if (t < fireworksUntil && t > nextRocket) { launchRocket(rand(W * .12, W * .88)); nextRocket = t + rand(380, 760); }
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i]; r.x += r.vx * k; r.y += r.vy * k; r.vy *= .985;
      fCtx.globalAlpha = 1; fCtx.fillStyle = "#FFD166"; fCtx.fillRect(r.x - 1.2, r.y, 2.4, 9);
      if (r.y <= r.ty || r.vy > -1.4) { explode(r.x, r.y, r.c); rockets.splice(i, 1); }
    }
    // sparks
    for (i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i]; s.x += s.vx * k; s.y += s.vy * k; s.vy += .045 * k; s.vx *= .985; s.life -= s.d * k;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      fCtx.globalAlpha = s.life; fCtx.fillStyle = s.c; fCtx.beginPath(); fCtx.arc(s.x, s.y, 1.2 + s.life * 1.6, 0, 6.283); fCtx.fill();
    }
    // confetti
    for (i = conf.length - 1; i >= 0; i--) {
      var p = conf[i];
      p.vy += .09 * k; p.vx *= .992; p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.life -= p.decay * k;
      if (p.life <= 0 || p.y > H + 20) { conf.splice(i, 1); continue; }
      fCtx.globalAlpha = Math.min(1, p.life * 1.6); fCtx.fillStyle = p.c;
      fCtx.save(); fCtx.translate(p.x, p.y); fCtx.rotate(p.rot);
      if (p.round) { fCtx.beginPath(); fCtx.arc(0, 0, p.h * .7, 0, 6.283); fCtx.fill(); }
      else fCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      fCtx.restore();
    }
    fCtx.globalAlpha = 1;
  }

  var last = performance.now(), running = true;
  function loop(t) {
    if (!running) return;
    var dt = t - last; last = t;
    drawStars(t); drawFx(t, dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { running = false; }
    else if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  });

  /* ---------------- Balloons ---------------- */
  (function makeBalloons() {
    var box = $("balloons"), n = reduce ? 0 : (C.balloonCount || 7);
    var pal = [["#FF8AC0", "#FF4F9A"], ["#E0D4FF", "#A78BFA"], ["#FFE7A8", "#FFD166"], ["#FFE0EE", "#FFC5DE"], ["#C9B6FF", "#8A68F2"]];
    for (var i = 0; i < n; i++) {
      var b = document.createElement("div"), c = pal[i % pal.length];
      b.className = "balloon";
      b.style.cssText = "left:" + (4 + (i * 92 / n) + rand(-3, 3)).toFixed(1) + "%;--w:" + rand(40, 66).toFixed(0) + "px;--c1:" + c[0] + ";--c2:" + c[1] +
        ";--glow:" + c[1] + "55;--d:" + rand(15, 24).toFixed(1) + "s;--delay:" + (-rand(0, 20)).toFixed(1) + "s;--sx:" + rand(-26, 26).toFixed(0) + "px";
      box.appendChild(b);
    }
  })();

  /* ---------------- Screen handling ---------------- */
  var screens = [$("screen1"), $("screen2"), $("screen3")];
  var current = 0;
  function go(i) {
    screens.forEach(function (s, idx) {
      var on = idx === i;
      s.classList.toggle("is-active", on);
      s.setAttribute("aria-hidden", on ? "false" : "true");
      if ("inert" in s) s.inert = !on;
    });
    current = i;
  }
  function revealSeq(root, step, start, done) {
    var items = root.querySelectorAll("[data-r]");
    Array.prototype.forEach.call(items, function (el, idx) {
      later(function () { el.classList.add("in"); }, start + idx * step);
    });
    if (done) later(done, start + items.length * step);
  }
  function resetReveal(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-r].in"), function (el) { el.classList.remove("in"); });
  }

  if (C.dateText) Array.prototype.forEach.call(document.querySelectorAll("[data-date]"), function (el) { el.textContent = C.dateText; });

  /* Screen 1 intro */
  var kicker = $("kicker"), title = $("title"), cake1 = $("cake1"), openBtn = $("openBtn");
  function typeKicker(text, cb) {
    kicker.classList.remove("done"); kicker.textContent = "";
    if (reduce) { kicker.textContent = text; kicker.classList.add("done"); return cb(); }
    var i = 0;
    (function tick() {
      kicker.textContent = text.slice(0, ++i);
      if (i < text.length) later(tick, 55);
      else { later(function () { kicker.classList.add("done"); }, 500); cb(); }
    })();
  }
  function intro() {
    title.classList.remove("show"); cake1.classList.remove("show"); openBtn.classList.remove("show");
    typeKicker(C.welcomeKicker || "A LITTLE SURPRISE FOR YOU...", function () {
      later(function () {
        title.classList.add("show");
        confettiBurst(W / 2, H * .3, 70, 1.1, 11);
        later(function () { cake1.classList.add("show"); }, 450);
        later(function () { openBtn.classList.add("show"); }, 1300);
      }, 350);
    });
  }

  /* ---------------- Music ---------------- */
  var audio = $("audio"), player = $("player"), playBtn = $("playBtn"), vol = $("vol");
  var toastEl = $("toast"), audioReady = false, audioBroken = false, userVol = C.defaultVolume != null ? C.defaultVolume : .6, fadeId = 0;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove("show"); }, 3200);
  }
  function setPlaying(on) {
    playBtn.setAttribute("aria-pressed", on ? "true" : "false");
    playBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
    player.classList.toggle("playing", on);
  }
  function fade(to, ms, cb) {
    cancelAnimationFrame(fadeId);
    var from = audio.volume, t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / ms);
      try { audio.volume = Math.max(0, Math.min(1, from + (to - from) * p)); } catch (e) {}
      if (p < 1) fadeId = requestAnimationFrame(step); else if (cb) cb();
    })(t0);
  }
  function loadAudio() {
    if (audioReady || audioBroken) return;
    audio.addEventListener("error", function () {
      audioBroken = true; setPlaying(false);
      playBtn.disabled = true; playBtn.style.opacity = ".5";
      toast("Music file not found — the surprise works without it 🎈");
    }, { once: true });
    audio.src = C.audioSrc || "assets/audio/happy-birthday-instrumental.mp3";
    audio.volume = 0; audioReady = true;
  }
  function playMusic() {
    if (audioBroken) return;
    loadAudio();
    var pr; try { pr = audio.play(); } catch (e) { pr = null; }
    if (pr && pr.then) {
      pr.then(function () { setPlaying(true); fade(userVol, 1500); })
        .catch(function () { if (!audioBroken) { setPlaying(false); toast("Tap the play button to start the music 🎵"); } });
    } else { setPlaying(true); fade(userVol, 1500); }
  }
  function pauseMusic() { fade(0, 450, function () { audio.pause(); }); setPlaying(false); }
  playBtn.addEventListener("click", function () { if (audio.paused || !audioReady) playMusic(); else pauseMusic(); });
  function setVol(v) {
    userVol = v / 100; vol.style.setProperty("--v", v + "%");
    if (audioReady && !audio.paused) { cancelAnimationFrame(fadeId); try { audio.volume = userVol; } catch (e) {} }
  }
  vol.value = Math.round(userVol * 100); setVol(+vol.value);
  vol.addEventListener("input", function () { setVol(+vol.value); });
  audio.addEventListener("pause", function () { if (!audio.ended) setPlaying(false); });
  audio.addEventListener("play", function () { setPlaying(true); });

  /* ---------------- Flow ---------------- */
  var nextBtn = $("nextBtn"), replayBtn = $("replayBtn"), busy = false;

  openBtn.addEventListener("click", function () {
    if (busy) return; busy = true;
    player.hidden = false;
    playMusic();
    confettiBurst(W / 2, H * .75, 60, 1.0, 12);
    go(1);
    nextBtn.classList.remove("show");
    resetReveal(screens[1]);
    var wait = reduce ? 0 : 500;
    revealSeq(screens[1], reduce ? 0 : 1500, wait + 300, function () {
      nextBtn.classList.add("show"); busy = false;
      later(function () { if (current === 1) toFinale(); }, (C.autoAdvanceCardAfter || 14) * 1000);
    });
  });

  function toFinale() {
    if (current === 2) return;
    clearTimers(); busy = true;
    go(2);
    var cake3 = $("cake3"); cake3.classList.remove("show"); resetReveal(screens[2]);
    later(function () { cake3.classList.add("show"); confettiBurst(W / 2, H * .55, 80, 1.3, 13); }, 350);
    later(function () { fireworksFor(7000); confettiRain(5000); }, 900);
    revealSeq(screens[2], reduce ? 0 : 1100, 1200, function () { busy = false; });
  }
  nextBtn.addEventListener("click", toFinale);

  replayBtn.addEventListener("click", function () {
    if (busy) return;
    clearTimers(); busy = true;
    go(0); resetReveal(screens[1]); resetReveal(screens[2]); nextBtn.classList.remove("show");
    $("cake3").classList.remove("show");
    later(function () { busy = false; intro(); }, 500);
  });

  /* Tap on stage = little confetti pop (fun, lightweight) */
  document.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button,.player,input")) return;
    confettiBurst(e.clientX, e.clientY, 14, .9, 7);
  });

  go(0);
  intro();
})();
