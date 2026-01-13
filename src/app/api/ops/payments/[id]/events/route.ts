import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { rows } = await db.query(
    `
    SELECT
      event_type,
      previous_status,
      new_status,
      created_at
    FROM payment_events
    WHERE payment_id = $1
    ORDER BY created_at ASC
    `,
    [id]
  );

  return NextResponse.json(rows);
}