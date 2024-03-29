
export class Charactermancer_Util {
	static getCurrentLevel (actor) {
		return actor.items.filter(it => it.type === "class").map(it => Number(it.system.levels || 0)).sum();
	}

	static getBaseAbilityScores (actor) { return this._getAbilityScores(actor, true); }

	static getCurrentAbilityScores (actor) { return this._getAbilityScores(actor, false); }

	static _getAbilityScores (actor, isBase) {
		const actorData = isBase ? (actor.system._source || actor.system) : actor.system;
		const out = {
			str: Number(MiscUtil.get(actorData, "abilities", "str", "value") || 0),
			dex: Number(MiscUtil.get(actorData, "abilities", "dex", "value") || 0),
			con: Number(MiscUtil.get(actorData, "abilities", "con", "value") || 0),
			int: Number(MiscUtil.get(actorData, "abilities", "int", "value") || 0),
			wis: Number(MiscUtil.get(actorData, "abilities", "wis", "value") || 0),
			cha: Number(MiscUtil.get(actorData, "abilities", "cha", "value") || 0),
		};
		Object.entries(out)
			.forEach(([abv, val]) => {
				if (isNaN(val)) out[abv] = 0;
			});
		return out;
	}

	static getBaseHp (actor) {
		return this._getHp(actor, true);
	}

	static _getHp (actor, isBase) {
		const actorData = isBase ? (actor.system._source || actor.system) : actor.system;
		return {
			value: (actorData?.attributes?.hp?.value || 0),
						max: actorData?.attributes?.hp?.max,
		};
	}

	static getAttackAbilityScore (itemAttack, abilityScores, mode) {
		if (!itemAttack || !abilityScores) return null;
		switch (mode) {
			case "melee": {
				const isFinesse = !!MiscUtil.get(itemAttack, "system", "properties", "fin");
				if (!isFinesse) return abilityScores.str;
				return abilityScores.str > abilityScores.dex ? abilityScores.str : abilityScores.dex;
			}
			case "ranged": {
				const isThrown = !!MiscUtil.get(itemAttack, "system", "properties", "thr");
				if (!isThrown) return abilityScores.dex;
				return abilityScores.str > abilityScores.dex ? abilityScores.str : abilityScores.dex;
			}
			default: throw new Error(`Unhandled mode "${mode}"`);
		}
	}

		static getFilteredFeatures (allFeatures, pageFilter, filterValues) {
		return allFeatures.filter(f => {
			const source = f.source
				|| (f.classFeature
					? DataUtil.class.unpackUidClassFeature(f.classFeature).source : f.subclassFeature ? DataUtil.class.unpackUidSubclassFeature(f.subclassFeature) : null);

						if (!pageFilter.sourceFilter.toDisplay(filterValues, source)) return false;

									f.loadeds = f.loadeds.filter(meta => {
				return Charactermancer_Class_Util.isClassEntryFilterMatch(meta.entity, pageFilter, filterValues);
			});

			return f.loadeds.length;
		});
	}

	//TIP: Charactermancer_Util.getImportableFeatures
	static getImportableFeatures (allFeatures) {
		return allFeatures.filter(f => {
			if (f.gainSubclassFeature && !f.gainSubclassFeatureHasContent) return false;

			const lowName = f.name.toLowerCase();
			switch (lowName) {
				case "proficiency versatility": return false;
				default: return true;
			}
		});
	}

	static doApplyFilterToFeatureEntries_bySource (allFeatures, pageFilter, filterValues) {
				allFeatures.forEach(f => {
			f.loadeds.forEach(loaded => {
				switch (loaded.type) {
					case "classFeature":
					case "subclassFeature": {
						if (loaded.entity.entries) loaded.entity.entries = Charactermancer_Class_Util.getFilteredEntries_bySource(loaded.entity.entries, pageFilter, filterValues);
						break;
					}
				}
			});
		});

		return allFeatures;
	}

	//TIP: getFeaturesGroupedByOptionsSet
	static getFeaturesGroupedByOptionsSet (allFeatures) {
		return allFeatures.map(topLevelFeature => {
			const optionsSets = [];

			let optionsStack = [];
			let lastOptionsSetId = null;
			topLevelFeature.loadeds.forEach(l => {
				const optionsSetId = MiscUtil.get(l, "optionsMeta", "setId") || null;
				if (lastOptionsSetId !== optionsSetId) {
					if (optionsStack.length) optionsSets.push(optionsStack);
					optionsStack = [l];
					lastOptionsSetId = optionsSetId;
				} else {
					optionsStack.push(l);
				}
			});
			if (optionsStack.length) optionsSets.push(optionsStack);

			return {topLevelFeature, optionsSets};
		});
	}
	
		static getFilterSearchMeta ({comp, prop, propVersion = null, data, modalFilter, title}) {
		const {$wrp: $sel, fnUpdateHidden: fnUpdateSelHidden, unhook} = ComponentUiUtil.$getSelSearchable(
			comp,
			prop,
			{
				values: data.map((_, i) => i),
				isAllowNull: true,
				fnDisplay: ix => {
					const it = data[ix];

					if (!it) { 						console.warn(...LGT, `Could not find ${prop} with index ${ix} (${data.length} ${prop} entries were available)`);
						return "(Unknown)";
					}

					return `${it.name} ${it.source !== Parser.SRC_PHB ? `[${Parser.sourceJsonToAbv(it.source)}]` : ""}`;
				},
				fnGetAdditionalStyleClasses: ix => {
					if (ix == null) return null;
					const it = data[ix];
					if (!it) return; 					return it._versionBase_isVersion ? ["italic"] : null;
				},
				asMeta: true,
			},
		);

		const doApplyFilterToSel = () => {
			const f = modalFilter.pageFilter.filterBox.getValues();
			const isHiddenPer = data.map(it => !modalFilter.pageFilter.toDisplay(f, it));
			fnUpdateSelHidden(isHiddenPer, false);
		};

		modalFilter.pageFilter.filterBox.on(
			FilterBox.EVNT_VALCHANGE,
			doApplyFilterToSel,
		);
		doApplyFilterToSel();

		const $btnFilter = $(`<button class="btn btn-xs btn-5et br-0 pr-2" title="Filter for a ${title}"><span class="glyphicon glyphicon-filter"></span> Filter</button>`)
			.click(async () => {
				const selecteds = await modalFilter.pGetUserSelection();
				if (selecteds == null || !selecteds.length) return;

				const selected = selecteds[0];
				const ix = data.findIndex(it => it.name === selected.name && it.source === selected.values.sourceJson);
				if (!~ix) throw new Error(`Could not find selected entity: ${JSON.stringify(selected)}`); 				comp._state[prop] = ix;
			});

		const {$stg: $stgSelVersion = null, unhook: unhookVersion = null} = this._getFilterSearchMeta_getVersionMeta({comp, prop, propVersion, data}) || {};

		return {
			$sel,
			$btnFilter,
			$stgSelVersion,
			unhook: () => {
				unhook();
				modalFilter.pageFilter.filterBox.off(FilterBox.EVNT_VALCHANGE, doApplyFilterToSel);
				if (unhookVersion) unhookVersion();
			},
		};
	}

	static _getFilterSearchMeta_getVersionMeta ({comp, prop, propVersion, data}) {
		if (!propVersion) return;

		const {$sel, setValues, unhook} = ComponentUiUtil.$getSelEnum(
			comp,
			propVersion,
			{
				values: [],
				isAllowNull: true,
				displayNullAs: "(Base version)",
				fnDisplay: it => `${it.name}${it.source !== data[comp._state[prop]]?.source ? ` (${Parser.sourceJsonToAbv(it.source)})` : ""}`,
				asMeta: true,
				isSetIndexes: true,
			},
		);

		const hkProp = () => {
			const ent = data[comp._state[prop]];
			if (ent == null) {
				setValues([]);
				return $stg.hideVe();
			}

			const versions = DataUtil.generic.getVersions(ent);
			setValues(versions);
			$stg.toggleVe(versions.length);
		};
		comp._addHookBase(prop, hkProp);

		const $stg = $$`<div class="ve-flex-col mt-2">
			<label class="split-v-center btn-group w-100">
				<div class="mr-2">Version:</div>
				${$sel}
			</label>
		</div>`;

		hkProp();

		return {
			$stg,
			unhook: () => {
				unhook();
				comp._removeHookBase(prop, hkProp);
			},
		};
	}
}
Charactermancer_Util.STR_WARN_SOURCE_SELECTION = `Did you change your source selection since using the Charactermancer initially?`;
class Charactermancer_Race_Util {
	static async pPostLoadPrereleaseBrew (fileData) {
		const out = {race: []};

		if (fileData.race) out.race.push(...Renderer.race.mergeSubraces(fileData.race, {isAddBaseRaces: true}));

		if (fileData.subrace) {
			const baseListSite = MiscUtil.copy((await Vetools.pGetRaces({isAddBaseRaces: true})).race);
			baseListSite.forEach(it => PageFilterRaces.mutateForFilters(it));

			const baseListBrew = MiscUtil.copy([...fileData.race || []]);
			baseListBrew.forEach(it => PageFilterRaces.mutateForFilters(it));
			const baseList = [...baseListBrew, ...baseListSite];

			const nxtData = Renderer.race.adoptSubraces(baseList, fileData.subrace);
			const mergedNxtData = Renderer.race.mergeSubraces(nxtData);

			out.race.push(...mergedNxtData);
		}

		return out;
	}
}

class Charactermancer_Race_SizeSelect extends BaseComponent {
		static async pGetUserInput ({sizes}) {
		if (!sizes || !sizes.length) return {isFormComplete: true, data: Parser.SZ_MEDIUM};
		const comp = new this({sizes});
		if (comp.isNoChoice()) return comp.pGetFormData();
		return UtilApplications.pGetImportCompApplicationFormData({comp, isAutoResize: true});
	}
	
		constructor (opts) {
		opts = opts || {};
		super();

		this._sizes = opts.sizes || [Parser.SZ_MEDIUM];
	}

	get modalTitle () { return `Choose Size`; }

	render ($wrp) {
		if (this._sizes.length === 1) {
			$wrp.append(`<div>${Parser.sizeAbvToFull(this._sizes[0])}</div>`);
			return;
		}

		ComponentUiUtil.$getSelEnum(
			this,
			"size",
			{
				values: this._sizes,
				isAllowNull: true,
				fnDisplay: Parser.sizeAbvToFull,
			},
		)
			.appendTo($wrp);
	}

	isNoChoice () { return this._sizes.length <= 1; }

	pGetFormData () {
		return {
			isFormComplete: this._state.size != null,
			data: this._sizes.length === 1 ? this._sizes[0] : this._state.size,
		};
	}
}
class Charactermancer_FeatureSourceTracker extends BaseComponent {
	constructor () {
		super();
		this._registered = new Map();
	}

	register (comp) {
		this._registered.set(comp, {state: null, hookMetas: []});
	}

	_validateProp (propPulse) {
		if (!Charactermancer_FeatureSourceTracker._VALID_HOOK_PROPS.has(propPulse)) throw new Error(`Unhandled pulse prop "${propPulse}"`);
	}

	addHook (comp, propPulse, hk) {
		this._validateProp(propPulse);

		if (!this._registered.has(comp)) this.register(comp);

		this._registered.get(comp).hookMetas.push({propPulse, hook: hk});
		this._addHookBase(propPulse, hk);
	}

	removeHook (comp, propPulse, hk) {
		this._validateProp(propPulse);

		if (!this._registered.has(comp)) return;

		const compMeta = this._registered.get(comp);
		const ixHook = compMeta.hookMetas.findIndex(it => it.hook === hk);
		if (~ixHook) compMeta.hookMetas.splice(ixHook, 1);
		this._removeHookBase(propPulse, hk);
	}

		setState (comp, state) {
		if (!this._registered.has(comp)) this.register(comp);

		const compMeta = this._registered.get(comp);

		const prevState = compMeta.state ? MiscUtil.copy(compMeta.state) : compMeta.state;
		compMeta.state = state;

		const allKeys = new Set([
			...Object.keys(prevState || {}),
			...Object.keys(state || {}),
		]);

				allKeys
			.forEach(k => {
				const oldVal = prevState?.[k];
				const nuVal = state?.[k];

				if (CollectionUtil.deepEquals(oldVal, nuVal)) return;

				this._doPulseForProp(k);
			});
	}

		getStatesForKey (key, {ignore = null} = {}) {
		const out = [];
		for (const [comp, compMeta] of this._registered.entries()) {
			if (ignore === comp) continue;
			if (compMeta?.state?.[key]) out.push(compMeta.state[key]);
		}
		return out;
	}

		unregister (comp) {
		if (!comp) return;

		const registered = this._registered.get(comp);
		if (!registered) return;

				this._registered.delete(comp);

				registered.hookMetas.forEach(({propPulse, hook}) => {
			this._removeHookBase(propPulse, hook);
		});

				if (registered.state) {
			Object.keys(registered.state)
				.forEach(k => { 					this._doPulseForProp(k);
				});
		}
	}

	_doPulseForProp (k) {
		switch (k) {
			case "skillProficiencies": return this._state.pulseSkillProficiencies = !this._state.pulseSkillProficiencies;
			case "languageProficiencies": return this._state.pulseLanguageProficiencies = !this._state.pulseLanguageProficiencies;
			case "toolProficiencies": return this._state.pulseToolProficiencies = !this._state.pulseToolProficiencies;
			case "armorProficiencies": return this._state.pulseArmorProficiencies = !this._state.pulseArmorProficiencies;
			case "weaponProficiencies": return this._state.pulseWeaponProficiencies = !this._state.pulseWeaponProficiencies;
			case "features": return this._state.pulseFeatures = !this._state.pulseFeatures;
			case "savingThrowProficiencies": return this._state.pulseSavingThrowProficiencies = !this._state.pulseSavingThrowProficiencies;
			case "immune": return this._state.pulseImmune = !this._state.pulseImmune;
			case "resist": return this._state.pulseResist = !this._state.pulseResist;
			case "vulnerable": return this._state.pulseVulnerable = !this._state.pulseVulnerable;
			case "conditionImmune": return this._state.pulseConditionImmune = !this._state.pulseConditionImmune;
			case "expertise": return this._state.pulseExpertise = !this._state.pulseExpertise;
			default: throw new Error(`Unhandled tracked state key ${k}`);
		}
	}

	_getDefaultState () {
		return [...Charactermancer_FeatureSourceTracker._VALID_HOOK_PROPS].mergeMap(it => ({[it]: false}));
	}
}
Charactermancer_FeatureSourceTracker._VALID_HOOK_PROPS = new Set([
	"pulseSkillProficiencies",
	"pulseLanguageProficiencies",
	"pulseToolProficiencies",
	"pulseArmorProficiencies",
	"pulseWeaponProficiencies",
	"pulseFeatures",
	"pulseSavingThrowProficiencies",
	"pulseImmune",
	"pulseResist",
	"pulseVulnerable",
	"pulseConditionImmune",
	"pulseExpertise",
]);

class Charactermancer_AbilityScoreSelect extends BaseComponent {
		static async pFillActorAbilityData (actor, ability, actUpdate, opts) {
		if (!ability || !ability.length) return;

		const formData = await this.pGetUserInput(ability);
		if (!formData) return opts.isCancelled = true;
		if (formData === VeCt.SYM_UI_SKIP) return;

		actUpdate.system = actUpdate.system || {};
		actUpdate.system.abilities = actUpdate.system.abilities || {};
		const abilityScores = Charactermancer_Util.getBaseAbilityScores(actor);
		Parser.ABIL_ABVS.filter(ab => formData.data[ab]).forEach(ab => actUpdate.system.abilities[ab] = {value: abilityScores[ab] + formData.data[ab]});

		return formData;
	}

	static async pGetUserInput (ability) {
		if (!ability || !ability.length) return {isFormComplete: true, data: {}};

		const comp = new Charactermancer_AbilityScoreSelect({ability});
		if (comp.isNoChoice()) {
			const isFill = await InputUiUtil.pGetUserBoolean({
				title: `Ability Scores?`,
				htmlDescription: `Do you wish to apply ability score modifications?`,
				textYes: "Yes",
				textNo: "No",
			});
			if (isFill == null) return null;
			if (!isFill) return {isFormComplete: true, data: {}};
			return comp.pGetFormData();
		}

		return UtilApplications.pGetImportCompApplicationFormData({comp, isAutoResize: true});
	}
	
		constructor (opts) {
		opts = opts || {};
		super();

		this._ability = opts.ability;

		this._lastMeta = null;
	}

	get modalTitle () { return "Ability Score Increase"; }

	render ($wrp) {
		let $stgSelGroup = null;
		if (this._ability.length > 1) {
			const $selIxSet = ComponentUiUtil.$getSelEnum(
				this,
				"ixSet",
				{
					values: this._ability.map((_, i) => i),
					fnDisplay: ix => Renderer.getAbilityData([this._ability[ix]]).asText,
				},
			);

			$stgSelGroup = $$`<div class="w-100 mb-2 ve-flex-vh-center">
				${$selIxSet}
			</div>`;
		}

		const $stgGroup = $$`<div class="ve-flex-col"></div>`;

		const hkIxSet = () => {
			$stgGroup.empty();

			if (this._lastMeta) this._lastMeta.cleanup();

			const abilitySet = this._ability[this._state.ixSet];

			const ptsNoChoose = Parser.ABIL_ABVS.filter(ab => abilitySet[ab]).map(ab => `${Parser.attAbvToFull(ab)} ${UiUtil.intToBonus(abilitySet[ab], {isPretty: true})}`);
			if (ptsNoChoose.length) $stgGroup.append(`<div>${ptsNoChoose.join(", ")}</div>${abilitySet.choose ? `<hr class="hr-2 hr--dotted">` : ""}`);

			if (abilitySet.choose) {
				if (abilitySet.choose.from) this._render_renderPtChooseFrom($stgGroup, abilitySet);
				else if (abilitySet.choose.weighted) this._render_renderPtChooseWeighted($stgGroup, abilitySet);
			}
		};
		this._addHookBase("ixSet", hkIxSet);
		hkIxSet();

		$$($wrp)`
			${$stgSelGroup}
			${$stgGroup}
		`;
	}

	_render_renderPtChooseFrom ($stgGroup, abilitySet) {
		const count = abilitySet.choose.count || 1;
		const amount = abilitySet.choose.amount || 1;

		this._lastMeta = ComponentUiUtil.getMetaWrpMultipleChoice(
			this,
			"race_asiChoice",
			{
				values: abilitySet.choose.from,
				fnDisplay: v => `${Parser.attAbvToFull(v)} ${UiUtil.intToBonus(amount, {isPretty: true})}`,
				count,
			},
		);

		$stgGroup.append(`<div class="mb-1">Choose ${Parser.numberToText(count)} ability score${count === 1 ? "" : "s"} to increase by ${amount}:</div>`);
		this._lastMeta.$ele.appendTo($stgGroup);
	}

	_getWeightedProps (ixAb, ixWeight) {
		return {
			propWeightAbility: `weight_ability_${ixAb}_${ixWeight}`,
		};
	}

