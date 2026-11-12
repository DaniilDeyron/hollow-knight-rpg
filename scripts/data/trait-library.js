/**
 * Seed library for the core traits section (book v1.8, pp. 11–27).
 * Entries are data-only Items. Rules not representable by numeric modifiers
 * remain in their full descriptive text for the GM/player.
 */
const t = (id,name,category,hunger,description,options=[]) => ({
 id,name,category,hunger,description,options
});

export const HK_TRAIT_LIBRARY = [
 t("crushing-jaws","Дробящие челюсти","naturalWeapon",1,"Природное оружие: укус наносит 2 урона. Челюстями можно схватить цель, как конечностью.",[
  t("huge-jaws","Огромные челюсти","naturalWeapon",2,"Урон укуса увеличивается до 3; +2 к захвату и удержанию. Вес 1.",[{id:"exotic-poison-jaws",name:"Экзотический яд",category:"naturalWeapon",hunger:0,description:"Подчерта для атаки с отложенным уроном; обычный яд не повышает Голод, необычный повышает на 2."}])
 ]),
 t("irritating-bristles","Раздражающие щетинки","naturalWeapon",3,"+0.5 Привлекательность. При поражении атакой в пределах 3 клеток атакующий получает 3 очка статусного эффекта; можно атаковать щетинками в ближнем бою или на дальности 3."),
 t("natural-projectile","Природный снаряд","naturalWeapon",4,"Природное оружие типа «Праща»: 2 урона, дальность 4 клетки. Можно брать несколько раз с разными подчерчами.",[
  t("crippling-shot","Калечащий выстрел","naturalWeapon",0,"Вместо урона снижает выбранную характеристику, запас или скорость после проверки Панциря."),
  t("liquids","Жидкости","naturalWeapon",2,"Снаряд применяет эффект выбранной Склянки вместо обычного урона."),
  t("heavy-shot","Тяжёлый выстрел","naturalWeapon",0,"Снаряд наносит +1 урон и считается тяжёлым оружием."),
  t("blinding-shot","Ослепляющий выстрел","naturalWeapon",0,"Снаряд лишает выбранного чувства посредством дебаффа."),
  t("spray","Спрей","naturalWeapon",2,"Снаряд действует конусом и получает область действия.")
 ]),
 t("natural-excretions","Природные выделения","naturalWeapon",3,"+0.5 Жуть или Привлекательность. Выберите Склянку; выделения применяют её эффекты и взаимодействуют с окружающими клетками.",[
  t("excretion-trail","След выделений","naturalWeapon",3,"Оставляет след выделений на клетках, по которым проходит жук.")
 ]),
 t("natural-tool","Природный инструмент","naturalWeapon",1,"Часть тела или придаток используется как инструмент выбранной роли; качество 1."),
 t("claws","Острые когти","naturalWeapon",1,"Пальцы оканчиваются когтями, наносящими 1 урон; можно сочетать с оружием и ловкими действиями."),
 t("horn","Рог","naturalWeapon",2,"Природное оружие наносит 2 урона; первая успешная атака за раунд накладывает 1 стак Дисбаланса."),
 t("claws-arms","Руки-косы","naturalWeapon",0.5,"Обе руки заканчиваются косами — природное оружие с уроном 2; не позволяют выполнять ловкие задачи."),
 t("sharp-proboscis","Острый хоботок","naturalWeapon",1,"Игольчатый рот наносит 1 урон, обходит снижение урона брони; при Кровососе поглощает полную Сытость."),
 t("impact","Удар","naturalWeapon",2,"После движения к цели или прыжка можно атаковать ударом; урон зависит от размера: 2/3/4."),
 t("spiked","Шипастый","naturalWeapon",3,"+0.5 Жуть. Шипы наносят 2 урона и причиняют ответный урон при захвате или атаке природным оружием."),
 t("tentacle","Щупальце","naturalWeapon",1,"Длинное цепкое щупальце держит предметы, наносит 1 урон и позволяет захватывать на расстоянии."),
 t("venomous-bite","Ядовитый укус","naturalWeapon",1,"Укус наносит 1 урон и 2 отложенного урона; может сочетаться с природным оружием."),
 t("pincers","Клешни","naturalWeapon",1,"+0.5 Жуть. Пара природных клешней наносит 1 урон, даёт +2 к перебросам захвата и наносит 2 урона уже схваченным целям.",[
  t("huge-pincers","Огромные клешни","naturalWeapon",5,"Клешни наносят 3 урона, а схваченным целям — 4; −0.5 Привлекательность, +0.5 Жуть. Вес 1.")
 ]),
 t("gripping-tail","Цепкий хвост","naturalWeapon",2,"Хвост может удерживать предметы и помогать захватывать цели; при выборе усиливает природный хвост."),
 t("sting","Жало","naturalWeapon",2,"Природное оружие с жалом; при наличии соответствующего эффекта может наносить отложенный урон.",[
  t("exotic-poison","Экзотический яд","naturalWeapon",0,"Подчерта для подходящей атаки с отложенным уроном: яд заменяет обычный постепенный урон; необычный яд повышает Голод на 2."),
  t("paralyzing-poison","Парализующий яд","naturalWeapon",0,"Подчерта для подходящей атаки с отложенным уроном; вместо обычного ОУ накладывает стаки Парализующего яда.")
 ]),
 t("characteristic-bookworm","Книжный червь","characteristics",2,"Повышает Проницательность на 1, снижая Мощь или Панцирь на 1."),
 t("dazzling","Ослепительный","characteristics",1,"Повышает Привлекательность на 1; черту можно взять дважды."),
 t("dull","Тупой","characteristics",-3,"Снижает Проницательность на 1."),
 t("fragile","Хрупкий","characteristics",-3,"Снижает Панцирь на 1; можно взять дважды."),
 t("graceful","Грациозный","characteristics",2,"Повышает Грацию на 1; можно взять дважды."),
 t("heartful","Сердечный","characteristics",4,"Повышает максимум Сердца на 1."),
 t("frail","Немощный","characteristics",-4,"Уменьшает максимальное Сердце на 1."),
 t("insightful","Проницательный","characteristics",2,"Повышает Проницательность на 1; можно взять дважды."),
 t("mighty","Могучий","characteristics",2,"Повышает Мощь на 1; можно взять дважды."),
 t("slow","Медленный","characteristics",-2,"Снижает Скорость на 1."),
 t("weak","Слабый","characteristics",-3,"Снижает Мощь на 1; можно взять дважды."),
 t("clumsy","Неуклюжий","characteristics",-2,"Снижает Грацию на 1; можно взять дважды."),
 t("spooky","Жуткий","characteristics",1,"+1 Жуть."),
 t("scholar","Учёный","characteristics",2,"Повышает Проницательность до 4 до применения других модификаторов; бонус к социальным проверкам, требующим общения."),
 t("big-strike","Сильный удар","characteristics",2,"Повышает Мощь до 4 до применения других модификаторов; увеличивает вес."),
 t("disadvantaged","Обездоленный","mind",-2,"+0.5 Жуть. Требует меньше пищи для поддержания сытости."),
 t("civilized","Цивилизованный","mind",2,"Привык к комфорту; минимальные потери Сытости за отдых увеличены."),
 t("mean","Подлый","mind",1,"В отчаянном положении получает преимущества выживания."),
 t("collective-mind","Коллективный разум","mind",2,"Получает бонусы против целей, поражённых союзниками, и при совместной профессии."),
 t("talent","Талант","mind",2,"Выберите навык; при его использовании получаете бонус."),
 t("spoiled","Избалованный","mind",3,"Требует больше еды, но получает больше стартовых припасов."),
 t("phobia","Фобия","mind",0,"Выберите источник страха; столкновение требует проверки Проницательности."),
 t("brave","Отважный","mind",3,"Получает запас Отваги для переброса кубика после броска."),
 t("fermented","Большой желудок","physiological",2,"Способен сбраживать алкоголь и хранить брагу."),
 t("bloodheart","Живокровь","physiological",1,"Кровь обладает целебными свойствами и может давать Сердце Живокрови."),
 t("bloodsucker","Кровосос","physiological",2,"Питается свежей кровью, получая Сытость при успешном укусе."),
 t("herbivore","Травоядный","physiological",-2,"Питается растительной пищей."),
 t("hibernation","Спячка","physiological",3,"Может впадать в спячку; расход Сытости во время отдыха снижается."),
 t("carnivore","Плотоядный","physiological",2,"Плоть даёт полезную Сытость; иные виды пищи не подходят."),
 t("predator","Пожиратель","physiological",3,"Поглощение плоти разумного жука восстанавливает выбранный запас."),
 t("feathers","Оперение","physiological",2,"Тело покрыто перьями; повышает Привлекательность."),
 t("intimidating","Угрожающий","physiological",2,"Позволяет раскрыть устрашающие атрибуты и получить +1 Жуть."),
 t("molting","Линька","physiological",2,"Позволяет сбрасывать панцирь и восстанавливать его."),
 t("blind","Слепой","senses",-5,"Полностью лишён зрения.",[
  t("scent-blind","Чутьё","senses",4,"Может воспринимать окружающее по запаху."),
  t("vibration-blind","Чувство вибрации","senses",4,"Воспринимает окружающее через контакт с поверхностями.")
]),
 t("one-eye","Один глаз","senses",-1,"-1 к проверкам, зависящим от зрения."),
 t("poor-memory","Плохая память","senses",-1,"-1 к проверкам Лора."),
 t("clueless","Неумеха","senses",-1,"-1 к проверкам выбранного чувства/навыка."),
 t("regeneration","Регенерация","body",5,"Восстанавливает Сердце при отсутствии Сердец, расходуя Сытость; несовместима с Внешним панцирем."),
 t("vulnerability","Уязвимость","body",-6,"Выберите тип урона; при его получении получает дополнительный невпитываемый урон."),
 t("hauler","Жук-тягач","body",2,"Нагрузка увеличивается на 1."),
 t("exoskeleton","Внешний панцирь","body",3,"Панцирь является внешним предметом и имеет собственную прочность."),
 t("climbing","Карабкающийся","movement",2,"Двигается с полной скоростью при лазании и может карабкаться по потолку."),
 t("jumping","Прыгающий","movement",4,"За Выносливость совершает прыжок до 10 клеток; прыжок может заменить уклонение.",[
  t("raider","Налётчик","movement",2,"При приземлении после прыжка может совершить атаку.")
 ]),
 t("small-flight","Малый полёт","movement",4,"Может летать за Выносливость; для поддержания полёта тратит дополнительный ресурс.",[
  t("elytra","Надкрылья","movement",-3,"Крылья раскрываются действием Фокуса; пока раскрыты, Панцирь уменьшается на 1."),
  t("flight","Полёт","movement",4,"Полёт больше не требует приземления при расходе Выносливости или Души."),
  t("airborne","Воздушный","movement",0,"Наземная скорость −2, скорость полёта +2.")
 ]),
 t("swimming","Плавание","movement",2,"Двигается с полной скоростью в воде и не тонет в спокойной воде.",[
  t("underwater-breathing","Дыхание под водой","movement",2,"Может дышать под водой.")
 ]),
 t("tunneler","Туннельный змей","movement",5,"Прокапывает почву, создавая туннель; без воздуха под землёй страдает от Удушения."),
 t("water-strider","Водомерка","movement",3,"Ходит по поверхности жидкости, не погружаясь в неё."),
 t("blocking-arms","Блокирующие руки","naturalDefense",2,"Укреплённые конечности используются как щиты; качество зависит от Панциря.",[
  t("shell-arms","Руки-панцири","naturalDefense",4,"Массивные руки блокируют переднюю сторону тела и работают как панцирный щит.")
 ]),
 t("camouflage","Камуфляж","naturalDefense",1,"Выберите местность; получает +2 переброса к Скрытности в ней.",[
  t("active-camouflage","Активный камуфляж","naturalDefense",3,"Камуфляж адаптируется к любой окружающей среде.")
 ]),
 t("defensive-curl","Защитный клубок","naturalDefense",4,"Сворачивается в защитную позицию; до следующего хода Поглощение равно Панцирю.",[
  t("rolling-charge","Катящийся рывок","naturalDefense",3,"Перед завершением защитного клубка может прокатиться по прямой и атаковать.")
 ]),
 t("mimicry","Мимикрия","naturalDefense",2,"Может имитировать внешний вид объекта или другого типа жука."),
 t("poisonous","Ядовитый","naturalDefense",3,"Тело ядовито; укусивший получает статусный эффект; мясо несъедобно.",[
  t("toxic-blood","Токсичная кровь","naturalDefense",2,"Кровь наносит токсический эффект при контакте.")
 ])
];


