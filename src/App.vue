<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import EnabledSettings from "./components/EnabledSettings.vue";
import SvgButton from "./components/SvgButton.vue";
import { configKeys, settingsKeys } from "./stores/config";
import MapTracker from "./components/MapTracker.vue";
import ItemTracker from "./components/ItemTracker.vue";
import UserNotes from "./components/UserNotes.vue";
import SeedImport from "./components/SeedImport.vue";
import RequiredTracker from "./components/RequiredTracker.vue";
import { useOptions } from "./stores/config";
import { storeToRefs } from "pinia";
import MenuOptions from "./components/MenuOptions.vue";
import { allItems } from "@/data/items";
import { GridLayout, GridItem } from "grid-layout-plus";
import type { Layout } from "grid-layout-plus";
import OverlayModal from "./components/OverlayModal.vue";
import { usePlaythrough } from "./stores/playthrough";
import InfoBlocks from "./components/InfoBlocks.vue";
import FilterConfig from "./components/FilterConfig.vue";
import SaveData from "./components/SaveData.vue";
import LoadData from "./components/LoadData.vue";
import { throttle } from "./utils/helpers";

type TGridItem = typeof GridItem & {
	calcXY: (top: number, left: number) => { x: number; y: number };
	wrapper: HTMLElement;
};

const savedLayout = localStorage.getItem("layout")
	? (JSON.parse(localStorage.getItem("layout") as string) as Layout)
	: undefined;

const initialLayout: Layout = [
	{ x: 0, y: 0, w: 40, h: 3, i: "flags", static: false, minH: 3 },
	{
		x: 0,
		y: 3,
		w: 40,
		h: 36,
		i: "required",
		static: false,
		isResizable: false,
	},
	{ x: 40, y: 14, w: 80, h: 35, i: "map", static: false },
	{ x: 40, y: 0, w: 40, h: 14, i: "miscitem", static: false },
	{ x: 80, y: 0, w: 40, h: 14, i: "misckey", static: false },
	{ x: 40, y: 50, w: 40, h: 18, i: "letters", static: false },
	{ x: 80, y: 50, w: 40, h: 18, i: "koot", static: false },
	{ x: 0, y: 39, w: 40, h: 28, i: "notes", static: false },
];

const panels = {
	flags: { name: "Seed Settings", h: 3, w: 30 },
	required: { name: "Required Items", h: 40, w: 40 },
	compact: { name: "Required Compact", h: 20, w: 20 },
	everything: { name: "Basically Everything", h: 30, w: 40 },
	miscitem: { name: "Misc. Items", h: 20, w: 20 },
	misckey: { name: "Misc. Keys", h: 20, w: 20 },
	letters: { name: "Letters", h: 20, w: 20 },
	koot: { name: "Koopa Koot Favors", h: 20, w: 20 },
	map: { name: "Map Tracker", h: 20, w: 20 },
	notes: { name: "User Notepad", h: 20, w: 20 },
};

const layout = ref(
	savedLayout && Array.isArray(savedLayout) ? savedLayout : initialLayout
);

const mainRef = ref<HTMLElement>();
const gridLayout = ref<InstanceType<typeof GridLayout>>();

onMounted(() => {
	document.addEventListener("dragover", syncMousePosition);
});

onBeforeUnmount(() => {
	document.removeEventListener("dragover", syncMousePosition);
});

const mouseAt = { x: -1, y: -1 };

function syncMousePosition(event: MouseEvent) {
	mouseAt.x = event.clientX;
	mouseAt.y = event.clientY;
}

const currentPanels = computed(() => layout.value.map(el => el.i));

const openModal = ref<
	"settings" | "config" | "import" | "info" | "filter" | "save" | "load" | null
>(null);
const moving = ref(false);

const optionsStore = useOptions();
const playthroughStore = usePlaythrough();

const { options } = storeToRefs(optionsStore);

const mainWidth = computed(() =>
	options.value.trackerWidth.toString() === "0"
		? "auto"
		: `${options.value.trackerWidth}px`
);

const allItemsFiltered = computed(() =>
	allItems
		.filter(el => optionsStore.getItemFilter(el.name) !== "hide")
		.filter(
			el =>
				!options.value.limitChapterLogic ||
				!options.value.hideLCLItems ||
				!playthroughStore.getLCLHiddenItems().includes(el)
		)
		.filter(
			el =>
				optionsStore.getItemFilter(el.name) === "show" ||
				el.show === undefined ||
				el.show(options.value)
		)
);

