import { apiSuccess } from "@/lib/api-response";
import { requirePermission } from "@/lib/auth";
import { handleRouteError } from "@/lib/route-error";
import {
  addCartItemSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "@/lib/validators/cart";
import {
  addCartItem,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/server/services/cart.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return apiSuccess(await getCart((await requirePermission(request, "purchase")).id));
  } catch (error) {
    return handleRouteError(error, "GET /api/cart");
  }
}

export async function POST(request: Request) {
  try {
    const input = addCartItemSchema.parse(await request.json());
    return apiSuccess(
      await addCartItem((await requirePermission(request, "purchase")).id, input),
      {
      message: "Item added to cart",
      status: 201,
      },
    );
  } catch (error) {
    return handleRouteError(error, "POST /api/cart");
  }
}

export async function PATCH(request: Request) {
  try {
    const input = updateCartItemSchema.parse(await request.json());
    return apiSuccess(
      await updateCartItem(
        (await requirePermission(request, "purchase")).id,
        input,
      ),
      { message: "Cart item updated" },
    );
  } catch (error) {
    return handleRouteError(error, "PATCH /api/cart");
  }
}

export async function DELETE(request: Request) {
  try {
    const input = removeCartItemSchema.parse(await request.json());
    return apiSuccess(
      await removeCartItem(
        (await requirePermission(request, "purchase")).id,
        input.itemId,
      ),
      { message: "Cart item removed" },
    );
  } catch (error) {
    return handleRouteError(error, "DELETE /api/cart");
  }
}
