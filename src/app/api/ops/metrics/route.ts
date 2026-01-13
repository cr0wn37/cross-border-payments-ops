import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const totalResult = await db.query(`
      SELECT COUNT(*) FROM payments
      WHERE created_at::date = CURRENT_DATE
    `);

    const statusResult = await db.query(`
      SELECT status, COUNT(*) 
      FROM payments
      GROUP BY status
    `);

    const avgTimeResult = await db.query(`
      SELECT AVG(completed_at - created_at) AS avg_processing_time
      FROM payments
      WHERE status = 'completed'
    `);

    const stuckResult = await db.query(`
      SELECT COUNT(*) 
      FROM payments
      WHERE status != 'completed'
        AND updated_at < NOW() - INTERVAL '5 minutes'
    `);

    const retryResult = await db.query(`
      SELECT retry_count, COUNT(*)
      FROM payments
      GROUP BY retry_count
      ORDER BY retry_count
    `);

    return NextResponse.json({
      totalToday: Number(totalResult.rows[0].count),
      byStatus: statusResult.rows,
      avgProcessingTime: avgTimeResult.rows[0].avg_processing_time,
      stuckPayments: Number(stuckResult.rows[0].count),
      retryDistribution: retryResult.rows,
    });
  } catch (error) {
    console.error("Metrics error:", error);
    return NextResponse.json(
      { error: "Failed to load metrics" },
      { status: 500 }
    );
  }
}
