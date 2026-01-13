import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const { rows: stuckPayments } = await db.query(
      `
      SELECT id
      FROM payments
      WHERE status != 'completed'
        AND updated_at < NOW() - INTERVAL '5 minutes'
      `
    );

    let created = 0;

    for (const payment of stuckPayments) {
      const { rows: existing } = await db.query(
        `
        SELECT 1
        FROM alerts
        WHERE payment_id = $1
          AND resolved = false
        `,
        [payment.id]
      );

      if (existing.length > 0) continue;

      await db.query(
        `
        INSERT INTO alerts (payment_id, type, message)
        VALUES ($1, 'stuck_payment', 'Payment stuck for more than 5 minutes')
        `,
        [payment.id]
      );

      created++;
    }

    return NextResponse.json({
      scanned: stuckPayments.length,
      alertsCreated: created,
    });
  } catch (error) {
    console.error("Alert generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate alerts" },
      { status: 500 }
    );
  }
}
