import type { CountryCode } from "./config";

export const COUNTRIES: { code: CountryCode; sq: string; en: string; flag: string; dial: string }[] = [
  { code: "KS", sq: "Kosovë", en: "Kosovo", flag: "🇽🇰", dial: "+383" },
  { code: "AL", sq: "Shqipëri", en: "Albania", flag: "🇦🇱", dial: "+355" },
  { code: "MK", sq: "Maqedoni e Veriut", en: "North Macedonia", flag: "🇲🇰", dial: "+389" },
];

// All 38 municipalities of Kosovo
const KS = [
  "Prishtinë", "Prizren", "Pejë", "Gjakovë", "Ferizaj", "Gjilan", "Mitrovicë", "Mitrovicë e Veriut",
  "Podujevë", "Vushtrri", "Suharekë", "Rahovec", "Drenas", "Lipjan", "Malishevë", "Kamenicë",
  "Viti", "Deçan", "Istog", "Klinë", "Skenderaj", "Dragash", "Fushë Kosovë", "Kaçanik", "Shtime",
  "Obiliq", "Novobërdë", "Graçanicë", "Hani i Elezit", "Junik", "Mamushë", "Kllokot", "Ranillug",
  "Partesh", "Shtërpcë", "Zveçan", "Zubin Potok", "Leposaviq",
];

// All 61 municipalities of Albania (main town in brackets where it differs)
const AL = [
  "Tiranë", "Durrës", "Vlorë", "Elbasan", "Shkodër", "Fier", "Korçë", "Berat", "Lushnjë", "Kavajë",
  "Pogradec", "Lezhë", "Gjirokastër", "Sarandë", "Kamëz", "Kukës", "Patos", "Krujë", "Kuçovë",
  "Peqin", "Rrogozhinë", "Shijak", "Vorë", "Divjakë", "Roskovec", "Mallakastër (Ballsh)",
  "Dimal (Ura Vajgurore)", "Poliçan", "Skrapar (Çorovodë)", "Belsh", "Cërrik", "Gramsh", "Librazhd",
  "Prrenjas", "Dropull", "Këlcyrë", "Libohovë", "Memaliaj", "Përmet", "Tepelenë", "Devoll (Bilisht)",
  "Kolonjë (Ersekë)", "Maliq", "Pustec", "Has (Krumë)", "Tropojë (Bajram Curri)", "Kurbin (Laç)",
  "Mirditë (Rrëshen)", "Fushë-Arrëz", "Malësi e Madhe (Koplik)", "Pukë", "Vau i Dejës",
  "Bulqizë", "Dibër (Peshkopi)", "Klos", "Mat (Burrel)", "Delvinë", "Finiq", "Himarë",
  "Konispol", "Selenicë",
];

// All 80 municipalities of North Macedonia (Albanian name added where commonly used)
const MK = [
  "Shkup – Qendër / Skopje – Centar", "Shkup – Çair / Skopje – Čair", "Shkup – Aerodrom / Skopje – Aerodrom",
  "Shkup – Butel / Skopje – Butel", "Shkup – Gazi Babë / Skopje – Gazi Baba",
  "Shkup – Gjorçe Petrov / Skopje – Gjorče Petrov", "Shkup – Karposh / Skopje – Karpoš",
  "Shkup – Kisella Vodë / Skopje – Kisela Voda", "Shkup – Saraj / Skopje – Saraj",
  "Shkup – Shuto Orizarë / Skopje – Šuto Orizari",
  "Tetovë / Tetovo", "Gostivar", "Kumanovë / Kumanovo", "Strugë / Struga", "Dibër / Debar",
  "Kërçovë / Kičevo", "Ohër / Ohrid", "Manastir / Bitola", "Prilep", "Veles", "Shtip / Štip",
  "Strumicë / Strumica", "Kavadarci", "Koçani / Kočani", "Gjevgjeli / Gevgelija", "Radovish / Radoviš",
  "Kriva Pallankë / Kriva Palanka", "Negotinë / Negotino", "Sveti Nikole", "Kratovë / Kratovo",
  "Resnjë / Resen", "Krushevë / Kruševo", "Delçevë / Delčevo", "Vinicë / Vinica", "Berovë / Berovo",
  "Probishtip / Probištip", "Makedonska Kamenica", "Makedonski Brod", "Demir Hisar", "Demir Kapija",
  "Valandovë / Valandovo", "Bogdanci", "Dojran", "Pehçevë / Pehčevo", "Likovë / Lipkovo",
  "Haraçinë / Aračinovo", "Bogovinë / Bogovinje", "Bërvenicë / Brvenica", "Vrapçisht / Vrapčište",
  "Zhelinë / Želino", "Tearcë / Tearce", "Jegunoc / Jegunovce", "Studeniçan / Studeničani",
  "Sopisht / Sopište", "Zelenikovë / Zelenikovo", "Petrovec", "Ilinden",
  "Çuçer-Sandevë / Čučer-Sandevo", "Rankovcë / Rankovce", "Staro Nagoričane", "Mavrovë dhe Rostushë / Mavrovo i Rostuše",
  "Qendër Zhupë / Centar Župa", "Plasnicë / Plasnica", "Vevçan / Vevčani", "Debarcë / Debarca",
  "Dollnen / Dolneni", "Krivogashtan / Krivogaštani", "Mogillë / Mogila", "Novaci", "Gradsko",
  "Rosoman", "Çashkë / Čaška", "Lozovë / Lozovo", "Karbinci", "Zrnovci", "Çeshinovë-Obleshevë / Češinovo-Obleševo",
  "Vasilevë / Vasilevo", "Bosilovë / Bosilovo", "Novo Sellë / Novo Selo", "Konçe / Konče",
];

export const CITIES: Record<CountryCode, string[]> = {
  KS: [...KS].sort((a, b) => a.localeCompare(b, "sq")),
  AL: [...AL].sort((a, b) => a.localeCompare(b, "sq")),
  MK: [...MK].sort((a, b) => a.localeCompare(b, "sq")),
};

// Most-ordered cities shown first
export const POPULAR: Record<CountryCode, string[]> = {
  KS: ["Prishtinë", "Prizren", "Pejë", "Gjakovë", "Ferizaj", "Gjilan", "Mitrovicë"],
  AL: ["Tiranë", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Fier", "Korçë"],
  MK: ["Shkup – Çair / Skopje – Čair", "Tetovë / Tetovo", "Gostivar", "Kumanovë / Kumanovo", "Strugë / Struga", "Ohër / Ohrid"],
};

export const isValidCity = (country: CountryCode, city: string) => CITIES[country]?.includes(city);
