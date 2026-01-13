import { NextResponse } from "next/server";
import { runProcessor } from "@/lib/processor";

export async function POST() {
  const result = await runProcessor();
  return NextResponse.json(result);
}