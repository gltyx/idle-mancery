/*

 @name    : 锅巴汉化 - Web汉化插件
 @author  : 麦子、JAR、小蓝、好阳光的小锅巴
 @version : V0.6.1 - 2019-07-09
 @website : http://www.g8hh.com
 @idle games : http://www.gityx.com
 @QQ Group : 627141737

*/

//1.汉化杂项
var cnItems = {
    _OTHER_: [],

    //未分类：
    'Save': '保存',
    'Export': '导出',
    'Import': '导入',
    'Settings': '设置',
    'Achievements': '成就',
    'Statistics': '统计',
    'Changelog': '更新日志',
    'Hotkeys': '快捷键',
    'ALL': '全部',
    'Default': '默认',
    'AUTO': '自动',
    'default': '默认',
    "points": "点数",
    "Reset for +": "重置得到 + ",
    "Currently": "当前",
    "Effect": "效果",
    "Cost": "成本",
    "Goal:": "目标:",
    "Reward": "奖励",
    "Start": "开始",
    "Exit Early": "提前退出",
    "Finish": "完成",
    "Milestone Gotten!": "获得里程碑！",
    "Milestones": "里程碑",
    "Completed": "已完成",
    "Achievement Gotten!": "成就达成！",
    "You realized yourself laying on cold ground. You are trying to open your eyes, but each time you try you get astonished\n            by unbearable headache. You decided to lay another couple minutes trying to remember who you are and whats happened": "你意识到自己躺在冰冷的地面上。你试图睁开眼睛，但每次尝试都会被无法忍受的头痛惊呆。你决定再躺几分钟，试着记住你是谁，发生了什么事",
    "About": "关于",
    "Actions": "行动",
    "After trying in vain for a while you tried to stand up. A piercing pain grips your body, but you feel like you definitely \n            can't just give up and die in cold. You need to find some place to warm up and take some sleep.": "在徒劳的尝试了一段时间后，你试图站起来。 一阵刺骨的疼痛笼罩着你的身体，但你觉得你绝对不能就这样放弃而死在寒冷中。 你需要找个地方暖和一下，睡一觉。",
    "Cooldown:": "冷却：",
    "Costs:": "费用：",
    "Energy": "能量",
    "Fortunately you found some bonfire not such far away from where you awaken. You put some sticks to flame, and it started\n            burning with new power. Well, now you can take some rest": "幸运的是，你在离你醒来的地方不远的地方发现了一些篝火。 你把一些棍子点燃，它开始\n以新的力量燃烧。 好了，现在你可以休息一下了",
    "Gold": "黄金",
    "Idlemancery": "巫术放置",
    "Learning": "学习",
    "Locked": "未解锁",
    "No actions available": "没有可用的操作",
    "OK": "好的",
    "Perform \"Rest\" action 3 times. Note, all actions have some cooldowns, you cant use them too frequently": "执行“休息”动作 3 次。 注意，所有动作都有一些冷却时间，你不能太频繁地使用它们",
    "Produce:": "生产：",
    "Requirements:": "要求：",
    "Rest": "休息",
    "Shop": "商店",
    "Story": "故事",
    "Take some rest to recover energy": "休息一下，恢复能量",
    "Time spent:": "花费的时间：",
    "What's happened": "发生了什么",
    "A place where you can store some todos - allow actions automation": "您可以存储一些待办事项的地方 - 允许操作自动化",
    "Collapse": "收起",
    "Day by day passed": "一天天过去",
    "Do some work to earn some gold": "做一些工作来赚取一些金子",
    "Each level will boost your actions effiency by decreasing cooldowns by 1%": "每级都会通过减少 1% 的冷却时间来提高你的行动效率",
    "Each level will boost your actions effiency by increasing their output by 1%": "每级都会通过增加 1% 的输出来提高你的行动效率",
    "Expand": "展开",
    "Gymnastics manual": "体操手册",
    "Increase your max gold": "增加你的最大金币",
    "Initiative": "能动性",
    "Manual": "手动",
    "Manual that learns you how to be more efficient at physical training": "教你如何提高体能训练效率的手册",
    "Manual that learns you how to be more efficient at work": "教你如何提高工作效率的手册",
    "Notebook": "笔记本",
    "Perform \"Work\" action 10 times. Take some rest between work to recover your energy": "执行“工作”动作 10 次。工作之间休息一下，恢复能量",
    "Perseverance": "毅力",
    "Pocket": "口袋",
    "Purchase notebook from shop tab": "从商店选项卡购买笔记本",
    "Set energy spent": "设置能量消耗",
    "Work at stable": "在马厩工作",
    "XP": "经验值",
    "You almost get used to this all routine. Work - rest at rancho - work again. Couple weeks later you finally\n            was able to store some trace amount of gold.": "你几乎已经习惯了这一切例行公事。工作 - 在牧场休息 - 再次工作。几周后，你终于\n 能够储存一些微量的黄金。",
    "You awaken feeling hungry. You decided to look around for some fruit trees in nearby forest. But, everything you found is \n            some old apple tree. You picked some fruits, just to take your mind off the hunger.": "你醒来感到饥饿。你决定在附近的森林里四处寻找一些果树。但是，你发现的一切都是\n 一些老苹果树。你摘了一些水果，只是为了让你的注意力从饥饿中解脱出来。",
    "You feel hungry": "你觉得饿了",
    "You started feeling headake. You began to remember something. Bright light, flames around you.\n        You screaming out from unbearable pain.": "你开始感到头晕目眩。你开始记起某事。明亮的光线，在你周围燃烧。\n 你因无法忍受的痛苦而尖叫。",
    "Automated": "自动化",
    "Book of basic magic": "基础魔法书",
    "Do some athletics to increase energy regeneration": "做一些田径运动来增加能量再生",
    "First memories": "最初的记忆",
    "No purchases available": "没有可用的购买",
    "Perform physical training 50 times, and get 5 levels in initiative and perseverance (learning tab)": "进行 50 次体能训练，获得 5 级的能动性和毅力（学习选项卡）",
    "Train stamina": "训练耐力",
    "Unlocks mana end some basic spells": "解锁法力结束一些基本法术",
    "You returned at rancho where you used to live and work last few weeks. You taken your seat at the floor and opened\n            your newly purchased book. At the very first page you saw nothing but just two words - MIGHTY, MAGIC": "你回到了你过去几周生活和工作的牧场。 你在地板上坐下并打开了\n你新买的书。 在第一页你什么都没有看到，只有两个词——强大，魔法",
    "Each level will boost your spells output by 1%": "每级使您的法术输出提高 1%",
    "Each level will decrease mana costs by 1%": "每升一级，法力消耗减少 1%",
    "Energy orb": "能量球",
    "Expand gold storage": "扩大黄金存储",
    "Expansion spell": "扩张法术",
    "Increase": "增加",
    "Magic": "魔法",
    "Mana": "法力",
    "Mana effiency": "法力效率",
    "Meditate": "冥想",
    "Spend whole day on receiving magic forces": "花一整天的时间接受魔法力量",
    "After whole day spent doing something weird and useless you felt completely disappointed.": "在花了一整天做一些奇怪而无用的事情之后，你感到完全失望。",
    "Another weekend, another walk through settlement. Nothing was unusual, until you hears cough behind you.": "另一个周末，另一个穿过定居点。没有什么异常，直到你听到身后的咳嗽声。",
    "Earn 40 gold": "获得 40 金币",
    "First meet with magic": "第一次遇见魔法",
    "Further chapter describe some strange techniques for meditation. Next chapters are just empty... \n        Seems useless, but OK - you spent\n        your money that you earned such difficultly. So, it worth a try now.": "下一章描述了一些奇怪的冥想技巧。下一章只是空的... \n 看起来没用，但是没关系 - 你花了\n 你赚的钱太难了。所以，现在值得一试。",
    "It appeared to be some old house at not such far away from the crossroads. You stepped in, opened the door.": "似乎是离十字路口不远的一座老房子。你走进去，打开门。",
    "It seems to have some... well, spells? You readen one of them, and than some strange chest appeared next to you.\n        After couple seconds it just dissapeared. Well, maybe you can find something really useful here?": "它似乎有一些……嗯，咒语？你读了其中一个，然后一个奇怪的箱子出现在你旁边。\n几秒钟后它就消失了。好吧，也许你可以在这里找到一些真正有用的东西？",
    "Mysterious men": "神秘人",
    "Perform expansion spell and energy orb 5 times": "施展扩张法术和能量球 5 次",
    "Perform meditation 5 times": "冥想5次",
    "Purchase book of magic": "购买魔法书",
    "Salesman quietly stepped towards one of shelves and takes some old dusty book": "推销员悄悄地走向其中一个书架，拿了一些尘土飞扬的旧书",
    "Salesman: -- Oh, man, you won't regret. Just trust me!": "推销员：——哦，伙计，你不会后悔的。相信我！",
    "So, you earned 40 gold as price tag required. You followed address that was pointed at piece of paper": "因此，您获得了 40 金币作为所需的价格标签。您关注了指向一张纸的地址",
    "Some items in shop seems like not have obvious use, but you will need to purchase them to unlock new game content": "商店中的某些物品似乎没有明显用途，但您需要购买它们才能解锁新的游戏内容",
    "Spells are pretty powerful way to improve yourself, but they consume a lot mana. You can visit learning pageto improve their efficiency": "咒语是提高自己的强大方法，但会消耗大量法力。您可以访问学习页面以提高他们的效率",
    "Strange exercises": "奇怪的练习",
    "Strange man: -- Here it is. Give him your gold and take a book": "怪人：——来了。给他你的金子，拿一本书",
    "Strange man: -- Nevermind. Just take this.": "怪人：——没关系。就拿这个吧。",
    "Strange man: -- Oh, here you are! Okey, we need to give some good start to our newcomer.": "陌生人：——哦，你来了！好吧，我们需要给我们的新人一个好的开始。",
    "Strange man: -- You will get answer to your question soon, once you will be ready. For now you can call me your destiny.": "奇怪的人：——一旦你准备好了，你很快就会得到你的问题的答案。现在你可以称我为你的命运。",
    "Strange purchase": "奇怪的购买",
    "Well, you are doing well. You found job, you found place to leave. Rancho owner trust you, you keep earning more \n            and more. But feeling that you worth more keep teasing you.": "好吧，你做得很好。你找到了工作，你找到了离开的地方。牧场主信任您，您会不断赚取更多\n 和更多。但感觉你更有价值，不断取笑你。",
    "You can check shop anytime for any useful stuff that might help you to earn money. Also, keep do physical training. You'll need a lot energy in future": "您可以随时查看商店是否有任何可以帮助您赚钱的有用物品。另外，继续进行体能训练。未来你需要很多能量",
    "You opened book again, and suddenly circle on the first page started glowing. You tried to touch it,\n        and you felt some strange heat. You started turning pages, and OMG! You realized second chapter is no\n        longer empty!": "你再次翻开书，突然第一页上的圆圈开始发光。你试着去触摸它，\n你感觉到了一些奇怪的热度。你开始翻页了，天哪！你意识到第二章不再是空的了！",
    "You returned to your rancho. Ok, it's not yours :)": "你回到了你的牧场。好吧，这不是你的:)",
    "You taken your seat at the carpet on the ground, as usual, and opened book. At the first page there was nothing\n        but some strange black circle.": "你像往常一样坐在地上的地毯上，打开书本。在第一页，除了一些奇怪的黑色圆圈之外什么都没有。",
    "You turned around, and saw whole variety of strange things (like teeth necklaces, weird clothes other trinkets).\n        Finally, you saw the same strange man you talked before, speaking with another one, who looks like salesman": "你转身，看到了各种各样的奇怪的东西（比如牙齿项链，奇怪的衣服其他小饰品）。\n最后，你看到了你之前说话的那个奇怪的人，和另一个看起来像推销员的人说话",
    "You turned around... And, OMG! His cloak, his eyes... it is indeed the same man who you saw couple weeks ago \n        in the mirror. You asked the same question: \"Who are you?\"": "你转过身来……而且，天哪！他的斗篷，他的眼睛……确实是你几周前在镜子里看到的那个人。你问了同样的问题：“你是谁？”",
    "You: -- Newcomer? Start of what?": "你：—— 新人？什么开始？",
    "You: -- What in the name of God I am paying for?": "你：—— 我为上帝的名义付出了什么？",
    "You: -- What??? What are you talking about?": "你：—— 什么？？？你在说什么？",
    "Book of meditation": "冥想之书",
    "Copy to clipboard": "复制到剪贴板",
    "Download as file": "下载为文件",
    "Export game": "导出游戏存档",
    "Import game": "导入游戏存档",
    "Magic stamp": "魔法邮票",
    "Perform Energy Orb spell 10 times, physical training 125 times. Purchase magic stamp.": "施展能量珠法术 10 次，体能训练 125 次。 购买魔法印章。",
    "Provides ability to store more magic powers. +10 max mana, +25% spells power": "提供储存更多魔力的能力。 +10 最大法力，+25% 法术强度",
    "Purchase book full of usefull meditation techniques. Meditation takes twice as much energy but provides 2x mana.": "购买一本充满有用的冥想技巧的书。 冥想消耗两倍的能量，但提供 2 倍的法力。",
    "Salesman: -- Ok, I can learn you something. Give me your magic stamp.": "推销员：——好的，我可以教你一些东西。 给我你的魔法印章。",
    "Salesman: -- You came for more, right?": "推销员：——你来是为了更多，对吧？",
    "Slightly bored": "有点无聊",
    "You left the shop with strong feeling of disappointment. You have to work a lot and hard to purchase another\n        trinket! But, you must! You have to do this! Maybe...": "你带着强烈的失望情绪离开了商店。 您必须付出很多努力才能购买另一个\n 饰品！ 但是，你必须！ 你必须这样做！ 也许...",
    "You: -- I feel I am missing something. There should be more use for magic.": "你：——我觉得我错过了什么。 魔法应该有更多的用途。",
    "You: Silently starring at salesman with doubt": "你：默默盯着推销员疑惑",
    "And again, you should return to your rancho full of frustration.": "再说一次，你应该满怀沮丧地回到你的牧场。",
    "Another try": "再试一次",
    "Magic lessons": "魔法课",
    "Purchase time-management book that learn you to keep 2 actions auto-running": "购买时间管理书，让你学会保持 2 个动作自动运行",
    "Salesman: -- I want to show you how to extend your magic knowledge.": "推销员：——我想告诉你如何扩展你的魔法知识。",
    "Salesman: -- Well, now I can show you something": "推销员：——嗯，现在我可以给你看点东西",
    "Salesman: -- You are not ready yet.": "推销员：——你还没准备好。",
    "Take courses of magic": "参加魔术课程",
    "Take magic lessons 5 times.": "上魔法课5次。",
    "Time-management": "时间管理",
    "You may want to purchase Time-management book in shop to make progress more idle": "您可能想在商店购买时间管理书以使进度更加空闲",
    "You: -- But what about new spells?!": "你：——但是新法术呢？！",
    "You: -- Show me what?": "你：——给我看什么？",
    "Bargaging": "讨价还价",
    "Increase place for gold by 200": "增加黄金存储上限200",
    "Learn basics of bargaging - improve your gold earned by 2 per work action": "学习讨价还价的基础知识 - 每个工作动作将您的黄金提高 2",
    "Purchase a shovel to make your work even more efficient. Work takes 2 energy more but provides 2 more gold.": "购买一把铲子，让您的工作更有效率。 工作多消耗 2 能量，但提供 2 更多金币。",
    "Shovel": "铲子",
    "Stash": "藏匿",
    "Basic summoning": "基础召唤",
    "Purchase basic sumonning manual": "购买基础召唤手册",
    "Mana orb": "法术球",
    "Purchase orb that improves your meditation. Meditation takes 10 more energy but provide 1 more mana": "购买可以改善您的冥想的球体。 冥想多消耗 10 点能量，但提供多 1 点法力",
    "Have 500 gold. Purchase book of summoning": "拥有500金币。 购买召唤之书",
    "Now you exiting shop with full of enthusiasm. You know you should work hard, but you almost sure - that worth it!": "现在你满怀热情地离开商店。 你知道你应该努力工作，但你几乎可以肯定——这是值得的！",
    "Salesman silently token another dusty book": "推销员默默地令牌另一本尘土飞扬的书",
    "Salesman: -- Ok. Now I guess you ready.": "售货员：——好的。 现在我猜你准备好了。",
    "Salesman: -- Ready for true knowledge": "推销员：——为真正的知识做好准备",
    "Salesman: -- Wait, it's not for free. True knowledge should be deserved.": "推销员：——等等，这不是免费的。 真正的知识应该是值得的。",
    "True knowledge": "真正的知识",
    "You: -- Oh, finally! Thanks!": "你：——哦，终于！ 谢谢！",
    "You: -- Ready for what?": "你：——准备好做什么了吗？",
    "Amount per click:": "每次点击数量：",
    "Consume:": "消耗：",
    "Cost:": "成本：",
    "Creatures": "生物",
    "Dark Researcher": "黑暗研究员",
    "energy per second. When you run out of energy your creatures will disappear. Make sure you have enough energy production before spending precious souls.": "每秒能量。当你耗尽能量时，你的生物就会消失。在花费宝贵的灵魂之前，请确保您有足够的能量生产。",
    "Every creature consumes": "每个生物都会消耗",
    "Fighter": "战士",
    "First assistants": "第一助理",
    "Free workers:": "空闲工人：",
    "Have 5 supporters and 1 miner": "有5个支持者和1个矿工",
    "Herbalism": "草药学",
    "Mage": "法师",
    "max energy at least": "至少最大能量",
    "Miner": "矿工",
    "Navigate to creatures tab. Create at least one creature": "导航到生物选项卡。创造至少一个生物",
    "New Life": "新生活",
    "Not alone any longer": "不再孤单",
    "Purchase herbalism book to take advantages of flasks": "购买草药书以利用烧瓶",
    "Purchase knowledge of better soul harvesting": "购买更好的灵魂收割知识",
    "Purchase summoning jobs knowledge book to increase job effiency. +10% creature productions": "购买召唤职业知识书，提高工作效率。 +10% 生物产量",
    "Refine soul": "提炼灵魂",
    "Refine soul 4 times": "精炼灵魂4次",
    "Refines some mana to soul": "为灵魂提炼一些法力值",
    "Requires": "需要",
    "Salesman mumbled something quietly something. Wall behind him disappeared, and you saw stairs.": "推销员小声嘟囔着什么。他身后的墙消失了，你看到了楼梯。",
    "Salesman: -- Follow me.": "推销员：——跟我来。",
    "Salesman: -- Here is your new apartment": "推销员：——这是你的新公寓",
    "Salesman: -- Ok. So, from now you are part of our dark mages community.": "售货员：——好的。所以，从现在开始，你就是我们黑暗法师社区的一员。",
    "Salesman: -- Yes you! You can't keep living at rancho with other people. Let me show your new appartments.": "推销员：——是你！你不能继续和其他人一起住在牧场。让我展示你的新公寓。",
    "Soul harvester": "灵魂收割机",
    "Souls": "灵魂",
    "Summon (x": "召唤（x",
    "Summoning Jobs": "召唤工作",
    "   ": "支持者",
    "Total creatures:": "生物总数：",
    "Well, what they can do? You started turning pages in book. At last, you found it! You found a use for them! Now they can \n            do some jobs for you!": "那么，他们能做什么？你开始翻书。终于，你找到了！你找到了它们的用途！现在他们可以\n为你做一些工作！",
    "You: -- Apartment? Okey.": "你：——公寓？好的。",
    "You: -- Apartments? Well!": "你：——公寓？出色地！",
    "You: -- Me? Mage? Mages community?": "你我？法师？法师社区？",
    "Collect herbs": "收集草药",
    "Collect herbs as raw material for flasks": "收集草药作为烧瓶的原料",
    "Flasks": "烧瓶",
    "Herbalists stash": "草药师藏匿",
    "Herbs": "草药",
    "Make flasks": "制作烧瓶",
    "Make some flasks to improve creatures efficiency": "制作一些烧瓶以提高生物效率",
    "Purchase special container for herbs. +20 max herbs.": "购买草药的特殊容器。 +20 最大草药。",
    "Supporter": "支持者",
    "Advanced magic": "高级魔法",
    "Another day passed, your minions working hard together with you. You was just about to perform usual for you\n            soul harvest ritual, when door cracked, and you saw familiar silhouette.": "又一天过去了，你的手下和你一起努力工作。你刚要为你进行平常的灵魂收割仪式，门就裂开了，你看到了熟悉的身影。",
    "Breaking bad": "绝命毒师",
    "Each next flask provides less bonus than previous one. You can see bonus hovering over over them": "每个下一个烧瓶提供的奖励都比前一个少。您可以看到奖金悬停在它们上方",
    "Have at least 10 flasks": "至少有 10 个烧瓶",
    "Have at least 51 creature": "拥有至少 51 个生物",
    "Keep going for more": "继续前进",
    "Next morning you stepped into shop and saw two books that mage might have spoken about.": "第二天早上，你走进商店，看到了两本法师可能说过的书。",
    "Now you know the basics": "现在你知道了基础知识",
    "Purchase book that further increase your magic power by 50%": "购买可以进一步增加你的魔力50%的书",
    "Purchase herbalism and better summoning books": "购买草药学和更好的召唤书",
    "Strange man in cloak: -- Hey there. I see you doing well, yeah? Must be somewhat proud of yourself?": "披着斗篷的怪人：——嘿。我看你做得很好，是吗？一定有点为自己感到骄傲吗？",
    "Strange man in cloak: -- You shouldn't be so proud. It's only the very basics of what you actually capable if.\n        You should keep getting new knowledge.": "斗篷怪人：——你不应该这么骄傲。这只是你实际能力的基础知识。\n 你应该不断获得新知识。",
    "Than mage disappeared, left you confused. You left sitting for a while just thinking about what the hell did happened\n         just now.": "比法师消失了，让你一头雾水。你坐了一会儿，只是想着刚才到底发生了什么\n。",
    "You looked at book that you have almost read: -- What kind of knowledge? Where can I take it?": "您看了几乎读过的书： -- 什么样的知识？我可以把它带到哪里？",
    "You spent enough time boiling flasks. Seems like you still need more. More resources, more creatures, more might...": "你花了足够的时间煮烧瓶。看来你还需要更多。更多的资源，更多的生物，更多的力量……",
    "You: -- Smiled slightly": "你：——微微一笑",
    "Advanced soul harvester": "Advanced soul harvester",
    "Purchase book that further increase your souls gain": "购买进一步增加你的灵魂增益的书",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "Strange man in cloak: -- The one who is searching will always find. There are way much more books at shop. I haven't \n        seen you there for a while. When I was as young and inexperienced as you I spent whole days studying. You should learn more.\n        I'd suggest you starting with alchemy and improve your summoning skills. Trust me, you'll need them in future so much.": "斗篷怪人：——寻找的人总能找到。 商店里的书要多得多。 我已经有一段时间没有看到你了。 当我像你一样年轻和缺乏经验时，我整天都在学习。 你应该学习更多。\n我建议你从炼金术开始，提高你的召唤技能。 相信我，你将来会非常需要它们。",
    "Strange man in cloak performed some strange spell and turned dead rat on the floor into table full of delicious \n        cookies and fruits. You reached out to the grapes, but strange wizard spelled another strange combination of words,\n        and it turned into red hot coals. You screamed out from pain and throw it on the ground. Coals hit the floor, and\n        turned back into dead rat. You starring at the wizard in surprise": "披着斗篷的怪人施展了一些奇怪的咒语，把地板上的死老鼠变成了一桌美味的\n饼干和水果。 你伸手去拿葡萄，但奇怪的巫师拼出了另一个奇怪的单词组合，\n然后它变成了炽热的煤炭。 你痛苦地尖叫起来，把它扔在地上。 煤块掉到地板上，\n 又变成了死老鼠。 你惊讶地盯着巫师",
    "You sit down reading new herbalism book. You kinda bored turning page by page, hardly understanding\n    why you might need this all knowledge. And finally you found something - a recipe for some flask that should\n    make your minions more powerful. Yeah, that's indeed what you need": "你坐下来阅读新的草药学书。 你一页一页地翻页有点无聊，几乎不明白\n为什么你可能需要这些知识。 最后你找到了一些东西——一个烧瓶的配方，它可以\n让你的爪牙更强大。 是的，这确实是你需要的",
    "You keep reading book, full of enthusiasm. You performed some rituals, got some success. Your magic stamp\n            started glowing. According to book, now you can perform some ritual to summon some weird creatures.\n        What? You can summon some demons? Other mages? You definitely have to try it out!": "你继续看书，充满热情。 你做了一些仪式，取得了一些成功。 你的魔法印章\n开始发光。 根据书本，现在你可以进行一些仪式来召唤一些奇怪的生物。\n 什么？ 你可以召唤一些恶魔？ 其他法师？ 你一定要试试看！",
    "You followed salesman. After couple minutes walking through dark and wet cellar corridors a small door opened in front of you.\n        You see small room. Unbearable smell and dead rats surround you. You glanced at small bed in the corner.": "你跟着推销员。 在穿过黑暗潮湿的地窖走廊几分钟后，一扇小门在你面前打开了。\n 你看到了小房间。 难以忍受的气味和死老鼠围绕着你。 你瞥了一眼角落里的小床。",
    "You caught displeased look of salesman, but you don't care. You feel like you'd better stay at rancho. But, again,\n        you can become a mage! You set on bad and opened book. Full of mysterious rituals and spells. But ok, let's start from beginning.\n        You saw some strange rithual called \"Souls gathering\". You definitely want to try it.": "你看到了推销员不悦的眼神，但你不在乎。 你觉得你最好留在牧场。 但是，再次，\n你可以成为一名法师！ 你开始坏了，打开了书。 充满神秘的仪式和咒语。 但是，好吧，让我们从头开始。\n 你看到了一些奇怪的仪式，叫做“灵魂聚集”。 你肯定想试试。",
    "After trying to cast another spell, you got stricken by bright light. After couple seconds it disappeared and you see\n            nothing but small crooked skeleton. Well, not bad for first time. You tried to talk to your new creature - but nothing.\n            You feel you started getting more and more tired. Seems like this creature uses your energy to exist.": "在尝试施展另一个法术后，你被强光击中。 几秒钟后，它消失了，你只看到一个弯曲的小骷髅。 嗯，第一次还不错。 你试着和你的新生物说话——但什么也没有。\n你觉得你开始越来越累了。 看起来这个生物是利用你的能量存在的。",
    "Another week passed. You almost lost sense of time devoting all of you to work and training. Finally,\n            you feel yourself ready. You entered weird shop again, and purchased Magic Stamp. It looks like \n            regular one, by the way. Only difference is some strange symbols written on it. You standing at the shop\n            looking at your new purchase barely understanding why you are doing all this stuff.": "又一个星期过去了。 你几乎失去了把时间花在工作和培训上的感觉。 最后，\n 你觉得自己准备好了。 你又进了奇怪的商店，购买了魔法印章。 顺便说一句，它看起来像 \n 普通的。 唯一不同的是上面写着一些奇怪的符号。 你站在商店\n 看着你的新购买几乎不明白你为什么要做这些事情。",
    "Salesman: -- What? You still haven't it? That's unacceptable! You can do almost nothing without it. Well, I think I have one for you.\n                    But, it's not cheap. Once you purchase it I can help you improving your skills. Otherwise I can do nothing.": "售货员：——什么？ 你还没有吗？ 这是不可接受的！ 没有它，你几乎什么都做不了。 好吧，我想我有一个给你。\n 但是，它并不便宜。 一旦你购买它，我可以帮助你提高你的技能。 否则我什么也做不了。",
    "You spent couple weeks practicing and training. You almost get used to morning meditation rituals. \n            The only issue that makes you worried is that rancho owner started suspecting that something is \n            wrong with you.": "你花了几个星期练习和训练。 你几乎习惯了早晨的冥想仪式。 \n 唯一让你担心的问题是牧场主开始怀疑你有问题\n。",
    "After trying to cast another bunch of spells you realized that you get a little bored. There should be more use\n        for magic isn't it? You decided to walk to same shop where you purchased book. You opened old creaking doors and entered shop. \n         You saw familiar slightly smiling face of salesman.": "在尝试施放另一组咒语后，您意识到自己有点无聊。 魔术应该有更多用途，不是吗？ 你决定走到你买书的同一家商店。 你打开吱吱作响的旧门，走进商店。 \n 你看到了推销员熟悉的略带微笑的脸。",
    "Man gave you piece of paper and disappeared... You started thinking that you gone crazy. But wait, you still standing\n        on the crossroad, keeping piece of paper. You unfolded it and saw something looking like price tag - \"40 gold\", with address\n        written above. Well, you feel at least it worth a try, even if you faced just another swindler": "男人给了你一张纸然后消失了……你开始以为你疯了。 但是等等，你仍然站在十字路口，拿着一张纸。 你打开它，看到一个看起来像价格标签的东西——“40 金币”，上面写着地址\n。 嗯，你觉得至少值得一试，即使你面对的是另一个骗子",
    "Again silence. Eyes of person started glowing brighter. You started seeing a lot of dark silhouettes behind\n        a person. More and more of them. You started to walk back slowly. Finally one of silhouettes sticks a knife into\n        persons neck! A mysterious person falls and says in a hoarse voice - \"I should have been more careful\"\n        You screaming out: \"WHAT ARE YOU DOING?! HOLD THE MURDER!\"": "再次沉默。 人的眼睛开始发光。 你开始在一个人的身后看到很多黑暗的剪影。 他们越来越多。 你开始慢慢往回走。 最后一个人影把刀插进了\n人的脖子！ 一个神秘的人摔倒了，用嘶哑的声音说——“我应该更小心点”\n你尖叫道：“你在做什么？！抓住谋杀！”",
    "Physical training will give you some passive energy regeneration. After performing it couple times you can set itto automation and take some coffee, or keep clicking rest if you want things to go faster. Also, shop can have some helpfull items for you": "体育锻炼会给你一些被动的能量再生。 执行几次后，您可以将其设置为自动化并喝杯咖啡，或者如果您想让事情进展得更快，请继续点击休息。 此外，商店可以为您提供一些有用的物品",
    "You realized yourself laying on the floor once more, screaming. You hear the voice: \"You should take some rest.\" \n        You opened your eyes and see just rancho owner staying above you. You feel like you gone crazy, but than another feeling \n        overwhelms you - you should work hard. You should become better, stronger...": "你意识到自己再次躺在地板上，尖叫着。 你听到声音：“你应该休息一下。” \n 你睁开眼睛，看到只是牧场主站在你的上方。 你觉得自己疯了，但比另一种感觉 \n 压倒你 - 你应该努力工作。 你应该变得更好，更强...",
    "Wait! You didn't saw it was written here at the shop. Large mirror occurred in front of you. You see in the mirror\n        some strange person under black cloak. You asking quietly: \"Who are you?\". You got nothing but silence as an answer.\n        \"Who are you\" - you screamed out loudly.": "等等！ 你没有看到它是在商店里写的。 大镜子出现在你面前。 你在镜子里看到\n 一个穿着黑色斗篷的奇怪人。 你轻声问：“你是谁？”。 你得到的只有沉默作为答案。\n“你是谁”——你大声尖叫。",
    "You understand that you won't survive long in these cold and wet woods. After spending couple hours traveling you saw some settlement.\n             It appears much smaller than you thought at first glance, however it still appears to have a market filled with fresh meat, fish and vegetables. \n             Your stomach growls painfully, but you're broke!": "你知道你在这些又冷又湿的树林里活不了多久。 花了几个小时旅行后，您看到了一些定居点。\n 乍一看，它似乎比您想象的要小得多，但它似乎仍然有一个充满新鲜肉类、鱼类和蔬菜的市场。 \n你的肚子疼得咕咕叫，但你已经破产了！",
    "You realized yourself again laying on the floor. Several people standing around you annoying you with questions if you are\n        alright. You don't want to talk to them. You want just purchase this useless empty book and run away. You feel so helpless, \n        for no obvious reason for it.": "你意识到自己再次躺在地板上。 如果你没事的话，站在你周围的几个人会用问题来烦你。 你不想和他们说话。 你只想买这本没用的空书然后跑掉。 你感到很无助，\n没有明显的原因。",
    "While bargaging with one of local traders he suggested that you could work at his brothers ranch a small ways away from the settlement. \n        Salary isn't much but it'll get you a meal. Seeing your hunger, the trader gave you a baked chicken leg for free. \n        You ate it and began your trek towards the ranch stable.": "在与一位当地商人讨价还价时，他建议你可以在离定居点不远的他兄弟的牧场工作。 \n 薪水不多，但可以给你吃顿饭。 商人见你饿了，免费送你一只烤鸡腿。 \n 你吃了它，开始向牧场马厩跋涉。",
    "Rainy Saturday morning, you walking across market streets. Suddenly you noticed some accessories shop. You stepped \n        into. The eyes widen from the variety of all sorts of little and useless things. But, you found some book on one of\n        hundreds shelves. It seems empty, but...": "周六早上下雨，你穿过市场街道。 突然你注意到一些饰品店。 你踏入了\n。 各种各样的琐碎无用的东西睁大了眼睛。 但是，您在\n 数百个书架中的一个上发现了一些书。 好像是空的，但是...",
    // 图标代码，不能汉化
    "Jacorb's Games": "Jacorb's Games",
    "v0.0.3": "v0.0.3",
    "s": "s",
    "[": "[",
    "]": "]",
    "/": "/",
    "+": "+",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "By Jacorb90": "By Jacorb90",
    "content_copy": "content_copy",
    "library_books": "library_books",
    "discord": "discord",
    "drag_handle": "drag_handle",
    "edit": "edit",
    "forum": "forum",
    "content_paste": "content_paste",
    "delete": "delete",
    "info": "info",
    "settings": "settings",

    //树游戏
    'Loading...': '加载中...',
    'ALWAYS': '一直',
    'HARD RESET': '硬重置',
    'Export to clipboard': '导出到剪切板',
    'INCOMPLETE': '不完整',
    'HIDDEN': '隐藏',
    'AUTOMATION': '自动',
    'NEVER': '从不',
    'ON': '打开',
    'OFF': '关闭',
    'SHOWN': '显示',
    'Play Again': '再次游戏',
    'Keep Going': '继续',
    'The Modding Tree Discord': '模型树Discord',
    'You have': '你有',
    'It took you {{formatTime(player.timePlayed)}} to beat the game.': '花费了 {{formatTime(player.timePlayed)}} 时间去通关游戏.',
    'Congratulations! You have reached the end and beaten this game, but for now...': '恭喜你！ 您已经结束并通关了本游戏，但就目前而言...',
    'Main Prestige Tree server': '主声望树服务器',
    'Reach {{formatWhole(ENDGAME)}} to beat the game!': '达到 {{formatWhole(ENDGAME)}} 去通关游戏!',
    "Loading... (If this takes too long it means there was a serious error!": "正在加载...（如果这花费的时间太长，则表示存在严重错误！",
    'Loading... (If this takes too long it means there was a serious error!)←': '正在加载...（如果时间太长，则表示存在严重错误！）←',
    'Main\n\t\t\t\tPrestige Tree server': '主\n\t\t\t\t声望树服务器',
    'The Modding Tree\n\t\t\t\t\t\t\tDiscord': '模型树\n\t\t\t\t\t\t\tDiscord',
    'Please check the Discord to see if there are new content updates!': '请检查 Discord 以查看是否有新的内容更新！',
    'aqua': '水色',
    'AUTOMATION, INCOMPLETE': '自动化，不完整',
    'LAST, AUTO, INCOMPLETE': '最后，自动，不完整',
    'NONE': '无',
    'P: Reset for': 'P: 重置获得',
    'Git游戏': 'Git游戏',
    'QQ群号': 'QQ群号',
    'x': 'x',
    'QQ群号:': 'QQ群号:',
    '* 启用后台游戏': '* 启用后台游戏',
    '更多同类游戏:': '更多同类游戏:',
    '': '',
    '': '',
    '': '',

}


