const getEnvValue = (viteKey, envConfigKey) => {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
        return import.meta.env[viteKey];
    }
    if (typeof ENV_CONFIG !== 'undefined' && ENV_CONFIG[envConfigKey]) {
        return ENV_CONFIG[envConfigKey];
    }
    console.warn(`⚠️ Environment variable bulunamadı: ${viteKey}`);
    return '';
};

const firebaseConfig = {
    apiKey: getEnvValue('VITE_FIREBASE_API_KEY', 'FIREBASE_API_KEY'),
    authDomain: getEnvValue('VITE_FIREBASE_AUTH_DOMAIN', 'FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvValue('VITE_FIREBASE_PROJECT_ID', 'FIREBASE_PROJECT_ID'),
    storageBucket: getEnvValue('VITE_FIREBASE_STORAGE_BUCKET', 'FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID', 'FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvValue('VITE_FIREBASE_APP_ID', 'FIREBASE_APP_ID'),
    measurementId: getEnvValue('VITE_FIREBASE_MEASUREMENT_ID', 'FIREBASE_MEASUREMENT_ID')
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
async function saveNoteToFirebase(name, note, walletAddress = null) {
    try {
        const noteData = {
            name: name,
            note: note,
            walletAddress: walletAddress,
            date: new Date().toLocaleString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date()
        };

        const docRef = await db.collection('notes').add(noteData);
        console.log('Not Firebase\'e kaydedildi:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Not kaydedilirken hata:', error);
        throw error;
    }
}

async function getNotesFromFirebase() {
    try {
        const snapshot = await db.collection('notes')
            .orderBy('timestamp', 'desc')
            .get();
        
        const notes = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            notes.push({
                id: doc.id,
                name: data.name,
                note: data.note,
                walletAddress: data.walletAddress || null,
                date: data.date,
                timestamp: data.createdAt ? data.createdAt.toMillis() : Date.now()
            });
        });
        
        return notes;
    } catch (error) {
        console.error('Notlar çekilirken hata:', error);
        throw error;
    }
}

async function deleteNoteFromFirebase(noteId) {
    try {
        await db.collection('notes').doc(noteId).delete();
        console.log('Not Firebase\'den silindi:', noteId);
    } catch (error) {
        console.error('Not silinirken hata:', error);
        throw error;
    }
}

async function clearAllNotesFromFirebase() {
    try {
        const snapshot = await db.collection('notes').get();
        const batch = db.batch();
        
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        console.log('Tüm notlar Firebase\'den silindi');
    } catch (error) {
        console.error('Tüm notlar silinirken hata:', error);
        throw error;
    }
}

if (typeof window !== 'undefined') {
    window.saveNoteToFirebase = saveNoteToFirebase;
    window.getNotesFromFirebase = getNotesFromFirebase;
    window.deleteNoteFromFirebase = deleteNoteFromFirebase;
    window.clearAllNotesFromFirebase = clearAllNotesFromFirebase;
}