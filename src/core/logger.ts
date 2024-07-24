import fs from "fs"
import path from "path"
import { ensureDirectoryExists } from "../utils/utilities"
import { VAR_LOGS_DIR } from "./vars"

// Define log file path
const timestamp = new Date().toISOString().replace(/:/g, "-")
const logFilePath = path.join(VAR_LOGS_DIR, `app-${timestamp}.log`)

// Function to append logs to the file
export function appendLog(
	level: string,
	message?: any,
	...optionalParams: any[]
): void {
	const timestamp = new Date().toISOString()

	// Serialize the message and optional parameters to ensure objects are properly logged
	const serialize = (input: any): string => {
		if (typeof input === "object" && input !== null) {
			return JSON.stringify(input, null, 2)
		}
		return String(input)
	}

	const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${serialize(
		message
	)} ${optionalParams.map(serialize).join(" ")}\n`

	ensureDirectoryExists(VAR_LOGS_DIR)
	fs.appendFileSync(logFilePath, formattedMessage, { encoding: "utf8" })
}

// Save original console methods
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error
const originalConsoleDebug = console.debug

// Override console.log
console.log = (message?: any, ...optionalParams: any[]): void => {
	appendLog("log", message, ...optionalParams)
	originalConsoleLog(message, ...optionalParams)
}

// Override console.warn
console.warn = (message?: any, ...optionalParams: any[]): void => {
	appendLog("warn", message, ...optionalParams)
	originalConsoleWarn(message, ...optionalParams)
}

// Override console.error
console.error = (message?: any, ...optionalParams: any[]): void => {
	appendLog("error", message, ...optionalParams)
	originalConsoleError(message, ...optionalParams)
}

// Override console.debug
console.debug = (message?: any, ...optionalParams: any[]): void => {
	appendLog("debug", message, ...optionalParams)
	originalConsoleDebug(message, ...optionalParams)
}
