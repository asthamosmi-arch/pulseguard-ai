import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

// ── Utility helpers ──────────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const pick = (arr) => arr[randInt(0, arr.length)];

// ── Simulated live data ───────────────────────────────────────────────────────
const generateMetricPoint = (base, variance) => Math.max(0, base + rand(-variance, variance));

const SERVICES = [
  { id: "payment", name: "Payment API", base: 99.2, latency: 142, region: "us-east" },
  { id: "auth", name: "Auth Service", base: 99.8, latency: 38, region: "eu-west" },
  { id: "search", name: "Search Engine", base: 98.6, latency: 210, region: "ap-south" },
  { id: "media", name: "Media CDN", base: 99.9, latency: 22, region: "us-west" },
  { id: "analytics", name: "Analytics API", base: 97.4, latency: 380, region: "eu-central" },
  { id: "webhook", name: "Webhook Gateway", base: 96.1, latency: 520, region: "us-east" },
];

const DEMO_INCIDENTS = [
  { id: 1, service: "Payment API", type: "500 Server Error", severity: "critical", time: "2m ago", status: "active", rootCause: "Database connection pool exhausted under 3x traffic surge", fix: "Scale connection pool + enable read replicas" },
  { id: 2, service: "Auth Service", type: "Latency Spike", severity: "high", time: "8m ago", status: "investigating", rootCause: "JWT validation bottleneck after cert rotation", fix: "Cache public keys, reduce validation frequency" },
  { id: 3, service: "Webhook Gateway", type: "Timeout Failure", severity: "medium", time: "23m ago", status: "monitoring", rootCause: "Downstream vendor throttling at 1000 req/min", fix: "Implement exponential backoff + queue offload" },
  { id: 4, service: "Search Engine", type: "Traffic Overload", severity: "high", time: "45m ago", status: "resolved", rootCause: "Viral content caused 8x baseline traffic", fix: "Auto-scale triggered, CDN cache warmed" },
];

const LOG_TEMPLATES = [
  { level: "error", msg: () => `[${new Date().toISOString()}] ERROR payment-api: DB pool timeout after 5000ms req_id=${Math.random().toString(36).slice(2,10)}` },
  { level: "warn", msg: () => `[${new Date().toISOString()}] WARN  auth-svc: JWT validation slow 847ms threshold=200ms` },
  { level: "info", msg: () => `[${new Date().toISOString()}] INFO  gateway: Request OK 200 /api/v2/users/${randInt(1000,9999)} 42ms` },
  { level: "error", msg: () => `[${new Date().toISOString()}] ERROR webhook: Upstream 503 retry=${randInt(1,4)} endpoint=vendor.io` },
  { level: "info", msg: () => `[${new Date().toISOString()}] INFO  media-cdn: Cache HIT ratio=94.2% served=${randInt(1000,9999)}req` },
  { level: "warn", msg: () => `[${new Date().toISOString()}] WARN  analytics: Memory usage 87% threshold=80%` },
  { level: "info", msg: () => `[${new Date().toISOString()}] INFO  payment-api: Processed $${(rand(10,9999)).toFixed(2)} txn_id=${Math.random().toString(36).slice(2,12)}` },
  { level: "error", msg: () => `[${new Date().toISOString()}] ERROR search: Elasticsearch cluster RED node=es-03 shards=unassigned` },
];

// ── Tailwind-compatible inline style helpers ───────────────────────────────
const COLORS = {
  bg: "#050811",
  bgCard: "rgba(10,15,30,0.85)",
  bgCardHover: "rgba(15,22,45,0.95)",
  cyan: "#00e5ff",
  purple: "#a855f7",
  purpleGlow: "#7c3aed",
  green: "#00ff88",
  red: "#ff3366",
  yellow: "#ffd700",
  border: "rgba(168,85,247,0.25)",
  borderCyan: "rgba(0,229,255,0.3)",
};

