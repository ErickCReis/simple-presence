import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";

import * as auth from "./schema/auth";
import * as presence from "./schema/presence";

export const db = drizzle(env.DB);

export const SCHEMAS = {
	...auth,
	...presence,
};
