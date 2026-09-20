# Roamerz - Living World Adventure Game

A 2D top-down living-world adventure where NPCs live independently.

## Phases

```
PHASE 1  — Project Foundation [COMPLETE]
PHASE 2  — World Map [COMPLETE]
PHASE 3  — Player Movement [COMPLETE]
PHASE 4  — Collision System [COMPLETE]
PHASE 5  — Camera System [COMPLETE]
PHASE 6  — NPC Foundation [COMPLETE]
PHASE 7  — NPC Pathfinding [COMPLETE]
PHASE 8  — NPC Homes & Buildings [COMPLETE]
PHASE 9  — Time & NPC Schedules [COMPLETE]
PHASE 10 — NPC Life Simulation [COMPLETE]
PHASE 11 — Player Interaction & Dialogue [COMPLETE]
PHASE 12 — Exploration & World Expansion [COMPLETE]
PHASE 13 — Save/Load & World Persistence [COMPLETE]
PHASE 14 — Inventory System [COMPLETE]
PHASE 15 — Farming System [COMPLETE]
PHASE 16.1 — Animals / Livestock System [COMPLETE]
PHASE 16.2 — Crafting System [COMPLETE]
PHASE 16.3 — Cooking System [COMPLETE]
PHASE 16.4 — Weather System [CURRENT]
PHASE 16.5 — Economy / Shop System
```

## Phase 16.4 - Weather System [CURRENT]

### Objective
Data-driven weather types with transitions, visuals (tint + particles), effects on farming/animals/vision, auto-watering crops when rainy, persistence, debug, small controlled phase, preserve all previous systems.

### Weather System
- **Weather.ts**: WeatherType SUNNY/CLOUDY/RAINY/STORMY/FOGGY/SNOWY, WeatherEffects {farmingGrowthMultiplier, animalHappinessModifier, playerStaminaDrain, visionRadiusModifier, movementSpeedModifier}, WeatherVisual {overlayColor rgba, particleType none/rain/heavy_rain/snow/fog, particleCount, brightnessModifier}, WeatherDefinition {id,type,name,icon,description,effects,visual,minDurationSeconds,maxDurationSeconds,weight,intensityMin,Max,tags}, WeatherSaveData {current,intensity,nextChange,totalChanges,version}, createDefault
- **WeatherDatabase.ts**: 6 weathers data-driven:
  - sunny ☀️ clear bright, overlay rgba(255,240,150,0.08) brightness 1.1, farming x1.0 happy +2 vision +1, dur 1-3 days weight 30 intensity 0-0.2
  - cloudy ☁️ overcast, rgba(100,100,120,0.15) brightness 0.95, farming x1.0, dur 0.5-2 days weight 25
  - rainy 🌧️ gentle rain, rgba(80,120,200,0.18) particles 120 rain brightness 0.85, farming x1.5 waters crops, happy -2 vision -1, dur 0.3-1.5 days weight 20 intensity 0.4-0.8
  - stormy ⛈️ heavy storm, rgba(40,40,80,0.35) heavy_rain 200 brightness 0.7, farming x1.2 happy -5 vision -2, dur 0.2-0.8 days weight 10 intensity 0.7-1.0
  - foggy 🌫️ thick fog, rgba(180,180,190,0.30) fog 40 brightness 0.9, farming x0.8 vision -3, dur 0.2-1 day weight 10
  - snowy ❄️ snowfall, rgba(200,220,255,0.22) snow 100 brightness 1.05, farming x0.5 happy -3 vision -1 speed 0.85, dur 0.5-2 days weight 5
  Methods getWeather, getAllWeathers, getWeatherByType, getCount, hasWeather, register/unregister, getWeathersByTag, validate, getDebugString