// ── CSS injected once ────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Exo+2:wght@300;400;600;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, #root { background: ${COLORS.bg}; color: #e2e8f0; font-family: 'Exo 2', sans-serif; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: #0a0f1e; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.purpleGlow}; border-radius: 2px; }

  @keyframes pulse-glow {
    0%,100% { box-shadow: 0 0 8px ${COLORS.cyan}, 0 0 20px rgba(0,229,255,0.15); }
    50% { box-shadow: 0 0 16px ${COLORS.cyan}, 0 0 40px rgba(0,229,255,0.3); }
  }
  @keyframes pulse-red {
    0%,100% { box-shadow: 0 0 8px ${COLORS.red}, 0 0 20px rgba(255,51,102,0.2); }
    50% { box-shadow: 0 0 20px ${COLORS.red}, 0 0 50px rgba(255,51,102,0.4); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes scan-line {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes blink { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes fadeInUp {
    from { opacity:0; transform:translateY(20px); }
    to { opacity:1; transform:translateY(0); }
  }
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes particle-float {
    0% { transform: translateY(100vh) translateX(0); opacity:0; }
    10% { opacity:0.6; }
    90% { opacity:0.4; }
    100% { transform: translateY(-100px) translateX(${rand(-50,50)}px); opacity:0; }
  }
  @keyframes wave {
    0%,100% { d: path("M0,50 Q25,30 50,50 Q75,70 100,50"); }
    50% { d: path("M0,50 Q25,70 50,50 Q75,30 100,50"); }
  }
  @keyframes grid-move {
    0% { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  @keyframes type-cursor { 0%,100% { border-right-color: ${COLORS.cyan}; } 50% { border-right-color: transparent; } }
  @keyframes ping { 0% { transform: scale(1); opacity:1; } 75%,100% { transform: scale(2.5); opacity:0; } }
  @keyframes gradient-x {
    0%,100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes slide-in-right {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  .pulse-red { animation: pulse-red 1.5s ease-in-out infinite; }
  .float-anim { animation: float 4s ease-in-out infinite; }
  .blink { animation: blink 1s step-end infinite; }
  .fade-in-up { animation: fadeInUp 0.5s ease forwards; }
  .spin-slow { animation: spin-slow 8s linear infinite; }
  .shimmer-text {
    background: linear-gradient(90deg, ${COLORS.cyan}, ${COLORS.purple}, ${COLORS.cyan});
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 3s linear infinite;
  }
  .gradient-border {
    border: 1px solid transparent;
    background: linear-gradient(${COLORS.bgCard}, ${COLORS.bgCard}) padding-box,
                linear-gradient(135deg, ${COLORS.purple}, ${COLORS.cyan}) border-box;
  }
  .neon-border-cyan { border: 1px solid ${COLORS.borderCyan}; box-shadow: inset 0 0 20px rgba(0,229,255,0.03), 0 0 1px ${COLORS.cyan}; }
  .neon-border-purple { border: 1px solid ${COLORS.border}; box-shadow: inset 0 0 20px rgba(168,85,247,0.03), 0 0 1px ${COLORS.purple}; }
  .glass { backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
  .grid-bg {
    background-image: linear-gradient(rgba(168,85,247,0.06) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(168,85,247,0.06) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: grid-move 20s linear infinite;
  }
  .hover-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); cursor: pointer; }
  .hover-card:hover { transform: translateY(-3px); background: ${COLORS.bgCardHover}; }
  .terminal-font { font-family: 'JetBrains Mono', monospace; }
  .nav-item { transition: all 0.2s; cursor: pointer; padding: 10px 14px; border-radius: 8px; display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 13px; }
  .nav-item:hover { background: rgba(168,85,247,0.15); color: ${COLORS.cyan}; }
  .nav-item.active { background: rgba(168,85,247,0.2); color: ${COLORS.cyan}; border-left: 2px solid ${COLORS.cyan}; }
  .btn-primary { background: linear-gradient(135deg, ${COLORS.purpleGlow}, ${COLORS.cyan}20); border: 1px solid ${COLORS.borderCyan}; color: ${COLORS.cyan}; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 1px; transition: all 0.2s; text-transform: uppercase; }
  .btn-primary:hover { box-shadow: 0 0 20px rgba(0,229,255,0.3); transform: translateY(-1px); }
  .btn-danger { background: linear-gradient(135deg, rgba(255,51,102,0.2), rgba(255,51,102,0.05)); border: 1px solid rgba(255,51,102,0.4); color: ${COLORS.red}; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-family: 'Rajdhani', sans-serif; font-weight: 600; font-size: 13px; transition: all 0.2s; }
  .badge-critical { background: rgba(255,51,102,0.2); border: 1px solid rgba(255,51,102,0.5); color: ${COLORS.red}; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .badge-high { background: rgba(255,165,0,0.2); border: 1px solid rgba(255,165,0,0.4); color: #ffa500; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .badge-medium { background: rgba(255,215,0,0.2); border: 1px solid rgba(255,215,0,0.4); color: ${COLORS.yellow}; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .badge-low { background: rgba(0,255,136,0.1); border: 1px solid rgba(0,255,136,0.3); color: ${COLORS.green}; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-family: 'Rajdhani', sans-serif; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  .status-dot-green { width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.green}; box-shadow: 0 0 8px ${COLORS.green}; display: inline-block; }
  .status-dot-red { width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.red}; box-shadow: 0 0 8px ${COLORS.red}; display: inline-block; animation: pulse-red 1s infinite; }
  .status-dot-yellow { width: 8px; height: 8px; border-radius: 50%; background: ${COLORS.yellow}; box-shadow: 0 0 8px ${COLORS.yellow}; display: inline-block; }
  .ping-dot { position: relative; display: inline-flex; }
  .ping-dot::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: ${COLORS.red}; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; }
  .tooltip-chart { background: rgba(10,15,30,0.95) !important; border: 1px solid ${COLORS.border} !important; border-radius: 8px !important; font-family: 'JetBrains Mono', monospace !important; font-size: 11px !important; color: #e2e8f0 !important; }
  input, textarea, select { background: rgba(0,0,0,0.4); border: 1px solid ${COLORS.border}; color: #e2e8f0; border-radius: 8px; padding: 10px 14px; font-family: 'Exo 2', sans-serif; font-size: 13px; width: 100%; outline: none; transition: border-color 0.2s; }
  input:focus, textarea:focus, select:focus { border-color: ${COLORS.cyan}; box-shadow: 0 0 12px rgba(0,229,255,0.15); }
  select option { background: #0a0f1e; }
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function Particles() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${rand(1, 3)}px`,
          height: `${rand(1, 3)}px`,
          borderRadius: "50%",
          background: i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.purple : COLORS.green,
          left: `${rand(0, 100)}%`,
          bottom: 0,
          opacity: 0,
          animation: `particle-float ${rand(8, 20)}s linear ${rand(0, 15)}s infinite`,
          filter: "blur(0.5px)",
        }} />
      ))}
    </div>
  );
}

function ScanLine() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "2px",
      background: `linear-gradient(90deg, transparent, ${COLORS.cyan}40, transparent)`,
      animation: "scan-line 8s linear infinite",
      pointerEvents: "none", zIndex: 1, opacity: 0.4,
    }} />
  );
}

function StatCard({ label, value, unit, sub, color, pulse, icon }) {
  return (
    <div className="glass hover-card neon-border-purple" style={{
      background: COLORS.bgCard, borderRadius: 12, padding: "20px 24px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}15 0%, transparent 70%)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Rajdhani'", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'Exo 2'", lineHeight: 1 }}>
            {value}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4, color: "#94a3b8" }}>{unit}</span>
          </div>
          {sub && <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{sub}</div>}
        </div>
        <div style={{ fontSize: 22, opacity: 0.7 }}>{icon}</div>
      </div>
      {pulse && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        animation: "shimmer 2s linear infinite", backgroundSize: "200% auto" }} />}
    </div>
  );
}

function MiniChart({ data, color, dataKey }) {
  return (
    <ResponsiveContainer width="100%" height={50}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5}
          fill={`url(#grad-${color.replace("#","")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ServiceRow({ svc, metrics }) {
  const uptime = generateMetricPoint(svc.base, 0.3).toFixed(2);
  const lat = Math.round(generateMetricPoint(svc.latency, 30));
  const status = uptime > 99 ? "healthy" : uptime > 98 ? "degraded" : "critical";
  const statusColor = status === "healthy" ? COLORS.green : status === "degraded" ? COLORS.yellow : COLORS.red;
  return (
    <div className="hover-card" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 16, padding: "12px 16px",
      borderBottom: `1px solid rgba(168,85,247,0.1)`, alignItems: "center", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className={status === "critical" ? "status-dot-red" : status === "degraded" ? "status-dot-yellow" : "status-dot-green"} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{svc.name}</div>
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Rajdhani'" }}>{svc.region.toUpperCase()}</div>
        </div>
      </div>
      <div style={{ color: statusColor, fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600 }}>{uptime}%</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: lat > 300 ? COLORS.yellow : "#94a3b8" }}>{lat}ms</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: "#94a3b8" }}>{randInt(100,9999)}/s</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, color: COLORS.green }}>{(rand(0,2)).toFixed(2)}%</div>
      <div><span className={`badge-${status === "healthy" ? "low" : status === "degraded" ? "medium" : "critical"}`}>{status}</span></div>
    </div>
  );
}

function HealthGauge({ score }) {
  const color = score > 85 ? COLORS.green : score > 60 ? COLORS.yellow : COLORS.red;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={54} fill="none" stroke="rgba(168,85,247,0.15)" strokeWidth={10} />
        <circle cx={65} cy={65} r={54} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ marginTop: -100, textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "'Exo 2'" }}>{score}</div>
        <div style={{ fontSize: 10, color: "#64748b", letterSpacing: 2, fontFamily: "'Rajdhani'" }}>HEALTH SCORE</div>
      </div>
    </div>
  );
}

// ── PAGES ─────────────────────────────────────────────────────────────────────

function DashboardPage({ metrics, logs }) {
  const [healthScore, setHealthScore] = useState(87);
  useEffect(() => {
    const t = setInterval(() => setHealthScore(s => Math.max(60, Math.min(99, s + randInt(-2, 3)))), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Hero bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>System Overview</div>
          <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>
            LIVE • {new Date().toUTCString()} • AUTO-REFRESH 5s
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ background: "rgba(255,51,102,0.15)", border: "1px solid rgba(255,51,102,0.4)", borderRadius: 8,
            padding: "8px 16px", color: COLORS.red, fontSize: 12, fontFamily: "'Rajdhani'", fontWeight: 700, letterSpacing: 1 }}>
            <span className="ping-dot" style={{ marginRight: 8 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, display: "inline-block" }} /></span>
            2 CRITICAL ALERTS
          </div>
          <button className="btn-primary">+ New Monitor</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="API Uptime" value="99.4" unit="%" sub="↑ 0.2% from yesterday" color={COLORS.green} pulse icon="⬆" />
        <StatCard label="Avg Latency" value="187" unit="ms" sub="↑ 23ms spike detected" color={COLORS.cyan} pulse icon="⚡" />
        <StatCard label="Error Rate" value="1.8" unit="%" sub="↓ down from 3.4%" color={COLORS.yellow} icon="⚠" />
        <StatCard label="Active Incidents" value="3" unit="" sub="2 critical, 1 monitoring" color={COLORS.red} pulse icon="🔥" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Latency Chart */}
        <div className="glass neon-border-purple hover-card" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Response Latency — 30m</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={metrics.latency}>
              <defs>
                <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.1)" />
              <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono'" }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10, fontFamily: "'JetBrains Mono'" }} />
              <Tooltip contentStyle={{ background: "rgba(10,15,30,0.95)", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono'", fontSize: 11 }} />
              <Area type="monotone" dataKey="v" stroke={COLORS.cyan} strokeWidth={2} fill="url(#latGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Health + Requests */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass neon-border-cyan hover-card" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <HealthGauge score={healthScore} />
          </div>
          <div className="glass neon-border-purple hover-card" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20 }}>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 10 }}>Req/s</div>
            <MiniChart data={metrics.requests} color={COLORS.purple} dataKey="v" />
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 700, color: COLORS.purple, marginTop: 8 }}>
              {metrics.requests[metrics.requests.length - 1]?.v ?? 0}<span style={{ fontSize: 12, color: "#64748b" }}> req/s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error rate + Traffic */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="glass neon-border-purple hover-card" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Error Rate %</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={metrics.errors}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.1)" />
              <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "rgba(10,15,30,0.95)", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono'", fontSize: 11 }} />
              <Bar dataKey="v" fill={COLORS.red} radius={[4, 4, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass neon-border-cyan hover-card" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>Traffic Volume</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={metrics.traffic}>
              <defs>
                <linearGradient id="traffGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,85,247,0.1)" />
              <XAxis dataKey="t" tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "rgba(10,15,30,0.95)", border: `1px solid ${COLORS.border}`, borderRadius: 8, fontFamily: "'JetBrains Mono'", fontSize: 11 }} />
              <Area type="monotone" dataKey="v" stroke={COLORS.purple} strokeWidth={2} fill="url(#traffGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Services table */}
      <div className="glass neon-border-purple" style={{ background: COLORS.bgCard, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(168,85,247,0.1)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>Service Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {["All", "Critical", "Degraded", "Healthy"].map(f => (
              <div key={f} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer",
                background: f === "All" ? "rgba(168,85,247,0.2)" : "transparent",
                border: `1px solid ${f === "All" ? COLORS.purple : "rgba(168,85,247,0.2)"}`,
                color: f === "All" ? COLORS.purple : "#64748b" }}>{f}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: "8px 4px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr", gap: 16, padding: "8px 16px", marginBottom: 4 }}>
            {["Service", "Uptime", "Latency", "Req/s", "Error%", "Status"].map(h => (
              <div key={h} style={{ fontSize: 10, color: "#475569", fontFamily: "'Rajdhani'", letterSpacing: 1, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {SERVICES.map(svc => <ServiceRow key={svc.id} svc={svc} />)}
        </div>
      </div>
    </div>
  );
}

function AIAnalyzerPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [logInput, setLogInput] = useState(`[2024-01-15 14:23:01] ERROR payment-api: Connection timeout to PostgreSQL after 5000ms
[2024-01-15 14:23:02] ERROR payment-api: Retry 1/3 failed - DB pool exhausted (pool_size=20, waiting=47)
[2024-01-15 14:23:03] WARN  payment-api: Response time 8240ms exceeded threshold 2000ms
[2024-01-15 14:23:04] ERROR payment-api: HTTP 503 returned to client - service unavailable
[2024-01-15 14:23:04] ERROR load-balancer: health-check FAILED for payment-api:8080
[2024-01-15 14:23:05] CRITICAL alert-manager: Payment API DOWN - 3 consecutive failures`);
  const [streamText, setStreamText] = useState("");
  const streamRef = useRef(null);

  const analyze = async () => {
    setAnalyzing(true);
    setResult(null);
    setStreamText("");

    const prompt = `You are an elite AI DevOps engineer analyzing API failure logs.

Analyze this log data and provide:
1. ROOT CAUSE (concise, technical)
2. SEVERITY (critical/high/medium/low)
3. CONFIDENCE (0-100%)
4. TOP 3 RECOMMENDED FIXES (numbered)
5. ESTIMATED IMPACT (business impact in plain English)
6. PREVENTION STRATEGY (1-2 sentences)

Format your response with these exact headers. Be direct, technical, and actionable.

LOG DATA:
${logInput}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Analysis unavailable.";

      // stream-like animation
      let i = 0;
      clearInterval(streamRef.current);
      streamRef.current = setInterval(() => {
        i += 3;
        setStreamText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(streamRef.current);
          setResult(text);
          setAnalyzing(false);
        }
      }, 12);
    } catch {
      setStreamText("⚠ AI analysis unavailable — check API connectivity.");
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>AI Root Cause Analyzer</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>POWERED BY CLAUDE AI • INSTANT FAILURE DIAGNOSIS</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {DEMO_INCIDENTS.map(inc => (
          <div key={inc.id} className={`glass hover-card ${inc.severity === "critical" ? "pulse-red" : "neon-border-purple"}`}
            style={{ background: COLORS.bgCard, borderRadius: 12, padding: 20,
              border: inc.severity === "critical" ? `1px solid rgba(255,51,102,0.4)` : undefined }}
            onClick={() => setLogInput(`[INCIDENT] Service: ${inc.service}\n[INCIDENT] Type: ${inc.type}\n[INCIDENT] Root Cause: ${inc.rootCause}\n[INCIDENT] Status: ${inc.status}`)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{inc.service}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={`badge-${inc.severity}`}>{inc.severity}</span>
                <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'Rajdhani'" }}>{inc.time}</span>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>{inc.type}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono'" }}>{inc.rootCause}</div>
            <div style={{ marginTop: 10, fontSize: 11, color: COLORS.cyan }}>💡 {inc.fix}</div>
          </div>
        ))}
      </div>

      <div className="glass neon-border-cyan" style={{ background: COLORS.bgCard, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(0,229,255,0.1)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>Log Input — Paste or Edit</div>
          <button className="btn-primary" onClick={analyze} disabled={analyzing}>
            {analyzing ? "⟳ Analyzing..." : "⚡ Analyze with AI"}
          </button>
        </div>
        <textarea value={logInput} onChange={e => setLogInput(e.target.value)}
          style={{ display: "block", width: "100%", height: 160, borderRadius: 0, border: "none",
            fontFamily: "'JetBrains Mono'", fontSize: 12, lineHeight: 1.7,
            background: "rgba(0,0,0,0.5)", resize: "none", padding: "16px 20px" }} />
      </div>

      {(streamText || analyzing) && (
        <div className="glass neon-border-cyan fade-in-up" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div className="spin-slow" style={{ width: 20, height: 20, borderRadius: "50%",
              border: `2px solid ${COLORS.cyan}`, borderTopColor: "transparent" }} />
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: COLORS.cyan, textTransform: "uppercase" }}>AI Analysis Output</div>
          </div>
          <pre style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, lineHeight: 1.8, color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {streamText}{analyzing && <span className="blink">█</span>}
          </pre>
        </div>
      )}
    </div>
  );
}

function AlertsPage() {
  const [filter, setFilter] = useState("all");
  const alerts = [
    { id: 1, type: "API Down", service: "Payment API", severity: "critical", time: "2m ago", msg: "Payment API returning 503 on all endpoints", active: true },
    { id: 2, type: "High Latency", service: "Analytics", severity: "high", time: "7m ago", msg: "P99 latency exceeded 2000ms (current: 3847ms)", active: true },
    { id: 3, type: "Traffic Spike", service: "Search Engine", severity: "high", time: "12m ago", msg: "8x baseline traffic detected from ap-southeast-1", active: true },
    { id: 4, type: "Auth Failure", service: "Auth Service", severity: "medium", time: "18m ago", msg: "JWT validation errors spike: 847 failures/min", active: false },
    { id: 5, type: "DB Timeout", service: "Webhook Gateway", severity: "critical", time: "25m ago", msg: "PostgreSQL connection pool exhausted, 47 queued", active: true },
    { id: 6, type: "Server Overload", service: "Media CDN", severity: "medium", time: "40m ago", msg: "CPU 94%, Memory 87% — scaling in progress", active: false },
    { id: 7, type: "Rate Limit", service: "Payment API", severity: "low", time: "1h ago", msg: "Vendor API rate limit hit: 1000/min exceeded", active: false },
  ];

  const filtered = filter === "all" ? alerts : alerts.filter(a => a.severity === filter || (filter === "active" && a.active));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>Alert Center</div>
          <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>REAL-TIME INCIDENT NOTIFICATIONS</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["all", "active", "critical", "high", "medium", "low"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontFamily: "'Rajdhani'", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              background: filter === f ? "rgba(168,85,247,0.25)" : "transparent",
              border: `1px solid ${filter === f ? COLORS.purple : "rgba(168,85,247,0.2)"}`,
              color: filter === f ? COLORS.purple : "#64748b",
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((alert, i) => (
          <div key={alert.id} className={`glass hover-card fade-in-up ${alert.severity === "critical" && alert.active ? "pulse-red" : "neon-border-purple"}`}
            style={{ background: COLORS.bgCard, borderRadius: 12, padding: "16px 20px",
              border: alert.severity === "critical" && alert.active ? `1px solid rgba(255,51,102,0.5)` : undefined,
              animationDelay: `${i * 0.05}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 24 }}>
                  {alert.type === "API Down" ? "🔴" : alert.type === "High Latency" ? "⚡" : alert.type === "Traffic Spike" ? "📈" : alert.type === "Auth Failure" ? "🔐" : alert.type === "DB Timeout" ? "🗄" : alert.type === "Server Overload" ? "🖥" : "⚠"}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{alert.type}</span>
                    <span className={`badge-${alert.severity}`}>{alert.severity}</span>
                    {alert.active && <span style={{ fontSize: 10, color: COLORS.red, fontFamily: "'Rajdhani'", fontWeight: 700, letterSpacing: 1 }}>● ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{alert.msg}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Rajdhani'", marginBottom: 8 }}>{alert.service} • {alert.time}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" style={{ padding: "4px 12px", fontSize: 11 }}>Investigate</button>
                  <button style={{ padding: "4px 12px", fontSize: 11, cursor: "pointer", borderRadius: 6, border: `1px solid rgba(168,85,247,0.2)`, background: "transparent", color: "#64748b" }}>Ack</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalPage({ logs }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>Live Log Terminal</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>STREAMING • REAL-TIME LOG ANALYSIS</div>
      </div>
      <div className="glass" style={{ background: "rgba(0,0,0,0.7)", border: `1px solid rgba(0,229,255,0.2)`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.5)", borderBottom: `1px solid rgba(0,229,255,0.1)`,
          display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS.red }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS.yellow }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS.green }} />
          <div style={{ marginLeft: 12, fontFamily: "'JetBrains Mono'", fontSize: 12, color: "#64748b" }}>pulseguard@production:~$ tail -f /var/log/api.log</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <span style={{ fontSize: 10, background: "rgba(255,51,102,0.2)", border: `1px solid rgba(255,51,102,0.3)`, color: COLORS.red, padding: "2px 8px", borderRadius: 4, fontFamily: "'Rajdhani'", fontWeight: 700 }}>ERRORS: {logs.filter(l => l.level === "error").length}</span>
            <span style={{ fontSize: 10, background: "rgba(255,215,0,0.2)", border: `1px solid rgba(255,215,0,0.3)`, color: COLORS.yellow, padding: "2px 8px", borderRadius: 4, fontFamily: "'Rajdhani'", fontWeight: 700 }}>WARNS: {logs.filter(l => l.level === "warn").length}</span>
          </div>
        </div>
        <div style={{ height: 480, overflowY: "auto", padding: "16px 20px", fontFamily: "'JetBrains Mono'", fontSize: 12, lineHeight: 1.8 }}>
          {logs.map((log, i) => (
            <div key={i} className="fade-in-up" style={{ marginBottom: 2,
              color: log.level === "error" ? COLORS.red : log.level === "warn" ? COLORS.yellow : "#4ade80",
              animationDelay: `${i * 0.02}s` }}>
              {log.msg}
            </div>
          ))}
          <div style={{ color: COLORS.cyan }}>$ <span className="blink">█</span></div>
        </div>
      </div>
    </div>
  );
}

