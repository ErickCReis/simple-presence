import { os } from "@orpc/server";
import type { Context } from "@/lib/context";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o
  .errors({
    UNAUTHORIZED: {
      message: "You must be logged in to access this resource",
    },
  })
  .middleware(async ({ context, next, errors }) => {
    if (!context.session?.user) {
      throw errors.UNAUTHORIZED();
    }

    return next({
      context: {
        session: context.session,
      },
    });
  });

export const protectedProcedure = publicProcedure.use(requireAuth);