- **WeatherSystem.ts**: manager database, currentWeatherId sunny, intensity, nextChangeSeconds, totalChanges, version1, timeAccum. initialize(totalSeconds) random intensity + nextChange. randomRange, pickRandomWeather weighted excluding current. update(totalSeconds,deltaTime) checks if >= nextChange → pick new random, intensity random, nextChange random, totalChanges++, logs. getCurrentWeatherId/Def, getIntensity, getNextChange, getTotalChanges, getTimeUntilNextChange, isRaining (rain/heavy_rain), isSnowing, isFoggy, setWeather(id,intensity,totalSeconds) manual, cycleWeather(totalSeconds) cycles list, getDatabase, getSaveData/loadSaveData (preserves current lowercase, intensity clamped, nextChange, totalChanges), clear to sunny, getDebugString icon+id+intensity+changes+next, debugPrint
- **WeatherRenderer.ts**: setShowWeather, isShowing, toggle, particles array {x,y,vx,vy,size,alpha} 0-1 normalized, lastParticleType, timeAccum. initParticles(type,count) creates particles. createParticle(type) vx/vy/size/alpha per type: rain vx -0.02 to -0.07 vy 0.5-1.0 size1-3 alpha0.6-1, heavy_rain vx -0.05 to -0.15 vy 0.8-1.5 size2-5 alpha0.7-1, snow vx -0.05 to 0.05 vy 0.1-0.3 size2-6 alpha0.7-1, fog vx -0.02 to 0.02 vy -0.01 to 0.01 size20-60 alpha0.1-0.3. updateParticles(type,deltaTime,intensity) reinit if type changed, speedMult 1+intensity, update x+=vx*dt*60*0.5*mult, y+=vy*dt*60*0.5*mult, wrap: rain y>1 → x random 1.2-0.1 y -0.1, snow y>1 → x random y -0.1 + sway sin, fog wrap all sides. render(ctx,w,h,weatherSystem,deltaTime) if !showWeather return, def + intensity, timeAccum+=dt, updateParticles, overlayColor rgba parsing to adjust alpha by intensity 0.5+intensity*0.8 capped 0.6, brightness modifier darken <1 rgba(0,0,0,darken*0.4*(0.5+intensity*0.5)) or brighten >1 rgba(255,255,200,brighten*0.15*(0.5+intensity*0.5)), particles: rain/heavy_rain stroke lines len 12/18 color rgba(150,180,255,0.6) or (180,200,255,0.8) alpha p.alpha*(0.5+intensity*0.5), snow fill white circles, fog fill rgba(200,200,210,0.5) ellipses size*2 x size alpha 0.3+intensity*0.4, badge top-left 10,50 140x22 black 0.6 white text icon name intensity%. renderDebugInfo optional box 300x80 at right 120 y with details.
- **test_weather.ts**: manual tsx 14 checks: count 6, validation, sunny icon, rainy farming x1.5 particle rain, initial sunny, isRaining false sunny, setWeather rainy intensity 0.7 isRaining true, save/load round-trip, update triggers change after nextChange totalChanges++, cycleWeather, all icons, foggy vision -3, snowy snow farming 0.5, stormy heavy_rain intensityMax 1

### Save Extension Phase 16.4
- **SaveTypes.ts**: SAVE_VERSION 19 SAVE_GAME_VERSION 0.19.0, WorldSaveData.weather now {current,intensity,nextChange,totalChanges?,version} default {current:'SUNNY',intensity0,nextChange0,totalChanges0,version1}
- **SaveMigration.ts**: case 19 migrateToV19: old weather missing → new {current lowercased sunny, intensity 0, nextChange 0, totalChanges 0, version1}, preserves cooking totalCooked 2, crafting 3, farming, animals

