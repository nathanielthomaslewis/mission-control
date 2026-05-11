import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Inject macOS-style keyframes
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
@keyframes pulse-running {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 6px rgba(234,179,8,0.6); }
  50% { box-shadow: 0 0 12px rgba(234,179,8,1); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
::selection { background: rgba(99,102,241,0.3); }
`;
document.head.appendChild(pulseStyle);

// ============================================================
// DATA LOADER
// ============================================================
async function loadJSON(path) {
  try { const r = await fetch(path); return r.ok ? r.json() : []; }
  catch { return []; }
}

// ============================================================
// 30-DAY PLAN
// ============================================================
const PLAN_30_DAYS = [
  { day: '1-2', phase: 'Foundation', human: 'Rank top 10 projects by ROI, finalize CRM entries', night: 'GPU: Whisper transcribe all 383 media files from D:\\Assets', status: 'todo' },
  { day: '3-4', phase: 'Foundation', human: 'Write SOUL.md + BRAND.md for top 10 projects', night: 'GPU: ComfyUI batch — 210 brand images (21 per project x top 10)', status: 'todo' },
  { day: '5-7', phase: 'Foundation', human: 'Build itch.io pages for top 3 games (free/PWYW)', night: 'GPU: AnimateDiff 30-sec reels for top 10 (60 clips)', status: 'todo' },
  { day: '8-9', phase: 'Content', human: 'NIM: Generate 12-month content calendars (900 topics for top 10)', night: 'GPU: ComfyUI batch — 420 brand images for projects 11-30', status: 'todo' },
  { day: '10-11', phase: 'Content', human: 'Deploy postiz-app for social scheduling, connect calendars', night: 'GPU: TripoSR 3D assets from concept art (batch 50+)', status: 'todo' },
  { day: '12-14', phase: 'Content', human: 'Write AAA landing pages for top 10 (NIM + human polish)', night: 'GPU: Remaining whisper transcription + video reels', status: 'todo' },
  { day: '15-16', phase: 'Platform', human: 'ClickBank vendor setup for digital products 001-010', night: 'GPU: Month 2 social images (2,100 for top 10)', status: 'todo' },
  { day: '17-18', phase: 'Platform', human: 'Deploy landing pages on Vercel, email capture (Supabase+Resend)', night: 'GPU: ACE-Step music for product demo videos', status: 'todo' },
  { day: '19-21', phase: 'Platform', human: 'Set up affiliate programs, commission structures', night: 'GPU: VibeVoice voiceovers for top 10 product demos', status: 'todo' },
  { day: '22-24', phase: 'Launch', human: 'Social accounts active, first posts scheduled via postiz', night: 'GPU: Month 3 content images batch', status: 'todo' },
  { day: '25-27', phase: 'Launch', human: 'Monitor engagement, A/B test landing pages', night: 'GPU: Automated pipeline for remaining 90 projects', status: 'todo' },
  { day: '28-30', phase: 'Launch', human: 'Full launch remaining 5 products, activate affiliates', night: 'GPU: Start V2 upgrades for top performers', status: 'todo' },
];

const HUB_COLORS = { GAMES:'#22c55e', APPS:'#3b82f6', AI:'#a855f7', CRYPTO:'#eab308', DESKTOP:'#f97316', PRODUCTS:'#ec4899', 'PRODUCT-MATRIX':'#6366f1',
  'PRODUCTS DIGITAL AUDIO':'#f472b6', 'PRODUCTS DIGITAL TEXT':'#fb923c', 'PRODUCTS DIGITAL VIDEO':'#14b8a6' };
const PHASE_COLORS = { Foundation:'#3b82f6', Content:'#a855f7', Platform:'#eab308', Launch:'#22c55e' };

const AGENT_COLORS = { claude: '#a855f7', 'transcription-bot': '#22c55e', system: '#666' };
const KNOWN_PORTS = { 8188: 'ComfyUI', 11434: 'Ollama', 3333: 'Mission Control', 3334: 'Mission Control API' };

// ============================================================
// HOOKS
// ============================================================
function useAutoFetch(url, interval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(() => {
    fetch(url).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [url]);
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);
  return { data, loading, refresh };
}

// ============================================================
// APP
// ============================================================
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [hubSummary, setHubSummary] = useState({});
  const [plan, setPlan] = useState(PLAN_30_DAYS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHub, setSelectedHub] = useState('ALL');

  const { data: pipelineDataGlobal } = useAutoFetch('/api/pipeline', 15000);

  useEffect(() => {
    loadJSON('/data/all_projects.json').then(d => setProjects(Array.isArray(d) ? d : []));
    loadJSON('/data/hub_summary.json').then(d => setHubSummary(d || {}));
  }, []);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (selectedHub !== 'ALL') list = list.filter(p => p.hub === selectedHub);
    if (searchQuery) list = list.filter(p => p.id.toLowerCase().includes(searchQuery.toLowerCase()) || (p.path||'').toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [projects, selectedHub, searchQuery]);

  const hubs = useMemo(() => [...new Set(projects.map(p => p.hub))].sort(), [projects]);

  return (
    <div style={styles.root}>
      {/* SIDEBAR */}
      <nav style={styles.sidebar}>
        {/* macOS traffic lights */}
        <div style={{display:'flex',gap:8,padding:'14px 16px 10px',alignItems:'center'}}>
          <div style={{width:12,height:12,borderRadius:'50%',background:'#ff5f57',border:'1px solid #e0443e',cursor:'pointer'}}></div>
          <div style={{width:12,height:12,borderRadius:'50%',background:'#febc2e',border:'1px solid #dea123',cursor:'pointer'}}></div>
          <div style={{width:12,height:12,borderRadius:'50%',background:'#28c840',border:'1px solid #1aab29',cursor:'pointer'}}></div>
        </div>
        <div style={styles.sidebarLogo}>
          <span style={{fontSize:18}}>🚀</span>
          <span style={styles.logoText}>Mission Control</span>
        </div>
        <div style={styles.sidebarSection}>VIEWS</div>
        {[
          ['topProject', '👑', 'TOP PROJECT'],
          ['dashboard', '📊', 'Dashboard'],
          ['active', '🔥', 'Active Projects'],
          ['products', '📦', 'All Products'],
          ['plan', '📅', '30-Day Plan'],
          ['widgets', '🧩', 'Widgets'],
          ['activity', '📋', 'Activity Log'],
          ['ports', '🔌', 'Ports & Procs'],
          ['jobs', '⚡', 'Jobs'],
          ['ingested', '🎵', 'Ingested'],
          ['reviewQueue', '📋', 'Review Queue'],
          ['buildQueue', '🏗️', 'Build Queue'],
          ['promptFactory', '🎨', 'Prompt Factory'],
          ['courses', '📚', 'Course Index'],
          ['shortcuts', '🚀', 'Shortcuts'],
          ['todoLog', '✅', 'Todo & Log'],
          ['workflow', '🔀', 'Workflow Org'],
          ['localSetup', '🖥️', 'Local Setup'],
        ].map(([key, icon, label]) => (
          <button key={key} onClick={() => setPage(key)}
            style={{...styles.navBtn, ...(page===key ? styles.navBtnActive : {})}}>
            <span>{icon}</span> {label}
          </button>
        ))}
        <div style={styles.sidebarSection}>HUBS</div>
        {hubs.map(h => (
          <button key={h} onClick={() => { setSelectedHub(h); setPage('products'); }}
            style={{...styles.navBtn, ...(selectedHub===h && page==='products' ? styles.navBtnActive : {})}}>
            <span style={{...styles.hubDot, background: HUB_COLORS[h]||'#555'}}></span> {h}
            <span style={styles.badge}>{projects.filter(p=>p.hub===h).length}</span>
          </button>
        ))}
        <div style={{flex:1}}></div>
        <div style={styles.sidebarFooter}>
          <div style={{fontSize:10,color:'#555'}}>D:\ {projects.length} projects</div>
        </div>
      </nav>

      {/* MAIN */}
      <main style={styles.main}>
        {page === 'dashboard' && <DashboardPage projects={projects} hubs={hubs} hubSummary={hubSummary} plan={plan} setPage={setPage} setSelectedHub={setSelectedHub} pipelineData={pipelineDataGlobal} />}
        {page === 'active' && <ActiveProjectsPage />}
        {page === 'products' && <ProductsPage projects={filteredProjects} search={searchQuery} setSearch={setSearchQuery} hub={selectedHub} setHub={setSelectedHub} hubs={hubs} />}
        {page === 'plan' && <PlanPage plan={plan} setPlan={setPlan} />}
        {page === 'widgets' && <WidgetsPage projects={projects} hubs={hubs} />}
        {page === 'activity' && <ActivityLogPage />}
        {page === 'ports' && <PortsPage />}
        {page === 'jobs' && <JobsPage />}
        {page === 'ingested' && <IngestedPage />}
        {page === 'topProject' && <TopProjectPage />}
        {page === 'promptFactory' && <PromptFactoryPage />}
        {page === 'reviewQueue' && <ReviewQueuePage />}
        {page === 'buildQueue' && <BuildQueuePage />}
        {page === 'courses' && <CourseIndexPage />}
        {page === 'shortcuts' && <ShortcutsPage />}
        {page === 'todoLog' && <TodoLogPage />}
        {page === 'workflow' && <WorkflowPage />}
        {page === 'localSetup' && <LocalSetupPage />}
      </main>
    </div>
  );
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
function DashboardPage({ projects, hubs, hubSummary, plan, setPage, setSelectedHub, pipelineData }) {
  const pipeline = Array.isArray(pipelineData?.products) ? pipelineData.products : [];
  const totalProjects = projects.length;
  const totalSize = projects.reduce((s,p) => s + (p.sizeMB||0), 0);
  const doneTasks = plan.filter(t => t.status === 'done').length;

  const { data: journalData } = useAutoFetch('/api/journal', 30000);
  const { data: gpuData } = useAutoFetch('/api/gpu', 10000);
  const { data: portsData } = useAutoFetch('/api/ports', 10000);

  const recentActivity = Array.isArray(journalData) ? journalData.slice(0, 5) : [];
  const liveServices = Array.isArray(portsData) ? portsData : [];

  return (
    <div>
      <h1 style={styles.pageTitle}>Dashboard</h1>
      <p style={styles.pageSubtitle}>AeternusVita — 100 Products by November 2026</p>

      {/* KPI CARDS */}
      <div style={styles.kpiRow}>
        <div onClick={() => setPage('products')} style={{cursor:'pointer'}}>
          <KpiCard label="Total Projects" value={totalProjects} icon="📦" color="#3b82f6" />
        </div>
        <KpiCard label="Product Hubs" value={hubs.length} icon="🏠" color="#a855f7" />
        <KpiCard label="Disk Usage" value={`${(totalSize/1024).toFixed(1)}GB`} icon="💾" color="#eab308" />
        <div onClick={() => setPage('plan')} style={{cursor:'pointer'}}>
          <KpiCard label="30-Day Progress" value={`${doneTasks}/${plan.length}`} icon="📅" color="#22c55e" />
        </div>
      </div>

      {/* HUB QUICK NAV */}
      <div style={{display:'flex',gap:6,marginBottom:20,flexWrap:'wrap'}}>
        {hubs.map(h => {
          const count = projects.filter(p=>p.hub===h).length;
          return (
            <button key={h} onClick={() => { setSelectedHub(h); setPage('products'); }}
              style={{background:(HUB_COLORS[h]||'#555')+'15',border:`1px solid ${HUB_COLORS[h]||'#555'}40`,borderRadius:10,padding:'4px 10px',color:HUB_COLORS[h]||'#888',fontSize:11,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
              {h} <span style={{fontSize:10,color:'#666'}}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* TOP 10 PROSPECTS */}
      <div style={styles.sectionHeader}>Top 10 Prospects</div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Project</th>
              <th style={styles.th}>Hub</th>
              <th style={styles.th}>Size</th>
              <th style={styles.th}>Files</th>
              <th style={styles.th}>Modified</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...projects].sort((a,b) => (b.files||0) - (a.files||0)).slice(0,10).map((p, i) => (
              <tr key={p.path} style={styles.tr}>
                <td style={{...styles.td,fontWeight:700,color:'#eab308'}}>{i+1}</td>
                <td style={styles.td}>
                  <div style={{fontWeight:600,fontSize:12}}>{p.id}</div>
                  <div style={{fontSize:9,color:'#555'}}>{p.path}</div>
                </td>
                <td style={styles.td}><span style={{...styles.hubTag,background:(HUB_COLORS[p.hub]||'#555')+'25',color:HUB_COLORS[p.hub]||'#888'}}>{p.hub}</span></td>
                <td style={styles.td}>{p.sizeMB ? `${p.sizeMB}MB` : '—'}</td>
                <td style={styles.td}>{p.files||'—'}</td>
                <td style={styles.td}>{p.lastModified||'—'}</td>
                <td style={styles.td}>
                  <div style={{display:'flex',gap:4}}>
                    <button style={styles.actionBtn} onClick={()=>window.open(`vscode://file/${p.path.replace(/\\/g,'/')}`)} title="VS Code">💻</button>
                    <button style={styles.actionBtn} onClick={()=>fetch('/api/open-folder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:p.path})})} title="Open folder">📂</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GPU STATUS MINI-WIDGET */}
      {gpuData && (
        <div style={{...styles.hubCard, marginBottom: 16, display:'flex', alignItems:'center', gap: 20}}>
          <div style={{fontSize:13,fontWeight:700}}>🎮 GPU Status</div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:'#888'}}>Temp:</span>
            <span style={{fontSize:12,fontWeight:600,color: (gpuData.tempC||0) > 80 ? '#ef4444' : '#22c55e'}}>{gpuData.tempC || '—'}°C</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
            <span style={{fontSize:11,color:'#888'}}>VRAM:</span>
            <div style={{...styles.progressBg, flex:1, maxWidth:200}}>
              <div style={{...styles.progressFill, width:`${gpuData.vramUsedPct||0}%`, background: (gpuData.vramUsedPct||0) > 90 ? '#ef4444' : '#a855f7'}}></div>
            </div>
            <span style={{fontSize:11,color:'#999'}}>{gpuData.vramUsedMB||0}/{gpuData.vramTotalMB||8192}MB</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:11,color:'#888'}}>Util:</span>
            <span style={{fontSize:12,fontWeight:600,color:'#3b82f6'}}>{gpuData.utilizationPct||0}%</span>
          </div>
        </div>
      )}

      {/* NIM ACCOUNTS WIDGET */}
      <div style={styles.sectionHeader}>NIM Accounts</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:24}}>
        {(pipelineData?.nimAccounts || [
          { label: 'Account 1', key: 'nvapi-...S0fV', quotaUsed: 72, quotaLimit: 100 },
          { label: 'Account 2', key: null, quotaUsed: 0, quotaLimit: 100 },
          { label: 'Account 3', key: null, quotaUsed: 0, quotaLimit: 100 },
        ]).map((acc, i) => {
          const pct = acc.quotaLimit ? Math.round((acc.quotaUsed / acc.quotaLimit) * 100) : 0;
          const isActive = !!acc.key;
          const isLow = isActive && pct > 80;
          const isCritical = isActive && pct > 90;
          const jobCount = isActive ? pipeline.filter(p => p.account === acc.label).length : 0;
          return (
            <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:12,border: isCritical ? '1px solid #ef4444' : '1px solid #2a2a2a',position:'relative'}}>
              {isCritical && (
                <span style={{position:'absolute',top:8,right:8,fontSize:10,background:'#ef444430',color:'#ef4444',padding:'2px 6px',borderRadius:4,fontWeight:600,animation:'pulse-running 1s infinite'}}>QUOTA CRITICAL</span>
              )}
              {isLow && !isCritical && (
                <span style={{position:'absolute',top:8,right:8,fontSize:10,background:'#eab30830',color:'#eab308',padding:'2px 6px',borderRadius:4,fontWeight:600}}>LOW</span>
              )}
              <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{acc.label}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <span style={{width:6,height:6,borderRadius:'50%',background: isActive?'#22c55e':'#555'}}></span>
                <span style={{fontSize:11,color: isActive?'#22c55e':'#666'}}>{isActive ? 'active' : 'not configured'}</span>
              </div>
              {acc.key && <div style={{fontSize:10,color:'#555',fontFamily:'monospace',marginBottom:4}}>Key: ...{String(acc.key).slice(-4)}</div>}
              {isActive && (
                <div style={{marginBottom:4}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:2}}>Quota: {acc.quotaUsed}/{acc.quotaLimit} ({pct}%)</div>
                  <div style={styles.progressBg}>
                    <div style={{...styles.progressFill,width:`${pct}%`,background: isCritical?'#ef4444':isLow?'#eab308':'#22c55e'}}></div>
                  </div>
                </div>
              )}
              <div style={{fontSize:10,color:'#888'}}>Active jobs: {jobCount}</div>
            </div>
          );
        })}
      </div>

      {/* RECENT ACTIVITY */}
      <div style={styles.sectionHeader}>Recent Activity</div>
      <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)',marginBottom:24,overflow:'hidden'}}>
        {recentActivity.length === 0 && <div style={{padding:16,fontSize:12,color:'#555',textAlign:'center'}}>No journal entries — start the API server</div>}
        {recentActivity.map((entry, i) => (
          <div key={i} style={{display:'flex',gap:12,padding:'8px 12px',borderBottom:'1px solid rgba(255,255,255,0.04)',alignItems:'center'}}>
            <span style={{fontSize:10,color:'#555',fontFamily:'monospace',whiteSpace:'nowrap',width:130,flexShrink:0}}>{entry.timestamp||''}</span>
            <span style={{fontSize:11,fontWeight:600,color:AGENT_COLORS[entry.agent]||'#888',width:100,flexShrink:0}}>{entry.agent||'—'}</span>
            <span style={{fontSize:12,color:'#ccc'}}>{entry.message||''}</span>
          </div>
        ))}
      </div>

      {/* HUB OVERVIEW */}
      <div style={styles.sectionHeader}>Product Hubs</div>
      <div style={styles.hubGrid}>
        {hubs.map(h => {
          const count = projects.filter(p=>p.hub===h).length;
          const size = projects.filter(p=>p.hub===h).reduce((s,p)=>s+(p.sizeMB||0),0);
          return (
            <div key={h} style={styles.hubCard} onClick={() => { setSelectedHub(h); setPage('products'); }}>
              <div style={{...styles.hubCardBar, background: HUB_COLORS[h]||'#555'}}></div>
              <div style={styles.hubCardTitle}>{h}</div>
              <div style={styles.hubCardMeta}>{count} projects &middot; {(size/1024).toFixed(1)}GB</div>
              <div style={styles.hubCardPath}>D:\{h}\</div>
            </div>
          );
        })}
      </div>

      {/* LOCAL MODELS & TECH STACK */}
      <div style={styles.sectionHeader}>Local AI Models & Tech Stack</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
        <div style={styles.hubCard}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>🧠 Ollama Models</div>
          {[
            {name:'hermes4-14b',size:'10GB',desc:'Best for fiction & creative writing',color:'#a855f7',star:true},
            {name:'qwen3.5:9b',size:'6.6GB',desc:'Fast reasoning, code, non-fiction',color:'#3b82f6',star:true},
            {name:'hermes3:8b',size:'4.7GB',desc:'Balanced creative + instruction',color:'#8b5cf6'},
            {name:'qwen3:8b',size:'5.2GB',desc:'Reasoning, math, structured output',color:'#06b6d4'},
            {name:'llama3:latest',size:'4.7GB',desc:'General purpose, good baseline',color:'#f97316'},
            {name:'phi3:latest',size:'2.2GB',desc:'Lightweight, fast inference',color:'#22c55e'},
            {name:'nomic-embed-text',size:'274MB',desc:'Embeddings for RAG/search',color:'#eab308'},
          ].map(m => (
            <div key={m.name} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:m.color,flexShrink:0}}></span>
              <span style={{fontSize:12,fontWeight:m.star?700:400,flex:1}}>{m.name}{m.star?' ⭐':''}</span>
              <span style={{fontSize:10,color:'#666'}}>{m.size}</span>
              <span style={{fontSize:10,color:'#555'}}>{m.desc}</span>
            </div>
          ))}
          <div style={{fontSize:10,color:'#555',marginTop:6}}>⭐ = Recommended for content production</div>
        </div>
        <div style={styles.hubCard}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>⚡ Tech Stack</div>
          {[
            {cat:'GPU',items:'RTX 3070 8GB • CUDA 13.0 • PyTorch 2.11'},
            {cat:'Runtime',items:'Node.js + pnpm • Python 3.14 • Vite 8'},
            {cat:'AI Local',items:'Ollama • ComfyUI 0.20.1 • faster-whisper'},
            {cat:'AI Remote',items:'Claude API • Gemini API • Kimi API'},
            {cat:'Agents',items:'OpenHands • Hermes • OpenClaude • Aider • Pi CLI'},
            {cat:'Deploy',items:'Vercel • Hostinger VPS • itch.io'},
            {cat:'DB',items:'Supabase • SQLite • JSON-file CRM'},
            {cat:'Media',items:'ffmpeg • AnimateDiff • ACE-Step • VibeVoice'},
          ].map(s => (
            <div key={s.cat} style={{display:'flex',gap:8,padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontSize:11,fontWeight:700,color:'#a855f7',width:70,flexShrink:0}}>{s.cat}</span>
              <span style={{fontSize:11,color:'#999'}}>{s.items}</span>
            </div>
          ))}
          <div style={{marginTop:10,display:'flex',gap:6}}>
            <span style={{fontSize:10,background:'#22c55e20',color:'#22c55e',padding:'2px 8px',borderRadius:4}}>ComfyUI Running</span>
            <span style={{fontSize:10,background:'#3b82f620',color:'#3b82f6',padding:'2px 8px',borderRadius:4}}>Ollama Ready</span>
            <span style={{fontSize:10,background:'#eab30820',color:'#eab308',padding:'2px 8px',borderRadius:4}}>8GB VRAM</span>
          </div>
        </div>
      </div>

      {/* LIVE SERVICES — real data from /api/ports */}
      <div style={styles.sectionHeader}>Live Services</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:8,marginBottom:24}}>
        {liveServices.length === 0 && (
          <div style={{gridColumn:'1/-1',padding:16,fontSize:12,color:'#555',textAlign:'center'}}>No port data — start the API server</div>
        )}
        {liveServices.map(s => {
          const isKnown = KNOWN_PORTS[s.port];
          return (
            <div key={`${s.port}-${s.pid}`} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:10,border:`1px solid ${isKnown?'#3b82f640':'#2a2a2a'}`,display:'flex',alignItems:'center',gap:8}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:'#22c55e',flexShrink:0,boxShadow:'0 0 6px #22c55e60'}}></span>
              <div>
                <div style={{fontSize:12,fontWeight:600}}>:{s.port}</div>
                <div style={{fontSize:11,color:'#ccc'}}>{isKnown || s.process || 'unknown'}</div>
                <div style={{fontSize:10,color:'#555'}}>{s.process} (PID {s.pid})</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE PIPELINES */}
      <div style={styles.sectionHeader}>Active Pipelines</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:24}}>
        {[
          { name: 'Whisper Transcription', icon: '🎙️', total: 391, target: 'D:\\PRODUCTS DIGITAL TEXT\\', script: 'TRANSCRIPTION\\start_transcription.ps1', status: 'running', color: '#22c55e', estimate: '~8 hrs overnight' },
          { name: 'ComfyUI Brand Batch', icon: '🖼️', total: 210, target: 'D:\\PRODUCTS DIGITAL VIDEO\\', script: 'COMFYUI_BATCH\\start_batch.ps1', status: 'running', color: '#a855f7', estimate: '~4 hrs overnight' },
          { name: 'PDF Extraction', icon: '📄', total: 452, target: 'D:\\wiki\\pdfs\\', script: 'PDF_EXTRACT\\start_extraction.ps1', status: 'running', color: '#3b82f6', estimate: '~30 min' },
          { name: 'Watch Folders', icon: '👁️', watchers: 3, target: 'Assets + BIN + Digital', script: 'WATCH_FOLDERS\\start_watchers.ps1', status: 'running', color: '#eab308', estimate: 'always-on' },
          { name: 'Hub Owners', icon: '🤖', agents: 4, target: 'kimi/gemini/claude/hermes', script: 'HUB_OWNERS\\hub_watcher.ps1', status: 'running', color: '#06b6d4', estimate: 'always-on' },
          { name: 'Product Research', icon: '🔍', target: 'D:\\outputs\\product-research\\', script: 'PRODUCT_RESEARCH\\watch_urls.ps1', status: 'running', color: '#f97316', estimate: 'on-demand' },
        ].map(p => (
          <div key={p.name} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:12,border:'1px solid rgba(255,255,255,0.06)',borderLeft:`3px solid ${p.color}`}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:16}}>{p.icon}</span>
                <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e',boxShadow:'0 0 6px #22c55e60'}}></span>
                <span style={{fontSize:10,color:'#22c55e'}}>running</span>
              </div>
            </div>
            {p.total && (
              <div style={{marginBottom:4}}>
                <div style={{fontSize:11,color:'#888',marginBottom:2}}>{p.total} items</div>
                <div style={{height:3,background:'rgba(255,255,255,0.08)',borderRadius:2}}>
                  <div style={{height:'100%',borderRadius:2,width:'35%',background:p.color}}></div>
                </div>
              </div>
            )}
            {p.watchers && <div style={{fontSize:11,color:'#888',marginBottom:4}}>{p.watchers} watchers active</div>}
            {p.agents && <div style={{fontSize:11,color:'#888',marginBottom:4}}>{p.agents} agents active</div>}
            <div style={{fontSize:10,color:'#555',fontFamily:'monospace',marginBottom:2}}>{p.target}</div>
            <div style={{fontSize:10,color:'#666'}}>{p.estimate}</div>
          </div>
        ))}
      </div>

      {/* UPCOMING PLAN */}
      <div style={styles.sectionHeader}>Next Actions</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        {plan.filter(t=>t.status!=='done').slice(0,3).map((t,i) => (
          <div key={i} style={{...styles.planMini, borderLeft:`3px solid ${PHASE_COLORS[t.phase]||'#555'}`}}>
            <div style={{fontSize:11,fontWeight:600,color:PHASE_COLORS[t.phase]}}>Day {t.day} — {t.phase}</div>
            <div style={{fontSize:12,marginTop:4}}>👤 {t.human}</div>
            <div style={{fontSize:11,color:'#888',marginTop:2}}>🌙 {t.night}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{fontSize:24}}>{icon}</div>
      <div style={{fontSize:24,fontWeight:700,color}}>{value}</div>
      <div style={{fontSize:11,color:'#888'}}>{label}</div>
    </div>
  );
}

