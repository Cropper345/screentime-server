const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let appData = {};

app.get('/api/screentime/toggle/:appname', (req, res) => {
  const appname = req.params.appname;
  const now = new Date();
  
  if (!appData[appname]) {
    appData[appname] = { status: 'closed', sessions: [] };
  }
  
  const info = appData[appname];
  
  if (info.status === 'closed') {
    info.status = 'open';
    info.sessions.push({ open: now, close: null });
  } else {
    info.status = 'closed';
    const last = info.sessions[info.sessions.length - 1];
    if (last) last.close = now;
  }
  
  const yesterday = new Date(now - 24 * 60 * 60 * 1000);
  for (const key in appData) {
    appData[key].sessions = appData[key].sessions.filter(s => s.open > yesterday);
  }
  
  res.json({ success: true, app: appname, status: info.status });
});

app.get('/api/screentime/report', (req, res) => {
  const report = {};
  const now = new Date();
  
  for (const appname in appData) {
    const info = appData[appname];
    let totalMinutes = 0;
    let sessionCount = 0;
    
    for (const session of info.sessions) {
      const closeTime = session.close || now;
      const minutes = (closeTime - session.open) / 1000 / 60;
      if (minutes > 0 && minutes < 300) {
        totalMinutes += minutes;
        sessionCount++;
      }
    }
    
    report[appname] = {
      status: info.status,
      totalMinutes: Math.round(totalMinutes),
      sessionCount
    };
  }
  
  res.json(report);
});

module.exports = app;
