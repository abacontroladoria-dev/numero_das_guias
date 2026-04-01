# 🤖 Número das Guias Bot

Automação em **Node.js + Playwright** para:

- acessar a **ASSIM**
- baixar o PDF de guias
- extrair o número da guia
- acessar o sistema **Órbita**
- preencher automaticamente o formulário
- gerar os números de guia
- registrar tempos de execução para acompanhamento

---

## 📋 Requisitos

- Node.js 18 ou superior
- npm
- Credenciais de acesso aos sistemas
- Navegador suportado pelo Playwright

---

## 📁 Estrutura do projeto
```bash
numero_de_guias/
├── src/
│   ├── config.js
│   ├── main.js
│   ├── assim/
│   │   └── baixar_e_extrair.js
│   └── orbita/
│       ├── loginOrbita.js
│       └── preencher_formulario.js
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md