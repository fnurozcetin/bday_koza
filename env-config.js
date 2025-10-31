const ENV_CONFIG = {
    FIREBASE_API_KEY: "AIzaSyBRn7axDXum2o2KxzsAaxJcB6LWw5jBx5g",
    FIREBASE_AUTH_DOMAIN: "birth-koza.firebaseapp.com",
    FIREBASE_PROJECT_ID: "birth-koza",
    FIREBASE_STORAGE_BUCKET: "birth-koza.firebasestorage.app",
    FIREBASE_MESSAGING_SENDER_ID: "496992970545",
    FIREBASE_APP_ID: "1:496992970545:web:3ef5dac17eb978e57ab210",
    FIREBASE_MEASUREMENT_ID: "G-E0Z9CMRD6G",

    ADMIN_PASSWORD: "1koza16"
};

if (!ENV_CONFIG.FIREBASE_API_KEY) {
    console.warn("⚠️ env-config.js: Firebase konfigürasyonu eksik!");
}
