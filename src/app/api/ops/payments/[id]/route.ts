import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runProcessor } from "@/lib/processor";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await context.params;
    const action = req.nextUrl.searchParams.get("action");

    if (!action) {
      return NextResponse.json(
        { error: "Missing action" },
        { status: 400 }
      );
    }

    // Fetch current payment state
    const { rows } = await db.query(
      `SELECT status, retry_count FROM payments WHERE id = $1`,
      [paymentId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const payment = rows[0];

    /* ---------------- RETRY ---------------- */
    if (action === "retry") {
      if (payment.status !== "failed") {
        return NextResponse.json(
          { error: "Retry allowed only for failed payments" },
          { status: 400 }
        );
      }

      await db.query(
        `
        UPDATE payments
        SET
          status = 'initiated',
          retry_count = retry_count + 1,
          failure_reason = NULL,
          updated_at = now()
        WHERE id = $1
        `,
        [paymentId]
      );

      await db.query(
        `
        INSERT INTO payment_events (
          payment_id,
          previous_status,
          new_status,
          event_type
        )
        VALUES ($1, 'failed', 'initiated', 'manual_retry')
        `,
        [paymentId]
      );

      await runProcessor();

      return NextResponse.json({
        message: "Retry initiated",
        paymentId,
      });
    }

    /* ---------------- CANCEL ---------------- */
    if (action === "cancel") {
      if (payment.status === "completed") {
        return NextResponse.json(
          { error: "Cannot cancel completed payment" },
          { status: 400 }
        );
      }

      await db.query(
        `
        UPDATE payments
        SET
          status = 'failed',
          failure_reason = 'cancelled_by_ops',
          updated_at = now()
        WHERE id = $1
        `,
        [paymentId]
      );

      await db.query(
        `
        INSERT INTO payment_events (
          payment_id,
          previous_status,
          new_status,
          event_type
        )
        VALUES ($1, $2, 'failed', 'manual_cancel')
        `,
        [paymentId, payment.status]
      );

      return NextResponse.json({
        message: "Payment cancelled",
        paymentId,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("OPS ACTION ERROR:", err);
    return NextResponse.json(
      { error: "Ops action failed" },
      { status: 500 }
    );
  }
}
