const { chromium } = require('playwright');
require('dotenv').config();

const { baixarEExtrairAsim } = require('./assim/baixar_e_extrair');
const loginOrbita = require('./orbita/loginOrbita');
const preencherOrbita = require('./orbita/preencher_formulario');
const config = require('./config');

function formatarTempo(ms) {
  const totalSegundos = Math.floor(ms / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  const milissegundos = ms % 1000;

  return `${minutos}min ${segundos}s ${milissegundos}ms`;
}

async function executarBot() {
  let browser;
  const inicioTotal = Date.now();

  try {
    console.log('╔═════════════════════════════════════════════════════════════╗');
    console.log('║        🤖 BOT NÚMERO DAS GUIAS - Iniciando Automação        ║');
    console.log('╚═════════════════════════════════════════════════════════════╝\n');

    if (!config.usuarioAssim || !config.senhaAssim) {
      throw new Error('Credenciais ASSIM não configuradas no .env');
    }

    if (!config.orbitaUser || !config.orbitaPass) {
      throw new Error('Credenciais Órbita não configuradas no .env');
    }

    const inicioAsim = Date.now();
    const resultadoAsim = await baixarEExtrairAsim(
      config.usuarioAssim,
      config.senhaAssim
    );
    const tempoAsim = Date.now() - inicioAsim;

    const numero = resultadoAsim.numero;

    if (!numero) {
      throw new Error('Número da guia não foi extraído.');
    }

    console.log(`✓ Número extraído para o Orbita: ${numero}`);
    console.log(`⏱️ Tempo da Assim: ${formatarTempo(tempoAsim)}\n`);

	browser = await chromium.launch({ headless: config.headless });

	const context = await browser.newContext();
	const page = await context.newPage();
    const inicioOrbita = Date.now();
    await loginOrbita(page);
    await preencherOrbita(page, numero);
    const tempoOrbita = Date.now() - inicioOrbita;

    const tempoTotal = Date.now() - inicioTotal;

    console.log(`⏱️ Tempo no Orbita: ${formatarTempo(tempoOrbita)}`);
    console.log(`⏱️ Tempo total da execução: ${formatarTempo(tempoTotal)}`);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        ✅ BOT EXECUTADO COM SUCESSO!                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    const tempoTotal = Date.now() - inicioTotal;

    console.log(`⏱️ Tempo total até a falha: ${formatarTempo(tempoTotal)}`);

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                       ❌ BOT FALHOU!                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.error('Erro:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

executarBot();