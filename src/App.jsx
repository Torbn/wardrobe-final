import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, 
    collection, onSnapshot, query, serverTimestamp, where, writeBatch, getDocs
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// --- Helper-ikoner (SVG) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const OutfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ChevronDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;


// --- Firebase Konfiguration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let app;
let auth;
let db;
let functions;

// --- Bildhanteringsfunktion ---
const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;
            if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
            else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
});


// --- Generisk modal-komponent ---
function Modal({ isOpen, onClose, onConfirm, title, children, confirmText = "Bekräfta", showConfirm = true }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <div className="mb-6 max-h-[70vh] overflow-y-auto">{children}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold">{showConfirm ? "Avbryt" : "Stäng"}</button>
                    {showConfirm && <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded font-semibold">{confirmText}</button>}
                </div>
            </div>
        </div>
    );
}

// --- Komponent för Skelettladdare ---
function SkeletonLoader() {
    return (
        <div className="flex flex-col h-full animate-pulse">
            <header className="bg-gray-200 h-16 w-full p-4 mb-4"></header>
            <main className="flex-grow p-4 space-y-8">
                <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg"></div>
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg"></div>
                </div>
            </main>
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-200 h-16 border-t"></nav>
        </div>
    );
}

// --- Huvudkomponent: App ---
export default function App() {
    const [user, setUser] = useState(undefined); // undefined = vi vet inte än
    const [appData, setAppData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        const initAndAuth = async () => {
            try {
                if (!app) {
                    const functionUrl = "https://fetchfirebaseconfig-mh2elqvcwa-uc.a.run.app";
                    const response = await fetch(functionUrl);
                    if (!response.ok) throw new Error(`Nätverksfel: ${response.status}`);
                    const fetchedConfig = await response.json();
                    if (!fetchedConfig?.apiKey) throw new Error("Ogiltig konfiguration mottagen.");
                    
                    app = initializeApp(fetchedConfig);
                    auth = getAuth(app);
                    db = getFirestore(app);
                    functions = getFunctions(app);
                }

                const params = new URLSearchParams(window.location.search);
                const sessionId = params.get('session');

                if (sessionId) {
                    const createToken = httpsCallable(functions, 'createCustomToken');
                    const result = await createToken({ uid: sessionId });
                    await signInWithCustomToken(auth, result.data.token);
                } else {
                    setUser(null); // Explicit sätt att ingen användare finns / är ny
                    setLoading(false);
                }

                onAuthStateChanged(auth, (currentUser) => {
                    if (currentUser) {
                        setUser(currentUser);
                    }
                });

            } catch (e) {
                setError(`Kunde inte starta appen: ${e.message}`);
                setLoading(false);
            }
        };
        initAndAuth();
    }, []);

    useEffect(() => {
        if (!user) {
             setLoading(false);
             setAppData(null);
             return;
        };

        setLoading(true);
        const userDocRef = doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            setAppData(docSnap.exists() ? docSnap.data() : null);
            setLoading(false);
        }, (err) => {
            setError("Kunde inte ladda profildata.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><p>{error}</p></div>;
    if (loading || user === undefined) return <SkeletonLoader />;

    if (user) {
        if (appData) {
            if (appData.mode === 'family' && !appData.familyId) {
                 if (appData.status === 'pending') return <PendingApprovalScreen />;
                 return <FamilySetup user={user} appData={appData} />;
            }
            if (appData.status === 'pending') return <PendingApprovalScreen />;
            return <WardrobeManager user={user} appData={appData} />;
        }
        return <ProfileSetup user={user} />;
    }
    
    return <AuthGate />;
}

// --- Komponent för autentisering (ny) ---
function AuthGate() {
    const [recoveryCode, setRecoveryCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!recoveryCode.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const q = query(collection(db, `/artifacts/${appId}/users`), where("recoveryCode", "==", recoveryCode.toUpperCase()));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                throw new Error("Felaktig återställningskod.");
            }
            const userDoc = querySnapshot.docs[0];
            const uid = userDoc.id;
            
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('session', uid);
            window.location.href = newUrl.toString();

        } catch (e) {
            setError(e.message);
            setIsLoading(false);
        }
    };

    const handleCreateNew = async () => {
        setIsLoading(true);
        setError('');
        try {
            const userCredential = await signInAnonymously(auth);
            const newUid = userCredential.user.uid;
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('session', newUid);
            window.location.href = newUrl.toString();
        } catch (e) {
            setError("Kunde inte skapa ny användare.");
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center">Välkommen!</h2>
                <p className="text-center text-gray-600">Ange din återställningskod för att ladda din garderob.</p>
                <div>
                    <input 
                        type="text"
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        placeholder="t.ex. SNABB-HÄST-42"
                        className="w-full px-4 py-2 text-lg text-center border rounded-md"
                    />
                </div>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button onClick={handleLogin} disabled={isLoading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isLoading ? 'Laddar...' : 'Ladda garderob'}
                </button>
                <div className="text-center">
                    <button onClick={handleCreateNew} disabled={isLoading} className="text-sm text-gray-500 hover:underline">
                        Är du ny här? Skapa en ny garderob.
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- Komponent: Profil-setup (modifierad) ---
function ProfileSetup({ user }) {
    const [name, setName] = useState('');
    const [mode, setMode] = useState('personal'); // 'personal' eller 'family'
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [recoveryCode, setRecoveryCode] = useState(null);

    const generateRecoveryCode = () => {
        const adjectives = ["SNABB", "RÖD", "GLAD", "STOR", "LITEN", "VILD", "LUGN", "KLOK"];
        const nouns = ["HÄST", "BLOMMA", "STJÄRNA", "VIND", "SKOG", "FLOD", "STEN", "MÅNE"];
        const randomNumber = Math.floor(Math.random() * 90) + 10;
        return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${randomNumber}`;
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError("Du måste ange ett namn.");
            return;
        }
        setIsProcessing(true);
        setError('');
        
        const code = generateRecoveryCode();
        setRecoveryCode(code);

        try {
            const userProfile = { name, mode, recoveryCode: code };
            if (mode === 'family') {
                const familyId = doc(collection(db, '_')).id;
                userProfile.familyId = familyId;
                
                const batch = writeBatch(db);
                const familyDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}`);
                batch.set(familyDocRef, { owner: user.uid, name: `${name}s familj`, createdAt: serverTimestamp() });
                
                const membershipDocRef = doc(collection(db, `/artifacts/${appId}/public/data/memberships`));
                batch.set(membershipDocRef, { userId: user.uid, familyId, name, role: 'admin', isPrivate: false });
                
                batch.set(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), userProfile);
                await batch.commit();

            } else {
                await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), userProfile);
            }
        } catch (e) {
            setError("Kunde inte skapa profilen. Försök igen.");
            setIsProcessing(false);
            setRecoveryCode(null);
        }
    };
    
    if (recoveryCode) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="w-full max-w-sm p-8 space-y-6 text-center bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold">Din garderob är skapad!</h2>
                    <p className="text-gray-600">Detta är din **permanenta** återställningskod. Spara den på ett säkert ställe. Du behöver den för att logga in i framtiden.</p>
                    <div className="p-4 my-4 font-mono text-3xl text-blue-700 bg-blue-50 rounded-md">
                        {recoveryCode}
                    </div>
                    <button onClick={() => window.location.reload()} className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700">
                        Jag har sparat koden, fortsätt
                    </button>
                </div>
            </div>
        );
    }


    return (
        <>
            {isProcessing && <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex justify-center items-center"><div className="text-xl font-semibold animate-pulse">Skapar din garderob...</div></div>}
            <div className="flex items-center justify-center h-screen">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                    <h1 className="text-3xl font-bold mb-2">Välkommen!</h1>
                    <p className="text-gray-600 mb-6">Börja med att skapa din profil.</p>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ange ditt namn" className="w-full p-3 border rounded-lg mb-4 text-center" />
                     <div className="flex justify-center gap-4 my-4">
                        <button onClick={() => setMode('personal')} className={`px-4 py-2 rounded-lg ${mode === 'personal' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Bara för mig</button>
                        <button onClick={() => setMode('family')} className={`px-4 py-2 rounded-lg ${mode === 'family' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Skapa en familj</button>
                    </div>
                    <button onClick={handleSubmit} disabled={!name || isProcessing} className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400">
                        Skapa garderob
                    </button>
                </div>
            </div>
        </>
    );
}

// ... Resten av koden (WardrobeManager, ChatView, SettingsView, etc.) är nästan identisk men anpassad för den nya inloggningslogiken.

