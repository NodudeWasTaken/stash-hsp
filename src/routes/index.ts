import express, { Express, Request, Response } from "express";

var THEEND = 0
const indexHandler = async (req: Request, res: Response) => {
	THEEND++
	res.json({message: "the end" + " is never the end".repeat(THEEND)})
});

export function indexRoutes(app: Express) {
	app.get("/", indexHandler);
}
