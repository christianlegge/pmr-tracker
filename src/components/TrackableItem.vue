<script setup lang="ts">
import { usePlaythrough } from "@/stores/playthrough";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { chapterRewards, getRegionData, getRewardReqs } from "@/data/map";
import type { TrackableItemInfo } from "@/types/items";
import { useOptions } from "../stores/config";
import type { PlaythroughProps } from "../stores/playthrough";
import { kootReqs } from "../data/map";
import { getImageUrl } from "@/utils/helpers";
import {
	useFloating,
	offset,
	arrow,
	shift,
	autoUpdate,
	autoPlacement,
} from "@floating-ui/vue";

const playthroughStore = usePlaythrough();
const optionsStore = useOptions();
const { info, size, hoverTooltip } = defineProps<{
	info: TrackableItemInfo;
	size: string;
	hoverTooltip?: string;
}>();

const { name, image, multiple, label, turnInCheck } = info;

const { options } = storeToRefs(optionsStore);

const hovering = ref(false);
const showStarTooltip = ref(false);

const itemRef = ref(null);
const tooltipRef = ref(null);
const arrowRef = ref(null);

const { floatingStyles, middlewareData, placement } = useFloating(
	itemRef,
	tooltipRef,
	{
		middleware: [
			autoPlacement({ allowedPlacements: ["bottom", "top"] }),
			offset(12),
			shift(),
			arrow({ element: arrowRef }),
		],
		placement: "top",
		whileElementsMounted: autoUpdate,
		transform: false,
	}
);

const powerStarNum = computed(() =>
	name === "Power Star" ? options.value.starHuntTotal : null
);

const bootsOrHammer = computed(() => name === "Boots" || name === "Hammer");

const derivedData = computed(
	(): {
		adding: null | string;
		removing: null | string;
		name: string;
		image: string;
	} => {
		if (bootsOrHammer.value) {
			const _ultra = `Ultra ${name}`;
			const _super = `Super ${name}`;
			if (playthroughStore.hasItem(_ultra)) {
				return {
					adding: null,
					removing: _ultra,
					name: _ultra,
					image: `upgrades/PM_${_ultra.replace(" ", "_")}.png`,
				};
			} else if (playthroughStore.hasItem(_super)) {
				return {
					adding: _ultra,
					removing: _super,
					name: _ultra,
					image: `upgrades/PM_${_super.replace(" ", "_")}.png`,
				};
			} else if (playthroughStore.hasItem(name)) {
				return {
					adding: _super,
					removing: name,
					name: _ultra,
					image: `upgrades/PM_${name}.png`,
				};
			} else {
				return {
					adding: name,
					removing: null,
					name: _ultra,
					image: `upgrades/PM_No_${name}.png`,
				};
			}
		} else {
			return { adding: name, removing: name, name: name, image: image };
		}
	}
);

const showCheck = computed(() => {
	if (turnInCheck) {
		const [checkArea, checkCheck] = turnInCheck.split(":");
		return playthroughStore.checkedLocation(checkArea, checkCheck);
	} else {
		return false;
	}
});

const shouldGlow = computed(() => {
	return (
		!playthroughStore.hasItem(name) &&
		((info.type === "required" &&
			options.value.highlightKey &&
			info.chapter &&
			1 <= info.chapter &&
			info.chapter <= 8) ||
			(name in chapterRewards &&
				options.value.trackerLogic &&
				(name === "Skolar"
					? playthroughStore.canGetSkolar()
					: playthroughStore.canCheckLocation(
							getRewardReqs(name),
							chapterRewards[name as keyof typeof chapterRewards].region
						))) ||
			(info.type === "kootFavor" &&
				info.turnInCheck &&
				playthroughStore.chaptersBeaten() >=
					playthroughStore.getRequiredChapters(
						kootReqs[info.turnInCheck.split(":")[1]]
					)))
	);
});

