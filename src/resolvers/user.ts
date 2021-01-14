import { UserNamePasswordInput } from "../inputs/usernamePasswordInput";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from 'argon2';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME } from "../constants";
import { validateRegister } from "src/utils/validateRegister";

@ObjectType()
class FieldError {
    @Field()
    field: string;

    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

@Resolver()
export class UserResolver {
    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { em,req } : MyContext
    ) {       
        // tou are not  logged in
        if (!req.session.userId) {
            return null;
        }

        const user = await em.findOne(User, { id: req.session.userId } );
        return user;
    }

    @Mutation(() => UserResponse)
    async register(
        @Arg('options') options: UserNamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options)
        if ( errors ) {
            return { errors };
        }
        const hashedpassword = await argon2.hash(options.password);
        let user;
        try {
            const result = await (em as EntityManager).createQueryBuilder(User).getKnexQuery().insert(
                {
                    username: options.username,
                    email: options.email,
                    password: hashedpassword,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ).returning("*");
            user = result[0];
        } catch (err) {
            ///duplicate username error
            if (err.code === "23505") {
                return {
                    errors:[{
                        field: 'username',
                        message: 'sername already taken',
                    }]
                }
            }
           
        }

        // store user id session
        // this will set a cookie on the user
        // keep them logged in
        req.session.userId = user.id;


        return { 
            user,
        };
    }

    @Mutation(() => UserResponse)
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, 
            usernameOrEmail.includes('@') 
            ? { email: usernameOrEmail }
            : { username: usernameOrEmail }
        );
        if (!user) {
            return {
                errors: [{
                     field: 'username',
                     message: "That username dosen't exists"
                    },
                ],
            };
        }
        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return {
                errors: [{
                     field: 'password',
                     message: "Incorrect Password"
                    },
                ],
            };
        }

        req.session.userId = user.id;

        return {
            user,
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() {req, res }: MyContext){
        return new Promise((resolve) => 
            req.session.destroy((err) => {
                res.clearCookie(COOKIE_NAME)
            if (err) {
                console.log(err);   
                resolve(false)
                return;
            }

            resolve(true)
        }))
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email:string,
        @Ctx() { em } : MyContext
    ) {
        const user = await em.findOne(User, { email })
        return true;
    }
}