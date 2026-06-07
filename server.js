const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const JSONBIN_KEY = process.env.JSONBIN_KEY;
const JSONBIN_BIN = process.env.JSONBIN_BIN;

const DEFAULT_DATA = {"races":[{"date":"2025-10-11","event":"200m","time":"24.98","wind":"4.7","competition":"AVSL","track":"Williamstown","surface":"Synthetic","placement":"5th","shoe":"Nike Maxflys","split1":"11.81","split2":"13.17","notes":"First AVSL race ever.\n\nAVSL round 1","_splitsAuto":true,"_splitsManual":false,"id":"mq35mrruwmb1pz978us"},{"date":"2025-10-18","event":"100m","time":"12.15","wind":"0.5","competition":"AVSL","track":"Tom Kelly","surface":"Synthetic","placement":"Unknown","shoe":"Nike MaxFlys","split1":"7.45","split2":"4.70","notes":"Round 2 AVSL","_splitsAuto":true,"id":"mq35sveue4l6uzddqvr"},{"date":"2025-10-25","event":"100m","time":"12.34","wind":"Unknown","competition":"All Schools","track":"Lakeside","surface":"Synthetic","placement":"5th","shoe":"Nike Maxflys","split1":"7.59","split2":"4.75","notes":"broke my maxflys before the race","_splitsAuto":true,"id":"mq35u5nchr69hw55xd6"},{"date":"2025-11-15","event":"200m","time":"24.54","wind":"0.5","competition":"AVSl","track":"Tom Kelly","surface":"Synthetic","placement":"3rd","shoe":"Nike Maxflys","split1":"11.80","split2":"12.74","notes":"AVSL Round 4\n","_splitsAuto":true,"id":"mq35w1h6nsr6hdyk9"},{"date":"2025-11-22","event":"100m","time":"12.05","wind":"0.0","competition":"AVSL","track":"Keilor Park","surface":"Synthetic","placement":"2nd","shoe":"Nike Maxflys","split1":"7.41","split2":"4.64","notes":"AVSL Round 5","_splitsAuto":true,"id":"mq367wdzg5jp3wzhowt"},{"date":"2025-12-13","event":"relay","time":"48.47","wind":"Unknown","competition":"Relay Champs","track":"Lakeside","surface":"Synthetic","placement":"4th","shoe":"Nike Maxflys","split1":"","split2":"","notes":"This was with Essendon Athletics","id":"mq36dn48b6fm8wfhf36"},{"date":"2026-02-21","event":"100m","time":"12.22","wind":"1.2","competition":"AVSL","track":"Tom Kelly","surface":"Synthetic","placement":"4th","shoe":"Puma Evospeed","split1":"7.47","split2":"4.75","notes":"AVSL Round 9","_splitsAuto":true,"id":"mq36g6yy72dr1s8ofz"},{"date":"2026-06-07","event":"200m","time":"25.02","wind":"-0.3","competition":"AVSL","track":"Aberfeldie","surface":"Synthetic","placement":"4th","shoe":"Puma Evospeed","split1":"12.07","split2":"12.95","notes":"AVSL Round 10 \nCalf injure major after this","_splitsAuto":true,"_splitsManual":false,"id":"mq36hxpy9sukm427jbd"},{"date":"2025-08-09","event":"100m","time":"12.30","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Hyperspeed 7","split1":"7.56","split2":"4.74","notes":"AGSV Round 1 ","_splitsAuto":true,"id":"mq36o48l8faje349x3u"},{"date":"2025-08-16","event":"100m","time":"12.221","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Maxflys","split1":"7.52","split2":"4.70","notes":"AGSV Round 2","_splitsAuto":true,"id":"mq36pnq7rlw8r12anun"},{"date":"2025-08-23","event":"100m","time":"12.30","wind":"Unknown","competition":"AGSV","track":"Tom Kelly","surface":"Synthetic","placement":"1st","shoe":"Nike Maxflys","split1":"7.56","split2":"4.74","notes":"AGSV Round 3","_splitsAuto":true,"id":"mq36ro9h9ln4zdja506"},{"date":"2025-09-06","event":"100m","time":"11.90","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Nike Maxflys","split1":"7.32","split2":"4.58","notes":"AGSV Round 5","_splitsAuto":true,"id":"mq36t05toy8b0acwnd"},{"date":"2025-09-10","event":"100m","time":"12.27","wind":"Unknown","competition":"AGSV Championship","track":"Lakeside","surface":"Synthetic","placement":"4th","shoe":"Nike Maxflys","split1":"7.55","split2":"4.72","notes":"Right after camp, was very tired and worn out.","_splitsAuto":true,"id":"mq36un6zg62wcl8ucdc"},{"date":"2025-08-16","event":"200m","time":"25.50","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Hyperspeed 7","split1":"12.29","split2":"13.21","notes":"Round 2","_splitsAuto":true,"id":"mq36vrnnsenpnn4g73b"},{"date":"2025-08-23","event":"200m","time":"25.19","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Nike Maxflys","split1":"12.14","split2":"13.05","notes":"AGSV Round 3","_splitsAuto":true,"_splitsManual":false,"id":"mq36wv0j4yapcds0v3s"},{"date":"2025-08-16","event":"relay","time":"48.80","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Hyperspeed 7","split1":"","split2":"","notes":"AGSV team","id":"mq36yxzfpl35ga6hdk"},{"date":"2025-08-23","event":"relay","time":"48.81","wind":"Unknown","competition":"AGSV","track":"Tom Kelly","surface":"Synthetic","placement":"3rd","shoe":"Nike Maxflys","split1":"30.02","split2":"18.79","notes":"AGSV team","_splitsAuto":true,"id":"mq3702csuamdudzzgnn"},{"date":"2025-08-30","event":"relay","time":"48.61","wind":"Unknown","competition":"AGSV","track":"Bill Steward","surface":"Synthetic","placement":"1st","shoe":"Nike Maxflys","split1":"","split2":"","notes":"AGSV team","id":"mq3717fg8xoeh7y0h46"},{"date":"2025-09-06","event":"relay","time":"48.18","wind":"Unknown","competition":"AGSV","track":"Aberfeldie","surface":"Synthetic","placement":"1st","shoe":"Nike Maxflys","split1":"","split2":"","notes":"AGSV team","id":"mq372azonm4rbo20uc"},{"date":"2025-09-10","event":"relay","time":"48.15","wind":"Unknown","competition":"AGSV Championships","track":"Lakeside","surface":"Synthetic","placement":"2nd","shoe":"Nike Maxflys","split1":"29.61","split2":"18.54","notes":"AGSV team, Colin -> Tom -> Jayden -> Tommy","_splitsAuto":true,"id":"mq373w4mqm3qpsxoys"}],"rivals":[],"shoes":[]};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function getData() {
  if (!JSONBIN_KEY || !JSONBIN_BIN) return DEFAULT_DATA;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const json = await res.json();
    return json.record || DEFAULT_DATA;
  } catch (e) {
    return DEFAULT_DATA;
  }
}

async function saveData(data) {
  if (!JSONBIN_KEY || !JSONBIN_BIN) return;
  await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
    body: JSON.stringify(data)
  });
}

app.get('/api/data', async (req, res) => {
  res.json(await getData());
});

app.post('/api/data', async (req, res) => {
  try {
    await saveData(req.body);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sprint Tracker running on port ${PORT}`);
});
