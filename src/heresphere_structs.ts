// heresphere.ts

export const HeresphereJsonVersion = 1;

export const HeresphereGuest = 0;
export const HeresphereMember = 1;
export const HeresphereBadLogin = -1;

export type HeresphereProjection = 
  | "equirectangular"
  | "perspective"
  | "equirectangular360"
  | "fisheye"
  | "cubemap"
  | "equiangularCubemap";

export const HeresphereProjectionEquirectangular: HeresphereProjection = "equirectangular";
export const HeresphereProjectionPerspective: HeresphereProjection = "perspective";
export const HeresphereProjectionEquirectangular360: HeresphereProjection = "equirectangular360";
export const HeresphereProjectionFisheye: HeresphereProjection = "fisheye";
export const HeresphereProjectionCubemap: HeresphereProjection = "cubemap";
export const HeresphereProjectionEquirectangularCubemap: HeresphereProjection = "equiangularCubemap";

export type HeresphereStereo = "mono" | "sbs" | "tb";

export const HeresphereStereoMono: HeresphereStereo = "mono";
export const HeresphereStereoSbs: HeresphereStereo = "sbs";
export const HeresphereStereoTB: HeresphereStereo = "tb";

export type HeresphereLens = "Linear" | "MKX220" | "MKX200" | "VRCA220";

export const HeresphereLensLinear: HeresphereLens = "Linear";
export const HeresphereLensMKX220: HeresphereLens = "MKX220";
export const HeresphereLensMKX200: HeresphereLens = "MKX200";
export const HeresphereLensVRCA220: HeresphereLens = "VRCA220";

export type HeresphereEventType = 0 | 1 | 2 | 3;

export const HeresphereEventOpen: HeresphereEventType = 0;
export const HeresphereEventPlay: HeresphereEventType = 1;
export const HeresphereEventPause: HeresphereEventType = 2;
export const HeresphereEventClose: HeresphereEventType = 3;

export const HeresphereAuthHeader = "auth-token";

export interface HeresphereAuthResp {
  "auth-token": string;
  access: number;
}

export interface HeresphereBanner {
  image: string;
  link: string;
}

export interface HeresphereIndexEntry {
  name: string;
  list: string[];
}

export interface HeresphereIndex {
  access: number;
  banner: HeresphereBanner;
  library: HeresphereIndexEntry[];
}

export interface HeresphereVideoScript {
  name: string;
  url: string;
  rating?: number;
}

export interface HeresphereVideoSubtitle {
  name: string;
  language: string;
  url: string;
}

export interface HeresphereVideoTag {
  name: string;
  start?: number;
  end?: number;
  track?: number;
  rating?: number;
}

export interface HeresphereVideoMediaSource {
  resolution: number;
  height: number;
  width: number;
  size: number;
  url: string;
}

export interface HeresphereVideoMedia {
  name: string;
  sources: HeresphereVideoMediaSource[];
}

export interface HeresphereHSPEntry {
  url: string;
  version: number;
}

export interface HeresphereVideoEntry {
  access: number;
  title: string;
  description: string;
  thumbnailImage: string;
  thumbnailVideo?: string;
  dateReleased?: string;
  dateAdded?: string;
  duration?: number;
  rating?: number;
  favorites: number;
  comments?: number;
  isFavorite: boolean;
  projection: HeresphereProjection;
  stereo: HeresphereStereo;
  isEyeSwapped: boolean;
  fov?: number;
  lens: HeresphereLens;
  cameraIPD: number;
  hspArray?: HeresphereHSPEntry[];
  eventServer?: string;
  scripts?: HeresphereVideoScript[];
  subtitles?: HeresphereVideoSubtitle[];
  tags?: HeresphereVideoTag[];
  media?: HeresphereVideoMedia[];
  writeFavorite: boolean;
  writeRating: boolean;
  writeTags: boolean;
  writeHSP: boolean;
  // alphaPackedSettings
  // chromaKeySettings
}

export interface HeresphereVideoEntryShort {
  link: string;
  title: string;
  dateReleased?: string;
  dateAdded?: string;
  duration?: number;
  rating?: number;
  favorites: number;
  comments: number;
  isFavorite: boolean;
  tags: HeresphereVideoTag[];
}

export interface HeresphereScanIndex {
  scanData: HeresphereVideoEntryShort[];
}

export interface HeresphereAuthReq {
  username: string;
  password: string;
  needsMediaSource?: boolean;
  isFavorite?: boolean;
  rating?: number;
  tags?: HeresphereVideoTag[];
  hspBase64?: string;
  deleteFile?: boolean;
}

export interface HeresphereVideoEvent {
  username: string;
  id: string;
  title: string;
  event: HeresphereEventType;
  time: number;
  speed: number;
  utc: number;
  connectionKey: string;
}
