import jsQR from 'jsqr';
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  HybridBinarizer,
  BinaryBitmap,
  MultiFormatReader,
} from '@zxing/library';

// Reusable ZXing MultiFormatReader configured for maximum format support
let zxingMultiReader: MultiFormatReader | null = null;
let zxingBrowserReader: BrowserMultiFormatReader | null = null;

function getZxingMultiReader(): MultiFormatReader {
  if (!zxingMultiReader) {
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);
    zxingMultiReader = reader;
  }
  return zxingMultiReader;
}

function getZxingBrowserReader(): BrowserMultiFormatReader {
  if (!zxingBrowserReader) {
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.DATA_MATRIX,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    zxingBrowserReader = new BrowserMultiFormatReader(hints);
  }
  return zxingBrowserReader;
}

let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
  }
  if (sharedCanvas.width !== width || sharedCanvas.height !== height) {
    sharedCanvas.width = width;
    sharedCanvas.height = height;
  }
  if (!sharedCtx) {
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
  }
  return { canvas: sharedCanvas, ctx: sharedCtx! };
}

export interface DecodeResult {
  text: string;
  format: 'QR_CODE' | 'BARCODE' | 'OTHER';
}

/**
 * Decode QR Code or 1D Barcode from an HTML5 Video frame.
 * Priority:
 * 1. jsQR (ultra fast < 4ms, robust across rotations, light levels, iOS Safari WebKit)
 * 2. BarcodeDetector (hardware accelerated browser API if available)
 * 3. ZXing MultiFormatReader (EAN-13, EAN-8, UPC, Code-128, etc.)
 */
export async function decodeVideoFrame(video: HTMLVideoElement): Promise<DecodeResult | null> {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;

  // We can scan at full resolution or optimized scaled size
  const scanWidth = Math.min(vWidth, 1280);
  const scanHeight = Math.round((vHeight / vWidth) * scanWidth);

  const { canvas, ctx } = getSharedCanvas(scanWidth, scanHeight);
  ctx.drawImage(video, 0, 0, scanWidth, scanHeight);

  // 1. Try jsQR on the full frame
  try {
    const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (qrResult && qrResult.data && qrResult.data.trim().length > 0) {
      return {
        text: qrResult.data.trim(),
        format: 'QR_CODE',
      };
    }
  } catch (e) {
    // continue to next detector
  }

  // 1b. Also try center-cropped region for higher density QR codes (helps when camera is slightly far)
  try {
    const cropSize = Math.min(scanWidth, scanHeight) * 0.7;
    const startX = (scanWidth - cropSize) / 2;
    const startY = (scanHeight - cropSize) / 2;
    const croppedImageData = ctx.getImageData(startX, startY, cropSize, cropSize);
    const croppedQrResult = jsQR(croppedImageData.data, croppedImageData.width, croppedImageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (croppedQrResult && croppedQrResult.data && croppedQrResult.data.trim().length > 0) {
      return {
        text: croppedQrResult.data.trim(),
        format: 'QR_CODE',
      };
    }
  } catch (e) {
    // continue
  }

  // 2. Try native hardware BarcodeDetector (Chrome, iOS 17+ Safari if enabled)
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'data_matrix'],
      });
      const detected = await detector.detect(canvas);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        const raw = detected[0].rawValue.trim();
        if (raw) {
          const isQr = detected[0].format === 'qr_code' || detected[0].format === 'data_matrix';
          return {
            text: raw,
            format: isQr ? 'QR_CODE' : 'BARCODE',
          };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. Try ZXing MultiFormatReader for 1D barcodes and complex formats
  try {
    const imageData = ctx.getImageData(0, 0, scanWidth, scanHeight);
    const luminances = new Uint8ClampedArray(scanWidth * scanHeight);
    const data = imageData.data;
    for (let i = 0; i < luminances.length; i++) {
      // standard luminance formula: 0.299R + 0.587G + 0.114B
      const offset = i * 4;
      luminances[i] = (data[offset] * 77 + data[offset + 1] * 150 + data[offset + 2] * 29) >> 8;
    }

    const source = new RGBLuminanceSource(luminances, scanWidth, scanHeight);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const multiReader = getZxingMultiReader();
    const result = multiReader.decode(bitmap);

    if (result && result.getText()) {
      const fmt = result.getBarcodeFormat() === BarcodeFormat.QR_CODE ? 'QR_CODE' : 'BARCODE';
      return {
        text: result.getText().trim(),
        format: fmt,
      };
    }
  } catch (e) {
    // Standard NotFoundException - no barcode found in frame
  }

  return null;
}

/**
 * Decode from an Image Data URL or file image
 */
export async function decodeFromImage(imgElement: HTMLImageElement): Promise<DecodeResult | null> {
  const w = imgElement.naturalWidth || imgElement.width || 800;
  const h = imgElement.naturalHeight || imgElement.height || 600;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(imgElement, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);

  // 1. jsQR
  try {
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });
    if (qrResult && qrResult.data && qrResult.data.trim().length > 0) {
      return {
        text: qrResult.data.trim(),
        format: 'QR_CODE',
      };
    }
  } catch (e) {
    // continue
  }

  // 2. BarcodeDetector
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'data_matrix'],
      });
      const detected = await detector.detect(canvas);
      if (detected && detected.length > 0 && detected[0].rawValue) {
        const raw = detected[0].rawValue.trim();
        if (raw) {
          const isQr = detected[0].format === 'qr_code' || detected[0].format === 'data_matrix';
          return {
            text: raw,
            format: isQr ? 'QR_CODE' : 'BARCODE',
          };
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. ZXing BrowserMultiFormatReader
  try {
    const browserReader = getZxingBrowserReader();
    const result = await browserReader.decodeFromImageElement(imgElement);
    if (result && result.getText()) {
      const fmt = result.getBarcodeFormat() === BarcodeFormat.QR_CODE ? 'QR_CODE' : 'BARCODE';
      return {
        text: result.getText().trim(),
        format: fmt,
      };
    }
  } catch (e) {
    // continue
  }

  return null;
}
