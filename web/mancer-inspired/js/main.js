document.addEventListener('DOMContentLoaded', function () {
    JqueryUtil.initEnhancements();
});
window.addEventListener('load', function () {
   
    handleInit().then(() => handleReady().then(() => SourceSelectorTest._pOpen({actor:null})));
});
async function handleInit(){
  //UtilGameSettings.prePreInit();
  //Vetools.doMonkeyPatchPreConfig();
  Config.prePreInit(); //Important
  Vetools.doMonkeyPatchPostConfig(); //Makes roll buttons work

  //We need this to be true, since BrewUtil freaks out otherwise and tries to grab json from a url that is 404
  Object.defineProperty(globalThis, "IS_DEPLOYED", {
    get() { return true; },
    set(val) {},
  });
}
async function handleReady(){
  await Config.pInit(); //Important
  await Vetools.pDoPreload(); //Important
  SideDataInterfaces.init(); //Important
}

class SourceSelectorTest {

  static _BREW_DIRS = ["class", 'subclass', "race", "subrace", "background",
    "item", 'baseitem', "magicvariant", "spell", "feat", "optionalfeature"];


  /**
   * Starting function for the source selector. Opens up a UI that lets us choose sources before character creation begins.
   * Currently the UI is deactivated and sources are auto-chosen before the character builder UI is initialized
   * @param {any} actor Can just be left as null, not used at the moment
   */
  static async _pOpen({ actor: actor }) {

    //Auto-choose sources for now
    const sources = await this._pGetSources({'actor': actor});

    //Cache which sources we chose
    CharacterBuilder._testLoadedSources = sources;
    const content = await SourceSelectorTest.getOutputEntities(sources, true);
    
    const postProcessedData = SourceSelectorTest._postProcessAllSelectedData(content);
    const mergedData = postProcessedData;
    CharacterBuilder._DATA_PROPS_EXPECTED.forEach(propExpected => mergedData[propExpected] = mergedData[propExpected] || []);

    //Create the character builder UI
    const window = new CharacterBuilder(mergedData);
  }
  static _postProcessAllSelectedData(data) {

    data = ImportListClass.Utils.getDedupedData({allContentMerged: data});

    data = ImportListClass.Utils.getBlocklistFilteredData({dedupedAllContentMerged: data});

    delete data.subclass;
    Charactermancer_Feature_Util.addFauxOptionalFeatureEntries(data, data.optionalfeature);

    Charactermancer_Class_Util.addFauxOptionalFeatureFeatures(data.class, data.optionalfeature);
    return data;
  }

  /**
   * Get objects containing information about sources, such as urls, abbreviations and names. Doesn't include any game content itself
   * @param {any} actor
   * @returns {{name:string, isDefault:boolean, cacheKey:string}[]}
   */
  static async _pGetSources({ actor: actor }) {

    const isStreamerMode = true;//Config.get('ui', 'isStreamerMode');
    const officialSources = new UtilDataSource.DataSourceSpecial(
      isStreamerMode? "SRD" : "5etools", this._pLoadVetoolsSource.bind(this),
      {
        cacheKey: '5etools-charactermancer',
        filterTypes: [UtilDataSource.SOURCE_TYP_OFFICIAL_ALL],
        isDefault: true,
        pPostLoad: this._pPostLoad.bind(this, { actor: actor })
    });

    const allBrews = await Vetools.pGetBrewSources(...SourceSelectorTest._BREW_DIRS);
    console.log("Allbrews", allBrews);
    const chosenBrew = allBrews[202];
    console.log("Adding brew ", chosenBrew);

    const chosenBrewSourceUrl = new UtilDataSource.DataSourceUrl(chosenBrew.name, chosenBrew.url,{
      pPostLoad: this._pPostLoad.bind(this, { isBrew: true, actor: actor }),
      filterTypes: [UtilDataSource.SOURCE_TYP_BREW],
      abbreviations: chosenBrew.abbreviations,
      brewUtil: BrewUtil2,
    });

    return [officialSources, chosenBrewSourceUrl];

    /* const isStreamerMode = true;//Config.get('ui', 'isStreamerMode');
    return [new UtilDataSource.DataSourceSpecial( isStreamerMode?
      "SRD" : "5etools", this._pLoadVetoolsSource.bind(this),
      {
        cacheKey: '5etools-charactermancer',
        filterTypes: [UtilDataSource.SOURCE_TYP_OFFICIAL_ALL],
        isDefault: true,
        pPostLoad: this._pPostLoad.bind(this, { actor: actor })
      }) *//* , ...UtilDataSource.getSourcesCustomUrl({
      'pPostLoad': this._pPostLoad.bind(this, {
        'isBrewOrPrerelease': true,
        'actor': actor
      })
    }), ...UtilDataSource.getSourcesUploadFile({
      'pPostLoad': this._pPostLoad.bind(this, {
        'isBrewOrPrerelease': true,
        'actor': actor
      })
    }), ...(await UtilDataSource.pGetSourcesPrerelease(ActorCharactermancerSourceSelector._BREW_DIRS, {
      'pPostLoad': this._pPostLoad.bind(this, {
        'isPrerelease': true,
        'actor': actor
      })
    })), ...(await UtilDataSource.pGetSourcesBrew(ActorCharactermancerSourceSelector._BREW_DIRS, {
      'pPostLoad': this._pPostLoad.bind(this, {
        'isBrew': true,
        'actor': actor
      })
    })) */
  //];
  //TEMPFIX .filter(dataSource => !UtilWorldDataSourceSelector.isFiltered(dataSource));
  }

