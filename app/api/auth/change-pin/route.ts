import { NextResponse } from "next/server";
import { isAuthenticated, verifyPin, updateAdminPin } from "@/lib/auth";

export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || typeof currentPin !== "string") {
      return NextResponse.json(
        { error: "Current passcode is required." },
        { status: 400 }
      );
    }

    const isCurrentValid = await verifyPin(currentPin);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current passcode is incorrect." },
        { status: 401 }
      );
    }

    if (
      !newPin ||
      typeof newPin !== "string" ||
      newPin.length !== 6 ||
      !/^\d{6}$/.test(newPin)
    ) {
      return NextResponse.json(
        { error: "New passcode must be exactly 6 numeric digits." },
        { status: 400 }
      );
    }

    if (currentPin.trim() === newPin.trim()) {
      return NextResponse.json(
        { error: "New passcode cannot be the same as your current passcode." },
        { status: 400 }
      );
    }

    const success = await updateAdminPin(newPin);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update passcode in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin passcode successfully updated in database!",
    });
  } catch (error: any) {
    console.error("Change PIN error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

