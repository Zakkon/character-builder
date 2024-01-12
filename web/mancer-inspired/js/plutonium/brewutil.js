class _BrewUtil2Base {
    _STORAGE_KEY_LEGACY;
    _STORAGE_KEY_LEGACY_META;

    _STORAGE_KEY;
    _STORAGE_KEY_META;

    _STORAGE_KEY_CUSTOM_URL;
    _STORAGE_KEY_MIGRATION_VERSION;

    _VERSION;

    _PATH_LOCAL_DIR;
    _PATH_LOCAL_INDEX;

    IS_EDITABLE;
    PAGE_MANAGE;
    URL_REPO_DEFAULT;
    DISPLAY_NAME;
    DISPLAY_NAME_PLURAL;
    DEFAULT_AUTHOR;
    STYLE_BTN;

    _LOCK = new VeLock({
        name: this.constructor.name
    });

    _cache_iteration = 0;
    _cache_brewsProc = null;
    _cache_metas = null;
    _cache_brews = null;
    _cache_brewsLocal = null;

    _isDirty = false;

    _brewsTemp = [];
    _addLazy_brewsTemp = [];

    _storage = StorageUtil;

    _pActiveInit = null;

    pInit() {
        this._pActiveInit ||= (async()=>{
            await this._pGetBrew_pGetLocalBrew();

            this._pInit_doBindDragDrop();
            this._pInit_pDoLoadFonts().then(null);
        }
        )();
        return this._pActiveInit;
    }

    _pInit_doBindDragDrop() {
        throw new Error("Unimplemented!");
    }

    async _pInit_pDoLoadFonts() {
        const fontFaces = Object.entries((this._getBrewMetas() || []).map(({_meta})=>_meta?.fonts || {}).mergeMap(it=>it), ).map(([family,fontUrl])=>new FontFace(family,`url("${fontUrl}")`));

        const results = await Promise.allSettled(fontFaces.map(async fontFace=>{
            await fontFace.load();
            return document.fonts.add(fontFace);
        }
        ), );

        const errors = results.filter(({status})=>status === "rejected").map(({reason},i)=>({
            message: `Font "${fontFaces[i].family}" failed to load!`,
            reason
        }));
        if (errors.length) {
            errors.forEach(({message})=>JqueryUtil.doToast({
                type: "danger",
                content: message
            }));
            setTimeout(()=>{
                throw new Error(errors.map(({message, reason})=>[message, reason].join("\n")).join("\n\n"));
            }
            );
        }

        return document.fonts.ready;
    }

    async pGetCustomUrl() {
        return this._storage.pGet(this._STORAGE_KEY_CUSTOM_URL);
    }

    async pSetCustomUrl(val) {
        return !val ? this._storage.pRemove(this._STORAGE_KEY_CUSTOM_URL) : this._storage.pSet(this._STORAGE_KEY_CUSTOM_URL, val);
    }

    isReloadRequired() {
        return this._isDirty;
    }

    _getBrewMetas() {
        return [...(this._storage.syncGet(this._STORAGE_KEY_META) || []), ...(this._cache_brewsLocal || []).map(brew=>this._getBrewDocReduced(brew)), ];
    }

    _setBrewMetas(val) {
        this._cache_metas = null;
        return this._storage.syncSet(this._STORAGE_KEY_META, val);
    }

    async pGetBrewProcessed() {
        if (this._cache_brewsProc)
            return this._cache_brewsProc;
        try {
            const lockToken = await this._LOCK.pLock();
            await this._pGetBrewProcessed_({
                lockToken
            });
        } catch (e) {
            setTimeout(()=>{
                throw e;
            }
            );
        } finally {
            this._LOCK.unlock();
        }
        return this._cache_brewsProc;
    }

    async _pGetBrewProcessed_({lockToken}) {
        const cpyBrews = MiscUtil.copyFast([...await this.pGetBrew({
            lockToken
        }), ...this._brewsTemp, ]);
        if (!cpyBrews.length)
            return this._cache_brewsProc = {};

        await this._pGetBrewProcessed_pDoBlocklistExtension({
            cpyBrews
        });

        const cpyBrewsLoaded = await cpyBrews.pSerialAwaitMap(async({head, body})=>{
            const cpyBrew = await DataUtil.pDoMetaMerge(head.url || head.docIdLocal, body, {
                isSkipMetaMergeCache: true
            });
            this._pGetBrewProcessed_mutDiagnostics({
                head,
                cpyBrew
            });
            return cpyBrew;
        }
        );

        this._cache_brewsProc = this._pGetBrewProcessed_getMergedOutput({
            cpyBrewsLoaded
        });
        return this._cache_brewsProc;
    }

    async _pGetBrewProcessed_pDoBlocklistExtension({cpyBrews}) {
        for (const {body} of cpyBrews) {
            if (!body?.blocklist?.length || !(body.blocklist instanceof Array))
                continue;
            await ExcludeUtil.pExtendList(body.blocklist);
        }
    }

    _pGetBrewProcessed_mutDiagnostics({head, cpyBrew}) {
        if (!head.filename)
            return;

        for (const arr of Object.values(cpyBrew)) {
            if (!(arr instanceof Array))
                continue;
            for (const ent of arr) {
                if (!("__prop"in ent))
                    break;
                ent.__diagnostic = {
                    filename: head.filename
                };
            }
        }
    }

    _pGetBrewProcessed_getMergedOutput({cpyBrewsLoaded}) {
        return BrewDoc.mergeObjects(undefined, ...cpyBrewsLoaded);
    }

    getBrewProcessedFromCache(prop) {
        return this._cache_brewsProc?.[prop] || [];
    }

    async pGetBrew({lockToken}={}) {
        if (this._cache_brews)
            return this._cache_brews;

        try {
            lockToken = await this._LOCK.pLock({
                token: lockToken
            });

            const out = [...(await this._pGetBrewRaw({
                lockToken
            })), ...(await this._pGetBrew_pGetLocalBrew({
                lockToken
            })), ];

            return this._cache_brews = out.filter(brew=>brew?.body?._meta?.sources?.length);
        } finally {
            this._LOCK.unlock();
        }
    }

    async pGetBrewBySource(source, {lockToken}={}) {
        const brews = await this.pGetBrew({
            lockToken
        });
        return brews.find(brew=>brew?.body?._meta?.sources?.some(src=>src?.json === source));
    }

    async _pGetBrew_pGetLocalBrew({lockToken}={}) {
        if (this._cache_brewsLocal)
            return this._cache_brewsLocal;
        if (IS_VTT || IS_DEPLOYED || typeof window === "undefined")
            return this._cache_brewsLocal = [];

        try {
            await this._LOCK.pLock({
                token: lockToken
            });
            return (await this._pGetBrew_pGetLocalBrew_());
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pGetBrew_pGetLocalBrew_() {
        const indexLocal = await DataUtil.loadJSON(`${Renderer.get().baseUrl}${this._PATH_LOCAL_INDEX}`);
        if (!indexLocal?.toImport?.length)
            return this._cache_brewsLocal = [];

        const brewDocs = (await indexLocal.toImport.pMap(async name=>{
            name = `${name}`.trim();
            const url = /^https?:\/\//.test(name) ? name : `${Renderer.get().baseUrl}${this._PATH_LOCAL_DIR}/${name}`;
            const filename = UrlUtil.getFilename(url);
            try {
                const json = await DataUtil.loadRawJSON(url);
                return this._getBrewDoc({
                    json,
                    url,
                    filename,
                    isLocal: true
                });
            } catch (e) {
                JqueryUtil.doToast({
                    type: "danger",
                    content: `Failed to load local homebrew from URL "${url}"! ${VeCt.STR_SEE_CONSOLE}`
                });
                setTimeout(()=>{
                    throw e;
                }
                );
                return null;
            }
        }
        )).filter(Boolean);

        return this._cache_brewsLocal = brewDocs;
    }

    async _pGetBrewRaw({lockToken}={}) {
        try {
            await this._LOCK.pLock({
                token: lockToken
            });
            return (await this._pGetBrewRaw_());
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pGetBrewRaw_() {
        const brewRaw = (await this._storage.pGet(this._STORAGE_KEY)) || [];

        if (brewRaw.length)
            return brewRaw;

        const {version, existingMeta, existingBrew} = await this._pGetMigrationInfo();

        if (version === this._VERSION)
            return brewRaw;

        if (!existingMeta || !existingBrew) {
            await this._storage.pSet(this._STORAGE_KEY_MIGRATION_VERSION, this._VERSION);
            return brewRaw;
        }

        const brewEditable = this._getNewEditableBrewDoc();

        const cpyBrewEditableDoc = BrewDoc.fromObject(brewEditable, {
            isCopy: true
        }).mutMerge({
            json: {
                _meta: existingMeta || {},
                ...existingBrew,
            },
        });

        await this._pSetBrew_({
            val: [cpyBrewEditableDoc],
            isInitialMigration: true
        });

        await this._storage.pSet(this._STORAGE_KEY_MIGRATION_VERSION, this._VERSION);

        JqueryUtil.doToast(`Migrated ${this.DISPLAY_NAME} from version ${version} to version ${this._VERSION}!`);

        return this._storage.pGet(this._STORAGE_KEY);
    }

    _getNewEditableBrewDoc() {
        const json = {
            _meta: {
                sources: []
            }
        };
        return this._getBrewDoc({
            json,
            isEditable: true
        });
    }

    async _pGetMigrationInfo() {
        if (!this._STORAGE_KEY_LEGACY && !this._STORAGE_KEY_LEGACY_META)
            return {
                version: this._VERSION,
                existingBrew: null,
                existingMeta: null
            };

        const version = await this._storage.pGet(this._STORAGE_KEY_MIGRATION_VERSION);

        if (version === this._VERSION)
            return {
                version
            };

        const existingBrew = await this._storage.pGet(this._STORAGE_KEY_LEGACY);
        const existingMeta = await this._storage.syncGet(this._STORAGE_KEY_LEGACY_META);

        return {
            version: version ?? 1,
            existingBrew,
            existingMeta,
        };
    }

    getCacheIteration() {
        return this._cache_iteration;
    }

    async pSetBrew(val, {lockToken}={}) {
        try {
            await this._LOCK.pLock({
                token: lockToken
            });
            await this._pSetBrew_({
                val
            });
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pSetBrew_({val, isInitialMigration}) {
        this._mutBrewsForSet(val);

        if (!isInitialMigration) {
            if (this._cache_brewsProc)
                this._cache_iteration++;
            this._cache_brews = null;
            this._cache_brewsProc = null;
        }
        await this._storage.pSet(this._STORAGE_KEY, val);

        if (!isInitialMigration)
            this._isDirty = true;
    }

    _mutBrewsForSet(val) {
        if (!(val instanceof Array))
            throw new Error(`${this.DISPLAY_NAME.uppercaseFirst()} array must be an array!`);

        this._setBrewMetas(val.map(brew=>this._getBrewDocReduced(brew)));
    }

    _getBrewId(brew) {
        if (brew.head.url)
            return brew.head.url;
        if (brew.body._meta?.sources?.length)
            return brew.body._meta.sources.map(src=>(src.json || "").toLowerCase()).sort(SortUtil.ascSortLower).join(" :: ");
        return null;
    }

    _getNextBrews(brews, brewsToAdd) {
        const idsToAdd = new Set(brewsToAdd.map(brews=>this._getBrewId(brews)).filter(Boolean));
        brews = brews.filter(brew=>{
            const id = this._getBrewId(brew);
            if (id == null)
                return true;
            return !idsToAdd.has(id);
        }
        );
        return [...brews, ...brewsToAdd];
    }

    async _pGetBrewDependencies({brewDocs, brewsRaw=null, brewsRawLocal=null, lockToken}) {
        try {
            lockToken = await this._LOCK.pLock({
                token: lockToken
            });
            return (await this._pGetBrewDependencies_({
                brewDocs,
                brewsRaw,
                brewsRawLocal,
                lockToken
            }));
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pGetBrewDependencies_({brewDocs, brewsRaw=null, brewsRawLocal=null, lockToken}) {
        const urlRoot = await this.pGetCustomUrl();
        const brewIndex = await this._pGetSourceIndex(urlRoot);

        const toLoadSources = [];
        const loadedSources = new Set();
        const out = [];

        brewsRaw = brewsRaw || await this._pGetBrewRaw({
            lockToken
        });
        brewsRawLocal = brewsRawLocal || await this._pGetBrew_pGetLocalBrew({
            lockToken
        });

        const trackLoaded = brew=>(brew.body._meta?.sources || []).filter(src=>src.json).forEach(src=>loadedSources.add(src.json));
        brewsRaw.forEach(brew=>trackLoaded(brew));
        brewsRawLocal.forEach(brew=>trackLoaded(brew));

        brewDocs.forEach(brewDoc=>toLoadSources.push(...this._getBrewDependencySources({
            brewDoc,
            brewIndex
        })));

        while (toLoadSources.length) {
            const src = toLoadSources.pop();
            if (loadedSources.has(src))
                continue;
            loadedSources.add(src);

            const url = this.getFileUrl(brewIndex[src], urlRoot);
            const brewDocDep = await this._pGetBrewDocFromUrl({
                url
            });
            out.push(brewDocDep);
            trackLoaded(brewDocDep);

            toLoadSources.push(...this._getBrewDependencySources({
                brewDoc: brewDocDep,
                brewIndex
            }));
        }

        return out;
    }

    async pGetSourceUrl(source) {
        const urlRoot = await this.pGetCustomUrl();
        const brewIndex = await this._pGetSourceIndex(urlRoot);

        if (brewIndex[source])
            return this.getFileUrl(brewIndex[source], urlRoot);

        const sourceLower = source.toLowerCase();
        if (brewIndex[sourceLower])
            return this.getFileUrl(brewIndex[sourceLower], urlRoot);

        const sourceOriginal = Object.keys(brewIndex).find(k=>k.toLowerCase() === sourceLower);
        if (!brewIndex[sourceOriginal])
            return null;
        return this.getFileUrl(brewIndex[sourceOriginal], urlRoot);
    }

    async _pGetSourceIndex(urlRoot) {
        throw new Error("Unimplemented!");
    }
    getFileUrl(path, urlRoot) {
        throw new Error("Unimplemented!");
    }
    pLoadTimestamps(urlRoot) {
        throw new Error("Unimplemented!");
    }
    pLoadPropIndex(urlRoot) {
        throw new Error("Unimplemented!");
    }
    pLoadMetaIndex(urlRoot) {
        throw new Error("Unimplemented!");
    }

    _PROPS_DEPS = ["dependencies", "includes"];
    _PROPS_DEPS_DEEP = ["otherSources"];

    _getBrewDependencySources({brewDoc, brewIndex}) {
        const out = new Set();

        this._PROPS_DEPS.forEach(prop=>{
            const obj = brewDoc.body._meta?.[prop];
            if (!obj || !Object.keys(obj).length)
                return;
            Object.values(obj).flat().filter(src=>brewIndex[src]).forEach(src=>out.add(src));
        }
        );

        this._PROPS_DEPS_DEEP.forEach(prop=>{
            const obj = brewDoc.body._meta?.[prop];
            if (!obj || !Object.keys(obj).length)
                return;
            return Object.values(obj).map(objSub=>Object.keys(objSub)).flat().filter(src=>brewIndex[src]).forEach(src=>out.add(src));
        }
        );

        return out;
    }

    async pAddBrewFromUrl(url, {lockToken, isLazy}={}) {
        try {
            return (await this._pAddBrewFromUrl({
                url,
                lockToken,
                isLazy
            }));
        } catch (e) {
            JqueryUtil.doToast({
                type: "danger",
                content: `Failed to load ${this.DISPLAY_NAME} from URL "${url}"! ${VeCt.STR_SEE_CONSOLE}`
            });
            setTimeout(()=>{
                throw e;
            }
            );
        }
        return [];
    }

    async _pGetBrewDocFromUrl({url}) {
        const json = await DataUtil.loadRawJSON(url);
        return this._getBrewDoc({
            json,
            url,
            filename: UrlUtil.getFilename(url)
        });
    }

    async _pAddBrewFromUrl({url, lockToken, isLazy}) {
        const brewDoc = await this._pGetBrewDocFromUrl({
            url
        });

        if (isLazy) {
            try {
                await this._LOCK.pLock({
                    token: lockToken
                });
                this._addLazy_brewsTemp.push(brewDoc);
            } finally {
                this._LOCK.unlock();
            }

            return [brewDoc];
        }

        const brewDocs = [brewDoc];
        try {
            lockToken = await this._LOCK.pLock({
                token: lockToken
            });
            const brews = MiscUtil.copyFast(await this._pGetBrewRaw({
                lockToken
            }));

            const brewDocsDependencies = await this._pGetBrewDependencies({
                brewDocs,
                brewsRaw: brews,
                lockToken
            });
            brewDocs.push(...brewDocsDependencies);

            const brewsNxt = this._getNextBrews(brews, brewDocs);
            await this.pSetBrew(brewsNxt, {
                lockToken
            });
        } finally {
            this._LOCK.unlock();
        }

        return brewDocs;
    }

    async pAddBrewsFromFiles(files) {
        try {
            const lockToken = await this._LOCK.pLock();
            return (await this._pAddBrewsFromFiles({
                files,
                lockToken
            }));
        } catch (e) {
            JqueryUtil.doToast({
                type: "danger",
                content: `Failed to load ${this.DISPLAY_NAME} from file(s)! ${VeCt.STR_SEE_CONSOLE}`
            });
            setTimeout(()=>{
                throw e;
            }
            );
        } finally {
            this._LOCK.unlock();
        }
        return [];
    }

    async _pAddBrewsFromFiles({files, lockToken}) {
        const brewDocs = files.map(file=>this._getBrewDoc({
            json: file.json,
            filename: file.name
        }));

        const brews = MiscUtil.copyFast(await this._pGetBrewRaw({
            lockToken
        }));

        const brewDocsDependencies = await this._pGetBrewDependencies({
            brewDocs,
            brewsRaw: brews,
            lockToken
        });
        brewDocs.push(...brewDocsDependencies);

        const brewsNxt = this._getNextBrews(brews, brewDocs);
        await this.pSetBrew(brewsNxt, {
            lockToken
        });

        return brewDocs;
    }

    async pAddBrewsLazyFinalize({lockToken}={}) {
        try {
            lockToken = await this._LOCK.pLock({
                token: lockToken
            });
            return (await this._pAddBrewsLazyFinalize_({
                lockToken
            }));
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pAddBrewsLazyFinalize_({lockToken}) {
        const brewsRaw = await this._pGetBrewRaw({
            lockToken
        });
        const brewDeps = await this._pGetBrewDependencies({
            brewDocs: this._addLazy_brewsTemp,
            brewsRaw,
            lockToken
        });
        const out = MiscUtil.copyFast(brewDeps);
        const brewsNxt = this._getNextBrews(MiscUtil.copyFast(brewsRaw), [...this._addLazy_brewsTemp, ...brewDeps]);
        await this.pSetBrew(brewsNxt, {
            lockToken
        });
        this._addLazy_brewsTemp = [];
        return out;
    }

    async pPullAllBrews({brews}={}) {
        try {
            const lockToken = await this._LOCK.pLock();
            return (await this._pPullAllBrews_({
                lockToken,
                brews
            }));
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pPullAllBrews_({lockToken, brews}) {
        let cntPulls = 0;

        brews = brews || MiscUtil.copyFast(await this._pGetBrewRaw({
            lockToken
        }));
        const brewsNxt = await brews.pMap(async brew=>{
            if (!this.isPullable(brew))
                return brew;

            const json = await DataUtil.loadRawJSON(brew.head.url, {
                isBustCache: true
            });

            const localLastModified = brew.body._meta?.dateLastModified ?? 0;
            const sourceLastModified = json._meta?.dateLastModified ?? 0;

            if (sourceLastModified <= localLastModified)
                return brew;

            cntPulls++;
            return BrewDoc.fromObject(brew).mutUpdate({
                json
            }).toObject();
        }
        );

        if (!cntPulls)
            return cntPulls;

        await this.pSetBrew(brewsNxt, {
            lockToken
        });
        return cntPulls;
    }

    isPullable(brew) {
        return !brew.head.isEditable && !!brew.head.url;
    }

    async pPullBrew(brew) {
        try {
            const lockToken = await this._LOCK.pLock();
            return (await this._pPullBrew_({
                brew,
                lockToken
            }));
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pPullBrew_({brew, lockToken}) {
        const brews = await this._pGetBrewRaw({
            lockToken
        });
        if (!brews?.length)
            return;

        let isPull = false;
        const brewsNxt = await brews.pMap(async it=>{
            if (it.head.docIdLocal !== brew.head.docIdLocal || !this.isPullable(it))
                return it;

            const json = await DataUtil.loadRawJSON(it.head.url, {
                isBustCache: true
            });

            const localLastModified = it.body._meta?.dateLastModified ?? 0;
            const sourceLastModified = json._meta?.dateLastModified ?? 0;

            if (sourceLastModified <= localLastModified)
                return it;

            isPull = true;
            return BrewDoc.fromObject(it).mutUpdate({
                json
            }).toObject();
        }
        );

        if (!isPull)
            return isPull;

        await this.pSetBrew(brewsNxt, {
            lockToken
        });
        return isPull;
    }

    async pAddBrewFromLoaderTag(ele) {
        const $ele = $(ele);
        if (!$ele.hasClass("rd__wrp-loadbrew--ready"))
            return;
        let jsonPath = ele.dataset.rdLoaderPath;
        const name = ele.dataset.rdLoaderName;
        const cached = $ele.html();
        const cachedTitle = $ele.title();
        $ele.title("");
        $ele.removeClass("rd__wrp-loadbrew--ready").html(`${name.qq()}<span class="glyphicon glyphicon-refresh rd__loadbrew-icon rd__loadbrew-icon--active"></span>`);

        jsonPath = jsonPath.unescapeQuotes();
        if (!UrlUtil.isFullUrl(jsonPath)) {
            const brewUrl = await this.pGetCustomUrl();
            jsonPath = this.getFileUrl(jsonPath, brewUrl);
        }

        await this.pAddBrewFromUrl(jsonPath);
        $ele.html(`${name.qq()}<span class="glyphicon glyphicon-saved rd__loadbrew-icon"></span>`);
        setTimeout(()=>$ele.html(cached).addClass("rd__wrp-loadbrew--ready").title(cachedTitle), 500);
    }

    _getBrewDoc({json, url=null, filename=null, isLocal=false, isEditable=false}) {
        return BrewDoc.fromValues({
            head: {
                json,
                url,
                filename,
                isLocal,
                isEditable,
            },
            body: json,
        }).toObject();
    }

    _getBrewDocReduced(brewDoc) {
        return {
            docIdLocal: brewDoc.head.docIdLocal,
            _meta: brewDoc.body._meta
        };
    }

    async pDeleteBrews(brews) {
        try {
            const lockToken = await this._LOCK.pLock();
            await this._pDeleteBrews_({
                brews,
                lockToken
            });
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pDeleteBrews_({brews, lockToken}) {
        const brewsStored = await this._pGetBrewRaw({
            lockToken
        });
        if (!brewsStored?.length)
            return;

        const idsToDelete = new Set(brews.map(brew=>brew.head.docIdLocal));

        const nxtBrews = brewsStored.filter(brew=>!idsToDelete.has(brew.head.docIdLocal));
        await this.pSetBrew(nxtBrews, {
            lockToken
        });
    }

    async pUpdateBrew(brew) {
        try {
            const lockToken = await this._LOCK.pLock();
            await this._pUpdateBrew_({
                brew,
                lockToken
            });
        } finally {
            this._LOCK.unlock();
        }
    }

    async _pUpdateBrew_({brew, lockToken}) {
        const brews = await this._pGetBrewRaw({
            lockToken
        });
        if (!brews?.length)
            return;

        const nxtBrews = brews.map(it=>it.head.docIdLocal !== brew.head.docIdLocal ? it : brew);
        await this.pSetBrew(nxtBrews, {
            lockToken
        });
    }

    pGetEditableBrewDoc(brew) {
        throw new Error("Unimplemented");
    }
    pGetOrCreateEditableBrewDoc() {
        throw new Error("Unimplemented");
    }
    pSetEditableBrewDoc() {
        throw new Error("Unimplemented");
    }
    pGetEditableBrewEntity(prop, uniqueId, {isDuplicate=false}={}) {
        throw new Error("Unimplemented");
    }
    pPersistEditableBrewEntity(prop, ent) {
        throw new Error("Unimplemented");
    }
    pRemoveEditableBrewEntity(prop, uniqueId) {
        throw new Error("Unimplemented");
    }
    pAddSource(sourceObj) {
        throw new Error("Unimplemented");
    }
    pEditSource(sourceObj) {
        throw new Error("Unimplemented");
    }
    pIsEditableSourceJson(sourceJson) {
        throw new Error("Unimplemented");
    }
    pMoveOrCopyToEditableBySourceJson(sourceJson) {
        throw new Error("Unimplemented");
    }
    pMoveToEditable({brews}) {
        throw new Error("Unimplemented");
    }
    pCopyToEditable({brews}) {
        throw new Error("Unimplemented");
    }

    _PAGE_TO_PROPS__SPELLS = [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_SPELLS], "spellFluff"];
    _PAGE_TO_PROPS__BESTIARY = ["monster", "legendaryGroup", "monsterFluff"];

    _PAGE_TO_PROPS = {
        [UrlUtil.PG_SPELLS]: this._PAGE_TO_PROPS__SPELLS,
        [UrlUtil.PG_CLASSES]: ["class", "subclass", "classFeature", "subclassFeature"],
        [UrlUtil.PG_BESTIARY]: this._PAGE_TO_PROPS__BESTIARY,
        [UrlUtil.PG_BACKGROUNDS]: ["background"],
        [UrlUtil.PG_FEATS]: ["feat"],
        [UrlUtil.PG_OPT_FEATURES]: ["optionalfeature"],
        [UrlUtil.PG_RACES]: [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_RACES], "raceFluff"],
        [UrlUtil.PG_OBJECTS]: ["object"],
        [UrlUtil.PG_TRAPS_HAZARDS]: ["trap", "hazard"],
        [UrlUtil.PG_DEITIES]: ["deity"],
        [UrlUtil.PG_ITEMS]: [...UrlUtil.PAGE_TO_PROPS[UrlUtil.PG_ITEMS], "itemFluff"],
        [UrlUtil.PG_REWARDS]: ["reward"],
        [UrlUtil.PG_PSIONICS]: ["psionic"],
        [UrlUtil.PG_VARIANTRULES]: ["variantrule"],
        [UrlUtil.PG_CONDITIONS_DISEASES]: ["condition", "disease", "status"],
        [UrlUtil.PG_ADVENTURES]: ["adventure", "adventureData"],
        [UrlUtil.PG_BOOKS]: ["book", "bookData"],
        [UrlUtil.PG_TABLES]: ["table", "tableGroup"],
        [UrlUtil.PG_MAKE_BREW]: [...this._PAGE_TO_PROPS__SPELLS, ...this._PAGE_TO_PROPS__BESTIARY, "makebrewCreatureTrait", ],
        [UrlUtil.PG_MANAGE_BREW]: ["*"],
        [UrlUtil.PG_MANAGE_PRERELEASE]: ["*"],
        [UrlUtil.PG_DEMO_RENDER]: ["*"],
        [UrlUtil.PG_VEHICLES]: ["vehicle", "vehicleUpgrade"],
        [UrlUtil.PG_ACTIONS]: ["action"],
        [UrlUtil.PG_CULTS_BOONS]: ["cult", "boon"],
        [UrlUtil.PG_LANGUAGES]: ["language", "languageScript"],
        [UrlUtil.PG_CHAR_CREATION_OPTIONS]: ["charoption"],
        [UrlUtil.PG_RECIPES]: ["recipe"],
        [UrlUtil.PG_CLASS_SUBCLASS_FEATURES]: ["classFeature", "subclassFeature"],
        [UrlUtil.PG_DECKS]: ["card", "deck"],
    };

    getPageProps({page, isStrict=false, fallback=null}={}) {
        page = this._getBrewPage(page);

        const out = this._PAGE_TO_PROPS[page];
        if (out)
            return out;
        if (fallback)
            return fallback;

        if (isStrict)
            throw new Error(`No ${this.DISPLAY_NAME} properties defined for category ${page}`);

        return null;
    }

    getPropPages() {
        return Object.entries(this._PAGE_TO_PROPS).map(([page,props])=>[page, props.filter(it=>it !== "*")]).filter(([,props])=>props.length).map(([page])=>page);
    }

    _getBrewPage(page) {
        return page || (IS_VTT ? this.PAGE_MANAGE : UrlUtil.getCurrentPage());
    }

    getDirProp(dir) {
        switch (dir) {
        case "creature":
            return "monster";
        case "makebrew":
            return "makebrewCreatureTrait";
        }
        return dir;
    }

    getPropDisplayName(prop) {
        switch (prop) {
        case "adventure":
            return "Adventure Contents/Info";
        case "book":
            return "Book Contents/Info";
        }
        return Parser.getPropDisplayName(prop);
    }

    _doCacheMetas() {
        if (this._cache_metas)
            return;

        this._cache_metas = {};

        (this._getBrewMetas() || []).forEach(({_meta})=>{
            Object.entries(_meta || {}).forEach(([prop,val])=>{
                if (!val)
                    return;
                if (typeof val !== "object")
                    return;

                if (val instanceof Array) {
                    (this._cache_metas[prop] = this._cache_metas[prop] || []).push(...MiscUtil.copyFast(val));
                    return;
                }

                this._cache_metas[prop] = this._cache_metas[prop] || {};
                Object.assign(this._cache_metas[prop], MiscUtil.copyFast(val));
            }
            );
        }
        );

        this._cache_metas["_sources"] = (this._getBrewMetas() || []).mergeMap(({_meta})=>{
            return (_meta?.sources || []).mergeMap(src=>({
                [(src.json || "").toLowerCase()]: MiscUtil.copyFast(src)
            }));
        }
        );
    }

    hasSourceJson(source) {
        if (!source)
            return false;
        source = source.toLowerCase();
        return !!this.getMetaLookup("_sources")[source];
    }

    sourceJsonToFull(source) {
        if (!source)
            return "";
        source = source.toLowerCase();
        return this.getMetaLookup("_sources")[source]?.full || source;
    }

    sourceJsonToAbv(source) {
        if (!source)
            return "";
        source = source.toLowerCase();
        return this.getMetaLookup("_sources")[source]?.abbreviation || source;
    }

    sourceJsonToDate(source) {
        if (!source)
            return "";
        source = source.toLowerCase();
        return this.getMetaLookup("_sources")[source]?.dateReleased || "1970-01-01";
    }

    sourceJsonToSource(source) {
        if (!source)
            return null;
        source = source.toLowerCase();
        return this.getMetaLookup("_sources")[source];
    }

    sourceJsonToStyle(source) {
        const stylePart = this.sourceJsonToStylePart(source);
        if (!stylePart)
            return stylePart;
        return `style="${stylePart}"`;
    }

    sourceToStyle(source) {
        const stylePart = this.sourceToStylePart(source);
        if (!stylePart)
            return stylePart;
        return `style="${stylePart}"`;
    }

    sourceJsonToStylePart(source) {
        if (!source)
            return "";
        const color = this.sourceJsonToColor(source);
        if (color)
            return this._getColorStylePart(color);
        return "";
    }

    sourceToStylePart(source) {
        if (!source)
            return "";
        const color = this.sourceToColor(source);
        if (color)
            return this._getColorStylePart(color);
        return "";
    }

    _getColorStylePart(color) {
        return `color: #${color} !important; border-color: #${color} !important; text-decoration-color: #${color} !important;`;
    }

    sourceJsonToColor(source) {
        if (!source)
            return "";
        source = source.toLowerCase();
        if (!this.getMetaLookup("_sources")[source]?.color)
            return "";
        return BrewUtilShared$1.getValidColor(this.getMetaLookup("_sources")[source].color);
    }

    sourceToColor(source) {
        if (!source?.color)
            return "";
        return BrewUtilShared$1.getValidColor(source.color);
    }

    getSources() {
        this._doCacheMetas();
        return Object.values(this._cache_metas["_sources"]);
    }

    getMetaLookup(type) {
        if (!type)
            return null;
        this._doCacheMetas();
        return this._cache_metas[type];
    }

    getMergedData(data, homebrew) {
        const out = {};
        Object.entries(data).forEach(([prop,val])=>{
            if (!homebrew[prop]) {
                out[prop] = [...val];
                return;
            }

            if (!(homebrew[prop]instanceof Array))
                throw new Error(`${this.DISPLAY_NAME.uppercaseFirst()} was not array!`);
            if (!(val instanceof Array))
                throw new Error(`Data was not array!`);
            out[prop] = [...val, ...homebrew[prop]];
        }
        );

        return out;
    }

    async pGetSearchIndex({id=0}={}) {
        const indexer = new Omnidexer(id);

        const brew = await this.pGetBrewProcessed();

        await [...Omnidexer.TO_INDEX__FROM_INDEX_JSON, ...Omnidexer.TO_INDEX].pSerialAwaitMap(async arbiter=>{
            if (arbiter.isSkipBrew)
                return;
            if (!brew[arbiter.brewProp || arbiter.listProp]?.length)
                return;

            if (arbiter.pFnPreProcBrew) {
                const toProc = await arbiter.pFnPreProcBrew.bind(arbiter)(brew);
                await indexer.pAddToIndex(arbiter, toProc);
                return;
            }

            await indexer.pAddToIndex(arbiter, brew);
        }
        );

        return Omnidexer.decompressIndex(indexer.getIndex());
    }

    async pGetAdditionalSearchIndices(highestId, addiProp) {
        const indexer = new Omnidexer(highestId + 1);

        const brew = await this.pGetBrewProcessed();

        await [...Omnidexer.TO_INDEX__FROM_INDEX_JSON, ...Omnidexer.TO_INDEX].filter(it=>it.additionalIndexes && (brew[it.listProp] || []).length).pMap(it=>{
            Object.entries(it.additionalIndexes).filter(([prop])=>prop === addiProp).pMap(async([,pGetIndex])=>{
                const toIndex = await pGetIndex(indexer, {
                    [it.listProp]: brew[it.listProp]
                });
                toIndex.forEach(add=>indexer.pushToIndex(add));
            }
            );
        }
        );

        return Omnidexer.decompressIndex(indexer.getIndex());
    }

    async pGetAlternateSearchIndices(highestId, altProp) {
        const indexer = new Omnidexer(highestId + 1);

        const brew = await this.pGetBrewProcessed();

        await [...Omnidexer.TO_INDEX__FROM_INDEX_JSON, ...Omnidexer.TO_INDEX].filter(ti=>ti.alternateIndexes && (brew[ti.listProp] || []).length).pSerialAwaitMap(async arbiter=>{
            await Object.keys(arbiter.alternateIndexes).filter(prop=>prop === altProp).pSerialAwaitMap(async prop=>{
                await indexer.pAddToIndex(arbiter, brew, {
                    alt: arbiter.alternateIndexes[prop]
                });
            }
            );
        }
        );

        return Omnidexer.decompressIndex(indexer.getIndex());
    }

    async pGetUrlExportableSources() {
        const brews = await this._pGetBrewRaw();
        const brewsExportable = brews.filter(brew=>!brew.head.isEditable && !brew.head.isLocal);
        return brewsExportable.flatMap(brew=>brew.body._meta.sources.map(src=>src.json)).unique();
    }
}

class _BrewUtil2 extends _BrewUtil2Base {
    _STORAGE_KEY_LEGACY = "HOMEBREW_STORAGE";
    _STORAGE_KEY_LEGACY_META = "HOMEBREW_META_STORAGE";

    _STORAGE_KEY = "HOMEBREW_2_STORAGE";
    _STORAGE_KEY_META = "HOMEBREW_2_STORAGE_METAS";

    _STORAGE_KEY_CUSTOM_URL = "HOMEBREW_CUSTOM_REPO_URL";
    _STORAGE_KEY_MIGRATION_VERSION = "HOMEBREW_2_STORAGE_MIGRATION";

    _VERSION = 2;

    _PATH_LOCAL_DIR = "homebrew";
    _PATH_LOCAL_INDEX = VeCt.JSON_BREW_INDEX;

    IS_EDITABLE = true;
    PAGE_MANAGE = UrlUtil.PG_MANAGE_BREW;
    URL_REPO_DEFAULT = VeCt.URL_BREW;
    DISPLAY_NAME = "homebrew";
    DISPLAY_NAME_PLURAL = "homebrews";
    DEFAULT_AUTHOR = "";
    STYLE_BTN = "btn-info";

    _pInit_doBindDragDrop() {
        document.body.addEventListener("drop", async evt=>{
            if (EventUtil.isInInput(evt))
                return;

            evt.stopPropagation();
            evt.preventDefault();

            const files = evt.dataTransfer?.files;
            if (!files?.length)
                return;

            const pFiles = [...files].map((file,i)=>{
                if (!/\.json$/i.test(file.name))
                    return null;

                return new Promise(resolve=>{
                    const reader = new FileReader();
                    reader.onload = ()=>{
                        let json;
                        try {
                            json = JSON.parse(reader.result);
                        } catch (ignored) {
                            return resolve(null);
                        }

                        resolve({
                            name: file.name,
                            json
                        });
                    }
                    ;

                    reader.readAsText(files[i]);
                }
                );
            }
            );

            const fileMetas = (await Promise.allSettled(pFiles)).filter(({status})=>status === "fulfilled").map(({value})=>value).filter(Boolean);

            await this.pAddBrewsFromFiles(fileMetas);

            if (this.isReloadRequired())
                location.reload();
        }
        );

        document.body.addEventListener("dragover", evt=>{
            if (EventUtil.isInInput(evt))
                return;

            evt.stopPropagation();
            evt.preventDefault();
        }
        );
    }

    async _pGetSourceIndex(urlRoot) {
        return DataUtil.brew.pLoadSourceIndex(urlRoot);
    }

    getFileUrl(path, urlRoot) {
        return DataUtil.brew.getFileUrl(path, urlRoot);
    }

    pLoadTimestamps(brewIndex, src, urlRoot) {
        return DataUtil.brew.pLoadTimestamps(urlRoot);
    }

    pLoadPropIndex(brewIndex, src, urlRoot) {
        return DataUtil.brew.pLoadPropIndex(urlRoot);
    }

    pLoadMetaIndex(brewIndex, src, urlRoot) {
        return DataUtil.brew.pLoadMetaIndex(urlRoot);
    }

    async pGetEditableBrewDoc() {
        return this._findEditableBrewDoc({
            brewRaw: await this._pGetBrewRaw()
        });
    }

    _findEditableBrewDoc({brewRaw}) {
        return brewRaw.find(it=>it.head.isEditable);
    }

    async pGetOrCreateEditableBrewDoc() {
        const existing = await this.pGetEditableBrewDoc();
        if (existing)
            return existing;

        const brew = this._getNewEditableBrewDoc();
        const brews = [...MiscUtil.copyFast(await this._pGetBrewRaw()), brew];
        await this.pSetBrew(brews);

        return brew;
    }

    async pSetEditableBrewDoc(brew) {
        if (!brew?.head?.docIdLocal || !brew?.body)
            throw new Error(`Invalid editable brew document!`);
        await this.pUpdateBrew(brew);
    }

    async pGetEditableBrewEntity(prop, uniqueId, {isDuplicate=false}={}) {
        if (!uniqueId)
            throw new Error(`A "uniqueId" must be provided!`);

        const brew = await this.pGetOrCreateEditableBrewDoc();

        const out = (brew.body?.[prop] || []).find(it=>it.uniqueId === uniqueId);
        if (!out || !isDuplicate)
            return out;

        if (isDuplicate)
            out.uniqueId = CryptUtil.uid();

        return out;
    }

    async pPersistEditableBrewEntity(prop, ent) {
        if (!ent.uniqueId)
            throw new Error(`Entity did not have a "uniqueId"!`);

        const brew = await this.pGetOrCreateEditableBrewDoc();

        const ixExisting = (brew.body?.[prop] || []).findIndex(it=>it.uniqueId === ent.uniqueId);
        if (!~ixExisting) {
            const nxt = MiscUtil.copyFast(brew);
            MiscUtil.getOrSet(nxt.body, prop, []).push(ent);

            await this.pUpdateBrew(nxt);

            return;
        }

        const nxt = MiscUtil.copyFast(brew);
        nxt.body[prop][ixExisting] = ent;

        await this.pUpdateBrew(nxt);
    }

    async pRemoveEditableBrewEntity(prop, uniqueId) {
        if (!uniqueId)
            throw new Error(`A "uniqueId" must be provided!`);

        const brew = await this.pGetOrCreateEditableBrewDoc();

        if (!brew.body?.[prop]?.length)
            return;

        const nxt = MiscUtil.copyFast(brew);
        nxt.body[prop] = nxt.body[prop].filter(it=>it.uniqueId !== uniqueId);

        if (nxt.body[prop].length === brew.body[prop])
            return;
        await this.pUpdateBrew(nxt);
    }

    async pAddSource(sourceObj) {
        const existing = await this.pGetEditableBrewDoc();

        if (existing) {
            const nxt = MiscUtil.copyFast(existing);
            const sources = MiscUtil.getOrSet(nxt.body, "_meta", "sources", []);
            sources.push(sourceObj);

            await this.pUpdateBrew(nxt);

            return;
        }

        const json = {
            _meta: {
                sources: [sourceObj]
            }
        };
        const brew = this._getBrewDoc({
            json,
            isEditable: true
        });
        const brews = [...MiscUtil.copyFast(await this._pGetBrewRaw()), brew];
        await this.pSetBrew(brews);
    }

    async pEditSource(sourceObj) {
        const existing = await this.pGetEditableBrewDoc();
        if (!existing)
            throw new Error(`Editable brew document does not exist!`);

        const nxt = MiscUtil.copyFast(existing);
        const sources = MiscUtil.get(nxt.body, "_meta", "sources");
        if (!sources)
            throw new Error(`Source "${sourceObj.json}" does not exist in editable brew document!`);

        const existingSourceObj = sources.find(it=>it.json === sourceObj.json);
        if (!existingSourceObj)
            throw new Error(`Source "${sourceObj.json}" does not exist in editable brew document!`);
        Object.assign(existingSourceObj, sourceObj);

        await this.pUpdateBrew(nxt);
    }

    async pIsEditableSourceJson(sourceJson) {
        const brew = await this.pGetEditableBrewDoc();
        if (!brew)
            return false;

        const sources = MiscUtil.get(brew.body, "_meta", "sources") || [];
        return sources.some(it=>it.json === sourceJson);
    }

    async pMoveOrCopyToEditableBySourceJson(sourceJson) {
        if (await this.pIsEditableSourceJson(sourceJson))
            return;

        const brews = (await this._pGetBrewRaw()).filter(brew=>(brew.body._meta?.sources || []).some(src=>src.json === sourceJson));
        const brewsLocal = (await this._pGetBrew_pGetLocalBrew()).filter(brew=>(brew.body._meta?.sources || []).some(src=>src.json === sourceJson));

        let brew = brews.find(brew=>BrewDoc.isOperationPermitted_moveToEditable({
            brew
        }));
        if (!brew)
            brew = brewsLocal.find(brew=>BrewDoc.isOperationPermitted_moveToEditable({
                brew,
                isAllowLocal: true
            }));

        if (!brew)
            return;

        if (brew.head.isLocal)
            return this.pCopyToEditable({
                brews: [brew]
            });

        return this.pMoveToEditable({
            brews: [brew]
        });
    }

    async pMoveToEditable({brews}) {
        const out = await this.pCopyToEditable({
            brews
        });
        await this.pDeleteBrews(brews);
        return out;
    }

    async pCopyToEditable({brews}) {
        const brewEditable = await this.pGetOrCreateEditableBrewDoc();

        const cpyBrewEditableDoc = BrewDoc.fromObject(brewEditable, {
            isCopy: true
        });
        brews.forEach((brew,i)=>cpyBrewEditableDoc.mutMerge({
            json: brew.body,
            isLazy: i !== brews.length - 1
        }));

        await this.pSetEditableBrewDoc(cpyBrewEditableDoc.toObject());

        return cpyBrewEditableDoc;
    }
}

class _PrereleaseUtil extends _BrewUtil2Base {
    _STORAGE_KEY_LEGACY = null;
    _STORAGE_KEY_LEGACY_META = null;

    _STORAGE_KEY = "PRERELEASE_STORAGE";
    _STORAGE_KEY_META = "PRERELEASE_META_STORAGE";

    _STORAGE_KEY_CUSTOM_URL = "PRERELEASE_CUSTOM_REPO_URL";
    _STORAGE_KEY_MIGRATION_VERSION = "PRERELEASE_STORAGE_MIGRATION";

    _PATH_LOCAL_DIR = "prerelease";
    _PATH_LOCAL_INDEX = VeCt.JSON_PRERELEASE_INDEX;

    _VERSION = 1;

    IS_EDITABLE = false;
    PAGE_MANAGE = UrlUtil.PG_MANAGE_PRERELEASE;
    URL_REPO_DEFAULT = VeCt.URL_PRERELEASE;
    DISPLAY_NAME = "prerelease content";
    DISPLAY_NAME_PLURAL = "prereleases";
    DEFAULT_AUTHOR = "Wizards of the Coast";
    STYLE_BTN = "btn-primary";

    _pInit_doBindDragDrop() {}

    async _pGetSourceIndex(urlRoot) {
        return DataUtil.prerelease.pLoadSourceIndex(urlRoot);
    }

    getFileUrl(path, urlRoot) {
        return DataUtil.prerelease.getFileUrl(path, urlRoot);
    }

    pLoadTimestamps(brewIndex, src, urlRoot) {
        return DataUtil.prerelease.pLoadTimestamps(urlRoot);
    }

    pLoadPropIndex(brewIndex, src, urlRoot) {
        return DataUtil.prerelease.pLoadPropIndex(urlRoot);
    }

    pLoadMetaIndex(brewIndex, src, urlRoot) {
        return DataUtil.prerelease.pLoadMetaIndex(urlRoot);
    }

    pGetEditableBrewDoc(brew) {
        return super.pGetEditableBrewDoc(brew);
    }
    pGetOrCreateEditableBrewDoc() {
        return super.pGetOrCreateEditableBrewDoc();
    }
    pSetEditableBrewDoc() {
        return super.pSetEditableBrewDoc();
    }
    pGetEditableBrewEntity(prop, uniqueId, {isDuplicate=false}={}) {
        return super.pGetEditableBrewEntity(prop, uniqueId, {
            isDuplicate
        });
    }
    pPersistEditableBrewEntity(prop, ent) {
        return super.pPersistEditableBrewEntity(prop, ent);
    }
    pRemoveEditableBrewEntity(prop, uniqueId) {
        return super.pRemoveEditableBrewEntity(prop, uniqueId);
    }
    pAddSource(sourceObj) {
        return super.pAddSource(sourceObj);
    }
    pEditSource(sourceObj) {
        return super.pEditSource(sourceObj);
    }
    pIsEditableSourceJson(sourceJson) {
        return super.pIsEditableSourceJson(sourceJson);
    }
    pMoveOrCopyToEditableBySourceJson(sourceJson) {
        return super.pMoveOrCopyToEditableBySourceJson(sourceJson);
    }
    pMoveToEditable({brews}) {
        return super.pMoveToEditable({
            brews
        });
    }
    pCopyToEditable({brews}) {
        return super.pCopyToEditable({
            brews
        });
    }

}

globalThis.BrewUtil2 = new _BrewUtil2();
globalThis.PrereleaseUtil = new _PrereleaseUtil();