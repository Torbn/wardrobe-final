import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, 
    collection, onSnapshot, query, serverTimestamp, where, writeBatch
} from 'firebase/firestore';

// --- Helper-ikoner (SVG) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const OutfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ChevronDownIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;


// --- Firebase Konfiguration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

let app;
let auth;
let db;

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
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg hidden sm:block"></div>
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg hidden md:block"></div>
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg hidden lg:block"></div>
                </div>
                 <div className="h-8 bg-gray-300 rounded w-1/4 mt-8"></div>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg"></div>
                    <div className="aspect-[3/4] bg-gray-300 rounded-lg"></div>
                </div>
            </main>
            <nav className="fixed bottom-0 left-0 right-0 bg-gray-200 h-16 border-t"></nav>
        </div>
    );
}

// --- Komponent för anslutningsskärm ---
function ConnectionGate({ onConnect }) {
    const [configJson, setConfigJson] = useState('');
    const [error, setError] = useState('');

    const handleConnect = () => {
        if (!configJson) {
            setError("Fältet kan inte vara tomt.");
            return;
        }
        onConnect(configJson, setError);
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
                <h1 className="text-2xl font-bold mb-4">Anslut till databasen</h1>
                <p className="text-gray-600 mb-6">
                    Klistra in din Firebase-konfiguration (hela JSON-objektet) nedan för att starta appen.
                </p>
                <textarea
                    className="w-full h-48 p-3 border rounded mb-4 font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    placeholder='{ "apiKey": "...", "authDomain": "...", ... }'
                    value={configJson}
                    onChange={(e) => setConfigJson(e.target.value)}
                />
                <button
                    onClick={handleConnect}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Anslut
                </button>
                {(error) && <p className="text-red-500 text-sm mt-4">{error}</p>}
                 <p className="text-xs text-gray-400 mt-4">
                    Denna information sparas inte, du kan behöva klistra in den igen om du laddar om sidan.
                </p>
            </div>
        </div>
    );
}


