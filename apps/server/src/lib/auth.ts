import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema/auth";

function arrayBufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes.buffer;
}

async function hashPassword(
	password: string,
	salt: ArrayBuffer,
): Promise<string> {
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);

	// Import the password as a key
	const key = await crypto.subtle.importKey(
		"raw",
		passwordBuffer,
		{ name: "PBKDF2" },
		false,
		["deriveBits"],
	);

	// Derive key using PBKDF2 with 100,000 iterations
	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: salt,
			iterations: 100000,
			hash: "SHA-256",
		},
		key,
		256, // 32 bytes = 256 bits
	);

	return arrayBufferToHex(derivedBits);
}

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
				const salt = crypto.getRandomValues(new Uint8Array(16));
				const hash = await hashPassword(password, salt.buffer);

				return `${arrayBufferToHex(salt.buffer)}:${hash}`;
			},
			verify: async ({ hash, password }) => {
				const [saltHex, storedHashHex] = hash.split(":");

				const salt = hexToArrayBuffer(saltHex);
				const computedHash = await hashPassword(password, salt);

				return computedHash === storedHashHex;
			},
		},
	},
});
