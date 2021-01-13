import { Field, InputType } from "type-graphql";

@InputType()
export class UserNamePasswordInput{
    @Field()
    username: string;

    @Field()
    password: string;
}