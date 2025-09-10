import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, 
    collection, onSnapshot, query, serverTimestamp, where, writeBatch
} from 'firebase/firestore';

// ====================================================================================
//  VIKTIGT STEG: KLISTRA IN DIN FIREBASE-KONFIGURATION HÄR
// ====================================================================================
// Du hittar den i ditt Firebase-projekt:
// Project Settings (kugghjulet) > General > Your apps > Web app > SDK setup and configuration > Config
const firebaseConfig = {
  apiKey: "AIzaSyAb1AEgLR0XODwlxJu2zt54ZCfVAHg0f20",
  authDomain: "wardrobe-1df3d.firebaseapp.com",
  projectId: "wardrobe-1df3d",
  storageBucket: "wardrobe-1df3d.firebasestorage.app",
  messagingSenderId: "101765206611",
  appId: "1:101765206611:web:ea0da04b1828e20980aca6",
  measurementId: "G-R9S8L2QKRG"
};
// ====================================================================================


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
    const [user, setUser] = useState(null);
    const [appData, setAppData] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState('');
    const [firebaseReady, setFirebaseReady] = useState(false);
    const [joinFamilyIdFromUrl, setJoinFamilyIdFromUrl] = useState(null);
    
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const familyId = params.get('joinFamily');
        if (familyId) setJoinFamilyIdFromUrl(familyId);

        try {
            if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSy...") {
                if (!app) {
                    app = initializeApp(firebaseConfig);
                    auth = getAuth(app);
                    db = getFirestore(app);
                }
                setFirebaseReady(true);
            } else {
                 setError("Firebase-konfigurationen saknas. Vänligen klistra in den i App.jsx.");
                 setAuthLoading(false);
            }
        } catch (e) {
            setError(`Kunde inte initiera databasen: ${e.message}`);
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!firebaseReady) return;
        
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, `/artifacts/${appId}/users/${currentUser.uid}/profile/main`);
                onSnapshot(userDocRef, (userDocSnap) => {
                    setAppData(userDocSnap.exists() ? userDocSnap.data() : null);
                    setDataLoading(false);
                }, () => { setError("Kunde inte hämta profildata."); setDataLoading(false); });
                setAuthLoading(false);
            } else {
                 try {
                    await signInAnonymously(auth);
                 } catch (err) { setError("Autentisering misslyckades."); setAuthLoading(false); }
            }
        });
        return () => unsubscribe();
    }, [firebaseReady]);

    const handleProfileSetup = async (name, mode) => {
        if (!user) throw new Error("Användare inte inloggad.");
        const userProfile = { name, mode, groups: [] };
        await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), userProfile);
    };

    const handleJoinRequest = async (name, familyId) => {
        if (!user || !db) throw new Error("Användare eller databas är inte redo.");
        try {
            const familyDocRef = doc(db, `/artifacts/${appId}/public/data/groups/${familyId}`);
            const familyDoc = await getDoc(familyDocRef);
            if (!familyDoc.exists()) throw new Error("Gruppkoden är ogiltig.");
            
            const joinRequestRef = doc(collection(db, `/artifacts/${appId}/public/data/joinRequests`));
            await setDoc(joinRequestRef, { groupId: familyId, requesterId: user.uid, requesterName: name, status: 'pending' });
            await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), { name, mode: 'group', status: 'pending', requestedGroupId: familyId });
        } catch (e) {
            if (e.code === 'unavailable' || e.message.includes('offline')) {
                throw new Error("Kunde inte ansluta. Kontrollera din internetanslutning.");
            }
            throw e;
        }
    }
    
    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl text-red-700 p-8">{error}</div></div>;
    
    if (authLoading) return <SkeletonLoader />;

    const renderContent = () => {
        if (dataLoading && user) return <SkeletonLoader />; // Visa loader om användaren är inloggad men data saknas
        if (user && appData) {
            if (appData.mode === 'group' && (!appData.groups || appData.groups.length === 0)) {
                 if (appData.status === 'pending') return <PendingApprovalScreen />;
                 return <GroupSetup user={user} appData={appData} />;
            }
            if (appData.status === 'pending') return <PendingApprovalScreen />;
            return <WardrobeManager user={user} appData={appData} />;
        }
        if (user && !appData) {
            return <ProfileSetup onSetup={handleProfileSetup} onJoinRequest={handleJoinRequest} joinFamilyIdFromUrl={joinFamilyIdFromUrl} />;
        }
        return <SkeletonLoader />;
    };

    return <div className="h-screen w-screen bg-gray-100 antialiased">{renderContent()}</div>
}

