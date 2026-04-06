import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { User, Shipment, POD } from '../types';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  user: User;
}

export default function Report({ user }: Props) {
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has any shipments to determine empty state
    const q = query(
      collection(db, 'shipments'),
      where('courierUid', '==', user.uid),
      limit(1)
    );
    const shipmentsPath = 'shipments';
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasData(!snapshot.empty);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, shipmentsPath);
    });
    return () => unsubscribe();
  }, [user.uid]);

  const exportToExcel = async () => {
    if (hasData === false) {
      alert('Anda belum memiliki data transaksi untuk diekspor.');
      return;
    }
    
    setLoading(true);
    try {
      const shipmentsPath = 'shipments';
      const shipmentsQuery = query(
        collection(db, 'shipments'),
        where('courierUid', '==', user.uid)
      );
      let shipmentsSnapshot;
      try {
        shipmentsSnapshot = await getDocs(shipmentsQuery);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, shipmentsPath);
      }
      const shipments = shipmentsSnapshot.docs.map(doc => doc.data() as Shipment);

      // Fetch all PODs for this courier
      const podsPath = 'pods';
      const podsQuery = query(
        collection(db, 'pods'),
        where('courierUid', '==', user.uid)
      );
      let podsSnapshot;
      try {
        podsSnapshot = await getDocs(podsQuery);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, podsPath);
      }
      const podsMap = new Map<string, POD>();
      podsSnapshot.docs.forEach(doc => {
        const pod = doc.data() as POD;
        podsMap.set(pod.resi, pod);
      });

      // Combine data for export
      const exportData = shipments.map(s => {
        const pod = podsMap.get(s.resi);
        
        let lastUpdateStr = '-';
        try {
          if (s.lastUpdate && typeof s.lastUpdate.toDate === 'function') {
            lastUpdateStr = format(s.lastUpdate.toDate(), 'yyyy-MM-dd HH:mm:ss');
          }
        } catch (e) {
          console.warn(`Invalid lastUpdate for resi ${s.resi}`, e);
        }

        let receivedTimeStr = '-';
        try {
          if (pod && pod.timestamp && typeof pod.timestamp.toDate === 'function') {
            receivedTimeStr = format(pod.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss');
          }
        } catch (e) {
          console.warn(`Invalid pod timestamp for resi ${s.resi}`, e);
        }

        const photoUrl = pod?.photoUrl || '-';
        const displayPhotoUrl = (photoUrl.startsWith('data:image') && photoUrl.length > 32000) 
          ? '[DATA FOTO TERLALU BESAR UNTUK EXCEL]' 
          : photoUrl;

        return {
          'Nomor Resi': s.resi,
          'Status': (s.status || 'unknown').replace('_', ' ').toUpperCase(),
          'Kota Asal': s.origin || '-',
          'Kota Tujuan': s.destination || '-',
          'Berat (Kg)': s.weight || 0,
          'Update Terakhir': lastUpdateStr,
          'Nama Penerima': pod?.recipientName || '-',
          'Hubungan': pod?.relationship?.replace('_', ' ')?.toUpperCase() || '-',
          'Waktu Diterima': receivedTimeStr,
          'Latitude': pod?.location?.latitude || '-',
          'Longitude': pod?.location?.longitude || '-',
          'Photo URL': displayPhotoUrl,
        };
      });

      if (exportData.length === 0) {
        alert('Tidak ada data pengiriman untuk diekspor.');
        setLoading(false);
        return;
      }

      // Create worksheet
      try {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Pengiriman');

        // Generate filename with current date and sanitized name
        const sanitizedName = user.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `Laporan_Serlog_${sanitizedName}_${format(new Date(), 'yyyyMMdd')}.xlsx`;

        // Export file
        XLSX.writeFile(workbook, fileName);
      } catch (xlsxError) {
        console.error('XLSX processing error:', xlsxError);
        alert(`Gagal memproses file Excel: ${xlsxError instanceof Error ? xlsxError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Gagal mengekspor data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white min-h-full">
      <div className="flex h-16 items-center bg-red-600 px-4 text-white shadow-sm">
        <h2 className="text-xl font-bold italic">Laporan & Export</h2>
      </div>

      <div className="flex flex-col items-center justify-center p-8 text-center flex-1">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-600">
          <FileSpreadsheet size={48} />
        </div>
        
        <h3 className="mb-2 text-xl font-bold text-blue-900">Export Laporan Excel</h3>
        <p className="mb-8 text-sm text-gray-500 max-w-xs">
          Unduh semua data pengiriman dan bukti penerimaan (POD) Anda dalam format file Excel (.xlsx).
        </p>

        <button
          onClick={exportToExcel}
          disabled={loading || hasData === false}
          className="flex w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-green-600 py-4 font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-300"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Memproses Data...
            </>
          ) : hasData === false ? (
            <>
              <FileSpreadsheet size={20} />
              Data Masih Kosong
            </>
          ) : (
            <>
              <Download size={20} />
              Download Laporan Excel
            </>
          )}
        </button>

        <div className="mt-12 w-full max-w-sm rounded-xl border border-gray-100 bg-gray-50 p-4 text-left">
          <h4 className="mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Informasi Laporan</h4>
          <ul className="space-y-2 text-xs font-medium text-gray-600">
            <li className="flex justify-between">
              <span>Nama Kurir:</span>
              <span className="text-blue-900">{user.name}</span>
            </li>
            <li className="flex justify-between">
              <span>Wilayah Kerja:</span>
              <span className="text-blue-900">{user.city}</span>
            </li>
            <li className="flex justify-between">
              <span>Format File:</span>
              <span className="text-blue-900">.xlsx (Excel)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
