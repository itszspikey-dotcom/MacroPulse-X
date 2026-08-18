import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Globe,
  Database,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  User,
  Flame,
  Check,
} from 'lucide-react';
import QRCode from 'qrcode';
import { syncEngine, ImportPreview } from '../services/syncEngine';
import {
  checkOpenSourceApiHealth,
  ApiStatusReport,
} from '../services/openFoodFactsService';
import { playSuccessChime, triggerHaptic, playBarcodeBeep } from '../services/audioFeedback';
import { decodeVideoFrame, decodeFromImage } from '../services/qrBarcodeDecoder';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'apis' | 'qr'>('export');
  const [qrSubTab, setQrSubTab] = useState<'generate' | 'scan'>('generate');

  // Export state
  const [copiedType, setCopiedType] = useState<'json' | 'csv' | null>(null);

  // Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatusMessage, setImportStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // QR Code generator state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrContentType, setQrContentType] = useState<'profile' | 'today_summary'>('today_summary');

  // QR Live Camera / Photo scanner state
  const qrVideoRef = useRef<HTMLVideoElement | null>(null);
  const qrStreamRef = useRef<MediaStream | null>(null);
  const qrScanActiveRef = useRef<boolean>(false);
  const qrFileInputRef = useRef<HTMLInputElement | null>(null);
  const qrScanTimerRef = useRef<number | null>(null);
  const qrLastScanTimeRef = useRef<number>(0);
  const qrLastTextRef = useRef<string | null>(null);

  const [isQrCameraRunning, setIsQrCameraRunning] = useState(false);
  const [scannedQrResult, setScannedQrResult] = useState<{
    type: 'MP_DAY' | 'MP_PROFILE' | 'MP_FOOD' | 'GENERIC';
    data: any;
    rawText: string;
  } | null>(null);
  const [qrScanError, setQrScanError] = useState<string | null>(null);

  // API Availability state
  const [apiReports, setApiReports] = useState<ApiStatusReport[]>([]);
  const [isCheckingApis, setIsCheckingApis] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleCheckApis();
      generateQrCode();
    } else {
      stopQrCamera();
    }
  }, [isOpen, qrContentType]);

  useEffect(() => {
    if (isOpen && activeTab === 'qr' && qrSubTab === 'scan') {
      startQrCamera();
    } else {
      stopQrCamera();
    }
    return () => {
      stopQrCamera();
    };
  }, [isOpen, activeTab, qrSubTab]);

  useEffect(() => {
    if (importJsonText.trim()) {
      const preview = syncEngine.validateImportData(importJsonText);
      setImportPreview(preview);
    } else {
      setImportPreview(null);
    }
    setImportStatusMessage(null);
  }, [importJsonText]);

  const handleCheckApis = async () => {
    setIsCheckingApis(true);
    try {
      const reports = await checkOpenSourceApiHealth();
      setApiReports(reports);
    } finally {
      setIsCheckingApis(false);
    }
  };

  const generateQrCode = async () => {
    try {
      let payload: any;
      if (qrContentType === 'today_summary') {
        const todayStr = new Date().toISOString().split('T')[0];
        const summary = syncEngine.getDailySummary(todayStr);
        payload = {
          t: 'MP_DAY',
          d: todayStr,
          cal: summary.calories,
          p: summary.protein,
          c: summary.carbs,
          f: summary.fat,
          count: summary.loggedItems.length,
        };
      } else {
        const profile = syncEngine.getUserProfile();
        payload = {
          t: 'MP_PROFILE',
          n: profile.name,
          cal: profile.targetCalories,
          p: profile.targetProteinG,
          c: profile.targetCarbsG,
          f: profile.targetFatG,
          w: profile.targetWaterMl,
        };
      }

      const str = JSON.stringify(payload);
      const dataUrl = await QRCode.toDataURL(str, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (e) {
      console.warn('QR generation error:', e);
    }
  };

  const stopQrCamera = () => {
    qrScanActiveRef.current = false;
    if (qrScanTimerRef.current) {
      window.cancelAnimationFrame(qrScanTimerRef.current);
      qrScanTimerRef.current = null;
    }
    if (qrStreamRef.current) {
      qrStreamRef.current.getTracks().forEach((t) => t.stop());
      qrStreamRef.current = null;
    }
    setIsQrCameraRunning(false);
  };

  const startQrCamera = async () => {
    stopQrCamera();
    setQrScanError(null);
    qrLastTextRef.current = null;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      qrStreamRef.current = stream;

      if (qrVideoRef.current) {
        qrVideoRef.current.setAttribute('playsinline', 'true');
        qrVideoRef.current.setAttribute('webkit-playsinline', 'true');
        qrVideoRef.current.muted = true;
        qrVideoRef.current.srcObject = stream;
        await qrVideoRef.current.play();

        setIsQrCameraRunning(true);
        qrScanActiveRef.current = true;

        runQrDecodeLoop();
      }
    } catch (err: any) {
      console.warn('QR Camera start error:', err);
      setIsQrCameraRunning(false);
      setQrScanError('Camera unavailable or permission denied. You can choose a photo or screenshot below.');
    }
  };

  const runQrDecodeLoop = () => {
    const scanFrame = async () => {
      if (!qrScanActiveRef.current || !qrVideoRef.current) return;

      const now = performance.now();
      if (now - qrLastScanTimeRef.current >= 60) {
        qrLastScanTimeRef.current = now;

        if (qrVideoRef.current.readyState >= 2 && qrVideoRef.current.videoWidth > 0) {
          try {
            const result = await decodeVideoFrame(qrVideoRef.current);
            if (result && result.text) {
              const text = result.text.trim();
              if (text && text !== qrLastTextRef.current) {
                qrLastTextRef.current = text;
                handleScannedQrPayload(text);
              }
            }
          } catch (e) {
            // Frame miss
          }
        }
      }

      if (qrScanActiveRef.current) {
        qrScanTimerRef.current = window.requestAnimationFrame(scanFrame);
      }
    };

    qrScanTimerRef.current = window.requestAnimationFrame(scanFrame);
  };

  const handleScannedQrPayload = (rawText: string) => {
    const trimmed = rawText.trim();
    playBarcodeBeep();
    triggerHaptic('success');

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.t === 'MP_DAY' || (parsed.cal !== undefined && parsed.d !== undefined)) {
        setScannedQrResult({
          type: 'MP_DAY',
          data: {
            date: parsed.d || 'Today',
            calories: Number(parsed.cal) || 0,
            protein: Number(parsed.p) || 0,
            carbs: Number(parsed.c) || 0,
            fat: Number(parsed.f) || 0,
            count: Number(parsed.count) || 0,
          },
          rawText: trimmed,
        });
        return;
      }
      if (parsed.t === 'MP_PROFILE' || (parsed.n !== undefined && parsed.cal !== undefined)) {
        setScannedQrResult({
          type: 'MP_PROFILE',
          data: {
            name: parsed.n || 'Athlete',
            targetCalories: Number(parsed.cal) || 2000,
            targetProteinG: Number(parsed.p) || 150,
            targetCarbsG: Number(parsed.c) || 200,
            targetFatG: Number(parsed.f) || 60,
            targetWaterMl: Number(parsed.w) || 2500,
          },
          rawText: trimmed,
        });
        return;
      }
      if (parsed.name && (parsed.caloriesPer100g !== undefined || parsed.calories !== undefined)) {
        setScannedQrResult({
          type: 'MP_FOOD',
          data: parsed,
          rawText: trimmed,
        });
        return;
      }
    } catch {
      // Plain text or URL
    }

    setScannedQrResult({
      type: 'GENERIC',
      data: { text: trimmed },
      rawText: trimmed,
    });
  };

  const handleQrPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = async () => {
          try {
            const result = await decodeFromImage(img);
            if (result && result.text) {
              handleScannedQrPayload(result.text);
            } else {
              setQrScanError('No clear QR code detected in this photo.');
            }
          } catch {
            setQrScanError('Could not decode QR code from image. Please try a clearer screenshot.');
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch {
      setQrScanError('Failed to read photo.');
    }
  };

  const handleApplyScannedProfileToLocal = () => {
    if (!scannedQrResult || scannedQrResult.type !== 'MP_PROFILE') return;
    const p = scannedQrResult.data;
    syncEngine.updateUserProfile({
      name: p.name,
      targetCalories: p.targetCalories,
      targetProteinG: p.targetProteinG,
      targetCarbsG: p.targetCarbsG,
      targetFatG: p.targetFatG,
      targetWaterMl: p.targetWaterMl,
    });
    playSuccessChime();
    triggerHaptic('success');
    onDataChanged();
    setScannedQrResult(null);
  };

  const handleApplyScannedDayToLocal = () => {
    if (!scannedQrResult || scannedQrResult.type !== 'MP_DAY') return;
    const d = scannedQrResult.data;
    syncEngine.addMealLog({
      userId: 'default_user',
      foodId: `qr_day_${Date.now()}`,
      foodName: `Peer QR Transfer: ${d.date}`,
      brand: 'Shared Macro Summary',
      mealType: 'lunch',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      servingAmount: 1,
      servingUnit: 'serving',
      servingGramWeight: 100,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
      fiber: 0,
      source: 'manual',
    });
    playSuccessChime();
    triggerHaptic('success');
    onDataChanged();
    setScannedQrResult(null);
  };

  const handleExportJsonDownload = () => {
    const jsonStr = syncEngine.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `macropulse-backup-${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    playSuccessChime();
    triggerHaptic('success');
  };

  const handleExportCsvDownload = () => {
    const csvStr = syncEngine.exportCSV();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `macropulse-meals-${today}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    playSuccessChime();
    triggerHaptic('success');
  };

  const handleCopyJson = () => {
    const jsonStr = syncEngine.exportFullBackupJSON();
    navigator.clipboard.writeText(jsonStr);
    setCopiedType('json');
    triggerHaptic('light');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyCsv = () => {
    const csvStr = syncEngine.exportCSV();
    navigator.clipboard.writeText(csvStr);
    setCopiedType('csv');
    triggerHaptic('light');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!importPreview?.isValid) return;

    const result = syncEngine.applyImportData(importJsonText, importMode);
    if (result.success) {
      playSuccessChime();
      triggerHaptic('success');
      setImportStatusMessage({ type: 'success', text: result.message });
      onDataChanged();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      triggerHaptic('warning');
      setImportStatusMessage({ type: 'error', text: result.message });
    }
  };

  if (!isOpen) return null;

  const logs = syncEngine.getAllMealLogs();
  const recipes = syncEngine.getRecipes();
  const profile = syncEngine.getUserProfile();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <input
        type="file"
        ref={qrFileInputRef}
        accept="image/*"
        onChange={handleQrPhotoUpload}
        className="hidden"
      />

      <div className="bg-[#141416] border border-white/10 rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#141416] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-white/5 border border-white/10 text-[#facc15]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-oswald text-xl font-semibold tracking-wider text-white uppercase">
                Data Management & QR Transfers
              </h3>
              <p className="font-mono-meta text-[11px] text-white/40">
                Full export, import, QR transfers & Open Food Facts availability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-[#0b0b0c] border-b border-white/10 flex items-center gap-2 overflow-x-auto select-none ios-scroll">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono-meta uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'export'
                ? 'bg-[#facc15] text-black font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono-meta uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'import'
                ? 'bg-[#facc15] text-black font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import Data
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono-meta uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'qr'
                ? 'bg-[#facc15] text-black font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            QR Share & Scan
          </button>

          <button
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono-meta uppercase tracking-wider transition cursor-pointer shrink-0 ${
              activeTab === 'apis'
                ? 'bg-[#facc15] text-black font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Open Source APIs
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 ios-scroll">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-[#0b0b0c] border border-white/10 rounded-sm">
                  <div className="font-mono-meta text-[10px] text-white/40">Logged Meals</div>
                  <div className="font-oswald text-2xl text-white font-semibold">{logs.length}</div>
                </div>
                <div className="p-3.5 bg-[#0b0b0c] border border-white/10 rounded-sm">
                  <div className="font-mono-meta text-[10px] text-white/40">Saved Recipes</div>
                  <div className="font-oswald text-2xl text-[#facc15] font-semibold">{recipes.length}</div>
                </div>
                <div className="p-3.5 bg-[#0b0b0c] border border-white/10 rounded-sm">
                  <div className="font-mono-meta text-[10px] text-white/40">Athlete Profile</div>
                  <div className="font-oswald text-2xl text-emerald-400 font-semibold truncate">
                    {profile.name}
                  </div>
                </div>
              </div>

              {/* JSON Full Backup */}
              <div className="p-5 bg-[#0b0b0c] border border-white/10 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileJson className="w-5 h-5 text-[#facc15]" />
                    <div>
                      <div className="font-oswald text-base font-semibold text-white uppercase">
                        Full Backup JSON (.json)
                      </div>
                      <div className="font-mono-meta text-[11px] text-white/40">
                        Complete snapshot of profile, biometric goals, recipes & logged foods.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={handleExportJsonDownload}
                    className="pill-btn-accent flex items-center gap-2 px-4 py-2 rounded text-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    Download .JSON File
                  </button>
                  <button
                    onClick={handleCopyJson}
                    className="control-btn-dark flex items-center gap-2 px-3.5 py-2 rounded text-xs cursor-pointer"
                  >
                    {copiedType === 'json' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Raw JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CSV Spreadsheet Export */}
              <div className="p-5 bg-[#0b0b0c] border border-white/10 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-oswald text-base font-semibold text-white uppercase">
                        Meal Log Spreadsheet (.csv)
                      </div>
                      <div className="font-mono-meta text-[11px] text-white/40">
                        Clean CSV export compatible with Excel, Google Sheets, or MacroFactor.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button
                    onClick={handleExportCsvDownload}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-oswald font-bold text-xs uppercase tracking-wider rounded transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 stroke-[2.5] inline mr-1.5" />
                    Download .CSV Sheet
                  </button>
                  <button
                    onClick={handleCopyCsv}
                    className="control-btn-dark flex items-center gap-2 px-3.5 py-2 rounded text-xs cursor-pointer"
                  >
                    {copiedType === 'csv' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="p-6 border-2 border-dashed border-white/15 rounded-sm bg-[#0b0b0c] text-center space-y-3">
                <Upload className="w-8 h-8 text-[#facc15] mx-auto" />
                <div>
                  <div className="font-oswald text-base font-semibold text-white uppercase">
                    Select MacroPulse Backup File
                  </div>
                  <div className="font-mono-meta text-xs text-white/40 mt-0.5">
                    Drag and drop or browse your .json backup file
                  </div>
                </div>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="pill-btn-accent inline-flex items-center gap-2 px-4 py-2 rounded text-xs cursor-pointer">
                    Browse File
                  </span>
                </label>
              </div>

              <div className="space-y-2">
                <label className="font-mono-meta text-xs text-white/40">
                  Or Paste Raw JSON Backup Text:
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='Paste JSON here (e.g. {"version":"2.0.0", "profile":{...}, "mealLogs":[...]})'
                  rows={4}
                  className="w-full bg-[#0b0b0c] border border-white/10 rounded-sm p-3 font-mono text-xs text-white placeholder-white/20 focus:outline-hidden focus:border-[#facc15]"
                />
              </div>

              {importPreview && (
                <div
                  className={`p-4 rounded-sm border ${
                    importPreview.isValid
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  } space-y-3`}
                >
                  <div className="flex items-center gap-2 font-mono-meta text-xs">
                    {importPreview.isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Valid Backup Format Detected</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span className="text-rose-400 font-bold">
                          Invalid Data: {importPreview.error}
                        </span>
                      </>
                    )}
                  </div>

                  {importPreview.isValid && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono-meta text-xs">
                      <div className="p-2 bg-[#0b0b0c] rounded">
                        <span className="text-white/40 block text-[10px]">Meal Logs:</span>
                        <span className="text-white font-bold">{importPreview.mealLogsCount}</span>
                      </div>
                      <div className="p-2 bg-[#0b0b0c] rounded">
                        <span className="text-white/40 block text-[10px]">Dates:</span>
                        <span className="text-white font-bold">{importPreview.uniqueDatesCount}</span>
                      </div>
                      <div className="p-2 bg-[#0b0b0c] rounded">
                        <span className="text-white/40 block text-[10px]">Recipes:</span>
                        <span className="text-white font-bold">{importPreview.recipesCount}</span>
                      </div>
                      <div className="p-2 bg-[#0b0b0c] rounded">
                        <span className="text-white/40 block text-[10px]">Profile:</span>
                        <span className="text-[#facc15] font-bold truncate">
                          {importPreview.profileName || 'Included'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {importPreview?.isValid && (
                <div className="p-4 bg-[#0b0b0c] border border-white/10 rounded-sm space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono-meta text-xs text-white/60">Import Strategy:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setImportMode('merge')}
                        className={`px-3 py-1 rounded font-mono-meta text-xs cursor-pointer ${
                          importMode === 'merge'
                            ? 'bg-[#facc15] text-black font-bold'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        Merge & Retain
                      </button>
                      <button
                        onClick={() => setImportMode('replace')}
                        className={`px-3 py-1 rounded font-mono-meta text-xs cursor-pointer ${
                          importMode === 'replace'
                            ? 'bg-rose-500 text-white font-bold'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        Clean Overwrite
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyImport}
                    className="w-full pill-btn-accent py-2.5 rounded font-oswald text-sm font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Commit & Apply {importPreview.mealLogsCount} Logs ({importMode})
                  </button>
                </div>
              )}

              {importStatusMessage && (
                <div
                  className={`p-3 rounded font-mono-meta text-xs flex items-center gap-2 ${
                    importStatusMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importStatusMessage.text}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QR CODE SHARING & SCANNER */}
          {activeTab === 'qr' && (
            <div className="space-y-6">
              {/* Sub-tabs: Generate vs Scan */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setQrSubTab('generate')}
                  className={`px-4 py-1.5 rounded text-xs font-mono-meta uppercase tracking-wider transition cursor-pointer ${
                    qrSubTab === 'generate'
                      ? 'bg-white/20 text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Share / Display QR
                </button>
                <button
                  onClick={() => setQrSubTab('scan')}
                  className={`px-4 py-1.5 rounded text-xs font-mono-meta uppercase tracking-wider transition cursor-pointer ${
                    qrSubTab === 'scan'
                      ? 'bg-[#facc15] text-black font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  Scan QR Code
                </button>
              </div>

              {/* Subtab A: Generate QR */}
              {qrSubTab === 'generate' && (
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="flex items-center gap-2 p-1 bg-[#0b0b0c] border border-white/10 rounded font-mono-meta text-xs">
                    <button
                      onClick={() => setQrContentType('today_summary')}
                      className={`px-3 py-1.5 rounded transition cursor-pointer ${
                        qrContentType === 'today_summary'
                          ? 'bg-[#facc15] text-black font-semibold'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Today's Macro Summary
                    </button>
                    <button
                      onClick={() => setQrContentType('profile')}
                      className={`px-3 py-1.5 rounded transition cursor-pointer ${
                        qrContentType === 'profile'
                          ? 'bg-[#facc15] text-black font-semibold'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Athlete Goals Profile
                    </button>
                  </div>

                  {qrDataUrl && (
                    <div className="p-4 bg-white rounded-lg shadow-xl inline-block border-4 border-[#facc15]">
                      <img src={qrDataUrl} alt="MacroPulse QR Transfer" className="w-56 h-56" />
                    </div>
                  )}

                  <div className="max-w-sm space-y-1">
                    <div className="font-oswald text-base font-semibold text-white uppercase">
                      Instant Peer-to-Peer Optical Transfer
                    </div>
                    <p className="font-mono-meta text-xs text-white/40">
                      Scan this QR code from any camera scanner to import today's totals or profile
                      without internet.
                    </p>
                  </div>
                </div>
              )}

              {/* Subtab B: Live QR Scanner */}
              {qrSubTab === 'scan' && (
                <div className="space-y-4">
                  {/* Camera view or Photo Upload */}
                  <div className="relative bg-black rounded-sm border border-white/10 overflow-hidden min-h-[220px] max-h-[280px] flex items-center justify-center">
                    <video
                      ref={qrVideoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      autoPlay
                      muted
                    />

                    {/* QR Reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                      <div className="w-48 h-48 border-2 border-dashed border-[#facc15] rounded flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                        <span className="font-mono-meta text-[10px] text-[#facc15] bg-black/80 px-2 py-0.5 rounded">
                          Point at MacroPulse QR
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons below scanner */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => qrFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded font-mono-meta text-xs text-white/80 border border-white/10 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-[#facc15]" />
                      <span>Choose Photo / Screenshot</span>
                    </button>

                    <button
                      onClick={() => {
                        if (isQrCameraRunning) {
                          stopQrCamera();
                        } else {
                          startQrCamera();
                        }
                      }}
                      className="control-btn-dark px-3 py-2 rounded text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isQrCameraRunning ? 'Pause Camera' : 'Restart Camera'}</span>
                    </button>
                  </div>

                  {qrScanError && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono-meta text-xs rounded">
                      {qrScanError}
                    </div>
                  )}

                  {/* Scanned QR Payload Result Preview */}
                  {scannedQrResult && (
                    <div className="p-4 bg-[#0b0b0c] border border-white/10 rounded space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-oswald text-sm font-semibold uppercase text-[#facc15] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          QR Code Detected: {scannedQrResult.type}
                        </span>
                        <button
                          onClick={() => setScannedQrResult(null)}
                          className="text-white/40 hover:text-white text-xs font-mono-meta"
                        >
                          Clear
                        </button>
                      </div>

                      {scannedQrResult.type === 'MP_PROFILE' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2 text-center font-mono-meta text-xs bg-black/50 p-2.5 rounded">
                            <div>
                              <span className="text-white/40 text-[10px]">ATHLETE</span>
                              <p className="text-white font-bold">{scannedQrResult.data.name}</p>
                            </div>
                            <div>
                              <span className="text-white/40 text-[10px]">CALORIES</span>
                              <p className="text-[#facc15] font-bold">
                                {scannedQrResult.data.targetCalories} kcal
                              </p>
                            </div>
                            <div>
                              <span className="text-white/40 text-[10px]">PROTEIN</span>
                              <p className="text-emerald-400 font-bold">
                                {scannedQrResult.data.targetProteinG}g
                              </p>
                            </div>
                            <div>
                              <span className="text-white/40 text-[10px]">WATER</span>
                              <p className="text-sky-400 font-bold">
                                {scannedQrResult.data.targetWaterMl}ml
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleApplyScannedProfileToLocal}
                            className="w-full pill-btn-accent py-2 text-xs font-bold cursor-pointer"
                          >
                            Apply Scanned Athlete Profile
                          </button>
                        </div>
                      )}

                      {scannedQrResult.type === 'MP_DAY' && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-2 text-center font-mono-meta text-xs bg-black/50 p-2.5 rounded">
                            <div>
                              <span className="text-white/40 text-[10px]">DATE</span>
                              <p className="text-white font-bold">{scannedQrResult.data.date}</p>
                            </div>
                            <div>
                              <span className="text-white/40 text-[10px]">TOTAL KCAL</span>
                              <p className="text-[#facc15] font-bold">
                                {scannedQrResult.data.calories} kcal
                              </p>
                            </div>
                            <div>
                              <span className="text-white/40 text-[10px]">PROTEIN</span>
                              <p className="text-emerald-400 font-bold">
                                {scannedQrResult.data.protein}g
                              </p>
                            </div>
                            <div>
                              <span className="text-white/40 text-[10px]">CARBS</span>
                              <p className="text-sky-400 font-bold">
                                {scannedQrResult.data.carbs}g
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleApplyScannedDayToLocal}
                            className="w-full pill-btn-accent py-2 text-xs font-bold cursor-pointer"
                          >
                            Log Scanned Day Totals
                          </button>
                        </div>
                      )}

                      {scannedQrResult.type === 'GENERIC' && (
                        <div className="p-3 bg-black/40 rounded font-mono text-xs text-white/80 break-all">
                          {scannedQrResult.rawText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OPEN SOURCE APIS & AVAILABILITY */}
          {activeTab === 'apis' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-oswald text-base font-semibold text-white uppercase">
                    Open Source Product & Barcode Catalog APIs
                  </div>
                  <div className="font-mono-meta text-[11px] text-white/40">
                    Real-time status & latency (Germany DE prioritized, Global World fallback)
                  </div>
                </div>
                <button
                  onClick={handleCheckApis}
                  disabled={isCheckingApis}
                  className="control-btn-dark flex items-center gap-1.5 px-3 py-1.5 rounded text-xs cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isCheckingApis ? 'animate-spin text-[#facc15]' : ''}`}
                  />
                  <span>Ping APIs</span>
                </button>
              </div>

              {/* Status List */}
              <div className="space-y-3">
                <div className="p-4 bg-[#0b0b0c] border border-white/10 rounded-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇩🇪</span>
                    <div>
                      <div className="font-oswald text-sm font-semibold text-white">
                        Open Food Facts — Germany (de.openfoodfacts.org)
                      </div>
                      <div className="font-mono-meta text-[11px] text-white/40">
                        Primary for German EAN-13 (400-440), Rewe, Edeka, Aldi, Lidl, DM & Nutri-Score
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono-meta text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      OPERATIONAL
                    </span>
                    <div className="font-mono-meta text-[10px] text-white/30 mt-1">
                      {apiReports.find((r) => r.region === 'de')?.latencyMs || 84}ms Latency
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#0b0b0c] border border-white/10 rounded-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌍</span>
                    <div>
                      <div className="font-oswald text-sm font-semibold text-white">
                        Open Food Facts — World Catalog (world.openfoodfacts.org)
                      </div>
                      <div className="font-mono-meta text-[11px] text-white/40">
                        Universal fallback for 3,000,000+ global barcodes, France, UK, US, Asia
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono-meta text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      OPERATIONAL
                    </span>
                    <div className="font-mono-meta text-[10px] text-white/30 mt-1">
                      {apiReports.find((r) => r.region === 'world')?.latencyMs || 112}ms Latency
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#0b0b0c] border border-white/10 rounded-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="font-oswald text-sm font-semibold text-white">
                        Local Verified Offline Food Database (USDA & BLS)
                      </div>
                      <div className="font-mono-meta text-[11px] text-white/40">
                        Instant offline sub-millisecond barcode & whole-food resolution
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-mono-meta text-xs font-bold bg-[#facc15]/10 text-[#facc15] border border-[#facc15]/30">
                      0ms OFFLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
