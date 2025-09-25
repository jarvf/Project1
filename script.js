document.addEventListener('DOMContentLoaded', () => {
  //The Story
  const nodes = {
    start: {
      text: `It’s 12:24 a.m. The announcements say last trains are running “with delays.”
You hit the turnstiles at 59th—eyes burning, pockets light. What’s the move?`,
      choices: [
        { label: 'Ask the booth attendant', next: 'booth' },
        { label: 'Go straight to the platform', next: 'platform' }
      ]
    },
    booth: {
      text: `The attendant glances up. “Uptown local in 4. Express out of service.” You could thank them and go, or try to press for a faster route.`,
      choices: [
        { label: 'Thank them & head down', next: 'platform' },
        { label: 'Try for an express workaround', next: 'press' }
      ]
    },
    press: {
      text: `They shrug. “You could transfer at 42nd if you’re lucky. Or just catch the local and chill.” Your call.`,
      choices: [
        { label: 'Take the safe local', next: 'platform' },
        { label: 'Chase the maybe-express', next: 'transfer' }
      ]
    },
    platform: {
      text: `Platform air: warm and urine-y. A busker’s sax echoes. The next local shows “6 min.” You can wait it out—or climb back up to try for the transfer.`,
      choices: [
        { label: 'Wait for the local', next: 'local' },
        { label: 'Sprint for the transfer', next: 'transfer' }
      ]
    },
    transfer: {
      text: `Turnstiles again. Stairs again. You reach 42nd. Express board says: “Last train: arriving.” A crowd surges.`,
      choices: [
        { label: 'Commit—push through to board', next: 'express' },
        { label: 'Nope—go back to the local', next: 'local' }
      ]
    },
    local: {
      text: `Doors slide open. Half-asleep faces. The car hums like an old fridge. It’s not fast, but it’s steady.`,
      choices: [
        { label: 'Stay on. One stop at a time.', next: 'home_good' },
        { label: 'Bail midway for a “shortcut”', next: 'shortcut' }
      ]
    },
    express: {
      text: `You squeeze in as the chime rings. Express roars like a hair dryer from the ‘90s. It flies.. until it… doesn’t.`,
      choices: [
        { label: 'Ride it out; don’t overthink', next: 'home_good' },
        { label: 'Hop off to “optimize” at 72nd', next: 'shortcut' }
      ]
    },
    shortcut: {
      text: `You pop out at a random stop. The transfer you wanted? “Last train departed.” Street level is rain and sadness.`,
      choices: [
        { label: 'Late-night diner and regroup', next: 'diner' },
        { label: 'Call a rideshare', next: 'ride' }
      ]
    },
    diner: {
      text: `Coffee tastes like battery acid but the booth is warm. The cook slides you extra fries. You’ll make it home...later.`,
      end: 'soft'
    },
    ride: {
      text: `Your driver’s playlists are suspiciously good. The meter climbs; your eyelids don’t. You’re home, wallet lighter.`,
      end: 'soft'
    },
    home_good: {
      text: `Doors open. Your stop. Quiet street. You did the boring thing and it worked. Keys. Hallway. Bed.`,
      end: 'win'
    }
  };

  // states
  const card = document.getElementById('card');
  const nodeText = document.getElementById('nodeText');
  const nodeTitle = document.getElementById('nodeTitle');
  const choicesEl = document.getElementById('choices');
  const progressEl = document.getElementById('progress');

  // sound stuffs
  const soundToggle = document.getElementById('soundToggle');
  const sfxClick   = document.getElementById('sfxClick');
  const sfxWin     = document.getElementById('sfxWin');
  const ambience   = document.getElementById('ambience');

  const path = [];
  let currentId = 'start';
  let soundOn = false;

  // helpers
  const updateProgress = () => {
    const pct = Math.min(100, Math.round((path.length / 6) * 100));
    progressEl.style.width = pct + '%';
  };

  function ripple(el, x, y){
    const r = document.createElement('span');
    r.className = 'ripple';
    const rect = el.getBoundingClientRect();
    r.style.left = (x - rect.left - 110) + 'px';
    r.style.top  = (y - rect.top  - 110) + 'px';
    el.appendChild(r);
    setTimeout(()=> r.remove(), 520);
  }

  function launchConfetti(count = 90) {
    const colors = ['#7cf7ff', '#ff6bd6', '#ffd36b', '#b0ff92', '#c8b6ff'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('span');
      el.className = 'confetti';

      const startXvw = Math.random() * 100;
      const driftPx  = (Math.random() * 160 - 80) + 'px';
      const dur   = 2600 + Math.random() * 2400;        
      const delay = Math.random() * 300;                  
      const spin  = (540 + Math.random() * 900) + 'deg';  

      el.style.left = startXvw + 'vw';
      el.style.setProperty('--x', driftPx);
      el.style.setProperty('--rot', (Math.random() * 360 - 180) + 'deg');
      el.style.setProperty('--spin', spin);
      el.style.setProperty('--dur', dur + 'ms');
      el.style.setProperty('--delay', delay + 'ms');

      el.style.background = colors[i % colors.length];
      const w = 6 + Math.floor(Math.random() * 5);
      const h = 10 + Math.floor(Math.random() * 8);
      el.style.width  = w + 'px';
      el.style.height = h + 'px';

      document.body.appendChild(el);
      setTimeout(() => el.remove(), dur + delay + 400);
    }
  }

  // sound

  function playFx(el, vol = 1.0) {
    if (!el) return;
    try {
      el.pause(); 
      el.currentTime = 0;
      el.volume = vol;
      el.play().catch(()=>{});
    } catch {}
  }

  // volume
  function fadeTo(audio, target = 0.25, duration = 800) {
    if (!audio) return;
    const start = audio.volume ?? 0;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      audio.volume = start + (target - start) * t;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function startAmbient() {
    if (!ambience) return;
    ambience.volume = 0.0;
    ambience.play().then(() => fadeTo(ambience, 0.22, 900)).catch(()=>{});
  }

  function stopAmbient() {
    if (!ambience) return;
    const pauseAfter = 500;
    fadeTo(ambience, 0.0, pauseAfter);
    setTimeout(() => ambience.pause(), pauseAfter + 40);
  }

  function setSound(on) {
    soundOn = on;
    if (soundToggle) soundToggle.textContent = on ? 'sound: on' : 'sound: off';
    if (on) startAmbient(); else stopAmbient();
  }
  soundToggle?.addEventListener('click', () => setSound(!soundOn));

  // render
  function render(id){
    const node = nodes[id];
    currentId = id;
    path.push(id);
    updateProgress();

    // animate out then update content
    card.animate(
      [{opacity:1, transform:'translateY(0) scale(1)'},
       {opacity:0, transform:'translateY(-6px) scale(.98)'}],
      {duration:180, easing:'ease'}
    ).onfinish = () => {
      nodeTitle.textContent = 'Scene';
      nodeText.textContent = node.text;
      choicesEl.innerHTML = '';

      if (node.end){
        // ending view
        const again = document.createElement('button');
        again.className = 'button';
        again.textContent = node.end === 'win' ? 'Made it.' : 'Not bad. Try again';
        again.addEventListener('click', (e)=>{
          ripple(again, e.clientX, e.clientY);
          if (soundOn) playFx(sfxClick, 0.35);
          path.length = 0;
          progressEl.style.width = '0%';
          render('start');
        });
        choicesEl.appendChild(again);

        if (node.end === 'soft'){
          card.classList.add('shake');
          setTimeout(()=> card.classList.remove('shake'), 520);
        } else {
          // win
          launchConfetti(100);
          if (soundOn) playFx(sfxWin, 0.7);
        }
      } else {
        // normal choices
        node.choices.forEach((c, idx) => {
          const btn = document.createElement('button');
          btn.className = 'button' + (idx ? ' secondary' : '');
          btn.textContent = c.label;
          btn.setAttribute('data-next', c.next);
          btn.addEventListener('click', (e)=>{
            ripple(btn, e.clientX, e.clientY);
            if (soundOn) playFx(sfxClick, 0.35);
            render(c.next);
          });
          choicesEl.appendChild(btn);
        });

        // can use kb presses
        document.onkeydown = (ev)=>{
          const n = parseInt(ev.key, 10);
          if (!isNaN(n) && n >= 1 && n <= choicesEl.children.length){
            if (soundOn) playFx(sfxClick, 0.35);
            choicesEl.children[n-1].click();
          }
        };
      }

      // animate it in
      card.animate(
        [{opacity:0, transform:'translateY(8px) scale(.98)'},
         {opacity:1, transform:'translateY(0) scale(1)'}],
        {duration:220, easing:'ease'}
      );
    };
  }

  render('start');
});
