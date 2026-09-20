/**
 * test_weather.ts - Phase 16.4 Weather System tests
 */

import { WeatherDatabase } from './WeatherDatabase';
import { WeatherSystem } from './WeatherSystem';
import { WeatherType } from './Weather';

function runTests() {
  console.log('=== PHASE 16.4 WEATHER TESTS ===');

  const weatherDb = WeatherDatabase.getInstance();
  const weatherSystem = new WeatherSystem(weatherDb);
  weatherSystem.initialize(0);

  const count = weatherDb.getCount();
  console.log(`Test1 WeatherDatabase count: ${count} expected 6 -> ${count===6 ? 'PASS' : 'FAIL'}`);
  console.log(`  ${weatherDb.getDebugString()}`);

  const validation = weatherDb.validate();
  console.log(`Test2 validation: valid=${validation.valid} errors=${validation.errors.length} -> ${validation.valid ? 'PASS' : 'FAIL'}`);
  if (validation.errors.length) console.log(`  Errors: ${validation.errors.join(', ')}`);

  const sunny = weatherDb.getWeather('sunny');
  console.log(`Test3 get sunny: ${sunny?.name} icon=${sunny?.icon} -> ${sunny?.id==='sunny' ? 'PASS' : 'FAIL'}`);

  const rainy = weatherDb.getWeather('rainy');
  console.log(`Test4 rainy effects farming x${rainy?.effects.farmingGrowthMultiplier} expected 1.5 -> ${rainy?.effects.farmingGrowthMultiplier===1.5 ? 'PASS' : 'FAIL'}`);
  console.log(`  rainy visual ${rainy?.visual.particleType} expected rain -> ${rainy?.visual.particleType==='rain' ? 'PASS' : 'FAIL'}`);

  const current = weatherSystem.getCurrentWeather();
  console.log(`Test5 initial weather: ${current?.id} intensity=${weatherSystem.getIntensity().toFixed(2)} -> ${current ? 'PASS' : 'FAIL'}`);

  const isRainingInitially = weatherSystem.isRaining();
  console.log(`Test6 isRaining initially (sunny): ${!isRainingInitially ? 'PASS' : 'FAIL'} got ${isRainingInitially}`);

  weatherSystem.setWeather('rainy', 0.7, 0);
  console.log(`Test7 setWeather rainy: current=${weatherSystem.getCurrentWeatherId()} expected rainy -> ${weatherSystem.getCurrentWeatherId()==='rainy' ? 'PASS' : 'FAIL'}`);
  console.log(`  isRaining now: ${weatherSystem.isRaining() ? 'PASS' : 'FAIL'}`);
  console.log(`  intensity ${weatherSystem.getIntensity()} expected 0.7 -> ${weatherSystem.getIntensity()===0.7 ? 'PASS' : 'FAIL'}`);

  const saveData = weatherSystem.getSaveData();
  console.log(`Test8 saveData: current=${saveData.current} intensity=${saveData.intensity} changes=${saveData.totalChanges} -> ${saveData.current==='rainy' ? 'PASS' : 'FAIL'}`);

  const newSystem = new WeatherSystem(weatherDb);
  newSystem.loadSaveData(saveData);
  console.log(`Test8b load: current=${newSystem.getCurrentWeatherId()} expected rainy -> ${newSystem.getCurrentWeatherId()==='rainy' ? 'PASS' : 'FAIL'}`);
  console.log(`  intensity ${newSystem.getIntensity()} expected 0.7 -> ${newSystem.getIntensity()===0.7 ? 'PASS' : 'FAIL'}`);

  newSystem.setWeather('sunny', 0, 0);
  const beforeChange = newSystem.getTotalChanges();
  // Simulate time passing beyond nextChange
  const future = newSystem.getNextChange() + 1;
  const result = newSystem.update(future, 1);
  console.log(`Test9 update triggers change after nextChange: changed=${result.changed} expected true -> ${result.changed ? 'PASS' : 'FAIL'}`);
  console.log(`  totalChanges before ${beforeChange} after ${newSystem.getTotalChanges()} expected ${beforeChange+1} -> ${newSystem.getTotalChanges()===beforeChange+1 ? 'PASS' : 'FAIL'}`);

  const cycled = newSystem.cycleWeather(future);
  console.log(`Test10 cycleWeather: new id=${cycled} not sunny? ${cycled!=='sunny' ? 'PASS (cycled)' : 'FAIL'} current=${newSystem.getCurrentWeatherId()}`);

  // Test all weathers have icons
  let allHaveIcons = true;
  for (const w of weatherDb.getAllWeathers()) {
    if (!w.icon) allHaveIcons = false;
  }
  console.log(`Test11 all weathers have icons: ${allHaveIcons ? 'PASS' : 'FAIL'}`);

  // Test foggy reduces vision
  const foggy = weatherDb.getWeather('foggy');
  console.log(`Test12 foggy vision modifier ${foggy?.effects.visionRadiusModifier} expected -3 -> ${foggy?.effects.visionRadiusModifier===-3 ? 'PASS' : 'FAIL'}`);

  // Test snowy
  const snowy = weatherDb.getWeather('snowy');
  console.log(`Test13 snowy particle ${snowy?.visual.particleType} expected snow -> ${snowy?.visual.particleType==='snow' ? 'PASS' : 'FAIL'}`);
  console.log(`  snowy farming x${snowy?.effects.farmingGrowthMultiplier} expected 0.5 -> ${snowy?.effects.farmingGrowthMultiplier===0.5 ? 'PASS' : 'FAIL'}`);

  // Test stormy
  const stormy = weatherDb.getWeather('stormy');
  console.log(`Test14 stormy heavy_rain? ${stormy?.visual.particleType==='heavy_rain' ? 'PASS' : 'FAIL'} intensity max ${stormy?.intensityMax} expected 1 -> ${stormy?.intensityMax===1 ? 'PASS' : 'FAIL'}`);

  console.log('=== END PHASE 16.4 TESTS ===');
  console.log(`[Weather] ${weatherSystem.getDebugString()}`);
}

runTests();