// Additional core entries from the remaining book pages (v1.8, pp. 16–27).
HK_TRAIT_LIBRARY.push(
 t("dreamer","Мечтатель","characteristics",-2,"+0.5 Привлекательность. Штраф −2 кубика к проверкам Инициативы."),
 t("quick-minded","Увлечённый","characteristics",2,"+2 кубика к проверкам Инициативы."),
 t("sturdy","Крепкий","characteristics",2,"Панцирь увеличивается на 0.5; можно взять дважды."),
 t("fast","Быстрый","characteristics",2,"Скорость увеличивается на 1; можно взять дважды."),
 t("thin-grace","Тонкая грация","characteristics",1,"Перед другими модификаторами Грация повышается до 4, затем Мощь уменьшается на величину повышения."),
 t("wild","Дикий","mind",-5,"Проницательность и Душа уменьшаются на 1; минимальная потеря Сытости за отдых 5; доступны только природное оружие и инструменты."),
 t("toolologist","Инструментолог","mind",3,"Может использовать самодельное оружие и инструменты со штрафом −1 кубик."),
 t("alien-body","Чужеродное тело","physiological",-4,"До +2 Жути за равную потерю Привлекательности; лечение и зелья могут работать иначе."),
 t("autobrewing","Автоварка","physiological",2,"Во время отдыха производит порцию браги стоимостью 10 Сытости."),
 t("living-blood","Живокровь","physiological",1,"Кровь обладает целебными свойствами; другие жуки могут получать Сердца Живокрови."),
 t("carrion-eater","Падальщик","physiological",4,"+2 к сопротивлению передозировке; гнилая пища сохраняет Сытость; два кубика поиска припасов автоматически успешны."),
 t("silkworm","Шелкопряд","physiological",5,"Выпускает липкие нити; паутина удерживает противников и помогает пересекать пропасти."),
 t("song","Песнь","physiological",1,"Выберите успокаивающую или пугающую песню: она повышает Привлекательность или Жуть при взаимодействии со слышавшими её."),
 t("stench-cloud","Облако зловония","physiological",1,"Выпускает облако феромонов, мешающее другим существам ориентироваться по запаху."),
 t("facet-eyes","Фасеточное зрение","senses",4,"+1 переброс на визуальный поиск; дальность дальнобойной атаки увеличивается на 1 клетку."),
 t("dark-vision","Тёмное зрение","senses",2,"Видит в темноте как при освещении; глаза слабо светятся."),
 t("near-sighted","Близорукий","senses",-2,"Не видит дальше 10 клеток."),
 t("scent","Чутьё","senses",4,"Воспринимает окружающее по запаху; диапазон зависит от запахов поблизости."),
 t("vibration-sense","Чувство вибрации","senses",4,"Воспринимает существ через контакт с землёй, стеной или жидкостью."),
 t("incorporeal","Бесплотный","mystical",2,"+1 Жуть. Требует Панцирь 2 или выше; несовместим с Мягким телом. Особое проклятое происхождение меняет правила Поглощения."),
 t("pale-fluff","Бледный пух","mystical",3,"+0.5 Привлекательность. После отдыха восстанавливает 1 Душу или получает Душу Славы; чувствует духов и сильную магию."),
 t("soulmates","Родственные души","mystical",3,"Требует второго персонажа с этой чертой. Два жука делят общий Запас Души."),
 t("spiral-mark","Спиральная метка","mystical",4,"Мистический узор на панцире искажает магию; позволяет тратить Душу для защиты от магического урона."),
 t("small-size","Кроха","body",-2,"Очень маленький жук: занимает меньше места, может цепляться за крупных существ и имеет ограничения по оружию и природному урону."),
 t("limbless","Безногий","body",-2,"Нет ног; ползает, получает штраф к уклонению и Скорости, но устойчив к смещению."),
 t("one-arm","Одна рука","body",-4,"Имеет только одну руку и может держать один одноручный предмет; несовместим с Безруким."),
 t("soft-body","Мягкое тело","body",0,"Нет экзоскелета; +4 к максимуму Сердца, но Панцирь не добавляется к Впитыванию.",[
  t("outer-shell","Внешний панцирь","body",5,"Внешняя оболочка защищает мягкое тело; имеет собственное Поглощение и прочность.",[
   t("scavenger-shell","Скряга","body",2,"Может извлекать полезные мелкие предметы из внешнего панциря."),
   t("shell-thief","Похититель панциря","body",0,"Использует найденные панцири существ крупнее себя.")
  ])
 ]),
 t("legless-extra","Дополнительные ноги","body",3,"Одна или две дополнительные пары ног; +3 к сопротивлению сбиванию и +1 к максимальной Нагрузке."),
 t("extra-arms","Больше рук","body",4,"Имеет дополнительную пару функциональных рук."),
 t("extra-legs","Больше ног","body",3,"Имеет дополнительную пару ног и повышенную устойчивость."),
 t("stretching","Акробат","body",1,"Гибкое тело позволяет протискиваться в пространство для жука на размер меньше.",[
  t("stretching-form","Развёртывание","body",2,"Требует Большого жука; растягивает тело на четыре клетки.")
 ]),
 t("water-tail","Хвост-плавник","body",1,"Позволяет быстро двигаться в воде без штрафа к уклонению и даёт +3 к скорости плавания."),
 t("armless","Безрукий","body",-10,"У жука нет рук; он не может держать предметы или использовать действия, требующие рук."),
 t("natural-saddle","Природное седло","body",1,"Тело жука подходит для наездника; +2 к Нагрузке для перевозки пассажиров."),
 t("polypod","Полипод","body",3,"Много ног: жука нельзя сбить или сдвинуть, пока его полностью не поднимут; можно снизить Скорость на 1, чтобы игнорировать пересечённую местность."),
 t("fast-molt","Быстрая линька","physiological",4,"Тратит Сытость, чтобы быстро линять; во время линьки и три раунда после неё не добавляет Панцирь к Впитыванию."),
 t("osmotic-aid","Осмотическая помощь","physiological",2,"Этот жук и отдыхающие рядом с ним восстанавливают дополнительное Сердце за отдых."),
 t("pheromones","Феромоны","physiological",3,"Раз в сцену выпускает облако феромонов радиусом 5 клеток; скрывает присутствие от полагающихся на запах и усиливает социальные проверки."),
 t("digestion","Переваривание","physiological",2,"Во время отдыха преобразует Сытость в пищу, пригодную для других существ; Большой желудок увеличивает предел преобразования."),
 t("minor-flaw","Мелкий недостаток","mind",-1,"Выберите недостаток: −1 к навыку или характеристике; +0.5 Жути или Привлекательности. Можно брать несколько раз.",[
  t("one-eye-flaw","Один глаз","mind",0,"−1 к проверкам, зависящим от зрения; +0.5 Жути."),
  t("poor-memory-flaw","Плохая память","mind",0,"−1 к проверкам Лора."),
  t("clumsy-flaw","Неумеха","mind",0,"−1 к проверкам координации.")
 ]),
 t("outer-layer","Внешний слой","naturalDefense",2,"Внешний слой защищает от воздействия окружающей среды и части магического урона."),
 t("mimic","Мимикрия","naturalDefense",2,"Позволяет имитировать внешний вид объекта или другого вида жуков.")
);

