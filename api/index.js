// Ponto de entrada serverless para a Vercel
// A Vercel detecta arquivos em /api e os trata como serverless functions.
// Aqui exportamos o Express app que ela vai encapsular automaticamente.
module.exports = require('../server');
