import { Tags, SportsMap, SportsTagsMap } from 'types/markets';

export const TAGS_LIST: Tags = [
    { id: 9001, label: 'NCAA Football', logo: `/logos/leagueLogos/ncaa.png`, favourite: false, hidden: false },
    { id: 9002, label: 'NFL', logo: `/logos/leagueLogos/nfl.png`, favourite: false, hidden: false },
    { id: 9003, label: 'MLB', logo: `/logos/leagueLogos/mlb.svg`, favourite: false, hidden: false },
    { id: 9004, label: 'NBA', logo: `/logos/leagueLogos/nba.svg`, favourite: false, hidden: false },
    { id: 9005, label: 'NCAA Basketball', favourite: false, hidden: false },
    { id: 9006, label: 'NHL', logo: `/logos/leagueLogos/nhl.png`, favourite: false, hidden: false },
    { id: 9007, label: 'UFC', logo: '/logos/ufc-logo.png', favourite: false, hidden: false },
    { id: 9008, label: 'WNBA', favourite: false, hidden: false },
    { id: 9010, label: 'MLS', logo: `/logos/leagueLogos/mls.png`, favourite: false, hidden: false },
    { id: 9011, label: 'EPL', logo: `/logos/leagueLogos/EPL.png`, favourite: false, hidden: false },
    { id: 9012, label: 'Ligue 1', logo: `/logos/leagueLogos/Ligue1.png`, favourite: false, hidden: false },
    { id: 9013, label: 'Bundesliga', logo: '/logos/leagueLogos/bundesliga.png', favourite: false, hidden: false },
    { id: 9014, label: 'La Liga', logo: `/logos/leagueLogos/LaLiga.png`, favourite: false, hidden: false },
    { id: 9015, label: 'Serie A', logo: `/logos/leagueLogos/seriea.png`, favourite: false, hidden: false },
    { id: 9016, label: 'UEFA CL', logo: `/logos/leagueLogos/ucl-white.png`, favourite: false, hidden: false },
    { id: 9100, label: 'Formula 1', logo: '/logos/leagueLogos/f1.png', favourite: false, hidden: false },
    { id: 9101, label: 'MotoGP', logo: `/logos/leagueLogos/motogp.png`, favourite: false, hidden: false },
];

export const SPORTS_MAP: SportsMap = {
    9001: 'Football',
    9002: 'Football',
    9003: 'Baseball',
    9004: 'Basketball',
    9005: 'Basketball',
    9006: 'Hockey',
    9007: 'UFC',
    9008: 'Basketball',
    9010: 'Soccer',
    9011: 'Soccer',
    9012: 'Soccer',
    9013: 'Soccer',
    9014: 'Soccer',
    9015: 'Soccer',
    9016: 'Soccer',
    9100: 'Motosport',
    9101: 'Motosport',
};

export const TAGS_OF_MARKETS_WITHOUT_DRAW_ODDS = [9002, 9003, 9004, 9005, 9006, 9008, 9007, 9100, 9101];

export const SPORTS_TAGS_MAP: SportsTagsMap = {
    Football: [9001, 9002],
    Baseball: [9003],
    Basketball: [9004, 9005, 9008],
    Hockey: [9006],
    Soccer: [9010, 9011, 9012, 9013, 9014, 9015, 9016],
    UFC: [9007],
    Motosport: [9100, 9101],
};

export enum TAGS_FLAGS {
    NCAA_FOOTBALL = 9001,
    NFL = 9002,
    MLB = 9003,
    NBA = 9004,
    NCAA_BASKETBALL = 9005,
    NHL = 9006,
    UFC = 9007,
    WNBA = 9008,
    MLS = 9010,
    EPL = 9011,
    LIGUE_ONE = 9012,
    BUNDESLIGA = 9013,
    LA_LIGA = 9014,
    SERIE_A = 9015,
    UEFA_CL = 9016,
    FORMULA1 = 9100,
    MOTOGP = 9101,
}
