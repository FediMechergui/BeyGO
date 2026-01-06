const mongoose = require('mongoose');
require('dotenv').config();

const {
  Dynasty,
  Museum,
  Currency,
  Residence,
  Bey,
  Reward
} = require('../models');

// Image mappings for Beys (filename -> bey name matcher)
const beyImageMap = {
  'Romdhane Bey': 'Ramathan Bey.jfif',
  'Mourad 1st Bey': 'Murad I Bey.webp',
  'Hammouda Pacha Bey': 'Hammuda Pasha.jfif',
  'Mourad 2nd Bey': 'Murad II Bey.jfif',
  'Mohamed Bey El Mouradi': 'Mohamed Bey 1675.jpg',
  'Romdhane Bey II': 'Ramathan Bey.jfif',
  'Mourad 3rd Bey': 'Murad III Bey.jfif',
  'Ibrahim Cherif': 'Ibrahim Sherif.jpg',
  'Hussein 1st Bey': 'Al-Husayn I ibn Ali - Founder of Husainid Dynasty.jfif',
  'Ali 1st Pacha': 'Ali I Pasha.jpg',
  'Mohamed Rachid Bey': 'Muhammad I Rashid.jfif',
  'Ali 2nd Bey': 'Ali II Bey.jfif',
  'Hammouda Pacha II': 'Hammuda II.jfif',
  'Osman Bey': 'Othman Bey.jfif',
  'Mahmoud Bey': 'Mahmud Bey.jpg',
  'Hussein 2nd Bey': 'Husayn II.jfif',
  'Moustapha Bey': 'Mustafa Bey.jfif',
  'Ahmed 1st Bey': 'Ahmad I Bey.jfif',
  'Mohammed Bey': 'Muhammed II Bey.jpg',
  'Sadok Bey': 'Muhammad III Sadok.jpg',
  'Ali 3rd Bey': 'Ali III Bey.jfif',
  'Hédi Bey': 'Muhammad IV Hedi.jfif',
  'Naceur Bey': 'Muhammad V Nacer.jfif',
  'Habib Bey': 'Muhammad VI Habib.jfif',
  'Ahmed 2nd Bey': 'Ahmad II Bey.jfif',
  'Moncef Bey': 'Muhammad VII Moncef.jfif',
  'Lamine Bey': 'Muhammad VIII Lamine.jfif'
};

// Image mappings for Museums
const museumImageMap = {
  'National Bardo Museum': 'Bardo Museum.jfif',
  'Currency Museum of Tunisia': 'Currency Museum.jfif',
  'National Military Museum': 'Military Museum.jfif',
  'Dar Ben Abdallah Museum': 'Dar Ben Abdallah Museum.jfif'
};

// Dynasty data
const dynastiesData = [
  {
    name: 'MOURADITE',
    displayName: 'Mouradite Dynasty',
    description: 'The first Beylical dynasty of Tunisia, established in 1593 by Romdhane Bey. The Mouradites ruled during a period of relative autonomy from the Ottoman Empire, building fortifications and defending against Spanish threats.',
    startYear: 1593,
    endYear: 1705,
    founder: 'Romdhane Bey',
    capitalCity: 'Tunis',
    color: '#8B4513'
  },
  {
    name: 'HUSSEINITE',
    displayName: 'Husseinite Dynasty',
    description: 'The second and final Beylical dynasty, founded by Hussein I Bey in 1705. The Husseinites modernized Tunisia, abolished slavery, and promulgated the first constitution in the Arab world before the French protectorate in 1881.',
    startYear: 1705,
    endYear: 1957,
    founder: 'Hussein I Bey',
    capitalCity: 'Tunis',
    color: '#1E3A5F'
  }
];

