const { chromium } = require('playwright');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function getAssimFrame(page) {
  await page.waitForSelector('frame[name="home"]', { timeout: 30000 });
  const frame = page.frame({ name: 'home' });
  if (!frame) {
    throw new Error('Não foi possível acessar o conteúdo do frame "home".');
  }
  return frame;
}

// Fecha modais e banners que o site exibe ao carregar
async function fecharModais(page) {

  // Modal de "Novidade na Área!" — botão × no canto superior direito
  try {
    await page.waitForSelector('.modal .close, button[data-dismiss="modal"]', { timeout: 5000 });
    await page.click('.modal .close, button[data-dismiss="modal"]');
    console.log('   ✓ Modal de novidade fechado.');
  } catch {
    console.log('   ℹ️  Modal de novidade não encontrado.');
  }

  // Banner de cookies — clica em "Rejeitar"
  try {
    await page.waitForSelector('button:has-text("Rejeitar")', { timeout: 5000 });
    await page.click('button:has-text("Rejeitar")');
    console.log('   ✓ Banner de cookies fechado.');
  } catch {
    console.log('   ℹ️  Banner de cookies não encontrado.');
  }

  // Botão de chat flutuante (ícone × no canto direito da tela)
  try {
    await page.waitForSelector('.chat-close, [class*="close"][class*="chat"]', { timeout: 3000 });
    await page.click('.chat-close, [class*="close"][class*="chat"]');
    console.log('   ✓ Widget de chat fechado.');
  } catch {
    // Silencioso — esse elemento nem sempre aparece
  }
}

async function baixarEExtrairAsim(usuario, senha) {
  let browser;
  try {
    console.log('📥 [ETAPA 1] Site ASSIM');

    browser = await chromium.launch({
      headless: config.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 60000
    });

    const context = await browser.newContext({
      acceptDownloads: true
    });

    const page = await context.newPage();

    const downloadPath = path.join(__dirname, '..', '..', '.temp');

    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    ////////////////////////////////// Acessando a página de Credenciado Médico //////////////////////////////////

    console.log('   ⏳ Acessando a página de Credenciado Médico...');

    // CORREÇÃO: trocado 'networkidle' por 'domcontentloaded'.
    // 'networkidle' exige 500ms sem nenhuma requisição em rede — impossível neste site,
    // que dispara modais, analytics e rastreadores continuamente, causando timeout de 60s.
    await page.goto('https://assim.com.br/site/?area=credenciado', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // CORREÇÃO: aguarda o formulário existir no DOM antes de prosseguir,
    // em vez de usar waitForTimeout com tempo fixo (que pode ser curto ou longo demais).
    await page.waitForSelector('#formCredenciado', { timeout: 30000 });

    // CORREÇÃO: fecha modais de forma explícita e tolerante a falhas,
    // em vez de mouse.click(10, 10) que não fecha nenhum dos modais reais do site.
    await fecharModais(page);

    ////////////////////////////////// Fim do acesso a página de Credenciado Médico //////////////////////////////////

    ////////////////////////////////// Inserindo Usuário e Senha //////////////////////////////////

    console.log('   ⏳ Preenchendo credenciais...');

    const formCredenciado = page.locator('#formCredenciado');

    await formCredenciado.locator('#login').fill(usuario);
    await formCredenciado.locator('#input-senha').fill(senha);
    await formCredenciado.locator('button[type="submit"]').click();

    console.log('   ✓ Acesso realizado.');

    ////////////////////////////////// Fim - Usuário e Senha //////////////////////////////////

    ////////////////////////////////// Navegando Para Download de PDF //////////////////////////////////

    // Aguarda a página pós-login estabilizar (DOM carregado)
    await page.waitForLoadState('domcontentloaded');

    // Fecha modais que possam ter aparecido após o login
    await fecharModais(page);

    const frame = page.mainFrame();

    // Clica no menu "Padrão TISS" (excluindo itens que contenham "guias")
    const clicouTiss = await frame.locator('a, button, [role="button"]').evaluateAll((els) => {
      for (const el of els) {
        const texto = (el.innerText || '').toLowerCase();
        if (texto.includes('padrão tiss') && !texto.includes('guias')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (!clicouTiss) {
      throw new Error('Não foi possível encontrar o menu "Padrão TISS".');
    }

    await page.waitForTimeout(1000);

    // Clica no submenu "Guias do Padrão TISS"
    const clicouGuias = await frame.locator('a, button, [role="button"]').evaluateAll((els) => {
      for (const el of els) {
        const texto = (el.innerText || '').toLowerCase();
        if (texto.includes('guias do padrão tiss')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (!clicouGuias) {
      throw new Error('Não foi possível encontrar o submenu "Guias do Padrão TISS".');
    }

    await page.waitForTimeout(3000);

    ////////////////////////////////// FIM - Navegando Para Download de PDF //////////////////////////////////

    //////////////////////////////////// Download de PDF com 20 Guias ////////////////////////////////////

    console.log('   ⏳ Selecionando guia...');
    await frame.selectOption('select[name="guia"]', '11017_guia_de_sp_sadt');

    console.log('   ⏳ Preenchendo quantidade...');
    await frame.locator('input[name="qtd"]').fill('20');

    console.log('   ⏳ Gerando e baixando PDF...');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      frame.locator('button.btn-vermelho[type="submit"]').click()
    ]);

    const caminhoArquivo = path.join(downloadPath, download.suggestedFilename());
    await download.saveAs(caminhoArquivo);
    console.log('   ✓ PDF baixado com sucesso.');

    ////////////////////////////////// FIM - Download de PDF com 20 Guias //////////////////////////////////

    ////////////////////////////////// Leitura PDF - Extração do Código Numérico //////////////////////////////////

    console.log('   ⏳ Lendo arquivo PDF...');
    const dataBuffer = fs
