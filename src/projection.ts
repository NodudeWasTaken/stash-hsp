import {
	HeresphereLensMKX200,
	HeresphereLensMKX220,
	HeresphereLensVRCA220,
	HeresphereProjectionEquirectangular,
	HeresphereProjectionEquirectangular360,
	HeresphereProjectionEquirectangularCubemap,
	HeresphereProjectionFisheye,
	HeresphereProjectionPerspective,
	HeresphereStereoMono,
	HeresphereStereoSbs,
	HeresphereStereoTB,
	HeresphereVideoEntry,
	HeresphereVideoTag,
} from "./heresphere_structs"
import { getBasename } from "./utilities"
import { VR_TAG } from "./vars"

function findProjectionTagsFromTags(
	processedScene: HeresphereVideoEntry,
	tags: HeresphereVideoTag[]
): void {
	tags.forEach((tag) => {
		const tagPre = tag.name.replace(/^Tag:/, "")

		// Has degrees tag
		if (tagPre.endsWith("°")) {
			const deg = tagPre.slice(0, -1)
			const s = parseFloat(deg)
			if (!isNaN(s)) {
				processedScene.fov = s
			}
		}

		// Has VR tag
		const vrTag = VR_TAG
		if (vrTag && tagPre === vrTag) {
			if (processedScene.projection === HeresphereProjectionPerspective) {
				processedScene.projection = HeresphereProjectionEquirectangular
			}
			if (processedScene.stereo === HeresphereStereoMono) {
				processedScene.stereo = HeresphereStereoSbs
			}
		}

		// Has Fisheye tag
		if (tagPre === "Fisheye") {
			processedScene.projection = HeresphereProjectionFisheye
			if (processedScene.stereo === HeresphereStereoMono) {
				processedScene.stereo = HeresphereStereoSbs
			}
		}
	})
}

function findProjectionTagsFromFilename(
	processedScene: HeresphereVideoEntry,
	filename: string
): void {
	const path = filename.toUpperCase()

	// Stereo settings
	if (path.includes("_LR") || path.includes("_3DH")) {
		processedScene.stereo = HeresphereStereoSbs
	}
	if (path.includes("_RL")) {
		processedScene.stereo = HeresphereStereoSbs
		processedScene.isEyeSwapped = true
	}
	if (path.includes("_TB") || path.includes("_3DV")) {
		processedScene.stereo = HeresphereStereoTB
	}
	if (path.includes("_BT")) {
		processedScene.stereo = HeresphereStereoTB
		processedScene.isEyeSwapped = true
	}

	// Projection settings
	if (path.includes("_EAC360") || path.includes("_360EAC")) {
		processedScene.projection = HeresphereProjectionEquirectangularCubemap
		processedScene.fov = 360.0
	}
	if (path.includes("_360")) {
		processedScene.projection = HeresphereProjectionEquirectangular360
		processedScene.fov = 360.0
	}
	if (
		path.includes("_F180") ||
		path.includes("_180F") ||
		path.includes("_VR180")
	) {
		processedScene.projection = HeresphereProjectionFisheye
		processedScene.fov = 180.0
	} else if (path.includes("_180")) {
		processedScene.projection = HeresphereProjectionEquirectangular
		processedScene.fov = 180.0
	}
	if (path.includes("_MKX200")) {
		processedScene.projection = HeresphereProjectionFisheye
		processedScene.fov = 200.0
		processedScene.lens = HeresphereLensMKX200
	}
	if (path.includes("_MKX220")) {
		processedScene.projection = HeresphereProjectionFisheye
		processedScene.fov = 220.0
		processedScene.lens = HeresphereLensMKX220
	}
	if (path.includes("_FISHEYE")) {
		processedScene.projection = HeresphereProjectionFisheye
	}
	if (path.includes("_RF52") || path.includes("_FISHEYE190")) {
		processedScene.projection = HeresphereProjectionFisheye
		processedScene.fov = 190.0
	}
	if (path.includes("_VRCA220")) {
		processedScene.projection = HeresphereProjectionFisheye
		processedScene.fov = 220.0
		processedScene.lens = HeresphereLensVRCA220
	}
}

export function FindProjectionTags(
	scene: any,
	processedScene: HeresphereVideoEntry
): void {
	if (processedScene.tags) {
		findProjectionTagsFromTags(processedScene, processedScene.tags)
	}

	const file = scene.files
	if (file.length > 0) {
		findProjectionTagsFromFilename(processedScene, getBasename(file[0].path))
	}
}