// Museum data with coordinates for Tunis area
const museumsData = [
  {
    name: 'National Bardo Museum',
    description: 'One of the most important museums in the Mediterranean region, housing an exceptional collection of Roman mosaics along with artifacts from the Beylical era.',
    location: {
      address: 'Le Bardo, Tunis',
      city: 'Tunis',
      coordinates: {
        latitude: 36.8089,
        longitude: 10.1344
      },
      radius: 150
    },
    focus: 'Roman History & Beylical Era',
    isUNESCO: false,
    arHotspots: [
      { name: 'Main Hall Entrance', puzzlePieceIndex: 0, floor: 0 },
      { name: 'Mosaic Gallery East', puzzlePieceIndex: 1, floor: 0 },
      { name: 'Mosaic Gallery West', puzzlePieceIndex: 2, floor: 0 },
      { name: 'Beylical Room', puzzlePieceIndex: 3, floor: 1 },
      { name: 'Ottoman Hall', puzzlePieceIndex: 4, floor: 1 },
      { name: 'Central Courtyard', puzzlePieceIndex: 5, floor: 0 },
      { name: 'Islamic Art Wing', puzzlePieceIndex: 6, floor: 1 },
      { name: 'Numismatic Section', puzzlePieceIndex: 7, floor: 1 },
      { name: 'Royal Artifacts Room', puzzlePieceIndex: 8, floor: 2 }
    ]
  },
  {
    name: 'Currency Museum of Tunisia',
    description: 'A specialized museum dedicated to the monetary history of Tunisia, featuring coins and currency from the Beylical period.',
    location: {
      address: 'Central Bank of Tunisia, Tunis',
      city: 'Tunis',
      coordinates: {
        latitude: 36.7992,
        longitude: 10.1802
      },
      radius: 100
    },
    focus: 'Numismatics & Economic History',
    isUNESCO: false,
    arHotspots: [
      { name: 'Entrance Gallery', puzzlePieceIndex: 0, floor: 0 },
      { name: 'Ottoman Currency Room', puzzlePieceIndex: 1, floor: 0 },
      { name: 'Mouradite Collection', puzzlePieceIndex: 2, floor: 0 },
      { name: 'Husseinite Collection', puzzlePieceIndex: 3, floor: 0 },
      { name: 'Gold Coin Display', puzzlePieceIndex: 4, floor: 1 },
      { name: 'Silver Coin Display', puzzlePieceIndex: 5, floor: 1 },
      { name: 'Modern Era Wing', puzzlePieceIndex: 6, floor: 1 },
      { name: 'Interactive Zone', puzzlePieceIndex: 7, floor: 0 },
      { name: 'Special Exhibitions', puzzlePieceIndex: 8, floor: 1 }
    ]
  },
  {
    name: 'National Military Museum',
    description: 'Located in the Palais de la Rose, this museum showcases Tunisia\'s military history including artifacts from the Beylical era.',
    location: {
      address: 'La Manouba, Tunis',
      city: 'Tunis',
      coordinates: {
        latitude: 36.8103,
        longitude: 10.0989
      },
      radius: 120
    },
    focus: 'Military History',
    isUNESCO: false,
    arHotspots: [
      { name: 'Arsenal Room', puzzlePieceIndex: 0, floor: 0 },
      { name: 'Weapons Gallery', puzzlePieceIndex: 1, floor: 0 },
      { name: 'Naval Section', puzzlePieceIndex: 2, floor: 0 },
      { name: 'Uniforms Display', puzzlePieceIndex: 3, floor: 1 },
      { name: 'Battle Maps Room', puzzlePieceIndex: 4, floor: 1 },
      { name: 'Commanders Hall', puzzlePieceIndex: 5, floor: 1 },
      { name: 'Fortress Models', puzzlePieceIndex: 6, floor: 0 },
      { name: 'Document Archives', puzzlePieceIndex: 7, floor: 2 },
      { name: 'Victory Hall', puzzlePieceIndex: 8, floor: 2 }
    ]
  },
  {
    name: 'Dar Ben Abdallah Museum',
    description: 'A traditional Tunisian palace converted into a museum of arts and popular traditions, showcasing daily life during the Beylical period.',
    location: {
      address: 'Medina of Tunis',
      city: 'Tunis',
      coordinates: {
        latitude: 36.7989,
        longitude: 10.1689
      },
      radius: 80
    },
    focus: 'Arts & Popular Traditions',
    isUNESCO: true,
    arHotspots: [
      { name: 'Main Courtyard', puzzlePieceIndex: 0, floor: 0 },
      { name: 'Reception Hall', puzzlePieceIndex: 1, floor: 0 },
      { name: 'Women\'s Quarter', puzzlePieceIndex: 2, floor: 1 },
      { name: 'Kitchen Display', puzzlePieceIndex: 3, floor: 0 },
      { name: 'Textile Room', puzzlePieceIndex: 4, floor: 1 },
      { name: 'Jewelry Display', puzzlePieceIndex: 5, floor: 1 },
      { name: 'Ceramic Collection', puzzlePieceIndex: 6, floor: 0 },
      { name: 'Wedding Traditions', puzzlePieceIndex: 7, floor: 1 },
      { name: 'Garden Pavilion', puzzlePieceIndex: 8, floor: 0 }
    ]
  }
];

