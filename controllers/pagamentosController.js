const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const creditosService = require('../services/creditosService');

// POST /api/pagamentos/criar-intencao
exports.criarIntencao = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const idempotencyKey = `pi_${usuarioId}_${Date.now()}`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: 4000, // R$40,00 em centavos
        currency: 'brl',
        metadata: {
          usuario_id: usuarioId,
          tipo: 'compra_credito',
          quantidade: '1',
        },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    );

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('❌ Erro ao criar PaymentIntent:', err.message);
    res.status(500).json({ erro: err.message });
  }
};

// POST /api/pagamentos/webhook
// IMPORTANTE: esta rota recebe raw body (configurado no server.js antes do express.json)
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Falha na verificação do webhook Stripe:', err.message);
    return res.status(400).json({ erro: `Webhook inválido: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;

    if (pi.metadata?.tipo === 'compra_credito') {
      const { usuario_id, quantidade } = pi.metadata;
      try {
        // adicionarCreditos usa INSERT OR IGNORE via índice único (referencia)
        // — retentativas do Stripe não geram crédito duplo
        await creditosService.adicionarCreditos(
          usuario_id,
          parseInt(quantidade || '1', 10),
          'compra',
          pi.id
        );
        console.log(`✅ Crédito adicionado | usuário: ${usuario_id} | pi: ${pi.id}`);
      } catch (err) {
        console.error('❌ Erro ao adicionar crédito pós-pagamento:', err.message);
        return res.status(500).json({ erro: err.message });
      }
    }
  }

  res.json({ received: true });
};
