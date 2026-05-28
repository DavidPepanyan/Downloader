import { fail } from "@/lib/utils/response";

export async function POST() {
  return fail(
    "METHOD_NOT_ALLOWED",
    "Image conversion is not implemented yet. Use /api/video endpoints for now.",
    501
  );
}

export function GET() {
  return fail("METHOD_NOT_ALLOWED", "Use POST /api/image/convert.", 405);
}
