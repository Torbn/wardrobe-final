import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Helper-ikoner (SVG) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const OutfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

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
function Modal({ isOpen, onClose, onConfirm, title, children, confirmText = "Bekräfta" }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <div className="mb-6">{children}</div>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-semibold">Avbryt</button>
                    <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded font-semibold">{confirmText}</button>
                </div>
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
    const [firebaseServices, setFirebaseServices] = useState(null);

    useEffect(() => {
        const initFirebase = async () => {
            try {
                const { initializeApp } = await import('firebase/app');
                const { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } = await import('firebase/auth');
                const { getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, collection, onSnapshot, query, serverTimestamp, where } = await import('firebase/firestore');

                let firebaseConfig = null;
                if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_FIREBASE_CONFIG) {
                    const configStr = import.meta.env.VITE_FIREBASE_CONFIG;
                    const cleaned = configStr.startsWith("'") && configStr.endsWith("'") ? configStr.slice(1, -1) : configStr;
                    firebaseConfig = JSON.parse(cleaned);
                } else if (typeof __firebase_config !== 'undefined') {
                    firebaseConfig = JSON.parse(__firebase_config);
                }

                if (firebaseConfig) {
                    const app = initializeApp(firebaseConfig);
                    const auth = getAuth(app);
                    const db = getFirestore(app);
                    setFirebaseServices({ 
                        auth, db, onAuthStateChanged, signInAnonymously, signInWithCustomToken,
                        doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, collection, onSnapshot, query, serverTimestamp, where
                    });
                } else {
                    setError("Firebase är inte konfigurerat.");
                    setLoading(false);
                }
            } catch (e) {
                console.error("Firebase initialization failed:", e);
                setError("Kunde inte ladda Firebase.");
                setLoading(false);
            }
        };
        initFirebase();
    }, []);

    useEffect(() => {
        if (!firebaseServices) return;

        const { auth, db, onAuthStateChanged, signInAnonymously, signInWithCustomToken, doc, onSnapshot } = firebaseServices;

        let unsubProfile = () => {};
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            unsubProfile(); 

            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, `/artifacts/${appId}/users/${currentUser.uid}/profile/main`);
                unsubProfile = onSnapshot(userDocRef, (userDocSnap) => {
                    setAppData(userDocSnap.exists() ? userDocSnap.data() : null);
                    setLoading(false);
                }, () => { setError("Kunde inte hämta profil."); setLoading(false); });
            } else {
                 try {
                    if (typeof __initial_auth_token !== 'undefined') await signInWithCustomToken(auth, __initial_auth_token);
                    else await signInAnonymously(auth);
                } catch (err) { setError("Autentisering misslyckades."); setLoading(false); }
            }
        });

        return () => {
            unsubscribeAuth();
            unsubProfile();
        };
    }, [firebaseServices]);

    const handleProfileSetup = async (name, mode) => {
        if (!user || !firebaseServices) return; setLoading(true); setError('');
        try {
            const { db, doc, collection, setDoc, serverTimestamp } = firebaseServices;
            
            const userProfile = { name, mode, familyId: null };
            if (mode === 'family') {
                const familyId = doc(collection(db, '_')).id;
                userProfile.familyId = familyId;
                const familyDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}`);
                await setDoc(familyDocRef, {
                    owner: user.uid, name: `${name}s familj`, createdAt: serverTimestamp(),
                });
                const membershipDocRef = doc(collection(db, `/artifacts/${appId}/public/data/memberships`));
                await setDoc(membershipDocRef, {
                    userId: user.uid, familyId, name, role: 'admin', isPrivate: false, joinedAt: serverTimestamp()
                });
            }
            await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), userProfile);
        } catch (e) { console.error("Profile setup error: ", e); setError("Kunde inte skapa profilen."); }
        setLoading(false);
    };

    const handleJoinRequest = async (name, familyId) => {
        if (!user || !name || !familyId || !firebaseServices) return; setLoading(true); setError('');
        try {
            const { db, doc, getDoc, collection, setDoc, serverTimestamp } = firebaseServices;

            const familyDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}`);
            if (!(await getDoc(familyDocRef)).exists()) throw new Error("Familjen finns inte.");
            
            const joinRequestRef = doc(collection(db, `/artifacts/${appId}/public/data/joinRequests`));
            await setDoc(joinRequestRef, {
                familyId, requesterId: user.uid, requesterName: name, status: 'pending', requestedAt: serverTimestamp()
            });
            await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), {
                name, mode: 'family', status: 'pending', requestedFamilyId: familyId
            });
        } catch(e) { console.error("Join request error:", e); setError(e.message || "Kunde inte skicka förfrågan."); }
        setLoading(false);
    }

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Laddar garderoben...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl text-red-700 p-8">{error}</div></div>;
    if (!firebaseServices) return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl text-red-700 p-8">Firebase är inte konfigurerat.</div></div>;
    
    if (user && appData?.status === 'pending') return <PendingApprovalScreen />;

    return (
        <div className="h-screen w-screen bg-gray-100 antialiased">
            {user && !appData ? <ProfileSetup onSetup={handleProfileSetup} onJoinRequest={handleJoinRequest} error={error} /> : user && appData ? <WardrobeManager user={user} appData={appData} firebaseServices={firebaseServices} /> : <div className="flex items-center justify-center h-screen">Loggar in...</div>}
        </div>
    );
}

