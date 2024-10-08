<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useOptions } from "@/stores/config";
import type { SettingsApiData } from "@/types/settings";
import { usePlaythrough } from "../stores/playthrough";

const optionsStore = useOptions();
const playthroughStore = usePlaythrough();
const loadingApiResponse = ref(false);
const seedToLoad = ref("");
const errorMessage = ref("");
const alsoReset = ref(true);
const seedInput = ref<HTMLInputElement | null>(null);

const emit = defineEmits(["seedImported"]);

onMounted(() => {
	seedInput.value && seedInput.value.focus();
});

function setRandomizerSettingsFromApiResponse(data: SettingsApiData) {
	optionsStore.setValue("blueHouseOpen", data.BlueHouseOpen);
	optionsStore.setValue("coinBlocksRandomized", data.IncludeCoinsBlocks);
	optionsStore.setValue("coinsRandomized", data.IncludeCoinsOverworld);
	optionsStore.setValue("dojoRandomized", data.IncludeDojo);
	optionsStore.setValue("fastBowserCastle", data.BowsersCastleMode >= 1);
	optionsStore.setValue("foliageCoinsRandomized", data.IncludeCoinsFoliage);
	optionsStore.setValue("forestOpen", data.ForeverForestOpen);
	optionsStore.setValue(
		"gearShuffle",
		0 <= data.GearShuffleMode && data.GearShuffleMode <= 2
			? ["Vanilla", "Big Chest Shuffle", "Full Shuffle"][data.GearShuffleMode]
			: "Vanilla"
	);
	optionsStore.setValue("keysRandomized", data.KeyitemsOutsideDungeon);
	optionsStore.setValue("koopaKootRandomized", data.IncludeFavorsMode >= 1);
	optionsStore.setValue("kootCoinsRandomized", data.IncludeCoinsFavors);
	optionsStore.setValue("lettersRandomized", data.IncludeLettersMode >= 1);
	optionsStore.setValue("dungeonShuffle", data.ShuffleDungeonEntrances);
	optionsStore.setValue("randomizePuzzles", data.RandomizePuzzles);
	optionsStore.setValue("requireSpecificSpirits", data.RequireSpecificSpirits);
	optionsStore.setValue("limitChapterLogic", data.LimitChapterLogic);
	optionsStore.setValue("merlowRandomized", data.ProgressionOnMerlow);
	optionsStore.setValue("mtRuggedOpen", data.MtRuggedOpen);
	optionsStore.setValue("multicoinBlocksRandomized", data.ShuffleBlocks);
	optionsStore.setValue("panelsRandomized", data.IncludePanels);
	optionsStore.setValue("shuffleStarBeam", data.ShuffleStarBeam);
	optionsStore.setValue("starBeamStarsNeeded", data.StarBeamPowerStarsNeeded);
	optionsStore.setValue("starBeamSpiritsNeeded", data.StarBeamSpiritsNeeded);
	optionsStore.setValue("starHuntTotal", data.StarHuntTotal);
	optionsStore.setValue("starWayStarsNeeded", data.StarWayPowerStarsNeeded);
	optionsStore.setValue("starWaySpiritsNeeded", data.StarWaySpiritsNeededCnt);
	optionsStore.setValue("prologueOpen", data.PrologueOpen);
	optionsStore.setValue("rowfRandomized", data.ProgressionOnRowf);
	optionsStore.setValue(
		"seedsRequired",
		Math.min(4, data.MagicalSeedsRequired)
	);
	optionsStore.setValue("shiverBridgeVisible", data.Ch7BridgeVisible);
	optionsStore.setValue("shopsRandomized", data.IncludeShops);
	optionsStore.setValue(
		"startingBoots",
		-1 <= data.StartingBoots && data.StartingBoots <= 2
			? ["Bootless", "Boots", "Super Boots", "Ultra Boots"][
					data.StartingBoots + 1
				]
			: "Bootless"
	);
	optionsStore.setValue(
		"startingHammer",
		-1 <= data.StartingHammer && data.StartingHammer <= 2
			? ["Hammerless", "Hammer", "Super Hammer", "Ultra Hammer"][
					data.StartingHammer + 1
				]
			: "Hammerless"
	);
	optionsStore.setValue("overworldPartners", data.PartnersAlwaysUsable);
	optionsStore.setValue(
		"startingLocation",
		{
			65796: "Toad Town",
			257: "Goomba Village",
			590080: "Dry Dry Outpost",
			1114882: "Yoshi Village",
		}[data.StartingMap.toString()] ?? "Toad Town" // default to Toad Town if Random Pick or unknown
	);
	optionsStore.setValue(
		"superBlocksRandomized",
		data.PartnerUpgradeShuffle >= 1
	);
	optionsStore.setValue("toyboxOpen", data.ToyboxOpen);
	optionsStore.setValue("tradingEventRandomized", data.IncludeRadioTradeEvent);
	optionsStore.setValue("whaleOpen", data.WhaleOpen);
	errorMessage.value = "";
	if (alsoReset.value) {
		playthroughStore.resetPlaythrough();
	}
	emit("seedImported");
}

