import AuthService from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const formLoginAdmin = document.getElementById('formLoginAdmin');
    const formLoginProf = document.getElementById('formLoginProf');

    formLoginAdmin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('usuarioAdmin').value;
        const password = document.getElementById('passwordAdmin').value;

        const result = await AuthService.iniciarSesion(email, password, 'admin');

        if (result.success) {
            window.location.href = 'admin.html';
        } else {
            alert(result.message);
        }
    });

    formLoginProf.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('usuarioProf').value;
        const password = document.getElementById('passwordProf').value;

        const result = await AuthService.iniciarSesion(email, password, 'profesional');

        if (result.success) {
            window.location.href = 'profesional.html';
        } else {
            alert(result.message);
        }
    });
});
