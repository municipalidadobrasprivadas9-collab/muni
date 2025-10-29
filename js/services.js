// js/services/upload.service.js
import { db } from '../config/firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const CLOUDINARY_CONFIG = {
  cloudName: "dpqm0sfhp",
  uploadPreset: "mis-archivos-muni",
  apiUrl: "https://api.cloudinary.com/v1_1/dpqm0sfhp/upload"
};

class UploadService {

  /**
   * Valida archivo antes de subir
   * @param {File} file 
   * @returns {Object}
   */
  validarArchivo(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];

    if (!file) {
      return { valid: false, error: 'No se seleccionó ningún archivo' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Solo se permiten archivos PDF' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'El archivo no debe superar 10MB' };
    }

    return { valid: true };
  }

  /**
   * Sube archivo a Cloudinary
   * @param {File} file 
   * @param {Function} onProgress - Callback de progreso (opcional)
   * @returns {Promise<string>} URL del archivo subido
   */
  async subirArchivo(file, onProgress = null) {
    try {
      // Validar archivo
      const validation = this.validarArchivo(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
      formData.append('folder', 'tramites_municipales');
      formData.append('resource_type', 'raw'); // Para PDFs

      // Realizar petición con seguimiento de progreso
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Callback de progreso
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 100);
              onProgress(percentComplete);
            }
          });
        }

        // Callback de finalización
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.secure_url);
          } else {
            reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`));
          }
        });

        // Callback de error
        xhr.addEventListener('error', () => {
          reject(new Error('Error de red al subir el archivo'));
        });

        xhr.open('POST', CLOUDINARY_CONFIG.apiUrl);
        xhr.send(formData);
      });

    } catch (error) {
      console.error('Error en upload:', error);
      throw error;
    }
  }

  /**
   * Guarda trámite en Firestore
   * @param {Object} tramiteData 
   * @returns {Promise<string>} ID del documento creado
   */
  async guardarTramite(tramiteData) {
    try {
      const {
        usuarioId,
        usuarioNombre,
        usuarioEmail,
        nombreTramite,
        descripcion,
        archivos, // Array de URLs
        tipo
      } = tramiteData;

      const docRef = await addDoc(collection(db, 'tramites'), {
        usuarioId: usuarioId,
        usuarioNombre: usuarioNombre,
        usuarioEmail: usuarioEmail,
        nombreTramite: nombreTramite,
        descripcion: descripcion || '',
        archivos: archivos,
        tipo: tipo || 'Plano de Obra',
        estado: 'Pendiente',
        fechaCarga: serverTimestamp(),
        observaciones: '',
        revisadoPor: null,
        fechaRevision: null
      });

      return docRef.id;

    } catch (error) {
      console.error('Error guardando trámite:', error);
      throw new Error('No se pudo guardar el trámite en la base de datos');
    }
  }

  /**
   * Sube múltiples archivos (máximo 4)
   * @param {FileList} files 
   * @param {Function} onProgressTotal 
   * @returns {Promise<Array<string>>} Array de URLs
   */
  async subirMultiplesArchivos(files, onProgressTotal = null) {
    const MAX_FILES = 4;
    
    if (files.length > MAX_FILES) {
      throw new Error(`Solo puedes subir hasta ${MAX_FILES} archivos`);
    }

    const urls = [];
    let completed = 0;

    for (let file of files) {
      try {
        const url = await this.subirArchivo(file, (progress) => {
          // Progreso individual
          if (onProgressTotal) {
            const totalProgress = Math.round(((completed + (progress / 100)) / files.length) * 100);
            onProgressTotal(totalProgress);
          }
        });
        
        urls.push(url);
        completed++;

      } catch (error) {
        throw new Error(`Error subiendo ${file.name}: ${error.message}`);
      }
    }

    return urls;
  }

  /**
   * Proceso completo: subir archivos y guardar trámite
   * @param {FileList} files 
   * @param {Object} tramiteInfo 
   * @param {Function} onProgress 
   * @returns {Promise<Object>}
   */
  async procesarTramiteCompleto(files, tramiteInfo, onProgress = null) {
    try {
      // 1. Subir archivos
      if (onProgress) onProgress({ step: 'upload', progress: 0 });
      
      const urls = await this.subirMultiplesArchivos(files, (progress) => {
        if (onProgress) onProgress({ step: 'upload', progress });
      });

      // 2. Guardar en Firestore
      if (onProgress) onProgress({ step: 'save', progress: 100 });

      const tramiteId = await this.guardarTramite({
        ...tramiteInfo,
        archivos: urls
      });

      return {
        success: true,
        tramiteId: tramiteId,
        archivos: urls,
        message: 'Trámite cargado exitosamente'
      };

    } catch (error) {
      console.error('Error en proceso completo:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default new UploadService();