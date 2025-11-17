import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { errorResponse } from "./api-response";

/**
 * Requires authentication for the current request.
 * Returns an error response if the user is not authenticated.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      errorResponse("Authentication required", "You must be logged in to perform this action"),
      { status: 401 }
    );
  }

  return null;
}

/**
 * Gets the current session or null if not authenticated
 */
export async function getSession() {
  return await auth();
}
