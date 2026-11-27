'use strict';
/* Weather and location */

/* =========================== weather + location =========================== */
const state = { place: '', temp: null, label: 'Clear sky', apiCloud: 0.05, apiRain: 0, apiFog: 0, apiWind: 1 };
const cur = { cloud: 0.05, rain: 0, wind: 1, fog: 0 };
let override = 'auto', lat = 9.92, lon = 78.12, preview = null;
// the date the scene should show: today, or the forecast day being previewed (at the same time of day)
function viewDate(hr) {
  const d = new Date(); if (!(override === 'day' && preview && preview.date)) return d;
  const h = hr == null ? d.getHours() + d.getMinutes() / 60 : hr, p = preview.date;
  return new Date(p.getFullYear(), p.getMonth(), p.getDate(), Math.floor(h) % 24, Math.floor((h % 1) * 60));
}
const qp = new URLSearchParams(location.search), GKEY = qp.get('gkey');
let fixedPlace = qp.get('city');
function setWeather(label, cloud, r, fog, ws) { Object.assign(state, { label, apiCloud: clamp(cloud, 0, 1), apiRain: r, apiFog: fog, apiWind: Math.min(2.5, 0.7 + (ws || 0) / 12) }); }
function wxFromCode(code, ws, cc) {                                   // Open-Meteo weather code -> how the scene should look
  let label = 'Clear sky', cloud = 0.05, r = 0, fog = 0;
  if (code === 1) { label = 'Mostly clear'; cloud = 0.2; } else if (code === 2) { label = 'Partly cloudy'; cloud = 0.5; }
  else if (code === 3) { label = 'Overcast'; cloud = 1; } else if (code === 45 || code === 48) { label = 'Fog'; cloud = 0.8; fog = 1; }
  else if (code >= 51 && code <= 57) { label = 'Drizzle'; cloud = 0.9; r = 0.4; }
  else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { label = 'Rain'; cloud = 1; r = 1; }
  else if (code >= 71 && code <= 77) { label = 'Snow'; cloud = 1; } else if (code >= 95) { label = 'Thunderstorm'; cloud = 1; r = 1; }
  if (code <= 3 && cc != null) cloud = cc / 100;                      // use the measured cloud cover for clear / cloudy skies
  return { label, cloud: clamp(cloud, 0, 1), r, fog, wind: Math.min(2.5, 0.7 + (ws || 0) / 12) };
}
function applyCode(code, ws, cc) { const w = wxFromCode(code, ws, cc); setWeather(w.label, w.cloud, w.r, w.fog, ws); }
function applyGoogle(w) {                                              // Google Weather API: currentConditions
  const wc = w.weatherCondition || {}, type = String(wc.type || '').toUpperCase();
  let cloud = w.cloudCover != null ? w.cloudCover / 100 : 0.2, r = 0, fog = 0;
  if (/THUNDER|RAIN|SHOWER|DRIZZLE/.test(type)) { r = /LIGHT|SCATTERED|DRIZZLE/.test(type) ? 0.4 : 1; cloud = Math.max(cloud, 0.9); }
  if (/SNOW|HAIL|SLEET|BLIZZARD/.test(type)) cloud = 1;
  if (/FOG|HAZE|MIST/.test(type)) fog = 1;
  const label = (wc.description && wc.description.text) || type.toLowerCase().replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()) || 'Weather';
  setWeather(label, cloud, r, fog, w.wind && w.wind.speed && w.wind.speed.value);
  if (w.temperature && w.temperature.degrees != null) state.temp = Math.round(w.temperature.degrees);
}
async function loadWeather() {
  if (GKEY) {
    try {
      const w = await fetch(`https://weather.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(GKEY)}&location.latitude=${lat}&location.longitude=${lon}`).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      applyGoogle(w); state.source = 'Google Weather'; return;
    } catch (e) { console.warn('Google Weather failed, using Open-Meteo instead', e); }
  }
  try {
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover&timezone=auto`).then(r => r.json());
    state.temp = Math.round(w.current.temperature_2m); applyCode(w.current.weather_code, w.current.wind_speed_10m, w.current.cloud_cover); state.source = 'Open-Meteo';
  } catch (e) { console.warn('weather failed', e); }
}
async function loadPlace() {                                           // street-level name: neighbourhood / area, then town
  if (fixedPlace) { state.place = fixedPlace; return; }
  try {
    const g = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat.toFixed(5)}&lon=${lon.toFixed(5)}&zoom=16&addressdetails=1&accept-language=en`).then(r => r.json()), a = g.address || {};
    const area = a.neighbourhood || a.suburb || a.quarter || a.village || a.hamlet || a.city_district || a.residential || a.road;
    const town = a.city || a.town || a.municipality || a.county || a.state_district || a.state;
    const name = [...new Set([area, town].filter(Boolean))].join(', ');
    if (name) { state.place = name; return; }
  } catch (e) { /* fall through to the second service */ }
  try {
    const g = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).then(r => r.json());
    state.place = g.locality && g.city && g.locality !== g.city ? g.locality + ', ' + g.city : g.city || g.locality || g.principalSubdivision || 'Your location';
  } catch (e) { state.place = 'Your location'; }
}
function startAt(la, lo) { lat = la; lon = lo; loadWeather(); loadPlace(); updateMoon(); if (typeof loadForecast === 'function') loadForecast(); }
setInterval(loadWeather, 10 * 60 * 1000);
if (qp.has('lat') && qp.has('lon')) startAt(parseFloat(qp.get('lat')), parseFloat(qp.get('lon')));
else if (navigator.geolocation) { updateMoon(); navigator.geolocation.getCurrentPosition(p => startAt(p.coords.latitude, p.coords.longitude), () => startAt(lat, lon), { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }); }
else startAt(lat, lon);
setInterval(updateMoon, 5 * 60 * 1000);
$('refresh').onclick = loadWeather;
$('placeBtn').onclick = async () => {                                  // type any area, street or city
  const q = prompt('Type a place (area, street or city):'); if (!q) return;
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(q)}`).then(r => r.json());
    if (r[0]) { fixedPlace = null; startAt(parseFloat(r[0].lat), parseFloat(r[0].lon)); } else alert('Place not found');
  } catch (e) { alert('Could not search right now'); }
};
