import { NextResponse } from "next/server";

type SuccessOptions = {
  message?: string;
  status?: number;
};

type ErrorOptions = {
  code?: string;
  details?: unknown;
  status?: number;
};

export function apiSuccess<T>(data: T, options: SuccessOptions = {}) {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(options.message ? { message: options.message } : {}),
    },
    { status: options.status ?? 200 },
  );
}

export function apiError(message: string, options: ErrorOptions = {}) {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        message,
        ...(options.code ? { code: options.code } : {}),
        ...(options.details === undefined
          ? {}
          : { details: options.details }),
      },
    },
    { status: options.status ?? 500 },
  );
}