// --- Huvudkomponent: App ---
export default function App() {
    const [user, setUser] = useState(null);
    const [appData, setAppData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [joinFamilyIdFromUrl, setJoinFamilyIdFromUrl] = useState(null);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const familyId = params.get('joinFamily');
        if (familyId) {
            setJoinFamilyIdFromUrl(familyId);
        }

        if (typeof __firebase_config !== 'undefined' && __firebase_config) {
            try {
                const firebaseConfig = JSON.parse(__firebase_config);
                if (firebaseConfig && firebaseConfig.apiKey) {
                    if (!app) {
                        app = initializeApp(firebaseConfig);
                        auth = getAuth(app);
                        db = getFirestore(app);
                    }
                    setFirebaseReady(true);
                }
            } catch (e) {
                console.warn("Automatisk konfiguration misslyckades. Faller tillbaka till manuell inmatning.");
            }
        }
    }, []);

    const handleManualConnect = (configJson, setConnectionError) => {
        try {
            const firebaseConfig = JSON.parse(configJson);
            if (!firebaseConfig.apiKey) throw new Error("Konfigurationen är ogiltig, 'apiKey' saknas.");
            if (!app) {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);
            }
            setFirebaseReady(true);
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setConnectionError(`Anslutning misslyckades: ${e.message}`);
        }
    };

    useEffect(() => {
        if (!firebaseReady) return;

        setLoading(true);
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, `/artifacts/${appId}/users/${currentUser.uid}/profile/main`);
                const unsubscribeSnapshot = onSnapshot(userDocRef, (userDocSnap) => {
                    setAppData(userDocSnap.exists() ? userDocSnap.data() : null);
                    setLoading(false);
                }, (err) => {
                    console.error("Snapshot error:", err);
                    setError("Kunde inte hämta profildata.");
                    setLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                 try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (err) { setError("Autentisering misslyckades."); setLoading(false); }
            }
        });
        return () => unsubscribe();
    }, [firebaseReady]);

    const handleProfileSetup = async (name, mode) => {
        if (!user) throw new Error("Användare inte inloggad.");
        const userProfile = { name, mode, familyId: null };
        await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), userProfile);
    };

    const handleJoinRequest = async (name, familyId) => {
        if (!user) throw new Error("Användare inte inloggad.");
        if (!db) throw new Error("Databasen är inte ansluten.");
        
        const familyDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}`);
        const familyDoc = await getDoc(familyDocRef);
        
        if (!familyDoc.exists()) {
             throw new Error("Familjekoden är ogiltig.");
        }
        
        const joinRequestRef = doc(collection(db, `/artifacts/${appId}/public/data/joinRequests`));
        await setDoc(joinRequestRef, { familyId, requesterId: user.uid, requesterName: name, status: 'pending' });
        await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), { name, mode: 'family', status: 'pending', requestedFamilyId: familyId });
    }
    
    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl text-red-700 p-8">{error}</div></div>;
    if (!firebaseReady) return <ConnectionGate onConnect={handleManualConnect} />;
    if (loading) return <SkeletonLoader />;
    
    if (user && appData) {
        if (appData.mode === 'family' && !appData.familyId) {
             if (appData.status === 'pending') return <PendingApprovalScreen />;
             return <FamilySetup user={user} appData={appData} />;
        }
        if (appData.status === 'pending') return <PendingApprovalScreen />;
        return <WardrobeManager user={user} appData={appData} />;
    }
    
    if (user && !appData) return <ProfileSetup onSetup={handleProfileSetup} onJoinRequest={handleJoinRequest} joinFamilyIdFromUrl={joinFamilyIdFromUrl} />;

    return <SkeletonLoader />;
}

// --- Komponent: Slutför skapande av familj ---
function FamilySetup({ user, appData }) {
    const [error, setError] = useState('');

    useEffect(() => {
        const createFamilyWithBatch = async () => {
            if (!user || !appData.name) return;

            const batch = writeBatch(db);
            const familyId = doc(collection(db, '_')).id;
            
            const familyDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}`);
            const membershipDocRef = doc(collection(db, `/artifacts/${appId}/public/data/memberships`));
            const userProfileRef = doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`);

            batch.set(familyDocRef, { owner: user.uid, name: `${appData.name}s familj`, createdAt: serverTimestamp() });
            batch.set(membershipDocRef, { userId: user.uid, familyId, name: appData.name, role: 'admin', isPrivate: false });
            batch.update(userProfileRef, { familyId: familyId });

            await batch.commit();
        };

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 20000)
        );

        Promise.race([createFamilyWithBatch(), timeoutPromise])
            .catch(e => {
                console.error("Family creation failed:", e);
                if (e.message === "Timeout") {
                    setError("Konfigureringen tog för lång tid. Ladda om sidan och försök igen.");
                } else {
                    setError("Kunde inte skapa familjen. Prova att ladda om sidan.");
                }
            });
    }, [user, appData]);

    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl text-red-700 p-8">{error}</div></div>;

    return (
        <div className="fixed inset-0 bg-white z-50 flex justify-center items-center">
            <div className="text-xl font-semibold animate-pulse">Slutför konfiguration av familj...</div>
        </div>
    );
}

// --- Komponent: Profil-setup ---
function ProfileSetup({ onSetup, onJoinRequest, joinFamilyIdFromUrl }) {
    const [name, setName] = useState('');
    const [joinFamilyId, setJoinFamilyId] = useState('');
    const [view, setView] = useState('main');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [processingMessage, setProcessingMessage] = useState('');

    useEffect(() => {
        if (joinFamilyIdFromUrl) {
            setJoinFamilyId(joinFamilyIdFromUrl);
            setView('join');
        }
    }, [joinFamilyIdFromUrl]);

    const handleAction = async (actionPromise, message) => {
        setIsProcessing(true);
        setError('');
        setProcessingMessage(message);
        try {
            await actionPromise;
        } catch (e) {
            setError(e.message || 'Något gick fel. Försök igen.');
            setIsProcessing(false);
        }
    };

    if (view === 'join') {
        return (
            <>
                {isProcessing && <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex justify-center items-center"><div className="text-xl font-semibold animate-pulse">{processingMessage}</div></div>}
                <div className="flex items-center justify-center h-screen">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h2 className="text-2xl font-bold mb-4">Gå med i familj</h2>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ditt namn" className="w-full p-2 border rounded mb-4" />
                        <input type="text" value={joinFamilyId} onChange={e => setJoinFamilyId(e.target.value)} placeholder="Familjekod" className="w-full p-2 border rounded mb-4" />
                        <button onClick={() => handleAction(onJoinRequest(name, joinFamilyId), 'Skickar förfrågan...')} disabled={!name || !joinFamilyId || isProcessing} className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400">
                            Skicka förfrågan
                        </button>
                        <button onClick={() => setView('main')} className="mt-4 text-sm text-gray-600">Tillbaka</button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {isProcessing && <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex justify-center items-center"><div className="text-xl font-semibold animate-pulse">{processingMessage}</div></div>}
            <div className="flex items-center justify-center h-screen">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                    <h1 className="text-3xl font-bold mb-2">Välkommen!</h1>
                    <p className="text-gray-600 mb-6">Hur vill du använda appen?</p>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ange ditt namn" className="w-full p-3 border rounded-lg mb-4 text-center" />
                    <div className="space-y-3">
                        <button onClick={() => handleAction(onSetup(name, 'personal'), 'Konfigurerar din garderob...')} disabled={!name || isProcessing} className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400">
                            Bara för mig
                        </button>
                        <button onClick={() => handleAction(onSetup(name, 'family'), 'Konfigurerar din garderob...')} disabled={!name || isProcessing} className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400">
                            Skapa en familj
                        </button>
                        <button onClick={() => setView('join')} disabled={isProcessing} className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-300">Gå med i familj</button>
                    </div>
                </div>
            </div>
        </>
    );
}

// --- Komponent: Väntar på godkännande ---
function PendingApprovalScreen() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Förfrågan skickad</h2>
            <p className="text-gray-600">Väntar på att en administratör för familjen ska godkänna din förfrågan.</p>
        </div>
    );
}


// --- Komponent: Huvudvy för Garderoben ---
function WardrobeManager({ user, appData }) {
    const [currentView, setCurrentView] = useState('wardrobe');
    const [familyMembers, setFamilyMembers] = useState([]);
    const [currentWardrobeOwner, setCurrentWardrobeOwner] = useState({ id: user.uid, name: appData.name });

    useEffect(() => {
        if (appData.mode === 'family' && appData.familyId) {
            const membershipsQuery = query(collection(db, `/artifacts/${appId}/public/data/memberships`), where("familyId", "==", appData.familyId));
            const unsubscribe = onSnapshot(membershipsQuery, (snapshot) => {
                const membersList = snapshot.docs.map(doc => ({
                    id: doc.data().userId, docId: doc.id, ...doc.data(), type: 'full'
                }));
                setFamilyMembers(membersList);
            });
            return unsubscribe;
        } else {
             setFamilyMembers([{ id: user.uid, name: appData.name, type: 'full' }]);
        }
    }, [appData.familyId, appData.mode, user.uid, appData.name]);
     
    const visibleMembers = useMemo(() => {
        if (appData.mode !== 'family') return [{ id: user.uid, name: appData.name, type: 'full' }];
        return familyMembers.filter(m => m.id === user.uid || !m.isPrivate);
    }, [familyMembers, user.uid, appData]);
     
    useEffect(() => {
        const self = familyMembers.find(m => m.id === user.uid) || { id: user.uid, name: appData.name };
        setCurrentWardrobeOwner(self);
    }, [familyMembers, user.uid, appData.name]);

    const renderContent = () => {
        switch (currentView) {
            case 'wardrobe': return <WardrobeView owner={currentWardrobeOwner} />;
            case 'outfits': return <OutfitsView owner={currentWardrobeOwner} />;
            case 'chat': return <p>Chatt är under utveckling.</p>;
            case 'settings': return <SettingsView user={user} appData={appData} members={familyMembers} />;
            default: return null;
        }
    };
     
    return (
        <div className="flex flex-col h-full">
            <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-xl font-bold text-center sm:text-left">{currentWardrobeOwner.name}'s Garderob</h1>
                {appData.mode === 'family' && (
                    <div className="flex items-center gap-4">
                        <select value={currentWardrobeOwner.id} onChange={e => { const selected = visibleMembers.find(m => m.id === e.target.value); if(selected) setCurrentWardrobeOwner(selected); }} className="p-2 border rounded-md">
                           {visibleMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                        </select>
                    </div>
                )}
            </header>
            <main className="flex-grow p-4 overflow-y-auto pb-24">{renderContent()}</main>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2">
                <button onClick={() => setCurrentView('wardrobe')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'wardrobe' ? 'text-blue-600' : 'text-gray-500'}`}><HomeIcon /> Plagg</button>
                <button onClick={() => setCurrentView('outfits')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'outfits' ? 'text-blue-600' : 'text-gray-500'}`}><OutfitIcon /> Outfits</button>
                <button onClick={() => setCurrentView('chat')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'chat' ? 'text-blue-600' : 'text-gray-500'}`}><ChatIcon /> Chatt</button>
                <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}><SettingsIcon /> Inställningar</button>
            </nav>
        </div>
    );
}

