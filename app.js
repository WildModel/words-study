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
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ records, settings })); return true; } catch (_) { alert('保存失败，请检查设备存储空间或浏览器设置。'); return false; } };
const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const tomorrow = () => { const d = new Date(); d.setHours(24, 0, 0, 0); return d.getTime(); };
const allWords = () => Object.values(data).flat();
const dueWords = () => allWords().filter(w => records[keyOf(w)] && records[keyOf(w)].due < tomorrow()).sort((a,b) => records[keyOf(a)].due - records[keyOf(b)].due);
const weakWords = () => allWords().filter(w => records[keyOf(w)]?.weak).sort((a,b) => records[keyOf(a)].due - records[keyOf(b)].due);
const icon = (name) => ({ home:'⌂', study:'▤', mine:'◉', sound:'◖))', back:'‹' }[name]);
function nav() { return `<nav class="nav" aria-label="主导航">${[['home','home','今日'],['study','study','学习'],['mine','mine','我的']].map(([id,ico,label]) => `<button class="nav-item ${page===id?'active':''}" data-page="${id}"><span aria-hidden="true">${icon(ico)}</span>${label}</button>`).join('')}</nav>`; }
function shell(content) { app.innerHTML = `<div class="screen">${content}</div>${nav()}`; }
function renderHome() {
  const due = dueWords(), weak = weakWords(), studied = Object.keys(records).length;
  const today = Object.values(records).filter(r => r.last >= dayStart()).length;
  const greeting = new Intl.DateTimeFormat('zh-CN', { month:'long', day:'numeric', weekday:'long' }).format(new Date());
  shell(`<header class="top"><div><div class="brand">WORDNOTE <span> / 单词手记</span></div><h1>今天，记住一点。</h1><p>${greeting}</p></div><div class="brand-mark">W<span>.</span></div></header>
    <section class="review-panel"><div class="section-kicker">YOUR DAILY REVIEW <span>01</span></div><div class="review-main"><div><h2>今日复习</h2><p>${due.length ? '温习到期单词，让记忆更牢固' : '今天的复习已完成，继续保持'}</p></div><div class="due-number">${due.length}<small>个待复习</small></div></div><button class="primary" data-action="review" ${due.length?'':'disabled'}>开始复习 <span>→</span></button></section>
    <section class="section"><div class="section-heading"><div><div class="eyebrow">YOUR PROGRESS</div><h2>学习概览</h2></div></div><div class="stats"><div><strong>${today}</strong><span>今日学习</span></div><div><strong>${studied}</strong><span>已学习词条</span></div><div><strong>${weak.length}</strong><span>不熟悉</span></div></div></section>
    <section class="section"><button class="list-action" data-action="weak" ${weak.length?'':'disabled'}><span class="list-icon">↻</span><span><b>再练不熟悉的词</b><small>${weak.length ? `${weak.length} 个单词等待巩固` : '还没有不熟悉的单词'}</small></span><span class="arrow">→</span></button><button class="list-action" data-page="study"><span class="list-icon coral">✳</span><span><b>开始一组新学习</b><small>选择级别，按自己的节奏出发</small></span><span class="arrow">→</span></button></section>`);
}
function renderStudy() {
  const words = data[settings.book], levels = [...new Set(words.map(w => w.level))].sort((a,b) => ['A1','A2','B1','B2','C1','C2','NS','CQ'].indexOf(a)-['A1','A2','B1','B2','C1','C2','NS','CQ'].indexOf(b));
  if (!levels.includes(settings.level)) settings.level = levels[0];
  const available = words.filter(w => w.level === settings.level), unseen = available.filter(w => !records[keyOf(w)]).length;
  shell(`<header class="page-header"><div class="eyebrow">MAKE IT A HABIT</div><h1>开始学习</h1><p>选好你的计划，专注这一组单词。</p></header>
    <section class="form-section"><div class="form-title"><span>01</span><h2>选择词库</h2></div><div class="book-grid">${['3000','2000'].map(n=>`<button class="book-option ${settings.book===n?'selected':''}" data-book="${n}"><span>VOCABULARY</span><strong>${n}</strong><small>单词词库 ${settings.book===n?'✓':''}</small></button>`).join('')}</div></section>
    <section class="form-section"><div class="form-title"><span>02</span><h2>选择级别</h2></div><div class="chips">${levels.map(l=>`<button class="chip ${settings.level===l?'selected':''}" data-level="${esc(l)}">${esc(l)}</button>`).join('')}</div><p class="hint">此级别共 ${available.length} 个单词 · ${unseen} 个未学习</p></section>
    <section class="form-section"><div class="form-title"><span>03</span><h2>安排这一组</h2></div><div class="control-row"><span>学习方式</span><div class="segmented">${[['sequence','按顺序'],['random','随机']].map(([v,l])=>`<button class="${settings.order===v?'selected':''}" data-order="${v}">${l}</button>`).join('')}</div></div><div class="control-row"><span>单词数量</span><div class="segmented">${[10,20,30].map(n=>`<button class="${settings.count===n?'selected':''}" data-count="${n}">${n}</button>`).join('')}</div></div></section><button class="primary start" data-action="start">开始学习 <span>→</span></button>`);
}
function renderMine() {
  shell(`<header class="page-header"><div class="eyebrow">YOUR WORDNOTE</div><h1>我的学习</h1><p>给坚持留下记录。</p></header><section class="section"><div class="stats"><div><strong>${Object.keys(records).length}</strong><span>已学习词条</span></div><div><strong>${dueWords().length}</strong><span>今日待复习</span></div><div><strong>${weakWords().length}</strong><span>不熟悉</span></div></div></section><section class="section"><h2>学习记录</h2><p class="body-copy">记录保存在这台设备上。建议定期导出备份，换设备时可导入。</p><button class="list-action" data-action="export"><span class="list-icon">↓</span><span><b>导出学习记录</b><small>保存为备份文件</small></span><span class="arrow">→</span></button><label class="list-action file-label"><span class="list-icon coral">↑</span><span><b>导入学习记录</b><small>使用备份文件恢复</small></span><span class="arrow">→</span><input type="file" accept="application/json,.json" id="import-file"></label></section><p class="footnote">复习间隔参考间隔重复原则，并根据你的评分调整。</p>`);
}
function renderSession() {
  if (session.index >= session.words.length) { app.innerHTML = `<div class="session-screen finish"><div class="finish-mark">✓</div><div class="eyebrow">SESSION COMPLETE</div><h1>这一组完成了</h1><p>已学习 ${session.words.length} 个单词。下一次复习会根据你的记忆程度安排。</p><button class="primary" data-action="finish">回到今日 <span>→</span></button></div>`; return; }
  const w = session.words[session.index], r = records[keyOf(w)];
  app.innerHTML = `<div class="session-screen"><header class="session-top"><button class="back" data-action="exit" aria-label="退出学习">${icon('back')}</button><div><strong>${esc(session.title)}</strong><small>${session.index+1} / ${session.words.length}</small></div><span class="session-level">${esc(w.level)}</span></header><div class="progress"><span style="width:${(session.index/session.words.length)*100}%"></span></div><div class="card-label">${esc(w.topic || 'WORD STUDY')} <span>${r?.weak?'待巩固':'WORD '+String(session.index+1).padStart(2,'0')}</span></div><article class="word-card"><div class="word-head"><div><div class="word">${esc(w.word)}</div><div class="phonetic">${esc(w.us || w.meta || '')}</div></div><button class="sound" data-action="speak" aria-label="朗读单词">${icon('sound')}</button></div>${session.revealed ? `<div class="answer"><div class="translation">${esc(w.cn)}</div>${(w.definitions||[]).map(d=>`<div class="definition"><span>${esc(d.pos)}</span><p>${esc(d.meaning)}</p>${d.example?`<em>${esc(d.example)}</em>`:''}</div>`).join('')}${w.note?`<p class="note">${esc(w.note)}</p>`:''}</div>` : `<div class="recall"><div class="recall-symbol">✳</div><p>想一想，它是什么意思？</p><small>先回忆，再查看答案</small></div>`}</article><div class="session-actions">${session.revealed ? `<div class="rate-title">你记得有多牢？</div><div class="ratings"><button data-rate="again"><strong>忘记了</strong><small>明天再看</small></button><button data-rate="hard"><strong>不太熟</strong><small>较快复习</small></button><button data-rate="good"><strong>记住了</strong><small>逐步延长</small></button></div>` : `<button class="primary" data-action="reveal">查看答案 <span>↓</span></button>`}</div></div>`;
}
function render() { if (session) return renderSession(); if(page==='study') return renderStudy(); if(page==='mine') return renderMine(); renderHome(); }
function start(words, title) { if (!words.length) return; session = { words, title, index:0, revealed:false }; render(); window.scrollTo(0,0); }
function rate(value) {
  const w = session.words[session.index], key = keyOf(w), old = records[key] || { stage:-1 };
  const stage = value === 'again' ? 0 : value === 'hard' ? Math.max(0, old.stage - 1) : Math.min(intervals.length-1, old.stage + 1);
  const next = new Date(); next.setDate(next.getDate() + intervals[stage]); next.setHours(0,0,0,0);
  records[key] = { stage, due:next.getTime(), last:Date.now(), weak:value !== 'good' };
  if (!save()) return;
  session.index++; session.revealed = false; render(); window.scrollTo(0,0);
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
  else if (d.action==='start') { let words=data[settings.book].filter(w=>w.level===settings.level); if(settings.order==='random') { words=[...words]; for(let i=words.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [words[i],words[j]]=[words[j],words[i]]; } } else { words=[...words.filter(w=>!records[keyOf(w)]),...words.filter(w=>records[keyOf(w)])]; } start(words.slice(0,settings.count), '单词学习'); }
  else if (d.action==='review') start(dueWords(), '今日复习');
  else if (d.action==='weak') start(weakWords(), '巩固练习');
  else if (d.action==='reveal') { session.revealed=true; render(); }
  else if (d.action==='exit') { session=null; render(); }
  else if (d.action==='finish') { session=null; page='home'; render(); }
  else if (d.action==='speak' && 'speechSynthesis' in window) { speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(session.words[session.index].word); u.lang='en-US'; speechSynthesis.speak(u); }
  else if (d.action==='export') { const blob=new Blob([JSON.stringify({version:1, records, settings},null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='wordnote-backup.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
});
app.addEventListener('change', async event => {
  if (event.target.id !== 'import-file' || !event.target.files[0]) return;
  try { const backup=JSON.parse(await event.target.files[0].text()); if (backup.version!==1 || !backup.records || typeof backup.records!=='object' || Array.isArray(backup.records) || Object.values(backup.records).some(r=>!r || !Number.isFinite(r.due) || !Number.isFinite(r.last) || !Number.isInteger(r.stage) || r.stage<0 || r.stage>=intervals.length || typeof r.weak!=='boolean')) throw Error(); if (!confirm('导入会替换当前学习记录，确定继续吗？')) return; const previous=records; records=backup.records; if (!save()) { records=previous; return; } render(); alert('学习记录已导入。'); } catch (_) { alert('备份文件无效，无法导入。'); } event.target.value='';
});
Promise.all(['2000','3000'].map(async book => { const response=await fetch(`words-${book}.json`); if (!response.ok) throw Error('词库加载失败'); data[book]=(await response.json()).map(w=>({...w,book})); })).then(() => { render(); if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{}); }).catch(() => { app.innerHTML='<div class="loading">词库加载失败，请连接网络后重新打开。</div>'; });
