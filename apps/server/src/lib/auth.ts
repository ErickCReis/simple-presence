import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema: schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN],
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
		password: {
			hash: async (password) => {
				// Use a lower cost factor for better performance in Cloudflare Workers
				// Default Node.js implementation but with lower cost
				const crypto = require("node:crypto");
				const salt = crypto.randomBytes(16);
				// Use a cost factor of 8 instead of the default 16
				return new Promise((resolve, reject) => {
					crypto.scrypt(
						password,
						salt,
						64,
						{ N: 8 },
						(err: Error | null, derivedKey: Buffer) => {
							if (err) reject(err);
							resolve(`${salt.toString("hex")}:${derivedKey.toString("hex")}`);
						},
					);
				});
			},
			verify: async ({ hash, password }) => {
				// Custom verification function for the optimized password hash
				const crypto = require("node:crypto");
				const [salt, key] = hash.split(":");
				// Use a cost factor of 8 instead of the default 16
				return new Promise((resolve, reject) => {
					crypto.scrypt(
						password,
						Buffer.from(salt, "hex"),
						64,
						{ N: 8 },
						(err: Error | null, derivedKey: Buffer) => {
							if (err) reject(err);
							resolve(key === derivedKey.toString("hex"));
						},
					);
				});
			},
		},
	},
});
