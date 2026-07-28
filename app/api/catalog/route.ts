import { catalog } from "../../../lib/catalog";

export async function GET() {
  return Response.json({ items: catalog }, { headers: { "cache-control": "public, max-age=300" } });
}
