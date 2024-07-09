import express, { Express, Request, Response } from "express";
import { CONFIG_QUERY } from "../queries/query";
import { client } from "../client";

const healthcheckHandler = async (req: Request, res: Response) => {
	try {
		await client.query({
			query: CONFIG_QUERY,
		});	
		res.json({message: "OK"})
	} catch (error) {
		res.status(500).json(error)
	}
}

const faviconHandler = async (req: Request, res: Response) => {
	// TODO: .
	res.status(500).json({message: "Not implemented yet"})
}

export function miscRoutes(app: Express) {
	app.get("/healthcheck", healthcheckHandler);
	app.get("/favicon.ico", faviconHandler);
}