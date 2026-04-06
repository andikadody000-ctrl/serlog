import React, { useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shipment, POD } from '../types';
import { Search, Package, MapPin, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function Tracking() {
  const [resi, setResi] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [pod, setPod] = useState<POD | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!resi) return;
    setLoading(true);
    setError('');
    setShipment(null);
    setPod(null);

    try {
      const shipmentDoc = await getDoc(doc(db, 'shipments', resi));
      if (shipmentDoc.exists()) {
        setShipment(shipmentDoc.data() as Shipment);
        
        const podDoc = await getDoc(doc(db, 'pods', resi));
        if (podDoc.exists()) {
          setPod(podDoc.data() as POD);
        }
      } else {
        setError('Nomor resi tidak ditemukan.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Terjadi kesalahan saat mencari data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white">
      <div className="flex h-16 items-center bg-red-600 px-4 text-white shadow-sm">
        <h2 className="text-xl font-bold italic">Lacak Resi</h2>
      </div>

      <div className="p-4">
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={resi}
              onChange={(e) => setResi(e.target.value)}
              placeholder="Masukkan Nomor Resi"
              className="w-full rounded-lg border border-gray-200 p-3 pr-10 outline-none focus:border-blue-500"
            />
            <Search className="absolute right-3 top-3 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-blue-900 px-6 font-bold text-white shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? '...' : 'Lacak'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-center text-red-600 font-medium">
            {error}
          </div>
        )}

        {shipment && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="text-blue-900" size={24} />
                  <span className="text-lg font-bold text-blue-900">{shipment.resi}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  shipment.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {shipment.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Asal</p>
                  <p className="font-bold text-gray-800">{shipment.origin}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Tujuan</p>
                  <p className="font-bold text-gray-800">{shipment.destination}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-gray-100">
              {pod && (
                <div className="relative">
                  <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                    <CheckCircle2 size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Diterima oleh {pod.recipientName}</p>
                    <p className="text-xs text-gray-500">Hubungan: {pod.relationship.replace('_', ' ')}</p>
                    <p className="mt-1 text-[10px] font-medium text-gray-400">
                      {format(pod.timestamp.toDate(), 'dd MMM yyyy, HH:mm')}
                    </p>
                    
                    {/* Photo and Signature Display */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {pod.photoUrl && (
                        <div className="overflow-hidden rounded-lg border border-gray-100">
                          <p className="bg-gray-50 p-1 text-[8px] font-bold text-gray-400 uppercase text-center">Foto Resi</p>
                          <img src={pod.photoUrl} alt="Foto Resi" className="h-24 w-full object-cover" />
                        </div>
                      )}
                      {pod.signatureUrl && (
                        <div className="overflow-hidden rounded-lg border border-gray-100">
                          <p className="bg-gray-50 p-1 text-[8px] font-bold text-gray-400 uppercase text-center">Tanda Tangan</p>
                          <img src={pod.signatureUrl} alt="Tanda Tangan" className="h-24 w-full object-contain bg-white" />
                        </div>
                      )}
                    </div>

                    {/* Location Display */}
                    {pod.location && (
                      <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2">
                        <div className="flex items-center gap-2 text-blue-900 mb-1">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold uppercase">Lokasi Pengiriman</span>
                        </div>
                        <p className="text-[10px] text-gray-600">
                          Lat: {pod.location.latitude.toFixed(6)}, Long: {pod.location.longitude.toFixed(6)}
                        </p>
                        <a 
                          href={`https://www.google.com/maps?q=${pod.location.latitude},${pod.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-[10px] font-bold text-blue-600 underline"
                        >
                          Buka di Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Status: {shipment.status.replace('_', ' ')}</p>
                  <p className="mt-1 text-[10px] font-medium text-gray-400">
                    {format(shipment.lastUpdate.toDate(), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
