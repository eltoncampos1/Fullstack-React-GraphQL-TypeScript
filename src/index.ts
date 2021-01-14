import 'reflect-metadata';
import { MikroORM  }  from '@mikro-orm/core';
import { COOKIE_NAME, __prod__ } from './constants';
import microConfig from './mikro-orm.config';
import redis from 'redis';
import session from 'express-session';
import express from 'express';
import connectRedis from 'connect-redis'
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { MyContext } from './types';
import cors from 'cors';

const RedisStore = connectRedis(session)
const redisClient = redis.createClient()


const main = async () => {
    const orm = await MikroORM.init(microConfig); // connect database
    await orm.getMigrator().up(); // run migrations

    const app = express();
    app.use(cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }))

    app.use(
        session({
            name: COOKIE_NAME,
            store: new RedisStore({ 
                client: redisClient,
                disableTouch: true,
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 *24 * 365 *10 ,//10y
                httpOnly: true,
                sameSite: 'lax',
                secure: __prod__, //cookie only works in https
            },
            saveUninitialized: false,
            secret: 'mysecretcookie',
            resave: false,
        })
    );
   
    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ( { em: orm.em, req, res } )
    });

    apolloServer.applyMiddleware( { app, cors: false } );

    app.listen(4000, () => {
        console.log('[Server]:Running on localhost:4000');
    });
};

main().catch((err) => {
    console.error(err);
    
});