function APITesterPage() {
  const [url, setUrl] = useState("https://api.example.com/v1/health");
  const [method, setMethod] = useState("GET");
  const [body, setBody] = useState('{\n  "key": "value"\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef(null);

  const sendRequest = async () => {
    setLoading(true);
    setResponse(null);
    setAiAnalysis("");

    const start = Date.now();
    await new Promise(r => setTimeout(r, rand(200, 1200)));
    const elapsed = Date.now() - start;

    const mockResp = {
      status: pick([200, 200, 200, 201, 400, 404, 500, 503]),
      latency: elapsed,
      headers: { "content-type": "application/json", "x-request-id": Math.random().toString(36).slice(2), "x-ratelimit-remaining": randInt(100, 999) },
      body: { status: "ok", timestamp: new Date().toISOString(), version: "2.1.4", region: "us-east-1", uptime: randInt(10000, 999999) },
    };

    setLoading(false);
    setResponse(mockResp);

    // AI analysis
    if (mockResp.status >= 400) {
      setStreaming(true);
      const prompt = `Analyze this API response and give a 3-sentence diagnosis and fix recommendation:
URL: ${url}
Method: ${method}
Status: ${mockResp.status}
Latency: ${mockResp.latency}ms
Response: ${JSON.stringify(mockResp.body)}`;

      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        const text = data.content?.find(b => b.type === "text")?.text || "";
        let i = 0;
        clearInterval(streamRef.current);
        streamRef.current = setInterval(() => {
          i += 4;
          setAiAnalysis(text.slice(0, i));
          if (i >= text.length) { clearInterval(streamRef.current); setStreaming(false); }
        }, 15);
      } catch { setStreaming(false); }
    }
  };

  const statusColor = !response ? "#64748b" : response.status < 300 ? COLORS.green : response.status < 500 ? COLORS.yellow : COLORS.red;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>API Testing Panel</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>TEST • MONITOR • AI-ANALYZE</div>
      </div>

      <div className="glass neon-border-cyan" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <select value={method} onChange={e => setMethod(e.target.value)} style={{ width: 120, flexShrink: 0 }}>
            {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => <option key={m}>{m}</option>)}
          </select>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/endpoint" style={{ flex: 1 }} />
          <button className="btn-primary" onClick={sendRequest} disabled={loading} style={{ flexShrink: 0, minWidth: 120 }}>
            {loading ? "⟳ Sending..." : "▶ Send"}
          </button>
        </div>
        {(method === "POST" || method === "PUT" || method === "PATCH") && (
          <textarea value={body} onChange={e => setBody(e.target.value)} style={{ height: 100, fontFamily: "'JetBrains Mono'", fontSize: 12 }} />
        )}
      </div>

      {loading && (
        <div className="glass neon-border-cyan fade-in-up" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, alignItems: "center" }}>
            {["Resolving DNS", "Connecting", "Sending Request", "Awaiting Response"].map((s, i) => (
              <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div className="spin-slow" style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${COLORS.cyan}`, borderTopColor: "transparent", animationDelay: `${i * 0.2}s` }} />
                <div style={{ fontSize: 10, color: COLORS.cyan, fontFamily: "'Rajdhani'", letterSpacing: 1 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {response && (
        <div className="glass neon-border-cyan fade-in-up" style={{ background: COLORS.bgCard, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid rgba(0,229,255,0.1)`, display: "flex", gap: 24, alignItems: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 28, fontWeight: 700, color: statusColor }}>{response.status}</div>
            <div style={{ display: "flex", gap: 16 }}>
              <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>LATENCY</div><div style={{ fontFamily: "'JetBrains Mono'", color: response.latency > 500 ? COLORS.yellow : COLORS.green, fontWeight: 600 }}>{response.latency}ms</div></div>
              <div><div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>SIZE</div><div style={{ fontFamily: "'JetBrains Mono'", color: "#94a3b8", fontWeight: 600 }}>247B</div></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
            <div style={{ padding: 20, borderRight: `1px solid rgba(168,85,247,0.1)` }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10, fontFamily: "'Rajdhani'", letterSpacing: 2 }}>RESPONSE HEADERS</div>
              {Object.entries(response.headers).map(([k, v]) => (
                <div key={k} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: COLORS.cyan }}>{k}</span>: <span style={{ color: "#94a3b8" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 10, fontFamily: "'Rajdhani'", letterSpacing: 2 }}>RESPONSE BODY</div>
              <pre style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#4ade80", lineHeight: 1.7 }}>
                {JSON.stringify(response.body, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {(aiAnalysis || streaming) && (
        <div className="glass neon-border-purple fade-in-up" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: COLORS.purple, textTransform: "uppercase", marginBottom: 12 }}>🤖 AI Diagnosis</div>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, lineHeight: 1.8, color: "#e2e8f0", whiteSpace: "pre-wrap" }}>
            {aiAnalysis}{streaming && <span className="blink">█</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatAssistant({ onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! I'm PulseGuard AI — your DevOps intelligence assistant. Ask me anything about your infrastructure, incidents, or performance." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const streamRef = useRef(null);
  const SUGGESTIONS = ["Why is Payment API failing?", "Analyze today's outages", "Predict failure risks", "Show critical incidents", "How to reduce latency?"];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text) => {
    const q = text || input.trim();
    if (!q) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: q }]);
    setLoading(true);

    const systemPrompt = `You are PulseGuard AI, an elite DevOps intelligence assistant. You monitor APIs, analyze failures, predict outages, and provide instant insights. Current system state: 3 active incidents, Payment API critical (DB pool exhausted), Auth Service high latency (847ms), Webhook Gateway timeout. Health score: 87/100. Be concise, technical, and actionable. Use bullet points and emojis for clarity.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: systemPrompt,
          messages: [
            ...messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: q }
          ],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Analysis unavailable.";

      setLoading(false);
      let i = 0;
      const aiMsg = { role: "assistant", content: "" };
      setMessages(prev => [...prev, aiMsg]);
      clearInterval(streamRef.current);
      streamRef.current = setInterval(() => {
        i += 4;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: text.slice(0, i) };
          return updated;
        });
        if (i >= text.length) clearInterval(streamRef.current);
      }, 12);
    } catch {
      setLoading(false);
      setMessages(prev => [...prev, { role: "assistant", content: "⚠ AI unavailable — please check connectivity." }]);
    }
  };

  return (
    <div className="glass float-anim" style={{
      position: "fixed", bottom: 90, right: 24, width: 400, height: 560,
      background: "rgba(10,15,30,0.97)", border: `1px solid ${COLORS.border}`,
      borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden",
      boxShadow: `0 0 40px rgba(168,85,247,0.3), 0 0 80px rgba(168,85,247,0.1)`, zIndex: 100,
    }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`,
        background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(0,229,255,0.05))",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.purpleGlow}, ${COLORS.cyan})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Exo 2'" }}>PulseGuard AI</div>
            <div style={{ fontSize: 10, color: COLORS.green, fontFamily: "'Rajdhani'" }}>● ONLINE</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 12, display: "flex", flexDirection: "column",
            alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              background: msg.role === "user"
                ? `linear-gradient(135deg, ${COLORS.purpleGlow}, rgba(124,58,237,0.5))`
                : "rgba(255,255,255,0.05)",
              border: msg.role === "assistant" ? `1px solid ${COLORS.border}` : "none",
              fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap",
            }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "10px 14px", alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.purple,
                animation: `blink 1s step-end ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: "8px 12px", borderTop: `1px solid rgba(168,85,247,0.1)`, display: "flex", gap: 6, overflowX: "auto" }}>
        {SUGGESTIONS.map(s => (
          <div key={s} onClick={() => send(s)} style={{ flexShrink: 0, fontSize: 10, padding: "4px 10px", borderRadius: 20, cursor: "pointer",
            background: "rgba(168,85,247,0.1)", border: `1px solid ${COLORS.border}`, color: "#94a3b8",
            whiteSpace: "nowrap", transition: "all 0.2s" }}>{s}</div>
        ))}
      </div>

      <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10 }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your infrastructure..."
          onKeyDown={e => e.key === "Enter" && send()}
          style={{ flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.4)", border: `1px solid ${COLORS.border}`, borderRadius: 24 }} />
        <button className="btn-primary" onClick={() => send()} style={{ borderRadius: "50%", width: 40, height: 40, padding: 0, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>▶</button>
      </div>
    </div>
  );
}

function AutoHealingPage() {
  const [actions, setActions] = useState({});
  const [aiSummary, setAiSummary] = useState("");

  const heal = async (action) => {
    setActions(prev => ({ ...prev, [action]: "loading" }));
    await new Promise(r => setTimeout(r, rand(1500, 3000)));
    setActions(prev => ({ ...prev, [action]: "success" }));

    if (Object.values({ ...actions, [action]: "success" }).filter(s => s === "success").length >= 2) {
      const prompt = `Generate a 2-sentence AI recovery summary for these actions taken: ${action} and previous auto-healing actions on the Payment API and Auth Service. Be professional and concise.`;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        setAiSummary(data.content?.find(b => b.type === "text")?.text || "");
      } catch {}
    }
  };

  const healActions = [
    { key: "restart", label: "Restart Service", icon: "🔄", desc: "Gracefully restart the failing service container", color: COLORS.cyan },
    { key: "rollback", label: "Rollback Deployment", icon: "⏪", desc: "Revert to last stable deployment v2.3.1", color: COLORS.purple },
    { key: "scale", label: "Scale Servers", icon: "📈", desc: "Add 3 instances to handle traffic surge", color: COLORS.green },
    { key: "cache", label: "Clear Cache", icon: "🗑", desc: "Purge Redis cache and CDN edge nodes", color: COLORS.yellow },
    { key: "database", label: "Restart Database", icon: "🗄", desc: "Flush DB connection pool and reconnect", color: "#f97316" },
    { key: "lb", label: "Rebalance Load", icon: "⚖", desc: "Redistribute traffic across healthy nodes", color: "#8b5cf6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>AI Auto-Healing</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>ONE-CLICK RECOVERY • AI-GUIDED REMEDIATION</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {healActions.map(a => (
          <div key={a.key} className="glass hover-card neon-border-purple" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{a.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, fontFamily: "'Exo 2'" }}>{a.label}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20, lineHeight: 1.6 }}>{a.desc}</div>
            <button onClick={() => heal(a.key)} disabled={actions[a.key] === "loading" || actions[a.key] === "success"}
              style={{ width: "100%", padding: "10px", borderRadius: 8, cursor: actions[a.key] ? "default" : "pointer",
                background: actions[a.key] === "success" ? `rgba(0,255,136,0.15)` : actions[a.key] === "loading" ? "rgba(168,85,247,0.1)" : `${a.color}18`,
                border: `1px solid ${actions[a.key] === "success" ? COLORS.green : actions[a.key] === "loading" ? COLORS.purple : a.color}40`,
                color: actions[a.key] === "success" ? COLORS.green : actions[a.key] === "loading" ? COLORS.purple : a.color,
                fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, letterSpacing: 1, transition: "all 0.3s" }}>
              {actions[a.key] === "loading" ? "⟳ Executing..." : actions[a.key] === "success" ? "✓ COMPLETE" : "▶ EXECUTE"}
            </button>
          </div>
        ))}
      </div>

      {aiSummary && (
        <div className="glass neon-border-green fade-in-up" style={{ background: "rgba(0,255,136,0.05)", border: `1px solid rgba(0,255,136,0.3)`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, letterSpacing: 2, color: COLORS.green, textTransform: "uppercase", marginBottom: 12 }}>🤖 AI Recovery Summary</div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: "#e2e8f0" }}>{aiSummary}</div>
        </div>
      )}
    </div>
  );
}

function IncidentTimelinePage() {
  const events = [
    { time: "14:18:00", type: "deploy", label: "Deployment v2.4.0", desc: "Payment API new build deployed to production", color: COLORS.purple, icon: "🚀" },
    { time: "14:19:43", type: "spike", label: "Latency Spike", desc: "Response time jumped from 142ms → 847ms", color: COLORS.yellow, icon: "⚡" },
    { time: "14:21:15", type: "error", label: "DB Pool Exhausted", desc: "PostgreSQL connection pool at 100% capacity", color: COLORS.red, icon: "🔴" },
    { time: "14:22:01", type: "alert", label: "Critical Alert Fired", desc: "PagerDuty + Slack notifications sent to on-call", color: COLORS.red, icon: "🚨" },
    { time: "14:23:55", type: "investigate", label: "Investigation Started", desc: "SRE team engaged, incident channel opened", color: COLORS.cyan, icon: "🔍" },
    { time: "14:27:30", type: "action", label: "Scale-out Initiated", desc: "DB read replicas +2, connection pool x3", color: COLORS.purple, icon: "📈" },
    { time: "14:31:00", type: "recovery", label: "Latency Normalizing", desc: "Response time dropping: 847ms → 380ms → 189ms", color: COLORS.green, icon: "✅" },
    { time: "14:35:00", type: "resolved", label: "Incident Resolved", desc: "All metrics normal. Post-mortem scheduled.", color: COLORS.green, icon: "🎯" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>Incident Timeline</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>CINEMATIC REPLAY • PAYMENT API OUTAGE #INC-2847</div>
      </div>

      <div className="glass neon-border-purple" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 32 }}>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 32, top: 0, bottom: 0, width: 2,
            background: `linear-gradient(to bottom, ${COLORS.purple}, ${COLORS.cyan})`, opacity: 0.3 }} />
          {events.map((ev, i) => (
            <div key={i} className="fade-in-up hover-card" style={{ display: "flex", gap: 24, marginBottom: 28, paddingLeft: 8, animationDelay: `${i * 0.1}s` }}>
              <div style={{ flexShrink: 0, width: 52, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  background: `${ev.color}20`, border: `2px solid ${ev.color}60`, zIndex: 1,
                  boxShadow: `0 0 16px ${ev.color}40` }}>{ev.icon}</div>
              </div>
              <div style={{ flex: 1, paddingTop: 8 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: ev.color }}>{ev.label}</span>
                  <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#64748b" }}>{ev.time}</span>
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{ev.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExplainPage() {
  const [selected, setSelected] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const streamRef = useRef(null);

  const incidents = [
    { label: "Payment API Outage", technical: "PostgreSQL connection pool exhausted under 3x traffic surge, resulting in TCP timeouts and HTTP 503 responses" },
    { label: "Auth Service Latency", technical: "JWT RS256 validation bottleneck post certificate rotation causing 847ms P99 latency spike" },
    { label: "Search Engine Overload", technical: "Elasticsearch cluster RED state due to 8x traffic spike overwhelming shard allocation" },
    { label: "Webhook Gateway Timeout", technical: "Downstream vendor API rate limiting at 1000 req/min causing exponential retry storms" },
  ];

  const explain = async (inc) => {
    setSelected(inc);
    setExplanation("");
    setLoading(true);

    const prompt = `Explain this technical incident in simple, friendly language for a non-technical business person (CEO, product manager, or customer). Keep it under 4 sentences. Explain what happened, why it matters to the business, and what's being done. No technical jargon.

