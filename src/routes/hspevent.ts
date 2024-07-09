import express, { Express, Request, Response } from "express";

const hspEventHandler = async (req: Request, res: Response) => {
	// TODO: .
	res.json({message: "event"})
};

export function hspEventRoutes(app: Express) {
	app.get("/heresphere/video/:sceneId/event", hspEventHandler);
}
