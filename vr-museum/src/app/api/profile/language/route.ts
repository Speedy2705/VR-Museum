import { z } from "zod";
import { apiSuccess } from "@/lib/api-response";
import { requireUserId } from "@/lib/auth";
import { locales } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { handleRouteError } from "@/lib/route-error";

const schema = z.object({ locale: z.enum(locales) });

export async function PUT(request: Request) {
  try {
    const userId = await requireUserId(request);
    const { locale } = schema.parse(await request.json());
    await prisma.user.update({ where: { id: userId }, data: { locale } });
    return apiSuccess({ locale }, { message: "Language preference saved" });
  } catch (error) {
    return handleRouteError(error, "PUT /api/profile/language");
  }
}
