/// <reference types="bun" />

import alchemy from "alchemy";
import { Website } from "alchemy/cloudflare";

const app = await alchemy("simple-presence");

const site = await Website("simple-presence", {
	spa: true,
	assets: {
		dist: "./.output/public",
		_headers: "/*\n  Cache-Control: public, max-age=3600",
	},
	wrangler: false,
});

console.log({
	siteUrl: site.url,
});

await app.finalize();