  /**
   * @param {{name:string, isDefault:boolean, cacheKey:string}[]} sources
   * @returns {any}
   */
  static async getOutputEntities(sources, getDeduped=false) {

    //Should contain all spells, classes, etc from every source we provide
    const allContentMeta = await UtilDataSource.pGetAllContent({
    sources,
    /* uploadedFileMetas: this.uploadedFileMetas,
    customUrls: this.getCustomUrls(),
    isBackground,

    page: this._page,

    isDedupable: this._isDedupable,
    fnGetDedupedData: this._fnGetDedupedData,

    fnGetBlocklistFilteredData: this._fnGetBlocklistFilteredData,

    isAutoSelectAll, */
    });

    const out = getDeduped? allContentMeta.dedupedAllContentMerged : allContentMeta;

    //TEMPFIX
    /*  Renderer.spell.populatePrereleaseLookup(await PrereleaseUtil.pGetBrewProcessed(), {isForce: true});
Renderer.spell.populateBrewLookup(await BrewUtil2.pGetBrewProcessed(), {isForce: true});

(out.spell || []).forEach(sp => { Renderer.spell.uninitBrewSources(sp); Renderer.spell.initBrewSources(sp); }); */

    return out;
  }
  static async _pLoadVetoolsSource() {
      const combinedSource = {};
      const [classResult, raceResult, backgroundResult, itemResults, spellResults, featResults, optionalFeatureResults]
      = await Promise.all([Vetools.pGetClasses(), Vetools.pGetRaces(), DataUtil.loadJSON(Vetools.DATA_URL_BACKGROUNDS),
          Vetools.pGetItems(), Vetools.pGetAllSpells(), DataUtil.loadJSON(Vetools.DATA_URL_FEATS), DataUtil.loadJSON(Vetools.DATA_URL_OPTIONALFEATURES)]);
      Object.assign(combinedSource, classResult);
      combinedSource.race = raceResult.race;
      combinedSource.background = backgroundResult.background;
      combinedSource.item = itemResults.item;
      combinedSource.spell = spellResults.spell;
      combinedSource.feat = featResults.feat;
      combinedSource.optionalfeature = optionalFeatureResults.optionalfeature;
      return combinedSource;
  }
  /**
   * Called when a source has been loaded
   * @param {any} data
   * @param {{actor:any, isBrewOrPrerelease:boolean}} opts
   * @returns {any} data
   */
  static async _pPostLoad(opts, data) {
    let isBrew = false; let isPrerelease = false;
    const isBrewOrPrerelease = opts.isBrewOrPrerelease || false;
    if (isBrewOrPrerelease) {
      const { isPrerelease: _isPre, isBrew: _isBrew } =
      UtilDataSource.getSourceType(data, { isErrorOnMultiple: true });
      isPrerelease = _isPre;
      isBrew = _isBrew;
    }

    //Load the actual content
    data = await UtilDataSource.pPostLoadGeneric({ isBrew: isBrew, isPrerelease: isPrerelease }, data);


    if (data.class || data.subclass) {
      //TEMPFIX
      /* const { DataConverterClassSubclassFeature: convSubclFeature  } = await Promise.resolve().then(function () {
        return DataConverterClassSubclassFeature;
      }); */

      const isIgnoredLookup = await DataConverterClassSubclassFeature/*convSubclFeature*/.pGetClassSubclassFeatureIgnoredLookup({ data: data });
      const postLoadedData = await PageFilterClassesFoundry.pPostLoad({
        'class': data.class,
        'subclass': data.subclass,
        'classFeature': data.classFeature,
        'subclassFeature': data.subclassFeature
      }, {
        //'actor': _0x5d48db,
        'isIgnoredLookup': isIgnoredLookup
      });
      Object.assign(data, postLoadedData);
      if (data.class) {
        data.class.forEach(cls => PageFilterClasses.mutateForFilters(cls));
      }
    }
    if (data.feat) { data.feat = MiscUtil.copy(data.feat); }
    if (data.optionalfeature) {
      data.optionalfeature = MiscUtil.copy(data.optionalfeature);
    }
    return data;
  }
}
class SETTINGS{
    static FILTERS = true;
    static PARENTLESS_MODE = true;
    static DO_RENDER_DICE = false;
    static USE_EXISTING = false;
    static LOCK_EXISTING_CHOICES = false;
    /**This boolean toggles loading from a cookie save file */
    static USE_EXISTING_WEB = true;
    static LOCALPATH_REDIRECT = true;
    static USE_FVTT = false;
    /**Should changing class/race that transfer the already set choices (for like proficiencies?), so if both the new and the old race could pick Perception as a proficiency, and the old one did, make sure the new one also has that choice set */
    static TRANSFER_CHOICES = false;
    static DICE_TOMESSAGE = false;
    //By default, this is off. This means that loading in a high level character, they dont get to pick any spells that they would have gained at earlier levels
    //Turning this to true fixes that, and lets us pick spells from lower levels
    static GET_CASTERPROG_UP_TO_CURLEVEL = true;
    static SPECIFIED_ABILITY_SAVE = false;
}
class CharacterBuilder {
  static _DATA_PROPS_EXPECTED = ['class', "subclass", 'classFeature', "subclassFeature",
  "race", "background", "item", "spell", "feat", 'optionalfeature'];
    tabButtonParent;
    tabClass;
    tabRace;
    tabAbilities;
    tabBackground;
    tabSpells;
    tabEquipment;
    tabShop;
    tabFeats;
    tabSheet;
    compClass;
    compRace;
    compAbility;
    compBackground;
    compEquipment;
    compSpell;
    compFeat;
    compSheet;
    tabs;
    _featureSourceTracker;
    