// ============================================================
// ACTIVE PROJECTS PAGE
// ============================================================
function ActiveProjectsPage() {
  const DEFAULT_ACTIVE = [];
  const [activeProjects, setActiveProjects] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem('mc-active-projects') || '[]'); return saved.length > 0 ? saved : DEFAULT_ACTIVE; } catch { return DEFAULT_ACTIVE; }
  });
  const [newProject, setNewProject] = useState({ name:'', path:'', agent:'claude', task:'', status:'running', estimateMin:30 });
  const [elapsed, setElapsed] = useState({});

  const save = (updated) => { setActiveProjects(updated); localStorage.setItem('mc-active-projects', JSON.stringify(updated)); };

  const addProject = () => {
    if (!newProject.name.trim()) return;
    save([{ ...newProject, id: Date.now(), startedAt: new Date().toISOString(), estimateMin: newProject.estimateMin || 30, logs: [] }, ...activeProjects]);
    setNewProject({ name:'', path:'', agent:'claude', task:'', status:'running' });
  };

  const updateStatus = (id, status) => save(activeProjects.map(p => p.id===id ? {...p, status, ...(status==='done'||status==='failed' ? {completedAt: new Date().toISOString()} : {})} : p));
  const removeProject = (id) => save(activeProjects.filter(p => p.id !== id));
  const addLog = (id, msg) => save(activeProjects.map(p => p.id===id ? {...p, logs: [...(p.logs||[]), {time: new Date().toLocaleTimeString(), msg}]} : p));

  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now();
      const e = {};
      activeProjects.forEach(p => {
        if (p.status === 'running' && p.startedAt) {
          const diffSec = Math.floor((now - new Date(p.startedAt).getTime()) / 1000);
          const h = Math.floor(diffSec/3600); const m = Math.floor((diffSec%3600)/60); const s = diffSec%60;
          const estSec = (p.estimateMin || 30) * 60;
          const remainSec = Math.max(0, estSec - diffSec);
          const rh = Math.floor(remainSec/3600); const rm = Math.floor((remainSec%3600)/60); const rs = remainSec%60;
          const pct = Math.min(100, Math.round((diffSec / estSec) * 100));
          e[p.id] = {
            elapsed: `${h>0?h+'h ':''}${m}m ${s}s`,
            remaining: remainSec > 0 ? `${rh>0?rh+'h ':''}${rm}m ${rs}s` : 'Overtime',
            pct,
            overtime: diffSec > estSec,
          };
        }
      });
      setElapsed(e);
    }, 1000);
    return () => clearInterval(iv);
  }, [activeProjects]);

  const AGENT_OPTS = [
    { value:'claude', label:'Claude Code', color:'#a855f7', icon:'🟣' },
    { value:'kimi', label:'Kimi CLI', color:'#3b82f6', icon:'🔵' },
    { value:'gemini', label:'Gemini CLI', color:'#22c55e', icon:'💚' },
    { value:'ollama', label:'Ollama', color:'#f97316', icon:'🟠' },
    { value:'codex', label:'Codex', color:'#eab308', icon:'⚡' },
    { value:'openhands', label:'OpenHands', color:'#ec4899', icon:'🤲' },
    { value:'aider', label:'Aider', color:'#14b8a6', icon:'🛠️' },
  ];
  const STATUS_OPTS = [
    { value:'running', label:'Running', color:'#eab308' },
    { value:'done', label:'Done', color:'#22c55e' },
    { value:'failed', label:'Failed', color:'#ef4444' },
    { value:'paused', label:'Paused', color:'#f97316' },
  ];

  const agentInfo = (name) => AGENT_OPTS.find(a => a.value===name) || AGENT_OPTS[0];
  const statusInfo = (s) => STATUS_OPTS.find(o => o.value===s) || STATUS_OPTS[0];

  const running = activeProjects.filter(p => p.status==='running');
  const completed = activeProjects.filter(p => p.status==='done');
  const failed = activeProjects.filter(p => p.status==='failed');

  return (
    <div>
      <h1 style={styles.pageTitle}>Active Projects</h1>
      <p style={styles.pageSubtitle}>Track autonomous agent builds in real-time</p>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          { label:'Running', value:running.length, color:'#eab308', icon:'⚡' },
          { label:'Completed', value:completed.length, color:'#22c55e', icon:'✅' },
          { label:'Failed', value:failed.length, color:'#ef4444', icon:'❌' },
          { label:'Total', value:activeProjects.length, color:'#3b82f6', icon:'📊' },
        ].map((s,i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#888',marginBottom:4}}>{s.icon} {s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ADD NEW */}
      <div style={{background:'rgba(99,102,241,0.06)',borderRadius:10,border:'1px solid rgba(99,102,241,0.12)',padding:16,marginBottom:20}}>
        <div style={{fontSize:12,fontWeight:700,color:'#888',marginBottom:10}}>Launch New Build</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto auto auto',gap:8,marginBottom:8}}>
          <input value={newProject.name} onChange={e => setNewProject({...newProject, name:e.target.value})}
            placeholder="Project name (e.g. Skoooool AI)" style={styles.searchInput} />
          <input value={newProject.path} onChange={e => setNewProject({...newProject, path:e.target.value})}
            placeholder="Path (e.g. D:\PRODUCT-MATRIX\016-...)" style={styles.searchInput} />
          <select value={newProject.agent} onChange={e => setNewProject({...newProject, agent:e.target.value})} style={styles.select}>
            {AGENT_OPTS.map(a => <option key={a.value} value={a.value}>{a.icon} {a.label}</option>)}
          </select>
          <input type="number" value={newProject.estimateMin} onChange={e => setNewProject({...newProject, estimateMin:parseInt(e.target.value)||30})}
            placeholder="Est. min" style={{...styles.searchInput, width:80, textAlign:'center'}} min={1} />
          <span style={{fontSize:10,color:'#555',alignSelf:'center'}}>min</span>
        </div>
        <div style={{display:'flex',gap:8}}>
          <input value={newProject.task} onChange={e => setNewProject({...newProject, task:e.target.value})}
            onKeyDown={e => e.key==='Enter' && addProject()}
            placeholder="Task description..." style={{...styles.searchInput, flex:1}} />
          <button onClick={addProject} style={{background:'#4F46E5',border:'none',borderRadius:10,padding:'0 20px',color:'white',fontSize:12,fontWeight:700,cursor:'pointer'}}>Track</button>
        </div>
      </div>

      {/* RUNNING PROJECTS */}
      {running.length > 0 && <>
        <div style={styles.sectionHeader}>Running ({running.length})</div>
        <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:24}}>
          {running.map(p => {
            const ai = agentInfo(p.agent);
            return (
              <div key={p.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:`1px solid ${ai.color}40`,overflow:'hidden'}}>
                <div style={{height:3,background:ai.color,position:'relative'}}>
                  <div style={{position:'absolute',right:0,top:0,height:3,width:'30%',background:`linear-gradient(90deg,transparent,${ai.color})`,animation:'pulse-running 2s infinite'}}></div>
                </div>
                <div style={{padding:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                    <span style={{fontSize:20}}>{ai.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:700}}>{p.name}</div>
                      <div style={{fontSize:10,color:'#888',fontFamily:'monospace'}}>{p.path}</div>
                    </div>
                    <div style={{textAlign:'right',minWidth:140}}>
                      <div style={{fontSize:11,color:'#888',fontFamily:'monospace'}}>{elapsed[p.id]?.elapsed||'0m 0s'} elapsed</div>
                      <div style={{fontSize:20,fontWeight:700,color: elapsed[p.id]?.overtime ? '#ef4444' : ai.color,fontFamily:'monospace'}}>
                        {elapsed[p.id]?.remaining||'--'}
                      </div>
                      <div style={{fontSize:9,color: elapsed[p.id]?.overtime ? '#ef4444' : '#555'}}>
                        {elapsed[p.id]?.overtime ? 'past estimate' : 'remaining'}
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div style={{marginBottom:10}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#888',marginBottom:3}}>
                      <span>Est. {p.estimateMin||30}m</span>
                      <span style={{fontWeight:700,color: elapsed[p.id]?.overtime ? '#ef4444' : ai.color}}>{elapsed[p.id]?.pct||0}%</span>
                    </div>
                    <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:3,width:`${Math.min(100,elapsed[p.id]?.pct||0)}%`,background: elapsed[p.id]?.overtime ? `linear-gradient(90deg,${ai.color},#ef4444)` : ai.color,transition:'width 1s linear'}}></div>
                    </div>
                  </div>

                  {p.task && <div style={{fontSize:11,color:'#aaa',background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 10px',marginBottom:10,fontFamily:'monospace'}}>{p.task}</div>}

                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                    <span style={{fontSize:11,fontWeight:600,color:ai.color,background:ai.color+'20',padding:'2px 8px',borderRadius:4}}>{ai.label}</span>
                    <span style={{fontSize:10,color:'#888'}}>started {new Date(p.startedAt).toLocaleTimeString()}</span>
                    <button onClick={() => { const m = prompt('Update estimate (minutes):', p.estimateMin||30); if (m) save(activeProjects.map(x => x.id===p.id ? {...x, estimateMin:parseInt(m)||30} : x)); }}
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:4,padding:'2px 8px',color:'#888',fontSize:9,cursor:'pointer',marginLeft:'auto'}}>Edit ETA</button>
                  </div>

                  {/* Log entries */}
                  {(p.logs||[]).length > 0 && (
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:8,marginBottom:10,maxHeight:100,overflowY:'auto'}}>
                      {p.logs.map((l,i) => (
                        <div key={i} style={{fontSize:10,color:'#888',padding:'2px 0',borderBottom:'1px solid #222'}}>
                          <span style={{color:'#555',marginRight:6}}>{l.time}</span>{l.msg}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* FILE LINKS */}
                  {p.path && (
                    <div style={{display:'flex',gap:6,marginBottom:10}}>
                      <button onClick={() => fetch('/api/open-folder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:p.path})})}
                        style={{background:'#3b82f620',border:'1px solid #3b82f640',borderRadius:10,padding:'5px 12px',color:'#3b82f6',fontSize:10,cursor:'pointer',fontWeight:600}}>📂 Open Folder</button>
                      <button onClick={() => window.open(`vscode://file/${p.path.replace(/\\/g,'/')}`)}
                        style={{background:'#a855f720',border:'1px solid #a855f740',borderRadius:10,padding:'5px 12px',color:'#a855f7',fontSize:10,cursor:'pointer',fontWeight:600}}>💻 VS Code</button>
                    </div>
                  )}

                  <div style={{display:'flex',gap:6}}>
                    <button onClick={() => updateStatus(p.id, 'done')}
                      style={{background:'#22c55e',border:'none',borderRadius:10,padding:'6px 16px',color:'#fff',fontSize:11,cursor:'pointer',fontWeight:700}}>✓ Mark Done</button>
                    <button onClick={() => updateStatus(p.id, 'failed')}
                      style={{background:'#ef444420',border:'1px solid #ef444440',borderRadius:10,padding:'5px 12px',color:'#ef4444',fontSize:10,cursor:'pointer',fontWeight:600}}>Mark Failed</button>
                    <button onClick={() => updateStatus(p.id, 'paused')}
                      style={{background:'#f9731620',border:'1px solid #f9731640',borderRadius:10,padding:'5px 12px',color:'#f97316',fontSize:10,cursor:'pointer',fontWeight:600}}>Pause</button>
                    <button onClick={() => { const msg = prompt('Add log note:'); if (msg) addLog(p.id, msg); }}
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'5px 12px',color:'#ccc',fontSize:10,cursor:'pointer',fontWeight:600}}>+ Log</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>}

      {/* COMPLETED */}
      {completed.length > 0 && <>
        <div style={styles.sectionHeader}>Completed ({completed.length})</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:24}}>
          {completed.map(p => {
            const ai = agentInfo(p.agent);
            const duration = p.startedAt && p.completedAt ? Math.round((new Date(p.completedAt) - new Date(p.startedAt)) / 60000) : 0;
            return (
              <div key={p.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,opacity:0.7}}>
                <span style={{fontSize:16}}>✅</span>
                <span style={{fontSize:14}}>{ai.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                  <div style={{fontSize:10,color:'#666'}}>{p.task}</div>
                </div>
                <span style={{fontSize:11,color:'#22c55e',fontWeight:600}}>{duration}m</span>
                <button onClick={() => removeProject(p.id)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:14}}>×</button>
              </div>
            );
          })}
        </div>
      </>}

      {/* FAILED */}
      {failed.length > 0 && <>
        <div style={styles.sectionHeader}>Failed ({failed.length})</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:24}}>
          {failed.map(p => {
            const ai = agentInfo(p.agent);
            return (
              <div key={p.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid #ef444430',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,opacity:0.7}}>
                <span style={{fontSize:16}}>❌</span>
                <span style={{fontSize:14}}>{ai.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{p.name}</div>
                  <div style={{fontSize:10,color:'#666'}}>{p.task}</div>
                </div>
                <button onClick={() => updateStatus(p.id, 'running')} style={{background:'#eab30820',border:'1px solid #eab30840',borderRadius:10,padding:'4px 10px',color:'#eab308',fontSize:10,cursor:'pointer',fontWeight:600}}>Retry</button>
                <button onClick={() => removeProject(p.id)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:14}}>×</button>
              </div>
            );
          })}
        </div>
      </>}

      {activeProjects.length === 0 && (
        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:40,textAlign:'center',color:'#555',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:40,marginBottom:8}}>🔥</div>
          <div style={{fontSize:14}}>No active builds</div>
          <div style={{fontSize:11,marginTop:4}}>Add a project above to start tracking autonomous agent builds</div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRODUCTS PAGE
// ============================================================
function ProductsPage({ projects, search, setSearch, hub, setHub, hubs }) {
  const [sortKey, setSortKey] = useState('lastModified');
  const [sortDir, setSortDir] = useState(-1);

  const sorted = useMemo(() => {
    return [...projects].sort((a,b) => {
      const va = a[sortKey]||'', vb = b[sortKey]||'';
      if (typeof va === 'number') return (va - vb) * sortDir;
      return String(va).localeCompare(String(vb)) * sortDir;
    });
  }, [projects, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey===key) setSortDir(d=>d*-1); else { setSortKey(key); setSortDir(-1); }
  }

  function openProject(path) { window.open(`vscode://file/${path.replace(/\\/g,'/')}`); }
  function openFolder(p) {
    const clean = p.replace(/\//g, '\\');
    fetch('/api/open-folder', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({path: clean}) });
  }

  function detectPlatform(p) {
    if (p.hasGodot) return { label:'Godot', color:'#4FC3F7' };
    if (p.id?.match(/clickbank/i)) return { label:'ClickBank', color:'#22c55e' };
    if (p.id?.match(/tiktok/i)) return { label:'TikTok', color:'#ff0050' };
    if (p.id?.match(/itch|game/i) || p.hub==='GAMES') return { label:'itch.io', color:'#fa5c5c' };
    if (p.hasPackageJson) return { label:'Web/Vercel', color:'#3b82f6' };
    if (p.hub === 'AI') return { label:'AI/Local', color:'#a855f7' };
    return { label:'TBD', color:'#555' };
  }

  function detectPhase(p) {
    const id = p.id || '';
    if (id.includes('-V3-')) return { v1:true, v2:true, v3:true };
    if (id.includes('-V2-')) return { v1:true, v2:true, v3:false };
    return { v1: (p.files||0) > 2, v2:false, v3:false };
  }

  function detectAI(p) {
    const mod = p.lastModified || '';
    const id = p.id || '';
    if (id.match(/^1[12]\d-/)) return 'claude';
    if (id.match(/kimi/i)) return 'kimi';
    return null;
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <h1 style={{...styles.pageTitle,margin:0}}>{hub==='ALL'?'All Products':hub}</h1>
        <span style={{color:'#555',fontSize:13}}>{projects.length} projects</span>
      </div>
      <div style={styles.filterRow}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects..." style={styles.searchInput} />
        <select value={hub} onChange={e=>setHub(e.target.value)} style={styles.select}>
          <option value="ALL">All Hubs</option>
          {hubs.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {[['id','Name'],['hub','Hub'],['platform','Platform'],['sizeMB','Size'],['files','Files'],['lastModified','Modified'],['suggestions','Suggestions']].map(([k,l])=>(
                <th key={k} style={styles.th} onClick={()=>toggleSort(k)}>{l} {sortKey===k?(sortDir>0?'↑':'↓'):''}</th>
              ))}
              <th style={{...styles.th,textAlign:'center'}}>V1/V2/V3</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => {
              const plat = detectPlatform(p);
              const phase = detectPhase(p);
              const ai = detectAI(p);
              const suggestions = [];
              if ((p.files||0) <= 2) suggestions.push('Needs SOUL.md');
              if (!p.hasPackageJson && p.hub !== 'GAMES') suggestions.push('No package.json');
              if (phase.v1 && !phase.v2) suggestions.push('Ready for V2?');
              return (
                <tr key={p.path} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{fontWeight:600,fontSize:13}}>{p.id}</div>
                    <div style={{fontSize:10,color:'#666'}}>{p.path}</div>
                  </td>
                  <td style={styles.td}><span style={{...styles.hubTag,background:(HUB_COLORS[p.hub]||'#555')+'25',color:HUB_COLORS[p.hub]||'#888'}}>{p.hub}</span></td>
                  <td style={styles.td}><span style={{fontSize:10,fontWeight:600,color:plat.color,background:plat.color+'20',padding:'2px 6px',borderRadius:4}}>{plat.label}</span></td>
                  <td style={styles.td}>{p.sizeMB ? `${p.sizeMB}MB` : '—'}</td>
                  <td style={styles.td}>{p.files||'—'}</td>
                  <td style={styles.td}>
                    <div>{p.lastModified||'—'}</div>
                    {ai && <span style={{fontSize:9,fontWeight:600,color:AGENT_COLORS[ai]||'#888',background:(AGENT_COLORS[ai]||'#888')+'20',padding:'1px 5px',borderRadius:3,marginTop:2,display:'inline-block'}}>{ai}</span>}
                  </td>
                  <td style={styles.td}>
                    <div style={{display:'flex',flexDirection:'column',gap:2}}>
                      {suggestions.length === 0 && <span style={{fontSize:10,color:'#555'}}>—</span>}
                      {suggestions.map((s,i) => <span key={i} style={{fontSize:9,color:'#eab308',background:'#eab30815',padding:'1px 5px',borderRadius:3}}>{s}</span>)}
                    </div>
                  </td>
                  <td style={{...styles.td,textAlign:'center'}}>
                    <div style={{display:'flex',gap:3,justifyContent:'center'}}>
                      {[['V1',phase.v1],['V2',phase.v2],['V3',phase.v3]].map(([label,done]) => (
                        <span key={label} style={{fontSize:9,fontWeight:700,padding:'2px 5px',borderRadius:3,background:done?'#22c55e20':'#33333380',color:done?'#22c55e':'#555'}}>{label}</span>
                      ))}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={{display:'flex',gap:4}}>
                      <button style={styles.actionBtn} onClick={()=>openProject(p.path)} title="Open in VS Code">💻</button>
                      <button style={styles.actionBtn} onClick={()=>openFolder(p.path)} title="Open folder">📂</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length===0 && <div style={{textAlign:'center',padding:40,color:'#555'}}>No projects found</div>}
      </div>
    </div>
  );
}

// ============================================================
// 30-DAY PLAN PAGE
// ============================================================
function PlanPage({ plan, setPlan }) {
  function toggleStatus(idx) {
    setPlan(p => {
      const updated = p.map((t,i) => i===idx ? {...t, status: t.status==='done'?'todo':'done'} : t);
      localStorage.setItem('mc-plan-status', JSON.stringify(updated.map(t => t.status)));
      return updated;
    });
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('mc-plan-status') || '[]');
      if (saved.length === plan.length) {
        setPlan(p => p.map((t,i) => ({...t, status: saved[i] || t.status})));
      }
    } catch {}
  }, []);

  return (
    <div>
      <h1 style={styles.pageTitle}>30-Day Launch Plan</h1>
      <p style={styles.pageSubtitle}>Human tasks (daytime) + GPU tasks (overnight batches)</p>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {Object.entries(PHASE_COLORS).map(([phase,color]) => (
          <span key={phase} style={{fontSize:11,padding:'2px 10px',borderRadius:4,background:color+'20',color,fontWeight:600}}>{phase}</span>
        ))}
        <span style={{marginLeft:'auto',fontSize:12,color:'#888'}}>
          {plan.filter(t=>t.status==='done').length}/{plan.length} complete
        </span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {plan.map((t,i) => (
          <div key={i} style={{...styles.planRow, borderLeft:`3px solid ${PHASE_COLORS[t.phase]||'#555'}`, opacity:t.status==='done'?0.5:1}}>
            <button onClick={()=>toggleStatus(i)} style={styles.checkbox}>
              {t.status==='done' ? '✅' : '⬜'}
            </button>
            <div style={{width:50,fontSize:12,fontWeight:700,color:PHASE_COLORS[t.phase]}}>Day {t.day}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,textDecoration:t.status==='done'?'line-through':'none'}}>👤 {t.human}</div>
              <div style={{fontSize:11,color:'#888',marginTop:2}}>🌙 {t.night}</div>
            </div>
            <span style={{...styles.phaseTag,background:PHASE_COLORS[t.phase]+'20',color:PHASE_COLORS[t.phase]}}>{t.phase}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// WIDGETS PAGE
// ============================================================
function WidgetsPage({ projects, hubs }) {
  const totalSize = projects.reduce((s,p)=>s+(p.sizeMB||0),0);
  const nodeProjects = projects.filter(p=>p.hasPackageJson).length;
  const godotProjects = projects.filter(p=>p.hasGodot).length;
  const recentProjects = [...projects].sort((a,b)=>(b.lastModified||'').localeCompare(a.lastModified||'')).slice(0,8);
  const largestProjects = [...projects].sort((a,b)=>(b.sizeMB||0)-(a.sizeMB||0)).slice(0,8);

  return (
    <div>
      <h1 style={styles.pageTitle}>Widgets</h1>
      <p style={styles.pageSubtitle}>D:\ drive intelligence at a glance</p>
      <div style={styles.widgetGrid}>
        <div style={styles.widget}>
          <div style={styles.widgetTitle}>💾 Disk Breakdown by Hub</div>
          {hubs.map(h => {
            const size = projects.filter(p=>p.hub===h).reduce((s,p)=>s+(p.sizeMB||0),0);
            const pct = totalSize > 0 ? (size/totalSize)*100 : 0;
            return (
              <div key={h} style={{marginBottom:6}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                  <span style={{color:HUB_COLORS[h]||'#888'}}>{h}</span>
                  <span style={{color:'#888'}}>{(size/1024).toFixed(1)}GB ({pct.toFixed(0)}%)</span>
                </div>
                <div style={styles.progressBg}>
                  <div style={{...styles.progressFill,width:`${pct}%`,background:HUB_COLORS[h]||'#555'}}></div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={styles.widget}>
          <div style={styles.widgetTitle}>🔧 Tech Stack Distribution</div>
          <div style={{display:'flex',gap:12,marginTop:8}}>
            <div style={styles.techCard}><div style={{fontSize:28}}>⚡</div><div style={{fontSize:20,fontWeight:700}}>{nodeProjects}</div><div style={{fontSize:10,color:'#888'}}>Node.js</div></div>
            <div style={styles.techCard}><div style={{fontSize:28}}>🎮</div><div style={{fontSize:20,fontWeight:700}}>{godotProjects}</div><div style={{fontSize:10,color:'#888'}}>Godot</div></div>
            <div style={styles.techCard}><div style={{fontSize:28}}>📦</div><div style={{fontSize:20,fontWeight:700}}>{projects.length - nodeProjects - godotProjects}</div><div style={{fontSize:10,color:'#888'}}>Other</div></div>
          </div>
        </div>
        <div style={styles.widget}>
          <div style={styles.widgetTitle}>🕐 Recently Modified</div>
          {recentProjects.map(p => (
            <div key={p.path} style={styles.widgetRow}>
              <span style={{...styles.hubDotSmall,background:HUB_COLORS[p.hub]||'#555'}}></span>
              <span style={{flex:1,fontSize:11,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.id}</span>
              <span style={{fontSize:10,color:'#666'}}>{p.lastModified}</span>
            </div>
          ))}
        </div>
        <div style={styles.widget}>
          <div style={styles.widgetTitle}>📏 Largest Projects</div>
          {largestProjects.map(p => (
            <div key={p.path} style={styles.widgetRow}>
              <span style={{...styles.hubDotSmall,background:HUB_COLORS[p.hub]||'#555'}}></span>
              <span style={{flex:1,fontSize:11}}>{p.id}</span>
              <span style={{fontSize:10,color:'#888'}}>{p.sizeMB > 1024 ? `${(p.sizeMB/1024).toFixed(1)}GB` : `${p.sizeMB}MB`}</span>
            </div>
          ))}
        </div>
        <div style={{...styles.widget, gridColumn:'1/-1'}}>
          <div style={styles.widgetTitle}>💡 Suggestions & Quick Launch</div>
          <div style={styles.suggestionGrid}>
            <div style={{...styles.suggestion,borderLeft:'3px solid #22c55e'}}>
              <div>📹 <strong>391 media files</strong> in D:\Assets awaiting transcription</div>
              <div style={{fontSize:10,color:'#22c55e',marginTop:4,fontFamily:'monospace'}}>powershell D:\AUTOMATIC_WORKFLOWS\TRANSCRIPTION\start_transcription.ps1</div>
              <div style={{fontSize:9,color:'#555',marginTop:2}}>Overnight GPU job — faster-whisper small model, outputs to D:\PRODUCTS DIGITAL TEXT\</div>
            </div>
            <div style={{...styles.suggestion,borderLeft:'3px solid #3b82f6'}}>
              <div>🖼️ <strong>ComfyUI brand batch</strong> — 210 images for top 10 projects</div>
              <div style={{fontSize:10,color:'#3b82f6',marginTop:4,fontFamily:'monospace'}}>powershell D:\AUTOMATIC_WORKFLOWS\COMFYUI_BATCH\start_batch.ps1</div>
              <div style={{fontSize:9,color:'#555',marginTop:2}}>Logos, banners, mockups</div>
            </div>
            <div style={{...styles.suggestion,borderLeft:'3px solid #a855f7'}}>
              <div>👁️ <strong>Watch folders</strong> active — auto-route new files to pipelines</div>
              <div style={{fontSize:10,color:'#a855f7',marginTop:4,fontFamily:'monospace'}}>powershell D:\AUTOMATIC_WORKFLOWS\WATCH_FOLDERS\start_watchers.ps1</div>
              <div style={{fontSize:9,color:'#555',marginTop:2}}>Edit config: D:\AUTOMATIC_WORKFLOWS\WATCH_FOLDERS\watch_config.json</div>
            </div>
            <div style={{...styles.suggestion,borderLeft:'3px solid #eab308'}}>
              <div>📝 <strong>452 PDFs</strong> in D:\Assets need text extraction to wiki</div>
              <div style={{fontSize:10,color:'#eab308',marginTop:4,fontFamily:'monospace'}}>python D:\AUTOMATIC_WORKFLOWS\TRANSCRIPTION\extract_pdfs.py</div>
              <div style={{fontSize:9,color:'#555',marginTop:2}}>Extracts to D:\wiki\pdfs\ for knowledge base</div>
            </div>
            <div style={{...styles.suggestion,borderLeft:'3px solid #f97316'}}>
              <div>📊 <strong>Synthetic Marketer</strong> ready for content pipeline integration</div>
              <div style={{fontSize:10,color:'#f97316',marginTop:4,fontFamily:'monospace'}}>cd D:\PRODUCT-MATRIX\029-SAAS-V1-social-poster\synthetic-marketer && pnpm dev</div>
              <div style={{fontSize:9,color:'#555',marginTop:2}}>Wire to postiz-app for automated social scheduling</div>
            </div>
            <div style={{...styles.suggestion,borderLeft:'3px solid #ec4899'}}>
              <div>🧠 <strong>Fiction writing</strong> — hermes4-14b is your best local model</div>
              <div style={{fontSize:10,color:'#ec4899',marginTop:4,fontFamily:'monospace'}}>ollama run hermes4-14b "Write chapter 1 of..."</div>
              <div style={{fontSize:9,color:'#555',marginTop:2}}>10GB model, best creative quality. qwen3.5 for non-fiction/technical.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY LOG PAGE
// ============================================================
function ActivityLogPage() {
  const { data, loading } = useAutoFetch('/api/journal', 30000);
  const [filter, setFilter] = useState('');

  const entries = useMemo(() => {
    const all = Array.isArray(data) ? [...data].reverse() : [];
    if (!filter) return all;
    const q = filter.toLowerCase();
    return all.filter(e =>
      (e.timestamp||'').toLowerCase().includes(q) ||
      (e.agent||'').toLowerCase().includes(q) ||
      (e.message||'').toLowerCase().includes(q)
    );
  }, [data, filter]);

  return (
    <div>
      <h1 style={styles.pageTitle}>Activity Log</h1>
      <p style={styles.pageSubtitle}>Journal entries from all agents — auto-refreshes every 30s</p>
      <div style={styles.filterRow}>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filter by agent, message, or timestamp..." style={styles.searchInput} />
        <span style={{fontSize:11,color:'#555',alignSelf:'center'}}>{entries.length} entries</span>
      </div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th,width:180}}>Timestamp</th>
              <th style={{...styles.th,width:140}}>Agent</th>
              <th style={styles.th}>Message</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={3} style={{...styles.td,textAlign:'center',color:'#555'}}>Loading...</td></tr>}
            {!loading && entries.length === 0 && <tr><td colSpan={3} style={{...styles.td,textAlign:'center',color:'#555'}}>No entries found</td></tr>}
            {entries.map((e,i) => (
              <tr key={i} style={styles.tr}>
                <td style={{...styles.td,fontFamily:'monospace',fontSize:11,color:'#888'}}>{e.timestamp||''}</td>
                <td style={styles.td}>
                  <span style={{fontSize:11,fontWeight:600,color:AGENT_COLORS[e.agent]||'#888',background:(AGENT_COLORS[e.agent]||'#888')+'20',padding:'2px 8px',borderRadius:4}}>{e.agent||'unknown'}</span>
                </td>
                <td style={{...styles.td,fontSize:12}}>{e.message||''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// PORTS & PROCESSES PAGE
// ============================================================
function PortsPage() {
  const { data: ports, loading, refresh } = useAutoFetch('/api/ports', 10000);
  const { data: gpuData } = useAutoFetch('/api/gpu', 10000);
  const [killing, setKilling] = useState(null);

  function killProcess(pid) {
    if (!confirm(`Kill process PID ${pid}?`)) return;
    setKilling(pid);
    fetch(`/api/kill/${pid}`, { method: 'POST', headers: { 'X-Confirm': 'true' } })
      .then(() => { setKilling(null); refresh(); })
      .catch(() => setKilling(null));
  }

  const portList = Array.isArray(ports) ? ports : [];

  return (
    <div>
      <h1 style={styles.pageTitle}>Ports & Processes</h1>
      <p style={styles.pageSubtitle}>Active network listeners — auto-refreshes every 10s</p>

      {/* KILL ALL BUTTON */}
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <button onClick={() => {
          if (!confirm('Kill ALL listening ports and their processes? This will stop all services.')) return;
          (Array.isArray(ports) ? ports : []).forEach(p => {
            if (p.pid) fetch(`/api/kill/${p.pid}`, { method:'POST', headers:{'X-Confirm':'true'} });
          });
          setTimeout(refresh, 2000);
        }} style={{background:'#ef444420',border:'1px solid #ef444450',borderRadius:10,padding:'8px 16px',color:'#ef4444',fontSize:12,fontWeight:700,cursor:'pointer'}}>
          Kill All Ports & Processes
        </button>
        <button onClick={refresh} style={{background:'#3b82f620',border:'1px solid #3b82f650',borderRadius:10,padding:'8px 16px',color:'#3b82f6',fontSize:12,fontWeight:600,cursor:'pointer'}}>
          Refresh
        </button>
      </div>

      {/* GPU STATUS */}
      {gpuData && (
        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:16,border:'1px solid rgba(255,255,255,0.06)',marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>🎮 GPU Status</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr 1fr',gap:16,alignItems:'center'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:700,color: (gpuData.tempC||0)>80?'#ef4444':'#22c55e'}}>{gpuData.tempC||'—'}°C</div>
              <div style={{fontSize:10,color:'#888'}}>Temperature</div>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                <span style={{color:'#888'}}>VRAM Usage</span>
                <span style={{color:'#999'}}>{gpuData.vramUsedMB||0} / {gpuData.vramTotalMB||8192} MB ({gpuData.vramUsedPct||0}%)</span>
              </div>
              <div style={{height:12,background:'rgba(255,255,255,0.08)',borderRadius:10,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:10,width:`${gpuData.vramUsedPct||0}%`,background: (gpuData.vramUsedPct||0)>90?'#ef4444':(gpuData.vramUsedPct||0)>70?'#eab308':'#a855f7',transition:'width 0.5s'}}></div>
              </div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:700,color:'#3b82f6'}}>{gpuData.utilizationPct||0}%</div>
              <div style={{fontSize:10,color:'#888'}}>Utilization</div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Port</th>
              <th style={styles.th}>Process</th>
              <th style={styles.th}>PID</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} style={{...styles.td,textAlign:'center',color:'#555'}}>Loading...</td></tr>}
            {!loading && portList.length === 0 && <tr><td colSpan={4} style={{...styles.td,textAlign:'center',color:'#555'}}>No port data — start the API server</td></tr>}
            {portList.map((p,i) => {
              const isKnown = KNOWN_PORTS[p.port];
              return (
                <tr key={i} style={{...styles.tr, background: isKnown ? '#2a2a2a40' : 'transparent'}}>
                  <td style={styles.td}>
                    <span style={{fontWeight:700,fontSize:13}}>:{p.port}</span>
                    {isKnown && <span style={{fontSize:10,color:'#a855f7',marginLeft:8}}>{isKnown}</span>}
                  </td>
                  <td style={{...styles.td,fontFamily:'monospace',fontSize:12}}>{p.process||'—'}</td>
                  <td style={{...styles.td,fontFamily:'monospace',fontSize:12}}>{p.pid||'—'}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => killProcess(p.pid)}
                      disabled={killing === p.pid}
                      style={{...styles.actionBtn, background:'#ef444420',color:'#ef4444',border:'1px solid #ef444440',opacity:killing===p.pid?0.5:1}}
                    >
                      {killing === p.pid ? '...' : 'Kill'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// JOBS & PIPELINES PAGE
// ============================================================
function JobsPage() {
  const { data: jobsData } = useAutoFetch('/api/jobs', 10000);
  const { data: pipelineData } = useAutoFetch('/api/pipeline', 15000);
  const { data: progressData } = useAutoFetch('/api/progress', 5000);
  const { data: ingestedData } = useAutoFetch('/api/ingested', 10000);

  const jobs = Array.isArray(jobsData) ? jobsData : [];
  const ingested = Array.isArray(ingestedData) ? ingestedData : [];
  const pipeline = Array.isArray(pipelineData?.products) ? pipelineData.products : Array.isArray(pipelineData) ? pipelineData : [];
  const progress = progressData || {};
  const nimAccounts = pipelineData?.nimAccounts || [];

  const STAGE_KEYS = ['research','script','audio','video','page','publish'];

  function statusColor(status) {
    if (status === 'done') return '#22c55e';
    if (status === 'running') return '#eab308';
    if (status === 'failed') return '#ef4444';
    if (status === 'paused') return '#f97316';
    return '#555';
  }

  function StatusCell({ status, progressInfo }) {
    const color = statusColor(status);
    const isPulse = status === 'running';
    const isPaused = status === 'paused';
    return (
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
        <span style={{
          display:'inline-block',fontSize:10,fontWeight:600,padding:'2px 8px',borderRadius:4,
          background: color + '25', color,
          animation: isPulse ? 'pulse-running 1.5s ease-in-out infinite' : 'none',
        }}>
          {isPaused ? 'PAUSED' : status || 'pending'}
        </span>
        {progressInfo && progressInfo.percent > 0 && progressInfo.percent < 100 && (
          <div style={{width:'100%',height:3,background:'rgba(255,255,255,0.08)',borderRadius:2,marginTop:1}}>
            <div style={{height:'100%',borderRadius:2,width:`${progressInfo.percent}%`,background:color,transition:'width 0.5s'}}></div>
          </div>
        )}
      </div>
    );
  }

  // Pipeline summary stats
  const totalStages = pipeline.length * STAGE_KEYS.length;
  const doneStages = pipeline.reduce((c, p) => c + STAGE_KEYS.filter(s => (p.stages?.[s]) === 'done').length, 0);
  const runningStages = pipeline.reduce((c, p) => c + STAGE_KEYS.filter(s => (p.stages?.[s]) === 'running').length, 0);
  const failedStages = pipeline.reduce((c, p) => c + STAGE_KEYS.filter(s => (p.stages?.[s]) === 'failed').length, 0);
  const pausedStages = pipeline.reduce((c, p) => c + STAGE_KEYS.filter(s => (p.stages?.[s]) === 'paused').length, 0);
  const pipelinePct = totalStages ? Math.round((doneStages / totalStages) * 100) : 0;

  return (
    <div>
      <h1 style={styles.pageTitle}>Jobs & Pipelines</h1>
      <p style={styles.pageSubtitle}>GPU jobs, Clickbank pipeline status, and AI orchestration</p>

      {/* PIPELINE SUMMARY */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:24}}>
        {[
          { label: 'Overall', value: `${pipelinePct}%`, color: '#4F46E5' },
          { label: 'Done', value: doneStages, color: '#22c55e' },
          { label: 'Running', value: runningStages, color: '#eab308' },
          { label: 'Failed', value: failedStages, color: '#ef4444' },
          { label: 'Paused', value: pausedStages, color: '#f97316' },
        ].map((s, i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:12,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
            <div style={{fontSize:20,fontWeight:700,color:s.color}}>{s.value}</div>
            <div style={{fontSize:10,color:'#888',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* OVERALL PROGRESS BAR */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'#888',marginBottom:4}}>
          <span>Pipeline Progress</span>
          <span>{doneStages}/{totalStages} stages complete</span>
        </div>
        <div style={{height:8,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:4,width:`${pipelinePct}%`,background:'linear-gradient(90deg,#4F46E5,#7C3AED)',transition:'width 0.5s'}}></div>
        </div>
      </div>

      {/* NIM QUOTA ALERTS */}
      {nimAccounts.filter(a => a.key && (a.quotaUsed/a.quotaLimit) > 0.8).map((a, i) => {
        const pct = Math.round((a.quotaUsed/a.quotaLimit)*100);
        const critical = pct > 90;
        return (
          <div key={i} style={{background: critical ? '#ef444420' : '#eab30820', border: `1px solid ${critical?'#ef4444':'#eab308'}`, borderRadius:10, padding:'8px 12px', marginBottom:8, display:'flex', alignItems:'center', gap:8}}>
            <span style={{fontSize:16}}>{critical ? '🚨' : '⚠️'}</span>
            <span style={{fontSize:12,color: critical?'#ef4444':'#eab308',fontWeight:600}}>
              {a.label}: {pct}% quota used ({a.quotaUsed}/{a.quotaLimit}) — {critical ? 'Jobs will PAUSE when exhausted' : 'approaching limit'}
            </span>
          </div>
        );
      })}

      {/* GPU JOBS */}
      <div style={styles.sectionHeader}>GPU Jobs</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
        {jobs.length === 0 && <div style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:16,border:'1px solid rgba(255,255,255,0.06)',fontSize:12,color:'#555',textAlign:'center'}}>No running GPU jobs — fetch from /api/jobs</div>}
        {jobs.map((job,i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:12,border:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700}}>{job.name||'Unknown Job'}</div>
              <div style={{fontSize:10,color:'#888',fontFamily:'monospace'}}>PID: {job.pid||'—'} | Memory: {job.memoryMB ? `${job.memoryMB}MB` : '—'}</div>
            </div>
            <div style={{width:200}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,marginBottom:2}}>
                <span style={{color:'#888'}}>{job.progressPct != null ? `${job.progressPct}%` : '—'}</span>
                <span style={{color:'#666'}}>{job.eta||''}</span>
              </div>
              <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:3,width:`${job.progressPct||0}%`,background:'linear-gradient(90deg,#3b82f6,#a855f7)',transition:'width 0.5s'}}></div>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:4}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'#eab308',animation:'pulse-dot 1.5s ease-in-out infinite'}}></span>
              <span style={{fontSize:10,color:'#eab308'}}>running</span>
            </div>
          </div>
        ))}
      </div>

      {/* CLICKBANK PIPELINE */}
      <div style={styles.sectionHeader}>Clickbank Top 10 Pipeline</div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Product</th>
              {STAGE_KEYS.map(s => <th key={s} style={{...styles.th,textAlign:'center'}}>{s.charAt(0).toUpperCase()+s.slice(1)}</th>)}
              <th style={{...styles.th,textAlign:'center'}}>Model</th>
              <th style={{...styles.th,textAlign:'center'}}>Account</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.length === 0 && <tr><td colSpan={9} style={{...styles.td,textAlign:'center',color:'#555'}}>No pipeline data — fetch from /api/pipeline</td></tr>}
            {pipeline.map((row,i) => {
              const hasPaused = STAGE_KEYS.some(s => row.stages?.[s] === 'paused');
              return (
                <tr key={i} style={{...styles.tr, ...(hasPaused ? {background:'#f9731610'} : {})}}>
                  <td style={{...styles.td,fontWeight:600,fontSize:13}}>
                    {row.name||row.product||`Product ${i+1}`}
                    {row.lockedModel && <span style={{fontSize:8,color:'#555',marginLeft:4}} title="Model locked">🔒</span>}
                  </td>
                  {STAGE_KEYS.map(s => {
                    const progKey = `${row.id}.${s}`;
                    return (
                      <td key={s} style={{...styles.td,textAlign:'center'}}>
                        <StatusCell status={(row.stages && row.stages[s])||row[s]||'pending'} progressInfo={progress[progKey]} />
                      </td>
                    );
                  })}
                  <td style={{...styles.td,textAlign:'center'}}>
                    <span style={{fontSize:11,color:'#a855f7',fontWeight:600}}>{row.model||'—'}</span>
                  </td>
                  <td style={{...styles.td,textAlign:'center'}}>
                    <span style={{fontSize:11,color:'#3b82f6'}}>{row.account||'—'}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* INGESTED PROJECTS */}
      {ingested.length > 0 && (<>
      <div style={styles.sectionHeader}>Ingested Projects ({ingested.length})</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:12,marginBottom:24}}>
        {ingested.map((proj) => {
          const platformColors = { tiktok:'#ff0050', youtube:'#ff0000', clickbank:'#22c55e', web:'#3b82f6' };
          const platformIcons = { tiktok:'🎵', youtube:'▶️', clickbank:'💰', web:'🌐' };
          const color = platformColors[proj.platform] || '#888';
          return (
            <div key={proj.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:`1px solid #2a2a2a`,overflow:'hidden'}}>
              {/* Top accent bar */}
              <div style={{height:3,background:color}}></div>
              <div style={{padding:14}}>
                {/* Header */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                  <span style={{fontSize:20}}>{platformIcons[proj.platform]||'📦'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{proj.id}</div>
                    <div style={{fontSize:10,color:'#666',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{proj.url}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,color,background:color+'20',padding:'2px 8px',borderRadius:4}}>{proj.platform}</span>
                </div>

                {/* Progress bar */}
                <div style={{marginBottom:10}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'#888',marginBottom:3}}>
                    <span>{proj.stage}</span>
                    <span style={{color,fontWeight:600}}>{proj.progress}%</span>
                  </div>
                  <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:3,width:`${proj.progress}%`,background:`linear-gradient(90deg,${color},${color}aa)`,transition:'width 0.5s'}}></div>
                  </div>
                </div>

                {/* Step indicators */}
                <div style={{display:'flex',gap:4}}>
                  {(proj.steps||[]).map((step, si) => (
                    <div key={si} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <div style={{
                        width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:10,fontWeight:700,
                        background: step.done ? color+'30' : '#2a2a2a',
                        color: step.done ? color : '#555',
                        border: `2px solid ${step.done ? color : '#333'}`,
                      }}>
                        {step.done ? '✓' : si+1}
                      </div>
                      <span style={{fontSize:8,color: step.done ? '#ccc' : '#555',textTransform:'uppercase',letterSpacing:0.5}}>{step.name}</span>
                    </div>
                  ))}
                </div>

                {/* Created date */}
                {proj.created && <div style={{fontSize:9,color:'#444',marginTop:8,textAlign:'right'}}>{new Date(proj.created).toLocaleDateString()}</div>}
              </div>
            </div>
          );
        })}
      </div>
      </>)}

      {/* ORCHESTRATOR COMMANDS */}
      <div style={styles.sectionHeader}>Runner Commands</div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:24}}>
        {[
          { label: 'Run Next Stage', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js next', color: '#22c55e' },
          { label: 'Run All Pending', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js all', color: '#3b82f6' },
          { label: 'Generate Promo (Kimi)', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js promo', color: '#EC4899' },
          { label: 'Status Check', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js status', color: '#a855f7' },
        ].map((btn, i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'8px 12px',border:`1px solid ${btn.color}40`,cursor:'default'}}>
            <div style={{fontSize:12,fontWeight:600,color:btn.color,marginBottom:2}}>{btn.label}</div>
            <div style={{fontSize:9,color:'#666',fontFamily:'monospace'}}>{btn.cmd}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SHORTCUTS PAGE
// ============================================================
const AI_AGENTS = [
  { name: 'Claude Code', icon: '🟣', color: '#a855f7', cmd: 'cd <project-dir> && claude --dangerously-skip-permissions -p "your task"', desc: 'Anthropic CLI agent — code, files, git, shell', status: 'installed' },
  { name: 'Kimi', icon: '🔵', color: '#3b82f6', cmd: 'kimi --yolo -w <project-dir> -p "your task"', desc: 'Moonshot AI — creative writing, promo, marketing', status: 'installed' },
  { name: 'Gemini CLI', icon: '🟢', color: '#22c55e', cmd: 'gemini --yolo "your task here"', desc: 'Google CLI agent — research, analysis, multimodal', status: 'installed' },
  { name: 'Pi', icon: '🟠', color: '#f97316', cmd: 'pi --auto "your task here"', desc: 'Inflection AI — conversational, brainstorming', status: 'check' },
  { name: 'OpenCode', icon: '⚡', color: '#eab308', cmd: 'opencode --non-interactive --task "your task here"', desc: 'Open-source coding agent', status: 'installed' },
  { name: 'OpenClaude', icon: '🔮', color: '#8b5cf6', cmd: 'openclaude --auto-approve --prompt "your task here"', desc: 'Open-source Claude wrapper — autonomous mode', status: 'installed' },
  { name: 'OpenHands', icon: '🤲', color: '#ec4899', cmd: 'openhands run --auto "your task here"', desc: 'Autonomous coding agent — full sandbox', status: 'installed' },
  { name: 'Aider', icon: '🛠️', color: '#14b8a6', cmd: 'aider --yes-always --message "your task here"', desc: 'AI pair programmer — git-aware edits', status: 'installed' },
  { name: 'Cline', icon: '💎', color: '#06b6d4', cmd: 'cline --auto-approve --task "your task here"', desc: 'VS Code agent — autonomous coding', status: 'installed' },
];

function ShortcutsPage() {
  const [copied, setCopied] = useState(null);
  const copyCmd = (cmd, i) => { navigator.clipboard.writeText(cmd); setCopied(i); setTimeout(() => setCopied(null), 2000); };

  return (
    <div>
      <h1 style={styles.pageTitle}>Shortcuts</h1>
      <p style={styles.pageSubtitle}>Launch AI agents headlessly — no human confirmation, skip all permissions</p>

      <div style={{background:'#eab30815',border:'1px solid #eab30840',borderRadius:10,padding:'10px 14px',marginBottom:20,fontSize:11,color:'#eab308'}}>
        These commands run agents autonomously. They will read/write files, run shell commands, and make git commits without asking.
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {AI_AGENTS.map((agent, i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:`1px solid #2a2a2a`,borderLeft:`4px solid ${agent.color}`,padding:0,overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
              <span style={{fontSize:22,width:32,textAlign:'center'}}>{agent.icon}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                  <span style={{fontSize:14,fontWeight:700,color:agent.color}}>{agent.name}</span>
                  <span style={{fontSize:9,padding:'1px 6px',borderRadius:3,fontWeight:600,
                    background: agent.status==='installed' ? '#22c55e20' : '#eab30820',
                    color: agent.status==='installed' ? '#22c55e' : '#eab308',
                  }}>{agent.status}</span>
                </div>
                <div style={{fontSize:11,color:'#888'}}>{agent.desc}</div>
              </div>
              <button onClick={() => copyCmd(agent.cmd, i)} style={{
                background: copied===i ? '#22c55e20' : '#333', border:'1px solid rgba(255,255,255,0.1)', borderRadius:4, padding:'4px 10px',
                color: copied===i ? '#22c55e' : '#ccc', fontSize:10, cursor:'pointer', fontWeight:600, whiteSpace:'nowrap',
              }}>{copied===i ? 'Copied!' : 'Copy'}</button>
            </div>
            <div style={{background:'rgba(0,0,0,0.25)',padding:'8px 16px 8px 60px',borderTop:'1px solid rgba(255,255,255,0.04)',fontFamily:"'Cascadia Code','Fira Code',monospace",fontSize:11,color:'#4ade80',userSelect:'all',overflow:'auto',whiteSpace:'nowrap'}}>
              $ {agent.cmd}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.sectionHeader}>Quick Combos</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:8}}>
        {[
          { label: 'Research + Script (NIM)', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js all', color: '#3b82f6', desc: 'Run all pending Clickbank pipeline stages' },
          { label: 'Promo Batch (Kimi)', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js promo', color: '#ec4899', desc: 'Generate social/email/ads for all ready products' },
          { label: 'Transcribe All (GPU)', cmd: 'python D:\\AUTOMATIC_WORKFLOWS\\TRANSCRIPTION\\transcribe_all.py', color: '#22c55e', desc: 'Whisper batch — all media in D:\\Assets' },
          { label: 'Extract PDFs', cmd: 'python D:\\AUTOMATIC_WORKFLOWS\\PDF_EXTRACT\\extract_pdfs.py', color: '#f97316', desc: 'PyMuPDF extract text from all PDFs' },
          { label: 'Ingest URLs', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\WATCH_FOLDERS\\ingest_urls.js', color: '#a855f7', desc: 'Process .txt files with URLs into projects' },
          { label: 'Claude: Full Product', cmd: 'cd <project-dir> && claude --dangerously-skip-permissions -p "Read SOUL.md and research/prd.md. Build the MVP as a Next.js app. Output to src/."', color: '#8b5cf6', desc: 'End-to-end product build via Claude' },
          { label: 'Kimi: Full Product', cmd: 'kimi --yolo -w <project-dir> -p "Read research/prd.md and SOUL.md. Build the MVP as a Next.js app. Output to src/."', color: '#3b82f6', desc: 'End-to-end product build via Kimi' },
        ].map((combo, i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:12,border:`1px solid ${combo.color}30`,cursor:'pointer'}} onClick={() => copyCmd(combo.cmd, 100+i)}>
            <div style={{fontSize:12,fontWeight:700,color:combo.color,marginBottom:4}}>{combo.label} {copied===100+i && <span style={{color:'#22c55e',fontSize:10}}>Copied!</span>}</div>
            <div style={{fontSize:10,color:'#666',marginBottom:6}}>{combo.desc}</div>
            <div style={{fontSize:9,color:'#4ade80',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>$ {combo.cmd}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// TODO & LOG PAGE
// ============================================================
function TodoLogPage() {
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc-todos') || '[]'); } catch { return []; }
  });
  const [newTodo, setNewTodo] = useState('');
  const { data: journalData } = useAutoFetch('/api/journal', 10000);
  const claudeLog = (Array.isArray(journalData) ? journalData : []).filter(e => e.agent === 'claude' || e.agent === 'orchestrator');

  const saveTodos = (updated) => { setTodos(updated); localStorage.setItem('mc-todos', JSON.stringify(updated)); };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    saveTodos([{ id: Date.now(), text: newTodo.trim(), done: false, created: new Date().toISOString() }, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id) => saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id) => saveTodos(todos.filter(t => t.id !== id));
  const editTodo = (id, text) => saveTodos(todos.map(t => t.id === id ? { ...t, text } : t));

  const activeTodos = todos.filter(t => !t.done);
  const doneTodos = todos.filter(t => t.done);

  return (
    <div>
      <h1 style={styles.pageTitle}>Todo & Log</h1>
      <p style={styles.pageSubtitle}>Your task list + Claude's activity feed</p>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,height:'calc(100vh - 140px)'}}>
        {/* LEFT: TODO LIST */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTodo()}
              placeholder="Add a task..."
              style={{flex:1,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'10px 14px',color:'#e5e5e5',fontSize:14,outline:'none'}}
            />
            <button onClick={addTodo} style={{background:'#4F46E5',border:'none',borderRadius:10,padding:'0 18px',color:'white',fontSize:13,fontWeight:600,cursor:'pointer'}}>Add</button>
          </div>

          <div style={{flex:1,overflowY:'auto',paddingRight:4}}>
            {activeTodos.length === 0 && doneTodos.length === 0 && (
              <div style={{textAlign:'center',padding:40,color:'#555',fontSize:13}}>No tasks yet — add one above</div>
            )}

            {activeTodos.map(todo => (
              <div key={todo.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:10,marginBottom:6,border:'1px solid rgba(255,255,255,0.06)',transition:'all 0.2s'}}>
                <div onClick={() => toggleTodo(todo.id)} style={{width:22,height:22,borderRadius:'50%',border:'2px solid #555',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}></div>
                <input value={todo.text} onChange={e => editTodo(todo.id, e.target.value)}
                  style={{flex:1,background:'none',border:'none',color:'#e5e5e5',fontSize:14,outline:'none',fontFamily:'inherit'}} />
                <button onClick={() => deleteTodo(todo.id)} style={{background:'none',border:'none',color:'#555',cursor:'pointer',fontSize:16,padding:'0 4px',lineHeight:1}}>x</button>
              </div>
            ))}

            {doneTodos.length > 0 && (
              <div style={{fontSize:11,color:'#555',fontWeight:600,padding:'12px 0 6px',letterSpacing:0.5}}>COMPLETED ({doneTodos.length})</div>
            )}
            {doneTodos.map(todo => (
              <div key={todo.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'rgba(0,0,0,0.25)',borderRadius:10,marginBottom:4,border:'1px solid #222',opacity:0.6}}>
                <div onClick={() => toggleTodo(todo.id)} style={{width:22,height:22,borderRadius:'50%',background:'#4F46E5',cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'white',fontWeight:700}}>✓</div>
                <span style={{flex:1,fontSize:13,color:'#888',textDecoration:'line-through'}}>{todo.text}</span>
                <button onClick={() => deleteTodo(todo.id)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:14,padding:'0 4px'}}>x</button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CLAUDE LOG */}
        <div style={{display:'flex',flexDirection:'column',overflow:'hidden'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#a855f7',marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:8,height:8,borderRadius:'50%',background:'#a855f7',animation:'pulse-running 2s infinite'}}></span>
            Claude & Orchestrator Log
          </div>
          <div style={{flex:1,overflowY:'auto',background:'rgba(0,0,0,0.25)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)',padding:4}}>
            {claudeLog.length === 0 && <div style={{padding:20,textAlign:'center',color:'#555',fontSize:12}}>No log entries yet</div>}
            {claudeLog.map((entry, i) => (
              <div key={i} style={{display:'flex',gap:8,padding:'7px 10px',borderBottom:'1px solid #222',alignItems:'flex-start'}}>
                <span style={{width:6,height:6,borderRadius:'50%',background: entry.agent==='claude'?'#a855f7':'#3b82f6',flexShrink:0,marginTop:5}}></span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:'#ccc',lineHeight:1.4}}>{entry.message}</div>
                  <div style={{fontSize:9,color:'#555',marginTop:2}}>{entry.timestamp} — {entry.agent}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WORKFLOW ORG PAGE
// ============================================================
// ============================================================
// INGESTED PROJECTS PAGE
// ============================================================
function IngestedPage() {
  const { data: ingestedData, refresh } = useAutoFetch('/api/ingested', 10000);
  const { data: watchData, refresh: refreshWatch } = useAutoFetch('/api/watch-folder', 10000);
  const ingested = Array.isArray(ingestedData) ? ingestedData : [];
  const watchFiles = Array.isArray(watchData) ? watchData : [];
  const [expanded, setExpanded] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [promoting, setPromoting] = useState(null);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handlePromote = async (filename) => {
    if (promoting) return;
    setPromoting(filename);
    try {
      const res = await fetch('/api/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Confirm': 'true' },
        body: JSON.stringify({ filename })
      });
      if (res.ok) { refresh(); refreshWatch(); }
    } catch (e) { console.error(e); }
    setPromoting(null);
  };

  const handleDismissWatch = async (id) => {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/ingested/${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { 'X-Confirm': 'true' }
      });
      if (res.ok) refreshWatch();
    } catch (e) { console.error(e); }
    setDeleting(null);
  };

  const handleDelete = async (id) => {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/ingested/${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { 'X-Confirm': 'true' }
      });
      if (res.ok) refresh();
    } catch (e) { console.error(e); }
    setDeleting(null);
  };

  const platformColors = { tiktok:'#ff0050', youtube:'#ff0000', clickbank:'#22c55e', web:'#3b82f6' };
  const platformIcons = { tiktok:'🎵', youtube:'▶️', clickbank:'💰', web:'🌐' };

  return (
    <div>
      <h1 style={styles.pageTitle}>Ingested Projects</h1>
      <p style={styles.pageSubtitle}>URLs and media dropped into watch folders — review, promote, or dismiss</p>

      {ingested.length === 0 && (
        <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:32,textAlign:'center',color:'#666',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:32,marginBottom:8}}>📭</div>
          <div style={{fontSize:14}}>No ingested projects yet</div>
          <div style={{fontSize:11,marginTop:4}}>Drop URLs into <span style={{fontFamily:'monospace',color:'#888'}}>D:\AUTOMATIC_WORKFLOWS\WATCH_FOLDERS\</span> to start</div>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {ingested.map((proj) => {
          const color = platformColors[proj.platform] || '#888';
          const icon = platformIcons[proj.platform] || '📦';
          const isOpen = expanded[proj.id];
          return (
            <div key={proj.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:`1px solid ${isOpen ? color + '60' : '#2a2a2a'}`,overflow:'hidden',transition:'border-color 0.2s'}}>
              {/* Accent bar */}
              <div style={{height:3,background:color}}></div>

              {/* Header row — always visible, clickable */}
              <div onClick={() => toggle(proj.id)} style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:24}}>{icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontSize:14,fontWeight:700}}>{proj.id}</span>
                    <span style={{fontSize:10,fontWeight:600,color,background:color+'20',padding:'2px 8px',borderRadius:4}}>{proj.platform}</span>
                  </div>
                  <div style={{fontSize:10,color:'#666',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginTop:2}}>{proj.url}</div>
                </div>

                {/* Progress pill */}
                <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                  <div style={{width:80,height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:3,width:`${proj.progress}%`,background:`linear-gradient(90deg,${color},${color}aa)`,transition:'width 0.5s'}}></div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color,minWidth:32,textAlign:'right'}}>{proj.progress}%</span>
                </div>

                {/* Chevron */}
                <span style={{fontSize:14,color:'#555',transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s'}}>▼</span>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                  {/* Step indicators */}
                  <div style={{display:'flex',gap:6,padding:'14px 0'}}>
                    {(proj.steps||[]).map((step, si, arr) => (
                      <React.Fragment key={si}>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                          <div style={{
                            width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                            fontSize:12,fontWeight:700,
                            background: step.done ? color+'30' : '#2a2a2a',
                            color: step.done ? color : '#555',
                            border: `2px solid ${step.done ? color : '#333'}`,
                          }}>
                            {step.done ? '✓' : si+1}
                          </div>
                          <span style={{fontSize:9,color: step.done ? '#ccc' : '#555',textTransform:'uppercase',letterSpacing:0.5,fontWeight:600}}>{step.name}</span>
                        </div>
                        {si < arr.length - 1 && (
                          <div style={{display:'flex',alignItems:'center',flex:0.5,paddingBottom:18}}>
                            <div style={{height:2,width:'100%',background: step.done ? color+'50' : '#333',borderRadius:1}}></div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Info grid */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px'}}>
                      <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>STAGE</div>
                      <div style={{fontSize:12,color:'#ccc'}}>{proj.stage}</div>
                    </div>
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px'}}>
                      <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>CREATED</div>
                      <div style={{fontSize:12,color:'#ccc'}}>{proj.created ? new Date(proj.created).toLocaleString() : '—'}</div>
                    </div>
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px',gridColumn:'1/-1'}}>
                      <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>SOURCE URL</div>
                      <div style={{fontSize:11,color:color,fontFamily:'monospace',wordBreak:'break-all'}}>{proj.url}</div>
                    </div>
                    <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px',gridColumn:'1/-1'}}>
                      <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>LOCAL PATH</div>
                      <div style={{fontSize:11,color:'#888',fontFamily:'monospace'}}>D:\PRODUCT-MATRIX\{proj.id}</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`D:\\PRODUCT-MATRIX\\${proj.id}`); }}
                      style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 14px',color:'#ccc',fontSize:11,cursor:'pointer',fontWeight:600}}
                    >📋 Copy Path</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(proj.id); }}
                      style={{background: deleting===proj.id ? '#661a1a' : '#331a1a',border:'1px solid #662222',borderRadius:10,padding:'6px 14px',color:'#ff4444',fontSize:11,cursor:'pointer',fontWeight:600,opacity:deleting===proj.id?0.6:1}}
                    >{deleting===proj.id ? '⏳ Removing...' : '🗑️ Remove Card'}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* WATCH FOLDER FILES */}
      {watchFiles.length > 0 && (<>
        <div style={{fontSize:16,fontWeight:700,color:'#e5e5e5',marginTop:32,marginBottom:4}}>Watch Folder — PRDs & Ideas</div>
        <p style={{fontSize:11,color:'#666',marginBottom:12}}>Files in D:\AUTOMATIC_WORKFLOWS\WATCH_FOLDERS\ — promote to PRODUCT-MATRIX or dismiss</p>

        {/* Summary bar */}
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {[
            { label: 'PRDs', count: watchFiles.filter(f => f.type === 'prd').length, color: '#22c55e' },
            { label: 'Ideas', count: watchFiles.filter(f => f.type !== 'prd').length, color: '#3b82f6' },
            { label: 'Already Promoted', count: watchFiles.filter(f => f.promoted).length, color: '#a855f7' },
          ].map((s, i) => (
            <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,padding:'6px 12px',border:`1px solid ${s.color}30`,display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:18,fontWeight:800,color:s.color}}>{s.count}</span>
              <span style={{fontSize:10,color:'#888'}}>{s.label}</span>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {watchFiles.map((file) => {
            const color = file.type === 'prd' ? '#22c55e' : '#3b82f6';
            const isOpen = expanded[file.id];
            return (
              <div key={file.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:`1px solid ${isOpen ? color+'60' : '#2a2a2a'}`,overflow:'hidden',transition:'border-color 0.2s'}}>
                <div style={{height:3,background:color}}></div>
                <div onClick={() => toggle(file.id)} style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:20}}>{file.type === 'prd' ? '📋' : '💡'}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:13,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{file.title}</span>
                      <span style={{fontSize:9,fontWeight:600,color,background:color+'20',padding:'2px 6px',borderRadius:4,flexShrink:0}}>{file.type.toUpperCase()}</span>
                      {file.promoted && <span style={{fontSize:9,fontWeight:600,color:'#a855f7',background:'#a855f720',padding:'2px 6px',borderRadius:4,flexShrink:0}}>PROMOTED</span>}
                    </div>
                    <div style={{fontSize:10,color:'#555',fontFamily:'monospace',marginTop:2}}>{file.filename} · {file.sizeKB}KB</div>
                  </div>
                  <span style={{fontSize:14,color:'#555',transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s'}}>▼</span>
                </div>

                {isOpen && (
                  <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12,marginBottom:14}}>
                      <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px'}}>
                        <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>TYPE</div>
                        <div style={{fontSize:12,color:'#ccc'}}>{file.type === 'prd' ? 'Product Requirements Doc' : 'Research / Idea'}</div>
                      </div>
                      <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px'}}>
                        <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>SIZE</div>
                        <div style={{fontSize:12,color:'#ccc'}}>{file.sizeKB}KB</div>
                      </div>
                      <div style={{background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'8px 12px',gridColumn:'1/-1'}}>
                        <div style={{fontSize:9,color:'#666',fontWeight:600,marginBottom:2}}>SOURCE PATH</div>
                        <div style={{fontSize:11,color:'#888',fontFamily:'monospace',wordBreak:'break-all'}}>{file.source}</div>
                      </div>
                    </div>

                    <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file.source); }}
                        style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'6px 14px',color:'#ccc',fontSize:11,cursor:'pointer',fontWeight:600}}>
                        📋 Copy Path</button>
                      {!file.promoted && (
                        <button onClick={(e) => { e.stopPropagation(); handlePromote(file.filename); }}
                          style={{background:promoting===file.filename?'#1a3320':'#1a2e1a',border:'1px solid #22c55e50',borderRadius:10,padding:'6px 14px',color:'#22c55e',fontSize:11,cursor:'pointer',fontWeight:600,opacity:promoting===file.filename?0.6:1}}>
                          {promoting===file.filename ? '⏳ Promoting...' : '🚀 Promote to Pipeline'}</button>
                      )}
                      {file.promoted && (
                        <span style={{fontSize:11,color:'#a855f7',padding:'6px 14px',fontWeight:600}}>✅ In PRODUCT-MATRIX</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDismissWatch(file.id); }}
                        style={{background:'#331a1a',border:'1px solid #662222',borderRadius:10,padding:'6px 14px',color:'#ff4444',fontSize:11,cursor:'pointer',fontWeight:600,opacity:deleting===file.id?0.6:1}}>
                        {deleting===file.id ? '⏳...' : '🗑️ Dismiss'}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>)}
    </div>
  );
}

function WorkflowPage() {
  const nodeStyle = (color) => ({
    background: color + '15', border: `2px solid ${color}`, borderRadius: 10, padding: '10px 14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 110,
  });
  const connStyle = { width: 2, background: '#444', alignSelf: 'center' };
  const hConnStyle = { height: 2, background: '#444', flex: 1 };
  const arrow = (dir = 'down') => (
    <div style={{ display: 'flex', justifyContent: 'center', padding: dir === 'down' ? '4px 0' : '0 4px' }}>
      <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        ...(dir === 'down' ? { borderTop: '6px solid #666' } : {}),
        ...(dir === 'right' ? { borderLeft: '6px solid #666', borderRight: 'none' } : {}),
      }}></div>
    </div>
  );

  return (
    <div>
      <h1 style={styles.pageTitle}>Workflow Organization</h1>
      <p style={styles.pageSubtitle}>AI agent architecture and data flow</p>

      {/* ORCHESTRATOR LAYER */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:0,marginBottom:32}}>
        <div style={{...nodeStyle('#4F46E5'),minWidth:200,padding:'14px 20px'}}>
          <span style={{fontSize:10,color:'#888',fontWeight:600,letterSpacing:1}}>ORCHESTRATOR</span>
          <span style={{fontSize:18,fontWeight:800,color:'#4F46E5'}}>Claude Code</span>
          <span style={{fontSize:10,color:'#888'}}>runner.js + Mission Control</span>
        </div>
        {arrow()}
      </div>

      {/* AI TIER */}
      <div style={{background:'rgba(99,102,241,0.06)',borderRadius:12,border:'1px solid rgba(99,102,241,0.12)',padding:20,marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:700,color:'#888',letterSpacing:1,marginBottom:14,textAlign:'center'}}>AI AGENTS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
          {/* CLOUD AI */}
          <div>
            <div style={{fontSize:9,color:'#666',fontWeight:600,letterSpacing:1,marginBottom:8,textAlign:'center'}}>CLOUD APIs</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { name: 'NIM (llama-3.1-70b)', icon: '🟢', color: '#22c55e', role: 'Research, Scripts, Landing Pages', tag: '3 accounts' },
                { name: 'NIM (mistral-large)', icon: '🟢', color: '#22c55e', role: 'Research, Scripts, Pages', tag: 'alt model' },
                { name: 'Kimi', icon: '🔵', color: '#3b82f6', role: 'Promo, Social, Marketing', tag: 'free tier' },
                { name: 'Gemini CLI', icon: '💚', color: '#22c55e', role: 'Multimodal Analysis', tag: 'free tier' },
              ].map((a, i) => (
                <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'8px 10px',borderLeft:`3px solid ${a.color}`,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:14}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:a.color}}>{a.name}</div>
                    <div style={{fontSize:9,color:'#888'}}>{a.role}</div>
                  </div>
                  <span style={{fontSize:8,color:'#555',background:'rgba(255,255,255,0.06)',padding:'1px 5px',borderRadius:3}}>{a.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LOCAL AI */}
          <div>
            <div style={{fontSize:9,color:'#666',fontWeight:600,letterSpacing:1,marginBottom:8,textAlign:'center'}}>LOCAL (GPU)</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { name: 'Ollama hermes3', icon: '🟣', color: '#a855f7', role: 'Creative Writing, Fiction', tag: '4.7GB' },
                { name: 'Ollama qwen3.5', icon: '🔵', color: '#06b6d4', role: 'Reasoning, Code, Non-fiction', tag: '6.6GB' },
                { name: 'ComfyUI', icon: '🎨', color: '#ec4899', role: 'Image Generation, Branding', tag: '25GB models' },
                { name: 'faster-whisper', icon: '🎤', color: '#eab308', role: 'Audio/Video Transcription', tag: 'CUDA' },
              ].map((a, i) => (
                <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'8px 10px',borderLeft:`3px solid ${a.color}`,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:14}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:a.color}}>{a.name}</div>
                    <div style={{fontSize:9,color:'#888'}}>{a.role}</div>
                  </div>
                  <span style={{fontSize:8,color:'#555',background:'rgba(255,255,255,0.06)',padding:'1px 5px',borderRadius:3}}>{a.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CODING AGENTS */}
          <div>
            <div style={{fontSize:9,color:'#666',fontWeight:600,letterSpacing:1,marginBottom:8,textAlign:'center'}}>CODING AGENTS</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { name: 'OpenClaude', icon: '🔮', color: '#8b5cf6', role: 'Autonomous Claude Wrapper', tag: 'OSS' },
                { name: 'OpenHands', icon: '🤲', color: '#ec4899', role: 'Full Sandbox Agent', tag: 'OSS' },
                { name: 'Aider', icon: '🛠️', color: '#14b8a6', role: 'Git-aware Pair Programmer', tag: 'OSS' },
                { name: 'Cline', icon: '💎', color: '#06b6d4', role: 'VS Code Autonomous Agent', tag: 'OSS' },
                { name: 'OpenCode', icon: '⚡', color: '#eab308', role: 'Coding Agent', tag: 'OSS' },
              ].map((a, i) => (
                <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'8px 10px',borderLeft:`3px solid ${a.color}`,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:14}}>{a.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:a.color}}>{a.name}</div>
                    <div style={{fontSize:9,color:'#888'}}>{a.role}</div>
                  </div>
                  <span style={{fontSize:8,color:'#555',background:'rgba(255,255,255,0.06)',padding:'1px 5px',borderRadius:3}}>{a.tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3-MONITOR WORKFLOW */}
      <div style={{background:'rgba(99,102,241,0.06)',borderRadius:12,border:'1px solid rgba(99,102,241,0.12)',padding:20,marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:700,color:'#888',letterSpacing:1,marginBottom:14,textAlign:'center'}}>3-MONITOR EFFICIENCY LAYOUT</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
          {[
            { label: 'LEFT — Build & Code', color: '#3b82f6', apps: ['Fluent Terminal (Claude/Kimi CLI)', 'VS Code / Cursor', 'Kimi Desktop', 'Wave CLI'], tip: 'Run 2+ agents in tabs building different projects simultaneously' },
            { label: 'CENTER — Preview & Control', color: '#a855f7', apps: ['Browser (localhost previews)', 'Mission Control CRM (:3333)', 'ComfyUI (:8188)', 'OpenDesign'], tip: 'Live preview of what agents are building, approve/promote from CRM' },
            { label: 'RIGHT — Research & Monitor', color: '#22c55e', apps: ['Perplexity / Grok / Genspark', 'GPU Monitor (nvidia-smi)', 'Discord / Comms', 'Transcription progress'], tip: 'Research while builds run, monitor GPU utilization' },
          ].map((m, i) => (
            <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,borderTop:`3px solid ${m.color}`}}>
              <div style={{fontSize:12,fontWeight:700,color:m.color,marginBottom:8}}>{m.label}</div>
              {m.apps.map((a, j) => (
                <div key={j} style={{fontSize:11,color:'#ccc',padding:'2px 0'}}>• {a}</div>
              ))}
              <div style={{fontSize:9,color:'#888',marginTop:8,fontStyle:'italic'}}>{m.tip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NO-PERMISSIONS COMMANDS */}
      <div style={{background:'rgba(99,102,241,0.06)',borderRadius:12,border:'1px solid rgba(99,102,241,0.12)',padding:20,marginBottom:20}}>
        <div style={{fontSize:10,fontWeight:700,color:'#888',letterSpacing:1,marginBottom:14,textAlign:'center'}}>AUTONOMOUS AGENT COMMANDS — SKIP ALL PERMISSIONS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {[
            { agent: 'Claude Code', cmd: 'cd <project-dir> && claude --dangerously-skip-permissions -p "your task"', color: '#a855f7', icon: '🟣' },
            { agent: 'Kimi CLI', cmd: 'kimi --yolo -w <project-dir> -p "your task"', color: '#3b82f6', icon: '🔵' },
            { agent: 'Gemini CLI', cmd: 'gemini --yolo "your task"', color: '#22c55e', icon: '💚' },
            { agent: 'Codex CLI', cmd: 'codex --auto-approve "your task"', color: '#eab308', icon: '⚡' },
            { agent: 'Cline', cmd: 'cline --auto-approve --task "your task"', color: '#06b6d4', icon: '💎' },
            { agent: 'Aider', cmd: 'aider --yes-always --message "your task"', color: '#14b8a6', icon: '🛠️' },
            { agent: 'OpenHands', cmd: 'openhands run --auto "your task"', color: '#ec4899', icon: '🤲' },
            { agent: 'OpenClaude', cmd: 'openclaude --auto-approve --prompt "your task"', color: '#8b5cf6', icon: '🔮' },
            { agent: 'OpenCode', cmd: 'opencode --non-interactive --task "your task"', color: '#f97316', icon: '⚡' },
            { agent: 'Pi', cmd: 'pi --auto "your task"', color: '#f472b6', icon: '🟠' },
            { agent: 'Hermes', cmd: 'hermes run --auto "your task"', color: '#22d3ee', icon: '🪽' },
            { agent: 'DevSwarm', cmd: 'devswarm start --agents claude,kimi,gemini', color: '#FF9800', icon: '🐝' },
          ].map((a, i) => (
            <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'8px 12px',borderLeft:`3px solid ${a.color}`,cursor:'pointer'}}
              onClick={() => navigator.clipboard.writeText(a.cmd)}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:14}}>{a.icon}</span>
                <span style={{fontSize:11,fontWeight:700,color:a.color}}>{a.agent}</span>
              </div>
              <div style={{fontSize:9,color:'#aaa',fontFamily:'monospace',marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.cmd}</div>
              <div style={{fontSize:8,color:'#555',marginTop:3}}>Click to copy</div>
            </div>
          ))}
        </div>
      </div>

      {/* DATA FLOW */}
      <div style={{background:'rgba(99,102,241,0.06)',borderRadius:12,border:'1px solid rgba(99,102,241,0.12)',padding:20}}>
        <div style={{fontSize:10,fontWeight:700,color:'#888',letterSpacing:1,marginBottom:14,textAlign:'center'}}>DATA FLOW</div>
        <div style={{display:'flex',alignItems:'center',gap:0,justifyContent:'center',flexWrap:'wrap'}}>
          {[
            { label: 'Watch Folders', sub: 'D:\\Assets, URLs', color: '#f97316', icon: '📂' },
            { label: 'Ingest & Route', sub: 'watcher.ps1, ingest_urls.js', color: '#eab308', icon: '🔀' },
            { label: 'Pipeline Runner', sub: 'runner.js orchestrator', color: '#4F46E5', icon: '⚙️' },
            { label: 'AI Processing', sub: 'NIM / Kimi / Ollama / GPU', color: '#a855f7', icon: '🧠' },
            { label: 'Output', sub: 'PRODUCT-MATRIX, wiki', color: '#22c55e', icon: '📦' },
            { label: 'Publish', sub: 'Vercel, Clickbank, itch.io', color: '#3b82f6', icon: '🌐' },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,padding:'8px 12px'}}>
                <div style={{width:44,height:44,borderRadius:'50%',background:step.color+'20',border:`2px solid ${step.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{step.icon}</div>
                <div style={{fontSize:11,fontWeight:700,color:step.color,textAlign:'center'}}>{step.label}</div>
                <div style={{fontSize:9,color:'#666',textAlign:'center'}}>{step.sub}</div>
              </div>
              {i < arr.length - 1 && <div style={{fontSize:16,color:'#555',padding:'0 4px'}}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOCAL SETUP PAGE
// ============================================================
function LocalSetupPage() {
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const apps = [
    {
      id: 'powershell',
      name: 'PowerShell 7',
      icon: '⚡',
      color: '#2196F3',
      desc: 'Primary shell — automation, scripts, system commands',
      startup: [
        'Open via Start Menu or Win+X → Terminal',
        'pwsh launches PowerShell 7 (not Windows PowerShell 5)',
      ],
      commands: [
        { cmd: 'pwsh -NoProfile', desc: 'Launch without loading profile (faster)' },
        { cmd: 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned', desc: 'Allow local scripts to run' },
        { cmd: 'Get-Process | Sort CPU -Desc | Select -First 10', desc: 'Top 10 CPU processes' },
        { cmd: 'Get-NetTCPConnection -State Listen | Sort LocalPort', desc: 'List all listening ports' },
        { cmd: 'Start-Job { node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js all }', desc: 'Run pipeline in background' },
        { cmd: 'Invoke-RestMethod http://localhost:11434/api/tags', desc: 'Check Ollama models' },
      ],
    },
    {
      id: 'fluentterm',
      name: 'Fluent Terminal',
      icon: '🖥️',
      color: '#00BCD4',
      desc: 'Modern terminal emulator with tabs, themes, GPU rendering',
      startup: [
        'Launch from Start Menu → Fluent Terminal',
        'Set default shell to pwsh in Settings → Profiles',
      ],
      commands: [
        { cmd: 'Ctrl+T', desc: 'New tab' },
        { cmd: 'Ctrl+Shift+D', desc: 'Split pane vertically' },
        { cmd: 'Alt+1/2/3', desc: 'Switch between tabs' },
        { cmd: 'Ctrl+,', desc: 'Open settings' },
      ],
    },
    {
      id: 'devswarm',
      name: 'DevSwarm',
      icon: '🐝',
      color: '#FF9800',
      desc: 'Multi-agent dev orchestration — spawn parallel AI workers',
      startup: [
        'Open terminal in project directory',
        'devswarm init to set up config',
        'devswarm start to launch agent swarm',
      ],
      commands: [
        { cmd: 'devswarm init', desc: 'Initialize DevSwarm in current project' },
        { cmd: 'devswarm start', desc: 'Launch agent swarm' },
        { cmd: 'devswarm status', desc: 'Check running agents' },
        { cmd: 'devswarm stop', desc: 'Stop all agents' },
        { cmd: 'devswarm logs -f', desc: 'Follow agent logs in real-time' },
      ],
    },
    {
      id: 'aionui',
      name: 'AionUI',
      icon: '🧠',
      color: '#9C27B0',
      desc: 'AI-powered UI builder — generate interfaces from prompts',
      startup: [
        'Launch from Start Menu → AionUI',
        'Or run: aionui from terminal',
      ],
      commands: [
        { cmd: 'aionui', desc: 'Launch AionUI app' },
        { cmd: 'aionui create --template react', desc: 'Create new React project' },
        { cmd: 'aionui generate "dashboard with charts"', desc: 'Generate UI from prompt' },
        { cmd: 'aionui export --format next', desc: 'Export as Next.js project' },
      ],
    },
    {
      id: 'antigravity',
      name: 'Antigravity',
      icon: '🚀',
      color: '#E91E63',
      desc: 'Lightweight dev environment launcher and project manager',
      startup: [
        'Launch from Start Menu → Antigravity',
      ],
      commands: [
        { cmd: 'antigravity launch', desc: 'Open project launcher' },
        { cmd: 'antigravity workspace list', desc: 'List all workspaces' },
        { cmd: 'antigravity workspace open <name>', desc: 'Open a workspace' },
      ],
    },
    {
      id: 'gensparkclaw',
      name: 'Genspark Claw',
      icon: '⚙️',
      color: '#4CAF50',
      desc: 'AI agent browser — autonomous web research and task execution',
      startup: [
        'Launch from Start Menu → Genspark Claw',
        'Or open from system tray if running',
      ],
      commands: [
        { cmd: 'Open Genspark Claw → New Task', desc: 'Start autonomous research task' },
        { cmd: 'Ctrl+N', desc: 'New research session' },
        { cmd: 'Ctrl+Shift+E', desc: 'Export research results' },
      ],
    },
    {
      id: 'nimbalyst',
      name: 'Nimbalyst',
      icon: '📊',
      color: '#FF5722',
      desc: 'Analytics and performance monitoring for AI workloads',
      startup: [
        'Launch from Start Menu → Nimbalyst',
        'Or run: nimbalyst serve to start dashboard',
      ],
      commands: [
        { cmd: 'nimbalyst serve', desc: 'Start monitoring dashboard' },
        { cmd: 'nimbalyst report --last 24h', desc: 'Generate usage report' },
        { cmd: 'nimbalyst track <pid>', desc: 'Track specific process' },
        { cmd: 'nimbalyst gpu', desc: 'Show GPU utilization history' },
      ],
    },
    {
      id: 'paperclip',
      name: 'Paperclip',
      icon: '📎',
      color: '#795548',
      desc: 'Hermes Paperclip — AI knowledge graph and document processor',
      startup: [
        'cd D:\\Stagging\\aeternusvitaio\\project001-hermes-paperclip',
        'npm start to launch backend on port 4101',
      ],
      commands: [
        { cmd: 'cd D:\\Stagging\\aeternusvitaio\\project001-hermes-paperclip && npm start', desc: 'Start Paperclip server' },
        { cmd: 'curl http://localhost:4101/api/health', desc: 'Health check' },
        { cmd: 'curl http://localhost:4101/api/documents', desc: 'List indexed documents' },
        { cmd: 'curl -X POST http://localhost:4101/api/ingest -d @file.json', desc: 'Ingest a document' },
      ],
    },
    {
      id: 'claude',
      name: 'Claude Code',
      icon: '🟣',
      color: '#7C3AED',
      desc: 'Anthropic CLI agent — primary orchestrator for all projects',
      startup: [
        'Open any terminal',
        'claude to launch interactive mode',
        'claude --dangerously-skip-permissions for autonomous mode',
      ],
      commands: [
        { cmd: 'claude', desc: 'Launch Claude Code interactive' },
        { cmd: 'claude --dangerously-skip-permissions', desc: 'Full autonomous — no permission prompts' },
        { cmd: 'claude -p "task description"', desc: 'Run a one-shot task' },
        { cmd: 'claude --model opus', desc: 'Use Opus model' },
        { cmd: 'claude /cost', desc: 'Show session cost' },
        { cmd: 'claude /compact', desc: 'Compact conversation context' },
      ],
    },
    {
      id: 'openclaude',
      name: 'OpenClaude',
      icon: '🔮',
      color: '#8B5CF6',
      desc: 'Open-source Claude wrapper — autonomous coding agent',
      startup: [
        'cd to project directory',
        'openclaude --no-permissions to skip all confirmations',
      ],
      commands: [
        { cmd: 'openclaude', desc: 'Launch OpenClaude interactive' },
        { cmd: 'openclaude --no-permissions', desc: 'Skip all permission prompts' },
        { cmd: 'openclaude --task "build feature X"', desc: 'Run autonomous task' },
      ],
    },
    {
      id: 'openhands',
      name: 'OpenHands',
      icon: '🤲',
      color: '#EC4899',
      desc: 'Full sandbox agent — runs in Docker with file system access',
      startup: [
        'Ensure Docker Desktop is running',
        'openhands start to launch sandbox',
      ],
      commands: [
        { cmd: 'openhands start', desc: 'Launch OpenHands sandbox' },
        { cmd: 'openhands run "implement auth system"', desc: 'Run autonomous task in sandbox' },
        { cmd: 'openhands --workspace D:\\PRODUCT-MATRIX\\<project>', desc: 'Mount specific project' },
      ],
    },
    {
      id: 'kimi',
      name: 'Kimi CLI',
      icon: '🔵',
      color: '#3B82F6',
      desc: 'Moonshot AI — creative writing, promo content, marketing',
      startup: [
        'Open terminal',
        'kimi chat to start interactive session',
      ],
      commands: [
        { cmd: 'kimi chat', desc: 'Start interactive chat' },
        { cmd: 'kimi chat --no-permissions', desc: 'Skip permission prompts' },
        { cmd: 'kimi -p "write promo copy for X"', desc: 'One-shot content generation' },
      ],
    },
  ];

  const copyCmd = (cmd) => { navigator.clipboard.writeText(cmd); };

  return (
    <div>
      <h1 style={styles.pageTitle}>Local Setup</h1>
      <p style={styles.pageSubtitle}>Startup guides, commands, and workflow config for maximum efficiency</p>

      {/* Quick startup checklist */}
      <div style={{background:'#1a2332',borderRadius:10,border:'1px solid #2a3a4a',padding:16,marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:700,color:'#60a5fa',marginBottom:10}}>⚡ Daily Startup Sequence</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          {[
            { step: '1. Open Fluent Terminal', cmd: 'Start Menu → Fluent Terminal' },
            { step: '2. Start Ollama', cmd: 'ollama serve' },
            { step: '3. Start Mission Control API', cmd: 'cd D:\\_MISSION_CONTROL && node server.js' },
            { step: '4. Start CRM Dev Server', cmd: 'cd D:\\_MISSION_CONTROL && pnpm dev' },
            { step: '5. Launch Claude Code', cmd: 'claude --dangerously-skip-permissions' },
            { step: '6. Start Transcription Bot', cmd: 'python D:\\AUTOMATIC_WORKFLOWS\\TRANSCRIPTION\\transcribe.py' },
            { step: '7. Run Pipeline', cmd: 'node D:\\AUTOMATIC_WORKFLOWS\\ORCHESTRATOR\\runner.js all' },
            { step: '8. Open CRM Dashboard', cmd: 'http://localhost:3333' },
          ].map((s, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.05)',borderRadius:10,padding:'6px 10px',cursor:'pointer'}} onClick={() => copyCmd(s.cmd)}>
              <span style={{fontSize:10,color:'#60a5fa',fontWeight:700,minWidth:16}}>{i+1}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,fontWeight:600,color:'#ccc'}}>{s.step}</div>
                <div style={{fontSize:9,color:'#668',fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.cmd}</div>
              </div>
              <span style={{fontSize:10,color:'#445'}}>📋</span>
            </div>
          ))}
        </div>
      </div>

      {/* App cards */}
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {apps.map((app) => {
          const isOpen = expanded[app.id];
          return (
            <div key={app.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:`1px solid ${isOpen ? app.color + '50' : '#2a2a2a'}`,overflow:'hidden',transition:'border-color 0.2s'}}>
              {/* Header */}
              <div onClick={() => toggle(app.id)} style={{padding:'12px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:12,background:app.color+'20',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                  {app.icon}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:app.color}}>{app.name}</div>
                  <div style={{fontSize:11,color:'#888'}}>{app.desc}</div>
                </div>
                <span style={{fontSize:14,color:'#555',transform:isOpen?'rotate(180deg)':'rotate(0)',transition:'transform 0.2s'}}>▼</span>
              </div>

              {/* Expanded */}
              {isOpen && (
                <div style={{padding:'0 16px 16px',borderTop:'1px solid rgba(255,255,255,0.04)'}}>
                  {/* Startup steps */}
                  <div style={{marginTop:12,marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:700,color:'#888',letterSpacing:1,marginBottom:6}}>STARTUP</div>
                    {app.startup.map((step, i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                        <span style={{width:18,height:18,borderRadius:'50%',background:app.color+'20',color:app.color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{i+1}</span>
                        <span style={{fontSize:12,color:'#ccc'}}>{step}</span>
                      </div>
                    ))}
                  </div>

                  {/* Commands */}
                  <div style={{fontSize:10,fontWeight:700,color:'#888',letterSpacing:1,marginBottom:6}}>COMMANDS</div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {app.commands.map((c, i) => (
                      <div key={i} onClick={() => copyCmd(c.cmd)} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(0,0,0,0.25)',borderRadius:10,padding:'6px 10px',cursor:'pointer',border:'1px solid rgba(255,255,255,0.06)'}}>
                        <code style={{flex:1,fontSize:11,color:app.color,fontFamily:'monospace',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.cmd}</code>
                        <span style={{fontSize:10,color:'#555',flexShrink:0}}>📋</span>
                        <span style={{fontSize:10,color:'#666',flexShrink:0,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// STYLES — macOS-inspired dark theme
// ============================================================
// ============================================================
// TOP PROJECT — YouTube Kids Creator Empire
// ============================================================
function TopProjectPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc-top-project-checklist') || '{}'); } catch { return {}; }
  });
  const toggle = (key) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    localStorage.setItem('mc-top-project-checklist', JSON.stringify(updated));
  };
  const pct = (keys) => { const done = keys.filter(k => checklist[k]).length; return Math.round((done / keys.length) * 100); };

  const NICHES = [
    { name: 'GTA 5 Challenges', rpm: '$0.30-0.50', audience: 'Global teens', difficulty: 'Easy', tools: 'PC + screen recorder', example: 'Spider-Man vs Hulk obstacle courses' },
    { name: 'Toy Unboxing/Play', rpm: '$1.50-3.00', audience: 'Kids 3-8', difficulty: 'Easy', tools: 'Phone + $200 toys', example: 'Thomas & Friends train tracks' },
    { name: 'Minecraft Builds', rpm: '$0.80-1.50', audience: 'Kids 6-14', difficulty: 'Easy', tools: 'PC + screen recorder', example: '100 Days survival, mod showcases' },
  ];

  const PHASE_B = [
    { id: 'b1', phase: 'Setup', day: '1', task: 'Create 3 Gmail accounts + YouTube channels', time: '30min', status: 'todo' },
    { id: 'b2', phase: 'Setup', day: '1', task: 'Install OBS/screen recorder, set up recording profiles', time: '1hr', status: 'todo' },
    { id: 'b3', phase: 'Setup', day: '1', task: 'Channel art + logos via ComfyUI (3 sets)', time: '1hr', status: 'todo' },
    { id: 'b4', phase: 'Setup', day: '1', task: 'Channel descriptions, keywords, settings per Arti Creator Module 5', time: '30min', status: 'todo' },
    { id: 'b5', phase: 'Research', day: '2', task: 'Competitor analysis: top 5 channels per niche, RPM calc, content patterns', time: '3hr', status: 'todo' },
    { id: 'b6', phase: 'Research', day: '2', task: 'Content plan: 20 video titles + thumbnail concepts per niche (60 total)', time: '2hr', status: 'todo' },
    { id: 'b7', phase: 'Production', day: '3-5', task: 'Niche 1: Record 20 videos (GTA challenges, 10-15min each)', time: '8hr', status: 'todo' },
    { id: 'b8', phase: 'Production', day: '3-5', task: 'Niche 2: Record 20 videos (Toy play/unboxing)', time: '6hr', status: 'todo' },
    { id: 'b9', phase: 'Production', day: '3-5', task: 'Niche 3: Record 20 videos (Minecraft builds)', time: '8hr', status: 'todo' },
    { id: 'b10', phase: 'Editing', day: '6-8', task: 'Edit all 60 videos (batch edit, templates, jump cuts)', time: '12hr', status: 'todo' },
    { id: 'b11', phase: 'Editing', day: '6-8', task: 'Generate 60 thumbnails via ComfyUI batch workflow', time: '2hr', status: 'todo' },
    { id: 'b12', phase: 'Editing', day: '6-8', task: 'Write titles + descriptions + tags (SEO copy from competitors)', time: '2hr', status: 'todo' },
    { id: 'b13', phase: 'Launch', day: '9', task: 'Upload first 5 videos per channel (15 total), schedule daily uploads', time: '2hr', status: 'todo' },
    { id: 'b14', phase: 'Launch', day: '10-14', task: 'Daily upload 1 video per channel from queue', time: '30min/day', status: 'todo' },
    { id: 'b15', phase: 'Launch', day: '14', task: 'Analytics review: watch time, CTR, audience retention per Module 8', time: '1hr', status: 'todo' },
    { id: 'b16', phase: 'Optimize', day: '15-21', task: 'Adjust thumbnails + titles on underperforming videos', time: '2hr', status: 'todo' },
    { id: 'b17', phase: 'Optimize', day: '15-21', task: 'Record 10 more videos per channel based on analytics winners', time: '6hr', status: 'todo' },
    { id: 'b18', phase: 'Optimize', day: '21', task: 'Create 1-hour compilations from best performers', time: '3hr', status: 'todo' },
    { id: 'b19', phase: 'Monetize', day: '21-28', task: 'Apply for YouTube Partner Program (target: 1K subs + 4K watch hours)', time: '15min', status: 'todo' },
    { id: 'b20', phase: 'Monetize', day: '28-30', task: 'First revenue check, document results for course content', time: '1hr', status: 'todo' },
  ];

  const MONTH_PLAN = [
    { month: 1, phase: 'Launch & Prove', content: '60 videos across 3 channels', marketing: 'Organic YouTube SEO only', course: 'Document everything: screenshots, analytics, earnings', revenue: '$0-500 (monetization pending)' },
    { month: 2, phase: 'Scale & Document', content: '90 more videos (30/channel) + compilations', marketing: 'Cross-promote between channels, community posts', course: 'Record screen walkthroughs of your process', revenue: '$1,000-3,000' },
    { month: 3, phase: 'Prove Results', content: 'Maintain daily uploads, test 2 new niches', marketing: 'Start TikTok clips of your earnings/process', course: 'Draft course outline, record Module 1-3', revenue: '$2,000-5,000' },
    { month: 4, phase: 'Course Build', content: 'Hire first freelancer editor ($300/mo)', marketing: 'TikTok + Instagram Reels showing earnings proof', course: 'Record Modules 4-7, build Gumroad/ClickBank listing', revenue: '$3,000-8,000' },
    { month: 5, phase: 'Course Launch', content: 'Autopilot: freelancer handles 3 channels', marketing: 'Launch course: $97 price point, affiliate program', course: 'Finish Modules 8-10, sales page, email funnel', revenue: '$5,000-10,000 (YT) + $2,000-5,000 (course)' },
    { month: 6, phase: 'Scale Both', content: 'Add 2 more channels (5 total), hire 2nd editor', marketing: 'YouTube ads for course, affiliate outreach', course: 'Add upsell: Daily Niche Subscription ($47/mo)', revenue: '$8,000-15,000 + $5,000-10,000 (course)' },
    { month: 7, phase: 'Automate', content: 'Full team: 5 channels on autopilot', marketing: 'Podcast/interviews, guest on YT channels', course: 'Student success stories, update modules', revenue: '$10,000-20,000 + $8,000-15,000' },
    { month: 8, phase: 'Multiply', content: 'Test international channels (Spanish, Portuguese)', marketing: 'Webinar funnel, $297 premium tier', course: 'Add coaching upsell ($500/session)', revenue: '$15,000-25,000 + $10,000-20,000' },
    { month: 9, phase: 'Authority', content: '8-10 channels running, $20K+/mo from YT alone', marketing: 'Speaking at creator events, collaborations', course: 'Community/Discord ($19/mo recurring)', revenue: '$20,000-30,000 + $15,000-25,000' },
    { month: 10, phase: 'Empire', content: 'Systematize: SOPs for every role, hire VA', marketing: 'Paid ads at scale, retargeting', course: 'Annual bundle, Black Friday launch', revenue: '$25,000-35,000 + $20,000-30,000' },
    { month: 11, phase: 'Diversify', content: 'License content, brand deals, merch', marketing: 'Email list 10K+, nurture sequences', course: 'Second course: "Advanced YouTube Kids Empire"', revenue: '$30,000-50,000 combined' },
    { month: 12, phase: 'Exit/Scale', content: 'Portfolio of 10+ channels, some sellable', marketing: 'Full funnel: ads > webinar > course > coaching', course: 'Mastermind group ($2K/quarter)', revenue: '$40,000-80,000+ combined' },
  ];

  const CONTENT_CALENDAR = [
    { platform: 'YouTube (3 channels)', weekly: '21 videos (1/day/channel)', monthly: '90 videos', type: 'Kids/teen content per niche' },
    { platform: 'TikTok', weekly: '7 clips', monthly: '30 clips', type: 'Earnings proof, behind-scenes, tips' },
    { platform: 'Instagram Reels', weekly: '5 reels', monthly: '20 reels', type: 'Repurpose TikTok + lifestyle' },
    { platform: 'Twitter/X', weekly: '14 tweets', monthly: '60 tweets', type: 'Threads on YT growth, engagement' },
    { platform: 'Email List', weekly: '2 emails', monthly: '8 emails', type: 'Tips + case studies + course promo' },
    { platform: 'Blog/SEO', weekly: '1 post', monthly: '4 posts', type: '"How to make money on YouTube Kids" articles' },
  ];

  const tabs = [
    ['overview', 'Overview'],
    ['phaseB', 'Phase B: Execute'],
    ['12month', '12-Month Plan'],
    ['content', 'Content Calendar'],
    ['niches', 'Niche Intel'],
  ];

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6}}>
        <span style={{fontSize:28}}>👑</span>
        <div>
          <h1 style={{...styles.pageTitle, margin:0, color:'#eab308'}}>TOP PROJECT: YouTube Kids Creator Empire</h1>
          <p style={{...styles.pageSubtitle, margin:0}}>Option C — Execute + Document + Sell the Course | Priority #1</p>
        </div>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:20,marginTop:12}}>
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{background: activeTab===key ? '#eab308' : 'rgba(255,255,255,0.06)', border:'none', borderRadius:10, padding:'8px 16px', color: activeTab===key ? '#000' : '#888', fontSize:12, fontWeight:700, cursor:'pointer'}}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
            {[
              { label:'Target Month 1', value:'$1-3K', color:'#eab308', icon:'💰' },
              { label:'Target Month 6', value:'$15-25K', color:'#22c55e', icon:'📈' },
              { label:'Target Month 12', value:'$40-80K', color:'#a855f7', icon:'🚀' },
              { label:'Channels', value:'3→10', color:'#3b82f6', icon:'📺' },
            ].map((s,i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
                <div style={{fontSize:10,color:'#888',marginBottom:4}}>{s.icon} {s.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:s.color}}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{background:'rgba(234,179,8,0.06)',borderRadius:12,border:'1px solid rgba(234,179,8,0.15)',padding:20,marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:'#eab308',marginBottom:10}}>The Strategy</div>
            <div style={{fontSize:12,color:'#ccc',lineHeight:1.8}}>
              <strong>Step 1:</strong> Execute the Arti Creator framework — 3 niches, 20 videos each, daily uploads, monetize in 2-4 weeks.<br/>
              <strong>Step 2:</strong> Document everything — screenshots, analytics, earnings proof, process recordings.<br/>
              <strong>Step 3:</strong> Build your own course from real results — sell on ClickBank/Gumroad at $97.<br/>
              <strong>Step 4:</strong> Upsell a "Daily Niche Subscription" at $47/mo recurring.<br/>
              <strong>Step 5:</strong> Scale to 10 channels + autopilot team ($1,300/mo), sell course with proof of $25-50K/mo earnings.
            </div>
          </div>

          <div style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:20,marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:10}}>Your Advantages (Why You Win)</div>
            <div style={{fontSize:12,color:'#aaa',lineHeight:1.8}}>
              - <strong>ComfyUI pipeline</strong> — batch-generate thumbnails, channel art, promo images at zero cost<br/>
              - <strong>AI voiceover</strong> — Ollama + local TTS for narration-style videos<br/>
              - <strong>Agent swarm</strong> — Claude/Kimi/Gemini can script videos, write descriptions, SEO-optimize titles<br/>
              - <strong>Transcription library</strong> — 88K words of reverse-engineered course content for building your own<br/>
              - <strong>Automation stack</strong> — CRM tracks everything, auto-schedule uploads, analytics dashboard
            </div>
          </div>

          <div style={styles.sectionHeader}>What You Need To Do Right Now</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {[
              ['now1', 'Create 3 Gmail accounts (1 per niche channel)'],
              ['now2', 'Pick your 3 niches from the Niche Intel tab'],
              ['now3', 'Install OBS Studio + set up screen recording'],
              ['now4', 'Come back here and start Phase B checklist'],
            ].map(([key, text]) => (
              <div key={key} onClick={() => toggle(key)} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)',padding:'12px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${checklist[key] ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,background:checklist[key]?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#fff',fontWeight:700}}>{checklist[key]?'✓':''}</div>
                <span style={{fontSize:13,color:checklist[key]?'#888':'#e5e5ea',textDecoration:checklist[key]?'line-through':'none'}}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'phaseB' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:20}}>
            {['Setup','Research','Production','Editing','Launch','Optimize','Monetize'].map(phase => {
              const tasks = PHASE_B.filter(t => t.phase === phase);
              if (!tasks.length) return null;
              const keys = tasks.map(t => t.id);
              const p = pct(keys);
              return (
                <div key={phase} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:10,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
                  <div style={{fontSize:10,color:'#888',marginBottom:4}}>{phase}</div>
                  <div style={{fontSize:18,fontWeight:700,color:p===100?'#22c55e':'#eab308'}}>{p}%</div>
                </div>
              );
            }).filter(Boolean)}
          </div>

          <div style={{fontSize:12,color:'#888',marginBottom:12}}>Total estimated time: ~60 hours over 30 days | 2hr/day average</div>

          {['Setup','Research','Production','Editing','Launch','Optimize','Monetize'].map(phase => {
            const tasks = PHASE_B.filter(t => t.phase === phase);
            if (!tasks.length) return null;
            return (
              <div key={phase} style={{marginBottom:16}}>
                <div style={styles.sectionHeader}>{phase} (Day {tasks[0].day}{tasks[tasks.length-1].day !== tasks[0].day ? '-'+tasks[tasks.length-1].day.split('-').pop() : ''})</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {tasks.map(t => (
                    <div key={t.id} onClick={() => toggle(t.id)} style={{background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)',padding:'10px 14px',display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                      <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${checklist[t.id]?'#22c55e':'rgba(255,255,255,0.15)'}`,background:checklist[t.id]?'#22c55e':'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff',fontWeight:700}}>{checklist[t.id]?'✓':''}</div>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,color:checklist[t.id]?'#666':'#e5e5ea',textDecoration:checklist[t.id]?'line-through':'none'}}>{t.task}</span>
                      </div>
                      <span style={{fontSize:10,color:'#eab308',background:'#eab30815',padding:'2px 8px',borderRadius:4,whiteSpace:'nowrap'}}>Day {t.day}</span>
                      <span style={{fontSize:10,color:'#888',whiteSpace:'nowrap'}}>{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === '12month' && (
        <div>
          <div style={{fontSize:12,color:'#888',marginBottom:16}}>Combined YT revenue + course sales trajectory. Conservative estimates.</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {MONTH_PLAN.map((m, i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:10,background:'rgba(234,179,8,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#eab308'}}>M{m.month}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:'#fff'}}>{m.phase}</div>
                    <div style={{fontSize:11,color:'#22c55e',fontWeight:600}}>{m.revenue}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,fontSize:11}}>
                  <div><span style={{color:'#888'}}>Content: </span><span style={{color:'#ccc'}}>{m.content}</span></div>
                  <div><span style={{color:'#888'}}>Marketing: </span><span style={{color:'#ccc'}}>{m.marketing}</span></div>
                  <div><span style={{color:'#888'}}>Course: </span><span style={{color:'#ccc'}}>{m.course}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div>
          <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:12}}>Weekly Content Output</div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
            {CONTENT_CALENDAR.map((c, i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:'12px 16px',display:'grid',gridTemplateColumns:'200px 100px 100px 1fr',alignItems:'center',gap:12}}>
                <span style={{fontSize:13,fontWeight:600,color:'#e5e5ea'}}>{c.platform}</span>
                <span style={{fontSize:11,color:'#eab308'}}>{c.weekly}</span>
                <span style={{fontSize:11,color:'#22c55e'}}>{c.monthly}</span>
                <span style={{fontSize:11,color:'#888'}}>{c.type}</span>
              </div>
            ))}
          </div>
          <div style={{background:'rgba(234,179,8,0.06)',borderRadius:12,border:'1px solid rgba(234,179,8,0.12)',padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#eab308',marginBottom:8}}>Total Monthly Output</div>
            <div style={{fontSize:12,color:'#ccc'}}>90 YT videos + 30 TikToks + 20 Reels + 60 Tweets + 8 Emails + 4 Blog posts = <strong style={{color:'#22c55e'}}>212 pieces/month</strong></div>
            <div style={{fontSize:11,color:'#888',marginTop:6}}>With AI automation (Claude scripts, ComfyUI thumbnails, batch scheduling): ~3-4 hrs/day</div>
          </div>
        </div>
      )}

      {activeTab === 'niches' && (
        <div>
          <div style={{fontSize:14,fontWeight:700,color:'#fff',marginBottom:12}}>3 Starter Niches (from Arti Creator 33-Niche List)</div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {NICHES.map((n, i) => (
              <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:16}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                  <div style={{width:32,height:32,borderRadius:8,background:'rgba(234,179,8,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#eab308'}}>{'#'+(i+1)}</div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:'#fff'}}>{n.name}</div>
                    <div style={{fontSize:11,color:'#888'}}>Example: {n.example}</div>
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                  <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:8,textAlign:'center'}}>
                    <div style={{fontSize:9,color:'#888'}}>RPM</div>
                    <div style={{fontSize:13,fontWeight:700,color:'#22c55e'}}>{n.rpm}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:8,textAlign:'center'}}>
                    <div style={{fontSize:9,color:'#888'}}>Audience</div>
                    <div style={{fontSize:11,fontWeight:600,color:'#3b82f6'}}>{n.audience}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:8,textAlign:'center'}}>
                    <div style={{fontSize:9,color:'#888'}}>Difficulty</div>
                    <div style={{fontSize:11,fontWeight:600,color:'#eab308'}}>{n.difficulty}</div>
                  </div>
                  <div style={{background:'rgba(0,0,0,0.2)',borderRadius:8,padding:8,textAlign:'center'}}>
                    <div style={{fontSize:9,color:'#888'}}>Tools</div>
                    <div style={{fontSize:11,fontWeight:600,color:'#a855f7'}}>{n.tools}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:16,background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:16}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:8}}>Niche Selection Criteria (15-7-7 Formula)</div>
            <div style={{fontSize:12,color:'#aaa',lineHeight:1.8}}>
              <strong>15:</strong> Find 15 competitor channels in the niche<br/>
              <strong>7:</strong> At least 7 should have 10K+ subs gained in last 6 months<br/>
              <strong>7:</strong> At least 7 videos from new channels should have 100K+ views<br/>
              If a niche passes all 3 checks, it is proven profitable and ready to enter.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PROMPT FACTORY
