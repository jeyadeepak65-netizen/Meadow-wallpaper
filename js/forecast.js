'use strict';
/* 7-day forecast strip in the panel; click a day to preview how the meadow will look */

let forecast = [], fcPicked = -1;
const fcEl = $('forecast'), fcBtn = $('fcBtn'), fcHint = $('fcHint');
const wxIcon = c => c === 0 ? '☀️' : c === 1 ? '🌤' : c === 2 ? '⛅' : c === 3 ? '☁️' : (c === 45 || c === 48) ? '🌫' : (c >= 51 && c <= 57) ? '🌦' : ((c >= 61 && c <= 67) || (c >= 80 && c <= 82)) ? '🌧' : (c >= 71 && c <= 77) ? '❄️' : c >= 95 ? '⛈' : '☁️';

function renderForecast() {
  fcEl.innerHTML = '';
  forecast.forEach((d, i) => {
    const b = document.createElement('button'); b.className = 'fcDay' + (i === fcPicked ? ' on' : '');
    b.title = d.name + ' - ' + d.wx.label + ', ' + d.hi + '° / ' + d.lo + '°  ·  sunrise ' + fmtHM(d.sun.rise) + ', sunset ' + fmtHM(d.sun.set) + '  ·  ' + d.moon.name + ' (' + Math.round(d.moon.k * 100) + '% lit)';
    b.innerHTML = '<span>' + (i === 0 ? 'Today' : d.name) + '</span><span class="ic">' + wxIcon(d.code) + '</span><b>' + d.hi + '°</b><i>' + d.lo + '°</i><span class="mn">' + d.moonIcon + '</span>';
    b.onclick = () => pickDay(i); fcEl.appendChild(b);
  });
}
function clearPreview() { fcPicked = -1; preview = null; renderForecast(); updateMoon(); }
function pickDay(i) {
  if (i === fcPicked) { clearPreview(); override = 'auto'; document.querySelectorAll('#wSeg button').forEach(x => x.classList.toggle('on', x.dataset.w === 'auto')); return; }
  const d = forecast[i]; fcPicked = i; preview = { ...d.wx, hi: d.hi, lo: d.lo, name: i === 0 ? 'Today' : d.name, date: d.date }; override = 'day';
  document.querySelectorAll('#wSeg button').forEach(x => x.classList.remove('on')); renderForecast(); updateMoon();
}
async function loadForecast() {
  try {
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,cloud_cover_mean&forecast_days=7&timezone=auto`).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    const dd = w.daily; forecast = dd.time.map((t, i) => {
      const [y, m, da] = t.split('-').map(Number), code = dd.weather_code[i];
      const date = new Date(y, m - 1, da), eve = new Date(y, m - 1, da, 20, 0), mo = computeMoon(eve);
      return { code, date, sun: sunInfo(date), moon: mo, moonIcon: moonEmoji(mo.e, lat < 0), hi: Math.round(dd.temperature_2m_max[i]), lo: Math.round(dd.temperature_2m_min[i]), name: new Date(y, m - 1, da).toLocaleDateString(undefined, { weekday: 'short' }),
        wx: wxFromCode(code, dd.wind_speed_10m_max[i], dd.cloud_cover_mean ? dd.cloud_cover_mean[i] : null) };
    });
    fcHint.style.display = ''; renderForecast();
  } catch (e) { console.warn('forecast failed', e); if (!forecast.length) { fcEl.innerHTML = '<div class="fcmsg">Forecast needs an internet connection</div>'; fcHint.style.display = 'none'; } }
}
fcBtn.onclick = () => { const shut = fcEl.classList.toggle('collapsed'); fcHint.classList.toggle('collapsed', shut); fcBtn.classList.toggle('shut', shut); fcBtn.setAttribute('aria-expanded', String(!shut)); };
document.querySelectorAll('#wSeg button').forEach(b => b.addEventListener('click', clearPreview));      // picking Auto / clear / cloud / rain leaves forecast preview
$('refresh').addEventListener('click', loadForecast);
setInterval(loadForecast, 30 * 60 * 1000);
loadForecast();