export function flattenTraitLibrary(entries = HK_TRAIT_LIBRARY, parentId = "", depth = 0) {
 const output = [];
 for (const entry of entries) {
  output.push({ ...entry, parentId, kind: depth === 0 ? "main" : depth === 1 ? "subtrait" : "subtrait2" });
  output.push(...flattenTraitLibrary(entry.options ?? [], entry.id, depth + 1));
 }
 return output;
}


/** Numeric effects that can be applied directly by the character rules engine. */
export const HK_TRAIT_MODIFIERS = {
  "irritating-bristles": { cute: 0.5 },
  spiked: { spook: 0.5 },
  pincers: { spook: 0.5 },
  "huge-pincers": { cute: -0.5, spook: 0.5 },
  dazzling: { cute: 1 },
  dull: { insight: -1 },
  fragile: { shell: -1 },
  graceful: { grace: 1 },
  heartful: { heartMax: 1 },
  frail: { heartMax: -1 },
  insightful: { insight: 1 },
  mighty: { might: 1 },
  slow: { speed: -1 },
  weak: { might: -1 },
  clumsy: { grace: -1 },
  spooky: { spook: 1 },
  sturdy: { shell: 0.5 },
  fast: { speed: 1 },
  dreamer: { cute: 0.5 },
  intimidating: { spook: 1 },
  "incorporeal": { spook: 1 },
  "pale-fluff": { cute: 0.5 },
  "soft-body": { heartMax: 4 },
  wild: { insight: -1, soulMax: -1 },
  hauler: { carryingCapacity: 1 },
  "legless-extra": { carryingCapacity: 1 },
  "natural-saddle": { carryingCapacity: 2 },
  "one-eye-flaw": { spook: 0.5 }
};

