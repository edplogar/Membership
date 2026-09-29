import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Member, MembershipTier } from '../../types';
import { Modal } from '../common/Modal';
import { formatDateIndo } from '../../services/membershipEngine';
import jsQR from 'jsqr';
import {
  Search,
  CheckCircle,
  AlertCircle,
  BedDouble,
  Receipt,
  Coins,
  UserCheck,
  Sparkles,
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  SwitchCamera,
  Check,
  Volume2,
  VolumeX,
  UserPlus,
  QrCode,
  ScanLine,
} from 'lucide-react';

interface FrontDeskScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionCheckIn: (member: Member) => void;
  onActionAddTransaction: (member: Member) => void;
  onActionAdjustPoints: (member: Member) => void;
  onActionViewProfile: (member: Member) => void;
  onOpenAddMember?: () => void;
}

export const FrontDeskScannerModal: React.FC<FrontDeskScannerModalProps> = ({
  isOpen,
  onClose,
  onActionCheckIn,
  onActionAddTransaction,
  onActionAdjustPoints,
  onActionViewProfile,
  onOpenAddMember,
}) => {
  const { members, tiers } = useApp();

  // Mode: 'camera' | 'manual' | 'upload'
  const [scanMode, setScanMode] = useState<'camera' | 'manual' | 'upload'>('camera');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [lastScannedRaw, setLastScannedRaw] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera state
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unsupported' | 'error'>('idle');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

  // Sound beep helper using Web Audio API
  const playBeep = useCallback((success: boolean = true) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(success ? 880 : 300, ctx.currentTime); // A5 or low buzz
      if (success) {
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6
      }

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (success ? 0.2 : 0.3));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + (success ? 0.22 : 0.32));
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [soundEnabled]);

  // Match scanned text to a member in memory
  const handleDecodedData = useCallback((decoded: string) => {
    const clean = decoded.trim();
    if (!clean) return;

    // Throttle duplicate scan within 2 seconds
    const now = Date.now();
    if (lastScannedRaw === clean && now - lastDetectionTimeRef.current < 2000) {
      return;
    }
    lastDetectionTimeRef.current = now;
    setLastScannedRaw(clean);
    setScanError(null);

    // Try parsing if payload is JSON (some custom QR codes)
    let searchKey = clean;
    try {
      if (clean.startsWith('{') && clean.endsWith('}')) {
        const parsed = JSON.parse(clean);
        searchKey = parsed.membershipNumber || parsed.id || parsed.email || clean;
      }
    } catch {
      // Not json, use clean raw string
    }

    // Extract code if clean is a URL like https://hotel.com/member/LGH-1234
    if (searchKey.includes('/')) {
      const parts = searchKey.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length >= 3) {
        searchKey = lastPart;
      }
    }

    const keyLower = searchKey.toLowerCase();
    const found = members.find(
      (m) =>
        m.membershipNumber.toLowerCase() === keyLower ||
        m.id.toLowerCase() === keyLower ||
        (m.referralCode && m.referralCode.toLowerCase() === keyLower) ||
        m.email.toLowerCase() === keyLower ||
        m.phone.replace(/[^0-9]/g, '') === keyLower.replace(/[^0-9]/g, '') ||
        (m.idCardNumber && m.idCardNumber === keyLower) ||
        m.fullName.toLowerCase().includes(keyLower)
    );

    if (found) {
      playBeep(true);
      setSelectedMember(found);
      setSearchQuery('');
    } else {
      playBeep(false);
      setScanError(`Kode "${clean}" terdeteksi, namun tidak cocok dengan data member yang tersimpan.`);
    }
  }, [members, lastScannedRaw, playBeep]);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Frame processing loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (width > 0 && height > 0) {
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // 1. Scan using jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleDecodedData(code.data);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleDecodedData]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setCameraErrorMessage('Browser atau perangkat ini tidak mendukung akses kamera langsung.');
      return;
    }

    setCameraState('requesting');
    setCameraErrorMessage(null);

    try {
      // Build constraints
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setCameraState('active');

      // Enumerate available video inputs
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
      } catch {
        // ignore device listing error
      }

      // Start scan loop
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err: unknown) {
      const errObj = err as Error;
      console.warn('Camera Access Notice:', errObj?.name, errObj?.message);
      if (errObj?.name === 'NotAllowedError' || errObj?.name === 'PermissionDeniedError') {
        setCameraState('denied');
        setCameraErrorMessage('Izin akses kamera tidak diberikan. Silakan izinkan akses kamera di pengaturan browser Anda.');
      } else if (errObj?.name === 'NotFoundError' || errObj?.name === 'DevicesNotFoundError') {
        setCameraState('error');
        setCameraErrorMessage('Tidak ada modul kamera yang terdeteksi pada perangkat ini.');
      } else {
        setCameraState('error');
        setCameraErrorMessage(errObj?.message || 'Gagal memulai pemindaian kamera.');
      }
    }
  }, [facingMode, selectedDeviceId, scanVideoFrame, stopCamera]);

  // Lifecycle when modal opens or closes or mode changes
  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, scanMode, startCamera, stopCamera]);

  // Select initial member if none selected on open
  useEffect(() => {
    if (isOpen && !selectedMember && members.length > 0) {
      setSelectedMember(members[0]);
    }
  }, [isOpen, members, selectedMember]);

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
  };

  // Image Upload Scanner
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleDecodedData(code.data);
          } else {
            playBeep(false);
            setScanError('Tidak dapat mendeteksi kode QR atau barcode pada gambar yang diunggah. Pastikan gambar jelas dan terang.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filtered members for manual search
  const filteredMembers = members.filter(
    (m) =>
      m.membershipNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery)
  );

  const currentTier: MembershipTier = selectedMember
    ? tiers.find((t) => t.id === selectedMember.tierId) || tiers[0]
    : tiers[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Front Desk QR Scanner & Verifikasi Kartu Member"
      subtitle="Arahkan kamera ke kartu member fisik atau kartu digital tamu untuk verifikasi instan"
      maxWidth="2xl"
    >
      <div className="space-y-5 -mt-2">
        {/* Navigation Tabs (Kamera Langsung, Upload Gambar, Cari Manual) */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setScanMode('camera')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                scanMode === 'camera'
                  ? 'bg-[#00A651] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera Langsung</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('upload')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                scanMode === 'upload'
                  ? 'bg-[#00A651] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Foto Kartu</span>
            </button>

            <button
              type="button"
              onClick={() => setScanMode('manual')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                scanMode === 'manual'
                  ? 'bg-[#00A651] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Manual</span>
            </button>
          </div>

          {/* Sound Toggle & Camera Switch */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-stone-100 border-stone-200 text-stone-500'
              }`}
              title={soundEnabled ? 'Suara Beep Aktif' : 'Suara Beep Nonaktif'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00A651]" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: LIVE CAMERA SCANNER ================= */}
        {scanMode === 'camera' && (
          <div className="space-y-3">
            <div className="relative w-full aspect-video sm:aspect-[16/9] max-h-[320px] bg-stone-950 rounded-2xl overflow-hidden border-2 border-[#00A651]/40 flex items-center justify-center shadow-inner">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Active Scanner Viewport Overlay */}
              {cameraState === 'active' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  {/* Bounding Box Frame */}
                  <div className="w-64 h-48 sm:w-72 sm:h-52 border-2 border-[#00A651] rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner Reticles */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br-lg" />

                    {/* Animated Laser Scanning Line */}
                    <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#00A651] to-transparent shadow-[0_0_12px_#00A651] animate-bounce duration-1000 top-1/2 -translate-y-1/2" />

                    <div className="absolute -bottom-7 left-0 right-0 text-center">
                      <span className="text-[10px] uppercase tracking-wider font-bold bg-[#072417]/90 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                        Arahkan Barcode / QR Kartu ke Sini
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera State Overlays */}
              {cameraState === 'requesting' && (
                <div className="absolute inset-0 bg-stone-900/90 text-white flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <RefreshCw className="w-8 h-8 text-[#00A651] animate-spin" />
                  <div className="font-bold text-sm">Menghubungkan ke Kamera...</div>
                  <p className="text-xs text-stone-400 max-w-xs">
                    Harap izinkan akses kamera pada prompt browser untuk mulai memindai.
                  </p>
                </div>
              )}

              {cameraState === 'denied' && (
                <div className="absolute inset-0 bg-stone-900/95 text-white flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <CameraOff className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-rose-300">Akses Kamera Ditolak</div>
                  <p className="text-xs text-stone-300 max-w-sm">
                    {cameraErrorMessage || 'Izin kamera diblokir oleh browser. Klik ikon gembok / kamera di bilah alamat browser Anda dan pilih "Izinkan", lalu coba lagi.'}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="mt-2 px-4 py-2 bg-[#00A651] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Akses Kamera Lagi</span>
                  </button>
                </div>
              )}

              {(cameraState === 'error' || cameraState === 'unsupported') && (
                <div className="absolute inset-0 bg-stone-900/95 text-white flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-amber-300">Kamera Tidak Tersedia</div>
                  <p className="text-xs text-stone-300 max-w-sm">
                    {cameraErrorMessage || 'Kamera tidak dapat diakses pada perangkat ini. Anda dapat menggunakan opsi Unggah Foto Kartu atau Pencarian Manual.'}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setScanMode('upload')}
                      className="px-3.5 py-2 bg-[#00A651] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Foto Kartu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanMode('manual')}
                      className="px-3.5 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Input Manual</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Controls Bar */}
            {cameraState === 'active' && (
              <div className="flex items-center justify-between text-xs text-stone-600 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00A651] animate-pulse" />
                  <span className="font-medium text-stone-700">Kamera Aktif & Memindai Real-Time</span>
                </div>

                <div className="flex items-center gap-2">
                  {availableDevices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                      }}
                      className="text-xs px-2.5 py-1 bg-stone-100 border border-stone-300 rounded-lg text-stone-800 font-medium"
                    >
                      <option value="">Pilih Kamera</option>
                      {availableDevices.map((dev, idx) => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label || `Kamera ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-stone-200"
                    title="Ganti Kamera Depan / Belakang"
                  >
                    <SwitchCamera className="w-3.5 h-3.5 text-[#00A651]" />
                    <span>Ganti Kamera ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg border border-stone-200 cursor-pointer"
                    title="Muat Ulang Kamera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: UPLOAD IMAGE SCANNER ================= */}
        {scanMode === 'upload' && (
          <div className="p-6 border-2 border-dashed border-stone-300 rounded-2xl bg-stone-50 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00A651] flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-800">Unggah Foto atau Tangkapan Layar Kartu</h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Pilih foto kartu fisik atau QR kartu digital yang tersimpan di perangkat Anda.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00A651] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold cursor-pointer shadow-md transition-all">
              <QrCode className="w-4 h-4" />
              <span>Pilih Berkas Gambar (PNG / JPG)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* ================= VIEW 3: MANUAL SEARCH ================= */}
        {scanMode === 'manual' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik Nomor Member (LGH-...), Nama Tamu, atau No. Telepon..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                autoFocus
              />
            </div>

            {/* Quick Member Selection Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-stone-400 shrink-0 font-medium text-[11px]">
                Daftar Tamu Cepat:
              </span>
              {members.slice(0, 8).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMember(m);
                    setScanError(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                    selectedMember?.id === m.id
                      ? 'bg-[#072417] text-amber-300 font-semibold shadow-xs'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {m.fullName.split(' ')[0]} ({m.membershipNumber})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification Error if scanned code doesn't match */}
        {scanError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Kode Belum Terdaftar</div>
                <div className="text-stone-600 mt-0.5">{scanError}</div>
              </div>
            </div>
            {onOpenAddMember && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddMember();
                }}
                className="px-3 py-1.5 bg-[#00A651] text-white rounded-lg text-xs font-bold shrink-0 hover:bg-[#008f45] cursor-pointer"
              >
                + Daftarkan Member
              </button>
            )}
          </div>
        )}

        {/* ================= VERIFICATION RESULT CARD ================= */}
        {selectedMember ? (
          <div className="bg-stone-50/90 rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#072417] text-amber-300 font-serif font-bold text-lg flex items-center justify-center shadow-xs border border-[#00A651]/30">
                  {selectedMember.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-stone-900 font-serif">
                      {selectedMember.fullName}
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        selectedMember.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedMember.status}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-stone-500 mt-0.5 flex items-center gap-2">
                    <span className="text-emerald-800 font-bold">{selectedMember.membershipNumber}</span>
                    <span>&bull;</span>
                    <span>{selectedMember.phone}</span>
                  </div>
                </div>
              </div>

              {/* Tier Badge */}
              <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-[#E5DFD3] shadow-xs">
                <Sparkles className="w-4 h-4 text-[#C5A869]" />
                <div>
                  <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Tier Membership
                  </div>
                  <div className="text-xs font-bold text-stone-900 font-serif">
                    {currentTier.name} (Lvl {currentTier.level})
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Poin Tersedia
                </div>
                <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">
                  {selectedMember.availablePoints.toLocaleString('id-ID')} pts
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Total Spending
                </div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  Rp {(selectedMember.totalSpending / 1000000).toFixed(1)} Jt
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Total Kunjungan
                </div>
                <div className="text-sm font-bold text-stone-900 font-mono mt-0.5">
                  {selectedMember.totalVisits}x Menginap
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-stone-200">
                <div className="text-[10px] text-stone-400 font-medium uppercase">
                  Masa Berlaku
                </div>
                <div className="text-[11px] font-semibold text-stone-700 font-mono mt-0.5">
                  {formatDateIndo(selectedMember.membershipEndDate)}
                </div>
              </div>
            </div>

            {/* Active Tier Benefits preview for Front Office Staff */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#00A651]" />
                Benefit Aktif Tamu:
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-stone-600">
                {currentTier.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Staff Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  onActionCheckIn(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#00A651] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <BedDouble className="w-3.5 h-3.5" />
                <span>Check-In Stay</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onActionAddTransaction(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-[#072417] hover:bg-[#0c3522] text-stone-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>Catat Belanja</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onActionAdjustPoints(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5 text-[#C5A869]" />
                <span>Sesuaikan Poin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onActionViewProfile(selectedMember);
                  onClose();
                }}
                className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                <span>Detail Profil</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs">
            Arahkan kamera ke kartu member atau cari member di atas untuk verifikasi kartu
          </div>
        )}
      </div>
    </Modal>
  );
};