function saveLayout() {
	localStorage.setItem("layout", JSON.stringify(layout.value));
}

function resetLayout() {
	if (
		confirm(
			"Are you sure you want to reset your layout? Your saved layout will be lost!"
		)
	) {
		layout.value = initialLayout;
		localStorage.removeItem("layout");
	}
}

function removePanel(idx: number) {
	layout.value.splice(idx, 1);
	saveLayout();
}

const dragItem = { x: -1, y: -1 };
const dropId = "drop";

const dragFromMenu = throttle((panelKey: keyof typeof panels) => {
	const parentRect = mainRef.value?.getBoundingClientRect();

	if (!parentRect || !gridLayout.value) return;

	const mouseInGrid =
		mouseAt.x > parentRect.left &&
		mouseAt.x < parentRect.right &&
		mouseAt.y > parentRect.top &&
		mouseAt.y < parentRect.bottom;

	if (mouseInGrid && !layout.value.find(item => item.i === dropId)) {
		layout.value.push({
			x: (layout.value.length * 2) % 12,
			y: layout.value.length + 12, // puts it at the bottom
			w: panels[panelKey].w,
			h: panels[panelKey].h,
			i: dropId,
		});
	}

	const index = layout.value.findIndex(item => item.i === dropId);

	if (index !== -1) {
		const item = gridLayout.value.getItem(dropId) as TGridItem;

		if (!item) return;

		try {
			item.wrapper.style.display = "none";
		} catch (e) {
			console.error(e);
		}

		Object.assign(item.state, {
			top: mouseAt.y - parentRect.top,
			left: mouseAt.x - parentRect.left,
		});
		const newPos = item.calcXY(
			mouseAt.y - parentRect.top,
			mouseAt.x - parentRect.left
		);

		if (mouseInGrid) {
			gridLayout.value.dragEvent(
				"dragstart",
				dropId,
				newPos.x,
				newPos.y,
				panels[panelKey].h,
				panels[panelKey].w
			);
			dragItem.x = layout.value[index].x;
			dragItem.y = layout.value[index].y;
		} else {
			gridLayout.value.dragEvent(
				"dragend",
				dropId,
				newPos.x,
				newPos.y,
				panels[panelKey].h,
				panels[panelKey].w
			);
			layout.value = layout.value.filter(item => item.i !== dropId);
		}
	}
}, 33);

function dragEnd(panelKey: keyof typeof panels) {
	const parentRect = mainRef.value?.getBoundingClientRect();

	if (!parentRect || !gridLayout.value) return;

	const mouseInGrid =
		mouseAt.x > parentRect.left &&
		mouseAt.x < parentRect.right &&
		mouseAt.y > parentRect.top &&
		mouseAt.y < parentRect.bottom;

	if (mouseInGrid) {
		gridLayout.value.dragEvent(
			"dragend",
			dropId,
			dragItem.x,
			dragItem.y,
			panels[panelKey].h,
			panels[panelKey].w
		);
		layout.value = layout.value.filter(item => item.i !== dropId);
	} else {
		return;
	}

	layout.value.push({
		x: dragItem.x,
		y: dragItem.y,
		w: panels[panelKey].w,
		h: panels[panelKey].h,
		i: panelKey,
	});
	gridLayout.value.dragEvent(
		"dragend",
		panelKey,
		dragItem.x,
		dragItem.y,
		panels[panelKey].h,
		panels[panelKey].w
	);

	const item = gridLayout.value.getItem(dropId) as TGridItem;

	if (!item) return;

	try {
		item.wrapper.style.display = "";
	} catch (e) {
		console.error(e);
	}

	saveLayout();
}

const dragEndTimeout = (panelKey: keyof typeof panels) =>
	setTimeout(() => dragEnd(panelKey), 100);

function doWithPrompt(prompt: string, fn: () => void): void {
	if (confirm(prompt)) {
		fn();
	}
}

function saveVisit() {
	localStorage.setItem("visited", "true");
}

if (!localStorage.getItem("visited")) {
	openModal.value = "info";
}
</script>