//需处理的前缀
var cnPrefix = {
    "\n": "\n",
    "                   ": "",
    "                  ": "",
    "                 ": "",
    "                ": "",
    "               ": "",
    "              ": "",
    "             ": "",
    "            ": "",
    "           ": "",
    "          ": "",
    "         ": "",
    "        ": "",
    "       ": "",
    "      ": "",
    "     ": "",
    "    ": "",
    "   ": "",
    "  ": "",
    " ": "",
    //树游戏
    "\t\t\t": "\t\t\t",
    "\n\n\t\t": "\n\n\t\t",
    "\n\t\t": "\n\t\t",
    "\t": "\t",
    "Show Milestones: ": "显示里程碑：",
    "Autosave: ": "自动保存: ",
    "Offline Prod: ": "离线生产: ",
    "Completed Challenges: ": "完成的挑战: ",
    "High-Quality Tree: ": "高质量树贴图: ",
    "Offline Time: ": "离线时间: ",
    "Theme: ": "主题: ",
    "Anti-Epilepsy Mode: ": "抗癫痫模式：",
    "In-line Exponent: ": "直列指数：",
    "Single-Tab Mode: ": "单标签模式：",
    "Time Played: ": "已玩时长：",
    "Shift-Click to Toggle Tooltips: ": "Shift-单击以切换工具提示：",
    "Income: ": "收益: ",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
}

