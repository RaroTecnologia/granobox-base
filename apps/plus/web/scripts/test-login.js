const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
  try {
    console.log('🧪 Testando login...\n');

    // Teste 1: Login com usuário de organização
    console.log('1️⃣ Testando login com usuário de organização (joao@padaria.com)...');
    
    const response1 = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'joao@padaria.com',
        password: 'joao123',
        dominio: 'joao',
        callbackUrl: '/',
        json: 'true'
      })
    });

    const result1 = await response1.json();
    console.log('Resultado:', result1);

    // Teste 2: Login com admin do sistema
    console.log('\n2️⃣ Testando login com admin do sistema (tiagomlevorato@gmail.com)...');
    
    const response2 = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'tiagomlevorato@gmail.com',
        password: 'admin123',
        dominio: 'admin',
        callbackUrl: '/',
        json: 'true'
      })
    });

    const result2 = await response2.json();
    console.log('Resultado:', result2);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testLogin(); 