// frontend/js/auth.js

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const BASE_URL = location.hostname.includes('localhost') || location.hostname.includes('127.')
  ? 'http://localhost:3000'
  : 'https://krypt-broker-backend.onrender.com/api';

const API_URL = `${BASE_URL}/api`;


if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      username: registerForm.username.value,
      email: registerForm.email.value,
      password: registerForm.password.value,
      role: registerForm.role?.value || 'user'
    };

    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    alert(result.message);
        if (res.ok) {
        const role = result.user?.role;
        if (role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        }
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading screen
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const data = {
      username: loginForm.username.value,
      password: loginForm.password.value,
    };

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await res.json();
      alert(result.message);

      if (res.ok) {
        const role = result.user?.role;

        // Wait 25 seconds before redirecting
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }, 3000); // 10 seconds
      } else {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      alert('Login failed. Try again.');
    }
  });
}


console.log("auth.js loaded");
