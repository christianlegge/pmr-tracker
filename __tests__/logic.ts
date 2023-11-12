import * as logic from "../src/utils/logic";
import { getRequirements } from "../src/data/map";
import { defaultOptions, type Options } from "../src/stores/config";
import { resolveRequirement } from "../src/stores/playthrough";

let items: string[];
let settings: Options;
let checks: string[];

const localStorage = () => {};

beforeEach(() => {
	items = [];
	settings = defaultOptions;
	checks = [];
});

describe("Koot Favors", () => {
	test("Need Hammer to start Koot favor quest", () => {
		const reqs = getRequirements(
			"Koopa Village East",
			"[Koot Coin] Talk to Kolorado's wife after starting Koopa Koot's first favor"
		);
		expect(resolveRequirement(reqs, items, checks, settings)).toBe(false);
		items.push("Hammer");
		expect(resolveRequirement(reqs, items, checks, settings)).toBe(true);
	});
});

test("adds 1 + 2 to equal 3", () => {
	expect(1 + 2).toBe(3);
});