const canCheckEntrance = computed(() => {
	return (
		options.value.dungeonShuffle &&
		name in chapterRewards &&
		options.value.trackerLogic &&
		playthroughStore.canCheckLocation(
			getRegionData(
				name === "Skolar"
					? "Tubba's Castle"
					: chapterRewards[name as keyof typeof chapterRewards].region
			).reqs!
		)
	);
});
</script>

<template>
	<div
		ref="itemRef"
		tabindex="0"
		:style="{ width: '100%', height: '100%' }"
		@mouseover="hovering = true"
		@mouseout="hovering = false"
		@blur="
			event => {
				if (
					!(
						event.currentTarget &&
						(event.currentTarget as HTMLElement).contains(
							event.relatedTarget as Element
						)
					)
				) {
					showStarTooltip = false;
				}
			}
		"
	>
		<div
			class="tracker-item"
			:class="{
				fade: !bootsOrHammer && !playthroughStore.itemCount(name),
				glow: shouldGlow,
			}"
			@click="
				powerStarNum || multiple || bootsOrHammer
					? playthroughStore.addItem(
							derivedData.adding,
							powerStarNum || multiple
						)
					: playthroughStore.toggleItem(name)
			"
			@contextmenu.prevent="
				() => {
					if (name in chapterRewards) {
						// playthroughStore.incrementSpiritAnnotation(
						// 	name as keyof PlaythroughProps['spiritAnnotations']
						// );
						showStarTooltip = !showStarTooltip;
					} else if (turnInCheck) {
						const [checkArea, checkCheck] = turnInCheck.split(':');
						playthroughStore.toggleCheck(checkArea, checkCheck);
					} else if (powerStarNum || multiple || bootsOrHammer) {
						playthroughStore.removeItem(derivedData.removing);
					} else if (info.type === 'partner') {
						playthroughStore.cycleUpgrade(name);
					}
				}
			"
		>
			<img
				:src="getImageUrl(derivedData.image)"
				:alt="name"
				:style="{
					marginBottom: powerStarNum || multiple ? '1.5rem' : 0,
					width: size,
					height: size,
					cursor: 'pointer',
				}"
			/>
			<svg
				v-if="
					(options.requireSpecificSpirits &&
						name in chapterRewards &&
						!playthroughStore.getSpiritAnnotation(name).required) ||
					(options.limitChapterLogic &&
						!options.hideLCLItems &&
						playthroughStore.getLCLHiddenItems().some(el => el.name === name))
				"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="not-required"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
				/>
			</svg>

			<p
				v-if="
					(label && options.colorblind) ||
					(name in chapterRewards &&
						playthroughStore.getSpiritAnnotation(
							name as keyof PlaythroughProps['spiritAnnotations']
						).scaling > 0)
				"
				class="label"
			>
				{{
					label ||
					playthroughStore.getSpiritAnnotation(
						name as keyof PlaythroughProps["spiritAnnotations"]
					).scaling
				}}
			</p>
			<p v-if="showCheck" class="checkmark">✔</p>
			<div v-if="info.type === 'partner'" class="small-annotation upgrades">
				<img
					v-if="playthroughStore.hasItem(`${name}:super`)"
					:src="getImageUrl('koopa-koot-favors/Crystal_Ball_PM.png')"
					alt=""
				/>
				<img
					v-if="playthroughStore.hasItem(`${name}:ultra`)"
					:src="getImageUrl('icons/UltraStone.gif')"
					alt=""
				/>
			</div>
			<div
				v-if="
					name in chapterRewards &&
					playthroughStore.getSpiritAnnotation(
						name as keyof PlaythroughProps['spiritAnnotations']
					).entrance
				"
				class="small-annotation entrance-annotation"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-5 h-5"
				>
					<path
						fill-rule="evenodd"
						d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
						clip-rule="evenodd"
					/>
				</svg>

				<img
					:src="
						getImageUrl(
							`icons/${
								playthroughStore.getSpiritAnnotation(
									name as keyof PlaythroughProps['spiritAnnotations']
								).entrance
							}_PM.png`
						)
					"
					alt=""
				/>
			</div>
			<div
				v-if="
					name in chapterRewards &&
					name !== 'Star Rod' &&
					!playthroughStore.getSpiritAnnotation(
						name as keyof PlaythroughProps['spiritAnnotations']
					).entrance &&
					canCheckEntrance
				"
				class="small-annotation entrance-annotation text-glow"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="w-5 h-5"
				>
					<path
						fill-rule="evenodd"
						d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
						clip-rule="evenodd"
					/>
				</svg>

				<span class="annotation-question-mark">?</span>
			</div>
			<p v-if="powerStarNum || multiple" class="count">
				{{
					playthroughStore.itemCount(name) + "/" + (powerStarNum || multiple)
				}}
			</p>
		</div>
		<div
			v-if="hovering && hoverTooltip && options.recipeTooltips"
			ref="tooltipRef"
			class="hover-tip"
			:style="{
				...floatingStyles,
				transformOrigin:
					placement === 'bottom' ? 'top center' : 'bottom center',
			}"
		>
			{{ hoverTooltip }}
			<div
				ref="arrowRef"
				class="down-arrow"
				:style="{
					left: middlewareData.arrow
						? `${middlewareData.arrow.x}px`
						: undefined,
					top: placement === 'bottom' ? 0 : undefined,
					bottom: placement === 'top' ? 0 : undefined,
					translate: placement === 'bottom' ? '0 -50%' : '0 50%',
				}"
			></div>
		</div>
		<div
			v-if="
				info.type === 'chapterReward' && name !== 'Star Rod' && showStarTooltip
			"
			ref="tooltipRef"
			class="hover-tip star-tooltip"
			:style="{
				...floatingStyles,
				transformOrigin:
					placement === 'bottom' ? 'top center' : 'bottom center',
				width: 'max-content',
			}"
		>
			<div
				ref="arrowRef"
				class="down-arrow"
				:style="{
					left: middlewareData.arrow
						? `${middlewareData.arrow.x}px`
						: undefined,
					top: placement === 'bottom' ? 0 : undefined,
					bottom: placement === 'top' ? 0 : undefined,
					translate: placement === 'bottom' ? '0 -50%' : '0 50%',
				}"
			></div>
			<h3>Chapter Scaling</h3>
			<button
				v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 0]"
				:key="num"
				class="scaling"
				@click.prevent="
					playthroughStore.setSpiritAnnotation(
						name as keyof typeof chapterRewards,
						{ scaling: num }
					);
					showStarTooltip = false;
				"
			>
				<span v-if="num !== 0">{{ num }}</span>
				<svg
					v-else
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-6 h-6"
					:style="{
						width: '100%',
						height: '100%',
					}"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
					/>
				</svg>
			</button>

			<h3>Dungeon Entrances</h3>
			<button
				v-for="star in [
					...Object.getOwnPropertyNames(chapterRewards).slice(0, 7),
					'Bowser',
					'',
				]"
				:key="star"
				class="entrance"
				@click="
					playthroughStore.setSpiritAnnotation(
						name as keyof typeof chapterRewards,
						{ entrance: star }
					);
					showStarTooltip = false;
				"
			>
				<img
					v-if="star !== ''"
					:src="getImageUrl(`icons/${star}_PM.png`)"
					alt=""
				/>
				<svg
					v-else
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="white"
					class="w-6 h-6"
					:style="{
						width: '100%',
						height: '100%',
					}"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
					/>
				</svg>
			</button>

			<h3 v-if="options.requireSpecificSpirits">Require Specific Spirits</h3>
			<button
				v-if="options.requireSpecificSpirits"
				:style="{
					color: 'white',
					width: '100%',
					fontSize: '2rem',
					gridColumn: '1 / 9',
				}"
				@click="
					playthroughStore.toggleSpiritRequired(
						name as keyof typeof chapterRewards
					);
					showStarTooltip = false;
				"
			>
				{{
					playthroughStore.getSpiritAnnotation(
						name as keyof typeof chapterRewards
					).required
						? "Mark as Not Required"
						: "Mark as Required"
				}}
			</button>
		</div>
	</div>
