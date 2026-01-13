import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { rows } = await db.query(`
    SELECT
      id,
      type,
      payment_id,
      triggered_at,
      resolved
    FROM alerts
    ORDER BY triggered_at DESC
    LIMIT 50
  `);

  return NextResponse.json(rows);
}
