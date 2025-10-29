// js/config/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// ⚠️ IMPORTANTE: Estas credenciales ya están expuestas en GitHub
// Deberías:
// 1. Regenerar estas claves desde Firebase Console
// 2. Implementar reglas de seguridad en Firestore
// 3. Usar variables de entorno para producción
const firebaseConfig = {
  apiKey: "AIzaSyCtBzhKFQBJBLLZ3gVcb9GCMVQQQBLBjb8",
  authDomain: "proyect-muni-02.firebaseapp.com",
  projectId: "proyect-muni-02",
  storageBucket: "proyect-muni-02.firebasestorage.app",
  messagingSenderId: "1091525341781",
  appId: "1:1091525341781:web:0a6816f80aba102b3c5adc",
  measurementId: "G-0WSVMJ2V89"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

