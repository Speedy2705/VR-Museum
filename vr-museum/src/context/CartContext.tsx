"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { notifyError } from "@/lib/client-error";
import { museumToast } from "@/lib/museum-toast";

export type CartItem = {
  cartItemId?: string;
  listingId: string;
  slug: string;
  title: string;
  artist: string;
  material: string;
  license: string;
  price: number;
  image?: string;
  quantity: number;
};

type AddCartItem = Omit<CartItem, "cartItemId" | "quantity">;

type CartContextValue = {
  items: CartItem[];
  addItem: (item: AddCartItem) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
  isInCart: (slug: string) => boolean;
  count: number;
  subtotal: number;
  loading: boolean;
  isAuthenticated: boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

type ApiCartItem = {
  id: string;
  quantity: number;
  listing: {
    id: string;
    price: string;
    artifact: {
      slug: string;
      title: string;
      subtitle: string;
      image: string;
    };
    seller: { name: string | null };
  };
};

function fromApi(item: ApiCartItem): CartItem {
  const [, material = "Artifact"] = item.listing.artifact.subtitle.split(" · ");
  return {
    cartItemId: item.id,
    listingId: item.listing.id,
    slug: item.listing.artifact.slug,
    title: item.listing.artifact.title,
    artist: item.listing.seller.name ?? "Museum Contributor",
    material,
    license: "Digital Artifact License",
    price: Number(item.listing.price),
    image: item.listing.artifact.image,
    quantity: item.quantity,
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = status === "authenticated";

  const loadCart = useCallback(async () => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setItems([]);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/cart");
    const body = (await response.json()) as {
      success: boolean;
      data?: ApiCartItem[];
    };
    setItems(body.success ? (body.data ?? []).map(fromApi) : []);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from session/cart external stores on mount
    loadCart().catch((error) => {
      notifyError(error, "Your cart could not be loaded.");
      setLoading(false);
    });
  }, [loadCart]);

  const addItem = (item: AddCartItem) => {
    if (!isAuthenticated) return;
    if (items.some((current) => current.slug === item.slug)) return;
    const optimistic = { ...item, quantity: 1 };
    setItems((current) => [...current, optimistic]);
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: item.listingId, quantity: 1 }),
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          success: boolean;
          data?: ApiCartItem;
        };
        if (!body.success || !body.data) throw new Error("Cart add failed");
        const persisted = fromApi(body.data);
        setItems((current) =>
          current.map((entry) =>
            entry.slug === item.slug ? persisted : entry,
          ),
        );
        museumToast.success("Added to your cart", `${persisted.title} is ready for checkout.`);
      })
      .catch((error) => {
        setItems((current) =>
          current.filter((entry) => entry.slug !== item.slug),
        );
        notifyError(error, "This item could not be added. Your cart was restored.");
      });
  };

  const removeItem = (slug: string) => {
    const item = items.find((entry) => entry.slug === slug);
    const originalIndex = items.findIndex((entry) => entry.slug === slug);
    setItems((current) => current.filter((entry) => entry.slug !== slug));
    if (!isAuthenticated || !item?.cartItemId) return;
    fetch("/api/cart", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.cartItemId }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Cart removal failed");
        museumToast.infoAction("Removed from your cart", `${item.title} was removed.`, "Undo", () => {
          const restoredItem = { ...item, cartItemId: undefined };
          setItems((current) => {
            if (current.some((entry) => entry.slug === item.slug)) return current;
            const restored = [...current];
            restored.splice(Math.min(Math.max(0, originalIndex), restored.length), 0, restoredItem);
            return restored;
          });
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: item.listingId, quantity: item.quantity }),
          })
            .then(async (undoResponse) => {
              const body = (await undoResponse.json()) as { success: boolean; data?: ApiCartItem };
              if (!undoResponse.ok || !body.success || !body.data) throw new Error("Cart restore failed");
              const persisted = fromApi(body.data);
              setItems((current) => current.map((entry) => entry.slug === item.slug ? persisted : entry));
              museumToast.success("Restored to your cart", `${persisted.title} is back in your cart.`);
            })
            .catch((undoError) => {
              setItems((current) => current.filter((entry) => entry.slug !== item.slug));
              notifyError(undoError, "This item could not be restored to your cart.");
            });
        });
      })
      .catch((error) => {
        setItems((current) => {
          if (current.some((entry) => entry.slug === item.slug)) return current;
          const restored = [...current];
          restored.splice(Math.max(0, originalIndex), 0, item);
          return restored;
        });
        notifyError(error, "This item could not be removed. Your cart was restored.");
      });
  };

  const value = {
    items,
    addItem,
    removeItem,
    clear: () => {
      setItems([]);
    },
    isInCart: (slug: string) => items.some((item) => item.slug === slug),
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    ),
    loading,
    isAuthenticated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