    constructor(data){

      this.parent = this;
      this.createTabs(); //Create the small tab buttons
      this.createPanels(); //Create the panels that hold components

      this.data = data;

      let cachedStr = localStorage.getItem("lastCharacter");
      if(!!cachedStr){
        console.log("cachedData", cachedStr);
        let json = JSON.parse(cachedStr);
        if(!!json){
          this.actor = json.character;
        }
      }

      //Create a feature source tracker (this one gets used alot by the components)
      this._featureSourceTracker = new Charactermancer_FeatureSourceTracker();

      //Create components
      this.compClass = new ActorCharactermancerClass(this);
      this.compRace = new ActorCharactermancerRace(this);
      this.compAbility = new ActorCharactermancerAbility(this);
      this.compBackground = new ActorCharactermancerBackground(this);
      this.compEquipment = new ActorCharactermancerEquipment(this);
      this.compSpell = new ActorCharactermancerSpell(this);
      this.compFeat = new ActorCharactermancerFeat(this);
      this.compSheet = new ActorCharactermancerSheet(this);

      //Configure the export button
      const exportBtn = $("#btn_export");
      exportBtn.click(() => {
          //this.compSheet.test_gatherExportInfo();
          CharacterExportFvtt.exportCharacter(this);
      });
      
      //This is a test to only have certain sources selected as active in the filter
      //Note that this does not delete the sources, and they can still be toggled on again via the filter
      const DEFAULT_SOURCES = [Parser.SRC_PHB, Parser.SRC_DMG, Parser.SRC_XGE, Parser.SRC_VGM, Parser.SRC_MPMM];
      const testApplyDefaultSources = () => {
          HelperFunctions.setModalFilterSourcesStrings(this.compBackground.modalFilterBackgrounds, DEFAULT_SOURCES);
          HelperFunctions.setModalFilterSourcesStrings(this.compRace.modalFilterRaces, DEFAULT_SOURCES);
      }
      
      //Call this to let the components load some content before we start using them
      this.pLoad()
      .then(() => this.renderComponents()) //Then render the components
      .then(() => this.loadFromSave())
      .then(() => testApplyDefaultSources()) //Use our test function to set only certain sources as active in the filter
      .then(() => this.e_switchTab("class")); //Then switch to the tab we want to start off with
    }

