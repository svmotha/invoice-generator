import { NextResponse } from "next/server";
import { z } from "zod";
import { settingsSchema } from "@/lib/schema";
import { getSettings, saveSettings } from "@/lib/storage";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: z.treeifyError(parsed.error) },
      { status: 422 }
    );
  }

  const saved = await saveSettings(parsed.data);
  return NextResponse.json(saved);
}
