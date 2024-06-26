import { defineStore } from "pinia";
import { type Requirements, getRegionData } from "../data/map";
import { useOptions } from "./config";
import { allItems } from "@/data/items";

export type PlaythroughProps = {
	items: string[];
	checks: string[];
	notes: string;
	spiritAnnotations: typeof spiritAnnotations;
};

type SpiritAnnotations = {
	scaling: number;
	entrance: string;
	required: boolean;
};

const starSpirits = [
	"Eldstar",
	"Mamar",
	"Skolar",
	"Muskular",
	"Misstar",
	"Klevar",
	"Kalmar",
];

const partners = [
	"Goombario",
	"Kooper",
	"Bombette",
	"Parakarry",
	"Bow",
	"Watt",
	"Sushie",
	"Lakilester",
];

const regionsPerChapter: Record<string, string> = {
	"Pleasant Path": "Eldstar",
	"Koopa Village": "Eldstar",
	"Koopa Bros. Fortress": "Eldstar",
	"Mt. Rugged": "Mamar",
	"Dry Dry Desert": "Mamar",
	"Dry Dry Ruins": "Mamar",
	"Forever Forest": "Skolar",
	"Boo's Mansion": "Skolar",
	"Gusty Gulch": "Skolar",
	"Tubba's Castle": "Skolar",
	"Shy Guy's Toybox": "Muskular",
	"Yoshi's Island": "Misstar",
	"Mt. Lavalava": "Misstar",
	"Flower Fields": "Klevar",
	"Shiver Region": "Kalmar",
	"Crystal Palace": "Kalmar",
};

const fixedChapterRewards = [...starSpirits, "Star Rod"];

const letters = allItems.filter(el => el.type === "letter").map(el => el.name);

const storagePlaythroughStr = localStorage.getItem("playthrough");

const storagePlaythrough = storagePlaythroughStr
	? (JSON.parse(storagePlaythroughStr) as Partial<PlaythroughProps>)
	: {};

// const defaultOptions = Object.getOwnPropertyNames(allOptions).reduce(
// 	(a, v) => ({ ...a, [v]: allOptions[v].default }),
// 	{}
// );

const spiritAnnotations: Record<string, SpiritAnnotations> = {
	Eldstar: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	Mamar: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	Skolar: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	Muskular: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	Misstar: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	Klevar: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	Kalmar: {
		scaling: 0,
		entrance: "",
		required: false,
	},
	"Star Rod": {
		scaling: 0,
		entrance: "",
		required: true,
	},
};

const init: PlaythroughProps = {
	items: [],
	checks: [],
	notes: "",
	spiritAnnotations: JSON.parse(JSON.stringify(spiritAnnotations)) as Record<
		string,
		SpiritAnnotations
	>,
	...storagePlaythrough,
};

const dungeonRegions = {
	"Koopa Bros. Fortress": "Eldstar",
	"Dry Dry Ruins": "Mamar",
	"Tubba's Castle": "Skolar",
	"Shy Guy's Toybox": "Muskular",
	"Mt. Lavalava": "Misstar",
	"Flower Fields": "Klevar",
	"Crystal Palace": "Kalmar",
};

