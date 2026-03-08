// ─── Marathon Training Checker ───────────────────────────────────────────────
// Strava OAuth + training plan progress tracker

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_SCOPE = 'read,activity:read_all';
const REDIRECT_URI = window.location.origin + window.location.pathname;

// ─── Training Plan Data (distances in km) ────────────────────────────────────
// Each week: [Mon, Tue, Wed, Thu, Fri, Sat(long), Sun]
const TRAINING_PLANS = {
  'hal-higdon-novice-1': {
    name: 'Hal Higdon Novice 1',
    weeks: 18,
    schedule: [
      [4.8, 4.8, 4.8, 0, 0, 9.7, 0],
      [4.8, 4.8, 4.8, 0, 0, 11.3, 0],
      [4.8, 4.8, 4.8, 0, 0, 12.9, 0],
      [4.8, 4.8, 4.8, 0, 0, 9.7, 0],   // recovery
      [6.4, 6.4, 6.4, 0, 0, 16.1, 0],
      [6.4, 6.4, 6.4, 0, 0, 17.7, 0],
      [6.4, 6.4, 6.4, 0, 0, 19.3, 0],
      [6.4, 6.4, 6.4, 0, 0, 14.5, 0],  // recovery
      [8.0, 8.0, 8.0, 0, 0, 22.5, 0],
      [8.0, 8.0, 8.0, 0, 0, 16.1, 0],  // recovery
      [8.0, 8.0, 8.0, 0, 0, 25.7, 0],
      [8.0, 8.0, 8.0, 0, 0, 27.4, 0],
      [9.7, 9.7, 9.7, 0, 0, 29.0, 0],
      [9.7, 9.7, 9.7, 0, 0, 19.3, 0],  // recovery
      [9.7, 9.7, 9.7, 0, 0, 32.2, 0],
      [9.7, 9.7, 9.7, 0, 0, 32.2, 0],  // peak
      [6.4, 6.4, 6.4, 0, 0, 19.3, 0],  // taper
      [3.2, 3.2, 3.2, 0, 0, 6.4, 0],   // race week
    ]
  },
  'hal-higdon-novice-2': {
    name: 'Hal Higdon Novice 2',
    weeks: 18,
    schedule: [
      [4.8, 6.4, 4.8, 6.4, 0, 12.9, 0],
      [4.8, 6.4, 4.8, 6.4, 0, 14.5, 0],
      [4.8, 6.4, 4.8, 6.4, 0, 16.1, 0],
      [4.8, 6.4, 4.8, 6.4, 0, 12.9, 0],
      [6.4, 8.0, 6.4, 8.0, 0, 17.7, 0],
      [6.4, 8.0, 6.4, 8.0, 0, 19.3, 0],
      [6.4, 8.0, 6.4, 8.0, 0, 20.9, 0],
      [6.4, 8.0, 6.4, 8.0, 0, 16.1, 0],
      [8.0, 9.7, 8.0, 9.7, 0, 24.1, 0],
      [8.0, 9.7, 8.0, 9.7, 0, 17.7, 0],
      [8.0, 9.7, 8.0, 9.7, 0, 27.4, 0],
      [8.0, 9.7, 8.0, 9.7, 0, 29.0, 0],
      [9.7, 11.3, 9.7, 11.3, 0, 30.6, 0],
      [9.7, 11.3, 9.7, 11.3, 0, 20.9, 0],
      [9.7, 11.3, 9.7, 11.3, 0, 32.2, 0],
      [9.7, 11.3, 9.7, 11.3, 0, 32.2, 0],
      [6.4, 9.7, 6.4, 9.7, 0, 20.9, 0],
      [4.8, 6.4, 4.8, 0, 0, 8.0, 0],
    ]
  },
  'hal-higdon-intermediate-1': {
    name: 'Hal Higdon Intermediate 1',
    weeks: 18,
    schedule: [
      [6.4, 8.0, 6.4, 9.7, 0, 16.1, 0],
      [6.4, 8.0, 6.4, 9.7, 0, 19.3, 0],
      [6.4, 8.0, 6.4, 9.7, 0, 22.5, 0],
      [6.4, 8.0, 6.4, 9.7, 0, 16.1, 0],
      [8.0, 9.7, 8.0, 11.3, 0, 24.1, 0],
      [8.0, 9.7, 8.0, 11.3, 0, 25.7, 0],
      [8.0, 9.7, 8.0, 11.3, 0, 27.4, 0],
      [8.0, 9.7, 8.0, 11.3, 0, 19.3, 0],
      [9.7, 11.3, 9.7, 12.9, 0, 29.0, 0],
      [9.7, 11.3, 9.7, 12.9, 0, 22.5, 0],
      [9.7, 11.3, 9.7, 12.9, 0, 30.6, 0],
      [9.7, 11.3, 9.7, 12.9, 0, 32.2, 0],
      [11.3, 12.9, 11.3, 14.5, 0, 33.8, 0],
      [11.3, 12.9, 11.3, 14.5, 0, 24.1, 0],
      [11.3, 12.9, 11.3, 14.5, 0, 35.4, 0],
      [11.3, 12.9, 11.3, 14.5, 0, 35.4, 0],
      [8.0, 9.7, 8.0, 11.3, 0, 22.5, 0],
      [4.8, 6.4, 4.8, 0, 0, 9.7, 0],
    ]
  },
  'pfitz-12-55': {
    name: 'Pfitzinger 12/55',
    weeks: 12,
    schedule: [
      [8.0, 12.9, 8.0, 9.7, 0, 27.4, 0],
      [8.0, 14.5, 8.0, 9.7, 0, 29.0, 0],
      [8.0, 16.1, 8.0, 11.3, 0, 30.6, 0],
      [8.0, 12.9, 6.4, 9.7, 0, 22.5, 0],  // recovery
      [8.0, 17.7, 8.0, 11.3, 0, 32.2, 0],
      [8.0, 19.3, 8.0, 12.9, 0, 33.8, 0],
      [8.0, 20.9, 9.7, 12.9, 0, 35.4, 0],
      [8.0, 14.5, 6.4, 9.7, 0, 25.7, 0],  // recovery
      [9.7, 22.5, 9.7, 14.5, 0, 38.6, 0],
      [9.7, 24.1, 9.7, 14.5, 0, 32.2, 0],
      [8.0, 16.1, 8.0, 11.3, 0, 22.5, 0], // taper
      [4.8, 9.7, 4.8, 0, 0, 8.0, 0],      // race week
    ]
  }
};

