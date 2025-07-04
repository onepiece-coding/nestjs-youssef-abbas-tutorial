import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log({
      headers: req.headers,
      method: req.method,
      host: req.host,
    });

    /* 
        const token = req.headers.authorization;
        if (token && token === 'Bearer Token') {
        next();
        } else {
        res.status(401).json({ message: 'You are not allowed!' });
        } 
    */

    next();
  }
}
