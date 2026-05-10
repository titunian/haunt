// ---------- Copy buttons (code blocks) ----------
document.querySelectorAll('[data-copy]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const pre = btn.closest('.codeblock')?.querySelector('pre');
    if (!pre) return;
    try {
      await navigator.clipboard.writeText(pre.innerText);
      const original = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1400);
    } catch {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1400);
    }
  });
});

// ---------- Sidebar active-link tracking ----------
const sidebarLinks = Array.from(document.querySelectorAll('.docs-sidebar a[href^="#"]'));
if (sidebarLinks.length) {
  const idToLink = new Map(sidebarLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const headings = Array.from(document.querySelectorAll('.docs-content h2[id], .docs-content h3[id]'))
    .filter((h) => idToLink.has(h.id));

  const setActive = (id) => {
    sidebarLinks.forEach((a) => a.classList.remove('active'));
    const link = idToLink.get(id);
    if (link) link.classList.add('active');
  };

  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    const order = headings.map((h) => h.id);
    const top = order.find((id) => visible.has(id));
    if (top) setActive(top);
  }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });
  headings.forEach((h) => io.observe(h));
}

// ---------- Hero ghost: eyes follow cursor, expression reacts ----------
(() => {
  const ghost = document.getElementById('heroGhost');
  if (!ghost) return;
  const eyeL  = ghost.querySelector('.eye-l');
  const eyeR  = ghost.querySelector('.eye-r');
  const mouth = ghost.querySelector('.mouth');
  if (!eyeL || !eyeR || !mouth) return;

  // SVG viewBox is 80x96. Eyes at (30,40) and (50,40).
  const MAX_EYE_OFFSET = 1.6;     // SVG units — subtle
  const NEAR_DIST_PX   = 220;     // "interested" radius

  let lastMoveT = 0, lastMoveX = 0, lastMoveY = 0, speed = 0;
  let blinkT = 0;
  let mode = 'neutral'; // 'neutral' | 'curious' | 'startled' | 'blink'

  function setMouth(state) {
    if (state === 'startled')      { mouth.setAttribute('rx', 2.6); mouth.setAttribute('ry', 3.4); mouth.setAttribute('cy', 55); }
    else if (state === 'curious')  { mouth.setAttribute('rx', 1.7); mouth.setAttribute('ry', 2.2); mouth.setAttribute('cy', 54); }
    else                           { mouth.setAttribute('rx', 2.1); mouth.setAttribute('ry', 2.7); mouth.setAttribute('cy', 54); }
  }

  function setEyes(dxSvg, dySvg, blink = false) {
    const t = `translate(${dxSvg.toFixed(2)} ${dySvg.toFixed(2)})`;
    if (blink) {
      eyeL.setAttribute('transform', t + ' scale(1, 0.08)');
      eyeR.setAttribute('transform', t + ' scale(1, 0.08)');
    } else {
      eyeL.setAttribute('transform', t);
      eyeR.setAttribute('transform', t);
    }
  }

  let pendingX = 0, pendingY = 0, hasPointer = false;

  document.addEventListener('mousemove', (e) => {
    hasPointer = true;
    const rect = ghost.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    const len = Math.max(dist, 1);
    const nx = dx / len, ny = dy / len;
    pendingX = nx * MAX_EYE_OFFSET;
    pendingY = ny * MAX_EYE_OFFSET;

    const now = performance.now();
    const dt = Math.max(now - lastMoveT, 1);
    const moved = Math.hypot(e.clientX - lastMoveX, e.clientY - lastMoveY);
    speed = moved / dt;
    lastMoveT = now; lastMoveX = e.clientX; lastMoveY = e.clientY;

    let next = 'neutral';
    if (speed > 1.5)              next = 'startled';
    else if (dist < NEAR_DIST_PX) next = 'curious';
    if (next !== mode) { mode = next; setMouth(mode); }

    blinkT = now;
  });

  // Smooth eye movement + idle blinks
  let curX = 0, curY = 0;
  function tick() {
    curX += (pendingX - curX) * 0.18;
    curY += (pendingY - curY) * 0.18;

    const now = performance.now();
    const idleFor = now - (blinkT || now);
    const wantBlink = hasPointer && idleFor > 4500 && idleFor < 4630;
    setEyes(curX, curY, wantBlink);

    if (mode === 'startled' && speed < 0.4) {
      mode = 'curious';
      setMouth(mode);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.addEventListener('mouseleave', () => {
    pendingX = 0; pendingY = 0; mode = 'neutral'; setMouth(mode);
  });
})();
