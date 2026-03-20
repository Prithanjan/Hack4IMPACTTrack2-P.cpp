import React, { useState } from 'react';
import { Filter, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Records() {
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All Records');

  const filters = ['All Records', 'X-ray', 'MRI', 'CT Scan'];
  const patients = [];

  return (
    <main className="p-6 md:p-8 max-w-5xl w-full mx-auto space-y-8 py-10 flex-1">
      {/* Profile Banner */}
      {profile && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)]">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary)] font-bold text-lg shrink-0">
            {profile.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() ?? <UserCircle size={24}/>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--color-on-surface)] truncate">{profile.full_name ?? 'My Account'}</p>
            <p className="text-xs text-[var(--color-on-surface-variant)]">{profile.role ?? ''}{profile.institution ? ` · ${profile.institution}` : ''}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-[var(--color-primary)]">{profile.total_scans ?? 0}</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] font-bold">Total Scans</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <section className="space-y-2">
        <h2 className="text-3xl font-bold font-[var(--font-headline)] tracking-tight text-[var(--color-on-surface)]">Patient Records</h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-3xl leading-relaxed">
          Manage and review historical clinical data integrated with MediScan AI's diagnostic confidence layers.
        </p>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-4 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-semibold text-[var(--color-on-surface)]">Filter by Scan:</span>
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

      {/* Table */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-container-low)]">
                <th className="px-6 py-5 text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest min-w-[120px]">Patient ID</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest min-w-[200px]">Name</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest min-w-[140px]">Last Scan Date</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest min-w-[240px]">Primary Diagnosis</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest min-w-[140px]">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-[var(--color-outline)] uppercase tracking-widest text-center min-w-[140px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-surface-container)]">
              {patients.map((p, idx) => (
                <tr key={idx} className="hover:bg-[var(--color-surface-container-low)]/30 transition-colors group">
                  <td className="px-6 py-6 text-sm font-medium text-[var(--color-outline)]">
                    {p.id}
                  </td>
                  <td className="px-6 py-6">
                    <p className="font-bold text-[var(--color-on-surface)] text-base font-[var(--font-headline)]">{p.name}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Age: {p.age} • {p.gender}</p>
                  </td>
                  <td className="px-6 py-6 text-sm font-medium text-[var(--color-on-surface-variant)]">
                    {p.date}
                  </td>
                  <td className="px-6 py-6 text-sm font-semibold text-[var(--color-on-surface)]">
                    {p.diagnosis}
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-tight inline-block ${p.statusColor}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <Link to="/analysis" className="text-[var(--color-primary)] font-bold text-sm hover:underline">
                      View Analysis
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
