import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

const URGENCY_COLORS = {
  high:     'bg-red-500/10 text-red-500 border border-red-500/20',
  moderate: 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20',
  low:      'bg-green-500/10 text-green-600 border border-green-500/20',
};

function shortId(uuid) {
  return uuid ? `MSC-${uuid.substring(0, 6).toUpperCase()}` : '—';
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

export default function Records() {
  const { user, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All Records');
  const [searchQuery, setSearchQuery] = useState('');
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = ['All Records', 'Normal', 'Pneumonia', 'Effusion', 'Bronchitis', 'Asthma', 'Rib Fracture', 'Uncertain'];

  const fetchScans = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    // Timeout safety: if Supabase takes > 6s, show error instead of hanging
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Request timed out. The scans table may not exist in Supabase yet. Run the SQL setup script to create it.');
    }, 6000);

    try {
      const { data, error: fetchErr } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      clearTimeout(timeoutId);
      if (fetchErr) throw fetchErr;
      setScans(data ?? []);
    } catch (e) {
      clearTimeout(timeoutId);
      setError(e.message?.includes('does not exist') || e.code === '42P01'
        ? 'The scans table does not exist yet. Please run the SQL setup script in your Supabase SQL Editor.'
        : e.message);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScans();
    // Reload whenever a new scan is saved from AiAnalysis
    const handler = () => fetchScans();
    window.addEventListener('scanSaved', handler);
    return () => window.removeEventListener('scanSaved', handler);
  }, [fetchScans]);

  const lowerQuery = searchQuery.toLowerCase();
  const searchFiltered = scans.filter(s => {
    if (!lowerQuery) return true;
    return (
      s.id?.toLowerCase().includes(lowerQuery) ||
      s.top_diagnosis?.toLowerCase().includes(lowerQuery) ||
      s.filename?.toLowerCase().includes(lowerQuery) ||
      s.icd10?.toLowerCase().includes(lowerQuery)
    );
  });

  const filtered = activeFilter === 'All Records'
    ? searchFiltered
    : searchFiltered.filter(s => s.top_diagnosis?.toLowerCase() === activeFilter.toLowerCase()
        || (activeFilter === 'Uncertain' && s.urgency === 'high'));

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  // ── Trend Analysis ──────────────────────────────────────────
  const trendData = useMemo(() => {
    const sortedScans = [...scans].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return sortedScans.map((scan, idx) => ({
      date: new Date(scan.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      confidence: scan.confidence || 0,
      diagnosis: scan.top_diagnosis || 'Unknown',
      urgency: scan.urgency || 'low',
      fullDate: scan.created_at,
      index: idx,
    }));
  }, [scans]);

  const conditionTrend = useMemo(() => {
    if (trendData.length === 0) return { trend: 'neutral', change: 0, message: 'No data' };
    
    const recentScans = trendData.slice(-5);
    const avgConfidence = recentScans.reduce((sum, s) => sum + s.confidence, 0) / recentScans.length;
    const olderScans = trendData.slice(0, Math.max(1, trendData.length - 5));
    const oldAvgConfidence = olderScans.reduce((sum, s) => sum + s.confidence, 0) / olderScans.length;
    
    const confChange = avgConfidence - oldAvgConfidence;
    const normalCount = trendData.filter(s => s.diagnosis === 'Normal').length;
    const abnormalCount = trendData.filter(s => s.diagnosis !== 'Normal' && s.diagnosis !== 'Unknown').length;

    let trend = 'neutral';
    if (confChange > 5) trend = 'improving';
    else if (confChange < -5) trend = 'declining';
    
    return {
      trend,
      change: confChange,
      normalCount,
      abnormalCount,
      recentAvg: avgConfidence,
      message: trend === 'improving' ? 'Condition improving' : trend === 'declining' ? 'Condition declining' : 'Stable condition',
    };
  }, [trendData]);

  return (
    <main className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8 py-10 flex-1">

      {/* Profile Banner */}
      {profile && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)]">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary)] font-bold text-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-on-surface)] truncate">{profile.full_name ?? 'My Account'}</p>
            <p className="text-xs text-[var(--color-on-surface-variant)]">{profile.role ?? ''}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-[var(--color-primary)]">{profile.total_scans ?? scans.length}</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] font-bold">Total Scans</p>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="space-y-2">
        <h2 className="text-3xl font-bold font-[var(--font-headline)] tracking-tight text-[var(--color-on-surface)]">Patient Records</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-3xl leading-relaxed">
          Complete history of AI-assisted radiology analyses linked to your account.
        </p>
      </section>

      {/* Health Trend Section */}
      {scans.length > 1 && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Trend Status Card */}
            <div className="lg:col-span-1 rounded-2xl p-5 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-outline)]">Condition Status</h3>
              
              <div className="flex items-center gap-3">
                {conditionTrend.trend === 'improving' ? (
                  <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center text-green-600">
                    <TrendingUp size={20} />
                  </div>
                ) : conditionTrend.trend === 'declining' ? (
                  <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center text-red-600">
                    <TrendingDown size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-600">
                    <Minus size={20} />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold" style={{color: conditionTrend.trend === 'improving' ? '#4ade80' : conditionTrend.trend === 'declining' ? '#ef4444' : '#eab308'}}>
                    {conditionTrend.message}
                  </p>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">
                    {Math.abs(conditionTrend.change).toFixed(1)}% {conditionTrend.change > 0 ? 'gain' : 'loss'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--color-outline-variant)]/20">
                <div>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-bold">Normal Scans</p>
                  <p className="text-lg font-black text-green-600">{conditionTrend.normalCount}/{trendData.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] uppercase font-bold">Findings</p>
                  <p className="text-lg font-black text-red-600">{conditionTrend.abnormalCount}/{trendData.length}</p>
                </div>
              </div>
            </div>

            {/* Confidence Trend Chart */}
            <div className="lg:col-span-3 rounded-2xl p-5 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-outline)] mb-4">Confidence Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.2} />
                  <XAxis dataKey="date" stroke="var(--color-on-surface-variant)" style={{fontSize: '11px'}} />
                  <YAxis stroke="var(--color-on-surface-variant)" style={{fontSize: '11px'}} domain={[0, 100]} />
                  <RechartsTooltip 
                    contentStyle={{
                      background: 'var(--color-surface-container)',
                      border: '1px solid var(--color-outline-variant)',
                      borderRadius: '8px',
                      color: 'var(--color-on-surface)',
                    }}
                    formatter={(value) => [`${value.toFixed(1)}%`, 'Confidence']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="confidence" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorConfidence)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Diagnosis Distribution */}
          <div className="rounded-2xl p-5 border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-outline)] mb-4">Diagnosis Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(
                trendData.reduce((acc, scan) => {
                  acc[scan.diagnosis] = (acc[scan.diagnosis] || 0) + 1;
                  return acc;
                }, {})
              ).map(([diagnosis, count]) => ({ diagnosis, count }))}
              margin={{ top: 10, right: 10, left: -25, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.2} />
                <XAxis 
                  dataKey="diagnosis" 
                  stroke="var(--color-on-surface-variant)"
                  style={{fontSize: '11px'}}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="var(--color-on-surface-variant)" style={{fontSize: '11px'}} />
                <RechartsTooltip 
                  contentStyle={{
                    background: 'var(--color-surface-container)',
                    border: '1px solid var(--color-outline-variant)',
                    borderRadius: '8px',
                    color: 'var(--color-on-surface)',
                  }}
                  formatter={(value) => [value, 'Count']}
                />
                <Bar dataKey="count" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-2">
        <div className="relative flex-1 w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[var(--color-outline)]" />
          </div>
          <input
            type="text"
            placeholder="Search by ID, Diagnosis, ICD-10, or Filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/50 rounded-xl text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]/50 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-1 justify-end">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeFilter === f
                  ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 text-sm">
          <strong>Database note:</strong> {error}. Make sure to run the <code>scans</code> table SQL in your Supabase project.
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-container-low)]">
                {['Scan ID', 'File / Date', 'Top Diagnosis', 'Confidence', 'Urgency', 'ICD-10', ''].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-container)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-4xl text-[var(--color-outline)] animate-spin">progress_activity</span>
                      <p className="text-sm text-[var(--color-on-surface-variant)]">Loading records…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-5xl text-[var(--color-outline-variant)]">folder_open</span>
                      <p className="text-sm font-medium text-[var(--color-on-surface-variant)]">
                        {activeFilter === 'All Records' ? 'No scans yet.' : `No ${activeFilter} scans found.`}
                      </p>
                      <Link to="/analysis">
                        <button className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90 transition">
                          Start First Scan
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((scan) => (
                  <tr key={scan.id} className="hover:bg-[var(--color-surface-container-low)]/40 transition-colors group">
                    <td className="px-5 py-5 text-xs font-mono font-bold text-[var(--color-outline)]">{shortId(scan.id)}</td>
                    <td className="px-5 py-5">
                      <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate max-w-[160px]">{scan.filename ?? '—'}</p>
                      <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">{formatDate(scan.created_at)}</p>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`text-sm font-bold ${scan.top_diagnosis === 'Pneumonia' ? 'text-red-500' : scan.top_diagnosis === 'Normal' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {scan.top_diagnosis ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${scan.confidence ?? 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-[var(--color-on-surface)]">{scan.confidence?.toFixed(1) ?? '—'}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight inline-block ${URGENCY_COLORS[scan.urgency] ?? URGENCY_COLORS.low}`}>
                        {scan.urgency === 'high' ? '🔴 Urgent' : scan.urgency === 'moderate' ? '🟡 Moderate' : '🟢 Routine'}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-xs font-mono text-[var(--color-outline)]">{scan.icd10 ?? '—'}</td>
                    <td className="px-5 py-5">
                      <Link to="/analysis" className="text-[var(--color-primary)] font-bold text-xs hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                        Re-Analyze →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