// ─── State ───────────────────────────────────────────────────────────────────
let state = loadState();

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');

  if (code) {
    // OAuth callback
    window.history.replaceState({}, document.title, window.location.pathname);
    showView('callback');
    handleOAuthCallback(code);
  } else if (error) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showToast('Strava authorisation was denied. Please try again.', 'error');
    showView('setup');
    prefillSetupForm();
  } else if (state.accessToken && state.raceDate) {
    showDashboard();
  } else {
    showView('setup');
    prefillSetupForm();
  }
});

// ─── Strava OAuth ─────────────────────────────────────────────────────────────
function connectStrava() {
  const clientId = document.getElementById('client-id').value.trim();
  const clientSecret = document.getElementById('client-secret').value.trim();
  const raceDate = document.getElementById('race-date').value;
  const plan = document.getElementById('training-plan').value;
  const units = document.getElementById('units').value;

  if (!raceDate) { showToast('Please set your race date first.', 'error'); return; }
  if (!clientId) { showToast('Please enter your Strava Client ID.', 'error'); return; }
  if (!clientSecret) { showToast('Please enter your Strava Client Secret.', 'error'); return; }

  // Save setup state before redirecting
  saveState({ ...state, clientId, clientSecret, raceDate, plan, units });

  const authUrl = new URL(STRAVA_AUTH_URL);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('approval_prompt', 'auto');
  authUrl.searchParams.set('scope', STRAVA_SCOPE);

  window.location.href = authUrl.toString();
}

