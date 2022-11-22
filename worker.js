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

    const shopData = [{
        id: 'notebook',
        name: 'Notebook',
        type: 'book',
        description: 'A book for storing notes and goals. Adds 1 automation slot.',
        isUnlocked: () => true,
        getCost: () => ({
            gold: 10,
        }),
    },{
        id: 'manual',
        name: 'Labor Manual',
        type: 'book',
        description: 'A manual that provides some techniques on effective laboring. Work at Stable action is now twice as costly but twice as effective also.',
        isUnlocked: () => true,
        getCost: () => ({
            gold: 10,
        }),
    },{
        id: 'gymnastics',
        name: 'Gymnastic\'s manual',
        type: 'book',
        description: 'A manual that provides some techniques for general exercising. Train stamina is now twice as efficient.',
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
        description: 'Unlocks mana end some basic spells',
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
    },{
        id: 'stash',
        name: 'Stash',
        type: 'trinket',
        description: 'Increase place for gold by 200',
        isUnlocked: () => resourcesData.find(one => one.id === 'gold').getMax() > 150,
        getCost: () => ({
            gold: 300
        }),
    },{
        id: 'summoning',
        name: 'Basic summoning',
        type: 'book',
        description: 'Purchase basic sumonning manual',
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
    },{
        id: 'herbalism',
        name: 'Herbalism',
        type: 'book',
        description: 'Purchase herbalism book to take advantages of flasks',
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
    },{
        id: 'appretienceManual',
        name: 'Manual of appretience',
        type: 'book',
        description: 'Enpower all your spells by 50%',
        isUnlocked: () => ShopItems.purchased.soulHarvester,
        getCost: () => ({
            gold: 2000
        }),
    },{
        id: 'summoningJobs',
        name: 'Summoning Jobs',
        type: 'book',
        description: 'Purchase summoning jobs knowledge book to increase job efficiency. +10% creature productions',
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
            }

            return BasicSettings.settings;
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

        static initialize() {
            BasicSkills.skills = {};
        }

        static skillLevel(id) {
            return BasicSkills.skills[id] ? BasicSkills.skills[id].level : 0;
        }

        static getBalanceById(resourceId, learning) {
            let bal = 0;
            if(resourceId === 'energy') {
                const list = learning ? Object.values(learning || {}) : BasicSkills.getList();
                list.forEach(item => {
                    if (!item.efforts) {
                        return;
                    }
                    bal -= +item.efforts;
                });
            }
            return bal;
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
                for(let key in BasicSkills.skills) {
                    BasicSkills.skills[key].efforts = val;
                }
            } else {
                BasicSkills.skills[id].efforts = val;
            }
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
            list.forEach(item => {
                if(!item.efforts) {
                    return;
                }

                const hasEnough = BasicResources.checkResourcesAvailable({ energy: item.efforts });
                if(hasEnough.totalPercentage >= dT) {
                    BasicSkills.skills[item.id].xp += item.efforts * dT * (1 + 0.5 * BasicResearch.getResearchLevel('selfDevelopment'));
                    if(item.maxXp <= BasicSkills.skills[item.id].xp) {
                        BasicSkills.skills[item.id].xp = 0;
                        BasicSkills.skills[item.id].level++;
                    }

                    BasicResources.subtractBatch({ energy: item.efforts * dT });
                }
            });
        }

        static sendToUI() {
            const list = BasicSkills.getList();
            ColibriWorker.sendToClient('set_skills_state', list);
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
                }
            });
            return {
                free,
                jobs
            }
        }

        static getBalanceById(resourceId, updatedWorkers = null) {
            let bal = 0;
            if(!updatedWorkers) {
                updatedWorkers = CreatureJobs.workers;
            }
            Object.entries(updatedWorkers).forEach(([jobId, state]) => {
                const jobData = jobsData.find(one => one.id === jobId);
                const gain = jobData.getGain(state.current);
                const cost = jobData.getCost(state.current);
                if(gain && gain[resourceId]) {
                    bal += gain[resourceId];
                }
                if(cost && cost[resourceId]) {
                    bal -= cost[resourceId];
                }
            });
            return bal;
        }

        static process(dT) {
            CreatureJobs.getFreeWorkers();
            Object.entries(CreatureJobs.workers).forEach(([jobId, state]) => {
                const jobData = jobsData.find(one => one.id === jobId);
                const potCost = jobData.getCost(state.current);
                const hasEnough = BasicResources.checkResourcesAvailable(potCost);
                if(hasEnough.totalPercentage < dT && CreatureJobs.workers[jobId].current > 0) { // won't be able to afford, skip
                    CreatureJobs.workers[jobId].skip = true;
                    if(jobData.isUnstable) {
                        CreatureJobs.workers[jobId].current = Math.max(0, CreatureJobs.workers[jobId].current - 1);
                        CreatureBasic.numCreatures--;
                    }
                } else {
                    CreatureJobs.workers[jobId].skip = false;
                    CreatureJobs.workers[jobId].prodThisTick = BasicResources.multBatch(jobData.getGain(state.current), dT);
                    CreatureJobs.workers[jobId].consThisTick = BasicResources.multBatch(jobData.getCost(state.current), dT);

                    BasicResources.addBatch(CreatureJobs.workers[jobId].prodThisTick);
                    BasicResources.subtractBatch(CreatureJobs.workers[jobId].consThisTick);
                }

            });
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
            wood: 10 * Math.pow(2, level),
            stone: 20 * Math.pow(2, level),
        }),
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
            wood: 20 * Math.pow(2, level),
            stone: 20 * Math.pow(2, level),
        }),
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
            wood: 40 * Math.pow(2, level),
            stone: 20 * Math.pow(2, level),
        }),
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
            wood: 40 * Math.pow(2, level),
            stone: 20 * Math.pow(2, level),
        }),
        category: 'Economy',
    }, {
        id: 'monument',
        name: 'Monument of Yourself',
        description: 'Each level increase banners gain on prestige by 10%',
        getConstructionAmount: (level) => 4000 * Math.pow(2, level),
        getTerritoryAmount: (level) => 0.2 * Math.pow(2, level) * buildingCostModifier('territory'),
        isUnlocked: () => BasicBuilding.getBuildingLevel('palace') > 3,
        getCost: (level) => ({
            gold: 1.e+5 * Math.pow(2, level) * buildingCostModifier('gold'),
            stone: 100 * Math.pow(2, level),
        }),
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
            wood: 1200 * Math.pow(2, level),
            stone: 360 * Math.pow(2, level),
        }),
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
            wood: 400 * Math.pow(2, level),
            stone: 200 * Math.pow(2, level),
        }),
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
            wood: 400 * Math.pow(2, level),
            stone: 3200 * Math.pow(2, level),
            ore: 800 * Math.pow(2, level),
        }),
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
            wood: 400 * Math.pow(4, level),
            stone: 20000 * Math.pow(4, level),
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
            ore: 4000 * Math.pow(4, level),
            stone: 20000 * Math.pow(4, level),
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
            wood: 40000 * Math.pow(4, level),
            stone: 20000 * Math.pow(4, level),
        }),
        category: 'Megastructure',
    }];

    const fmtVal = (val) => {
        if(val == null) return '0';
        if(!val) return '0';
        const sign = Math.sign(val);
        const abs = Math.abs(val);
        const orders = Math.log10(abs);
        if(orders < 0) {
            return `${sign < 0 ? '-' : ''}${abs.toFixed(2)}`;
        }
        const suffixId = Math.floor(orders / 3);
        const mpart = (abs / (Math.pow(1000, suffixId))).toFixed(2);
        let suffix = '';
        switch (suffixId) {
            case 1:
                suffix = 'K';
                break;
            case 2:
                suffix = 'M';
                break;
            case 3:
                suffix = 'B';
                break;
            case 4:
                suffix = 'T';
                break;
            case 5:
                suffix = 'Qa';
                break;
            case 6:
                suffix = 'Qi';
                break;
            case 7:
                suffix = 'Sx';
                break;
            case 8:
                suffix = 'Sp';
                break;
            case 9:
                suffix = 'Oc';
                break;
            case 10:
                suffix = 'No';
                break;
            case 11:
                suffix = 'Dc';
                break;
        }
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

    class BasicHeirlooms {

        static state = {
            applied: [],
            saved: [],
            inventory: [],
        }

        static initialize(isBannerPrestige) {
            if(!BasicHeirlooms.state || !isBannerPrestige) {
                BasicHeirlooms.state = {
                    applied: [null, null],
                    saved: [null],
                    inventory: [],
                };
            }
            BasicHeirlooms.state.inventory = Array.from({ length: 10 });
            return BasicHeirlooms.state;
        }

        static haveItems(arr) {
            return arr.filter(one => one != null).length > 0
        }

        static getMaxSaved() {
            return 1;
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
                    total += ef.amount;
                }
            });
            return total;
        }

        static giveToPlayer(heirloom) {
            const fInd = BasicHeirlooms.state.inventory.findIndex(one => one == null);
            if(fInd > -1) {
                BasicHeirlooms.state.inventory[fInd] = heirloom;
            }
        }

        static dropItem(fromKey, fromIndex) {
            if(!BasicHeirlooms.state[fromKey][fromIndex]) {
                return;
            }
            BasicHeirlooms.state[fromKey][fromIndex] = null;
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

        static sendToUI() {
            ColibriWorker.sendToClient('set_heirlooms_state', {
                ...BasicHeirlooms.state,
            });
        }

        static heirloomsUnlocked() {
            return BasicHeirlooms.haveItems(BasicHeirlooms.state.inventory)
                || BasicHeirlooms.haveItems(BasicHeirlooms.state.saved)
                || BasicHeirlooms.haveItems(BasicHeirlooms.state.applied)
        }

    }

    class BasicBuilding {

        static buildings = {};

        static buildingQueue = [];

        static usedLand = null;

        static initialize(isFromPrestige) {
            if(isFromPrestige && BasicBuilding.buildings) {
                Object.keys(BasicBuilding.buildings).forEach(id => {
                    const data = buildingData.find(one => one.id === id);
                    if(data.category !== 'Megastructure') {
                        delete BasicBuilding.buildings[id];
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
                * (1 + BasicHeirlooms.getTotalBonus('creation'));    }

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

        static listAvailable() {

            const findsInQueue = {};

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
                }
            });

            return {
                list,
                queue,
                maxQueue: BasicBuilding.getMaxQueue(),
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

            if(!firstInQueue.isPurchased) {
                const cost = data.getCost(BasicBuilding.buildings[firstInQueue.id].level);
                const availability = BasicResources.checkResourcesAvailable(cost);
                if(!availability.isAvailable && BasicBuilding.checkEnoughtTerritory(firstInQueue.id, BasicBuilding.buildings[firstInQueue.id].level)) {
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
            data.onStartRun();
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

    const getSpellMultiplier = () => {
        return BasicBanners.getBonus('green')
            * (1 + 0.25 * BasicResearch.getResearchLevel('spellMaster'))
            * (1 + 0.25*(ShopItems.purchased.magicStamp ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.appretienceManual ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.advancedMagic ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.advancedMagic2 ? 1 : 0))
            * (1 + 0.5*(ShopItems.purchased.advancedMagic3 ? 1 : 0))
            * Math.pow(1.01, BasicSkills.skillLevel('magic'))
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
            return mlt * (1 + 0.1 * BasicBuilding.getBuildingLevel('palace')) * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('bank')
            );
        }
        if(id === 'energy') {
            let mlt = 1;
            if(BasicTemper.getCurrentTemper() === 'energetic') {
                mlt = 1.2;
            }
            return mlt;
        }
        if(id === 'mana') {
            let mlt = 1;
            if(BasicTemper.getCurrentTemper() === 'spiritual') {
                mlt = 1.2;
            }
            return mlt;
        }
        if(id === 'souls') {
            return (1 + 0.2 * BasicBuilding.getBuildingLevel('graveyard'))
            * (1 + BasicHeirlooms.getTotalBonus('soulharvest'));
        }
        if(id === 'research') {
            let mlt = 1 + 0.2 * BasicResearch.getResearchLevel('darkExperiments');
            if(BasicTemper.getCurrentTemper() === 'wise') {
                mlt = 1.2;
            }
            mlt *= 1 + 0.25 * BasicBuilding.getBuildingLevel('greatLibrary');
            return mlt * (1 + (0.2 + 0.05 * BasicResearch.getResearchLevel('darkExperiments'))
                * BasicBuilding.getBuildingLevel('academy'))
        }
        if(id === 'ore') {
            let mlt = 1 + 0.1 * BasicBuilding.getBuildingLevel('mine');

            mlt *= 1 + 0.1 * BasicResearch.getResearchLevel('oreMining');

            return mlt;
        }
        if(id === 'tools') {
            let mlt = 1 + 0.1 * BasicBuilding.getBuildingLevel('forge');

            return mlt;
        }
        if(id === 'weapons') {
            let mlt = 1 + 0.1 * BasicBuilding.getBuildingLevel('forge');

            return mlt;
        }
        return 1.0;
    };

    const buildingCostModifier = (type) => {
        let mlt = 1.;
        if(type === 'territory' || type === 'gold') {
            mlt *= Math.pow(0.9, BasicResearch.getResearchLevel('cityPlanning'));
        }
        return mlt;
    };

    const territotyPerZone = (index) => 0.03*Math.pow(1.3, index)
        * (1 + 0.2 * BasicBuilding.getBuildingLevel('watchTower'))
        * (1 + BasicHeirlooms.getTotalBonus('expansion'));

    const globalMult = () => (1 + (ShopItems.purchased.summoningJobs ? 0.1 : 0))*BasicResources.getFlasksEffect()
        *BasicResources.getToolsEffect()
        * (1 + 0.2 * BasicResearch.getResearchLevel('motivation'));

    const jobsData = [{
        id: 'supporter',
        name: 'Supporter',
        description: 'Gathers energy',
        isUnlocked: () => true,
        getCost: (amount) => ({
            gold: 0.5*amount,
        }),
        getGain: (amount) => ({
            energy: 7 * amount * globalMult() * BasicBanners.getBonus('orange'),
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
        getDescription: () => `Improves fighter stats by ${fmtVal(20 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics')))}%`,
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
        description: 'Converts ore and wood to make tools.',
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
    }];

    class CreatureBasic {

        static numCreatures = 0;

        static settings = {};

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
            ));
            sls = (mult * Math.pow(base,CreatureBasic.numCreatures)*(Math.pow(base, amt) - 1))/(base-1);

            return {
                souls: sls,
            }
        }

        static getMaxSummonable() {
            const souls = BasicResources.resources.souls || 0;

            let base = (1.0 + 0.075 * Math.pow(0.95,
                BasicResearch.getResearchLevel('necromancery')
                + BasicResearch.getResearchLevel('summoner')));

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
                ...CreatureBasic.settings,
                consumptionPerCreature: CreatureBasic.getConsumptionPerCreature(),
                max: CreatureBasic.getMaxCreatures(),
            }
        }

        static summonCreature(quantity) {
            let amt = CreatureBasic.settings.amount;
            if(!amt) {
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
            }
        }

        static setAmount(amount) {
            if (!amount) {
                amount = 1;
            }
            if(amount > 10000) {
                amount = 10000;
            }
            CreatureBasic.settings.amount = Math.max(Math.round(amount), 1);
        }

        static process(dT) {
            if(CreatureBasic.numCreatures < 0) {
                CreatureBasic.numCreatures = 0;
            }
            BasicResources.subtract('energy', CreatureBasic.getEnergyConsumption()
                * dT);
            if(BasicResources.resources.energy <= 0 && CreatureBasic.numCreatures > 0) {
                const loss = Math.max(1, Math.round(0.1*CreatureBasic.numCreatures));
                CreatureBasic.numCreatures -= loss;
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

        static fillDefaultTiers() {
            return Array.from({length: 6}).map((one, index) => ({
                amount: 0,
            }))
        }

        static getBannersOnPrestige = () => {
            return CreatureBasic.numCreatures * (1 + 0.1 * BasicBuilding.getBuildingLevel('monument'));
        }

        static initialize() {
            BasicBanners.banners = {
                orange: BasicBanners.fillDefaultTiers(),
                yellow: BasicBanners.fillDefaultTiers(),
                blue: BasicBanners.fillDefaultTiers(),
                green: BasicBanners.fillDefaultTiers()
            };
            return BasicBanners.banners;
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
                    console.log('changed: ', id, index);
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

        static getBonus(id) {
            let effectCumulative = 1.0;
            if(!BasicBanners.banners[id]) {
                return effectCumulative;
            }
            let pEff = 1;
            Array.from({length: 6}).forEach((one, tierIndex) => {
                const current = BasicBanners.banners[id][5 - tierIndex];

                const thisEffect = 8.03 * Math.pow(current.amount || 0, 0.5 + 0.01 * BasicResearch.getResearchLevel('bannersMasterity'));
                effectCumulative = 1+0.01*thisEffect*pEff;

                pEff = effectCumulative;
            });
            return effectCumulative;
        }

        static getList() {
            const result = bannersData.map(bannerInfo => {

                const tiers = [];

                let effectCumulative = 1.0;

                if(!BasicBanners.banners[bannerInfo.id]) {
                    BasicBanners.banners[bannerInfo.id] = BasicBanners.fillDefaultTiers();
                }

                let pEff = 1;

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
                        const thisEffect = 8.03 * Math.pow(current.amount, 0.5 + 0.01 * BasicResearch.getResearchLevel('bannersMasterity'));
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
                        pEff = effectCumulative;
                    }
                });

                return {
                    id: bannerInfo.id,
                    name: bannerInfo.name,
                    description: bannerInfo.description,
                    color: bannerInfo.color,
                    isUnlocked: bannerInfo.isUnlocked(),
                    isChanged: BasicBanners.isChanged(bannerInfo.id),
                    tiers,
                }
            });
            return result;
        }

        static doPrestige(id) {
            if(CreatureBasic.numCreatures < 51) {
                return;
            }
            const amount = BasicBanners.getBannersOnPrestige();
            if(!BasicBanners.banners[id]) {
                BasicBanners.banners[id] = BasicBanners.fillDefaultTiers();
            }
            BasicBanners.banners[id][0].amount += amount;
            BasicBanners.saveBannersToPrev();
            BasicRun.initialize(true);
            BasicTemper.state.currentId = 'select';
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
            ColibriWorker.sendToClient('set_banners_state', result);
        }


    }

    class FightParties {

        static getWeaponsEffect() {
            return 1 + 0.045*Math.pow((BasicResources.resources.weapons || 0), 0.5)
        }

        static generateMy() {
            let hpBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');
            hpBonus *= (1 + BasicHeirlooms.getTotalBonus('resilience'));
            let dmgBonus = 1 + 0.25*BasicResearch.getResearchLevel('fighting');
            dmgBonus *= Math.pow(1.1, BasicBuilding.getBuildingLevel('zeusStatue'));
            dmgBonus *= (1 + BasicHeirlooms.getTotalBonus('agression'));
            const qt = CreatureJobs.getWorkerAmount('fighter');
            let totMult = 1.0;
            if(BasicTemper.getCurrentTemper() === 'aggressive') {
                totMult *= 1.1;
            }
            if(CreatureJobs.getWorkerAmount('sergeant') > 0) {
                totMult *= 1 + CreatureJobs.getWorkerAmount('sergeant') * 0.2 * (1 + 0.1 * BasicResearch.getResearchLevel('combatTactics'));
            }

            totMult *= FightParties.getWeaponsEffect();

            return {
                name: 'Warriors',
                damage: 2 * dmgBonus * totMult,
                maxHP: 5 * hpBonus * totMult,
                defense: BasicBuilding.getBuildingLevel('trainingCamp') * totMult,
                quantity: qt,
            }
        }

        static generateEnemy(level, cell) {
            return {
                quantity: Math.round(3 + Math.random()*2),
                damage: 0.5*Math.pow(1.5, level + cell/100),
                maxHP: 2 * Math.pow(1.5, level + cell/100),
                defense: level < 11 ? 0 : 1 * Math.pow(1.5, level - 10),
                name: 'Enemy Mock'
            }
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

        static start(level, cell) {
            BasicFight.atckCooldown = BasicFight.getAtckCooldown();
            BasicFight.isInProgress = true;
            BasicFight.isLost = false;
            BasicFight.isWon = false;
            BasicFight.parties = {
                me: BasicFight.prepareToFight(FightParties.generateMy()),
                enemy: BasicFight.prepareToFight(FightParties.generateEnemy(level, cell)),
            };

        }

        static prepareToFight(side) {
            return {
                ...side,
                realHP: side.maxHP * side.quantity,
                maxRealHP: side.maxHP * side.quantity,
            }
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

                // attacking
                BasicFight.parties.me.realHP -= Math.max(0, BasicFight.parties.enemy.damage - BasicFight.parties.me.defense)
                    * BasicFight.parties.enemy.quantity;

                BasicFight.parties.me.quantity = Math.ceil(BasicFight.parties.me.realHP / BasicFight.parties.me.maxHP);

                // defending
                BasicFight.parties.enemy.realHP -= Math.max(0, BasicFight.parties.me.damage - BasicFight.parties.enemy.defense)
                    * BasicFight.parties.me.quantity;

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
    }];

    class HeirloomGenerator {

        static generateHeirloomStats(level, tier) {
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
                    text: effect.getText(eff)
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

        static generateHeirloom(level, tier) {
            const bonuses = HeirloomGenerator.generateHeirloomStats(level, tier);
            const name = `${HeirloomGenerator.generatePreffix(tier)} talisman of ${HeirloomGenerator.generateSuffix(bonuses)}`;
            return {
                level,
                tier,
                name,
                bonuses
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

    }

    class BasicMap {

        static state = {
            level: 0,
            cell: 0,
            isForward: true,
            isTurnedOn: false,
            zonesAmounts: {},
            maxLevel: 0,
        }

        static initialize() {
            BasicMap.state = {
                level: 0,
                cell: 0,
                isForward: true,
                isTurnedOn: false,
                zonesAmounts: {},
                maxLevel: 5 * BasicBuilding.getBuildingLevel('zeusStatue'),
            };
            return BasicMap.state;
        }

        static switchTurned() {
            BasicMap.state.isTurnedOn = !BasicMap.state.isTurnedOn;
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
            if(BasicMap.state.isTurnedOn) {
                if(!BasicFight.isInProgress) {
                    // start fight
                    BasicFight.start(BasicMap.state.level, BasicMap.state.cell);
                }
                BasicFight.process(dT);
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
                            console.log('AWARDED HEIRLOOM: ', hr);
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
                    BasicMap.startZone();
                }
            }
        }

        static sendToUI() {
            if(!BasicMap.state.level) {
                BasicMap.state.level = 0;
            }
            ColibriWorker.sendToClient('set_map_state', {
                ...BasicMap.state,
                isFightAvailable: CreatureJobs.getWorkerAmount('fighter') > 0,
                territoryPerMap: territotyPerZone(BasicMap.state.level)
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
    },{
        id: 'bannersMasterity',
        name: 'Banners Masterity',
        description: 'Improves your banners effect exponenta over amount by 0.01',
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
        description: 'Unlocks fighting. Each level increase your creatures HP and attack by 25%. Levels 2 and 6 unlock new researches',
        isUnlocked: () => BasicResearch.getTotal('necromancery') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 10000*Math.pow(3, level),
        }),
    },{
        id: 'building',
        name: 'Building',
        description: 'Unlocks building. Each level increase builder efficiency by 20%. Level 5 unlocks new banner.',
        isUnlocked: () => BasicResearch.getTotal('fighting') > 0 && BasicMap.state.zonesAmounts[0] > 0,
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
        description: 'Unlocks auto-purchase for items you have ever purchased over previous resets.',
        isUnlocked: () => BasicResearch.getTotal('economy') > 9,
        maxLevel: 1,
        getCost: (level) => ({
            research: 500000*Math.pow(3, level),
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
        description: 'Unlocks hiring sergeant. Each level increase sergeant bonus by 10%',
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
    },{
        id: 'looting',
        name: 'Looting',
        description: 'Increase fighting loot by 25%.',
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
        id: 'urbanism',
        name: 'Urbanism',
        description: 'Each level add +1 building queue slot',
        isUnlocked: () => BasicResearch.getTotal('cityPlanning') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    },{
        id: 'architecture',
        name: 'Architecture',
        description: 'Allows you building mega structures that persists through resets',
        isUnlocked: () => BasicResearch.getTotal('building') > 6,
        maxLevel: 1,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    },{
        id: 'oreMining',
        name: 'Ore Mining',
        description: 'Unlock ore mining and refining. Each level improve mining efficiency by 10%',
        isUnlocked: () => BasicResearch.getTotal('motivation') > 2,
        maxLevel: 0,
        getCost: (level) => ({
            research: 1.e+10*Math.pow(3, level),
        }),
    }];

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

    const storyData = [{
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
        requirementDesc: 'Perform physical training 30 times, and get 5 levels in initiative and perseverance (learning tab)',
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
        note: 'You can check shop anytime for any useful stuff that might help you to earn money. Also, keep do physical training. You\'ll need a lot energy in future'
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
        requirementDesc: 'Perform Energy Orb spell 10 times, physical training 75 times. Purchase magic stamp.',
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
            const displayedStories = storyData
                .filter((one, index) => index <= BasicStory.story.stepId);

            return displayedStories.reverse();
        }

        static getCurrentToShow() {
            const stories = storyData;
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
                const stories = storyData;
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
            ) * BasicBanners.getBonus('green'),
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
            ) * BasicBanners.getBonus('green'),
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

        static init() {
            BasicActions.actions = {};
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
                };
                const cost = BasicResources.checkResourcesAvailable(action.getCost());
                return {
                    id: action.id,
                    name: action.name,
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

        static getBalanceById(resourceId) {
            let bal = 0;
            Object.entries(BasicActions.actions).forEach(([id, data]) => {
                if(!data.isAutomated) return;
                const action = actionsData.find(one => one.id === id);
                const cost = action.getCost();
                const profit = action.getGain();
                if(profit && profit[resourceId]) {
                    bal += profit[resourceId] * BasicActions.getActionsEfficiency() / action.getCooldown();
                }
                if(cost && cost[resourceId]) {
                    bal -= cost[resourceId] * BasicActions.getActionsEfficiency() / action.getCooldown();
                }
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
            };
            if(available.isAvailable && currState.cooldown <= 0) {
                BasicResources.subtractBatch(cost);
                BasicResources.addBatch(data.getGain());
                if(!BasicActions.actions[id]) {
                    BasicActions.actions[id] = {
                        performed: 0,
                        cooldown: 0,
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
                };
            }
            if(BasicActions.actions[id].isAutomated) {
                BasicActions.actions[id].isAutomated = false;
            } else {
                const maxAutomations = 1 + (ShopItems.purchased.timeManagement ? 1 : 0)
                    + (ShopItems.purchased.bookOfMultitasking ? 2 : 0);
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
            for(const key in BasicActions.actions) {
                BasicActions.actions[key].cooldown -= dT * (!!BasicActions.actions[key].isAutomated ? BasicActions.getActionsEfficiency() : 1);
                if(BasicActions.actions[key].cooldown < 0) {
                    BasicActions.actions[key].cooldown = 0;
                }

                if(BasicActions.actions[key].isAutomated) {
                    const action = actionsData.find(one => one.id === key);
                    const cost = BasicResources.checkResourcesAvailable(action.getCost());
                    if(BasicActions.actions[key].cooldown <= 0 && cost.isAvailable) {
                        BasicActions.performAction(key);
                    }
                }
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
                + 200 * (ShopItems.purchased.stash || 0)) * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('palace')
            ) * (
                1 + 0.1 * BasicBuilding.getBuildingLevel('bank')
            ) * (
                1 + 0.2 * BasicResearch.getResearchLevel('banking')
            );
            if(BasicTemper.getCurrentTemper() === 'saving') {
                amt = amt * 1.25 + 50;
            }
            amt *= (1 + BasicHeirlooms.getTotalBonus('saving'));
            return amt;
        },
        getIncome: () => Math.pow(BasicResearch.getResearchLevel('economy'), 1.5),
        getAggregatedIncome: () => {
        }
    },{
        id: 'energy',
        name: 'Energy',
        isUnlocked: () => true,
        getMax: () => {
            let amt = 10 + getEnergyOrbEffect()
            * (BasicActions.actions.energyOrb?.performed || 0) + 5 * BasicResearch.getResearchLevel('energizer');
            if(BasicTemper.getCurrentTemper() === 'energetic') {
                amt = amt * 1.25 + 20;
            }
            amt *= (1 + BasicHeirlooms.getTotalBonus('energy'));
            return amt;
        },
        getIncome: () =>
            (0.02 + (ShopItems.purchased.gymnastics ? 0.02 : 0) + (ShopItems.purchased.equipment ? 0.04 : 0))
            * (BasicActions.actions.physicalTraining?.performed || 0) * BasicBanners.getBonus('green')
            * Math.pow(1.01, BasicSkills.skillLevel('perseverance'))
            + 0.5 * Math.pow(BasicResearch.getResearchLevel('energizer'),1.5)
    },{
        id: 'mana',
        name: 'Mana',
        isUnlocked: () => !!ShopItems.purchased.bookOfMagic,
        getMax: () => {
            let amt = 10 + 10 * (ShopItems.purchased.magicStamp || 0)
            + 4*(BasicActions.actions.magicLessons?.performed || 0)
            * (1 + 0.2 * BasicResearch.getResearchLevel('tireless'))
            * BasicBanners.getBonus('green');
            if(BasicTemper.getCurrentTemper() === 'spiritual') {
                amt = 1.25*amt + 10;
            }
            amt *= (1 + BasicHeirlooms.getTotalBonus('magic'));
            return amt;
        },
        getIncome: () => 0,
    },{
        id: 'souls',
        name: 'Souls',
        isUnlocked: () => !!ShopItems.purchased.summoning,
        getMax: () => 0,
        getIncome: () => 0,
    },{
        id: 'herbs',
        name: 'Herbs',
        isUnlocked: () => !!ShopItems.purchased.herbalism,
        getMax: () => 10 + (ShopItems.purchased.herbalistsStash ? 20 : 0),
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
        getMax: () => 10 * BasicBuilding.getBuildingLevel('warehouse') * (
            1 + 0.2 * BasicResearch.getResearchLevel('logistics')
        ) * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0)),
        getIncome: () => 0,
    },{
        id: 'stone',
        name: 'Stone',
        isUnlocked: () => BasicBuilding.getBuildingLevel('warehouse') > 0,
        getMax: () => 10 * BasicBuilding.getBuildingLevel('warehouse') * (
            1 + 0.2 * BasicResearch.getResearchLevel('logistics')
        ) * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0)),
        getIncome: () => 0,
    },{
        id: 'ore',
        name: 'Ore',
        isUnlocked: () => BasicBuilding.getBuildingLevel('mine') > 0,
        getMax: () => 2 * BasicBuilding.getBuildingLevel('warehouse') * (
            1 + 0.2 * BasicResearch.getResearchLevel('logistics')
        ) * (1 + getPackingEffect() * (BasicActions.actions.packingSpell?.performed || 0)),
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

        static resourcesMax = {};

        static getFlasksEffect() {
            return 1 + 0.045*Math.pow((BasicResources.resources.flasks || 0), 0.5)
        }

        static getToolsEffect() {
            return 1 + 0.015*Math.pow((BasicResources.resources.tools || 0), 0.4)
        }

        static initialize() {
            BasicResources.resources = {};
        }

        static add(key, amount) {
            if(!BasicResources.resources[key]) {
                BasicResources.resources[key] = 0;
            }
            BasicResources.resources[key] += amount;
        }

        static subtract(key, amount) {
            if(!BasicResources.resources[key]) {
                BasicResources.resources[key] = 0;
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
                return BasicResources.resources[id];
            }
            return Math.min(BasicResources.resources[id], BasicResources.resourcesMax[id]);
        }

        static getBalance(one, newState = {}) {
            return one.getIncome()
            + CreatureBasic.getBalanceById(one.id)
            + CreatureJobs.getBalanceById(one.id, newState?.creatureJobs)
            + BasicSkills.getBalanceById(one.id, newState?.learning)
            + BasicActions.getBalanceById(one.id)
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
                if(one.id === 'flasks') {
                    income = BasicResources.getFlasksEffect();
                    incomeText = `X${fmtVal(income)} boost`;
                } else
                if(one.id === 'tools') {
                    income = BasicResources.getToolsEffect();
                    incomeText = `X${fmtVal(income)} boost`;
                } else
                if(one.id === 'weapons') {
                    income = FightParties.getWeaponsEffect();
                    incomeText = `X${fmtVal(income)} boost`;
                } else {
                    income = BasicResources.getBalance(one);
                    incomeText = fmtVal(income);
                }
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

            // add potential purchased researches to actual ones
            BasicResearch.onPrestige();

            BasicResources.initialize();
            BasicActions.init();
            BasicSkills.initialize();
            ShopItems.initialize(isBannerPrestige);
            CreatureBasic.initialize(isBannerPrestige);
            CreatureJobs.initialize(isBannerPrestige);
            BasicMap.initialize();
            BasicFight.initialize();
            BasicBuilding.initialize(isBannerPrestige);
            BasicHeirlooms.initialize(isBannerPrestige);
            BasicSettings.initialize(isBannerPrestige);


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
            BasicResources.process(dT);
            BasicActions.process(dT);
            CreatureJobs.process(dT);
            CreatureBasic.process(dT);
            BasicSkills.process(dT);
            BasicStory.process();
            BasicFight.process(dT);
            BasicMap.process(dT);
            BasicBuilding.process(dT);
            BasicTemper.process();
            ShopItems.process(dT);

            BasicResources.postProcess(dT);
            BasicRun.timeSpent += dT;
            ColibriWorker.sendToClient('set_general', {
                timeSpent: BasicRun.timeSpent,
                bannersUnlocked: CreatureBasic.numCreatures > 50 || BasicBanners.hasSomeBanners(),
                researchUnlocked: BasicResearch.isResearchUnlocked(),
                battleUnlocked: BasicResearch.getResearchLevel('fighting') > 0,
                buildingUnlocked: BasicResearch.getResearchLevel('building') > 0,
                heirloomsUnlocked: BasicHeirlooms.heirloomsUnlocked(),
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
                resources: BasicResources.resources,
                actions: BasicActions.actions,
                shopItems: ShopItems.purchased,
                shopSettings: ShopItems.settings,
                numCreatures: CreatureBasic.numCreatures || 0,
                creatureJobs: CreatureJobs.workers || {},
                creatureSettings: CreatureBasic.settings || { amount: 1 },
                skills: BasicSkills.skills || {},
                banners: BasicBanners.banners || BasicBanners.initialize(),
                prevBanners: BasicBanners.prevBanners || {},
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

                lastSave: Date.now(),
            };
            console.log('saving: ', saveObject);
            return JSON.stringify(saveObject);
        }

        static saveStringToGame(saveString) {
            const save = JSON.parse(saveString);
            BasicBuilding.usedLand = null;
            BasicResources.resources = save.resources;
            BasicActions.actions = save.actions;
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
            BasicSkills.skills = save.skills || {};
            BasicRun.timeSpent = save.general?.timeSpent || 0;
            BasicBanners.banners = save.banners || BasicBanners.initialize();
            BasicBanners.prevBanners = save.prevBanners;
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
            BasicHeirlooms.state = save.heirlooms || BasicHeirlooms.initialize();
            const now = Date.now();
            if(save.lastSave && now - save.lastSave > 30000) {
                const gain = (now - save.lastSave - 10000) / 1000;
                BasicResources.add('condensedTime', gain);
            }
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

    ColibriWorker.on('do_select_temper', ({ id }) => {
        console.log('selecting temper: ', id);
        BasicTemper.setCurrentTemper(id);
    });

    ColibriWorker.on('change_workers', ({ id, amount, isConfirmed }) => {
        CreatureJobs.updateWorkers({ id, amount, isConfirmed });
    });

    ColibriWorker.on('change_learning_efforts', ({ id, efforts, isConfirmed }) => {
        BasicSkills.setEfforts({ id, efforts, isConfirmed });
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

    ColibriWorker.on('cancel_build', ({ index }) => {
        BasicBuilding.cancelBuilding(index);
    });

}));
