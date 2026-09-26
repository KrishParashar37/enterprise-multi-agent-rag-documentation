import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validTypes = ["pdf", "docx", "txt", "md", "csv"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!validTypes.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${ext}". Allowed: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 50MB" }, { status: 400 });
    }

    // Save to /tmp/uploads (works without DB)
    const uploadDir = path.join(process.cwd(), "tmp", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const fileName  = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath  = path.join(uploadDir, fileName);
    const bytes     = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(bytes));

    // Try to save record in DB
    const typeMap: Record<string, string> = { pdf:"PDF", docx:"DOCX", txt:"TXT", md:"MD", csv:"CSV" };
    const docType = typeMap[ext] || "TXT";

    try {
      const { db } = await import("@/db");
      if (db) {
        const { documents } = await import("@/db/schema");
        const [doc] = await db.insert(documents).values({
          name:         file.name,
          originalName: file.name,
          type:         docType as any,
          storagePath:  filePath,
          fileSize:     file.size,
          status:       "PROCESSING",
          tags:         [],
        }).returning();

        return NextResponse.json({
          success: true,
          document: {
            id:     doc.id,
            name:   doc.name,
            type:   doc.type,
            size:   file.size,
            status: "PROCESSING",
          }
        }, { status: 201 });
      }
    } catch {
      // DB not available — still return success (file saved to disk)
    }

    return NextResponse.json({
      success: true,
      document: {
        id:     `doc-${Date.now()}`,
        name:   file.name,
        type:   docType,
        size:   file.size,
        status: "PROCESSING",
        path:   filePath,
      }
    }, { status: 201 });

  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
