// ==================== NAVEGACIÓN ENTRE SECCIONES ====================
function showSection(id) {
  // Ocultar todas las secciones
  document.querySelectorAll(".seccion").forEach(s => s.hidden = true);

  // Mostrar la elegida
  const target = document.getElementById(id);
  if (target) {
    target.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Marcar nav activa
  document.querySelectorAll(".navlink").forEach(a => a.classList.remove("active"));
  const active = document.querySelector(`.navlink[data-target="${id}"]`);
  if (active) active.classList.add("active");

  console.log("Sección activa:", id); // para debug
}

// Ejecutar después de que carga el DOM
document.addEventListener("DOMContentLoaded", () => {
  // Manejo de clics en los enlaces de la navbar
  document.querySelectorAll(".navlink").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.dataset.target;
      showSection(id);
    });
  });

  // Mostrar INICIO al cargar
  showSection("inicio");

  // ==================== ACORDEÓN ====================
  document.querySelectorAll(".acordeon-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = btn.nextElementSibling;

      // Cerrar otros paneles
      document.querySelectorAll(".acordeon-contenido").forEach(p => {
        if (p !== panel) {
          p.style.maxHeight = null;
          p.classList.remove("expanded");
        }
      });

      // Toggle actual
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
        panel.classList.remove("expanded");
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        panel.classList.add("expanded");
      }
    });
  });
});
