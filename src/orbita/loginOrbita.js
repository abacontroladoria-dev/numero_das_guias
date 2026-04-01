const config = require('../config');

module.exports = async function loginOrbita(page) {
  console.log('📥 [ETAPA 2] Site ÓRBITA');

  await page.goto(config.orbitaUrl, { waitUntil: 'domcontentloaded' });
  await page.fill('input[placeholder*="Usu"]', config.orbitaUser);
  await page.fill('input[placeholder*="Senha"]', config.orbitaPass);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('text=Entrar')
  ]);

  await page.waitForLoadState('networkidle');

  console.log('Login realizado ✅');
};