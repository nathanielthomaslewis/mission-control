const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3334;

app.use(cors());
app.use(express.json());

// Helper: run powershell command via EncodedCommand for reliable multiline
function ps(cmd) {
  return new Promise((resolve, reject) => {
    const encoded = Buffer.from(cmd, 'utf16le').toString('base64');
    exec(`powershell -NoProfile -EncodedCommand ${encoded}`, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout.trim());
    });
  });
}

// 1. GET /api/ports
app.get('/api/ports', async (req, res) => {
  try {
    const raw = await ps(`
      Get-NetTCPConnection -State Listen | Sort-Object LocalPort -Unique | ForEach-Object {
        $p = $_.OwningProcess;
        $name = try { (Get-Process -Id $p -ErrorAction Stop).ProcessName } catch { 'unknown' };
        [PSCustomObject]@{ port=$_.LocalPort; pid=$p; process=$name }
      } | ConvertTo-Json -Compress
    `);
    const data = raw ? JSON.parse(raw) : [];
    res.json(Array.isArray(data) ? data : [data]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. GET /api/jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const raw = await ps(`
      $jobs = @();
      Get-Process python* -ErrorAction SilentlyContinue | ForEach-Object {
        $cmd = try { (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine } catch { '' };
        if ($cmd -match 'transcribe') {
          $jobs += [PSCustomObject]@{ name='faster-whisper'; pid=$_.Id; cpu=[math]::Round($_.CPU,1); memoryMB=[math]::Round($_.WorkingSet64/1MB,1); status='running'; startTime=$_.StartTime.ToString('o') }
        } elseif ($cmd -match 'comfyui|main.py') {
          $jobs += [PSCustomObject]@{ name='ComfyUI'; pid=$_.Id; cpu=[math]::Round($_.CPU,1); memoryMB=[math]::Round($_.WorkingSet64/1MB,1); status='running'; startTime=$_.StartTime.ToString('o') }
        }
      };
      Get-Process node -ErrorAction SilentlyContinue | ForEach-Object {
        $jobs += [PSCustomObject]@{ name='node'; pid=$_.Id; cpu=[math]::Round($_.CPU,1); memoryMB=[math]::Round($_.WorkingSet64/1MB,1); status='running'; startTime=$_.StartTime.ToString('o') }
      };
      $jobs | ConvertTo-Json -Compress
    `);
    const data = raw ? JSON.parse(raw) : [];
    res.json(Array.isArray(data) ? data : [data]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 3. GET /api/journal
app.get('/api/journal', async (req, res) => {
  try {
    const filePath = 'D:\\JOURNAL.md';
    if (!fs.existsSync(filePath)) return res.json([]);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).slice(-100);
    const entries = lines.map(line => {
      const match = line.match(/^-?\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*\|\s*([\w-]+)\s*\|\s*(.+)$/);
      if (match) return { timestamp: match[1], agent: match[2], message: match[3].trim() };
      return { timestamp: '', agent: '', message: line.trim() };
    }).reverse();
    res.json(entries);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 4. GET /api/pipeline
app.get('/api/pipeline', async (req, res) => {
  try {
    const filePath = 'D:\\PRODUCT-MATRIX\\027-ECOM-V1-clickbank-pipeline\\state\\pipeline-state.json';
    if (!fs.existsSync(filePath)) return res.json({ error: 'Pipeline state not found' });
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. POST /api/kill/:pid
app.post('/api/kill/:pid', async (req, res) => {
  if (req.headers['x-confirm'] !== 'true') {
    return res.status(400).json({ error: 'Missing X-Confirm: true header' });
  }
  const pid = parseInt(req.params.pid, 10);
  if (isNaN(pid)) return res.status(400).json({ error: 'Invalid PID' });
  try {
    await ps(`Stop-Process -Id ${pid} -Force`);
    res.json({ success: true, pid });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 6. GET /api/gpu
app.get('/api/gpu', async (req, res) => {
  try {
    const raw = await ps('nvidia-smi --query-gpu=utilization.gpu,utilization.memory,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits');
    const parts = raw.split(',').map(s => s.trim());
    res.json({
      gpuUtil: Number(parts[0]),
      memUtil: Number(parts[1]),
      memUsedMB: Number(parts[2]),
      memTotalMB: Number(parts[3]),
      tempC: Number(parts[4])
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 7. GET /api/nim-status
app.get('/api/nim-status', async (req, res) => {
  try {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: 11434,
      path: '/api/tags',
      method: 'GET',
      timeout: 5000
    };
    const result = await new Promise((resolve) => {
      const r = http.request(options, (resp) => {
        resolve({ active: resp.statusCode === 200, accountLabel: 'Ollama Local' });
      });
      r.on('error', () => resolve({ active: false, accountLabel: 'Ollama Local' }));
      r.on('timeout', () => { r.destroy(); resolve({ active: false, accountLabel: 'Ollama Local' }); });
      r.end();
    });
    res.json(result);
  } catch (e) {
    res.json({ active: false, accountLabel: 'Account 1' });
  }
});

// 8. GET /api/ingested
app.get('/api/ingested', async (req, res) => {
  try {
    const baseDir = 'D:\\PRODUCT-MATRIX';
    const dismissed = getDismissed();
    const entries = fs.readdirSync(baseDir).filter(d => (d.startsWith('vm-') || d.startsWith('url-')) && !dismissed.includes(d));
    const projects = entries.map(dir => {
      const fullPath = path.join(baseDir, dir);
      if (!fs.statSync(fullPath).isDirectory()) return null;
      const soulPath = path.join(fullPath, 'SOUL.md');
      let soul = {};
      if (fs.existsSync(soulPath)) {
        const content = fs.readFileSync(soulPath, 'utf-8');
        const urlMatch = content.match(/Source URL:\*\*\s*(.+)/);
        const platformMatch = content.match(/Platform:\*\*\s*(.+)/);
        const stageMatch = content.match(/Stage:\*\*\s*(.+)/);
        const createdMatch = content.match(/Created:\*\*\s*(.+)/);
        soul = {
          url: urlMatch?.[1]?.trim() || '',
          platform: platformMatch?.[1]?.trim() || 'unknown',
          stage: stageMatch?.[1]?.trim() || 'V1 (Research)',
          created: createdMatch?.[1]?.trim() || '',
        };
      }
      // Check what work has been done
      const hasResearch = fs.existsSync(path.join(fullPath, 'research', 'research.md'));
      const hasContent = fs.existsSync(path.join(fullPath, 'content')) && fs.readdirSync(path.join(fullPath, 'content')).length > 0;
      const hasPromo = fs.existsSync(path.join(fullPath, 'promo')) && fs.readdirSync(path.join(fullPath, 'promo')).length > 0;
      const hasIssues = fs.existsSync(path.join(fullPath, 'ISSUES.md'));
      const steps = [
        { name: 'ingested', done: true },
        { name: 'research', done: hasResearch },
        { name: 'content', done: hasContent },
        { name: 'promo', done: hasPromo },
        { name: 'published', done: false },
      ];
      const doneCount = steps.filter(s => s.done).length;
      return { id: dir, ...soul, steps, progress: Math.round((doneCount / steps.length) * 100) };
    }).filter(Boolean);
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 9. DELETE /api/ingested/:id — hides card from CRM, does NOT delete files
const dismissedPath = path.join('D:\\PRODUCT-MATRIX', '.dismissed.json');
function getDismissed() {
  if (!fs.existsSync(dismissedPath)) return [];
  try { return JSON.parse(fs.readFileSync(dismissedPath, 'utf-8')); } catch { return []; }
}
function saveDismissed(list) { fs.writeFileSync(dismissedPath, JSON.stringify(list, null, 2)); }

app.delete('/api/ingested/:id', (req, res) => {
  if (req.headers['x-confirm'] !== 'true') {
    return res.status(400).json({ error: 'Missing X-Confirm: true header' });
  }
  const id = req.params.id;
  if (!id || !/^(vm-|url-)/.test(id)) return res.status(400).json({ error: 'Invalid project id' });
  const list = getDismissed();
  if (!list.includes(id)) { list.push(id); saveDismissed(list); }
  res.json({ success: true, dismissed: id });
});

// 9b. POST /api/ingested/:id/restore — un-dismiss a card
app.post('/api/ingested/:id/restore', (req, res) => {
  const id = req.params.id;
  const list = getDismissed().filter(x => x !== id);
  saveDismissed(list);
  res.json({ success: true, restored: id });
});

// 10. GET /api/watch-folder — scan watch folder for unprocessed PRDs/ideas
app.get('/api/watch-folder', (req, res) => {
  try {
    const watchDir = 'D:\\AUTOMATIC_WORKFLOWS\\WATCH_FOLDERS';
    const dismissed = getDismissed();
    const files = fs.readdirSync(watchDir).filter(f => {
      if (dismissed.includes('watch:' + f)) return false;
      const ext = path.extname(f).toLowerCase();
      return ['.md', '.txt'].includes(ext) && !['watch_config.json', 'ingest_urls.js', 'watcher.ps1', 'start_watchers.ps1'].includes(f);
    });
    const items = files.map(f => {
      const fullPath = path.join(watchDir, f);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) return null;
      const content = fs.readFileSync(fullPath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.+)/m);
      const isPrd = f.startsWith('prd-');
      const promoted = fs.existsSync(path.join('D:\\PRODUCT-MATRIX', f.replace(/\.md$/, '').replace(/\.txt$/, '')));
      return {
        id: 'watch:' + f,
        filename: f,
        title: titleMatch?.[1]?.trim() || f,
        type: isPrd ? 'prd' : 'idea',
        platform: isPrd ? 'prd' : 'research',
        sizeKB: Math.round(stat.size / 1024),
        created: stat.mtime.toISOString(),
        source: fullPath,
        promoted,
      };
    }).filter(Boolean);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 11. POST /api/promote — scaffold a PRODUCT-MATRIX project from watch folder file
app.post('/api/promote', (req, res) => {
  if (req.headers['x-confirm'] !== 'true') {
    return res.status(400).json({ error: 'Missing X-Confirm: true header' });
  }
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename required' });
    const watchDir = 'D:\\AUTOMATIC_WORKFLOWS\\WATCH_FOLDERS';
    const srcPath = path.join(watchDir, filename);
    if (!fs.existsSync(srcPath)) return res.status(404).json({ error: 'File not found' });

    const content = fs.readFileSync(srcPath, 'utf-8');
    const titleMatch = content.match(/^#\s+(.+)/m);
    const title = titleMatch?.[1]?.trim() || filename.replace(/\.md$/, '');

    // Generate project ID
    const existing = fs.readdirSync('D:\\PRODUCT-MATRIX').filter(d => /^\d{3}-/.test(d));
    const maxNum = existing.reduce((max, d) => {
      const n = parseInt(d.substring(0, 3), 10);
      return n > max ? n : max;
    }, 0);
    const nextNum = String(maxNum + 1).padStart(3, '0');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').substring(0, 40).replace(/-$/, '');
    const projectId = `${nextNum}-${slug}`;
    const projectDir = path.join('D:\\PRODUCT-MATRIX', projectId);

    // Scaffold
    fs.mkdirSync(projectDir, { recursive: true });
    ['research', 'content', 'promo'].forEach(d => fs.mkdirSync(path.join(projectDir, d), { recursive: true }));

    // Copy PRD as research doc
    fs.copyFileSync(srcPath, path.join(projectDir, 'research', 'prd.md'));

    // Create SOUL.md with provenance
    const soul = `# SOUL.md — ${projectId}
## Identity
- **Title:** ${title}
- **Source File:** ${srcPath}
- **Platform:** prd
- **Type:** product_spec
- **Stage:** V2 (Build)
- **Created:** ${new Date().toISOString()}
- **Promoted From:** watch-folder

## Provenance
- Original: ${filename}
- Promoted: ${new Date().toISOString()}
- Source Dir: ${watchDir}

## Next Steps
- Build with Kimi Code CLI
- Generate promo content (ComfyUI images + video)
- Create landing page
- Publish to marketplace
`;
    fs.writeFileSync(path.join(projectDir, 'SOUL.md'), soul);

    // Create ISSUES.md
    const issues = `# ISSUES.md — ${projectId}
## Tasks
- [ ] Build MVP with Kimi Code CLI
- [ ] Generate brand images (ComfyUI)
- [ ] Create promo video
- [ ] Write landing page copy
- [ ] Deploy to Vercel
- [ ] List on marketplace
`;
    fs.writeFileSync(path.join(projectDir, 'ISSUES.md'), issues);

    res.json({ success: true, projectId, projectDir, title });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 12. GET /api/progress
app.get('/api/progress', async (req, res) => {
  try {
    const filePath = 'D:\\PRODUCT-MATRIX\\027-ECOM-V1-clickbank-pipeline\\state\\progress.json';
    if (!fs.existsSync(filePath)) return res.json({});
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 13. POST /api/active-project/done — auto-complete callback from CLI agents
const ACTIVE_PROJECTS_PATH = path.join(__dirname, 'active-projects.json');
function loadActiveProjects() {
  if (!fs.existsSync(ACTIVE_PROJECTS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(ACTIVE_PROJECTS_PATH, 'utf-8')); } catch { return []; }
}
function saveActiveProjects(list) { fs.writeFileSync(ACTIVE_PROJECTS_PATH, JSON.stringify(list, null, 2)); }

app.post('/api/active-project/done', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const projects = loadActiveProjects();
  const p = projects.find(p => p.name === name && p.status === 'running');
  if (p) {
    p.status = 'done';
    p.completedAt = new Date().toISOString();
    saveActiveProjects(projects);
  }
  // Also append to journal
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 16);
  fs.appendFileSync('D:\\JOURNAL.md', `\n- ${ts} | agent-complete | ${name} build finished`);
  res.json({ success: true, name });
});

// 14. GET /api/review-queue — completed builds awaiting review
app.get('/api/review-queue', (req, res) => {
  try {
    const reviewPath = path.join(__dirname, 'review-queue.json');
    if (!fs.existsSync(reviewPath)) return res.json([]);
    res.json(JSON.parse(fs.readFileSync(reviewPath, 'utf-8')));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/review-queue', (req, res) => {
  const reviewPath = path.join(__dirname, 'review-queue.json');
  const queue = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf-8')) : [];
  const item = { ...req.body, id: Date.now(), addedAt: new Date().toISOString(), reviewed: false, promoted: false };
  queue.push(item);
  fs.writeFileSync(reviewPath, JSON.stringify(queue, null, 2));
  res.json(item);
});

app.patch('/api/review-queue/:id', (req, res) => {
  const reviewPath = path.join(__dirname, 'review-queue.json');
  const queue = fs.existsSync(reviewPath) ? JSON.parse(fs.readFileSync(reviewPath, 'utf-8')) : [];
  const item = queue.find(q => q.id === parseInt(req.params.id));
  if (!item) return res.status(404).json({ error: 'not found' });
  Object.assign(item, req.body);
  fs.writeFileSync(reviewPath, JSON.stringify(queue, null, 2));
  res.json(item);
});

// 15. GET /api/build-queue — projects in PRODUCT-MATRIX ready to build
app.get('/api/build-queue', (req, res) => {
  try {
    const baseDir = 'D:\\PRODUCT-MATRIX';
    const entries = fs.readdirSync(baseDir).filter(d => /^\d{3}-/.test(d) && fs.statSync(path.join(baseDir, d)).isDirectory());
    const projects = entries.map(dir => {
      const fullPath = path.join(baseDir, dir);
      const hasSoul = fs.existsSync(path.join(fullPath, 'SOUL.md'));
      const hasIssues = fs.existsSync(path.join(fullPath, 'ISSUES.md'));
      const hasSrc = fs.existsSync(path.join(fullPath, 'src')) || fs.existsSync(path.join(fullPath, 'package.json'));
      const hubMatch = dir.match(/^\d{3}-(\w+)-/);
      const hub = hubMatch ? hubMatch[1] : 'MISC';
      return { id: dir, path: fullPath, hub, hasSoul, hasIssues, hasSrc, built: hasSrc };
    });
    res.json(projects);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Open folder in Explorer
app.post('/api/open-folder', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'path required' });
  const clean = folderPath.replace(/\//g, '\\');
  exec(`start "" "${clean}"`, { shell: 'cmd.exe' }, () => {
    res.json({ ok: true });
  });
});

app.listen(PORT, () => console.log(`Mission Control API running on http://localhost:${PORT}`));
