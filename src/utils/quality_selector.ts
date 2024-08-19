/*
Poorly designed quality selector.
We should be using no reference image quality like piqe or niqe, but this will do for now
*/

// Define the data
const resolutions = [144, 240, 360, 480, 720, 1080]
const bitrates = {
	"Ultra low": [60, 120, 250, 500, 1000, 2000],
	Low: [120, 250, 500, 1000, 2000, 4000],
	Medium: [250, 500, 1000, 2000, 4000, 8000],
	High: [500, 1000, 2000, 4000, 8000, 16000],
	"Ultra high": [1000, 2000, 4000, 8000, 16000, 24000],
}
const qualityLevels: { [label: string]: number } = {
	"Ultra low": 1,
	Low: 2,
	Medium: 3,
	High: 4,
	"Ultra high": 5,
}

// Reverse mapping from resolution strings to heights
const reverseQualityMapping: { [val: number]: string } = {}
for (const [label, val] of Object.entries(qualityLevels)) {
	reverseQualityMapping[val] = label
}

// Function to find the closest index
function findClosestIndex(array: number[], value: number): number {
	return array.reduce(
		(prevIndex, currValue, currIndex) =>
			Math.abs(currValue - value) < Math.abs(array[prevIndex]! - value)
				? currIndex
				: prevIndex,
		0
	)
}

// Function to find the closest quality level
export function findQualityLevel(resolution: number, bitrate: number): number {
	const maxQualityLevel = 5 // Define your cap here

	// Find closest resolution and framerate
	const closestResolutionIndex = findClosestIndex(resolutions, resolution)
	const closestResolution = resolutions[closestResolutionIndex]!

	// Find closest bitrate levels and determine quality
	let closestQualityLevel = maxQualityLevel
	for (const [quality, levels] of Object.entries(bitrates)) {
		const currentBitrate = levels[closestResolutionIndex]!
		if (currentBitrate >= bitrate) {
			closestQualityLevel = Math.min(
				qualityLevels[quality]!,
				closestQualityLevel
			)
		}
	}
	return closestQualityLevel
}
export function findQualityLabel(val: number) {
	return reverseQualityMapping[val]
}