	_render_renderPtChooseWeighted ($stgGroup, abilitySet) {
		const fnsCleanup = [];

		const from = this.constructor._getSortedWeightedFrom(abilitySet);
		const weights = this.constructor._getSortedWeights(abilitySet);

		const $wrpRows = $(`<div class="ve-flex-col"></div>`);

		from.forEach((ab, ixAb) => {
			const $wrpsCbs = weights
				.map((bon, ixBon) => {
					const {propWeightAbility} = this._getWeightedProps(ixAb, ixBon);

					const metaCb = ComponentUiUtil.$getCbBool(
						this,
						propWeightAbility,
						{asMeta: true},
					);
					fnsCleanup.push(metaCb.unhook);

					const hkResetOthers = () => {
						if (!this._state[propWeightAbility]) return;

						const nxtState = {};

												from.forEach((_, ixAbSub) => {
							const {propWeightAbility: propWeightAbilitySub} = this._getWeightedProps(ixAbSub, ixBon);
							if (propWeightAbilitySub === propWeightAbility) return;
							nxtState[propWeightAbilitySub] = false;
						});

												weights.forEach((_, ixBonSub) => {
							const {propWeightAbility: propWeightAbilitySub} = this._getWeightedProps(ixAb, ixBonSub);
							if (propWeightAbilitySub === propWeightAbility) return;
							nxtState[propWeightAbilitySub] = false;
						});

						this._proxyAssignSimple("state", nxtState);
					};
					this._addHookBase(propWeightAbility, hkResetOthers);
					fnsCleanup.push(() => this._removeHookBase(propWeightAbility, propWeightAbility));
					hkResetOthers();

					return $$`<label class="ve-flex-vh-center w-40p py-1">${metaCb.$cb}</label>`;
				});

			const $row = $$`<div class="ve-flex-v-center">
				<div class="w-100p text-right pr-2">${Parser.attAbvToFull(ab)}</div>
				${$wrpsCbs}
			</div>`.appendTo($wrpRows);
		});

		$$($stgGroup)`<div class="ve-flex-col">
			<div class="mb-1">${Renderer.getAbilityData([{choose: abilitySet.choose}]).asText}:</div>

			<div class="ve-flex-v-center py=1">
				<div class="w-100p"></div>
				${weights.map(it => `<div class="w-40p ve-flex-vh-center">${UiUtil.intToBonus(it, {isPretty: true})}</div>`).join("")}
			</div>

			${$wrpRows}
		</div>`;

		this._lastMeta = {
			cleanup: () => {
				fnsCleanup.forEach(it => it());
			},
		};
	}

	isNoChoice () { return this._ability.length === 1 && !this._ability[0].choose; }

	static _getSortedWeights (abilitySet) { return MiscUtil.copy(abilitySet.choose.weighted.weights).sort((a, b) => SortUtil.ascSort(b, a)); }
	static _getSortedWeightedFrom (abilitySet) { return MiscUtil.copy(abilitySet.choose.weighted.from).sort(SortUtil.ascSortAtts); }

	pGetFormData () {
		const out = {};

		const abilitySet = this._ability[this._state.ixSet];

				Parser.ABIL_ABVS.forEach(ab => { if (abilitySet[ab]) out[ab] = abilitySet[ab]; });

		if (abilitySet.choose) {
			if (abilitySet.choose.from) {
				const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this, "race_asiChoice");
				ixs.map(it => abilitySet.choose.from[it]).forEach(ab => out[ab] = (out[ab] || 0) + (abilitySet.choose.amount || 1));
			} else if (abilitySet.choose.weighted) {
				const from = this.constructor._getSortedWeightedFrom(abilitySet);
				const weights = this.constructor._getSortedWeights(abilitySet);

				from.forEach((ab, ixAb) => {
					weights
						.map((bon, ixBon) => {
							const {propWeightAbility} = this._getWeightedProps(ixAb, ixBon);
							if (this._state[propWeightAbility]) out[ab] = (out[ab] || 0) + bon;
						});
				});
			}
		}

		return {
			isFormComplete: !!this._state[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsAcceptable("race_asiChoice")],
			data: out,
		};
	}

	_getDefaultState () {
		return {
			ixSet: 0,
		};
	}
}

class Charactermancer_ProficiencySelect extends BaseComponent {}

Charactermancer_ProficiencySelect.PropGroup = class {
	constructor ({prop, propTrackerPulse, propTracker}) {
		this.prop = prop;
		this.propTrackerPulse = propTrackerPulse;
		this.propTracker = propTracker;
	}
};

class Charactermancer_SkillSaveProficiencySelect extends Charactermancer_ProficiencySelect {
			static async pGetUserInput (opts) {
		opts = opts || {};

		if (!opts.available) return {isFormComplete: true, data: {}};

		const comp = new this({
			...opts,
			existing: this.getExisting(opts.existingFvtt),
			existingFvtt: opts.existingFvtt,
		});
		if (comp.isNoChoice()) return comp.pGetFormData();

		return UtilApplications.pGetImportCompApplicationFormData({comp, isAutoResize: true});
	}

		static getExisting (existingFvtt) { throw new Error(`Unimplemented!`); }

	static isNoChoice (available) {
		if (!available?.length) return true; 		return available.length === 1 && !available[0].choose;
	}
	
		constructor (opts) {
		opts = opts || {};
		super();

		this._propGroup = opts.propGroup;
		this._existing = opts.existing;
		this._existingFvtt = opts.existingFvtt;
		this._available = opts.available;
		this._titlePrefix = opts.titlePrefix;
		this._featureSourceTracker = opts.featureSourceTracker;
		this._modalTitle = opts.modalTitle;
		this._title = opts.title;
		this._titlePlural = opts.titlePlural;

		this._hkUpdateExisting = null;
		this._$stgGroup = null;
		this._lastMeta = null;
	}

	get modalTitle () { return this._modalTitle; }

		_getStaticDisplay (prof, {isPlainText = false} = {}) { throw new Error(`Unimplemented!`); }
		_getMultiChoiceDisplay ($ptsExisting, profOrObj) { throw new Error(`Unimplemented!`); }
		_getMultiChoiceTitle (cpyProfSet, count) { throw new Error(`Unimplemented!`); }

	_getNonStaticDisplay (key, value, {isPlainText = false} = {}) {
		switch (key) {
			case "choose": return this._getChooseFromDisplay(key, value, {isPlainText});
			default: throw new Error(`Unhandled non-static key "${key}" (value was ${JSON.stringify(value)})`);
		}
	}

	_getChooseFromDisplay (key, value, {isPlainText = false} = {}) {
		return `Choose ${value.count || 1} from ${value.from.map(it => this._getStaticDisplay(it, {isPlainText})).join(", ")}`;
	}

	render ($wrp) {
		const $stgSelGroup = this._render_$getStgSelGroup();
		this._$stgGroup = $$`<div class="ve-flex-col"></div>`;

		this._addHookBase("ixSet", this._hk_ixSet.bind(this));
		this._hk_ixSet();

		$$($wrp)`
			${$stgSelGroup}
			${this._$stgGroup}
		`;
	}

	_render_$getStgSelGroup () {
		if (this._available.length <= 1) return null;

		const $selIxSet = ComponentUiUtil.$getSelEnum(
			this,
			"ixSet",
			{
				values: this._available.map((_, i) => i),
				fnDisplay: ix => {
					const v = this._available[ix];

					const out = [];

					out.push(
						Object.keys(v)
							.sort(SortUtil.ascSortLower)
							.filter(it => this._isStaticKey(it))
							.map(k => this._getStaticDisplay(k, {isPlainText: true}))
							.join(", "),
					);

					Object.keys(v)
						.filter(it => !this._isStaticKey(it))
						.forEach(k => out.push(this._getNonStaticDisplay(k, v[k], {isPlainText: true})));

					return out.filter(Boolean).join("; ") || "(Nothing)";
				},
			},
		);

		if (this._featureSourceTracker) this._addHookBase("ixSet", () => this._doSetTrackerState());

		return $$`<div class="w-100 mb-2 ve-flex-vh-center">
			${$selIxSet}
		</div>`;
	}

	_doSetTrackerState () {
		this._featureSourceTracker.setState(this, {[this._propGroup.propTracker]: this._getFormData().data?.[this._propGroup.prop]});
	}

	static _getSortedProfSet (profSet) {
		if (!profSet) return profSet;

		profSet = MiscUtil.copy(profSet);

		if (profSet.choose?.from) {
			profSet.choose.from.sort((a, b) => {
				if (typeof a === "object" && typeof b === "object") return 0;
				if (typeof a === "object") return 1;
				if (typeof b === "object") return -1;
				return SortUtil.ascSortLower(a, b);
			});
		}

		return profSet;
	}

	_render_renderPtStatic ($stgGroup, profSet) {
		const $ptsExisting = {};

		const profList = this._getStaticKeys_profSet()
			.filter(key => profSet[key]);

		const $wrps = profList
			.map((it, i) => {
				const $ptExisting = $(`<div class="ve-small veapp__msg-warning inline-block"></div>`);
				($ptsExisting[it] = $ptsExisting[it] || []).push($ptExisting);
				const isNotLast = i < profList.length - 1;
				return $$`<div class="inline-block ${isNotLast ? "mr-1" : ""}">${this._getStaticDisplay(it)}${$ptExisting}${isNotLast ? `,` : ""}</div>`;
			});

		$$`<div class="block">
			${$wrps}
		</div>`.appendTo($stgGroup);

		return $ptsExisting;
	}

	_getStaticKeys_all () { throw new Error("Unimplemented!"); }

	_getStaticKeys_profSet () { throw new Error("Unimplemented!"); }

	_hk_ixSet () {
		this._$stgGroup.empty();

		if (this._featureSourceTracker && this._hkUpdateExisting) this._featureSourceTracker.removeHook(this, this._propGroup.propTrackerPulse, this._hkUpdateExisting);
		if (this._lastMeta) this._lastMeta.cleanup();

		const profSet = this._available[this._state.ixSet];

		if (this._featureSourceTracker) this._doSetTrackerState();

		this._hk_ixSet_renderPts(profSet);

		if (this._featureSourceTracker) this._featureSourceTracker.addHook(this, this._propGroup.propTrackerPulse, this._hkUpdateExisting);
		this._hkUpdateExisting();
	}

	_hk_ixSet_renderPts (profSet) {
		const $ptsExistingStatic = Object.keys(profSet).some(it => this._isStaticKey(it)) ? this._render_renderPtStatic(this._$stgGroup, profSet) : null;

		if ($ptsExistingStatic && profSet.choose) this._$stgGroup.append(`<hr class="hr-2 hr--dotted">`);
		const $ptsExistingChooseFrom = profSet.choose ? this._render_renderPtChooseFrom(this._$stgGroup, profSet) : null;

		this._hkUpdateExisting = () => this._hk_updatePtsExisting($ptsExistingStatic, $ptsExistingChooseFrom);
	}

	_isStaticKey (key) { return this._getStaticKeys_all().includes(key); }

	_hk_updatePtsExisting ($ptsExistingStatic, $ptsExistingChoose) {
		const otherStates = this._featureSourceTracker ? this._featureSourceTracker.getStatesForKey(this._propGroup.propTracker, {ignore: this}) : null;

		const $ptsExistings = [$ptsExistingStatic, $ptsExistingChoose].filter(Boolean);

		this._getStaticKeys_all()
			.forEach(prof => {
				$ptsExistings.forEach($ptsExisting => {
					if (!$ptsExisting[prof]) return;

										let maxExisting = this._existing?.[prof] || 0;

										if (otherStates) otherStates.forEach(otherState => maxExisting = Math.max(maxExisting, otherState[prof] || 0));

					if (maxExisting) {
						const helpText = maxExisting === 1
							? `Proficient from Another Source`
							: maxExisting === 2 ? `Proficient with Expertise from Another Source` : `Half-Proficient from Another Source`;

						$ptsExisting[prof]
							.forEach($ptExisting => {
								$ptExisting
									.title(helpText)
									.addClass("ml-1")
									.html(`(<i class="fas fa-fw ${UtilActors.PROF_TO_ICON_CLASS[maxExisting]}"></i>)`);
							});
					} else {
						$ptsExisting[prof]
							.forEach($ptExisting => {
								$ptExisting
									.title("")
									.removeClass("ml-1")
									.html("");
							});
					}
				});
			});
	}

	_render_renderPtChooseFrom ($stgGroup, profSet) {
		const count = profSet.choose.count || 1;

		const cpyProfSet = this.constructor._getSortedProfSet(profSet);

		const $ptsExisting = {};
		const multiChoiceMeta = ComponentUiUtil.getMetaWrpMultipleChoice(
			this,
			"proficiencyChoice",
			{
				count,
				values: cpyProfSet.choose.from,
				fnDisplay: profOrObj => this._getMultiChoiceDisplay($ptsExisting, profOrObj),
			},
		);

				let hkSetTrackerInfo = null;
		if (this._featureSourceTracker) {
			hkSetTrackerInfo = () => this._doSetTrackerState();
			this._addHookBase(multiChoiceMeta.propPulse, hkSetTrackerInfo);
		}
		
		$stgGroup.append(`<div class="mb-1">${this._getMultiChoiceTitle(cpyProfSet, count)}:</div>`);
		multiChoiceMeta.$ele.appendTo($stgGroup);

		this._lastMeta = {
			cleanup: () => {
				multiChoiceMeta.cleanup();
				if (hkSetTrackerInfo) this._removeHookBase(multiChoiceMeta.propPulse, hkSetTrackerInfo);
			},
		};

		return $ptsExisting;
	}

	isNoChoice () { return this.constructor.isNoChoice(this._available); }

	_getFormData () {
		const out = {};

		const profSet = this._available[this._state.ixSet];

		const cpyProfSet = this.constructor._getSortedProfSet(profSet);

				this._getStaticKeys_all().filter(name => cpyProfSet[name]).map(name => out[name] = 1);

		if (cpyProfSet.choose) {
			const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this, "proficiencyChoice");
			ixs.map(it => cpyProfSet.choose.from[it]).forEach(name => out[name] = 1);
		}

		return {
			isFormComplete: !!this._state[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsAcceptable("proficiencyChoice")],
			data: {
				[this._propGroup.prop]: out,
			},
		};
	}

	pGetFormData () { return this._getFormData(); }

	_getDefaultState () {
		return {
			ixSet: 0,
		};
	}
}

class Charactermancer_OtherProficiencySelect extends Charactermancer_ProficiencySelect {
			static async pGetUserInput (opts) {
		opts = opts || {};

		if (!opts.available) return {isFormComplete: true, data: {}};

		const comp = new this({
			...opts,
			existing: this.getExisting(opts.existingFvtt),
			existingFvtt: opts.existingFvtt,
		});
		if (comp.isNoChoice()) return comp.pGetFormData();

		return UtilApplications.pGetImportCompApplicationFormData({
			comp,
			width: 640,
			isAutoResize: true,
		});
	}

	static getExistingFvttFromActor (actor) {
		return {
			skillProficiencies: MiscUtil.get(actor, "_source", "system", "skills"),
			toolProficiencies: MiscUtil.get(actor, "_source", "system", "tools"),
			languageProficiencies: MiscUtil.get(actor, "_source", "system", "traits", "languages"),
			armorProficiencies: MiscUtil.get(actor, "_source", "system", "traits", "armorProf"),
			weaponProficiencies: MiscUtil.get(actor, "_source", "system", "traits", "weaponProf"),
			savingThrowProficiencies: MiscUtil.get(actor, "_source", "system", "abilities"),
		};
	}

	static getExisting (existingFvtt) {
		return {
			skillProficiencies: this._getExistingSkillToolProficiencies({
				existingProficienciesSetFvtt: existingFvtt.skillProficiencies,
				mapAbvToFull: UtilActors.SKILL_ABV_TO_FULL,
			}),
			toolProficiencies: this._getExistingSkillToolProficiencies({
				existingProficienciesSetFvtt: existingFvtt.toolProficiencies,
				mapAbvToFull: UtilActors.SKILL_ABV_TO_FULL,
			}),
			languageProficiencies: this._getExistingProficiencies({
				existingProficienciesSetFvtt: existingFvtt?.languageProficiencies,
				vetToFvttProfs: UtilActors.VALID_LANGUAGES,
				allProfsVet: Parser.LANGUAGES_ALL,
			}),
			armorProficiencies: this._getExistingProficiencies({
				existingProficienciesSetFvtt: existingFvtt?.armorProficiencies,
				vetToFvttProfs: UtilActors.VALID_ARMOR_PROFICIENCIES,
				allProfsVet: UtilActors.ARMOR_PROFICIENCIES,
			}),
			weaponProficiencies: this._getExistingProficiencies({
				existingProficienciesSetFvtt: existingFvtt?.weaponProficiencies,
				vetToFvttProfs: UtilActors.VALID_WEAPON_PROFICIENCIES,
				allProfsVet: UtilActors.WEAPON_PROFICIENCIES,
			}),
			savingThrowProficiencies: this._getExistingSavingThrowProficiencies(existingFvtt),
		};
	}

	static isNoChoice (available) {
		return this._isNoChoice({available});
	}

	static _isNoChoice ({available, isAlreadyMapped}) {
		if (!available?.length) return true; 
		if (isAlreadyMapped && !this._isValidAvailableData(available)) throw new Error(`Proficiency data was not valid! Data was:\n${JSON.stringify(available)}`);

		if (!isAlreadyMapped) available = Charactermancer_OtherProficiencySelect._getNormalizedAvailableProficiencies(available);

		return available.length === 1 && !available[0].choose;
	}

		static _isValidAvailableData (available) {
		if (!(available instanceof Array)) return false;

		for (const profSet of available) {
			const badKeys = Object.keys(profSet).filter(it => it !== "static" && it !== "choose");
			if (badKeys.length) return false;

			if ((profSet.static || []).filter(it => !it.prop).length) return false;
			if ((profSet.choose || []).filter(it => it.from && it.from.some(from => !from.prop)).length) return false;
			if ((profSet.choose || []).filter(it => it.fromFilter && !it.prop).length) return false;
		}

		return true;
	}

		static getMappedSkillProficiencies (skillProficiencies) {
		if (!skillProficiencies) return skillProficiencies;
		return skillProficiencies.map(it => {
			it = MiscUtil.copy(it);
			if (it.any) { it.anySkill = it.any; delete it.any; }
			if (it.choose?.from && CollectionUtil.setEq(new Set(it.choose.from), new Set(Renderer.generic.FEATURE__ALL_SKILLS))) {
				it.anySkill = it.choose.count ?? 1;
				delete it.choose;
			}
			this._getMappedProficiencies_expandChoose({proficienciesSet: it, prop: "skillProficiencies"});
			return it;
		});
	}

		static getMappedLanguageProficiencies (languageProficiencies) {
		if (!languageProficiencies) return languageProficiencies;
		return languageProficiencies.map(it => {
			it = MiscUtil.copy(it);
			if (it.any) { it.anyLanguage = it.any; delete it.any; }
			if (it.anyStandard) { it.anyStandardLanguage = it.anyStandard; delete it.anyStandard; }
			if (it.anyExotic) { it.anyExoticLanguage = it.anyExotic; delete it.anyExotic; }
			this._getMappedProficiencies_expandChoose({proficienciesSet: it, prop: "languageProficiencies"});
			this._getMappedProficiencies_expandStatic({proficienciesSet: it, prop: "languageProficiencies"});
			return it;
		});
	}

		static getMappedToolProficiencies (toolProficiencies) {
		if (!toolProficiencies) return toolProficiencies;
		return toolProficiencies.map(it => {
			it = MiscUtil.copy(it);
			if (it.any) { it.anyTool = it.any; delete it.any; }
			if (it.anyArtisans) { it.anyArtisansTool = it.anyArtisans; delete it.anyArtisans; } 			this._getMappedProficiencies_expandChoose({proficienciesSet: it, prop: "toolProficiencies"});
			this._getMappedProficiencies_expandStatic({proficienciesSet: it, prop: "toolProficiencies"});
			return it;
		});
	}

		static getMappedArmorProficiencies (armorProficiencies) {
		if (!armorProficiencies) return armorProficiencies;
		return armorProficiencies.map(it => {
			it = MiscUtil.copy(it);
			if (it.any) { it.anyArmor = it.any; delete it.any; }
			this._getMappedProficiencies_expandChoose({proficienciesSet: it, prop: "armorProficiencies"});
			this._getMappedProficiencies_expandStatic({proficienciesSet: it, prop: "armorProficiencies"});
			return it;
		});
	}

		static getMappedWeaponProficiencies (weaponProficiencies) {
		if (!weaponProficiencies) return weaponProficiencies;
		return weaponProficiencies.map(it => {
			it = MiscUtil.copy(it);
			if (it.any) { it.anyWeapon = it.any; delete it.any; }
			this._getMappedProficiencies_expandChoose({proficienciesSet: it, prop: "weaponProficiencies"});
			this._getMappedProficiencies_expandStatic({proficienciesSet: it, prop: "weaponProficiencies"});
			return it;
		});
	}

