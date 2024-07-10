import { getResolutionEnum } from "../structs/stash_structs"

/*
Note

The reason this exists is because stash has alot alot of types
i mean alot alot.
This was simply an easier option than creating types for everything.
Which would be the proper way.
Anyone willing can take it upon themselves to cast this as some type and handle it properly.
*/
const INT_CRITERIONS = [
	"id",
	"file_count",
	"rating100",
	"o_counter",
	"framerate",
	"bitrate",
	"duration",
	"tag_count",
	"performer_age",
	"performer_count",
	"interactive_speed",
	"resume_time",
	"play_count",
	"play_duration",
]
const STRING_CRITERIONS = [
	"title",
	"code",
	"details",
	"director",
	"oshash",
	"checksum",
	"phash",
	"path",
	"video_codec",
	"audio_codec",
	"stash_id",
	"url",
	"captions",
]
const PHASH_DISTANCE_CRITERIONS = ["phash_distance"]
const BOOL_FILTERS = ["organized", "performer_favorite", "interactive"]
const PHASH_DUPLICATION_CRITERIONS = ["duplicated"]
const RESOLUTION_CRITERIONS = ["resolution"]
const ORIENTATION_CRITERIONS = ["orientation"]
const STRING_FILTERS = ["has_markers", "is_missing"]
const HIERARCHICALMULTI_CRITERIONS = ["studios", "tags", "performer_tags"]
const MULTI_CRITERIONS = ["groups", "movies", "galleries", "performers"]
const STASHID_CRITERIONS = ["stash_id_endpoint"]
const TIMESTAMP_CRITERIONS = ["last_played_at", "created_at", "updated_at"]
const DATE_CRITERIONS = ["date"]
const GALLERYFILTER_TYPE = ["galleries_filter"]
const PERFORMERFILTER_TYPE = ["performers_filter"]
const STUDIOSFILTER_TYPE = ["studios_filter"]
const TAGFILTER_TYPE = ["tags_filter"]
const GROUPFILTER_TYPE = ["groups_filter", "movies_filter"]
const SCENEMARKERFILTER_TYPE = ["markers_filter"]
const OPERATOR_TYPE = ["AND", "OR", "NOT"] // Not needed?

// Fix all the stash idiosyncrasies
function CriterionFixer(obj: any) {
	if (process.env.DEBUG) {
		console.debug(obj)
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
			if (!lst[key].value) {
				// When NOT_NULL or NULL
				lst[key].value = 0
			}
		} else if (STASHID_CRITERIONS.includes(key)) {
			lst[key] = {}
			lst[key].endpoint = obj[key].value.endpoint
			lst[key].stash_id = obj[key].value.stashID
			lst[key].modifier = obj[key].modifier
		} else if (PHASH_DUPLICATION_CRITERIONS.includes(key)) {
			lst[key] = {
				duplicated: obj[key].value == "true",
				//"distance": 0
			}
		} else if (STRING_FILTERS.includes(key)) {
			lst[key] = obj[key].value
		} else if (ORIENTATION_CRITERIONS.includes(key)) {
			lst[key] = {
				value: obj[key].value.map((str: string) => str.toUpperCase()),
			}
		} else if (
			HIERARCHICALMULTI_CRITERIONS.includes(key) ||
			MULTI_CRITERIONS.includes(key)
		) {
			lst[key] = {
				value: [],
				modifier: obj[key].modifier,
				depth: obj[key].value.depth,
				excludes: [],
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
			if (!lst[key].value) {
				// When NOT_NULL or NULL
				lst[key].value = ""
			}
		} else if (RESOLUTION_CRITERIONS.includes(key)) {
			lst[key] = { ...obj[key] }
			lst[key].value = getResolutionEnum(lst[key].value)
		} else if (BOOL_FILTERS.includes(key)) {
			lst[key] = obj[key].value == "true"
		} else if (
			OPERATOR_TYPE.includes(key) /* ||
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
		console.debug(lst)
	}

	return lst
}

export { CriterionFixer }
