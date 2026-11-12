// Phone models. Sizes are in millimetres (width x height), r = corner radius.
// "camera" picks the camera-cutout drawing used on the case preview.
export type CameraKind =
  | "pro-plateau" // iPhone 17 Pro / 18 Pro: full-width camera plateau
  | "air-bar" // iPhone Air: thin full-width bar, one lens
  | "pro-square" // iPhone 14–16 Pro: square, three lenses
  | "dual-vertical" // iPhone 16 / 17
  | "dual-diag" // iPhone 13–15
  | "single" // iPhone 16e
  | "sam-ultra" // Galaxy S24/S25 Ultra: separate lenses
  | "sam-island-ultra" // Galaxy S26 Ultra: camera island
  | "sam-island" // Galaxy S26 / S26+
  | "sam-vertical3"; // Galaxy S24/S25, A-series

export type PhoneModel = {
  id: string;
  brand: "apple" | "samsung";
  name: string;
  w: number;
  h: number;
  r: number;
  camera: CameraKind;
};

export const PHONES: PhoneModel[] = [
  { id: "iphone-18-pro-max", brand: "apple", name: "iPhone 18 Pro Max", w: 78.4, h: 163.8, r: 12.5, camera: "pro-plateau" },
  { id: "iphone-18-pro", brand: "apple", name: "iPhone 18 Pro", w: 72.2, h: 150.3, r: 11.5, camera: "pro-plateau" },
  { id: "iphone-17-pro-max", brand: "apple", name: "iPhone 17 Pro Max", w: 78, h: 163.4, r: 12.5, camera: "pro-plateau" },
  { id: "iphone-17-pro", brand: "apple", name: "iPhone 17 Pro", w: 71.9, h: 150, r: 11.5, camera: "pro-plateau" },
  { id: "iphone-17", brand: "apple", name: "iPhone 17", w: 71.5, h: 149.6, r: 11.5, camera: "dual-vertical" },
  { id: "iphone-air", brand: "apple", name: "iPhone Air", w: 74.7, h: 156.2, r: 12, camera: "air-bar" },
  { id: "iphone-16-pro-max", brand: "apple", name: "iPhone 16 Pro Max", w: 77.6, h: 163, r: 12.5, camera: "pro-square" },
  { id: "iphone-16-pro", brand: "apple", name: "iPhone 16 Pro", w: 71.5, h: 149.6, r: 11.5, camera: "pro-square" },
  { id: "iphone-16-plus", brand: "apple", name: "iPhone 16 Plus", w: 77.8, h: 160.9, r: 12, camera: "dual-vertical" },
  { id: "iphone-16", brand: "apple", name: "iPhone 16", w: 71.6, h: 147.6, r: 11, camera: "dual-vertical" },
  { id: "iphone-16e", brand: "apple", name: "iPhone 16e", w: 71.5, h: 146.7, r: 10.5, camera: "single" },
  { id: "iphone-15-pro-max", brand: "apple", name: "iPhone 15 Pro Max", w: 76.7, h: 159.9, r: 12, camera: "pro-square" },
  { id: "iphone-15-pro", brand: "apple", name: "iPhone 15 Pro", w: 70.6, h: 146.6, r: 11, camera: "pro-square" },
  { id: "iphone-15-plus", brand: "apple", name: "iPhone 15 Plus", w: 77.8, h: 160.9, r: 12, camera: "dual-diag" },
  { id: "iphone-15", brand: "apple", name: "iPhone 15", w: 71.6, h: 147.6, r: 11, camera: "dual-diag" },
  { id: "iphone-14-pro-max", brand: "apple", name: "iPhone 14 Pro Max", w: 77.6, h: 160.7, r: 12, camera: "pro-square" },
  { id: "iphone-14-pro", brand: "apple", name: "iPhone 14 Pro", w: 71.5, h: 147.5, r: 11, camera: "pro-square" },
  { id: "iphone-14", brand: "apple", name: "iPhone 14", w: 71.5, h: 146.7, r: 10.5, camera: "dual-diag" },
  { id: "iphone-13-pro-max", brand: "apple", name: "iPhone 13 Pro Max", w: 78.1, h: 160.8, r: 12, camera: "pro-square" },
  { id: "iphone-13", brand: "apple", name: "iPhone 13", w: 71.5, h: 146.7, r: 10.5, camera: "dual-diag" },

  { id: "galaxy-s26-ultra", brand: "samsung", name: "Galaxy S26 Ultra", w: 78.1, h: 163.6, r: 9, camera: "sam-island-ultra" },
  { id: "galaxy-s26-plus", brand: "samsung", name: "Galaxy S26+", w: 75.8, h: 158.4, r: 10, camera: "sam-island" },
  { id: "galaxy-s26", brand: "samsung", name: "Galaxy S26", w: 71.7, h: 149.6, r: 10, camera: "sam-island" },
  { id: "galaxy-s25-ultra", brand: "samsung", name: "Galaxy S25 Ultra", w: 77.6, h: 162.8, r: 6.5, camera: "sam-ultra" },
  { id: "galaxy-s25-plus", brand: "samsung", name: "Galaxy S25+", w: 75.8, h: 158.4, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-s25", brand: "samsung", name: "Galaxy S25", w: 70.5, h: 146.9, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-s25-fe", brand: "samsung", name: "Galaxy S25 FE", w: 76.6, h: 161.3, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-s24-ultra", brand: "samsung", name: "Galaxy S24 Ultra", w: 79, h: 162.3, r: 5.5, camera: "sam-ultra" },
  { id: "galaxy-s24", brand: "samsung", name: "Galaxy S24", w: 70.6, h: 147, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-a56", brand: "samsung", name: "Galaxy A56", w: 77.5, h: 162.2, r: 10, camera: "sam-island" },
  { id: "galaxy-a55", brand: "samsung", name: "Galaxy A55", w: 77.4, h: 161.1, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-a36", brand: "samsung", name: "Galaxy A36", w: 78.2, h: 162.9, r: 10, camera: "sam-island" },
  { id: "galaxy-a35", brand: "samsung", name: "Galaxy A35", w: 78, h: 161.7, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-a26", brand: "samsung", name: "Galaxy A26", w: 77.5, h: 164, r: 10, camera: "sam-vertical3" },
  { id: "galaxy-a16", brand: "samsung", name: "Galaxy A16", w: 77.9, h: 164.4, r: 10, camera: "sam-vertical3" },
];

/** Camera styles the owner can pick when adding a new model in the dashboard */
export const CAMERA_STYLES: { id: CameraKind; label: string }[] = [
  { id: "pro-plateau", label: "iPhone Pro (17 / 18): wide camera bar, 3 lenses" },
  { id: "pro-square", label: "iPhone Pro (13–16): square, 3 lenses" },
  { id: "dual-vertical", label: "iPhone (16 / 17): 2 lenses, vertical" },
  { id: "dual-diag", label: "iPhone (13–15): 2 lenses, diagonal" },
  { id: "air-bar", label: "iPhone Air: thin bar, 1 lens" },
  { id: "single", label: "1 lens (iPhone 16e style)" },
  { id: "sam-island-ultra", label: "Samsung Ultra (S26): camera island + extra lens" },
  { id: "sam-ultra", label: "Samsung Ultra (S24 / S25): separate lenses" },
  { id: "sam-island", label: "Samsung (S26 / A56): camera island, 3 lenses" },
  { id: "sam-vertical3", label: "Samsung (S25 / A-series): 3 separate lenses" },
];

export const DEFAULT_PHONE = "iphone-18-pro-max";
export const getPhone = (id: string | null | undefined) =>
  PHONES.find((p) => p.id === id) ?? PHONES[0];