//需处理的后缀
var cnPostfix = {
    "                   ": "",
    "                  ": "",
    "                 ": "",
    "                ": "",
    "               ": "",
    "              ": "",
    "             ": "",
    "            ": "",
    "           ": "",
    "          ": "",
    "         ": "",
    "        ": "",
    "       ": "",
    "      ": "",
    "     ": "",
    "    ": "",
    "   ": "",
    "  ": "  ",
    " ": " ",
    "\n": "\n",
    "\n\t\t\t": "\n\t\t\t",
    "\t\t\n\t\t": "\t\t\n\t\t",
    "\t\t\t\t": "\t\t\t\t",
    "\n\t\t": "\n\t\t",
    "\t": "\t",
    " / s": " / 秒",
    " energy/sec": " 能量/秒",
    " max energy": " 最大能量",
    " max gold": " 最大黄金",
    " max mana": "最大法力",
    " boost": " 提升",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
}

//需排除的，正则匹配
var cnExcludeWhole = [
    /^(\d+)$/,
    /^\s*$/, //纯空格
    /^([\d\.]+):([\d\.]+)$/,
    /^([\d\.]+):([\d\.]+):([\d\.]+)$/,
    /^([\d\.]+)\-([\d\.]+)\-([\d\.]+)$/,
    /^([\d\.]+)e(\d+)$/,
    /^([\d\.]+)$/,
    /^\(([\d\.]+)\/([\d\.]+)\)$/,
    /^收益(.+)$/,
    /^成本(.+)$/,
    /^\(([\d\.]+)\%\)$/,
    /^([\d\.]+):([\d\.]+):([\d\.]+)$/,
    /^([\d\.]+)K$/,
    /^([\d\.]+)M$/,
    /^([\d\.]+)B$/,
    /^([\d\.]+) K$/,
    /^([\d\.]+) M$/,
    /^([\d\.]+) B$/,
    /^([\d\.]+)s$/,
    /^([\d\.]+)x$/,
    /^x([\d\.]+)$/,
    /^X([\d\.]+)$/,
    /^([\d\.,]+)$/,
    /^\+([\d\.,]+)$/,
    /^\-([\d\.,]+)$/,
    /^([\d\.,]+)x$/,
    /^x([\d\.,]+)$/,
    /^([\d\.,]+) \/ ([\d\.,]+)$/,
    /^([\d\.]+)e([\d\.,]+)$/,
    /^e([\d\.]+)e([\d\.,]+)$/,
    /^x([\d\.]+)e([\d\.,]+)$/,
    /^([\d\.]+)e([\d\.,]+)x$/,
    /^[\u4E00-\u9FA5]+$/
];
var cnExcludePostfix = [
]

