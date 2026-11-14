// Généré par tools/build_gto.py à partir des calculs du dossier gto-lab. Ne pas modifier à la main.
import type { Scenario } from "./gto";

export const SOLVED: Scenario[] = [
 {
  "id": "nash-sb-a8o-10",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 3,
  "title": "Tapis en SB à 10 BB",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "As",
    "8c"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 10
   }
  ],
  "stackBB": 10,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 1.5,
  "history": [
   "Tous passent jusqu'à la SB"
  ],
  "facing": "Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, 10 BB effectives.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "allin",
    "sizeBB": 10,
    "label": "Tapis 10 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   0.1,
   99.9
  ],
  "explanation": "À l'équilibre, A8o se joue à pousser jusqu'à au moins 25 BB. À 10 BB, la solution choisit de pousser 99.9 % du temps. La SB gagne souvent les 1,5 BB sans abattage, et reste rarement très derrière quand elle est payée.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 58.3 % des mains à 10 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0011 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-sb-k5o-8",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 1,
  "title": "Roi faible à 8 BB",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "Kd",
    "5c"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 8
   }
  ],
  "stackBB": 8,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 1.5,
  "history": [
   "Tous passent jusqu'à la SB"
  ],
  "facing": "Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, 8 BB effectives.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "allin",
    "sizeBB": 8,
    "label": "Tapis 8 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   0.1,
   99.9
  ],
  "explanation": "À l'équilibre, K5o se joue à pousser jusqu'à environ 14,2 BB (seuil calculé). À 8 BB, la solution choisit de pousser 99.9 % du temps. La SB gagne souvent les 1,5 BB sans abattage, et reste rarement très derrière quand elle est payée.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 61.8 % des mains à 8 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0009 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-sb-97o-12",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 2,
  "title": "Connecteurs dépareillés à 12 BB",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "9h",
    "7c"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 12
   }
  ],
  "stackBB": 12,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 1.5,
  "history": [
   "Tous passent jusqu'à la SB"
  ],
  "facing": "Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, 12 BB effectives.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "allin",
    "sizeBB": 12,
    "label": "Tapis 12 BB"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   86.4,
   13.6
  ],
  "explanation": "À l'équilibre, 97o se joue à pousser jusqu'à environ 10,8 BB (seuil calculé). À 12 BB, la solution choisit de pousser 13.6 % du temps. Plus le tapis est profond, plus le risque devient grand pour un gain fixe de 1,5 BB : la range se resserre.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 53.5 % des mains à 12 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0012 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-sb-t7o-15",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 2,
  "title": "Trop profond pour pousser ?",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "Ts",
    "7d"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 15
   }
  ],
  "stackBB": 15,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 1.5,
  "history": [
   "Tous passent jusqu'à la SB"
  ],
  "facing": "Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, 15 BB effectives.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "allin",
    "sizeBB": 15,
    "label": "Tapis 15 BB"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   99.8,
   0.2
  ],
  "explanation": "À l'équilibre, T7o se joue à pousser jusqu'à environ 9 BB (seuil calculé). À 15 BB, la solution choisit de pousser 0.2 % du temps. Plus le tapis est profond, plus le risque devient grand pour un gain fixe de 1,5 BB : la range se resserre.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 45.9 % des mains à 15 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0015 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-sb-22-15",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 1,
  "title": "Petite paire à 15 BB",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "2c",
    "2d"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 15
   }
  ],
  "stackBB": 15,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 1.5,
  "history": [
   "Tous passent jusqu'à la SB"
  ],
  "facing": "Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, 15 BB effectives.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "allin",
    "sizeBB": 15,
    "label": "Tapis 15 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   0.1,
   99.9
  ],
  "explanation": "À l'équilibre, 22 se joue à pousser jusqu'à au moins 25 BB. À 15 BB, la solution choisit de pousser 99.9 % du temps. La SB gagne souvent les 1,5 BB sans abattage, et reste rarement très derrière quand elle est payée.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 45.9 % des mains à 15 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0015 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-sb-j5s-13",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 3,
  "title": "Valet assorti à 13 BB",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "Jh",
    "5h"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 13
   }
  ],
  "stackBB": 13,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 1.5,
  "history": [
   "Tous passent jusqu'à la SB"
  ],
  "facing": "Tous les joueurs ont passé. Il ne reste que vous (SB) et la BB, 13 BB effectives.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "allin",
    "sizeBB": 13,
    "label": "Tapis 13 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   4.1,
   95.9
  ],
  "explanation": "À l'équilibre, J5s se joue à pousser jusqu'à environ 16,2 BB (seuil calculé). À 13 BB, la solution choisit de pousser 95.9 % du temps. La SB gagne souvent les 1,5 BB sans abattage, et reste rarement très derrière quand elle est payée.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 51.4 % des mains à 13 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0013 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-bb-q6o-10",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 2,
  "title": "Payer un tapis avec Q6",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "Qc",
    "6d"
   ]
  },
  "villains": [
   {
    "pos": "SB",
    "stackBB": 10
   }
  ],
  "stackBB": 10,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 11,
  "history": [
   "Tous passent jusqu'à la SB",
   "SB : tapis 10 BB"
  ],
  "facing": "La SB part à tapis pour 10 BB. Il vous en coûte 9 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "sizeBB": 9,
    "label": "Payer 9 BB"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   99.3,
   0.7
  ],
  "explanation": "À l'équilibre, Q6o se joue à payer jusqu'à environ 7,2 BB (seuil calculé). À 10 BB, la solution choisit de payer 0.7 % du temps. Même avec un bon prix, cette main est trop souvent dominée par la range de tapis de la SB.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 58.3 % des mains à 10 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0011 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-bb-k2o-8",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 2,
  "title": "Défendre la BB à 8 BB",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "Kh",
    "2s"
   ]
  },
  "villains": [
   {
    "pos": "SB",
    "stackBB": 8
   }
  ],
  "stackBB": 8,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 9,
  "history": [
   "Tous passent jusqu'à la SB",
   "SB : tapis 8 BB"
  ],
  "facing": "La SB part à tapis pour 8 BB. Il vous en coûte 7 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "sizeBB": 7,
    "label": "Payer 7 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   0.1,
   99.9
  ],
  "explanation": "À l'équilibre, K2o se joue à payer jusqu'à environ 8,2 BB (seuil calculé). À 8 BB, la solution choisit de payer 99.9 % du temps. La BB paie avec un prix favorable : seulement 7 BB pour un pot de 16 BB.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 61.8 % des mains à 8 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0009 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "nash-bb-a2o-15",
  "version": 1,
  "street": "preflop",
  "type": "Push/fold",
  "difficulty": 3,
  "title": "As faible contre un tapis de 15 BB",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "Ad",
    "2h"
   ]
  },
  "villains": [
   {
    "pos": "SB",
    "stackBB": 15
   }
  ],
  "stackBB": 15,
  "blinds": "0,5 / 1 (sans ante)",
  "board": [],
  "potBB": 16,
  "history": [
   "Tous passent jusqu'à la SB",
   "SB : tapis 15 BB"
  ],
  "facing": "La SB part à tapis pour 15 BB. Il vous en coûte 14 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "sizeBB": 14,
    "label": "Payer 14 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   0.1,
   99.9
  ],
  "explanation": "À l'équilibre, A2o se joue à payer jusqu'à environ 15,8 BB (seuil calculé). À 15 BB, la solution choisit de payer 99.9 % du temps. La BB paie avec un prix favorable : seulement 14 BB pour un pot de 30 BB.",
  "keyPoints": [
   "Push/fold tête-à-tête : la SB pousse ≈ 45.9 % des mains à 15 BB.",
   "Équilibre de Nash : aucun joueur ne gagne à dévier seul.",
   "Sans ante. Avec ante, toutes les ranges s'élargissent."
  ],
  "source": {
   "kind": "solver",
   "pack": "stackora-nash-hu-v1",
   "solver": "Nash push/fold STACKORA (fictitious play)",
   "solverVersion": "1.0",
   "settings": "Tête-à-tête SB contre BB, push ou fold, sans ante, 600 itérations, équités Monte-Carlo 40 000 tirages par confrontation, retrait des cartes. Exploitabilité 0.0015 BB.",
   "license": "Calcul STACKORA. Vérifié contre un tableau Nash HU gratuit publié en ligne (version sans ante)."
  }
 },
 {
  "id": "po-value-river",
  "version": 2,
  "street": "postflop",
  "type": "Value bet",
  "difficulty": 2,
  "title": "Valeur à la river",
  "players": 2,
  "hero": {
   "pos": "BTN",
   "cards": [
    "Kc",
    "Jd"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 80.0
   }
  ],
  "stackBB": 80.0,
  "blinds": "0,5 / 1",
  "board": [
   "Kd",
   "9c",
   "5s",
   "2h",
   "Jc"
  ],
  "potBB": 20.0,
  "history": [
   "Préflop : vous relancez, BB suit",
   "Flop : mise, BB suit",
   "Turn : check, check",
   "River : BB checke"
  ],
  "facing": "Pot de 20 BB, la BB checke.",
  "options": [
   {
    "act": "check",
    "label": "Checker"
   },
   {
    "act": "bet",
    "sizeBB": 6.0,
    "label": "Miser 6 BB (30 % du pot)"
   },
   {
    "act": "bet",
    "sizeBB": 14.0,
    "label": "Miser 14 BB (70 % du pot)"
   },
   {
    "act": "bet",
    "sizeBB": 30.0,
    "label": "Miser 30 BB (150 % du pot)"
   }
  ],
  "best": [
   2
  ],
  "acceptable": [
   3
  ],
  "frequencies": [
   0.0,
   1.0,
   79.2,
   19.8
  ],
  "rangeFrequencies": [
   52.2,
   0.7,
   42.6,
   4.6
  ],
  "explanation": "La solution mise presque toujours avec la double paire : surtout 70 % du pot (79 %), parfois en surmise à 150 % (20 %), presque jamais petit. Les Rois avec un moins bon kicker, les 9 et les tirages ratés qui paient trop sont les mains qui donnent de la valeur. La range entière, elle, checke 52 % du temps : vous êtes dans sa partie forte.",
  "keyPoints": [
   "Une main forte mais pas imbattable mise gros, sans forcément surmiser.",
   "Les surmises sont réservées à une petite part de la range.",
   "Checker la turn rend la range moins lisible à la river."
  ],
  "model": {
   "hero": "ip",
   "oop": "K2s-K8s,K5o-K8o,A9s,A9o,Q9s,J9s,T9s,98s,97s,87s,76s,65s,QTs,QJs,JTs,JTo,Q9o,T9o,98o,22,55,66,77,88,99,A5s",
   "ip": "KQs,KQo,KJs,KJo,KTs,KTo,AJs,AJo,ATs,ATo,A9s,QTs,JTs,T9s,98s,87s,76s,88,TT,JJ,QQ,A4s,A3s",
   "sizes": [
    0.3,
    0.7,
    1.5
   ],
   "maxRaises": 1,
   "iterations": 1500,
   "exploitabilityPct": 0.067,
   "buckets": null
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 1500 itérations, mises 30 %, 70 %, 150 % du pot, 1 relance max, isomorphie des couleurs. Exploitabilité 0.07 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-bluff-missed-flush",
  "version": 2,
  "street": "postflop",
  "type": "Bluff",
  "difficulty": 3,
  "title": "Tirage raté à la river",
  "players": 2,
  "hero": {
   "pos": "BTN",
   "cards": [
    "Qs",
    "Js"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 85.0
   }
  ],
  "stackBB": 85.0,
  "blinds": "0,5 / 1",
  "board": [
   "As",
   "8s",
   "3d",
   "Th",
   "2c"
  ],
  "potBB": 16.0,
  "history": [
   "Préflop : vous relancez, BB suit",
   "Flop : mise, BB suit",
   "Turn : check, check",
   "River : BB checke"
  ],
  "facing": "Votre couleur ne rentre pas. Vous avez hauteur Dame.",
  "options": [
   {
    "act": "check",
    "label": "Checker"
   },
   {
    "act": "bet",
    "sizeBB": 11.2,
    "label": "Miser 11,2 BB (70 % du pot)"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   98.8,
   1.2
  ],
  "rangeFrequencies": [
   71.4,
   28.6
  ],
  "explanation": "Surprise : la solution checke Q♠J♠ à 99 %. La range bluffe bien (29 %), mais avec ses tirages ratés les plus faibles, 7-6, 6-5, 5-4 assortis, qui ne gagnent jamais à l'abattage. Hauteur Dame bat une partie de ces mains : elle garde une petite valeur d'abattage, donc mieux vaut checker.",
  "keyPoints": [
   "On bluffe avec les pires mains, pas avec celles qui gagnent parfois.",
   "Un tirage raté n'est pas automatiquement un bluff.",
   "Fréquence de réussite nécessaire = mise / (pot + mise)."
  ],
  "model": {
   "hero": "ip",
   "oop": "A2s-A9s,A2o-A9o,88,33,22,77,99,98s,87s,86s,T9s,JTs,QTs,K8s,97s,76s",
   "ip": "AKs,AKo,AQs,AQo,AJs,AJo,KQs,KJs,QJs,JTs,T9s,97s,76s,KQo,QJo,KTs,65s,54s",
   "sizes": [
    0.7
   ],
   "maxRaises": 1,
   "iterations": 1500,
   "exploitabilityPct": 0.042,
   "buckets": null
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 1500 itérations, mises 70 % du pot, 1 relance max, isomorphie des couleurs. Exploitabilité 0.04 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-bluffcatch",
  "version": 2,
  "street": "postflop",
  "type": "Bluff catch",
  "difficulty": 2,
  "title": "Bluff catcher à la river",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "Ah",
    "Td"
   ]
  },
  "villains": [
   {
    "pos": "BTN",
    "stackBB": 70.0
   }
  ],
  "stackBB": 70.0,
  "blinds": "0,5 / 1",
  "board": [
   "Ac",
   "9d",
   "5s",
   "7c",
   "3h"
  ],
  "potBB": 24.0,
  "history": [
   "Flop : check, mise, suivi",
   "Turn : check, check",
   "River : vous checkez, BTN mise 12 BB"
  ],
  "facing": "Il vous en coûte 12 BB pour un pot de 36 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "label": "Payer"
   },
   {
    "act": "raise",
    "sizeBB": 24.0,
    "label": "Relancer de 24 BB"
   },
   {
    "act": "raise",
    "sizeBB": 48.0,
    "label": "Relancer de 48 BB"
   }
  ],
  "best": [
   0,
   1
  ],
  "acceptable": [],
  "frequencies": [
   50.5,
   46.1,
   1.2,
   2.2
  ],
  "rangeFrequencies": [
   28.5,
   61.7,
   4.0,
   5.8
  ],
  "explanation": "A-T est pile à la limite : la solution passe 51 % du temps et paie 46 %. Les deux choix ont la même valeur à l'équilibre. La range de la BB paie 62 % du temps : les As avec un meilleur kicker et les doubles paires paient, les As plus faibles servent de limite.",
  "keyPoints": [
   "À l'équilibre, la main limite est indifférente entre payer et passer.",
   "Cotes du pot : 12 / (36 + 12) = 25 %.",
   "Relancer un bluff catcher ne fait payer que mieux."
  ],
  "model": {
   "hero": "oop",
   "oop": "A2s-AJs,A2o-AJo,98s,97s,87s,76s,65s,T9s,K9s,Q9s,J9s,86s,64s,99,77,55,33",
   "ip": "AKs,AKo,AQs,AQo,AJs,KQs,KJs,QJs,JTs,T8s,86s,64s,KTs,99,77,55,T9s",
   "sizes": [
    0.5,
    1.0
   ],
   "maxRaises": 1,
   "iterations": 1500,
   "exploitabilityPct": 0.066,
   "buckets": null
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 1500 itérations, mises 50 %, 100 % du pot, 1 relance max, isomorphie des couleurs. Exploitabilité 0.07 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-river-overbet",
  "version": 2,
  "street": "postflop",
  "type": "River",
  "difficulty": 3,
  "title": "Surmise à la river",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "9h",
    "8h"
   ]
  },
  "villains": [
   {
    "pos": "BTN",
    "stackBB": 60.0
   }
  ],
  "stackBB": 60.0,
  "blinds": "0,5 / 1",
  "board": [
   "Qd",
   "9c",
   "4s",
   "2d",
   "Kc"
  ],
  "potBB": 18.0,
  "history": [
   "Flop : check, mise, suivi",
   "Turn : check, mise, suivi",
   "River : vous checkez, BTN mise 30 BB"
  ],
  "facing": "Il vous en coûte 30 BB pour un pot de 48 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "label": "Payer"
   },
   {
    "act": "raise",
    "sizeBB": 30.0,
    "label": "Relancer de 30 BB"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   99.8,
   0.1,
   0.1
  ],
  "rangeFrequencies": [
   65.7,
   27.2,
   7.1
  ],
  "explanation": "Passer à 100 %. Face à une surmise (167 % du pot), la range de la BB passe 66 % du temps et ne paie qu'avec des mains plus fortes que la deuxième paire. 9-8 ne bat que les bluffs, et il en faut au moins 38 % pour rentabiliser le call.",
  "keyPoints": [
   "Plus la mise est grosse, plus la range qui paie se resserre.",
   "Une surmise représente une range polarisée.",
   "Passer une main moyenne est souvent la bonne réponse."
  ],
  "model": {
   "hero": "oop",
   "oop": "98s,97s,T9s,J9s,A9s,K9s,Q9s,QTs,QJs,A4s,54s,T8s,JTs,87s,J9o,T9o,A9o,22,44,99,A2s,K2s",
   "ip": "AKs,AKo,KQs,KQo,KJs,AQs,AQo,QJs,QQ,99,44,22,JTs,T8s,87s,A5s,A3s,T7s,65s",
   "sizes": [
    0.66,
    1.667
   ],
   "maxRaises": 1,
   "iterations": 1500,
   "exploitabilityPct": 0.065,
   "buckets": null
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 1500 itérations, mises 66 %, 167 % du pot, 1 relance max, isomorphie des couleurs. Exploitabilité 0.06 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-turn-barrel",
  "version": 2,
  "street": "postflop",
  "type": "Turn barrel",
  "difficulty": 2,
  "title": "Deuxième barrel avec tirage",
  "players": 2,
  "hero": {
   "pos": "BTN",
   "cards": [
    "Qh",
    "Jh"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 95.0
   }
  ],
  "stackBB": 95.0,
  "blinds": "0,5 / 1",
  "board": [
   "Ks",
   "Tc",
   "4d",
   "2h"
  ],
  "potBB": 9.0,
  "history": [
   "Préflop : vous relancez, BB suit",
   "Flop : check, vous misez, BB suit",
   "Turn : BB checke"
  ],
  "facing": "Pot de 9 BB. Vous avez un tirage à suite par les deux bouts.",
  "options": [
   {
    "act": "check",
    "label": "Checker"
   },
   {
    "act": "bet",
    "sizeBB": 5.9,
    "label": "Miser 5,9 BB (66 % du pot)"
   }
  ],
  "best": [
   0,
   1
  ],
  "acceptable": [],
  "frequencies": [
   54.7,
   45.3
  ],
  "rangeFrequencies": [
   42.7,
   57.3
  ],
  "explanation": "Stratégie mixte : checker 55 %, miser 66 % du pot 45 %. Les deux lignes rapportent autant à l'équilibre. Le tirage ouvert a assez d'équité pour miser, mais il profite aussi d'une carte gratuite. La range du bouton mise 57 % du temps sur cette turn.",
  "keyPoints": [
   "Les mixtes signifient que plusieurs actions ont la même valeur.",
   "Semi-bluff = fold equity + équité du tirage.",
   "Checker un tirage protège aussi la range qui checke."
  ],
  "model": {
   "hero": "ip",
   "oop": "K2s-K9s,K5o-K9o,T2s-T9s,QTs,J9s,98s,97s,87s,65s,A4s,A2s,A5s,44,22,55-99,JTs,QJs,QJo,J9o,T9o,QTo,ATo,ATs,A9o",
   "ip": "AKs,AKo,AQs,AQo,AJs,AJo,ATs,KQs,KQo,KJs,KJo,QJs,QTs,JTs,J9s,T9s,98s,A5s,A3s,AA,KK,QQ,JJ,44,65s,76s",
   "sizes": [
    0.66
   ],
   "maxRaises": 1,
   "iterations": 800,
   "exploitabilityPct": 0.257,
   "buckets": null
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 800 itérations, mises 66 % du pot, 1 relance max, isomorphie des couleurs. Exploitabilité 0.26 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-spr-low",
  "version": 2,
  "street": "postflop",
  "type": "SPR",
  "difficulty": 2,
  "title": "SPR faible avec top paire",
  "players": 2,
  "hero": {
   "pos": "SB",
   "cards": [
    "As",
    "Kd"
   ]
  },
  "villains": [
   {
    "pos": "BTN",
    "stackBB": 25.0
   }
  ],
  "stackBB": 25.0,
  "blinds": "0,5 / 1",
  "board": [
   "Kh",
   "8c",
   "3d"
  ],
  "potBB": 20.0,
  "history": [
   "Préflop : vous faites un 3-bet, BTN suit",
   "Flop : vous checkez, BTN mise 8 BB"
  ],
  "facing": "Pot de 28 BB, il vous reste 25 BB (SPR au flop ≈ 1,25).",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "label": "Payer"
   },
   {
    "act": "raise",
    "sizeBB": 14.4,
    "label": "Relancer de 14,4 BB"
   },
   {
    "act": "raise",
    "sizeBB": 17.0,
    "label": "Relancer de 17 BB"
   }
  ],
  "best": [
   2,
   3
  ],
  "acceptable": [],
  "frequencies": [
   0.0,
   1.6,
   42.2,
   56.2
  ],
  "rangeFrequencies": [
   21.6,
   16.7,
   27.8,
   33.9
  ],
  "explanation": "La solution relance presque toujours (98 %) : tapis direct 56 %, ou relance qui laisse moins de 3 BB derrière 42 %. Payer : 2 %. Avec un tapis à peine supérieur au pot, la top paire meilleur kicker est une main de tapis.",
  "keyPoints": [
   "SPR = tapis effectif / pot au début de la street.",
   "SPR bas : top paire = engagé.",
   "Ne laissez pas une carte gratuite aux tirages."
  ],
  "model": {
   "hero": "oop",
   "oop": "TT+,AJs+,KQs,AQo+,A5s,A4s",
   "ip": "77-JJ,ATs-AQs,KJs+,QJs,JTs,T9s,AJo-AQo,KQo",
   "sizes": [
    0.4,
    1.25
   ],
   "maxRaises": 1,
   "iterations": 600,
   "exploitabilityPct": 0.268,
   "buckets": null
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 600 itérations, mises 40 %, 125 % du pot, 1 relance max, isomorphie des couleurs. Exploitabilité 0.27 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-cbet-a72",
  "version": 2,
  "street": "postflop",
  "type": "C-bet",
  "difficulty": 1,
  "title": "Continuation bet sur board sec",
  "players": 2,
  "hero": {
   "pos": "BTN",
   "cards": [
    "Kh",
    "Qh"
   ]
  },
  "villains": [
   {
    "pos": "BB",
    "stackBB": 97.5
   }
  ],
  "stackBB": 97.5,
  "blinds": "0,5 / 1",
  "board": [
   "As",
   "7d",
   "2c"
  ],
  "potBB": 5.5,
  "history": [
   "Préflop : vous relancez à 2,5 BB, BB suit",
   "Flop : BB checke"
  ],
  "facing": "Pot de 5,5 BB, la BB a checké.",
  "options": [
   {
    "act": "check",
    "label": "Checker"
   },
   {
    "act": "bet",
    "sizeBB": 1.8,
    "label": "Miser 1,8 BB (33 % du pot)"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   99.0,
   1.0
  ],
  "rangeFrequencies": [
   50.3,
   49.7
  ],
  "explanation": "La range du bouton mise la moitié du temps (50 %), mais K♥Q♥ checke à 99 %. Sur A-7-2, la petite mise sert surtout aux As (valeur) et aux mains sans aucune équité (bluffs). Roi-Dame garde une valeur d'abattage contre les mains faibles de la BB et préfère voir une carte gratuite. Modèle avec mains regroupées : exploitabilité de 2,7 % du pot, moins précise qu'une river.",
  "keyPoints": [
   "Board sec avec un As : avantage de range au relanceur.",
   "Petite mise fréquente sur ce type de flop.",
   "Avec plusieurs streets à jouer, les solutions convergent plus lentement."
  ],
  "model": {
   "hero": "ip",
   "oop": "22,33,44,55,66,77,88,99,TT,A2s,A3s,A4s,A5s,A6s,A7s,A8s,A9s,ATs,AJs,K5s,K6s,K7s,K8s,K9s,KTs,KJs,Q7s,Q8s,Q9s,QTs,QJs,J7s,J8s,J9s,JTs,T7s,T8s,T9s,96s,97s,98s,86s,87s,75s,76s,64s,65s,54s,A2o,A3o,A4o,A5o,A6o,A7o,A8o,A9o,ATo,AJo,K8o,K9o,KTo,KJo,Q9o,QTo,QJo,J9o,JTo,T9o,98o",
   "ip": "22,33,44,55,66,77,88,99,TT,JJ,QQ,KK,AA,A2s,A3s,A4s,A5s,A6s,A7s,A8s,A9s,ATs,AJs,AQs,AKs,K2s,K3s,K4s,K5s,K6s,K7s,K8s,K9s,KTs,KJs,KQs,Q4s,Q5s,Q6s,Q7s,Q8s,Q9s,QTs,QJs,J6s,J7s,J8s,J9s,JTs,T6s,T7s,T8s,T9s,96s,97s,98s,85s,86s,87s,75s,76s,64s,65s,54s,A2o,A3o,A4o,A5o,A6o,A7o,A8o,A9o,ATo,AJo,AQo,AKo,K8o,K9o,KTo,KJo,KQo,Q9o,QTo,QJo,J9o,JTo,T8o,T9o,98o",
   "sizes": [
    0.33
   ],
   "maxRaises": 1,
   "iterations": 150,
   "exploitabilityPct": 2.695,
   "buckets": 60
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 150 itérations, mises 33 % du pot, 1 relance max, isomorphie des couleurs, 60 groupes de mains par street. Exploitabilité 2.70 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-vscbet-k83",
  "version": 2,
  "street": "postflop",
  "type": "vs C-bet",
  "difficulty": 1,
  "title": "Défendre avec une paire",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "8h",
    "7h"
   ]
  },
  "villains": [
   {
    "pos": "BTN",
    "stackBB": 97.5
   }
  ],
  "stackBB": 97.5,
  "blinds": "0,5 / 1",
  "board": [
   "Ks",
   "8d",
   "3c"
  ],
  "potBB": 5.5,
  "history": [
   "BTN relance à 2,5 BB",
   "BB (vous) suit",
   "Flop : vous checkez",
   "BTN mise 1,8 BB"
  ],
  "facing": "Il vous en coûte 1,8 BB pour un pot de 7,3 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "label": "Payer"
   },
   {
    "act": "raise",
    "sizeBB": 3.0,
    "label": "Relancer de 3 BB"
   }
  ],
  "best": [
   1
  ],
  "acceptable": [],
  "frequencies": [
   0.0,
   93.6,
   6.4
  ],
  "rangeFrequencies": [
   34.4,
   44.0,
   21.5
  ],
  "explanation": "Payer à 94 % (relance 6 %). Face à une mise d'un tiers du pot, la deuxième paire est loin devant les bluffs et une bonne partie des mises de valeur légères. La range de la BB passe 34 %, paie 44 % et relance 22 % : 8-7 fait partie des mains qui paient.",
  "keyPoints": [
   "Petite mise adverse = défense large.",
   "Une main moyenne préfère garder le pot petit.",
   "Cotes : 1,8 / 9,1 ≈ 20 %."
  ],
  "model": {
   "hero": "oop",
   "oop": "22,33,44,55,66,77,88,99,TT,A2s,A3s,A4s,A5s,A6s,A7s,A8s,A9s,ATs,AJs,K5s,K6s,K7s,K8s,K9s,KTs,KJs,Q7s,Q8s,Q9s,QTs,QJs,J7s,J8s,J9s,JTs,T7s,T8s,T9s,96s,97s,98s,86s,87s,75s,76s,64s,65s,54s,A2o,A3o,A4o,A5o,A6o,A7o,A8o,A9o,ATo,AJo,K8o,K9o,KTo,KJo,Q9o,QTo,QJo,J9o,JTo,T9o,98o",
   "ip": "22,33,44,55,66,77,88,99,TT,JJ,QQ,KK,AA,A2s,A3s,A4s,A5s,A6s,A7s,A8s,A9s,ATs,AJs,AQs,AKs,K2s,K3s,K4s,K5s,K6s,K7s,K8s,K9s,KTs,KJs,KQs,Q4s,Q5s,Q6s,Q7s,Q8s,Q9s,QTs,QJs,J6s,J7s,J8s,J9s,JTs,T6s,T7s,T8s,T9s,96s,97s,98s,85s,86s,87s,75s,76s,64s,65s,54s,A2o,A3o,A4o,A5o,A6o,A7o,A8o,A9o,ATo,AJo,AQo,AKo,K8o,K9o,KTo,KJo,KQo,Q9o,QTo,QJo,J9o,JTo,T8o,T9o,98o",
   "sizes": [
    0.33
   ],
   "maxRaises": 1,
   "iterations": 150,
   "exploitabilityPct": 2.532,
   "buckets": 60
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 150 itérations, mises 33 % du pot, 1 relance max, isomorphie des couleurs, 60 groupes de mains par street. Exploitabilité 2.53 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-xr-set",
  "version": 2,
  "street": "postflop",
  "type": "Check-raise",
  "difficulty": 2,
  "title": "Brelan face à une c-bet",
  "players": 2,
  "hero": {
   "pos": "BB",
   "cards": [
    "4d",
    "4c"
   ]
  },
  "villains": [
   {
    "pos": "CO",
    "stackBB": 97.5
   }
  ],
  "stackBB": 97.5,
  "blinds": "0,5 / 1",
  "board": [
   "Qs",
   "9d",
   "4h"
  ],
  "potBB": 5.5,
  "history": [
   "CO relance à 2,5 BB",
   "BB (vous) suit",
   "Flop : vous checkez",
   "CO mise 3,6 BB"
  ],
  "facing": "Il vous en coûte 3,6 BB.",
  "options": [
   {
    "act": "fold",
    "label": "Passer"
   },
   {
    "act": "call",
    "label": "Payer"
   },
   {
    "act": "raise",
    "sizeBB": 8.4,
    "label": "Relancer de 8,4 BB"
   }
  ],
  "best": [
   2
  ],
  "acceptable": [],
  "frequencies": [
   0.0,
   6.6,
   93.4
  ],
  "rangeFrequencies": [
   49.7,
   36.7,
   13.7
  ],
  "explanation": "Check-raise à 93 % (payer 7 %). Le brelan est presque imbattable et ce board donne beaucoup de tirages (J-T, T-8, K-J) : relancer fait payer les Dames et les tirages, et les empêche de voir la turn gratuitement. Toute la range ne relance que 14 % : vous êtes dans sa partie la plus forte.",
  "keyPoints": [
   "Construire le pot quand on est loin devant.",
   "Un board connecté pousse à protéger sa main.",
   "Le check-raise mélange valeur et tirages."
  ],
  "model": {
   "hero": "oop",
   "oop": "22,33,44,55,66,77,88,99,TT,A2s,A3s,A4s,A5s,A6s,A7s,A8s,A9s,ATs,AJs,K6s,K7s,K8s,K9s,KTs,KJs,Q8s,Q9s,QTs,QJs,J8s,J9s,JTs,T8s,T9s,97s,98s,86s,87s,75s,76s,65s,54s,A9o,ATo,AJo,KTo,KJo,QTo,QJo,JTo",
   "ip": "22,33,44,55,66,77,88,99,TT,JJ,QQ,KK,AA,A2s,A3s,A4s,A5s,A6s,A7s,A8s,A9s,ATs,AJs,AQs,AKs,K6s,K7s,K8s,K9s,KTs,KJs,KQs,Q8s,Q9s,QTs,QJs,J8s,J9s,JTs,T8s,T9s,97s,98s,86s,87s,76s,65s,54s,A8o,A9o,ATo,AJo,AQo,AKo,KTo,KJo,KQo,QTo,QJo,JTo",
   "sizes": [
    0.66
   ],
   "maxRaises": 1,
   "iterations": 150,
   "exploitabilityPct": 4.11,
   "buckets": 60
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 150 itérations, mises 66 % du pot, 1 relance max, isomorphie des couleurs, 60 groupes de mains par street. Exploitabilité 4.11 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 },
 {
  "id": "po-wet-oop",
  "version": 2,
  "street": "postflop",
  "type": "Board texture",
  "difficulty": 3,
  "title": "Board connecté hors de position",
  "players": 2,
  "hero": {
   "pos": "UTG",
   "cards": [
    "Ac",
    "Ad"
   ]
  },
  "villains": [
   {
    "pos": "BTN",
    "stackBB": 97.0
   }
  ],
  "stackBB": 97.0,
  "blinds": "0,5 / 1",
  "board": [
   "Jh",
   "Th",
   "9s"
  ],
  "potBB": 6.5,
  "history": [
   "Préflop : vous ouvrez, BTN suit"
  ],
  "facing": "Vous parlez en premier sur un flop très connecté.",
  "options": [
   {
    "act": "check",
    "label": "Checker"
   },
   {
    "act": "bet",
    "sizeBB": 4.3,
    "label": "Miser 4,3 BB (66 % du pot)"
   }
  ],
  "best": [
   0
  ],
  "acceptable": [],
  "frequencies": [
   97.2,
   2.8
  ],
  "rangeFrequencies": [
   90.0,
   10.0
  ],
  "explanation": "Checker à 97 %. Ce flop J-T-9 frappe fort la range du bouton (suites, doubles paires, brelans). UTG checke 90 % de toute sa range, y compris les As : miser hors de position ferait gonfler le pot quand vous êtes souvent battu, et isolerait les mains trop faibles dans la range qui checke.",
  "keyPoints": [
   "Board connecté = avantage à celui qui a payé.",
   "Hors de position, checker protège la range.",
   "Les grosses paires restent fortes mais vulnérables."
  ],
  "model": {
   "hero": "oop",
   "oop": "66,77,88,99,TT,JJ,QQ,KK,AA,ATs,AJs,AQs,AKs,KTs,KJs,KQs,QTs,QJs,JTs,T9s,98s,AJo,AQo,AKo,KQo",
   "ip": "22,33,44,55,66,77,88,99,TT,JJ,QQ,ATs,AJs,AQs,KTs,KJs,KQs,QTs,QJs,JTs,T9s,98s,87s,76s,AQo,KQo",
   "sizes": [
    0.66
   ],
   "maxRaises": 1,
   "iterations": 150,
   "exploitabilityPct": 3.241,
   "buckets": 60
  },
  "source": {
   "kind": "solver",
   "pack": "stackora-solved-v1",
   "solver": "native-solver",
   "solverVersion": "0.1.0 (MIT / Apache-2.0)",
   "settings": "DCFR, 150 itérations, mises 66 % du pot, 1 relance max, isomorphie des couleurs, 60 groupes de mains par street. Exploitabilité 3.24 % du pot.",
   "license": "Solution calculée par STACKORA avec un solveur open source sous licence MIT / Apache-2.0."
  }
 }
];