		static getMappedSavingThrowProficiencies (savingThrowProficiencies) {
		if (!savingThrowProficiencies) return savingThrowProficiencies;
		return savingThrowProficiencies.map(it => {
			it = MiscUtil.copy(it);
			if (it.any) { it.anySavingThrow = it.any; delete it.any; }
			this._getMappedProficiencies_expandChoose({proficienciesSet: it, prop: "savingThrowProficiencies"});
			this._getMappedProficiencies_expandStatic({proficienciesSet: it, prop: "savingThrowProficiencies"});
			return it;
		});
	}

	static _getMappedProficiencies_expandChoose ({proficienciesSet, prop}) {
				if (!proficienciesSet.choose) return;
		if (proficienciesSet.choose.fromFilter) proficienciesSet.choose.prop = prop;
		if (proficienciesSet.choose.from) {
			proficienciesSet.choose.from = proficienciesSet.choose.from.map(it => {
								if (typeof it !== "string") return it;
				return {prop, name: it};
			});
		}
		proficienciesSet.choose = [proficienciesSet.choose];
	}

	static _getMappedProficiencies_expandStatic ({proficienciesSet, prop, ignoredKeys}) {
		Object.entries(proficienciesSet)
			.forEach(([k, v]) => {
				if ((ignoredKeys && ignoredKeys.has(k)) || Charactermancer_OtherProficiencySelect._MAPPED_IGNORE_KEYS.has(k)) return;

				if (typeof v === "boolean") { proficienciesSet[k] = {prop}; return; }
				if (typeof v === "number") { proficienciesSet[k] = {prop, count: v}; return; }

				throw new Error(`Unhandled type "${typeof v}" for value of proficiency "${k}"`);
			});
	}
	
	static _getExistingFvttProficiencySetsMeta (existingFvtt) {
		return {
			existingProficienciesFvttSet: new Set(existingFvtt?.value || []),
			existingProficienciesFvttSetCustom: new Set((existingFvtt?.custom || "").split(";").map(it => it.trim().toLowerCase()).filter(Boolean)),
		};
	}

		constructor (opts) {
		opts = opts || {};
		super();

		this._existing = opts.existing;
		this._available = Charactermancer_OtherProficiencySelect._getNormalizedAvailableProficiencies(opts.available);
		this._titlePrefix = opts.titlePrefix;
		this._featureSourceTracker = opts.featureSourceTracker || new Charactermancer_FeatureSourceTracker();
		this._$elesPreFromGroups = opts.$elesPreFromGroups;
		this._$elesPostFromGroups = opts.$elesPostFromGroups;

		this._lastMetas = [];
		this._hkExisting = null;
	}

	static _getNormalizedAvailableProficiencies (availProfs) {
		return availProfs
			.map(availProfSet => {
				const out = {};

				Object.entries(availProfSet)
					.forEach(([k, v]) => {
						if (!v) return;

						switch (k) {
							case "choose": {
								v
									.forEach(choose => {
										const mappedCount = choose.count != null && !isNaN(choose.count) ? Number(choose.count) : 1;
										if (mappedCount <= 0) return;

										const mappedFroms = (choose?.from || [])
											.map(it => Renderer.generic.getMappedAnyProficiency({keyAny: it, countRaw: mappedCount}) || this._getNormalizedProficiency(null, it))
											.filter(Boolean);

																				const mappedFromFilter = (choose?.fromFilter || "").trim();

										if (!mappedFroms.length && !mappedFromFilter) return;
										if (mappedFroms.length && mappedFromFilter) throw new Error(`Invalid proficiencies! Only one of "from" and "fromFilter" may be provided. Data was:\n${JSON.stringify(choose)}`);

										const tgt = (out.choose = out.choose || []);

										if (mappedFromFilter) {
											if (!choose.type && !choose.prop) throw new Error(`"fromFilter" did not have an associated "type"!`);
											tgt.push({fromFilter: mappedFromFilter, count: mappedCount, prop: choose.prop || this._getNormalizedProficiencyPropFromType(choose.type)});
											return;
										}

										if (!mappedFroms.length) return;

																				const subOut = {from: [], count: mappedCount};
										mappedFroms.forEach(it => {
																						if (it.from) {
												subOut.from = [...subOut.from, ...it.from];
												if (it.groups) Object.assign((subOut.groups = subOut.groups || {}), it.groups);
												return;
											}

																						subOut.from.push(it);
										});
										tgt.push(subOut);
									});

								break;
							}

							case "anySkill":
							case "anyTool":
							case "anyArtisansTool":
							case "anyMusicalInstrument":
							case "anyLanguage":
							case "anyStandardLanguage":
							case "anyExoticLanguage":
							case "anyWeapon":
							case "anyArmor":
							case "anySavingThrow": {
								const mappedAny = Renderer.generic.getMappedAnyProficiency({keyAny: k, countRaw: v});
								if (!mappedAny) break;
								(out.choose = out.choose || []).push(mappedAny);
								break;
							}

							default: {
								if (k === "static") throw new Error(`Property handling for "static" is unimplemented!`);

								if (v?.prop) { (out.static = out.static || []).push({name: k, prop: v.prop}); break; }
								if (v?.type) { (out.static = out.static || []).push({name: k, prop: this._getNormalizedProficiencyPropFromType(v.type)}); break; }

								const normalized = this._getNormalizedProficiency(k, v);
								if (normalized) (out.static = out.static || []).push(normalized);
							}
						}
					});

												if (out.static && out.choose) {
					out.choose.forEach(choose => {
						if (choose.fromFilter) return;

						choose.from = choose.from.filter(({name, prop}) => !out.static.some(({name: nameStatic, prop: propStatic}) => nameStatic === name && propStatic === prop));
					});
				}

				return out;
			});
	}

		static _getNormalizedProficiency (k, v) {
		if (!v) return null;

		let name = v?.name ?? k ?? v;
		if (!name || typeof name !== "string") return null;
		name = name.trim();

		if (v?.prop) {
			return {name, prop: v.prop};
		}

		if (v?.type) {
			const prop = this._getNormalizedProficiencyPropFromType(v.type);
			return {name, prop};
		}

		if (Charactermancer_OtherProficiencySelect._VALID_SKILLS.has(name)) return {name, prop: "skillProficiencies"};
		if (Charactermancer_OtherProficiencySelect._VALID_TOOLS.has(name)) return {name, prop: "toolProficiencies"};
		if (Charactermancer_OtherProficiencySelect._VALID_LANGUAGES.has(name)) return {name, prop: "languageProficiencies"};
		if (Charactermancer_OtherProficiencySelect._VALID_WEAPONS.has(name)) return {name, prop: "weaponProficiencies"};
		if (Charactermancer_OtherProficiencySelect._VALID_ARMORS.has(name)) return {name, prop: "armorProficiencies"};
		if (Charactermancer_OtherProficiencySelect._VALID_SAVING_THROWS.has(name)) return {name, prop: "savingThrowProficiencies"};

		console.warn(...LGT, `Could not discern the type of proficiency "${name}"\u2014you may need to specify it directly with "type".`);

				return null;
	}

	static _getNormalizedProficiencyPropFromType (type) {
		type = type.trim().toLowerCase();
		switch (type) {
			case "skill": return "skillProficiencies";
			case "tool": return "toolProficiencies";
			case "language": return "languageProficiencies";
			case "weapon": return "weaponProficiencies";
			case "armor": return "armorProficiencies";
			case "savingThrow": return "savingThrowProficiencies";
			default: throw new Error(`Type "${type}" did not have an associated proficiency property!`);
		}
	}

	static _getTagFromProp (prop) {
		switch (prop) {
			case "armorProficiencies": return "@item";
			case "weaponProficiencies": return "@item";
			default: throw new Error(`Cannot get @tag from prop "${prop}"`);
		}
	}

	_getTitle () {
		const props = this._getAllPossibleProps();
		return `${props.map(prop => this.constructor._getPropDisplayName({prop})).join("/")} Proficiency`;
	}

	_getTitlePlural () {
		const props = this._getAllPossibleProps();
		return `${props.map(prop => this.constructor._getPropDisplayName({prop, isPlural: true})).join("/")} Proficiencies`;
	}

	_getAllPossibleProps () {
		const propSet = new Set();

		this._available.forEach(profSet => {
			const subSet = this.constructor._getAllPossiblePropsForProfSet(profSet);
			subSet.forEach(prop => propSet.add(prop));
		});

		return [...propSet];
	}

	static _getAllPossiblePropsForProfSet (profSet) {
		const out = new Set();
		(profSet.static || []).forEach(it => out.add(it.prop));
		(profSet.choose || []).forEach(it => {
			if (it.prop) return out.add(it.prop);
			it.from.forEach(from => out.add(from.prop));
		});
		return out;
	}

	get modalTitle () { return this._getTitlePlural(); }

	render ($wrp) {
		const $stgSelGroup = this._render_$getStgSelGroup();

		const $stgGroup = $$`<div class="ve-flex-col"></div>`;

		const hkIxSet = () => {
			$stgGroup.empty();

			if (this._featureSourceTracker && this._hkExisting) {
				Object.values(Charactermancer_OtherProficiencySelect._PROP_GROUPS)
					.forEach(({propTrackerPulse}) => this._featureSourceTracker.removeHook(this, propTrackerPulse, this._hkExisting));
			}
			this._lastMetas.forEach(it => it.cleanup());
			this._lastMetas = [];

			const selProfs = this._available[this._state.ixSet];

			if (this._featureSourceTracker) this._doSetTrackerState();

						const $ptsExistingStatic = selProfs.static?.length ? this._render_renderPtStatic($stgGroup, selProfs.static) : null;
			
			if ($ptsExistingStatic && selProfs.choose?.length) $stgGroup.append(`<hr class="hr-2">`);

						const $ptsExistingChoose = (selProfs.choose || [])
				.map(({count, from, groups, fromFilter, prop}, i) => {
					if (this._$elesPreFromGroups?.[i]) $stgGroup.append(this._$elesPreFromGroups?.[i]);

					const $outPtsExisting = fromFilter
						? this._render_renderPtChooseFromFilter($stgGroup, {ix: i, count, fromFilter, prop})
						: this._render_renderPtChooseFrom($stgGroup, {ix: i, count, from, groups});

					if (this._$elesPostFromGroups?.[i]) $stgGroup.append(this._$elesPostFromGroups?.[i]);

										if (selProfs.choose.length > 1 && (i < selProfs.choose.length - 1)) {
						$stgGroup.append(`<hr class="hr-2">`);
					}

					return $outPtsExisting;
				});
			
			this._hkExisting = () => this._hk_pUpdatePtsExisting($ptsExistingStatic, $ptsExistingChoose);
			if (this._featureSourceTracker) {
				Object.values(Charactermancer_OtherProficiencySelect._PROP_GROUPS)
					.forEach(({propTrackerPulse}) => this._featureSourceTracker.addHook(this, propTrackerPulse, this._hkExisting));
			}
			this._hkExisting();
		};
		this._addHookBase("ixSet", hkIxSet);
		hkIxSet();

		$$($wrp)`
			${$stgSelGroup}
			${$stgGroup}
		`;
	}

	_doSetTrackerState () {
		const formData = this._getFormData();
		this._featureSourceTracker.setState(
			this,
			Object.keys(Charactermancer_OtherProficiencySelect._PROP_GROUPS)
				.mergeMap(prop => ({[prop]: formData.data?.[prop]})),
		);
	}

	static _render_getStaticKeyFullText ({name, prop}) {
		switch (prop) {
			case "weaponProficiencies": return name.split("|")[0].toTitleCase();

			case "armorProficiencies": {
				switch (name) {
					case "light":
					case "medium":
					case "heavy": return name.toTitleCase();
					case "shield|phb": return "Shields";
					default: return name.split("|")[0].toTitleCase();
				}
			}

			case "savingThrowProficiencies": return Parser.attAbvToFull(name).toTitleCase();

			default: return name.toTitleCase();
		}
	}

	static _render_getStaticKeyFullTextOther ({prop}) {
		switch (prop) {
			case "skillProficiencies": return "(Other skill proficiency)";
			case "toolProficiencies": return "(Other tool proficiency)";
			case "languageProficiencies": return "(Other language proficiency)";
			case "weaponProficiencies": return "(Other weapon proficiency)";
			case "armorProficiencies": return "(Other armor proficiency)";
			case "savingThrowProficiencies": return "(Other saving throw proficiency)";
			default: throw new Error(`Unhandled prop "${prop}"`);
		}
	}

	static async _pGetParentGroup ({prop, name}) {
		switch (prop) {
			case "weaponProficiencies": return UtilDataConverter.pGetItemWeaponType(name);
			default: return null;
		}
	}

	static _getRenderedStatic ({prop, name}) {
		switch (prop) {
			case "skillProficiencies": return this._getRenderedStatic_skillProficiencies(name);
			case "languageProficiencies": return this._getRenderedStatic_languageProficiencies(name);
			case "toolProficiencies": return this._getRenderedStatic_toolProficiencies(name);
			case "armorProficiencies": return this._getRenderedStatic_armorProficiencies(name);
			case "weaponProficiencies": return Renderer.get().render(`{@item ${name.split("|").map(sub => sub.toTitleCase()).join("|")}}`);
			case "savingThrowProficiencies": return Parser.attAbvToFull(name).toTitleCase();
			default: return name.toTitleCase();
		}
	}

	static _getRenderedStatic_skillProficiencies (name) {
		const atb = Parser.skillToAbilityAbv(name);
		const ptAbility = `<div class="ml-1 ve-small ve-muted" title="${Parser.attAbvToFull(atb)}">(${atb.toTitleCase()})</div>`;

		return `<div class="ve-inline-flex-v-center">${Renderer.get().render(`{@skill ${name.toTitleCase()}}`)}${ptAbility}</div>`;
	}

	static _getRenderedStatic_languageProficiencies (name) {
		if (name === "other") return name.toTitleCase();
		if (UtilActors.LANGUAGES_PRIMORDIAL.includes(name)) return Renderer.get().render(`{@language primordial||${name.toTitleCase()}}`);
		return Renderer.get().render(`{@language ${name.toTitleCase()}}`);
	}

	static _getRenderedStatic_toolProficiencies (name) {
		if (UtilActors.TOOL_PROFICIENCIES_TO_UID[name]) return Renderer.get().render(`{@item ${UtilActors.TOOL_PROFICIENCIES_TO_UID[name].toTitleCase()}}`);
		return name.toTitleCase();
	}

	static _getRenderedStatic_armorProficiencies (key) {
		if (key === "light" || key === "medium" || key === "heavy") return key.toTitleCase();
		if (key === "shield|phb") return Renderer.get().render(`{@item shield|phb|Shields}`);
		return Renderer.get().render(`{@item ${key.split("|").map(sub => sub.toTitleCase()).join("|")}}`);
	}

	static _getPropDisplayName ({prop}) {
		switch (prop) {
			case "skillProficiencies": return `Skill`;
			case "toolProficiencies": return `Tool`;
			case "languageProficiencies": return `Language`;
			case "weaponProficiencies": return `Weapon`;
			case "armorProficiencies": return `Armor`;
			case "savingThrowProficiencies": return `Saving Throw`;
			default: throw new Error(`Unhandled prop "${prop}"`);
		}
	}

		_render_$getStgSelGroup () {
		if (this._available.length <= 1) return null;

		const $selIxSet = ComponentUiUtil.$getSelEnum(
			this,
			"ixSet",
			{
				placeholder: `Select ${this._getTitle()} Set`,
				values: this._available.map((_, i) => i),
				fnDisplay: ix => {
					const selProfs = this._available[ix];

					const out = [];

					if (selProfs.static) {
						const pt = MiscUtil.copy(selProfs.static)
							.sort((a, b) => SortUtil.ascSortLower(a.name, b.name))
							.map(({name, prop}) => {
								if (name === "other") return this.constructor._render_getStaticKeyFullTextOther({prop});
								return this.constructor._render_getStaticKeyFullText({name, prop});
							})
							.join(", ");
						out.push(pt);
					}

					if (selProfs.choose) {
						selProfs.choose.forEach(fromBlock => {
							if (fromBlock.name) {
								out.push(`Choose ${fromBlock.name.toLowerCase()}`);
								return;
							}

							if (fromBlock.fromFilter) {
								out.push(`Choose ${Parser.numberToText(fromBlock.count)} from filtered selection`);
								return;
							}

							if (fromBlock.groups) {
								out.push(`Choose ${Parser.numberToText(fromBlock.count)} from ${Object.values(fromBlock.groups).map(({name}) => name).joinConjunct(", ", " or ")}`);
								return;
							}

							out.push(`Choose ${Parser.numberToText(fromBlock.count || 1)} from ${fromBlock.from.map(({name}) => name.toTitleCase()).join(", ")}`);
						});
					}

					return out.filter(Boolean).join("; ") || "(Nothing)";
				},
			},
		);

		if (this._featureSourceTracker) {
			const hk = () => {
				const formData = this._getFormData().data;
				const trackerState = Object.keys(formData.data || {})
					.filter(k => Charactermancer_OtherProficiencySelect._PROP_GROUPS[k])
					.mergeMap(it => it);
				this._featureSourceTracker.setState(this, trackerState);
			};
			this._addHookBase("ixSet", hk);
		}

		return $$`<div class="w-100 mb-2 ve-flex-vh-center">
			${$selIxSet}
		</div>`;
	}

	_getAllValuesMaybeInUseLookup () {
		const out = {};

		const activeSet = this._available[this._state.ixSet] || {};

		if (activeSet.static) {
			activeSet.static.forEach(({name, prop}) => {
				out[prop] = out[prop] || new Set();
				out[prop].add(name);
			});
		}

		if (activeSet.choose) {
			activeSet.choose.forEach(({from, fromFilter}) => {
				if (fromFilter) {
					const prefix = `${this._getStateKeyPrefix()}_chooseFilter_`;
										Object.entries(this._state)
						.filter(([k, v]) => k.startsWith(prefix) && v)
						.forEach(([, {prop, name}]) => {
							if (!name) throw new Error(`"fromFilter" choice had no "name"--this should never occur!`);
							out[prop] = out[prop] || new Set();
							out[prop].add(name);
						});
					return;
				}

				from.forEach(({name, prop}) => {
					out[prop] = out[prop] || new Set();
					out[prop].add(name);
				});
			});
		}

		return out;
	}

	_getStateKeyPrefix () { return "otherProfSelect"; }

	_getPropsChooseFromFilter ({ixChoose, ixCount}) {
		return {
			propState: `${this._getStateKeyPrefix()}_chooseFilter_${ixChoose}_${ixCount}`,
		};
	}

	_getPropsChooseFrom ({ixChoose}) {
		return {
			propState: `${this._getStateKeyPrefix()}_${ixChoose}`,
		};
	}

	async _hk_pUpdatePtsExisting ($ptsExistingStatic, $ptsExistingChooseFrom) {
		try {
			await this._pLock("updateExisting");
			await this._hk_pUpdatePtsExisting_({$ptsExistingStatic, $ptsExistingChooseFrom});
		} finally {
			this._unlock("updateExisting");
		}
	}

	async _hk_pUpdatePtsExisting_ ({$ptsExistingStatic, $ptsExistingChooseFrom}) {
		const allValueLookupEntries = Object.entries(this._getAllValuesMaybeInUseLookup());

		if ($ptsExistingStatic) await this._hk_pUpdatePtsExisting_part({allValueLookupEntries, $ptsExisting: $ptsExistingStatic});
		if (!$ptsExistingChooseFrom) return;
		for (const $ptsExisting of $ptsExistingChooseFrom) await this._hk_pUpdatePtsExisting_part({allValueLookupEntries, $ptsExisting});
	}

