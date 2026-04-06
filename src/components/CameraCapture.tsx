import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface Props {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex h-16 items-center justify-between px-4 text-white">
        <h3 className="font-bold">Ambil Foto</h3>
        <button onClick={onClose} className="p-2">
          <X size={24} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden bg-gray-900">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
            <p className="mb-4">{error}</p>
            <button onClick={startCamera} className="rounded-lg bg-blue-600 px-6 py-2 font-bold">
              Coba Lagi
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex h-32 items-center justify-center bg-black">
        {!error && (
          <button
            onClick={capture}
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-red-600 shadow-lg active:scale-90"
          >
            <div className="h-16 w-16 rounded-full border-2 border-white"></div>
          </button>
        )}
      </div>
    </div>
  );
}
