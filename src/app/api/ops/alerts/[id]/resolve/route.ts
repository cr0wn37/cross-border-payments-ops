import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alertId } = await context.params;

    const result = await db.query(
      `
      UPDATE alerts
      SET resolved = true,
          resolved_at = now()
      WHERE id = $1
      RETURNING id
      `,
      [alertId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Alert resolved",
      alertId,
    });
  } catch (error) {
    console.error("Resolve alert error:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}