	async _hk_pUpdatePtsExisting_part ({allValueLookupEntries, $ptsExisting}) {
		for (const [prop, allProfs] of allValueLookupEntries) {
			const otherStates = this._featureSourceTracker ? this._featureSourceTracker.getStatesForKey(prop, {ignore: this}) : null;

			for (const v of allProfs) {
				const parentGroup = await this.constructor._pGetParentGroup({prop, name: v});

				if (!$ptsExisting[prop]?.[v] && !parentGroup) continue;

								let maxExisting = this._existing?.[prop]?.[v]
					|| (parentGroup && this._existing?.[prop]?.[parentGroup])
					|| 0;

								if (otherStates) otherStates.forEach(otherState => maxExisting = Math.max(maxExisting, otherState[v] || 0, (parentGroup ? otherState[parentGroup] : 0) || 0));

				const helpText = maxExisting === 0 ? "" : `${UtilActors.PROF_TO_TEXT[maxExisting]} from Another Source`;

				$ptsExisting[prop][v]
					.title(helpText)
					.toggleClass("ml-1", !!maxExisting)
					.html(maxExisting ? `(<i class="fas fa-fw ${UtilActors.PROF_TO_ICON_CLASS[maxExisting]}"></i>)` : "");
			}
		}
	}

	_render_renderPtStatic ($stgGroup, profsStatic) {
		const $ptsExisting = {};

		const byProp = {};
		profsStatic.forEach(({prop, name}) => MiscUtil.set(byProp, prop, name, true));
		const isMultiProp = this.constructor._getAllPossiblePropsForProfSet(this._available[this._state.ixSet]).size > 1;

		const $wrps = Object.entries(byProp)
			.map(([prop, profsStaticSet]) => {
				const ptPropType = isMultiProp ? ` (${this.constructor._getPropDisplayName({prop})} Proficiency)` : "";
				const profsStaticSetKeys = Object.keys(profsStaticSet);
				return profsStaticSetKeys
					.sort(SortUtil.ascSortLower)
					.map((name, i) => {
						const $ptExisting = $(`<div class="ve-small veapp__msg-warning inline-block"></div>`);
						MiscUtil.set($ptsExisting, prop, name, $ptExisting);
						const isNotLast = i < profsStaticSetKeys.length - 1;
						return $$`<div class="inline-block ${isNotLast ? "mr-1" : ""}">${this.constructor._getRenderedStatic({prop, name})}${ptPropType}${$ptExisting}${isNotLast ? `,` : ""}</div>`;
					});
			})
			.flat();

		$$`<div class="block">
			${$wrps}
		</div>`.appendTo($stgGroup);

		return $ptsExisting;
	}

	_render_renderPtChooseFrom ($stgGroup, {ix, count, from, groups}) {
		const {propState} = this._getPropsChooseFrom({ixChoose: ix});

		const $ptsExisting = {};
		const compOpts = {
			count,
			fnDisplay: ({prop, name}) => {
				const $ptExisting = $(`<div class="ve-small veapp__msg-warning"></div>`);
				MiscUtil.set($ptsExisting, prop, name, $ptExisting);

				return $$`<div class="ve-flex-v-center w-100">
					<div class="ve-flex-v-center">${this.constructor._getRenderedStatic({prop, name})}</div>
					${$ptExisting}
				</div>`;
			},
		};

		const fromProps = new Set(from.map(({prop}) => prop));

		const byPropThenGroup = {};

		from.forEach(({name, prop, group}) => {
			group = group ?? "_";
			MiscUtil.set(byPropThenGroup, prop, group, name, Charactermancer_OtherProficiencySelect._PROFICIENT);
		});

		const isMultiProp = Object.keys(byPropThenGroup).length > 1;
		const isGrouped = Object.values(byPropThenGroup).some(groupMeta => Object.keys(groupMeta).some(group => group !== "_"));

										if (isMultiProp || isGrouped) {
						const valueGroups = [];
			Object.entries(byPropThenGroup)
				.forEach(([prop, groupMeta]) => {
					Object.entries(groupMeta)
						.forEach(([groupId, names]) => {
							const groupDetails = groups?.[groupId];

							valueGroups.push({
								name: [
									(isMultiProp ? `${this.constructor._getPropDisplayName({prop})} Proficiencies` : ""),
									groupDetails?.name,
								]
									.filter(Boolean)
									.join(""),
								text: groupDetails?.hint,
								values: Object.keys(names).map(name => ({prop, name})),
							});
						});
				});

			compOpts.valueGroups = valueGroups;
		} else {
			compOpts.values = from;
		}

		const meta = ComponentUiUtil.getMetaWrpMultipleChoice(
			this,
			propState,
			compOpts,
		);

				let hkSetTrackerInfo = null;
		if (this._featureSourceTracker) {
			hkSetTrackerInfo = () => this._doSetTrackerState();
			this._addHookBase(meta.propPulse, hkSetTrackerInfo);
		}
		
		this._lastMetas.push({
			cleanup: () => {
				meta.cleanup();
				if (hkSetTrackerInfo) this._removeHookBase(meta.propPulse, hkSetTrackerInfo);
			},
		});

		const header = fromProps.size === 1
			? (`${this.constructor._getPropDisplayName({prop: [...fromProps][0]})} ${count === 1 ? "Proficiency" : "Proficiencies"}`)
			: (count === 1 ? this._getTitle() : this._getTitlePlural());
		$stgGroup.append(`<div class="mb-1">${this._titlePrefix ? `${this._titlePrefix}: ` : ""}Choose ${Parser.numberToText(count)} ${header}:</div>`);
		meta.$ele.appendTo($stgGroup);

		return $ptsExisting;
	}

	_render_renderPtChooseFromFilter ($stgGroup, {ix, fromFilter, count, prop}) {
		const $ptsExisting = {};

		const $row = $(`<div class="ve-flex-v-center"></div>`);

		[...new Array(count)].forEach((_, i) => {
			const {propState} = this._getPropsChooseFromFilter({ixChoose: ix, ixCount: i});

			const $ptExisting = $(`<div class="ve-small veapp__msg-warning"></div>`);

			const $disp = $(`<div class="ve-flex-v-center"></div>`);
			const hkChosen = (propHk, valueHk, prevValueHk) => {
				const isFirstRun = !propHk;
				if (!isFirstRun) {
					if (prevValueHk) {
						const {prop: propPrev, name: namePrev} = prevValueHk;
						const uidPrev = (namePrev || "").toLowerCase();
						MiscUtil.delete($ptsExisting, propPrev, uidPrev, $ptExisting);
					}

					if (valueHk) {
						const {prop, name} = valueHk || {};
						const uid = (name || "").toLowerCase();
						MiscUtil.set($ptsExisting, prop, uid, $ptExisting);
					}
				}

				$disp.html(
					this._state[propState] != null
						? `<div>${Renderer.get().render(`{${this.constructor._getTagFromProp(prop)} ${this._state[propState].name.toLowerCase()}}`)}</div>`
						: `<div class="italic ve-muted">(select a ${this.constructor._getPropDisplayName({prop}).toLowerCase()} proficiency)</div>`,
				);

				if (!isFirstRun && this._featureSourceTracker) this._doSetTrackerState();
			};
			this._addHookBase(propState, hkChosen);
			this._lastMetas.push({cleanup: () => this._removeHookBase(propState, hkChosen)});
			hkChosen();

			const $btnFilter = $(`<button class="btn btn-default btn-xxs mx-1" title="Choose a ${this.constructor._getPropDisplayName({prop})} Proficiency"><span class="fas fa-fw fa-search"></span></button>`)
				.click(async () => {
					const selecteds = await this._pGetFilterChoice({prop, fromFilter});
					if (selecteds == null || !selecteds.length) return;

					const selected = selecteds[0];
					this._state[propState] = {prop, name: `${selected.name}|${selected.values.sourceJson}`.toLowerCase()};
				});

			$$`<div class="ve-flex-v-center mr-1">${$btnFilter}${$disp}${$ptExisting}</div>`.appendTo($row);
		});

		$$`<div class="py-1 ve-flex-v-center">
			${$row}
		</div>`.appendTo($stgGroup);

		return $ptsExisting;
	}

	_pGetFilterChoice ({prop, fromFilter}) {
		switch (prop) {
			case "armorProficiencies":
			case "weaponProficiencies": {
				const modalFilterItems = new ModalFilterItemsFvtt({
					filterExpression: fromFilter,
					namespace: "Charactermancer_OtherProficiencySelect.items",
					isRadio: true,
				});
				return modalFilterItems.pGetUserSelection({filterExpression: fromFilter});
			}

			default: throw new Error(`Filter choices for "${prop}" are unimplemented!`);
		}
	}

	isNoChoice () { return this.constructor._isNoChoice({available: this._available, isAlreadyMapped: true}); }

	_getFormData () {
		let isFormComplete = true;
		const out = {};

		const selProfs = this._available[this._state.ixSet];

				(selProfs.static || []).forEach(({prop, name}) => MiscUtil.set(out, prop, name, Charactermancer_OtherProficiencySelect._PROFICIENT));
		
				(selProfs.choose || []).forEach(({count, from, groups, fromFilter, prop}, ixChoose) => {
			if (fromFilter) {
				[...new Array(count)].forEach((_, ixCount) => {
					const {propState} = this._getPropsChooseFromFilter({ixChoose, ixCount});

					if (!this._state[propState]) return isFormComplete = false;

					const {prop, name} = this._state[propState];
					MiscUtil.set(out, prop, name, Charactermancer_OtherProficiencySelect._PROFICIENT);
				});

				return;
			}

			const {propState} = this._getPropsChooseFrom({ixChoose});

			const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this, propState);
			ixs.map(ix => from[ix]).forEach(({prop, name}) => MiscUtil.set(out, prop, name, Charactermancer_OtherProficiencySelect._PROFICIENT));

			if (!this._state[ComponentUiUtil.getMetaWrpMultipleChoice_getPropIsAcceptable(propState)]) isFormComplete = false;
		});
		
		return {
			isFormComplete,
			data: out,
		};
	}

	pGetFormData () { return this._getFormData(); }

	_getDefaultState () {
		return {
			ixSet: 0,
		};
	}

	static _getExistingProficiencies ({existingProficienciesSetFvtt, vetToFvttProfs, allProfsVet}) {
		const {existingProficienciesFvttSet, existingProficienciesFvttSetCustom} = this._getExistingFvttProficiencySetsMeta(existingProficienciesSetFvtt);

		const existing = {};

		Object.entries(vetToFvttProfs)
			.filter(([_, fvtt]) => existingProficienciesFvttSet.has(fvtt))
			.forEach(([vet, fvtt]) => {
				existing[vet] = Charactermancer_OtherProficiencySelect._PROFICIENT;
				existingProficienciesFvttSet.delete(fvtt);
			});

		allProfsVet.forEach(vet => {
			if (existingProficienciesFvttSet.has(vet)) {
				existing[vet] = Charactermancer_OtherProficiencySelect._PROFICIENT;
				existingProficienciesFvttSet.delete(vet);
			} else if (existingProficienciesFvttSetCustom.has(vet)) {
				existing[vet] = Charactermancer_OtherProficiencySelect._PROFICIENT;
				existingProficienciesFvttSetCustom.delete(vet);
			}
		});

		if (existingProficienciesFvttSet.size || existingProficienciesFvttSetCustom.size) {
			existing.other = existingProficienciesFvttSet.size + existingProficienciesFvttSetCustom.size;
		}

		return existing;
	}

	static _getExistingSkillToolProficiencies ({existingProficienciesSetFvtt, mapAbvToFull}) {
				const existing = {};

		Object.entries(existingProficienciesSetFvtt || {})
			.forEach(([abv, data]) => {
				if (!data.value) return;
				existing[mapAbvToFull[abv]] = data.value;
			});

		return existing;
	}

	static _getExistingSavingThrowProficiencies (existingFvtt) {
				const existing = {};

		Object.entries(existingFvtt?.savingThrowProficiencies || {})
			.forEach(([ab, data]) => {
				if (!data.proficient) return;
				existing[ab] = data.proficient;
			});

		return existing;
	}
}
Charactermancer_OtherProficiencySelect._PROFICIENT = 1;
Charactermancer_OtherProficiencySelect._PROP_GROUPS = {
	"skillProficiencies": {
		propTrackerPulse: "pulseSkillProficiencies",
	},
	"toolProficiencies": {
		propTrackerPulse: "pulseToolProficiencies",
	},
	"languageProficiencies": {
		propTrackerPulse: "pulseLanguageProficiencies",
	},
	"weaponProficiencies": {
		propTrackerPulse: "pulseWeaponProficiencies",
	},
	"armorProficiencies": {
		propTrackerPulse: "pulseArmorProficiencies",
	},
	"savingThrowProficiencies": {
		propTrackerPulse: "pulseSavingThrowProficiencies",
	},
};

Charactermancer_OtherProficiencySelect._MAPPED_IGNORE_KEYS = new Set([
	"choose",
	"any",
	"anySkill",
	"anyTool",
	"anyArtisansTool",
	"anyMusicalInstrument",
	"anyLanguage",
	"anyStandardLanguage",
	"anyExoticLanguage",
	"anyWeapon",
	"anyArmor",
	"anySavingThrow",
]);

Charactermancer_OtherProficiencySelect._VALID_SKILLS = new Set([
	...Renderer.generic.FEATURE__SKILLS_ALL,
	"anySkill",
]);
Charactermancer_OtherProficiencySelect._VALID_TOOLS = new Set([
	...Renderer.generic.FEATURE__TOOLS_ALL,
	"anyTool",
	"anyArtisansTool",
	"anyMusicalInstrument",
]);
Charactermancer_OtherProficiencySelect._VALID_LANGUAGES = new Set([
	...Renderer.generic.FEATURE__LANGUAGES_ALL,
	"anyLanguage",
	"anyStandardLanguage",
	"anyExoticLanguage",
]);
Charactermancer_OtherProficiencySelect._VALID_WEAPONS = new Set([
	...UtilActors.WEAPON_PROFICIENCIES,
	"anyWeapon",
]);
Charactermancer_OtherProficiencySelect._VALID_ARMORS = new Set([
	...UtilActors.ARMOR_PROFICIENCIES,
	"anyArmor",
]);
Charactermancer_OtherProficiencySelect._VALID_SAVING_THROWS = new Set([
	...Parser.ABIL_ABVS,
	"anySavingThrow",
]);

class Charactermancer_ImmResVulnSelect extends BaseComponent {
			static async pGetUserInput (opts) {
		opts = opts || {};

		if (!opts.available) return {isFormComplete: true, data: {}};

		const comp = new this({
			...opts,
			existing: this.getExisting(opts.existingFvtt),
			existingFvtt: opts.existingFvtt,
		});
		if (comp.isNoChoice()) return comp.pGetFormData();

		return UtilApplications.pGetImportCompApplicationFormData({comp, isAutoResize: true});
	}

		static getExisting () { throw new TypeError(`Unimplemented!`); }

	static isNoChoice (available) {
		let cntChoices = 0;
		UtilDataConverter.WALKER_READONLY_GENERIC.walk(available, {object: (obj) => { if (obj.choose) cntChoices++; }});
		return cntChoices === 0;
	}
	
		constructor (opts) {
		opts = opts || {};
		super();

		this._existing = opts.existing;
		this._available = opts.available;
		this._prop = opts.prop;
		this._modalTitle = opts.modalTitle;
		this._titlePlural = opts.titlePlural;
		this._titleSingle = opts.titleSingle;

		this._lastChoiceMeta = null;

		Object.assign(this.__state.readonly_selectedValues, this._getOutputObject());
	}

	get modalTitle () { return this._modalTitle; }

	render ($wrp) {
		this._lastChoiceMeta = {isActive: true, children: []};
		this._render_recurse($wrp, MiscUtil.copy(this._available), this._lastChoiceMeta, false);
	}

	_render_recurse ($wrp, arr, outMeta, isChoices) {
		const arrStrings = arr
			.filter(it => typeof it === "string")
			.sort(SortUtil.ascSortLower);

		if (!isChoices) {
						const staticValues = arrStrings
				.map(it => {
					outMeta.children.push({isActive: true, value: it});
					return it.toTitleCase();
				});
			$wrp.append(`<div>${staticValues.join(", ")}</div>`);
		} else {
			arrStrings
				.forEach(it => {
					const $cb = $(`<input type="checkbox" class="ml-1 mr-2">`)
						.change(() => {
														if ($cb.prop("checked")) {
								const numChecked = outMeta.children.filter(it => it.isChoosable && it.isActive()).length;
								if (numChecked > outMeta.count) {
									const toDeActive = outMeta.lastChecked || outMeta.children.filter(it => it.isChoosable).last();
									toDeActive.setActive(false);
								}
								outMeta.lastChecked = node;
							} else {
								if (outMeta.lastChecked === node) outMeta.lastChecked = null;
							}

							this._state.readonly_selectedValues = this._getOutputObject();
						});

					const node = {
						isActive: () => $cb.prop("checked") ? it : null,
						value: it,
						isChoosable: true,
						setActive: (val) => $cb.prop("checked", val),
					};
					outMeta.children.push(node);

					return $$`<label class="py-1 stripe-even ve-flex-v-center">
						${$cb}
						<span>${it.toTitleCase()}</span>
					</label>`.appendTo($wrp);
				});
		}

		arr
			.filter(it => typeof it !== "string")
			.forEach((it, i) => {
				if (!it.choose) throw new Error(`Unhandled immune/resist/vulnerability properties "${Object.keys(it).join(", ")}"`);

				if (isChoices) {
										
										const $btnSetActive = $(`<button class="btn btn-primary btn-5et btn-xs">Set Group Active</button>`)
						.click(() => {
							outMeta.children.forEach(it => it.isActive = false);
							nxtMeta.isActive = true;
							this._state.readonly_selectedValues = this._getOutputObject();
						});

					const nxtMeta = {isActive: false, children: []};

					const $wrpChoice = $(`<div class="ve-flex-col my-1"></div>`);
					this._render_recurse($wrpChoice, it.choose.from, nxtMeta, true);

					$$`<div class="ve-flex-col pl-2 stripe-even">
						<div class="ve-flex-v-center my-1">${$btnSetActive}</div>
						${$wrpChoice}
					</div>`;

					return;
				}

				const count = it.choose.count || 1;
				const nxtMeta = {isActive: true, children: [], count, lastChecked: null};
				outMeta.children.push(nxtMeta);

				const $wrpChoice = $(`<div class="ve-flex-col py-1 pt-0">
					${arrStrings.length || i > 0 ? `<hr class="hr-2 hr--dotted">` : ""}
					<div class="py-1">Choose ${count} ${count === 1 ? this._titleSingle : this._titlePlural}:</div>
				</div>`).appendTo($wrp);
				this._render_recurse($wrpChoice, it.choose.from, nxtMeta, true);
			});
	}

	isNoChoice () { return this.constructor.isNoChoice(this._available); }

	_getOutputSet () {
		const outSet = new Set(this._existing[this._prop] || []); 
		if (this._lastChoiceMeta) this._getOutputSet_recurse(outSet, this._lastChoiceMeta);
		else UtilDataConverter.WALKER_READONLY_GENERIC.walk(this._available, {string: (str) => { outSet.add(str); }});

		return outSet;
	}

	_getOutputSet_recurse (outSet, node) {
		if (!node.isActive) return;
		const isNodeActive = node.isActive === true || node.isActive();
		if (!isNodeActive) return;

		if (node.value) outSet.add(node.value);
		if (node.children) node.children.forEach(it => this._getOutputSet_recurse(outSet, it));
	}

	_getOutputObject () {
		return [...this._getOutputSet()].sort(SortUtil.ascSortLower).mergeMap(it => ({[it]: true}));
	}

	pGetFormData () {
		let isFormComplete = true;

		return {
			isFormComplete,
			data: {
				[this._prop]: MiscUtil.copy(this._state.readonly_selectedValues),
			},
		};
	}

	_getDefaultState () {
		return {
			readonly_selectedValues: {},
		};
	}
}

class Charactermancer_DamageImmunitySelect extends Charactermancer_ImmResVulnSelect {
		static getExisting (existingFvtt) {
		return MiscUtil.copy([existingFvtt?.immune?.value || []]);
	}
	
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Damage Immunities`,
			titlePlural: `Damage Immunities`,
			titleSingle: `Damage Immunity`,
			prop: "immune",
		});
	}
}

class Charactermancer_DamageResistanceSelect extends Charactermancer_ImmResVulnSelect {
		static getExisting (existingFvtt) {
		return MiscUtil.copy([existingFvtt?.resist?.value || []]);
	}
	
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Damage Resistances`,
			titlePlural: `Damage Resistances`,
			titleSingle: `Damage Resistance`,
			prop: "resist",
		});
	}
}