// Currency data
const currenciesData = [
  {
    name: 'Ottoman Piastre',
    displayName: 'Ottoman Piastre (Kuruş)',
    period: { start: 1593, end: 1705 },
    description: 'The main currency used during the Mouradite dynasty, minted with Ottoman standards.',
    material: 'silver'
  },
  {
    name: 'Budshuq',
    displayName: 'Budshuq (Gold)',
    period: { start: 1705, end: 1782 },
    description: 'Gold currency introduced during the early Husseinite period.',
    material: 'gold'
  },
  {
    name: 'Rigoun',
    displayName: 'Rigoun',
    period: { start: 1782, end: 1837 },
    description: 'Silver-based currency that replaced the Budshuq system.',
    material: 'silver'
  },
  {
    name: 'Proto-franc',
    displayName: 'Proto-Franc',
    period: { start: 1835, end: 1837 },
    description: 'Transitional currency before the introduction of the Tunisian Franc.',
    material: 'mixed'
  },
  {
    name: 'Tunisian Franc',
    displayName: 'Tunisian Franc',
    period: { start: 1837, end: 1958 },
    description: 'Modern currency introduced during Ahmed I Bey\'s reforms.',
    material: 'mixed'
  }
];

// Beys data from CSV
const beysData = [
  {
    name: 'Romdhane Bey',
    fullTitle: 'Romdhane Bey',
    reignDuration: '20 years',
    reignStart: 1593,
    reignEnd: 1613,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From military, first Ottoman-appointed Bey officer'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Established independent Bey title in 1593, breaking direct Ottoman control',
      'Built early fortifications against Spanish threats in the 1600s'
    ],
    worstEvents: [
      'Faced internal tribal revolts from 1605-1610 that weakened central authority'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit; sometimes 20% discount in coffee near museum',
    reignEndMessage: 'You found the Bey! Romdhane Bey died naturally at old age in 1613 after 20 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 100
  },
  {
    name: 'Mourad 1st Bey',
    fullTitle: 'Mourad I Bey',
    reignDuration: '18 years',
    reignStart: 1613,
    reignEnd: 1631,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From military, Albanian soldier succeeding Romdhane'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Founded the stable Mouradite dynasty in 1613 as its defining ruler',
      'Successfully defeated major Spanish invasions in 1624, securing coasts'
    ],
    worstEvents: [
      'Suppressed corsair rebellions in La Goulette from 1627-1630 amid economic unrest'
    ],
    primaryMuseumName: 'Currency Museum of Tunisia',
    otherMuseumNames: ['National Bardo Museum'],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Mourad 1st Bey was assassinated by rebellious military rivals in June 1631 after 18 years of rule.',
    reignEndType: 'assassination',
    pointsValue: 100
  },
  {
    name: 'Hammouda Pacha Bey',
    fullTitle: 'Hammouda Pacha Bey',
    reignDuration: '35 years',
    reignStart: 1631,
    reignEnd: 1666,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Mourad I'
    },
    residenceName: 'Dar El Bey, Kasbah',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Greatly expanded Kasbah defenses in the 1630s for better protection',
      'Achieved naval victories over Malta knights in 1655, boosting prestige'
    ],
    worstEvents: [
      'Engaged in prolonged succession wars with brothers during the 1660s'
    ],
    primaryMuseumName: 'National Military Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit; sometimes discount in coffee near museum',
    reignEndMessage: 'You found the Bey! Hammouda Pacha Bey died naturally from advanced age in 1666 after 35 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 150
  },
  {
    name: 'Mourad 2nd Bey',
    fullTitle: 'Mourad II Bey',
    reignDuration: '9 years',
    reignStart: 1666,
    reignEnd: 1675,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From military, brother of Hammouda Pacha Bey'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Stabilized the regime immediately after civil wars in 1666',
      'Forged key tribal alliances around 1670 to consolidate inland control'
    ],
    worstEvents: [
      'Ordered executions of family rivals from 1672-1675, sparking resentment'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Mourad 2nd Bey was overthrown and executed by rebel factions in 1675 after 9 years of rule.',
    reignEndType: 'deposed',
    pointsValue: 100
  },
  {
    name: 'Mohamed Bey El Mouradi',
    fullTitle: 'Mohamed Bey El Mouradi',
    reignDuration: '21 years',
    reignStart: 1675,
    reignEnd: 1696,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From family, brother of Hammouda Pacha Bey'
    },
    residenceName: 'Dar El Bey + Bardo Palace',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Negotiated power-sharing pact with brother Ali in 1675 for temporary stability',
      'Oversaw major infrastructure builds like palaces in the 1680s'
    ],
    worstEvents: [
      'Escalated fratricidal civil war throughout the 1690s, dividing the dynasty'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit; sometimes 10% discount in Medina handicrafts',
    reignEndMessage: 'You found the Bey! Mohamed Bey El Mouradi died naturally amid unresolved civil war in 1696 after 21 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 120
  },
  {
    name: 'Romdhane Bey II',
    fullTitle: 'Romdhane Bey (Second)',
    reignDuration: '3 years',
    reignStart: 1696,
    reignEnd: 1699,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From military, distant Mouradite clan relative'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Introduced brief but effective tax reforms in 1696 to refill treasuries',
      'Negotiated short-lived peace treaty with Algiers in 1698'
    ],
    worstEvents: [
      'Overthrown by coup from Mourad III supporters in 1699'
    ],
    primaryMuseumName: 'Currency Museum of Tunisia',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Romdhane Bey was deposed and exiled by Mourad III\'s coup in 1699 after 3 years of rule.',
    reignEndType: 'deposed',
    pointsValue: 80
  },
  {
    name: 'Mourad 3rd Bey',
    fullTitle: 'Mourad III Bey',
    reignDuration: '3 years',
    reignStart: 1699,
    reignEnd: 1702,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From family, lineal descendant of Mourad I line'
    },
    residenceName: 'Dar El Bey + Abdelliya Palace, La Marsa',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Secured tribal pacts for internal stability right after taking power in 1699',
      'Launched successful anti-Algerian military campaigns in 1700-1701'
    ],
    worstEvents: [
      'Suffered decisive defeat by full Algerian invasion in 1702'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit; sometimes discount in coffee near museum',
    reignEndMessage: 'You found the Bey! Mourad 3rd Bey was killed in battle against Algerian forces in 1702 after 3 years of rule.',
    reignEndType: 'battle',
    pointsValue: 80
  },
  {
    name: 'Ibrahim Cherif',
    fullTitle: 'Ibrahim Cherif',
    reignDuration: '3 years',
    reignStart: 1702,
    reignEnd: 1705,
    dynastyName: 'MOURADITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From Ottoman administration, non-dynastic appointee'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Ottoman Piastre',
    bestEvents: [
      'Arranged smooth handover preparations to Hussein by 1705',
      'Implemented minor administrative reforms in 1703 for efficiency'
    ],
    worstEvents: [
      'Alienated local elites and tribes from 1704-1705, ending Mouradite era'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Ibrahim Cherif was deposed by Hussein\'s popular uprising in 1705 after 3 years of rule.',
    reignEndType: 'deposed',
    pointsValue: 80
  },
  {
    name: 'Hussein 1st Bey',
    fullTitle: 'Hussein I Bey',
    reignDuration: '30 years',
    reignStart: 1705,
    reignEnd: 1735,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'From military, Ottoman Turkish officer, dynasty founder'
    },
    residenceName: 'Dar El Bey + Abdelliya Palace, La Marsa',
    currencyName: 'Budshuq',
    bestEvents: [
      'Enacted hereditary succession law in 1710, founding Husseinite dynasty',
      'Constructed iconic Tourbet el-Bey mausoleum in the 1730s (Husseinite burial site in Tunis medina)'
    ],
    worstEvents: [
      'Suppressed major tribal and urban revolts from 1715-1725'
    ],
    primaryMuseumName: 'Dar Ben Abdallah Museum',
    otherMuseumNames: ['National Bardo Museum'],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Hussein 1st Bey died naturally after a 30-year founding reign in 1735.',
    reignEndType: 'natural_death',
    pointsValue: 150
  },
  {
    name: 'Ali 1st Pacha',
    fullTitle: 'Ali I Pacha',
    reignDuration: '21 years',
    reignStart: 1735,
    reignEnd: 1756,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Hussein I'
    },
    residenceName: 'Dar El Bey + Bardo Palace',
    currencyName: 'Budshuq',
    bestEvents: [
      'Oversaw trade boom with Europe throughout the prosperous 1740s',
      'Modernized navy with new ships around 1750 for better defense'
    ],
    worstEvents: [
      'Invaded and decapitated during Algerian military campaign in 1756'
    ],
    primaryMuseumName: 'National Military Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Ali 1st Pacha was decapitated by invading Algerian troops in 1756 after 21 years of rule.',
    reignEndType: 'battle',
    pointsValue: 120
  },
  {
    name: 'Mohamed Rachid Bey',
    fullTitle: 'Mohamed Rachid Bey',
    reignDuration: '3 years',
    reignStart: 1756,
    reignEnd: 1759,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'Grandson of Hussein I'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Budshuq',
    bestEvents: [
      'Attempted administrative centralization reforms starting in 1757'
    ],
    worstEvents: [
      'Assassinated by mutinous Janissaries in 1759 after short rule'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Mohamed Rachid Bey was assassinated by mutinous Janissaries in 1759 after 3 years of rule.',
    reignEndType: 'assassination',
    pointsValue: 80
  },
  {
    name: 'Ali 2nd Bey',
    fullTitle: 'Ali II Bey',
    reignDuration: '23 years',
    reignStart: 1759,
    reignEnd: 1782,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Hussein I'
    },
    residenceName: 'Dar El Bey + Tourbet el-Bey',
    currencyName: 'Budshuq',
    bestEvents: [
      'Established stable regency for son Hammouda starting in 1777',
      'Signed multiple peace treaties with neighbors in the 1770s'
    ],
    worstEvents: [
      'Faced repeated military pressures and raids from Algerians in the 1780s'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Ali 2nd Bey died naturally after stable 23-year rule in 1782.',
    reignEndType: 'natural_death',
    pointsValue: 120
  },
  {
    name: 'Hammouda Pacha',
    fullTitle: 'Hammouda Pacha Bey (Husseinite)',
    reignDuration: '32 years',
    reignStart: 1782,
    reignEnd: 1814,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Ali II'
    },
    residenceName: 'Dar El Bey + Palais de la Rose',
    currencyName: 'Rigoun',
    bestEvents: [
      'Maintained 32-year stability from 1782-1814, Tunisia\'s longest reign',
      'Broke harmful Venice trade monopoly in 1797 for economic gain'
    ],
    worstEvents: [
      'Became diplomatically isolated from Europe in the 1800s',
      'Involved in costly US Barbary War from 1801-1805'
    ],
    primaryMuseumName: 'National Military Museum',
    otherMuseumNames: ['Currency Museum of Tunisia'],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Hammouda Pacha died naturally after Tunisia\'s longest reign in 1814.',
    reignEndType: 'natural_death',
    pointsValue: 200
  },
  {
    name: 'Osman Bey',
    fullTitle: 'Osman Bey',
    reignDuration: '3 months',
    reignStart: 1814,
    reignEnd: 1814,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'Brother/relative of Hammouda Pacha'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Rigoun',
    bestEvents: [
      'Achieved rapid power consolidation upon taking throne in 1814'
    ],
    worstEvents: [
      'Swiftly overthrown after just 3 months of rule in 1814'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Osman Bey was deposed by Mahmoud Bey\'s quick coup in 1814 after 3 months of rule.',
    reignEndType: 'deposed',
    pointsValue: 60
  },
  {
    name: 'Mahmoud Bey',
    fullTitle: 'Mahmoud Bey',
    reignDuration: '10 years',
    reignStart: 1814,
    reignEnd: 1824,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'Brother of Hussein I, uncle line'
    },
    residenceName: 'Dar El Bey + Abdelliya Palace, La Marsa',
    currencyName: 'Rigoun',
    bestEvents: [
      'Reformed corsair fleet operations starting in 1815 for revenue',
      'Restructured national debt agreements around 1820'
    ],
    worstEvents: [
      'Granted unfavorable capitulation treaties to European powers in 1820s'
    ],
    primaryMuseumName: 'Currency Museum of Tunisia',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Mahmoud Bey died naturally after 10-year economic rule in 1824.',
    reignEndType: 'natural_death',
    pointsValue: 100
  },
  {
    name: 'Hussein 2nd Bey',
    fullTitle: 'Hussein II Bey',
    reignDuration: '11 years',
    reignStart: 1824,
    reignEnd: 1835,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Hammouda'
    },
    residenceName: 'Dar El Bey + Bardo Palace',
    currencyName: 'Rigoun',
    bestEvents: [
      'Signed beneficial trade pacts with Algeria in 1825',
      'Began early modernization projects around 1830'
    ],
    worstEvents: [
      'Accumulated massive public debt throughout the 1830s'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Hussein 2nd Bey died naturally from illness during reforms in 1835 after 11 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 100
  },
  {
    name: 'Moustapha Bey',
    fullTitle: 'Moustapha Bey',
    reignDuration: '2 years',
    reignStart: 1835,
    reignEnd: 1837,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'Brother of Hussein 2nd Bey'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Proto-franc',
    bestEvents: [
      'Reorganized army structure and training in 1836'
    ],
    worstEvents: [
      'Deposed by uncles and family rivals in 1837'
    ],
    primaryMuseumName: 'National Military Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Moustapha Bey was deposed by family-led military coup in 1837 after 2 years of rule.',
    reignEndType: 'deposed',
    pointsValue: 70
  },
  {
    name: 'Ahmed 1st Bey',
    fullTitle: 'Ahmed I Bey',
    reignDuration: '18 years',
    reignStart: 1837,
    reignEnd: 1855,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Mahmoud'
    },
    residenceName: 'Dar El Bey + Hammam Lif Palace',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Abolished black slavery across Tunisia in 1846',
      'Implemented Nizam military reforms in the 1840s'
    ],
    worstEvents: [
      'Signed capitulation treaties conceding rights to Europe in 1850s'
    ],
    primaryMuseumName: 'Dar Ben Abdallah Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Ahmed 1st Bey died naturally after major social reforms in 1855.',
    reignEndType: 'natural_death',
    pointsValue: 150
  },
  {
    name: 'Mohammed Bey',
    fullTitle: 'Mohammed Bey',
    reignDuration: '4 years',
    reignStart: 1855,
    reignEnd: 1859,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Ahmed I'
    },
    residenceName: 'Bardo Palace',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Issued religious tolerance edict in 1856 for minorities',
      'Prepared groundwork for constitution from 1857-1859'
    ],
    worstEvents: [
      'Triggered severe bankruptcy crisis in 1858'
    ],
    primaryMuseumName: 'Currency Museum of Tunisia',
    otherMuseumNames: ['National Bardo Museum'],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Mohammed Bey died naturally before constitutional crisis peaked in 1859 after 4 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 90
  },
  {
    name: 'Sadok Bey',
    fullTitle: 'Muhammad al-Sadiq Bey',
    reignDuration: '23 years',
    reignStart: 1859,
    reignEnd: 1882,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: false,
      relationDescription: 'Brother of Mohammed Bey'
    },
    residenceName: 'Ksar Saïd Palace + Bardo',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Promulgated Arab world\'s first constitution in 1861'
    ],
    worstEvents: [
      'Suffered French military invasion establishing protectorate in 1881'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Sadok Bey died naturally while under French protectorate oversight in 1882 after 23 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 150
  },
  {
    name: 'Ali 3rd Bey',
    fullTitle: 'Ali III Bey',
    reignDuration: '20 years',
    reignStart: 1882,
    reignEnd: 1902,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Sadok'
    },
    residenceName: 'Essaâda Palace, La Marsa',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Maintained limited cooperation with French authorities in 1880s',
      'Developed infrastructure projects throughout 1890s'
    ],
    worstEvents: [
      'Experienced complete loss of sovereignty under protectorate from 1880s-1900s'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Ali 3rd Bey died naturally during full protectorate rule in 1902 after 20 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 120
  },
  {
    name: 'Hédi Bey',
    fullTitle: 'Muhammad al-Hadi Bey',
    reignDuration: '4 years',
    reignStart: 1902,
    reignEnd: 1906,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Ali III'
    },
    residenceName: 'Essaâda + Ksar Saïd Palace',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Launched education and health reforms from 1903-1905'
    ],
    worstEvents: [
      'Plagued by internal court intrigues and plots in 1905-1906'
    ],
    primaryMuseumName: 'Dar Ben Abdallah Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Hédi Bey was deposed and replaced by French-favored successor in 1906 after 4 years of rule.',
    reignEndType: 'deposed',
    pointsValue: 90
  },
  {
    name: 'Naceur Bey',
    fullTitle: 'Muhammad V al-Nasir Bey',
    reignDuration: '16 years',
    reignStart: 1906,
    reignEnd: 1922,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Ali III'
    },
    residenceName: 'Essaâda Palace, La Marsa',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Successfully maintained neutrality policy during WW1 from 1914-1918'
    ],
    worstEvents: [
      'Confronted Destour Party nationalist revolts around 1920'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Naceur Bey died naturally amid rising nationalism in 1922 after 16 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 110
  },
  {
    name: 'Habib Bey',
    fullTitle: 'Muhammad VI al-Habib Bey',
    reignDuration: '7 years',
    reignStart: 1922,
    reignEnd: 1929,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Naceur'
    },
    residenceName: 'Dar El Bey + La Marsa palaces',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Led post-WW1 economic recovery efforts from 1923-1925'
    ],
    worstEvents: [
      'Suppressed Young Tunisia riots and protests from 1924-1926'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Habib Bey died naturally after brief post-war rule in 1929 after 7 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 90
  },
  {
    name: 'Ahmed 2nd Bey',
    fullTitle: 'Ahmad II Bey',
    reignDuration: '13 years',
    reignStart: 1929,
    reignEnd: 1942,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Habib'
    },
    residenceName: 'Essaâda + Ksar Saïd',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Showed tolerance toward emerging Neo-Destour movement in 1930s'
    ],
    worstEvents: [
      'Collaborated with Vichy French regime during WW2 from 1940-1942'
    ],
    primaryMuseumName: 'National Military Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Ahmed 2nd Bey died naturally from illness on June 11, 1942, during WW2 Vichy era after 13 years of rule.',
    reignEndType: 'natural_death',
    pointsValue: 100
  },
  {
    name: 'Moncef Bey',
    fullTitle: 'Muhammad VII al-Munsif Bey',
    reignDuration: '1 year',
    reignStart: 1942,
    reignEnd: 1943,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Ahmed II'
    },
    residenceName: 'Dar El Bey, Kasbah Tunis',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Openly backed independence movement and nationalists from 1942-1943, earning hero status'
    ],
    worstEvents: [
      'Arrested and exiled by French authorities in 1943'
    ],
    primaryMuseumName: 'Dar Ben Abdallah Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Moncef Bey was deposed, arrested, and exiled by French authorities in 1943 after 1 year of rule.',
    reignEndType: 'deposed',
    pointsValue: 150
  },
  {
    name: 'Lamine Bey',
    fullTitle: 'Muhammad VIII al-Amin Bey',
    reignDuration: '14 years',
    reignStart: 1943,
    reignEnd: 1957,
    dynastyName: 'HUSSEINITE',
    successionRelation: {
      wasSuccessor: true,
      relationDescription: 'Son of Moncef'
    },
    residenceName: 'Dar El Bey + Bardo',
    currencyName: 'Tunisian Franc',
    bestEvents: [
      'Voluntarily abdicated peacefully to Habib Bourguiba in 1957'
    ],
    worstEvents: [
      'Oversaw final monarchy abolition in 1957'
    ],
    primaryMuseumName: 'National Bardo Museum',
    otherMuseumNames: [],
    completionReward: '50% discount for your next museum visit',
    reignEndMessage: 'You found the Bey! Lamine Bey abdicated peacefully after 14 years, ending the Husseinite monarchy in 1957.',
    reignEndType: 'abdication',
    pointsValue: 150
  }
];