async function handleOAuthCallback(code) {
  document.getElementById('callback-status').textContent = 'Exchanging authorisation code…';

  if (!state.clientId || !state.clientSecret) {
    showToast('Setup data missing. Please start again.', 'error');
    showView('setup');
    return;
  }

  try {
    const res = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: state.clientId,
        client_secret: state.clientSecret,
        code,
        grant_type: 'authorization_code'
      })
    });

    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
    const data = await res.json();

    saveState({
      ...state,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: data.expires_at,
      athleteName: data.athlete?.firstname || 'Athlete'
    });

    document.getElementById('callback-status').textContent = `Welcome, ${state.athleteName}! Loading your runs…`;
    await showDashboard();
  } catch (err) {
    console.error(err);
    showToast(`Failed to connect Strava: ${err.message}`, 'error');
    showView('setup');
    prefillSetupForm();
  }
}

async function ensureValidToken() {
  if (!state.accessToken) throw new Error('Not connected to Strava');

  const now = Math.floor(Date.now() / 1000);
  if (state.tokenExpiry && now < state.tokenExpiry - 300) return; // still valid

  // Refresh token
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: state.clientId,
      client_secret: state.clientSecret,
      refresh_token: state.refreshToken,
      grant_type: 'refresh_token'
    })
  });

  if (!res.ok) throw new Error('Token refresh failed. Please reconnect Strava.');
  const data = await res.json();

  saveState({
    ...state,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry: data.expires_at
  });
}

