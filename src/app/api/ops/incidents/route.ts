import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { rows } = await db.query(`
    SELECT
      i.id,
      i.level,
      i.status,
      i.reason,
      i.created_at,
      i.escalated_at,
      p.id AS payment_id,
      p.status AS payment_status
    FROM incidents i
    JOIN payments p ON p.id = i.payment_id
    ORDER BY i.created_at DESC
  `);

  return NextResponse.json(rows);
}
