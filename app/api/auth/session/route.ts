import { sessionCookie, verifySessionToken } from "../../../../lib/game-auth";
import { getGameUser } from "../../../../lib/game-db";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("auth")?.trim() ?? "";
    const nextPath = url.searchParams.get("next")?.trim() || "/profile";

    if (!token) {
      return Response.redirect(new URL("/play", request.url), 302);
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return Response.redirect(new URL("/play?error=invalid_token", request.url), 302);
    }

    const user = await getGameUser(session.sub);
    if (!user) {
      return Response.redirect(new URL("/play?error=user_not_found", request.url), 302);
    }

    // Redirect to destination with authenticated session cookie
    const targetUrl = new URL(nextPath, request.url);
    return new Response(null, {
      status: 302,
      headers: {
        Location: targetUrl.toString(),
        "Set-Cookie": sessionCookie(token),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return Response.redirect(new URL("/play", request.url), 302);
  }
}
