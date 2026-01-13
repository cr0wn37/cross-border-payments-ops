import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/payments
 * Creates a new payment and logs the creation event
 */
export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get("Idempotency-Key");
    const body = await req.json();

    const {
      senderCountry,
      receiverCountry,
      amount,
      currencyFrom,
      currencyTo,
    } = body;

    // Basic validation
    if (
      !senderCountry ||
      !receiverCountry ||
      !amount ||
      !currencyFrom ||
      !currencyTo
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (idempotencyKey) {
      const { rows } = await db.query(
        `SELECT id, status FROM payments WHERE idempotency_key = $1`,
        [idempotencyKey]
      );

      if (rows.length > 0) {
        return NextResponse.json(rows[0]);
      }
    }

    // Create payment
    const { rows } = await db.query(
      `
      INSERT INTO payments (
        sender_country,
        receiver_country,
        amount,
        currency_from,
        currency_to,
        status,
        retry_count,
        idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, 'initiated', 0, $6)
      RETURNING id, status
      `,
      [
        senderCountry,
        receiverCountry,
        amount,
        currencyFrom,
        currencyTo,
        idempotencyKey,
      ]
    );

    const payment = rows[0];

    // Log creation event
    await db.query(
      `
      INSERT INTO payment_events (
        payment_id,
        previous_status,
        new_status,
        event_type
      )
      VALUES ($1, NULL, 'initiated', 'payment_created')
      `,
      [payment.id]
    );

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
