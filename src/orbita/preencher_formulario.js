
  ////////////////////////////////// Busca de Elementos //////////////////////////////////

async function findElementPageOrFrame(page, selector) {
  const principal = page.locator(selector);

  if (await principal.count() > 0) {
    return { locator: principal.first(), context: page, origem: 'page' };
  }

  for (const frame of page.frames()) {
    const loc = frame.locator(selector);

    if (await loc.count() > 0) {
      return {
        locator: loc.first(),
        context: frame,
        origem: 'frame',
        frameUrl: frame.url()
      };
    }
  }

  throw new Error(`Não encontrei ${selector} nem na página principal nem nos frames.`);
}

async function findButtonPageOrFrame(page, selectors) {
  for (const selector of selectors) {
    const principal = page.locator(selector);

    if (await principal.count() > 0) {
      return { locator: principal.first(), context: page, origem: 'page', selector };
    }

    for (const frame of page.frames()) {
      const loc = frame.locator(selector);

      if (await loc.count() > 0) {
        return {
          locator: loc.first(),
          context: frame,
          origem: 'frame',
          frameUrl: frame.url(),
          selector
        };
      }
    }
  }

  throw new Error('Não encontrei o botão Gerar números de guia nem na página principal nem nos frames.');
}
////////////////////////////////// FIM - Busca de Elementos //////////////////////////////////
  
  
  
  
  ////////////////////////////////// Exporta a Função //////////////////////////////////

module.exports = async function preencher_formulario(page, numero) {
  
  ////////////////////////////////// Fim - Exporta a Função //////////////////////////////////




  ////////////////////////////////// Navegando na Página //////////////////////////////////

  await page.mouse.move(5, 300);
  await page.waitForTimeout(500);

  const menuTita = page.locator('#nav_list > li:nth-child(2)');
  await menuTita.waitFor({ state: 'visible', timeout: 5000 });
  await menuTita.click();

  await page.waitForTimeout(500);

  const submenuGuia = page.locator('#submenu-item_29 > li:nth-child(6)');
  await submenuGuia.waitFor({ state: 'visible', timeout: 5000 });
  await submenuGuia.click();

  await page.waitForTimeout(500);

  const submenuFaturamento = page.locator('#submenu-item_79 > li:nth-child(1)');
  await submenuFaturamento.waitFor({ state: 'visible', timeout: 5000 });
  await submenuFaturamento.click();

  await page.mouse.move(500, 300);
  await page.waitForTimeout(1000);

  ////////////////////////////////// FIM - Navegando na Página //////////////////////////////////



  ////////////////////////////////// Buscando o campo do número //////////////////////////////////

  const campoNumeroResultado = await findElementPageOrFrame(page, '#numero_inicio');

  const campoNumero = campoNumeroResultado.locator;

  await campoNumero.waitFor({ state: 'attached', timeout: 10000 });
  await campoNumero.scrollIntoViewIfNeeded().catch(() => {});
  await campoNumero.fill(String(numero));

  console.log(`✅ Número preenchido: ${numero}`);

  ////////////////////////////////// FIM - Buscando o campo do número //////////////////////////////////



  ////////////////////////////////// Clicando em "Gerar números de guia" //////////////////////////////////

  const botaoResultado = await findButtonPageOrFrame(page, [
    'button:has-text("Gerar números de guia")',
    'input[type="submit"][value*="Gerar"]',
    'button[type="submit"]',
    'text="Gerar números de guia"'
  ]);

  const botaoGerar = botaoResultado.locator;

  await botaoGerar.waitFor({ state: 'attached', timeout: 10000 });
  await botaoGerar.scrollIntoViewIfNeeded().catch(() => {});
  await botaoGerar.click();

  console.log('✅ Clique em "Gerar números de guia" realizado');

  ////////////////////////////////// FIM - Clicando em Gerar números de guia //////////////////////////////////



  ////////////////////////////////// Buscando mensagem de confirmação //////////////////////////////////

  await page.waitForTimeout(1000);

  const mensagensPossiveis = [
    'text=/sucesso/i',
    'text=/gerado/i',
    'text=/confirm/i',
    'text=/número/i',
    'text=/guia/i'
  ];

  let mensagemEncontrada = null;

  for (const selector of mensagensPossiveis) {
    const principal = page.locator(selector);
    if (await principal.count() > 0) {
      mensagemEncontrada = principal.first();
      break;
    }

    for (const frame of page.frames()) {
      const loc = frame.locator(selector);
      if (await loc.count() > 0) {
        mensagemEncontrada = loc.first();
        break;
      }
    }

    if (mensagemEncontrada) break;
  }

  if (mensagemEncontrada) {
    const texto = await mensagemEncontrada.innerText().catch(() => '');
    console.log(`✅ Mensagem de confirmação encontrada: ${texto}`);
  } else {
    console.log('⚠️ Mensagem de confirmação não encontrada');
  }

  ////////////////////////////////// FIM - Buscando mensagem de confirmação //////////////////////////////////
};