// --- Komponent: Inställningar ---
function SettingsView({ user, appData, members = [] }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const currentUserData = members.find(m => m.id === user.uid);
    const role = currentUserData?.role;

    useEffect(() => {
        if (role === 'admin' && appData.familyId) {
            const requestsQuery = query(collection(db, `/artifacts/${appId}/public/data/joinRequests`), where("familyId", "==", appData.familyId), where("status", "==", "pending"));
            const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
                setJoinRequests(snapshot.docs.map(d => ({ docId: d.id, ...d.data() })));
            });
            return unsubscribe;
        }
    }, [role, appData.familyId]);
    
    const handleShareInvite = async () => {
        const inviteLink = `${window.location.origin}${window.location.pathname}?joinFamily=${appData.familyId}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Inbjudan till familjegarderob',
                    text: `Gå med i ${appData.name}s familjegarderob!`,
                    url: inviteLink,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            navigator.clipboard.writeText(inviteLink);
            alert("Inbjudningslänk kopierad till urklipp!");
        }
    };


    const handlePrivacyToggle = async (e) => {
        if (!currentUserData?.docId) return;
        const memberDocRef = doc(db, `/artifacts/${appId}/public/data/memberships/${currentUserData.docId}`);
        await updateDoc(memberDocRef, { isPrivate: e.target.checked });
    };

    const handleApproveRequest = async (request) => {
        const membershipRef = doc(collection(db, `/artifacts/${appId}/public/data/memberships`));
        await setDoc(membershipRef, {
            userId: request.requesterId, familyId: request.familyId, name: request.requesterName, role: 'member', isPrivate: false,
        });
        const userProfileRef = doc(db, `/artifacts/${appId}/users/${request.requesterId}/profile/main`);
        await updateDoc(userProfileRef, { status: 'approved', familyId: request.familyId });
        await deleteDoc(doc(db, `/artifacts/${appId}/public/data/joinRequests/${request.docId}`));
    };

    const handleDenyRequest = async (request) => {
        await deleteDoc(doc(db, `/artifacts/${appId}/public/data/joinRequests/${request.docId}`));
        const userProfileRef = doc(db, `/artifacts/${appId}/users/${request.requesterId}/profile/main`);
        await updateDoc(userProfileRef, { status: 'denied', requestedFamilyId: null });
    };

    const handleDeleteProfile = async () => {
        const profileDocRef = doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`);
        await deleteDoc(profileDocRef);
        // Ytterligare logik för att radera medlemskap etc. kan läggas till här
        setShowDeleteModal(false);
    };

    return (
        <>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteProfile} title="Radera profil" confirmText="Ja, radera">
                <p>Är du säker på att du vill radera din profil? All din data kommer att försvinna.</p>
            </Modal>
            <div className="max-w-xl mx-auto space-y-8">
                {appData.mode === 'family' && role === 'admin' && (
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-bold mb-4">Familjeadministration</h2>
                        <div className="mb-6">
                            <h3 className="font-semibold mb-2">Anslutningsförfrågningar</h3>
                            {joinRequests.length > 0 ? (
                                <ul className="space-y-2">{joinRequests.map(req => (
                                    <li key={req.docId} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                        <span>{req.requesterName} vill gå med</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproveRequest(req)} className="bg-green-500 text-white px-3 py-1 text-sm rounded">Godkänn</button>
                                            <button onClick={() => handleDenyRequest(req)} className="bg-red-500 text-white px-3 py-1 text-sm rounded">Neka</button>
                                        </div>
                                    </li>
                                ))}</ul>
                            ) : <p className="text-sm text-gray-500">Inga nya förfrågningar.</p>}
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Bjud in nya medlemmar</h3>
                            <p className="text-sm text-gray-600 mb-2">Dela familjekoden nedan eller skicka en inbjudningslänk.</p>
                            <p className="text-center font-mono text-2xl bg-gray-100 p-3 my-2 rounded-lg">{appData.familyId.substring(0, 6).toUpperCase()}</p>
                            <button onClick={handleShareInvite} className="w-full mt-2 bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600">
                                Bjud in med länk
                            </button>
                        </div>
                    </div>
                )}
                 <div className="bg-white p-6 rounded-lg shadow">
                     <h2 className="text-xl font-bold mb-4">Inställningar</h2>
                      {appData.mode === 'family' && (
                        <div className="flex items-center justify-between mb-4">
                            <label htmlFor="privacy" className="font-semibold">Håll min garderob privat</label>
                            <input type="checkbox" name="privacy" id="privacy" checked={currentUserData?.isPrivate || false} onChange={handlePrivacyToggle} />
                        </div>
                      )}
                     <p className="text-sm text-gray-600 mb-4">Vill du börja om? Radera din profil här.</p>
                     <button onClick={() => setShowDeleteModal(true)} className="w-full bg-red-500 text-white p-3 rounded-lg font-semibold hover:bg-red-600">
                        Radera min profil och börja om
                     </button>
                </div>
            </div>
        </>
    );
}


