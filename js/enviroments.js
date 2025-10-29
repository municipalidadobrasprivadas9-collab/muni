// 1️ Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { 
  getFirestore, collection, getDocs, addDoc, updateDoc, doc 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// 2️ Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCtBzhKFQBJBLLZ3gVcb9GCMVQQQBLBjb8",
  authDomain: "proyect-muni-02.firebaseapp.com",
  projectId: "proyect-muni-02",
  storageBucket: "proyect-muni-02.firebasestorage.app",
  messagingSenderId: "1091525341781",
  appId: "1:1091525341781:web:0a6816f80aba102b3c5adc",
  measurementId: "G-0WSVMJ2V89"
};

// 3️ Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// 4️ Configuración Cloudinary (servicio externo)
export const CLOUDINARY_UPLOAD_PRESET = "tu_upload_preset"; // 🔹 lo configuras en Cloudinary
export const CLOUDINARY_CLOUD_NAME = "tu_cloud_name";

// Función para subir archivo a Cloudinary
export async function uploadToCloudinary(file) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Error al subir a Cloudinary");
  return await res.json(); // retorna el JSON de Cloudinary (incluye secure_url)
}

// 5️ Función para cargar trámites
export async function cargarTramites() {
  const tabla = document.getElementById("tabla-tramites")?.getElementsByTagName("tbody")[0];
  if (!tabla) return;
  tabla.innerHTML = ""; 

  const querySnapshot = await getDocs(collection(db, "tramites"));
  querySnapshot.forEach(async (docu) => {
    const data = docu.data();
    const fila = tabla.insertRow();

    fila.insertCell(0).textContent = docu.id;
    fila.insertCell(1).textContent = data.nombre || "";
    fila.insertCell(2).textContent = data.estado || "";
    fila.insertCell(3).textContent = data.fecha || "";

    // Columna archivo
    let archivoLink = "";
    if (data.archivoUrl) {
      archivoLink = `<a href="${data.archivoUrl}" target="_blank">Ver archivo</a>`;
    }
    fila.insertCell(4).innerHTML = archivoLink;

    // Acciones
    const acciones = fila.insertCell(5);
    if (data.estado === "Pendiente") {
      const btnAprobar = document.createElement("button");
      btnAprobar.textContent = "Aprobar";
      btnAprobar.onclick = async () => {
        await updateDoc(doc(db, "tramites", docu.id), { estado: "Aprobado" });
        mostrarModal("success", "Trámite aprobado correctamente");
        cargarTramites();
      };
      const btnRechazar = document.createElement("button");
      btnRechazar.textContent = "Rechazar";
      btnRechazar.onclick = async () => {
        await updateDoc(doc(db, "tramites", docu.id), { estado: "Rechazado" });
        mostrarModal("error", "Trámite rechazado");
        cargarTramites();
      };
      acciones.appendChild(btnAprobar);
      acciones.appendChild(btnRechazar);
    } else {
      acciones.textContent = "-";
    }
  });
}

// 6️ CRUD Tramites
document.getElementById("form-tramite")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value;
  const estado = document.getElementById("estado").value;
  const fecha = document.getElementById("fecha").value;
  const archivoInput = document.getElementById("archivo");
  let archivoUrl = "";

  if (archivoInput.files.length > 0) {
    try {
      const result = await uploadToCloudinary(archivoInput.files[0]);
      archivoUrl = result.secure_url;
    } catch (err) {
      mostrarModal("error", "Error al subir a Cloudinary");
      return;
    }
  }

  await addDoc(collection(db, "tramites"), { nombre, estado, fecha, archivoUrl });
  mostrarModal("success", "Trámite cargado con éxito");
  e.target.reset();
  cargarTramites();
});

// 7️ Listener de Auth
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario logueado:", user.email);
    cargarTramites();
  } else {
    console.log("No hay usuario logueado");
  }
});

// 8️ Ventanas modales
export function mostrarModal(tipo, mensaje) {
  const modal = document.createElement("div");
  modal.className = `modal ${tipo}`;
  modal.innerHTML = `<div class="modal-content">
    <p>${mensaje}</p>
    <button id="cerrarModal">Cerrar</button>
  </div>`;
  document.body.appendChild(modal);

  document.getElementById("cerrarModal").onclick = () => modal.remove();
}



