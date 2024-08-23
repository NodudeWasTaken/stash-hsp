// Define the data
const resolutions = [144, 240, 360, 480, 720, 1080, 2160, 4000]
const bitrates = {
	"Ultra low": [30, 60, 120, 250, 500, 1000, 2000, 4000],
	Low: [60, 120, 250, 500, 1000, 2000, 4000, 8000],
	Medium: [120, 250, 500, 1000, 2000, 4000, 8000, 16000],
	High: [250, 500, 1000, 2000, 4000, 8000, 16000, 24000],
	"Ultra high": [500, 1000, 2000, 4000, 8000, 16000, 24000, 48000],
	Extreme: [1000, 2000, 4000, 8000, 16000, 24000, 48000],
	Ludicrous: [2000, 4000, 8000, 16000, 24000, 48000, 96000, 192000],
}
const bitrateLevels: { [label: string]: number } = {
	"Ultra low": 1,
	Low: 2,
	Medium: 3,
	High: 4,
	"Ultra high": 5,
	Extreme: 6,
	Ludicrous: 7,
}

// Coefficients and intercept from the Python model
const a1 = -0.0006188412880438987 // Coefficient for Resolution
const a2 = 4.235796975851243e-5 // Coefficient for Bitrate
const intercept = 4.096706134633931 // Intercept

// Function to predict quality based on resolution and bitrate
function predictBitrate(
	resolution: number,
	bitrate: number,
	frame_rate: number
): number {
	// If 60FPS then we require 50% more bitrate
	if (frame_rate >= 50) {
		bitrate *= 0.5
	}

	const quality = a1 * resolution + a2 * bitrate + intercept
	return quality
}

// Reverse mapping from resolution strings to heights
const reverseBitrateMapping: { [val: number]: string } = {}
for (const [label, val] of Object.entries(bitrateLevels)) {
	reverseBitrateMapping[val] = label
}

// Function to find the closest quality level
export function _findBitrateLevel(
	resolution: number,
	bitrate: number,
	frame_rate: number
): number {
	return predictBitrate(resolution, bitrate, frame_rate)
}
export function findBitrateLevel(
	resolution: number,
	bitrate: number,
	frame_rate: number
) {
	const pq = _findBitrateLevel(resolution, bitrate, frame_rate)
	return Math.max(
		Math.min(Math.round(pq), bitrateLevels["Ludicrous"]!),
		bitrateLevels["Ultra low"]!
	)
}
export function findBitrateLabel(val: number) {
	return reverseBitrateMapping[val]
}
