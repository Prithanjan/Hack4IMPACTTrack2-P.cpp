import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function AiAnalysis() {
  const { user, refreshProfile } = useAuth();
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [gatekeeperError, setGatekeeperError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const reportRef = useRef(null);

  const demoImages = [
    { id: 1, type: 'Normal',    name: 'demo_normal_1.jpg',   icon: 'check_circle', label: 'Normal #1' },
    { id: 2, type: 'Normal',    name: 'demo_normal_2.jpg',   icon: 'check_circle', label: 'Normal #2' },
    { id: 3, type: 'Normal',    name: 'demo_normal_3.jpg',   icon: 'check_circle', label: 'Normal #3' },
    { id: 4, type: 'Pneumonia', name: 'demo_abnormal_1.jpg', icon: 'coronavirus',  label: 'Pneumonia #1' },
    { id: 5, type: 'Pneumonia', name: 'demo_abnormal_2.jpg', icon: 'coronavirus',  label: 'Pneumonia #2' },
    { id: 6, type: 'Uncertain', name: 'demo_low_conf_1.jpg', icon: 'help',         label: 'Uncertain #1' },
  ];

  const handleDemoClick = (demoItem) => {
    const byteString = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: 'image/png' });
    const file = new File([blob], demoItem.name, { type: 'image/png' });
    setSelectedFile(file);
    setImagePreview(null);
    setAnalysisResult(null);
    setGatekeeperError(null);
    setSaveError(null);
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setAnalysisResult(null);
      setGatekeeperError(null);
      setSaveError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setGatekeeperError(null);
    setSaveError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/predict`, { method: 'POST', body: formData });
      const data = await response.json();

      if (data.status === 'success') {
        setAnalysisResult(data);

        // ── Save scan to Supabase ─────────────────────────────────────
        if (user) {
          const top = data.predictions[0];
          const { error: insertError } = await supabase.from('scans').insert({
            user_id: user.id,
            filename: selectedFile.name,
            top_diagnosis: top.class,
            confidence: parseFloat(top.confidence.toFixed(2)),
            urgency: data.clinical_interpretation?.urgency ?? 'low',
            icd10: data.clinical_interpretation?.icd10 ?? '',
            models_used: data.models_used,
            latency_ms: data.latency_ms,
            cached: data.cached,
          });

          if (insertError) {
            console.warn('Scan save failed:', insertError.message);
            setSaveError('Scan result could not be saved to your records. Check Supabase table setup.');
          } else {
            // Refresh profile to update total_scans counter
            await refreshProfile();
            // Notify Dashboard/Records to reload
            window.dispatchEvent(new CustomEvent('scanSaved'));
          }
        }

        window.dispatchEvent(new Event('aiResult'));
      } else if (data.gatekeeper === 'REJECTED') {
        setGatekeeperError(data.message || 'Image Quality Check failed. Please upload a valid X-ray.');
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      setGatekeeperError('Could not reach the backend. Make sure the Flask server is running on port 5000.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
  });

  const isLowConfidence = analysisResult && (
    !analysisResult.confidence_floor_passed ||
    analysisResult.predictions[0].confidence < 70.0
  );
  const topPrediction = analysisResult?.predictions?.[0];
  const interp = analysisResult?.clinical_interpretation;
  const heatmapSrc = analysisResult?.heatmap_base64
    ? `data:image/png;base64,${analysisResult.heatmap_base64}`
    : null;

  const urgencyStyle = {
    low:      { color: 'text-green-600',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
    moderate: { color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    high:     { color: 'text-red-600',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  };
  const urgency = urgencyStyle[interp?.urgency] ?? urgencyStyle.low;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8 py-10 flex-1 w-full">

      {/* Header */}
      <section className="space-y-1">
        <h2 className="text-2xl font-bold font-[var(--font-headline)] tracking-tight text-[var(--color-on-surface)]">
          Radiology Analysis
        </h2>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-2xl">
          Upload a chest radiograph for real-time pathology screening with Grad-CAM visual explanation.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ── LEFT COLUMN ── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Demo Dataset */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold font-[var(--font-label)] uppercase tracking-widest text-[var(--color-on-surface-variant)] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px]">gallery_thumbnail</span>
              Demo Dataset
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {demoImages.map(demo => (
                <button
                  key={demo.id}
                  onClick={() => handleDemoClick(demo)}
                  title={demo.name}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer text-[var(--color-on-surface)] bg-[var(--color-surface-container-lowest)]
                    ${selectedFile?.name === demo.name
                      ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30'
                      : 'border-[var(--color-outline-variant)]/20 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-container-high)]'
                    }`}
                >
                  <span className={`material-symbols-outlined text-base ${demo.id <= 3 ? 'text-green-500' : demo.id <= 5 ? 'text-red-500' : 'text-yellow-500'}`}>
                    {demo.icon}
                  </span>
                  <span className="text-[9px] font-bold mt-1 leading-tight text-center">{demo.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="relative border-b border-[var(--color-outline-variant)]/30">
            <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-[var(--color-surface)] px-2 text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider">or</span>
          </div>

          {/* Upload zone */}
          <div className="w-full">
            <div
              {...getRootProps()}
              className={`bg-[var(--color-surface-container-lowest)] p-0.5 rounded-lg overflow-hidden border border-dashed transition-colors cursor-pointer group
                ${isDragActive ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-outline-variant)] hover:border-[var(--color-primary)]/50'}`}
            >
              <input {...getInputProps()} />
              <div className="bg-[var(--color-surface-container-low)] rounded-md p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-surface-container-lowest)] flex items-center justify-center text-[var(--color-outline)] group-hover:text-[var(--color-primary)] transition-colors">
                  <span className="material-symbols-outlined text-xl">cloud_upload</span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">Upload X-ray</p>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Drag or browse (JPEG / PNG)</p>
                </div>
              </div>
            </div>

            {/* Gatekeeper Error */}
            {gatekeeperError && (
              <div className="mt-2.5 p-3 rounded-md bg-red-50/80 border border-red-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-[15px] text-red-500 shrink-0 mt-0.5">error</span>
                <p className="text-[11px] text-red-700 font-medium leading-tight">{gatekeeperError}</p>
              </div>
            )}

            {/* Save error */}
            {saveError && (
              <div className="mt-2.5 p-3 rounded-md bg-yellow-50/80 border border-yellow-200 flex items-start gap-2">
                <span className="material-symbols-outlined text-[15px] text-yellow-600 shrink-0 mt-0.5">warning</span>
                <p className="text-[11px] text-yellow-800 font-medium leading-tight">{saveError}</p>
              </div>
            )}

            {/* Privacy Disclaimer */}
            <p className="text-[11px] text-green-600/80 font-medium flex items-start gap-1.5 mt-2.5 bg-green-500/10 p-2.5 rounded-md border border-green-500/20 leading-tight">
              <span className="material-symbols-outlined text-[14px] text-green-500 shrink-0 mt-0.5">lock</span>
              <span>Images are processed in-memory and discarded immediately. <strong>HIPAA Compliant.</strong></span>
            </p>
          </div>

          {/* Analyze button */}
          <button
            disabled={!selectedFile || isAnalyzing}
            onClick={handleAnalyze}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all
              ${selectedFile && !isAnalyzing
                ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary)]/20 hover:opacity-90 active:scale-[0.98]'
                : 'bg-[var(--color-surface-container-highest)] text-[var(--color-outline)] cursor-not-allowed border border-[var(--color-outline-variant)]/30'}`}
          >
            {isAnalyzing
              ? <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
              : !selectedFile
                ? <span className="material-symbols-outlined text-lg">image</span>
                : <span className="material-symbols-outlined text-lg">science</span>
            }
            <span>{isAnalyzing ? 'Running Ensemble Analysis...' : 'Analyze Scan'}</span>
          </button>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-8 space-y-6" ref={reportRef}>

          {/* Image row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Original Radiograph */}
            <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold font-[var(--font-label)] uppercase tracking-widest text-[var(--color-on-surface-variant)]">Original Radiograph</span>
                <span className="material-symbols-outlined text-lg text-[var(--color-outline)]">aspect_ratio</span>
              </div>
              <div className="aspect-[4/5] bg-[var(--color-surface-container-highest)] rounded-xl overflow-hidden border border-[var(--color-outline-variant)]/20 flex items-center justify-center relative">
                {imagePreview ? (
                  <img alt="Uploaded X-Ray" className="w-full h-full object-cover grayscale brightness-90 contrast-125" src={imagePreview} />
                ) : selectedFile?.name?.startsWith('demo_') ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-surface-container-highest)] gap-2">
                    <span className={`material-symbols-outlined text-4xl ${selectedFile.name.startsWith('demo_normal') ? 'text-green-500' : selectedFile.name.startsWith('demo_abnormal') ? 'text-red-400' : 'text-yellow-500'}`}>
                      {selectedFile.name.startsWith('demo_normal') ? 'check_circle' : selectedFile.name.startsWith('demo_abnormal') ? 'coronavirus' : 'help'}
                    </span>
                    <p className="text-xs font-bold text-[var(--color-on-surface)] uppercase tracking-wider">
                      {selectedFile.name.replace('demo_', '').replace('.jpg', '').replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-[var(--color-on-surface-variant)]">Demo Sample</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-outline-variant)] mb-2">image_search</span>
                    <p className="text-xs text-[var(--color-outline)] font-medium">Awaiting upload</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grad-CAM Heatmap */}
            <div className="bg-[var(--color-surface-container-lowest)] p-3 rounded-xl shadow-sm space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold font-[var(--font-label)] uppercase tracking-widest text-[var(--color-primary)]">Grad-CAM Heatmap</span>
                <span className="material-symbols-outlined text-lg text-[var(--color-primary)]">visibility</span>
              </div>
              <div className="aspect-[4/5] bg-[var(--color-surface-container-highest)] rounded-xl overflow-hidden border border-[var(--color-outline-variant)]/20 relative flex items-center justify-center">
                {isLowConfidence ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3 p-5 bg-red-500/5 border border-red-500/20">
                    <span className="material-symbols-outlined text-5xl text-red-500">warning</span>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-bold text-red-500">Uncertain Prediction</p>
                      <p className="text-xs text-[var(--color-on-surface-variant)] font-medium max-w-[190px] mx-auto leading-relaxed">
                        Confidence below 70% threshold. Heatmap disabled. Manual review required.
                      </p>
                    </div>
                  </div>
                ) : heatmapSrc ? (
                  <img alt="Grad-CAM Heatmap" className="w-full h-full object-cover" src={heatmapSrc} />
                ) : (
                  <div className="text-center p-4">
                    <span className="material-symbols-outlined text-4xl text-[var(--color-tertiary)]/30 mb-2">auto_awesome</span>
                    <p className="text-xs text-[var(--color-tertiary)]/60 font-medium">Run analysis to generate heatmap</p>
                  </div>
                )}
              </div>
              {heatmapSrc && !isLowConfidence && (
                <div className="flex items-center justify-between px-1">
                  <div className="w-16 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #0000c8, #00ff00, #ffff00, #ff0000)' }} />
                  <div className="flex gap-3 text-[9px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                    <span>Low</span><span>→</span><span className="text-red-500">High</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic Probabilities */}
          <div className={`bg-[var(--color-surface-container-lowest)] p-5 rounded-xl shadow-sm space-y-4 transition-all duration-500 ${analysisResult ? 'opacity-100 border border-[var(--color-primary)]/20' : 'opacity-50 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-[var(--font-headline)] text-[var(--color-on-surface)] flex items-center gap-2">
                  Diagnostic Probabilities
                  {analysisResult?.cached && (
                    <span className="text-[10px] bg-[var(--color-tertiary)]/20 text-[var(--color-tertiary)] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-[var(--color-tertiary)]/30">
                      ⚡ Cached
                    </span>
                  )}
                </h3>
                {analysisResult && (
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5 font-medium">
                    Ensemble: {analysisResult.models_used.join(' + ')} · {analysisResult.latency_ms}ms
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {analysisResult ? (
                analysisResult.predictions.map((pred, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-semibold text-[var(--color-on-surface)]">{pred.class}</span>
                      <span className="text-sm font-bold text-[var(--color-primary)]">{pred.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${isLowConfidence && i === 0 ? 'bg-red-500' : 'bg-[var(--color-primary)]'}`}
                        style={{ width: `${pred.confidence}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between"><span className="text-sm text-[var(--color-on-surface)]">Awaiting Analysis...</span><span className="text-sm text-[var(--color-primary)]">— %</span></div>
                  <div className="h-1.5 w-full bg-[var(--color-surface-container-high)] rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Clinical Interpretation */}
          {interp && (
            <div className={`rounded-xl border ${urgency.border} ${urgency.bg} p-5 space-y-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[var(--color-primary)]">clinical_notes</span>
                    Clinical Interpretation
                  </h3>
                  <p className={`text-[11px] font-bold mt-0.5 ${urgency.color}`}>
                    ICD-10: {interp.icd10} · {interp.severity} Severity
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${urgency.color} ${urgency.bg} ${urgency.border}`}>
                  {interp.urgency === 'high' ? '🔴 Urgent' : interp.urgency === 'moderate' ? '🟡 Moderate' : '🟢 Routine'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--color-on-surface)]">{interp.finding}</p>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] leading-relaxed">{interp.description}</p>
              </div>
              <div className="border-t border-[var(--color-outline-variant)]/30 pt-3 space-y-1">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-on-surface-variant)]">Clinical Recommendation</p>
                <p className="text-[11px] text-[var(--color-on-surface-variant)] leading-relaxed">{interp.recommendation}</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="material-symbols-outlined text-[13px] text-[var(--color-outline)]">info</span>
                <p className="text-[10px] text-[var(--color-outline)] leading-tight">
                  AI findings are for support only. All diagnoses must be confirmed by a licensed radiologist.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
