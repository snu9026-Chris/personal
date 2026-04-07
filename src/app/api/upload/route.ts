import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from "@/lib/constants";
import { handleApiError, requireUser } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: `파일 크기는 ${MAX_UPLOAD_SIZE_MB}MB 이하여야 합니다.` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "doc"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "Word 파일(.docx, .doc)만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // mammoth 으로 텍스트만 추출 (이미지 무시)
    const textResult = await mammoth.extractRawText({ buffer });

    return NextResponse.json({
      text: textResult.value,
      filename: file.name,
      wordCount: textResult.value.split(/\s+/).filter(Boolean).length,
    });
  } catch (err) {
    return handleApiError(err, "Upload");
  }
}