export function getTraitModifiers(id) {
  return { ...(HK_TRAIT_MODIFIERS[id] ?? {}) };
}

export function buildTraitItemData(entry, parentId = "", slot = 0) {
  const modifiers = getTraitModifiers(entry.id);
  return {
    name: entry.name,
    type: "trait",
    img: "icons/svg/upgrade.svg",
    system: {
      kind: entry.kind,
      parentId,
      selected: true,
      libraryId: entry.id,
      parentLibraryId: entry.parentId ?? "",
      group: entry.category,
      slot,
      category: entry.category,
      hunger: Number(entry.hunger ?? 0),
      cute: Number(modifiers.cute ?? 0),
      spook: Number(modifiers.spook ?? 0),
      might: Number(modifiers.might ?? 0),
      insight: Number(modifiers.insight ?? 0),
      shell: Number(modifiers.shell ?? 0),
      grace: Number(modifiers.grace ?? 0),
      heartMax: Number(modifiers.heartMax ?? 0),
      staminaMax: Number(modifiers.staminaMax ?? 0),
      soulMax: Number(modifiers.soulMax ?? 0),
      satietyMax: Number(modifiers.satietyMax ?? 0),
      speed: Number(modifiers.speed ?? 0),
      carryingCapacity: Number(modifiers.carryingCapacity ?? 0),
      description: entry.description,
      effects: entry.description
    }
  };
}

