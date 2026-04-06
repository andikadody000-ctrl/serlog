import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { LogIn, UserPlus, Mail, Lock, User, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('KNO');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: name });

        // Create Firestore profile
        const userPath = `users/${firebaseUser.uid}`;
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            uid: firebaseUser.uid,
            name: name,
            email: email,
            city: city.toUpperCase(),
            role: 'courier',
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, userPath);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Terjadi kesalahan pada autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50">
      {/* Background Image - Using a reliable Unsplash source to avoid hotlinking issues */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000"
          alt="Logistics Background"
          className="h-full w-full object-cover opacity-25"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-white/60"></div>
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center p-6">
        {/* Header Branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-3xl font-black tracking-tighter text-[#f4b800]">SERLOG</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
              <span className="text-xs font-bold">L</span>
            </div>
            <span className="text-3xl font-black tracking-tighter text-black">LOGISTICS</span>
          </div>
          <div className="w-full max-w-sm overflow-hidden whitespace-nowrap rounded-lg bg-red-50/80 py-2 border border-red-100 backdrop-blur-sm">
            <motion.div
              animate={{ x: ["100%", "-100%"] }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="inline-block text-xs font-bold text-red-600 uppercase tracking-widest"
            >
              Terima kasih sudah selalu on-time dan menjaga paket dengan aman sampai tujuan.
            </motion.div>
          </div>
        </div>

        <div className="w-full">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm focus-within:border-red-500 backdrop-blur-sm">
                  <User size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    required
                  />
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm focus-within:border-red-500 backdrop-blur-sm">
                  <MapPin size={20} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Kode Kota (Contoh: KNO, CGK)"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm focus-within:border-red-500 backdrop-blur-sm">
              <Mail size={20} className="text-gray-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm focus-within:border-red-500 backdrop-blur-sm">
              <Lock size={20} className="text-gray-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none"
                required
              />
            </div>

            {/* Bottom Navbar Buttons (also act as Submit) */}
            <div className="mt-8 flex gap-2">
              <button
                type="submit"
                onClick={() => setIsRegistering(false)}
                disabled={loading}
                className={`flex-1 rounded-xl py-4 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 ${!isRegistering ? 'bg-[#f4b800] text-white' : 'bg-white/80 text-gray-400'}`}
              >
                {loading && !isRegistering ? '...' : 'LOGIN'}
              </button>
              <button
                type="submit"
                onClick={() => setIsRegistering(true)}
                disabled={loading}
                className={`flex-1 rounded-xl py-4 text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 ${isRegistering ? 'bg-[#d3d3d3] text-white' : 'bg-white/80 text-gray-400'}`}
              >
                {loading && isRegistering ? '...' : 'DAFTAR'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 text-xs font-bold text-gray-400">V2.1.3</div>
    </div>
  );
}