// --- Komponent: Plagg-vyn ---
function WardrobeView({ owner }) {
    const [garments, setGarments] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [garmentToDelete, setGarmentToDelete] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState({});
    const garmentsPath = `/artifacts/${appId}/users/${owner.id}/garments`;

    useEffect(() => {
        if (!owner || !db) return;
        const q = query(collection(db, garmentsPath));
        const unsubscribe = onSnapshot(q, snapshot => setGarments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsubscribe;
    }, [garmentsPath, owner]);

    const addGarment = async (garmentData) => {
        try {
            await addDoc(collection(db, garmentsPath), { ...garmentData, createdAt: serverTimestamp() });
        } finally {
            setShowAddForm(false);
        }
    };

    const confirmDelete = async () => {
        if (garmentToDelete) {
            await deleteDoc(doc(db, garmentsPath, garmentToDelete.id));
            setGarmentToDelete(null);
        }
    };
    
    const filteredGarments = useMemo(() => {
        if (!searchTerm) {
            return garments;
        }
        return garments.filter(g =>
            g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.notes?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [garments, searchTerm]);
     
    const groupedGarments = filteredGarments.reduce((acc, garment) => {
        const category = garment.category || 'Övrigt';
        if (!acc[category]) acc[category] = [];
        acc[category].push(garment);
        return acc;
    }, {});

    const categories = ['Tröjor', 'Skjortor', 'Byxor', 'Underkläder', 'Skor', 'Idrott', 'Vinter', 'Övrigt'];
    const sortedCategories = categories.filter(cat => groupedGarments[cat]).concat(Object.keys(groupedGarments).filter(cat => !categories.includes(cat)));
    
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const expandAll = () => {
        const allExpanded = sortedCategories.reduce((acc, cat) => ({...acc, [cat]: true}), {});
        setExpandedCategories(allExpanded);
    };
    
    const collapseAll = () => {
        setExpandedCategories({});
    };

    return (
        <div>
            <Modal isOpen={!!garmentToDelete} onClose={() => setGarmentToDelete(null)} onConfirm={confirmDelete} title="Ta bort plagg"><p>Är du säker på att du vill ta bort plagget "{garmentToDelete?.name}"?</p></Modal>
            {showAddForm ? <AddGarmentForm onAdd={addGarment} onCancel={() => setShowAddForm(false)} /> : (
                <>
                    <div className="mb-4">
                        <input
                            type="search"
                            placeholder="Sök i garderoben..."
                            className="w-full p-3 border-gray-300 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 mb-6">
                        <button onClick={expandAll} className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 text-sm rounded font-semibold hover:bg-gray-300">Expandera alla</button>
                        <button onClick={collapseAll} className="flex-1 bg-gray-200 text-gray-800 px-3 py-2 text-sm rounded font-semibold hover:bg-gray-300">Kollapsa alla</button>
                    </div>

                    {garments.length > 0 ? (
                        filteredGarments.length > 0 ? (
                            sortedCategories.map(category => (
                                groupedGarments[category] &&
                                <div key={category} className="mb-2">
                                    <button onClick={() => toggleCategory(category)} className="w-full text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-t-lg border-b">
                                        <h2 className="text-xl font-normal flex justify-between items-center w-full">
                                            <span>{category} ({groupedGarments[category].length})</span>
                                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${expandedCategories[category] ? 'rotate-180' : ''}`} />
                                        </h2>
                                    </button>
                                    {expandedCategories[category] && (
                                        <div className="p-4 bg-white rounded-b-lg shadow-inner">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                {groupedGarments[category].map(g => <GarmentCard key={g.id} garment={g} onDelete={() => setGarmentToDelete(g)} />)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 mt-8">Inga plagg matchade din sökning.</p>
                        )
                    ) : (
                        <p className="text-center text-gray-500 mt-8">Inga plagg än. Klicka på plus-knappen för att lägga till!</p>
                    )}
                    <button onClick={() => setShowAddForm(true)} className="fixed bottom-20 right-5 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"><PlusIcon /></button>
                </>
            )}
        </div>
    );
}

// --- Komponent: Detaljvy för plagg ---
function GarmentDetailView({ garment }) {
    if (!garment) return null;
    return (
        <div className="space-y-3">
            <img src={garment.imageUrl || 'https://placehold.co/300x400/eeeeee/cccccc?text=Inget+foto'} alt={garment.name} className="w-full aspect-[3/4] object-cover rounded-lg shadow-sm" />
            <div>
                <h3 className="text-2xl font-bold">{garment.name}</h3>
                <p className="text-md text-gray-600"><strong>Kategori:</strong> {garment.category}</p>
                <p className="text-md text-gray-600"><strong>Storlek:</strong> {garment.size || 'N/A'}</p>
                <p className="text-md text-gray-600"><strong>Plats:</strong> {garment.location || 'N/A'}</p>
                {garment.notes && <p className="text-md text-gray-600 mt-2 italic">"{garment.notes}"</p>}
            </div>
        </div>
    );
}


// --- Komponent: Outfit-vyn ---
function OutfitsView({ owner }) {
    const [outfits, setOutfits] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [availableGarments, setAvailableGarments] = useState([]);
    const [outfitToDelete, setOutfitToDelete] = useState(null);
    const [viewingGarment, setViewingGarment] = useState(null); // För modalen
    const outfitsPath = `/artifacts/${appId}/users/${owner.id}/outfits`;
    const garmentsPath = `/artifacts/${appId}/users/${owner.id}/garments`;

    useEffect(() => {
        if (!owner || !db) return;
        const unsubGarments = onSnapshot(query(collection(db, garmentsPath)), snapshot => setAvailableGarments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubOutfits = onSnapshot(query(collection(db, outfitsPath)), snapshot => setOutfits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => { unsubGarments(); unsubOutfits(); };
    }, [garmentsPath, outfitsPath, owner]);

    const addOutfit = async (outfitData) => {
        try {
            await addDoc(collection(db, outfitsPath), { ...outfitData, createdAt: serverTimestamp() });
        } finally {
            setShowAddForm(false);
        }
    };

    const confirmDelete = async () => {
        if (outfitToDelete) {
            await deleteDoc(doc(db, outfitsPath, outfitToDelete.id));
            setOutfitToDelete(null);
        }
    };

    const groupedOutfits = outfits.reduce((acc, outfit) => {
        const category = outfit.category || 'Övrigt';
        if (!acc[category]) acc[category] = [];
        acc[category].push(outfit);
        return acc;
    }, {});

    const outfitCategories = ['Sommar', 'Vinter', 'Fest', 'Casual', 'Övrigt'];
    const sortedCategories = outfitCategories.filter(cat => groupedOutfits[cat]).concat(Object.keys(groupedOutfits).filter(cat => !outfitCategories.includes(cat)));


    return (
        <div>
            <Modal isOpen={!!outfitToDelete} onClose={() => setOutfitToDelete(null)} onConfirm={confirmDelete} title="Ta bort Outfit"><p>Är du säker på att du vill ta bort outfiten "{outfitToDelete?.name}"?</p></Modal>
            <Modal isOpen={!!viewingGarment} onClose={() => setViewingGarment(null)} title={viewingGarment?.name || "Plagg"} showConfirm={false}>
                <GarmentDetailView garment={viewingGarment} />
            </Modal>
            
            {showAddForm ? <AddOutfitForm onAdd={addOutfit} onCancel={() => setShowAddForm(false)} availableGarments={availableGarments} /> : (
                <>
                    {outfits.length > 0 ? (
                        sortedCategories.map(category => (
                            <div key={category} className="mb-8">
                                <h2 className="text-2xl font-bold border-b pb-2 mb-4">{category}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                     {groupedOutfits[category].map(o => <OutfitCard key={o.id} outfit={o} onDelete={() => setOutfitToDelete(o)} onGarmentClick={setViewingGarment} />)}
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-center text-gray-500 mt-8">Inga outfits än. Klicka på plus-knappen för att skapa en!</p>
                    )}
                    <button onClick={() => setShowAddForm(true)} className="fixed bottom-20 right-5 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"><PlusIcon /></button>
                </>
            )}
        </div>
    );
}


// --- Komponent: Plagg-kort ---
function GarmentCard({ garment, onDelete }) {
    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white group relative">
            <button onClick={onDelete} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"><TrashIcon /></button>
            <img src={garment.imageUrl || 'https://placehold.co/300x400/eeeeee/cccccc?text=Inget+foto'} alt={garment.name} className="w-full aspect-[3/4] object-cover" />
            <div className="p-3">
                <h3 className="font-bold truncate">{garment.name}</h3>
                <p className="text-sm text-gray-500">{garment.category}</p>
                <p className="text-sm text-gray-500">Strl: {garment.size}</p>
                <p className="text-sm text-gray-500">Plats: {garment.location}</p>
            </div>
        </div>
    );
}

// --- Komponent: Outfit-kort ---
function OutfitCard({ outfit, onDelete, onGarmentClick }) {
    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white group relative">
            <button onClick={onDelete} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"><TrashIcon /></button>
            <img src={outfit.imageUrl || 'https://placehold.co/300x400/eeeeee/cccccc?text=Outfit'} alt={outfit.name} className="w-full aspect-[3/4] object-cover" />
            <div className="p-3">
                <h3 className="font-bold truncate">{outfit.name}</h3>
                 <p className="text-sm text-gray-500">{outfit.category}</p>
                {outfit.notes && <p className="text-xs text-gray-500 italic mt-1">"{outfit.notes}"</p>}
                <div className="mt-2">
                    <h4 className="font-semibold text-xs mb-1">Ingår:</h4>
                    {outfit.linkedGarments?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                            {outfit.linkedGarments.map(g => (
                                <div key={g.id} onClick={() => onGarmentClick(g)} className="cursor-pointer" title={g.name}>
                                    <img src={g.imageUrl || 'https://placehold.co/40x40/eeeeee/cccccc?text=?'} alt={g.name} className="w-8 h-8 rounded-full object-cover border-2 border-white hover:border-blue-500 transition" />
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-xs text-gray-400 mt-1">Inga plagg länkade.</p>}
                </div>
            </div>
        </div>
    );
}

// --- Komponent: Lägg till plagg-formulär ---
function AddGarmentForm({ onAdd, onCancel }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Tröjor');
    const [size, setSize] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const categories = ['Tröjor', 'Skjortor', 'Byxor', 'Underkläder', 'Skor', 'Idrott', 'Vinter', 'Övrigt'];

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };
     
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            setError("Plaggets namn måste fyllas i.");
            return;
        }
        setIsUploading(true);
        setError('');
        
        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await resizeImage(imageFile);
            }
            await onAdd({ name, category, size, location, notes, imageUrl });
        } catch (err) {
             if (err.message.includes('longer than 1048487 bytes')) {
                setError('Bilden är för stor även efter komprimering. Välj en mindre bild.');
             } else {
                setError('Ett fel uppstod vid uppladdning.');
             }
             setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Lägg till nytt plagg</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="garment-image-upload" className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">{imagePreview ? <img src={imagePreview} alt="Förhandsgranskning" className="h-full w-full object-contain rounded-lg" /> : <div className="flex flex-col items-center justify-center pt-5 pb-6"><CameraIcon /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klicka eller ta en bild</span></p><p className="text-xs text-gray-500">PNG, JPG</p></div>}<input id="garment-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange}/></label>
                <input type="text" placeholder="Plaggets namn (ex. Blå T-shirt)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded"/>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input type="text" placeholder="Storlek" value={size} onChange={e => setSize(e.target.value)} className="w-full p-2 border rounded"/>
                <input type="text" placeholder="Plats (ex. I byrålådan)" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded"/>
                <textarea placeholder="Anteckningar" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded"></textarea>
                <div className="flex justify-end gap-4"><button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold">Avbryt</button><button type="submit" disabled={isUploading || !name} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:bg-gray-400">{isUploading ? 'Sparar...' : 'Spara plagget'}</button></div>
            </form>
        </div>
    );
}

// --- Komponent: Lägg till Outfit-formulär ---
function AddOutfitForm({ onAdd, onCancel, availableGarments }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Casual');
    const [notes, setNotes] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [selectedGarmentIds, setSelectedGarmentIds] = useState(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    
    const outfitCategories = ['Sommar', 'Vinter', 'Fest', 'Casual', 'Övrigt'];

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleGarmentSelect = (garmentId) => {
        const newSelection = new Set(selectedGarmentIds);
        if (newSelection.has(garmentId)) newSelection.delete(garmentId);
        else newSelection.add(garmentId);
        setSelectedGarmentIds(newSelection);
    };
     
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) {
            setError("Outfitens namn måste fyllas i.");
            return;
        }
        setIsUploading(true);
        setError('');
        
        try {
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await resizeImage(imageFile);
            }
            const linkedGarments = availableGarments
                .filter(g => selectedGarmentIds.has(g.id))
                .map(g => ({ id: g.id, name: g.name, imageUrl: g.imageUrl || '', category: g.category, location: g.location, size: g.size, notes: g.notes }));

            await onAdd({ name, notes, category, imageUrl, linkedGarments });
        } catch(err) {
            if (err.message.includes('longer than 1048487 bytes')) {
                setError('Bilden är för stor. Välj en mindre bild eller en med lägre kvalitet.');
             } else {
                setError('Ett fel uppstod vid uppladdning.');
             }
             setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Skapa ny Outfit</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="outfit-image-upload" className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">{imagePreview ? <img src={imagePreview} alt="Förhandsgranskning" className="h-full w-full object-contain rounded-lg" /> : <div className="flex flex-col items-center justify-center pt-5 pb-6"><CameraIcon /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klicka eller ta en bild</span></p><p className="text-xs text-gray-500">PNG, JPG</p></div>}<input id="outfit-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange}/></label>
                <input type="text" placeholder="Outfitens namn" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded"/>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded">{outfitCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <textarea placeholder="Anteckningar" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded"></textarea>
                <div>
                    <h3 className="font-semibold mb-2">Välj plagg som ingår:</h3>
                    {availableGarments.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                            {availableGarments.map(g => (
                                <div key={g.id} onClick={() => handleGarmentSelect(g.id)} className={`cursor-pointer border-2 rounded-lg p-1 transition-all ${selectedGarmentIds.has(g.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent'}`}>
                                    <img src={g.imageUrl || 'https://placehold.co/100x100/eeeeee/cccccc?text=?'} alt={g.name} className="w-full h-20 object-cover rounded"/>
                                    <p className="text-xs text-center truncate mt-1">{g.name}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-400">Du måste lägga till plagg i garderoben först.</p>}
                </div>
                <div className="flex justify-end gap-4"><button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold">Avbryt</button><button type="submit" disabled={isUploading || !name} className="bg-blue-600 text-white px-4 py-2 rounded font-semibold disabled:bg-gray-400">{isUploading ? 'Sparar...' : 'Spara Outfit'}</button></div>
            </form>
        </div>
    );
}

