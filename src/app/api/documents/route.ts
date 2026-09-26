import { NextRequest, NextResponse } from "next/server";
import { getDocuments, createDocument, deleteDocument, updateDocument } from "@/db/queries";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const result = await getDocuments({
    search:     searchParams.get("search")     || undefined,
    department: searchParams.get("department") || undefined,
    status:     searchParams.get("status")     || undefined,
    page:       parseInt(searchParams.get("page")  || "1"),
    limit:      parseInt(searchParams.get("limit") || "50"),
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.type) return NextResponse.json({ error: "name and type required" }, { status: 400 });
    const doc = await createDocument(body);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const result = await deleteDocument(id);
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const body = await req.json();
  const doc  = await updateDocument(id, body);
  return NextResponse.json({ document: doc });
}