function fetchSeedSettings(id: string) {
	if (loadingApiResponse.value) {
		return;
	}
	loadingApiResponse.value = true;
	errorMessage.value = "";
	fetch(
		`https://paper-mario-randomizer-server.ue.r.appspot.com/randomizer_settings/${id}`
	)
		.then(result => {
			if (!result.ok) {
				throw result;
			}
			return result.json() as Promise<SettingsApiData>;
		})
		.then(data => {
			setRandomizerSettingsFromApiResponse(data);
		})
		.catch((err: object) => {
			if (err && "status" in err && typeof err.status === "number") {
				if (err.status === 404) {
					errorMessage.value = `Could not find seed ${id}. Ensure it is correct and try again.`;
				} else if (err.status.toString().startsWith("5")) {
					errorMessage.value = `Server error (code ${err.status})`;
					console.error(err);
				}
			} else {
				errorMessage.value = `Unknown error - please see the browser console and report this!`;
				console.error(err);
			}
		})
		.finally(() => {
			loadingApiResponse.value = false;
		});
}
</script>

<template>
	<div class="import">
		<form @submit.prevent="fetchSeedSettings(seedToLoad)">
			<p>
				Paste the ID from the pm64randomizer.com URL to import the settings to
				the tracker.
			</p>
			<p class="url">
				https://pm64randomizer.com/seed?id=<input
					ref="seedInput"
					v-model="seedToLoad"
					required
					type="text"
					class="id"
					placeholder="123456789"
					:disabled="loadingApiResponse"
				/>
			</p>
			<p>This will overwrite your current settings.</p>
			<input
				id="alsoReset"
				v-model="alsoReset"
				type="checkbox"
				name="alsoReset"
			/>
			<label for="alsoReset">Also reset the tracker</label><br />
			<button class="importButton" :disabled="loadingApiResponse">
				{{ loadingApiResponse ? "Loading..." : "Import" }}
			</button>
		</form>
		<p v-if="errorMessage" class="error">{{ errorMessage }}</p>
	</div>
</template>

<style scoped>
.import {
	font-size: large;
	max-width: 50ch;
	text-align: center;
}

.url {
	margin-block: 1rem;
}

.id {
	border-radius: 8px;
	padding: 0.5rem;
	border: 2px solid rgb(255, 0, 0);
	background-color: white;
}

.id:valid,
.id:disabled {
	border: 2px solid transparent;
}

#alsoReset {
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

.importButton {
	font-size: 2rem;
	padding: 0.5rem;
}

.importButton:disabled {
	cursor: default;
}

.error {
	margin-top: 1rem;
	background-color: rgb(255, 200, 200);
	color: black;
	padding: 1rem;
	border-radius: 8px;
	border: 2px solid red;
}
</style>