// --- Komponent: Slutför skapande av grupp ---
function GroupSetup({ user, appData }) {
    const [error, setError] = useState('');
    useEffect(() => {
        const createGroup = async () => {
            if (!user || !appData.name) return;
            const batch = writeBatch(db);
            const groupId = doc(collection(db, '_')).id;
            const groupDocRef = doc(db, `/artifacts/${appId}/public/data/groups/${groupId}`);
            const membershipDocRef = doc(collection(db, `/artifacts/${appId}/public/data/memberships`));
            const userProfileRef = doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`);
            batch.set(groupDocRef, { owner: user.uid, name: `${appData.name}s grupp`, createdAt: serverTimestamp() });
            batch.set(membershipDocRef, { userId: user.uid, groupId: groupId, name: appData.name, role: 'admin', isPrivate: false });
            batch.update(userProfileRef, { groups: [groupId] }); // Använder nu en array
            await batch.commit();
        };
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 20000));
        Promise.race([createGroup(), timeoutPromise]).catch(e => {
            if (e.message === "Timeout") setError("Konfigureringen tog för lång tid.");
            else setError("Kunde inte skapa gruppen.");
        });
    }, [user, appData]);
    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><p>{error}</p></div>;
    return <div className="fixed inset-0 bg-white z-50 flex justify-center items-center"><p>Slutför konfiguration av grupp...</p></div>;
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
                        <h2 className="text-2xl font-bold mb-4">Gå med i grupp</h2>
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ditt namn" className="w-full p-2 border rounded mb-4" />
                        <input type="text" value={joinFamilyId} onChange={e => setJoinFamilyId(e.target.value)} placeholder="Gruppkod" className="w-full p-2 border rounded mb-4" />
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
                        <button onClick={() => handleAction(onSetup(name, 'group'), 'Konfigurerar din garderob...')} disabled={!name || isProcessing} className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400">
                            Skapa en grupp
                        </button>
                        <button onClick={() => setView('join')} disabled={isProcessing} className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-300">Gå med i grupp</button>
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
            <p className="text-gray-600">Väntar på att en administratör för gruppen ska godkänna din förfrågan.</p>
        </div>
    );
}

// --- Komponent: Chatt-vy ---
function ChatView({ user, appData, currentGroup }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const messagesPath = `/artifacts/${appId}/public/data/groups/${currentGroup.groupId}/messages`;

    useEffect(() => {
        if (!currentGroup.groupId) return;
        const q = query(collection(db, messagesPath));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedMessages.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
            setMessages(fetchedMessages);
        });
        return unsubscribe;
    }, [currentGroup.groupId, messagesPath]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        await addDoc(collection(db, messagesPath), {
            text: newMessage,
            senderId: user.uid,
            senderName: appData.name,
            createdAt: serverTimestamp(),
        });

        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-xs ${msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Skriv ett meddelande..."
                    className="flex-grow p-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 disabled:bg-gray-400" disabled={!newMessage.trim()}>
                    <SendIcon />
                </button>
            </form>
        </div>
    );
}


// --- Komponent: Huvudvy för Garderoben ---
function WardrobeManager({ user, appData }) {
    const [currentView, setCurrentView] = useState('wardrobe');
    const [groups, setGroups] = useState([]);
    const [currentGroup, setCurrentGroup] = useState(null);

    useEffect(() => {
        if (appData.mode === 'group' && user.uid) {
            const membershipsQuery = query(collection(db, `/artifacts/${appId}/public/data/memberships`), where("userId", "==", user.uid));
            const unsubscribe = onSnapshot(membershipsQuery, async (snapshot) => {
                const groupPromises = snapshot.docs.map(async (memberDoc) => {
                    const groupData = memberDoc.data();
                    const groupDocRef = doc(db, `/artifacts/${appId}/public/data/groups/${groupData.groupId}`);
                    const groupDoc = await getDoc(groupDocRef);
                    return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } : null;
                });
                const resolvedGroups = (await Promise.all(groupPromises)).filter(Boolean);
                setGroups(resolvedGroups);
                if (resolvedGroups.length > 0 && !currentGroup) {
                    setCurrentGroup(resolvedGroups[0]);
                }
            });
            return unsubscribe;
        }
    }, [appData.mode, user.uid, currentGroup]);
     
    const renderContent = () => {
        switch (currentView) {
            case 'wardrobe': return <p>Garderobsvy under uppbyggnad för grupper.</p> // Placeholder
            case 'outfits': return <p>Outfitvy under uppbyggnad för grupper.</p> // Placeholder
            case 'chat': return currentGroup ? <ChatView user={user} appData={appData} currentGroup={currentGroup} /> : <p>Välj en grupp för att chatta.</p>;
            case 'settings': return <SettingsView user={user} appData={appData} />;
            default: return null;
        }
    };
     
    return (
        <div className="flex flex-col h-full">
            <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-xl font-bold text-center sm:text-left">{appData.name}'s Garderob</h1>
                {appData.mode === 'group' && (
                    <select onChange={e => { const selected = groups.find(g => g.id === e.target.value); if(selected) setCurrentGroup(selected); }} className="p-2 border rounded-md">
                       {groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                )}
            </header>
            <div className="flex-grow overflow-y-auto">
                 <main className="p-4 pb-24">{renderContent()}</main>
            </div>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2">
                <button onClick={() => setCurrentView('wardrobe')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'wardrobe' ? 'text-blue-600' : 'text-gray-500'}`}><HomeIcon /> Plagg</button>
                <button onClick={() => setCurrentView('outfits')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'outfits' ? 'text-blue-600' : 'text-gray-500'}`}><OutfitIcon /> Outfits</button>
                {appData.mode !== 'personal' && <button onClick={() => setCurrentView('chat')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'chat' ? 'text-blue-600' : 'text-gray-500'}`}><ChatIcon /> Chatt</button>}
                <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}><SettingsIcon /> Inställningar</button>
            </nav>
        </div>
    );
}