// ─── Strava API ───────────────────────────────────────────────────────────────
async function fetchActivities(afterTimestamp, page = 1) {
  await ensureValidToken();

  const url = new URL(`${STRAVA_API_BASE}/athlete/activities`);
  url.searchParams.set('after', afterTimestamp);
  url.searchParams.set('per_page', '100');
  url.searchParams.set('page', page);

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${state.accessToken}` }
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Strava token expired. Please reconnect.');
    throw new Error(`Strava API error: ${res.status}`);
  }

  return res.json();
}

async function fetchAllRuns() {
  const plan = TRAINING_PLANS[state.plan];
  const raceDate = new Date(state.raceDate);

  // Training start = race date - plan weeks - 1 day buffer
  const trainingStart = new Date(raceDate);
  trainingStart.setDate(trainingStart.getDate() - (plan.weeks * 7) - 1);
  const afterTs = Math.floor(trainingStart.getTime() / 1000);

  let allActivities = [];
  let page = 1;

  while (true) {
    const batch = await fetchActivities(afterTs, page);
    if (!batch.length) break;
    allActivities = allActivities.concat(batch);
    if (batch.length < 100) break;
    page++;
  }

  // Filter to runs only
  return allActivities.filter(a => a.type === 'Run' || a.sport_type === 'Run');
}

// ─── Training Logic ───────────────────────────────────────────────────────────
function getTrainingWeekDates(weekNumber, raceDate, totalWeeks) {
  // Week 1 starts (totalWeeks) weeks before race
  const race = new Date(raceDate);
  const weekStart = new Date(race);
  weekStart.setDate(race.getDate() - ((totalWeeks - weekNumber + 1) * 7));
  // Align to Monday
  const day = weekStart.getDay(); // 0=Sun
  const diff = (day === 0) ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diff);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return { weekStart, weekEnd };
}

function getCurrentWeek(raceDate, totalWeeks) {
  const today = new Date();
  const race = new Date(raceDate);

  for (let w = 1; w <= totalWeeks; w++) {
    const { weekStart, weekEnd } = getTrainingWeekDates(w, raceDate, totalWeeks);
    if (today >= weekStart && today <= weekEnd) return w;
  }

  if (today > race) return totalWeeks + 1; // post-race
  return 0; // pre-training
}

function getWeeklyTotals(runs, raceDate, totalWeeks) {
  const weeklyData = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const { weekStart, weekEnd } = getTrainingWeekDates(w, raceDate, totalWeeks);
    const weekRuns = runs.filter(r => {
      const d = new Date(r.start_date_local);
      return d >= weekStart && d <= weekEnd;
    });

    const totalMeters = weekRuns.reduce((sum, r) => sum + (r.distance || 0), 0);
    const longestMeters = weekRuns.reduce((max, r) => Math.max(max, r.distance || 0), 0);

    weeklyData.push({
      week: w,
      weekStart,
      weekEnd,
      runs: weekRuns,
      totalKm: totalMeters / 1000,
      longestKm: longestMeters / 1000
    });
  }

  return weeklyData;
}

function getPlanWeekTotal(plan, weekIndex) {
  return plan.schedule[weekIndex].reduce((a, b) => a + b, 0);
}

function getPlanLongRun(plan, weekIndex) {
  return Math.max(...plan.schedule[weekIndex]);
}

function kmToDisplay(km, units) {
  if (units === 'miles') return (km * 0.621371).toFixed(1);
  return km.toFixed(1);
}

function unitLabel(units) {
  return units === 'miles' ? 'mi' : 'km';
}

function formatPace(movingTimeSec, distanceMeters, units) {
  if (!distanceMeters || distanceMeters < 10) return '–';
  const distKm = distanceMeters / 1000;
  const distUnit = units === 'miles' ? distKm * 0.621371 : distKm;
  const paceSecPerUnit = movingTimeSec / distUnit;
  const mins = Math.floor(paceSecPerUnit / 60);
  const secs = Math.round(paceSecPerUnit % 60);
  return `${mins}:${String(secs).padStart(2, '0')} /${unitLabel(units)}`;
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getStatusInfo(actual, planned) {
  if (planned === 0) return { label: '–', cls: 'neutral' };
  const pct = actual / planned;
  if (pct >= 0.95) return { label: 'On Track', cls: 'good' };
  if (pct >= 0.75) return { label: 'Slightly Behind', cls: 'warn' };
  return { label: 'Behind', cls: 'bad' };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function showDashboard() {
  showView('dashboard');

  const plan = TRAINING_PLANS[state.plan];
  const units = state.units || 'km';
  const ul = unitLabel(units);
  const raceDate = state.raceDate;
  const currentWeek = getCurrentWeek(raceDate, plan.weeks);

  // Update header
  document.getElementById('dash-subtitle').textContent =
    `${plan.name} · ${formatDate(new Date(raceDate))} race`;

  // Stat: week
  document.getElementById('stat-week').textContent =
    currentWeek >= 1 && currentWeek <= plan.weeks ? currentWeek : (currentWeek === 0 ? 'Pre' : 'Done');
  document.getElementById('stat-week-sub').textContent = `of ${plan.weeks} weeks`;

  // Stat: days
  const today = new Date();
  const race = new Date(raceDate);
  const daysLeft = Math.ceil((race - today) / (1000 * 60 * 60 * 24));
  document.getElementById('stat-days').textContent = daysLeft > 0 ? daysLeft : '🎉';
  document.getElementById('stat-race-name').textContent = daysLeft > 0 ? 'days to go' : 'Race day!';

  try {
    const runs = await fetchAllRuns();
    const weeklyData = getWeeklyTotals(runs, raceDate, plan.weeks);

    // Current week data
    const weekIdx = Math.max(0, Math.min(currentWeek - 1, plan.weeks - 1));
    const thisWeekData = weeklyData[weekIdx] || { totalKm: 0, longestKm: 0, runs: [] };
    const plannedTotal = getPlanWeekTotal(plan, weekIdx);
    const plannedLong = getPlanLongRun(plan, weekIdx);

    // Stat: this week
    document.getElementById('stat-this-week').textContent =
      `${kmToDisplay(thisWeekData.totalKm, units)} ${ul}`;
    document.getElementById('stat-this-week-target').textContent =
      `of ${kmToDisplay(plannedTotal, units)} ${ul} planned`;

    // Stat: long run
    document.getElementById('stat-long-run').textContent =
      `${kmToDisplay(thisWeekData.longestKm, units)} ${ul}`;
    document.getElementById('stat-long-run-target').textContent =
      `of ${kmToDisplay(plannedLong, units)} ${ul} planned`;

    // Status banner
    const statusInfo = getStatusInfo(thisWeekData.totalKm, plannedTotal);
    const banner = document.getElementById('status-banner');
    banner.textContent = `Week ${currentWeek}: ${statusInfo.label} · ${kmToDisplay(thisWeekData.totalKm, units)}/${kmToDisplay(plannedTotal, units)} ${ul}`;
    banner.className = `status-banner status-${statusInfo.cls}`;

    // Week range
    if (currentWeek >= 1 && currentWeek <= plan.weeks) {
      const { weekStart, weekEnd } = getTrainingWeekDates(currentWeek, raceDate, plan.weeks);
      document.getElementById('week-range').textContent =
        `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;
    }

    // This week runs
    renderWeekRuns(thisWeekData.runs, units);

    // Progress bar
    const pct = Math.min(100, plannedTotal > 0 ? (thisWeekData.totalKm / plannedTotal) * 100 : 0);
    document.getElementById('progress-fill').style.width = `${pct}%`;
    document.getElementById('progress-actual-label').textContent =
      `${kmToDisplay(thisWeekData.totalKm, units)} ${ul} done`;
    document.getElementById('progress-target-label').textContent =
      `${kmToDisplay(plannedTotal, units)} ${ul} planned`;

    // Weekly chart
    renderWeeklyChart(weeklyData, plan, units, currentWeek);

    // Upcoming weeks
    renderUpcomingWeeks(plan, currentWeek, units);

    // Recent activities
    renderRecentActivities(runs.slice(0, 10), units);

    document.getElementById('activities-count').textContent =
      `${runs.length} total runs this training block`;

  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
    if (err.message.includes('reconnect')) showSettings();
  }
}