// Seed function
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/beygo');
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Dynasty.deleteMany({});
    await Museum.deleteMany({});
    await Currency.deleteMany({});
    await Bey.deleteMany({});
    await Reward.deleteMany({});

    // Seed Dynasties
    console.log('👑 Seeding dynasties...');
    const dynasties = await Dynasty.insertMany(dynastiesData);
    const dynastyMap = {};
    dynasties.forEach(d => dynastyMap[d.name] = d._id);

    // Seed Museums
    console.log('🏛️  Seeding museums...');
    const museumsWithImages = museumsData.map(museum => ({
      ...museum,
      images: museumImageMap[museum.name] ? [{ url: `/uploads/museums/${museumImageMap[museum.name]}`, caption: museum.name }] : []
    }));
    const museums = await Museum.insertMany(museumsWithImages);
    const museumMap = {};
    museums.forEach(m => museumMap[m.name] = m._id);

    // Seed Currencies
    console.log('💰 Seeding currencies...');
    const currencies = await Currency.insertMany(currenciesData);
    const currencyMap = {};
    currencies.forEach(c => currencyMap[c.name] = c._id);

    // Seed Beys
    console.log('🎭 Seeding beys...');
    const beysToInsert = beysData.map(bey => ({
      name: bey.name,
      fullTitle: bey.fullTitle,
      reignDuration: bey.reignDuration,
      reignStart: bey.reignStart,
      reignEnd: bey.reignEnd,
      dynasty: dynastyMap[bey.dynastyName],
      successionRelation: bey.successionRelation,
      mainCurrency: currencyMap[bey.currencyName],
      bestEvents: bey.bestEvents,
      worstEvents: bey.worstEvents,
      primaryMuseum: museumMap[bey.primaryMuseumName],
      otherMuseums: bey.otherMuseumNames.map(name => museumMap[name]).filter(Boolean),
      completionReward: bey.completionReward,
      reignEndMessage: bey.reignEndMessage,
      reignEndType: bey.reignEndType,
      pointsValue: bey.pointsValue,
      portraitImage: beyImageMap[bey.name] ? `/uploads/beys/${beyImageMap[bey.name]}` : null,
      puzzleImage: beyImageMap[bey.name] ? `/uploads/beys/${beyImageMap[bey.name]}` : null,
      puzzle: {
        totalPieces: 9,
        gridSize: { rows: 3, cols: 3 },
        difficulty: bey.reignEnd - bey.reignStart > 15 ? 'hard' : bey.reignEnd - bey.reignStart > 5 ? 'medium' : 'easy'
      }
    }));

    const beys = await Bey.insertMany(beysToInsert);

    // Seed Rewards for each Bey
    console.log('🎁 Seeding rewards...');
    const rewardsToInsert = beys.map(bey => ({
      name: `${bey.name} Completion Reward`,
      description: beysData.find(b => b.name === bey.name)?.completionReward || '50% discount for your next museum visit',
      type: 'discount',
      discountPercentage: 50,
      bey: bey._id,
      museum: bey.primaryMuseum,
      requiresCompletion: true,
      icon: '🎫',
      color: bey.dynasty?.toString() === dynastyMap['MOURADITE']?.toString() ? '#8B4513' : '#1E3A5F'
    }));

    await Reward.insertMany(rewardsToInsert);

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${dynasties.length} dynasties`);
    console.log(`   - ${museums.length} museums`);
    console.log(`   - ${currencies.length} currencies`);
    console.log(`   - ${beys.length} beys`);
    console.log(`   - ${rewardsToInsert.length} rewards`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
