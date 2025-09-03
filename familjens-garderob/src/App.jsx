import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { 
    getFirestore, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc, 
    collection, onSnapshot, query, where, serverTimestamp, getDocs
} from 'firebase/firestore';

// --- Helper-ikoner (SVG) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const OutfitIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;


// --- Firebase Konfiguration ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG);
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase initialization error:", e);
}

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

    useEffect(() => {
        if (!auth) {
            setError("Kunde inte ansluta till databasen. Kontrollera konfigurationen.");
            setLoading(false);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, `/artifacts/${appId}/users/${currentUser.uid}/profile/main`);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    setAppData(userDocSnap.data());
                } else {
                    setAppData(null);
                }
            } else {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (err) {
                    console.error("Anonymous sign-in error:", err);
                    setError("Autentisering misslyckades. Ladda om sidan.");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleProfileSetup = async (name, mode, familyIdToJoin = null) => {
        if (!user) return;
        setLoading(true);
        try {
            let familyId = familyIdToJoin;
            let role = 'member';
            if (mode === 'family' && !familyId) {
                familyId = crypto.randomUUID().split('-')[0];
                const familyDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}`);
                await setDoc(familyDocRef, { createdAt: serverTimestamp(), owner: user.uid });
                role = 'admin'; // First user is admin
            }

            const userProfile = { name, mode, familyId: mode === 'family' ? familyId : null };
            await setDoc(doc(db, `/artifacts/${appId}/users/${user.uid}/profile/main`), userProfile);

            if (mode === 'family') {
                const memberDocRef = doc(db, `/artifacts/${appId}/public/data/families/${familyId}/members/${user.uid}`);
                await setDoc(memberDocRef, { name, joinedAt: serverTimestamp(), role, isPrivate: false });
            }

            setAppData(userProfile);
        } catch (e) {
            console.error("Profile setup error: ", e);
            setError("Kunde inte skapa profilen. Försök igen.");
        }
        setLoading(false);
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-100"><div className="text-xl font-semibold">Laddar garderoben...</div></div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-red-100"><div className="text-xl text-red-700 p-8">{error}</div></div>;

    return (
        <div className="h-screen w-screen bg-gray-100 antialiased">
            {user && !appData ? <ProfileSetup onSetup={handleProfileSetup} /> : user && appData ? <WardrobeManager user={user} appData={appData} /> : <div className="flex items-center justify-center h-screen">Loggar in...</div>}
        </div>
    );
}

// --- Komponent: Profil-setup ---
function ProfileSetup({ onSetup }) {
    const [name, setName] = useState('');
    const [joinFamilyId, setJoinFamilyId] = useState('');
    const [view, setView] = useState('main');

    if (view === 'join') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                    <h2 className="text-2xl font-bold mb-4">Gå med i familj</h2>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ditt namn" className="w-full p-2 border rounded mb-4" />
                    <input type="text" value={joinFamilyId} onChange={e => setJoinFamilyId(e.target.value)} placeholder="Familjekod" className="w-full p-2 border rounded mb-4" />
                    <button onClick={() => onSetup(name, 'family', joinFamilyId)} disabled={!name || !joinFamilyId} className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300">Gå med</button>
                    <button onClick={() => setView('main')} className="mt-4 text-sm text-gray-600">Tillbaka</button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                <h1 className="text-3xl font-bold mb-2">Välkommen!</h1>
                <p className="text-gray-600 mb-6">Hur vill du använda appen?</p>
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

// --- Komponent: Huvudvy för Garderoben ---
function WardrobeManager({ user, appData }) {
    const [currentView, setCurrentView] = useState('wardrobe');
    const [currentWardrobeOwner, setCurrentWardrobeOwner] = useState({ id: user.uid, name: appData.name, type: 'full' });
    const [familyMembers, setFamilyMembers] = useState([]);
    const [managedMembers, setManagedMembers] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState('member');

    useEffect(() => {
        if (appData.mode === 'family') {
            const membersColRef = collection(db, `/artifacts/${appId}/public/data/families/${appData.familyId}/members`);
            const unsubMembers = onSnapshot(membersColRef, (snapshot) => {
                const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'full' }));
                setFamilyMembers(members);
                const currentUserData = members.find(m => m.id === user.uid);
                if (currentUserData) setCurrentUserRole(currentUserData.role);
            });

            const managedMembersColRef = collection(db, `/artifacts/${appId}/public/data/families/${appData.familyId}/managed_members`);
            const unsubManaged = onSnapshot(managedMembersColRef, (snapshot) => {
                const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'managed' }));
                setManagedMembers(members);
            });
            return () => { unsubMembers(); unsubManaged(); };
        }
    }, [appData.familyId, appData.mode, user.uid]);
    
    const visibleMembers = useMemo(() => {
        const visibleFullMembers = familyMembers.filter(m => m.id === user.uid || !m.isPrivate);
        return [...visibleFullMembers, ...managedMembers];
    }, [familyMembers, managedMembers, user.uid]);

    const basePath = useMemo(() => {
        if (appData.mode === 'family') return `/artifacts/${appId}/public/data/families/${appData.familyId}`;
        return `/artifacts/${appId}/users/${user.uid}`;
    }, [user.uid, appData]);

    const renderContent = () => {
        switch (currentView) {
            case 'wardrobe': return <WardrobeView basePath={basePath} owner={currentWardrobeOwner} />;
            case 'outfits': return <OutfitsView basePath={basePath} owner={currentWardrobeOwner} />;
            case 'chat': return appData.mode === 'family' ? <ChatView basePath={basePath} user={user} appData={appData} /> : <p>Chatt är endast för familjeläge.</p>;
            case 'settings': return appData.mode === 'family' ? <SettingsView basePath={basePath} user={user} role={currentUserRole} members={familyMembers} managedMembers={managedMembers} /> : <p>Inställningar är endast för familjeläge.</p>
            default: return null;
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <header className="bg-white shadow-md p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-xl font-bold text-center sm:text-left">{currentWardrobeOwner.name}'s Garderob</h1>
                {appData.mode === 'family' && (
                    <div className="flex items-center gap-4">
                        <select value={currentWardrobeOwner.id} onChange={e => { const selected = visibleMembers.find(m => m.id === e.target.value); setCurrentWardrobeOwner(selected); }} className="p-2 border rounded-md">
                            <optgroup label="Familjemedlemmar">
                                {visibleMembers.filter(m => m.type === 'full').map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                            </optgroup>
                            {managedMembers.length > 0 && <optgroup label="Barn">
                                {visibleMembers.filter(m => m.type === 'managed').map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
                            </optgroup>}
                        </select>
                    </div>
                )}
            </header>
            <main className="flex-grow p-4 overflow-y-auto pb-24">{renderContent()}</main>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-2">
                <button onClick={() => setCurrentView('wardrobe')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'wardrobe' ? 'text-blue-600' : 'text-gray-500'}`}><HomeIcon /> Plagg</button>
                <button onClick={() => setCurrentView('outfits')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'outfits' ? 'text-blue-600' : 'text-gray-500'}`}><OutfitIcon /> Outfits</button>
                {appData.mode === 'family' && <button onClick={() => setCurrentView('chat')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'chat' ? 'text-blue-600' : 'text-gray-500'}`}><ChatIcon /> Chatt</button>}
                {appData.mode === 'family' && <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center w-20 text-center text-xs sm:text-sm ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}><SettingsIcon /> Inställningar</button>}
            </nav>
        </div>
    );
}
// --- Komponent: Inställningar ---
function SettingsView({ basePath, user, role, members, managedMembers }) {
    const [newChildName, setNewChildName] = useState('');
    const currentUserData = members.find(m => m.id === user.uid);
    const familyId = basePath.split('/').pop();

    const handlePrivacyToggle = async (e) => {
        const isPrivate = e.target.checked;
        const memberDocRef = doc(db, `${basePath}/members/${user.uid}`);
        await updateDoc(memberDocRef, { isPrivate });
    };
    
    const handleAddChild = async (e) => {
        e.preventDefault();
        if (newChildName.trim() === '') return;
        const managedMemberId = crypto.randomUUID();
        const managedMemberRef = doc(db, `${basePath}/managed_members/${managedMemberId}`);
        await setDoc(managedMemberRef, { name: newChildName });
        setNewChildName('');
    };

    const handleDeleteManagedMember = async (memberId) => {
         const managedMemberRef = doc(db, `${basePath}/managed_members/${memberId}`);
         await deleteDoc(managedMemberRef);
         // OBS: Detta raderar inte garderoben. En mer avancerad lösning behövs för det.
    };

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Mina Inställningar</h2>
                <div className="flex items-center justify-between">
                    <label htmlFor="privacy" className="font-semibold">Håll min garderob privat</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="privacy" id="privacy" checked={currentUserData?.isPrivate || false} onChange={handlePrivacyToggle} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                        <label htmlFor="privacy" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">När din garderob är privat kan andra familjemedlemmar inte se dina plagg eller outfits.</p>
            </div>
            
            {role === 'admin' && (
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">Familjeadministration</h2>
                    <div className="mb-6">
                        <h3 className="font-semibold mb-2">Bjud in nya medlemmar</h3>
                        <p className="text-sm text-gray-600">Dela familjekoden nedan med en annan vuxen för att de ska kunna gå med.</p>
                        <p className="text-center font-mono text-2xl bg-gray-100 p-3 my-2 rounded-lg">{familyId}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Hantera barnkonton</h3>
                        <form onSubmit={handleAddChild} className="flex gap-2 mb-4">
                            <input type="text" value={newChildName} onChange={e => setNewChildName(e.target.value)} placeholder="Barnets namn" className="flex-grow p-2 border rounded" />
                            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600">Lägg till</button>
                        </form>
                        <ul className="space-y-2">
                           {managedMembers.map(child => (
                               <li key={child.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                   <span>{child.name}</span>
                                   <button onClick={() => handleDeleteManagedMember(child.id)} className="text-red-500 hover:text-red-700"><TrashIcon /></button>
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>
            )}
            <style>{`.toggle-checkbox:checked { right: 0; border-color: #48bb78; } .toggle-checkbox:checked + .toggle-label { background-color: #48bb78; }`}</style>
        </div>
    );
}


// --- Komponent: Plagg-vyn ---
function WardrobeView({ basePath, owner }) {
    const [garments, setGarments] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [garmentToDelete, setGarmentToDelete] = useState(null);

    useEffect(() => {
        // Path logic works for both full and managed members
        const garmentsPath = `${basePath}/wardrobes/${owner.id}/garments`;
        const q = query(collection(db, garmentsPath));
        const unsubscribe = onSnapshot(q, snapshot => setGarments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => unsubscribe();
    }, [basePath, owner.id]);

    const addGarment = async (garmentData) => {
        const garmentsPath = `${basePath}/wardrobes/${owner.id}/garments`;
        await addDoc(collection(db, garmentsPath), { ...garmentData, createdAt: serverTimestamp() });
        setShowAddForm(false);
    };

    const confirmDelete = async () => {
        if (garmentToDelete) {
            const garmentPath = `${basePath}/wardrobes/${owner.id}/garments/${garmentToDelete.id}`;
            await deleteDoc(doc(db, garmentPath));
            setGarmentToDelete(null);
        }
    };
    
    const groupedGarments = garments.reduce((acc, garment) => {
        const category = garment.category || 'Övrigt';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(garment);
        return acc;
    }, {});

    const categories = ['Tröjor', 'Skjortor', 'Byxor', 'Underkläder', 'Skor', 'Idrott', 'Vinter', 'Övrigt'];
    const sortedCategories = categories.filter(cat => groupedGarments[cat]);


    return (
        <div>
            <Modal isOpen={!!garmentToDelete} onClose={() => setGarmentToDelete(null)} onConfirm={confirmDelete} title="Ta bort plagg"><p>Är du säker på att du vill ta bort plagget "{garmentToDelete?.name}"?</p></Modal>
            {showAddForm ? <AddGarmentForm onAdd={addGarment} onCancel={() => setShowAddForm(false)} /> : (
                <>
                    {sortedCategories.length > 0 ? (
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
function OutfitsView({ basePath, owner }) {
    const [outfits, setOutfits] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [availableGarments, setAvailableGarments] = useState([]);
    const [outfitToDelete, setOutfitToDelete] = useState(null);

    useEffect(() => {
        const garmentsPath = `${basePath}/wardrobes/${owner.id}/garments`;
        const unsubGarments = onSnapshot(query(collection(db, garmentsPath)), snapshot => setAvailableGarments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        const outfitsPath = `${basePath}/wardrobes/${owner.id}/outfits`;
        const unsubOutfits = onSnapshot(query(collection(db, outfitsPath)), snapshot => setOutfits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        return () => { unsubGarments(); unsubOutfits(); };
    }, [basePath, owner.id]);

    const addOutfit = async (outfitData) => {
        const outfitsPath = `${basePath}/wardrobes/${owner.id}/outfits`;
        await addDoc(collection(db, outfitsPath), { ...outfitData, createdAt: serverTimestamp() });
        setShowAddForm(false);
    };

    const confirmDelete = async () => {
        if (outfitToDelete) {
            const outfitPath = `${basePath}/wardrobes/${owner.id}/outfits/${outfitToDelete.id}`;
            await deleteDoc(doc(db, outfitPath));
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

// --- Komponent: Chatt-vyn ---
function ChatView({ basePath, user, appData }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatPath = `${basePath}/chat`;

    useEffect(() => {
        const q = query(collection(db, chatPath));
        const unsubscribe = onSnapshot(q, snapshot => {
            const sortedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
            setMessages(sortedMessages);
        });
        return () => unsubscribe();
    }, [chatPath]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        await addDoc(collection(db, chatPath), { text: newMessage, createdAt: serverTimestamp(), senderId: user.uid, senderName: appData.name });
        setNewMessage('');
    };

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">{messages.map(msg => (<div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}><div className={`p-3 rounded-lg max-w-xs ${msg.senderId === user.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}><p className="font-bold text-sm">{msg.senderName}</p><p>{msg.text}</p></div></div>))}</div>
            <form onSubmit={sendMessage} className="p-4 bg-white border-t flex"><input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-grow p-2 border rounded-l-lg" placeholder="Skriv ett meddelande..." /><button type="submit" className="bg-blue-500 text-white px-4 rounded-r-lg font-semibold">Skicka</button></form>
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
    
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        let imageUrl = '';
        if (imageFile) imageUrl = await fileToBase64(imageFile);
        await onAdd({ name, category, size, location, notes, imageUrl });
        setIsUploading(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Lägg till nytt plagg</h2>
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
    
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        let imageUrl = '';
        if (imageFile) imageUrl = await fileToBase64(imageFile);
        
        const linkedGarments = availableGarments.filter(g => selectedGarmentIds.has(g.id)).map(g => ({ id: g.id, name: g.name, imageUrl: g.imageUrl || '' }));

        await onAdd({ name, notes, imageUrl, linkedGarments });
        setIsUploading(false);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold mb-4">Skapa ny Outfit</h2>
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

