(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    class ColibriWorker {

        static worker;

        static handlers = {};

        static setup(path) {
            ColibriWorker.worker = new Worker(path || './worker.js');
        }

        static on(type, cb) {
            ColibriWorker.handlers[type] = cb;
        }

        static sendToClient(type, payload) {
            /*console.log('[worker] send to client', {
                type,
                payload,
            });*/
            postMessage({
                type,
                payload,
            });
        }

    }

    const bannersData = [{
        id: 'orange',
        name: 'Orange banner',
        description: 'Improves your support creatures production',
        color: '#ff8131',
        isUnlocked: () => true,
        getEffect: (tiers) => tiers.reverse().reduce((acc, one) => acc *= (1 + 0.01*one.amount), 1),
    },{
        id: 'yellow',
        name: 'Yellow banner',
        description: 'Improves your miner creatures production',
        color: '#fad331',
        isUnlocked: () => true,
        getEffect: (tiers) => tiers.reverse().reduce((acc, one) => acc *= (1 + 0.01*one.amount), 1),
    },{
        id: 'blue',
        name: 'Blue banner',
        description: 'Improves your mana creatures production',
        color: '#2a31f1',
        isUnlocked: () => true,
        getEffect: (tiers) => tiers.reverse().reduce((acc, one) => acc *= (1 + 0.01*one.amount), 1),
    },{
        id: 'green',
        name: 'Green banner',
        description: 'Improves your personal actions and spells production',
        color: '#2a9131',
        isUnlocked: () => true,
        getEffect: (tiers) => tiers.reverse().reduce((acc, one) => acc *= (1 + 0.01*one.amount), 1),
    },{
        id: 'violet',
        name: 'Violet banner',
        description: 'Improves your dark researchers effiency',
        color: '#9a31b1',
        isUnlocked: () => BasicResearch.isResearchUnlocked(),
        getEffect: (tiers) => tiers.reverse().reduce((acc, one) => acc *= (1 + 0.01*one.amount), 1),
    },{
        id: 'brown',
        name: 'Brown banner',
        description: 'Improves builders and building resources gatherers efficiency',
        color: '#aa8141',
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 4,
        getEffect: (tiers) => tiers.reverse().reduce((acc, one) => acc *= (1 + 0.01*one.amount), 1),
    }];

    const learningData = [{
        id: 'initiative',
        name: 'Initiative',
        description: 'Each level will boost your actions efficiency by decreasing cooldowns by 1%',
        isUnlocked: () => true,
        getMaxXP: (level) => 10 * Math.pow(1.32, level)
    },{
        id: 'perseverance',
        name: 'Perseverance',
        description: 'Each level will boost your actions efficiency by increasing their output by 1%',
        isUnlocked: () => true,
        getMaxXP: (level) => 10 * Math.pow(1.32, level)
    },{
        id: 'magic',
        name: 'Magic',
        description: 'Each level will boost your spells output by 1%',
        isUnlocked: () => !!ShopItems.purchased.bookOfMagic,
        getMaxXP: (level) => 20 * Math.pow(1.44, level)
    },{
        id: 'mana',
        name: 'Mana efficiency',
        description: 'Each level will decrease mana costs of spells by 1%',
        isUnlocked: () => !!ShopItems.purchased.bookOfMagic,
        getMaxXP: (level) => 40 * Math.pow(1.56, level)
    }];

    class ObjectUtils {

        static flattenObject(ob) {
            if((typeof ob) !== 'object') return ob;
            var toReturn = {};

            for (var i in ob) {
                if (!ob.hasOwnProperty(i)) continue;

                if ((typeof ob[i]) == 'object' && ob[i] !== null) {
                    var flatObject = flattenObject(ob[i]);
                    for (var x in flatObject) {
                        if (!flatObject.hasOwnProperty(x)) continue;

                        toReturn[i + '.' + x] = flatObject[x];
                    }
                } else {
                    toReturn[i] = ob[i];
                }
            }
            return toReturn;
        }

        static setByPath(objRef, path, data) {
            const pathParts = path.split('.');
            let updatingPart = objRef;
            if(!pathParts.length) {
                objRef = data;
                return objRef;
            }
            for(let i = 0; i < pathParts.length-1; i++) {
                if(updatingPart[pathParts[i]]) {
                    updatingPart = updatingPart[pathParts[i]];
                } else {
                    const nP = pathParts[i+1];
                    if(Number.isInteger(+nP)) {
                        updatingPart[pathParts[i]] = [];
                    } else {
                        updatingPart[pathParts[i]] = {};
                    }
                    updatingPart = updatingPart[pathParts[i]];
                }
            }
            updatingPart[pathParts[pathParts.length-1]] = data;
            return objRef;
        }

        static getByPath(objRef, path, def) {
            const pathParts = path.split('.');
            let updatingPart = objRef;
            if(!pathParts.length) {
                return objRef;
            }
            for(let i = 0; i < pathParts.length-1; i++) {
                if(updatingPart[pathParts[i]]) {
                    updatingPart = updatingPart[pathParts[i]];
                } else {
                    return def;
                }
            }
            const val = updatingPart[pathParts[pathParts.length-1]];
            return ((typeof val) === 'undefined') ? def : val;
        }

    }

    class BasicSettings {

        static settings = {};

        static initialize(isBannerPrestige) {
            if(!isBannerPrestige || !BasicSettings.settings) {
                BasicSettings.settings = {
                    notationTypeId: 1,
                    inputControls: {
                        creatureJobs: 'both',
                        learning: 'both'
                    },
                    notificationsSettings: {
                        whenCreatureDies: true,
                        whenBattleLost: true,
                        whenBattleWon: false,
                        whenBuildingBuilt: true,
                        whenZoneFinished: true,
                    },
                    confirmationSettings: {
                        whenGoNegative: true,
                        whenSkillsNegative: true,
                    },
                    hotKeys: {
                        tab_actions: {
                            key: '1',
                            ctrlKey: false,
                            shiftKey: false,
                            altKey: true
                        },
                        tab_shop: {
                            key: '2',
                            ctrlKey: false,
                            shiftKey: false,
                            altKey: true
                        },
                        tab_story: null,
                        tab_settings: null,
                    },
                    isUseCondensedTime: false,
                };

                BasicSettings.initResourcesSettings();
            }

            return BasicSettings.settings;
        }

        static initResourcesSettings() {
            BasicSettings.settings.resourcesDisplay = {
                gold: 1,
                energy: 1,
                mana: 1,
                souls: 1,
                herbs: 1,
                flasks: 1,
                research: 1,
                territory: 1,
                tools: 1,
                weapons: 1,
                wood: 1,
                stone: 1,
                ore: 1,
                condensedTime: 1,
                memoryStones: 1,
                flasksOfAgility: 1,
                flasksOfAggression: 1,
                flasksOfEndurance: 1,
                dragonithe: 1,
                dragoniteTools: 1,
            };
            return BasicSettings.settings.resourcesDisplay;
        }

        static updateSetting(path, value) {
            ObjectUtils.setByPath(BasicSettings.settings, path, value);
        }

        static sendToUI() {
            ColibriWorker.sendToClient('set_settings_state', BasicSettings.settings);
        }

    }

    class BasicSkills {

        static skills = {};

        static initialize(isBannerPrestiege) {
            if(isBannerPrestiege && BasicSkills.skills) {
                Object.entries(BasicSkills.skills).forEach(([key, skill]) => {
                    BasicSkills.skills[key] = {
                        xp: 0,
                        level: 0,
                        efforts: skill.efforts,
                    };
                });
            } else {
                BasicSkills.skills = {};
            }

        }

        static skillLevel(id) {
            return BasicSkills.skills[id] ? BasicSkills.skills[id].level : 0;
        }

        static getBalanceById(resourceId, learning, bIgnoreEfficiency) {
            let totl = 0;
            let state = learning || BasicSkills.skills;
            if(resourceId === 'energy') {
                if(state && Object.keys(state).length) {
                    const energyIncome = BasicResources.getBalance(resourcesData.find(one => one.id === 'energy'), { learning: {} });
                    if(energyIncome > 0) {
                        totl -= energyIncome * Object.values(state).reduce((acc, one) => acc += one.efforts * 0.999999, 0);
                    }
                }
            }
            return totl;
        }

        static initSkill() {
            return {
                xp: 0,
                level: 0,
                efforts: 0,
            }
        }

        static getList() {
            return learningData.map(one => {

                const currentStatus = BasicSkills.skills[one.id] || BasicSkills.initSkill();

                return {
                    id: one.id,
                    name: one.name,
                    description: one.description,
                    xp: currentStatus.xp,
                    maxXp: one.getMaxXP(currentStatus.level),
                    percentage: currentStatus.xp / one.getMaxXP(currentStatus.level),
                    level: currentStatus.level,
                    efforts: currentStatus.efforts,
                    isUnlocked: one.isUnlocked(),
                }
            })
        }

        static setEffortsAll({ id, val }) {
            if(!id) {
                learningData.filter(o => o.isUnlocked()).forEach((one) => {
                    if(!BasicSkills.skills[one.id]) {
                        BasicSkills.skills[one.id] = BasicSkills.initSkill();
                    }
                    BasicSkills.skills[one.id].efforts = +val;
                });
            } else {
                BasicSkills.skills[id].efforts = val;
            }
        }

        static getTotalInvested() {
            return Object.values(BasicSkills.skills).reduce((acc, item) => acc += item.efforts, 0);
        }

        static setEffortsPercentage({ id, efforts }) {
            const investedTotal = BasicSkills.getTotalInvested();
            const oldInvested = BasicSkills.skills[id]?.efforts || 0;
            if(!BasicSkills.skills[id]) {
                BasicSkills.skills[id] = BasicSkills.initSkill();
            }
            BasicSkills.skills[id].efforts = Math.min(efforts, 1 - investedTotal + oldInvested);
        }

        static setEfforts({ id, efforts, isConfirmed }) {

            const data = learningData.find(one => one.id === id);

            if(!data) {
                throw new Error(`Not found skill by id ${id}`);
            }

            if(efforts < 0) {
                efforts = 0;
            }

            resourcesData.find(one => one.id === 'energy')?.getMax();

            /*if(efforts > 0.5*maxEn) {
                efforts = 0.5*maxEn;
            }*/

            if(!BasicSkills.skills[id]) {
                BasicSkills.skills[id] = BasicSkills.initSkill();
            }

            const bStats = BasicResources.getBalanceDifferences({
                learning: {
                    ...BasicSkills.skills,
                    [id]: {efforts: efforts},
                }
            }, efforts - BasicSkills.skills[id].efforts);

            if(!isConfirmed && bStats.isRisk && BasicSettings.settings.confirmationSettings?.whenSkillsNegative) {
                ColibriWorker.sendToClient('spawn_confirm', {
                    text: `Your changes can cause your ${bStats.riskResources.map(({ name }) => name).join(', ')} balance go negative. Are you sure?`,
                    onConfirmAction: {
                        type: 'change_learning_efforts',
                        payload: {
                            id,
                            amount: efforts,
                            isConfirmed: true,
                        }
                    },
                    onCancelAction: {
                        type: 'change_learning_efforts',
                        payload: {
                            id,
                            amount: bStats.optimum,
                            isConfirmed: true,
                        }
                    },
                    buttons: {
                        confirm: `Update worker amount`,
                        cancel: `Update to safe amount`
                    }
                });
                return;
            }

            BasicSkills.skills[id].efforts = efforts;
        }

        static process(dT) {
            const list = BasicSkills.getList();
            // let mult = 1.0;
            const totl = Object.values(BasicSkills.skills).reduce((acc, one) => acc += (one?.efforts || 0), 0);
            if(totl > 1) {
                Object.keys(BasicSkills.skills).forEach(key => {
                    BasicSkills.skills[key].efforts /= totl;
                });
            }
            list.forEach(item => {
                if(!item.efforts) {
                    return;
                }


                // const hasEnough = BasicResources.checkResourcesAvailable({ energy: item.efforts });
                // if(hasEnough.totalPercentage >= dT) {
                const eff = BasicResources.efficiencies.energy.efficiency;
                const energyIncome = BasicResources.getBalance(resourcesData.find(one => one.id === 'energy'), { learning: {} }, true);
                // console.log('learning[pre-apply]: ', item, energyIncome);
                if (energyIncome <= 0 || Number.isNaN(energyIncome)) {
                    // console.warn('BUGGED!');
                    return;
                }
                const realInvested = Math.min(item.efforts * energyIncome * dT * eff * 0.99999, BasicResources.resources.energy*0.999999);

                BasicSkills.skills[item.id].xp += realInvested * (1 + 0.5 * BasicResearch.getResearchLevel('selfDevelopment'));
                // console.log('learning[apply]: ', item, realInvested, BasicSkills.skills[item.id]);
                if(item.maxXp <= BasicSkills.skills[item.id].xp) {
                    BasicSkills.skills[item.id].xp = 0;
                    BasicSkills.skills[item.id].level++;
                }

                BasicResources.subtractBatch({ energy: realInvested });
                // }
            });
        }

        static sendToUI() {
            const list = BasicSkills.getList();
            ColibriWorker.sendToClient('set_skills_state', list);
        }

    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    let getRandomValues;
    const rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    const byteToHex = [];

    for (let i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).slice(1));
    }

    function unsafeStringify(arr, offset = 0) {
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      return (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
    }

    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    var native = {
      randomUUID
    };

    function v4(options, buf, offset) {
      if (native.randomUUID && !buf && !options) {
        return native.randomUUID();
      }

      options = options || {};
      const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (let i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return unsafeStringify(rnds);
    }

    class CreatureJobsPresets {

        static state = {
            presets: [],
            edited: null,
            activePreset: '',
            autoDistribute: true,
        }

        static initialize(isBannerPrestige) {
            if(!isBannerPrestige || !CreatureJobsPresets.state) {
                CreatureJobsPresets.state = {
                    presets: [],
                    edited: null,
                    activePreset: '',
                };
            }
            return CreatureJobsPresets.state;
        }

        static initializePreset() {
            return {
                name: 'New Preset',
                jobsRules: [{
                    id: "supporter",
                    percentage: 70,
                },{
                    id: "miner",
                    percentage: 25,
                },{
                    id: "mage",
                    percentage: 5,
                }],
            }
        }

        static setUsedPreset(id) {
            CreatureJobsPresets.state.activePreset = id;
        }

        static setAutoDistribute(flag) {
            CreatureJobsPresets.state.autoDistribute = flag;
        }

        static validateNormalizeRules(jobsRules) {
            const jobsUnlocked = jobsData.filter(one => one.isUnlocked());
            const validatedRules = [];
            let totalPercentage = 0;
            jobsRules.forEach(rule => {
                if(!jobsUnlocked.find(job => job.id === rule.id)) {
                    return;
                }
                totalPercentage += rule.percentage;
                validatedRules.push(rule);
            });
            if(totalPercentage > 100) {
                for(let i = 0; i < validatedRules.length; i++) {
                    validatedRules[i].percentage *= 100 / totalPercentage;
                }
            }
            return validatedRules;
        }

        static savePreset(isNew, data) {
            let id = data.id;
            if(isNew) {
                id = v4();
            }
            if(!id) {
                console.error('id is required in existing preset');
                return;
            }
            const existingWithName = CreatureJobsPresets.state.presets.find(one => one.id !== id && one.name === data.name);
            if(existingWithName) {
                console.error('Preset with such name already exists');
                return;
            }
            let objToSave = {
                id,
                name: data.name,
                jobsRules: CreatureJobsPresets.validateNormalizeRules(data.jobsRules)
            };
            let foundIndex = CreatureJobsPresets.state.presets.findIndex(one => one.id === id);
            if(foundIndex < 0) {
                CreatureJobsPresets.state.presets.push(objToSave);
            } else {
                CreatureJobsPresets.state.presets[foundIndex] = objToSave;
            }
            console.log('newPresets: ', CreatureJobsPresets.state.presets);
        }

        static assignAccordingToPreset(currentJobs, freeWorkers) {
            const total = CreatureBasic.numCreatures;
            let reassignable = total;
            if(!CreatureJobsPresets.state.activePreset) return;
            const preset = CreatureJobsPresets.state.presets.find(one => one.id === CreatureJobsPresets.state.activePreset);
            if(!preset) return;
            const rules = preset.jobsRules;

            const newJobs = {};

            const jobsUnlocked = jobsData.filter(one => one.isUnlocked());

            let partials = 0;

            let minimums = rules.reduce((acc, one) => acc + (one.minAmount || 0), 0);

            let perPercent = 0;

            jobsUnlocked.forEach((job) => {
                const foundRule = rules.find(one => one.id === job.id);
                if(!foundRule) {
                    newJobs[job.id] = 0;
                    return;
                }
                if(foundRule.minAmount) {
                    const percentageBased = Math.floor((foundRule.percentage || 0) * total / 100);
                    const delta = Math.min(foundRule.minAmount, total * (foundRule.minAmount / minimums));
                    const deltaInt = Math.floor(delta);
                    if(percentageBased < deltaInt) {
                        perPercent += (foundRule.percentage || 0);
                        reassignable -= deltaInt;
                    }
                    newJobs[job.id] = deltaInt;
                    // console.log(`JobId: ${job.id} = ${newJobs[job.id]}: `, foundRule, delta, deltaInt, minimums);
                }

            });

            // console.log('reassignable: ', reassignable, perPercent, newJobs);

            jobsUnlocked.forEach((job) => {
                // sooo...
                const foundRule = rules.find(one => one.id === job.id);
                if(!foundRule) {
                    newJobs[job.id] = 0;
                    return;
                }
                // const percentageBased = reassignable * foundRule.percentage / 100;
                const multed = reassignable * (foundRule.percentage || 0) / (100 - perPercent);
                newJobs[job.id] = newJobs[job.id] && newJobs[job.id] > multed ? newJobs[job.id] : multed;
                partials += (newJobs[job.id]) % 1;
                newJobs[job.id] = Math.floor(newJobs[job.id]);
                // console.log(`mlted: ${job.id}`, multed, reassignable, foundRule.percentage || 0, perPercent);
            });
            // console.log('asgn: ', partials, newJobs);
            if(partials > 0) {
                let index = 0;
                while (partials > 1.e-2 && index < rules.length) {
                    newJobs[rules[index].id]++;
                    index++;
                    partials--;
                }
            }
            return { newJobs, expectedFree: total - Object.values(newJobs).reduce((acc, item) => acc + item, 0) };
        }

        static getState() {
            return {
                ...CreatureJobsPresets.state,
                defaultPreset: CreatureJobsPresets.initializePreset(),
            }
        }

    }

    const temperData = [{
        id: 'saving',
        name: 'Saving',
        description: 'Increase maximum gold by 50 + 25%. Increase gold income by 20%. Start with bargaining purchased',
        isUnlocked: () => true,
        onStartRun: () => {
            ShopItems.purchased['bargaging'] = 1;
        }
    },{
        id: 'energetic',
        name: 'Energetic',
        description: 'Increase maximum energy by 20 + 25%. Increase energy income by 20%. Start with 10 training stamina performed',
        isUnlocked: () => true,
        onStartRun: () => {
            BasicActions.actions['physicalTraining'] = { performed: 10, cooldown: 0 };
        }
    },{
        id: 'spiritual',
        name: 'Spiritual',
        description: 'Increase maximum mana by 10 + 25%. Increase mana income by 20%.',
        isUnlocked: () => true,
    },{
        id: 'authoritative',
        name: 'Authoritative',
        description: 'Decrease creatures cost by 20%',
        isUnlocked: () => true,
    },{
        id: 'wise',
        name: 'Wise',
        description: 'Increase research income by 20%',
        isUnlocked: () => BasicResearch.isResearchUnlocked(),
    },{
        id: 'aggressive',
        name: 'Aggressive',
        description: 'Increase fighters stats by 20%. Battles are 10% faster',
        isUnlocked: () => BasicResearch.getResearchLevel('fighting') > 0,
    }];

    class BasicTemper {

        static state = {
            currentId: null,
            popupShown: false,
        }

        static initialize() {
            BasicTemper.state = {
                currentId: null,
                popupShown: false,
            };
            return BasicTemper.state;
        }

        static getCurrentTemper = () => {
            return BasicTemper.state?.currentId;
        }

        static setCurrentTemper = (id) => {
            const data = temperData.find(one => one.id === id);
            if(!data) {
                throw new Error(`Not found temper by id ${id}`);
            }
            BasicTemper.state.currentId = id;
            BasicTemper.state.popupShown = false;
            if(data.onStartRun) {
                data.onStartRun();
            }
        }

        static getList = () => {
            return temperData.map(one => ({
                id: one.id,
                name: one.name,
                description: one.description,
                isUnlocked: one.isUnlocked(),
                selected: BasicTemper.state.currentId === one.id,
            }))
        }

        static process = () => {
            if(BasicBanners.hasSomeBanners() && BasicTemper.state.currentId === 'select') {
                BasicTemper.state.popupShown = true;
            }
        }

        static sendToUI = () => {
            return ColibriWorker.sendToClient('set_temper_state', BasicTemper.getList());
        }

    }

    class State {

        static state = {};

        static setState(path, value) {
            ObjectUtils.setByPath(State.state, path, value);
        }

        static queryState(path, def) {
            return ObjectUtils.getByPath(State.state, path, def);
        }

    }

    const SUFFIXES_ARR = {
        '-3': 'n',
        '-2': 'mc',
        '-1': 'm',
        '1': 'K',
        '2': 'M',
        '3': 'B',
        '4': 'T',
        '5': 'Qa',
        '6': 'Qi',
        '7': 'Sx',
        '8': 'Sp',
        '9': 'Oc',
        '10': 'No',
        '11': 'Dc',
        '12': 'UDc',
        '13': 'DDc',
        '14': 'TDc',
        '15': 'QaDc',
        '16': 'QiDc',
        '17': 'SxDc',
        '18': 'SpDc',
        '19': 'OcDc',
        '20': 'NDc',
        '21': 'Vi',
        '22': 'UVi',
        '23': 'DVi',
        '24': 'TVi',
        '25': 'QaVi',
        '26': 'QiVi',
        '27': 'SxVi',
        '28': 'SpVi',
        '29': 'OcVi',
        '30': 'NVi',
        '31': 'Td',
    };

    const getSuffixByIndex = (index) => SUFFIXES_ARR[`${index}`] || '';

    const fmtVal = (val, notationType, radix = 2) => {
        if(!notationType) {
            notationType = BasicSettings.settings.notationTypeId; // will be undefined if called from front-end
        }
        if(!notationType) {
            notationType = State.queryState('game.general.settings.notationTypeId', 1);
        }
        if(notationType === 1) return fmtValStandard(val, radix);
        return fmtValScientific(val, radix);
    };

    const fmtValScientific = (val, radix) => {
        if(val == null) return '0';
        if(!val) return '0';
        const abs = Math.abs(val);
        if(abs < 1.e+3 && abs > 1.e-2) {
            return `${val.toFixed(radix)}`;
        }
        return val.toExponential(2);
    };

    const fmtValStandard = (val, radix) => {
        if(val == null) return '0';
        if(!val) return '0';
        const sign = Math.sign(val);
        const abs = Math.abs(val);
        const orders = Math.log10(abs);
        let suffix = '';
        const suffixId = Math.floor(orders / 3);
        const mpart = (abs / (Math.pow(1000, suffixId))).toFixed(suffixId < 1 ? radix : 2);
        if(orders < 0) {
            if(orders >= -2) {
                return `${sign < 0 ? '-' : ''}${abs.toFixed(radix)}`;
            }
            const suffixId = Math.floor(orders / 3);
            suffix = getSuffixByIndex(suffixId);
            return `${sign < 0 ? '-' : ''}${mpart}${suffix}`;
        }


        suffix = getSuffixByIndex(suffixId);
        return `${sign < 0 ? '-' : ''}${mpart}${suffix}`;
    };


    function secondsToHms(d) {
        if(!d) return '00:00:00';
        d = Number(d);
        const h = Math.floor(d / 3600);
        const m = Math.floor(d % 3600 / 60);
        const s = Math.floor(d % 3600 % 60);

        const hDisplay = h > 9 ? `${h}:` : `0${h}:`;
        const mDisplay = m > 9 ? `${m}:` : `0${m}:`;
        const sDisplay = s > 9 ? `${s}` : `0${s}`;
        return hDisplay + mDisplay + sDisplay;
    }

    const heirloomEffects = [{
        id: 'greediness',
        name: 'greediness',
        isUnlocked: () => true,
        base: 0.02,
        getText: (amount) => `+${fmtVal(amount*100)}% to gold income`
    },{
        id: 'saving',
        name: 'saving',
        isUnlocked: () => true,
        base: 0.02,
        getText: (amount) => `+${fmtVal(amount*100)}% to gold maximum`
    },{
        id: 'soulharvest',
        name: 'soulharvest',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to souls gained`
    },{
        id: 'energy',
        name: 'energy',
        isUnlocked: () => true,
        base: 0.02,
        getText: (amount) => `+${fmtVal(amount*100)}% to maximum energy`
    },{
        id: 'magic',
        name: 'magic',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to maximum mana`
    },{
        id: 'agression',
        name: 'aggression',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to creatures attack`
    },{
        id: 'resilience',
        name: 'resilience',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to creatures HP`
    },{
        id: 'precision',
        name: 'precision',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to fighters precision`
    },{
        id: 'evasion',
        name: 'evasion',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to fighters evasion`
    },{
        id: 'creation',
        name: 'creation',
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to building speed`
    },{
        id: 'expansion',
        name: 'expansion',
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to territory gain`
    },{
        id: 'flasks',
        name: 'alchemist',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to flasks production`
    },{
        id: 'blacksmith',
        name: 'blacksmith',
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining'),
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to blacksmith production`
    },{
        id: 'armorer',
        name: 'armorer',
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining'),
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to armorer production`
    },{
        id: 'intellect',
        name: 'intellect',
        isUnlocked: () => true,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to research points production`
    },{
        id: 'agilityFlasks',
        name: 'agility alchemy',
        isUnlocked: () => BasicResearch.getResearchLevel('alchemy') > 0,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to agility flasks production`
    },{
        id: 'enduranceFlasks',
        name: 'endurance alchemy',
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy') > 0,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to endurance flasks production`
    },{
        id: 'aggressionFlasks',
        name: 'aggression alchemy',
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy') > 0,
        base: 0.01,
        getText: (amount) => `+${fmtVal(amount*100)}% to aggression flasks production`
    }];

    class HeirloomGenerator {

        static generateHeirloomStats(level, tier, quality = 1) {
            const bonuses = [];
            Array.from({ length: tier+1 }).forEach(() => {
                const available = heirloomEffects.filter(one => one.isUnlocked() && !bonuses.some(bonus => bonus.id === one.id));
                const index = Math.floor(Math.random()*available.length);
                const effect = available[index];
                const eff = (0.4 * Math.random() + 0.8) * level * effect.base;
                bonuses.push({
                    id: effect.id,
                    name: effect.name,
                    weight: effect.weight,
                    amount: eff,
                    text: effect.getText(eff * quality)
                });
            });
            return bonuses;
        }

        static reRollBonus(hr, bonusIndex) {
            const pTries = hr.bonuses[bonusIndex].rollTries || 0;
            hr.bonuses.splice(bonusIndex, 1);
            const available = heirloomEffects.filter(one => one.isUnlocked() && !hr.bonuses.some(bonus => bonus.id === one.id));
            const index = Math.floor(Math.random()*available.length);
            const effect = available[index];
            const eff = (0.4 * Math.random() + 0.8) * hr.level * effect.base;
            hr.bonuses.push({
                id: effect.id,
                name: effect.name,
                weight: effect.weight,
                amount: eff,
                text: effect.getText(eff * hr.quality),
                rollTries: pTries + 1,
            });
            hr.name = HeirloomGenerator.generateName(hr);
            return hr;
        }

        static chargeHeirloom(hr, times) {
            if(!hr.quality) {
                hr.quality = 1.;
            }
            hr.quality += times * 0.01;
            hr.bonuses.forEach((bonus, index) => {
                const effect = heirloomEffects.find(one => one.id === bonus.id);
                hr.bonuses[index].text = effect.getText(bonus.amount * hr.quality);
            });
            return hr;
        }

        static generateSuffix(bonuses) {
            let b = [...bonuses];
            const trailing = b.pop();
            if(!b.length) return trailing.name;
            return `${b.map(({ name }) => name).join(', ')} and ${trailing.name}`;
        }

        static generatePreffix(tier) {
            switch (tier) {
                case 0:
                    return 'Normal ';
                case 1:
                    return 'Empowered ';
                case 2:
                    return 'Rare ';
                case 3:
                    return 'Epic ';
                case 4:
                    return 'Legendary ';
                case 5:
                    return 'Ethereal ';
            }
        }

        static generateName(hr) {
            return `${HeirloomGenerator.generatePreffix(hr.tier)} talisman of ${HeirloomGenerator.generateSuffix(hr.bonuses)}`
        }

        static generateHeirloom(level, tier) {
            const bonuses = HeirloomGenerator.generateHeirloomStats(level, tier);
            const name = `${HeirloomGenerator.generatePreffix(tier)} talisman of ${HeirloomGenerator.generateSuffix(bonuses)}`;
            return {
                level,
                tier,
                name,
                bonuses,
                quality: 1,
            }
        }

        static generateProbabilityBased(level, prob) {
            const rn = Math.random();
            if(rn < prob) {
                const tr = Math.floor(4 * Math.pow(Math.random(), 8));
                const heirloom = HeirloomGenerator.generateHeirloom(level, tr);
                return heirloom;
            }
            return null;
        }

        static generateProbabilityBasedFromBoss(level, prob) {
            const rn = Math.random();
            if(rn < prob) {
                const tr = 1 + Math.floor(4 * Math.pow(Math.random(), 8));
                const heirloom = HeirloomGenerator.generateHeirloom(level, tr);
                return heirloom;
            }
            return null;
        }

        static generateChargeStonesLoot(level) {
            if(BasicResearch.getResearchLevel('heirloomCharging') <= 0) return 0;
            const chance = 0.002 * (1 + 0.05*BasicResearch.getResearchLevel('heirloomCharging'));
            if(Math.random() < chance) {
                return Math.floor(1 + Math.pow(level, 1.2) / 200);
            }
        }

    }

    class HeirloomCharge {

        static isUnlocked() {
            return BasicResearch.getResearchLevel('heirloomCharging') > 0;
        }

        static getPriceBase() {
            return 1.01;
        }

        static getPriceMult() {
            return 1.;
        }

        static chargePrice(quality, times = 1) {
            const pN = (quality - 1) * 100;
            // (mult * Math.pow(base,CreatureBasic.numCreatures)*(Math.pow(base, amt) - 1))/(base-1);
            return HeirloomCharge.getPriceMult()
                * Math.pow(HeirloomCharge.getPriceBase(), pN)
                * (Math.pow(HeirloomCharge.getPriceBase(), times) - 1) / (HeirloomCharge.getPriceBase() - 1);
        }

        static getMaxChargable(quality) {
            const stones = BasicResources.resources.chargeStones || 0;
            const pN = (quality - 1) * 100;

            let base = HeirloomCharge.getPriceBase();

            let mult = HeirloomCharge.getPriceMult();

            return Math.floor(Math.log(1 + stones * (base-1) / (mult * Math.pow(base,pN))) / Math.log(base));
        }

        static isAvailable(quality, times = 1) {
            const price = HeirloomCharge.chargePrice(quality, times);
            const stones = BasicResources.resources.chargeStones || 0;
            return price <= stones;
        }

        static getMetaForHeirloom(hr, times) {
            const max = HeirloomCharge.getMaxChargable(hr.quality);
            return {
                isChargeUnlocked: HeirloomCharge.isUnlocked(),
                isChargeAvailable: HeirloomCharge.isAvailable(hr.quality, times),
                chargePrice: HeirloomCharge.chargePrice(hr.quality, times),
                maxAmountChargeable: max,
                priceForMax: HeirloomCharge.chargePrice(hr.quality, max)
            }
        }

        static scrapHeirloom(hr) {
            const quality = hr.quality;
            const pN = (quality - 1) * 100;
            const price = HeirloomCharge.chargePrice(1, pN);
            BasicResources.add('chargeStones', price * 0.25);
        }

    }

    class BasicHeirlooms {

        static state = {
            applied: [],
            saved: [],
            inventory: [],
            filterMinTier: 0,
            chargeAmount: 1,
        }

        static initialize(isBannerPrestige) {
            if(!BasicHeirlooms.state || !isBannerPrestige) {
                BasicHeirlooms.state = {
                    applied: [null, null],
                    saved: Array.from({ length: BasicHeirlooms.getMaxSaved()}).map(one => null),
                    inventory: [],
                    filterMinTier: 0,
                };
            }
            BasicHeirlooms.state.inventory = Array.from({ length: 10 });
            BasicHeirlooms.state.chargeAmount = BasicHeirlooms.state.chargeAmount || 1;
            return BasicHeirlooms.state;
        }

        static haveItems(arr) {
            return arr.filter(one => one != null).length > 0
        }

        static getMaxSaved() {
            return 1 + BasicResearch.getResearchLevel('compactHeirloom');
        }

        static getMaxApplied() {
            return 2;
        }

        static getTotalBonus(id) {
            let total = 0;
            BasicHeirlooms.state.applied.forEach(item => {
                if(!item) {
                    return;
                }
                const ef = item.bonuses.find(one => one.id === id);
                if(ef) {
                    total += ef.amount * (item.quality || 1.);
                }
            });
            return total;
        }

        static setMinTier(tierId) {
            BasicHeirlooms.state.filterMinTier = tierId;
        }

        static giveToPlayer(heirloom) {
            const fInd = BasicHeirlooms.state.inventory.findIndex(one => one == null);
            if(BasicHeirlooms.state.filterMinTier && heirloom.tier < BasicHeirlooms.state.filterMinTier) return;
            if(fInd > -1) {
                BasicHeirlooms.state.inventory[fInd] = heirloom;
            }
        }

        static dropItem(fromKey, fromIndex) {
            if(!BasicHeirlooms.state[fromKey][fromIndex]) {
                return;
            }
            if(BasicHeirlooms.state[fromKey][fromIndex].quality > 1) {
                HeirloomCharge.scrapHeirloom(BasicHeirlooms.state[fromKey][fromIndex]);
            }
            BasicHeirlooms.state[fromKey][fromIndex] = null;
        }

        static setChargeAmount(times) {
            if(!times || Number.isNaN(+times) || times < 1) {
                times = 1;
            }
            if(times > 10000) {
                times = 10000;
            }
            BasicHeirlooms.state.chargeAmount = times;
        }

        static chargeItem(fromKey, fromIndex, times) {
            if(!HeirloomCharge.isUnlocked()) return;

            if(!BasicHeirlooms.state[fromKey][fromIndex]) {
                return;
            }

            let hr = BasicHeirlooms.state[fromKey][fromIndex];

            if(!HeirloomCharge.isAvailable(hr.quality, times)) return;

            const price = HeirloomCharge.chargePrice(hr.quality, times);

            hr = HeirloomGenerator.chargeHeirloom(hr, times);

            BasicResources.subtract('chargeStones', price);

            BasicHeirlooms.state[fromKey][fromIndex] = hr;

        }

        static reRollStat(fromKey, fromIndex, bonusIndex) {
            if(!BasicHeirlooms.state[fromKey][fromIndex]) {
                return;
            }
            if(!BasicHeirlooms.state[fromKey][fromIndex].bonuses[bonusIndex]) {
                return;
            }
            const stats = BasicHeirlooms.processCalculatedStats(BasicHeirlooms.state[fromKey][fromIndex]);

            if(!stats.bonuses[bonusIndex].isRollAvailable) {
                return;
            }
            const price = stats.bonuses[bonusIndex].rollPrice;
            if(BasicResources.getResource('memoryStones') >= price) {
                BasicHeirlooms.state[fromKey][fromIndex] = HeirloomGenerator.reRollBonus(BasicHeirlooms.state[fromKey][fromIndex], bonusIndex);
                BasicResources.subtract('memoryStones', price);
            }
        }

        static itemToSlot(fromKey, fromIndex, toKey, toIndex) {
            if(!BasicHeirlooms.state[fromKey][fromIndex]) {
                return;
            }
            const item = {...BasicHeirlooms.state[fromKey][fromIndex]};

            const toCopy = BasicHeirlooms.state[toKey][toIndex];
            if(toCopy) {
                BasicHeirlooms.state[fromKey][fromIndex] = {...toCopy};
            } else {
                BasicHeirlooms.state[fromKey][fromIndex] = null;
            }
            BasicHeirlooms.state[toKey][toIndex] = item;
        }

        static processCalculatedStats(heirloom) {
            if(!heirloom) {
                return null;
            }
            if(!heirloom.quality) {
                heirloom.quality = 1;
            }
            const haveRolledIndex = heirloom.bonuses.findIndex(one => !!one.rollTries);
            heirloom.bonuses.forEach((bonus, index) => {
                if(BasicResearch.getResearchLevel('crafting')) {
                    bonus.isRollBlocked = (haveRolledIndex > -1) && (haveRolledIndex !== index);
                    bonus.isRollAvailable = !bonus.isRollBlocked;
                    bonus.rollPrice = heirloom.level * Math.pow(5, bonus.rollTries || 0);
                    bonus.isEnoughStones = bonus.rollPrice <= BasicResources.getResource('memoryStones');
                } else {
                    bonus.isRollAvailable = false;
                    bonus.isRollBlocked = false;
                }
                heirloom.bonuses[index] = bonus;
            });
            return {
                ...heirloom,
                ...HeirloomCharge.getMetaForHeirloom(heirloom, BasicHeirlooms.state.chargeAmount)
            };
        }

        static calculateArray(heirlooms) {
            return heirlooms.map(one => one === null ? one : BasicHeirlooms.processCalculatedStats(one));
        }

        static calculateState() {
            return {
                ...BasicHeirlooms.state,
                inventory: BasicHeirlooms.calculateArray(BasicHeirlooms.state.inventory),
                saved: BasicHeirlooms.calculateArray(BasicHeirlooms.state.saved),
                applied: BasicHeirlooms.calculateArray(BasicHeirlooms.state.applied)
            }
        }

        static process() {
            if(!BasicHeirlooms.state?.saved) return;
            const max = BasicHeirlooms.getMaxSaved();
            if(BasicHeirlooms.state.saved.length < max) {
                const toAdd = max - BasicHeirlooms.state.saved.length;
                BasicHeirlooms.state.saved.push(...Array.from({ length: toAdd }).map(one => null));
            }
        }

        static sendToUI() {
            ColibriWorker.sendToClient('set_heirlooms_state', BasicHeirlooms.calculateState());
        }

        static heirloomsUnlocked() {
            return BasicHeirlooms.haveItems(BasicHeirlooms.state.inventory)
                || BasicHeirlooms.haveItems(BasicHeirlooms.state.saved)
                || BasicHeirlooms.haveItems(BasicHeirlooms.state.applied)
        }

    }

    const auraData = [{
        id: 'gold',
        name: 'Greediness',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to gold income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'goldBase',
        name: 'Greediness',
        baseEffect: 50,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to gold income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'goldMax',
        name: 'Saving',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to gold maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'goldMaxBase',
        name: 'Saving',
        baseEffect: 500,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to gold maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'energy',
        name: 'Energizer',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to energy income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'energyBase',
        name: 'Energizer',
        baseEffect: 25,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to energy income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'energyMax',
        name: 'Endurance',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to energy maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'energyMaxBase',
        name: 'Endurance',
        baseEffect: 250,
        baseGrowth: 4,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to energy maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'mana',
        name: 'Wizard',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to mana income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'manaBase',
        name: 'Wizard',
        baseEffect: 15,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to mana income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'manaMax',
        name: 'Wisdom',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to mana maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'manaMaxBase',
        name: 'Wisdom',
        baseEffect: 100,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to mana maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'souls',
        name: 'Souls harvest',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to souls income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'soulsBase',
        name: 'Souls harvest',
        baseEffect: 1,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to souls income`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'herbsMax',
        name: 'Herbalism',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to herbs maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'herbsMaxBase',
        name: 'Herbalism',
        baseEffect: 1,
        baseGrowth: 1,
        expBase: 1.15,
        effectText: (amount) => `+${fmtVal(amount)} to herbs maximum`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'research',
        name: 'Scientist',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to research gain`,
        rarity: 1,
        isUnlocked: () => BasicResearch.isResearchUnlocked(),
    },{
        id: 'territory',
        name: 'Expansion',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to territory gain`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
    },{
        id: 'wood',
        name: 'Woodcutter',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to wood income`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
    },{
        id: 'woodMax',
        name: 'Woodstock',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to wood max`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
    },{
        id: 'stone',
        name: 'Stonecutter',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to stone income`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
    },{
        id: 'stoneMax',
        name: 'Stonepile',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to stone max`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
    },{
        id: 'ore',
        name: 'Miner',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to ore income`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining') > 0,
    },{
        id: 'oreMax',
        name: 'Ore stock',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to ore max`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining') > 0,
    },{
        id: 'evasion',
        name: 'Evasion',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to creatures evasion`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'evasionBase',
        name: 'Evasion',
        baseEffect: 0.5,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount)} to creatures evasion`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'accuracy',
        name: 'Accuracy',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to creatures accuracy`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'accuracyBase',
        name: 'Accuracy',
        baseEffect: 0.5,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount)} to creatures accuracy`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'health',
        name: 'Health',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to creatures HP`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'healthBase',
        name: 'Health',
        baseEffect: 0.2,
        baseGrowth: 0.1,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount)} to creatures HP`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'damage',
        name: 'Damage',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to creatures damage`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'damageBase',
        name: 'Damage',
        baseEffect: 0.04,
        baseGrowth: 0.1,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount)} to creatures damage`,
        rarity: 1,
        isUnlocked: () => true,
    },{
        id: 'flasksOfAgility',
        name: 'Agility alchemy',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to flasks of agility income`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('alchemy') > 0,
    },{
        id: 'flasksOfEndurance',
        name: 'Endurance alchemy',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to flasks of endurance income`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy') > 0,
    },{
        id: 'flasksOfAggression',
        name: 'Aggression alchemy',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to flasks of aggression income`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy') > 0,
    },{
        id: 'building',
        name: 'Building',
        baseEffect: 0.01,
        baseGrowth: 0.2,
        expBase: 1.03,
        effectText: (amount) => `+${fmtVal(amount*100)}% to building speed`,
        rarity: 1,
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
    }];

    class AuraStats {

        static getMaxXp(aura) {
            return 1000 * Math.pow(1.2, aura.level);
        }

        static addAuraProgress(aura, invested) {
            if(!aura.maxXp) {
                aura.maxXp = AuraStats.getMaxXp(aura);
            }
            if(Number.isNaN(invested) || invested <= 0) {
                invested = 0;
            }
            aura.xp += Math.pow(invested, 0.5) / 10;
            if(aura.xp >= aura.maxXp) {
                aura.xp = 0;
                aura.level++;
                aura.maxXp = AuraStats.getMaxXp(aura);
            }
        }

        static calculateTotalBonus(bonus, level, charge = 1.0) {
            const bonusDB = auraData.find(one => one.id === bonus.id);
            bonus.effect = charge * bonus.baseEff * (1 + bonus.baseGrowth * level * Math.pow(bonus.expBase, level));
            bonus.text = bonusDB.effectText(bonus.effect);
            return bonus;
        }

        static getRealAuraBonus(auraData) {
            if(!auraData.charge || Number.isNaN(auraData.charge)) {
                auraData.charge = 1.0;
            }
            for(let i = 0; i < auraData.bonuses.length; i++) {
                auraData.bonuses[i] = AuraStats.calculateTotalBonus(auraData.bonuses[i], auraData.level, auraData.charge);
            }
            return auraData;
        }

        static getPlainData(auraData) {
            if(!auraData.uuid) {
                auraData.uuid = v4();
            }
            if(!auraData.charge || Number.isNaN(auraData.charge)) {
                auraData.charge = 1.0;
            }
            const nw = AuraStats.getRealAuraBonus(auraData);
            return {
                ...nw,
                bonuses: nw.bonuses.map(({ effect, text }) => ({ effect, text })),
            }
        }

    }

    class AurasCharge {

        static isUnlocked() {
            return BasicResearch.getResearchLevel('auraCharging') > 0;
        }

        static getPriceBase() {
            return 1.01;
        }

        static getPriceMult() {
            return 1.;
        }

        static chargePrice(charge, times = 1) {
            const pN = (charge - 1) * 100;
            // (mult * Math.pow(base,CreatureBasic.numCreatures)*(Math.pow(base, amt) - 1))/(base-1);
            return AurasCharge.getPriceMult()
                * Math.pow(AurasCharge.getPriceBase(), pN)
                * (Math.pow(AurasCharge.getPriceBase(), times) - 1) / (AurasCharge.getPriceBase() - 1);
        }

        static getMaxChargable(charge) {
            const stones = BasicResources.resources.chargeGems || 0;
            const pN = (charge - 1) * 100;

            let base = AurasCharge.getPriceBase();

            let mult = AurasCharge.getPriceMult();

            return Math.floor(Math.log(1 + stones * (base-1) / (mult * Math.pow(base,pN))) / Math.log(base));
        }

        static isAvailable(charge, times = 1) {
            const price = AurasCharge.chargePrice(charge, times);
            const stones = BasicResources.resources.chargeGems || 0;
            return price <= stones;
        }

        static getMetaForAura(hr, times) {
            const max = AurasCharge.getMaxChargable(hr.charge);
            return {
                isChargeUnlocked: AurasCharge.isUnlocked(),
                isChargeAvailable: AurasCharge.isAvailable(hr.charge, times),
                chargePrice: AurasCharge.chargePrice(hr.charge, times),
                maxAmountChargeable: max,
                priceForMax: AurasCharge.chargePrice(hr.charge, max)
            }
        }

        static scrapAura(hr) {
            const charge = hr.charge;
            const pN = (charge - 1) * 100;
            const price = AurasCharge.chargePrice(1, pN);
            BasicResources.add('chargeGems', price * 0.25);
        }

    }

    class AurasPresets {

        static state = {
            presets: [],
            edited: null,
            activePreset: '',
        }

        static initialize(isBannerPrestige) {
            console.log('Preset init called!!!');
            if(!isBannerPrestige || !AurasPresets.state) {
                AurasPresets.state = {
                    presets: [],
                    edited: null,
                    activePreset: '',
                };
            }
            return AurasPresets.state;
        }

        static initializePreset() {
            return {
                name: 'New Preset',
                auras: [],
                max: BasicAuras.getMax(),
            }
        }

        static setUsedPreset(id) {
            AurasPresets.state.activePreset = id;
        }

        static validateNormalizeRules(auras) {
            const aurasList = BasicAuras.state.auras;
            let validatedAuras = [];

            let totlEffort = 0;

            auras.forEach(({uuid, effort}, index) => {
                if(!aurasList.find(aura => aura.uuid === uuid)) {
                    return;
                }
                if(validatedAuras.length >= BasicAuras.getMax()) {
                    return;
                }
                validatedAuras.push({ uuid, effort });
                totlEffort += effort;
            });

            if(totlEffort > 1) {
                validatedAuras = validatedAuras.map(one => ({
                    ...one,
                    effort: one.effort / totlEffort,
                }));
            }

            return validatedAuras;
        }

        static savePreset(isNew, data) {
            let id = data.id;
            if(isNew) {
                id = v4();
            }
            if(!id) {
                console.error('id is required in existing preset');
                return;
            }
            const existingWithName = AurasPresets.state.presets.find(one => one.id !== id && one.name === data.name);
            if(existingWithName) {
                console.error('Preset with such name already exists');
                return;
            }
            let objToSave = {
                id,
                name: data.name,
                auras: AurasPresets.validateNormalizeRules(data.auras)
            };
            let foundIndex = AurasPresets.state.presets.findIndex(one => one.id === id);
            if(foundIndex < 0) {
                AurasPresets.state.presets.push(objToSave);
            } else {
                AurasPresets.state.presets[foundIndex] = objToSave;
            }
            console.log('newPresets: ', AurasPresets.state.presets);
        }

        static assignAccordingToPreset(aurasList) {
            if(!AurasPresets.state.activePreset) return;
            const preset = AurasPresets.state.presets.find(one => one.id === AurasPresets.state.activePreset);
            if(!preset) return;
            const auras = preset.auras;

            const activeIndexes = [];
            auras.forEach(({uuid, effort}) => {
                const index = aurasList.findIndex(one => one.uuid === uuid);
                if(index > -1) {
                    activeIndexes.push({index, effort});
                }
            });
            return { activeIndexes };
        }

        static getState() {
            return {
                ...AurasPresets.state,
                defaultPreset: AurasPresets.initializePreset(),
            }
        }

    }

    class BasicAuras {

        static state = {
            activeIndexes: [],
            auras: [],
            currentBonus: {},
            filterMinTier: 0,
            filterMinQuality: 0,
            chargeAmount: 1,
        }

        static initialize(isBannerPrestige) {
            if(!BasicAuras.state || !isBannerPrestige) {
                BasicAuras.state = {
                    activeIndexes: [],
                    auras: [],
                    chargeAmount: 1,
                };
            }
            return BasicAuras.state;
        }

        static getCurrentAurasBonus() {
            if(!BasicAuras.state.activeIndexes.length) {
                return {};
            }
            const currents = BasicAuras.state.activeIndexes.map(({index}) => BasicAuras.state.auras[index]);
            const calculated = currents.map(current => AuraStats.getRealAuraBonus(current));
            const bonuses = {};
            calculated.forEach(one => {
                one.bonuses.forEach(bonus => {
                    if(!bonuses[bonus.id]) {
                        bonuses[bonus.id] = 0;
                    }
                    bonuses[bonus.id] += bonus.effect;
                });
            });
            return bonuses;
        }

        static getList() {
            return BasicAuras.state.auras.map((one, index) => ({
                ...AuraStats.getPlainData(one),
                isTurnedOn: !!BasicAuras.state.activeIndexes.find(one => one.index === index),
                effort: BasicAuras.state.activeIndexes.find(one => one.index === index)?.effort,
                index,
                ...AurasCharge.getMetaForAura(one, BasicAuras.state.chargeAmount)
            }));
        }

        static setMinTier(tierId) {
            BasicAuras.state.filterMinTier = tierId;
        }

        static setMinQuality(quality) {
            BasicAuras.state.filterMinQuality = quality;
        }

        static giveToPlayer(aura) {
            if(!aura.uuid) {
                aura.uuid = v4();
            }
            if(BasicAuras.state.auras.length > 50) return;
            if(BasicAuras.state.filterMinTier && aura.tier < BasicAuras.state.filterMinTier) return;
            if(BasicAuras.state.filterMinQuality && !Number.isNaN(BasicAuras.state.filterMinQuality)
            && BasicAuras.state.filterMinQuality > aura.quality) return;
            BasicAuras.state.auras.push(aura);
        }

        static dropAura(index) {
            BasicAuras.state.activeIndexes.forEach(({ index: itInd }, i) => {
                if(itInd === index) {
                    BasicAuras.state.activeIndexes.splice(
                        i,
                        1
                    );
                } else if (itInd > index) {
                    BasicAuras.state.activeIndexes[i].index--;
                }
            });
            if(BasicAuras.state.auras[index]) {
                AurasCharge.scrapAura(BasicAuras.state.auras[index]);
            }
            BasicAuras.state.auras.splice(index, 1);
        }

        static setChargeAmount(times) {
            if(!times || Number.isNaN(+times) || times < 1) {
                times = 1;
            }
            if(times > 10000) {
                times = 10000;
            }
            BasicAuras.state.chargeAmount = times;
        }

        static chargeItem(index, times) {
            if(!AurasCharge.isUnlocked()) return;

            if(index < 0 || index >= BasicAuras.state.auras.length) {
                return;
            }

            let aura = BasicAuras.state.auras[index];

            if(!AurasCharge.isAvailable(aura.charge, times)) return;

            const price = HeirloomCharge.chargePrice(aura.charge, times);

            aura.charge += 0.01*times;

            BasicResources.subtract('chargeGems', price);

            BasicAuras.state.auras[index] = aura;

        }

        static getMax() {
            return BasicResearch.getResearchLevel('auras');
        }

        static toggleActivate(index) {
            if(BasicAuras.state.activeIndexes.find(one => one.index === index)) {
                BasicAuras.state.activeIndexes.splice(
                    BasicAuras.state.activeIndexes.findIndex(one => one.index === index),
                    1
                );
            } else {
                if(BasicAuras.state.activeIndexes.length < BasicAuras.getMax()) {
                    BasicAuras.state.activeIndexes.push({index, effort: 0});
                } else {
                    BasicAuras.state.activeIndexes[BasicAuras.state.activeIndexes.length-1] = {index, effort: 0};
                }
            }
        }

        static getTotalInvested() {
            return BasicAuras.state.activeIndexes.reduce((acc, item) => acc += item.effort, 0);
        }

        static setEffort(index, effort) {
            const activeIndex = BasicAuras.state.activeIndexes.findIndex(one => one.index === index);
            const investedTotal = BasicAuras.getTotalInvested();
            const oldInvested = BasicAuras.state.activeIndexes[activeIndex].effort;
            BasicAuras.state.activeIndexes[activeIndex].effort = Math.min(effort, 1 - investedTotal + oldInvested);
        }

        static getEffect(id) {
            return BasicAuras.state.currentBonus?.[id] || 0;
        }

        static getTotalBonuses(auras) {
            const list = auras
                .map(({ index }) => BasicAuras.state.auras[index])
                .filter(one => !!one);

            const totalBonuses = list
                .map(aura => AuraStats.getRealAuraBonus(aura))
                .reduce((acc, one) => {
                    one.bonuses.forEach(bonus => {
                        if(!acc[bonus.id]) {
                            acc[bonus.id] = 0;
                        }
                        acc[bonus.id] += bonus.effect;

                    });
                    return acc;
                }, {});

            return totalBonuses;
        }

        static getBalanceById(id, auras) {
            let totl = 0;
            let state = auras || BasicAuras.state.activeIndexes;
            if(id === 'mana') {
                if(state.length) {
                    const manaIncome = BasicResources.getBalance(resourcesData.find(one => one.id === 'mana'), { auras: [] });
                    if(manaIncome > 0) {
                        totl -= manaIncome * state.reduce((acc, one) => acc += one.effort, 0);
                    }
                }
            }
            return totl;
        }

        static process(dT) {
            BasicAuras.state.auras.forEach((aura, index) => {
                if(!aura.uuid) {
                    BasicAuras.state.auras[index].uuid = v4();
                }
            });
            const manaIncome = BasicResources.getBalance(resourcesData.find(one => one.id === 'mana'), { auras: [] });
            if(manaIncome <= 0) return;
            BasicAuras.state.activeIndexes.forEach((one, ind) => {
                if(!BasicAuras.state.auras[one.index]) {
                    console.error('Aura not found');
                    BasicAuras.state.activeIndexes.splice(ind, 1);
                }
                AuraStats.addAuraProgress(BasicAuras.state.auras[one.index], one.effort * dT * manaIncome);

                // take in play absolute resources increments here
            });
            BasicAuras.state.currentBonus = BasicAuras.getTotalBonuses(BasicAuras.state.activeIndexes);
            // console.log('curBonus: ', BasicAuras.state.currentBonus);
        }


        static sendToUI() {
            ColibriWorker.sendToClient('set_auras_state', {
                list: BasicAuras.getList(),
                current: BasicAuras.state.activeIndexes,
                currentBonus: BasicAuras.state.currentBonus,
                filterMinTier: BasicAuras.state.filterMinTier,
                filterMinQuality: BasicAuras.state.filterMinQuality,
                chargeAmount: BasicAuras.state.chargeAmount,
                presets: AurasPresets.getState(),
                max: BasicAuras.getMax(),
            });
        }

        static aurasUnlocked() {
            return BasicResearch.getResearchLevel('auras') > 0;
        }

        static updatePreset(id) {
            AurasPresets.setUsedPreset(id);
            if(id) {
                const indexes = AurasPresets.assignAccordingToPreset(BasicAuras.state.auras);
                console.log('Selected indexes: ', indexes);
                BasicAuras.state.activeIndexes = indexes.activeIndexes.map(({ index, effort }) => ({
                    index,
                    effort,
                }));
            }
        }

    }

    const bossesData = [{
        name: 'Big skeleton',
        quantity: 1,
        damage: 411,
        maxHP: 300000,
        defense: 12,
        armor: 25,
        accuracy: 1800,
        evasion: 2400,
        critChance: 0.1,
        critMult: 2,
    },{
        name: 'Bones Breaker',
        quantity: 1,
        damage: 2022,
        maxHP: 425000,
        defense: 12,
        armor: 125,
        accuracy: 4800,
        evasion: 3400,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Abomination',
        quantity: 1,
        damage: 10240,
        maxHP: 999990,
        defense: 32,
        armor: 14,
        accuracy: 5700,
        evasion: 1400,
        critChance: 0.5,
        critMult: 5,
    },{
        name: 'Bandit Skeleton',
        quantity: 1,
        damage: 30240,
        maxHP: 2050000,
        defense: 32,
        armor: 440,
        accuracy: 12700,
        evasion: 14000,
        critChance: 0.5,
        critMult: 2,
    },{
        name: 'Lich',
        quantity: 1,
        damage: 70240,
        maxHP: 6480000,
        defense: 32,
        armor: 1400,
        accuracy: 21400,
        evasion: 1400,
        critChance: 0.2,
        critMult: 2,
    },{
        name: 'Awesome Skeleton Warriors',
        quantity: 1,
        damage: 273167,
        maxHP: 9750000,
        defense: 32,
        armor: 7400,
        accuracy: 71400,
        evasion: 1400,
        critChance: 0.1,
        critMult: 3,
    },{
        name: 'The Shadow',
        quantity: 1,
        damage: 670240,
        maxHP: 10750000,
        defense: 16,
        armor: 18,
        accuracy: 12140000,
        evasion: 675000,
        critChance: 0.75,
        critMult: 3,
    },{
        name: 'Million of Rats',
        quantity: 1000000,
        damage: 120,
        maxHP: 225,
        defense: 1,
        armor: 1,
        accuracy: 2040000,
        evasion: 140000,
        critChance: 0.2,
        critMult: 1.6,
    },{
        name: 'Mavka',
        quantity: 1,
        damage: 3.e+6,
        maxHP: 5.e+8,
        defense: 16,
        armor: 18000,
        accuracy: 6214000,
        evasion: 187500,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'The Beast of the Moor',
        quantity: 1,
        damage: 1.e+7,
        maxHP: 1.e+9,
        defense: 16,
        armor: 3.e+4,
        accuracy: 2.e+7,
        evasion: 999,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'Leviathan',
        quantity: 1,
        damage: 3.e+7,
        maxHP: 2.e+9,
        defense: 16,
        armor: 1.e+2,
        accuracy: 2.e+7,
        evasion: 879039,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'Ancient Spearmen',
        quantity: 1,
        damage: 6.e+7,
        maxHP: 4.e+9,
        defense: 448,
        armor: 1.e+4,
        accuracy: 6.e+7,
        evasion: 400000,
        critChance: 0.6,
        critMult: 2.5,
    },{
        name: 'Ancient Axeman',
        quantity: 1,
        damage: 9.e+7,
        maxHP: 8.e+9,
        defense: 675,
        armor: 1.4e+4,
        accuracy: 9.e+7,
        evasion: 900000,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Ancient Swordsman',
        quantity: 1,
        damage: 3.e+8,
        maxHP: 2.25e+10,
        defense: 1675,
        armor: 1.4e+4,
        accuracy: 4.e+8,
        evasion: 9.e+6,
        critChance: 0.4,
        critMult: 3,
    },{
        name: 'Swordsman legion',
        quantity: 1000,
        damage: 1.e+6,
        maxHP: 2.25e+8,
        defense: 1675,
        armor: 1.4e+4,
        accuracy: 9.e+8,
        evasion: 9.e+6,
        critChance: 0.4,
        critMult: 3,
    },{
        name: 'Stone golem',
        quantity: 1,
        damage: 4.e+9,
        maxHP: 7.25e+11,
        defense: 1675,
        armor: 9.4e+5,
        accuracy: 4.e+9,
        evasion: 6.e+5,
        critChance: 0.1,
        critMult: 2,
    },{
        name: 'Iron golem',
        quantity: 1,
        damage: 9.e+9,
        maxHP: 3.25e+12,
        defense: 10675,
        armor: 9.4e+6,
        accuracy: 9.e+9,
        evasion: 6.e+5,
        critChance: 0.1,
        critMult: 2,
    },{
        name: 'Titanium golem',
        quantity: 1,
        damage: 1.8e+10,
        maxHP: 6.25e+12,
        defense: 10675,
        armor: 1.4e+7,
        accuracy: 9.e+10,
        evasion: 6.e+5,
        critChance: 0.1,
        critMult: 2,
    },{
        name: 'Diamond golem',
        quantity: 1,
        damage: 2.6e+10,
        maxHP: 1.35e+13,
        defense: 19675,
        armor: 1.9e+7,
        accuracy: 9.e+10,
        evasion: 6.e+5,
        critChance: 0.1,
        critMult: 2,
    },{
        name: 'Succubus',
        quantity: 1,
        damage: 2.6e+11,
        maxHP: 1.85e+13,
        defense: 19675,
        armor: 4.e+6,
        accuracy: 1.7e+12,
        evasion: 4.e+8,
        critChance: 0.4,
        critMult: 8,
    },{
        name: 'Imps',
        quantity: 100,
        damage: 2.0e+10,
        maxHP: 1.45e+12,
        defense: 19675,
        armor: 6.e+6,
        accuracy: 5.7e+12,
        evasion: 6.e+9,
        critChance: 0.4,
        critMult: 8,
    },{
        name: 'Enforced Imps',
        quantity: 100,
        damage: 5.1e+10,
        maxHP: 7.45e+12,
        defense: 29675,
        armor: 6.e+7,
        accuracy: 5.7e+12,
        evasion: 6.e+9,
        critChance: 0.4,
        critMult: 8,
    },{
        name: 'The Doomed One',
        quantity: 1,
        damage: 2.6e+13,
        maxHP: 1.85e+15,
        defense: 19675,
        armor: 4.e+9,
        accuracy: 1.7e+13,
        evasion: 4.e+12,
        critChance: 0.4,
        critMult: 8,
    },{
        name: 'Small Demon',
        quantity: 1,
        damage: 6.4e+13,
        maxHP: 7.85e+15,
        defense: 39675,
        armor: 9.e+9,
        accuracy: 3.4e+13,
        evasion: 7.e+12,
        critChance: 0.2,
        critMult: 6,
    },{
        name: 'Agile Demon',
        quantity: 1,
        damage: 6.9e+13,
        maxHP: 7.85e+16,
        defense: 39675,
        armor: 9.e+9,
        accuracy: 3.4e+15,
        evasion: 7.e+13,
        critChance: 0.2,
        critMult: 6,
    },{
        name: 'Reinforced Demon',
        quantity: 1,
        damage: 6.9e+13,
        maxHP: 2.85e+17,
        defense: 1.e+10,
        armor: 9.e+11,
        accuracy: 3.4e+15,
        evasion: 7.e+13,
        critChance: 0.2,
        critMult: 6,
    },{
        name: 'Snipe Demon',
        quantity: 1,
        damage: 6.9e+13,
        maxHP: 6.45e+17,
        defense: 1.e+9,
        armor: 9.e+10,
        accuracy: 3.4e+15,
        evasion: 7.e+13,
        critChance: 0.5,
        critMult: 12,
    },{
        name: 'Azazel',
        quantity: 1,
        damage: 1.9e+14,
        maxHP: 1.45e+18,
        defense: 1.e+11,
        armor: 9.e+12,
        accuracy: 3.4e+16,
        evasion: 7.e+14,
        critChance: 0.15,
        critMult: 2,
    },{
        name: 'Living Stone',
        quantity: 1,
        damage: 6.9e+14,
        maxHP: 7.45e+18,
        defense: 1.e+12,
        armor: 9.e+12,
        accuracy: 7.4e+16,
        evasion: 9.1e+14,
        critChance: 0.15,
        critMult: 2,
    },{
        name: 'Ghoul',
        quantity: 1,
        damage: 1.9e+15,
        maxHP: 2.45e+19,
        defense: 1.e+13,
        armor: 7.e+13,
        accuracy: 9.4e+16,
        evasion: 2.1e+15,
        critChance: 0.15,
        critMult: 2,
    },{
        name: 'Snipe Ghoul',
        quantity: 1,
        damage: 1.9e+15,
        maxHP: 2.45e+19,
        defense: 1.e+13,
        armor: 7.e+13,
        accuracy: 9.4e+16,
        evasion: 2.1e+16,
        critChance: 0.5,
        critMult: 5,
    },{
        name: 'Ghost Peasant',
        quantity: 1,
        damage: 2.9e+15,
        maxHP: 2.45e+19,
        defense: 1.e+13,
        armor: 7.e+13,
        accuracy: 9.4e+16,
        evasion: 2.1e+16,
        critChance: 0.15,
        critMult: 2,
    },{
        name: 'Ghost Swordsman',
        quantity: 1,
        damage: 4.9e+15,
        maxHP: 3.45e+19,
        defense: 1.e+14,
        armor: 7.e+10,
        accuracy: 9.4e+17,
        evasion: 1.1e+17,
        critChance: 0.45,
        critMult: 6,
    },{
        name: 'Ghost Axeman',
        quantity: 1,
        damage: 9.9e+15,
        maxHP: 8.45e+19,
        defense: 1.e+14,
        armor: 7.e+10,
        accuracy: 9.4e+17,
        evasion: 1.8e+17,
        critChance: 0.25,
        critMult: 4,
    },{
        name: 'Ghost Pikeman',
        quantity: 1,
        damage: 4.9e+16,
        maxHP: 1.45e+20,
        defense: 1.e+14,
        armor: 7.e+10,
        accuracy: 9.4e+17,
        evasion: 4.8e+17,
        critChance: 0.25,
        critMult: 4,
    },{
        name: 'Ghost Champion',
        quantity: 1,
        damage: 9.9e+16,
        maxHP: 1.45e+21,
        defense: 1.e+15,
        armor: 7.e+14,
        accuracy: 1.4e+18,
        evasion: 4.8e+17,
        critChance: 0.4,
        critMult: 7,
    },{
        name: 'Lost Souls',
        quantity: 1000,
        damage: 9.9e+14,
        maxHP: 9.45e+18,
        defense: 1.e+15,
        armor: 7.e+14,
        accuracy: 1.4e+18,
        evasion: 4.8e+17,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Azragards Servant',
        quantity: 1,
        damage: 1.9e+17,
        maxHP: 1.45e+22,
        defense: 1.e+15,
        armor: 7.e+15,
        accuracy: 1.4e+19,
        evasion: 1.8e+18,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'Small Wyvern',
        quantity: 1,
        damage: 2.9e+17,
        maxHP: 3.45e+22,
        defense: 2.e+15,
        armor: 7.e+15,
        accuracy: 1.4e+19,
        evasion: 4.8e+18,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'Medium Wyvern',
        quantity: 1,
        damage: 6.7e+17,
        maxHP: 1.15e+23,
        defense: 2.e+15,
        armor: 7.e+15,
        accuracy: 1.4e+19,
        evasion: 7.2e+18,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'Big Wyvern',
        quantity: 1,
        damage: 8.02e+18,
        maxHP: 5.47e+23,
        defense: 4.e+15,
        armor: 7.e+16,
        accuracy: 1.4e+19,
        evasion: 9.6e+18,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'The Great Lizard',
        quantity: 1,
        damage: 1.72e+19,
        maxHP: 1.47e+24,
        defense: 1.e+16,
        armor: 2.e+17,
        accuracy: 3.4e+19,
        evasion: 1.6e+19,
        critChance: 0.2,
        critMult: 3,
    },{
        name: 'Perfect Ghost Warrior',
        quantity: 1,
        damage: 4.72e+19,
        maxHP: 6.47e+24,
        defense: 5.e+16,
        armor: 5.e+17,
        accuracy: 7.2e+19,
        evasion: 3.6e+19,
        critChance: 0.1,
        critMult: 4,
    },{
        name: 'Perfect Ghost Swordsman',
        quantity: 1,
        damage: 9.72e+19,
        maxHP: 2.43e+25,
        defense: 2.e+17,
        armor: 2.e+18,
        accuracy: 1.2e+20,
        evasion: 6.6e+19,
        critChance: 0.4,
        critMult: 3,
    },{
        name: 'Perfect Ghost Axeman',
        quantity: 1,
        damage: 2.72e+20,
        maxHP: 1.43e+26,
        defense: 2.e+17,
        armor: 2.e+18,
        accuracy: 3.2e+20,
        evasion: 1.1e+20,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Perfect Ghost Spearman',
        quantity: 1,
        damage: 2.72e+21,
        maxHP: 1.43e+26,
        defense: 2.e+17,
        armor: 2.e+18,
        accuracy: 3.2e+20,
        evasion: 1.1e+20,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Perfect Ghost Paladin',
        quantity: 1,
        damage: 5.42e+21,
        maxHP: 1.43e+27,
        defense: 2.e+18,
        armor: 2.e+19,
        accuracy: 7.2e+20,
        evasion: 2.1e+20,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Perfect Ghost Pikeman',
        quantity: 1,
        damage: 7.65e+22,
        maxHP: 5.25e+27,
        defense: 2.e+18,
        armor: 7.e+18,
        accuracy: 3.2e+21,
        evasion: 4.1e+20,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Perfect Ghost Champion',
        quantity: 1,
        damage: 2.72e+23,
        maxHP: 2.43e+28,
        defense: 2.e+19,
        armor: 2.e+19,
        accuracy: 3.2e+21,
        evasion: 1.1e+21,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Tiny Red Dragon',
        quantity: 1,
        damage: 2.04e+24,
        maxHP: 1.07e+29,
        defense: 2.e+19,
        armor: 2.e+24,
        accuracy: 3.2e+25,
        evasion: 1.1e+22,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Small Red Dragon',
        quantity: 1,
        damage: 8.04e+24,
        maxHP: 4.07e+29,
        defense: 4.e+19,
        armor: 7.e+24,
        accuracy: 3.2e+25,
        evasion: 1.6e+22,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Adult Red Dragon',
        quantity: 1,
        damage: 3.03e+25,
        maxHP: 2.07e+30,
        defense: 1.e+20,
        armor: 2.e+25,
        accuracy: 6.2e+25,
        evasion: 4.6e+22,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Elder Red Dragon',
        quantity: 1,
        damage: 1.13e+26,
        maxHP: 7.98e+30,
        defense: 5.e+20,
        armor: 6.e+25,
        accuracy: 9.2e+25,
        evasion: 7.4e+22,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Tiny Frost Dragon',
        quantity: 1,
        damage: 4.40e+26,
        maxHP: 1.67e+31,
        defense: 4.e+20,
        armor: 2.e+26,
        accuracy: 2.2e+26,
        evasion: 1.1e+23,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Small Frost Dragon',
        quantity: 1,
        damage: 1.10e+27,
        maxHP: 6.67e+31,
        defense: 2.e+21,
        armor: 6.e+26,
        accuracy: 5.2e+26,
        evasion: 2.4e+23,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Adult Frost Dragon',
        quantity: 1,
        damage: 4.27e+28,
        maxHP: 3.21e+32,
        defense: 8.e+21,
        armor: 2.1e+27,
        accuracy: 1.8e+27,
        evasion: 7.4e+23,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Elder Frost Dragon',
        quantity: 1,
        damage: 1.74e+29,
        maxHP: 1.18e+33,
        defense: 3.e+23,
        armor: 7.8e+27,
        accuracy: 9.2e+27,
        evasion: 2.4e+24,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Tiny Bronze Dragon',
        quantity: 1,
        damage: 6.25e+29,
        maxHP: 4.54e+33,
        defense: 1.e+24,
        armor: 2.2e+28,
        accuracy: 2.6e+28,
        evasion: 7.7e+24,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Small Bronze Dragon',
        quantity: 1,
        damage: 2.75e+30,
        maxHP: 1.58e+34,
        defense: 4.e+24,
        armor: 7.9e+28,
        accuracy: 1.1e+29,
        evasion: 2.7e+25,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Adult Bronze Dragon',
        quantity: 1,
        damage: 1.25e+31,
        maxHP: 6.18e+34,
        defense: 2.e+25,
        armor: 1.9e+29,
        accuracy: 4.1e+29,
        evasion: 1.2e+26,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Elder Bronze Dragon',
        quantity: 1,
        damage: 6.25e+31,
        maxHP: 3.18e+35,
        defense: 2.e+26,
        armor: 1.9e+30,
        accuracy: 1.5e+30,
        evasion: 5.2e+26,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Tiny Dark Dragon',
        quantity: 1,
        damage: 2.71e+32,
        maxHP: 2.00e+36,
        defense: 8.e+26,
        armor: 7.9e+30,
        accuracy: 6e+30,
        evasion: 2.2e+27,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Small Dark Dragon',
        quantity: 1,
        damage: 1.02e+33,
        maxHP: 8.96e+36,
        defense: 3.e+27,
        armor: 3.4e+31,
        accuracy: 2.4e+31,
        evasion: 8.8e+27,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Adult Dark Dragon',
        quantity: 1,
        damage: 5.02e+33,
        maxHP: 3.96e+37,
        defense: 1.5e+28,
        armor: 1.4e+32,
        accuracy: 9.6e+31,
        evasion: 3.6e+28,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Elder Dark Dragon',
        quantity: 1,
        damage: 3.02e+34,
        maxHP: 1.26e+38,
        defense: 9.5e+28,
        armor: 1.11e+33,
        accuracy: 3.6e+32,
        evasion: 1.2e+29,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Tiny Silver Dragon',
        quantity: 1,
        damage: 1.42e+35,
        maxHP: 6.26e+38,
        defense: 2.5e+29,
        armor: 4.27e+33,
        accuracy: 1.4e+33,
        evasion: 4.7e+29,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Small Silver Dragon',
        quantity: 1,
        damage: 5.42e+35,
        maxHP: 3.26e+39,
        defense: 1.0e+30,
        armor: 1.67e+34,
        accuracy: 5.8e+33,
        evasion: 2.1e+30,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Adult Silver Dragon',
        quantity: 1,
        damage: 2.42e+36,
        maxHP: 1.62e+40,
        defense: 4.0e+30,
        armor: 5.67e+34,
        accuracy: 2.8e+34,
        evasion: 8.8e+30,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Elder Silver Dragon',
        quantity: 1,
        damage: 9.82e+36,
        maxHP: 6.42e+40,
        defense: 1.7e+31,
        armor: 2.67e+35,
        accuracy: 1.1e+35,
        evasion: 2.8e+31,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Perfect Silver Dragon',
        quantity: 1,
        damage: 3.82e+37,
        maxHP: 2.42e+41,
        defense: 6.8e+31,
        armor: 1.07e+36,
        accuracy: 4.6e+35,
        evasion: 1.1e+32,
        critChance: 0.2,
        critMult: 4,
    },{
        name: 'Champion Silver Dragon',
        quantity: 1,
        damage: 1.72e+38,
        maxHP: 9.82e+41,
        defense: 2.9e+32,
        armor: 4.47e+36,
        accuracy: 1.63e+36,
        evasion: 4.46e+32,
        critChance: 0.2,
        critMult: 4,
    }

    ,{
        name: 'Tiny Gold Dragon',
        quantity: 1,
        damage: 5.31e+38,
        maxHP: 3.46e+42,
        defense: 1.1e+33,
        armor: 1.67e+37,
        accuracy: 5.47e+36,
        evasion: 1.86e+33,
        critChance: 0.2,
        critMult: 4,
    },{
        "name": "Small Gold Dragon",
        "quantity": 1,
        "damage": 2.1627630000000003e+39,
        "maxHP": 1.409258e+43,
        "defense": 4.4803e+33,
        "armor": 6.80191e+37,
        "accuracy": 2.227931e+37,
        "evasion": 7.57578e+33,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Adult Gold Dragon",
        "quantity": 1,
        "damage": 8.808933699000001e+39,
        "maxHP": 5.739907834000001e+43,
        "defense": 1.8248261900000003e+34,
        "armor": 2.7704179430000006e+38,
        "accuracy": 9.074362963000001e+37,
        "evasion": 3.0856151940000003e+34,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Large Gold Dragon",
        "quantity": 1,
        "damage": 3.587878695602701e+40,
        "maxHP": 2.3378644607882005e+44,
        "defense": 7.432517071870002e+34,
        "armor": 1.1283912281839003e+39,
        "accuracy": 3.695988034829901e+38,
        "evasion": 1.2567710685162002e+35,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Elder Gold Dragon",
        "quantity": 1,
        "damage": 1.4613429927189803e+41,
        "maxHP": 9.522121948790343e+44,
        "defense": 3.0272642033726524e+35,
        "armor": 4.5959374723930266e+39,
        "accuracy": 1.505375926586219e+39,
        "evasion": 5.118828562066485e+35,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Perfect Gold Dragon",
        "quantity": 1,
        "damage": 5.952050009344407e+41,
        "maxHP": 3.8783602697423066e+45,
        "defense": 1.2330047100336814e+36,
        "armor": 1.87192533250568e+40,
        "accuracy": 6.131396148985671e+39,
        "evasion": 2.0848988733296794e+36,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Champion Gold Dragon",
        "quantity": 1,
        "damage": 2.4242699688059772e+42,
        "maxHP": 1.5796561378660416e+46,
        "defense": 5.022028183967184e+36,
        "armor": 7.624351879295634e+40,
        "accuracy": 2.4973176514818636e+40,
        "evasion": 8.491793111071784e+36,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Tiny Platinum Dragon",
        "quantity": 1,
        "damage": 9.874051582946746e+42,
        "maxHP": 6.433939449528388e+46,
        "defense": 2.0454720793298346e+37,
        "armor": 3.1053985204371124e+41,
        "accuracy": 1.0171574794485632e+41,
        "evasion": 3.458707334139538e+37,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Small Platinum Dragon",
        "quantity": 1,
        "damage": 4.0217012097342105e+43,
        "maxHP": 2.620543537792913e+47,
        "defense": 8.331207779110417e+37,
        "armor": 1.2648288173740361e+42,
        "accuracy": 4.142882413793999e+41,
        "evasion": 1.408731497195034e+38,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Adult Platinum Dragon",
        "quantity": 1,
        "damage": 1.638038902724744e+44,
        "maxHP": 1.0673473829430534e+48,
        "defense": 3.3933009284316726e+38,
        "armor": 5.151647773164449e+42,
        "accuracy": 1.6873960071382956e+42,
        "evasion": 5.737763388075374e+38,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Large Platinum Dragon",
        "quantity": 1,
        "damage": 6.671732450797883e+44,
        "maxHP": 4.3473058907270577e+48,
        "defense": 1.3820914681502205e+39,
        "armor": 2.0982661380098806e+43,
        "accuracy": 6.87276393707428e+42,
        "evasion": 2.3369910279631e+39,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Elder Platinum Dragon",
        "quantity": 1,
        "damage": 2.717396627209978e+45,
        "maxHP": 1.7706576892931306e+49,
        "defense": 5.629258549775849e+39,
        "armor": 8.546237980114244e+43,
        "accuracy": 2.7992767515703543e+43,
        "evasion": 9.518564456893707e+39,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Perfect Platinum Dragon",
        "quantity": 1,
        "damage": 1.1067956462626241e+46,
        "maxHP": 7.211888768490921e+49,
        "defense": 2.2927970073237033e+40,
        "armor": 3.4808827293005315e+44,
        "accuracy": 1.1401454209146053e+44,
        "evasion": 3.8769113032928073e+40,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Champion Platinum Dragon",
        "quantity": 1,
        "damage": 4.5079786672276684e+46,
        "maxHP": 2.9374022954063524e+50,
        "defense": 9.338562210829444e+40,
        "armor": 1.4177635356441067e+45,
        "accuracy": 4.643812299385188e+44,
        "evasion": 1.5790659738311606e+41,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Tiny Diamond Dragon",
        "quantity": 1,
        "damage": 1.8360997111618294e+47,
        "maxHP": 1.1964039549190076e+51,
        "defense": 3.803596388470833e+41,
        "armor": 5.774550880678447e+45,
        "accuracy": 1.891424749539587e+45,
        "evasion": 6.431535711414318e+41,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Small Diamond Dragon",
        "quantity": 1,
        "damage": 7.478434123562133e+47,
        "maxHP": 4.872953308385119e+51,
        "defense": 1.5492048090241707e+42,
        "armor": 2.351974573700332e+46,
        "accuracy": 7.70377300487474e+45,
        "evasion": 2.6195644952590523e+42,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Adult Diamond Dragon",
        "quantity": 1,
        "damage": 3.045966218526857e+48,
        "maxHP": 1.984753882505259e+52,
        "defense": 6.309911187155448e+42,
        "armor": 9.579592438681453e+46,
        "accuracy": 3.137746744885482e+46,
        "evasion": 1.066948618919012e+43,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Large Diamond Dragon",
        "quantity": 1,
        "damage": 1.240622040805989e+49,
        "maxHP": 8.08390256344392e+52,
        "defense": 2.570026826528414e+43,
        "armor": 3.901768000274956e+47,
        "accuracy": 1.2780042491918568e+47,
        "evasion": 4.3456817248571364e+43,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Elder Diamond Dragon",
        "quantity": 1,
        "damage": 5.053053572202793e+49,
        "maxHP": 3.2925735140907087e+53,
        "defense": 1.046771926445023e+44,
        "armor": 1.5891901065119898e+48,
        "accuracy": 5.205311306958433e+47,
        "evasion": 1.7699961665343116e+44,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Perfect Diamond Dragon",
        "quantity": 1,
        "damage": 2.058108719958198e+50,
        "maxHP": 1.341065192289146e+54,
        "defense": 4.263502056410579e+44,
        "armor": 6.472771303823335e+48,
        "accuracy": 2.1201232953241703e+48,
        "evasion": 7.209194386294253e+44,
        "critChance": 0.2,
        "critMult": 4
    },
    {
        "name": "Champion Diamond Dragon",
        "quantity": 1,
        "damage": 8.38267681638974e+50,
        "maxHP": 5.4621585281936915e+54,
        "defense": 1.736524387576029e+45,
        "armor": 2.636359752047245e+49,
        "accuracy": 8.635262181855346e+48,
        "evasion": 2.936304873537649e+45,
        "critChance": 0.2,
        "critMult": 4
    },{
        name: 'Azragard',
        quantity: 1,
        damage: 1.e+56,
        maxHP: 3.25e+64,
        defense: 1.e+23,
        armor: 9.4e+35,
        accuracy: 9.e+37,
        evasion: 7.2e+35,
        critChance: 0.3,
        critMult: 128,
    }];

    class FightParties {

        static getWeaponsEffect() {
            return 1 + 0.045*Math.pow((BasicResources.resources.weapons || 0), 0.5)
        }

        static getFlaskOfAgilityEffect() {
            return 1 + 0.025*Math.pow((BasicResources.resources.flasksOfAgility || 0), 0.5);
        }

        static getFlaskOfAggressionEffect() {
            return 1 + 1.e-3*Math.pow((BasicResources.resources.flasksOfAggression || 0), 0.45);
        }

        static getFlaskOfEnduranceEffect() {
            return 1 + 1.e-3*Math.pow((BasicResources.resources.flasksOfEndurance || 0), 0.45);
        }

        static generateMy() {
            let hpBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');
            hpBonus *= (1 + BasicHeirlooms.getTotalBonus('resilience'));
            let dmgBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');
            dmgBonus *= Math.pow(1.1, BasicBuilding.getBuildingLevel('zeusStatue'));
            dmgBonus *= (1 + BasicHeirlooms.getTotalBonus('agression'));

            hpBonus *= FightParties.getFlaskOfEnduranceEffect();
            dmgBonus *= FightParties.getFlaskOfAggressionEffect();

            let precisionBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');
            let evadeBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');
            let armorBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');

            precisionBonus *= 1 + 0.25*BasicResearch.getResearchLevel('combatReflexes');
            evadeBonus *= 1 + 0.25*BasicResearch.getResearchLevel('combatReflexes');

            precisionBonus *= (1 + BasicHeirlooms.getTotalBonus('precision'));
            evadeBonus *= (1 + BasicHeirlooms.getTotalBonus('evasion'));

            precisionBonus *= (1 + 0.25*BasicBuilding.getBuildingLevel('hallOfFame'));
            evadeBonus *= (1 + 0.25*BasicBuilding.getBuildingLevel('hallOfFame'));

            const qt = CreatureJobs.getWorkerAmount('fighter');
            let totMult = 1.0;
            if(BasicTemper.getCurrentTemper() === 'aggressive') {
                totMult *= 1.1;
            }
            if(CreatureJobs.getWorkerAmount('sergeant') > 0) {
                hpBonus *= 1 + CreatureJobs.getWorkerAmount('sergeant') * 0.2 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics'));
                dmgBonus *= 1 + CreatureJobs.getWorkerAmount('sergeant') * 0.2 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics'));
            }
            if(CreatureJobs.getWorkerAmount('trainer') > 0) {
                precisionBonus *= 1 + CreatureJobs.getWorkerAmount('trainer') * 0.1 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics'));
                evadeBonus *= 1 + CreatureJobs.getWorkerAmount('trainer') * 0.1 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics'));
            }

            if(ShopItems.purchased.precisionTraining) {
                precisionBonus *= 1.5;
            }

            if(ShopItems.purchased.precisionTraining2) {
                precisionBonus *= 1.5;
            }

            if(ShopItems.purchased.precisionTraining3) {
                precisionBonus *= 1.5;
            }

            totMult *= FightParties.getWeaponsEffect();

            let agilityMult = FightParties.getFlaskOfAgilityEffect();

            precisionBonus *= agilityMult;
            evadeBonus *= agilityMult;

            precisionBonus *= Math.pow(1.2, BasicResearch.getResearchLevel('battleScience'));
            evadeBonus *= Math.pow(1.2, BasicResearch.getResearchLevel('battleScience'));

            dmgBonus *= 1 + BasicAuras.getEffect('damage');
            hpBonus *= 1 + BasicAuras.getEffect('health');
            precisionBonus *= 1 + BasicAuras.getEffect('accuracy');
            evadeBonus *= 1 + BasicAuras.getEffect('evasion');

            return {
                name: 'Warriors',
                damage: (2 + BasicAuras.getEffect('damageBase')) * dmgBonus * totMult,
                maxHP: (5 + BasicResearch.getResearchLevel('resilience') + BasicAuras.getEffect('healthBase')) * hpBonus * totMult,
                defense: BasicBuilding.getBuildingLevel('trainingCamp') * totMult,
                armor: (1 + BasicAuras.getEffect('armorBase'))*armorBonus,
                accuracy: (30 + BasicBuilding.getBuildingLevel('trainingCenter')*5 + BasicResearch.getResearchLevel('assassination') * 10 + BasicAuras.getEffect('accuracyBase'))*precisionBonus,
                evasion: (20 + BasicBuilding.getBuildingLevel('trainingCenter')*4 + BasicAuras.getEffect('evasionBase'))*evadeBonus,
                critChance: 0,
                critMult: 2,
                quantity: qt,
            }
        }

        static generateByPower(power, type, modifier) {
            let dmgClassMult = 1.;
            let armorClassMult = 1.;
            let defClassMult = 1.;
            let hpClassMult = 1.;
            let acuracyClassMult = 1.;
            let evasionClassMult = 1.;
            let critChanceMult = 0.;
            let critMultMult = 1.;
            let suffix = '';
           switch (type) {
               case 0:
                   // regular
                   break;
               case 1:
                   // tank
                   armorClassMult = 2.;
                   hpClassMult = 1.25;
                   dmgClassMult = 0.75;
                   defClassMult = 1.25;
                   suffix = 'Sturdy ';
                   break;
               case 2:
                   // attacker
                   armorClassMult = 1.;
                   hpClassMult = 0.75;
                   dmgClassMult = 1.35;
                   suffix = 'Muscular ';
                   break;
               case 3:
                   // agile
                   armorClassMult = 0.1;
                   dmgClassMult = 1.15;
                   acuracyClassMult = 2.0;
                   evasionClassMult = 2.0;
                   defClassMult = 0.5;
                   suffix = 'Agile ';
                   break;
               case 4:
                   // precise
                   armorClassMult = 0.1;
                   dmgClassMult = 1.25;
                   hpClassMult = 0.75;
                   acuracyClassMult = 4.0;
                   suffix = 'Precise ';
                   critChanceMult = 0.25;
                   critMultMult = 2.;
                   defClassMult = 0.5;
                   break;
               case 5:
                   // sniper
                   armorClassMult = 0.1;
                   dmgClassMult = 1.25;
                   hpClassMult = 0.55;
                   acuracyClassMult = 2.0;
                   critChanceMult = 1.;
                   critMultMult = 3.;
                   suffix = 'Precise ';
                   break;
           }
            return {
                quantity: Math.round(3 + Math.random()*2),
                damage: 0.5*Math.pow(1.5, power)*dmgClassMult,
                maxHP: 2 * Math.pow(1.5, power)*hpClassMult,
                defense: power < 11 ? 0 : 1 * Math.pow(1.5, power - 10)*defClassMult,
                armor: 0.25 * Math.pow(1.5, power) * armorClassMult,
                accuracy: 10 * Math.pow(1.5, power) * acuracyClassMult,
                evasion: 8 * Math.pow(1.5, power) * evasionClassMult,
                critChance: 0.2 * critChanceMult,
                critMult: critMultMult,
                name: suffix + 'Skeleton'
            }
        }

        static generateEnemy(level, cell) {
            const power = level + cell/100;
            return FightParties.generateByPower(power, Math.floor(Math.random()*6));
        }

        static generateBossEnemy(bossLevel) {
            if(bossesData.length <= bossLevel) return;
            return bossesData[bossLevel];
        }

    }

    class BasicFight {

        static parties = {};

        static isInProgress = false;

        static isLost = false;

        static isWon = false;

        static atckCooldown = 2;

        static getAtckCooldown() {
            let mlt = Math.pow(0.95, BasicResearch.getResearchLevel('combatLogistics'));
            if(BasicTemper.getCurrentTemper() === 'aggressive') {
                mlt *= 1 / 1.1;
            }
            return 2*mlt;
        }

        static initialize() {
            BasicFight.parties = {};
            BasicFight.isInProgress = false;
        }

        static reset() {
            BasicFight.atckCooldown = BasicFight.getAtckCooldown();
            BasicFight.isLost = false;
            BasicFight.isWon = false;
        }

        static start(level, cell, mode) {
            BasicFight.atckCooldown = BasicFight.getAtckCooldown();
            BasicFight.isInProgress = true;
            BasicFight.isLost = false;
            BasicFight.isWon = false;
            const me = FightParties.generateMy();
            let enemies;
            if(mode === 0) {
                enemies = FightParties.generateEnemy(level, cell);
            }
            if(mode === 1) {
                enemies = FightParties.generateBossEnemy(level);
            }

            BasicFight.parties = {
                me: BasicFight.prepareToFight(me, enemies),
                enemy: BasicFight.prepareToFight(enemies, me),
            };

        }

        static prepareToFight(side, counterpart) {
            if(!side) return {};
            return {
                ...side,
                realHP: side.maxHP * side.quantity,
                maxRealHP: side.maxHP * side.quantity,
                chanceToHit: BasicFight.calculateHitChance(side.accuracy, counterpart?.evasion),
                chanceToEvade: 1 - BasicFight.calculateHitChance(counterpart?.accuracy, side.evasion),
                dmgMitigation: BasicFight.calculateDamagePercentage(counterpart?.damage, side.armor),
                hitStatus: '',
            }
        }

        static calculateDamagePercentage(dmg, armor) {
            return dmg / (dmg + armor);
        }

        static calculateHitChance(precision, evasion) {
            return precision / (precision + evasion);
        }

        static process(dT) {
            // check if fight was end
            if(!BasicFight.isInProgress) return;
            if(!BasicFight.parties.me || !BasicFight.parties.enemy) return;

            if(BasicFight.parties.me.realHP <= 0) {
                BasicFight.isLost = true;
                return;
            }

            if(BasicFight.parties.enemy.realHP <= 0) {
                BasicFight.isWon = true;
                return;
            }

            BasicFight.atckCooldown -= dT;

            if(BasicFight.atckCooldown <= 0) {
                BasicFight.atckCooldown = BasicFight.getAtckCooldown();

                // defending
                if(Math.random() < BasicFight.parties.enemy.chanceToHit) {
                    const isCrit = Math.random() < BasicFight.parties.enemy.critChance;
                    let dmg = BasicFight.parties.enemy.damage;
                    BasicFight.parties.enemy.hitStatus = 'Hit';
                    if(isCrit) {
                        dmg *= BasicFight.parties.enemy.critMult;
                        BasicFight.parties.enemy.hitStatus = 'Crit!';
                    }
                    BasicFight.parties.me.realHP -= Math.max(0, dmg * BasicFight.calculateDamagePercentage(dmg, BasicFight.parties.me.armor) - BasicFight.parties.me.defense)
                        * BasicFight.parties.enemy.quantity;
                    BasicFight.parties.me.realHP = Math.max(BasicFight.parties.me.realHP, 0);
                } else {
                    BasicFight.parties.enemy.hitStatus = 'Miss';
                }

                BasicFight.parties.me.quantity = Math.ceil(BasicFight.parties.me.realHP / BasicFight.parties.me.maxHP);

                // attacking
                if(Math.random() < BasicFight.parties.me.chanceToHit) {
                    const isCrit = Math.random() < BasicFight.parties.me.critChance;
                    let dmg = BasicFight.parties.me.damage;
                    BasicFight.parties.me.hitStatus = 'Hit';
                    if(isCrit) {
                        dmg *= BasicFight.parties.me.critMult;
                        BasicFight.parties.me.hitStatus = 'Crit!';
                    }
                    BasicFight.parties.enemy.realHP -= Math.max(0, dmg * BasicFight.calculateDamagePercentage(dmg, BasicFight.parties.enemy.armor) - BasicFight.parties.enemy.defense)
                        * BasicFight.parties.me.quantity;

                    BasicFight.parties.enemy.realHP = Math.max(0, BasicFight.parties.enemy.realHP);

                } else {
                    BasicFight.parties.me.hitStatus = 'Miss';
                }
                BasicFight.parties.enemy.quantity = Math.ceil(BasicFight.parties.enemy.realHP / BasicFight.parties.enemy.maxHP);

            }
        }

        static sendToUI() {
            ColibriWorker.sendToClient('set_battle_state', {
                parties: BasicFight.parties,
                isInProgress: BasicFight.isInProgress,
            });
        }

    }

    class AurasGenerator {

        static generateAuraStats(quality, tier) {
            const bonuses = [];
            Array.from({ length: tier+1 }).forEach(() => {
                const available = auraData.filter(one => one.isUnlocked() && !bonuses.some(bonus => bonus.name === one.name));
                const index = Math.floor(Math.random()*available.length);
                const effect = available[index];
                const baseEff = quality * effect.baseEffect;
                bonuses.push({
                    id: effect.id,
                    name: effect.name,
                    weight: effect.weight,
                    baseEff,
                    baseGrowth: effect.baseGrowth,
                    expBase: effect.expBase || 1.0,
                });
            });
            return bonuses;
        }

        static generateSuffix(bonuses) {
            let b = [...bonuses];
            const trailing = b.pop();
            if(!b.length) return trailing.name;
            return `${b.map(({ name }) => name).join(', ')} and ${trailing.name}`;
        }

        static generatePreffix(tier) {
            switch (tier) {
                case 0:
                    return 'Normal ';
                case 1:
                    return 'Empowered ';
                case 2:
                    return 'Rare ';
                case 3:
                    return 'Epic ';
                case 4:
                    return 'Legendary ';
            }
        }

        static generateAura(quality, tier) {
            const bonuses = AurasGenerator.generateAuraStats(quality, tier);
            const name = `${AurasGenerator.generatePreffix(tier)} aura of ${AurasGenerator.generateSuffix(bonuses)}`;
            return {
                quality,
                tier,
                name,
                bonuses,
                level: 0,
                xp: 0,
            }
        }

        static generateProbabilityBased(prob) {
            const rn = Math.random();
            if(rn < prob) {
                const tierProb = Math.random();
                let tr = 0;
                if(tierProb < 0.8) {
                    tr = 0;
                } else if(tierProb < 0.95) {
                    tr = 1;
                } else if(tierProb < 0.992) {
                    tr = 2;
                } else {
                    tr = 3;
                }
                const aura = AurasGenerator.generateAura(0.5 + Math.random(), tr);
                return aura;
            }
            return null;
        }

        static generateChargeGemsLoot(level) {
            if(BasicResearch.getResearchLevel('auraCharging') <= 0) return 0;
            const chance = 0.002 * (1 + 0.05*BasicResearch.getResearchLevel('auraCharging'));
            if(Math.random() < chance) {
                return Math.floor(1 + Math.pow(level, 1.2) / 200);
            }
        }

    }

    class BasicMap {

        static state = {
            level: 0,
            cell: 0,
            isForward: true,
            isTurnedOn: false,
            zonesAmounts: {},
            maxLevel: 0,
            reviveCoolDown: 0,
            fightMode: 0,
            bossesArena: {
                level: 0,
                maxBossLevel: 0,
            }
        }

        static initialize(isFromPrestige) {
            const memorizeTerritory = isFromPrestige && (BasicResearch.getResearchLevel('territoryMemory') > 0);
            BasicMap.state = {
                level: 0,
                cell: 0,
                isForward: true,
                isTurnedOn: false,
                zonesAmounts: memorizeTerritory && BasicMap.state.zonesAmounts ? BasicMap.state.zonesAmounts : {},
                maxLevel: memorizeTerritory && BasicMap.state.maxLevel ? BasicMap.state.maxLevel : 5 * BasicBuilding.getBuildingLevel('zeusStatue'),
                fightMode: 0,
                bossesArena: {
                    level: 0,
                    maxBossLevel: isFromPrestige ? BasicMap.state?.bossesArena?.maxBossLevel || 0 : 0,
                },
            };
            return BasicMap.state;
        }

        static switchTurned() {
            BasicMap.state.isTurnedOn = !BasicMap.state.isTurnedOn;

            if(!BasicMap.state.isTurnedOn) {
                BasicFight.isInProgress = false;
                BasicMap.state.isTurnedOn = false;
                BasicFight.parties = {};
            }
        }

        static setLevel(level) {
            const nLv = Math.max(
                Math.min(level, BasicMap.state.maxLevel),
                0
            );
            console.log('setLevel: ', nLv);
            if(nLv !== BasicMap.state.level) {
                BasicMap.state.level = nLv;
                BasicMap.startZone();
            }
        }

        static switchForward() {
            BasicMap.state.isForward = !BasicMap.state.isForward;
        }

        static startZone() {
            BasicMap.state.cell = 0;
        }

        static finishZone() {
            BasicMap.state.zonesAmounts[BasicMap.state.level] = (BasicMap.state.zonesAmounts[BasicMap.state.level] || 0) + 1;
            BasicMap.state.maxLevel = Math.max(BasicMap.state.level + 1, BasicMap.state.maxLevel);
            if(BasicMap.state.isForward) {
                BasicMap.state.level++;
            }
            BasicMap.startZone();
        }

        static process(dT) {
            const qt = CreatureJobs.getWorkerAmount('fighter');

            if(qt <= 0) {
                BasicMap.state.isTurnedOn = false;
            }
            if(BasicMap.state.reviveCoolDown > 0) {
                BasicMap.state.reviveCoolDown -= dT;
                return;
            }
            if(!BasicMap.state.fightMode) {
                BasicMap.state.fightMode = 0;
            }
            if(BasicMap.state.isTurnedOn) {
                if(!BasicFight.isInProgress) {
                    // start fight
                    if(BasicMap.state.fightMode === 1) {
                        BasicFight.start(BasicMap.state.bossesArena.level || 0, null, 1);
                    } else {
                        BasicFight.start(BasicMap.state.level, BasicMap.state.cell, 0);
                    }
                }
                BasicFight.process(dT);
                if(BasicMap.state.fightMode === 0) {
                    if(BasicFight.isWon) {
                        BasicFight.isInProgress = false;
                        const soulsGained = Math.pow(BasicMap.state.level+1, 0.5) * Math.pow(1.3, (BasicMap.state.level+1) + 0.01 *  BasicMap.state.cell)
                            * (1 + 0.1 * BasicResearch.getResearchLevel('soulEater'))
                            * getResourceMult('souls')
                            * (1 + 0.25 * BasicResearch.getResearchLevel('looting'));
                        BasicResources.add('souls',
                            soulsGained
                        );
                        if(BasicSettings.settings.notificationsSettings.whenBattleWon) {
                            // console.log('spawn_notification');
                            ColibriWorker.sendToClient('spawn_notification', {
                                message: `You won the battle at ${BasicMap.state.level}:${BasicMap.state.cell}. You received ${fmtVal(soulsGained)} souls.`
                            });
                        }
                        if(BasicMap.state.level > 4) {
                            const hr = HeirloomGenerator.generateProbabilityBased(BasicMap.state.level, 0.005);
                            if(hr) {
                                BasicHeirlooms.giveToPlayer(hr);
                                BasicStatistics.inc('heirloomsDropped', 1);
                                console.log('AWARDED HEIRLOOM: ', hr);
                            }
                        }
                        const stones = HeirloomGenerator.generateChargeStonesLoot(BasicMap.state.level);
                        if(stones > 0) {
                            BasicResources.add('chargeStones', stones);
                        }
                        const gems = AurasGenerator.generateChargeGemsLoot(BasicMap.state.level);
                        if(gems > 0) {
                            BasicResources.add('chargeGems', gems);
                        }
                        if(BasicResearch.getResearchLevel('auras') > 0 && BasicMap.state.level > -1) {
                            // TODO: change probability
                            const aura = AurasGenerator.generateProbabilityBased(0.003);
                            if(aura) {
                                BasicAuras.giveToPlayer(aura);
                                BasicStatistics.inc('aurasDropped', 1);
                                console.log('AWARDED AURA: ', aura);
                            }
                        }
                        BasicMap.state.cell++;
                        if(BasicMap.state.cell > 100) {
                            if(BasicSettings.settings.notificationsSettings.whenZoneFinished) {
                                ColibriWorker.sendToClient('spawn_notification', {
                                    message: `You finished map ${BasicMap.state.level}. You received ${fmtVal(territotyPerZone(BasicMap.state.level))} territory.`
                                });
                            }
                            BasicMap.finishZone();
                        }
                        BasicStatistics.inc('fightsWon', 1);
                    }
                    if(BasicFight.isLost) {
                        console.log('you lost');
                        BasicFight.isInProgress = false;
                        if(BasicSettings.settings.notificationsSettings.whenBattleLost) {
                            ColibriWorker.sendToClient('spawn_notification', {
                                message: `You lost the battle at ${BasicMap.state.level}:${BasicMap.state.cell}.`,
                                color: '#da3842',
                            });
                        }
                        BasicMap.state.reviveCoolDown = 60;
                        BasicStatistics.inc('fightsLost', 1);
                        BasicMap.startZone();
                    }
                }
                if(BasicMap.state.fightMode === 1) {
                    if(BasicFight.isWon) {
                        BasicResources.add('fame', 0.25*Math.pow(1.2,BasicMap.state.bossesArena?.level || 0));

                        /*if(BasicResearch.getResearchLevel('memoryStones') > 0) {
                            BasicResources.add('memoryStones', (0.4 + 0.6* Math.random())*Math.pow(1.2,BasicMap.state.bossesArena?.level || 0));
                        }*/
                        const hr = HeirloomGenerator.generateProbabilityBasedFromBoss(20 + 2*BasicMap.state.bossesArena?.maxBossLevel || 0, 0.1);
                        if(hr) {
                            BasicHeirlooms.giveToPlayer(hr);
                            BasicStatistics.inc('heirloomsDropped', 1);
                            console.log('AWARDED HEIRLOOM: ', hr);
                        }

                        BasicMap.state.bossesArena.level++;
                        BasicMap.state.bossesArena.maxBossLevel = Math.max(BasicMap.state.bossesArena.maxBossLevel || 0, BasicMap.state.bossesArena.level);

                        BasicFight.isInProgress = false;
                        // BasicMap.state.isTurnedOn = false;
                        BasicFight.parties = {};
                        BasicStatistics.inc('fightsWon', 1);
                    }
                    if(BasicFight.isLost) {
                        BasicFight.isInProgress = false;
                        BasicMap.state.isTurnedOn = false;
                        BasicFight.parties = {};
                        BasicStatistics.inc('fightsLost', 1);
                        if(BasicSettings.settings.notificationsSettings.whenBattleLost) {
                            ColibriWorker.sendToClient('spawn_notification', {
                                message: `You lost the battle at boss level ${BasicMap.state.bossesArena.level}.`,
                                color: '#da3842',
                            });
                        }
                    }
                }

            }
        }

        static toggleMode(fightMode) {
            if(fightMode == BasicMap.state.fightMode) return;
            if(!BasicMap.state.bossesArena) {
                BasicMap.state.bossesArena = {
                    level: 0,
                    maxBossLevel: 0
                };
            }

            BasicMap.state.fightMode = fightMode;
            BasicMap.state.isTurnedOn = false;
            // to prevent cheating
            BasicFight.isInProgress = false;
        }

        static sendToUI() {
            if(!BasicMap.state.level) {
                BasicMap.state.level = 0;
            }
            ColibriWorker.sendToClient('set_map_state', {
                ...BasicMap.state,
                isFightAvailable: CreatureJobs.getWorkerAmount('fighter') > 0,
                territoryPerMap: territotyPerZone(BasicMap.state.level),
                coolDown: BasicMap.state.reviveCoolDown > 0 ? secondsToHms(BasicMap.state.reviveCoolDown) : null,
                bossPreview: BasicFight.prepareToFight(FightParties.generateBossEnemy(BasicMap.state.bossesArena?.level || 0)),
                myPreview: BasicFight.prepareToFight(FightParties.generateMy()),
            });
        }

    }

    const researchData = [{
        id: 'selfDevelopment',
        name: 'Self Development',
        description: 'Each level makes your learning speed 50% faster',
        isUnlocked: () => true,
        maxLevel: 0,
        getCost: (level) => ({
            research: 10*Math.pow(2, level),
        }),
    },{
        id: 'soulEater',
        name: 'Soul Eater',
        description: 'Improves your soul gain from all sources by 10%',
        isUnlocked: () => true,
        maxLevel: 0,
        getCost: (level) => ({
            research: 10*Math.pow(2, level),
        }),
    },{ // Changed
        id: 'bannersMasterity',
        name: 'Banners Masterity',
        description: 'Improves your banners effect exponental over amount by 0.01',
        isUnlocked: () => BasicResearch.getTotal('soulEater') > 2,
        maxLevel: 15,
        getCost: (level) => ({
            research: 100*Math.pow(2, level),
        }),
    },{
        id: 'energizer',
        name: 'Energizer',
        description: 'Start with 0.5*[level^1.5] more basic energy regen and 5 more energy capacity. As you level up unlocks more powerful researches.',
        getDescription: () => `Start with 5 more maximum energy and +${fmtVal(0.5*Math.pow(BasicResearch.getTotal('energizer'), 1.5))} energy regeneration`,
        isUnlocked: () => BasicResearch.getTotal('selfDevelopment') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 100*Math.pow(2, level),
        }),
    },{
        id: 'economy',
        name: 'Economy',
        description: 'Start with 50 more maximum gold and [+level^1.5] passive gold income. After level 10 unlock new research',
        getDescription: () => `Start with 50 more maximum gold and more passive gold income (+${fmtVal(Math.pow(BasicResearch.getTotal('economy'), 1.5))}). After level 10 unlock new research`,
        isUnlocked: () => BasicResearch.getTotal('selfDevelopment') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 100*Math.pow(2, level),
        }),
    },{
        id: 'necromancery',
        name: 'Necromancery',
        description: 'Each level decrease exponent base in souls costs of summoning formula by 5%. Max out to unlock new research.',
        isUnlocked: () => BasicResearch.getTotal('bannersMasterity') > 1,
        maxLevel: 10,
        getCost: (level) => ({
            research: 500*Math.pow(3, level),
        }),
    },{
        id: 'spellMaster',
        name: 'Spells master',
        description: 'Each level increase your spells efficiency by 25%. After levels 5 and 10 unlock new researches',
        isUnlocked: () => BasicResearch.getTotal('energizer') > 1,
        maxLevel: 0,
        getCost: (level) => ({
            research: 500*Math.pow(3, level),
        }),
    },{
        id: 'tireless',
        name: 'Tireless',
        description: 'Each level increase your actions efficiency by 20%. After level 10 unlock new powerful research.',
        isUnlocked: () => BasicResearch.getTotal('energizer') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 500*Math.pow(3, level),
        }),
    },{
        id: 'fighting',
        name: 'Fighting Masterity',
        description: 'Unlocks fighting. Each level increase your creatures HP and attack by 25%. Levels 3 and 6 unlock new researches',
        isUnlocked: () => BasicResearch.getTotal('necromancery') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 10000*Math.pow(3, level),
        }),
    },{
        id: 'combatReflexes',
        name: 'Combat Reflexes',
        description: 'Increase your creatures evasion and accuracy by 25%. After level 10 unlocks new research.',
        isUnlocked: () => BasicResearch.getTotal('fighting') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 50000*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'building',
        name: 'Building',
        description: 'Unlocks building. Each level increases builder efficiency by 20%. Level 5 unlocks a new banner.',
        isUnlocked: () => BasicResearch.getTotal('fighting') > 0 && resourcesData.find(one => one.id === 'territory').getMax() > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 500000*Math.pow(3, level),
        }),
    },{
        id: 'darkExperiments',
        name: 'Dark Experiments',
        description: 'Improve your dark research output by 20%. Also improve academy effect by 5%',
        isUnlocked: () => BasicResearch.getTotal('spellMaster') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 500000*Math.pow(3, level),
        }),
    },{ 
        id: 'advancedAutomation',
        name: 'Advanced Automation',
        description: 'Unlocks auto-purchase for items you have purchased in previous resets.',
        isUnlocked: () => BasicResearch.getTotal('economy') > 9,
        maxLevel: 1,
        getCost: (level) => ({
            research: 500000*Math.pow(3, level),
        }),
    },{
        id: 'autoBanners',
        name: 'Automated banner prestige',
        description: 'Unlocks automatic banner resets. Initially gives 20% of normal banner prestige, but each research level increase prestige gain by 10%. Level 5 unlock new research',
        isUnlocked: () => BasicResearch.getTotal('advancedAutomation') > 0,
        maxLevel: 9,
        getCost: (level) => ({
            research: 1000000*Math.pow(1000, level),
        }),
    },{
        id: 'autoFame',
        name: 'Glory',
        description: 'The world remembers your famous fights forever! Automated runs will use 2% of fame boost for last boss ever beaten on arena',
        isUnlocked: () => BasicResearch.getTotal('autoBanners') > 4,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+18,
        }),
    },{
        id: 'combatLogistics',
        name: 'Combat Logistics',
        description: 'Fights are 5% faster. After level 3 unlock new research.',
        isUnlocked: () => BasicResearch.getTotal('fighting') > 2
            && (BasicMap.state.zonesAmounts[0] > 0 || BasicResearch.getTotal('combatLogistics') > 0),
        maxLevel: 20,
        getCost: (level) => ({
            research: 1000000*Math.pow(3, level),
        }),
    }/*,{
        id: 'runes',
        name: 'Runes Making',
        description: 'You can invest some of your magic knowledge in making runes, providing bonuses to various aspects of game',
        isUnlocked: () => BasicResearch.getTotal('tireless') > 9,
        maxLevel: 1,
        getCost: (level) => ({
            research: 10000000*Math.pow(3, level),
        }),
    }*/,{
        id: 'combatTactics',
        name: 'Combat Tactics',
        description: 'Unlocks hiring sergeant and trainer. Each level increase sergeant and trainer bonus by 10%. Level 3 unlocks new research.',
        isUnlocked: () => BasicResearch.getTotal('fighting') > 5,
        maxLevel: 20,
        getCost: (level) => ({
            research: 10000000*Math.pow(3, level),
        }),
    },{
        id: 'banking',
        name: 'Banking',
        description: 'Each level increase max gold storage by 20%. Unlock building banks.',
        isUnlocked: () => BasicResearch.getTotal('economy') > 9 && BasicResearch.getTotal('building') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 10000000*Math.pow(3, level),
        }),
    },{
        id: 'logistics',
        name: 'Logistics',
        description: 'Each level increase max building materials storage by 25%.',
        isUnlocked: () => BasicResearch.getTotal('economy') > 9 && BasicResearch.getTotal('building') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 10000000*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'resilience',
        name: 'Resilience',
        description: 'New training techniques allows your warriors to increase their vitality. +1 base HP to your creatures per level. (multiplied by other bonuses)',
        isUnlocked: () => BasicResearch.getTotal('combatTactics') > 2,
        maxLevel: 10,
        getCost: (level) => ({
            research: 1.e+8*Math.pow(3, level),
        }),
    },{
        id: 'looting',
        name: 'Looting',
        description: 'Increase souls loot in fighting by 25%. Level 5 unlocks new research',
        isUnlocked: () => BasicResearch.getTotal('combatLogistics') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+8*Math.pow(3, level),
        }),
    },{
        id: 'bornToBringDeath',
        name: 'Born to bring Death',
        description: 'Start your runs with 5 supporters, 3 miners, 1 mana gatherer and summoning book purchased',
        isUnlocked: () => BasicResearch.getTotal('necromancery') > 9 && BasicResearch.getTotal('energizer') > 5,
        maxLevel: 1,
        getCost: (level) => ({
            research: 50000000*Math.pow(10, level),
        }),
    },{
        id: 'motivation',
        name: 'Motivation',
        description: 'Increase your creatures resources gain by 20% at cost of 10% more energy consumed. Level 3 unlocks new research',
        isUnlocked: () => BasicResearch.getTotal('tireless') > 9,
        maxLevel: 10,
        getCost: (level) => ({
            research: 1.e+8*Math.pow(3, level),
        }),
    },{
        id: 'cityPlanning',
        name: 'City Planning',
        description: 'Each level decrease building gold and territory requirement by 10%',
        isUnlocked: () => BasicResearch.getTotal('building') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+8*Math.pow(3, level),
        }),
    },{
        id: 'summoner',
        name: 'Summoning Mastery',
        description: 'Each level further decrease costs of summoning.',
        isUnlocked: () => BasicResearch.getTotal('bornToBringDeath') > 0,
        maxLevel: 10,
        getCost: (level) => ({
            research: 1.e+9*Math.pow(3, level),
        }),
    },{
        id: 'assassination',
        name: 'Talented Assassins',
        description: 'Increase your base accuracy by 10',
        isUnlocked: () => BasicResearch.getTotal('combatReflexes') > 9,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+9*Math.pow(3, level),
        }),
    },{
        id: 'urbanism',
        name: 'Urbanism',
        description: 'Each level add +1 building queue slot',
        isUnlocked: () => BasicResearch.getTotal('cityPlanning') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'architecture',
        name: 'Architecture',
        description: 'Allows you to build mega structures that persists through resets',
        isUnlocked: () => BasicResearch.getTotal('building') > 6,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'oreMining',
        name: 'Ore Mining',
        description: 'Unlock ore mining and refining. Each level improves mining efficiency by 10%',
        isUnlocked: () => BasicResearch.getTotal('motivation') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'alchemy',
        name: 'Alchemy',
        description: 'Unlock alchemists job. Can convert your flasks to something more efficient. Each level improves alchemist efficiency by 10%. Level 10 unlocks new research',
        isUnlocked: () => BasicResearch.getTotal('motivation') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'auras',
        name: 'Auras',
        description: 'Unlocks new way for your power improvement - auras. Can be found in maps. Each level add new active aura slot',
        isUnlocked: () => BasicResearch.getTotal('looting') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+12*Math.pow(1000, level*level),
        }),
    },{ // Changed
        id: 'compactHeirloom',
        name: 'Heirloom Compactification',
        description: 'Each level adds +1 slot to saved heirlooms',
        isUnlocked: () => BasicResearch.getTotal('looting') > 4,
        maxLevel: 5,
        getCost: (level) => ({
            research: 1.e+15*Math.pow(100, level*level),
        }),
    },{ // Changed
        id: 'levitation',
        name: 'Levitation',
        description: 'Learn how to move large things with power of mind. Unlocks new megastructures. Each level decreases building time by 5%',
        isUnlocked: () => BasicResearch.getTotal('architecture') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+12*Math.pow(1000, level*level),
        }),
    },{ // Changed
        id: 'herbalism',
        name: 'Advanced Herbalism',
        description: 'Unlocks building herbs garden, that improves your herbs and flasks output. Each level improves flasks output by 10%',
        isUnlocked: () => BasicResearch.getTotal('alchemy') > 9,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+18*Math.pow(3, level),
        }),
    },{
        id: 'enhancedAlchemy',
        name: 'Improved Alchemy',
        description: 'Unlock new alchemists jobs, allowing even more sophisticated flasks creation',
        isUnlocked: () => BasicResearch.getTotal('alchemy') > 9,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+18*Math.pow(3, level),
        }),
    },{
        id: 'memoryStones',
        name: 'Memory Stones',
        description: 'Unlocks crafting memory stones',
        isUnlocked: () => BasicResearch.getTotal('alchemy') > 9,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+18*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'crafting',
        name: 'Crafting',
        description: 'Each level increases crafting efficiency by 20%. Level 5 unlock new building and research',
        isUnlocked: () => BasicResearch.getTotal('memoryStones') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            memoryStones: 2*Math.pow(3, level),
            research: 1.e+19*Math.pow(3, level),
        }),
    },{
        id: 'territoryMemory',
        name: 'What is mine is mine',
        description: 'Your map progression and territory captured persists through resets',
        isUnlocked: () => BasicResearch.getTotal('memoryStones') > 0,
        maxLevel: 1,
        getCost: (level) => ({
            memoryStones: 1,
            research: 1.e+20*Math.pow(3, level),
        }),
    },{
        id: 'buildingMemory',
        name: 'Parallel Dimension',
        description: 'Brings your realm to parallel dimension, allowing you to embed memory stones into buildings, making them persist through resets',
        isUnlocked: () => BasicResearch.getTotal('territoryMemory') > 0,
        maxLevel: 1,
        getCost: (level) => ({
            memoryStones: 100,
            research: 1.e+21*Math.pow(3, level),
        }),
    },{
        id: 'darkIndustrialization',
        name: 'Dark Industrialization',
        description: 'Factory bonus also applied to blacksmiths and armorers efficiency',
        isUnlocked: () => BasicResearch.getTotal('crafting') > 4,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+22*Math.pow(3, level),
        }),
    },{
        id: 'engineering',
        name: 'Advanced Engineering',
        description: 'Unlocks new building and megastructures. Also each level decrease building resources costs by 10%',
        isUnlocked: () => BasicResearch.getTotal('darkIndustrialization') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+27*Math.pow(3, level),
        }),
    },{
        id: 'machinery',
        name: 'Machinery',
        description: 'Unlocks building Steamworks. In addition, adds one automation slot. Each level increase steamworks efficiency by 20%. Level 5 and 10 unlocks new research',
        isUnlocked: () => BasicResearch.getTotal('engineering') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+30*Math.pow(3, level),
        }),
    },{
        id: 'assemblyLines',
        name: 'Assembly Lines',
        description: 'Steamworks also boosts tools and weapons production',
        isUnlocked: () => BasicResearch.getTotal('machinery') > 0,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+34*Math.pow(3, level),
        }),
    },{
        id: 'memoryEfficiency',
        name: 'Memory Stones Efficiency',
        description: 'Decrease memory stones embed costs by 10%',
        isUnlocked: () => BasicResearch.getTotal('machinery') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+34*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'heirloomCharging',
        name: 'Heirloom Charging',
        description: 'Start dropping charge stones, allowing you to charge your heirlooms. Each level increases charge stones drop chance by 5%',
        isUnlocked: () => BasicResearch.getTotal('crafting') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+36*Math.pow(3, level),
        }),
    },{ // Changed
        id: 'auraCharging',
        name: 'Aura Charging',
        description: 'Start dropping charge gems, allowing you to charge your auras. Each level increases charge gems drop chance by 5%',
        isUnlocked: () => BasicResearch.getTotal('heirloomCharging') > 0 && BasicResearch.getResearchLevel('auras') > 0,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+45*Math.pow(3, level),
        }),
    },{
        id: 'advancedLogistics',
        name: 'Advanced Logistics',
        description: 'Each warehouse level provides an additional multiplicative 10% bonus to wood, stone, and ore storage',
        isUnlocked: () => BasicResearch.getTotal('machinery') > 4,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+45*Math.pow(3, level),
        }),
    },{
        id: 'chemistry',
        name: 'Chemistry',
        description: 'Unlocks building alchemists lab. Each level improves your alchemists performance by 20%. Level 5 unlocks new researches',
        isUnlocked: () => BasicResearch.getTotal('machinery') > 9,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+45*Math.pow(3, level),
        }),
    },{
        id: 'materials',
        name: 'Materials knowledge',
        description: 'Each level further decrease building material and memory embed cost by 10%.',
        isUnlocked: () => BasicResearch.getTotal('chemistry') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+48*Math.pow(3, level),
        }),
    },{
        id: 'advancedBanking',
        name: 'Advanced Banking',
        description: 'Each bank level provides an additional multiplicative 10% bonus to gold storage',
        isUnlocked: () => BasicResearch.getTotal('advancedLogistics') > 0,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+48*Math.pow(3, level),
        }),
    },{
        id: 'scientificApproach',
        name: 'Scientific Approach',
        description: 'Each level increase research points generation by 10% (multiplicative). Level 5 unlocks new research',
        isUnlocked: () => BasicResearch.getTotal('chemistry') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+48*Math.pow(3, level),
        }),
    },{
        id: 'dragoniteSmelting',
        name: 'Dragonite Smelting',
        description: 'Unlocks new resource - dragonite. Allow hiring dragon smelters. Each level increase dragonite output by 10%. Level 5 unlock new research',
        isUnlocked: () => BasicResearch.getTotal('materials') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+50*Math.pow(3, level),
        }),
    },{
        id: 'timeScience',
        name: 'Time Science',
        description: 'Embed memory costs increase x1.75 instead of x2 per memorized building level',
        isUnlocked: () => BasicResearch.getTotal('scientificApproach') > 4,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+52*Math.pow(3, level),
        }),
    },{
        id: 'battleScience',
        name: 'Battle Science',
        description: 'Using your latest research advances in battles allows you increase creatures precision and evasion by 20% (multiplicative)',
        isUnlocked: () => BasicResearch.getTotal('scientificApproach') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+52*Math.pow(3, level),
        }),
    },{
        id: 'dragoniteSmiths',
        name: 'Dragonite Smiths',
        description: 'Unlocks hiring dragon smiths, producing dragon smites. Can significantly boost weapons and tools production. Each level increase dragon smites output by 10%',
        isUnlocked: () => BasicResearch.getTotal('dragoniteSmelting') > 4,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+54*Math.pow(3, level),
        }),
    }];

    class BasicStatistics {

        static data = {
            currentRun: {},
            allRuns: {},
        }

        static keys = [
            {
                key: 'timeSpent',
                title: 'Time Spent',
                perRun: true,
                isUnlocked: () => true,
                transformValue: (val) => secondsToHms(val),
            },
            {
                key: 'numRuns',
                title: 'Banner Prestiges',
                perRun: false,
                isUnlocked: () => true,
                transformValue: (val) => fmtVal(val, undefined, 0),
            },
            {
                key: 'creaturesSummoned',
                title: 'Creatures Summoned',
                perRun: true,
                isUnlocked: () => true,
                transformValue: (val) => fmtVal(val, undefined, 0)
            },
            {
                key: 'creaturesLost',
                title: 'Creatures Lost',
                perRun: true,
                isUnlocked: () => true,
                transformValue: (val) => fmtVal(val, undefined, 0)
            },
            {
                key: 'researchesUnlocked',
                title: 'Researches Unlocked',
                isUnlocked: () => BasicResearch.isResearchUnlocked(),
                getValue: () => researchData.filter(one => one.isUnlocked()).length / researchData.length,
                transformValue: (val) => `${Math.round(val * 10000)/100}%`
            },
            {
                key: 'fightsWon',
                title: 'Fights Won',
                perRun: true,
                isUnlocked: () => BasicResearch.getResearchLevel('fighting') > 0,
                transformValue: (val) => fmtVal(val, undefined, 0)
            },
            {
                key: 'fightsLost',
                title: 'Fights Lost',
                perRun: true,
                isUnlocked: () => BasicResearch.getResearchLevel('fighting') > 0,
                transformValue: (val) => fmtVal(val, undefined, 0)
            },
            {
                key: 'heirloomsDropped',
                title: 'Heirlooms awarded',
                perRun: true,
                isUnlocked: () => BasicResearch.getResearchLevel('fighting') > 0,
                transformValue: (val) => fmtVal(val, undefined, 0)
            },
            {
                key: 'aurasDropped',
                title: 'Auras awarded',
                perRun: true,
                isUnlocked: () => BasicResearch.getResearchLevel('fighting') > 0,
                transformValue: (val) => fmtVal(val, undefined, 0)
            },
            {
                key: 'buildingsBuilt',
                title: 'Buildings Built',
                perRun: true,
                isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
                transformValue: (val) => fmtVal(val, undefined, 0)
            }
        ];

        static initialize(isBannerPrestige) {
            if(!isBannerPrestige || !BasicStatistics.data) {
                BasicStatistics.keys.forEach(one => {
                    BasicStatistics.data.allRuns[one.key] = 0;
                    BasicStatistics.data.currentRun[one.key] = 0;
                });
            } else {
                BasicStatistics.keys.forEach(one => {
                    BasicStatistics.data.currentRun[one.key] = 0;
                });
            }
            return BasicStatistics.data;
        }

        static inc(key, amount) {
            const foundKey = BasicStatistics.keys.find(one => one.key === key);
            if(!foundKey) return;
            if(!BasicStatistics.data.allRuns[key]) {
                BasicStatistics.data.allRuns[key] = 0;
            }
            BasicStatistics.data.allRuns[key] += amount;
            if(foundKey.perRun) {
                if(!BasicStatistics.data.currentRun[key]) {
                    BasicStatistics.data.currentRun[key] = 0;
                }
                BasicStatistics.data.currentRun[key] += amount;
            }
        }

        static list() {
            return BasicStatistics.keys.filter(one => one.isUnlocked()).map(one => {
                const value = one.getValue ? one.getValue() : BasicStatistics.data.allRuns[one.key];
                const valueCurrentRun = one.perRun ? BasicStatistics.data.currentRun[one.key] : null;
                return {
                    title: one.title,
                    key: one.key,
                    value: value === null ? '' : one.transformValue(value),
                    valueCurrentRun: valueCurrentRun === null ? '' : one.transformValue(valueCurrentRun),
                }
            })
        }

        static sendToUI() {
            console.log('Locked research: ', BasicStatistics.data.allRuns);
            ColibriWorker.sendToClient('set_statistics_state', BasicStatistics.list());
        }

    }

    class CreatureJobs {

        static workers = {};

        static initialize(isBannerPrestige) {
            if(isBannerPrestige && BasicResearch.getResearchLevel('bornToBringDeath') > 0) {
                CreatureJobs.workers = {};
                CreatureJobs.updateWorkers({id: 'supporter', amount: 5});
                CreatureJobs.updateWorkers({id: 'miner', amount: 3});
                CreatureJobs.updateWorkers({id: 'mage', amount: 1});
            }
        }

        static getFreeWorkers() {
            let free = CreatureBasic.numCreatures;
            Object.entries(CreatureJobs.workers).forEach(([jobId, state]) => {
                const workersPerJob = Math.min(free, state.current);
                CreatureJobs.workers[jobId].current = workersPerJob;
                free -= workersPerJob;
            });
            return free;
        }

        static getWorkerAmount(id) {
            return CreatureJobs.workers[id]?.current || 0;
        }

        static getWorkerSkip(id) {
            return CreatureJobs.workers[id]?.skip || false;
        }

        static updateWorkers({ id, amount, isConfirmed }) {
            let free = CreatureJobs.getFreeWorkers();
            if(amount > free) {
                amount = free;
            }
            if(amount < 0) {
                amount = Math.max(amount, -1 * (CreatureJobs.workers[id]?.current || 0));
            }
            if(!CreatureJobs.workers[id]) {
                CreatureJobs.workers[id] = {
                    current: 0,
                };
            }
            const bStats = BasicResources.getBalanceDifferences({
                creatureJobs: {
                    ...CreatureJobs.workers,
                    [id]: {current: CreatureJobs.workers[id].current + amount},
                }
            }, amount);
            // console.log('getRisk: ', bStats);
            if(!isConfirmed && bStats.isRisk && BasicSettings.settings.confirmationSettings?.whenGoNegative) {
                ColibriWorker.sendToClient('spawn_confirm', {
                    text: `Your changes can cause your ${bStats.riskResources.map(({ name }) => name).join(', ')} balance go negative. Are you sure?`,
                    onConfirmAction: {
                        type: 'change_workers',
                        payload: {
                            id,
                            amount,
                            isConfirmed: true,
                        }
                    },
                    onCancelAction: {
                        type: 'change_workers',
                        payload: {
                            id,
                            amount: bStats.optimum,
                            isConfirmed: true,
                        }
                    },
                    buttons: {
                        confirm: `Update worker amount`,
                        cancel: `Update to safe amount`
                    }
                });
                return;
            }
            CreatureJobs.workers[id].current += amount;
        }

        static reDistributeJobs() {
            const free = CreatureJobs.getFreeWorkers();
            const newJobsSet = CreatureJobsPresets.assignAccordingToPreset(
                CreatureJobs.workers,
                free,
            );
            if(newJobsSet && newJobsSet.newJobs) {
                // console.log('newJobs: ', newJobsSet.newJobs);
                for(let key in newJobsSet.newJobs) {
                    if(!CreatureJobs.workers[key]) {
                        CreatureJobs.workers[key] = {};
                    }
                    CreatureJobs.workers[key].current = newJobsSet.newJobs[key];
                }
            }
        }

        static updatePreset(id) {
            CreatureJobsPresets.setUsedPreset(id);
            if(id) {
                CreatureJobs.reDistributeJobs();
            }
        }

        static getList() {
            const free = CreatureJobs.getFreeWorkers();
            const jobs = jobsData.map(one => {

                return {
                    id: one.id,
                    name: one.name,
                    description: one.getDescription ? one.getDescription() : one.description,
                    category: one.category,
                    gain: one.getGain(1),
                    cost: one.getCost(1),
                    isUnlocked: one.isUnlocked(),
                    current: CreatureJobs.workers[one.id]?.current || 0,
                    efficiency: CreatureJobs.workers[one.id]?.efficiency,
                }
            });
            return {
                free,
                jobs,
                presets: CreatureJobsPresets.getState(),
            }
        }

        static getBalanceById(resourceId, updatedWorkers = null, bIgnoreEfficiency = false, logBreakdown = false) {
            let bal = 0;
            if(!updatedWorkers) {
                updatedWorkers = CreatureJobs.workers;
            }
            Object.entries(updatedWorkers).forEach(([jobId, state]) => {
                const jobData = jobsData.find(one => one.id === jobId);
                const gain = jobData.getGain(state.current);
                const cost = jobData.getCost(state.current);
                if(gain && gain[resourceId]) {
                    bal += gain[resourceId] * (bIgnoreEfficiency ? 1 : state.efficiency);
                }
                if(cost && cost[resourceId]) {
                    bal -= cost[resourceId] * (bIgnoreEfficiency ? 1 : state.efficiency);
                }
                /*if(logBreakdown) {
                    console.log('PER_CREEP: ', jobId, bal, state, gain);
                }*/
            });
            return bal;
        }

        static process(dT) {
            const free = CreatureJobs.getFreeWorkers();
            Object.entries(CreatureJobs.workers).forEach(([jobId, state]) => {
                const jobData = jobsData.find(one => one.id === jobId);
                const potCost = jobData.getCost(state.current);
                let efficiency = 1;
                Object.keys(potCost).forEach(resId => {
                    efficiency = Math.min(efficiency, BasicResources.efficiencies[resId]?.efficiency || 0);
                });
                if(efficiency < 1) {
                    for(const key in potCost) {
                        potCost[key] *= efficiency;
                    }
                }
                CreatureJobs.workers[jobId].efficiency = efficiency;
                BasicResources.checkResourcesAvailable(potCost);
                if(efficiency < 1 && jobData.isUnstable && CreatureJobs.workers[jobId].current > 0) {
                    CreatureJobs.workers[jobId].current = Math.max(0, CreatureJobs.workers[jobId].current - 1);
                    CreatureBasic.numCreatures--;
                    BasicStatistics.inc('creaturesLost', 1);
                    console.log(`Lost 1 creature from job: ${jobId}`, jobData, efficiency);
                } /* else
                if(hasEnough.totalPercentage < dT && CreatureJobs.workers[jobId].current > 0) { // won't be able to afford, skip
                    CreatureJobs.workers[jobId].skip = true;
                    if(jobData.isUnstable) {
                        CreatureJobs.workers[jobId].current = Math.max(0, CreatureJobs.workers[jobId].current - 1);
                        CreatureBasic.numCreatures--;
                    }
                } */ else {
                    CreatureJobs.workers[jobId].skip = false;
                    CreatureJobs.workers[jobId].prodThisTick = BasicResources.multBatch(jobData.getGain(state.current), dT * efficiency);
                    CreatureJobs.workers[jobId].consThisTick = BasicResources.multBatch(jobData.getCost(state.current), dT * efficiency);

                    BasicResources.addBatch(CreatureJobs.workers[jobId].prodThisTick);
                    BasicResources.subtractBatch(CreatureJobs.workers[jobId].consThisTick);
                }
            });
            if(free) {
                const id = CreatureJobsPresets.state.activePreset;
                if(id && CreatureJobsPresets.state.autoDistribute) {
                    const newJobsSet = CreatureJobsPresets.assignAccordingToPreset(
                        CreatureJobs.workers,
                        free,
                    );
                    if(newJobsSet && newJobsSet.newJobs && newJobsSet.expectedFree < free) {
                        console.log('reassigning creeps: ', newJobsSet);
                        for(let key in newJobsSet.newJobs) {
                            for(let key in newJobsSet.newJobs) {
                                if(!CreatureJobs.workers[key]) {
                                    CreatureJobs.workers[key] = {};
                                }
                                CreatureJobs.workers[key].current = newJobsSet.newJobs[key];
                            }
                        }
                    }
                }
            }
        }

        static sendToUI() {
            const info = CreatureJobs.getList();
            ColibriWorker.sendToClient('set_creatures_jobs_state', info);
        }

    }

    const buildingData = [{
        id: 'palace',
        name: 'Palace',
        description: 'Each level increase gold maximum and gold income by 10%. At level 4 new building is opened',
        getConstructionAmount: (level) => 1000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0.2 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => true,
        getCost: (level) => ({
            gold: 1.e+5 * Math.pow(2, level) * buildingCostModifier('gold'),
        }),
        getEmbedMemoryCost: (amount) => 2*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    },{
        id: 'warehouse',
        name: 'Warehouse',
        description: 'Each level allows to store some amount of building resources',
        getConstructionAmount: (level) => 2000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0.4 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => true,
        getCost: (level) => ({
            gold: 2.e+5 * Math.pow(2, level) * buildingCostModifier('gold'),
        }),
        getEmbedMemoryCost: (amount) => 4*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    },{
        id: 'harbour',
        name: 'Harbour',
        description: 'Each level increase storage materials',
        getConstructionAmount: (level) => 200000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 40 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('engineering') > 0,
        getCost: (level) => ({
            gold: 2.e+15 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 1.e+10 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 1.e+10 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 80*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    },{
        id: 'graveyard',
        name: 'Graveyard',
        description: 'Each level increase souls production and fight rewards by 20%',
        getConstructionAmount: (level) => 5000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+6 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 10 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 20 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 10*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    },{
        id: 'trainingCamp',
        name: 'Training Camp',
        description: 'Each level increase your creatures block by 2',
        getConstructionAmount: (level) => 5000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 4.e+6 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 20 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 20 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 10*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Military',
    },{
        id: 'trainingCenter',
        name: 'Training Center',
        description: 'Each level increase your creatures base precision by 5 and evasion by 4',
        getConstructionAmount: (level) => 5000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 4.e+6 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 160 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 20 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 10*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Military',
    },{
        id: 'lab',
        name: 'Military Lab',
        description: 'Each level increase your alchemists efficiency by 10%',
        getConstructionAmount: (level) => 500000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 10 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0 && BasicResearch.getResearchLevel('chemistry') > 0,
        getCost: (level) => ({
            gold: 4.e+13 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 1.e+9 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 2.e+9 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 120*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Military',
    },{
        id: 'academy',
        name: 'Academy',
        description: 'Each level increase research production by 20%',
        getConstructionAmount: (level) => 5000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 2.e+6 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 40 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 20 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 10*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Research',
    },{
        id: 'bank',
        name: 'Bank',
        description: 'Each level increase gold maximum and gold income by another 10%',
        getConstructionAmount: (level) => 10000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('banking') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+6 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 40 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 20 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 10*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    }, {
        id: 'monument',
        name: 'Monument of Yourself',
        description: 'Each level increase banners gain on prestige by 10%. This effect is multiplied by your total fame amount.',
        getConstructionAmount: (level) => 4000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0.2 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('palace') > 3,
        getCost: (level) => ({
            gold: 1.e+5 * Math.pow(2, level) * buildingCostModifier('gold'),
            stone: 100 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 20*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Development',
    }, {
        id: 'watchTower',
        name: 'Watch tower',
        description: 'Provides you possibility to search for better battle-places. Each level increase territory gain by 20%',
        getConstructionAmount: (level) => 25000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('cityPlanning') > 2 && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 4.e+6 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 1200 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 360 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 20*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Military',
    }, {
        id: 'mine',
        name: 'Mine',
        description: 'Unlock metal ore. Each level increase metal ore production by 10%',
        getConstructionAmount: (level) => 80000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 10 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 400 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 200 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 80*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    }, {
        id: 'forge',
        name: 'Forge',
        description: 'Allows hiring blacksmiths and armorers. Each level increase their efficiency by 10%',
        getConstructionAmount: (level) => 220000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 10 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining') && BasicBuilding.getBuildingLevel('mine') > 0,
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 400 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 3200 * Math.pow(2, level) * buildingCostModifier('materials'),
            ore: 800 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 80*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    }, {
        id: 'steamworks',
        name: 'Steamworks',
        description: 'Each level increase crafting efficiency by 20%. Bonus boosted by machinery level.',
        getConstructionAmount: (level) => 22000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 1000 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('machinery'),
        getCost: (level) => ({
            gold: 1.e+12 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 2.e+12 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 2.e+12 * Math.pow(2, level) * buildingCostModifier('materials'),
            ore: 8.e+12 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 400*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    }, {
        id: 'factory',
        name: 'Dark Factory',
        description: 'Each level increase crafting gains by 20%.',
        getConstructionAmount: (level) => 440000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 40 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('crafting') > 4 && BasicBuilding.getBuildingLevel('mine') > 0,
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 4000000 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 32000000 * Math.pow(2, level) * buildingCostModifier('materials'),
            ore: 80000000 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 160*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    }, {
        id: 'herbsGarden',
        name: 'Herbs garden',
        description: 'Improves your herbs and flasks output by 10%',
        getConstructionAmount: (level) => 220000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 10 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicResearch.getResearchLevel('herbalism'),
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(2, level) * buildingCostModifier('gold'),
            wood: 4.e+6 * Math.pow(2, level) * buildingCostModifier('materials'),
            stone: 2.e+6 * Math.pow(2, level) * buildingCostModifier('materials'),
            ore: 8000 * Math.pow(2, level) * buildingCostModifier('materials'),
        }),
        getEmbedMemoryCost: (amount) => 80*Math.pow(getEmbedCostMultiplier(), amount),
        category: 'Economy',
    },


    {
        id: 'pyramids',
        name: 'Pyramids',
        description: 'Each level decrease amount of souls required for creatures by 50%. Persists through resets.',
        getConstructionAmount: (level) => 2800000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('architecture') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 400 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 20000 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'zeusStatue',
        name: 'Zeus Statue',
        description: 'Each level increase your creatures attack by 10% (multiplicative), and unlock 5 additional zones at beginning of run. Persists through resets.',
        getConstructionAmount: (level) => 2800000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('oreMining') && BasicResearch.getResearchLevel('architecture') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(4, level) * buildingCostModifier('gold'),
            ore: 4000 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 20000 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'greatLibrary',
        name: 'The Great Library',
        description: 'Each level increase your research by 25%. Persists through resets.',
        getConstructionAmount: (level) => 2800000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('architecture') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+7 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 40000 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 20000 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'hallOfFame',
        name: 'Hall of Fame',
        description: 'Motivate your warriors to be more persistent at training. Each level increase your warriors precision and evasion by 25%. Persists through resets.',
        getConstructionAmount: (level) => 42800000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('levitation') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+8 * Math.pow(4, level) * buildingCostModifier('gold'),
            ore: 40000 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 20000 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'greatTreasury',
        name: 'Great Treasury',
        description: 'Each level increase your maximum gold by 50%. Persists through resets.',
        getConstructionAmount: (level) => 42800000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('levitation') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+8 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 400000 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 200000 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'bigGardens',
        name: 'Big Gardens',
        description: 'Each level increase your flasks production by 25%. Persists through resets.',
        getConstructionAmount: (level) => 4280000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('levitation') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+8 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 1.e+7 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 1.e+7 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'janusTemple',
        name: 'Janus Temple',
        description: 'Each level increase your memory stones craft output 25%. Persists through resets.',
        getConstructionAmount: (level) => 4280000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('levitation') && BasicResearch.getResearchLevel('memoryStones') && BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (level) => ({
            gold: 1.e+8 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 1.e+6 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 4.e+7 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'mausoleum',
        name: 'Mausoleum',
        description: 'Each level decrease your creatures cost exponent base by 5%, making summon price increase slower. Persists through resets.',
        getConstructionAmount: (level) => 44280000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('engineering'),
        getCost: (level) => ({
            gold: 1.e+11 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 1.e+9 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 4.e+10 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'greatFactory',
        name: 'Great Factory',
        description: 'Each level increase your blacksmiths and armorers production by 20%. Persists through resets.',
        getConstructionAmount: (level) => 44280000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('engineering'),
        getCost: (level) => ({
            gold: 1.e+11 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 1.e+10 * Math.pow(4, level) * buildingCostModifier('materials'),
            stone: 4.e+9 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'dragonVault',
        name: 'Dragon Vault',
        description: 'Each level increase your building and material resources capacity by 25% multiplicatively. Persists through resets.',
        getConstructionAmount: (level) => 4428000000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmelting'),
        getCost: (level) => ({
            gold: 1.e+16 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 1.e+14 * Math.pow(4, level) * buildingCostModifier('materials'),
            dragonithe: 1.e+11 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'dragonTreasury',
        name: 'Dragon Treasury',
        description: 'Each level increase your gold storage capacity by 25% multiplicatively. Persists through resets.',
        getConstructionAmount: (level) => 4428000000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmelting'),
        getCost: (level) => ({
            gold: 1.e+16 * Math.pow(4, level) * buildingCostModifier('gold'),
            wood: 1.e+14 * Math.pow(4, level) * buildingCostModifier('materials'),
            dragonithe: 1.e+11 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    },{
        id: 'dragonMemoryCore',
        name: 'Dragon Memory Core',
        description: 'Each level decrease memory stones embed cost by 20%',
        getConstructionAmount: (level) => 4428000000000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0,
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmelting'),
        getCost: (level) => ({
            gold: 1.e+16 * Math.pow(4, level) * buildingCostModifier('gold'),
            memoryStones: 1.e+8 * Math.pow(4, level) * buildingCostModifier('materials'),
            dragonithe: 1.e+11 * Math.pow(4, level) * buildingCostModifier('materials'),
        }),
        category: 'Megastructure',
    }];

    class BasicBuilding {

        static buildings = {};

        static buildingQueue = [];

        static usedLand = null;

        static initialize(isFromPrestige) {
            if(isFromPrestige && BasicBuilding.buildings) {
                Object.keys({...BasicBuilding.buildings}).forEach(id => {
                    const data = buildingData.find(one => one.id === id);
                    if((data.category !== 'Megastructure') && !BasicBuilding.buildings[id]?.memoryEmbedded) {
                        delete BasicBuilding.buildings[id];
                    } else
                    if(BasicBuilding.buildings[id].memoryEmbedded) {
                        BasicBuilding.buildings[id].level = BasicBuilding.buildings[id].memoryEmbedded;
                    }
                });
            } else {
                BasicBuilding.buildings = {};
            }

            BasicBuilding.usedLand = null;
            BasicBuilding.buildingQueue = [];
            return BasicBuilding.buildings;
        }

        static getBuildingLevel(id) {
            return BasicBuilding.buildings[id]?.level || 0;
        }

        static getMaxQueue() {
            return 2 + BasicResearch.getResearchLevel('urbanism');
        }

        static getBuildingCapability(dT = 1) {
            const jobData = jobsData.find(one => one.id === 'builder');
            const potCost = jobData.getCost(CreatureJobs.getWorkerAmount('builder'));
            BasicResources.checkResourcesAvailable(potCost);
            const effiency = CreatureJobs.getWorkerSkip('builder') ? 0 : 1;
            return effiency * CreatureJobs.getWorkerAmount('builder') * (
                1 + 0.2 * BasicResearch.getResearchLevel('building')
            ) * BasicBanners.getBonus('brown') * dT
                * (1 + BasicHeirlooms.getTotalBonus('creation'))
                * (1 + BasicAuras.getEffect('building'))
                * Math.pow(1.05, BasicResearch.getResearchLevel('levitation'));
        }

        static getBuildUntil1secondAmount(id) {
            // trickiest part is to determine where we hit this 1 second.
            const data = buildingData.find(one => one.id === id);
            const pLev = BasicBuilding.buildings[id]?.level || 0;
            const levInQueue = BasicBuilding.buildingQueue.filter(one => one.id === id).length;
            const startingLevel = pLev + levInQueue;
            let lvl = startingLevel;
            let price = data.getConstructionAmount(lvl) / BasicBuilding.getBuildingCapability();
            if(price > 1) return 0;
            return Math.floor(Math.log2(1/price));
        }

        static getUsedTerritory() {
            let usedLand = 0;
            for(const key in BasicBuilding.buildings) {
                const current = BasicBuilding.buildings[key];
                const data = buildingData.find(one => one.id === key);
                let pLev = current.level;
                if(current.isPurchased) {
                    pLev++;
                }
                const totalLand = Array.from({ length: pLev }).reduce(
                    (acc, item, level) => {
                        return acc + data.getTerritoryAmount(level)
                    },
                    0
                );
                usedLand += totalLand;
            }
            return usedLand;
        }

        static getUsedTerritoryCached() {
            if(BasicBuilding.usedLand == null) {
                BasicBuilding.usedLand = BasicBuilding.getUsedTerritory();
            }
            return BasicBuilding.usedLand;
        }

        static checkEnoughtTerritory(id, lvl) {
            const data = buildingData.find(one => one.id === id);
            const territoryToUse = data.getTerritoryAmount(lvl);
            return resourcesData.find(one => one.id === 'territory').getMax() >= territoryToUse + BasicBuilding.getUsedTerritory();
        }

        static getEmbedMemoryCost(data) {
            const state = BasicBuilding.buildings[data.id];
            if(!state) return null;
            if(!data.getEmbedMemoryCost) return null;
            if(state.level <= state.memoryEmbedded) return null;
            return data.getEmbedMemoryCost(state.memoryEmbedded || 0)
                * Math.pow(0.8, BasicResearch.getResearchLevel('memoryEfficiency'))
                * Math.pow(0.9, BasicResearch.getResearchLevel('materials'))
                * Math.pow(0.8, BasicBuilding.getBuildingLevel('dragonMemoryCore'));
        }

        static embedStones(id) {
            const data = buildingData.find(one => one.id === id);
            const cost = BasicBuilding.getEmbedMemoryCost(data);
            if(!cost) return;
            if(!BasicResources.resources.memoryStones || BasicResources.resources.memoryStones < cost) return;
            BasicResources.subtract('memoryStones', cost);
            BasicBuilding.buildings[id].memoryEmbedded = (BasicBuilding.buildings[id].memoryEmbedded || 0) + 1;
        }

        static listAvailable() {

            const findsInQueue = {};

            let timeTotal = 0;
            const queue = BasicBuilding.buildingQueue.map(one => {
                if(!findsInQueue[one.id]) {
                    findsInQueue[one.id] = 1;
                } else {
                    findsInQueue[one.id]++;
                }
                const item = buildingData.find(i => i.id === one.id);
                const foundState = BasicBuilding.buildings[one.id] || {
                    level: 0,
                };
                const time = BasicBuilding.getBuildingCapability() ? (item.getConstructionAmount(foundState.level + findsInQueue[one.id] - 1) - one.buildingProgress) / BasicBuilding.getBuildingCapability() : 1.e+308;
                timeTotal += time;
                return {
                    ...one,
                    name: item.name,
                    level: foundState.level + findsInQueue[one.id],
                    timeFmt: BasicBuilding.getBuildingCapability()
                    ? secondsToHms((item.getConstructionAmount(foundState.level + findsInQueue[one.id] - 1) - one.buildingProgress) / BasicBuilding.getBuildingCapability())
                    : 'Never',
            }

            });

            const list = buildingData.map((one) => {

                const foundState = BasicBuilding.buildings[one.id] || {
                    level: 0,
                };

                if(!findsInQueue[one.id]) {
                    findsInQueue[one.id] = 0;
                }

                const cost = one.getCost(foundState.level + findsInQueue[one.id]);

                const av = BasicResources.checkResourcesAvailable(cost);

                const territoryNeeded = one.getTerritoryAmount(foundState.level + findsInQueue[one.id]);

                const costShown = BasicResources.checkResourcesAvailable(cost);
                if(territoryNeeded) {
                    costShown.resources.territory = {
                        cost: territoryNeeded,
                        isAvailable: BasicBuilding.checkEnoughtTerritory(one.id, foundState.level + findsInQueue[one.id])
                    };
                }

                const embedMemoryStoneCost = BasicBuilding.getEmbedMemoryCost(one);


                return {
                    id: one.id,
                    name: one.name,
                    category: one.category,
                    description: one.description,
                    cost: costShown,
                    isUnlocked: one.isUnlocked(),
                    isAvailable: av.isAvailable && BasicBuilding.checkEnoughtTerritory(one.id, foundState.level + findsInQueue[one.id]),
                    ...foundState,
                    queued: findsInQueue[one.id] || 0,
                    maxBuildingProgress: one.getConstructionAmount(foundState.level + findsInQueue[one.id]),
                    timeFmt: BasicBuilding.getBuildingCapability()
                        ? secondsToHms((one.getConstructionAmount(foundState.level + findsInQueue[one.id])) / BasicBuilding.getBuildingCapability())
                        : 'Never',
                    buildingSpeed: BasicBuilding.getBuildingCapability(),
                    isEmbedMemoryStoneUnlocked: (BasicResearch.getResearchLevel('buildingMemory') > 0) && one.category !== 'Megastructure',
                    embedMemoryStoneCost,
                    embedMemoryStoneAvailable: embedMemoryStoneCost && embedMemoryStoneCost <= BasicResources.resources.memoryStones,
                    buildUntil1SecondAmount: BasicBuilding.getBuildUntil1secondAmount(one.id)
                }
            });

            return {
                list,
                queue,
                maxQueue: BasicBuilding.getMaxQueue(),
                timeQueued: timeTotal < 1.e+30 ? secondsToHms(timeTotal) : 'Never'
            }
        }

        static startBuildingUntil1Second(id) {
            const N = BasicBuilding.getBuildUntil1secondAmount(id);
            const maxQueue = BasicBuilding.getMaxQueue();
            const realBuild = Math.min(N, maxQueue - BasicBuilding.buildingQueue.length);
            if(realBuild > 0) {
                BasicBuilding.buildingQueue.push(...(Array.from({ length: realBuild }).map(one => ({
                    id,
                    isPurchased: false,
                    buildingProgress: 0,
                }))));
            }
        }

        static startBuilding(id) {
            let queuedAmount = 0;
            const maxQueue = BasicBuilding.getMaxQueue();
            for(let key in BasicBuilding.buildings) {
                /*if(BasicBuilding.buildings[key].inProgress) {
                    BasicBuilding.buildings[key].inProgress = false;
                }*/
                queuedAmount += BasicBuilding.buildings[key].queuedAmount;
            }
            if(BasicBuilding.buildingQueue.length >= maxQueue) {
                return;
            }
            if(!BasicBuilding.buildings[id]) {
                BasicBuilding.buildings[id] = {
                    level: 0,
                };
            }
            BasicBuilding.buildingQueue.filter(one => one.id === id);
            const data = buildingData.find(one => one.id === id);
            if(!data) {
                throw new Error(`Building ${id} not found`);
            }

            BasicBuilding.buildingQueue.push({
                id,
                isPurchased: false,
                buildingProgress: 0,
            });


            /*if(!BasicBuilding.buildings[id].isPurchased) {
                const cost = data.getCost(BasicBuilding.buildings[id].level + amountQueued);
                const availability = BasicResources.checkResourcesAvailable(cost);
                if(!availability.isAvailable) {
                    return;
                }
                BasicResources.subtractBatch(cost);
                BasicBuilding.buildings[id].isPurchased = true;
                BasicBuilding.usedLand = null; // reset cache
            }
            if(queuedAmount <= 0) {
                BasicBuilding.buildings[id].inProgress = true;
                BasicBuilding.buildings[id].queuedAmount++;
            }*/

        }

        static cancelBuilding(index) {
            if(index > 0 && index < BasicBuilding.buildingQueue.length) {
                BasicBuilding.buildingQueue.splice(index, 1);
            }
        }

        static process(dT) {
            if(!BasicBuilding.buildingQueue.length) {
                return;
            }
            const [firstInQueue] = BasicBuilding.buildingQueue;

            const data = buildingData.find(one => one.id === firstInQueue.id);

            if(!BasicBuilding.buildings[firstInQueue.id]) {
                BasicBuilding.buildings[firstInQueue.id] = {
                    level: 0,
                };
            }

            if(!firstInQueue.isPurchased) {
                const cost = data.getCost(BasicBuilding.buildings[firstInQueue.id].level);
                const availability = BasicResources.checkResourcesAvailable(cost);
                if(!availability.isAvailable || !BasicBuilding.checkEnoughtTerritory(firstInQueue.id, BasicBuilding.buildings[firstInQueue.id].level)) {
                    BasicBuilding.buildingQueue.shift();
                    return;
                }
                BasicResources.subtractBatch(cost);
                BasicBuilding.buildingQueue[0].isPurchased = true;
                BasicBuilding.usedLand = null;
            }
            BasicBuilding.buildingQueue[0].buildingProgress += BasicBuilding.getBuildingCapability(dT);

            if(BasicBuilding.buildingQueue[0].buildingProgress >= data.getConstructionAmount(BasicBuilding.buildings[firstInQueue.id].level)) {
                BasicBuilding.usedLand = null;
                BasicBuilding.buildings[firstInQueue.id].level++;
                BasicBuilding.buildingQueue.shift();
                BasicStatistics.inc('buildingsBuilt', 1);
                if(BasicSettings.settings.notificationsSettings.whenBuildingBuilt) {
                    ColibriWorker.sendToClient('spawn_notification', {
                        message: `You finished building ${data.name}.`
                    });
                }
            }
            /*for(let key in BasicBuilding.buildings) {
                if(BasicBuilding.buildings[key].inProgress) {
                    BasicBuilding.buildings[key].buildingProgress += BasicBuilding.getBuildingCapability(dT);
                    const one = buildingData.find(item => item.id === key);
                    // check if done
                    if(BasicBuilding.buildings[key].buildingProgress >= one.getConstructionAmount(BasicBuilding.buildings[key].level)) {
                        BasicBuilding.buildings[key].level++;
                        BasicBuilding.buildings[key].isPurchased = false;
                        BasicBuilding.buildings[key].inProgress = false;
                        BasicBuilding.buildings[key].buildingProgress = 0;
                        if(BasicSettings.settings.notificationsSettings.whenBuildingBuilt) {
                            ColibriWorker.sendToClient('spawn_notification', {
                                message: `You finished building ${one.name}.`
                            })
                        }
                    }
                }
            }*/
        }

        static sendToUI() {
            ColibriWorker.sendToClient('set_buildings_state', BasicBuilding.listAvailable());
        }

    }

    const getSpellMultiplier = () => {
        return BasicBanners.getBonus('green')
            * (1 + 0.25 * BasicResearch.getResearchLevel('spellMaster'))
            * (1 + 0.25*(ShopItems.purchased.magicStamp ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.appretienceManual ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.advancedMagic ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.advancedMagic2 ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.advancedMagic3 ? 1 : 0))
            * Math.pow(1.01, BasicSkills.skillLevel('magic'))
            * (1 + BasicAuras.getEffect('spellEfficiency'))
    };


    const getExpansionEffect = () => {
        return 5 * getSpellMultiplier();
    };

    const getEnergyOrbEffect = () => {
        return 2 * getSpellMultiplier();
    };

    const getPackingEffect = () => {
        return 0.0001 * getSpellMultiplier();
    };

    const getResourceMult = (id) => {
        if(id === 'gold') {
            let mlt = 1;
            if(BasicTemper.getCurrentTemper() === 'saving') {
                mlt = 1.2;
            }
            mlt *= 1 + BasicHeirlooms.getTotalBonus('greediness');

            mlt *= 1 + BasicAuras.getEffect('gold');

            return mlt * (1 + 0.1 * BasicBuilding.getBuildingLevel('palace')) * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('bank')
            );
        }
        if(id === 'energy') {
            let mlt = 1;
            if(BasicTemper.getCurrentTemper() === 'energetic') {
                mlt = 1.2;
            }

            mlt *= 1 + BasicAuras.getEffect('energy');

            return mlt;
        }
        if(id === 'mana') {
            let mlt = 1;
            if(BasicTemper.getCurrentTemper() === 'spiritual') {
                mlt = 1.2;
            }

            mlt *= 1 + BasicAuras.getEffect('mana');

            return mlt;
        }
        if(id === 'souls') {

            let mlt = (1 + 0.2 * BasicBuilding.getBuildingLevel('graveyard'))
            * (1 + BasicHeirlooms.getTotalBonus('soulharvest'));

            mlt *= 1 + BasicAuras.getEffect('souls');

            return mlt;
        }
        if(id === 'flasks') {
            let mlt = (1 + 0.1 * BasicBuilding.getBuildingLevel('herbsGarden'))
                * (1 + BasicHeirlooms.getTotalBonus('flasks'));

            mlt *= (1 + 0.1*BasicResearch.getResearchLevel('herbalism'));

            mlt *= (1 + 0.25 * BasicBuilding.getBuildingLevel('bigGardens'));

            return mlt;
        }
        if(id === 'herbs') {
            let mlt = (1 + 0.1 * BasicBuilding.getBuildingLevel('herbsGarden'))
                * (1 + BasicHeirlooms.getTotalBonus('herbs'));

            mlt *= (1 + 0.1*BasicResearch.getResearchLevel('herbalism'));

            return mlt;
        }
        if(id === 'research') {
            let mlt = (1 + 0.2 * BasicResearch.getResearchLevel('darkExperiments'))
                * (1 + BasicHeirlooms.getTotalBonus('intellect'));
            if(BasicTemper.getCurrentTemper() === 'wise') {
                mlt *= 1.2;
            }
            mlt *= (1 + 0.25 * BasicBuilding.getBuildingLevel('greatLibrary'));

            mlt *= (1 + BasicAuras.getEffect('research'));

            mlt *= Math.pow(1.1, BasicResearch.getResearchLevel('scientificApproach'));

            return mlt * (1 + (0.2 + 0.05 * BasicResearch.getResearchLevel('darkExperiments'))
                * BasicBuilding.getBuildingLevel('academy'))
        }
        if(id === 'ore') {
            let mlt = 1 + 0.1 * BasicBuilding.getBuildingLevel('mine');

            mlt *= (1 + 0.1 * BasicResearch.getResearchLevel('oreMining'));

            mlt *= 1 + BasicAuras.getEffect('ore');

            return mlt;
        }
        if(id === 'dragonite') {
            let mlt = 1 + 0.1 * BasicResearch.getResearchLevel('dragoniteSmelting');

            return mlt;
        }
        if(id === 'dragoniteTools') {
            let mlt = 1 + 0.1 * BasicResearch.getResearchLevel('dragoniteSmiths');

            return mlt;
        }
        if(id === 'tools') {
            let mlt = (1 + 0.1 * BasicBuilding.getBuildingLevel('forge'))
                * (1 + BasicHeirlooms.getTotalBonus('blacksmith'));

            mlt *= 1 + BasicAuras.getEffect('tools');

            if(BasicResearch.getResearchLevel('darkIndustrialization')) {
                mlt *= 1 + 0.2 * BasicBuilding.getBuildingLevel('factory');
            }

            mlt *= 1 + 0.2 * BasicBuilding.getBuildingLevel('greatFactory');

            if(BasicResearch.getResearchLevel('assemblyLines')) {
                mlt *= 1 + (0.2 + 0.04*BasicResearch.getResearchLevel('machinery'))*BasicBuilding.getBuildingLevel('steamworks');
            }

            mlt *= BasicResources.getDragonToolsEffect();

            return mlt;
        }
        if(id === 'weapons') {
            let mlt = (1 + 0.1 * BasicBuilding.getBuildingLevel('forge'))
                * (1 + BasicHeirlooms.getTotalBonus('armorer'));

            mlt *= 1 + BasicAuras.getEffect('weapons');

            mlt *= 1 + 0.2 * BasicBuilding.getBuildingLevel('greatFactory');

            if(BasicResearch.getResearchLevel('darkIndustrialization')) {
                mlt *= 1 + 0.2 * BasicBuilding.getBuildingLevel('factory');
            }

            if(BasicResearch.getResearchLevel('assemblyLines')) {
                mlt *= 1 + (0.2 + 0.04*BasicResearch.getResearchLevel('machinery'))*BasicBuilding.getBuildingLevel('steamworks');
            }

            mlt *= BasicResources.getDragonToolsEffect();

            return mlt;
        }
        if(id === 'flasksOfAgility') {
            let mlt = 1 + 0.1 * BasicResearch.getResearchLevel('alchemy');

            mlt *= (1 + BasicHeirlooms.getTotalBonus('agilityFlasks'));

            mlt *= 1 + BasicAuras.getEffect('flasksOfAgility');

            mlt *= (1 + 0.2 * BasicResearch.getResearchLevel('chemistry'));

            mlt *= (1 + 0.1 * BasicBuilding.getBuildingLevel('lab'));

            return mlt;
        }
        if(id === 'flasksOfEndurance') {
            let mlt = 1;

            mlt *= (1 + BasicHeirlooms.getTotalBonus('enduranceFlasks'));

            mlt *= 1 + BasicAuras.getEffect('flasksOfEndurance');

            mlt *= (1 + 0.2 * BasicResearch.getResearchLevel('chemistry'));

            mlt *= (1 + 0.1 * BasicBuilding.getBuildingLevel('lab'));

            return mlt;
        }
        if(id === 'flasksOfAggression') {
            let mlt = 1;

            mlt *= (1 + BasicHeirlooms.getTotalBonus('aggressionFlasks'));

            mlt *= 1 + BasicAuras.getEffect('flasksOfAggression');

            mlt *= (1 + 0.2 * BasicResearch.getResearchLevel('chemistry'));

            mlt *= (1 + 0.1 * BasicBuilding.getBuildingLevel('lab'));

            return mlt;
        }
        if(id === 'memoryStones') {
            let mlt = 1 + 0.25 * BasicBuilding.getBuildingLevel('janusTemple');
            mlt *= 1 + 0.2 * BasicBuilding.getBuildingLevel('factory');
            mlt *= 1 + (0.2 + 0.04*BasicResearch.getResearchLevel('machinery'))*BasicBuilding.getBuildingLevel('steamworks');

            return mlt;
        }
        return 1.0;
    };

    const buildingCostModifier = (type) => {
        let mlt = 1.;
        if(type === 'territory' || type === 'gold') {
            mlt *= Math.pow(0.9, BasicResearch.getResearchLevel('cityPlanning'));
        }

        if(type === 'materials') {
            mlt *= Math.pow(0.9, BasicResearch.getResearchLevel('engineering'))
                * Math.pow(0.9, BasicResearch.getResearchLevel('materials'));
        }

        mlt /= 1 + BasicAuras.getEffect('buildingCost');

        return mlt;
    };

    const territotyPerZone = (index) => 0.04*Math.pow(1.3, index)
        * (1 + 0.2 * BasicBuilding.getBuildingLevel('watchTower'))
        * (1 + BasicHeirlooms.getTotalBonus('expansion'))
        * (1 + BasicAuras.getEffect('territory'));

    const getEmbedCostMultiplier = () => {
        return 2.0 - BasicResearch.getResearchLevel('timeScience') * 0.25;
    };

    const globalMult = () => {
        const mlt = (1 + (ShopItems.purchased.summoningJobs ? 0.1 : 0))*BasicResources.getFlasksEffect()
        *BasicResources.getToolsEffect()
        * (1 + 0.2 * BasicResearch.getResearchLevel('motivation'));
        if(Number.isNaN(mlt)) {
            console.error('NaN mult: ', mlt, BasicResources.getFlasksEffect(), BasicResources.resources.flasks);
        }
        return mlt;
    };

    const jobsData = [{
        id: 'supporter',
        name: 'Supporter',
        description: 'Gathers energy',
        isUnlocked: () => true,
        getCost: (amount) => ({
            gold: 0.5*amount,
        }),
        getGain: (amount) => ({
            energy: 7 * amount * globalMult() * BasicBanners.getBonus('orange') * getResourceMult('energy'),
        }),
        category: 'Basic',
    },{
        id: 'miner',
        name: 'Miner',
        description: 'Gathers gold',
        isUnlocked: () => true,
        getCost: (amount) => ({
            energy: amount,
        }),
        getGain: (amount) => ({
            gold: 3 * amount * globalMult() * BasicBanners.getBonus('yellow') * getResourceMult('gold'),
        }),
        category: 'Basic',
    },{
        id: 'mage',
        name: 'Mage',
        description: 'Gathers mana',
        isUnlocked: () => true,
        getCost: (amount) => ({
            energy: amount,
            gold: 10 * amount,
        }),
        getGain: (amount) => ({
            mana: 0.3 * amount * globalMult() * BasicBanners.getBonus('blue') * getResourceMult('mana'),
        }),
        category: 'Basic',
    },{
        id: 'researcher',
        name: 'Dark Researcher',
        description: 'Gathers research points (RP)',
        isUnlocked: () => BasicResearch.isResearchUnlocked(),
        getCost: (amount) => ({
            energy: amount,
            mana: 20 * amount,
        }),
        getGain: (amount) => ({
            research: 0.1 * amount * globalMult() * BasicBanners.getBonus('violet') * getResourceMult('research'),
        }),
        category: 'Research',
    },{
        id: 'fighter',
        name: 'Fighter',
        description: 'Fights and captures new territories for you',
        isUnlocked: () => BasicResearch.getResearchLevel('fighting') > 0,
        getCost: (amount) => ({
            gold: 30 * amount,
            mana: 50 * amount,
        }),
        getGain: (amount) => ({

        }),
        isUnstable: true,
        category: 'Combat',
    },{
        id: 'sergeant',
        name: 'Sergeant',
        getDescription: () => `Improves fighter attack and HP by ${fmtVal(20 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics')))}%`,
        isUnlocked: () => BasicResearch.getResearchLevel('combatTactics') > 0,
        getCost: (amount) => ({
            gold: 800 * amount,
            mana: 400 * amount,
        }),
        getGain: (amount) => ({

        }),
        isUnstable: true,
        category: 'Combat',
    },{
        id: 'trainer',
        name: 'Trainer',
        getDescription: () => `Improves fighter accuracy and evasion by ${fmtVal(10 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics')))}%`,
        isUnlocked: () => BasicResearch.getResearchLevel('combatTactics') > 0,
        getCost: (amount) => ({
            gold: 500 * amount,
            mana: 800 * amount,
        }),
        getGain: (amount) => ({

        }),
        isUnstable: true,
        category: 'Combat',
    },{
        id: 'builder',
        name: 'Builder',
        description: 'Allows you building',
        isUnlocked: () => BasicResearch.getResearchLevel('building') > 0,
        getCost: (amount) => ({
            gold: 1500 * amount,
            mana: 100 * amount,
        }),
        getGain: (amount) => ({

        }),
        category: 'Building',
    },{
        id: 'woodcutter',
        name: 'Woodcutter',
        description: 'Provides raw material for building. Although it seems pretty cheap material, for some reason it\'s pretty hard to teach your creatures to cut wood',
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (amount) => ({
            gold: 1500 * amount,
            mana: 100 * amount,
        }),
        getGain: (amount) => ({
            wood: 0.02 * amount * globalMult() * BasicBanners.getBonus('brown')
        }),
        category: 'Building'
    },{
        id: 'stonecutter',
        name: 'Stonecutter',
        description: 'Provides stone for building.',
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: (amount) => ({
            gold: 1200 * amount,
            mana: 200 * amount,
        }),
        getGain: (amount) => ({
            stone: 0.01 * amount * globalMult() * BasicBanners.getBonus('brown')
        }),
        category: 'Building'
    },{
        id: 'oreMiner',
        name: 'Ore Miner',
        description: 'Provides metal ore.',
        isUnlocked: () => BasicBuilding.getBuildingLevel('mine') > 0,
        getCost: (amount) => ({
            gold: 1200 * amount,
            mana: 200 * amount,
            stone: 200 * amount
        }),
        getGain: (amount) => ({
            ore: 0.01 * amount * globalMult() * getResourceMult('ore')
        }),
        category: 'Material'
    },{
        id: 'blacksmith',
        name: 'Blacksmith',
        description: 'Converts ore to make tools.',
        isUnlocked: () => BasicBuilding.getBuildingLevel('forge') > 0,
        getCost: (amount) => ({
            gold: 5000 * amount,
            mana: 1000 * amount,
            ore: 20 * amount
        }),
        getGain: (amount) => ({
            tools: 0.01 * amount * globalMult() * getResourceMult('tools')
        }),
        category: 'Material'
    },{
        id: 'armorer',
        name: 'Armorer',
        description: 'Converts ore and wood to make weapons for your creatures.',
        isUnlocked: () => BasicBuilding.getBuildingLevel('forge') > 0,
        getCost: (amount) => ({
            gold: 5000 * amount,
            mana: 1000 * amount,
            ore: 20 * amount
        }),
        getGain: (amount) => ({
            weapons: 0.01 * amount * globalMult() * getResourceMult('weapons')
        }),
        category: 'Material'
    },{
        id: 'dragoniteSmelter',
        name: 'Draginite Smelter',
        description: 'Smelts gold, souls and mana into dragonite.',
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmelting') > 0,
        getCost: (amount) => ({
            gold: 1.e+27 * amount,
            mana: 1.e+24 * amount,
            souls: 1.e+13 * amount
        }),
        getGain: (amount) => ({
            dragonithe: 1.e-9 * amount * globalMult() * getResourceMult('dragonite')
        }),
        category: 'Material'
    },{
        id: 'dragoniteSmith',
        name: 'Dragonite Smith',
        description: 'Consumes dragonite and gold, produces dragonite tools.',
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmiths') > 0,
        getCost: (amount) => ({
            gold: 1.e+30 * amount,
            dragonithe: 1.e+12 * amount,
        }),
        getGain: (amount) => ({
            dragoniteTools: 1.e-12 * amount * globalMult() * getResourceMult('dragoniteTools')
        }),
        category: 'Material'
    },{
        id: 'alchemistAgility',
        name: 'Alchemist (flask of agility)',
        description: 'Converts your flasks and research into flasks of agility, that provides bonus to your creatures evasion and accuracy',
        isUnlocked: () => BasicResearch.getResearchLevel('alchemy') > 0,
        getCost: (amount) => ({
            gold: 50000 * amount,
            flasks: 100 * amount,
            research: 200000 * amount
        }),
        getGain: (amount) => ({
            flasksOfAgility: 0.01 * amount * globalMult() * getResourceMult('flasksOfAgility')
        }),
        category: 'Alchemy'
    },{
        id: 'alchemistEndurance',
        name: 'Alchemist (flask of endurance)',
        description: 'Converts your flasks and research into flasks of endurance, that provides bonus to your creatures HP',
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy') > 0,
        getCost: (amount) => ({
            gold: 5.e+6 * amount,
            flasks: 2.e+7 * amount,
            research: 2.e+14 * amount
        }),
        getGain: (amount) => ({
            flasksOfEndurance: 0.0005 * amount * globalMult() * getResourceMult('flasksOfEndurance')
        }),
        category: 'Alchemy'
    },{
        id: 'alchemistAggression',
        name: 'Alchemist (flask of aggression)',
        description: 'Converts your flasks and research into flasks of aggression, that provides bonus to your creatures damage',
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy') > 0,
        getCost: (amount) => ({
            gold: 5.e+6 * amount,
            flasks: 2.e+7 * amount,
            research: 2.e+14 * amount
        }),
        getGain: (amount) => ({
            flasksOfAggression: 0.0005 * amount * globalMult() * getResourceMult('flasksOfAggression')
        }),
        category: 'Alchemy'
    }];

    class CreatureBasic {

        static numCreatures = 0;

        static settings = {
            amount: 1,
        };

        static getSummonCost(amt = 1) {
            let sls = 0;
            let mult = 1.;
            if(BasicTemper.getCurrentTemper() === 'authoritative') {
                mult = 0.8;
            }
            if(ShopItems.purchased['boneMasterity']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity2']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity3']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity4']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity5']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity6']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity7']) {
                mult *= 0.25;
            }
            mult *= Math.pow(0.5, BasicBuilding.getBuildingLevel('pyramids'));
            /*for(let i = 0; i < amt; i++) {
                sls += mult * Math.pow(
                    (1.0 + 0.075 * Math.pow(0.95,
                        BasicResearch.getResearchLevel('necromancery')
                        + BasicResearch.getResearchLevel('summoner')
                    )),
                    (CreatureBasic.numCreatures + i)
                )
            }*/
            let base = (1.0 + 0.075 * Math.pow(0.95,
                BasicResearch.getResearchLevel('necromancery')
                + BasicResearch.getResearchLevel('summoner')
            ) * Math.pow(0.95, BasicBuilding.getBuildingLevel('mausoleum')));
            sls = (mult * Math.pow(base,CreatureBasic.numCreatures)*(Math.pow(base, amt) - 1))/(base-1);

            return {
                souls: sls,
            }
        }

        static getMaxSummonable() {
            const souls = BasicResources.resources.souls || 0;

            let base = (1.0 + 0.075 * Math.pow(0.95,
                BasicResearch.getResearchLevel('necromancery')
                + BasicResearch.getResearchLevel('summoner'))
                * Math.pow(0.95, BasicBuilding.getBuildingLevel('mausoleum'))
            );

            let mult = 1.;
            if(BasicTemper.getCurrentTemper() === 'authoritative') {
                mult = 0.8;
            }
            if(ShopItems.purchased['boneMasterity']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity2']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity3']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity4']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity5']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity6']) {
                mult *= 0.25;
            }
            if(ShopItems.purchased['boneMasterity7']) {
                mult *= 0.25;
            }
            mult *= Math.pow(0.5, BasicBuilding.getBuildingLevel('pyramids'));

            // sls * (base-1) / mult = Math.pow(base,CreatureBasic.numCreatures)*(Math.pow(base, amt) - 1);
            // Math.pow(base, amt) = 1 + sls * (base-1) / (mult * Math.pow(base,CreatureBasic.numCreatures))
            // amt = log_base (...)
            return Math.floor(Math.log(1 + souls * (base-1) / (mult * Math.pow(base,CreatureBasic.numCreatures))) / Math.log(base));
        }

        static getBalanceById(resourceId) {
            if(resourceId === 'energy') {
                return -CreatureBasic.getEnergyConsumption();
            }
            return 0;
        }

        static getConsumptionPerCreature() {
            return (5 - (ShopItems.purchased.betterSummoning ? 0.5 : 0))
                * (1 + 0.1 * BasicResearch.getResearchLevel('motivation'));
        }

        static getEnergyConsumption(add = 0) {
            return (CreatureBasic.numCreatures + add)
                * CreatureBasic.getConsumptionPerCreature();
        }

        static initialize(isBannerPrestige) {
            CreatureBasic.numCreatures = 0;
            if(isBannerPrestige && BasicResearch.getResearchLevel('bornToBringDeath') > 0) {
                CreatureBasic.numCreatures = 9;
            }
            if(!CreatureBasic.settings) {
                CreatureBasic.settings = {
                    amount: 1,
                };
            }

        }

        static getMaxCreatures() {
            const enRestriction = Math.floor(0.5 * resourcesData.find(one => one.id === 'energy').getMax() / CreatureBasic.getConsumptionPerCreature()) - CreatureBasic.numCreatures;

            const slsRestriction = CreatureBasic.getMaxSummonable();

            return Math.min(enRestriction, slsRestriction);
        }

        static getInfo() {
            const bcost = BasicResources.checkResourcesAvailable(CreatureBasic.getSummonCost(CreatureBasic.settings.amount));
            if(bcost.isAvailable) {
                bcost.isAvailable = resourcesData.find(one => one.id === 'energy').getMax() >= CreatureBasic.getEnergyConsumption(CreatureBasic.settings.amount) * 2.0;
            }
            return {
                numCreatures: CreatureBasic.numCreatures,
                cost: bcost,
                energyRequired: CreatureBasic.getEnergyConsumption(CreatureBasic.settings.amount) * 2.0,
                isEnoughEnergy: CreatureBasic.getEnergyConsumption(CreatureBasic.settings.amount) * 2.0 <= resourcesData.find(one => one.id === 'energy').getMax(),
                ...CreatureBasic.settings,
                consumptionPerCreature: CreatureBasic.getConsumptionPerCreature(),
                max: CreatureBasic.getMaxCreatures(),
            }
        }

        static summonCreature(quantity) {
            let amt = CreatureBasic.settings.amount;
            if(!amt || Number.isNaN(amt)) {
                amt = 1;
            }
            if(quantity > 1.e+300) {
                amt = CreatureBasic.getMaxCreatures();
            }
            const creatureCost = CreatureBasic.getSummonCost(amt);
            const cost = BasicResources.checkResourcesAvailable(creatureCost);
            if(cost.isAvailable) {
                cost.isAvailable = resourcesData.find(one => one.id === 'energy').getMax() >= CreatureBasic.getEnergyConsumption(amt) * 2.0;
            }
            if(cost.isAvailable) {
                BasicResources.subtractBatch(creatureCost);
                CreatureBasic.numCreatures += amt;
                BasicStatistics.inc('creaturesSummoned', amt);
            }
        }

        static setAmount(amount) {
            if (!amount || Number.isNaN(amount)) {
                amount = 1;
            }
            if(amount > 10000) {
                amount = 10000;
            }
            CreatureBasic.settings.amount = Math.max(Math.round(amount), 1);
        }

        static process(dT) {
            if(!CreatureBasic.settings.amount) {
                CreatureBasic.settings.amount = 1;
            }
            if(CreatureBasic.numCreatures < 0) {
                CreatureBasic.numCreatures = 0;
            }
            BasicResources.subtract('energy', CreatureBasic.getEnergyConsumption()
                * dT);
            if(BasicBanners.options?.automation?.isTurnedOn) {
                const max = CreatureBasic.getMaxCreatures();
                if(max > 0) {
                    CreatureBasic.summonCreature(1.e+306);
                }
            }
        }

        static postProcess(dT) {
            if(BasicResources.resources.energy <= 0 && CreatureBasic.numCreatures > 0) {
                const loss = Math.max(1, Math.round(0.1*CreatureBasic.numCreatures));
                CreatureBasic.numCreatures -= loss;
                BasicStatistics.inc('creaturesLost', loss);
                console.log(`Lost ${loss} creatures in post-process`);
                if(CreatureBasic.numCreatures < 0) {
                    CreatureBasic.numCreatures = 0;
                }
                if(BasicSettings.settings.notificationsSettings.whenCreatureDies) {
                    ColibriWorker.sendToClient('spawn_notification', {
                        message: `You lost ${loss} creatures due to lack of energy.`,
                        color: '#da3842',
                    });
                }
                BasicResources.resources.energy = 0;
            }
        }

        static sendToUI() {
            const info = CreatureBasic.getInfo();
            ColibriWorker.sendToClient('set_creatures_state', info);
        }

    }

    class BasicBanners {

        static banners = {};
        static prevBanners = {};
        static options = {
            automation: {
                isTurnedOn: false,
                bannerId: '',
                numCreatures: 51,
            }

        }

        static fillDefaultTiers() {
            return Array.from({length: 6}).map((one, index) => ({
                amount: 0,
            }))
        }

        static getBannersOnPrestige = () => {
            let altFame = BasicResources.getResource('fame');
            if(BasicBanners.options?.automation?.isTurnedOn) {
                if(BasicResearch.getResearchLevel('autoFame')) {
                    altFame = 0.25*Math.pow(1.2,BasicMap.state.bossesArena?.maxBossLevel || 0) / 50;
                }
            }
            return CreatureBasic.numCreatures
                * (1 + 0.1 * BasicBuilding.getBuildingLevel('monument')
                    * (1 + altFame)
                );
        }

        static initialize(isBannerPrestige) {
            BasicBanners.banners = {
                orange: BasicBanners.fillDefaultTiers(),
                yellow: BasicBanners.fillDefaultTiers(),
                blue: BasicBanners.fillDefaultTiers(),
                green: BasicBanners.fillDefaultTiers()
            };
            if(!isBannerPrestige || !BasicBanners.options) {
                BasicBanners.options = {
                    automation: {
                        isTurnedOn: false,
                        bannerId: '',
                        numCreatures: 51,
                    }

                };
            }
            return BasicBanners.banners;
        }

        static setAutomationOption(key, value) {
            if(!BasicBanners.options) {
                BasicBanners.options = {

                };
            }
            if(!BasicBanners.options.automation) {
                BasicBanners.options.automation = {
                    isTurnedOn: false,
                    bannerId: 'green',
                    numCreatures: 51,
                };
            }
            BasicBanners.options.automation[key] = value;
            if(Number.isNaN(BasicBanners.options.automation.numCreatures) || BasicBanners.options.automation.numCreatures < 51) {
                BasicBanners.options.automation.numCreatures = 51;
            }
            console.log('BasicBanners.options.automation', BasicBanners.options.automation);
        }

        static saveBannersToPrev() {
            BasicBanners.prevBanners = {};
            Object.entries(BasicBanners.banners).forEach(([key, tiers]) => {
                BasicBanners.prevBanners[key] = [...tiers.map(one => ({...one}))];
            });
        }

        static revert(id) {
            if(BasicBanners.prevBanners[id]) {
                BasicBanners.banners[id] = [...BasicBanners.prevBanners[id].map(one => ({...one}))];
            }
        }

        static isChanged(id) {
            if(!BasicBanners.prevBanners || !BasicBanners.prevBanners[id]) return false;
            if(!BasicBanners.banners) return false;
            if(!BasicBanners.banners[id]) return true;
            for(let index of Array.from({ length: 6 }).keys()) {
                if(BasicBanners.banners[id]?.[index]?.amount !== BasicBanners.prevBanners[id]?.[index]?.amount) {
                    // console.log('changed: ', id, index);
                    return true;
                }
            }
            return false;
        }

        static hasSomeBanners() {
            let hasBanners = false;
            Object.values(BasicBanners.banners).forEach(tiers => {
                if(tiers.some(one => one.amount > 0)) {
                    hasBanners = true;
                }        });
            return hasBanners;
        }

        static hasAllBannerTypes(ids) {
            let hasAll = true;
            ids.forEach(id => {
                if(!BasicBanners.banners[id]) {
                    hasAll = false;
                    return;
                }
                if(!BasicBanners.banners[id].some(one => one.amount > 0)) {
                    hasAll = false;
                }
            });
            return hasAll;
        }

        static getSingleBannerEffect(amt) {
            const amtBeforeDiminish = Math.min(1.e+4, amt);
            let amtAfterDiminish = Math.max(0, amt - 1.e+4);
            let diminishFactor = Math.pow(Math.max(1, Math.log10(amtAfterDiminish / 1.e+4)), 0.25);
            return 8.03 * Math.pow((amtBeforeDiminish || 0) + Math.pow(amtAfterDiminish, 0.75 / diminishFactor), 0.5 + 0.01 * BasicResearch.getResearchLevel('bannersMasterity'));
        }

        static getBonus(id) {
            let effectCumulative = 1.0;
            if(!BasicBanners.banners[id]) {
                return effectCumulative;
            }
            let pEff = 1;
            Array.from({length: 6}).forEach((one, tierIndex) => {
                const current = BasicBanners.banners[id][5 - tierIndex];

                const thisEffect = BasicBanners.getSingleBannerEffect(current.amount);
                effectCumulative = 1+0.01*thisEffect*pEff;

                pEff = effectCumulative;
            });
            return effectCumulative;
        }

        static getBonusByArray(bannersArray) {
            let effectCumulative = 1.0;
            let pEff = 1;
            [...bannersArray].reverse().forEach((one, tierIndex) => {
                const current = one.amount;

                const thisEffect = BasicBanners.getSingleBannerEffect(current);
                effectCumulative = 1+0.01*thisEffect*pEff;

                pEff = effectCumulative;
            });
            return effectCumulative;
        }

        static getOptimalBanners(bannersArray, id) {
            const actualEffect = BasicBanners.getBonusByArray(bannersArray);
            // now we need to combine some analytical formula with some numerical magic
            // for this purpose for each banner tier we have to determine if bonus to it
            // will cover expenses in other
            // like dM(i) / dN > 5*dM(i-1) / dN OR > 25*dM(i-2) / dN
            // so, starting from the end
            for(let iTierCalculated = 5; iTierCalculated > 0; iTierCalculated--) {
                // let convMult = 1.0;
                let newBannersArray = [...bannersArray.map(o => ({...o}))];
                let pEff = actualEffect;
                let pEffCIter = pEff;
                for(let iConvertFrom = iTierCalculated-1; iConvertFrom >= 0; iConvertFrom--) {
                    // convMult *= 5;
                    let minus = 0.1 * newBannersArray[iConvertFrom].amount;
                    let plus = minus / 5;
                    /*if(iTierCalculated === 2 && id === 'green') {
                        console.log(`from: ${iConvertFrom} to ${iTierCalculated}`, minus, plus);
                    }*/
                    if(plus >= 1) {
                        newBannersArray[iConvertFrom+1].amount += plus;
                        newBannersArray[iConvertFrom].amount -= minus;
                        let nEff = BasicBanners.getBonusByArray(newBannersArray);
                        /*if(iTierCalculated === 2 && id === 'green') {
                            console.log(`Bonus from: ${iConvertFrom} to ${iTierCalculated}`, nEff, pEffCIter, newBannersArray);
                        }*/
                        let pIterBanner = newBannersArray;
                        if(nEff > pEffCIter) {
                            while (nEff > pEffCIter) {
                                let minus = 0.1 * newBannersArray[iConvertFrom].amount;
                                let plus = minus / 5;
                                if(plus < 1) {
                                    break;
                                }
                                pEffCIter = nEff;
                                pIterBanner = [...newBannersArray.map(o => ({ ...o }))];
                                newBannersArray[iConvertFrom+1].amount += plus;
                                newBannersArray[iConvertFrom].amount -= minus;
                                nEff = BasicBanners.getBonusByArray(newBannersArray);
                                /*if(iTierCalculated === 2 && id === 'green') {
                                    console.log(`inner bonus: from: ${iConvertFrom} to ${iTierCalculated}`, nEff, pEffCIter, newBannersArray);
                                }*/
                            }
                            if(pEffCIter > nEff) {
                                nEff = pEffCIter;
                                newBannersArray = pIterBanner;
                            }
                        }

                        if(nEff > pEff) {
                            return {
                                newBannersArray,
                                iTierToConvert: iTierCalculated,
                                iConvertFrom,
                                effect: nEff,
                                minus,
                                plus
                            }
                        }
                        pEffCIter = nEff;
                    }

                }
            }
            return {
                newBannersArray: bannersArray,
                iTierToConvert: null,
                iConvertFrom: null,
                effect: actualEffect,
            }
        }

        static doOptimizeAll = (id) => {
            let banners = BasicBanners.banners[id];
            let optimal = BasicBanners.getOptimalBanners(banners);
            let nI = 0;
            while (nI < 1000 && optimal.iConvertFrom !== null) {
                optimal = BasicBanners.getOptimalBanners(banners);
                banners = optimal.newBannersArray;
                nI++;
            }
            console.log('optimizedIn: ', nI);
            BasicBanners.banners[id] = optimal.newBannersArray;
        }

        static process(dT) {
            if(BasicBanners.options?.automation?.isTurnedOn) {
                if(!BasicResearch.getResearchLevel('autoBanners')) {
                    BasicBanners.options.automation.isTurnedOn = false;
                }
                const targetCreeps = BasicBanners.options?.automation?.numCreatures;
                const bannerId = BasicBanners.options?.automation?.bannerId;
                if(CreatureBasic.numCreatures >= targetCreeps && BasicRun.timeSpent > 45) {
                    BasicBanners.doPrestige(bannerId, 0.2 + 0.1 * BasicResearch.getResearchLevel('autoBanners'), true);
                }
            }
        }

        static getList() {
            const result = bannersData.map(bannerInfo => {

                const tiers = [];

                let effectCumulative = 1.0;

                if(!BasicBanners.banners[bannerInfo.id]) {
                    BasicBanners.banners[bannerInfo.id] = BasicBanners.fillDefaultTiers();
                }

                let pEff = 1;

                let effIfConverted = 1;

                const optimal = BasicBanners.getOptimalBanners(BasicBanners.banners[bannerInfo.id], bannerInfo.id);

                /* if(bannerInfo.id === 'green') {
                    console.log('optimal: ', bannerInfo.id, optimal);
                } */

                Array.from({length: 6}).forEach((one, tierIndex) => {
                    const current = BasicBanners.banners[bannerInfo.id][5-tierIndex];
                    if(!current) {
                        throw new Error(`Banners data was not loaded properly`)
                    }
                    let maxConversion = tierIndex < 5 ? BasicBanners.banners[bannerInfo.id][4-tierIndex]?.amount / 5 : BasicBanners.getBannersOnPrestige();
                    let canPrestige = tierIndex === 5 && CreatureBasic.numCreatures >= 51;
                    let timeLeft = '';
                    if(BasicRun.timeSpent < 45 && tierIndex === 5) {
                        canPrestige = false;
                        timeLeft = secondsToHms((45 - BasicRun.timeSpent));
                    }
                    let isConvertable = maxConversion >= 1 && tierIndex < 5;
                    if(!current.amount) {
                        effectCumulative = 1.0;
                        tiers.unshift({
                            amount: 0,
                            tierId: 5-tierIndex,
                            effect: 0,
                            effectCumulative,
                            isConvertable,
                            maxConversion,
                            canPrestige,
                            timeLeft,
                        });
                    } else {
                        const thisEffect = BasicBanners.getSingleBannerEffect(current.amount);
                        effectCumulative = (1 + 0.01 * thisEffect * pEff);
                        tiers.unshift({
                            amount: current.amount,
                            tierId: 5-tierIndex,
                            effect: thisEffect,
                            effectCumulative,
                            isConvertable,
                            maxConversion,
                            canPrestige,
                            timeLeft
                        });
                    }

                    if(tierIndex > 0 && effIfConverted) {
                        let potBonus = (1 + 0.01 * BasicBanners.getSingleBannerEffect(current.amount * 0.9) * effIfConverted);
                        if(potBonus > effectCumulative && tiers[1].maxConversion >= 10) {
                            tiers[1].suggestConversion = true;
                            tiers[1].potentialBonus = potBonus;
                            tiers[1].potentialPrev = effIfConverted;
                        }
                    }
                    if(tierIndex > 0 && optimal.iConvertFrom === 5 - tierIndex && !tiers[1].suggestConversion) {
                        tiers[1].suggestConversion = true;
                        tiers[1].potentialBonus = optimal.effect;
                        tiers[1].potentialPrev = effIfConverted;
                    }
                    if(tierIndex < 5) {
                        const prev = BasicBanners.banners[bannerInfo.id][4-tierIndex];
                        if(prev && prev.amount) {
                            const thisEffIfConverted = BasicBanners.getSingleBannerEffect((current.amount || 0) + 0.1 * 0.2 * prev.amount);
                            effIfConverted = (1 + 0.01 * thisEffIfConverted * pEff);
                        }

                    }
                    pEff = effectCumulative;

                });

                return {
                    id: bannerInfo.id,
                    name: bannerInfo.name,
                    description: bannerInfo.description,
                    color: bannerInfo.color,
                    isUnlocked: bannerInfo.isUnlocked(),
                    isChanged: BasicBanners.isChanged(bannerInfo.id),
                    tiers,
                    isShowOptimizeAll: optimal.iConvertFrom !== null,
                }
            });
            return result;
        }

        static doPrestige(id, coeff = 1) {
            if(CreatureBasic.numCreatures < 51) {
                return;
            }
            const amount = BasicBanners.getBannersOnPrestige();
            if(!BasicBanners.banners[id]) {
                BasicBanners.banners[id] = BasicBanners.fillDefaultTiers();
            }
            BasicBanners.banners[id][0].amount += amount * coeff;
            BasicBanners.saveBannersToPrev();
            BasicRun.initialize(true);
            if(!BasicBanners.options?.automation?.isTurnedOn) {
                BasicTemper.state.currentId = 'select';
            }
        }

        static doConvert({ id, tierIndex, percentage }) {
            if(tierIndex === 0) return;
            let maxConversion = tierIndex < 6 && BasicBanners.banners[id][tierIndex-1]?.amount * percentage / 5;
            if(maxConversion >= 1) {
                BasicBanners.banners[id][tierIndex-1].amount *= (1 - percentage);
                BasicBanners.banners[id][tierIndex].amount += maxConversion;
            }
        }

        static sendToUI() {
            const result = BasicBanners.getList();
            ColibriWorker.sendToClient('set_banners_state', {
                list: result,
                automation: BasicResearch.getResearchLevel('autoBanners') ? BasicBanners.options?.automation || {
                    isTurnedOn: false,
                    numCreatures: 51,
                    bannerId: 'green',
                } : null,
            });
        }


    }

    class BasicResearch {

        static researches = {};

        static isResearchUnlocked() {
            return BasicBanners.hasAllBannerTypes([
                'yellow',
                'orange',
                'blue',
                'green'
            ]);
        }

        static getResearchLevel(id) {
            return BasicResearch.researches[id]?.current || 0;
        }

        static getResearchPlus(id) {
            return BasicResearch.researches[id]?.potential || 0;
        }

        static getTotal(id) {
            return (BasicResearch.researches[id]?.current || 0) + (BasicResearch.researches[id]?.potential || 0);
        }

        static initialize() {
            BasicResearch.researches = {};
        }

        static getList() {
            return researchData.map(one => ({
                id: one.id,
                name: one.name,
                description: one.getDescription ? one.getDescription() : one.description,
                level: BasicResearch.getResearchLevel(one.id),
                potential: BasicResearch.getResearchPlus(one.id),
                max: one.maxLevel,
                isMaxed: one.maxLevel && BasicResearch.getTotal(one.id) >= one.maxLevel,
                isUnlocked: one.isUnlocked(),
                cost: BasicResources.checkResourcesAvailable(one.getCost(BasicResearch.getTotal(one.id))),
                isAvailable: BasicResources.checkResourcesAvailable(one.getCost(BasicResearch.getTotal(one.id))).isAvailable &&
                    (!one.maxLevel || BasicResearch.getTotal(one.id) < one.maxLevel)
            }))
        }

        static onPrestige() {
            for(const key in BasicResearch.researches) {
                BasicResearch.researches[key].current += BasicResearch.researches[key].potential;
                BasicResearch.researches[key].potential = 0;
            }
        }

        static purchaseResearch(id) {
            const one = researchData.find(one => one.id === id);
            if(!one) {
                throw new Error('not found research '+id);
            }
            const cost = BasicResources.checkResourcesAvailable(one.getCost(BasicResearch.getTotal(id)));
            if(!cost.isAvailable) {
                return;
            }
            if(one.maxLevel && BasicResearch.getTotal(id) >= one.maxLevel) {
                return;
            }
            BasicResources.subtractBatch(one.getCost(BasicResearch.getTotal(id)));
            if(!BasicResearch.researches[id]) {
                BasicResearch.researches[id] = {
                    current: 0,
                    potential: 0,
                };
            }
            BasicResearch.researches[id].potential += 1;
        }

        static sendToUI() {
            const data = BasicResearch.getList();
            ColibriWorker.sendToClient('set_research_state', data);
        }


    }

    const shopData = [{
        id: 'notebook',
        name: 'Notebook',
        type: 'book',
        description: 'A book for storing notes and goals. Adds 1 automation slot.',
        isUnlocked: () => true,
        getCost: () => ({
            gold: 10,
        }),
    },{  // Changed
        id: 'manual',
        name: 'Labor Manual',
        type: 'book',
        description: 'A manual on effective laboring. Work at Stable gives twice as much gold at twice the cost.',
        isUnlocked: () => true,
        getCost: () => ({
            gold: 10,
        }),
    },{ // Changed
        id: 'gymnastics',
        name: 'Gymnastic\'s manual',
        type: 'book',
        description: 'A manual for general exercising. Train stamina is now twice as efficient.',
        isUnlocked: () => true,
        getCost: () => ({
            gold: 15,
        }),
    },{
        id: 'pocket',
        name: 'Coin Bag',
        type: 'trinket',
        description: 'A small coin bag that increases your maximum gold by 20.',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 15,
        getCost: () => ({
            gold: 20,
        }),
    },{
        id: 'bookOfMagic',
        name: 'Book of basic magic',
        type: 'book',
        description: 'Unlocks mana and some basic spells',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 25,
        getCost: () => ({
            gold: 40,
        }),
    },{
        id: 'magicStamp',
        name: 'Magic stamp',
        type: 'trinket',
        description: 'Provides ability to store more magic powers. +10 max mana, +25% spells power',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 55 && ShopItems.purchased.bookOfMagic,
        getCost: () => ({
            gold: 80,
        }),
    },{
        id: 'equipment',
        name: 'Training equipment',
        type: 'trinket',
        description: 'Increase your training efficiency by 100%',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 75,
        getCost: () => ({
            gold: 100
        }),
    },{
        id: 'bookOfMeditation',
        name: 'Book of meditation',
        type: 'book',
        description: 'Purchase book full of usefull meditation techniques. Meditation takes twice as much energy but provides 2x mana.',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 55,
        getCost: () => ({
            gold: 120,
            energy: 30
        }),
    },{
        id: 'shovel',
        name: 'Shovel',
        type: 'trinket',
        description: 'Purchase a shovel to make your work even more efficient. Work takes 2 energy more but provides 2 more gold.',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 125,
        getCost: () => ({
            gold: 150,
            energy: 30
        }),
    },{
        id: 'timeManagement',
        name: 'Time-management',
        type: 'book',
        description: 'Purchase time-management book to learn how to keep 2 actions auto-running',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 75,
        getCost: () => ({
            gold: 100
        }),
    },{
        id: 'bargaging',
        name: 'Bargaining',
        type: 'book',
        description: 'Learn basics of bargaining - improve your gold earned by 2 per work action',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 150,
        getCost: () => ({
            gold: 250
        }),
    },{ // Changed
        id: 'stash',
        name: 'Stash',
        type: 'trinket',
        description: 'Increases your maximum gold by 200',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 150,
        getCost: () => ({
            gold: 300
        }),
    },{ // Changed
        id: 'summoning',
        name: 'Basic summoning',
        type: 'book',
        description: 'Purchase basic Summoning manual',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 250,
        getCost: () => ({
            gold: 500
        }),
    },{
        id: 'bookOfMultitasking',
        name: 'Multi-tasking',
        type: 'book',
        description: 'Learn how to manage 2 more tasks simultaneously. More than 2 automations making you less efficient.',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 400,
        getCost: () => ({
            gold: 600
        }),
    },{
        id: 'manaOrb',
        name: 'Mana orb',
        type: 'trinket',
        description: 'Purchase orb that improves your meditation. Meditation takes 10 more energy but provide 1 more mana',
        isUnlocked: () =>resourcesData.find(one => one.id === 'gold').getMax() > 300,
        getCost: () => ({
            gold: 750,
            energy: 100
        }),
    },{ 
        id: 'betterSummoning',
        name: 'Summoning Effiency',
        type: 'book',
        description: 'Purchase summoning efficiency book to decrease energy consumed by creatures by 0.5',
        isUnlocked: () => ShopItems.purchased.summoning,
        getCost: () => ({
            gold: 1000
        }),
    },{ // Changed
        id: 'herbalism',
        name: 'Herbalism',
        type: 'book',
        description: 'Purchase herbalism book to start creation of flasks',
        isUnlocked: () => ShopItems.purchased.summoning,
        getCost: () => ({
            gold: 1000
        }),
    },{
        id: 'soulHarvester',
        name: 'Soul harvester',
        type: 'book',
        description: 'Purchase knowledge of better soul harvesting',
        isUnlocked: () => ShopItems.purchased.summoning,
        getCost: () => ({
            gold: 1500
        }),
    },{ // Changed
        id: 'appretienceManual',
        name: 'Manual of appretience',
        type: 'book',
        description: 'Empower all your spells by 50%',
        isUnlocked: () => ShopItems.purchased.soulHarvester,
        getCost: () => ({
            gold: 2000
        }),
    },{ // Changed
        id: 'summoningJobs',
        name: 'Summoning Jobs',
        type: 'book',
        description: 'Purchase summoning jobs knowledge book to increase job efficiency. +10% creature production',
        isUnlocked: () => ShopItems.purchased.summoning,
        getCost: () => ({
            gold: 4000
        }),
    },{
        id: 'herbalistsStash',
        name: 'Herbalists stash',
        type: 'trinket',
        description: 'Purchase special container for herbs. +20 max herbs.',
        isUnlocked: () => ShopItems.purchased.herbalism,
        getCost: () => ({
            gold: 5000
        }),
    },{
        id: 'herbalismKnowledge',
        name: 'Advanced herbalism',
        type: 'trinket',
        description: 'Purchase book full of knowledge about herbs. +100% herbs gain',
        isUnlocked: () => ShopItems.purchased.herbalistsStash,
        getCost: () => ({
            gold: 8000
        }),
    },{
        id: 'advancedMagic',
        name: 'Advanced magic',
        type: 'book',
        description: 'Purchase book that further increase your magic power by 50%',
        isUnlocked: () => ShopItems.purchased.appretienceManual,
        getCost: () => ({
            gold: 12000
        }),
    },{ // Changed
        id: 'precisionTraining',
        name: 'Fighting skills',
        type: 'book',
        description: 'Purchase book, your creatures learn to be 50% more precise',
        isUnlocked: () => ShopItems.purchased.appretienceManual && BasicResearch.getResearchLevel('fighting') > 0,
        getCost: () => ({
            gold: 40000
        }),
    },{
        id: 'soulHarvester2',
        name: 'Advanced soul harvester',
        type: 'book',
        description: 'Purchase book that further increase your souls gain',
        isUnlocked: () => ShopItems.purchased.summoningJobs,
        getCost: () => ({
            gold: 50000
        }),
    },{
        id: 'boneMasterity',
        name: 'Bones masterity',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by 75%',
        isUnlocked: () => ShopItems.purchased.soulHarvester2,
        getCost: () => ({
            gold: 300000
        }),
    },{
        id: 'soulHarvester3',
        name: 'Advanced soul harvester II',
        type: 'book',
        description: 'Purchase book that further increase your souls gain',
        isUnlocked: () => ShopItems.purchased.soulHarvester2,
        getCost: () => ({
            gold: 400000
        }),
    },{
        id: 'boneMasterity2',
        name: 'Bones masterity II',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by another 75%',
        isUnlocked: () => ShopItems.purchased.boneMasterity,
        getCost: () => ({
            gold: 1000000
        }),
    },{ // Changed
        id: 'precisionTraining2',
        name: 'Fighting skills 2',
        type: 'book',
        description: 'Purchase book, your creatures learn to be 50% more precise',
        isUnlocked: () => ShopItems.purchased.precisionTraining,
        getCost: () => ({
            gold: 900000
        }),
    },{ // Changed
        id: 'precisionTraining3',
        name: 'Fighting skills 3',
        type: 'book',
        description: 'Purchase book, your creatures learn to be 50% more precise',
        isUnlocked: () => ShopItems.purchased.precisionTraining2,
        getCost: () => ({
            gold: 8100000
        }),
    },{
        id: 'boneMasterity3',
        name: 'Bones masterity III',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by another 75%',
        isUnlocked: () => ShopItems.purchased.boneMasterity2,
        getCost: () => ({
            gold: 10000000
        }),
    },{
        id: 'boneMasterity4',
        name: 'Bones masterity IV',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by another 75%',
        isUnlocked: () => ShopItems.purchased.boneMasterity3,
        getCost: () => ({
            gold: 1.e+10
        }),
    },{
        id: 'boneMasterity5',
        name: 'Bones masterity V',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by another 75%',
        isUnlocked: () => ShopItems.purchased.boneMasterity4,
        getCost: () => ({
            gold: 1.e+13
        }),
    },{
        id: 'boneMasterity6',
        name: 'Bones masterity VI',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by another 75%',
        isUnlocked: () => ShopItems.purchased.boneMasterity5,
        getCost: () => ({
            gold: 1.e+16
        }),
    },{
        id: 'boneMasterity7',
        name: 'Bones masterity VII',
        type: 'book',
        description: 'Purchase book that decrease souls consumed by creatures by another 75%',
        isUnlocked: () => ShopItems.purchased.boneMasterity6,
        getCost: () => ({
            gold: 1.e+20
        }),
    },{
        id: 'advancedMagic2',
        name: 'Advanced magic II',
        type: 'book',
        description: 'Further increase your magic power by 50%',
        isUnlocked: () => ShopItems.purchased.advancedMagic,
        getCost: () => ({
            gold: 200000
        }),
    },{
        id: 'advancedMagic3',
        name: 'Advanced magic III',
        type: 'book',
        description: 'Further increase your magic power by 50%',
        isUnlocked: () => ShopItems.purchased.advancedMagic2,
        getCost: () => ({
            gold: 4000000
        }),
    }];

    class ShopItems {

        static purchased = {};

        static settings = {
            everPurchased: {},
            autoPurchase: false
        }

        static initialize(isBannerPrestige) {
            ShopItems.purchased = {};
            if(isBannerPrestige && BasicResearch.getResearchLevel('bornToBringDeath') > 0) {
                ShopItems.purchased.summoning = true;
            }
            if(!ShopItems.settings) {
                ShopItems.settings = {
                    everPurchased: {},
                    autoPurchase: false
                };
            }

        }

        static getAvailable() {
            const dbList = shopData;
            const available = dbList.filter(one => one.isUnlocked() || ShopItems.purchased[one.id]).map(one => {
                const cost = BasicResources.checkResourcesAvailable(one.getCost());
                return {
                    id: one.id,
                    name: one.name,
                    description: one.description,
                    cost: cost,
                    isUnlocked: one.isUnlocked(),
                    isAvailable: cost.isAvailable,
                    isPurchased: ShopItems.purchased[one.id],
                }
            });
            return available;
        }

        static purchaseItem(id) {
            const data = shopData.find(one => one.id === id);
            if(!data) {
                throw new Error(`Not found item by id ${id}`);
            }
            if(!data.isUnlocked()) {
                return;
            }
            const cost = data.getCost();
            const available = BasicResources.checkResourcesAvailable(cost);

            if(available.isAvailable) {
                BasicResources.subtractBatch(cost);
                ShopItems.purchased[id] = true;
                if(!ShopItems.settings.everPurchased[id]) {
                    ShopItems.settings.everPurchased[id] = true;
                }
            }
        }

        static purchaseAllAvailable = () => {
            ShopItems.getAvailable().filter(one => !one.isPurchased).forEach(one => {
                ShopItems.purchaseItem(one.id);
            });
        }

        static toggleAutopurchase = (flag) => {
            if(BasicResearch.getResearchLevel('advancedAutomation') <= 0) {
                flag = false;
            }
            ShopItems.settings.autoPurchase = flag;
        }

        static process = (dT) => {
            if(ShopItems.settings.autoPurchase) {
                ShopItems.getAvailable().filter(one => !one.isPurchased && ShopItems.settings.everPurchased[one.id]).forEach(one => {
                    ShopItems.purchaseItem(one.id);
                });
            }

        }

        static sendToUI() {
            const list = ShopItems.getAvailable();
            ColibriWorker.sendToClient('set_shopitems_state', list);
        }

    }

    const storyDataOld = [{
        id: 'start',
        name: 'What\'s happened',
        text: [`You realized yourself laying on cold ground. You are trying to open your eyes, but each time you try you get astonished
            by unbearable headache. You decided to lay another couple minutes trying to remember who you are and whats happened`,
                `After trying in vain for a while you tried to stand up. A piercing pain grips your body, but you feel like you definitely 
            can't just give up and die in cold. You need to find some place to warm up and take some sleep.`,
                `Fortunately you found some bonfire not such far away from where you awaken. You put some sticks to flame, and it started
            burning with new power. Well, now you can take some rest`],
        requirements: [{
            type: 'action',
            id: 'chill',
            amount: 3
        }],
        requirementDesc: 'Perform "Rest" action 3 times. Note, all actions have some cooldowns, you cant use them too frequently'
    },{
        id: 'work',
        name: 'You feel hungry',
        text: [`You awaken feeling hungry. You decided to look around for some fruit trees in nearby forest. But, everything you found is 
            some old apple tree. You picked some fruits, just to take your mind off the hunger.`,
            `You understand that you won't survive long in these cold and wet woods. After spending couple hours traveling you saw some settlement.
             It appears much smaller than you thought at first glance, however it still appears to have a market filled with fresh meat, fish and vegetables. 
             Your stomach growls painfully, but you're broke!`,
            `While bargaining with one of local traders he suggested that you could work at his brothers ranch a small ways away from the settlement. 
        Salary isn't much but it'll get you a meal. Seeing your hunger, the trader gave you a baked chicken leg for free. 
        You ate it and began your trek towards the ranch stable.`],

        requirements: [{
            type: 'action',
            id: 'work',
            amount: 10
        }],
        requirementDesc: 'Perform "Work" action 10 times. Take some rest between work to recover your energy'
    },{
        id: 'notebook',
        name: 'Day by day passed',
        text: [`You almost get used to this all routine. Work - rest at rancho - work again. Couple weeks later you finally
            was able to store some trace amount of gold.`,
            `Rainy Saturday morning, you walking across market streets. Suddenly you noticed some accessories shop. You stepped 
        into. The eyes widen from the variety of all sorts of little and useless things. But, you found some book on one of
        hundreds shelves. It seems empty, but...`,
            `You started feeling headake. You began to remember something. Bright light, flames around you.
        You screaming out from unbearable pain.`,
            `You realized yourself again laying on the floor. Several people standing around you annoying you with questions if you are
        alright. You don't want to talk to them. You want just purchase this useless empty book and run away. You feel so helpless, 
        for no obvious reason for it.`
        ],

        requirements: [{
            type: 'shop',
            id: 'notebook',
        }],
        requirementDesc: 'Purchase notebook from shop tab'
    },{
        id: 'improveSkills',
        name: 'First memories',
        text: [`You returned at rancho where you used to live and work last few weeks. You taken your seat at the floor and opened
            your newly purchased book. At the very first page you saw nothing but just two words - MIGHTY, MAGIC`,
            `Wait! You didn't saw it was written here at the shop. Large mirror occurred in front of you. You see in the mirror
        some strange person under black cloak. You asking quietly: "Who are you?". You got nothing but silence as an answer.
        "Who are you" - you screamed out loudly.`,
            `Again silence. Eyes of person started glowing brighter. You started seeing a lot of dark silhouettes behind
        a person. More and more of them. You started to walk back slowly. Finally one of silhouettes sticks a knife into
        persons neck! A mysterious person falls and says in a hoarse voice - "I should have been more careful"
        You screaming out: "WHAT ARE YOU DOING?! HOLD THE MURDER!"`,
            `You realized yourself laying on the floor once more, screaming. You hear the voice: "You should take some rest." 
        You opened your eyes and see just rancho owner staying above you. You feel like you gone crazy, but than another feeling 
        overwhelms you - you should work hard. You should become better, stronger...`
        ],

        requirements: [{
            type: 'learning',
            id: 'initiative',
            amount: 5,
        },{
            type: 'learning',
            id: 'perseverance',
            amount: 5,
        },{
            type: 'action',
            id: 'physicalTraining',
            amount: 30,
        }],
        requirementDesc: 'Perform "Train stamina" 30 times, and get 5 levels in initiative and perseverance (learning tab)',
        note: 'Physical training will give you some passive energy regeneration. After performing it couple times you can set it' +
            'to automation and take some coffee, or keep clicking rest if you want things to go faster. Also, shop can have some helpfull' +
            ' items for you',
    },{
        id: 'mysteriousMeet',
        name: 'Mysterious men',
        text: [`Well, you are doing well. You found job, you found place to leave. Rancho owner trust you, you keep earning more 
            and more. But feeling that you worth more keep teasing you.`,
            `Another weekend, another walk through settlement. Nothing was unusual, until you hears cough behind you.`,
            `You turned around and saw indeed the same man who you saw couple weeks ago 
        in the mirror. You asked the same question: "Who are you?"`,
            `Strange man: -- You will get answer to your question soon, once you will be ready. For now you can call me your destiny.`,
            `You: -- What??? What are you talking about?`,
            `Strange man: -- Nevermind. Just take this.`,
            `Man gave you piece of paper and disappeared... You started thinking that you gone crazy. But wait, you still standing
        on the crossroad, keeping piece of paper. You unfolded it and saw something looking like price tag - "40 gold", with address
        written above. Well, you feel at least it worth a try, even if you faced just another swindler`
        ],

        requirements: [{
            type: 'resource',
            id: 'gold',
            amount: 40,
        }],
        requirementDesc: 'Earn 40 gold',
        note: 'You can check shop anytime for any useful stuff that might help you to earn money. Also, keep do "Train stamina". You\'ll need a lot energy in future'
    },{
        id: 'magic',
        name: 'Strange purchase',
        text: [`So, you earned 40 gold as price tag required. You followed address that was pointed at piece of paper`,
            `It appeared to be some old house at not such far away from the crossroads. You stepped in, opened the door.`,
            `You turned around, and saw whole variety of strange things (like teeth necklaces, weird clothes other trinkets).
        Finally, you saw the same strange man you talked before, speaking with another one, who looks like salesman`,
            `Strange man: -- Oh, here you are! Okey, we need to give some good start to our newcomer.`,
            `You: -- Newcomer? Start of what?`,
            `Salesman quietly stepped towards one of shelves and takes some old dusty book`,
            `Strange man: -- Here it is. Give him your gold and take a book`,
            `You: -- What in the name of God I am paying for?`,
            `Salesman: -- Oh, man, you won't regret. Just trust me!`
        ],

        requirements: [{
            type: 'shop',
            id: 'bookOfMagic',
        }],
        requirementDesc: 'Purchase book of magic',
        note: 'Some items in shop seems like not have obvious use, but you will need to purchase them to unlock new game content'
    },{
        id: 'firstMeditation',
        name: 'Strange exercises',
        text: [`You returned to your rancho. Ok, it's not yours :)`,
            `You taken your seat at the carpet on the ground, as usual, and opened book. At the first page there was nothing
        but some strange black circle.`,
            `Further chapter describe some strange techniques for meditation. Next chapters are just empty... 
        Seems useless, but OK - you spent
        your money that you earned such difficultly. So, it worth a try now.`,
        ],

        requirements: [{
            type: 'action',
            id: 'meditate',
            amount: 5,
        }],
        requirementDesc: 'Perform meditation 5 times',
    },{
        id: 'firstMagic',
        name: 'First meet with magic',
        text: [`After whole day spent doing something weird and useless you felt completely disappointed.`,
            `You opened book again, and suddenly circle on the first page started glowing. You tried to touch it,
        and you felt some strange heat. You started turning pages, and OMG! You realized second chapter is no
        longer empty!`,
            `It seems to have some... well, spells? You readen one of them, and than some strange chest appeared next to you.
        After couple seconds it just dissapeared. Well, maybe you can find something really useful here?`,
        ],
        note: 'Spells are pretty powerful way to improve yourself, but they consume a lot mana. You can visit learning page' +
            'to improve their efficiency',
        requirements: [{
            type: 'action',
            id: 'expansionSpell',
            amount: 5,
        },{
            type: 'action',
            id: 'energyOrb',
            amount: 5,
        }],
        requirementDesc: 'Perform expansion spell and energy orb 5 times',
    },{
        id: 'searchingForKnowledge',
        name: 'Slightly bored',
        text: [`You spent couple weeks practicing and training. You almost get used to morning meditation rituals. 
            The only issue that makes you worried is that rancho owner started suspecting that something is 
            wrong with you.`,
            `After trying to cast another bunch of spells you realized that you get a little bored. There should be more use
        for magic isn't it? You decided to walk to same shop where you purchased book. You opened old creaking doors and entered shop. 
         You saw familiar slightly smiling face of salesman.`,
            `Salesman: -- You came for more, right?`,
            `You: -- I feel I am missing something. There should be more use for magic.`,
            `Salesman: -- Ok, I can learn you something. Give me your magic stamp.`,
            `You: Silently starring at salesman with doubt`,
            `Salesman: -- What? You still haven't it? That's unacceptable! You can do almost nothing without it. Well, I think I have one for you.
                    But, it's not cheap. Once you purchase it I can help you improving your skills. Otherwise I can do nothing.`,
            `You left the shop with strong feeling of disappointment. You have to work a lot and hard to purchase another
        trinket! But, you must! You have to do this! Maybe...`,
        ],

        requirements: [{
            type: 'shop',
            id: 'magicStamp',
        },{
            type: 'action',
            id: 'energyOrb',
            amount: 10,
        },{
            type: 'action',
            id: 'physicalTraining',
            amount: 75,
        }],
        requirementDesc: 'Perform Energy Orb spell 10 times, "Train stamina" 75 times. Purchase magic stamp.',
    },{
        id: 'anotherTry',
        name: 'Another try',
        text: [`Another week passed. You almost lost sense of time devoting all of you to work and training. Finally,
            you feel yourself ready. You entered weird shop again, and purchased Magic Stamp. It looks like 
            regular one, by the way. Only difference is some strange symbols written on it. You standing at the shop
            looking at your new purchase barely understanding why you are doing all this stuff. `,
            `Salesman: -- Well, now I can show you something`,
            `You: -- Show me what?`,
            `Salesman: -- I want to show you how to extend your magic knowledge.`,
            `You: -- But what about new spells?!`,
            `Salesman: -- You are not ready yet.`,
            `And again, you should return to your rancho full of frustration.`
        ],
        note: 'You may want to purchase Time-management book in shop to make progress more idle',
        requirements: [{
            type: 'action',
            id: 'magicLessons',
            amount: 5,
        }],
        requirementDesc: 'Take magic lessons 5 times.',
    },{
        id: 'trueKnowledge',
        name: 'True knowledge',
        text: [`Salesman: -- Ok. Now I guess you ready.`,
            `You: -- Ready for what?`,
            `Salesman silently token another dusty book`,
            `Salesman: -- Ready for true knowledge`,
            `You: -- Oh, finally! Thanks!`,
            `Salesman: -- Wait, it's not for free. True knowledge should be deserved.`,
            `Now you exiting shop with full of enthusiasm. You know you should work hard, but you almost sure - that worth it!`
        ],
        requirements: [{
            type: 'shop',
            id: 'summoning',
        }],
        requirementDesc: 'Have 500 gold. Purchase book of summoning',
    },{
        id: 'newLife',
        name: 'New Life',
        text: [`Salesman: -- Ok. So, from now you are part of our dark mages community.`,
            `You: -- Me? Mage? Mages community?`,
            `Salesman: -- Yes you! You can't keep living at rancho with other people. Let me show your new appartments.`,
            `You: -- Apartments? Well!`,
            `Salesman mumbled something quietly something. Wall behind him disappeared, and you saw stairs.`,
            `Salesman: -- Follow me.`,
            `You followed salesman. After couple minutes walking through dark and wet cellar corridors a small door opened in front of you.
        You see small room. Unbearable smell and dead rats surround you. You glanced at small bed in the corner.`,
            `Salesman: -- Here is your new apartment`,
            `You: -- Apartment? Okey.`,
            `You caught displeased look of salesman, but you don't care. You feel like you'd better stay at rancho. But, again,
        you can become a mage! You set on bad and opened book. Full of mysterious rituals and spells. But ok, let's start from beginning.
        You saw some strange rithual called "Souls gathering". You definitely want to try it.`
        ],
        requirements: [{
            type: 'action',
            id: 'refineSoul',
            amount: 4,
        }],
        requirementDesc: 'Refine soul 4 times',
    },{
        id: 'summoning',
        name: 'First assistants',
        text: [`You keep reading book, full of enthusiasm. You performed some rituals, got some success. Your magic stamp
            started glowing. According to book, now you can perform some ritual to summon some weird creatures.
        What? You can summon some demons? Other mages? You definitely have to try it out!`,
        ],
        requirements: [{
            type: 'creatures',
            amount: 1,
        }],
        requirementDesc: 'Navigate to creatures tab. Create at least one creature',
    },{
        id: 'summoningJobs',
        name: 'Not alone any longer',
        text: [`After trying to cast another spell, you got stricken by bright light. After couple seconds it disappeared and you see
            nothing but small crooked skeleton. Well, not bad for first time. You tried to talk to your new creature - but nothing.
            You feel you started getting more and more tired. Seems like this creature uses your energy to exist.`,
                `Well, what they can do? You started turning pages in book. At last, you found it! You found a use for them! Now they can 
            do some jobs for you!`
        ],
        requirements: [{
            type: 'creature-jobs',
            id: 'supporter',
            amount: 5,
        },{
            type: 'creature-jobs',
            id: 'miner',
            amount: 1,
        }],
        requirementDesc: 'Have 5 supporters and 1 miner',
    },{
        id: 'newKnowledge',
        name: 'Keep going for more',
        text: [`Another day passed, your minions working hard together with you. You was just about to perform usual for you
            soul harvest ritual, when door cracked, and you saw familiar silhouette.`,
            `Strange man in cloak: -- Hey there. I see you doing well, yeah? Must be somewhat proud of yourself?`,
            `You: -- Smiled slightly`,
            `Strange man in cloak performed some strange spell and turned dead rat on the floor into table full of delicious 
        cookies and fruits. You reached out to the grapes, but strange wizard spelled another strange combination of words,
        and it turned into red hot coals. You screamed out from pain and throw it on the ground. Coals hit the floor, and
        turned back into dead rat. You starring at the wizard in surprise`,
            `Strange man in cloak: -- You shouldn't be so proud. It's only the very basics of what you actually capable if.
        You should keep getting new knowledge.`,
            `You looked at book that you have almost read: -- What kind of knowledge? Where can I take it?`,
            `Strange man in cloak: -- The one who is searching will always find. There are way much more books at shop. I haven't 
        seen you there for a while. When I was as young and inexperienced as you I spent whole days studying. You should learn more.
        I'd suggest you starting with alchemy and improve your summoning skills. Trust me, you'll need them in future so much.`,
            `Than mage disappeared, left you confused. You left sitting for a while just thinking about what the hell did happened
         just now.`,
            `Next morning you stepped into shop and saw two books that mage might have spoken about.`
        ],
        requirements: [{
            type: 'shop',
            id: 'herbalism',
        },{
            type: 'shop',
            id: 'betterSummoning',
        }],
        requirementDesc: 'Purchase herbalism and better summoning books',
    },{
        id: 'firstAlchemy',
        name: 'Now you know the basics',
        text: [`You sit down reading new herbalism book. You kinda bored turning page by page, hardly understanding
    why you might need this all knowledge. And finally you found something - a recipe for some flask that should
    make your minions more powerful. Yeah, that's indeed what you need`
        ],
        note: 'Each next flask provides less bonus than previous one. You can see bonus hovering over over them',
        requirements: [{
            type: 'resource',
            id: 'flasks',
            amount: 10,
        }],
        requirementDesc: 'Have at least 10 flasks',
    },{
        id: 'breakingBad',
        name: 'Breaking bad',
        text: [
            `You spent enough time boiling flasks. Seems like you still need more. More resources, more creatures, more might...`
        ],
        requirements: [{
            type: 'creatures',
            amount: 51,
        }],
        requirementDesc: 'Have at least 51 creature'
    },{
        id: 'firstReset',
        name: 'Shining light',
        text: [
            `You summoning more and more creatures. Maintaining them all becomes harder and harder. You almost can't eat nor sleep.
        Never felt so exhausted... But you feel like you should keep pushing.`,
            `You summoned another creature and felt completely exhausted. Again, strange memories covered you. You laying at the ground
         blinded by bright light. As the light started fainting you see four strange mirrors with differently colored... portals
         inside them?`,
            `You almost paralyzed but you have to reach one of mirrors. YOU SHOULD!`
        ],
        note: 'NOTE FROM DEV: You can choose any banner you want. I\'d suggest choosing green one for first prestige, since it' +
            ' dramatically decreases time you need to pass first steps of new run. You will loose all your skills, creatures' +
            ' and resources but will be given boost depending on banner type',
        requirements: [{
            type: 'banner',
            id: 'any',
            amount: 1,
        }],
        requirementDesc: 'Navigate to banners tab and click prestige under any of them. ',
    },{
        id: 'moreReset',
        name: 'Again in forest',
        text: [
            `You realized yourself again laying in forest. All your money, all your powers... They just gone.`,
            `So weird, so unfairly!`,
            `You sit down at one of stumps next to bonfire thinking about all your efforts where vain, when you saw 
        again familiar mirror occurred with familiar man`,
            `You: -- In the name of God, who are you?! Why can't you just leave me alone? Why you are chasing me?`,
            `Wizard: -- My name is Dulequar.`,
            `You: -- Ok! I can't even remember mine name. I can't remember anything since I realized myself here in forest
         some time ago!`,
            `Dulequar: -- Please, calm down my child.`,
            `You: -- I trusted you. And now I lost everything I had again!`,
            `Dulequar: -- You lost everything but in exchange you received something priceless - knowledge and blessing from the skies.
        You have proven your perseverance and endurance. In exchange you received new powers. Don't worry, each next try 
        you will become more and more powerful. This is the way I have passed once upon a time.`
        ],
        note: 'You will have to re-gain all your lost resources and skills, but you will do it much faster now. Also, you unlocked' +
            ' new way to improve your self - a dark research.',
        requirements: [{
            type: 'banner',
            id: ['yellow','orange','blue','green'],
            amount: 1,
        }],
        requirementDesc: 'Have at least 1 of yellow, orange, blue and green banners.',
    },{
        id: 'research',
        name: 'New powers',
        text: [
            `Again rainy cold forest. The same mirror appeared, and you see again familiar man into it.`,
            `Dulequar: -- Well, I should admit - you are doing pretty well.`,
            `You: -- But still I am here in the same forest with naked back.`,
            `Dulequar: -- No worries, that's ok. I came to give you something.`,
            `Dulequar gave you another old dusty book. You read two words written on it in big letters.`,
            `You: -- Dark research? What is it?`,
            `Dulequar: -- Yes, it's impossible to achieve new powers without new sciences. And remember to use your 
        knowledge wisely!`
        ],
        note: 'You can hire researchers to generate research points and purchase some new upgrades for it',
        requirements: [{
            type: 'research',
            id: 'selfDevelopment',
            amount: 3,
        },{
            type: 'research',
            id: 'soulEater',
            amount: 3,
        }],
        requirementDesc: 'Have at least 3 levels of Self Development and Soul Eater researches.',
    },{
        id: 'research2',
        name: 'Even more',
        text: [
            `You definitely much and much stronger. Each next research/run will go easier and easier. Keep unlock new researches.`,
        ],
        note: 'Some of researches can be unlocked by 2-3 levels of previous ones.',
        requirements: [{
            type: 'research',
            id: 'necromancery',
            amount: 3,
        },{
            type: 'research',
            id: 'spellMaster',
            amount: 3,
        }],
        requirementDesc: 'Have at least 3 levels of Necromancery and Spellmaster.',
    },{
        id: 'toTheWar',
        name: 'The Holy War',
        text: [
            `Another frosty morning. As usual, you walked through the forest back to settlement, enjoying the fresh inter air and shining sun.
        Suddenly, you recognized the same old mirror with familiar face into it.`,
            `Dulequar: - Well, you don't look like the weak and confused man I first saw at the ranch. I feel you are ready for 
        the trial that your destiny prepared for you.`,
            `You: - Well, another adventure? Sounds sweet!`,
            `Dulequar: - Trust me, that's not sweet at all. Give me your hand`,
            `You squeezed Dulequar's hand, and started feeling strange vibrations. Everything darkened for a few moments. After
        you opened your eyes you realized yourself in ruined city. Everything is burning. You hear a lot of people screaming
         around.`,
            `Dulequar: - Overthere!`,
            `You see a horde of living skeletons approaching you. Dulequar spelled something similar to summoning spell. A mighty 
        ogre of tremendous size in shinning armor appeared. He raised his mace and smashed skeletons approaching you.`,
            `Dulequar: - Watch your back!!!`,
            `A sword pierced your body. You felt over. Everything darkened. That's the end...`,
            `You started thinkin: -No, it can't be the end. I can not just die!`,
            `You recognized your self laying in the forest next to the mirror`,
            `Dulequar: - Well, to be honest, I didn't expected you to survive. But I had to show you this.`,
            `You: - What just happened? Where I was? Who are these armies of living skeletons?`,
            `Dulequar: - Well, that's Azragard and his minions.`,
            `You: - Who is Azragard? Why would he try to demolish whole city?`,
            `Dulequar: - Not whole city, but whole world actually. He tries to turn all of us in his slaves. Kill us and enslave our souls.`,
            `You: - Sounds like great plot of the fantasy film.`,
            `Dulequar: - But that's tre truth. Anyway, you should start getting prepared to our Holy war. We can't afford defeat. Take this.`,
            `Dulequar gave you some scroll and disappeared. Well, another adventure ends up with some weird book or scroll you need to learn. 
        You unfolded the scroll and read spell written on it out loud. But nothing happened. Well, maybe you should make your researchers
         to focus on investigating it.`
        ],
        note: '',
        requirements: [{
            type: 'research',
            id: 'fighting',
            amount: 1,
        },{
            type: 'zoneCleared',
            id: '1',
            amount: 1,
        }],
        requirementDesc: 'Research fighting. Clear out second zone at least once.',
    },{
        id: 'building',
        name: 'New home - new life',
        text: [
            `Another squad of weird skeletons crashed like toys.`,
            `You: - Good job, guys!`,
            `Your warrior creatures glanced at you blankly. You almost believed they actually understand when you talking to them.`,
            `You were about to portal back to you room in basement when you felt someones hand on your shoulder.`,
            `Dulequar: - Follow me. I have to show you something.`,
            `You: - Let's hope I won't die this time.`,
            `Dulequar smiled and stretched his hand. Another weird traveling. You opened you eyes and recognized yourself surrounded 
        by gorgeous palaces and temples. Hundreds of troles, ogres and other strange creatures around doing their business.`,
            `Some of them were carrying some goods, some of them just walking enjoying great looks`,
            `You: So, where we are?`,
            `Dulequar: - Well, it's my tiny estate.`,
            `You: Tiny estate?! It looks like something... It's amazing!`,
            `Dulequar: - Once upon a time you will have even better.`,
            `You: - Me?`,
            `Dulequar: - You can't leave in magic shop basements forever. You proved yourself in many battles. Each peace of land 
        cleared out from Azragard troops becomes yours. So, you can use it to make yourself even stronger and better prepared 
        for our Holy war. Let's don't waste too much time here.`,
            `After returning back to your basement, Dulequar gave you another scroll. Well, you feel you know what to do!`,
        ],
        note: 'At this point story ends for now. To be developed in future...',
        requirements: [{
            type: 'research',
            id: 'building',
            amount: 1,
        }],
        requirementDesc: 'Research building.',
    }];

    class BasicStory {

        static story = {
            stepId: 0,
            wasShown: false,
        }

        static initialize() {
            BasicStory.story = {
                stepId: 0,
                wasShown: false,
            };
            return BasicStory.story;
        }

        static getList() {
            const displayedStories = storyDataOld
                .filter((one, index) => index <= BasicStory.story.stepId);

            return displayedStories.reverse();
        }

        static getCurrentToShow() {
            const stories = storyDataOld;
            if(BasicStory.story.stepId > stories.length) {
                return null;
            }
            const currentStory = stories[BasicStory.story.stepId];
            if(!BasicStory.story.wasShown) {
                return currentStory;
            }
            return null;
        }

        static makeShown() {
            BasicStory.story.wasShown = true;
        }

        static checkOne(req) {
            switch (req.type) {
                case 'action':
                    return BasicActions.actions[req.id]?.performed >= req.amount;
                case 'resource':
                    return BasicResources.resources[req.id] >= req.amount;
                case 'shop':
                    return !!ShopItems.purchased[req.id];
                case 'learning':
                    return BasicSkills.skillLevel(req.id) >= req.amount;
                case 'creatures':
                    return CreatureBasic.numCreatures >= req.amount;
                case 'creature-jobs':
                    return CreatureJobs.workers[req.id]?.current >= req.amount;
                case 'banner':
                    if(req.id === 'any') {
                        return BasicBanners.hasSomeBanners();
                    }
                    return BasicBanners.hasAllBannerTypes(req.id);
                case 'research':
                    return BasicResearch.getResearchLevel(req.id) >= req.amount;
                case 'zoneCleared':
                    return BasicMap.state.zonesAmounts[+req.id] >= req.amount;
                case 'building':
                    return BasicBuilding.getBuildingLevel(req.id) >= req.amount;
                default:
                    console.error(`Invalid story requirement: `, req);
            }
            return false;
        }

        static checkAll(reqs) {
            for(const req of reqs) {
                // console.log('req: ', req, BasicStory.checkOne(req));
                if(!BasicStory.checkOne(req)) {
                    return false;
                }
            }
            return true;
        }

        static process() {
            if(BasicStory.story.wasShown) {
                // check requirements
                const stories = storyDataOld;
                if(BasicStory.story.stepId > stories.length) {
                    return null;
                }
                const currentStory = stories[BasicStory.story.stepId];
                const requirementsMet = BasicStory.checkAll(currentStory.requirements);
                if(requirementsMet) {
                    BasicStory.story.stepId++;
                    BasicStory.story.wasShown = false;
                }
            }
        }

        static sendToUI() {
            return ColibriWorker.sendToClient('set_story_state', BasicStory.getList());
        }

    }

    const actionsData = [{
        id: 'work',
        name: 'Work at stable',
        description: 'Do some work to earn some gold',
        isUnlocked: () => BasicStory.story.stepId > 0,
        getCost: () => ({
            energy: 1 + (ShopItems.purchased.manual ? 1 : 0) + (ShopItems.purchased.shovel ? 2 : 0),
        }),
        getGain: () => ({
            gold: ((1 + (ShopItems.purchased.manual ? 1 : 0) + (ShopItems.purchased.shovel ? 2 : 0)
                + (ShopItems.purchased.bargaging ? 2 : 0))
                * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            ) * getResourceMult('gold') * BasicBanners.getBonus('green'),
        }),
        getCooldown: () =>  Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'chill',
        name: 'Rest',
        description: 'Take some rest to recover energy',
        isUnlocked: () => true,
        getCost: () => ({

        }),
        getGain: () => ({
            energy: (
                2*Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            ) * BasicBanners.getBonus('green'),
        }),
        getCooldown: () =>  Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'physicalTraining',
        name: 'Train stamina',
        description: 'Do some athletics to increase energy regeneration',
        isUnlocked: () => BasicStory.story.stepId > 2,
        getCost: () => ({
            energy: 8,
        }),
        getGain: () => ({

        }),
        getCustomGainText: () => {
          return ` +${fmtVal((0.02 + (ShopItems.purchased.gymnastics ? 0.02 : 0) + (ShopItems.purchased.equipment ? 0.04 : 0))
           * BasicBanners.getBonus('green')
          * Math.pow(1.01, BasicSkills.skillLevel('perseverance')))} energy/sec`
        },
        getCooldown: () =>  5*Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'meditate',
        name: 'Meditate',
        description: 'Spend whole day on receiving magic forces',
        isUnlocked: () => ShopItems.purchased.bookOfMagic,
        getCost: () => ({
            energy: 10 + 10*(ShopItems.purchased.bookOfMeditation ? 1 : 0)
                + 10*(ShopItems.purchased.manaOrb ? 1 : 0),
        }),
        getGain: () => ({
            mana: (
                (1  + 1*(ShopItems.purchased.bookOfMeditation ? 1 : 0)
                    + 1*(ShopItems.purchased.manaOrb ? 1 : 0))
                * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            ) * BasicBanners.getBonus('green') * getResourceMult('mana'),
        }),
        getCooldown: () => 5*Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'magicLessons',
        name: 'Magic lessons',
        description: 'Take courses of magic',
        isUnlocked: () => ShopItems.purchased.magicStamp,
        getCost: () => ({
            energy: 20,
            gold: 150
        }),
        getGain: () => ({
            // mana: 1  + 1*(ShopItems.purchased.bookOfMeditation ? 1 : 0),
        }),
        getCustomGainText: () => {
          return ` +${fmtVal(4* (1 + 0.2 * BasicResearch.getResearchLevel('tireless')) 
          * BasicBanners.getBonus('green'))} max mana`;
        },
        getCooldown: () => 5 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'refineSoul',
        name: 'Refine soul',
        description: 'Refines some mana to soul',
        isUnlocked: () => ShopItems.purchased.summoning,
        getCost: () => ({
            mana: 50,
            gold: 225
        }),
        getGain: () => ({
            souls: (
                (1 + 0.75*(ShopItems.purchased.soulHarvester ? 1 : 0))
                * (1 + 0.75*(ShopItems.purchased.soulHarvester2 ? 1 : 0))
                * (1 + 0.75*(ShopItems.purchased.soulHarvester3 ? 1 : 0))
                * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + 0.1 * BasicResearch.getResearchLevel('soulEater'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            ) * BasicBanners.getBonus('green') * getResourceMult('souls'),
        }),
        getCooldown: () => 5 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'collectHerbs',
        name: 'Collect herbs',
        description: 'Collect herbs as raw material for flasks',
        isUnlocked: () => ShopItems.purchased.herbalism,
        getCost: () => ({
            energy: 50
        }),
        getGain: () => ({
            herbs: (
                1 * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + (ShopItems.purchased.herbalismKnowledge ? 1 : 0))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            ) * BasicBanners.getBonus('green') * getResourceMult('herbs'),
        }),
        getCooldown: () => 8 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'boilFlasks',
        name: 'Make flasks',
        description: 'Make some flasks to improve creatures efficiency',
        isUnlocked: () => ShopItems.purchased.herbalism,
        getCost: () => ({
            mana: 40,
            herbs: 10,
        }),
        getGain: () => ({
            flasks: (
                1 * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            ) * BasicBanners.getBonus('green') * getResourceMult('flasks'),
        }),
        getCooldown: () => 10 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'craftMemStones',
        name: 'Craft Memory Stones',
        description: 'Make memory stones from souls and ore.',
        note: 'Crafting gain is not affected by green banner',
        isUnlocked: () => BasicResearch.getResearchLevel('memoryStones') > 0,
        getCost: () => ({
            souls: 1.e+11,
            ore: 1.e+7,
            energy: 1.e+9,
        }),
        getGain: () => ({
            memoryStones: (
                0.015*Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
                * (1 + 0.2 * BasicResearch.getResearchLevel('crafting'))
            ) * getResourceMult('memoryStones'),
        }),
        getCooldown: () => 10 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'expansionSpell',
        name: 'Expansion spell',
        description: 'Expand gold storage',
        isUnlocked: () => ShopItems.purchased.bookOfMagic,
        getCost: () => ({
            mana: 5 * Math.pow(0.99, BasicSkills.skillLevel('mana')),
        }),
        getGain: () => ({

        }),
        getCustomGainText: () => {
            const val = getExpansionEffect() * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('palace')
            ) * (
                1 + 0.2 * BasicResearch.getResearchLevel('banking')
            );
            return ` +${fmtVal(val)} max gold`;
        },
        getCooldown: () => 5 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'energyOrb',
        name: 'Energy orb',
        description: 'Increase max energy',
        isUnlocked: () => ShopItems.purchased.bookOfMagic,
        getCost: () => ({
            mana: 5 * Math.pow(0.99, BasicSkills.skillLevel('mana')),
        }),
        getGain: () => ({

        }),
        getCustomGainText: () => {
            const val = getEnergyOrbEffect();
            return ` +${fmtVal(val)} max energy`;
        },
        getCooldown: () => 5 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    },{
        id: 'packingSpell',
        name: 'Packing spell',
        description: 'Increase building materials storage',
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getCost: () => ({
            mana: 1500 * Math.pow(0.99, BasicSkills.skillLevel('mana')),
        }),
        getGain: () => ({

        }),
        getCustomGainText: () => {
            const val = getPackingEffect();
            return ` +${fmtVal(100*val)}% to building resources capacity`;
        },
        getCooldown: () => 5 * Math.pow(0.99, BasicSkills.skillLevel('initiative')),
    }];

    class BasicActions {

        static actions = {};

        static prevRunActions = {
            list: [],
            doRemember: true,
        };

        static init(isBannerPrestige) {
            if(isBannerPrestige) {
                if(!BasicActions.prevRunActions) {
                    BasicActions.prevRunActions = {};
                }
                BasicActions.prevRunActions.list = BasicActions.getAutomatedList();
                BasicActions.prevRunActions.doRemember = true;
            }
            BasicActions.actions = {};
        }

        static getAutomatedList() {
            const list = [];
            for(let key in BasicActions.actions) {
                if(BasicActions.actions[key].isAutomated) {
                    list.push(key);
                }
            }
            return list;
        }

        static getActionsEfficiency = () => {
            const currentAutomations = Object.values(BasicActions.actions).filter(one => one.isAutomated).length;
            return currentAutomations < 3 ? 1 : 3 / (1.15 * currentAutomations);
        }

        static getActions() {
            return actionsData.filter(one => one.isUnlocked()).map(action => {
                const currState = BasicActions.actions[action.id] || {
                    performed: 0,
                    cooldown: 0,
                    efficiency: 1,
                };
                const cost = BasicResources.checkResourcesAvailable(action.getCost());
                return {
                    id: action.id,
                    name: action.name,
                    note: action.note,
                    gain: action.getGain(),
                    customGain: action.getCustomGainText ? action.getCustomGainText() : null,
                    description: action.description,
                    cost: cost,
                    isUnlocked: action.isUnlocked(),
                    isAvailable: currState.cooldown <= 0 && cost.isAvailable,
                    isAutomated: !!currState.isAutomated,
                    automationEnabled: ShopItems.purchased['notebook'],
                    timeout: action.getCooldown() / (!!currState.isAutomated ? BasicActions.getActionsEfficiency() : 1),
                    ...currState,
                }
            })
        }

        static getBalanceByAction(resourceId, actionId, bIgnoreEfficiency = false) {
            let bal = 0;
            if(!BasicActions.actions[actionId]) return 0;
            if(!BasicActions.actions[actionId].isAutomated) return 0;
            const action = actionsData.find(one => one.id === actionId);
            const cost = action.getCost();
            const profit = action.getGain();
            if(profit && profit[resourceId]) {
                bal += profit[resourceId] * BasicActions.getActionsEfficiency() * (bIgnoreEfficiency ? 1 : BasicActions.actions[actionId].efficiency) / action.getCooldown();
            }
            if(cost && cost[resourceId]) {
                bal -= cost[resourceId] * BasicActions.getActionsEfficiency() * (bIgnoreEfficiency ? 1 : BasicActions.actions[actionId].efficiency) / action.getCooldown();
            }
            if(Number.isNaN(bal)) {
                console.error('NaN DETECTED: ', resourceId, actionId, bal, profit, cost, action.getCooldown(), BasicActions.getActionsEfficiency(), BasicActions.actions[actionId].efficiency);
            }
            return bal;
        }

        static getBalanceById(resourceId, bIgnoreEfficiency) {
            let bal = 0;
            Object.entries(BasicActions.actions).forEach(([id, data]) => {
                if(!data.isAutomated) return;
                bal += BasicActions.getBalanceByAction(resourceId, id, bIgnoreEfficiency);
            });
            return bal;
        }

        static performAction(id) {
            const data = actionsData.find(one => one.id === id);
            if(!data) {
                throw new Error(`Not found action by id ${id}`);
            }
            if(!data.isUnlocked()) {
                return;
            }
            const cost = data.getCost();
            const available = BasicResources.checkResourcesAvailable(cost);
            const currState = BasicActions.actions[id] || {
                performed: 0,
                cooldown: 0,
                efficiency: 1,
            };
            if(available.isAvailable && currState.cooldown <= 0) {
                BasicResources.subtractBatch(cost);
                BasicResources.addBatch(data.getGain());
                if(!BasicActions.actions[id]) {
                    BasicActions.actions[id] = {
                        performed: 0,
                        cooldown: 0,
                        efficiency: 1,
                    };
                }
                BasicActions.actions[id].performed++;
                BasicActions.actions[id].cooldown = data.getCooldown();
            }
        }

        static setAutomated(id) {
            if(!ShopItems.purchased.notebook) {
                return;
            }
            if(!BasicActions.actions[id]) {
                BasicActions.actions[id] = {
                    performed: 0,
                    cooldown: 0,
                    efficiency: 1,
                };
            }
            if(!BasicActions.prevRunActions) {
                BasicActions.prevRunActions = {
                    doRemember: false,
                    list: [],
                };
            }
            BasicActions.prevRunActions.doRemember = false;
            if(BasicActions.actions[id].isAutomated) {
                BasicActions.actions[id].isAutomated = false;
            } else {
                const maxAutomations = 1 + (ShopItems.purchased.timeManagement ? 1 : 0)
                    + (ShopItems.purchased.bookOfMultitasking ? 2 : 0)
                + (BasicResearch.getResearchLevel('machinery') ? 1 : 0);
                let newA = maxAutomations - 1;
                Object.keys(BasicActions.actions).forEach(key => {
                    if(key !== id && BasicActions.actions[key].isAutomated) {
                        if(newA <= 0) {
                            BasicActions.actions[key].isAutomated = false;
                        } else {
                            newA--;
                        }
                    } else {
                        BasicActions.actions[key].isAutomated = key === id;
                    }
                });

            }
        }

        static process(dT) {
            let usedAutomations = [];
            if(!BasicActions.actions['magicLessons']) {
                BasicActions.actions['magicLessons'] = {
                    performed: 0,
                    cooldown: 0,
                    efficiency: 1,
                };
            }
            for(const key in BasicActions.actions) {
                BasicActions.actions[key].cooldown -= dT * (!!BasicActions.actions[key].isAutomated ? BasicActions.getActionsEfficiency() : 1);
                if(BasicActions.actions[key].cooldown < 0) {
                    BasicActions.actions[key].cooldown = 0;
                }

                // when auto-banner - perform magicLessons unless max mana > 50
                // console.log('chckAction', key, BasicBanners.options?.automation?.isTurnedOn, resourcesData.find(one => one.id === 'mana').getMax());
                if(key === 'magicLessons' && BasicBanners.options?.automation?.isTurnedOn && resourcesData.find(one => one.id === 'mana').getMax() < 50) {
                    const action = actionsData.find(one => one.id === key);
                    const cost = BasicResources.checkResourcesAvailable(action.getCost());
                    if(BasicActions.actions[key].cooldown <= 0 && cost.isAvailable) {
                        BasicActions.performAction(key);
                    }
                }

                if(BasicActions.actions[key].isAutomated) {
                    usedAutomations.push(key);
                    const action = actionsData.find(one => one.id === key);
                    const cost = BasicResources.checkResourcesAvailable(action.getCost());
                    // calculate efficiency for avg balance
                    let efficiency = 1;

                    Object.entries(action.getCost()).forEach(([resId, cost]) => {
                        efficiency = Math.min(efficiency, BasicResources.efficiencies[resId]?.efficiency || 1);
                    });
                    // actually efficiency here is real cooldown divided by resources collection time

                    BasicActions.actions[key].efficiency = efficiency;
                    if(BasicActions.actions[key].cooldown <= 0 && cost.isAvailable) {
                        BasicActions.performAction(key);
                    }
                }
            }
            const maxAutomations = 1 + (ShopItems.purchased.timeManagement ? 1 : 0)
                + (ShopItems.purchased.bookOfMultitasking ? 2 : 0)
                + (BasicResearch.getResearchLevel('machinery') ? 1 : 0);
            if(maxAutomations > 0 && usedAutomations.length < BasicActions.prevRunActions?.list?.length && BasicActions.prevRunActions.doRemember) {
                const diffToFill = BasicActions.prevRunActions.list.length - usedAutomations.length;
                const diff = BasicActions.prevRunActions.list.filter(one => !usedAutomations.includes(one) && actionsData.find(i => i.id === one)?.isUnlocked());
                const listToFill = diff.slice(0, Math.min(diffToFill, maxAutomations - usedAutomations.length));
                // console.log('BasicActions.prevRunActions', BasicActions.prevRunActions, usedAutomations, maxAutomations, diff, listToFill);
                listToFill.forEach(key => {
                    if(!BasicActions.actions[key]) {
                        BasicActions.actions[key] = {
                            performed: 0,
                            cooldown: 0,
                            efficiency: 1,
                        };
                    }
                    BasicActions.actions[key].isAutomated = true;
                });
            }
        }

        static sendToUI() {
            const list = BasicActions.getActions();
            ColibriWorker.sendToClient('set_actions_state', list);
        }

    }

    const resourcesData = [{
        id: 'gold',
        name: 'Gold',
        isUnlocked: () => true,
        getMax: () => {
            let amt = (20 + 20 * (ShopItems.purchased.pocket || 0)
                + 50 * BasicResearch.getResearchLevel('economy')
                + getExpansionEffect()* (BasicActions.actions.expansionSpell?.performed || 0)
                + 200 * (ShopItems.purchased.stash || 0)
                + BasicAuras.getEffect('goldMaxBase')
            ) * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('palace')
            ) * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('bank')
            ) * (
                1 + 0.2 * BasicResearch.getResearchLevel('banking')
            ) * ( 1 + BasicAuras.getEffect('goldMax'));
            if(BasicTemper.getCurrentTemper() === 'saving') {
                amt = amt * 1.25 + 50;
            }
            amt *= (1 + BasicHeirlooms.getTotalBonus('saving'));
            amt *= (1 + 0.5*BasicBuilding.getBuildingLevel('greatTreasury'));

            if(BasicResearch.getResearchLevel('advancedBanking')) {
                amt *= Math.pow(1.1, BasicBuilding.getBuildingLevel('bank'));
            }

            amt *= Math.pow(1.25, BasicBuilding.getBuildingLevel('dragonTreasury'));

            return amt;
        },
        getIncome: () => Math.pow(BasicResearch.getResearchLevel('economy'), 1.5) + BasicAuras.getEffect('goldBase'),
        getAggregatedIncome: () => {
        }
    },{
        id: 'energy',
        name: 'Energy',
        isUnlocked: () => true,
        getMax: () => {
            let amt = 10 + getEnergyOrbEffect()
            * (BasicActions.actions.energyOrb?.performed || 0)
                + 5 * BasicResearch.getResearchLevel('energizer')
                + BasicAuras.getEffect('energyMaxBase');
            if(BasicTemper.getCurrentTemper() === 'energetic') {
                amt = amt * 1.25 + 20;
            }
            amt *= (1 + BasicHeirlooms.getTotalBonus('energy'));
            amt *= (1 + BasicAuras.getEffect('energyMax'));
            return amt;
        },
        getIncome: () =>
            (0.02 + (ShopItems.purchased.gymnastics ? 0.02 : 0) + (ShopItems.purchased.equipment ? 0.04 : 0))
            * (BasicActions.actions.physicalTraining?.performed || 0) * BasicBanners.getBonus('green')
            * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
            + 0.5 * Math.pow(BasicResearch.getResearchLevel('energizer'),1.5)
            + BasicAuras.getEffect('energyBase')
    },{
        id: 'mana',
        name: 'Mana',
        isUnlocked: () => !!ShopItems.purchased.bookOfMagic,
        getMax: () => {
            let amt = 10 + 10 * (ShopItems.purchased.magicStamp || 0)
            + 4*(BasicActions.actions.magicLessons?.performed || 0)
            * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            * BasicBanners.getBonus('green')
            + BasicAuras.getEffect('manaMaxBase');
            if(BasicTemper.getCurrentTemper() === 'spiritual') {
                amt = 1.25*amt + 10;
            }
            amt *= (1 + BasicHeirlooms.getTotalBonus('magic'));
            amt *= (1 + BasicAuras.getEffect('manaMax'));
            return amt;
        },
        getIncome: () => BasicAuras.getEffect('manaBase'),
    },{
        id: 'souls',
        name: 'Souls',
        isUnlocked: () => !!ShopItems.purchased.summoning,
        getMax: () => 0,
        getIncome: () => BasicAuras.getEffect('soulsBase'),
    },{
        id: 'herbs',
        name: 'Herbs',
        isUnlocked: () => !!ShopItems.purchased.herbalism,
        getMax: () => (10 + (ShopItems.purchased.herbalistsStash ? 20 : 0) + BasicAuras.getEffect('herbsMaxBase'))*(1 +  BasicAuras.getEffect('herbsMax')),
        getIncome: () => 0,
    },{
        id: 'flasks',
        name: 'Flasks',
        isUnlocked: () => !!ShopItems.purchased.herbalism,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'research',
        name: 'Research',
        isUnlocked: () => BasicResearch.isResearchUnlocked(),
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'territory',
        name: 'Territory',
        isUnlocked: () => Object.values(BasicMap.state.zonesAmounts || {}).some(one => one > 0),
        getMax: () => Object.entries(BasicMap.state.zonesAmounts).reduce((acc, [index,one]) => acc + one*territotyPerZone(+index), 0),
        getIncome: () => 0,
    },{
        id: 'wood',
        name: 'Wood',
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getMax: () => (
            10 * BasicBuilding.getBuildingLevel('warehouse')
            + 250 * BasicBuilding.getBuildingLevel('harbour')
            )
            * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0))
            * (1 + 0.2 * BasicResearch.getResearchLevel('logistics'))
            * (1 + BasicAuras.getEffect('woodMax')) * (BasicResearch.getResearchLevel('advancedLogistics')
                    ? Math.pow(1.1, BasicBuilding.getBuildingLevel('warehouse'))
                    : 1
            )*Math.pow(1.25, BasicBuilding.getBuildingLevel('dragonVault')),
        getIncome: () => 0,
    },{
        id: 'stone',
        name: 'Stone',
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getMax: () => (
                10 * BasicBuilding.getBuildingLevel('warehouse')
                + 250 * BasicBuilding.getBuildingLevel('harbour')
            ) * (
            1 + 0.2 * BasicResearch.getResearchLevel('logistics')
        ) * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0))
            * (1 + BasicAuras.getEffect('stoneMax')) * (BasicResearch.getResearchLevel('advancedLogistics')
                    ? Math.pow(1.1, BasicBuilding.getBuildingLevel('warehouse'))
                    : 1
            )*Math.pow(1.25, BasicBuilding.getBuildingLevel('dragonVault')),
        getIncome: () => 0,
    },{
        id: 'ore',
        name: 'Ore',
        isUnlocked: () => BasicBuilding.getBuildingLevel('mine') > 0,
        getMax: () => (2 * BasicBuilding.getBuildingLevel('warehouse')
                + 50 * BasicBuilding.getBuildingLevel('harbour')) * (
            1 + 0.2 * BasicResearch.getResearchLevel('logistics')
        ) * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0))
            * (1 + BasicAuras.getEffect('oreMax')) * (BasicResearch.getResearchLevel('advancedLogistics')
                ? Math.pow(1.1, BasicBuilding.getBuildingLevel('warehouse'))
                : 1
            )*Math.pow(1.25, BasicBuilding.getBuildingLevel('dragonVault')),
        getIncome: () => 0,
    },{
        id: 'dragonithe',
        name: 'Dragonite',
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmelting'),
        getMax: () => (2 * BasicBuilding.getBuildingLevel('warehouse')
                + 50 * BasicBuilding.getBuildingLevel('harbour')) * (
                1 + 0.2 * BasicResearch.getResearchLevel('logistics')
            ) * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0))
            * (1 + BasicAuras.getEffect('dragoniteMax')) * (BasicResearch.getResearchLevel('advancedLogistics')
                    ? Math.pow(1.1, BasicBuilding.getBuildingLevel('warehouse'))
                    : 1
            )*Math.pow(1.25, BasicBuilding.getBuildingLevel('dragonVault')),
        getIncome: () => 0,
    },{
        id: 'tools',
        name: 'Tools',
        isUnlocked: () => BasicBuilding.getBuildingLevel('forge') > 0,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'weapons',
        name: 'Weapons',
        isUnlocked: () => BasicBuilding.getBuildingLevel('forge') > 0,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'dragoniteTools',
        name: 'Drag. Tools',
        isUnlocked: () => BasicResearch.getResearchLevel('dragoniteSmiths') > 0,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'fame',
        name: 'Fame',
        isUnlocked: () => BasicMap.state.bossesArena && BasicMap.state.bossesArena.level > 0,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'memoryStones',
        name: 'Mem. Stones',
        isUnlocked: () => BasicResearch.getResearchLevel('memoryStones') > 0,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'flasksOfAgility',
        name: 'Flasks of agility',
        isUnlocked: () => BasicResearch.getResearchLevel('alchemy'),
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'flasksOfEndurance',
        name: 'Flasks of endurance',
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy'),
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'flasksOfAggression',
        name: 'Flasks of aggression',
        isUnlocked: () => BasicResearch.getResearchLevel('enhancedAlchemy'),
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'chargeStones',
        name: 'Charge Stone',
        isUnlocked: () => BasicResearch.getResearchLevel('heirloomCharging'),
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'chargeGems',
        name: 'Charge Gem',
        isUnlocked: () => BasicResearch.getResearchLevel('auraCharging'),
        getMax: () => 0,
        getIncome: () => 0,
    }


    ,{
        id: 'condensedTime',
        name: 'Time',
        isUnlocked: () => BasicResources.getResource('condensedTime') > 0,
        getMax: () => 3600*4,
        getIncome: () => 0,
    }];

    class BasicResources {

        static resources = {};

        static efficiencies = {};

        static resourcesMax = {};

        static getFlasksEffect() {
            return 1 + 0.045*Math.pow(Math.max(BasicResources.resources.flasks || 0, 0), 0.5)
        }

        static getToolsEffect() {
            return 1 + 0.015*Math.pow(Math.max(BasicResources.resources.tools || 0, 0), 0.4)
        }

        static getDragonToolsEffect() {
            return 1 + 1.e-3*Math.pow(Math.max(BasicResources.resources.dragoniteTools || 0, 0),0.4);
        }

        static initialize(isFromPrestiege = false) {
            if(!isFromPrestiege) {
                BasicResources.resources = {};
            } else {
                const nres = {
                    chargeStones: BasicResources.resources?.chargeStones,
                    chargeGems: BasicResources.resources?.chargeGems,
                    memoryStones: BasicResources.resources?.memoryStones,
                };
                BasicResources.resources = nres;
            }

        }

        static add(key, amount) {
            if(!BasicResources.resources[key]) {
                BasicResources.resources[key] = 0;
            }
            BasicResources.resources[key] += amount;
        }

        static subtract(key, amount) {
            if(!BasicResources.resources[key]) {
                BasicResources.resources[key] = -amount;
                return;
            }
            BasicResources.resources[key] -= amount;
        }

        static isEnoughResource(key, amount) {
            return BasicResources.getResource(key) >= amount;
        }

        static addBatch(resources) {
            for(const key in resources) {
                BasicResources.add(key, resources[key]);
            }
        }

        static subtractBatch(resources) {
            for(const key in resources) {
                BasicResources.subtract(key, resources[key]);
            }
        }

        static multBatch(resources, mult) {
            const newRes = {};
            for(const key in resources) {
                newRes[key] = mult * resources[key];
            }
            return newRes;
        }

        static setBatch(resources) {
            for(const key in resources) {
                BasicResources.resources[key] = resources[key];
            }
        }

        static checkResourcesAvailable(resources) {
            const result = {
                isAvailable: true,
                resources: {},
            };
            let totalPercentage = 1;
            for(const key in resources) {
                const isAvailable = BasicResources.isEnoughResource(key, resources[key]);
                const percentage = isAvailable ? 1 : BasicResources.resources[key] / resources[key];
                totalPercentage = Math.min(percentage, totalPercentage);
                result.resources[key] = {
                    cost: resources[key],
                    actual: BasicResources.resources[key],
                    percentage,
                    isAvailable,
                };
                if(!isAvailable) {
                    result.isAvailable = false;
                }
            }
            result.totalPercentage = totalPercentage;
            return result;
        }

        static process(dT) {
            resourcesData.forEach(res => {
                const inc = res.getIncome() * dT;
                BasicResources.add(res.id, inc);
                const max = res.getMax();
                BasicResources.resourcesMax[res.id] = max;
                /*if(max && max < BasicResources.resources[res.id]) {
                    BasicResources.resources[res.id] = max;
                }*/
            });
            // BasicResources.addBatch(incomes);

        }

        static postProcess(dT) {
            for(const key in BasicResources.resources) {
                BasicResources.resources[key] = BasicResources.getResource(key);
            }
            BasicResources.sendToUI();
        }

        static getResource(id) {
            if(!BasicResources.resourcesMax[id]) {
                return Math.max(BasicResources.resources[id], 0);
            }
            return Math.max(0,Math.min(BasicResources.resources[id], BasicResources.resourcesMax[id]));
        }

        static getBalance(one, newState = {}, logBreakdown = false) {
            /*if(logBreakdown) {
                console.log('breakDown: ', {
                    base: one.getIncome(),
                    creatures: CreatureBasic.getBalanceById(one.id),
                    jobs: CreatureJobs.getBalanceById(one.id, newState?.creatureJobs),
                    skills: BasicSkills.getBalanceById(one.id, newState?.learning),
                    actions: BasicActions.getBalanceById(one.id),
                    auras: BasicAuras.getBalanceById(one.id, newState?.auras)
                })
            }*/
            return one.getIncome()
            + CreatureBasic.getBalanceById(one.id)
            + CreatureJobs.getBalanceById(one.id, newState?.creatureJobs, false, logBreakdown)
            + BasicSkills.getBalanceById(one.id, newState?.learning)
            + BasicActions.getBalanceById(one.id)
            + BasicAuras.getBalanceById(one.id, newState?.auras)
        }

        // get missing percentages to calculate efficiencies for future
        static preRun(dT) {
            const balResult = {};
            resourcesData.forEach(res => {
                const nonMitigatableBalance = res.getIncome()
                    + CreatureBasic.getBalanceById(res.id);

                const creaturesBalance = CreatureJobs.getBalanceById(res.id, undefined, true);

                // const skillBalance = BasicSkills.getBalanceById(res.id, undefined, true);

                const actionsBalance = BasicActions.getBalanceById(res.id, true);

                let mitigatableBalance = creaturesBalance;// + skillBalance;

                const balanceWOutActions = nonMitigatableBalance + mitigatableBalance;

                mitigatableBalance += actionsBalance;

                let mitiToDump = 0;
               /* if(skillBalance < 0) {
                    mitiToDump += skillBalance;
                }*/
                if(creaturesBalance < 0) {
                    mitiToDump += creaturesBalance;
                }
                /*if(actionsBalance < 0) {
                    mitiToDump += actionsBalance;
                }*/

                balResult[res.id] = {
                    current: BasicResources.resources[res.id],
                    potentialInMax: BasicResources.resources[res.id] + nonMitigatableBalance + mitigatableBalance,
                    balanceWOutActions,
                    efficiency: 1,
                    mitigatableBalance,
                    nonMitigatableBalance,
                };
                if(balResult[res.id].potentialInMax < 0) {
                    balResult[res.id].efficiency = Math.max(0, Math.min(1,
                            -(balResult[res.id].current + nonMitigatableBalance + mitigatableBalance - mitiToDump) / mitiToDump
                        ));
                }
            });
            BasicResources.efficiencies = balResult;
        }

        static getBalanceDifferences(potentialState, delta = 1.0) {
            let result = {
                isRisk: false,
                delta,
                resources: {},
                riskResources: [],
            };
            resourcesData.forEach(res => {
                const current = BasicResources.getBalance(res);
                const potential = BasicResources.getBalance(res, potentialState);
                const direction = Math.sign((potential - current) * delta); //positive = increase (prod), negative = decrease (cons)

                result.resources[res.id] = {
                    current,
                    potential,
                    diff: potential - current,
                    isRisk: potential < 0 && potential - current < 0,
                    direction,
                };
                if(result.resources[res.id].isRisk) {
                    result.isRisk = true;
                    let equilibrumAt = delta * (current / (current - potential));
                    if(direction < 0) {
                        equilibrumAt = Math.floor(equilibrumAt);
                    } else {
                        equilibrumAt = Math.ceil(equilibrumAt);
                    }
                    result.riskResources.push({
                        id: res.id,
                        name: res.name,
                        equilibrumAt,
                        direction,
                    });
                }
            });
            let minAcceptable = Math.min(0, delta);
            let maxAcceptable = Math.max(0, delta);
            result.riskResources.forEach(one => {
                if(one.direction > 0) {
                    minAcceptable = Math.max(minAcceptable, Math.ceil(one.equilibrumAt));
                } else {
                    maxAcceptable = Math.min(maxAcceptable, Math.floor(one.equilibrumAt));
                }
            });
            result.minAcceptable = minAcceptable;
            result.maxAcceptable = maxAcceptable;
            if(delta < 0) {
                result.optimum = minAcceptable;
            } else {
                result.optimum = maxAcceptable;
            }
            return result;
        }

        static sendToUI() {
            ColibriWorker.sendToClient('update_resources', resourcesData.map(one => {
                let amount = BasicResources.resources[one.id] || 0;
                let income = 0;
                let incomeText = 0;
                let bonus = 0;
                let bonusText = 0;
                if(one.id === 'flasks') {
                    bonus = BasicResources.getFlasksEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                } else
                if(one.id === 'tools') {
                    bonus = BasicResources.getToolsEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                } else
                if(one.id === 'weapons') {
                    bonus = FightParties.getWeaponsEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                } else
                if(one.id === 'dragoniteTools') {
                    bonus = BasicResources.getDragonToolsEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                } else
                if(one.id === 'flasksOfAgility') {
                    bonus = FightParties.getFlaskOfAgilityEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                } else
                if(one.id === 'flasksOfAggression') {
                    bonus = FightParties.getFlaskOfAggressionEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                } else
                if(one.id === 'flasksOfEndurance') {
                    bonus = FightParties.getFlaskOfEnduranceEffect();
                    bonusText = `X${fmtVal(bonus)} boost`;
                }

                income = BasicResources.getBalance(one);
                incomeText = fmtVal(income);

                if(one.id === 'territory') {
                    amount = BasicBuilding.getUsedTerritoryCached() || 0;
                }
                return {
                    name: one.name,
                    isUnlocked: one.isUnlocked(),
                    id: one.id,
                    max: one.getMax(),
                    income,
                    incomeText,
                    bonus,
                    bonusText,
                    amount
                }
            }));
        }

    }

    class BasicRun {

        static interval = null;

        static timeSpent;


        static initialize(isBannerPrestige = false) {
            BasicRun.timeSpent = 0;
            BasicStatistics.inc('numRuns', 1);
            BasicStatistics.initialize(isBannerPrestige);

            // add potential purchased researches to actual ones
            BasicResearch.onPrestige();

            BasicResources.initialize(isBannerPrestige);
            BasicActions.init(isBannerPrestige);
            BasicSkills.initialize(isBannerPrestige);
            ShopItems.initialize(isBannerPrestige);
            CreatureBasic.initialize(isBannerPrestige);
            CreatureJobs.initialize(isBannerPrestige);
            BasicMap.initialize(isBannerPrestige);
            BasicFight.initialize();
            BasicBuilding.initialize(isBannerPrestige);
            BasicHeirlooms.initialize(isBannerPrestige);
            BasicSettings.initialize(isBannerPrestige);
            CreatureJobsPresets.initialize(isBannerPrestige);

            if(BasicRun.interval) {
                clearInterval(BasicRun.interval);
            }

            BasicRun.interval = setInterval(() => BasicRun.process(0.1), 100);
        }

        static process(dt) {
            let dT = dt;
            if(!BasicResources.resources?.condensedTime || BasicResources.resources?.condensedTime <= 0) {
                BasicSettings.settings.isUseCondensedTime = false;
            } else
            if(BasicSettings.settings.isUseCondensedTime) {
                BasicResources.resources.condensedTime -= dt;
                dT = 2 * dt;
            }
            BasicResources.preRun(dT);
            BasicResources.process(dT);
            CreatureJobs.process(dT);
            CreatureBasic.process(dT);
            BasicSkills.process(dT);
            BasicStory.process();
            BasicFight.process(dT);
            BasicMap.process(dT);
            BasicBuilding.process(dT);
            BasicTemper.process();
            ShopItems.process(dT);
            BasicAuras.process(dT);
            BasicActions.process(dT);
            BasicBanners.process(dT);
            BasicHeirlooms.process();
            CreatureBasic.postProcess(dT);
            BasicResources.postProcess(dT);
            BasicRun.timeSpent += dT;
            BasicStatistics.inc('timeSpent', dT);
            ColibriWorker.sendToClient('set_general', {
                timeSpent: BasicRun.timeSpent,
                bannersUnlocked: CreatureBasic.numCreatures > 50 || BasicBanners.hasSomeBanners(),
                researchUnlocked: BasicResearch.isResearchUnlocked(),
                battleUnlocked: BasicResearch.getResearchLevel('fighting') > 0,
                buildingUnlocked: BasicResearch.getResearchLevel('building') > 0,
                heirloomsUnlocked: BasicHeirlooms.heirloomsUnlocked(),
                aurasUnlocked: BasicAuras.aurasUnlocked(),
                story: BasicStory.getCurrentToShow(),
                temper: BasicTemper.state,
                autopurchaseUnlocked: BasicResearch.getResearchLevel('advancedAutomation') > 0,
                autopurchaseOn: ShopItems.settings.autoPurchase,
                settings: BasicSettings.settings,
            });
        }

    }

    class Main {

        static lastSave;


        static initialize() {
            BasicRun.initialize();
            BasicBanners.initialize();
            setInterval(
                () => Main.save(),
                5000
            );
        }

        static toSaveString() {
            const saveObject = {
                aurasPresets: AurasPresets.state || {},
                resources: BasicResources.resources,
                actions: BasicActions.actions,
                prevRunActions: BasicActions.prevRunActions,
                shopItems: ShopItems.purchased,
                shopSettings: ShopItems.settings,
                numCreatures: CreatureBasic.numCreatures || 0,
                creatureJobs: CreatureJobs.workers || {},
                creatureJobsPresets: CreatureJobsPresets.state,
                creatureSettings: CreatureBasic.settings || { amount: 1 },
                skills: BasicSkills.skills || {},
                banners: BasicBanners.banners || BasicBanners.initialize(),
                prevBanners: BasicBanners.prevBanners || {},
                bannerOptions: BasicBanners.options || {},
                general: {
                    timeSpent: BasicRun.timeSpent || 0,
                },
                researches: BasicResearch.researches || {},
                story: BasicStory.story || {},
                map: BasicMap.state || {},
                buildings: BasicBuilding.buildings || {},
                buildingsQueue: BasicBuilding.buildingQueue || [],
                temper: BasicTemper.state || {},
                settings: BasicSettings.settings || {},
                heirlooms: BasicHeirlooms.state,
                auras: BasicAuras.state || {},
                lastSave: Date.now(),
                statistics: BasicStatistics.data,
            };
            const saveString = JSON.stringify(saveObject);
            console.log('saving: ', saveObject);
            if(!saveObject.aurasPresets) {
                console.error('auraPresets not found');
            }
            return saveString;
        }

        static saveStringToGame(saveString) {
            const save = JSON.parse(saveString);
            BasicBuilding.usedLand = null;
            BasicResources.resources = save.resources;
            BasicActions.actions = save.actions;
            BasicActions.prevRunActions = save.prevRunActions;
            ShopItems.purchased = save.shopItems;
            ShopItems.settings = save.shopSettings;
            if(!ShopItems.settings) {
                ShopItems.settings = {
                    everPurchased: {...(save.shopItems || {})},
                    autoPurchase: false,
                };
            }
            CreatureBasic.numCreatures = save.numCreatures || 0;
            CreatureBasic.settings = save.creatureSettings || {
                amount: 1,
            };
            CreatureJobs.workers = save.creatureJobs || {};
            CreatureJobsPresets.state = save.creatureJobsPresets || CreatureJobsPresets.initialize();
            BasicSkills.skills = save.skills || {};
            BasicRun.timeSpent = save.general?.timeSpent || 0;
            BasicBanners.banners = save.banners || BasicBanners.initialize();
            BasicBanners.prevBanners = save.prevBanners;
            BasicBanners.options = save.bannerOptions;
            if(!BasicBanners.prevBanners) {
                BasicBanners.saveBannersToPrev();
            }
            BasicResearch.researches = save.researches || {};
            BasicStory.story = save.story || BasicStory.initialize();
            BasicMap.state = save.map || BasicMap.initialize();
            BasicBuilding.buildings = save.buildings || BasicBuilding.initialize();
            BasicBuilding.buildingQueue = save.buildingsQueue || [];
            BasicTemper.state = save.temper || BasicTemper.initialize();
            BasicSettings.settings = save.settings || BasicSettings.initialize();
            if(!BasicSettings.settings.resourcesDisplay) {
                BasicSettings.initResourcesSettings();
            }
            BasicHeirlooms.state = save.heirlooms || BasicHeirlooms.initialize();
            BasicAuras.state = save.auras || BasicAuras.initialize();
            AurasPresets.state = save.aurasPresets || AurasPresets.initialize();
            BasicStatistics.data = save.statistics || BasicStatistics.initialize();
            const now = Date.now();
            if(save.lastSave && now - save.lastSave > 30000) {
                const gain = (now - save.lastSave - 10000) / 1000;
                BasicResources.add('condensedTime', gain);
            }
            console.log('loadedAuraPresets: ', AurasPresets.state, save.aurasPresets, saveString);
        }

        static save() {
            const string = Main.toSaveString();
            ColibriWorker.sendToClient('save_to_local', string);
        }

        static getExportString() {
            const string = Main.toSaveString();
            return btoa(string);
        }

        static importGame(string) {
            Main.saveStringToGame(atob(string));
        }

    }

    onmessage = (e) => {
        if(e.data?.type && ColibriWorker.handlers[e.data?.type]) {
            ColibriWorker.handlers[e.data?.type](e.data?.payload);
        }
    };


    ColibriWorker.handlers['initialize'] = (payload) => {
        console.log('[worker] initialized', payload);
        Main.initialize();
        if(payload.save) {
            Main.saveStringToGame(payload.save);
        }
        ColibriWorker.sendToClient(
            'initialized',
            {
                inited: true,
                date: new Date(),
                /*meta: {
                    resources: resourcesData.map(({id, name}) => ({ id, name }))
                }*/
            }
        );
    };

    ColibriWorker.on('get_jobs_tab', () => {
        BasicActions.sendToUI();
    });

    ColibriWorker.on('get_shop_tab', () => {
        ShopItems.sendToUI();
    });

    ColibriWorker.on('get_learning_tab', () => {
        BasicSkills.sendToUI();
    });

    ColibriWorker.on('get_creatures_tab', () => {
        CreatureBasic.sendToUI();
        CreatureJobs.sendToUI();
    });

    ColibriWorker.on('get_banners_tab', () => {
        BasicBanners.sendToUI();
    });

    ColibriWorker.on('get_research_tab', () => {
        BasicResearch.sendToUI();
    });

    ColibriWorker.on('get_battle_tab', () => {
        BasicMap.sendToUI();
        BasicFight.sendToUI();
    });

    ColibriWorker.on('get_heirlooms_tab', () => {
        BasicHeirlooms.sendToUI();
    });

    ColibriWorker.on('get_story_tab', () => {
        BasicStory.sendToUI();
    });

    ColibriWorker.on('get_buildings_tab', () => {
        BasicBuilding.sendToUI();
    });

    ColibriWorker.on('get_temper_data', () => {
        BasicTemper.sendToUI();
    });

    ColibriWorker.on('get_settings_tab', () => {
        BasicSettings.sendToUI();
    });

    ColibriWorker.on('get_statistics_tab', () => {
        BasicStatistics.sendToUI();
    });

    ColibriWorker.on('get_auras_tab', () => {
        BasicAuras.sendToUI();
    });

    ColibriWorker.on('do_action', (id) => {
        BasicActions.performAction(id);
    });

    ColibriWorker.on('automate_action', (id) => {
        BasicActions.setAutomated(id);
    });

    ColibriWorker.on('do_purchase', (id) => {
        console.log('perform purchase', id);
        ShopItems.purchaseItem(id);
    });

    ColibriWorker.on('do_purchase_all', () => {
        console.log('perform purchase all');
        ShopItems.purchaseAllAvailable();
    });

    ColibriWorker.on('set_autopurchase', (flag) => {
        ShopItems.toggleAutopurchase(flag);
    });

    ColibriWorker.on('do_summon', (amount) => {
        console.log('perform summon');
        CreatureBasic.summonCreature(amount);
    });

    ColibriWorker.on('save_preset', ({ isNew, current }) => {
        CreatureJobsPresets.savePreset(isNew, current);
    });

    ColibriWorker.on('use_preset', ({ id }) => {
        CreatureJobs.updatePreset(id);
    });

    ColibriWorker.on('toggle_autodistribute', ({ flag }) => {
        CreatureJobsPresets.setAutoDistribute(flag);
    });

    ColibriWorker.on('re_distribute', () => {
        CreatureJobs.reDistributeJobs();
    });


    ColibriWorker.on('do_prestige', (id) => {
        console.log('perform prestige', id);
        BasicBanners.doPrestige(id);
    });

    ColibriWorker.on('do_convert', ({ id, tierIndex, percentage }) => {
        console.log('perform conversion', { id, tierIndex, percentage });
        BasicBanners.doConvert({ id, tierIndex, percentage });
    });

    ColibriWorker.on('do_revert_banner', id => {
        BasicBanners.revert(id);
    });

    ColibriWorker.on('do_optimize', id => {
        BasicBanners.doOptimizeAll(id);
    });

    ColibriWorker.on('set_automation_option', ({ key, value }) => {
        BasicBanners.setAutomationOption(key, value);
    });

    ColibriWorker.on('do_select_temper', ({ id }) => {
        console.log('selecting temper: ', id);
        BasicTemper.setCurrentTemper(id);
    });

    ColibriWorker.on('change_workers', ({ id, amount, isConfirmed }) => {
        CreatureJobs.updateWorkers({ id, amount, isConfirmed });
    });

    ColibriWorker.on('change_learning_efforts', ({ id, efforts, isConfirmed }) => {
        BasicSkills.setEffortsPercentage({ id, efforts });
    });

    ColibriWorker.on('all_learning_efforts', ({ id, val }) => {
        BasicSkills.setEffortsAll({ id, val });
    });

    ColibriWorker.on('do_research', (id) => {
        console.log('perform research', id);
        BasicResearch.purchaseResearch(id);
    });

    ColibriWorker.on('do_story_shown', () => {
        console.log('do_story_shown');
        BasicStory.makeShown();
    });

    ColibriWorker.on('toggle_battle', () => {
        console.log('toggle_battle');
        BasicMap.switchTurned();
    });


    ColibriWorker.on('toggle_battle_mode', ({ fightMode }) => {
        console.log('toggle_battle_mode', fightMode);
        BasicMap.toggleMode(fightMode);
    });

    ColibriWorker.on('toggle_forward', () => {
        BasicMap.switchForward();
    });

    ColibriWorker.on('set_battle_level', ({ level }) => {
        BasicMap.setLevel(level);
    });

    ColibriWorker.on('move_heirlooms', ({ fromKey, fromIndex, toKey, toIndex }) => {
        BasicHeirlooms.itemToSlot(fromKey, fromIndex, toKey, toIndex);
    });

    ColibriWorker.on('drop_heirloom', ({ fromKey, fromIndex }) => {
        BasicHeirlooms.dropItem(fromKey, fromIndex);
    });

    ColibriWorker.on('charge_heirloom', ({ fromKey, fromIndex, amount }) => {
        BasicHeirlooms.chargeItem(fromKey, fromIndex, amount);
    });

    ColibriWorker.on('set_heirloom_charge_amount', ({ amount }) => {
        BasicHeirlooms.setChargeAmount(amount);
    });

    ColibriWorker.on('re_roll', ({ fromKey, fromIndex, bonusIndex }) => {
        BasicHeirlooms.reRollStat(fromKey, fromIndex, bonusIndex);
    });

    ColibriWorker.on('change_heirloom_mintier', ({ tierId }) => {
        BasicHeirlooms.setMinTier(tierId);
    });

    ColibriWorker.on('set_amount', ({ amount }) => {
        CreatureBasic.setAmount(amount);
    });

    ColibriWorker.on('export_game', ({ cb }) => {
        const exportData = Main.getExportString();
        ColibriWorker.sendToClient(cb, exportData);
    });

    ColibriWorker.on('import_game', (data) => {
        Main.importGame(data);
    });

    ColibriWorker.on('change_setting', ({path, value}) => {
        BasicSettings.updateSetting(path, value);
    });

    ColibriWorker.on('do_build', ({ id }) => {
        BasicBuilding.startBuilding(id);
    });

    ColibriWorker.on('do_build_1s', ({ id }) => {
        BasicBuilding.startBuildingUntil1Second(id);
    });

    ColibriWorker.on('cancel_build', ({ index }) => {
        BasicBuilding.cancelBuilding(index);
    });

    ColibriWorker.on('embed_memory', ({ id }) => {
        BasicBuilding.embedStones(id);
    });

    ColibriWorker.on('toggle_aura', ({ index }) => {
        BasicAuras.toggleActivate(index);
    });

    ColibriWorker.on('drop_aura', ({ index }) => {
        BasicAuras.dropAura(index);
    });


    ColibriWorker.on('charge_aura', ({ index, amount }) => {
        BasicAuras.chargeItem(index, amount);
    });

    ColibriWorker.on('set_aura_charge_amount', ({ amount }) => {
        BasicAuras.setChargeAmount(amount);
    });

    ColibriWorker.on('change_aura_effort', ({ index, effort }) => {
        BasicAuras.setEffort(index, effort);
    });

    ColibriWorker.on('change_aura_mintier', ({ tierId }) => {
        BasicAuras.setMinTier(tierId);
    });

    ColibriWorker.on('change_aura_minquality', ({ quality }) => {
        BasicAuras.setMinQuality(quality);
    });


    ColibriWorker.on('save_aura_preset', ({ isNew, current }) => {
        AurasPresets.savePreset(isNew, current);
    });

    ColibriWorker.on('use_aura_preset', ({ id }) => {
        BasicAuras.updatePreset(id);
    });

}));
