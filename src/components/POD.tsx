import React, { useState, useRef, useEffect } from 'react';
import { doc, setDoc, updateDoc, Timestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, POD as PODType, Relationship, Shipment } from '../types';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, CheckCircle2, ChevronDown, X } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface Props {
  user: User;
}

export default function POD({ user }: Props) {
  const [resi, setResi] = useState('');
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [recipient, setRecipient] = useState('');
  const [relationship, setRelationship] = useState<Relationship>('ybs');
  const [photo, setPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'shipments'),
      where('courierUid', '==', user.uid),
      where('status', '==', 'with_courier')
    );

    const shipmentsPath = 'shipments';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Shipment);
      setAvailableShipments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, shipmentsPath);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleResiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedResi = e.target.value;
    setResi(selectedResi);
    const shipment = availableShipments.find(s => s.resi === selectedResi) || null;
    setSelectedShipment(shipment);
    if (shipment) {
      setOrigin(shipment.origin || '');
      setDestination(shipment.destination || '');
    } else {
      setOrigin('');
      setDestination('');
    }
  };

  const handleSave = async () => {
    if (!resi || !recipient) return;
    setLoading(true);
    try {
      // Get current location
      let location: { latitude: number; longitude: number } | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (locError) {
        console.warn('Could not get location:', locError);
      }

      const pod: PODType = {
        resi,
        recipientName: recipient,
        relationship,
        timestamp: Timestamp.now(),
        courierUid: user.uid,
        photoUrl: photo || 'https://picsum.photos/seed/pod/400/300',
        signatureUrl: sigCanvas.current?.toDataURL() || '',
        location
      };

      const podPath = `pods/${resi}`;
      const shipmentPath = `shipments/${resi}`;
      try {
        await setDoc(doc(db, 'pods', resi), pod);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, podPath);
      }

      try {
        await updateDoc(doc(db, 'shipments', resi), {
          status: 'delivered',
          origin,
          destination,
          lastUpdate: Timestamp.now(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, shipmentPath);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setResi('');
        setSelectedShipment(null);
        setOrigin('');
        setDestination('');
        setRecipient('');
        setRelationship('ybs');
        setPhoto(null);
        sigCanvas.current?.clear();
      }, 3000);
    } catch (error) {
      console.error('Error saving POD:', error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white p-8 text-center">
        <CheckCircle2 size={120} className="mb-6 text-green-500" />
        <h2 className="text-3xl font-bold text-blue-900">POD Berhasil Disimpan!</h2>
        <p className="mt-4 text-gray-600">Data pengiriman telah diperbarui.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white">
      <div className="flex h-16 items-center bg-red-600 px-4 text-white shadow-sm">
        <h2 className="text-xl font-bold italic">Update POD</h2>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Pilih Nomor Resi</label>
          <div className="relative">
            <select
              value={resi}
              onChange={handleResiChange}
              className="w-full appearance-none rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500 bg-white"
            >
              <option value="">-- Pilih Resi --</option>
              {availableShipments.map((s) => (
                <option key={s.resi} value={s.resi}>
                  {s.resi}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
          </div>
          {availableShipments.length === 0 && (
            <p className="mt-1 text-[10px] text-red-500 font-bold uppercase">Tidak ada resi dalam pengantaran</p>
          )}
        </div>

        {selectedShipment && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Kota Asal</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Kota Asal"
                  className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Kota Tujuan</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Kota Tujuan"
                  className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Nama Penerima</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Nama Lengkap Penerima"
                className="w-full rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Hubungan Penerima</label>
              <div className="relative">
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as Relationship)}
                  className="w-full appearance-none rounded-lg border border-gray-200 p-3 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="ybs">YBS (Yang Bersangkutan)</option>
                  <option value="rekan_kerja">Rekan Kerja</option>
                  <option value="mailing_room">Mailing Room</option>
                  <option value="satpam">Satpam</option>
                  <option value="lainnya">Lainnya</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            {/* Photo Section */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Photo Resi</label>
              {photo ? (
                <div className="relative h-40 w-full overflow-hidden rounded-lg border border-gray-200">
                  <img src={photo} alt="Resi" className="h-full w-full object-cover" />
                  <button 
                    onClick={() => setPhoto(null)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCamera(true)}
                  className="flex h-40 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:bg-gray-100"
                >
                  <Camera size={32} className="text-gray-400" />
                  <span className="ml-2 text-sm text-gray-400">Ambil Foto</span>
                </button>
              )}
            </div>

            {/* Signature Section */}
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-500 uppercase">Tanda Tangan</label>
              <div className="rounded-lg border border-gray-200 bg-white">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ className: 'w-full h-40 rounded-lg' }}
                />
              </div>
              <button
                onClick={() => sigCanvas.current?.clear()}
                className="mt-1 text-xs font-bold text-red-500 uppercase"
              >
                Hapus Tanda Tangan
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={loading || !resi || !recipient}
              className="mt-4 w-full rounded-xl bg-blue-900 py-4 font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan POD'}
            </button>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraCapture 
          onCapture={(data) => setPhoto(data)}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
