import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Response, Request } from "express";
import {Session,SessionData} from 'express-session'
import { Redis } from "ioredis";

export type MyContext  = {
    em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
    req: Request & { session: Session & Partial<SessionData> & { userId?: number }};
    res: Response;
    redis: Redis
}