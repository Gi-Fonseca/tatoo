document.addEventListener('DOMContentLoaded', async () => {
  await ensureDatabase();
  if (sessionIsValid()) location.href = 'principal.html';
  document.getElementById('loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const error = document.getElementById('loginError'); error.textContent = '';
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const db = await getDb();
    const passwordHash = await digest(password);
    const user = db.users.find(item => item.email.toLowerCase() === email && item.passwordHash === passwordHash);
    if (!user) { error.textContent = 'E-mail ou senha inválidos. Tente novamente.'; return; }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: crypto.randomUUID(), userId: user.id, name: user.name, role: user.role, expiresAt: Date.now() + 30 * 60 * 1000 }));
    location.href = 'principal.html';
  });
});
