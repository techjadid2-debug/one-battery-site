import { sessionCookie, verifySessionToken } from "../../../../lib/game-auth";
import { getGameUser } from "../../../../lib/game-db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token?: string };
    const token = body.token?.trim() ?? "";
    if (!token) {
      return Response.json({ error: "Token is required" }, { status: 400 });
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const user = await getGameUser(session.sub);
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(
      { ok: true, user },
      {
        headers: {
          "Set-Cookie": sessionCookie(token),
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Token auth failed" }, { status: 500 });
  }
}