class Charactermancer_DamageVulnerabilitySelect extends Charactermancer_ImmResVulnSelect {
		static getExisting (existingFvtt) {
		return MiscUtil.copy([existingFvtt?.vulnerable?.value || []]);
	}
	
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Damage Vulnerabilities`,
			titlePlural: `Damage Vulnerabilities`,
			titleSingle: `Damage Vulnerability`,
			prop: "vulnerable",
		});
	}
}

class Charactermancer_ConditionImmunitySelect extends Charactermancer_ImmResVulnSelect {
		static getExisting (existingFvtt) {
		return [existingFvtt?.conditionImmune?.value || []].map(it => it === "diseased" ? "disease" : it);
	}
	
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Condition Immunities`,
			titlePlural: `Condition Immunities`,
			titleSingle: `Condition Immunity`,
			prop: "conditionImmune",
		});
	}
}

class Charactermancer_ExpertiseSelect extends Charactermancer_SkillSaveProficiencySelect {
		static getExisting (existingFvtt) {
		const existingSkills = Object.entries(Charactermancer_OtherProficiencySelect.getExisting({skillProficiencies: existingFvtt.skillProficiencies})?.skillProficiencies || {})
			.filter(([, profLevel]) => Number(profLevel) === 2)
			.mergeMap(([prof, profLevel]) => ({[prof]: profLevel}));

		const existingTools = Object.entries(Charactermancer_OtherProficiencySelect.getExisting({skillProficiencies: existingFvtt.toolProficiencies})?.toolProficiencies || {})
			.filter(([, profLevel]) => Number(profLevel) === 2)
			.mergeMap(([prof, profLevel]) => ({[prof]: profLevel}));

				return {...existingSkills, ...existingTools};
	}

	static getExistingFvttFromActor (actor) {
		return {
			skillProficiencies: MiscUtil.get(actor, "_source", "system", "skills"),
			toolProficiencies: MiscUtil.get(actor, "_source", "system", "tools"),
		};
	}

	static isNoChoice (available) {
		if (!available?.length) return true; 		return available.length === 1
			&& !available[0].choose
			&& !available[0].anyProficientSkill
			&& !available[0].anyProficientTool;
	}
	
		constructor (opts) {
		super({
			...opts,
			propGroup: new Charactermancer_ProficiencySelect.PropGroup({
				prop: "expertise",
				propTrackerPulse: "pulseExpertise",
				propTracker: "expertise",
			}),
			modalTitle: "Expertise",
			title: "Expertise",
			titlePlural: "Expertise",
		});
	}

	_getStaticDisplay (key, {isPlainText = false} = {}) {
		if (isPlainText) return key.toTitleCase();

		if (Parser.SKILL_TO_ATB_ABV[key]) return Renderer.get().render(`{@skill ${key.toTitleCase()}}`);
				return key.toTitleCase();
	}

	_getNonStaticDisplay (key, value, {isPlainText = false} = {}) {
		switch (key) {
			case "anyProficientSkill": return `Choose ${value || 1} existing skill ${value > 1 ? "proficiencies" : "proficiency"}`;
			case "anyProficientTool": return `Choose ${value || 1} existing tool ${value > 1 ? "proficiencies" : "proficiency"}`;
			default: return super._getNonStaticDisplay(key, value, {isPlainText});
		}
	}

	_getStaticKeys_all () {
		return this._available
			.map(profSet => this._getStaticKeys_profSet({profSet}))
			.flat()
			.unique();
	}

	_getStaticKeys_profSet ({profSet = null} = {}) {
		profSet = profSet || this._available[this._state.ixSet];
		return Object.keys(profSet).filter(it => this._isStaticKey(it));
	}

	_isStaticKey (key) {
		return !["anyProficientSkill", "anyProficientTool"].includes(key);
	}

	_isSkillKey (key) {
		return key === "anyProficientSkill" || Object.keys(Parser.SKILL_TO_ATB_ABV).includes(key);
	}

	_hk_ixSet_renderPts (profSet) {
		this._lastMeta = {
			cleanup: () => {
				this._lastMeta._fnsCleanup.forEach(fn => fn());
			},
			_fnsCleanup: [],
		};

		const $ptsExistingStatic = Object.keys(profSet).some(it => this._isStaticKey(it)) ? this._render_renderPtStatic(this._$stgGroup, profSet) : null;
		let needsHr = $ptsExistingStatic != null;

		if (needsHr && profSet.anyProficientSkill) { needsHr = false; this._$stgGroup.append(`<hr class="hr-2 hr--dotted">`); }
		const $ptsExistingChooseAnyProficientSkill = profSet.anyProficientSkill ? this._render_renderPtChooseAnyProficientSkill(this._$stgGroup, profSet) : null;
		needsHr = needsHr || $ptsExistingChooseAnyProficientSkill != null;

		if (needsHr && profSet.anyProficientTool) { needsHr = false; this._$stgGroup.append(`<hr class="hr-2 hr--dotted">`); }
		const $ptsExistingChooseAnyProficientTool = profSet.anyProficientTool ? this._render_renderPtChooseAnyProficientTool(this._$stgGroup, profSet) : null;

		this._hkUpdateExisting = () => this._hk_updatePtsExisting($ptsExistingStatic, $ptsExistingChooseAnyProficientSkill, $ptsExistingChooseAnyProficientTool);
	}

	_getProps (prop, ix) {
		return {
			propAnyProficientSkill: `${prop}_ix_skill_${ix}`,
			propAnyProficientTool: `${prop}_ix_tool_${ix}`,
		};
	}

	_render_$getPtExisting () {
		return $(`<div class="ve-small veapp__msg-warning inline-block ml-1 no-shrink" title="Expertise from Another Source">(<i class="fas fa-fw ${UtilActors.PROF_TO_ICON_CLASS[2]}"></i>)</div>`);
	}

	_render_renderPtStatic ($stgGroup, profSet) {
		const $ptsExisting = [];

		const profList = this._getStaticKeys_profSet()
			.filter(key => profSet[key]);

		const $wrps = profList
			.map((it, i) => {
				const $ptExisting = this._render_$getPtExisting();

				$ptsExisting.push({
					prof: it,
					$ptExisting,
				});

				const isNotLast = i < profList.length - 1;
				return $$`<div class="inline-block ${isNotLast ? "mr-1" : ""}">${this._getStaticDisplay(it)}${$ptExisting}${isNotLast ? `,` : ""}</div>`;
			});

		$$`<div class="block">
			${$wrps}
		</div>`.appendTo($stgGroup);

		return $ptsExisting;
	}

	_render_renderPtChooseAnyProficientSkill ($stgGroup, profSet) {
		return this._render_renderPtChooseAnyProficient({
			$stgGroup,
			profSet,
			propProfSet: "anyProficientSkill",
			propIxProps: "propAnyProficientSkill",
			fnGetValues: this._getAvailableSkills.bind(this),
			propPulse: "pulseSkillProficiencies",
			titleRow: "Existing Skill",
		});
	}

	_render_renderPtChooseAnyProficientTool ($stgGroup, profSet) {
		return this._render_renderPtChooseAnyProficient({
			$stgGroup,
			profSet,
			propProfSet: "anyProficientTool",
			propIxProps: "propAnyProficientTool",
			fnGetValues: this._getAvailableTools.bind(this),
			propPulse: "pulseToolProficiencies",
			titleRow: "Existing Tool",
		});
	}

	_render_renderPtChooseAnyProficient (
		{
			$stgGroup,
			profSet,
			propProfSet,
			propIxProps,
			fnGetValues,
			propPulse,
			titleRow,
		},
	) {
		const numChoices = Number(profSet[propProfSet] || 1);

		const $wrp = $(`<div class="ve-flex-col"></div>`).appendTo($stgGroup);

		const $ptsExisting = [];

		for (let i = 0; i < numChoices; ++i) {
			const ixProps = this._getProps(propProfSet, i);

			const selMeta = ComponentUiUtil.$getSelEnum(
				this,
				ixProps[propIxProps],
				{
					values: fnGetValues(),
					isAllowNull: true,
					asMeta: true,
					fnDisplay: it => it.toTitleCase(),
				},
			);
			this._lastMeta._fnsCleanup.push(selMeta.unhook);

			const $ptExisting = this._render_$getPtExisting();
			$ptsExisting.push({
				prop: ixProps[propIxProps],
				$ptExisting,
			});

			const hk = () => selMeta.setValues(fnGetValues(), {isResetOnMissing: true});
			if (this._featureSourceTracker) {
				this._featureSourceTracker.addHook(this, propPulse, hk);
				this._lastMeta._fnsCleanup.push(() => this._featureSourceTracker.removeHook(this, propPulse, hk));

								const hkSetTrackerInfo = () => this._doSetTrackerState();
				this._addHookBase(ixProps[propIxProps], hkSetTrackerInfo);
				this._lastMeta._fnsCleanup.push(() => this._removeHookBase(ixProps[propIxProps], hkSetTrackerInfo));
							}
			hk();

			this._lastMeta._fnsCleanup.push(() => delete this._state[ixProps[propIxProps]]);

			$$`<div class="ve-flex-v-center ${i ? "mt-2" : ""}">
					<div class="mr-2 no-wrap">${titleRow}:</div>
					${selMeta.$sel}
					${$ptExisting}
				</div>`
				.appendTo($wrp);
		}

		return $ptsExisting;
	}

	_getAvailableSkills () {
		return this._getAvailableByType({
			propExistingFvtt: "skillProficiencies",
			propFeatureTracker: "skillProficiencies",
		});
	}

	_getAvailableTools () {
		return this._getAvailableByType({
			propExistingFvtt: "toolProficiencies",
			propFeatureTracker: "toolProficiencies",
		});
	}

	_getAvailableByType (
		{
			propExistingFvtt,
			propFeatureTracker,
		},
	) {
				const existingAnyProfLevel = Charactermancer_OtherProficiencySelect.getExisting({
			[propExistingFvtt]: this._existingFvtt[propExistingFvtt],
		});

				const out = new Set(Object.entries(existingAnyProfLevel[propExistingFvtt])
			.filter(([, profLevel]) => profLevel >= 1)
			.map(([prof]) => prof));

				if (this._featureSourceTracker) {
			(this._featureSourceTracker.getStatesForKey(propFeatureTracker, {ignore: this}) || [])
				.forEach(otherState => {
					Object.entries(otherState)
						.filter(([, isAvailable]) => isAvailable)
						.forEach(([prof]) => out.add(prof));
				});
		}

		return [...out].sort(SortUtil.ascSortLower);
	}

	_hk_updatePtsExisting ($ptsExistingStatic, $ptsExistingChooseAnyProficientSkill, $ptsExistingChooseAnyProficientTool) {
		const otherStates = this._featureSourceTracker ? this._featureSourceTracker.getStatesForKey(this._propGroup.propTracker, {ignore: this}) : null;

		const ptsExistingMetas = [$ptsExistingStatic, $ptsExistingChooseAnyProficientSkill, $ptsExistingChooseAnyProficientTool]
			.filter(Boolean)
			.flat();

		ptsExistingMetas.forEach(ptExistingMeta => {
			const prof = ptExistingMeta.prof ?? this._state[ptExistingMeta.prop];

			if (prof == null) {
				ptExistingMeta.$ptExisting.hideVe();
				return;
			}

						let maxExisting = this._existing?.[prof] || 0;

						if (otherStates) otherStates.forEach(otherState => maxExisting = Math.max(maxExisting, otherState[prof] || 0));

			ptExistingMeta.$ptExisting.toggleVe(maxExisting === 2);
		});
	}

	_doSetTrackerState () {
		const formData = this._getFormData();
		this._featureSourceTracker.setState(this, {
			[this._propGroup.propTracker]: formData.data?.[this._propGroup.prop],
			"skillProficiencies": formData.data?.skillProficiencies,
			"toolProficiencies": formData.data?.toolProficiencies,
		});
	}

	_getFormData () {
		const outSkills = {};
		const outTools = {};
		const outExpertise = {};

		let isFormComplete = true;

		const profSet = this._available[this._state.ixSet];

		Object.entries(profSet)
			.forEach(([k, v]) => {
				if (k === "anyProficientSkill" || k === "anyProficientTool") {
					const numChoices = Number(v || 1);
					for (let i = 0; i < numChoices; ++i) {
						const {propAnyProficientSkill, propAnyProficientTool} = this._getProps(k, i);
						const prop = this._isSkillKey(k) ? propAnyProficientSkill : propAnyProficientTool;
						const chosenProf = this._state[prop];
						if (chosenProf == null) {
							isFormComplete = false;
							continue;
						}
						(this._isSkillKey(k) ? outSkills : outTools)[chosenProf] = outExpertise[chosenProf] = 2;
					}
					return;
				}

				(this._isSkillKey(k) ? outSkills : outTools)[k] = outExpertise[k] = 2;
			});

		return {
			isFormComplete,
			data: {
				skillProficiencies: outSkills,
				toolProficiencies: outTools,
				expertise: outExpertise,
			},
		};
	}

	pGetFormData () { return this._getFormData(); }

	_getDefaultState () {
		return {
			ixSet: 0,
		};
	}
}

class Charactermancer_ResourceSelect extends BaseComponent {
	static isNoChoice () { return true; }

	static async pApplyFormDataToActor (actor, formData) {
		if (!formData?.data?.length) return;

		const itemLookup = {};
		actor.items.contents.forEach(it => itemLookup[it.name.toLowerCase().trim()] = it);

		const toCreate = [];

		formData.data.forEach(res => {
			const existing = itemLookup[res.name.toLowerCase().trim()];

			if (existing) return;

			toCreate.push({
				name: res.name,
				type: "feat",
				data: this._getItemDataData({res}),
				img: this._getItemDataImg({res}),
			});
		});

		await UtilDocuments.pCreateEmbeddedDocuments(
			actor,
			toCreate,
			{
				ClsEmbed: Item,
				isRender: false,
			},
		);
	}

	render () {  }

	static _getItemDataData ({res}) {
		switch (res.type) {
			case "dicePool": return this._getItemDataData_dicePool({res});
			default: throw new Error(`Unhandled resource type "${res.type}"`);
		}
	}

	static _getItemDataData_dicePool ({res}) {
		return {
			actionType: "other",
			formula: `${res.number}d${res.faces}`,
			activation: {
				type: "special",
			},
			uses: {
				value: 0,
				max: res.count,
				per: UtilDataConverter.getFvttUsesPer(res.recharge),
			},
		};
	}

	static _IMAGES = {
		"Superiority Die": `icons/sundries/gaming/dice-runed-brown.webp`,
		"Psionic Energy Die": "icons/sundries/gaming/dice-pair-white-green.webp",
	};
	static _getItemDataImg ({res}) {
		if (this._IMAGES[res.name]) return this._IMAGES[res.name];

		if (/\b(?:dice|die)\b/i.test((res.name || ""))) return `icons/sundries/gaming/dice-runed-brown.webp`;

		return `modules/${SharedConsts.MODULE_ID}/media/icon/mighty-force.svg`;
	}

	constructor ({resources, className, classSource, subclassShortName, subclassSource}) {
		super();
		this._resources = resources;
		this._className = className;
		this._classSource = classSource;
		this._subclassShortName = subclassShortName;
		this._subclassSource = subclassSource;

		this._mappedResources = this._getMappedResources();
	}

	_getMappedResources () {
		return (this._resources || [])
			.map(res => {
				switch (res.type) {
					case "dicePool": return this._getMappedResources_dicePool({res});
					default: throw new Error(`Unhandled resource type "${res.type}"`);
				}
			});
	}

	_getMappedResources_dicePool ({res}) {
		res = MiscUtil.copy(res);
		res.number = this._getMappedResources_getReplacedVars(res.number || 1);
		res.faces = this._getMappedResources_getReplacedVars(res.faces);
		res.count = this._getMappedResources_getReplacedVars(res.count || 1);
		return res;
	}

	_getMappedResources_getReplacedVars (val) {
		return `${val}`
			.replace(/\bPB\b/g, "@attributes.prof")
			.replace(/<\$(?<variable>[^$]+)\$>/g, (...m) => {
				switch (m.last().variable) {
					case "level": return `@classes.${Parser.stringToSlug(this._className || "unknown")}.levels`;
					default: return m[0];
				}
			})
		;
	}

	pGetFormData () {
		return {
			isFormComplete: true,
			data: MiscUtil.copy(this._mappedResources || []),
		};
	}
}

class Charactermancer_SenseSelect extends BaseComponent {
	static isNoChoice () { return true; }

	static getExistingFvttFromActor (actor) {
		return {
			senses: MiscUtil.get(actor, "_source", "system", "attributes", "senses"),
		};
	}

	static getExisting (existingFvtt) {
				return Object.keys(CONFIG.DND5E.senses)
			.filter(sense => existingFvtt?.senses[sense])
			.mergeMap(sense => ({[sense]: existingFvtt?.senses[sense]}));
	}

	render () {  }

	constructor ({senses, existing, existingFvtt}) {
		super();
		this._senses = senses;
				this._existing = existing;
		this._existingFvtt = existingFvtt;
			}

		static getFormDataFromRace (race) {
		return {
			isFormComplete: true,
			data: {
								darkvision: race.darkvision,
				blindsight: race.blindsight,
				truesight: race.truesight,
				tremorsense: race.tremorsense,
			},
		};
	}

	pGetFormData () {
		return {
			isFormComplete: true,
			data: MiscUtil.copy(this._senses[0] || {}),
		};
	}
}

class Charactermancer_FeatureOptionsSelect extends BaseComponent {
			static async pGetUserInput (opts) {
		const comp = new this({
			...opts,
						featureSourceTracker: opts.featureSourceTracker || new Charactermancer_FeatureSourceTracker(),
			isModal: true,
		});
		if (await comp.pIsNoChoice()) {
			comp.render($(document.createElement("div"))); 			return comp.pGetFormData();
		}

		return UtilApplications.pGetImportCompApplicationFormData({
			comp,
			width: 640,
			height: Util.getMaxWindowHeight(),
			isAutoResize: true,
		});
	}

