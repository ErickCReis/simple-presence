import m0000 from "./0000_perfect_ezekiel.sql";
import m0001 from "./0001_flimsy_mauler.sql";
import m0002 from "./0002_bored_network.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000,
		m0001,
		m0002,
	},
};