<template>
	<component :is="'style'">
		body { background: {{ options.backgroundColor }}; font-family:
		{{ options.paperMarioFont ? "Paper Mario" : "Open Sans" }};}
	</component>

	<OverlayModal
		v-if="openModal === 'info'"
		@close="
			openModal = null;
			saveVisit();
		"
	>
		<InfoBlocks
			@close="
				openModal = null;
				saveVisit();
			"
	/></OverlayModal>
	<OverlayModal
		v-if="openModal === 'settings'"
		title="Seed Settings"
		@close="openModal = null"
	>
		<p class="settings-warning">
			Note: you probably don't need to set these manually! Use the Import Seed
			option to import from the pm64randomizer website.<br />
			<a @click="openModal = 'import'">Import Seed</a>
		</p>
		<MenuOptions :options-keys="settingsKeys" />
	</OverlayModal>
	<OverlayModal
		v-if="openModal === 'config'"
		title="Tracker Config"
		@close="openModal = null"
	>
		<button
			:style="{ padding: '0.5rem', marginBottom: '1rem' }"
			@click="openModal = 'filter'"
		>
			Filter Individual Items
		</button>
		<MenuOptions :options-keys="configKeys" />
	</OverlayModal>
	<OverlayModal
		v-if="openModal === 'import'"
		title="Import Seed"
		@close="openModal = null"
	>
		<SeedImport @seed-imported="openModal = null" />
	</OverlayModal>
	<OverlayModal
		v-if="openModal === 'filter'"
		title="Item Filters"
		@close="openModal = 'config'"
	>
		<FilterConfig />
	</OverlayModal>
	<OverlayModal
		v-if="openModal === 'save'"
		title="Save Tracker Data"
		@close="openModal = null"
	>
		<SaveData :current-layout="layout" />
	</OverlayModal>
	<OverlayModal
		v-if="openModal === 'load'"
		title="Load Tracker Data"
		@close="openModal = null"
	>
		<LoadData
			:set-layout="
				newLayout => {
					layout = newLayout;
					saveLayout();
				}
			"
			@close="openModal = null"
		/>
	</OverlayModal>

	<header class="header">
		<div class="buttons">
			<SvgButton name="Tracker Config" @click="openModal = 'config'"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</SvgButton>
			<SvgButton name="Seed Settings" @click="openModal = 'settings'">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
					/>
				</svg>
			</SvgButton>
			<SvgButton name="Import Seed" @click="openModal = 'import'">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
					/>
				</svg>
			</SvgButton>
			<SvgButton
				name="Reset Tracker"
				@click="
					doWithPrompt(
						'This will reset your current progress! Proceed?',
						playthroughStore.resetPlaythrough
					)
				"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg>
			</SvgButton>
		</div>
		<img id="logo-img" src="./assets/images/Logo.png" />
		<div class="buttons" :style="{ justifyContent: 'flex-end' }">
			<SvgButton name="How to Use" @click="openModal = 'info'"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
					/>
				</svg>
			</SvgButton>
			<SvgButton name="Save Tracker Data" @click="openModal = 'save'">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
					/>
				</svg>
			</SvgButton>
			<SvgButton name="Load Tracker Data" @click="openModal = 'load'">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
					/>
				</svg>
			</SvgButton>
			<SvgButton name="Edit Layout" @click="moving = !moving">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			</SvgButton>
			<SvgButton name="Reset Layout" @click="resetLayout"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 9l6-6m0 0l6 6m-6-6v12a6 6 0 01-12 0v-3"
					/>
				</svg>
			</SvgButton>
		</div>
		<div
			class="add-panels"
			:style="{
				transform: moving ? undefined : 'translate(0, -10rem)',
			}"
		>
			<SvgButton name="Lock Layout" @click="moving = false"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
					/>
				</svg>
			</SvgButton>
			<div
				v-for="[key, panel] in Object.entries(panels).filter(
					([k, v]) => !currentPanels.includes(k)
				)"
				:key="panel.name"
				draggable="true"
				unselectable="on"
				@click="
					layout.push({ ...panel, x: 0, y: 0, i: key });
					saveLayout();
				"
				@drag="dragFromMenu(key as keyof typeof panels)"
				@dragend="dragEndTimeout(key as keyof typeof panels)"
			>
				{{ panel.name }}
			</div>
		</div>
	</header>

	<main
		ref="mainRef"
		:style="{
			transform: moving ? 'translate(0, 5rem)' : undefined,
			width: mainWidth,
		}"
	>
		<GridLayout
			ref="gridLayout"
			v-model:layout="layout"
			:vertical-compact="true"
			:auto-size="true"
			:row-height="16"
			:col-num="120"
		>
			<GridItem
				v-for="(item, idx) in layout"
				:key="item.i"
				:x="item.x"
				:y="item.y"
				:w="item.w"
				:h="item.h"
				:i="item.i"
				drag-allow-from=".drag-handle"
				:is-resizable="moving"
				@moved="saveLayout"
				@resized="saveLayout"
			>
				<EnabledSettings
					v-if="item.i === 'flags'"
					:moving="moving"
					:remove-panel="() => removePanel(idx)"
				/>
				<RequiredTracker
					v-if="item.i === 'required'"
					:moving="moving"
					:all-items="allItemsFiltered"
					:remove-panel="() => removePanel(idx)"
				/>
				<ItemTracker
					v-if="item.i === 'compact'"
					:moving="moving"
					:all-items="allItemsFiltered"
					:heading="'Required Items'"
					:item-types="['required', 'chapterReward', 'equipment', 'partner']"
					:remove-panel="() => removePanel(idx)"
				/>
				<ItemTracker
					v-if="item.i === 'everything'"
					:moving="moving"
					:all-items="allItemsFiltered"
					:heading="'Basically Everything'"
					:item-types="[
						'required',
						'chapterReward',
						'equipment',
						'partner',
						'miscItem',
						'miscKey',
					]"
					:remove-panel="() => removePanel(idx)"
				/>
				<UserNotes
					v-if="item.i === 'notes'"
					:moving="moving"
					:remove-panel="() => removePanel(idx)"
				/>
				<MapTracker
					v-if="item.i === 'map'"
					:moving="moving"
					:remove-panel="() => removePanel(idx)"
				/>
				<ItemTracker
					v-if="item.i === 'misckey'"
					:moving="moving"
					:all-items="allItemsFiltered"
					heading="Misc. Keys"
					:item-types="['miscKey']"
					:remove-panel="() => removePanel(idx)"
				/>
				<ItemTracker
					v-if="item.i === 'miscitem'"
					:moving="moving"
					:all-items="allItemsFiltered"
					heading="Misc. Items"
					:item-types="['miscItem']"
					:remove-panel="() => removePanel(idx)"
				/>

				<ItemTracker
					v-if="item.i === 'letters'"
					:moving="moving"
					:all-items="allItemsFiltered"
					heading="Letters"
					:item-types="['letter']"
					:remove-panel="() => removePanel(idx)"
				/>
				<ItemTracker
					v-if="item.i === 'koot'"
					:moving="moving"
					:all-items="allItemsFiltered"
					heading="Koopa Koot Favors"
					:item-types="['kootFavor']"
					:remove-panel="() => removePanel(idx)"
				/>
				<!-- <InfoBlocks
					v-if="item.i === 'info'"
					:remove-panel="() => removePanel(idx)"
				/> -->
			</GridItem>
		</GridLayout>
	</main>
