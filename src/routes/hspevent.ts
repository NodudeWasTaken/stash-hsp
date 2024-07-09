import express, { Express, Request, Response } from "express";
import { HspRequest } from "../authmiddleware";

const hspEventHandler = async (req: HspRequest, res: Response) => {
	// TODO: .
	res.json({message: "event"})
};

export function hspEventRoutes(app: Express) {
	app.get("/heresphere/video/:sceneId/event", hspEventHandler);
}
