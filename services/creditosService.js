const { client } = require('../db/turso');

/**
 * Retorna o saldo atual do usuário (0 se não houver linha).
 */
async function getSaldo(usuarioId) {
  const r = await client.execute({
    sql: 'SELECT saldo FROM creditos_usuarios WHERE usuario_id = ?',
    args: [usuarioId],
  });
  return r.rows.length ? Number(r.rows[0].saldo) : 0;
}

/**
 * Adiciona créditos ao usuário.
 * - tipo: 'compra' | 'voucher'
 * - referencia: paymentIntentId ou código do voucher
 * Usa INSERT OR IGNORE para que a constraint UNIQUE em transacoes_creditos(referencia)
 * previna dupla contabilização em caso de retry do webhook.
 */
async function adicionarCreditos(usuarioId, quantidade, tipo, referencia) {
  const agora = new Date().toISOString();
  const txId = `TC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  await client.batch(
    [
      {
        sql: `INSERT INTO creditos_usuarios (usuario_id, saldo, atualizadoEm)
              VALUES (?, ?, ?)
              ON CONFLICT(usuario_id)
              DO UPDATE SET saldo = saldo + ?, atualizadoEm = ?`,
        args: [usuarioId, quantidade, agora, quantidade, agora],
      },
      {
        sql: `INSERT OR IGNORE INTO transacoes_creditos
                (id, usuario_id, tipo, quantidade, referencia, criadoEm)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [txId, usuarioId, tipo, quantidade, referencia, agora],
      },
    ],
    'write'
  );
}

/**
 * Consome 1 crédito do usuário para uma certificação.
 * O WHERE com AND saldo >= 1 é o guard contra race conditions —
 * apenas uma das requisições simultâneas afetará a linha.
 */
async function consumirCredito(usuarioId, musicaId) {
  const agora = new Date().toISOString();
  const txId = `TC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Leitura prévia para retornar erro amigável
  const saldo = await getSaldo(usuarioId);
  if (saldo < 1) throw new Error('Saldo insuficiente');

  const result = await client.execute({
    sql: `UPDATE creditos_usuarios
          SET saldo = saldo - 1, atualizadoEm = ?
          WHERE usuario_id = ? AND saldo >= 1`,
    args: [agora, usuarioId],
  });

  // rowsAffected === 0 significa que outra requisição ganhou a corrida
  if (result.rowsAffected === 0) throw new Error('Saldo insuficiente');

  await client.execute({
    sql: `INSERT INTO transacoes_creditos
            (id, usuario_id, tipo, quantidade, referencia, criadoEm)
          VALUES (?, ?, 'uso', -1, ?, ?)`,
    args: [txId, usuarioId, musicaId, agora],
  });
}

/**
 * Retorna o histórico de movimentações do usuário (últimas 50).
 */
async function getHistorico(usuarioId) {
  const r = await client.execute({
    sql: `SELECT id, tipo, quantidade, referencia, criadoEm
          FROM transacoes_creditos
          WHERE usuario_id = ?
          ORDER BY criadoEm DESC
          LIMIT 50`,
    args: [usuarioId],
  });
  return r.rows;
}

module.exports = { getSaldo, adicionarCreditos, consumirCredito, getHistorico };