export const usePlaythrough = defineStore("playthrough", {
	state: () => ({ ...init }),
	actions: {
		save() {
			localStorage.setItem(
				"playthrough",
				JSON.stringify({
					items: this.items,
					checks: this.checks,
					notes: this.notes,
					spiritAnnotations: this.spiritAnnotations,
				})
			);
		},
		getSpiritAnnotation(k: keyof PlaythroughProps["spiritAnnotations"]) {
			return this.spiritAnnotations[k];
		},
		setSpiritAnnotation(
			k: keyof PlaythroughProps["spiritAnnotations"],
			value: Partial<SpiritAnnotations>
		) {
			this.spiritAnnotations[k] = { ...this.spiritAnnotations[k], ...value };
			this.save();
		},
		toggleSpiritRequired(k: keyof PlaythroughProps["spiritAnnotations"]) {
			this.spiritAnnotations[k] = {
				...this.spiritAnnotations[k],
				required: !this.spiritAnnotations[k].required,
			};
			this.save();
		},
		getLCLHiddenItems() {
			return allItems.filter(
				el =>
					!starSpirits.includes(el.name) &&
					el.chapter &&
					1 <= el.chapter &&
					el.chapter <= 7 &&
					!this.spiritAnnotations[starSpirits[el.chapter - 1]].required
			);
		},
		getLCLHiddenAreas() {
			return Object.keys(regionsPerChapter).filter(
				el => !this.spiritAnnotations[regionsPerChapter[el]].required
			);
		},
		cycleUpgrade(k: string) {
			const _super = `${k}:super`;
			const _ultra = `${k}:ultra`;

			if (this.items.includes(_ultra)) {
				this.items.splice(this.items.indexOf(_ultra), 1);
				this.items.splice(this.items.indexOf(_super), 1);
			} else if (this.items.includes(_super)) {
				this.items.push(_ultra);
			} else {
				this.items.push(_super);
			}

			this.save();
		},
		toggleItem(item: string) {
			if (this.items.includes(item)) {
				this.items.splice(this.items.indexOf(item), 1);
				if (fixedChapterRewards.includes(item) && this.checks.includes(item)) {
					this.checks.splice(this.checks.indexOf(item), 1);
				}
			} else {
				this.items.push(item);
				if (fixedChapterRewards.includes(item) && !this.checks.includes(item)) {
					this.checks.push(item);
				}
			}

			this.save();
		},
		addItem(item: string | null, max: number = 1) {
			if (item !== null) {
				if (this.items.filter(el => el === item).length < max) {
					this.items.push(item);

					this.save();
				}
			}
		},
		removeItem(item: string | null) {
			if (item !== null) {
				if (this.items.includes(item)) {
					this.items.splice(this.items.indexOf(item), 1);

					this.save();
				}
			}
		},
		hasItem(item: string) {
			return this.items.includes(item);
		},
		itemCount(item: string) {
			if (item === "Letters") {
				return (
					letters.filter(el => this.items.includes(el)).length +
					this.items.filter(el => el === item).length
				);
			} else {
				return this.items.filter(el => el === item).length;
			}
		},
		filterItems(items: string[]) {
			return this.items.filter(el => items.includes(el));
		},
		fullClearedArea(region: string, area: string) {
			const data = getRegionData(region);
			const areaChecks = Object.getOwnPropertyNames(
				data.areas[area].checks
			).filter(el =>
				this.canCheckLocation(data.areas[area].checks[el].reqs, region)
			);
			return areaChecks.every(el => this.checks.includes(`${area}:${el}`));
		},
		toggleRegionChecks(region: string) {
			const data = getRegionData(region);
			const hasAll = Object.getOwnPropertyNames(data.areas).every(el =>
				this.fullClearedArea(region, el)
			);
			Object.getOwnPropertyNames(data.areas).forEach(area => {
				this.toggleAreaChecks(region, area, !hasAll);
			});
		},
		toggleAreaChecks(
			region: string,
			area: string,
			force: boolean | undefined = undefined
		) {
			const data = getRegionData(region);
			const areaChecks = Object.getOwnPropertyNames(
				data.areas[area].checks
			).filter(el =>
				this.canCheckLocation(data.areas[area].checks[el].reqs, region)
			);
			const hasAll = areaChecks.every(el =>
				this.checks.includes(`${area}:${el}`)
			);
			const toggle = force ?? !hasAll;
			areaChecks
				.filter(el => this.checkedLocation(area, el) === !toggle)
				.forEach(el => {
					this.toggleCheck(area, el);
				});
		},
		toggleCheck(area: string, check: string) {
			const checkString = fixedChapterRewards.includes(check)
				? check
				: `${area}:${check}`;
			if (this.checks.includes(checkString)) {
				this.checks = this.checks.filter(el => el !== checkString);
				if (fixedChapterRewards.includes(check) && this.items.includes(check)) {
					this.items = this.items.filter(el => el !== check);
				}
			} else {
				this.checks.push(checkString);
				if (
					fixedChapterRewards.includes(check) &&
					!this.items.includes(check)
				) {
					this.items.push(check);
				}
			}

			this.save();
		},
		checkedLocation(area: string, check: string) {
			const checkString = fixedChapterRewards.includes(check)
				? check
				: `${area}:${check}`;
			return this.checks.includes(checkString);
		},
		setNotes(notes: string) {
			this.notes = notes;

			this.save();
		},
		chaptersBeaten() {
			return starSpirits.filter(el => this.items.includes(el)).length;
		},
		getRequiredChapters(reqs: Requirements) {
			if (typeof reqs === "number") {
				return reqs;
			} else if (Array.isArray(reqs)) {
				return (reqs.find(el => typeof el === "number") as number) ?? 0;
			} else {
				return 0;
			}
		},
		getRegionRequirements(region: string) {
			const options = useOptions();

			if (!Object.getOwnPropertyNames(dungeonRegions).includes(region)) {
				return getRegionData(region).reqs;
			}
			const shuffledEntrance = Object.getOwnPropertyNames(
				this.spiritAnnotations
			).find(
				el =>
					this.spiritAnnotations[el].entrance ===
					dungeonRegions[region as keyof typeof dungeonRegions]
			);
			if (!shuffledEntrance) {
				return options.options.dungeonShuffle
					? false
					: getRegionData(region).reqs;
			}
			const shuffledDungeon = Object.getOwnPropertyNames(dungeonRegions).find(
				r =>
					dungeonRegions[r as keyof typeof dungeonRegions] === shuffledEntrance
			);
			return getRegionData(shuffledDungeon!).reqs;
		},
		canGetSkolar() {
			const canReachGulch = resolveRequirement(
				this.getRegionRequirements("Gusty Gulch")!,
				"and"
			);
			const canReachCastle = resolveRequirement(
				this.getRegionRequirements("Tubba's Castle")!,
				"and"
			);
			return (
				canReachGulch &&
				canReachCastle &&
				this.items.includes("Super Boots") &&
				this.items.filter(el => el === "Tubba Castle Key").length >= 3
			);
		},
		canCheckLocation(reqs: Requirements, region?: string) {
			const options = useOptions();

			if (!options.$state.options.trackerLogic) {
				return true;
			}
			if (
				options.getValue("limitChapterLogic") &&
				region &&
				region in regionsPerChapter &&
				!this.spiritAnnotations[regionsPerChapter[region]].required
			) {
				return false;
			}
			const regionReqs = region ? this.getRegionRequirements(region) : null;
			return (
				resolveRequirement(regionReqs ?? null, "and") &&
				resolveRequirement(reqs, "and")
			);
		},
		locationIsRandomized(check: string) {
			const optionsStore = useOptions();
			const settings = optionsStore.$state.options;
			const tags = {
				Panel: settings.panelsRandomized,
				Dojo: settings.dojoRandomized,
				Shop: settings.shopsRandomized,
				Rowf: settings.shopsRandomized && settings.rowfRandomized,
				Trade: settings.tradingEventRandomized,
				Letter: settings.lettersRandomized,
				Koot: settings.koopaKootRandomized,
				"Koot Coin":
					settings.koopaKootRandomized && settings.kootCoinsRandomized,
				"Foliage Coin": settings.foliageCoinsRandomized,
				Coinsanity: settings.coinsRandomized,
				"Coin Block": settings.coinBlocksRandomized,
				Merlow: settings.merlowRandomized,
				Upgrade: settings.superBlocksRandomized,
				"Multicoin Block": settings.multicoinBlocksRandomized,
				"Closed Forest": !settings.forestOpen,
				"Shuffle Star Beam": settings.shuffleStarBeam,
			};

			if (check.startsWith("[")) {
				const tag: keyof typeof tags | undefined = (
					Object.getOwnPropertyNames(tags) as (keyof typeof tags)[]
				).find(el => check.startsWith(`[${el}]`));
				if (!tag) {
					console.error(`Error processing tag ${check}`);
					return true;
				} else {
					return tags[tag];
				}
			} else {
				return true;
			}
		},
		resetPlaythrough() {
			const optionsStore = useOptions();
			const settings = optionsStore.$state.options;
			this.checks = [];
			this.items = [];
			this.notes = "";
			this.spiritAnnotations = JSON.parse(
				JSON.stringify(spiritAnnotations)
			) as Record<string, SpiritAnnotations>;
			if (settings.startingBoots === "Boots") {
				this.items.push("Boots");
			} else if (settings.startingBoots === "Super Boots") {
				this.items.push("Boots");
				this.items.push("Super Boots");
			} else if (settings.startingBoots === "Ultra Boots") {
				this.items.push("Boots");
				this.items.push("Super Boots");
				this.items.push("Ultra Boots");
			}
			if (settings.startingHammer === "Hammer") {
				this.items.push("Hammer");
			} else if (settings.startingHammer === "Super Hammer") {
				this.items.push("Hammer");
				this.items.push("Super Hammer");
			} else if (settings.startingHammer === "Ultra Hammer") {
				this.items.push("Hammer");
				this.items.push("Super Hammer");
				this.items.push("Ultra Hammer");
			}
			this.save();
		},
		loadPlaythrough(data: PlaythroughProps) {
			this.checks = data.checks;
			this.items = data.items;
			this.notes = data.notes;
			this.spiritAnnotations = JSON.parse(
				JSON.stringify(data.spiritAnnotations)
			) as Record<string, SpiritAnnotations>;
			this.save();
		},
	},
});

