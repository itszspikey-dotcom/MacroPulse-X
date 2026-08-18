import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Camera,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  AlertCircle,
  Zap,
  CheckCircle2,
  RefreshCw,
  Globe,
  QrCode,
  Image as ImageIcon,
  Flame,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { FoodItem, MealType } from '../types/nutrition';
import { fetchProductByBarcode, MarketRegion } from '../services/openFoodFactsService';
import { SAMPLE_BARCODES, VERIFIED_OFFLINE_FOODS } from '../services/foodDatabase';
import { playBarcodeBeep, playSuccessChime, triggerHaptic } from '../services/audioFeedback';
import { syncEngine } from '../services/syncEngine';
import { decodeVideoFrame, decodeFromImage } from '../services/qrBarcodeDecoder';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType;
  onProductFound: (product: FoodItem) => void;
  onProfileUpdated?: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  mealType,
  onProductFound,
  onProfileUpdated,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFallbackInputRef = useRef<HTMLInputElement | null>(null);
  const scanLoopTimerRef = useRef<number | null>(null);
  const cameraWatchdogTimerRef = useRef<number | null>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const lastDetectedTextRef = useRef<string | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion>('de');
  const [sampleMarketTab, setSampleMarketTab] = useState<'de' | 'world' | 'qr'>('de');

  // Scanned QR Payloads for special items (Day summary, Profile, Recipe)
  const [scannedQrProfile, setScannedQrProfile] = useState<{
    name: string;
    targetCalories: number;
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
    targetWaterMl: number;
  } | null>(null);

  const [scannedQrDay, setScannedQrDay] = useState<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    count: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedQrProfile(null);
      setScannedQrDay(null);
      setLastScannedCode(null);
      lastDetectedTextRef.current = null;
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const triggerNativeCameraFallback = () => {
    if (cameraFallbackInputRef.current) {
      cameraFallbackInputRef.current.click();
    }
  };

  const stopCamera = () => {
    isScanningActiveRef.current = false;
    if (scanLoopTimerRef.current) {
      window.cancelAnimationFrame(scanLoopTimerRef.current);
      scanLoopTimerRef.current = null;
    }
    if (cameraWatchdogTimerRef.current) {
      window.clearTimeout(cameraWatchdogTimerRef.current);
      cameraWatchdogTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setErrorMessage(null);
    stopCamera();

    // If mediaDevices is unavailable (e.g. certain iOS standalone states or non-secure contexts)
    if (!navigator?.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia API unavailable in current environment, falling back to native capture input');
      setHasCameraPermission(false);
      setErrorMessage('Direct camera stream is restricted in this standalone view. Use the native iOS camera below to snap your code.');
      triggerNativeCameraFallback();
      return;
    }

    try {
      // Non-rigid iOS constraints: ideal environment facingMode and ideal width with audio disabled
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const videoElement = videoRef.current;
      if (videoElement) {
        // Essential iOS Safari & WebKit Standalone attributes
        videoElement.srcObject = stream;
        videoElement.setAttribute('playsinline', 'true');
        videoElement.setAttribute('webkit-playsinline', 'true');
        videoElement.muted = true;

        videoElement.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        };

        if (videoElement.readyState >= 1) {
          videoElement.play().catch(() => {});
        }

        setHasCameraPermission(true);
        isScanningActiveRef.current = true;

        // Start high-performance QR & Barcode decode loop
        startDecodeLoop();

        // Standalone Watchdog: if video doesn't produce frames after 4s, notify user and provide direct snap button
        if (cameraWatchdogTimerRef.current) window.clearTimeout(cameraWatchdogTimerRef.current);
        cameraWatchdogTimerRef.current = window.setTimeout(() => {
          if (videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.readyState < 2)) {
            console.warn('Camera stream timed out or stalled in iOS standalone mode');
            setErrorMessage('Camera video stream is taking longer than expected. Tap "Snap with iOS Camera" for instant capture.');
          }
        }, 4000);
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera access was denied. You can snap a photo with the native iOS camera, upload a photo/screenshot, or test using sample barcodes below.'
        );
      } else {
        setErrorMessage(
          'Could not start live camera stream. You can snap directly with the native iOS camera or choose from your photo library.'
        );
      }
      // Trigger native camera fallback so user isn't stuck
      triggerNativeCameraFallback();
    }
  };

  const startDecodeLoop = () => {
    const scanFrame = async () => {
      if (!isScanningActiveRef.current || !videoRef.current) return;

      const now = performance.now();
      // Throttle scanning to ~60ms for smooth 60fps UI and rapid responsiveness
      if (now - lastScanTimestampRef.current >= 60) {
        lastScanTimestampRef.current = now;

        if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
          try {
            const result = await decodeVideoFrame(videoRef.current);
            if (result && result.text) {
              const text = result.text.trim();
              if (text && text !== lastDetectedTextRef.current) {
                lastDetectedTextRef.current = text;
                handleBarcodeDetected(text);
                return;
              }
            }
          } catch (e) {
            // Frame miss
          }
        }
      }

      if (isScanningActiveRef.current) {
        scanLoopTimerRef.current = window.requestAnimationFrame(scanFrame);
      }
    };

    scanLoopTimerRef.current = window.requestAnimationFrame(scanFrame);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      const capabilities = (track.getCapabilities?.() || {}) as any;
      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !isTorchOn } as any],
          });
          setIsTorchOn(!isTorchOn);
          triggerHaptic('light');
        } catch (e) {
          console.warn('Torch not supported on this device/browser');
        }
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    triggerHaptic('light');
  };

  // Image Upload / Photo Scanner for iOS & Desktop
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = async () => {
          try {
            const result = await decodeFromImage(img);
            if (result && result.text) {
              handleBarcodeDetected(result.text);
            } else {
              setErrorMessage(
                'No clear QR code or barcode found in the uploaded image. Please ensure the code is clear and well-lit.'
              );
            }
          } catch (err) {
            console.warn('Image decode error:', err);
            setErrorMessage('Could not decode QR code or barcode from this image. Try another photo or adjust lighting.');
          } finally {
            setIsLoading(false);
          }
        };
        img.onerror = () => {
          setIsLoading(false);
          setErrorMessage('Failed to load image file.');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Failed to read image file.');
    }
  };

  const handleBarcodeDetected = async (rawCode: string) => {
    if (isLoading) return;
    const cleanRaw = rawCode.trim();
    if (cleanRaw === lastScannedCode) return;

    setLastScannedCode(cleanRaw);

    // Reset last scanned after 2.5 seconds to allow rescanning same code if desired
    setTimeout(() => {
      setLastScannedCode((curr) => (curr === cleanRaw ? null : curr));
      if (lastDetectedTextRef.current === cleanRaw) {
        lastDetectedTextRef.current = null;
      }
    }, 2500);

    // ==========================================
    // 1. DETECT QR CODES (MacroPulse JSON / Special formats)
    // ==========================================

    // Case A: JSON QR Code (MacroPulse Transfer or Direct Food)
    if ((cleanRaw.startsWith('{') && cleanRaw.endsWith('}')) || cleanRaw.startsWith('{"')) {
      try {
        const parsed = JSON.parse(cleanRaw);

        // Subcase A1: MacroPulse Day Summary QR
        if (parsed.t === 'MP_DAY' || (parsed.cal !== undefined && parsed.d !== undefined)) {
          playSuccessChime();
          triggerHaptic('success');
          setScannedQrDay({
            date: parsed.d || 'Today',
            calories: Number(parsed.cal) || 0,
            protein: Number(parsed.p) || 0,
            carbs: Number(parsed.c) || 0,
            fat: Number(parsed.f) || 0,
            count: Number(parsed.count) || 0,
          });
          return;
        }

        // Subcase A2: MacroPulse Athlete Profile QR
        if (parsed.t === 'MP_PROFILE' || (parsed.n !== undefined && parsed.cal !== undefined && parsed.w !== undefined)) {
          playSuccessChime();
          triggerHaptic('success');
          setScannedQrProfile({
            name: parsed.n || 'Athlete',
            targetCalories: Number(parsed.cal) || 2000,
            targetProteinG: Number(parsed.p) || 150,
            targetCarbsG: Number(parsed.c) || 200,
            targetFatG: Number(parsed.f) || 60,
            targetWaterMl: Number(parsed.w) || 2500,
          });
          return;
        }

        // Subcase A3: Direct Food Item Object
        if (parsed.name && (parsed.caloriesPer100g !== undefined || parsed.calories !== undefined)) {
          const foodItem: FoodItem = {
            id: parsed.id || `qr_${Date.now()}`,
            name: parsed.name,
            brand: parsed.brand || 'QR Scanned Item',
            barcode: parsed.barcode || undefined,
            source: 'custom',
            caloriesPer100g: Number(parsed.caloriesPer100g || parsed.calories) || 100,
            proteinPer100g: Number(parsed.proteinPer100g || parsed.protein) || 0,
            carbsPer100g: Number(parsed.carbsPer100g || parsed.carbs) || 0,
            fatPer100g: Number(parsed.fatPer100g || parsed.fat) || 0,
            fiberPer100g: Number(parsed.fiberPer100g || parsed.fiber) || 0,
            defaultServingSize: Number(parsed.defaultServingSize) || 100,
            defaultServingUnit: (parsed.defaultServingUnit as any) || 'g',
            servingOptions: parsed.servingOptions || [
              { unit: 'g', label: 'grams (g)', gramWeight: 1 },
              { unit: 'serving', label: '1 serving (100g)', gramWeight: 100 },
            ],
            micros: parsed.micros,
          };

          playBarcodeBeep();
          triggerHaptic('success');
          onProductFound(foodItem);
          onClose();
          return;
        }
      } catch {
        // Not valid JSON, continue with URL / Barcode detection
      }
    }

    // Case B: Open Food Facts Product URL
    // e.g. https://world.openfoodfacts.org/product/4008400401027/nutella-ferrero
    let codeToLookup = cleanRaw;
    if (codeToLookup.includes('openfoodfacts.org')) {
      const match = codeToLookup.match(/\/product\/(\d+)/) || codeToLookup.match(/\/produit\/(\d+)/);
      if (match && match[1]) {
        codeToLookup = match[1];
      }
    }

    // ==========================================
    // 2. DETECT BARCODES (1D EAN/UPC or clean code)
    // ==========================================
    setIsLoading(true);
    setErrorMessage(null);

    playBarcodeBeep();
    triggerHaptic('success');

    // 1. Check local verified offline database first for instant 0ms response
    const localMatch = VERIFIED_OFFLINE_FOODS.find((f) => f.barcode === codeToLookup);
    if (localMatch) {
      setIsLoading(false);
      onProductFound(localMatch);
      onClose();
      return;
    }

    // 2. Query Open Food Facts API with regional priority (DE vs World)
    try {
      const product = await fetchProductByBarcode(codeToLookup, selectedRegion);
      if (product) {
        setIsLoading(false);
        onProductFound(product);
        onClose();
        return;
      }
    } catch (e) {
      console.error('Barcode lookup failed:', e);
    }

    setIsLoading(false);
    setErrorMessage(
      `Product or barcode "${codeToLookup}" not found in Open Food Facts (${selectedRegion.toUpperCase()}). You can create a custom item with this code or try searching by name.`
    );
  };

  const handleApplyScannedProfile = () => {
    if (!scannedQrProfile) return;
    syncEngine.updateUserProfile({
      name: scannedQrProfile.name,
      targetCalories: scannedQrProfile.targetCalories,
      targetProteinG: scannedQrProfile.targetProteinG,
      targetCarbsG: scannedQrProfile.targetCarbsG,
      targetFatG: scannedQrProfile.targetFatG,
      targetWaterMl: scannedQrProfile.targetWaterMl,
    });
    playSuccessChime();
    triggerHaptic('success');
    if (onProfileUpdated) onProfileUpdated();
    setScannedQrProfile(null);
    onClose();
  };

  const handleLogScannedDaySummary = () => {
    if (!scannedQrDay) return;
    syncEngine.addMealLog({
      userId: 'default_user',
      foodId: `qr_day_${Date.now()}`,
      foodName: `QR Transfer: ${scannedQrDay.date} Summary`,
      brand: 'Shared Log',
      mealType: mealType,
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      servingAmount: 1,
      servingUnit: 'serving',
      servingGramWeight: 100,
      calories: scannedQrDay.calories,
      protein: scannedQrDay.protein,
      carbs: scannedQrDay.carbs,
      fat: scannedQrDay.fat,
      fiber: 0,
      source: 'manual',
    });
    playSuccessChime();
    triggerHaptic('success');
    if (onProfileUpdated) onProfileUpdated();
    setScannedQrDay(null);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
  };

  if (!isOpen) return null;

  const filteredSamples = SAMPLE_BARCODES.filter(
    (s) => (s.market || 'world') === sampleMarketTab
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Native iOS Camera Direct Fallback Input */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        id="camera-fallback"
        ref={cameraFallbackInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Hidden file input for photo library selection */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="bg-[#141416] border border-white/10 rounded-sm w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#141416] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-white/5 border border-white/10 text-[#facc15]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-oswald text-base font-semibold uppercase tracking-wider text-white">
                Live Barcode & QR Scanner
              </h3>
              <p className="font-mono-meta text-[11px] text-white/40">
                QR Codes, EAN-13, EAN-8, UPC • German & Global Open Food Facts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Region & Upload Ribbon */}
        <div className="px-4 py-2 bg-[#0b0b0c] border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedRegion('de')}
              className={`px-2.5 py-1 rounded text-xs font-mono-meta transition cursor-pointer ${
                selectedRegion === 'de'
                  ? 'bg-[#facc15] text-black font-semibold'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              🇩🇪 DE
            </button>
            <button
              onClick={() => setSelectedRegion('world')}
              className={`px-2.5 py-1 rounded text-xs font-mono-meta transition cursor-pointer ${
                selectedRegion === 'world'
                  ? 'bg-[#facc15] text-black font-semibold'
                  : 'bg-white/5 text-white/60 hover:text-white'
              }`}
            >
              🌍 Global
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerNativeCameraFallback}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-meta bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-pointer transition active:scale-95 font-semibold"
              title="Snap photo directly using native iOS Camera"
            >
              <Camera className="w-3.5 h-3.5 text-[#facc15]" />
              <span>iOS Snap</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-meta bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer transition active:scale-95"
              title="Scan code from iOS Photo Library or screenshot"
            >
              <ImageIcon className="w-3.5 h-3.5 text-white/60" />
              <span>Library</span>
            </button>
          </div>
        </div>

        {/* Camera Viewport & Overlay */}
        <div className="relative bg-black flex-1 min-h-[240px] max-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Real Live Video Stream with Strict iOS WebKit Standalone Flags */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            webkit-playsinline="true"
            className="w-full h-full object-cover"
          />

          {/* Barcode Reticle & Laser Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="relative w-64 h-44 sm:w-72 sm:h-48 border-2 border-dashed border-[#facc15]/50 rounded-lg flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.15)]">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-[#facc15]" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-[#facc15]" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-[#facc15]" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-[#facc15]" />

              {/* Animated Laser Scanning Line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#facc15] to-transparent shadow-[0_0_12px_#facc15] animate-pulse" />

              <span className="font-mono-meta text-[11px] font-semibold text-[#facc15] bg-black/80 px-2.5 py-0.5 rounded border border-[#facc15]/40 backdrop-blur-xs">
                Align Barcode / QR Code
              </span>
            </div>
          </div>

          {/* Camera Controls Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <button
              onClick={toggleTorch}
              className="p-2 rounded bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition cursor-pointer"
              title="Toggle Flashlight"
            >
              {isTorchOn ? (
                <FlashlightOff className="w-4 h-4 text-[#facc15]" />
              ) : (
                <Flashlight className="w-4 h-4 text-white/70" />
              )}
            </button>

            <button
              onClick={toggleFacingMode}
              className="p-2 rounded bg-black/80 hover:bg-black text-white backdrop-blur-md border border-white/20 transition cursor-pointer"
              title="Switch Camera (Front/Rear)"
            >
              <SwitchCamera className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
              <RefreshCw className="w-7 h-7 text-[#facc15] animate-spin" />
              <span className="font-mono-meta text-xs font-semibold text-white">
                Decoding Code & Querying Open Food Facts...
              </span>
            </div>
          )}
        </div>

        {/* Scanned QR Profile Card (Interactive) */}
        {scannedQrProfile && (
          <div className="p-4 bg-emerald-950/40 border-t border-b border-emerald-500/30 text-white animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="font-oswald text-sm font-semibold uppercase text-emerald-300">
                Athlete Profile QR Detected: {scannedQrProfile.name}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono-meta text-xs mb-3 bg-black/40 p-2 rounded border border-white/5">
              <div>
                <span className="text-white/40 text-[10px]">TARGET</span>
                <p className="text-white font-bold">{scannedQrProfile.targetCalories} kcal</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px]">PROTEIN</span>
                <p className="text-emerald-400 font-bold">{scannedQrProfile.targetProteinG}g</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px]">CARBS</span>
                <p className="text-sky-400 font-bold">{scannedQrProfile.targetCarbsG}g</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px]">FAT</span>
                <p className="text-amber-400 font-bold">{scannedQrProfile.targetFatG}g</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyScannedProfile}
                className="flex-1 pill-btn-accent py-2 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply Targets to My Profile
              </button>
              <button
                onClick={() => setScannedQrProfile(null)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-mono-meta text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Scanned QR Day Summary Card (Interactive) */}
        {scannedQrDay && (
          <div className="p-4 bg-yellow-950/40 border-t border-b border-[#facc15]/30 text-white animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-[#facc15]" />
              <span className="font-oswald text-sm font-semibold uppercase text-[#facc15]">
                Daily Summary QR Detected ({scannedQrDay.date})
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono-meta text-xs mb-3 bg-black/40 p-2 rounded border border-white/5">
              <div>
                <span className="text-white/40 text-[10px]">TOTAL</span>
                <p className="text-[#facc15] font-bold">{scannedQrDay.calories} kcal</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px]">PROTEIN</span>
                <p className="text-emerald-400 font-bold">{scannedQrDay.protein}g</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px]">CARBS</span>
                <p className="text-sky-400 font-bold">{scannedQrDay.carbs}g</p>
              </div>
              <div>
                <span className="text-white/40 text-[10px]">FAT</span>
                <p className="text-amber-400 font-bold">{scannedQrDay.fat}g</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogScannedDaySummary}
                className="flex-1 pill-btn-accent py-2 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Log as {mealType.toUpperCase()} Entry
              </button>
              <button
                onClick={() => setScannedQrDay(null)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-mono-meta text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Error / Feedback Banner */}
        {errorMessage && (
          <div className="p-3 bg-amber-500/10 border-t border-b border-amber-500/20 text-amber-300 font-mono-meta text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Manual Barcode / QR Text Entry + Quick Sample Barcode Buttons */}
        <div className="p-4 bg-[#141416] space-y-3 overflow-y-auto ios-scroll">
          {/* Manual input form */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or enter barcode / paste QR text"
                className="w-full bg-[#0b0b0c] border border-white/10 rounded px-3 py-2 font-mono text-xs text-white placeholder-white/20 focus:outline-hidden focus:border-[#facc15]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !manualCode.trim()}
              className="pill-btn-accent px-4 py-2 text-xs cursor-pointer font-bold shrink-0"
            >
              Lookup
            </button>
          </form>

          {/* Sample Barcodes & QR Payloads for Instant Testing */}
          <div>
            <div className="flex items-center justify-between font-mono-meta text-[11px] text-white/40 mb-1.5">
              <div className="flex items-center gap-1 font-semibold text-white/70">
                <Zap className="w-3 h-3 text-[#facc15]" />
                <span>Instant Test Codes & QR</span>
              </div>

              {/* Sample Tab Switcher */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSampleMarketTab('de')}
                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                    sampleMarketTab === 'de'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  🇩🇪 Germany
                </button>
                <button
                  onClick={() => setSampleMarketTab('world')}
                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                    sampleMarketTab === 'world'
                      ? 'bg-white/15 text-white font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  🌍 Global
                </button>
                <button
                  onClick={() => setSampleMarketTab('qr')}
                  className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                    sampleMarketTab === 'qr'
                      ? 'bg-[#facc15]/20 text-[#facc15] font-bold'
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  QR Payloads
                </button>
              </div>
            </div>

            {sampleMarketTab === 'qr' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1 ios-scroll">
                <button
                  onClick={() =>
                    handleBarcodeDetected(
                      JSON.stringify({
                        t: 'MP_PROFILE',
                        n: 'Max Mustermann',
                        cal: 2350,
                        p: 175,
                        c: 240,
                        f: 70,
                        w: 3200,
                      })
                    )
                  }
                  className="text-left p-2 rounded bg-[#0b0b0c] hover:bg-white/5 border border-white/10 hover:border-[#facc15]/50 text-white transition active:scale-98 cursor-pointer"
                >
                  <div className="font-oswald text-xs font-bold text-[#facc15] flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Athlete Profile QR
                  </div>
                  <div className="font-mono-meta text-[10px] text-white/40">
                    Max M. • 2,350 kcal • 175g P
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleBarcodeDetected(
                      JSON.stringify({
                        t: 'MP_DAY',
                        d: '2026-08-16',
                        cal: 2120,
                        p: 160,
                        c: 210,
                        f: 64,
                        count: 4,
                      })
                    )
                  }
                  className="text-left p-2 rounded bg-[#0b0b0c] hover:bg-white/5 border border-white/10 hover:border-[#facc15]/50 text-white transition active:scale-98 cursor-pointer"
                >
                  <div className="font-oswald text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Daily Summary QR
                  </div>
                  <div className="font-mono-meta text-[10px] text-white/40">
                    2,120 kcal • 160g P • 210g C
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleBarcodeDetected(
                      JSON.stringify({
                        name: 'Organic Almond Butter',
                        brand: 'DM Bio',
                        caloriesPer100g: 620,
                        proteinPer100g: 22,
                        carbsPer100g: 11,
                        fatPer100g: 54,
                        fiberPer100g: 10,
                        defaultServingSize: 20,
                        defaultServingUnit: 'g',
                      })
                    )
                  }
                  className="text-left p-2 rounded bg-[#0b0b0c] hover:bg-white/5 border border-white/10 hover:border-[#facc15]/50 text-white transition active:scale-98 cursor-pointer"
                >
                  <div className="font-oswald text-xs font-bold text-sky-400 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> Food Item QR
                  </div>
                  <div className="font-mono-meta text-[10px] text-white/40">
                    DM Bio Almond Butter (620 kcal)
                  </div>
                </button>

                <button
                  onClick={() =>
                    handleBarcodeDetected(
                      'https://world.openfoodfacts.org/product/4008400401027/nutella-ferrero'
                    )
                  }
                  className="text-left p-2 rounded bg-[#0b0b0c] hover:bg-white/5 border border-white/10 hover:border-[#facc15]/50 text-white transition active:scale-98 cursor-pointer"
                >
                  <div className="font-oswald text-xs font-bold text-amber-400 flex items-center gap-1">
                    <QrCode className="w-3 h-3" /> OpenFoodFacts URL QR
                  </div>
                  <div className="font-mono-meta text-[10px] text-white/40">
                    Nutella Ferrero (EAN 4008400401027)
                  </div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-1 ios-scroll">
                {filteredSamples.map((sample) => (
                  <button
                    key={sample.code}
                    onClick={() => handleBarcodeDetected(sample.code)}
                    className="text-left p-2 rounded bg-[#0b0b0c] hover:bg-white/5 border border-white/10 hover:border-[#facc15]/50 text-white transition active:scale-98 cursor-pointer"
                  >
                    <div className="font-oswald text-xs font-bold truncate text-white">
                      {sample.name}
                    </div>
                    <div className="font-mono-meta text-[10px] text-white/40">{sample.code}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Plus icon
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