function renderWeekRuns(runs, units) {
  const container = document.getElementById('week-runs');
  if (!runs.length) {
    container.innerHTML = '<p class="empty-msg">No runs recorded this week yet.</p>';
    return;
  }

  container.innerHTML = runs.map(r => {
    const distKm = (r.distance || 0) / 1000;
    const pace = formatPace(r.moving_time, r.distance, units);
    return `
      <div class="run-item">
        <div class="run-info">
          <span class="run-name">${r.name || 'Run'}</span>
          <span class="run-date">${formatDate(new Date(r.start_date_local))}</span>
        </div>
        <div class="run-stats">
          <span class="run-dist">${kmToDisplay(distKm, units)} ${unitLabel(units)}</span>
          <span class="run-pace">${pace}</span>
        </div>
      </div>`;
  }).join('');
}

function renderWeeklyChart(weeklyData, plan, units, currentWeek) {
  const container = document.getElementById('weekly-chart');
  const ul = unitLabel(units);

  // Show last 8 weeks up to current
  const start = Math.max(0, currentWeek - 8);
  const end = Math.min(currentWeek, plan.weeks);
  const slice = weeklyData.slice(start, end);

  if (!slice.length) {
    container.innerHTML = '<p class="empty-msg">No data yet.</p>';
    return;
  }

  const maxVal = Math.max(
    ...slice.map(w => w.totalKm),
    ...slice.map((_, i) => getPlanWeekTotal(plan, start + i))
  );

  container.innerHTML = `
    <div class="chart">
      ${slice.map((w, i) => {
        const weekNum = start + i + 1;
        const planned = getPlanWeekTotal(plan, start + i);
        const actualPct = maxVal ? (w.totalKm / maxVal) * 100 : 0;
        const plannedPct = maxVal ? (planned / maxVal) * 100 : 0;
        const isCurrent = weekNum === currentWeek;
        return `
          <div class="chart-col ${isCurrent ? 'chart-col-current' : ''}">
            <div class="chart-bars">
              <div class="bar-planned" style="height:${plannedPct}%" title="Planned: ${kmToDisplay(planned, units)} ${ul}"></div>
              <div class="bar-actual" style="height:${actualPct}%" title="Actual: ${kmToDisplay(w.totalKm, units)} ${ul}"></div>
            </div>
            <div class="chart-label">W${weekNum}</div>
          </div>`;
      }).join('')}
    </div>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-dot dot-planned"></span>Planned</span>
      <span class="legend-item"><span class="legend-dot dot-actual"></span>Actual</span>
    </div>`;
}

function renderUpcomingWeeks(plan, currentWeek, units) {
  const container = document.getElementById('upcoming-weeks');
  const ul = unitLabel(units);
  const upcoming = [];

  for (let w = currentWeek + 1; w <= Math.min(currentWeek + 3, plan.weeks); w++) {
    const wIdx = w - 1;
    upcoming.push({ week: w, total: getPlanWeekTotal(plan, wIdx), long: getPlanLongRun(plan, wIdx) });
  }

  if (!upcoming.length) {
    container.innerHTML = '<p class="empty-msg">No upcoming weeks — taper complete!</p>';
    return;
  }

  container.innerHTML = upcoming.map(u => `
    <div class="upcoming-item">
      <div class="upcoming-week">Week ${u.week}</div>
      <div class="upcoming-stats">
        <span>${kmToDisplay(u.total, units)} ${ul} total</span>
        <span class="sep">·</span>
        <span>${kmToDisplay(u.long, units)} ${ul} long run</span>
      </div>
    </div>`).join('');
}

