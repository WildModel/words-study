const app = document.querySelector('#app');
const KEY = 'wordnote-v1';
const intervals = [1, 2, 4, 7, 15, 30, 60];
let data = {}, records = {}, settings = { book: '3000', level: 'A1', count: 10, order: 'sequence' };
let page = 'home', session = null;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  records = saved.records || {};
  settings = { ...settings, ...saved.settings };
} catch (_) { /* Start with an empty history if stored data is invalid. */ }
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const keyOf = w => `${w.book}:${w.id}`;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ records, settings })); return true; } catch (_) { alert('Could not save your progress. Check your device storage or browser settings.'); return false; } };
const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const tomorrow = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); };
const allWords = () => Object.values(data).flat();
const dueWords = () => allWords().filter(w => records[keyOf(w)] && records[keyOf(w)].due < tomorrow()).sort((a,b) => records[keyOf(a)].due - records[keyOf(b)].due);
const weakWords = () => allWords().filter(w => records[keyOf(w)]?.weak).sort((a,b) => records[keyOf(a)].due - records[keyOf(b)].due);
const icon = (name) => ({ home:'⌂', study:'▤', mine:'◉', sound:'◖))', back:'‹' }[name]);
function nav() { return `<nav class="nav" aria-label="Main navigation">${[['home','home','Today'],['study','study','Study'],['mine','mine','Profile']].map(([id,ico,label]) => `<button class="nav-item ${page===id?'active':''}" data-page="${id}"><span aria-hidden="true">${icon(ico)}</span>${label}</button>`).join('')}</nav>`; }
function shell(content) { app.innerHTML = `<div class="screen">${content}</div>${nav()}`; }
function renderHome() {
  const due = dueWords(), weak = weakWords(), studied = Object.keys(records).length;
  const today = Object.values(records).filter(r => r.last >= dayStart()).length;
  const greeting = new Intl.DateTimeFormat('en-US', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
  shell(`<header class="top"><div><div class="brand">WORDNOTE</div><h1>Learn a little today.</h1><p>${greeting}</p></div><div class="brand-mark">W<span>.</span></div></header>
    <section class="review-panel"><div class="section-kicker">YOUR DAILY REVIEW <span>01</span></div><div class="review-main"><div><h2>Today's review</h2><p>${due.length ? 'Review your due words to make them stick.' : 'No words are due for review today.'}</p></div><div class="due-number">${due.length}<small>due</small></div></div><button class="primary" data-action="review" ${due.length?'':'disabled'}>Start review <span>→</span></button></section>
    <section class="section"><div class="section-heading"><div><div class="eyebrow">YOUR PROGRESS</div><h2>Your progress</h2></div></div><div class="stats"><div><strong>${today}</strong><span>Studied today</span></div><div><strong>${studied}</strong><span>Words studied</span></div><div><strong>${weak.length}</strong><span>Need practice</span></div></div></section>
    <section class="section"><button class="list-action" data-action="weak" ${weak.length?'':'disabled'}><span class="list-icon">↻</span><span><b>Practice difficult words</b><small>${weak.length ? `${weak.length} words to practice` : 'No difficult words yet'}</small></span><span class="arrow">→</span></button><button class="list-action" data-page="study"><span class="list-icon coral">✳</span><span><b>Start a study session</b><small>Choose a level and study at your own pace</small></span><span class="arrow">→</span></button></section>`);
}
function renderStudy() {
  const words = data[settings.book], levels = [...new Set(words.map(w => w.level))].sort((a,b) => ['A1','A2','B1','B2','C1','C2','NS','CQ'].indexOf(a)-['A1','A2','B1','B2','C1','C2','NS','CQ'].indexOf(b));
  if (!levels.includes(settings.level)) settings.level = levels[0];
  const available = words.filter(w => w.level === settings.level), unseen = available.filter(w => !records[keyOf(w)]).length;
  shell(`<header class="page-header"><div class="eyebrow">MAKE IT A HABIT</div><h1>Start studying</h1><p>Choose your plan and focus on one set at a time.</p></header>
    <section class="form-section"><div class="form-title"><span>01</span><h2>Choose a word list</h2></div><div class="book-grid">${['3000','2000'].map(n=>`<button class="book-option ${settings.book===n?'selected':''}" data-book="${n}"><span>VOCABULARY</span><strong>${n}</strong><small>Word list ${settings.book===n?'✓':''}</small></button>`).join('')}</div></section>
    <section class="form-section"><div class="form-title"><span>02</span><h2>Choose a level</h2></div><div class="chips">${levels.map(l=>`<button class="chip ${settings.level===l?'selected':''}" data-level="${esc(l)}">${esc(l)}</button>`).join('')}</div><p class="hint">${available.length} words at this level · ${unseen} not yet studied</p></section>
    <section class="form-section"><div class="form-title"><span>03</span><h2>Set up your session</h2></div><div class="control-row"><span>Order</span><div class="segmented">${[['sequence','In order'],['random','Random']].map(([v,l])=>`<button class="${settings.order===v?'selected':''}" data-order="${v}">${l}</button>`).join('')}</div></div><div class="control-row"><span>Number of words</span><div class="segmented">${[10,20,30].map(n=>`<button class="${settings.count===n?'selected':''}" data-count="${n}">${n}</button>`).join('')}</div></div></section><button class="primary start" data-action="start">Start studying <span>→</span></button>`);
}
function renderMine() {
  shell(`<header class="page-header"><div class="eyebrow">YOUR WORDNOTE</div><h1>Your learning</h1><p>A record of your progress.</p></header><section class="section"><div class="stats"><div><strong>${Object.keys(records).length}</strong><span>Words studied</span></div><div><strong>${dueWords().length}</strong><span>Due today</span></div><div><strong>${weakWords().length}</strong><span>Need practice</span></div></div></section><section class="section"><h2>Learning history</h2><p class="body-copy">Your progress is stored on this device. Export a backup regularly and import it when you change devices.</p><button class="list-action" data-action="export"><span class="list-icon">↓</span><span><b>Export progress</b><small>Save a backup file</small></span><span class="arrow">→</span></button><label class="list-action file-label"><span class="list-icon coral">↑</span><span><b>Import progress</b><small>Restore from a backup</small></span><span class="arrow">→</span><input type="file" accept="application/json,.json" id="import-file"></label></section><p class="footnote">Review intervals follow spaced repetition principles and adjust to your ratings.</p>`);
}
function renderSession() {
  if (session.index >= session.words.length) { app.innerHTML = `<div class="session-screen finish"><div class="finish-mark">✓</div><div class="eyebrow">SESSION COMPLETE</div><h1>Set complete</h1><p>You studied ${session.words.length} words. Your next review will be scheduled based on your ratings.</p><button class="primary" data-action="finish">Back to today <span>→</span></button></div>`; return; }
  const w = session.words[session.index], r = records[keyOf(w)];
  const isNew = session.mode === 'study';
  const topic = w.topic && !/[\u4e00-\u9fff]/.test(w.topic) ? w.topic : 'WORD STUDY';
  const translation = session.showTranslation ? `<div class="translation">${esc(w.cn)}</div>` : `<button class="translation-toggle" data-action="translation">Show Chinese translation <span>＋</span></button>`;
  const answer = `<div class="answer">${translation}${(w.definitions||[]).map(d=>`<div class="definition"><span>${esc(d.pos)}</span><p>${esc(d.meaning)}</p>${d.example?`<em>${esc(d.example)}</em>`:''}</div>`).join('')}${w.note?`<p class="note">${esc(w.note)}</p>`:''}</div>`;
  app.innerHTML = `<div class="session-screen"><header class="session-top"><button class="back" data-action="exit" aria-label="Exit session">${icon('back')}</button><div><strong>${esc(session.title)}</strong><small>${session.index+1} / ${session.words.length}</small></div><span class="session-level">${esc(w.level)}</span></header><div class="progress"><span style="width:${(session.index/session.words.length)*100}%"></span></div><div class="card-label">${esc(topic)} <span>${r?.weak?'NEEDS PRACTICE':'WORD '+String(session.index+1).padStart(2,'0')}</span></div><article class="word-card"><div class="word-head"><div><div class="word">${esc(w.word)}</div><div class="phonetic">${esc(w.us || w.meta || '')}</div></div><button class="sound" data-action="speak" aria-label="Play pronunciation">${icon('sound')}</button></div>${session.revealed ? answer : `<div class="recall"><div class="recall-symbol">✳</div><p>Try to recall the meaning.</p><small>Reveal the answer when you're ready.</small></div>`}</article><div class="session-actions">${session.revealed ? `<div class="rate-title">${isNew ? 'How well did you remember?' : 'How well do you remember this word?'}</div><div class="ratings"><button data-rate="again"><strong>${isNew?'Can’t remember':'Forgot'}</strong><small>Review tomorrow</small></button><button data-rate="hard"><strong>${isNew?'Not very familiar':'Not sure'}</strong><small>Review sooner</small></button><button data-rate="good"><strong>${isNew?'Remembered it':'Got it'}</strong><small>Review later</small></button></div>` : `<button class="primary" data-action="reveal">Show answer <span>↓</span></button>`}</div></div>`;
}
function render() { if (session) return renderSession(); if(page==='study') return renderStudy(); if(page==='mine') return renderMine(); renderHome(); }
function start(words, title, mode = 'review') { if (!words.length) return; session = { words, title, mode, index:0, revealed:mode==='study', showTranslation:false }; render(); window.scrollTo(0,0); }
function rate(value) {
  const w = session.words[session.index], key = keyOf(w), old = records[key] || { stage:-1 };
  const stage = value === 'again' ? 0 : value === 'hard' ? Math.max(0, old.stage - 1) : Math.min(intervals.length-1, old.stage + 1);
  const next = new Date(); next.setDate(next.getDate() + intervals[stage]); next.setHours(0,0,0,0);
  records[key] = { stage, due:next.getTime(), last:Date.now(), weak:value !== 'good' };
  if (!save()) return;
  session.index++; session.revealed = session.mode==='study'; session.showTranslation=false; render(); window.scrollTo(0,0);
}
app.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  const d = button.dataset;
  if (d.page) { page=d.page; session=null; render(); window.scrollTo(0,0); }
  else if (d.book) { settings.book=d.book; save(); render(); }
  else if (d.level) { settings.level=d.level; save(); render(); }
  else if (d.count) { settings.count=Number(d.count); save(); render(); }
  else if (d.order) { settings.order=d.order; save(); render(); }
  else if (d.rate) rate(d.rate);
  else if (d.action==='start') { let words=data[settings.book].filter(w=>w.level===settings.level); if(settings.order==='random') { words=[...words]; for(let i=words.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [words[i],words[j]]=[words[j],words[i]]; } } else { words=[...words.filter(w=>!records[keyOf(w)]),...words.filter(w=>records[keyOf(w)])]; } start(words.slice(0,settings.count), 'New words', 'study'); }
  else if (d.action==='review') start(dueWords(), 'Daily review');
  else if (d.action==='weak') start(weakWords(), 'Difficult words');
  else if (d.action==='reveal') { session.revealed=true; render(); }
  else if (d.action==='translation') { session.showTranslation=true; render(); }
  else if (d.action==='exit') { session=null; render(); }
  else if (d.action==='finish') { session=null; page='home'; render(); }
  else if (d.action==='speak' && 'speechSynthesis' in window) { speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(session.words[session.index].word); u.lang='en-US'; speechSynthesis.speak(u); }
  else if (d.action==='export') { const blob=new Blob([JSON.stringify({version:1, records, settings},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='wordnote-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
});
app.addEventListener('change', async event => {
  if (event.target.id !== 'import-file' || !event.target.files[0]) return;
  try { const backup=JSON.parse(await event.target.files[0].text()); if (backup.version!==1 || !backup.records || typeof backup.records!=='object' || Array.isArray(backup.records) || Object.values(backup.records).some(r=>!r || !Number.isFinite(r.due) || !Number.isFinite(r.last) || !Number.isInteger(r.stage) || r.stage<0 || r.stage>=intervals.length || typeof r.weak!=='boolean')) throw Error(); if (!confirm('Importing will replace your current progress. Continue?')) return; const previous=records; records=backup.records; if (!save()) { records=previous; return; } render(); alert('Progress imported.'); } catch (_) { alert('Invalid backup file.'); } event.target.value='';
});
Promise.all(['2000','3000'].map(async book => { const response=await fetch(`words-${book}.json`); if (!response.ok) throw Error('Word list failed to load'); data[book]=(await response.json()).map(w=>({...w,book})); })).then(() => { render(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); }).catch(() => { app.innerHTML='<div class="loading">Could not load word lists. Check your connection and try again.</div>'; });
