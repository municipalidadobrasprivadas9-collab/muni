import AuthService from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout');

    logoutButton.addEventListener('click', async () => {
        const result = await AuthService.cerrarSesion();
        if (result.success) {
            window.location.href = 'index.html';
        } else {
            alert(result.message);
        }
    });
});