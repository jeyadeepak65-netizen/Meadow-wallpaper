# Live meadow wallpaper

Open `index.html`. Works fully offline: Three.js is bundled in `js/vendor/`. Internet is only used (optionally) for live weather and the place name; without it the scene shows clear weather and your device time.
Add `?wallpaper` to the URL for wallpaper-engine mode (starts sound, hides the intro).

- `css/style.css` - all styling
- `js/loader.js` - loads the scripts below in order
- `js/vendor/three.js` - Three.js r160, bundled locally
- `js/core.js` - helpers, renderer, camera, terrain, shared uniforms
- `js/flora.js` - flowers, grass, daisies
- `js/sky.js` - sky, sun, moon, stars, clouds
- `js/pond.js` - pond water, rain, fireflies
- `js/creatures.js` - butterflies, fish, birds, bats, owls
- `js/weather.js` - weather and location lookup
- `js/ui.js` - time dial and settings panel
- `js/forecast.js` - 7-day forecast strip and day preview
- `js/audio.js` - all sound (pond, wind, birds, owl, drops)
- `js/input.js` - mouse / touch
- `js/main.js` - colours and the animation loop
