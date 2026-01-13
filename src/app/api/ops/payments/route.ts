import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runProcessor } from "@/lib/processor";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const paymentId = searchParams.get("id");
    const action = searchParams.get("action");

    if (!paymentId || !action) {
      return NextResponse.json(
        { error: "Missing id or action" },
        { status: 400 }
      );
    }

    let newStatus: string | null = null;
    let failureReason: string | null = null;
    let eventType = "";

    if (action === "retry") {
    await db.query(`
      UPDATE payments
      SET
        status = 'initiated',
        retry_count = retry_count + 1,
        failure_reason = NULL,
        updated_at = now()
      WHERE id = $1
    `, [paymentId]);

    await db.query(`
      INSERT INTO payment_events (
        payment_id,
        previous_status,
        new_status,
        event_type
      )
      VALUES ($1, 'failed', 'initiated', 'manual_retry')
    `, [paymentId]);

    // ✅ DIRECT CALL — NO HTTP
    await runProcessor();

    return NextResponse.json({
      message: "Retry processed",
      paymentId,
    });
  }
    if (action === "force_complete") {
      newStatus = "completed";
      eventType = "force_completed";
    }

    if (action === "cancel") {
      newStatus = "failed";
      failureReason = "cancelled_by_ops";
      eventType = "cancelled_by_ops";
    }

    if (!newStatus) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const { rows } = await db.query(
      "SELECT status FROM payments WHERE id = $1",
      [paymentId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    const previousStatus = rows[0].status;

    await db.query(
      `
      UPDATE payments
      SET status = $1,
          failure_reason = $2,
          completed_at = CASE WHEN $1 = 'completed' THEN now() ELSE completed_at END
      WHERE id = $3
      `,
      [newStatus, failureReason, paymentId]
    );

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
      [paymentId, previousStatus, newStatus, eventType]
    );

    return NextResponse.json({
      message: "Action applied",
      paymentId,
      action,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Ops action failed" },
      { status: 500 }
    );
  }
}
