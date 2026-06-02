const config = require('../config');

module.exports = async function loginOrbita(page) {
  console.log('📥 [ETAPA 2] Site ÓRBITA');

  await page.goto(config.orbitaUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.fill('input[placeholder*="Usu"]', config.orbitaUser);
  await page.fill('input[placeholder*="Senha"]', config.orbitaPass);

  // CORREÇÃO: elimina o waitForNavigation (race condition).
  // Clica e depois aguarda o DOM estabilizar — padrão correto no Playwright moderno.
  await page.click('text=Entrar');
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 });

  console.log('Login realizado ✅');
};