function renderRecentActivities(runs, units) {
  const container = document.getElementById('recent-activities');
  if (!runs.length) {
    container.innerHTML = '<p class="empty-msg">No runs found in this training block.</p>';
    return;
  }

  container.innerHTML = runs.map(r => {
    const distKm = (r.distance || 0) / 1000;
    const pace = formatPace(r.moving_time, r.distance, units);
    const elev = r.total_elevation_gain ? `↑${Math.round(r.total_elevation_gain)}m` : '';
    return `
      <div class="run-item">
        <div class="run-info">
          <span class="run-name">${r.name || 'Run'}</span>
          <span class="run-date">${formatDate(new Date(r.start_date_local))} ${elev}</span>
        </div>
        <div class="run-stats">
          <span class="run-dist">${kmToDisplay(distKm, units)} ${unitLabel(units)}</span>
          <span class="run-pace">${pace}</span>
        </div>
      </div>`;
  }).join('');
}

async function refreshActivities() {
  showToast('Refreshing…', 'info');
  await showDashboard();
}

// ─── Manual Token ─────────────────────────────────────────────────────────────
function showTokenEntry() {
  document.getElementById('token-entry').classList.remove('hidden');
}

function saveManualToken() {
  const token = document.getElementById('manual-token').value.trim();
  const raceDate = document.getElementById('race-date').value;
  const plan = document.getElementById('training-plan').value;
  const units = document.getElementById('units').value;

  if (!raceDate) { showToast('Please set your race date.', 'error'); return; }
  if (!token) { showToast('Please enter your access token.', 'error'); return; }

  saveState({ ...state, accessToken: token, raceDate, plan, units });
  showDashboard();
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function showSettings() {
  document.getElementById('settings-race-date').value = state.raceDate || '';
  document.getElementById('settings-plan').value = state.plan || 'hal-higdon-novice-1';
  document.getElementById('settings-units').value = state.units || 'km';

  const stravaMsg = document.getElementById('strava-status-msg');
  stravaMsg.textContent = state.accessToken
    ? `Connected${state.athleteName ? ' as ' + state.athleteName : ''}`
    : 'Not connected';
  stravaMsg.className = `strava-status ${state.accessToken ? 'connected' : 'disconnected'}`;

  showView('settings');
}

function saveSettings() {
  const raceDate = document.getElementById('settings-race-date').value;
  const plan = document.getElementById('settings-plan').value;
  const units = document.getElementById('settings-units').value;
  if (!raceDate) { showToast('Race date is required.', 'error'); return; }
  saveState({ ...state, raceDate, plan, units });
  showToast('Settings saved.', 'info');
  showDashboard();
}

function reconnectStrava() {
  showView('setup');
  prefillSetupForm();
}

function disconnectStrava() {
  if (!confirm('Disconnect Strava? Your setup will be kept.')) return;
  saveState({ ...state, accessToken: null, refreshToken: null, tokenExpiry: null, athleteName: null });
  showToast('Strava disconnected.', 'info');
  showView('setup');
  prefillSetupForm();
}

function resetAll() {
  if (!confirm('Delete all saved data?')) return;
  localStorage.clear();
  window.location.reload();
}

function prefillSetupForm() {
  if (state.raceDate) document.getElementById('race-date').value = state.raceDate;
  if (state.plan) document.getElementById('training-plan').value = state.plan;
  if (state.units) document.getElementById('units').value = state.units;
  if (state.clientId) document.getElementById('client-id').value = state.clientId;
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
}

function showDashboardView() { showDashboard(); }

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast-${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 4000);
}

// ─── Persistence ──────────────────────────────────────────────────────────────
function loadState() {
  try {
    return JSON.parse(localStorage.getItem('marathon-checker') || '{}');
  } catch { return {}; }
}

function saveState(newState) {
  state = newState;
  localStorage.setItem('marathon-checker', JSON.stringify(state));
}