//正则替换，带数字的固定格式句子
//纯数字：(\d+)
//逗号：([\d\.,]+)
//小数点：([\d\.]+)
//原样输出的字段：(.+)
//换行加空格：\n(.+)
var cnRegReplace = new Map([
    [/^([\d\.]+) hours ([\d\.]+) minutes ([\d\.]+) seconds$/, '$1 小时 $2 分钟 $3 秒'],
    [/^You are gaining (.+) elves per second$/, '你每秒获得 $1 精灵'],
    [/^You have (.+) points$/, '你有 $1 点数'],
    [/^Next at (.+) points$/, '下一个在 $1 点数'],
	[/^([\d\.]+)\/sec$/, '$1\/秒'],
	[/^([\d\.,]+)\/sec$/, '$1\/秒'],
	[/^([\d\.,]+) OOMs\/sec$/, '$1 OOMs\/秒'],
	[/^([\d\.]+) OOMs\/sec$/, '$1 OOMs\/秒'],
	[/^([\d\.]+)e([\d\.,]+)\/sec$/, '$1e$2\/秒'],
    [/^requires ([\d\.]+) more research points$/, '需要$1个研究点'],
    [/^([\d\.]+)e([\d\.,]+) points$/, '$1e$2 点数'],
    [/^([\d\.]+) elves$/, '$1 精灵'],
    [/^([\d\.]+)d ([\d\.]+)h ([\d\.]+)m$/, '$1天 $2小时 $3分'],
    [/^([\d\.]+)e([\d\.,]+) elves$/, '$1e$2 精灵'],
    [/^([\d\.,]+) elves$/, '$1 精灵'],
    [/^\*(.+) to electricity gain$/, '\*$1 到电力增益'],
    [/^Cost: (.+) points$/, '成本：$1 点数'],
    [/^Req: (.+) elves$/, '要求：$1 精灵'],
    [/^Req: (.+) \/ (.+) elves$/, '要求：$1 \/ $2 精灵'],
    [/^Usages: (\d+)\/$/, '用途：$1\/'],
    [/^workers: (\d+)\/$/, '工人：$1\/'],

]);