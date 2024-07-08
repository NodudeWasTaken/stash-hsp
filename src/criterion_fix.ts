
const INT_CRITERIONS = ["id","file_count","rating100","o_counter","framerate","bitrate","duration","tag_count","performer_age","performer_count","interactive_speed","resume_time","play_count","play_duration"]
const STRING_CRITERIONS = ["title","code","details","director","oshash","checksum","phash","path","video_codec","audio_codec","stash_id","url","captions"]
const PHASH_DISTANCE_CRITERIONS = ["phash_distance"]
const BOOL_FILTERS = ["organized","performer_favorite","interactive"]
const PHASH_DUPLICATION_CRITERIONS = ["duplicated"]
const RESOLUTION_CRITERIONS = ["resolution"]
const ORIENTATION_CRITERIONS = ["orientation"]
const STRING_FILTERS = ["has_markers","is_missing"]
const HIERARCHICALMULTI_CRITERIONS = ["studios","tags","performer_tags"]
const MULTI_CRITERIONS = ["groups","movies","galleries","performers"]
const STASHID_CRITERIONS = ["stash_id_endpoint"]
const TIMESTAMP_CRITERIONS = ["last_played_at","created_at","updated_at"]
const DATE_CRITERIONS = ["date"]
const GALLERYFILTER_TYPE = ["galleries_filter"]
const PERFORMERFILTER_TYPE = ["performers_filter"]
const STUDIOSFILTER_TYPE = ["studios_filter"]
const TAGFILTER_TYPE = ["tags_filter"]
const GROUPFILTER_TYPE = ["groups_filter","movies_filter"]
const SCENEMARKERFILTER_TYPE = ["markers_filter"]
const OPERATOR_TYPE = ["AND","OR","NOT"] // Not needed?

enum ResolutionEnum {
	"144p" = "144p",
	VERY_LOW = "VERY_LOW",
	"240p" = "240p",
	LOW = "LOW",
	"360p" = "360p",
	R360P = "R360P",
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
	"1920p" = "1920p",
	VR_HD = "VR_HD",
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
}
	
function getResolutionEnum(resolution: string): ResolutionEnum {
	// Remove non-numeric characters to extract the resolution number
	const resolutionNumber = parseInt(resolution.replace(/\D/g, ''));

	if (isNaN(resolutionNumber)) {
		// If resolution cannot be parsed, return the default value for invalid cases
		return ResolutionEnum.VERY_LOW;
	}
	
	// Determine the appropriate enum value based on resolution number
	if (resolutionNumber < 144) {
		return ResolutionEnum["144p"];
	} else if (resolutionNumber >= 144 && resolutionNumber < 240) {
		return ResolutionEnum["240p"];
	} else if (resolutionNumber >= 240 && resolutionNumber < 360) {
		return ResolutionEnum["360p"];
	} else if (resolutionNumber >= 360 && resolutionNumber < 480) {
		return ResolutionEnum["480p"];
	} else if (resolutionNumber >= 480 && resolutionNumber < 540) {
		return ResolutionEnum["540p"];
	} else if (resolutionNumber >= 540 && resolutionNumber < 720) {
		return ResolutionEnum["720p"];
	} else if (resolutionNumber >= 720 && resolutionNumber < 1080) {
		return ResolutionEnum["1080p"];
	} else if (resolutionNumber >= 1080 && resolutionNumber < 1440) {
		return ResolutionEnum["FULL_HD"];
	} else if (resolutionNumber >= 1440 && resolutionNumber < 1920) {
		return ResolutionEnum["QUAD_HD"];
	} else if (resolutionNumber >= 1920 && resolutionNumber < 4000) {
		return ResolutionEnum["1920p"];
	} else if (resolutionNumber >= 4000 && resolutionNumber < 5000) {
		return ResolutionEnum["FOUR_K"];
	} else if (resolutionNumber >= 5000 && resolutionNumber < 6000) {
		return ResolutionEnum["FIVE_K"];
	} else if (resolutionNumber >= 6000 && resolutionNumber < 7000) {
		return ResolutionEnum["SIX_K"];
	} else if (resolutionNumber >= 7000 && resolutionNumber < 8000) {
		return ResolutionEnum["SEVEN_K"];
	} else if (resolutionNumber >= 8000 && resolutionNumber < 9000) {
		return ResolutionEnum["EIGHT_K"];
	} else {
		return ResolutionEnum.HUGE;
	}
}

// Fix all the stash idiosyncrasies
function CriterionFixer(obj: any) {
	if (process.env.DEBUG) {
		console.log(obj)
	}

	var lst: any = {}
	for (let key of Object.keys(obj)) {
		if (
			INT_CRITERIONS.includes(key) || 
			DATE_CRITERIONS.includes(key) ||
			TIMESTAMP_CRITERIONS.includes(key)
		) {
			lst[key] = { ...obj[key].value }
			lst[key].modifier = obj[key].modifier
			if (!lst[key].value) { // When NOT_NULL or NULL
				lst[key].value = 0
			}
		} else if (STASHID_CRITERIONS.includes(key)) {
			lst[key] = {}
			lst[key].endpoint = obj[key].value.endpoint
			lst[key].stash_id = obj[key].value.stashID
			lst[key].modifier = obj[key].modifier
		} else if (PHASH_DUPLICATION_CRITERIONS.includes(key)) {
			lst[key] = {
				"duplicated": obj[key].value == "true"
				//"distance": 0
			}
		} else if (STRING_FILTERS.includes(key)) {
			lst[key] = obj[key].value
		} else if (ORIENTATION_CRITERIONS.includes(key)) {
			lst[key] = {
				value: obj[key].value.map((str: string) => str.toUpperCase())
			}
		} else if (
			HIERARCHICALMULTI_CRITERIONS.includes(key) || 
			MULTI_CRITERIONS.includes(key)
		) {
			lst[key] = {
				"value": [],
				"modifier": obj[key].modifier,
				"depth": obj[key].value.depth,
				"excludes": []
			}
			if (obj[key].items != null) {
				for (let entry of obj[key].items) {
					lst[key].value.push(entry.id)
				}
			}
			if (obj[key].excludes != null) {
				for (let entry of obj[key].excludes) {
					lst[key].excludes.push(entry.id)
				}
			}
		} else if (
			STRING_CRITERIONS.includes(key) || 
			PHASH_DISTANCE_CRITERIONS.includes(key)
		) {
			lst[key] = { ...obj[key] }
			if (!lst[key].value) { // When NOT_NULL or NULL
				lst[key].value = ""
			}
		} else if (RESOLUTION_CRITERIONS.includes(key)) {
			lst[key] = { ...obj[key] }
			lst[key].value = getResolutionEnum(lst[key].value)
		} else if (BOOL_FILTERS.includes(key)) {
			lst[key] = obj[key].value == "true"
		} else if (
			OPERATOR_TYPE.includes(key)/* ||
			GALLERYFILTER_TYPE.includes(key) || // This is dangerous, we dont know that the previously defined criterions match
			PERFORMERFILTER_TYPE.includes(key) ||
			STUDIOSFILTER_TYPE.includes(key) ||
			TAGFILTER_TYPE.includes(key) ||
			GROUPFILTER_TYPE.includes(key) ||
			SCENEMARKERFILTER_TYPE.includes(key)*/
		) {
			lst[key] = CriterionFixer(obj[key])
		}
	}

	if (process.env.DEBUG) {
		console.log(lst)
	}

	return lst
}

export { CriterionFixer }