import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const { rows } = await db.query(`
    SELECT
      id,
      status,
      retry_count,
      updated_at
    FROM payments
    ORDER BY updated_at DESC
    LIMIT 50
  `);

  return NextResponse.json(rows);
}
