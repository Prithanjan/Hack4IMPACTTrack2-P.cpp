import React, { useState, useEffect, useCallback } from 'react';
import { Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = ['All Records', 'Normal', 'Pneumonia', 'Effusion', 'Uncertain'];

  const fetchScans = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setScans(data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
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

  const filtered = activeFilter === 'All Records'
    ? scans
    : scans.filter(s => s.top_diagnosis?.toLowerCase() === activeFilter.toLowerCase()
        || (activeFilter === 'Uncertain' && s.urgency === 'high'));

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-4 py-2">
        <div className="flex items-center gap-3 flex-wrap">
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
        <button className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm px-4 py-2 hover:bg-[var(--color-primary)]/5 rounded-lg transition-colors">
          <Filter size={16} /> Advanced Filters
        </button>
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
