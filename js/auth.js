// js/services/auth.service.js
import { auth, db } from '../config/firebase.js';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

class AuthService {
  
  /**
   * Registra un nuevo usuario (profesional o admin)
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>}
   */
  async registrarUsuario(userData) {
    const { email, password, nombre, apellido, rol, matricula, telefono, direccion } = userData;
    
    try {
      // Validar dominio para admins
      if (rol === 'admin' && !this.esCorreoMunicipal(email)) {
        throw new Error('Los administradores deben usar correo @municipalidad.misiones.gov.ar');
      }

      // Validar que profesionales no usen correo municipal
      if (rol === 'profesional' && this.esCorreoMunicipal(email)) {
        throw new Error('Los profesionales no pueden usar un correo municipal.');
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Enviar correo de verificación
      await sendEmailVerification(user, {
        url: `${window.location.origin}/auth/login.html`,
        handleCodeInApp: false
      });

      // Guardar datos adicionales en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email: email,
        nombre: nombre,
        apellido: apellido,
        rol: rol,
        matricula: matricula || null,
        telefono: telefono || null,
        direccion: direccion || null,
        verificado: false,
        fechaRegistro: new Date().toISOString(),
        activo: true
      });

      return {
        success: true,
        message: 'Usuario registrado. Revisa tu correo para verificar la cuenta.',
        user: user
      };

    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        message: this.getMensajeError(error.code) || error.message,
        error: error
      };
    }
  }

  /**
   * Inicia sesión validando verificación de email
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>}
   */
  async iniciarSesion(email, password, expectedRole) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar si el email está verificado
      if (!user.emailVerified) {
        await signOut(auth);
        return {
          success: false,
          message: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
          needsVerification: true
        };
      }

      // Obtener datos del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      
      if (!userDoc.exists()) {
        await signOut(auth);
        return {
          success: false,
          message: 'No se encontraron datos del usuario. Contacta al administrador.'
        };
      }

      const userData = userDoc.data();

      // Validar que el usuario esté activo
      if (!userData.activo) {
        await signOut(auth);
        return {
          success: false,
          message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
        };
      }

      // Validar que el rol del usuario es el esperado
      if (userData.rol !== expectedRole) {
        await signOut(auth);
        return {
          success: false,
          message: 'No tienes permisos para acceder a esta sección.'
        };
      }

      return {
        success: true,
        user: user,
        userData: userData,
        rol: userData.rol
      };

    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: this.getMensajeError(error.code)
      };
    }
  }

  /**
   * Reenvía el correo de verificación
   * @param {string} email 
   * @param {string} password 
   */
  async reenviarVerificacion(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      return {
        success: true,
        message: 'Correo de verificación enviado. Revisa tu bandeja de entrada.'
      };
    } catch (error) {
      return {
        success: false,
        message: this.getMensajeError(error.code)
      };
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  async cerrarSesion() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, message: 'Error al cerrar sesión' };
    }
  }

  /**
   * Obtiene el usuario actual autenticado
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Observa cambios en el estado de autenticación
   * @param {Function} callback 
   */
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Valida si es correo municipal
   * @param {string} email 
   */
  esCorreoMunicipal(email) {
    return email.endsWith('@municipalidad.misiones.gov.ar');
  }

  /**
   * Traduce códigos de error de Firebase
   * @param {string} errorCode 
   */
  getMensajeError(errorCode) {
    const errores = {
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/invalid-email': 'Correo electrónico inválido',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet'
    };
    return errores[errorCode] || 'Error desconocido. Intenta nuevamente.';
  }
}

export default new AuthService();