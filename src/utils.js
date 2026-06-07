// Wind adjustment formula (World Athletics approved)
// Adjusted time = time - (wind_correction)
// Simplified Linthorne model
export function windAdjustedTime(time, wind, event) {
  if (!wind || isNaN(wind)) return null;
  const w = parseFloat(wind);
  const t = parseFloat(time);
  
  let correction = 0;
  if (event === '100m') {
    // Linthorne (1994): ~0.10s per m/s at 10m/s sprint speed
    correction = w * 0.10;
  } else if (event === '200m') {
    correction = w * 0.07;
  } else {
    return null;
  }
  
  return Math.max(0, t - correction).toFixed(2);
}

// Predict 400m from 100m and 200m PBs
export function predict400m(pb100, pb200) {
  if (!pb100 || !pb200) return null;
  // Empirical formula: 400m ≈ 200m * 2.05 (adjusted for endurance)
  // More accurate: use ratio method
  const t100 = parseFloat(pb100);
  const t200 = parseFloat(pb200);
  
  // Method: 400m ≈ (200m × 2) + fatigue factor
  // Fatigue factor typically 2.5–4.5s depending on athlete
  const basePrediction = t200 * 2 + 3.5;
  
  // Adjust based on 200/100 ratio (higher ratio = worse 400m endurance)
  const ratio = t200 / (t100 * 2);
  const adjustedFatigue = 3.5 + (ratio - 1.03) * 20;
  
  return (t200 * 2 + Math.max(2.5, Math.min(5.5, adjustedFatigue))).toFixed(2);
}

// Get PB for each event from races array
export function getPBs(races) {
  const pbs = { '100m': null, '200m': null, '400m': null, 'relay': null };
  
  races.forEach(race => {
    const event = race.event;
    if (!pbs[event] || parseFloat(race.time) < parseFloat(pbs[event].time)) {
      pbs[event] = race;
    }
  });
  
  return pbs;
}

// Format time nicely
export function formatTime(t) {
  if (!t) return '—';
  const num = parseFloat(t);
  if (isNaN(num)) return t;
  return num.toFixed(2);
}

// Get wind legal status
export function windStatus(wind, event) {
  if (!wind || wind === '') return 'none';
  const w = parseFloat(wind);
  if (event === 'relay') return 'none';
  return w <= 2.0 ? 'legal' : 'illegal';
}

// Estimate splits from total time + wind
// For 100m: estimates 0-60m and 60-100m splits
// For 200m: estimates 0-100m and 100-200m splits
// Based on empirical ratios from sprint biomechanics research,
// adjusted slightly for wind (wind affects the flying sections more than drive phase)
export function estimateSplits(time, wind, event) {
  const t = parseFloat(time);
  const w = parseFloat(wind) || 0;
  if (isNaN(t)) return { split1: '', split2: '' };

  if (event === '100m') {
    // 0-60m is roughly 61.5% of total time at elite level
    // wind helps the 60-100m section more (higher velocity, more effect)
    // base ratio: 0.615 for 0-60m, wind adjustment reduces this slightly as tailwind helps back end more
    const windAdj = w * 0.003; // small adjustment per m/s
    const ratio60 = Math.min(0.635, Math.max(0.600, 0.615 - windAdj));
    const split1 = (t * ratio60).toFixed(2);
    const split2 = (t - parseFloat(split1)).toFixed(2);
    return { split1, split2 };
  }

  if (event === '200m') {
    // First 100m faster (fresh legs + acceleration), second 100m slower (fatigue)
    // First 100m is roughly 48-49% of total time
    const windAdj = w * 0.002;
    const ratio100 = Math.min(0.490, Math.max(0.470, 0.482 - windAdj));
    const split1 = (t * ratio100).toFixed(2);
    const split2 = (t - parseFloat(split1)).toFixed(2);
    return { split1, split2 };
  }

  return { split1: '', split2: '' };
}

// Generate a unique ID
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Sort races by date descending
export function sortByDate(races) {
  return [...races].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Get races for a specific event sorted by time
export function getRacesByEvent(races, event) {
  return races
    .filter(r => r.event === event)
    .sort((a, b) => parseFloat(a.time) - parseFloat(b.time));
}

// Calculate improvement from first to latest race for an event
export function calcImprovement(races, event) {
  const eventRaces = races
    .filter(r => r.event === event)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (eventRaces.length < 2) return null;
  const first = parseFloat(eventRaces[0].time);
  const last = parseFloat(eventRaces[eventRaces.length - 1].time);
  return (first - last).toFixed(2);
}
