import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  // Resolve the incident
  const result = await db.query(
    `
    UPDATE incidents
    SET
      status = 'resolved',
      resolved_at = now()
    WHERE id = $1 AND status != 'resolved'
    RETURNING payment_id
    `,
    [id]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { error: "Incident not found or already resolved" },
      { status: 404 }
    );
  }

  const paymentId = result.rows[0].payment_id;

  // Log audit event
  await db.query(
    `
    INSERT INTO payment_events (
      payment_id,
      previous_status,
      new_status,
      event_type
    )
    VALUES ($1, 'failed', 'failed', 'incident_resolved')
    `,
    [paymentId]
  );

  return NextResponse.json({
    message: "Incident resolved",
    incidentId: id,
  });
}