// --- Komponent: Profil-setup ---
function ProfileSetup({ onSetup, onJoinRequest, error }) {
    const [name, setName] = useState('');
    const [joinFamilyId, setJoinFamilyId] = useState('');
    const [view, setView] = useState('main');

    if (view === 'join') {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Gå med i familj</h2>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ditt namn" className="w-full p-2 border rounded mb-4" />
                    <input type="text" value={joinFamilyId} onChange={e => setJoinFamilyId(e.target.value)} placeholder="Familjekod" className="w-full p-2 border rounded mb-4" />
                    <button onClick={() => onJoinRequest(name, joinFamilyId)} disabled={!name || !joinFamilyId} className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300">Skicka förfrågan</button>
                    <button onClick={() => setView('main')} className="mt-4 text-sm text-gray-600">Tillbaka</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                <h1 className="text-3xl font-bold mb-2">Välkommen!</h1>
                <p className="text-gray-600 mb-6">Hur vill du använda appen?</p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ange ditt namn" className="w-full p-3 border rounded-lg mb-4 text-center" />
                <div className="space-y-3">
                    <button onClick={() => onSetup(name, 'personal')} disabled={!name} className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300">Bara för mig</button>
                    <button onClick={() => onSetup(name, 'family')} disabled={!name} className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300">Skapa en familj</button>
                    <button onClick={() => setView('join')} className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg font-semibold hover:bg-gray-300">Gå med i familj</button>
                </div>
            </div>
        </div>
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
function WardrobeManager({ user, appData, firebaseServices }) {
    const [currentView, setCurrentView] = useState('wardrobe');
    const [familyMembers, setFamilyMembers] = useState([]);
    const [currentWardrobeOwner, setCurrentWardrobeOwner] = useState({ id: user.uid, name: appData.name });
    const { db, query, collection, where, onSnapshot } = firebaseServices;

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
    }, [appData.familyId, appData.mode, user.uid, appData.name, db, query, collection, where, onSnapshot]);
    
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
            case 'wardrobe': return <WardrobeView owner={currentWardrobeOwner} firebaseServices={firebaseServices} />;
            case 'outfits': return <OutfitsView owner={currentWardrobeOwner} firebaseServices={firebaseServices} />;
            case 'chat': return <p className="text-center mt-8 text-gray-500">Chatt är under utveckling.</p>;
            case 'settings': return <SettingsView user={user} appData={appData} members={familyMembers} firebaseServices={firebaseServices} />;
            default: return null;
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-xl font-bold text-center sm:text-left">{currentWardrobeOwner.name}'s Garderob</h1>
                {appData.mode === 'family' && (
                    <div className="flex items-center gap-4">
                        <label htmlFor="member_select" className="sr-only">Välj familjemedlem</label>
                        <select id="member_select" value={currentWardrobeOwner.id} onChange={e => { const selected = visibleMembers.find(m => m.id === e.target.value); if(selected) setCurrentWardrobeOwner(selected); }} className="p-2 border rounded-md">
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
function SettingsView({ user, appData, members = [], firebaseServices }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [joinRequests, setJoinRequests] = useState([]);
    const currentUserData = members.find(m => m.id === user.uid);
    const role = currentUserData?.role;
    const { db, query, collection, where, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } = firebaseServices;

    useEffect(() => {
        if (role === 'admin' && appData.familyId) {
            const requestsQuery = query(collection(db, `/artifacts/${appId}/public/data/joinRequests`), where("familyId", "==", appData.familyId), where("status", "==", "pending"));
            const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
                setJoinRequests(snapshot.docs.map(d => ({ docId: d.id, ...d.data() })));
            });
            return unsubscribe;
        }
    }, [role, appData.familyId, db, query, collection, where, onSnapshot]);

    const handlePrivacyToggle = async (e) => {
        if (!currentUserData?.docId) return;
        const memberDocRef = doc(db, `/artifacts/${appId}/public/data/memberships/${currentUserData.docId}`);
        await updateDoc(memberDocRef, { isPrivate: e.target.checked });
    };

    const handleApproveRequest = async (request) => {
        const membershipRef = doc(collection(db, `/artifacts/${appId}/public/data/memberships`));
        await setDoc(membershipRef, {
            userId: request.requesterId, familyId: request.familyId, name: request.requesterName, role: 'member', isPrivate: false, joinedAt: serverTimestamp()
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
                            <p className="text-sm text-gray-600">Dela familjekoden nedan.</p>
                            <p className="text-center font-mono text-2xl bg-gray-100 p-3 my-2 rounded-lg">{appData.familyId}</p>
                        </div>
                    </div>
                )}
                 <div className="bg-white p-6 rounded-lg shadow">
                     <h2 className="text-xl font-bold mb-4">Inställningar</h2>
                      {appData.mode === 'family' && (
                        <div className="flex items-center justify-between mb-4">
                            <label htmlFor="privacy" className="font-semibold">Håll min garderob privat</label>
                            <input type="checkbox" name="privacy" id="privacy" checked={currentUserData?.isPrivate || false} onChange={handlePrivacyToggle} className="h-6 w-6 rounded text-blue-600 focus:ring-blue-500 border-gray-300"/>
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
function WardrobeView({ owner, firebaseServices }) {
    const [garments, setGarments] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [garmentToDelete, setGarmentToDelete] = useState(null);
    const garmentsPath = `/artifacts/${appId}/users/${owner.id}/garments`;

    useEffect(() => {
        if (!owner || !firebaseServices) return;
        const { db, query, collection, onSnapshot } = firebaseServices;
        const q = query(collection(db, garmentsPath));
        const unsubscribe = onSnapshot(q, snapshot => setGarments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return unsubscribe;
    }, [garmentsPath, owner, firebaseServices]);

    const addGarment = async (garmentData) => {
        const { db, collection, addDoc, serverTimestamp } = firebaseServices;
        await addDoc(collection(db, garmentsPath), { ...garmentData, createdAt: serverTimestamp() });
        setShowAddForm(false);
    };

    const confirmDelete = async () => {
        if (garmentToDelete) {
            const { db, doc, deleteDoc } = firebaseServices;
            await deleteDoc(doc(db, garmentsPath, garmentToDelete.id));
            setGarmentToDelete(null);
        }
    };
    
    const groupedGarments = garments.reduce((acc, garment) => {
        const category = garment.category || 'Övrigt';
        if (!acc[category]) acc[category] = [];
        acc[category].push(garment);
        return acc;
    }, {});

    const categories = ['Tröjor', 'Skjortor', 'Byxor', 'Underkläder', 'Skor', 'Idrott', 'Vinter', 'Övrigt'];
    const sortedCategories = categories.filter(cat => groupedGarments[cat]).concat(Object.keys(groupedGarments).filter(cat => !categories.includes(cat)));

    return (
        <div>
            <Modal isOpen={!!garmentToDelete} onClose={() => setGarmentToDelete(null)} onConfirm={confirmDelete} title="Ta bort plagg"><p>Är du säker på att du vill ta bort plagget "{garmentToDelete?.name}"?</p></Modal>
            {showAddForm ? <AddGarmentForm onAdd={addGarment} onCancel={() => setShowAddForm(false)} /> : (
                <>
                    {Object.keys(groupedGarments).length > 0 ? (
                        sortedCategories.map(category => (
                            <div key={category} className="mb-8">
                                <h2 className="text-2xl font-bold border-b pb-2 mb-4">{category}</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {groupedGarments[category].map(g => <GarmentCard key={g.id} garment={g} onDelete={() => setGarmentToDelete(g)} />)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 mt-8">Inga plagg än. Klicka på plus-knappen för att lägga till!</p>
                    )}
                    <button onClick={() => setShowAddForm(true)} className="fixed bottom-20 right-5 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700"><PlusIcon /></button>
                </>
            )}
        </div>
    );
}

// --- Komponent: Outfit-vyn ---
function OutfitsView({ owner, firebaseServices }) {
    const [outfits, setOutfits] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [availableGarments, setAvailableGarments] = useState([]);
    const [outfitToDelete, setOutfitToDelete] = useState(null);
    const outfitsPath = `/artifacts/${appId}/users/${owner.id}/outfits`;
    const garmentsPath = `/artifacts/${appId}/users/${owner.id}/garments`;

    useEffect(() => {
        if (!owner || !firebaseServices) return;
        const { db, query, collection, onSnapshot } = firebaseServices;
        const unsubGarments = onSnapshot(query(collection(db, garmentsPath)), snapshot => setAvailableGarments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const unsubOutfits = onSnapshot(query(collection(db, outfitsPath)), snapshot => setOutfits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => { unsubGarments(); unsubOutfits(); };
    }, [garmentsPath, outfitsPath, owner, firebaseServices]);

    const addOutfit = async (outfitData) => {
        const { db, collection, addDoc, serverTimestamp } = firebaseServices;
        await addDoc(collection(db, outfitsPath), { ...outfitData, createdAt: serverTimestamp() });
        setShowAddForm(false);
    };

    const confirmDelete = async () => {
        if (outfitToDelete) {
            const { db, doc, deleteDoc } = firebaseServices;
            await deleteDoc(doc(db, outfitsPath, outfitToDelete.id));
            setOutfitToDelete(null);
        }
    };

    return (
        <div>
            <Modal isOpen={!!outfitToDelete} onClose={() => setOutfitToDelete(null)} onConfirm={confirmDelete} title="Ta bort Outfit"><p>Är du säker på att du vill ta bort outfiten "{outfitToDelete?.name}"?</p></Modal>
            {showAddForm ? <AddOutfitForm onAdd={addOutfit} onCancel={() => setShowAddForm(false)} availableGarments={availableGarments} /> : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {outfits.map(o => <OutfitCard key={o.id} outfit={o} onDelete={() => setOutfitToDelete(o)} />)}
                    </div>
                    {outfits.length === 0 && <p className="text-center text-gray-500 mt-8">Inga outfits än. Klicka på plus-knappen för att skapa en!</p>}
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
function OutfitCard({ outfit, onDelete }) {
    return (
        <div className="border rounded-lg overflow-hidden shadow-sm bg-white group relative">
            <button onClick={onDelete} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-700"><TrashIcon /></button>
            <img src={outfit.imageUrl || 'https://placehold.co/300x400/eeeeee/cccccc?text=Outfit'} alt={outfit.name} className="w-full aspect-[3/4] object-cover" />
            <div className="p-3">
                <h3 className="font-bold text-lg truncate">{outfit.name}</h3>
                {outfit.notes && <p className="text-sm text-gray-600 italic">"{outfit.notes}"</p>}
                <div className="mt-2">
                    <h4 className="font-semibold text-sm">Ingående plagg:</h4>
                    {outfit.linkedGarments?.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                            {outfit.linkedGarments.map(g => (
                                <div key={g.id} className="flex items-center gap-2 bg-gray-100 rounded-full py-1 pl-1 pr-2 text-xs">
                                    <img src={g.imageUrl || 'https://placehold.co/40x40/eeeeee/cccccc?text=?'} alt={g.name} className="w-6 h-6 rounded-full object-cover" />
                                    <span className="truncate">{g.name}</span>
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
        setIsUploading(true);
        setError('');
        let imageUrl = '';
        if (imageFile) {
             try {
                imageUrl = await resizeImage(imageFile);
            } catch (err) {
                console.error("Image processing error:", err);
                setError("Kunde inte bearbeta bilden. Försök med en annan bild.");
                setIsUploading(false);
                return;
            }
        }

        try {
            await onAdd({ name, category, size, location, notes, imageUrl });
        } catch (err) {
             if (err.message.includes('longer than 1048487 bytes')) {
                setError('Bilden är för stor även efter komprimering. Välj en mindre bild.');
             } else {
                setError('Ett fel uppstod vid uppladdning.');
             }
             setIsUploading(false);
             return;
        }
        setIsUploading(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Lägg till nytt plagg</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="garment-image-upload" className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">{imagePreview ? <img src={imagePreview} alt="Förhandsgranskning" className="h-full w-full object-contain rounded-lg" /> : <div className="flex flex-col items-center justify-center pt-5 pb-6"><CameraIcon /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klicka eller ta en bild</span></p><p className="text-xs text-gray-500">PNG, JPG</p></div>}<input id="garment-image-upload" type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageChange}/></label>
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
    const [notes, setNotes] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [selectedGarmentIds, setSelectedGarmentIds] = useState(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');


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
        setIsUploading(true);
        setError('');
        let imageUrl = '';
        if (imageFile) {
            try {
                imageUrl = await resizeImage(imageFile);
            } catch (err) {
                console.error("Image processing error:", err);
                setError("Kunde inte bearbeta bilden.");
                setIsUploading(false);
                return;
            }
        }
        
        const linkedGarments = availableGarments.filter(g => selectedGarmentIds.has(g.id)).map(g => ({ id: g.id, name: g.name, imageUrl: g.imageUrl || '' }));

        try {
            await onAdd({ name, notes, imageUrl, linkedGarments });
        } catch(err) {
            if (err.message.includes('longer than 1048487 bytes')) {
                setError('Bilden är för stor även efter komprimering. Välj en mindre bild.');
             } else {
                setError('Ett fel uppstod vid uppladdning.');
             }
             setIsUploading(false);
             return;
        }
        setIsUploading(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Skapa ny Outfit</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <label htmlFor="outfit-image-upload" className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">{imagePreview ? <img src={imagePreview} alt="Förhandsgranskning" className="h-full w-full object-contain rounded-lg" /> : <div className="flex flex-col items-center justify-center pt-5 pb-6"><CameraIcon /><p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Klicka eller ta en bild</span></p><p className="text-xs text-gray-500">PNG, JPG</p></div>}<input id="outfit-image-upload" type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageChange}/></label>
                <input type="text" placeholder="Outfitens namn" value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 border rounded"/>
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