	static async pDoApplyProficiencyFormDataToActorUpdate (actor, actorUpdate, formData) {
		const formDataData = formData.data;
		if (!formDataData) return;

		const {DataConverter} = await Promise.resolve().then(function () { return DataConverter$1; });

		actorUpdate.system = actorUpdate.system || {};

				for (const formData of formDataData.formDatasSkillToolLanguageProficiencies || []) {
			DataConverter.doApplySkillFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "skills"),
				formData: formData,
				actorData: actorUpdate.system,
			});

			DataConverter.doApplyLanguageProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "languages"),
				formData,
				actorData: actorUpdate.system,
			});

			DataConverter.doApplyToolProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "tools"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasSkillProficiencies || []) {
			DataConverter.doApplySkillFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "skills"),
				formData: formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasLanguageProficiencies || []) {
			DataConverter.doApplyLanguageProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "languages"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasToolProficiencies || []) {
			DataConverter.doApplyToolProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "tools"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasWeaponProficiencies || []) {
			DataConverter.doApplyWeaponProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "weaponProf"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasArmorProficiencies || []) {
			DataConverter.doApplyArmorProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "armorProf"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasSavingThrowProficiencies || []) {
			DataConverter.doApplySavingThrowProficienciesFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "abilities"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasDamageImmunities || []) {
			DataConverter.doApplyDamageImmunityFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "di"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasDamageResistances || []) {
			DataConverter.doApplyDamageResistanceFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "dr"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasDamageVulnerabilities || []) {
			DataConverter.doApplyDamageVulnerabilityFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "dv"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasConditionImmunities || []) {
			DataConverter.doApplyConditionImmunityFormDataToActorUpdate({
				existingProfsActor: MiscUtil.get(actor, "_source", "system", "traits", "ci"),
				formData,
				actorData: actorUpdate.system,
			});
		}

		for (const formData of formDataData.formDatasExpertise || []) {
			DataConverter.doApplyExpertiseFormDataToActorUpdate({
				existingProfsActor: {
					skillProficiencies: MiscUtil.get(actor, "_source", "system", "skills"),
					toolProficiencies: MiscUtil.get(actor, "_source", "system", "tools"),
				},
				formData: formData,
				actorData: actorUpdate.system,
			});
		}
			}

	static async pDoApplyResourcesFormDataToActor ({actor, formData}) {
		const formDataData = formData.data;

		if (!formDataData?.formDatasResources?.length) return;

		for (const formDataResources of formDataData.formDatasResources) {
			await Charactermancer_ResourceSelect.pApplyFormDataToActor(
				actor,
				formDataResources,
			);
		}
	}

	static async pDoApplySensesFormDataToActor ({actor, actorUpdate, formData, configGroup}) {
		const formDataData = formData.data;
		if (!formDataData || !formDataData.formDatasSenses?.length) return;

		const {DataConverter} = await Promise.resolve().then(function () { return DataConverter$1; });

		actorUpdate.prototypeToken = actorUpdate.prototypeToken || {};
		actorUpdate.system = actorUpdate.system || {};

		for (const formData of formDataData.formDatasSenses || []) {
			DataConverter.doApplySensesFormDataToActorUpdate({
				existingSensesActor: MiscUtil.get(actor, "_source", "system", "attributes", "senses"),
				existingTokenActor: MiscUtil.get(actor, "_source", "prototypeToken"),
				formData: formData,
				actorData: actorUpdate.system,
				actorToken: actorUpdate.prototypeToken,
				configGroup,
			});
		}
	}

	static async pDoApplyAdditionalSpellsFormDataToActor ({actor, formData, abilityAbv, parentAbilityAbv = null, taskRunner = null}) {
		const formDataData = formData.data;
		if (!formDataData || !formDataData.formDatasAdditionalSpells?.length) return;

		for (const formDataAdditionalSpells of formDataData.formDatasAdditionalSpells) {
			await Charactermancer_AdditionalSpellsSelect.pApplyFormDataToActor(
				actor,
				formDataAdditionalSpells,
				{
					taskRunner,
					abilityAbv,
					parentAbilityAbv,
				},
			);
		}
	}
	
		constructor (opts) {
		super();

		this._optionsSet = opts.optionsSet;
		this._actor = opts.actor;
		this._level = opts.level;
		this._existingFeatureChecker = opts.existingFeatureChecker;
		this._featureSourceTracker = opts.featureSourceTracker;
		this._isModal = !!opts.isModal;
		this._modalFilterSpells = opts.modalFilterSpells;
		this._isSkipCharactermancerHandled = !!opts.isSkipCharactermancerHandled;
		this._isSkipRenderingFirstFeatureTitle = !!opts.isSkipRenderingFirstFeatureTitle;

				if (this._isOptions()) {
			this._optionsSet.sort((a, b) => SortUtil.ascSortLower(a.entity.name, b.entity.name) || SortUtil.ascSortLower(Parser.sourceJsonToAbv(a.entity.source), Parser.sourceJsonToAbv(b.entity.source)));
		}

		this._lastMeta = null;
		this._lastSubMetas = [];

						this._subCompsSkillToolLanguageProficiencies = [];
		this._subCompsSkillProficiencies = [];
		this._subCompsLanguageProficiencies = [];
		this._subCompsToolProficiencies = [];
		this._subCompsWeaponProficiencies = [];
		this._subCompsArmorProficiencies = [];
		this._subCompsSavingThrowProficiencies = [];
		this._subCompsDamageImmunities = [];
		this._subCompsDamageResistances = [];
		this._subCompsDamageVulnerabilities = [];
		this._subCompsConditionImmunities = [];
		this._subCompsExpertise = [];
		this._subCompsResources = [];
		this._subCompsSenses = [];
		this._subCompsAdditionalSpells = [];

				this._prevSubCompsSkillToolLanguageProficiencies = null;
		this._prevSubCompsSkillProficiencies = null;
		this._prevSubCompsLanguageProficiencies = null;
		this._prevSubCompsToolProficiencies = null;
		this._prevSubCompsWeaponProficiencies = null;
		this._prevSubCompsArmorProficiencies = null;
		this._prevSubCompsSavingThrowProficiencies = null;
		this._prevSubCompsDamageImmunities = [];
		this._prevSubCompsDamageResistances = [];
		this._prevSubCompsDamageVulnerabilities = [];
		this._prevSubCompsConditionImmunities = [];
		this._prevSubCompsExpertise = [];
		this._prevSubCompsResources = [];
		this._prevSubCompsSenses = null;
		this._prevSubCompsAdditionalSpells = null;
			}

	/**
	 * just returns this._optionsSet
	 */
	get optionSet_ () { return this._optionsSet; }
	/**
	 * Returns true if this._optionsSet[0] exists and this._optionsSet[0].optionsMeta exists
	 */
	_isOptions () {return !!(this._optionsSet[0] && this._optionsSet[0].optionsMeta);}

	unregisterFeatureSourceTracking () {
		if (this._featureSourceTracker) this._featureSourceTracker.unregister(this);
		this._unregisterSubComps();
	}

	async _pIsSubChoiceForceDisplay (selectedLoadeds) {
		const isSubChoice_sideDataChooseSystem = await this._pHasChoiceInSideData_chooseSystem(selectedLoadeds);
		const isSubChoice_sideDataChooseFlags = await this._pHasChoiceInSideData_chooseFlags(selectedLoadeds);
		const isForceDisplay_entryDataSkillToolLanguageProficiencies = await this._pIsForceDisplay_skillToolLanguageProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataSkillProficiencies = await this._pIsForceDisplay_skillProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataLanguageProficiencies = await this._pIsForceDisplay_languageProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataToolProficiencies = await this._pIsForceDisplay_toolProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataWeaponProficiencies = await this._pIsForceDisplay_weaponProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataArmorProficiencies = await this._pIsForceDisplay_armorProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataSavingThrowProficiencies = await this._pIsForceDisplay_savingThrowProficiencies(selectedLoadeds);
		const isForceDisplay_entryDataDamageImmunities = await this._pIsForceDisplay_damageImmunities(selectedLoadeds);
		const isForceDisplay_entryDataDamageResistances = await this._pIsForceDisplay_damageResistances(selectedLoadeds);
		const isForceDisplay_entryDataDamageVulnerabilities = await this._pIsForceDisplay_damageVulnerabilities(selectedLoadeds);
		const isForceDisplay_entryDataConditionImmunities = await this._pIsForceDisplay_conditionImmunities(selectedLoadeds);
		const isForceDisplay_entryDataExpertise = await this._pIsForceDisplay_expertise(selectedLoadeds);
		const isForceDisplay_entryDataResources = await this._pIsForceDisplay_resources(selectedLoadeds);
		const isForceDisplay_entryDataSenses = await this._pIsForceDisplay_senses(selectedLoadeds);
		const isForceDisplay_entryDataAdditionalSpells = await this._pIsForceDisplay_additionalSpells(selectedLoadeds);

		return [
			isSubChoice_sideDataChooseSystem,
			isSubChoice_sideDataChooseFlags,
			isForceDisplay_entryDataSkillToolLanguageProficiencies,
			isForceDisplay_entryDataSkillProficiencies,
			isForceDisplay_entryDataLanguageProficiencies,
			isForceDisplay_entryDataToolProficiencies,
			isForceDisplay_entryDataWeaponProficiencies,
			isForceDisplay_entryDataArmorProficiencies,
			isForceDisplay_entryDataSavingThrowProficiencies,
			isForceDisplay_entryDataDamageImmunities,
			isForceDisplay_entryDataDamageResistances,
			isForceDisplay_entryDataDamageVulnerabilities,
			isForceDisplay_entryDataConditionImmunities,
			isForceDisplay_entryDataExpertise,
			isForceDisplay_entryDataResources,
			isForceDisplay_entryDataSenses,
			isForceDisplay_entryDataAdditionalSpells,
		].some(Boolean);
	}

	async _pIsSubChoiceAvailable (selectedLoadeds) {
		const isSubChoice_sideDataChooseSystem = await this._pHasChoiceInSideData_chooseSystem(selectedLoadeds);
		const isSubChoice_sideDataChooseFlags = await this._pHasChoiceInSideData_chooseFlags(selectedLoadeds);
		const isAvailable_entryDataSkillToolLanguageProficiencies = await this._pIsAvailable_skillToolLanguageProficiencies(selectedLoadeds);
		const isAvailable_entryDataSkillProficiencies = await this._pIsAvailable_skillProficiencies(selectedLoadeds);
		const isAvailable_entryDataLanguageProficiencies = await this._pIsAvailable_languageProficiencies(selectedLoadeds);
		const isAvailable_entryDataToolProficiencies = await this._pIsAvailable_toolProficiencies(selectedLoadeds);
		const isAvailable_entryDataWeaponProficiencies = await this._pIsAvailable_weaponProficiencies(selectedLoadeds);
		const isAvailable_entryDataArmorProficiencies = await this._pIsAvailable_armorProficiencies(selectedLoadeds);
		const isAvailable_entryDataSavingThrowProficiencies = await this._pIsAvailable_savingThrowProficiencies(selectedLoadeds);
		const isAvailable_entryDataDamageImmunities = await this._pIsAvailable_damageImmunities(selectedLoadeds);
		const isAvailable_entryDataDamageResistances = await this._pIsAvailable_damageResistances(selectedLoadeds);
		const isAvailable_entryDataDamageVulnerabilities = await this._pIsAvailable_damageVulnerabilities(selectedLoadeds);
		const isAvailable_entryDataConditionImmunities = await this._pIsAvailable_conditionImmunities(selectedLoadeds);
		const isAvailable_entryDataExpertise = await this._pIsAvailable_expertise(selectedLoadeds);
		const isAvailable_entryDataResources = await this._pIsAvailable_resources(selectedLoadeds);
		const isAvailable_entryDataSenses = await this._pIsAvailable_senses(selectedLoadeds);
		const isAvailable_entryDataAdditionalSpells = await this._pIsAvailable_additionalSpells(selectedLoadeds);

		return [
			isSubChoice_sideDataChooseSystem,
			isSubChoice_sideDataChooseFlags,
			isAvailable_entryDataSkillToolLanguageProficiencies,
			isAvailable_entryDataSkillProficiencies,
			isAvailable_entryDataLanguageProficiencies,
			isAvailable_entryDataToolProficiencies,
			isAvailable_entryDataWeaponProficiencies,
			isAvailable_entryDataArmorProficiencies,
			isAvailable_entryDataSavingThrowProficiencies,
			isAvailable_entryDataDamageImmunities,
			isAvailable_entryDataDamageResistances,
			isAvailable_entryDataDamageVulnerabilities,
			isAvailable_entryDataConditionImmunities,
			isAvailable_entryDataExpertise,
			isAvailable_entryDataResources,
			isAvailable_entryDataSenses,
			isAvailable_entryDataAdditionalSpells,
		].some(Boolean);
	}

	static _ENTITY_TYPE_TO_SIDE_DATA_META = {
		"backgroundFeature": {file: "SideDataInterfaceBackgroundFeature", sideDataInterface: "SideDataInterfaceBackgroundFeature"},
		"charoption": {file: "SideDataInterfaceCharCreationOption", sideDataInterface: "SideDataInterfaceCharCreationOption"},
		"classFeature": {file: "SideDataInterfaceClassSubclassFeature", sideDataInterface: "SideDataInterfaceClassSubclassFeature"},
		"subclassFeature": {file: "SideDataInterfaceClassSubclassFeature", sideDataInterface: "SideDataInterfaceClassSubclassFeature"},
		"feat": {file: "SideDataInterfaceFeat", sideDataInterface: "SideDataInterfaceFeat"},
		"optionalfeature": {file: "SideDataInterfaceOptionalfeature", sideDataInterface: "SideDataInterfaceOptionalfeature"},
		"raceFeature": {file: "SideDataInterfaceRaceFeature", sideDataInterface: "SideDataInterfaceRaceFeature"},
		"reward": {file: "SideDataInterfaceReward", sideDataInterface: "SideDataInterfaceReward"},
		"vehicleUpgrade": {file: "SideDataInterfaceVehicleUpgrade", sideDataInterface: "SideDataInterfaceVehicleUpgrade"},
	};

	async _pHasChoiceInSideData_chooseSystem (optionsSet) {
		return this._pHasChoiceInSideData_chooseSystemOrFlags({optionsSet, propChoose: "chooseSystem"});
	}

	async _pHasChoiceInSideData_chooseFlags (optionsSet) {
		return this._pHasChoiceInSideData_chooseSystemOrFlags({optionsSet, propChoose: "chooseFlags"});
	}

	async _pHasChoiceInSideData_chooseSystemOrFlags ({optionsSet, propChoose}) {
		optionsSet = optionsSet || this._optionsSet;

		if (this._isSkipCharactermancerHandled) return false;

		for (const loaded of optionsSet) {
			const {entity, type} = loaded;

			const sideDataConverterMeta = this.constructor._ENTITY_TYPE_TO_SIDE_DATA_META[type];

			if (sideDataConverterMeta) {
								if (!sideDataConverterMeta.file.startsWith("SideDataInterface")) throw new Error(`Expected side-data interface to start with "SideDataInterface"!`);
				const mod = await __variableDynamicImportRuntime2__(`./SideDataInterface/SideDataInterface${sideDataConverterMeta.file.replace(/^SideDataInterface/, "")}.js`);
				
				const sideData = await mod[sideDataConverterMeta.sideDataInterface].pGetSideLoaded(entity);
				if (sideData?.[propChoose]?.length) return true;
			}
		}
		return false;
	}

	async _pHasSubChoice_entryData_skillToolLanguageProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "skillToolLanguageProficiencies",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_entryData_skillProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "skillProficiencies",
			isRequireChoice: true,
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedSkillProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pHasSubChoice_entryData_languageProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "languageProficiencies",
			isRequireChoice: true,
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedLanguageProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pHasSubChoice_entryData_toolProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "toolProficiencies",
			isRequireChoice: true,
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedToolProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pHasSubChoice_entryData_weaponProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "weaponProficiencies",
			isRequireChoice: true,
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedWeaponProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pHasSubChoice_entryData_armorProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "armorProficiencies",
			isRequireChoice: true,
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedArmorProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pHasSubChoice_entryData_savingThrowProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "savingThrowProficiencies",
			isRequireChoice: true,
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedSavingThrowProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pHasSubChoice_damageImmunities (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_DamageImmunitySelect,
			prop: "immune",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_damageResistances (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_DamageResistanceSelect,
			prop: "resist",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_damageVulnerabilities (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_DamageVulnerabilitySelect,
			prop: "vulnerable",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_conditionImmunities (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ConditionImmunitySelect,
			prop: "conditionImmune",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_expertise (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ExpertiseSelect,
			prop: "expertise",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_resources (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ResourceSelect,
			prop: "resources",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_entryData_senses (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_SenseSelect,
			prop: "senses",
			isRequireChoice: true,
		});
	}

	async _pHasSubChoice_entryData_additionalSpells (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_AdditionalSpellsSelect,
			prop: "additionalSpells",
			isRequireChoice: true,
		});
	}

	async _pHasEntryData_prop ({optionsSet, CompClass, prop, isRequireChoice, fnGetMappedProficiencies}) {
		optionsSet = optionsSet || this._optionsSet;

		if (this._isSkipCharactermancerHandled) return false;

		for (const loaded of optionsSet) {
			const {entity} = loaded;

			let proficiencies = entity?.[prop] || entity?.entryData?.[prop];
			if (proficiencies) {
				if (fnGetMappedProficiencies) proficiencies = fnGetMappedProficiencies(proficiencies);

				if (!isRequireChoice) return true;
				else {
					const isNoChoice = CompClass.isNoChoice(proficiencies);
					if (!isNoChoice) return true;
				}
			}
		}
		return false;
	}

	async _pIsForceDisplay_skillToolLanguageProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "skillToolLanguageProficiencies",
		});
	}

	async _pIsForceDisplay_skillProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "skillProficiencies",
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedSkillProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pIsForceDisplay_languageProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "languageProficiencies",
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedLanguageProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pIsForceDisplay_toolProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "toolProficiencies",
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedToolProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pIsForceDisplay_weaponProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "weaponProficiencies",
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedWeaponProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pIsForceDisplay_armorProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "armorProficiencies",
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedArmorProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pIsForceDisplay_savingThrowProficiencies (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_OtherProficiencySelect,
			prop: "savingThrowProficiencies",
			fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedSavingThrowProficiencies.bind(Charactermancer_OtherProficiencySelect),
		});
	}

	async _pIsForceDisplay_damageImmunities (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ConditionImmunitySelect,
			prop: "immune",
		});
	}

	async _pIsForceDisplay_damageResistances (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_DamageResistanceSelect,
			prop: "resist",
		});
	}

	async _pIsForceDisplay_damageVulnerabilities (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_DamageVulnerabilitySelect,
			prop: "vulnerable",
		});
	}

	async _pIsForceDisplay_conditionImmunities (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ConditionImmunitySelect,
			prop: "conditionImmune",
		});
	}

	async _pIsForceDisplay_expertise (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ExpertiseSelect,
			prop: "expertise",
		});
	}

	async _pIsForceDisplay_resources (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ResourceSelect,
			prop: "resources",
			isRequireChoice: true, 		});
	}

	_pIsForceDisplay_senses (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_SenseSelect,
			prop: "senses",
			isRequireChoice: true, 		});
	}

	_pIsForceDisplay_additionalSpells (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_AdditionalSpellsSelect,
			prop: "additionalSpells",
		});
	}

	_pIsAvailable_skillToolLanguageProficiencies (...args) { return this._pIsForceDisplay_skillToolLanguageProficiencies(...args); }
	_pIsAvailable_skillProficiencies (...args) { return this._pIsForceDisplay_skillProficiencies(...args); }
	_pIsAvailable_languageProficiencies (...args) { return this._pIsForceDisplay_languageProficiencies(...args); }
	_pIsAvailable_toolProficiencies (...args) { return this._pIsForceDisplay_toolProficiencies(...args); }
	_pIsAvailable_weaponProficiencies (...args) { return this._pIsForceDisplay_weaponProficiencies(...args); }
	_pIsAvailable_armorProficiencies (...args) { return this._pIsForceDisplay_armorProficiencies(...args); }
	_pIsAvailable_savingThrowProficiencies (...args) { return this._pIsForceDisplay_savingThrowProficiencies(...args); }
	_pIsAvailable_damageImmunities (...args) { return this._pIsForceDisplay_damageImmunities(...args); }
	_pIsAvailable_damageResistances (...args) { return this._pIsForceDisplay_damageResistances(...args); }
	_pIsAvailable_damageVulnerabilities (...args) { return this._pIsForceDisplay_damageVulnerabilities(...args); }
	_pIsAvailable_conditionImmunities (...args) { return this._pIsForceDisplay_conditionImmunities(...args); }
	_pIsAvailable_expertise (...args) { return this._pIsForceDisplay_expertise(...args); }

	async _pIsAvailable_resources (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_ResourceSelect,
			prop: "resources",
		});
	}

	_pIsAvailable_senses (optionsSet) {
		return this._pHasEntryData_prop({
			optionsSet,
			CompClass: Charactermancer_SenseSelect,
			prop: "senses",
		});
	}

	_pIsAvailable_additionalSpells (...args) { return this._pIsForceDisplay_additionalSpells(...args); }

	async _pGetLoadedsSideDataRaws (optionsSet) {
		//optionsSet is an array of classFeatures
		optionsSet = optionsSet || this._optionsSet; //Or we default to our cached one
		const out = [];
		for (const loaded of optionsSet) {
			const {entity, type} = loaded;

			switch (type) {
				case "classFeature": //Most of the time, we will be dealing with features of this type
				case "subclassFeature": {
					const {SideDataInterfaceClassSubclassFeature} = await Promise.resolve().then(function () { return SideDataInterfaceClassSubclassFeature$1; });
					const sideData = await SideDataInterfaceClassSubclassFeature.pGetSideLoaded(entity);
					out.push(sideData);
					break;
				}

				
				default: {
					out.push(null);
					break;
				}
			}
		}
		return out;
	}

	async pIsNoChoice () {
		if (this._isOptions()) return false;
		if (await this._pHasChoiceInSideData_chooseSystem()) return false;
		if (await this._pHasChoiceInSideData_chooseFlags()) return false;
		if (await this._pHasSubChoice_entryData_skillToolLanguageProficiencies()) return false;
		if (await this._pHasSubChoice_entryData_skillProficiencies()) return false;
		if (await this._pHasSubChoice_entryData_languageProficiencies()) return false;
		if (await this._pHasSubChoice_entryData_toolProficiencies()) return false;
		if (await this._pHasSubChoice_entryData_weaponProficiencies()) return false;
		if (await this._pHasSubChoice_entryData_armorProficiencies()) return false;
		if (await this._pHasSubChoice_entryData_savingThrowProficiencies()) return false;
		if (await this._pHasSubChoice_damageImmunities()) return false;
		if (await this._pHasSubChoice_damageResistances()) return false;
		if (await this._pHasSubChoice_damageVulnerabilities()) return false;
		if (await this._pHasSubChoice_conditionImmunities()) return false;
		if (await this._pHasSubChoice_expertise()) return false;
		if (await this._pHasSubChoice_resources()) return false;
		if (await this._pHasSubChoice_entryData_senses()) return false;
		if (await this._pHasSubChoice_entryData_additionalSpells()) return false;
		return true;
	}

	async pIsForceDisplay () {
		if (await this._pIsForceDisplay_skillToolLanguageProficiencies()) return true;
		if (await this._pIsForceDisplay_skillProficiencies()) return true;
		if (await this._pIsForceDisplay_languageProficiencies()) return true;
		if (await this._pIsForceDisplay_toolProficiencies()) return true;
		if (await this._pIsForceDisplay_weaponProficiencies()) return true;
		if (await this._pIsForceDisplay_armorProficiencies()) return true;
		if (await this._pIsForceDisplay_savingThrowProficiencies()) return true;
		if (await this._pIsForceDisplay_damageImmunities()) return true;
		if (await this._pIsForceDisplay_damageResistances()) return true;
		if (await this._pIsForceDisplay_damageVulnerabilities()) return true;
		if (await this._pIsForceDisplay_conditionImmunities()) return true;
		if (await this._pIsForceDisplay_expertise()) return true;
		if (await this._pIsForceDisplay_resources()) return true;
		if (await this._pIsForceDisplay_senses()) return true;
		if (await this._pIsForceDisplay_additionalSpells()) return true;
		return false;
	}

	async pIsAvailable () {
		if (await this._pIsAvailable_skillToolLanguageProficiencies()) return true;
		if (await this._pIsAvailable_skillProficiencies()) return true;
		if (await this._pIsAvailable_languageProficiencies()) return true;
		if (await this._pIsAvailable_toolProficiencies()) return true;
		if (await this._pIsAvailable_weaponProficiencies()) return true;
		if (await this._pIsAvailable_armorProficiencies()) return true;
		if (await this._pIsAvailable_savingThrowProficiencies()) return true;
		if (await this._pIsAvailable_damageImmunities()) return true;
		if (await this._pIsAvailable_damageResistances()) return true;
		if (await this._pIsAvailable_damageVulnerabilities()) return true;
		if (await this._pIsAvailable_conditionImmunities()) return true;
		if (await this._pIsAvailable_expertise()) return true;
		if (await this._pIsAvailable_resources()) return true;
		if (await this._pIsAvailable_senses()) return true;
		if (await this._pIsAvailable_additionalSpells()) return true;
		return false;
	}

	_getTrackableFeatures () {
		const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this, "ixsChosen");
		const selectedLoadeds = ixs.map(ix => this._optionsSet[ix]);

		return selectedLoadeds.map(({page, hash}) => ({page, hash}));
	}

		findAndCopyStateFrom (comps) {
		if (!comps?.length) return;

		const comp = comps.find(it => CollectionUtil.deepEquals(it.optionSet_, this.optionSet_));
		if (comp) {
			this._proxyAssignSimple("state", MiscUtil.copy(comp.__state));
			this._prevSubCompsSkillToolLanguageProficiencies = comp._subCompsSkillToolLanguageProficiencies;
			this._prevSubCompsSkillProficiencies = comp._subCompsSkillProficiencies;
			this._prevSubCompsLanguageProficiencies = comp._subCompsLanguageProficiencies;
			this._prevSubCompsToolProficiencies = comp._subCompsToolProficiencies;
			this._prevSubCompsWeaponProficiencies = comp._subCompsWeaponProficiencies;
			this._prevSubCompsArmorProficiencies = comp._subCompsArmorProficiencies;
			this._prevSubCompsSavingThrowProficiencies = comp._subCompsSavingThrowProficiencies;
			this._prevSubCompsDamageImmunities = comp._prevSubCompsDamageImmunities;
			this._prevSubCompsDamageResistances = comp._prevSubCompsDamageResistances;
			this._prevSubCompsDamageVulnerabilities = comp._prevSubCompsDamageVulnerabilities;
			this._prevSubCompsConditionImmunities = comp._prevSubCompsConditionImmunities;
			this._prevSubCompsExpertise = comp._prevSubCompsExpertise;
			this._prevSubCompsResources = comp._prevSubCompsResources;
			this._prevSubCompsSenses = comp._subCompsSenses;
			this._prevSubCompsAdditionalSpells = comp._subCompsAdditionalSpells;
		}
	}

	async pGetFormData () { //TIP: Charactermancer_FeatureOptionsSelect.pGetFormData
		//TIP: pGetFormData
		//this.pIsNoChoice is strange, but it seems to (mostly?) return true?
		//this.pIsAvailable needs more investifation, but it seems to (mostly?) return false
		if (await this.pIsNoChoice() && !await this.pIsAvailable()) {
			const sideDatas = await this._pGetLoadedsSideDataRaws();
			
			const cpyOptionsSet = MiscUtil.copy(this._optionsSet);
			cpyOptionsSet.forEach((loaded, i) => {
				const sideData = sideDatas[i];
				if (!sideData) return;

				const {entity} = loaded;
				if (sideData.data) entity.foundryAdditionalSystem = MiscUtil.copy(sideData.data);
				if (sideData.flags) entity.foundryAdditionalFlags = MiscUtil.copy(sideData.flags);
				if (sideData.effects) entity.effectsRaw = MiscUtil.copy(sideData.effects);
			});

			return {
				isFormComplete: true,
				data: {
					features: cpyOptionsSet,
				},
			};
		}

		await this._pGate("ixsChosen");

		const selectedLoadeds = this._getSelectedLoadeds();

		const sideDatas = await this._pGetLoadedsSideDataRaws(selectedLoadeds);
		const cpySelectedLoadeds = MiscUtil.copy(selectedLoadeds);

		const outSkillToolLanguageProficiencies = [];
		const outSkillProficiencies = [];
		const outLanguageProficiencies = [];
		const outToolProficiencies = [];
		const outWeaponProficiencies = [];
		const outArmorProficiencies = [];
		const outSavingThrowProficiencies = [];
		const outDamageImmunities = [];
		const outDamageResistances = [];
		const outDamageVulnerabilities = [];
		const outConditionImmunities = [];
		const outExpertise = [];
		const outResources = [];
		const outSenses = [];
		const outAdditionalSpells = [];

		for (let i = 0; i < cpySelectedLoadeds.length; ++i) {
			const loaded = cpySelectedLoadeds[i];

			const sideData = sideDatas[i];

			const {entity} = loaded;

			if (sideData) {
				if (sideData.data) entity.foundryAdditionalSystem = MiscUtil.copy(sideData.data);
				if (sideData.flags) entity.foundryAdditionalFlags = MiscUtil.copy(sideData.flags);
				if (sideData.effects) entity.effectsRaw = MiscUtil.copy(sideData.effects);

				const selectedChooseDataSystem = this._getFormData_getChooseSystemOrChooseFlags({
					sideData,
					ixCpySelectedLoaded: i,
					propChoose: "chooseSystem",
					propCompProp: "propChooseSystem",
				});
				if (selectedChooseDataSystem) {
					entity.foundryAdditionalSystem = entity.foundryAdditionalSystem || {};
					Object.assign(entity.foundryAdditionalSystem, MiscUtil.copy(selectedChooseDataSystem.system));
				}

				const selectedChooseDataFlags = this._getFormData_getChooseSystemOrChooseFlags({
					sideData,
					ixCpySelectedLoaded: i,
					propChoose: "chooseFlags",
					propCompProp: "propChooseFlags",
				});
				if (selectedChooseDataFlags) {
					entity.foundryAdditionalFlags = entity.foundryAdditionalFlags || {};
					foundry.utils.mergeObject(entity.foundryAdditionalFlags, MiscUtil.copy(selectedChooseDataFlags.flags));
				}
			}

			if (!this._isSkipCharactermancerHandled) {
								if ((entity?.skillToolLanguageProficiencies || entity?.entryData?.skillToolLanguageProficiencies) && this._subCompsSkillToolLanguageProficiencies[i]) {
					const formData = await this._subCompsSkillToolLanguageProficiencies[i].pGetFormData();
					outSkillToolLanguageProficiencies.push(formData);
				}
				
								if ((entity?.skillProficiencies || entity?.entryData?.skillProficiencies) && this._subCompsSkillProficiencies[i]) {
					const formData = await this._subCompsSkillProficiencies[i].pGetFormData();
					outSkillProficiencies.push(formData);
				}
				
								if ((entity?.languageProficiencies || entity?.entryData?.languageProficiencies) && this._subCompsLanguageProficiencies[i]) {
					const formData = await this._subCompsLanguageProficiencies[i].pGetFormData();
					outLanguageProficiencies.push(formData);
				}
				
								if ((entity?.toolProficiencies || entity?.entryData?.toolProficiencies) && this._subCompsToolProficiencies[i]) {
					const formData = await this._subCompsToolProficiencies[i].pGetFormData();
					outToolProficiencies.push(formData);
				}
				
								if ((entity?.weaponProficiencies || entity?.entryData?.weaponProficiencies) && this._subCompsWeaponProficiencies[i]) {
					const formData = await this._subCompsWeaponProficiencies[i].pGetFormData();
					outWeaponProficiencies.push(formData);
				}
				
								if ((entity?.armorProficiencies || entity?.entryData?.armorProficiencies) && this._subCompsArmorProficiencies[i]) {
					const formData = await this._subCompsArmorProficiencies[i].pGetFormData();
					outArmorProficiencies.push(formData);
				}
				
								if ((entity?.savingThrowProficiencies || entity?.entryData?.savingThrowProficiencies) && this._subCompsSavingThrowProficiencies[i]) {
					const formData = await this._subCompsSavingThrowProficiencies[i].pGetFormData();
					outSavingThrowProficiencies.push(formData);
				}
				
								if ((entity?.immune || entity?.entryData?.immune) && this._subCompsDamageImmunities[i]) {
					const formData = await this._subCompsDamageImmunities[i].pGetFormData();
					outDamageImmunities.push(formData);
				}
				
								if ((entity?.resist || entity?.entryData?.resist) && this._subCompsDamageResistances[i]) {
					const formData = await this._subCompsDamageResistances[i].pGetFormData();
					outDamageResistances.push(formData);
				}
				
								if ((entity?.vulnerable || entity?.entryData?.vulnerable) && this._subCompsDamageVulnerabilities[i]) {
					const formData = await this._subCompsDamageVulnerabilities[i].pGetFormData();
					outDamageVulnerabilities.push(formData);
				}
				
								if ((entity?.conditionImmune || entity?.entryData?.conditionImmune) && this._subCompsConditionImmunities[i]) {
					const formData = await this._subCompsConditionImmunities[i].pGetFormData();
					outConditionImmunities.push(formData);
				}
				
								if ((entity?.expertise || entity?.entryData?.expertise) && this._subCompsExpertise[i]) {
					const formData = await this._subCompsExpertise[i].pGetFormData();
					outExpertise.push(formData);
				}
				
								if ((entity?.resources || entity?.entryData?.resources) && this._subCompsResources[i]) {
					const formData = await this._subCompsResources[i].pGetFormData();
					outResources.push(formData);
				}
				
								if ((entity?.senses || entity?.entryData?.senses) && this._subCompsSenses[i]) {
					const formData = await this._subCompsSenses[i].pGetFormData();
					outSenses.push(formData);
				}
				
								if ((entity?.additionalSpells || entity?.entryData?.additionalSpells) && this._subCompsAdditionalSpells[i]) {
					const formData = await this._subCompsAdditionalSpells[i].pGetFormData();
					outAdditionalSpells.push(formData);
				}
							}
		}

		return {
			isFormComplete: true,
			data: {
				features: cpySelectedLoadeds,
				formDatasSkillToolLanguageProficiencies: outSkillToolLanguageProficiencies,
				formDatasSkillProficiencies: outSkillProficiencies,
				formDatasLanguageProficiencies: outLanguageProficiencies,
				formDatasToolProficiencies: outToolProficiencies,
				formDatasWeaponProficiencies: outWeaponProficiencies,
				formDatasArmorProficiencies: outArmorProficiencies,
				formDatasSavingThrowProficiencies: outSavingThrowProficiencies,
				formDatasDamageImmunities: outDamageImmunities,
				formDatasDamageResistances: outDamageResistances,
				formDatasDamageVulnerabilities: outDamageVulnerabilities,
				formDatasConditionImmunities: outConditionImmunities,
				formDatasExpertise: outExpertise,
				formDatasResources: outResources,
				formDatasSenses: outSenses,
				formDatasAdditionalSpells: outAdditionalSpells,
			},
		};
	}

	_getFormData_getChooseSystemOrChooseFlags ({sideData, ixCpySelectedLoaded, propChoose, propCompProp}) {
		if (!sideData[propChoose]) return null;

		const compProps = this._getProps(ixCpySelectedLoaded);

		const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this, compProps[propCompProp]);
		const selectedChoose = ixs.map(ix => sideData[propChoose][ix]);

		if (!selectedChoose.length) return null;

				return selectedChoose[0];
	}

	_getOptionsNameAndCount () {
		const {name, count} = this._optionsSet[0].optionsMeta;
		const required = this._optionsSet.map((it, ix) => ({it, ix})).filter(({it}) => it.isRequiredOption).map(({ix}) => ix);
		const dispCount = count - required.length;

		return {name, count, dispCount, required};
	}

	get modalTitle () {
		if (!this._isOptions()) return null;

		const {dispCount, name} = this._getOptionsNameAndCount();
		return `Choose ${dispCount === 1 ? "" : `${dispCount} `}Option${dispCount === 1 ? "" : "s"}: ${name}${this._level != null ? ` (Level ${this._level})` : ""}`;
	}

	static _getLoadedTmpUid (loaded) { return `${loaded.page}__${loaded.hash}`; }

	_getSelectedLoadeds () {
		if (this._isOptions()) {
			const ixs = ComponentUiUtil.getMetaWrpMultipleChoice_getSelectedIxs(this, "ixsChosen");
			const {required} = this._getOptionsNameAndCount();
			return [...ixs, ...required].map(ix => this._optionsSet[ix]);
		} else {
			return this._optionsSet;
		}
	}

	render ($wrp) {
		const $stgSubChoiceData = $$`<div class="w-100 ve-flex-col mt-2"></div>`.hideVe();

		this._render_options();

		$$`<div class="ve-flex-col min-h-0 overflow-y-auto">
			${this._lastMeta?.$ele}
			${$stgSubChoiceData}
		</div>`.appendTo($wrp);

		this._addHookBase(
			ComponentUiUtil.getMetaWrpMultipleChoice_getPropPulse("ixsChosen"),
			() => this._render_pHkIxsChosen({$stgSubChoiceData}),
		);
		return this._render_pHkIxsChosen({$stgSubChoiceData});
	}

	async pRender ($wrp) {
		return this.render($wrp);
	}

	async _render_pHkIxsChosen ({$stgSubChoiceData}) {
		try {
			await this._pLock("ixsChosen");
			await this._render_pHkIxsChosen_({$stgSubChoiceData});
		} finally {
			this._unlock("ixsChosen");
		}
	}

	async _render_pHkIxsChosen_ ({$stgSubChoiceData}) {
				const {prefixSubComps} = this._getProps();
		Object.keys(this._state).filter(k => k.startsWith(prefixSubComps)).forEach(k => delete this._state[k]);

		const selectedLoadeds = this._getSelectedLoadeds();

		if (!selectedLoadeds.length) return this._render_noSubChoices({$stgSubChoiceData});

		const isSubChoiceForceDisplay = await this._pIsSubChoiceForceDisplay(selectedLoadeds);
		const isSubChoiceAvailable = await this._pIsSubChoiceAvailable(selectedLoadeds);
		if (!isSubChoiceForceDisplay && !isSubChoiceAvailable) return this._render_noSubChoices({$stgSubChoiceData});

		$stgSubChoiceData.empty();
		this._unregisterSubComps();

		const sideDataRaws = await this._pGetLoadedsSideDataRaws(selectedLoadeds);
		const ptrIsFirstSection = {_: true};

		for (let i = 0; i < selectedLoadeds.length; ++i) {
			const loaded = selectedLoadeds[i];

									if (!(await this._pIsSubChoiceForceDisplay([selectedLoadeds[i]]) || await this._pIsSubChoiceAvailable([selectedLoadeds[i]]))) continue;
			
			const isSubChoice_sideDataChooseSystem = await this._pHasChoiceInSideData_chooseSystem([selectedLoadeds[i]]);
			const isSubChoice_sideDataChooseFlags = await this._pHasChoiceInSideData_chooseFlags([selectedLoadeds[i]]);

			const isForceDisplay_entryDataSkillToolLanguageProficiencies = await this._pIsForceDisplay_skillToolLanguageProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataSkillProficiencies = await this._pIsForceDisplay_skillProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataLanguageProficiencies = await this._pIsForceDisplay_languageProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataToolProficiencies = await this._pIsForceDisplay_toolProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataWeaponProficiencies = await this._pIsForceDisplay_weaponProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataArmorProficiencies = await this._pIsForceDisplay_armorProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataSavingThrowProficiencies = await this._pIsForceDisplay_savingThrowProficiencies([selectedLoadeds[i]]);
			const isForceDisplay_entryDataDamageImmunities = await this._pIsForceDisplay_damageImmunities([selectedLoadeds[i]]);
			const isForceDisplay_entryDataDamageResistances = await this._pIsForceDisplay_damageResistances([selectedLoadeds[i]]);
			const isForceDisplay_entryDataDamageVulnerabilities = await this._pIsForceDisplay_damageVulnerabilities([selectedLoadeds[i]]);
			const isForceDisplay_entryDataConditionImmunities = await this._pIsForceDisplay_conditionImmunities([selectedLoadeds[i]]);
			const isForceDisplay_entryDataExpertise = await this._pIsForceDisplay_expertise([selectedLoadeds[i]]);
			const isForceDisplay_entryDataResources = await this._pIsForceDisplay_resources([selectedLoadeds[i]]);
			const isForceDisplay_entryDataSenses = await this._pIsForceDisplay_senses([selectedLoadeds[i]]);
			const isForceDisplay_entryDataAdditionalSpells = await this._pIsForceDisplay_additionalSpells([selectedLoadeds[i]]);

			const isAvailable_entryDataSkillToolLanguageProficiencies = await this._pIsAvailable_skillToolLanguageProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataSkillProficiencies = await this._pIsAvailable_skillProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataLanguageProficiencies = await this._pIsAvailable_languageProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataToolProficiencies = await this._pIsAvailable_toolProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataWeaponProficiencies = await this._pIsAvailable_weaponProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataArmorProficiencies = await this._pIsAvailable_armorProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataSavingThrowProficiencies = await this._pIsAvailable_savingThrowProficiencies([selectedLoadeds[i]]);
			const isAvailable_entryDataDamageImmunities = await this._pIsAvailable_damageImmunities([selectedLoadeds[i]]);
			const isAvailable_entryDataDamageResistances = await this._pIsAvailable_damageResistances([selectedLoadeds[i]]);
			const isAvailable_entryDataDamageVulnerabilities = await this._pIsAvailable_damageVulnerabilities([selectedLoadeds[i]]);
			const isAvailable_entryDataConditionImmunities = await this._pIsAvailable_conditionImmunities([selectedLoadeds[i]]);
			const isAvailable_entryDataExpertise = await this._pIsAvailable_expertise([selectedLoadeds[i]]);
			const isAvailable_entryDataResources = await this._pIsAvailable_resources([selectedLoadeds[i]]);
			const isAvailable_entryDataSenses = await this._pIsAvailable_senses([selectedLoadeds[i]]);
			const isAvailable_entryDataAdditionalSpells = await this._pIsAvailable_additionalSpells([selectedLoadeds[i]]);

			const {entity, type} = loaded;

			if (i !== 0 || !this._isSkipRenderingFirstFeatureTitle) $stgSubChoiceData.append(this._render_getSubCompTitle(entity));

			if (isSubChoice_sideDataChooseSystem) {
				const sideDataRaw = sideDataRaws[i];
				if (sideDataRaw?.chooseSystem) {
					ptrIsFirstSection._ = false;
					this._render_renderSubComp_chooseSystem(i, $stgSubChoiceData, entity, type, sideDataRaw);
				}
			}

			if (isSubChoice_sideDataChooseFlags) {
				const sideDataRaw = sideDataRaws[i];
				if (sideDataRaw?.chooseFlags) {
					ptrIsFirstSection._ = false;
					this._render_renderSubComp_chooseFlags(i, $stgSubChoiceData, entity, type, sideDataRaw);
				}
			}

						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsSkillToolLanguageProficiencies",
				propPrevSubComps: "_prevSubCompsSkillToolLanguageProficiencies",
				isAvailable: isAvailable_entryDataSkillToolLanguageProficiencies,
				isForceDisplay: isForceDisplay_entryDataSkillToolLanguageProficiencies,
				prop: "skillToolLanguageProficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				fnGetExistingFvtt: Charactermancer_OtherProficiencySelect.getExistingFvttFromActor.bind(Charactermancer_OtherProficiencySelect),
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsSkillProficiencies",
				propPrevSubComps: "_prevSubCompsSkillProficiencies",
				isAvailable: isAvailable_entryDataSkillProficiencies,
				isForceDisplay: isForceDisplay_entryDataSkillProficiencies,
				prop: "skillProficiencies",
				title: "Skill Proficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				propPathActorExistingProficiencies: ["system", "skills"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
				fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedSkillProficiencies.bind(Charactermancer_OtherProficiencySelect),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsLanguageProficiencies",
				propPrevSubComps: "_prevSubCompsLanguageProficiencies",
				isAvailable: isAvailable_entryDataLanguageProficiencies,
				isForceDisplay: isForceDisplay_entryDataLanguageProficiencies,
				prop: "languageProficiencies",
				title: "Language Proficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				propPathActorExistingProficiencies: ["system", "traits", "languages"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
				fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedLanguageProficiencies.bind(Charactermancer_OtherProficiencySelect),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsToolProficiencies",
				propPrevSubComps: "_prevSubCompsToolProficiencies",
				isAvailable: isAvailable_entryDataToolProficiencies,
				isForceDisplay: isForceDisplay_entryDataToolProficiencies,
				prop: "toolProficiencies",
				title: "Tool Proficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				propPathActorExistingProficiencies: ["system", "tools"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
				fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedToolProficiencies.bind(Charactermancer_OtherProficiencySelect),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsWeaponProficiencies",
				propPrevSubComps: "_prevSubCompsWeaponProficiencies",
				isAvailable: isAvailable_entryDataWeaponProficiencies,
				isForceDisplay: isForceDisplay_entryDataWeaponProficiencies,
				prop: "weaponProficiencies",
				title: "Weapon Proficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				propPathActorExistingProficiencies: ["system", "traits", "weaponProf"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
				fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedWeaponProficiencies.bind(Charactermancer_OtherProficiencySelect),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsArmorProficiencies",
				propPrevSubComps: "_prevSubCompsArmorProficiencies",
				isAvailable: isAvailable_entryDataArmorProficiencies,
				isForceDisplay: isForceDisplay_entryDataArmorProficiencies,
				prop: "armorProficiencies",
				title: "Armor Proficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				propPathActorExistingProficiencies: ["system", "traits", "armorProf"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
				fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedArmorProficiencies.bind(Charactermancer_OtherProficiencySelect),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsSavingThrowProficiencies",
				propPrevSubComps: "_prevSubCompsSavingThrowProficiencies",
				isAvailable: isAvailable_entryDataSavingThrowProficiencies,
				isForceDisplay: isForceDisplay_entryDataSavingThrowProficiencies,
				prop: "savingThrowProficiencies",
				title: "Saving Throw Proficiencies",
				ptrIsFirstSection,
				CompClass: Charactermancer_OtherProficiencySelect,
				propPathActorExistingProficiencies: ["system", "abilities"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
				fnGetMappedProficiencies: Charactermancer_OtherProficiencySelect.getMappedSavingThrowProficiencies.bind(Charactermancer_OtherProficiencySelect),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsDamageImmunities",
				propPrevSubComps: "_prevSubCompsDamageImmunities",
				isAvailable: isAvailable_entryDataDamageImmunities,
				isForceDisplay: isForceDisplay_entryDataDamageImmunities,
				prop: "immune",
				title: "Damage Immunities",
				ptrIsFirstSection,
				CompClass: Charactermancer_DamageImmunitySelect,
				propPathActorExistingProficiencies: ["system", "traits", "di"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsDamageResistances",
				propPrevSubComps: "_prevSubCompsDamageResistances",
				isAvailable: isAvailable_entryDataDamageResistances,
				isForceDisplay: isForceDisplay_entryDataDamageResistances,
				prop: "resist",
				title: "Damage Resistances",
				ptrIsFirstSection,
				CompClass: Charactermancer_DamageResistanceSelect,
				propPathActorExistingProficiencies: ["system", "traits", "dr"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsDamageVulnerabilities",
				propPrevSubComps: "_prevSubCompsDamageVulnerabilities",
				isAvailable: isAvailable_entryDataDamageVulnerabilities,
				isForceDisplay: isForceDisplay_entryDataDamageVulnerabilities,
				prop: "vulnerable",
				title: "Damage Vulnerabilities",
				ptrIsFirstSection,
				CompClass: Charactermancer_DamageVulnerabilitySelect,
				propPathActorExistingProficiencies: ["system", "traits", "dv"],
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsConditionImmunities",
				propPrevSubComps: "_prevSubCompsConditionImmunities",
				isAvailable: isAvailable_entryDataConditionImmunities,
				isForceDisplay: isForceDisplay_entryDataConditionImmunities,
				prop: "conditionImmune",
				title: "Condition Immunities",
				CompClass: Charactermancer_ConditionImmunitySelect,
				propPathActorExistingProficiencies: ["system", "traits", "ci"],
				ptrIsFirstSection,
				fnSetComp: this._render_pHkIxsChosen_setCompOtherProficiencies.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsExpertise",
				propPrevSubComps: "_prevSubCompsExpertise",
				isAvailable: isAvailable_entryDataExpertise,
				isForceDisplay: isForceDisplay_entryDataExpertise,
				prop: "expertise",
				title: "Expertise",
				ptrIsFirstSection,
				fnSetComp: this._render_pHkIxsChosen_setCompExpertise.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsResources",
				propPrevSubComps: "_prevSubCompsResources",
				isAvailable: isAvailable_entryDataResources,
				isForceDisplay: isForceDisplay_entryDataResources,
				prop: "resources",
				ptrIsFirstSection,
				fnSetComp: this._render_pHkIxsChosen_setCompResources.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsSenses",
				propPrevSubComps: "_prevSubCompsSenses",
				isAvailable: isAvailable_entryDataSenses,
				isForceDisplay: isForceDisplay_entryDataSenses,
				prop: "senses",
				ptrIsFirstSection,
				fnSetComp: this._render_pHkIxsChosen_setCompSenses.bind(this),
			});
			
						this._render_pHkIxsChosen_comp({
				ix: i,
				$stgSubChoiceData,
				selectedLoadeds,
				propSubComps: "_subCompsAdditionalSpells",
				propPrevSubComps: "_prevSubCompsAdditionalSpells",
				isAvailable: isAvailable_entryDataAdditionalSpells,
				isForceDisplay: isForceDisplay_entryDataAdditionalSpells,
				prop: "additionalSpells",
				ptrIsFirstSection,
				fnSetComp: this._render_pHkIxsChosen_setCompAdditionalSpells.bind(this),
			});
					}

		this._prevSubCompsSkillToolLanguageProficiencies = null;
		this._prevSubCompsSkillProficiencies = null;
		this._prevSubCompsLanguageProficiencies = null;
		this._prevSubCompsToolProficiencies = null;
		this._prevSubCompsWeaponProficiencies = null;
		this._prevSubCompsArmorProficiencies = null;
		this._prevSubCompsSavingThrowProficiencies = null;
		this._prevSubCompsDamageImmunities = null;
		this._prevSubCompsDamageResistances = null;
		this._prevSubCompsDamageVulnerabilities = null;
		this._prevSubCompsConditionImmunities = null;
		this._prevSubCompsExpertise = null;
		this._prevSubCompsResources = null;
		this._prevSubCompsSenses = null;
		this._prevSubCompsAdditionalSpells = null;

		$stgSubChoiceData.toggleVe(isSubChoiceForceDisplay);
	}

	_render_pHkIxsChosen_comp (
		{
			ix,
			$stgSubChoiceData,
			propSubComps,
			propPrevSubComps,
			isAvailable,
			isForceDisplay,
			selectedLoadeds,
			prop,
			title,
			CompClass,
			propPathActorExistingProficiencies,
			ptrIsFirstSection,
			fnSetComp,
			fnGetMappedProficiencies,
			fnGetExistingFvtt,
		},
	) {
		this[propSubComps][ix] = null;
		if (!isAvailable) return;

		const {entity} = selectedLoadeds[ix];

		if (!entity?.[prop] && !entity?.entryData?.[prop]) return;

		fnSetComp({
			ix,
			propSubComps,
			prop,
			CompClass,
			propPathActorExistingProficiencies,
			entity,
			fnGetMappedProficiencies,
			fnGetExistingFvtt,
		});

				if (this[propPrevSubComps] && this[propPrevSubComps][ix]) {
			this[propSubComps][ix]._proxyAssignSimple("state", MiscUtil.copy(this[propPrevSubComps][ix].__state));
		}

		if (!isForceDisplay) return;

		if (!title) title = this[propSubComps][ix]?.modalTitle;

		if (title) $stgSubChoiceData.append(`${ptrIsFirstSection._ ? "" : `<div class="w-100 mt-1 mb-2"></div>`}<div class="bold mb-2">${title}</div>`);
		this[propSubComps][ix].render($stgSubChoiceData);
		ptrIsFirstSection._ = false;
	}

	_render_pHkIxsChosen_setCompOtherProficiencies (
		{
			ix,
			propSubComps,
			prop,
			CompClass,
			propPathActorExistingProficiencies,
			entity,
			fnGetMappedProficiencies,
			fnGetExistingFvtt,
		},
	) {
		const availableRaw = entity[prop] || entity.entryData[prop];
		const existingFvtt = fnGetExistingFvtt
			? fnGetExistingFvtt()
			: {[prop]: MiscUtil.get(this._actor, ...propPathActorExistingProficiencies)};
		this[propSubComps][ix] = new CompClass({
			featureSourceTracker: this._featureSourceTracker,
			existing: CompClass.getExisting(existingFvtt),
			existingFvtt,
			available: fnGetMappedProficiencies ? fnGetMappedProficiencies(availableRaw) : availableRaw,
		});
	}

	_render_pHkIxsChosen_setCompExpertise (
		{
			ix,
			propSubComps,
			prop,
			entity,
		},
	) {
		const existingFvtt = Charactermancer_ExpertiseSelect.getExistingFvttFromActor(this._actor);
		this[propSubComps][ix] = new Charactermancer_ExpertiseSelect({
			featureSourceTracker: this._featureSourceTracker,
			existing: Charactermancer_ExpertiseSelect.getExisting(existingFvtt),
			existingFvtt,
			available: entity[prop] || entity.entryData[prop],
		});
	}

	_render_pHkIxsChosen_setCompResources (
		{
			ix,
			propSubComps,
			prop,
			entity,
		},
	) {
		this[propSubComps][ix] = new Charactermancer_ResourceSelect({
			resources: entity[prop] || entity.entryData[prop],
			className: entity.className,
			classSource: entity.classSource,
			subclassShortName: entity.subclassShortName,
			subclassSource: entity.subclassSource,
		});
	}

	_render_pHkIxsChosen_setCompSenses (
		{
			ix,
			propSubComps,
			prop,
			entity,
		},
	) {
		const existingFvtt = Charactermancer_SenseSelect.getExistingFvttFromActor(this._actor);
		this[propSubComps][ix] = new Charactermancer_SenseSelect({
			existing: Charactermancer_SenseSelect.getExisting(existingFvtt),
			existingFvtt,
			senses: entity[prop] || entity.entryData[prop],
		});
	}

	_render_pHkIxsChosen_setCompAdditionalSpells (
		{
			ix,
			propSubComps,
			prop,
			entity,
		},
	) {
		this[propSubComps][ix] = Charactermancer_AdditionalSpellsSelect.getComp({
			additionalSpells: entity[prop] || entity.entryData[prop],
			modalFilterSpells: this._modalFilterSpells,

						curLevel: 0,
			targetLevel: Consts.CHAR_MAX_LEVEL,
			spellLevelLow: 0,
			spellLevelHigh: 9,
		});
	}

	_getProps (ix) {
		return {
			prefixSubComps: "subComp_",
			propChooseSystem: `subComp_${ix}_chooseSystem`,
			propChooseFlags: `subComp_${ix}_chooseFlags`,
		};
	}

	_unregisterSubComps () {
		if (!this._featureSourceTracker) return;

		this._subCompsSkillToolLanguageProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsSkillProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsLanguageProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsToolProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsWeaponProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsArmorProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsSavingThrowProficiencies.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsDamageImmunities.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsDamageResistances.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsDamageVulnerabilities.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsConditionImmunities.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsExpertise.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsResources.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsSenses.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
		this._subCompsAdditionalSpells.filter(Boolean).forEach(comp => this._featureSourceTracker.unregister(comp));
	}

	_render_noSubChoices ({$stgSubChoiceData}) {
		this._lastSubMetas.forEach(it => it.unhook());
		this._lastSubMetas = [];

		this._unregisterSubComps();

		this._subCompsSkillToolLanguageProficiencies = [];
		this._subCompsSkillProficiencies = [];
		this._subCompsLanguageProficiencies = [];
		this._subCompsToolProficiencies = [];
		this._subCompsWeaponProficiencies = [];
		this._subCompsArmorProficiencies = [];
		this._subCompsSavingThrowProficiencies = [];
		this._subCompsDamageImmunities = [];
		this._subCompsDamageResistances = [];
		this._subCompsDamageVulnerabilities = [];
		this._subCompsConditionImmunities = [];
		this._subCompsExpertise = [];
		this._subCompsResources = [];
		this._subCompsSenses = [];
		this._subCompsAdditionalSpells = [];

		$stgSubChoiceData.empty().hideVe();
	}

	_render_options () {
		if (!this._isOptions()) return;

		const {count, required} = this._getOptionsNameAndCount();

		const $ptsExisting = {};
		this._lastMeta = ComponentUiUtil.getMetaWrpMultipleChoice(
			this,
			"ixsChosen",
			{
				values: this._optionsSet,
				ixsRequired: required,
				count,
				fnDisplay: v => {
					const ptName = Renderer.get().render(v.entry);

					const $ptExisting = $(`<div class="ml-1 ve-small ve-muted"></div>`);
					$ptsExisting[this.constructor._getLoadedTmpUid(v)] = $ptExisting;

					return $$`<div class="w-100 split-v-center">
						<div class="mr-2 ve-flex-v-center">${ptName}${$ptExisting}</div>
						<div class="${Parser.sourceJsonToColor(v.entity.source)} pr-1" title="${Parser.sourceJsonToFull(v.entity.source)}">${Parser.sourceJsonToAbv(v.entity.source)}</div>
					</div>`;
				},
			},
		);

		const hkUpdatePtsExisting = () => {
			const otherStates = this._featureSourceTracker ? this._featureSourceTracker.getStatesForKey("features", {ignore: this}) : null;

			this._optionsSet
				.forEach(v => {
					const tmpUid = this.constructor._getLoadedTmpUid(v);

					if (!$ptsExisting[tmpUid]) return;

										let isExists = this._existingFeatureChecker && this._existingFeatureChecker.isExistingFeature(UtilEntityGeneric.getName(v.entity), v.page, v.source, v.hash);

										if (otherStates) isExists = isExists || otherStates.some(arr => arr.some(it => it.page === v.page && it.hash === v.hash));

					$ptsExisting[tmpUid]
						.title(isExists ? `Gained from Another Source` : "")
						.html(isExists ? `(<i class="fas fa-fw fa-check"></i>)` : "")
						.toggleClass("ml-1", isExists);
				});
		};
		if (this._featureSourceTracker) this._featureSourceTracker.addHook(this, "pulseFeatures", hkUpdatePtsExisting);
		hkUpdatePtsExisting();

				if (this._featureSourceTracker) {
			const hkSetTrackerState = () => this._featureSourceTracker.setState(this, {features: this._getTrackableFeatures()});
			this._addHookBase(this._lastMeta.propPulse, hkSetTrackerState);
			hkSetTrackerState(); 		}
			}

	_render_getSubCompTitle (entity) {
		const titleIntro = [
			entity.className,
			entity.subclassShortName ? `(${entity.subclassShortName})` : "",
			entity.level ? `Level ${entity.level}` : "",
		].filter(Boolean).join(" ");
		const title = `${titleIntro}${titleIntro ? ": " : ""}${entity.name}`;
		return `${this._isModal ? "" : `<hr class="hr-2">`}<div class="mb-2 bold w-100">${title}</div>`;
	}

		_render_renderSubComp_chooseSystem (ix, $stgSubChoice, entity, type, sideData) {
		return this._render_renderSubComp_chooseSystemChooseFlags({
			ix,
			$stgSubChoice,
			entity,
			type,
			sideData,
			propChoose: "chooseSystem",
			propCompProp: "propChooseSystem",
			propIsRenderEntries: "isChooseSystemRenderEntries",
		});
	}

	_render_renderSubComp_chooseFlags (ix, $stgSubChoice, entity, type, sideData) {
		return this._render_renderSubComp_chooseSystemChooseFlags({
			ix,
			$stgSubChoice,
			entity,
			type,
			sideData,
			propChoose: "chooseFlags",
			propCompProp: "propChooseFlags",
			propIsRenderEntries: "isChooseFlagsRenderEntries",
		});
	}

	_render_renderSubComp_chooseSystemChooseFlags ({ix, $stgSubChoice, entity, type, sideData, propChoose, propCompProp, propIsRenderEntries}) {
		const compProps = this._getProps(ix);

		const htmlDescription = sideData[propIsRenderEntries]
			? Vetools.withUnpatchedDiceRendering(() => `${(entity.entries || []).map(ent => `<div>${Renderer.get().render(ent)}</div>`).join("")}`)
			: null;

		const choiceMeta = ComponentUiUtil.getMetaWrpMultipleChoice(
			this,
			compProps[propCompProp],
			{
				count: 1,
				fnDisplay: val => val.name,
				values: sideData[propChoose],
			},
		);

		this._lastSubMetas.push(choiceMeta);

		$$`<div class="ve-flex-col w-100">
			${htmlDescription}
			${choiceMeta.$ele}
		</div>`.appendTo($stgSubChoice);
	}

	_getDefaultState () {
		return {
			ixsChosen: [],
		};
	}
}

export default Charactermancer_Util;