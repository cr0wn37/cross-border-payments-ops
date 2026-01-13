import { db } from "@/lib/db";

const MAX_RETRIES = 2;
const STUCK_MINUTES = 10;
const ESCALATION_MINUTES = 15;

async function guardedTransition(
  paymentId: string,
  fromStatus: string,
  toStatus: string,
  failureReason: string | null = null
) {
  const result = await db.query(
    `
    UPDATE payments
    SET
      status = $2,
      failure_reason = $3,
      updated_at = now()
    WHERE id = $1 AND status = $4
    RETURNING id
    `,
    [paymentId, toStatus, failureReason, fromStatus]
  );

  if (result.rowCount === 0) return false;

  await db.query(
    `
    INSERT INTO payment_events (
      payment_id,
      previous_status,
      new_status,
      event_type
    )
    VALUES ($1, $2, $3, $4)
    `,
    [
      paymentId,
      fromStatus,
      toStatus,
      failureReason ?? "processing_success",
    ]
  );

  return true;
}

export async function runProcessor() {
  console.log("🚀 Processor started");

  try {
    /* 1️⃣ Create stuck-payment alerts */
    await db.query(
      `
      INSERT INTO alerts (payment_id, type, message, resolved)
      SELECT
        id,
        'payment_stuck',
        'Payment has been stuck in initiated state',
        false
      FROM payments
      WHERE
        status = 'initiated'
        AND updated_at < now() - interval '${STUCK_MINUTES} minutes'
        AND NOT EXISTS (
          SELECT 1 FROM alerts
          WHERE alerts.payment_id = payments.id
            AND alerts.resolved = false
        )
      `
    );

    /* 2️⃣ Escalate incidents (L1 → L2) */
    await db.query(
      `
      UPDATE incidents
      SET level = 'L2', escalated_at = now()
      WHERE
        level = 'L1'
        AND status = 'open'
        AND created_at < now() - interval '${ESCALATION_MINUTES} minutes'
      `
    );

    /* 3️⃣ Fetch initiated payments */
    const { rows: payments } = await db.query(
      `
      SELECT *
      FROM payments
      WHERE status = 'initiated'
      ORDER BY updated_at ASC
      LIMIT 10
      `
    );

    let processed = 0;

    for (const payment of payments) {
      /* Compliance-style failure */
      if (Math.random() < 0.1) {
        const ok = await guardedTransition(
          payment.id,
          "initiated",
          "failed",
          "compliance_hold"
        );

        if (ok) {
          processed++;

          if (payment.retry_count < MAX_RETRIES) {
            await db.query(
              `
              INSERT INTO alerts (payment_id, type, message, resolved)
              VALUES ($1, 'payment_failed', 'Payment failed but retries are available', false)
              ON CONFLICT DO NOTHING
              `,
              [payment.id]
            );
          }
        }

        continue;
      }

      /* Processing failure */
      if (Math.random() < 0.2 && payment.retry_count < MAX_RETRIES) {
        const ok = await guardedTransition(
          payment.id,
          "initiated",
          "failed",
          "fx_error"
        );

        if (ok) {
          processed++;

          await db.query(
            `
            INSERT INTO alerts (payment_id, type, message, resolved)
            VALUES ($1, 'payment_failed', 'Payment failed but retries are available', false)
            ON CONFLICT DO NOTHING
            `,
            [payment.id]
          );
        }

        continue;
      }

      /* Success */
      const ok = await guardedTransition(
        payment.id,
        "initiated",
        "completed"
      );

      if (ok) {
        processed++;

        await db.query(
          `
          UPDATE alerts
          SET resolved = true
          WHERE payment_id = $1 AND resolved = false
          `,
          [payment.id]
        );
      }
    }

    return { processed };
  } catch (err) {
    console.error("🔥 PROCESSOR CRASH:", err);
    throw err;
  }
}
