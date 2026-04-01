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

	await page.goto('https://assim.com.br/site/?area=credenciado', {  waitUntil: 'networkidle',  timeout: 60000});
	await page.waitForTimeout(2000);
	
	await page.mouse.click(10, 10); //tira pop-up
	
	await page.waitForTimeout(1000);
	


////////////////////////////////// Fim do acesso a página de Credenciado Médico //////////////////////////////////




////////////////////////////////// Inserindo Usuário e Senha //////////////////////////////////

    console.log('   ⏳ Preenchendo credenciais...');

	const formCredenciado = page.locator('#formCredenciado');

	await formCredenciado.locator('#login').fill(usuario);

	await page.waitForTimeout(500);

	await formCredenciado.locator('#input-senha').fill(senha);

	await page.waitForTimeout(500);

	await formCredenciado.locator('button[type="submit"]').click();
	console.log('   ✓ Acesso realizado.');

	await page.waitForTimeout(1000);

////////////////////////////////// Fim - Usuário e Senha //////////////////////////////////




////////////////////////////////// Navegando Para Download de PDF //////////////////////////////////

	await page.mouse.click(10, 10); //tira pop-up
	
	const frame = page.mainFrame();
	await frame.locator('a, button, [role="button"]').evaluateAll((els) => {
      for (const el of els) {
        const texto = (el.innerText || '').toLowerCase();
        if (texto.includes('padrão tiss') && !texto.includes('guias')) {
          el.click();
          return true;
        }
      }
      return false;
    });
    await page.waitForTimeout(1000);

    await frame.locator('a, button, [role="button"]').evaluateAll((els) => {
      for (const el of els) {
        const texto = (el.innerText || '').toLowerCase();
        if (texto.includes('guias do padrão tiss')) {
          el.click();
          return true;
        }
      }
      return false;
    });

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

    const dataBuffer = fs.readFileSync(caminhoArquivo);

    const data = await pdfParse(dataBuffer);

	console.log('   ⏳ Extraindo número...');

	const linhas = data.text
	  .split(/\r?\n/)
	  .map(l => l.trim())
	  .filter(l => l);

	console.log('   🔎 Linhas extraídas do PDF:', linhas);

	const match = data.text.match(/\b\d{8}\b/);

	if (!match) {
	  throw new Error('Não foi possível extrair o número da guia.');
	}

	const numero = match[0];

	return { numero, caminhoArquivo };

////////////////////////////////// FIM - Leitura PDF - Extração do Código Numérico //////////////////////////////////
  
  }catch (error) {

    console.error('❌ Erro na Etapa 1:', error.message);

    throw error;

  } finally {

    if (browser) {
      await browser.close();
    }
  }
}
	module.exports = { baixarEExtrairAsim };