// ============================================================
function PromptFactoryPage() {
  const [activeProject, setActiveProject] = useState('133');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const storageKey = 'promptFactory_done';
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(done)); }, [done]);
  const toggle = (key) => setDone(p => ({...p, [key]: !p[key]}));
  const copyPrompt = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const PROJECTS = {
    '133': {
      name: 'Cognitive Distortion Cards',
      path: 'D:\\PRODUCT-MATRIX\\133-PROD-V1-cognitive-distortion-cards',
      style: 'Pixar-style 3D cartoon illustration, soft matte render, rounded smooth shapes, warm cinematic lighting, shallow depth of field, muted pastel background gradient, cute but professional, single centered scene, no text or words anywhere in the image, portrait 3:4 aspect ratio',
      prompts: [
        ['All-or-Nothing Thinking', 'A cute cartoon character standing at a fork in the road, one path is pure black and one is pure white, they look confused while ignoring a beautiful colorful rainbow path in the middle'],
        ['Overgeneralization', 'A sad cartoon character holding one tiny rain cloud above their head, imagining the entire sky filled with storm clouds behind them'],
        ['Mental Filter', 'A cartoon character looking through dark-tinted glasses at a beautiful garden, seeing only one wilted flower while dozens of bright flowers bloom around them'],
        ['Disqualifying the Positive', 'A cartoon character casually tossing a shiny gold trophy into a trash can while looking bored, surrounded by scattered medals and ribbons on the floor'],
        ['Mind Reading', 'A worried cartoon character with angry-face thought bubbles floating above their head, while the actual people around them are smiling and waving happily'],
        ['Fortune Telling', 'A cartoon character peering into a crystal ball that shows dark storm clouds, while behind them a beautiful sunny window shows blue skies and rainbows'],
        ['Catastrophizing', 'A cartoon character looking through a giant magnifying glass at a tiny crack in a cute teacup, the crack appears enormous and scary through the lens'],
        ['Minimization', 'A cartoon character holding a huge sparkling diamond but squinting at it dismissively, a tiny thought bubble shows them seeing it as a plain pebble'],
        ['Emotional Reasoning', 'A cartoon character wearing heart-shaped glasses that make a perfectly straight road look wobbly and scary, they look nervous while others walk the path happily'],
        ['Should Statements', 'A frustrated cartoon character holding a rigid ruler trying to measure a flowing curvy river, the ruler is cracking and bending'],
        ['Labeling', 'A sad cartoon character covered head to toe in colorful sticky notes and labels, their real smiling face barely visible underneath all the tags'],
        ['Personalization', 'A cartoon character standing alone under a single rain cloud spotlight while everyone around them enjoys sunshine, they point at themselves confused'],
        ['Blame', 'A cartoon character pointing one finger forward accusingly, while their shadow shows five fingers pointing back at themselves'],
        ['Always Being Right', 'A stubborn cartoon character building a tall brick wall while a beautiful bridge beside them crumbles from neglect, they look proud of their wall'],
        ['Fallacy of Fairness', 'A cartoon character desperately trying to balance a golden scale on a hilariously tilted floor, everything keeps sliding'],
        ['Fallacy of Change', 'A cartoon character enthusiastically watering a stone statue with a watering can, expecting flowers to sprout from its head'],
        ['Global Labeling', 'A cartoon character looking at one slightly burnt cookie on a tray of perfect cookies, a giant banner above reads WORST BAKER with an arrow pointing at them'],
        ['Heavens Reward Fallacy', 'A cartoon character feeding golden coins of good deeds into a gumball machine, tapping their foot impatiently waiting for a prize to come out'],
        ['Control Fallacy External', 'A cute cartoon puppet dangling on strings, looking up at the puppet controller with big sad helpless eyes'],
        ['Control Fallacy Internal', 'A tiny cartoon character struggling to hold up an enormous globe on their shoulders, sweating and straining, while other characters nearby relax freely'],
        ['Selective Abstraction', 'A cartoon character with a magnifying glass zoomed in on one red X mark on a page full of gold stars, ignoring all the stars completely'],
        ['Polarized Thinking', 'A cartoon character standing next to a light switch that only has ON and OFF, looking confused in a room that clearly needs a dimmer'],
        ['Comparison Trap', 'Two cartoon plants side by side — one thriving in sunshine with rich soil, one in shade — a character measures both with the same ruler looking disappointed'],
        ['Negativity Bias', 'A cartoon character with laser-focused eyes staring at one bruised apple in a huge basket overflowing with 99 perfect shiny red apples'],
        ['Sunk Cost Fallacy', 'A cartoon character digging deeper and deeper into a hole with a shovel, while a bright ladder sits right next to the hole untouched'],
        ['Confirmation Bias', 'A cartoon character holding a big magnet that only attracts red puzzle pieces, while blue and green pieces fly away ignored'],
        ['Anchoring Bias', 'A cartoon character chained to a giant anchor shaped like a price tag, while better deals float past them on little boats'],
        ['Availability Heuristic', 'A scared cartoon character reading a giant newspaper headline about sharks while ignoring a tiny footnote showing vending machines are more dangerous'],
        ['Dunning-Kruger Effect', 'A cartoon character planting a victory flag on a tiny molehill and celebrating, completely unaware of a massive mountain range behind them'],
        ['Hindsight Bias', 'A cartoon character looking smugly into a rear-view mirror with a thought bubble showing a checkmark, while the road ahead through the windshield is completely foggy'],
        ['Spotlight Effect', 'A cartoon character with a tiny coffee stain on their shirt imagining a giant stadium spotlight beam on them, while surrounding characters walk past not noticing at all'],
        ['Planning Fallacy', 'A cartoon character holding a tiny hourglass next to an absurdly long to-do list scroll that unrolls off the table and across the floor'],
        ['Status Quo Bias', 'A cartoon character sitting comfortably in a cozy old armchair that is blocking the doorway to a beautiful bright sunny garden outside'],
        ['Loss Aversion', 'A cartoon character gripping one small coin with both hands desperately, while a pile of golden coins sits just slightly out of reach behind them'],
        ['Groupthink', 'A flock of cute cartoon birds all flying in one direction off a cliff, while one bird at the back sees the correct safe path but follows the group anyway'],
        ['Halo Effect', 'A plain cartoon muffin wearing a glowing golden halo, surrounded by admiring characters who see it as a magnificent cake'],
        ['Horn Effect', 'A friendly cartoon character with silly little devil horns casting a scary monster shadow on the wall behind them, other characters look frightened at the shadow'],
        ['Just-World Fallacy', 'A cartoon character at a chalkboard drawing a neat equation showing good person equals good outcomes, while the reality around them is chaotic and messy'],
        ['Reactive Devaluation', 'A cartoon character pushing away a beautifully wrapped gift box with a suspicious look, only because they dislike the character offering it'],
        ['Zero-Sum Thinking', 'A cartoon character fiercely guarding one pie on a table, while behind them an oven overflows with infinite freshly baked pies they cannot see'],
        ['Appeal to Authority', 'A cartoon character in an oversized lab coat confidently recommending ice cream as medicine, a crowd of characters nodding and taking notes'],
        ['Bandwagon Effect', 'A line of cartoon characters happily running toward a cliff edge following each other, while one hesitant character at the back peeks over nervously'],
        ['Framing Effect', 'Two identical glasses of water side by side — one with a golden sparkly label reading HALF FULL, the other with a gray gloomy label reading HALF EMPTY'],
        ['Decoy Effect', 'Three cartoon popcorn boxes in a row — tiny, medium that is almost the same size but way more expensive, and large — cartoon arrows nudging a character toward the large'],
        ['Peak-End Rule', 'A cartoon character watching a movie reel — the boring middle frames are gray and small while the dramatic ending frame is huge colorful and exciting, they give it five stars'],
        ['Recency Bias', 'A cartoon timeline where tiny recent events appear as giant blocks and huge important older events shrink to tiny dots in the distance'],
        ['Survivorship Bias', 'Three cartoon winners standing proudly on a podium in spotlight, while below them in shadow hundreds of fallen participants are invisible and forgotten'],
        ['Curse of Knowledge', 'A cartoon professor enthusiastically writing complex equations on a chalkboard while a confused toddler character stares up with question marks floating around their head'],
        ['Fundamental Attribution Error', 'A cartoon character tripping on a hidden sidewalk crack while a nearby observer character thinks they are just clumsy, thought bubble shows a klutz label'],
        ['Actor-Observer Bias', 'A split-screen cartoon — left side shows a character blaming an icy road for their fall, right side shows the same character calling someone else clumsy for the identical fall'],
        ['Emotional Reasoning Bonus', 'A cartoon character reading a thermometer shaped like a heart that shows DANGER, while the actual sunny weather outside the window is perfectly calm and pleasant'],
        ['Catastrophic Thinking Bonus', 'A row of cartoon dominoes getting progressively bigger — the first tiny one is labeled oops and the last enormous one is labeled THE END, a worried character watches'],
      ],
      videoPrompts: [
        ['Hook — Card Reveal', '10 second cinematic video. A hand slowly fans out a deck of beautifully illustrated flashcards on a dark wooden desk. Camera slowly pushes in. Dramatic soft lighting from the side. Cards have colorful psychology-themed illustrations. Shallow depth of field. Moody, premium product feel.'],
        ['Problem — Racing Thoughts', '10 second video. Close-up of a person sitting at a desk, head in hands, surrounded by swirling transparent thought bubbles with negative words. Bubbles multiply and spin faster. Dark moody lighting, slight camera shake. Cinematic anxiety visualization.'],
        ['Solution — Card Pick', '10 second video. A calm hand reaches into a spread of flashcards and picks one up. As the card lifts, warm golden light emanates from it. The surrounding darkness fades to soft warm tones. Smooth slow motion. Therapeutic calming transition.'],
        ['Benefit — Aha Moment', '10 second video. Close-up of a persons face transitioning from confused frown to a gentle smile of understanding. Soft natural window light. Background subtly shifts from gray to warm. Cinematic shallow depth of field. Peaceful realization moment.'],
        ['Social Proof — Desk Setup', '10 second video. Top-down shot of a beautiful minimalist desk. A hand places the cognitive distortion card deck next to a journal, coffee cup, and pen. Morning sunlight streams across the desk. Cozy productive aesthetic. Slow deliberate movements.'],
        ['Lifestyle — Morning Routine', '10 second video. Person sitting cross-legged on a cozy floor cushion, reading a flashcard with a warm drink beside them. Sunrise light flooding through window. Plants in background. Calm morning ritual aesthetic. Gentle camera drift.'],
        ['Urgency — Scrolling Cards', '10 second video. Rapid montage of flashcard fronts flipping one after another, each showing a different colorful illustration. Speed increases then freezes on one dramatic card. Dark background, cards illuminated. Punchy energetic edit feel.'],
        ['Testimonial Visual — Journal', '10 second video. Close-up of someone writing in a journal next to the card deck. They pause, pick up a card, read it, nod, and write more. Warm lamp light. Intimate personal growth moment. Soft focus background.'],
        ['CTA — Unboxing Digital', '10 second video. A tablet screen showing a PDF downloading, then the first page of beautiful flashcards appearing. Finger swipes through several cards. Each card pops with color against the screen. Clean modern tech aesthetic.'],
        ['Outro — Full Spread', '10 second video. Overhead cinematic shot of all 52 cards laid out in a beautiful grid pattern on a large dark surface. Camera slowly pulls up and back revealing the full collection. Dramatic reveal. Professional product photography feel.'],
      ],
    },
    '134': {
      name: 'Mind Healing Meditation Cards',
      path: 'D:\\PRODUCT-MATRIX\\134-PROD-V1-mind-healing-meditation-cards',
      style: 'Digital illustration, dreamy watercolor painting style with soft glowing light, zen and peaceful atmosphere, pastel colors (sage green, lavender, warm sand, sky blue), beautiful detailed nature scene, no text or words anywhere in the image, portrait orientation 3.5x5 ratio',
      prompts: [
        ['Box Breathing', 'A perfect square made of soft glowing light, four sides pulsing gently in sequence, surrounded by calm blue mist'],
        ['4-7-8 Relaxation Breath', 'A crescent moon over still water, three gentle ripples expanding outward in golden ratios'],
        ['Alternate Nostril Breathing', 'A yin-yang symbol made of two flowing air streams, one warm gold one cool silver, intertwining'],
        ['Belly Breathing Reset', 'A calm Buddha-like belly gently rising like a soft hill, with a tiny flower growing on top'],
        ['Ocean Breath Ujjayi', 'A gentle ocean wave curling in slow motion, mist rising like breath, sunset colors'],
        ['Energizing Breath', 'A sunrise bursting from between mountain peaks with rays of golden energy streaming outward'],
        ['Humming Bee Breath', 'A single bumblebee hovering over a lavender flower, concentric sound waves radiating outward softly'],
        ['Straw Breathing', 'A delicate reed in a still pond, a single bubble rising from it into peaceful sky'],
        ['Triangle Breath', 'A soft glowing equilateral triangle floating above a misty lake, each side a different pastel shade'],
        ['Extended Exhale', 'A long flowing ribbon of air unfurling gracefully from pursed lips into a garden of flowers'],
        ['Breath Counting', 'Ten smooth river stones in a line, each glowing softly in sequence, reflected in still water'],
        ['Morning Wake-Up Breath', 'A window opening to a dewy garden at dawn, golden light streaming in with visible breath mist'],
        ['Sleep Preparation Breath', 'A candle flame slowly dimming to a soft ember on a bedside table, stars visible through window'],
        ['Full Body Scan', 'A translucent human silhouette with a gentle warm light scanning from head to toe like a peaceful aurora'],
        ['Progressive Muscle Relaxation', 'A tightly wound rope gradually unraveling into soft silk threads floating freely'],
        ['Hand Warming Visualization', 'Two cupped hands holding a warm glowing orb of soft amber light, gentle steam rising'],
        ['Tension Release Shake', 'A tree in autumn gently shaking its leaves free, leaves floating down peacefully'],
        ['Jaw and Face Release', 'A serene face sculpture with tension lines dissolving into smooth flowing water'],
        ['Shoulder Drop Reset', 'Mountains that were sharp and jagged slowly softening into gentle rolling hills'],
        ['Grounding Through Feet', 'Bare feet on rich earth with gentle roots growing down, wildflowers around the ankles'],
        ['Body Gratitude Scan', 'A human silhouette filled with tiny glowing stars, each representing a body part, soft constellation'],
        ['Pain Observation', 'A calm eye observing a small flame without flinching, the flame reflected peacefully in a still pupil'],
        ['Heartbeat Awareness', 'A single heart gently pulsing with concentric rings of soft pink light radiating outward'],
        ['Spine Lengthening', 'A bamboo stalk growing tall and straight toward light, flexible and strong, leaves unfurling'],
        ['Full Body Softening', 'Ice sculpture of a person slowly melting into a warm pool, peaceful expression, steam rising gently'],
        ['Sleep Body Scan', 'A cozy bed seen from above with a gentle wave of deep blue light washing over it head to toe'],
        ['5-4-3-2-1 Senses', 'Five floating orbs — eye, ear, hand, nose, tongue — each glowing a different soft color around a centered figure'],
        ['Mindful Eating', 'A single raisin on a zen plate, impossibly detailed, light catching every wrinkle and texture'],
        ['Walking Meditation', 'Footprints in wet sand on a peaceful beach, each print glowing softly, waves gently lapping'],
        ['Sound Awareness', 'Concentric ripples in a still pond from a single falling petal, representing sound waves'],
        ['Color Spotting', 'A grayscale room where one red flower stands out vibrantly in the corner'],
        ['Gratitude Flash', 'Three small candles being lit in sequence, each flame a different warm color, soft darkness around'],
        ['Present Moment Anchor', 'An anchor made of flowers resting gently on the ocean floor in crystal clear water'],
        ['Mindful Hand Wash', 'Hands under flowing water with each droplet captured like tiny diamonds, soap bubbles reflecting rainbows'],
        ['Sky Gazing', 'A person lying in grass looking up at vast open sky, single cloud drifting, infinite blue'],
        ['Texture Touch', 'A hand gently running fingers across tree bark, moss, smooth stone, and silk — four textures in quadrants'],
        ['Taste Meditation', 'A single clear glass of water catching sunlight, refracting rainbows, a drop falling in slow motion'],
        ['Mindful Listening', 'Two people in conversation with visible soft sound waves flowing between them like gentle ribbons'],
        ['Safe Place Visualization', 'A cozy treehouse nestled in a massive old oak, warm lantern glow, surrounded by fireflies'],
        ['Mountain Meditation', 'A single majestic mountain at dawn, perfectly still, snow-capped peak catching first golden light'],
        ['Lake Meditation', 'A perfectly still alpine lake reflecting mountains and sky like a flawless mirror, not a single ripple'],
        ['Loving-Kindness Metta', 'Concentric hearts radiating outward from center — self, loved ones, strangers, all beings — each ring a warmer color'],
        ['Inner Smile', 'A subtle Mona Lisa smile on a serene face, with warm golden light emanating from the chest area'],
        ['Cloud Thought Release', 'Thoughts written on clouds gently floating away across a vast peaceful sky, person watching from below'],
        ['Future Self Meeting', 'A misty path through a forest leading to a warm glowing figure in the distance, welcoming'],
        ['Candle Flame Focus', 'A single candle flame in perfect stillness, the only light source in a dark room, sharp and clear'],
        ['Garden of Calm', 'A walled Japanese zen garden with raked sand, three perfect stones, a single cherry blossom tree'],
        ['Ocean Wave Breathing', 'A wave approaching shore in slow motion, foam catching light, rhythmic and eternal'],
        ['Star Body Expansion', 'A person in starfish pose with their silhouette expanding into a constellation of stars'],
        ['Healing Light', 'A beam of soft golden light entering through the crown of the head, filling the body like warm honey'],
        ['Gratitude Letter', 'A hand writing on luminous paper with ink made of light, words floating up like fireflies'],
        ['Morning Meditation Bonus', 'A lotus flower slowly opening at dawn, each petal catching the first rays of light, dewdrops sparkling'],
      ],
      videoPrompts: [
        ['Hook — Card Float', '10 second cinematic video. A single meditation card floats gently in mid-air above a zen garden with raked sand. Soft particles of light drift around it. Card slowly rotates revealing a serene watercolor illustration. Ethereal calm atmosphere. Shallow depth of field.'],
        ['Problem — Stress Overload', '10 second video. Close-up of hands gripping a desk edge tightly, knuckles white. Camera pulls back to reveal a cluttered chaotic workspace. Screen notifications piling up. Fast heartbeat sound visualization as subtle red pulses. Tense corporate stress aesthetic.'],
        ['Solution — First Card', '10 second video. The same stressed hands from previous clip now gently pick up a meditation card from a peaceful wooden tray. As they read it, shoulders visibly drop and relax. Lighting shifts from harsh blue to warm golden. Transformation moment.'],
        ['Demo — Breathing Exercise', '10 second video. Extreme close-up of a person breathing slowly. A soft glowing circle expands and contracts in sync with their breath, overlaid transparently. Background is blurred nature scene. Hypnotic meditative rhythm. ASMR-quality calm.'],
        ['Benefit — Peace Wash', '10 second video. Top-down shot of a person lying on grass, eyes closed, peaceful smile. Camera slowly rises. Wildflowers around them. Sunlight dappling through tree leaves creating dancing light patterns on their face. Pure serenity.'],
        ['Lifestyle — Office Desk', '10 second video. A person at a clean modern office desk pulls a meditation card from a small wooden holder. Takes a deep breath following the card. Coworkers blur in background. Quick mindfulness break. Professional wellness aesthetic.'],
        ['Collection — Fanning Cards', '10 second video. Hands slowly fan out all 52 meditation cards in a perfect arc on a marble surface. Each card shows a different soft watercolor nature illustration. Camera glides along the arc. Satisfying ASMR arrangement. Premium product showcase.'],
        ['Ritual — Evening Wind Down', '10 second video. Candlelit bedroom. A person in comfortable clothes sits on the bed, draws a card from the deck on their nightstand. Reads it, closes eyes, takes a breath. Warm intimate evening ritual. Soft flickering light.'],
        ['Social — Partner Meditation', '10 second video. Two people sitting cross-legged facing each other, each holding a meditation card. They read simultaneously then close eyes and breathe together. Soft morning light. Connection and shared practice. Warm relationship aesthetic.'],
        ['CTA — Digital Preview', '10 second video. Tablet on a wooden table showing the meditation card PDF. Finger swipes through cards — each one reveals a beautiful watercolor illustration and exercise. Steam from a tea cup drifts across frame. Inviting digital product showcase.'],
      ],
    },
  };

  const proj = PROJECTS[activeProject];
  const doneCount = proj.prompts.filter((_, i) => done[`${activeProject}-${i}`]).length;
  const kimiInstructions = activeProject === '133'
    ? `You are creating content for a Cognitive Distortion Flashcard Deck (52 cards). For each card, write:
1. **Distortion Name** (bold header)
2. **Definition** (1-2 sentences, plain English, no jargon)
3. **Real-Life Example** (a relatable scenario in 2-3 sentences)
4. **Reframe Technique** (how to counter this distortion in 2-3 sentences)

Keep each card under 120 words total. Tone: warm, non-judgmental, educational. Audience: adults doing self-improvement or therapy.

BATCH: Write cards for these distortions:`
    : `You are creating content for a Mind Healing Meditation Card Deck (52 cards). For each card, write:
1. **Exercise Name** (bold header)
2. **Duration:** (2-5 minutes)
3. **Difficulty:** (Beginner / Intermediate / Advanced)
4. **Best Time:** (Morning / Anytime / Evening)
5. **Steps** (numbered, 3-6 clear steps, each 1 sentence)
6. **Tip** (one practical tip in 1 sentence)

Keep each card under 100 words total. Tone: calm, encouraging, simple. Audience: meditation beginners and office workers.

BATCH: Write cards for these exercises:`;

  return (
    <div style={{padding: '24px 32px', maxWidth: 1200}}>
      <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:24}}>
        <span style={{fontSize:36}}>🎨</span>
        <div>
          <h1 style={{...styles.pageTitle, margin:0}}>Prompt Factory</h1>
          <p style={{color:'#888', margin:0, fontSize:13}}>Copy Grok image prompts + Kimi swarm instructions. Mark done as you go.</p>
        </div>
      </div>

      {/* Project Tabs */}
      <div style={{display:'flex', gap:8, marginBottom:20}}>
        {Object.entries(PROJECTS).map(([id, p]) => (
          <button key={id} onClick={() => setActiveProject(id)} style={{
            padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: activeProject === id ? '#6366f1' : '#1e1e2e', color: activeProject === id ? '#fff' : '#888',
          }}>{p.name}</button>
        ))}
      </div>

      {/* Project Folder Link */}
      <div style={{background:'#1e1e2e', borderRadius:10, padding:16, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
          <span style={{color:'#888', fontSize:12}}>PROJECT FOLDER</span>
          <div style={{color:'#e2e8f0', fontSize:14, fontFamily:'monospace', marginTop:4}}>{proj.path}</div>
        </div>
        <button onClick={() => fetch('/api/open-folder', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({path:proj.path})})}
          style={{padding:'6px 14px', borderRadius:6, border:'1px solid #333', background:'#111', color:'#ccc', cursor:'pointer', fontSize:12}}>
          Open Folder
        </button>
      </div>

      {/* Progress */}
      <div style={{background:'#1e1e2e', borderRadius:10, padding:16, marginBottom:20}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
          <span style={{color:'#e2e8f0', fontWeight:600}}>Grok Prompts: {doneCount}/{proj.prompts.length}</span>
          <span style={{color: doneCount === proj.prompts.length ? '#22c55e' : '#eab308', fontWeight:600}}>
            {doneCount === proj.prompts.length ? 'ALL DONE' : `${Math.round(doneCount/proj.prompts.length*100)}%`}
          </span>
        </div>
        <div style={{height:6, background:'#111', borderRadius:3}}>
          <div style={{height:6, background: doneCount === proj.prompts.length ? '#22c55e' : '#6366f1', borderRadius:3, width:`${doneCount/proj.prompts.length*100}%`, transition:'width 0.3s'}}></div>
        </div>
      </div>

      {/* Base Style Reference */}
      <div style={{background:'#1a1a2e', border:'1px solid #333', borderRadius:10, padding:16, marginBottom:20}}>
        <div style={{color:'#eab308', fontWeight:600, fontSize:13, marginBottom:8}}>BASE STYLE (already included in each Copy Prompt button — this is just for reference)</div>
        <div style={{color:'#e2e8f0', fontSize:13, lineHeight:1.6, fontFamily:'monospace', background:'#111', padding:12, borderRadius:6, position:'relative'}}>
          {proj.style}
          <button onClick={() => copyPrompt(proj.style, 'style')} style={{position:'absolute', top:8, right:8, padding:'4px 10px', borderRadius:4, border:'1px solid #444', background:'#222', color: copiedIdx === 'style' ? '#22c55e' : '#888', cursor:'pointer', fontSize:11}}>
            {copiedIdx === 'style' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Kimi Swarm Instructions */}
      <div style={{background:'#1a1a2e', border:'1px solid #6366f1', borderRadius:10, padding:16, marginBottom:20}}>
        <div style={{color:'#818cf8', fontWeight:600, fontSize:13, marginBottom:8}}>KIMI SWARM INSTRUCTIONS (paste into each agent)</div>
        <div style={{color:'#e2e8f0', fontSize:12, lineHeight:1.7, fontFamily:'monospace', background:'#111', padding:12, borderRadius:6, whiteSpace:'pre-wrap', position:'relative'}}>
          {kimiInstructions}
          <button onClick={() => copyPrompt(kimiInstructions, 'kimi')} style={{position:'absolute', top:8, right:8, padding:'4px 10px', borderRadius:4, border:'1px solid #444', background:'#222', color: copiedIdx === 'kimi' ? '#22c55e' : '#888', cursor:'pointer', fontSize:11}}>
            {copiedIdx === 'kimi' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{color:'#888', fontSize:11, marginTop:8}}>Split into batches of 10-13 cards per Kimi agent for best results. Paste the card names after the instructions.</div>
      </div>

      {/* Video Prompts for Promo */}
      {proj.videoPrompts && proj.videoPrompts.length > 0 && (
        <div style={{background:'#1a1a2e', border:'1px solid #f97316', borderRadius:10, padding:16, marginBottom:20}}>
          <div style={{color:'#f97316', fontWeight:600, fontSize:14, marginBottom:12}}>VIDEO PROMPTS FOR PROMO (10s clips — stitch into final reel)</div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {proj.videoPrompts.map(([name, desc], i) => {
              const vkey = `${activeProject}-vid-${i}`;
              const vDone = done[vkey];
              return (
                <div key={i} style={{background: vDone ? '#0a1a0a' : '#111', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'flex-start', gap:12, border: vDone ? '1px solid #22c55e33' : '1px solid #222', opacity: vDone ? 0.6 : 1}}>
                  <input type="checkbox" checked={vDone} onChange={() => toggle(vkey)} style={{marginTop:4, cursor:'pointer', accentColor:'#22c55e'}} />
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                      <span style={{color: vDone ? '#22c55e' : '#f97316', fontWeight:600, fontSize:13}}>
                        {i+1}. {name}
                      </span>
                      <button onClick={() => copyPrompt(desc, `vid-${i}`)} style={{padding:'3px 10px', borderRadius:4, border:'1px solid #333', background:'#222', color: copiedIdx === `vid-${i}` ? '#22c55e' : '#888', cursor:'pointer', fontSize:11, flexShrink:0}}>
                        {copiedIdx === `vid-${i}` ? 'Copied!' : 'Copy Prompt'}
                      </button>
                    </div>
                    <div style={{color:'#999', fontSize:12, lineHeight:1.5}}>{desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prompt Cards */}
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {proj.prompts.map(([name, desc], i) => {
          const key = `${activeProject}-${i}`;
          const isDone = done[key];
          const fullPrompt = `${proj.style}. Subject: "${name}" — ${desc}`;
          return (
            <div key={i} style={{background: isDone ? '#0a1a0a' : '#1e1e2e', borderRadius:8, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12, border: isDone ? '1px solid #22c55e33' : '1px solid transparent', opacity: isDone ? 0.6 : 1}}>
              <input type="checkbox" checked={isDone} onChange={() => toggle(key)} style={{marginTop:4, cursor:'pointer', accentColor:'#22c55e'}} />
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                  <span style={{color: isDone ? '#22c55e' : '#e2e8f0', fontWeight:600, fontSize:14}}>
                    {i+1}. {name}
                  </span>
                  <button onClick={() => copyPrompt(fullPrompt, i)} style={{padding:'3px 10px', borderRadius:4, border:'1px solid #333', background:'#111', color: copiedIdx === i ? '#22c55e' : '#888', cursor:'pointer', fontSize:11, flexShrink:0}}>
                    {copiedIdx === i ? 'Copied!' : 'Copy Prompt'}
                  </button>
                </div>
                <div style={{color:'#999', fontSize:12, lineHeight:1.5}}>{desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// REVIEW QUEUE
// ============================================================
function ReviewQueuePage() {
  const BATCH_HISTORY = [
    { batch: 1, projects: [
      { name: 'Skoooool AI', agent: 'kimi', hub: 'AI', path: 'D:\\PRODUCT-MATRIX\\024-AI-V1-agent-hub', icon: '🔵' },
      { name: 'Dungeon Landlord', agent: 'claude', hub: 'GAMES', path: 'D:\\PRODUCT-MATRIX\\016-GAME-V1-dungeon-landlord', icon: '🟣' },
      { name: 'LLM RAG System', agent: 'gemini', hub: 'AI', path: 'D:\\PRODUCT-MATRIX\\024-AI-V1-agent-hub', icon: '💚' },
    ]},
    { batch: 2, projects: [
      { name: 'ClickBank Pipeline', agent: 'claude', hub: 'PRODUCTS', path: 'D:\\PRODUCT-MATRIX\\027-ECOM-V1-clickbank-pipeline', icon: '🟣' },
      { name: 'Social Poster', agent: 'kimi', hub: 'APPS', path: 'D:\\PRODUCT-MATRIX\\029-SAAS-V1-social-poster', icon: '🔵' },
      { name: 'AeternusVita Hub', agent: 'gemini', hub: 'APPS', path: 'D:\\PRODUCT-MATRIX\\102-WEB-V1-aeternusvita-hub', icon: '💚' },
    ]},
  ];

  const [reviews, setReviews] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mc-review-queue') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (reviews.length === 0) {
      const initial = BATCH_HISTORY.flatMap(b => b.projects.map(p => ({ ...p, batch: b.batch, id: `${b.batch}-${p.name}`, reviewed: false, promoted: false, notes: '' })));
      setReviews(initial);
      localStorage.setItem('mc-review-queue', JSON.stringify(initial));
    }
  }, []);

  const save = (updated) => { setReviews(updated); localStorage.setItem('mc-review-queue', JSON.stringify(updated)); };
  const toggle = (id, field) => save(reviews.map(r => r.id === id ? { ...r, [field]: !r[field] } : r));
  const promote = async (item) => {
    try {
      await fetch('/api/open-folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: item.path }) });
      save(reviews.map(r => r.id === item.id ? { ...r, promoted: true } : r));
    } catch {}
  };

  const pending = reviews.filter(r => !r.reviewed);
  const reviewed = reviews.filter(r => r.reviewed && !r.promoted);
  const promoted = reviews.filter(r => r.promoted);

  return (
    <div>
      <h1 style={styles.pageTitle}>Review Queue</h1>
      <p style={styles.pageSubtitle}>Review completed builds, approve, and promote to hub folders</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
        {[
          { label:'Pending Review', value: pending.length, color:'#eab308', icon:'⏳' },
          { label:'Reviewed', value: reviewed.length, color:'#3b82f6', icon:'✅' },
          { label:'Promoted', value: promoted.length, color:'#22c55e', icon:'🚀' },
        ].map((s,i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#888',marginBottom:4}}>{s.icon} {s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {BATCH_HISTORY.map(b => (
        <div key={b.batch} style={{marginBottom:24}}>
          <div style={styles.sectionHeader}>Batch {b.batch}</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {reviews.filter(r => r.batch === b.batch).map(item => (
              <div key={item.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:`1px solid ${item.promoted ? 'rgba(34,197,94,0.3)' : item.reviewed ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:20}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600}}>{item.name}</div>
                  <div style={{fontSize:10,color:'#888',fontFamily:'monospace'}}>{item.path}</div>
                  <div style={{display:'flex',gap:6,marginTop:4}}>
                    <span style={{fontSize:10,background:`${HUB_COLORS[item.hub]||'#555'}20`,color:HUB_COLORS[item.hub]||'#888',padding:'1px 6px',borderRadius:4}}>{item.hub}</span>
                    <span style={{fontSize:10,color:'#888'}}>{item.agent}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button onClick={() => fetch('/api/open-folder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:item.path})})}
                    style={{background:'#3b82f620',border:'1px solid #3b82f640',borderRadius:10,padding:'5px 10px',color:'#3b82f6',fontSize:10,cursor:'pointer',fontWeight:600}}>📂 Open</button>
                  <button onClick={() => window.open(`vscode://file/${item.path.replace(/\\/g,'/')}`)}
                    style={{background:'#a855f720',border:'1px solid #a855f740',borderRadius:10,padding:'5px 10px',color:'#a855f7',fontSize:10,cursor:'pointer',fontWeight:600}}>💻 Code</button>
                  <button onClick={() => toggle(item.id, 'reviewed')}
                    style={{background: item.reviewed ? '#22c55e' : 'rgba(255,255,255,0.06)',border: item.reviewed ? 'none' : '1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'5px 12px',color: item.reviewed ? '#fff' : '#888',fontSize:10,cursor:'pointer',fontWeight:600}}>
                    {item.reviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                  </button>
                  {item.reviewed && !item.promoted && (
                    <button onClick={() => promote(item)}
                      style={{background:'#22c55e20',border:'1px solid #22c55e40',borderRadius:10,padding:'5px 12px',color:'#22c55e',fontSize:10,cursor:'pointer',fontWeight:700}}>🚀 Promote</button>
                  )}
                  {item.promoted && <span style={{fontSize:10,color:'#22c55e',fontWeight:700}}>✓ Promoted</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{marginTop:20,padding:16,background:'rgba(99,102,241,0.06)',borderRadius:12,border:'1px solid rgba(99,102,241,0.12)'}}>
        <div style={{fontSize:12,fontWeight:700,color:'#888',marginBottom:6}}>Auto-Complete Command</div>
        <div style={{fontSize:10,color:'#aaa',marginBottom:8}}>Append this to CLI agent commands so builds auto-mark as done:</div>
        <code style={{fontSize:11,color:'#a855f7',background:'rgba(0,0,0,0.3)',padding:'8px 12px',borderRadius:8,display:'block',fontFamily:'monospace',wordBreak:'break-all'}}>
          {'; curl -X POST http://localhost:3334/api/active-project/done -H "Content-Type: application/json" -d \'{"name":"PROJECT_NAME"}\''}
        </code>
      </div>
    </div>
  );
}

// ============================================================
// BUILD QUEUE
// ============================================================
function BuildQueuePage() {
  const { data: buildQueue, loading, refresh } = useAutoFetch('/api/build-queue', 30000);
  const [selected, setSelected] = useState([]);

  const AGENT_CMDS = {
    claude: (p) => `claude --dangerously-skip-permissions -p "Build MVP for ${p.id} at ${p.path}. Read SOUL.md and ISSUES.md first." ; curl -X POST http://localhost:3334/api/active-project/done -H "Content-Type: application/json" -d "{\\"name\\":\\"${p.id}\\"}"`,
    kimi: (p) => `kimi --yolo -w "${p.path}" -p "Build MVP for ${p.id}. Read SOUL.md and ISSUES.md first."`,
    gemini: (p) => `gemini --yolo "Build MVP for ${p.id} at ${p.path}. Read SOUL.md and ISSUES.md first."`,
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 3 ? [...s, id] : s);
  const agents = ['claude', 'kimi', 'gemini'];

  const launchCmds = selected.map((id, i) => {
    const proj = (buildQueue || []).find(p => p.id === id);
    if (!proj) return '';
    const agent = agents[i % 3];
    return AGENT_CMDS[agent](proj);
  }).filter(Boolean);

  const unbuilt = (buildQueue || []).filter(p => !p.built);
  const built = (buildQueue || []).filter(p => p.built);

  const copyAll = () => { navigator.clipboard.writeText(launchCmds.join('\n\n')); };

  return (
    <div>
      <h1 style={styles.pageTitle}>Build Queue</h1>
      <p style={styles.pageSubtitle}>Select up to 3 projects to launch in parallel — commands are generated automatically</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
        {[
          { label:'Ready to Build', value: unbuilt.length, color:'#eab308', icon:'🏗️' },
          { label:'Already Built', value: built.length, color:'#22c55e', icon:'✅' },
          { label:'Selected', value: selected.length, color:'#a855f7', icon:'🎯' },
        ].map((s,i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#888',marginBottom:4}}>{s.icon} {s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div style={{background:'rgba(99,102,241,0.08)',borderRadius:12,border:'1px solid rgba(99,102,241,0.2)',padding:16,marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:'#a855f7'}}>🚀 Launch {selected.length} Builds</div>
            <button onClick={copyAll} style={{background:'#4F46E5',border:'none',borderRadius:10,padding:'6px 16px',color:'white',fontSize:11,fontWeight:700,cursor:'pointer'}}>📋 Copy All Commands</button>
          </div>
          {launchCmds.map((cmd, i) => (
            <div key={i} style={{marginBottom:8}}>
              <div style={{fontSize:10,color:'#888',marginBottom:2}}>{agents[i]} — {selected[i]}</div>
              <div style={{background:'rgba(0,0,0,0.3)',borderRadius:8,padding:'8px 12px',fontSize:11,fontFamily:'monospace',color:'#e5e5ea',wordBreak:'break-all',cursor:'pointer',border:'1px solid rgba(255,255,255,0.06)'}}
                onClick={() => navigator.clipboard.writeText(cmd)}>{cmd}</div>
            </div>
          ))}
        </div>
      )}

      {loading && <div style={{color:'#888',textAlign:'center',padding:40}}>Loading projects...</div>}

      {unbuilt.length > 0 && <>
        <div style={styles.sectionHeader}>Ready to Build ({unbuilt.length})</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:24}}>
          {unbuilt.map(p => {
            const isSelected = selected.includes(p.id);
            const hubColor = HUB_COLORS[p.hub] || '#555';
            return (
              <div key={p.id} onClick={() => toggleSelect(p.id)}
                style={{background: isSelected ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',borderRadius:12,border:`1px solid ${isSelected ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer',transition:'all 0.15s'}}>
                <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${isSelected ? '#4F46E5' : 'rgba(255,255,255,0.15)'}`,background: isSelected ? '#4F46E5' : 'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'white',fontWeight:700}}>
                  {isSelected ? '✓' : ''}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{p.id}</div>
                  <div style={{fontSize:10,color:'#888',fontFamily:'monospace'}}>{p.path}</div>
                </div>
                <span style={{fontSize:10,background:`${hubColor}20`,color:hubColor,padding:'2px 8px',borderRadius:4}}>{p.hub}</span>
                {p.hasSoul && <span style={{fontSize:10,color:'#22c55e'}}>SOUL</span>}
                {p.hasIssues && <span style={{fontSize:10,color:'#3b82f6'}}>ISSUES</span>}
              </div>
            );
          })}
        </div>
      </>}

      {built.length > 0 && <>
        <div style={styles.sectionHeader}>Already Built ({built.length})</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,opacity:0.5}}>
          {built.map(p => (
            <div key={p.id} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',padding:'10px 16px',display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:14}}>✅</span>
              <div style={{flex:1,fontSize:13}}>{p.id}</div>
              <span style={{fontSize:10,color:HUB_COLORS[p.hub]||'#888'}}>{p.hub}</span>
            </div>
          ))}
        </div>
      </>}
    </div>
  );
}

// ============================================================
// COURSE INDEX
// ============================================================
function CourseIndexPage() {
  const { data, loading } = useAutoFetch('/data/course_index.json', 60000);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');

  if (loading || !data) return <div style={{color:'#888',textAlign:'center',padding:40}}>Loading course index...</div>;

  const { summary, courses } = data;
  const filtered = search
    ? courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.lessons.some(l => l.file.toLowerCase().includes(search.toLowerCase())))
    : courses;

  return (
    <div>
      <h1 style={styles.pageTitle}>Course Index</h1>
      <p style={styles.pageSubtitle}>388 transcribed lessons across {summary.totalCourses} courses — {summary.totalWords.toLocaleString()} words of knowledge</p>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          { label:'Courses', value: summary.totalCourses, color:'#a855f7', icon:'📚' },
          { label:'Lessons', value: summary.totalLessons, color:'#3b82f6', icon:'📝' },
          { label:'Words', value: (summary.totalWords/1000).toFixed(0)+'K', color:'#22c55e', icon:'📖' },
          { label:'Audio Hours', value: summary.totalDurationHours+'h', color:'#eab308', icon:'🎧' },
        ].map((s,i) => (
          <div key={i} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,padding:14,border:'1px solid rgba(255,255,255,0.06)',textAlign:'center'}}>
            <div style={{fontSize:10,color:'#888',marginBottom:4}}>{s.icon} {s.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses or lessons..."
        style={{...styles.searchInput, width:'100%', marginBottom:16}} />

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {filtered.map((course, ci) => (
          <div key={ci} style={{background:'rgba(255,255,255,0.04)',borderRadius:12,border:'1px solid rgba(255,255,255,0.06)',overflow:'hidden'}}>
            <div onClick={() => setExpanded(expanded === ci ? null : ci)}
              style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
              <span style={{fontSize:16}}>{expanded === ci ? '📂' : '📁'}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600}}>{course.name}</div>
                <div style={{fontSize:10,color:'#888'}}>{course.category}</div>
              </div>
              <span style={{fontSize:11,color:'#a855f7',background:'#a855f720',padding:'2px 8px',borderRadius:4}}>{course.lessonCount} lessons</span>
              <span style={{fontSize:11,color:'#22c55e',background:'#22c55e20',padding:'2px 8px',borderRadius:4}}>{course.totalWords.toLocaleString()} words</span>
              <span style={{fontSize:11,color:'#eab308',background:'#eab30820',padding:'2px 8px',borderRadius:4}}>{course.readingTimeMin}m read</span>
            </div>
            {expanded === ci && (
              <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',padding:'8px 16px',background:'rgba(0,0,0,0.15)'}}>
                {course.lessons.map((lesson, li) => (
                  <div key={li} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'flex-start',gap:10}}>
                    <span style={{fontSize:11,color: lesson.hasTranscript ? '#22c55e' : '#ef4444',minWidth:16}}>{lesson.hasTranscript ? '✓' : '✗'}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:500}}>{lesson.file}</div>
                      {lesson.preview && <div style={{fontSize:10,color:'#666',marginTop:2,lineHeight:1.4,maxHeight:40,overflow:'hidden'}}>{lesson.preview}</div>}
                    </div>
                    <span style={{fontSize:10,color:'#888',whiteSpace:'nowrap'}}>{lesson.words.toLocaleString()} words</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  root: { display:'flex', height:'100vh', background:'#1a1a1e', color:'#e5e5ea', fontFamily:"'SF Pro Display','SF Pro Text','Inter',-apple-system,'Segoe UI',sans-serif", letterSpacing:'-0.01em' },

  // Sidebar — frosted glass
  sidebar: { width:240, background:'rgba(30,30,34,0.85)', backdropFilter:'blur(20px) saturate(180%)', WebkitBackdropFilter:'blur(20px) saturate(180%)', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', padding:'0 8px 12px', overflowY:'auto', flexShrink:0 },
  sidebarLogo: { display:'flex', alignItems:'center', gap:8, padding:'4px 8px 14px' },
  logoText: { fontSize:13, fontWeight:600, background:'linear-gradient(135deg,#6366f1,#a855f7,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' },
  sidebarSection: { fontSize:10, fontWeight:500, color:'rgba(255,255,255,0.25)', letterSpacing:1.2, padding:'14px 8px 4px', textTransform:'uppercase' },
  navBtn: { display:'flex', alignItems:'center', gap:8, width:'100%', padding:'5px 8px', background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:13, borderRadius:10, cursor:'pointer', textAlign:'left', transition:'all 0.15s', fontWeight:400 },
  navBtnActive: { background:'rgba(99,102,241,0.15)', color:'#e5e5ea', fontWeight:500 },
  badge: { marginLeft:'auto', fontSize:10, color:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.06)', padding:'1px 6px', borderRadius:10, fontWeight:500 },
  hubDot: { width:8, height:8, borderRadius:'50%', display:'inline-block', flexShrink:0 },
  sidebarFooter: { padding:'8px', borderTop:'1px solid rgba(255,255,255,0.04)' },

  // Main
  main: { flex:1, overflowY:'auto', padding:'28px 36px', background:'#1a1a1e' },
  pageTitle: { fontSize:26, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.02em', color:'#f5f5f7' },
  pageSubtitle: { fontSize:13, color:'rgba(255,255,255,0.35)', margin:'0 0 24px', fontWeight:400 },

  // KPI
  kpiRow: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 },
  kpiCard: { background:'rgba(255,255,255,0.04)', borderRadius:14, padding:18, display:'flex', flexDirection:'column', alignItems:'center', gap:4, border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(10px)', transition:'transform 0.15s, border-color 0.15s' },

  // Hub grid
  sectionHeader: { fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.4)', marginBottom:10, marginTop:20, letterSpacing:'-0.01em' },
  hubGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10, marginBottom:28 },
  hubCard: { background:'rgba(255,255,255,0.04)', borderRadius:12, padding:14, cursor:'pointer', border:'1px solid rgba(255,255,255,0.06)', transition:'transform 0.15s, border-color 0.2s, background 0.2s' },
  hubCardBar: { height:3, borderRadius:2, marginBottom:8 },
  hubCardTitle: { fontSize:13, fontWeight:600 },
  hubCardMeta: { fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 },
  hubCardPath: { fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:4, fontFamily:"'SF Mono','Cascadia Code','Fira Code',monospace", fontWeight:400 },

  // Plan mini
  planMini: { flex:1, minWidth:200, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:12, border:'1px solid rgba(255,255,255,0.06)' },

  // Filters
  filterRow: { display:'flex', gap:8, marginBottom:14 },
  searchInput: { flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'8px 14px', color:'#e5e5ea', fontSize:13, outline:'none', transition:'border-color 0.2s' },
  select: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'8px 14px', color:'#e5e5ea', fontSize:13, outline:'none' },

  // Table
  tableWrap: { background:'rgba(255,255,255,0.03)', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:500, color:'rgba(255,255,255,0.35)', borderBottom:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', userSelect:'none', textTransform:'uppercase', letterSpacing:0.5 },
  tr: { borderBottom:'1px solid rgba(255,255,255,0.04)' },
  td: { padding:'10px 14px', fontSize:12, verticalAlign:'middle' },
  hubTag: { fontSize:10, padding:'3px 10px', borderRadius:10, fontWeight:500 },
  actionBtn: { background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'5px 10px', cursor:'pointer', fontSize:13, transition:'background 0.15s' },

  // Plan
  planRow: { display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'10px 14px', border:'1px solid rgba(255,255,255,0.06)' },
  checkbox: { background:'none', border:'none', fontSize:16, cursor:'pointer', padding:0 },
  phaseTag: { fontSize:10, padding:'3px 10px', borderRadius:10, fontWeight:500, whiteSpace:'nowrap' },

  // Widgets
  widgetGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14 },
  widget: { background:'rgba(255,255,255,0.04)', borderRadius:14, padding:18, border:'1px solid rgba(255,255,255,0.06)' },
  widgetTitle: { fontSize:13, fontWeight:600, marginBottom:12 },
  widgetRow: { display:'flex', alignItems:'center', gap:6, padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' },
  hubDotSmall: { width:6, height:6, borderRadius:'50%', flexShrink:0 },
  progressBg: { height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginTop:2 },
  progressFill: { height:'100%', borderRadius:2, transition:'width 0.3s' },
  techCard: { flex:1, background:'rgba(255,255,255,0.06)', borderRadius:10, padding:14, textAlign:'center' },
  suggestionGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  suggestion: { background:'rgba(255,255,255,0.04)', borderRadius:10, padding:12, fontSize:12 },
};