const resolveRequirement = (
	reqs: Requirements,
	operation: "and" | "or"
): boolean => {
	const playthrough = usePlaythrough();
	const options = useOptions();

	if (reqs === null) {
		return true;
	} else if (typeof reqs === "boolean") {
		return reqs;
	} else if (typeof reqs === "string") {
		if (partners.includes(reqs) && options.$state.options.overworldPartners) {
			return true;
		} else {
			return playthrough.hasItem(reqs);
		}
	} else if (typeof reqs === "number") {
		return (
			playthrough.filterItems([
				"Eldstar",
				"Mamar",
				"Skolar",
				"Muskular",
				"Misstar",
				"Klevar",
				"Kalmar",
			]).length >= reqs
		);
	} else if (typeof reqs === "function") {
		return reqs({
			items: playthrough.$state.items,
			checks: playthrough.$state.checks,
			settings: options.$state.options,
		});
	} else if (operation === "and") {
		return reqs.every(el => resolveRequirement(el, "or"));
	} else if (operation === "or") {
		return reqs.some(el => resolveRequirement(el, "and"));
	} else {
		console.error("error in resolveRequirement", reqs);
		throw "error in resolveRequirement";
	}
};

// export const settingsKeys = Object.getOwnPropertyNames(allOptions).filter(
// 	(option) => allOptions[option].namespace === "settings"
// );
// export const configKeys = Object.getOwnPropertyNames(allOptions).filter(
// 	(option) => allOptions[option].namespace === "config"
// );

// export type OptionsStore = typeof useOptions;
