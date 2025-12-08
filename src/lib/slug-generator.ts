// Slug generator for room names
// Format: {2-99}-{alcool}-{adjectif}-{complement}

const alcools = [
  'bieres', 'whisky', 'whiskys', 'vodkas', 'vodka', 'mojitos', 'mojito',
  'rhums', 'rhum', 'pastis', 'cognacs', 'cognac', 'champagnes', 'champagne',
  'vins', 'vin', 'cubis', 'tequilas', 'tequila', 'sangrias', 'sangria',
  'pintes', 'shooters', 'cocktails', 'absinthes', 'absinthe',
  'martinis', 'martini', 'margaritas', 'margarita', 'daiquiris', 'daiquiri',
  'calvados', 'armagnacs', 'armagnac', 'portos', 'porto', 'picons', 'picon',
  'grogs', 'grog', 'punchs', 'punch', 'citrons', 'citron', 'menthes', 'menthe',
  'cerises', 'cerise', 'prunes', 'prune', 'mirabelles', 'mirabelle',
  'kirschs', 'kirsch', 'genievres', 'genievre', 'chartreuses', 'chartreuse',
  'benedictines', 'benedictine', 'limoncello', 'limoncellos', 'grappa', 'grappas',
  'mescal', 'mescals', 'saké', 'sakés', 'caipirinhas', 'caipirinha'
]

const adjectifs = [
  'froids', 'chauds', 'frais', 'tiedes', 'glaces',
  'belges', 'bretons', 'corses', 'alsaciens', 'parisiens', 'marseillais',
  'normands', 'basques', 'gascons', 'bordelais', 'bourguignons',
  'russes', 'polonais', 'irlandais', 'ecossais', 'mexicains', 'cubains',
  'jamaicains', 'bresiliens', 'japonais', 'italiens', 'espagnols',
  'forts', 'legers', 'doux', 'amers', 'sucres', 'acides',
  'epices', 'parfumes', 'aromatises', 'fruites', 'floraux',
  'artisanaux', 'bio', 'premium', 'vintage', 'rares',
  'legendaires', 'mythiques', 'secrets', 'interdits', 'magiques',
  'explosifs', 'devastateurs', 'fatals', 'mortels', 'nucleaires',
  'cosmiques', 'galactiques', 'stellaires', 'lunaires', 'solaires',
  'plats', 'petillants', 'mousseux', 'gazeux', 'purs'
]

const complements = [
  'pour-se-bourrer-la-gueule',
  'qui-deboitent-les-neurones',
  'qu-on-affone-jusqu-a-la-derniere-goutte',
  'pour-surprendre-son-foie',
  'qui-vont-vous-mettre-bien',
  'pour-une-soiree-de-ouf',
  'qu-on-descend-cul-sec',
  'pour-finir-sous-la-table',
  'qui-font-tourner-la-tete',
  'pour-oublier-sa-semaine',
  'qu-on-regrette-le-lendemain',
  'pour-les-vrais-bonhommes',
  'qui-font-pleurer-les-anges',
  'pour-chauffer-les-coeurs',
  'qu-on-partage-entre-amis',
  'pour-feter-ca-dignement',
  'qui-donnent-des-ailes',
  'pour-voir-double',
  'qu-on-savoure-lentement',
  'pour-danser-sur-les-tables',
  'qui-reveillent-les-morts',
  'pour-briller-en-societe',
  'qu-on-sirote-au-soleil',
  'pour-noyer-son-chagrin',
  'qui-font-fondre-la-glace',
  'pour-enflammer-la-piste',
  'qu-on-boit-les-yeux-fermes',
  'pour-finir-en-beaute',
  'qui-laissent-des-souvenirs',
  'pour-commencer-la-fete'
]

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateRoomSlug(): string {
  const number = getRandomInt(2, 99)
  const alcool = getRandomElement(alcools)
  const adjectif = getRandomElement(adjectifs)
  const complement = getRandomElement(complements)
  
  return `${number}-${alcool}-${adjectif}-${complement}`
}