Technical incident: ${inc.technical}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setLoading(false);
      let i = 0;
      clearInterval(streamRef.current);
      streamRef.current = setInterval(() => {
        i += 3;
        setExplanation(text.slice(0, i));
        if (i >= text.length) clearInterval(streamRef.current);
      }, 15);
    } catch { setLoading(false); setExplanation("AI unavailable."); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>Explain Like I'm Not an Engineer</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>AI TRANSLATES TECH → BUSINESS LANGUAGE</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {incidents.map(inc => (
          <div key={inc.label} className="glass hover-card neon-border-purple" onClick={() => explain(inc)}
            style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, cursor: "pointer",
              border: selected?.label === inc.label ? `1px solid ${COLORS.cyan}` : undefined,
              boxShadow: selected?.label === inc.label ? `0 0 20px rgba(0,229,255,0.2)` : undefined }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, fontFamily: "'Exo 2'" }}>{inc.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#64748b", lineHeight: 1.7, marginBottom: 16 }}>{inc.technical}</div>
            <div style={{ fontSize: 12, color: COLORS.cyan }}>Click to get plain-English explanation →</div>
          </div>
        ))}
      </div>

      {(explanation || loading) && (
        <div className="glass fade-in-up" style={{ background: "rgba(0,229,255,0.05)", border: `1px solid rgba(0,229,255,0.3)`, borderRadius: 12, padding: 32 }}>
          <div style={{ fontSize: 12, color: COLORS.cyan, fontFamily: "'Rajdhani'", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>📢 Plain English Explanation</div>
          {loading ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div className="spin-slow" style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${COLORS.cyan}`, borderTopColor: "transparent" }} />
              <span style={{ color: "#64748b", fontSize: 13 }}>AI is translating...</span>
            </div>
          ) : (
            <div style={{ fontSize: 16, lineHeight: 1.9, color: "#e2e8f0", fontFamily: "'Exo 2'" }}>{explanation}</div>
          )}
        </div>
      )}
    </div>
  );
}

function InfraMapPage() {
  const nodes = [
    { id: "us-east", label: "US East", x: 25, y: 35, health: 97, status: "healthy", load: 67 },
    { id: "us-west", label: "US West", x: 12, y: 32, health: 99, status: "healthy", load: 45 },
    { id: "eu-west", label: "EU West", x: 47, y: 28, health: 88, status: "degraded", load: 82 },
    { id: "eu-central", label: "EU Central", x: 52, y: 30, health: 94, status: "healthy", load: 59 },
    { id: "ap-south", label: "AP South", x: 72, y: 48, health: 71, status: "critical", load: 94 },
    { id: "ap-east", label: "AP East", x: 82, y: 38, health: 96, status: "healthy", load: 51 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="shimmer-text" style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800 }}>Global Infrastructure Map</div>
        <div style={{ color: "#64748b", fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>6 REGIONS • LIVE HEALTH MONITORING</div>
      </div>

      <div className="glass neon-border-purple" style={{ background: COLORS.bgCard, borderRadius: 12, padding: 24, overflow: "hidden" }}>
        <div style={{ position: "relative", height: 380, background: "rgba(0,0,0,0.4)", borderRadius: 8,
          backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(168,85,247,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(0,229,255,0.04) 0%, transparent 60%)",
          border: `1px solid rgba(168,85,247,0.1)` }}>

          {/* Grid lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`h${i}`} style={{ position: "absolute", left: 0, right: 0, top: `${i * 12.5}%`, height: 1, background: "rgba(168,85,247,0.06)" }} />
          ))}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={`v${i}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${i * 8.33}%`, width: 1, background: "rgba(168,85,247,0.06)" }} />
          ))}

          {/* Connection lines */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            {nodes.flatMap((n1, i) => nodes.slice(i + 1).map(n2 => (
              <line key={`${n1.id}-${n2.id}`}
                x1={`${n1.x}%`} y1={`${n1.y + 5}%`} x2={`${n2.x}%`} y2={`${n2.y + 5}%`}
                stroke={`rgba(168,85,247,0.12)`} strokeWidth={1} strokeDasharray="4 4" />
            )))}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const color = node.status === "healthy" ? COLORS.green : node.status === "degraded" ? COLORS.yellow : COLORS.red;
            return (
              <div key={node.id} style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%,-50%)" }}>
                {node.status === "critical" && (
                  <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: `${COLORS.red}20`, animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                )}
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${color}18`,
                  border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: `0 0 20px ${color}40`, transition: "all 0.3s" }}>
                  <div style={{ fontSize: 18 }}>🖥</div>
                </div>
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
                  textAlign: "center", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "'Rajdhani'" }}>{node.label}</div>
                  <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono'" }}>{node.health}%</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginTop: 24 }}>
          {nodes.map(node => {
            const color = node.status === "healthy" ? COLORS.green : node.status === "degraded" ? COLORS.yellow : COLORS.red;
            return (
              <div key={node.id} className="hover-card" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${color}30`, borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 20, color, fontFamily: "'JetBrains Mono'", fontWeight: 700 }}>{node.health}%</div>
                <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Rajdhani'", letterSpacing: 1, margin: "4px 0" }}>{node.label.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: color, fontFamily: "'Rajdhani'" }}>{node.status.toUpperCase()}</div>
                <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${node.load}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LandingPage({ onEnter }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(p => p + 1), 100); return () => clearInterval(t); }, []);

  const features = [
    { icon: "⚡", title: "Real-Time Monitoring", desc: "Sub-second API health checks across all regions with live dashboards." },
    { icon: "🤖", title: "AI Failure Detection", desc: "Claude AI analyzes logs instantly and pinpoints root causes in seconds." },
    { icon: "🔮", title: "Predictive Analytics", desc: "Predict outages 15 minutes before they happen with 94% accuracy." },
    { icon: "🛠", title: "Auto-Healing", desc: "One-click recovery actions with AI-guided remediation workflows." },
    { icon: "🌍", title: "Global Infrastructure", desc: "Monitor 6 regions worldwide with animated health maps." },
    { icon: "📊", title: "Incident Reports", desc: "AI-generated PDF reports for stakeholders in plain English." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, position: "relative", overflow: "hidden" }}>
      <Particles />
      <ScanLine />

      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px 60px", borderBottom: `1px solid ${COLORS.border}`,
        background: "rgba(5,8,17,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.purpleGlow}, ${COLORS.cyan})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          <span style={{ fontFamily: "'Exo 2'", fontWeight: 800, fontSize: 20, color: "#e2e8f0" }}>PulseGuard <span className="shimmer-text">AI</span></span>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {["Product", "Pricing", "Docs", "Blog"].map(item => (
            <div key={item} style={{ color: "#94a3b8", cursor: "pointer", fontSize: 14, transition: "color 0.2s" }}>{item}</div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={{ padding: "8px 20px", borderRadius: 8, cursor: "pointer", background: "transparent",
            border: `1px solid ${COLORS.border}`, color: "#94a3b8", fontSize: 13 }}>Sign In</button>
          <button className="btn-primary" onClick={onEnter}>Launch App →</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "100px 60px 80px", maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px",
          borderRadius: 20, border: `1px solid rgba(168,85,247,0.4)`, background: "rgba(168,85,247,0.1)",
          marginBottom: 32, fontSize: 12, fontFamily: "'Rajdhani'", letterSpacing: 2, color: COLORS.purple }}>
          <span className="status-dot-green" />  LIVE DEMO • POWERED BY CLAUDE AI
        </div>

        <h1 style={{ fontFamily: "'Exo 2'", fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginBottom: 24 }}>
          <span style={{ color: "#e2e8f0" }}>Transform API Chaos</span><br />
          <span className="shimmer-text">Into Instant AI</span><br />
          <span style={{ color: "#e2e8f0" }}>Intelligence.</span>
        </h1>

        <p style={{ fontSize: 18, color: "#94a3b8", lineHeight: 1.8, maxWidth: 600, margin: "0 auto 48px", fontFamily: "'Exo 2'", fontWeight: 300 }}>
          AI-powered API monitoring that detects failures before users notice them,
          explains root causes in seconds, and auto-heals your infrastructure.
        </p>

        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button className="btn-primary" onClick={onEnter} style={{ padding: "14px 36px", fontSize: 15, borderRadius: 12, letterSpacing: 2 }}>
            ⚡ LAUNCH DASHBOARD
          </button>
          <button style={{ padding: "14px 36px", fontSize: 15, borderRadius: 12, cursor: "pointer",
            background: "transparent", border: `1px solid ${COLORS.border}`, color: "#94a3b8", fontFamily: "'Rajdhani'", fontWeight: 600, letterSpacing: 2 }}>
            WATCH DEMO
          </button>
        </div>

        {/* Live stats strip */}
        <div style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 64, padding: "24px 32px",
          background: "rgba(0,0,0,0.4)", border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
          {[
            { v: "99.9%", l: "Uptime SLA" },
            { v: "<50ms", l: "Avg Detection" },
            { v: "10K+", l: "APIs Monitored" },
            { v: "94%", l: "Prediction Accuracy" },
          ].map(s => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Exo 2'", fontSize: 28, fontWeight: 800, color: COLORS.cyan }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'Rajdhani'", letterSpacing: 2, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, color: COLORS.purple, fontFamily: "'Rajdhani'", letterSpacing: 4, marginBottom: 16 }}>PLATFORM CAPABILITIES</div>
          <h2 style={{ fontFamily: "'Exo 2'", fontSize: 40, fontWeight: 800, color: "#e2e8f0" }}>Built for Modern DevOps Teams</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {features.map((f, i) => (
            <div key={f.title} className="glass hover-card gradient-border fade-in-up" style={{ borderRadius: 16, padding: 28, animationDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontFamily: "'Exo 2'", fontWeight: 700, fontSize: 18, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", padding: "80px 60px",
        background: "linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(0,229,255,0.05) 100%)" }}>
        <h2 style={{ fontFamily: "'Exo 2'", fontSize: 44, fontWeight: 800, marginBottom: 24 }}>
          <span className="shimmer-text">Ready to Guard Your APIs?</span>
        </h2>
        <button className="btn-primary pulse-glow" onClick={onEnter} style={{ padding: "16px 48px", fontSize: 16, borderRadius: 14, letterSpacing: 3 }}>
          ⚡ START FREE TRIAL
        </button>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "◈" },
  { id: "ai-analyzer", label: "AI Analyzer", icon: "🤖" },
  { id: "alerts", label: "Alert Center", icon: "🔔" },
  { id: "terminal", label: "Log Terminal", icon: "⌨" },
  { id: "api-tester", label: "API Tester", icon: "▶" },
  { id: "auto-heal", label: "Auto-Healing", icon: "🛠" },
  { id: "timeline", label: "Timeline", icon: "📅" },
  { id: "explain", label: "Explain It", icon: "💬" },
  { id: "infra-map", label: "Infra Map", icon: "🌍" },
];

function generateMetrics() {
  const now = Date.now();
  const pts = (base, v, n = 20) => Array.from({ length: n }, (_, i) => ({ t: `${i}m`, v: Math.round(generateMetricPoint(base, v)) }));
  return { latency: pts(180, 60), requests: pts(450, 150), errors: pts(1.8, 1.2), traffic: pts(2800, 800) };
}

export default function App() {
  const [page, setPage] = useState("landing");
  const [activePage, setActivePage] = useState("dashboard");
  const [metrics, setMetrics] = useState(generateMetrics());
  const [logs, setLogs] = useState(() => Array.from({ length: 30 }, () => pick(LOG_TEMPLATES)));
  const [chatOpen, setChatOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (page !== "app") return;
    const t = setInterval(() => {
      setMetrics(generateMetrics());
      setLogs(prev => {
        const newLog = pick(LOG_TEMPLATES);
        return [...prev.slice(-49), newLog];
      });
    }, 5000);
    return () => clearInterval(t);
  }, [page]);

  if (page === "landing") {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <LandingPage onEnter={() => setPage("app")} />
      </>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <DashboardPage metrics={metrics} logs={logs} />;
      case "ai-analyzer": return <AIAnalyzerPage />;
      case "alerts": return <AlertsPage />;
      case "terminal": return <TerminalPage logs={logs.map(l => l.msg())} />;
      case "api-tester": return <APITesterPage />;
      case "auto-heal": return <AutoHealingPage />;
      case "timeline": return <IncidentTimelinePage />;
      case "explain": return <ExplainPage />;
      case "infra-map": return <InfraMapPage />;
      default: return <DashboardPage metrics={metrics} logs={logs} />;
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Particles />
      <ScanLine />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>

        {/* Sidebar */}
        <div style={{ width: sidebarCollapsed ? 64 : 220, flexShrink: 0,
          background: "rgba(5,8,17,0.95)", borderRight: `1px solid ${COLORS.border}`,
          display: "flex", flexDirection: "column", transition: "width 0.3s", overflow: "hidden" }}>

          {/* Logo */}
          <div style={{ padding: sidebarCollapsed ? "20px 16px" : "20px 20px", borderBottom: `1px solid ${COLORS.border}`,
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("landing")}>
            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: `linear-gradient(135deg, ${COLORS.purpleGlow}, ${COLORS.cyan})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            {!sidebarCollapsed && <span style={{ fontFamily: "'Exo 2'", fontWeight: 800, fontSize: 16, whiteSpace: "nowrap" }}>PulseGuard <span className="shimmer-text">AI</span></span>}
          </div>

          {/* Status */}
          {!sidebarCollapsed && (
            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 10, color: "#64748b", fontFamily: "'Rajdhani'", letterSpacing: 2, marginBottom: 8 }}>SYSTEM STATUS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.green }}>
                <div className="status-dot-green" /> All Systems Operational
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.red, marginTop: 4 }}>
                <div className="status-dot-red" /> 2 Active Incidents
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
            {NAV_ITEMS.map(item => (
              <div key={item.id} className={`nav-item ${activePage === item.id ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                style={{ justifyContent: sidebarCollapsed ? "center" : undefined }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </div>
            ))}
          </nav>

          {/* Collapse toggle */}
          <div style={{ padding: "12px", borderTop: `1px solid ${COLORS.border}` }}>
            <div style={{ padding: "8px", textAlign: "center", cursor: "pointer", color: "#64748b",
              borderRadius: 6, transition: "all 0.2s", fontSize: 16 }}
              onClick={() => setSidebarCollapsed(p => !p)}>
              {sidebarCollapsed ? "›" : "‹"}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, overflow: "auto", background: COLORS.bg }}>
          {/* Top bar */}
          <div style={{ position: "sticky", top: 0, zIndex: 10, padding: "14px 28px",
            background: "rgba(5,8,17,0.9)", borderBottom: `1px solid ${COLORS.border}`,
            backdropFilter: "blur(20px)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, color: "#64748b", fontFamily: "'Rajdhani'", letterSpacing: 1 }}>
                <span style={{ color: "#475569" }}>PulseGuard AI</span> / {NAV_ITEMS.find(n => n.id === activePage)?.label}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "#475569" }}>
                {new Date().toLocaleTimeString()}
              </div>
              <div style={{ padding: "5px 12px", borderRadius: 6, background: "rgba(255,51,102,0.15)",
                border: "1px solid rgba(255,51,102,0.3)", fontSize: 11, color: COLORS.red,
                fontFamily: "'Rajdhani'", fontWeight: 700, cursor: "pointer" }}>
                🔴 2 CRITICAL
              </div>
              <button className="btn-primary" onClick={() => setChatOpen(p => !p)} style={{ padding: "6px 16px" }}>
                🤖 AI CHAT
              </button>
            </div>
          </div>

          {/* Page content */}
          <div style={{ padding: 28, position: "relative", zIndex: 1 }} className="grid-bg">
            {renderPage()}
          </div>
        </div>
      </div>

      {/* Floating chat */}
      {chatOpen && <ChatAssistant onClose={() => setChatOpen(false)} />}

      {/* Chat FAB */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} className="pulse-glow"
          style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.purpleGlow}, ${COLORS.cyan}40)`,
            border: `1px solid ${COLORS.borderCyan}`, cursor: "pointer", fontSize: 24,
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          🤖
        </button>
      )}
    </>
  );
}
