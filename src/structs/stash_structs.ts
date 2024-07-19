//stash_structs.ts

export enum ResolutionEnum {
	"144p" = "144p",
	VERY_LOW = "VERY_LOW",
	"240p" = "240p",
	LOW = "LOW",
	/*"360p" = "360p",
	R360P = "R360P",*/
	"480p" = "480p",
	STANDARD = "STANDARD",
	"540p" = "540p",
	WEB_HD = "WEB_HD",
	"720p" = "720p",
	STANDARD_HD = "STANDARD_HD",
	"1080p" = "1080p",
	FULL_HD = "FULL_HD",
	"1440p" = "QUAD_HD",
	QUAD_HD = "QUAD_HD",
	"4K" = "FOUR_K",
	FOUR_K = "FOUR_K",
	"5K" = "FIVE_K",
	FIVE_K = "FIVE_K",
	"6K" = "SIX_K",
	SIX_K = "SIX_K",
	"7K" = "SEVEN_K",
	SEVEN_K = "SEVEN_K",
	"8K" = "EIGHT_K",
	EIGHT_K = "EIGHT_K",
	"8K+" = "HUGE",
	HUGE = "HUGE",
	ORIGINAL = "ORIGINAL",
}

export function getResolutionEnum(resolution: string): ResolutionEnum {
	// Remove non-numeric characters to extract the resolution number
	const resolutionNumber = parseInt(resolution.replace(/\D/g, ""))

	if (isNaN(resolutionNumber)) {
		// If resolution cannot be parsed, return the default value for invalid cases
		return ResolutionEnum.VERY_LOW
	}

	// Determine the appropriate enum value based on resolution number
	if (resolutionNumber < 144) {
		return ResolutionEnum["144p"]
	} else if (resolutionNumber >= 144 && resolutionNumber < 240) {
		return ResolutionEnum["240p"]
		/*} else if (resolutionNumber >= 240 && resolutionNumber < 360) {
		return ResolutionEnum["360p"]*/
	} else if (resolutionNumber >= 360 && resolutionNumber < 480) {
		return ResolutionEnum["480p"]
	} else if (resolutionNumber >= 480 && resolutionNumber < 540) {
		return ResolutionEnum["540p"]
	} else if (resolutionNumber >= 540 && resolutionNumber < 720) {
		return ResolutionEnum["720p"]
	} else if (resolutionNumber >= 720 && resolutionNumber < 1080) {
		return ResolutionEnum["1080p"]
	} else if (resolutionNumber >= 1080 && resolutionNumber < 1440) {
		return ResolutionEnum["FULL_HD"]
	} else if (resolutionNumber >= 1440 && resolutionNumber < 2160) {
		return ResolutionEnum["QUAD_HD"]
	} else if (resolutionNumber >= 2160 && resolutionNumber < 5120) {
		return ResolutionEnum["FOUR_K"]
	} else if (resolutionNumber >= 5120 && resolutionNumber < 6000) {
		// TODO: Is this correct?
		return ResolutionEnum["FIVE_K"]
	} else if (resolutionNumber >= 6000 && resolutionNumber < 7000) {
		return ResolutionEnum["SIX_K"]
	} else if (resolutionNumber >= 7000 && resolutionNumber < 8000) {
		return ResolutionEnum["SEVEN_K"]
	} else if (resolutionNumber >= 8000 && resolutionNumber < 9000) {
		return ResolutionEnum["EIGHT_K"]
	} else {
		return ResolutionEnum.HUGE
	}
}

// Mapping of heights to resolution enum values, excluding numeric values
export const resolutionMapping: { [height: number]: ResolutionEnum } = {
	240: ResolutionEnum.LOW,
	480: ResolutionEnum.STANDARD,
	720: ResolutionEnum.STANDARD_HD,
	1080: ResolutionEnum.FULL_HD,
	2160: ResolutionEnum.FOUR_K, // 4K is 2160p
	0: ResolutionEnum.ORIGINAL, // Assuming HUGE is anything above 8K
}

// Reverse mapping from resolution strings to heights
export const reverseMapping: { [resolution: string]: number } = {}
for (const [height, resolution] of Object.entries(resolutionMapping)) {
	reverseMapping[resolution] = parseInt(height)
}

export const getResolutionsLessThanOrEqualTo = (
	vidRes: number,
	maxResIn: number
): ResolutionEnum[] => {
	let result: ResolutionEnum[] = []

	for (let [height, resolutions] of Object.entries(resolutionMapping)) {
		const _height =
			resolutions == ResolutionEnum.ORIGINAL ? vidRes : parseInt(height)

		if (_height <= maxResIn) {
			result.push(resolutions)
		}
	}

	return result
}