/** Mains dans l'ordre de native-solver (all_canonical_hands). */
export const NASH_HANDS: string[] = ["AA", "AKs", "AKo", "AQs", "AQo", "AJs", "AJo", "ATs", "ATo", "A9s", "A9o", "A8s", "A8o", "A7s", "A7o", "A6s", "A6o", "A5s", "A5o", "A4s", "A4o", "A3s", "A3o", "A2s", "A2o", "KK", "KQs", "KQo", "KJs", "KJo", "KTs", "KTo", "K9s", "K9o", "K8s", "K8o", "K7s", "K7o", "K6s", "K6o", "K5s", "K5o", "K4s", "K4o", "K3s", "K3o", "K2s", "K2o", "QQ", "QJs", "QJo", "QTs", "QTo", "Q9s", "Q9o", "Q8s", "Q8o", "Q7s", "Q7o", "Q6s", "Q6o", "Q5s", "Q5o", "Q4s", "Q4o", "Q3s", "Q3o", "Q2s", "Q2o", "JJ", "JTs", "JTo", "J9s", "J9o", "J8s", "J8o", "J7s", "J7o", "J6s", "J6o", "J5s", "J5o", "J4s", "J4o", "J3s", "J3o", "J2s", "J2o", "TT", "T9s", "T9o", "T8s", "T8o", "T7s", "T7o", "T6s", "T6o", "T5s", "T5o", "T4s", "T4o", "T3s", "T3o", "T2s", "T2o", "99", "98s", "98o", "97s", "97o", "96s", "96o", "95s", "95o", "94s", "94o", "93s", "93o", "92s", "92o", "88", "87s", "87o", "86s", "86o", "85s", "85o", "84s", "84o", "83s", "83o", "82s", "82o", "77", "76s", "76o", "75s", "75o", "74s", "74o", "73s", "73o", "72s", "72o", "66", "65s", "65o", "64s", "64o", "63s", "63o", "62s", "62o", "55", "54s", "54o", "53s", "53o", "52s", "52o", "44", "43s", "43o", "42s", "42o", "33", "32s", "32o", "22"];
/** Fréquences (0 à 9) de push SB et de call BB par profondeur, tête-à-tête sans ante. */
export const NASH_TABLE: Record<string, { push: string; call: string }> = {"2": {"push": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999990999999990909999990909999090990009009", "call": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"}, "3": {"push": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999929999999999090909999999900000999909000009909000009900000900009009", "call": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999190999999991909999996909999990999909909"}, "4": {"push": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999090909999999909090009999990900000999909000009909000009900000900009009", "call": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999090909999999909090009999990900000999909000009909000009909000900009009"}, "5": {"push": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999999990999999999909090909999997908010009999890800000999909000009909000009908000980009009", "call": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999909090999999990908000009999790000000009909000000000990000000009100000009000000900009009"}, "6": {"push": "9999999999999999999999999999999999999999999999999999999999999999999999999999999999909090999999990909090809999990908000009999890800000999909000009909080009909000980009009", "call": "9999999999999999999999999999999999999999999999999999999999999999990909999999999090800000999999080000000009969000000000009900000000000900000000009000000009000000900009009"}, "7": {"push": "9999999999999999999999999999999999999999999999999999999999999999999999999999999090909090999999990909080009999990900000009999890800000998909000009909080009909000980009009", "call": "9999999999999999999999999999999999999999999999999999999999999909090909999999907000000000999908000000000009900000000000009000000000000900000000009000000009000000900009009"}, "8": {"push": "9999999999999999999999999999999999999999999999999999999999999999490909999999999090909090999999690909010009999990900000009999090300000999909000009909000009909000910009009", "call": "9999999999999999999999999999999999999999999999999999999999690909000009999990800000000000998900000000000009800000000000009000000000000900000000009000000009000000900009009"}, "9": {"push": "9999999999999999999999999999999999999999999999999999999999999999090909999999909090909010999999790909000009999990900000009999090500000998909000009909000009909000960009009", "call": "9999999999999999999999999999999999999999999990909999999999090400000009999890000000000000990800000000000009000000000000009000000000000900000000009000000009000000900009009"}, "10": {"push": "9999999999999999999999999999999999999999999999999999999999993909090909999999909090909000999999290908000009999990900000009999090800000998909000009909000009908000910009009", "call": "9999999999999999999999999999999999999999989090909999999918000000000009999080000000000000990000000000000009000000000000009000000000000900000000009000000009000000900009009"}, "11": {"push": "9999999999999999999999999999999999999999999999999999999999090909090909999999909090901000999999090901000009999290900000009999090000000990908000009909000009908000900009009", "call": "9999999999999999999999999999999999999998909090009999999900000000000009999000000000000000980000000000000009000000000000009000000000000900000000009000000009000000900009009"}, "12": {"push": "9999999999999999999999999999999999999999999999919999999999090909090909999999909090900000999999090800000009999190900000009989090000000990908000009909000009908000900009009", "call": "9999999999999999999999999999999999999990908000009999990800000000000009988000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009009"}, "13": {"push": "9999999999999999999999999999999999999999999990909999999999090909090009999996909090500000999999090300000009999290800000009989090000000990906000009908000009902000900009009", "call": "9999999999999999999999999999999999999090800000009999990300000000000009937000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009009"}, "14": {"push": "9999999999999999999999999999999999999999999090909999999919090909010009999993909090000000999999090000000009999090700000009989090000000990900000009908000009900000900009009", "call": "9999999999999999999999999999999999929080000000009999990000000000000009900000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009009"}, "15": {"push": "9999999999999999999999999999999999999999909090909999999909090906000009999991909050000000999989090000000009989090000000009929080000000990900000009908000009800000900009009", "call": "9999999999999999999999999999999999908000000000009999770000000000000009800000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009009"}, "16": {"push": "9999999999999999999999999999999999999690909090909999999909090908000009999990908080000000999989090000000009989090000000009919080000000990800000009908000009800000900009009", "call": "9999999999999999999999993999999999900000000000009989020000000000000009800000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009000"}, "18": {"push": "9999999999999999999999999999999999999090909090909999999909090801000009999990908020000000999969080000000009989080000000009909080000000990800000009800000009800000900009009", "call": "9999999999999999999999090999999990500000000000009979000000000000000009600000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009000"}, "20": {"push": "9999999999999999999999999999999999909090909090009999999909090800000009999890900000000000999909080000000009989080000000009908000000000990800000009800000009800000900009009", "call": "9999999999999999998909090999999980000000000000009908000000000000000009000000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009000"}, "22": {"push": "9999999999999999999999999999999999909090909020009999994908080300000009999890801000000000998908020000000009919080000000009908000000000980200000009800000009200000900009009", "call": "9999999999999999490909080999999870000000000000009804000000000000000009000000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900009000"}, "25": {"push": "9999999999999999999999999999999993909090903000009999992908080000000009999890800000000000998908000000000009908080000000009808000000000980000000009800000009000000900009009", "call": "9999999999999999090806000999989000000000000000009700000000000000000009000000000000000000900000000000000009000000000000009000000000000900000000009000000009000000900001000"}};
/** Seuils [push, call] en BB : profondeur maximale (1 à 25) où la main est jouée majoritairement. */
export const NASH_THRESHOLDS: Record<string, [number | null, number | null]> = {"AA": [25.0, 25.0], "AKs": [25.0, 25.0], "AKo": [25.0, 25.0], "AQs": [25.0, 25.0], "AQo": [25.0, 25.0], "AJs": [25.0, 25.0], "AJo": [25.0, 25.0], "ATs": [25.0, 25.0], "ATo": [25.0, 25.0], "A9s": [25.0, 25.0], "A9o": [25.0, 25.0], "A8s": [25.0, 25.0], "A8o": [25.0, 25.0], "A7s": [25.0, 25.0], "A7o": [25.0, 25.0], "A6s": [25.0, 25.0], "A6o": [25.0, 21.75], "A5s": [25.0, 25.0], "A5o": [25.0, 20.5], "A4s": [25.0, 25.0], "A4o": [25.0, 18.5], "A3s": [25.0, 25.0], "A3o": [25.0, 16.75], "A2s": [25.0, 23.5], "A2o": [25.0, 15.75], "KK": [25.0, 25.0], "KQs": [25.0, 25.0], "KQo": [25.0, 25.0], "KJs": [25.0, 25.0], "KJo": [25.0, 25.0], "KTs": [25.0, 25.0], "KTo": [25.0, 23.5], "K9s": [25.0, 23.0], "K9o": [24.5, 17.0], "K8s": [25.0, 18.0], "K8o": [18.0, 13.75], "K7s": [25.0, 15.5], "K7o": [16.0, 12.25], "K6s": [25.0, 14.25], "K6o": [15.0, 11.0], "K5s": [25.0, 13.25], "K5o": [14.25, 10.0], "K4s": [24.75, 12.25], "K4o": [13.0, 9.25], "K3s": [20.25, 11.5], "K3o": [12.25, 8.75], "K2s": [19.0, 10.75], "K2o": [11.5, 8.25], "QQ": [25.0, 25.0], "QJs": [25.0, 25.0], "QJo": [25.0, 19.5], "QTs": [25.0, 21.75], "QTo": [25.0, 15.25], "Q9s": [25.0, 15.75], "Q9o": [24.5, 11.75], "Q8s": [25.0, 12.75], "Q8o": [13.0, 9.75], "Q7s": [25.0, 10.25], "Q7o": [10.0, 8.0], "Q6s": [25.0, 9.75], "Q6o": [9.75, 7.25], "Q5s": [24.25, 8.75], "Q5o": [9.0, 6.75], "Q4s": [16.25, 8.25], "Q4o": [7.75, 6.25], "Q3s": [13.5, 7.75], "Q3o": [7.5, 5.75], "Q2s": [12.25, 7.25], "Q2o": [7.0, 5.5], "JJ": [25.0, 25.0], "JTs": [25.0, 18.25], "JTo": [25.0, 12.5], "J9s": [25.0, 13.0], "J9o": [25.0, 9.5], "J8s": [25.0, 10.5], "J8o": [13.5, 7.5], "J7s": [25.0, 8.5], "J7o": [8.25, 6.25], "J6s": [19.0, 7.0], "J6o": [6.5, 5.25], "J5s": [16.25, 6.5], "J5o": [6.0, 5.0], "J4s": [13.25, 6.0], "J4o": [5.5, 4.75], "J3s": [10.5, 5.75], "J3o": [5.0, 4.5], "J2s": [8.5, 5.5], "J2o": [4.5, 4.0], "TT": [25.0, 25.0], "T9s": [25.0, 11.5], "T9o": [25.0, 8.25], "T8s": [25.0, 9.0], "T8o": [19.0, 6.5], "T7s": [25.0, 7.25], "T7o": [9.0, 5.5], "T6s": [24.25, 6.25], "T6o": [5.5, 4.5], "T5s": [12.0, 5.25], "T5o": [4.0, 4.0], "T4s": [10.75, 5.0], "T4o": [3.75, 3.75], "T3s": [7.75, 4.75], "T3o": [3.25, 3.5], "T2s": [6.5, 4.5], "T2o": [2.75, 3.5], "99": [25.0, 25.0], "98s": [25.0, 8.25], "98o": [20.25, 6.0], "97s": [25.0, 6.75], "97o": [10.75, 5.0], "96s": [25.0, 5.75], "96o": [5.0, 4.25], "95s": [14.25, 4.75], "95o": [3.5, 3.5], "94s": [6.5, 4.25], "94o": [2.5, 3.25], "93s": [4.75, 4.0], "93o": [2.5, 3.0], "92s": [3.25, 3.75], "92o": [2.25, 3.0], "88": [25.0, 25.0], "87s": [25.0, 6.5], "87o": [14.5, 4.5], "86s": [25.0, 5.5], "86o": [7.0, 4.0], "85s": [19.75, 4.75], "85o": [3.0, 3.5], "84s": [10.0, 4.0], "84o": [2.25, 3.25], "83s": [2.75, 3.5], "83o": [2.0, 2.75], "82s": [2.5, 3.5], "82o": [1.75, 2.75], "77": [25.0, 25.0], "76s": [25.0, 5.25], "76o": [10.75, 4.0], "75s": [21.5, 4.75], "75o": [2.5, 3.5], "74s": [13.25, 4.0], "74o": [2.0, 3.25], "73s": [2.5, 3.5], "73o": [1.75, 2.75], "72s": [2.0, 3.25], "72o": [1.5, 2.5], "66": [25.0, 25.0], "65s": [25.0, 4.75], "65o": [2.25, 3.5], "64s": [16.25, 4.25], "64o": [2.0, 3.25], "63s": [7.0, 3.75], "63o": [1.75, 3.0], "62s": [2.0, 3.25], "62o": [1.5, 2.5], "55": [25.0, 25.0], "54s": [21.0, 4.5], "54o": [2.0, 3.5], "53s": [12.0, 4.0], "53o": [1.75, 3.0], "52s": [2.0, 3.5], "52o": [1.5, 2.75], "44": [25.0, 25.0], "43s": [9.0, 3.75], "43o": [1.5, 3.0], "42s": [1.75, 3.25], "42o": [1.25, 2.75], "33": [25.0, 23.25], "32s": [1.75, 3.25], "32o": [1.25, 2.5], "22": [25.0, 15.25]};
