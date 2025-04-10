// Autenticação e gestão de usuários
export function login(username, password) {
  return username === 'admin' && password === 'password';
}

export function logout() {
  return 'User logged out';
}