</template>

<style scoped>
svg {
	display: block;
	margin: auto;
}

div.tracker-item {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	position: relative;
	cursor: pointer;
}

img {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

p {
	pointer-events: none;
}

.not-required {
	color: rgb(200, 0, 0);
	position: absolute;
	top: 0;
	left: 0;
	right: 40%;
	bottom: 40%;
	pointer-events: none;
}

p.label {
	position: absolute;
	top: 0;
	right: 4px;
	font-size: 2rem;
	stroke: 1px black;
	-webkit-text-stroke: 1px black;
	font-weight: bold;
}

p.count {
	font-size: 1.75rem;
	stroke: 1px black;
	-webkit-text-stroke: 1px black;
	position: absolute;
	bottom: 0;
	font-weight: bold;
}

p.checkmark {
	position: absolute;
	bottom: 0px;
	right: 4px;
	font-size: 2rem;
	color: #00dd00;
	stroke: 1px black;
	-webkit-text-stroke: 1px black;
}

div.small-annotation {
	position: absolute;
	pointer-events: none;
	bottom: 0px;
	right: 0px;
	width: 35%;
}

div.entrance-annotation {
	stroke: 1px black;
	-webkit-text-stroke: 1px black;
	font-weight: bold;
	/* font-size: 1.5rem; */
	place-items: center;
	width: 70%;
	display: grid;
	grid-template-columns: 1fr 1fr;
}

span.annotation-question-mark {
	font-size: 2rem;
	font-weight: 900;
	font-family: "Arial Black", Gadget, sans-serif;
	stroke: 3px black;
	-webkit-text-stroke: 3px black;
	text-shadow:
		white 0px 0px 8px,
		white 0px 0px 8px;
}

div.upgrades {
	display: flex;
	flex-direction: column-reverse;
}

div.upgrades > img {
	margin-top: -50%;
}

div.hover-tip {
	/* position: absolute;
	 top: 0; */
	/* translate: 0 -50%; */
	/* scale: 0; */
	/* transition: all 0.15s; */
	transform-origin: bottom center;
	/* pointer-events: none; */
	background-color: #101020;
	padding: 0.5rem 1rem;
	width: 20rem;
	border-radius: 8px;
	z-index: 10;
	animation: forwards tooltip-grow 0.15s;
}

@keyframes tooltip-grow {
	0% {
		transform: scale(0%);
	}
	100% {
		transform: scale(100%);
	}
}

button {
	/* pointer-events: all; */
	background-color: transparent;
	padding: 0;
	margin: 0;
	border: 0;
}

button.scaling {
	font-size: 3rem;
	color: white;
	stroke: 1px black;
	-webkit-text-stroke: 1px black;
	cursor: pointer;
}

button.entrance {
	cursor: pointer;
}

div.star-tooltip {
	display: grid;
	place-items: center;
	pointer-events: all;
	grid-template-columns: repeat(8, 3rem);
}

div.star-tooltip > h3 {
	opacity: 0.6;
	font-size: 1rem;
	text-align: left;
	width: 100%;
	grid-column: 1 / 9;
}

.down-arrow {
	width: 0;
	height: 0;
	padding: 0.6rem;
	rotate: 45deg;
	background-color: #101020;
	z-index: -10;
	/* border-left: 20px solid transparent;
	border-right: 20px solid transparent;
	border-top: 20px solid #101020; */
	position: absolute;
	/* left: 50%; */
	/* translate: -50% 0; */
}

.shrink > img {
	width: 70%;
	height: 70%;
}
.fade > img {
	filter: grayscale(1) brightness(50%);
}

.glow > img {
	filter: grayscale(0.6) brightness(80%) drop-shadow(0px 0px 5px white);
}
</style>
