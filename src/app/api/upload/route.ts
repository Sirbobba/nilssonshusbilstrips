import { NextResponse } from "next/server";

// TODO: Bilduppladdning — implementeras när UI:t är klart.
// Firebase Storage-integrationen läggs till här då.
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "Bilduppladdning är inte implementerat ännu." },
    { status: 501 }
  );
}