// --- Komponent: Inställningar ---
function SettingsView({ user, appData }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const handleDeleteProfile = async () => {
        // Logik för att ta bort profil och all relaterad data
        setShowDeleteModal(false);
    };

    return (
        <>
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteProfile} title="Radera profil" confirmText="Ja, radera">
                <p>Är du säker på att du vill radera din profil? All din data kommer att försvinna.</p>
            </Modal>
            <div className="max-w-xl mx-auto space-y-8">
                 <div className="bg-white p-6 rounded-lg shadow">
                     <h2 className="text-xl font-bold mb-4">Inställningar</h2>
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
    // ... befintlig kod ...
}

// --- Komponent: Detaljvy för plagg ---
function GarmentDetailView({ garment }) {
    // ... befintlig kod ...
}


// --- Komponent: Outfit-vyn ---
function OutfitsView({ owner }) {
    // ... befintlig kod ...
}


// --- Komponent: Plagg-kort ---
function GarmentCard({ garment, onDelete }) {
    // ... befintlig kod ...
}

// --- Komponent: Outfit-kort ---
function OutfitCard({ outfit, onDelete, onGarmentClick }) {
    // ... befintlig kod ...
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

    const categories = ['Tröjor', 'Skjortor', 'Byxor', 'Kjol/klänning', 'Underkläder', 'Skor', 'Idrott', 'Vinter', 'Övrigt'];

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };
     
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) { setError("Plaggets namn måste fyllas i."); return; }
        setIsUploading(true);
        setError('');
        
        try {
            let imageUrl = '';
            if (imageFile) imageUrl = await resizeImage(imageFile);
            await onAdd({ name, category, size, location, notes, imageUrl });
            // onCancel() anropas inte här, föräldern sköter stängning
        } catch (err) {
             if (err.message.includes('longer than 1048487 bytes')) setError('Bilden är för stor.');
             else setError('Ett fel uppstod vid uppladdning.');
             setIsUploading(false); // Stanna kvar i formuläret vid fel
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Lägg till nytt plagg</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="garment-image-upload" className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-lg cursor-pointer bg-gray-50">{imagePreview ? <img src={imagePreview} alt="Förhandsgranskning" className="h-full w-full object-cover rounded-lg" /> : <span><CameraIcon /> Välj bild</span>}<input id="garment-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange}/></label>
                <input type="text" placeholder="Plaggets namn (ex. Blå T-shirt)" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded"/>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <input type="text" placeholder="Storlek" value={size} onChange={e => setSize(e.target.value)} className="w-full p-2 border rounded"/>
                <input type="text" placeholder="Plats (ex. I byrålådan)" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded"/>
                <textarea placeholder="Anteckningar" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded"></textarea>
                <div className="flex justify-end gap-4"><button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Avbryt</button><button type="submit" disabled={isUploading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400">{isUploading ? 'Sparar...' : 'Spara'}</button></div>
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
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const toggleGarment = (id) => {
        const newSelection = new Set(selectedGarmentIds);
        if (newSelection.has(id)) newSelection.delete(id);
        else newSelection.add(id);
        setSelectedGarmentIds(newSelection);
    };
     
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) { setError("Outfitens namn måste fyllas i."); return; }
        setIsUploading(true);
        setError('');
        
        try {
            let imageUrl = '';
            if (imageFile) imageUrl = await resizeImage(imageFile);
            const linkedGarments = availableGarments.filter(g => selectedGarmentIds.has(g.id)).map(g => ({ id: g.id, name: g.name, imageUrl: g.imageUrl || '', category: g.category, location: g.location, size: g.size, notes: g.notes }));
            await onAdd({ name, notes, category, imageUrl, linkedGarments });
        } catch(err) {
            if (err.message.includes('longer than 1048487 bytes')) setError('Bilden är för stor.');
            else setError('Ett fel uppstod.');
            setIsUploading(false); // Stanna kvar i formuläret vid fel
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Skapa ny Outfit</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="outfit-image-upload" className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-lg cursor-pointer bg-gray-50">{imagePreview ? <img src={imagePreview} alt="Förhandsgranskning" className="h-full w-full object-cover rounded-lg" /> : <span><CameraIcon /> Välj bild</span>}<input id="outfit-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange}/></label>
                <input type="text" placeholder="Outfitens namn" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded"/>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2 border rounded">{outfitCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                <textarea placeholder="Anteckningar" value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 border rounded"></textarea>
                <div>
                    <h3 className="font-semibold mb-2">Välj plagg:</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto border p-2 rounded-lg">
                        {availableGarments.map(g => (
                            <div key={g.id} onClick={() => toggleGarment(g.id)} className={`cursor-pointer border-2 rounded-lg p-1 ${selectedGarmentIds.has(g.id) ? 'border-blue-500' : 'border-transparent'}`}>
                                <img src={g.imageUrl || 'https://placehold.co/100x100/eeeeee/cccccc?text=?'} alt={g.name} className="w-full h-20 object-cover rounded"/>
                                <p className="text-xs text-center truncate mt-1">{g.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-4"><button type="button" onClick={onCancel} className="bg-gray-200 px-4 py-2 rounded">Avbryt</button><button type="submit" disabled={isUploading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400">{isUploading ? 'Sparar...' : 'Spara'}</button></div>
            </form>
        </div>
    );
}

