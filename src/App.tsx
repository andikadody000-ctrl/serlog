import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import ErrorBoundary from './components/ErrorBoundary';
import { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import WithCourier from './components/WithCourier';
import POD from './components/POD';
import Tracking from './components/Tracking';
import Report from './components/Report';
import BottomNav from './components/BottomNav';

type Screen = 'home' | 'with_courier' | 'pick_up' | 'pod' | 'report' | 'tracking';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Use onSnapshot for real-time user profile updates
        const userPath = `users/${firebaseUser.uid}`;
        unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as User);
          } else {
            // Profile doesn't exist yet, wait or create default
            // We don't create default here to avoid race conditions with Login.tsx
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, userPath);
        });
      } else {
        if (unsubscribeUser) unsubscribeUser();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <Dashboard user={user} />;
      case 'with_courier':
        return <WithCourier user={user} />;
      case 'pod':
        return <POD user={user} />;
      case 'report':
        return <Report user={user} />;
      case 'tracking':
        return <Tracking />;
      default:
        return (
          <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
            Screen "{currentScreen}" is under development.
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pb-20">
      <main className="flex-1 overflow-y-auto">
        {renderScreen()}
      </main>
      <BottomNav activeScreen={currentScreen} onScreenChange={setCurrentScreen} />
    </div>
  );
}
