import { Request, Response, NextFunction } from 'express';
import { HeresphereAuthReq, HeresphereJsonVersion } from './heresphere_structs';

export interface HspRequest extends Request {
	heresphereAuthData?: HeresphereAuthReq;
}

function isHeresphereAuthReq(data: any): data is HeresphereAuthReq {
	return (
		typeof data === 'object' &&
		data !== null &&
		typeof data.username === 'string' &&
		typeof data.password === 'string'
		// TODO: Add any other property checks
	);
}

export function heresphereAuthMiddleware(req: HspRequest, res: Response, next: NextFunction) {
	res.header("HereSphere-JSON-Version", `${HeresphereJsonVersion}`);

	if (isHeresphereAuthReq(req.body)) {
		console.log('Received HeresphereAuthReq:', req.body);
		req.heresphereAuthData = req.body;
	} else {
		console.log('Request does not match HeresphereAuthReq structure');
	}
	next();
}
