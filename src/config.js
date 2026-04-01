require('dotenv').config();

module.exports = {
  usuarioAssim: process.env.USUARIO_ASSIM,
  senhaAssim: process.env.SENHA_ASSIM,
  orbitaUser: process.env.ORBITA_USER,
  orbitaPass: process.env.ORBITA_PASS,
  orbitaUrl: process.env.ORBITA_URL,
  headless: process.env.HEADLESS === 'false'
};