    createTabs(){
        const tabHolder = $(`.tab_button_holder`);
        const createTabBtn = (label) => {
            return $$`<button class="btn btn-default ui-tab__btn-tab-head btn-sm">${label}</button>`.appendTo(tabHolder);
        }

        //Create the tabs
        createTabBtn("Class").click(()=>{ this.e_switchTab("class"); }).addClass("active"); //Set class button as active
        createTabBtn("Race").click(()=>{ this.e_switchTab("race"); });
        createTabBtn("Abilities").click(()=>{ this.e_switchTab("abilities"); });
        createTabBtn("Background").click(()=>{ this.e_switchTab("background"); });
        createTabBtn("Starting Equipment").click(()=>{ this.e_switchTab("startingEquipment"); });
        createTabBtn("Equipment Shop").click(()=>{ this.e_switchTab("shop"); });
        createTabBtn("Spells").click(()=>{ this.e_switchTab("spells"); });
        createTabBtn("Feats").click(()=>{ this.e_switchTab("feats"); });
        createTabBtn("Sheet").click(()=>{ this.e_switchTab("sheet"); });
        
        this.tabButtonParent = tabHolder;
    }
    createPanels(){

        const _root = $("#window-root");
        const newPanel = () => {return new CharacterBuilderPanel($(`<div class="ui-tab__wrp-tab-body ve-flex-col ui-tab__wrp-tab-body--border"></div>`).appendTo(_root)); }

        this.tabClass = newPanel();
        this.tabRace = newPanel();
        this.tabAbilities = newPanel();
        this.tabBackground = newPanel();
        this.tabEquipment = newPanel();
        this.tabShop = newPanel();
        this.tabSpells = newPanel();
        this.tabFeats = newPanel();
        this.tabSheet = newPanel();

        /* const modal = TestModal2.createNew();
        console.log(modal);
        modal.show(); */
    }
    async pLoad(){
        if(!SETTINGS.FILTERS){return;}
        await this.compRace.pLoad();
        await this.compBackground.pLoad();
        //This sets state based on what is in the savefile (if USE_EXISTING_WEB) is true
        //Only handles class, subclass, level and isPrimary
        await this.compClass.pLoad();
        await this.compSpell.pLoad();
        await this.compFeat.pLoad();
    }
    renderComponents(){
        //this.compClass.render(); //Goes on for quite long, and will trigger hooks for many ms after

        this.compClass.render().then(() => {

        this.compRace.render();
        this.compAbility.render();
        

        this.compBackground.render();
        

        this.compEquipment.pRenderStarting().then(() => this.compEquipment.pRenderShop())
          .then(() => {if(SETTINGS.USE_EXISTING_WEB){this.compEquipment.setStateFromSaveFile(this.actor)}});
        
        this.compSpell.pRender().then(() => this.compSpell.setStateFromSaveFile(this.actor));
        this.compFeat.render();
        

        if(SETTINGS.USE_EXISTING_WEB){this.compAbility.setStateFromSaveFile(this.actor);}
        if(SETTINGS.USE_EXISTING_WEB){this.compBackground.setStateFromSaveFile(this.actor);}
      }).then(()=> {this.compSheet.render();});
    }
    async loadFromSave(){
      const delay = (ms) => {return new Promise(resolve => setTimeout(resolve, ms));}
      //await delay(1000);
    }

    //#region Events
    e_switchTab(tabName){
        //TODO: improve this
        let newActivePanel = null;
        let tabIx = 0;
        this.tabButtonParent.children().each(function() {$(this).removeClass("active");});
        this.setActive(this.tabClass.$wrpTab, false);
        this.setActive(this.tabRace.$wrpTab, false);
        this.setActive(this.tabAbilities.$wrpTab, false);
        this.setActive(this.tabBackground.$wrpTab, false);
        this.setActive(this.tabEquipment.$wrpTab, false);
        this.setActive(this.tabShop.$wrpTab, false);
        this.setActive(this.tabSpells.$wrpTab, false);
        this.setActive(this.tabFeats.$wrpTab, false);
        this.setActive(this.tabSheet.$wrpTab, false);

        switch(tabName){
            case "class": newActivePanel = this.tabClass; tabIx = 0; break;
            case "race": newActivePanel = this.tabRace; tabIx = 1; break;
            case "abilities": newActivePanel = this.tabAbilities; tabIx = 2; break;
            case "background": newActivePanel = this.tabBackground; tabIx = 3; break;
            case "startingEquipment": newActivePanel = this.tabEquipment; tabIx = 4; break;
            case "shop": newActivePanel = this.tabShop; tabIx = 5; break;
            case "spells": newActivePanel = this.tabSpells; tabIx = 6; break;
            case "feats": newActivePanel = this.tabFeats; tabIx = 7; break;
            case "sheet": newActivePanel = this.tabSheet; tabIx = 8; break;
        }
        const pressedBtn = this.tabButtonParent.children().eq(tabIx);
        pressedBtn.addClass("active");
        this.setActive(newActivePanel.$wrpTab, true);
    }
    //#endregion
    //#region Getters
    get featureSourceTracker_() {
        return this._featureSourceTracker;
    }
    //#endregion
    
    setActive($tab, active){
        const hi = "ve-hidden";
        if(!$tab){return;}
        if(active && $tab.hasClass(hi)){$tab.removeClass(hi);}
        else if(!active && !$tab.hasClass(hi)){$tab.addClass(hi);}
   }

}
/**A wrapper for a div that contains components. Only used by CharacterBuilder */
class CharacterBuilderPanel {
    $wrpTab;
    constructor(parentDiv){
        this.$wrpTab = parentDiv;
    }
    
}