</template>

<style scoped>
.vgl-layout {
	--vgl-resizer-border-color: white;
}

.header {
	width: 100%;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 1rem;
	flex-grow: 0;
	position: relative;
	height: 4.5rem;
}

.buttons {
	display: flex;
	gap: 8px;
	min-width: auto;
	height: 100%;
}

.settings-warning {
	font-size: 1.5rem;
	width: 40ch;
	margin-bottom: 1rem;
}

@media (max-width: 640px) {
	#logo-img {
		display: none !important;
	}
}

#logo-img {
	width: auto;
	height: 100%;
	display: inline;
	object-fit: contain;
}

div.add-panels {
	background-color: #2273a4;
	position: absolute;
	border-bottom: 4px solid #1e3140;
	top: 0;
	left: 0;
	right: 0;
	height: 8rem;
	padding: 1rem;
	z-index: 20;
	transition: transform 0.2s;
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 4px;
	padding-block: 4px;
}

div.add-panels > div {
	height: 100%;
	width: 8rem;
	text-align: center;
	padding-inline: 4px;
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 8px;
	background-color: #1e3140;
	cursor: move;
}

main {
	transition: transform 0.2s;
	flex-grow: 1;
}

footer {
	width: 100%;
	display: inline-block;
	text-align: center;
	color: white;
	font-size: 1rem;
	padding-bottom: 1rem;
	flex-grow: 0;
}
</style>
