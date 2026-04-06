import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { User, Shipment } from '../types';
import { User as UserIcon, LogOut } from 'lucide-react';

interface Props {
  user: User;
}

export default function Dashboard({ user }: Props) {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'shipments'),
      where('courierUid', '==', user.uid)
    );

    const shipmentsPath = 'shipments';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Shipment);
      setShipments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, shipmentsPath);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withCourierCount = shipments.filter(s => s.status === 'with_courier').length;
  const deliveredCount = shipments.filter(s => {
    if (s.status !== 'delivered') return false;
    try {
      const updateDate = s.lastUpdate.toDate();
      return updateDate >= today;
    } catch (e) {
      return false;
    }
  }).length;

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="relative flex h-16 items-center bg-white px-4 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="text-xl font-black text-[#f4b800]">SERLOG</span>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">L</div>
          <span className="text-xl font-black text-black">LOGISTICS</span>
        </div>
        <div className="absolute right-0 top-0 flex h-full w-32 items-center justify-center bg-red-600 text-2xl font-bold text-white" style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)' }}>
          {user.city}
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="flex items-center justify-between p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">
            {user.name}
          </h2>
          <button 
            onClick={handleLogout}
            className="flex w-fit items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
          >
            <LogOut size={14} />
            LOGOUT
          </button>
        </div>
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <UserIcon size={64} />
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-8 px-4 pb-8">
        {/* Pick-up */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-blue-900">PENJEMPUTAN (Pick-up)</h3>
            <span className="text-xs text-gray-500">(0 Kg)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-blue-900 p-4">
              <span className="text-6xl font-bold text-blue-900">0</span>
            </div>
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-blue-900 p-4">
              <span className="text-6xl font-bold text-blue-900">0</span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-blue-900">PENGANTARAN (Delivery)</h3>
            <span className="text-xs text-gray-500">(0 Kg)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-blue-900 p-4">
              <span className="text-6xl font-bold text-blue-900">{withCourierCount}</span>
              <span className="mt-1 text-[10px] font-bold text-gray-400 uppercase">Resi Tersimpan</span>
            </div>
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-blue-900 p-4">
              <span className="text-6xl font-bold text-blue-900">{deliveredCount}</span>
              <span className="mt-1 text-[10px] font-bold text-gray-400 uppercase">Resi Terupdate</span>
            </div>
          </div>
        </div>

        {/* Alert Bar */}
        <div className="flex items-center justify-between rounded-xl bg-amber-400 p-4 font-bold text-red-700 shadow-sm">
          <span>Pick-up yang belum disimpan</span>
          <span className="text-2xl">0</span>
        </div>
      </div>
    </div>
  );
}
