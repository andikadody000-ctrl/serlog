import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, Shipment } from '../types';
import { Plus, Trash2, Camera, X, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  user: User;
}

export default function WithCourier({ user }: Props) {
  const [resi, setResi] = useState('');
  const [resiList, setResiList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
    setIsScanning(false);
  };

  const startScanner = async () => {
    setScannerError(null);
    setIsScanning(true);
    
    // Small delay to ensure the element is in the DOM
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("reader");
        html5QrCodeRef.current = html5QrCode;
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (!resiList.includes(decodedText)) {
              setResiList(prev => [decodedText, ...prev]);
              // Optional: provide feedback like a beep or vibration
              if (navigator.vibrate) navigator.vibrate(100);
            }
          },
          (errorMessage) => {
            // Silently handle scan errors (common during search)
          }
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        setScannerError("Gagal mengakses kamera. Pastikan izin diberikan.");
        setIsScanning(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleAdd = () => {
    if (resi && !resiList.includes(resi)) {
      setResiList([resi, ...resiList]);
      setResi('');
    }
  };

  const handleRemove = (id: string) => {
    setResiList(resiList.filter(r => r !== id));
  };

  const handleSave = async () => {
    if (resiList.length === 0) return;
    setLoading(true);
    try {
      for (const r of resiList) {
        const shipment: Shipment = {
          resi: r,
          status: 'with_courier',
          origin: user.city || 'KNO',
          destination: 'Unknown',
          weight: 1,
          courierUid: user.uid,
          lastUpdate: Timestamp.now(),
        };
        const shipmentPath = `shipments/${r}`;
        try {
          await setDoc(doc(db, 'shipments', r), shipment);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, shipmentPath);
        }
      }
      setResiList([]);
      alert('Resi berhasil disimpan!');
    } catch (error) {
      console.error('Error saving shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="flex h-16 items-center bg-red-600 px-4 text-white shadow-sm">
        <h2 className="text-xl font-bold italic">Entri With Courier</h2>
      </div>

      {/* Camera/Scanner Section */}
      <div className="relative flex h-72 flex-col items-center justify-center bg-gray-900 overflow-hidden">
        {isScanning ? (
          <div className="h-full w-full relative">
            <div id="reader" className="h-full w-full"></div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-red-500 rounded-lg opacity-50"></div>
            </div>
            <button 
              onClick={stopScanner}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white backdrop-blur-md"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs font-bold bg-black/30 py-2">
              Arahkan kamera ke Barcode / QR Code
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="h-48 w-64 border-2 border-white border-dashed opacity-30 rounded-xl flex items-center justify-center">
               <Camera size={48} className="text-white opacity-20" />
            </div>
            {scannerError && (
              <p className="text-red-400 text-xs font-bold px-4 text-center">{scannerError}</p>
            )}
            <button 
              onClick={startScanner}
              className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3 font-bold text-white shadow-lg active:scale-95"
            >
              <Camera size={20} />
              SCAN BARCODE
            </button>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-4">
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            value={resi}
            onChange={(e) => setResi(e.target.value)}
            placeholder="Input Manual Resi"
            className="flex-1 rounded-lg border border-gray-200 p-3 outline-none focus:border-red-500"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-lg bg-blue-900 px-4 font-bold text-white shadow-sm active:scale-95"
          >
            <Plus size={20} />
            Tambah
          </button>
        </div>
        
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-600">
            Total Resi: <span className="text-red-600">{resiList.length}</span>
          </p>
          {resiList.length > 0 && (
            <button 
              onClick={() => setResiList([])}
              className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"
            >
              <Trash2 size={14} /> Bersihkan
            </button>
          )}
        </div>

        {/* List Section */}
        <div className="min-h-[180px] max-h-[300px] overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-2 shadow-inner">
          {resiList.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-gray-400">
              <RefreshCw size={32} className="mb-2 opacity-20" />
              <p className="text-xs font-medium">Belum ada resi yang di-scan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {resiList.map((r) => (
                <div key={r} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-gray-100">
                  <span className="font-bold text-blue-900 tracking-wider">{r}</span>
                  <button onClick={() => handleRemove(r)} className="text-red-500 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || resiList.length === 0}
          className="mt-6 w-full rounded-xl bg-red-600 py-4 font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-300"
        >
          {loading ? 'Menyimpan...' : 'SIMPAN KE DAFTAR KIRIM'}
        </button>
      </div>
    </div>
  );
}
