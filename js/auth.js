import { auth, db, mostrarModal } from "./enviroments.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Mostrar login al hacer clic en botón
document.getElementById('btnAdmin').addEventListener('click', () => {
  document.getElementById('contenidoAdmin').style.display = 'block';
  document.getElementById('contenidoProf').style.display = 'none';
});
document.getElementById('btnProf').addEventListener('click', () => {
  document.getElementById('contenidoProf').style.display = 'block';
  document.getElementById('contenidoAdmin').style.display = 'none';
});

// Login Admin
document.getElementById('formLoginAdmin').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('usuarioAdmin').value;
  const password = document.getElementById('passwordAdmin').value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    // Obtener rol
    const docRef = doc(db, "usuarios", uid);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().rol === "administrador") {
      document.getElementById('loginAdmin').style.display = 'none';
      document.getElementById('infoAdmin').style.display = 'block';
      mostrarModal("success", "Bienvenido administrador");
    } else {
      mostrarModal("error", "No tienes permisos de administrador");
    }
  } catch (err) {
    mostrarModal("error", "Credenciales inválidas");
  }
});

// Login Profesional
document.getElementById('formLoginProf').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('usuarioProf').value;
  const password = document.getElementById('passwordProf').value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    const docRef = doc(db, "usuarios", uid);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().rol === "profesional") {
      document.getElementById('loginProf').style.display = 'none';
      document.getElementById('infoProf').style.display = 'block';
      mostrarModal("success", "Bienvenido profesional");
    } else {
      mostrarModal("error", "No tienes permisos de profesional");
    }
  } catch (err) {
    mostrarModal("error", "Credenciales inválidas");
  }
});