const TRAIT_CATEGORY_LABELS = {
  naturalWeapon: "Природное оружие",
  characteristics: "Черты характеристик",
  mind: "Черты разума",
  physiological: "Физиологические черты",
  senses: "Черты чувств",
  mystical: "Мистические черты",
  body: "Черты тела",
  movement: "Черты движения",
  naturalDefense: "Черты природной защиты"
};

export function buildTraitLibraryGroups(actorItems = []) {
  const entries = flattenTraitLibrary();
  const byParent = new Map();
  for (const entry of entries) {
    const list = byParent.get(entry.parentId) ?? [];
    list.push(entry);
    byParent.set(entry.parentId, list);
  }
  const findActorItem = (entry, parentActorId = "") => actorItems.find((item) =>
    item.type === "trait" &&
    item.system?.libraryId === entry.id &&
    String(item.system?.parentId ?? "") === String(parentActorId)
  );
  const buildNode = (entry, parentActorId = "") => {
    const actorItem = findActorItem(entry, parentActorId);
    const existingCount = actorItems.filter((item) =>
      item.type === "trait" &&
      item.system?.libraryId === entry.id &&
      String(item.system?.parentId ?? "") === String(parentActorId)
    ).length;
    const repeatable = /можно (?:взять|брать) (?:дважды|несколько раз)/i.test(entry.description ?? "");
    const isMain = entry.kind === "main";
    const mainCount = actorItems.filter((item) => item.type === "trait" && item.system?.kind === "main").length;
    return {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      description: entry.description,
      hunger: Number(entry.hunger ?? 0),
      kind: entry.kind,
      kindLabel: isMain ? "Основная черта" : entry.kind === "subtrait" ? "Подчерта" : "Подчерта II",
      parentId: entry.parentId,
      actorItemId: actorItem?.id ?? "",
      added: Boolean(actorItem),
      canAdd: isMain
        ? (existingCount === 0 || (repeatable && existingCount < 2)) && mainCount < 7
        : Boolean(parentActorId) && (existingCount === 0 || (repeatable && existingCount < 2)),
      modifiers: getTraitModifiers(entry.id),
      children: (byParent.get(entry.id) ?? []).map((child) => buildNode(child, actorItem?.id ?? ""))
    };
  };

  return Object.entries(TRAIT_CATEGORY_LABELS).map(([id, label]) => ({
    id,
    label,
    items: (byParent.get("") ?? [])
      .filter((entry) => entry.category === id)
      .map((entry) => buildNode(entry))
  })).filter((group) => group.items.length > 0);
}
