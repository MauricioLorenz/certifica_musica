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
// IMPORTANTE: No Vercel (serverless), o body pode chegar já parseado.
// Tentamos usar req.rawBody (definido no server.js via express.raw),
// com fallback para req.body caso seja Buffer ou string.
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  // Resolve o raw body para verificação da assinatura Stripe
  let rawBody = req.rawBody;

  if (!rawBody && req.body) {
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      rawBody = Buffer.from(req.body, 'utf-8');
    } else {
      // Última opção: re-serializa o JSON (perde a assinatura — loga o aviso)
      try {
        rawBody = Buffer.from(JSON.stringify(req.body), 'utf-8');
        console.warn('⚠️ Webhook: rawBody não disponível, usando JSON.stringify como fallback. A assinatura pode falhar.');
      } catch (_) {
        rawBody = Buffer.from('', 'utf-8');
      }
    }
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
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
