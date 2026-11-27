/* Loads the bundled Three.js (offline), then the scene scripts in order. They share one global scope on purpose. */
(function () {
  const SCRIPTS = ['vendor/three', 'core', 'flora', 'sky', 'pond', 'creatures', 'weather', 'ui', 'forecast', 'audio', 'input', 'main'].map(n => 'js/' + n + '.js');
  const fail = e => { console.error(e); const l = document.getElementById('loading'); if (l) l.textContent = 'Could not load the scene files - keep the folder structure intact.'; };
  const load = src => new Promise((ok, no) => { const el = document.createElement('script'); el.src = src; el.onload = ok; el.onerror = () => no(new Error('Failed to load ' + src)); document.body.appendChild(el); });
  SCRIPTS.reduce((p, src) => p.then(() => load(src)), Promise.resolve()).catch(fail);
})();
