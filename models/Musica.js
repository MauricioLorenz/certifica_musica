const mongoose = require('mongoose');

const autorSchema = new mongoose.Schema({
  tipoPessoa: { type: String, enum: ['Física', 'Jurídica'], default: 'Física' },
  nomeCompleto: { type: String, required: true },
  cpfCnpj: { type: String },
  rg: { type: String },
  rgOrgao: { type: String },
  dataNascimento: { type: String },
  naturalidade: { type: String },
  pseudonimo: { type: String },
  ocupacao: { type: String },
  endereco: { type: String },
  menorIdade: { type: Boolean, default: false },
  representante: {
    nome: String,
    rg: String,
    rgOrgao: String,
    cpf: String,
    parentesco: String,
  }
}, { _id: false });

const musicaSchema = new mongoose.Schema({
  id: { type: String, unique: true },

  // Dados da Obra
  titulo: { type: String, required: true },
  genero: { type: String, default: 'Música' },
  estadoObra: { type: String, enum: ['Inédita', 'Publicada'], default: 'Inédita' },
  totalPaginas: { type: Number },
  tipoComposicao: { type: String, enum: ['Obra original', 'Adaptação', 'Tradução', 'Ambas'] },
  coletanea: { type: Boolean, default: false },

  // Autores
  autores: [autorSchema],

  // Arquivos (caminhos ou CIDs)
  arquivoObra: { type: String },
  arquivoIdentidade: { type: String },
  arquivoComplementar: { type: String },
  descricaoComplementar: { type: String },

  // Serviço e Pagamento
  tipoServico: { type: String, default: 'Registro Simples' },
  formaPagamento: { type: String, enum: ['PIX', 'Cartão de Crédito', 'Boleto/GRU'] },

  // Blockchain
  cid: { type: String },
  txHash: { type: String },
  status: { type: String, default: 'Pendente' },

  // Termos
  termoAceito: { type: Boolean, default: false },

}, { timestamps: { createdAt: 'criadoEm', updatedAt: 'atualizadoEm' } });

module.exports = mongoose.model('Musica', musicaSchema);
