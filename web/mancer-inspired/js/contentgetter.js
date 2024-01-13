class ContentGetter {
    static _cachedData;
    static async _getBase(doCache = true)
    {
        ContentGetter._cachedData = null;
        let data = {};
        let content = [];
        content.push(await ContentGetter._getFromIndex("data/class/"));
        content.push(await ContentGetter._getFromFile("data/races.json"));
        content.push(await ContentGetter._getFromFile("data/backgrounds.json"));
        content.push(await ContentGetter._getFromIndex("data/spells/"));

        for(let entry of content){

            //Get all properties of obj that are arrays
            let allProperties = Object.keys(entry);
            let arrayProperties = allProperties.filter(propertyName => Array.isArray(entry[propertyName]));
            for(let propName of arrayProperties){
                if(!data[propName]){data[propName] = [];} //Create array if none exists
                data[propName] = data[propName].concat(entry[propName]);
            }

            /* data.class = data.class.concat(entry.class);
            data.subclass = data.subclass.concat(entry.subclass);
            data.classFeature = data.classFeature.concat(entry.classFeature);
            data.subclassFeature = data.subclassFeature.concat(entry.subclassFeature);
            data.race = data.race.concat(entry.race);
            data.subrace = data.subrace.concat(entry.subrace);
            data.background = data.background.concat(entry.background); */
        }

        data.class = data.class?.filter(cls => !!cls);
        data.classFeature = data.classFeature?.filter(f => !!f);
        data.race = data.race?.filter(r => !!r);
        data.subrace = data.subrace?.filter(sr => !!sr);
        data.background = data.background?.filter(b => !!b);

        if(doCache){ContentGetter._cachedData = data;}

        return data;
    }
    static async _getFromIndex(urlFolder){
        const index = await HelperFunctions.loadJSONFile(urlFolder + "index.json");
        let resultFiles = [];
        let addresses = [];
        Object.keys(index).forEach((k,v) => {
            const name = index[k]; addresses.push(name);
        });
        for(let a of addresses){
            let path = urlFolder + a;
            let file = await HelperFunctions.loadJSONFile(path);
            if(file){resultFiles.push(file);}
        }

        let merged = {};
        for(let obj of resultFiles){
            //Get all properties of obj that are arrays
            const allProperties = Object.keys(obj);
            const arrayProperties = allProperties.filter(propertyName => Array.isArray(obj[propertyName]));
            for(let propName of arrayProperties){
                if(!merged[propName]){merged[propName] = [];} //Create array if none exists
                merged[propName] = merged[propName].concat(obj[propName]);
            }
        }

        return merged;
    }
    static async _getFromFile(url){
        return await HelperFunctions.loadJSONFile(url);
    }
    /**Grabs JSON information from a file filled with information used in specific circumstances, such as figuring out class feature options (which proficiencies you get to choose between)
     * when you level up as one of the base classes
     */
    static _getFoundryData(){
        const _foundry = `{
            "class": [
                {
                    "name": "Sorcerer",
                    "source": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "sorcery-points",
                                "type": "number",
                                "scale": {
                                    "2": {
                                        "value": 2
                                    },
                                    "3": {
                                        "value": 3
                                    },
                                    "4": {
                                        "value": 4
                                    },
                                    "5": {
                                        "value": 5
                                    },
                                    "6": {
                                        "value": 6
                                    },
                                    "7": {
                                        "value": 7
                                    },
                                    "8": {
                                        "value": 8
                                    },
                                    "9": {
                                        "value": 9
                                    },
                                    "10": {
                                        "value": 10
                                    },
                                    "11": {
                                        "value": 11
                                    },
                                    "12": {
                                        "value": 12
                                    },
                                    "13": {
                                        "value": 13
                                    },
                                    "14": {
                                        "value": 14
                                    },
                                    "15": {
                                        "value": 15
                                    },
                                    "16": {
                                        "value": 16
                                    },
                                    "17": {
                                        "value": 17
                                    },
                                    "18": {
                                        "value": 18
                                    },
                                    "19": {
                                        "value": 19
                                    },
                                    "20": {
                                        "value": 20
                                    }
                                }
                            },
                            "title": "Sorcery Points"
                        }
                    ]
                }
            ],
            "subclass": [
                {
                    "name": "Nature Domain",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "divine-strike",
                                "type": "dice",
                                "scale": {
                                    "8": {
                                        "n": 1,
                                        "die": 8
                                    },
                                    "14": {
                                        "n": 2,
                                        "die": 8
                                    }
                                }
                            },
                            "title": "Divine Strike"
                        }
                    ]
                },
                {
                    "name": "Trickery Domain",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "divine-strike",
                                "type": "dice",
                                "scale": {
                                    "8": {
                                        "n": 1,
                                        "die": 8
                                    },
                                    "14": {
                                        "n": 2,
                                        "die": 8
                                    }
                                }
                            },
                            "title": "Divine Strike"
                        }
                    ]
                },
                {
                    "name": "Death Domain",
                    "source": "DMG",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "divine-strike",
                                "type": "dice",
                                "scale": {
                                    "8": {
                                        "n": 1,
                                        "die": 8
                                    },
                                    "14": {
                                        "n": 2,
                                        "die": 8
                                    }
                                }
                            },
                            "title": "Divine Strike"
                        }
                    ]
                },
                {
                    "name": "College of Whispers",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "psychic-blades",
                                "type": "dice",
                                "scale": {
                                    "3": {
                                        "n": 2,
                                        "die": 6
                                    },
                                    "5": {
                                        "n": 3,
                                        "die": 6
                                    },
                                    "10": {
                                        "n": 5,
                                        "die": 6
                                    },
                                    "15": {
                                        "n": 8,
                                        "die": 6
                                    }
                                }
                            },
                            "title": "Psychic Blades"
                        }
                    ]
                },
                {
                    "name": "Forge Domain",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "divine-strike",
                                "type": "dice",
                                "scale": {
                                    "8": {
                                        "n": 1,
                                        "die": 8
                                    },
                                    "14": {
                                        "n": 2,
                                        "die": 8
                                    }
                                }
                            },
                            "title": "Divine Strike"
                        }
                    ]
                },
                {
                    "name": "Order Domain",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "advancement": [
                        {
                            "type": "ScaleValue",
                            "configuration": {
                                "identifier": "divine-strike",
                                "type": "dice",
                                "scale": {
                                    "8": {
                                        "n": 1,
                                        "die": 8
                                    },
                                    "14": {
                                        "n": 2,
                                        "die": 8
                                    }
                                }
                            },
                            "title": "Divine Strike"
                        }
                    ]
                }
            ],
            "classFeature": [
                {
                    "name": "Unarmored Defense",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 1,
                    "ignoreSrdEffects": true
                },
                {
                    "name": "Primal Knowledge",
                    "source": "TCE",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "animal handling",
                                        "athletics",
                                        "intimidation",
                                        "nature",
                                        "perception",
                                        "survival"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Fast Movement",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 5,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.movement.walk",
                                    "mode": "ADD",
                                    "value": "+ 10"
                                }
                            ]
                        }
                    ],
                    "ignoreSrdEffects": true
                },
                {
                    "name": "Brutal Critical (1 die)",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 9,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.meleeCriticalDamageDice",
                                    "mode": "UPGRADE",
                                    "value": 1
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Brutal Critical (2 dice)",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 13,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.meleeCriticalDamageDice",
                                    "mode": "UPGRADE",
                                    "value": 2
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Brutal Critical (3 dice)",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 17,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.meleeCriticalDamageDice",
                                    "mode": "UPGRADE",
                                    "value": 3
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Primal Champion",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "level": 20,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.abilities.str.value",
                                    "mode": "ADD",
                                    "value": "+ 4"
                                },
                                {
                                    "key": "data.abilities.con.value",
                                    "mode": "ADD",
                                    "value": "+ 4"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Jack of All Trades",
                    "source": "PHB",
                    "className": "Bard",
                    "classSource": "PHB",
                    "level": 2,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.jackOfAllTrades",
                                    "mode": "OVERRIDE",
                                    "value": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Expertise",
                    "source": "PHB",
                    "className": "Bard",
                    "classSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "expertise": [
                            {
                                "anyProficientSkill": 2
                            }
                        ]
                    }
                },
                {
                    "name": "Expertise",
                    "source": "PHB",
                    "className": "Bard",
                    "classSource": "PHB",
                    "level": 10,
                    "entryData": {
                        "expertise": [
                            {
                                "anyProficientSkill": 2
                            }
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Harness Divine Power",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "level": 2,
                    "system": {
                        "uses.per": "day",
                        "uses.value": 1,
                        "uses.max": "1 + min(floor(@classes.cleric.levels / 6), 1) + min(floor(@classes.cleric.levels / 18), 1)"
                    }
                },
                {
                    "name": "Channel Divinity",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "level": 6,
                    "isIgnored": true
                },
                {
                    "name": "Channel Divinity",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "level": 18,
                    "isIgnored": true
                },
                {
                    "name": "Druidic",
                    "source": "PHB",
                    "className": "Druid",
                    "classSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "druidic": true
                            }
                        ]
                    }
                },
                {
                    "name": "Fighting Style",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "level": 1,
                    "isIgnored": true
                },
                {
                    "name": "Martial Arts",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "level": 1,
                    "subEntities": {
                        "item": [
                            {
                                "name": "Unarmed Strike (Monk)",
                                "source": "PHB",
                                "page": 76,
                                "srd": true,
                                "type": "M",
                                "rarity": "none",
                                "weaponCategory": "simple",
                                "entries": [
                                    {
                                        "type": "quote",
                                        "entries": [
                                            "Tether even a roasted chicken."
                                        ],
                                        "by": "Yamamoto Tsunetomo",
                                        "from": "Hagakure Kikigaki"
                                    }
                                ],
                                "foundrySystem": {
                                    "equipped": true,
                                    "damage.parts": [
                                        [
                                            "@scale.monk.die + @mod",
                                            "bludgeoning"
                                        ]
                                    ],
                                    "ability": "dex"
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Unarmored Defense",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "level": 1,
                    "ignoreSrdEffects": true
                },
                {
                    "name": "Unarmored Movement",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "level": 2,
                    "effects": [
                        {
                            "name": "Unarmored Movement",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.movement.walk",
                                    "mode": "ADD",
                                    "value": "+ (sign(@attributes.movement.walk) * @scale.monk.unarmored-movement)"
                                },
                                {
                                    "key": "data.attributes.movement.burrow",
                                    "mode": "ADD",
                                    "value": "+ (sign(@attributes.movement.burrow) * @scale.monk.unarmored-movement)"
                                },
                                {
                                    "key": "data.attributes.movement.climb",
                                    "mode": "ADD",
                                    "value": "+ (sign(@attributes.movement.climb) * @scale.monk.unarmored-movement)"
                                },
                                {
                                    "key": "data.attributes.movement.fly",
                                    "mode": "ADD",
                                    "value": "+ (sign(@attributes.movement.fly) * @scale.monk.unarmored-movement)"
                                },
                                {
                                    "key": "data.attributes.movement.swim",
                                    "mode": "ADD",
                                    "value": "+ (sign(@attributes.movement.swim) * @scale.monk.unarmored-movement)"
                                }
                            ]
                        }
                    ],
                    "ignoreSrdEffects": true
                },
                {
                    "name": "Diamond Soul",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "level": 14,
                    "effects": [
                        {
                            "changes": [
                                {
                                    "key": "flags.dnd5e.diamondSoul",
                                    "mode": "OVERRIDE",
                                    "value": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Fighting Style",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "level": 2,
                    "isIgnored": true
                },
                {
                    "name": "Divine Health",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "level": 3,
                    "effects": [
                        {
                            "name": "Disease Immunity",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.traits.ci.value",
                                    "mode": "ADD",
                                    "value": "diseased"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Deft Explorer",
                    "source": "TCE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "any": 2
                            }
                        ],
                        "expertise": [
                            {
                                "anyProficientSkill": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Fighting Style",
                    "source": "PHB",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "level": 2,
                    "isIgnored": true
                },
                {
                    "name": "Expertise",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "expertise": [
                            {
                                "anyProficientSkill": 2
                            },
                            {
                                "anyProficientSkill": 1,
                                "thieves' tools": true
                            }
                        ]
                    }
                },
                {
                    "name": "Thieves' Cant",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "thieves' cant": true
                            }
                        ]
                    }
                },
                {
                    "name": "Expertise",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "level": 6,
                    "entryData": {
                        "expertise": [
                            {
                                "anyProficientSkill": 2
                            },
                            {
                                "anyProficientSkill": 1,
                                "thieves' tools": true
                            }
                        ]
                    }
                },
                {
                    "name": "Reliable Talent",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "level": 11,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.reliableTalent",
                                    "mode": "OVERRIDE",
                                    "value": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Blindsense",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "level": 14,
                    "entryData": {
                        "senses": [
                            {
                                "blindsight": 10
                            }
                        ]
                    }
                },
                {
                    "name": "Slippery Mind",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "level": 15,
                    "entryData": {
                        "savingThrowProficiencies": [
                            {
                                "wis": true
                            }
                        ]
                    }
                },
                {
                    "name": "Font of Magic",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "level": 2,
                    "system": {
                        "activation.type": null,
                        "uses.per": null,
                        "uses.value": null,
                        "uses.max": null
                    }
                },
                {
                    "name": "Sorcery Points",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "level": 2,
                    "system": {
                        "uses.per": "lr",
                        "uses.max": "@scale.sorcerer.sorcery-points"
                    },
                    "img": "icons/magic/control/silhouette-hold-change-blue.webp"
                },
                {
                    "name": "Metamagic",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "level": 3,
                    "entries": [
                        "At 3rd level, you gain the ability to twist your spells to suit your needs. You gain two Metamagic options of your choice. You gain another one at 10th and 17th level.",
                        "You can use only one Metamagic option on a spell when you cast it, unless otherwise noted."
                    ]
                },
                {
                    "name": "Metamagic Options",
                    "source": "TCE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "level": 3,
                    "isIgnored": true
                },
                {
                    "name": "Metamagic",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "level": 10,
                    "isIgnored": true
                },
                {
                    "name": "Metamagic",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "level": 17,
                    "isIgnored": true
                },
                {
                    "name": "Eldritch Invocations",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "level": 2,
                    "entries": [
                        "In your study of occult lore, you have unearthed eldritch invocations, fragments of forbidden knowledge that imbue you with an abiding magical ability.",
                        "At 2nd level, you gain two eldritch invocations of your choice. Your invocation options are detailed at the end of the class description. When you gain certain warlock levels, you gain additional invocations of your choice, as shown in the Invocations Known column of the Warlock table.",
                        "Additionally, when you gain a level in this class, you can choose one of the invocations you know and replace it with another invocation that you could learn at that level.",
                        "If an eldritch invocation has prerequisites, you must meet them to learn it. You can learn the invocation at the same time that you meet its prerequisites. A level prerequisite refers to your level in this class."
                    ]
                },
                {
                    "name": "Pact Boon",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "level": 3,
                    "isIgnored": true
                },
                {
                    "name": "Infusions Known",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "level": 2,
                    "isIgnored": true
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TCE",
                    "className": "Expert Sidekick",
                    "classSource": "TCE",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "light": true
                            }
                        ],
                        "savingThrowProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "dex",
                                        "int",
                                        "cha"
                                    ],
                                    "count": 1
                                }
                            }
                        ],
                        "skillProficiencies": [
                            {
                                "any": 5
                            }
                        ]
                    }
                },
                {
                    "name": "Expertise",
                    "source": "TCE",
                    "className": "Expert Sidekick",
                    "classSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "expertise": [
                            {
                                "anyProficientSkill": 2
                            }
                        ]
                    }
                },
                {
                    "name": "Expertise",
                    "source": "TCE",
                    "className": "Expert Sidekick",
                    "classSource": "TCE",
                    "level": 15,
                    "entryData": {
                        "expertise": [
                            {
                                "anyProficientSkill": 2
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TCE",
                    "className": "Spellcaster Sidekick",
                    "classSource": "TCE",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "light": true
                            }
                        ],
                        "savingThrowProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "wis",
                                        "int",
                                        "cha"
                                    ],
                                    "count": 1
                                }
                            }
                        ],
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "arcana",
                                        "history",
                                        "insight",
                                        "investigation",
                                        "medicine",
                                        "performance",
                                        "persuasion",
                                        "religion"
                                    ],
                                    "count": 2
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TCE",
                    "className": "Warrior Sidekick",
                    "classSource": "TCE",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "light": true,
                                "medium": true,
                                "heavy": true
                            }
                        ],
                        "savingThrowProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "str",
                                        "dex",
                                        "con"
                                    ],
                                    "count": 1
                                }
                            }
                        ],
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "acrobatics",
                                        "animal handling",
                                        "athletics",
                                        "intimidation",
                                        "nature",
                                        "perception",
                                        "survival"
                                    ],
                                    "count": 2
                                }
                            }
                        ]
                    }
                }
            ],
            "subclassFeature": [
                {
                    "name": "Eagle",
                    "source": "PHB",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "subclassShortName": "Totem Warrior",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "activation.type": "bonus",
                        "activation.cost": 1
                    }
                },
                {
                    "name": "Call the Hunt",
                    "source": "TCE",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "subclassShortName": "Beast",
                    "subclassSource": "TCE",
                    "level": 14,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft"
                    }
                },
                {
                    "name": "Magic Awareness",
                    "source": "TCE",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "subclassShortName": "Wild Magic",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "target.value": 60,
                        "target.units": "ft"
                    }
                },
                {
                    "name": "Divine Fury",
                    "source": "XGE",
                    "className": "Barbarian",
                    "classSource": "PHB",
                    "subclassShortName": "Zealot",
                    "subclassSource": "XGE",
                    "level": 3,
                    "isChooseSystemRenderEntries": true,
                    "system": {
                        "activation.type": "special",
                        "activation.condition": "While you're raging, the first creature you hit on each of your turns with a weapon attack"
                    },
                    "chooseSystem": [
                        {
                            "name": "Necrotic Damage",
                            "system": {
                                "damage.parts": [
                                    [
                                        "1d6 + floor(@classes.barbarian.levels / 2)",
                                        "necrotic"
                                    ]
                                ]
                            }
                        },
                        {
                            "name": "Radiant Damage",
                            "system": {
                                "damage.parts": [
                                    [
                                        "1d6 + floor(@classes.barbarian.levels / 2)",
                                        "radiant"
                                    ]
                                ]
                            }
                        }
                    ]
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "PHB",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Lore",
                    "subclassSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "any": 3
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "PHB",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Valor",
                    "subclassSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "medium": true,
                                "shield|phb": true
                            }
                        ],
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Performance of Creation",
                    "source": "TCE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Creation",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "target.value": 1,
                        "target.type": "object",
                        "range.value": 10,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Animating Performance",
                    "source": "TCE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Creation",
                    "subclassSource": "TCE",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "object",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Unsettling Words",
                    "source": "TCE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Eloquence",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Universal Speech",
                    "source": "TCE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Eloquence",
                    "subclassSource": "TCE",
                    "level": 6,
                    "system": {
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Infectious Inspiration",
                    "source": "TCE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Eloquence",
                    "subclassSource": "TCE",
                    "level": 14,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Tales from Beyond",
                    "source": "VRGR",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Spirits",
                    "subclassSource": "VRGR",
                    "level": 3,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Enthralling Performance",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Glamour",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "activation.type": "minute",
                        "activation.cost": 1,
                        "target.value": 60,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Swords",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "medium": true
                            }
                        ],
                        "weaponProficiencies": [
                            {
                                "scimitar|phb": true
                            }
                        ]
                    }
                },
                {
                    "name": "Fighting Style",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Swords",
                    "subclassSource": "XGE",
                    "level": 3,
                    "isIgnored": true
                },
                {
                    "name": "Psychic Blades",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Whispers",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "activation.type": "special",
                        "activation.condition": "When you hit a creature with a weapon attack",
                        "damage.parts": [
                            [
                                "@scale.college-of-whispers.psychic-blades",
                                "psychic"
                            ]
                        ]
                    }
                },
                {
                    "name": "Words of Terror",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Whispers",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "activation.type": "minute",
                        "activation.cost": 1,
                        "target.value": 1,
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Mantle of Whispers",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Whispers",
                    "subclassSource": "XGE",
                    "level": 6,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Shadow Lore",
                    "source": "XGE",
                    "className": "Bard",
                    "classSource": "PHB",
                    "subclassShortName": "Whispers",
                    "subclassSource": "XGE",
                    "level": 14,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Channel Divinity: Touch of Death",
                    "source": "DMG",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Death",
                    "subclassSource": "DMG",
                    "level": 2,
                    "system": {
                        "activation.type": "special",
                        "activation.condition": "When the cleric hits a creature with a melee attack",
                        "damage.parts": [
                            [
                                "5 + (2 * @classes.cleric.levels)",
                                "necrotic"
                            ]
                        ]
                    }
                },
                {
                    "name": "Divine Strike",
                    "source": "DMG",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Death",
                    "subclassSource": "DMG",
                    "level": 8,
                    "system": {
                        "damage.parts": [
                            [
                                "@scale.death-domain.divine-strike",
                                "necrotic"
                            ]
                        ]
                    }
                },
                {
                    "name": "Blessings of Knowledge",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Knowledge",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "arcana",
                                        "history",
                                        "nature",
                                        "religion"
                                    ],
                                    "count": 2
                                }
                            }
                        ],
                        "languageProficiencies": [
                            {
                                "any": 2
                            }
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Knowledge of the Ages",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Knowledge",
                    "subclassSource": "PHB",
                    "level": 2,
                    "system": {
                        "duration.value": 10,
                        "duration.units": "minute"
                    }
                },
                {
                    "name": "Channel Divinity: Read Thoughts",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Knowledge",
                    "subclassSource": "PHB",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Visions of the Past",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Knowledge",
                    "subclassSource": "PHB",
                    "level": 17,
                    "system": {
                        "activation.type": "minute",
                        "activation.cost": 1
                    }
                },
                {
                    "name": "Bonus Proficiency",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Life",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ]
                    }
                },
                {
                    "name": "Disciple of Life",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Life",
                    "subclassSource": "PHB",
                    "level": 1,
                    "effects": [
                        {
                            "name": "Bonus Healing",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.bonuses.heal.damage",
                                    "mode": "ADD",
                                    "value": "+ @item.level + 2"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Channel Divinity: Radiance of the Dawn",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Light",
                    "subclassSource": "PHB",
                    "level": 2,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere",
                        "damage.parts": [
                            [
                                "2d10 + @classes.cleric.levels",
                                "radiant"
                            ]
                        ],
                        "formula": ""
                    }
                },
                {
                    "name": "Corona of Light",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Light",
                    "subclassSource": "PHB",
                    "level": 17,
                    "system": {
                        "target.value": 60,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Acolyte of Nature",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Nature",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "animal handling",
                                        "nature",
                                        "survival"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiency",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Nature",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Charm Animals and Plants",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Nature",
                    "subclassSource": "PHB",
                    "level": 2,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere",
                        "damage.parts": [
                            [
                                "2d10 + @classes.cleric.levels",
                                "radiant"
                            ]
                        ]
                    }
                },
                {
                    "name": "Divine Strike",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Nature",
                    "subclassSource": "PHB",
                    "level": 8,
                    "system": {
                        "damage.parts": [
                            [
                                "@scale.nature-domain.divine-strike",
                                "cold"
                            ],
                            [
                                "@scale.nature-domain.divine-strike",
                                "fire"
                            ],
                            [
                                "@scale.nature-domain.divine-strike",
                                "lightning"
                            ]
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Tempest",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ],
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Invoke Duplicity",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Trickery",
                    "subclassSource": "PHB",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Divine Strike",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Trickery",
                    "subclassSource": "PHB",
                    "level": 8,
                    "system": {
                        "damage.parts": [
                            [
                                "@scale.order-domain.divine-strike",
                                "poison"
                            ]
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "PHB",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "War",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ],
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Acolyte of Strength",
                    "source": "PSA",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Strength (PSA)",
                    "subclassSource": "PSA",
                    "level": 1,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "animal handling",
                                        "athletics",
                                        "nature",
                                        "survival"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Arcane Initiate",
                    "source": "SCAG",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Arcana",
                    "subclassSource": "SCAG",
                    "level": 1,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "arcana": true
                            }
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Arcane Abjuration",
                    "source": "SCAG",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Arcana",
                    "subclassSource": "SCAG",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Order",
                    "subclassSource": "TCE",
                    "level": 1,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "intimidation",
                                        "persuasion"
                                    ]
                                }
                            }
                        ],
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Order's Demand",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Order",
                    "subclassSource": "TCE",
                    "level": 2,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Divine Strike",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Order",
                    "subclassSource": "TCE",
                    "level": 8,
                    "system": {
                        "damage.parts": [
                            [
                                "@scale.order-domain.divine-strike",
                                "psychic"
                            ]
                        ]
                    }
                },
                {
                    "name": "Emboldening Bond",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Peace",
                    "subclassSource": "TCE",
                    "level": 1,
                    "system": {
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Implement of Peace",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Peace",
                    "subclassSource": "TCE",
                    "level": 1,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "insight",
                                        "performance",
                                        "persuasion"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Twilight",
                    "subclassSource": "TCE",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ],
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Eyes of Night",
                    "source": "TCE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Twilight",
                    "subclassSource": "TCE",
                    "level": 1,
                    "actorTokenMod": {
                        "dimSight": [
                            {
                                "mode": "setMax",
                                "value": 300
                            }
                        ]
                    },
                    "system": {
                        "target.type": "creature",
                        "range.value": 10,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TDCSR",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Blood",
                    "subclassSource": "TDCSR",
                    "level": 1,
                    "entryData": {
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiency",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Forge",
                    "subclassSource": "XGE",
                    "level": 1,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ],
                        "toolProficiencies": [
                            {
                                "smith's tools": true
                            }
                        ]
                    }
                },
                {
                    "name": "Divine Strike",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Forge",
                    "subclassSource": "XGE",
                    "level": 8,
                    "system": {
                        "damage.parts": [
                            [
                                "@scale.forge-domain.divine-strike",
                                "fire"
                            ]
                        ]
                    }
                },
                {
                    "name": "Saint of Forge and Fire",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Forge",
                    "subclassSource": "XGE",
                    "level": 17,
                    "entryData": {
                        "immune": [
                            "fire"
                        ]
                    }
                },
                {
                    "name": "Channel Divinity: Path to the Grave",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Grave",
                    "subclassSource": "XGE",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Sentinel at Death's Door",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Grave",
                    "subclassSource": "XGE",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Keeper of Souls",
                    "source": "XGE",
                    "className": "Cleric",
                    "classSource": "PHB",
                    "subclassShortName": "Grave",
                    "subclassSource": "XGE",
                    "level": 17,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Nature's Ward",
                    "source": "PHB",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Land",
                    "subclassSource": "PHB",
                    "level": 10,
                    "entryData": {
                        "immune": [
                            "poison"
                        ],
                        "conditionImmune": [
                            "disease",
                            "poisoned"
                        ]
                    }
                },
                {
                    "name": "Halo of Spores",
                    "source": "TCE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Spores",
                    "subclassSource": "TCE",
                    "level": 2,
                    "system": {
                        "target.value": 10,
                        "target.units": "ft",
                        "target.type": "sphere",
                        "range.units": "self"
                    }
                },
                {
                    "name": "Spreading Spores",
                    "source": "TCE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Spores",
                    "subclassSource": "TCE",
                    "level": 10,
                    "system": {
                        "target.value": 10,
                        "target.units": "ft",
                        "target.type": "cube",
                        "range.value": 30,
                        "range.units": "ft",
                        "duration.value": 1,
                        "duration.units": "minute"
                    }
                },
                {
                    "name": "Fungal Body",
                    "source": "TCE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Spores",
                    "subclassSource": "TCE",
                    "level": 14,
                    "entryData": {
                        "conditionImmune": [
                            "blinded",
                            "deafened",
                            "frightened",
                            "poisoned"
                        ]
                    }
                },
                {
                    "name": "Summon Wildfire Spirit",
                    "source": "TCE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Wildfire",
                    "subclassSource": "TCE",
                    "level": 2,
                    "system": {
                        "target.type": "space",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Incarnation of Corruption",
                    "source": "TDCSR",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Blighted",
                    "subclassSource": "TDCSR",
                    "level": 14,
                    "entryData": {
                        "resist": [
                            "necrotic"
                        ]
                    }
                },
                {
                    "name": "Balm of the Summer Court",
                    "source": "XGE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Dreams",
                    "subclassSource": "XGE",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 120,
                        "range.units": "ft",
                        "uses.per": "charges",
                        "uses.value": 2,
                        "uses.max": "@classes.druid.levels",
                        "uses.recovery": "@classes.druid.levels",
                        "formula": "1d6",
                        "actionType": "healing"
                    }
                },
                {
                    "name": "Hearth of Moonlight and Shadow",
                    "source": "XGE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Dreams",
                    "subclassSource": "XGE",
                    "level": 6,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Hidden Paths",
                    "source": "XGE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Dreams",
                    "subclassSource": "XGE",
                    "level": 10,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Speech of the Woods",
                    "source": "XGE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Shepherd",
                    "subclassSource": "XGE",
                    "level": 2,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "sylvan": true
                            }
                        ]
                    }
                },
                {
                    "name": "Spirit Totem",
                    "source": "XGE",
                    "className": "Druid",
                    "classSource": "PHB",
                    "subclassShortName": "Shepherd",
                    "subclassSource": "XGE",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Unleash Incarnation",
                    "source": "EGW",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Echo Knight",
                    "subclassSource": "EGW",
                    "level": 3,
                    "system": {
                        "activation.type": "special",
                        "activation.condition": "Whenever you take the Attack action",
                        "activation.cost": 1
                    }
                },
                {
                    "name": "Combat Superiority",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "resources": [
                            {
                                "name": "Superiority Die",
                                "type": "dicePool",
                                "recharge": "restShort",
                                "count": "floor((<$level$> + 1) / 8) + 4",
                                "number": 1,
                                "faces": "8 + (sign(ceil((<$level$> - 2) / 8) - 1) * 2)"
                            }
                        ]
                    },
                    "system": {
                        "activation.type": null,
                        "uses.value": null,
                        "uses.max": null
                    }
                },
                {
                    "name": "Maneuver Options",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 3,
                    "isIgnored": true
                },
                {
                    "name": "Maneuvers",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 3,
                    "isIgnored": true
                },
                {
                    "name": "Student of War",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "anyArtisansTool": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Additional Maneuvers",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 7,
                    "isIgnored": true
                },
                {
                    "name": "Additional Superiority Die",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 7,
                    "isIgnored": true
                },
                {
                    "name": "Additional Maneuvers",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 10,
                    "isIgnored": true
                },
                {
                    "name": "Improved Combat Superiority (d10)",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 10,
                    "isIgnored": true
                },
                {
                    "name": "Additional Maneuvers",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 15,
                    "isIgnored": true
                },
                {
                    "name": "Additional Superiority Die",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 15,
                    "isIgnored": true
                },
                {
                    "name": "Improved Combat Superiority (d12)",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Battle Master",
                    "subclassSource": "PHB",
                    "level": 18,
                    "isIgnored": true
                },
                {
                    "name": "Improved Critical",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Champion",
                    "subclassSource": "PHB",
                    "level": 3,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.weaponCriticalThreshold",
                                    "mode": "OVERRIDE",
                                    "value": 19
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Remarkable Athlete",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Champion",
                    "subclassSource": "PHB",
                    "level": 7,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "flags.dnd5e.remarkableAthlete",
                                    "mode": "OVERRIDE",
                                    "value": true
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Additional Fighting Style",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Champion",
                    "subclassSource": "PHB",
                    "level": 10,
                    "isIgnored": true
                },
                {
                    "name": "Arcane Charge",
                    "source": "PHB",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Eldritch Knight",
                    "subclassSource": "PHB",
                    "level": 15,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Rallying Cry",
                    "source": "SCAG",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Purple Dragon Knight (Banneret)",
                    "subclassSource": "SCAG",
                    "level": 3,
                    "system": {
                        "target.value": 3,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Royal Envoy",
                    "source": "SCAG",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Purple Dragon Knight (Banneret)",
                    "subclassSource": "SCAG",
                    "level": 7,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "animal handling",
                                        "insight",
                                        "intimidation",
                                        "performance",
                                        "persuasion"
                                    ]
                                }
                            }
                        ],
                        "expertise": [
                            {
                                "persuasion": true
                            }
                        ]
                    }
                },
                {
                    "name": "Inspiring Surge",
                    "source": "SCAG",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Purple Dragon Knight (Banneret)",
                    "subclassSource": "SCAG",
                    "level": 10,
                    "system": {
                        "target.value": 1,
                        "target.type": "ally",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Psionic Power",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Psi Warrior",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "resources": [
                            {
                                "name": "Psionic Energy Die",
                                "type": "dicePool",
                                "recharge": "restLong",
                                "count": "2 * PB",
                                "number": 1,
                                "faces": "(6 + ((ceil((<$level$> + 2) / 6) - 1) * 2))"
                            }
                        ]
                    }
                },
                {
                    "name": "Guarded Mind",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Psi Warrior",
                    "subclassSource": "TCE",
                    "level": 10,
                    "entryData": {
                        "resist": [
                            "psychic"
                        ]
                    }
                },
                {
                    "name": "Bulwark of Force",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Psi Warrior",
                    "subclassSource": "TCE",
                    "level": 15,
                    "system": {
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Rune Knight",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "smith's tools": true
                            }
                        ],
                        "languageProficiencies": [
                            {
                                "giant": true
                            }
                        ]
                    }
                },
                {
                    "name": "Rune Carver",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Rune Knight",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entries": [
                        "{@i 3rd-level Rune Knight feature}",
                        "You can use magic runes to enhance your gear. You learn two runes of your choice, from among the runes described below, and each time you gain a level in this class, you can replace one rune you know with a different one from this feature. When you reach certain levels in this class, you learn additional runes, as shown in the Runes Known table.",
                        "Whenever you finish a long rest, you can touch a number of objects equal to the number of runes you know, and you inscribe a different rune onto each of the objects. To be eligible, an object must be a weapon, a suit of armor, a shield, a piece of jewelry, or something else you can wear or hold in a hand. Your rune remains on an object until you finish a long rest, and an object can bear only one of your runes at a time.",
                        {
                            "type": "table",
                            "caption": "Runes Known",
                            "colLabels": [
                                "Fighter Level",
                                "Number of Runes"
                            ],
                            "colStyles": [
                                "col-6 text-center",
                                "col-6 text-center"
                            ],
                            "rows": [
                                [
                                    "3rd",
                                    "2"
                                ],
                                [
                                    "7th",
                                    "3"
                                ],
                                [
                                    "10th",
                                    "4"
                                ],
                                [
                                    "15th",
                                    "5"
                                ]
                            ]
                        },
                        "If a rune has a level requirement, you must be at least that level in this class to learn the rune. If a rune requires a saving throw, your Rune Magic save DC equals 8 + your proficiency bonus + your Constitution modifier."
                    ]
                },
                {
                    "name": "Additional Rune Known",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Rune Knight",
                    "subclassSource": "TCE",
                    "level": 7,
                    "entries": [
                        {
                            "type": "options",
                            "count": 1,
                            "entries": [
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Cloud Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Fire Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Frost Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Stone Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Hill Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Storm Rune|TCE"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Runic Shield",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Rune Knight",
                    "subclassSource": "TCE",
                    "level": 7,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Additional Rune Known",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Rune Knight",
                    "subclassSource": "TCE",
                    "level": 10,
                    "entries": [
                        {
                            "type": "options",
                            "count": 1,
                            "entries": [
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Cloud Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Fire Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Frost Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Stone Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Hill Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Storm Rune|TCE"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Additional Rune Known",
                    "source": "TCE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Rune Knight",
                    "subclassSource": "TCE",
                    "level": 15,
                    "entries": [
                        {
                            "type": "options",
                            "count": 1,
                            "entries": [
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Cloud Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Fire Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Frost Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Stone Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Hill Rune|TCE"
                                },
                                {
                                    "type": "refOptionalfeature",
                                    "optionalfeature": "Storm Rune|TCE"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Arcane Archer Lore",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "arcana",
                                        "nature"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Arcane Shot",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "uses.per": "sr",
                        "uses.value": 2,
                        "uses.max": 2
                    }
                },
                {
                    "name": "Arcane Shot Options",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entries": [
                        "Arcane shots are all magical effects, and each one is associated with one of the schools of magic.",
                        "If an option requires a saving throw, your Arcane Shot save DC is calculated as follows:",
                        {
                            "type": "abilityDc",
                            "name": "Arcane Shot",
                            "attributes": [
                                "int"
                            ]
                        }
                    ]
                },
                {
                    "name": "Additional Arcane Shot Option",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 7,
                    "isIgnored": true
                },
                {
                    "name": "Additional Arcane Shot Option",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 10,
                    "isIgnored": true
                },
                {
                    "name": "Additional Arcane Shot Option",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 15,
                    "isIgnored": true
                },
                {
                    "name": "Additional Arcane Shot Option",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Arcane Archer",
                    "subclassSource": "XGE",
                    "level": 18,
                    "isIgnored": true
                },
                {
                    "name": "Bonus Proficiency",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Cavalier",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "animal handling",
                                        "history",
                                        "insight",
                                        "performance",
                                        "persuasion"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiency",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Samurai",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "history",
                                        "insight",
                                        "performance",
                                        "persuasion"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Elegant Courtier",
                    "source": "XGE",
                    "className": "Fighter",
                    "classSource": "PHB",
                    "subclassShortName": "Samurai",
                    "subclassSource": "XGE",
                    "level": 7,
                    "entryData": {
                        "savingThrowProficiencies": [
                            {
                                "wis": true
                            },
                            {
                                "choose": {
                                    "from": [
                                        "int",
                                        "cha"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Draconic Disciple",
                    "source": "FTD",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Ascendant Dragon",
                    "subclassSource": "FTD",
                    "level": 3,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "any": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Elemental Disciplines",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Four Elements",
                    "subclassSource": "PHB",
                    "level": 3,
                    "isIgnored": true
                },
                {
                    "name": "Extra Elemental Discipline",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Four Elements",
                    "subclassSource": "PHB",
                    "level": 6,
                    "isIgnored": true
                },
                {
                    "name": "Extra Elemental Discipline",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Four Elements",
                    "subclassSource": "PHB",
                    "level": 11,
                    "isIgnored": true
                },
                {
                    "name": "Extra Elemental Discipline",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Four Elements",
                    "subclassSource": "PHB",
                    "level": 17,
                    "isIgnored": true
                },
                {
                    "name": "Shadow Step",
                    "source": "PHB",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Shadow",
                    "subclassSource": "PHB",
                    "level": 6,
                    "system": {
                        "target.value": 60,
                        "target.units": "ft",
                        "target.type": "space"
                    }
                },
                {
                    "name": "Hour of Reaping",
                    "source": "SCAG",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Long Death",
                    "subclassSource": "SCAG",
                    "level": 6,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Implements of Mercy",
                    "source": "TCE",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Mercy",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "insight": true,
                                "medicine": true
                            }
                        ],
                        "toolProficiencies": [
                            {
                                "herbalism kit": true
                            }
                        ]
                    }
                },
                {
                    "name": "Mystical Erudition",
                    "source": "TDCSR",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Cobalt Soul",
                    "subclassSource": "TDCSR",
                    "level": 6,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "arcana",
                                        "history",
                                        "investigation",
                                        "nature",
                                        "religion"
                                    ],
                                    "count": 1
                                }
                            }
                        ],
                        "languageProficiencies": [
                            {
                                "any": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Mystical Erudition (11th Level)",
                    "source": "TDCSR",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Cobalt Soul",
                    "subclassSource": "TDCSR",
                    "level": 11,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "arcana",
                                        "history",
                                        "investigation",
                                        "nature",
                                        "religion"
                                    ],
                                    "count": 1
                                }
                            }
                        ],
                        "languageProficiencies": [
                            {
                                "any": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Mystical Erudition (17th Level)",
                    "source": "TDCSR",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Cobalt Soul",
                    "subclassSource": "TDCSR",
                    "level": 17,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "arcana",
                                        "history",
                                        "investigation",
                                        "nature",
                                        "religion"
                                    ],
                                    "count": 1
                                }
                            }
                        ],
                        "languageProficiencies": [
                            {
                                "any": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "XGE",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Drunken Master",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "performance": true
                            }
                        ],
                        "toolProficiencies": [
                            {
                                "brewer's supplies": true
                            }
                        ]
                    }
                },
                {
                    "name": "Path of the Kensei",
                    "source": "XGE",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Kensei",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "calligrapher's supplies",
                                        "painter's supplies"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Radiant Sun Bolt",
                    "source": "XGE",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Sun Soul",
                    "subclassSource": "XGE",
                    "level": 3,
                    "subEntities": {
                        "item": [
                            {
                                "name": "Radiant Sun Bolt",
                                "source": "XGE",
                                "page": 35,
                                "type": "R",
                                "range": "30",
                                "rarity": "none",
                                "weaponCategory": "simple",
                                "entries": [
                                    "This special attack is a ranged spell attack with a range of 30 feet. You are proficient with it, and you add your Dexterity modifier to its attack and damage rolls.",
                                    "When you take the {@action Attack} action on your turn and use this special attack as part of it, you can spend 1 ki point to make this special attack twice as a bonus action. When you gain the Extra Attack feature, this special attack can be used for any of the attacks you make as part of the {@action Attack} action."
                                ],
                                "foundrySystem": {
                                    "equipped": true,
                                    "damage.parts": [
                                        [
                                            "@scale.monk.die + @mod",
                                            "radiant"
                                        ]
                                    ],
                                    "ability": "dex"
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Searing Sunburst",
                    "source": "XGE",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Sun Soul",
                    "subclassSource": "XGE",
                    "level": 11,
                    "system": {
                        "target.value": 20,
                        "target.units": "ft",
                        "target.type": "sphere",
                        "range.value": 150,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Sun Shield",
                    "source": "XGE",
                    "className": "Monk",
                    "classSource": "PHB",
                    "subclassShortName": "Sun Soul",
                    "subclassSource": "XGE",
                    "level": 17,
                    "system": {
                        "target.value": 60,
                        "target.units": "ft",
                        "target.type": "radius"
                    }
                },
                {
                    "name": "Control Undead",
                    "source": "DMG",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Oathbreaker",
                    "subclassSource": "DMG",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Dreadful Aspect",
                    "source": "DMG",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Oathbreaker",
                    "subclassSource": "DMG",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Nature's Wrath",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Ancients",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 10,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Turn the Faithless",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Ancients",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Sacred Weapon",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Devotion",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "target.value": 40,
                        "target.units": "ft",
                        "target.type": "radius"
                    }
                },
                {
                    "name": "Turn the Unholy",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Devotion",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Holy Nimbus",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Devotion",
                    "subclassSource": "PHB",
                    "level": 20,
                    "system": {
                        "target.value": 60,
                        "target.units": "ft",
                        "target.type": "radius"
                    }
                },
                {
                    "name": "Abjure Enemy",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Vengeance",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Vow of Enmity",
                    "source": "PHB",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Vengeance",
                    "subclassSource": "PHB",
                    "level": 3,
                    "system": {
                        "range.value": 10,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Champion Challenge",
                    "source": "SCAG",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Crown",
                    "subclassSource": "SCAG",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Turn the Tide",
                    "source": "SCAG",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Crown",
                    "subclassSource": "SCAG",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Inspiring Smite",
                    "source": "TCE",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Glory",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Glorious Defense",
                    "source": "TCE",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Glory",
                    "subclassSource": "TCE",
                    "level": 15,
                    "system": {
                        "range.value": 10,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Vigilant Rebuke",
                    "source": "TCE",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Watchers",
                    "subclassSource": "TCE",
                    "level": 15,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Conquering Presence",
                    "source": "XGE",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Conquest",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "creature"
                    }
                },
                {
                    "name": "Rebuke the Violent",
                    "source": "XGE",
                    "className": "Paladin",
                    "classSource": "PHB",
                    "subclassShortName": "Redemption",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Draconic Gift",
                    "source": "FTD",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Drakewarden",
                    "subclassSource": "FTD",
                    "level": 3,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "any": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Otherworldly Glamour",
                    "source": "TCE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Fey Wanderer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "deception",
                                        "performance",
                                        "persuasion"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Beguiling Twist",
                    "source": "TCE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Fey Wanderer",
                    "subclassSource": "TCE",
                    "level": 7,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 120,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Umbral Sight",
                    "source": "XGE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Gloom Stalker",
                    "subclassSource": "XGE",
                    "level": 3,
                    "actorTokenMod": {
                        "_": [
                            {
                                "mode": "conditionals",
                                "conditionals": [
                                    {
                                        "condition": "!PLUT_CONTEXT?.actor?.data?.token?.dimSight",
                                        "mod": {
                                            "dimSight": [
                                                {
                                                    "mode": "set",
                                                    "value": 60
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        "mod": {
                                            "dimSight": [
                                                {
                                                    "mode": "scalarAdd",
                                                    "scalar": 30
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    "name": "Iron Mind",
                    "source": "XGE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Gloom Stalker",
                    "subclassSource": "XGE",
                    "level": 7,
                    "entryData": {
                        "savingThrowProficiencies": [
                            {
                                "wis": true
                            },
                            {
                                "choose": {
                                    "from": [
                                        "int",
                                        "cha"
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Hunter's Sense",
                    "source": "XGE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Monster Slayer",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Slayer's Prey",
                    "source": "XGE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Monster Slayer",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Magic-User's Nemesis",
                    "source": "XGE",
                    "className": "Ranger",
                    "classSource": "PHB",
                    "subclassShortName": "Monster Slayer",
                    "subclassSource": "XGE",
                    "level": 11,
                    "system": {
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Bonus Proficiencies",
                    "source": "PHB",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Assassin",
                    "subclassSource": "PHB",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "disguise kit": true,
                                "poisoner's kit": true
                            }
                        ]
                    }
                },
                {
                    "name": "Wails from the Grave",
                    "source": "TCE",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Phantom",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Psionic Power",
                    "source": "TCE",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Soulknife",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "resources": [
                            {
                                "name": "Psionic Energy Die",
                                "type": "dicePool",
                                "recharge": "restLong",
                                "count": "2 * PB",
                                "number": 1,
                                "faces": "(6 + (ceil((<$level$> + 2) / 6) - 1) * 2)"
                            }
                        ]
                    }
                },
                {
                    "name": "Master of Intrigue",
                    "source": "XGE",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Mastermind",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "disguise kit": true,
                                "forgery kit": true,
                                "gaming set": true
                            }
                        ],
                        "languageProficiencies": [
                            {
                                "any": 2
                            }
                        ]
                    }
                },
                {
                    "name": "Master of Tactics",
                    "source": "XGE",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Mastermind",
                    "subclassSource": "XGE",
                    "level": 3,
                    "system": {
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Survivalist",
                    "source": "XGE",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Scout",
                    "subclassSource": "XGE",
                    "level": 3,
                    "entryData": {
                        "expertise": [
                            {
                                "nature": true,
                                "survival": true
                            }
                        ]
                    }
                },
                {
                    "name": "Superior Mobility",
                    "source": "XGE",
                    "className": "Rogue",
                    "classSource": "PHB",
                    "subclassShortName": "Scout",
                    "subclassSource": "XGE",
                    "level": 9,
                    "effects": [
                        {
                            "name": "Superior Mobility",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.movement.walk",
                                    "mode": "ADD",
                                    "value": "+ 10"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Draconic Resilience",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Draconic",
                    "subclassSource": "PHB",
                    "level": 1,
                    "effects": [
                        {
                            "name": "Natural Armor",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.ac.calc",
                                    "mode": "OVERRIDE",
                                    "value": "draconic"
                                }
                            ]
                        },
                        {
                            "name": "HP Increase",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.hp.max",
                                    "mode": "ADD",
                                    "value": "+ @classes.sorcerer.levels"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Dragon Ancestor",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Draconic",
                    "subclassSource": "PHB",
                    "level": 1,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "draconic": true
                            }
                        ]
                    }
                },
                {
                    "name": "Dragon Wings",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Draconic",
                    "subclassSource": "PHB",
                    "level": 14,
                    "effects": [
                        {
                            "name": "Flying Speed",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.movement.fly",
                                    "mode": "UPGRADE",
                                    "value": "@attributes.movement.walk"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Draconic Presence",
                    "source": "PHB",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Draconic",
                    "subclassSource": "PHB",
                    "level": 18,
                    "system": {
                        "target.value": 60,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Telepathic Speech",
                    "source": "TCE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Aberrant Mind",
                    "subclassSource": "TCE",
                    "level": 1,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Warping Implosion",
                    "source": "TCE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Aberrant Mind",
                    "subclassSource": "TCE",
                    "level": 18,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 120,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Restore Balance",
                    "source": "TCE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Clockwork Soul",
                    "subclassSource": "TCE",
                    "level": 1,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Bastion of Law",
                    "source": "TCE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Clockwork Soul",
                    "subclassSource": "TCE",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Clockwork Cavalcade",
                    "source": "TCE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Clockwork Soul",
                    "subclassSource": "TCE",
                    "level": 18,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "cube"
                    }
                },
                {
                    "name": "Hound of Ill Omen",
                    "source": "XGE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Shadow",
                    "subclassSource": "XGE",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 120,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Shadow Walk",
                    "source": "XGE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Shadow",
                    "subclassSource": "XGE",
                    "level": 14,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 120,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Wind Speaker",
                    "source": "XGE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Storm",
                    "subclassSource": "XGE",
                    "level": 1,
                    "entryData": {
                        "languageProficiencies": [
                            {
                                "primordial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Heart of the Storm",
                    "source": "XGE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Storm",
                    "subclassSource": "XGE",
                    "level": 6,
                    "entryData": {
                        "resist": [
                            "lightning",
                            "thunder"
                        ]
                    },
                    "system": {
                        "target.value": 10,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Wind Soul",
                    "source": "XGE",
                    "className": "Sorcerer",
                    "classSource": "PHB",
                    "subclassShortName": "Storm",
                    "subclassSource": "XGE",
                    "level": 18,
                    "entryData": {
                        "immune": [
                            "lightning",
                            "thunder"
                        ]
                    }
                },
                {
                    "name": "Fey Presence",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Archfey",
                    "subclassSource": "PHB",
                    "level": 1,
                    "system": {
                        "target.value": 10,
                        "target.units": "ft",
                        "target.type": "cube"
                    }
                },
                {
                    "name": "Misty Escape",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Archfey",
                    "subclassSource": "PHB",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Beguiling Defenses",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Archfey",
                    "subclassSource": "PHB",
                    "level": 10,
                    "entryData": {
                        "conditionImmune": [
                            "charmed"
                        ]
                    }
                },
                {
                    "name": "Dark Delirium",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Archfey",
                    "subclassSource": "PHB",
                    "level": 14,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Awakened Mind",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Great Old One",
                    "subclassSource": "PHB",
                    "level": 1,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Thought Shield",
                    "source": "PHB",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Great Old One",
                    "subclassSource": "PHB",
                    "level": 10,
                    "entryData": {
                        "resist": [
                            "psychic"
                        ]
                    }
                },
                {
                    "name": "Gift of the Sea",
                    "source": "TCE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Fathomless",
                    "subclassSource": "TCE",
                    "level": 1,
                    "effects": [
                        {
                            "name": "Gift of the Sea",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.movement.swim",
                                    "mode": "UPGRADE",
                                    "value": "40"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Tentacle of the Deeps",
                    "source": "TCE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Fathomless",
                    "subclassSource": "TCE",
                    "level": 1,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Oceanic Soul",
                    "source": "TCE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Fathomless",
                    "subclassSource": "TCE",
                    "level": 6,
                    "entryData": {
                        "resist": [
                            "cold"
                        ]
                    }
                },
                {
                    "name": "Fathomless Plunge",
                    "source": "TCE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Fathomless",
                    "subclassSource": "TCE",
                    "level": 14,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "radius",
                        "range.value": 1,
                        "range.units": "mi"
                    }
                },
                {
                    "name": "Sanctuary Vessel",
                    "source": "TCE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Genie",
                    "subclassSource": "TCE",
                    "level": 10,
                    "system": {
                        "target.value": 5,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Necrotic Husk",
                    "source": "VRGR",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Undead",
                    "subclassSource": "VRGR",
                    "level": 10,
                    "entryData": {
                        "resist": [
                            "necrotic"
                        ]
                    },
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "radius"
                    }
                },
                {
                    "name": "Radiant Soul",
                    "source": "XGE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Celestial",
                    "subclassSource": "XGE",
                    "level": 6,
                    "entryData": {
                        "resist": [
                            "radiant"
                        ]
                    }
                },
                {
                    "name": "Searing Vengeance",
                    "source": "XGE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Celestial",
                    "subclassSource": "XGE",
                    "level": 14,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Hex Warrior",
                    "source": "XGE",
                    "className": "Warlock",
                    "classSource": "PHB",
                    "subclassShortName": "Hexblade",
                    "subclassSource": "XGE",
                    "level": 1,
                    "entryData": {
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ],
                        "armorProficiencies": [
                            {
                                "shield|phb": true,
                                "medium": true
                            }
                        ]
                    }
                },
                {
                    "name": "Chronal Shift",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Chronurgy",
                    "subclassSource": "EGW",
                    "level": 2,
                    "system": {
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Temporal Awareness",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Chronurgy",
                    "subclassSource": "EGW",
                    "level": 2,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.init.total",
                                    "mode": "ADD",
                                    "value": "+ @abilities.int.mod"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Momentary Stasis",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Chronurgy",
                    "subclassSource": "EGW",
                    "level": 6,
                    "system": {
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Convergent Future",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Chronurgy",
                    "subclassSource": "EGW",
                    "level": 14,
                    "system": {
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Adjust Density",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Graviturgy",
                    "subclassSource": "EGW",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Violent Attraction",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Graviturgy",
                    "subclassSource": "EGW",
                    "level": 10,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Event Horizon",
                    "source": "EGW",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Graviturgy",
                    "subclassSource": "EGW",
                    "level": 14,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Arcane Ward",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Abjuration",
                    "subclassSource": "PHB",
                    "level": 2,
                    "system": {
                        "activation.type": "special",
                        "activation.cost": null,
                        "uses.per": null,
                        "uses.max": "2 * @classes.wizard.levels + floor((@abilities.int.value - 10) / 2)"
                    }
                },
                {
                    "name": "Projected Ward",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Abjuration",
                    "subclassSource": "PHB",
                    "level": 6,
                    "system": {
                        "target.value": 30,
                        "target.units": "ft",
                        "target.type": "sphere"
                    }
                },
                {
                    "name": "Benign Transposition",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Conjuration",
                    "subclassSource": "PHB",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "space",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Hypnotic Gaze",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Enchantment",
                    "subclassSource": "PHB",
                    "level": 2,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 5,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Instinctive Charm",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Enchantment",
                    "subclassSource": "PHB",
                    "level": 6,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 30,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Inured to Undeath",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Necromancy",
                    "subclassSource": "PHB",
                    "level": 10,
                    "entryData": {
                        "resist": [
                            "necrotic"
                        ]
                    }
                },
                {
                    "name": "Command Undead",
                    "source": "PHB",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Necromancy",
                    "subclassSource": "PHB",
                    "level": 14,
                    "system": {
                        "target.value": 1,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Training in War and Song (Bladesinging)",
                    "source": "TCE",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "Bladesinging",
                    "subclassSource": "TCE",
                    "level": 2,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "performance": true
                            }
                        ],
                        "armorProficiencies": [
                            {
                                "light": true
                            }
                        ],
                        "weaponProficiencies": [
                            {
                                "choose": {
                                    "fromFilter": "type=melee weapon|property=!two-handed|rarity=none"
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Deflecting Shroud",
                    "source": "XGE",
                    "className": "Wizard",
                    "classSource": "PHB",
                    "subclassShortName": "War",
                    "subclassSource": "XGE",
                    "level": 14,
                    "system": {
                        "target.value": 3,
                        "target.type": "creature",
                        "range.value": 60,
                        "range.units": "ft"
                    }
                },
                {
                    "name": "Tiger",
                    "source": "SCAG",
                    "className": "Barbarian",
                    "classSource": "SCAG",
                    "subclassShortName": "Totem Warrior",
                    "subclassSource": "PHB",
                    "level": 6,
                    "entryData": {
                        "skillProficiencies": [
                            {
                                "choose": {
                                    "from": [
                                        "athletics",
                                        "acrobatics",
                                        "stealth",
                                        "survival"
                                    ],
                                    "count": 2
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Tool Proficiency",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Alchemist",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "alchemist's supplies": true
                            },
                            {
                                "anyArtisansTool": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Chemical Mastery",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Alchemist",
                    "subclassSource": "TCE",
                    "level": 15,
                    "entryData": {
                        "resist": [
                            "acid",
                            "poison"
                        ],
                        "conditionImmune": [
                            "poisoned"
                        ]
                    }
                },
                {
                    "name": "Armor Model",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Armorer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "uses.value": null,
                        "uses.max": null,
                        "uses.per": null
                    }
                },
                {
                    "name": "Defensive Field",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Armorer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "actionType": "heal",
                        "damage.parts": [
                            [
                                "@classes.artificer.levels",
                                "temphp"
                            ]
                        ]
                    }
                },
                {
                    "name": "Lightning Launcher",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Armorer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "subEntities": {
                        "item": [
                            {
                                "name": "Lightning Launcher",
                                "source": "TCE",
                                "page": 15,
                                "srd": true,
                                "type": "R",
                                "rarity": "none",
                                "weaponCategory": "simple",
                                "dmg1": "1d6",
                                "dmgType": "L",
                                "range": "90/300",
                                "entries": [
                                    "This weapon is part of the Infiltrator armor model. When you attack with that weapon, you can add your Intelligence modifier, instead of Strength or Dexterity, to the attack and damage rolls.",
                                    "Once on each of your turns when you hit a creature with the launcher, you can deal an extra {@damage 1d6} lightning damage to that target."
                                ],
                                "foundrySystem": {
                                    "ability": "int"
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Powered Steps",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Armorer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "effects": [
                        {
                            "name": "Powered Steps",
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.attributes.movement.walk",
                                    "mode": "ADD",
                                    "value": "+ 5"
                                }
                            ],
                            "disabled": true
                        }
                    ]
                },
                {
                    "name": "Thunder Gauntlets",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Armorer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "subEntities": {
                        "item": [
                            {
                                "name": "Thunder Gauntlets",
                                "source": "TCE",
                                "page": 15,
                                "srd": true,
                                "type": "M",
                                "rarity": "none",
                                "weaponCategory": "simple",
                                "dmg1": "1d8",
                                "dmgType": "T",
                                "entries": [
                                    "This weapon is part of the Guardian armor model. When you attack with that weapon, you can add your Intelligence modifier, instead of Strength or Dexterity, to the attack and damage rolls.",
                                    "A creature hit by the gauntlet has disadvantage on attack rolls against targets other than you until the start of your next turn, as the armor magically emits a distracting pulse when the creature attacks someone else."
                                ],
                                "foundrySystem": {
                                    "ability": "int"
                                }
                            }
                        ]
                    }
                },
                {
                    "name": "Tools of the Trade",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Armorer",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "armorProficiencies": [
                            {
                                "heavy": true
                            }
                        ],
                        "toolProficiencies": [
                            {
                                "smith's tools": true
                            },
                            {
                                "anyArtisansTool": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Eldritch Cannon",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Artillerist",
                    "subclassSource": "TCE",
                    "level": 3,
                    "system": {
                        "damage.parts": [
                            [
                                "2d8",
                                "fire"
                            ],
                            [
                                "2d8",
                                "force"
                            ]
                        ],
                        "formula": "1d8 + @abilities.int.mod"
                    }
                },
                {
                    "name": "Tool Proficiency",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Artillerist",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "woodcarver's tools": true
                            },
                            {
                                "anyArtisansTool": 1
                            }
                        ]
                    }
                },
                {
                    "name": "Arcane Firearm",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Artillerist",
                    "subclassSource": "TCE",
                    "level": 5,
                    "effects": [
                        {
                            "transfer": true,
                            "changes": [
                                {
                                    "key": "data.bonuses.msak.damage",
                                    "mode": "ADD",
                                    "value": "+ 1d8"
                                },
                                {
                                    "key": "data.bonuses.rsak.damage",
                                    "mode": "ADD",
                                    "value": "+ 1d8"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "Battle Ready",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Battle Smith",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "weaponProficiencies": [
                            {
                                "martial": true
                            }
                        ]
                    }
                },
                {
                    "name": "Tool Proficiency",
                    "source": "TCE",
                    "className": "Artificer",
                    "classSource": "TCE",
                    "subclassShortName": "Battle Smith",
                    "subclassSource": "TCE",
                    "level": 3,
                    "entryData": {
                        "toolProficiencies": [
                            {
                                "smith's tools": true
                            },
                            {
                                "anyArtisansTool": 1
                            }
                        ]
                    }
                }
            ]
        }
        `;
        let parsed = JSON.parse(_foundry);
        return parsed;
    }
    static getClasses(){
        return ContentGetter._cachedData.class;
    }
    static getSubclasses(){
        return ContentGetter._cachedData.subclass;
    }
    static getRaces(filter=true){
        if(filter){return ContentGetter.getRaces(false).filter(f => !!f && !!f.name);}
        return ContentGetter._cachedData.race;
    }
    static getSubraces(filter=true){
        if(filter){return ContentGetter.getSubraces(false).filter(f => !!f && !!f.name);}
        return ContentGetter._cachedData.subrace;
    }
    static getBackgrounds(filter=true){
        if(filter){return ContentGetter.getBackgrounds(false).filter(f => !!f && !!f.name);}
        return ContentGetter._cachedData.background;
    }
    static getFeaturesFromClass(cls){
        return ContentGetter._cachedData.classFeature.filter(f => !!f && f.className == cls.name && f.classSource == cls.source);
    }
    static getFeaturesFromSubclass(sc){
        return this._cachedData.subclassFeature.filter(f =>
            f.className == sc.className &&
            f.classSource == sc.classSource &&
            f.subclassSource == sc.source &&
            f.subclassShortName == sc.shortName);
    }
    static getClassByNameAndSource(name, source) {
        return ContentGetter.getClasses().filter(cls => !!cls && cls.name == name && cls.source == source);
    }
    static getClassFeatureByUID(featureUID){
        const unpacked = ContentGetter.unpackUidClassFeature(featureUID);
        const foundClasses = this.getClassByNameAndSource(unpacked.className, unpacked.classSource);
        if(foundClasses.length<1){console.error("Did not find any classes with name and source ", unpacked.className, unpacked.classSource);}
        if(foundClasses.length>1){console.error("Found too many classes with name and source ", unpacked.className, unpacked.classSource);}
        const cls = foundClasses[0];
        const allFeatures = ContentGetter.getFeaturesFromClass(cls);
        return allFeatures.filter(f => f.name == unpacked.name && f.level == unpacked.level)[0];
    }
    static async _cookData(data){
        console.log("data", data);
        await ContentGetter.cookClassFeatures(data);
        await ContentGetter.cookSpellClasses(data);
    }
    /**Slightly parses the class features a bit to prepare them with loadeds, a property needed to convert them to option sets later. */
    static async cookClassFeatures(data){
        //Prep class feature info
        const isIgnoredLookup = {
            "elemental disciplines|monk||four elements||3":true,
            "fighting style|bard||swords|xge|3":true,
            "infusions known|artificer|tce|2":true,
            "maneuver options|fighter||battle master||3|tce":true,
            "maneuvers|fighter||battle master||3":true
        };
        
        const opts = {actor: null, isIgnoredLookup: isIgnoredLookup};
        
        for(let j = 0; j < data.class.length; ++j)
        {
            let cls = data.class[j];
            //Make sure the classFeatures aren't just strings, look like this:
            //{classFeature: "string"}
            for(let i = 0; i < cls.classFeatures.length; ++i){
            let f = cls.classFeatures[i];
            if (typeof f !== "object") {cls.classFeatures[i] = {classFeature: f};}
            }
    
            //Now we need to flesh out some more data about the class features, using just the UID we can get a lot of such info.
            //await (cls.classFeatures || []).pSerialAwaitMap(cf => ContentGetter.pInitClassFeatureLoadedsSync({...opts, classFeature: cf, className: cls.name}));
            await (cls.classFeatures || []).map(cf => ContentGetter.pInitClassFeatureLoadedsSync({...opts, classFeature: cf, className: cls.name}));

            if (cls.classFeatures) {cls.classFeatures = cls.classFeatures.filter(it => !it.isIgnored);}
            data.class[j] = cls;
    
            /* for (const sc of cls.subclasses || []) {
            await (sc.subclassFeatures || []).pSerialAwaitMap(scf => this.pInitSubclassFeatureLoadeds({...opts, subclassFeature: scf, className: cls.name, subclassName: sc.name}));
    
            if (sc.subclassFeatures) sc.subclassFeatures = sc.subclassFeatures.filter(it => !it.isIgnored);
        } */
        }
    }
    static async cookSpellClasses(data){
        const _SPELL_SOURCE_LOOKUP = await HelperFunctions.loadJSONFile(`data/generated/gendata-spell-source-lookup.json`);
        DataUtil.spell._SPELL_SOURCE_LOOKUP = _SPELL_SOURCE_LOOKUP;
        for(let i = 0; i < data.spell.length; ++i){
            data.spell[i] = DataUtil.spell._mutEntity(data.spell[i]);
        }
        console.log(data.spell[0]);
    }

    static SRC_PHB = "PHB";
    /**Takes a UID from a class feature (like Rage|Barbarian|1|PHB) and unpacks it into separate values. Returns name, className, classSource, level, source, displayText */
    static unpackUidClassFeature (uid, opts) {
        opts = opts || {};
        if (opts.isLower) uid = uid.toLowerCase();
        let [name, className, classSource, level, source, displayText] = uid.split("|").map(it => it.trim());
        classSource = classSource || (opts.isLower ? ContentGetter.SRC_PHB.toLowerCase() : ContentGetter.SRC_PHB);
        source = source || classSource;
        level = Number(level);
        return {
            name,
            className,
            classSource,
            level,
            source,
            displayText,
        };
    }
    static unpackUidSubclassFeature(uid, opts) {
        opts = opts || {};
        if (opts.isLower){uid = uid.toLowerCase();}
        let[name,className,classSource,subclassShortName,subclassSource,level,source,displayText] = uid.split("|").map(it=>it.trim());
        classSource = classSource || (opts.isLower ? ContentGetter.SRC_PHB.toLowerCase() : ContentGetter.SRC_PHB);
        subclassSource = subclassSource || (opts.isLower ? ContentGetter.SRC_PHB.toLowerCase() : ContentGetter.SRC_PHB);
        source = source || subclassSource;
        level = Number(level);
        return {
            name,
            className,
            classSource,
            subclassShortName,
            subclassSource,
            level,
            source,
            displayText,
        };
    }
    
    static getFeaturesGroupedByOptionsSet(allFeatures) {
        return allFeatures.map(topLevelFeature=>{
            const optionsSets = [];

            let optionsStack = [];
            let lastOptionsSetId = null;
            topLevelFeature.loadeds.forEach(l=>{
                const optionsSetId = MiscUtil.get(l, "optionsMeta", "setId") || null;
                if (lastOptionsSetId !== optionsSetId) {
                    if (optionsStack.length)
                        optionsSets.push(optionsStack);
                    optionsStack = [l];
                    lastOptionsSetId = optionsSetId;
                } else {
                    optionsStack.push(l);
                }
            }
            );
            if (optionsStack.length)
                optionsSets.push(optionsStack);

            return {
                topLevelFeature,
                optionsSets
            };
        }
        );
    }


    static async pInitClassFeatureLoadeds({classFeature, className, ...opts}) {
        if (typeof classFeature !== "object")
            throw new Error(`Expected an object of the form {classFeature: "<UID>"}`);

        const unpacked = MyDataUtil.unpackUidClassFeature(classFeature.classFeature);

        classFeature.hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

        const {name, level, source} = unpacked;
        classFeature.name = name;
        classFeature.level = level;
        classFeature.source = source;

        const entityRoot = ContentGetter.getClassFeatureByUID(classFeature.classFeature);
        /* const entityRoot = await DataLoader.pCacheAndGet("raw_classFeature", classFeature.source, classFeature.hash, {
            isCopy: true
        }); */
        const loadedRoot = {
            type: "classFeature",
            entity: entityRoot,
            page: "classFeature",
            source: classFeature.source,
            hash: classFeature.hash,
            className,
        };

       /*  const isIgnored = await this._pGetIgnoredAndApplySideData(entityRoot, "classFeature");
        if (isIgnored) {
            classFeature.isIgnored = true;
            return;
        }

        const {entityRoot: entityRootNxt, subLoadeds} = await this._pLoadSubEntries(this._getPostLoadWalker(), entityRoot, {
            ...opts,
            ancestorType: "classFeature",
            ancestorMeta: {
                _ancestorClassName: className,
            },
        }, );
        loadedRoot.entity = entityRootNxt;

        classFeature.loadeds = [loadedRoot, ...subLoadeds]; */
    }
    static pInitClassFeatureLoadedsSync({classFeature, className, ...opts}) {
        if (typeof classFeature !== "object")
            throw new Error(`Expected an object of the form {classFeature: "<UID>"}`);

        const unpacked = ContentGetter.unpackUidClassFeature(classFeature.classFeature);
        classFeature.hash = UrlUtil.URL_TO_HASH_BUILDER["classFeature"](unpacked);

        const {name, level, source, classSource, _className} = unpacked;
        classFeature.name = name;
        classFeature.level = level;
        classFeature.source = source;

        const entityRoot = ContentGetter.getClassFeatureByUID(classFeature.classFeature);
        /* const entityRoot = await DataLoader.pCacheAndGet("raw_classFeature", classFeature.source, classFeature.hash, {
            isCopy: true
        }); */
        const loadedRoot = {
            type: "classFeature",
            entity: entityRoot,
            page: "classFeature",
            source: classFeature.source,
            hash: classFeature.hash,
            className,
        };

       /*  const isIgnored = await this._pGetIgnoredAndApplySideData(entityRoot, "classFeature");
        if (isIgnored) { classFeature.isIgnored = true; return;}

        const {entityRoot: entityRootNxt, subLoadeds} = await this._pLoadSubEntries(this._getPostLoadWalker(), entityRoot, {
            ...opts,
            ancestorType: "classFeature",
            ancestorMeta: {
                _ancestorClassName: className,
            },
        }, );
        loadedRoot.entity = entityRootNxt;

        classFeature.loadeds = [loadedRoot, ...subLoadeds]; */

        //TEMPFIX
        //very lazy fix attempt
        const foundryData = ContentGetter._getFoundryData();
        //console.log("loadedroot", loadedRoot, classFeature);
        let _entryData = loadedRoot.entity.entryData; //Check if the entity has an 'entryData' object (contains info about the choices)
        if(!_entryData){
            //If no entryData exists, let's ask our foundry.json file if they know if this feature should have any entryData
            let foundryFeature = ContentGetter.getFoundryDataForFeature({name: name, level:level, source:source, className:_className, classSource:classSource}, foundryData);
            if(foundryFeature){ loadedRoot.entity.entryData = foundryFeature.entryData; }
        }
        classFeature.loadeds = [loadedRoot];
    }

    /**Deprecated */
    static addClassFeatureEntryDatas(features){
        //First we need to get the features to parse through
    /*  const filteredClassFeatures = MiscUtil.copy(ContentGetter.getFeaturesFromClass(curClass));
        const filteredSubclassFeatures = curSubclass == null? [] : MiscUtil.copy(ContentGetter.getFeaturesFromSubclass(curSubclass));
        
        //Might wanna sort this by level later
        let features = filteredClassFeatures.concat(filteredSubclassFeatures); */
        
        //Right now, the info for class feature choices is unfortunately stored in another JSON files
        //Brewed subclasses on 5eTools should contains this information (i.e. it has the 'entryData' component in the subclass feature)
        //Our base 5e SRD classes unfortunately do not have this information, that's why we need the foundry JSON
        const foundryData = ContentGetter._getFoundryData();
        for(let f of features)
        {
            let _entryData = f.entryData; //Check if the feature has an 'entryData' object (contains info about the choices)
            if(!_entryData){
                //If no entryData exists, let's ask our foundry.json file if they know if this feature should have any entryData
                let foundryFeature = ContentGetter.getFoundryDataForFeature(f, foundryData);
                if(foundryFeature){ _entryData = foundryFeature.entryData; }
            }
            //Maybe it was set during the previous if statement, check again
            if(_entryData){
                f.entryData = _entryData;
            }
        }
    }
    static getFoundryDataForFeature(feature, foundryData){
        const matchClass = false;
        const matchClassSource = false;
        const filtered = foundryData.classFeature.filter(f => 
            f.name == feature.name && f.level == feature.level
            && f.source == feature.source && 
            (!matchClass || f.className == feature.className) &&
            (!matchClassSource || f.classSource == feature.classSource));
        //Should only recieve one answer here
        if(filtered.length > 1){console.error("found too many entries");}
        //if(filtered.length < 1){console.log("Could not find foundry feature to match " + feature.name + "|" + feature.source); return null;} //Dont expect all classFeatures to be listed in here
        //if(filtered.length == 1){console.log("Found match for " + feature.name);}
        return filtered[0];
    }
}