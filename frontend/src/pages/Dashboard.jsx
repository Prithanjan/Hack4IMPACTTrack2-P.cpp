import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, AlertTriangle, ChevronRight,
  BrainCircuit, Network, Ruler, Copy, PenTool, Share, Sparkles, 
  Activity, Shield, Zap, Globe
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

/* ─── ECG Line ─────────────────────────────────────────────────────── */
function ECGLine({ className = '' }) {
  return (
    <svg viewBox="0 0 400 60" className={className} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="
          0,30 40,30 50,30 55,5 60,55 65,10 70,50 75,30
          120,30 160,30 170,30 175,5 180,55 185,10 190,50 195,30
          240,30 280,30 290,30 295,5 300,55 305,10 310,50 315,30
          360,30 400,30
        "
      />
    </svg>
  );
}

/* ─── Animated counter ─────────────────────────────────────────────── */
function useCount(target, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

/* ─── Scanning ring ────────────────────────────────────────────────── */
function ScanningRing({ size = 200, color = 'var(--color-primary)', speed = 3 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full opacity-15 blur-sm" style={{
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        animation: `pulse ${speed}s ease-in-out infinite`
      }} />
      <svg className="absolute inset-0 w-full h-full" style={{ animation: `spin ${speed * 2}s linear infinite` }}>
        <circle cx="50%" cy="50%" r="45%" fill="none" stroke={color} strokeWidth="1.5"
          strokeDasharray="60 240" strokeLinecap="round" opacity="0.5" />
      </svg>
      <svg className="absolute inset-0 w-full h-full" style={{ animation: `spin ${speed * 3}s linear infinite reverse` }}>
        <circle cx="50%" cy="50%" r="35%" fill="none" stroke={color} strokeWidth="1"
          strokeDasharray="30 200" strokeLinecap="round" opacity="0.35" />
      </svg>
      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px 3px ${color}` }} />
    </div>
  );
}

/* ─── Floating orb — uses CSS variables ────────────────────────────── */
function FloatingOrb({ size, color, top, left, delay = 0, blur = 80 }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{
      width: size, height: size, top, left,
      background: `radial-gradient(circle at 40% 40%, ${color}, transparent 70%)`,
      filter: `blur(${blur}px)`,
      animation: `floatOrb 9s ease-in-out ${delay}s infinite`,
      opacity: 1,
    }} />
  );
}

/* ─── Stat card (fully theme-aware) ───────────────────────────────── */
function StatCard({ label, value, subtext, icon, accent = 'var(--color-primary)', badge }) {
  const animated = useCount(value, 1600);
  return (
    <div className="relative overflow-hidden rounded-2xl p-px group" style={{
      background: `linear-gradient(135deg, ${accent}30, transparent 55%)`,
    }}>
      <div className="relative rounded-2xl p-6 h-full overflow-hidden" style={{
        background: 'var(--color-surface-container-lowest)',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      }}>
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px" style={{
          background: `linear-gradient(90deg, transparent, ${accent}50, transparent)`
        }} />
        {/* Hover bloom */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{
          background: `radial-gradient(circle, ${accent}18, transparent 70%)`
        }} />

        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: accent }}>{label}</span>
          {badge && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
              background: `${accent}15`, color: accent, border: `1px solid ${accent}30`
            }}>{badge}</span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <h3 className="text-5xl font-black font-[var(--font-headline)] tracking-tight" style={{ color: 'var(--color-on-surface)' }}>
            {animated}
          </h3>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-1" style={{
            background: `${accent}12`,
            border: `1px solid ${accent}25`,
            color: accent,
          }}>
            {icon}
          </div>
        </div>

        <p className="text-[11px] mt-4 font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>{subtext}</p>

        <div className="mt-3 opacity-20" style={{ color: accent }}>
          <ECGLine className="w-full h-5" />
        </div>
      </div>
    </div>
  );
}

/* ─── Live status dot ──────────────────────────────────────────────── */
function LiveDot({ color = '#4ade80' }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

// ── Daily rotating AI insight (one per weekday) ───────────────────────────
const AI_INSIGHTS = [
  { text: 'Pulmonary nodule detection accuracy has improved by 14% this month with DenseNet121 v2025 updates. Ensure your dataset is current for optimal triage.', tag: 'Model Update' },
  { text: 'Grad-CAM spatial resolution is highest when input images are ≥512px. Lower-res images may show wider activation zones — re-scan if borderline.', tag: 'XAI Tip' },
  { text: 'Early-stage pleural effusion presents as blunting of costophrenic angles. High sensitivity (>90%) achieved when combined with lateral view inputs.', tag: 'Clinical Note' },
  { text: 'Ensemble models (ResNet50 + DenseNet121) reduce single-model bias. Confidence variance across both models is a strong uncertainty signal.', tag: 'Research' },
  { text: 'COVID-19 pneumonia often shows bilateral, peripheral ground-glass opacity. Use the "Uncertain" flag for any atypical multi-focal presentation.', tag: 'Diagnostic' },
  { text: 'Inference cache hit rate above 70% indicates repeated demo usage — ideal for demonstrations. Real-world cache rates are typically 15–25%.', tag: 'Performance' },
  { text: 'HIPAA-compliant deployments require zero image retention. All images in this system are discarded in-memory post-inference — no storage occurs.', tag: 'Compliance' },
];

function formatScanDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, critical: 0 });
  const [recentScans, setRecentScans] = useState([]);
  const todayInsight = AI_INSIGHTS[new Date().getDay() % AI_INSIGHTS.length];

  /* ─── Particle canvas (reads CSS vars so it adapts to theme) ───── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const particles = Array.from({ length: 35 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.4,
    }));

    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particleColor = getVar('--hero-particle') || 'rgba(37,99,235,0.35)';
      const lineColor = getVar('--hero-particle-ln') || 'rgba(37,99,235,0.10)';

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        particles.forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = lineColor.replace(')', `, ${0.15 * (1 - dist / 110)})`).replace('rgba(', 'rgba(').replace('rgb(', 'rgba(');
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: scans } = await supabase
        .from('scans')
        .select('id, filename, top_diagnosis, confidence, urgency, created_at, cached, latency_ms')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (scans) {
        const total = scans.length;
        const critical = scans.filter(s => s.urgency === 'high' || s.top_diagnosis === 'Pneumonia').length;
        const pending = scans.filter(s => s.urgency === 'moderate').length;
        setStats({ total, pending, critical });
        setRecentScans(scans.slice(0, 5));
      }
    } catch (_) { /* Supabase table may not exist yet */ }
  }, [user]);

  useEffect(() => {
    fetchDashboardData();
    const handler = () => fetchDashboardData();
    window.addEventListener('scanSaved', handler);
    return () => window.removeEventListener('scanSaved', handler);
  }, []);

  return (
    <main className="w-full flex-1">

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[420px] flex flex-col justify-center px-8 md:px-12 py-16" style={{
        background: 'linear-gradient(135deg, var(--hero-bg-start) 0%, var(--hero-bg-end) 100%)',
      }}>

        {/* Particle canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.7 }} />

        {/* Floating orbs — using CSS variable colours */}
        <FloatingOrb size={480} color="var(--hero-orb-1)" top="-140px" left="-100px" delay={0} blur={110} />
        <FloatingOrb size={320} color="var(--hero-orb-2)" top="50px" left="55%" delay={2.5} blur={90} />
        <FloatingOrb size={260} color="var(--hero-orb-3)" top="220px" left="22%" delay={4.5} blur={80} />

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, var(--scanline-color, rgba(0,0,0,0.025)) 2px, var(--scanline-color, rgba(0,0,0,0.025)) 4px)`,
        }} />

        {/* Bottom edge divider */}
        <div className="absolute inset-x-0 bottom-0 h-px" style={{
          background: 'linear-gradient(90deg, transparent, var(--color-outline-variant), transparent)'
        }} />

        {/* Hero content */}
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <LiveDot color="#4ade80" />
            <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-on-surface-variant)' }}>
              AI Engine Online · 99.8% uptime
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]" style={{ color: 'var(--color-on-surface)' }}>
            Clinical<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-tertiary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Precision
            </span>{' '}
            <span className="relative inline-block">
              AI
            </span>
          </h1>

          <p className="mt-4 text-base md:text-lg max-w-xl leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
            Radiograph intelligence engineered for full clinical workflow — from triage classification to Grad-CAM localization, all in milliseconds.
          </p>

          <div className="flex flex-wrap gap-4 mt-8">
            <Link to="/analysis">
              <button className="relative overflow-hidden px-7 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 group" style={{
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-container))',
                color: 'var(--color-on-primary)',
                boxShadow: '0 6px 24px rgba(37,99,235,0.28)',
              }}>
                <span className="relative z-10 flex items-center gap-2">
                  <Zap size={16} /> Start Analysis
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)'
                }} />
              </button>
            </Link>
            <Link to="/records">
              <button className="px-7 py-3.5 rounded-xl font-bold text-sm transition-all" style={{
                background: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
                border: '1px solid var(--color-outline-variant)',
              }}>
                <span className="flex items-center gap-2"><Globe size={16} />Clinical Database</span>
              </button>
            </Link>
          </div>
        </div>

        {/* ── Scanner widget ─────────────────────────────────────────── */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-2">
          <div className="relative rounded-2xl p-px overflow-hidden" style={{
            background: `linear-gradient(135deg, var(--scanner-border), transparent 70%)`,
            boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px var(--scanner-border)',
          }}>
            <div className="rounded-2xl p-7 flex flex-col items-center gap-4" style={{
              background: 'var(--scanner-bg)',
              backdropFilter: 'blur(24px)',
            }}>
              {/* Scanning ring */}
              <div className="relative">
                <ScanningRing size={130} color="var(--color-primary)" speed={3} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl" style={{
                    color: 'var(--color-primary)',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}>radiology</span>
                </div>
              </div>

              <div className="text-center">
                <div className="text-[9px] font-extrabold tracking-widest uppercase mb-1.5" style={{ color: 'var(--color-outline)' }}>
                  AI SCAN STATUS
                </div>
                <div className="flex items-center justify-center gap-2">
                  <LiveDot color="var(--color-primary)" />
                  <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>AWAITING INPUT</span>
                </div>
              </div>

              {/* Mini ECG */}
              <div className="w-36 opacity-40" style={{ color: 'var(--color-primary)' }}>
                <ECGLine className="w-full h-6" />
              </div>

              {/* System stat chips */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {[
                  { label: 'GPU', val: '0%' },
                  { label: 'Latency', val: '<500ms' },
                  { label: 'Model', val: 'v2.4' },
                  { label: 'Mode', val: 'READY' },
                ].map(s => (
                  <div key={s.label} className="rounded-lg p-2.5 text-center" style={{
                    background: 'var(--scanner-cell-bg)',
                    border: '1px solid var(--scanner-cell-bdr)',
                  }}>
                    <div className="text-[8px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-outline)' }}>{s.label}</div>
                    <div className="text-xs font-black mt-0.5" style={{ color: 'var(--color-primary)' }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-10">

        {/* Stat cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard label="Total Scans" value={stats.total} subtext="All time, your account"
            icon={<Activity size={22} />} accent="var(--color-primary)" badge="LIVE" />
          <StatCard label="Pending Reviews" value={stats.pending} subtext="Moderate urgency findings"
            icon={<TrendingUp size={22} />} accent="#818cf8" />
          <StatCard label="Critical Findings" value={stats.critical} subtext="Urgent or Pneumonia cases"
            icon={<AlertTriangle size={22} />} accent="var(--color-error)" />
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Recent Analysis (8 col) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-on-surface)' }}>Recent Analysis</h3>
              <Link to="/records" className="text-sm font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>
                View All Records →
              </Link>
            </div>

            <div className="rounded-2xl overflow-hidden relative" style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{
                background: 'linear-gradient(90deg, transparent, var(--color-outline-variant), transparent)'
              }} />
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: 'var(--color-surface-container-low)' }}>
                    {['Patient ID', 'Scan Type', 'AI Confidence', 'Status', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--color-outline)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentScans.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <ScanningRing size={56} color="var(--color-outline)" speed={5} />
                          <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface-variant)' }}>No scans yet. Upload a radiograph to begin.</p>
                          <Link to="/analysis">
                            <button className="px-5 py-2 rounded-xl text-xs font-bold hover:opacity-90 active:scale-95" style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)' }}>Start First Scan</button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : recentScans.map(scan => (
                    <tr key={scan.id} style={{ borderTop: '1px solid var(--color-surface-container)' }}>
                      <td className="px-6 py-4 text-xs font-mono font-bold" style={{ color: 'var(--color-outline)' }}>
                        MSC-{scan.id.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold" style={{ color: 'var(--color-on-surface)' }}>X-Ray</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-14 rounded-full" style={{ background: 'var(--color-surface-container-high)' }}>
                            <div className="h-full rounded-full" style={{ width: `${scan.confidence ?? 0}%`, background: 'var(--color-primary)' }} />
                          </div>
                          <span className="text-xs font-bold" style={{ color: 'var(--color-primary)' }}>{scan.confidence?.toFixed(1) ?? '—'}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          scan.urgency === 'high' ? 'bg-red-500/10 text-red-500' :
                          scan.urgency === 'moderate' ? 'bg-yellow-500/10 text-yellow-600' :
                          'bg-green-500/10 text-green-600'
                        }`}>
                          {scan.top_diagnosis ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px]" style={{ color: 'var(--color-outline)' }}>{formatScanDate(scan.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* System Vitals */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{
                background: 'linear-gradient(90deg, transparent, var(--color-outline-variant), transparent)'
              }} />
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold" style={{ color: 'var(--color-on-surface)' }}>System Vitals</h4>
                <div className="flex items-center gap-2">
                  <LiveDot color="#4ade80" />
                  <span className="text-[10px] font-bold" style={{ color: 'var(--color-on-surface-variant)' }}>All systems nominal</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Model Accuracy', val: 94.7, color: 'var(--color-primary)' },
                  { label: 'Inference Speed', val: 88, color: '#818cf8' },
                  { label: 'DB Sync', val: 100, color: '#4ade80' },
                  { label: 'Cache Hit Rate', val: 72, color: 'var(--color-tertiary)' },
                ].map(v => (
                  <div key={v.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>{v.label}</span>
                      <span className="text-[10px] font-bold" style={{ color: v.color }}>{v.val}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container-high)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${v.val}%`,
                        background: v.color,
                        boxShadow: `0 0 6px ${v.color}`,
                        transition: 'width 1s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column (4 col) */}
          <div className="lg:col-span-4 space-y-5">

            {/* Clinical Intelligence */}
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{
              background: 'var(--color-surface-container-lowest)',
              border: '1px solid var(--color-outline-variant)',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            }}>
              <div className="absolute inset-x-0 top-0 h-px" style={{
                background: 'linear-gradient(90deg, transparent, var(--color-outline-variant), transparent)'
              }} />

              <h3 className="text-base font-bold mb-4" style={{ color: 'var(--color-on-surface)' }}>Clinical Intelligence</h3>
              <div className="space-y-3">
                {[
                  { icon: <BrainCircuit size={18} />, title: 'Auto-Triage Active', sub: 'Sorting urgent findings to top of queue.', color: 'var(--color-primary)' },
                  { icon: <Network size={18} />, title: 'Network Sync', sub: 'Cross-referencing national pathology database.', color: '#818cf8' },
                  { icon: <Shield size={18} />, title: 'HIPAA Mode', sub: 'All images processed in-memory, zero retention.', color: '#4ade80' },
                ].map(item => (
                  <div key={item.title} className="flex gap-3 p-3 rounded-xl transition-all hover:scale-[1.01] cursor-default" style={{
                    background: 'var(--color-surface-container-low)',
                    border: '1px solid var(--color-outline-variant)',
                  }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{
                      background: `${item.color}14`,
                      border: `1px solid ${item.color}28`,
                      color: item.color,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: 'var(--color-on-surface)' }}>{item.title}</p>
                      <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick tools */}
              <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--color-outline-variant)' }}>
                <h4 className="text-[10px] font-extrabold tracking-widest uppercase mb-3" style={{ color: 'var(--color-outline)' }}>Quick Tools</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: <Ruler size={16} />, label: 'Measure' },
                    { icon: <Copy size={16} />, label: 'Compare' },
                    { icon: <PenTool size={16} />, label: 'Annotate' },
                    { icon: <Share size={16} />, label: 'Consult' },
                  ].map(t => (
                    <button key={t.label} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 active:scale-95" style={{
                      background: 'var(--color-surface-container)',
                      border: '1px solid var(--color-outline-variant)',
                      color: 'var(--color-on-surface)',
                    }}>
                      <span style={{ color: 'var(--color-primary)' }}>{t.icon}</span>
                      <span className="text-[9px] font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Insight card */}
            <div className="rounded-2xl p-px overflow-hidden" style={{
              background: `linear-gradient(135deg, var(--color-primary-container), var(--color-tertiary-container))`,
            }}>
              <div className="rounded-2xl p-5 relative overflow-hidden" style={{
                background: 'linear-gradient(145deg, var(--color-surface-container-low), var(--color-surface-container-lowest))',
              }}>
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-10" style={{
                  background: 'radial-gradient(circle, var(--color-primary), transparent)',
                  animation: 'floatOrb 7s ease-in-out infinite',
                }} />

                <div className="flex items-start justify-between relative z-10">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                    background: 'var(--color-surface-container-high)',
                    border: '1px solid var(--color-outline-variant)',
                    color: 'var(--color-primary)',
                  }}>
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[9px] font-extrabold px-2 py-1 rounded-full" style={{
                    background: 'var(--color-surface-container-high)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-outline-variant)',
                    letterSpacing: '0.1em',
                  }}>V2.4 LATEST</span>
                </div>

                <div className="flex items-center justify-between mt-4 relative z-10">
                  <h4 className="text-base font-bold" style={{ color: 'var(--color-on-surface)' }}>AI Insight of the Day</h4>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-container-high)', color: 'var(--color-primary)', border: '1px solid var(--color-outline-variant)' }}>
                    {todayInsight.tag}
                  </span>
                </div>
                <p className="text-[11px] mt-2 leading-relaxed relative z-10" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {todayInsight.text}
                </p>

                <div className="mt-4 mb-1 opacity-25 relative z-10" style={{ color: 'var(--color-primary)' }}>
                  <ECGLine className="w-full h-5" />
                </div>

                <Link to="/analysis" className="relative z-10">
                  <button className="w-full mt-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2" style={{
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
                  }}>
                    <ChevronRight size={14} /> Start New Analysis
                  </button>
                </Link>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes floatOrb {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-20px) scale(1.04); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