### Game Integration Phase 16.4
- **Fields**: weatherDatabase singleton, weatherSystem, weatherRenderer, showWeather true default, showWeatherDebug true
- **Constructor**: weatherDatabase = WeatherDatabase.getInstance(), weatherSystem = new WeatherSystem(weatherDatabase), weatherRenderer = new WeatherRenderer()
- **Initialize**: weatherSystem.initialize(totalSeconds), WeatherDatabase count 6 debug, validation PASS, WeatherSystem debug, setShowWeather true, logs Phase 16.4 controls
- **CollectSaveData**: weatherSave = weatherSystem.getSaveData() included in worldSave.weather (was placeholder now real)
- **ApplySaveData**: if world.weather load via weatherSystem.loadSaveData
- **NewGame**: weatherSystem.clear + initialize, reset showWeather true setShowWeather true
- **handleWeatherInput**: new non-blocking method: Shift+W toggles overlay showWeather setShowWeather true/false message 🌦️ Weather ON/OFF - name, Ctrl+Shift+W cycles weather via cycleWeather, message 🌦️ Weather icon name intensity%, if raining waters all growing plots immediately waterPlot counts log
- **Other inputs**: farming/animal/crafting/cooking/inventory/map/auto/time/NPC/life/dialogue remain blocking on inventory/crafting/cooking/dialogue/save but NOT on weather (non-modal overlay). handleWeatherInput called after cooking before farming/animal. handleDebugToggles not blocked by weather (since non-modal), obstacle still Ctrl+Shift+K
- **Update**: weatherSystem.update(totalSeconds,deltaTime) each frame, if changed show message 🌦️ Weather changed to icon name intensity%, auto-water all growing plots when rainy (iterate getAllPlots, if growing/planted/watered and not watered then waterPlot), else continuous light watering while raining random 3% per frame pick random non-watered growing plot water
- **Render**: weather overlay after player rendering before time overlay: if showWeather && weatherSystem → weatherRenderer.render(ctx,w,h,weatherSystem,0.016) draws tint + particles + badge top-left 10,50 140x22. Farming overlay F, animals Shift+G, crafting Shift+C, cooking Shift+K, weather Shift+W all independent, map edge hint still checks not crafting/cooking/inventory/save
- **Debug**: weatherInfo via DebugManager new interface WeatherDebugInfo {weatherCount,weathers,current,intensity,totalChanges,debug,showWeather}, phase label 19, box height includes weatherHeight, renders WEATHER line blue #8af with count current intensity changes debug overlay
- **Tests**: runPhase16_4Tests 8 tests: count 6, validation, current weather, intensity range, isRaining bool, save/load, cycleWeather totalChanges++, rain waters plot integration, plus farming auto-water. T runs 7-16.4, P prints weather
- **Controls**: Shift+W toggle weather overlay (avoid WASD, debug toggle F2/`), Ctrl+Shift+W cycle weather manually, overlay badge always visible when ON at 10,50, particles rain/snow/fog with intensity, auto-waters crops when rainy/stormy
- **Help**: PHASE 16.4 WEATHER SYSTEM with controls

### DebugManager Phase 16.4
- Phase label 19, added WeatherDebugInfo interface, field weatherInfo, setter setWeatherInfo, boxHeight includes weatherHeight, renders WEATHER line #8af with count current intensity changes overlay

### Tests (Phase 16.4)
- Test1 WeatherDatabase count 6 → PASS
- Test2 validation → PASS
- Test3 sunny icon ☀️ → PASS
- Test4 rainy farming x1.5 rain → PASS
- Test5 initial sunny intensity 0.19 → PASS
- Test6 isRaining false sunny → PASS
- Test7 setWeather rainy intensity 0.7 isRaining true → PASS
- Test8 save/load round-trip → PASS
- Test9 update triggers change after nextChange → PASS totalChanges++
- Test10 cycleWeather → PASS cycled stormy
- Test11 all icons → PASS
- Test12 foggy vision -3 → PASS
- Test13 snowy snow farming 0.5 → PASS
- Test14 stormy heavy_rain intensityMax 1 → PASS
- Integration migration v18→v19 preserves cooking 2 → PASS
- Farming rain waters plot → PASS
- Build 83 modules 448.66kB → PASS
- Manual tsx weather lifecycle PASS

### Running

```bash
npm install
npm run dev
# http://localhost:5173
```

### Controls (Phase 16.4)
- **WASD/Arrows** - Move player, walk to edge road to travel between maps
- **TAB** - Minimap, **F** farming overlay, **Shift+F** fog, **Shift+M** full map, **Shift+G** animals overlay, **Shift+C** crafting, **Shift+K** cooking, **Shift+W** weather overlay (new), **Ctrl+Shift+W** cycle weather
- **E / Enter** - Interact: NPC/building highest priority, else animal produce ready collect, else feed, else pet, else farming till/plant/water/harvest/clear. Prioritizes closer animal vs farm plot, produce ready wins
- **R** - Water nearby farm plot, rain auto-waters growing plots when rainy/stormy
- **I** - Inventory 41 items, WASD/Arrows navigate, Shift+S sort, C filter, M merge, Shift+O random items (includes cooked foods)
- **Crafting UI (Shift+C)**: W/S navigate, C filter category (ALL→TOOL→FOOD→MATERIAL→FEED→POTION→MISC), Shift+C toggle craftable only, Enter craft, ESC close, quick hint 60px y
- **Cooking UI (Shift+K)**: W/S navigate, C filter category (ALL→BREAKFAST→MEAL→SOUP→DESSERT→DAIRY→MISC), Ctrl+Shift+K toggle cookable only, Enter cook, ESC or Shift+K close, quick hint 85px y
- **Weather Overlay (Shift+W)**: Toggle tint + particles, badge top-left shows icon name intensity%, auto-waters crops in rain, transitions every 0.2-3 days game time, effects farming x0.5-1.5, animal happiness -5 to +2, vision -3 to +1, stamina 1.0-1.3, speed 0.85-1.0
  - Weathers: sunny ☀️ bright, cloudy ☁️ overcast, rainy 🌧️ gentle rain waters crops farming x1.5, stormy ⛈️ heavy rain farming x1.2 happy -5 vision -2, foggy 🌫️ thick fog vision -3 farming x0.8, snowy ❄️ snowfall farming x0.5 happy -3 speed 0.85
  - Cycle: Ctrl+Shift+W cycles sunny→cloudy→rainy→stormy→foggy→snowy→sunny
- **Shift+P** test farm plots 6, **Shift+U** test animals 4, **Ctrl+Shift+K** toggle obstacle, **Ctrl+Shift+C** debug crafting
- **P** print all including weather, **T** run all tests 7-16.4
- **Ctrl+S/L** quick save/load Slot0, **Ctrl+Shift+S/L** Save/Load UI, **Ctrl+N** new game, Auto-save 60s + map transition
- **Shift+R** reveal all, **Ctrl+R** reset exploration, **Shift+[ / ]** vision, **F1/F3/F4** jump maps
- **Space** pause, =/+ faster, -/_ slower, ] +1h, [ -1h, \ next phase, Shift+E clock
- **Q** schedule debug, ; , . needs/inventory/jobs, F10 boost 100%, F11 drain
- **C** center, **V** village, **Z** zoom, **X** smoothing, **K** collision, **N** paths, **M** nav grid, **J/L/U/Shift+I** building doors/labels/ownership/fronts, **G** grid, **B** coords, ` / F2 debug, **H** help, **R** reset

### Architecture

```
src/
├── weather/
│   ├── Weather.ts - WeatherType, WeatherDefinition, WeatherSaveData
│   ├── WeatherDatabase.ts - 6 weathers SUNNY/CLOUDY/RAINY/STORMY/FOGGY/SNOWY, validation
│   ├── WeatherSystem.ts - transitions, intensity, isRaining, save/load, cycle
│   ├── WeatherRenderer.ts - tint + particles rain/heavy_rain/snow/fog, badge
│   └── test_weather.ts - manual tsx 14 checks
├── cooking/ - 10 recipes, Shift+K UI, save v18
├── crafting/ - 12 recipes, Shift+C UI, save v17
├── animals/ - 4 animals, feed/pet/produce/wander, 5 default spawn, minimap dots
├── farming/ - 4 crops, till/plant/water/harvest/wither, auto-watered by rain
├── inventory/ - 41 items, I UI fixed (sync renderer flags)
├── save/ - SAVE_VERSION 19, weather current/intensity/nextChange/totalChanges, migrateToV19
├── exploration/ - fog, vision 8, minimap with animals
├── world/ - 3 maps, transitions
├── core/Game.ts - + weatherSystem/renderer, Shift+W overlay, Ctrl+Shift+W cycle, save/load weather, auto-water farming when rainy, P prints weather, T runs 7-16.4
└── main.ts
```

### Previous Phases
- Phase16.3: Cooking 10 recipes, 8 new cooked foods, inventory 41, save v18, Shift+K UI, build 424.20kB, inventory fix sync renderer flags
- Phase16.2: Crafting 12 recipes, ingredients consumption, persistence, Shift+C UI, save v17, build 391.79kB
- Phase16.1: Animals 4 types, feed/pet/produce/wander, hunger/happiness decay, 5 default spawn village, always visible after fog, minimap colored dots
- Phase15: Farming 4 crops, till/plant/water/harvest/wither, persistence, F overlay
- Phase14: Inventory 41 items, stackable/non-stackable, slots, sorting, save/load, I UI (fixed)
- Phase13: Save/Load 5 slots, validation, migration, auto-save, new game
- Phase12: Exploration fog, minimap, 3 maps transitions
- Phase11: Interaction & Dialogue
- Phase10: Life needs inventory jobs
- Phase9: Time & Schedules
- Phase8: Buildings homes
- Phase7: Pathfinding A*
- Phase6: NPC foundation
- Phase5: Camera
- Phase4: Collision
- Phase3: Player
- Phase2: World map
- Phase1: Foundation

## Principles
Small changes, test before expanding, no unnecessary complexity, modular, data-driven, debug everything, placeholder graphics first
