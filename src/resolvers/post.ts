import { Post } from "../entities/Post";
import { Arg, Ctx, FieldResolver, Int, Mutation, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { PostInput } from "../inputs/postInputType";
import { MyContext } from "../types";
import { isAuth } from "../middlwares/isAuth";
import { getConnection } from "typeorm";

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ) {
        return root.text.slice(0, 50);
    }

    @Query(() => [Post])
    posts(
        @Arg('limit', () => Int) limit : number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string | null
    ): Promise<Post[]> {
        const realLimit = Math.min(50, limit);
        const queryBuilder =  getConnection()
        .getRepository(Post)
        .createQueryBuilder("p")
        .orderBy('"createdAt"', 'DESC')
        .take(realLimit)
        if (cursor) {
            queryBuilder.where('"createdAt" < :cursor', { cursor:new Date(parseInt(cursor)) })
        }

        return queryBuilder.getMany();
        
    }

    @Query(() => Post, { nullable: true})
    post(
        @Arg("id") id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
        ): Promise<Post> {
        return Post.create({
            ...input,
            creatorId: req.session.userId,
        }).save();
    }

    @Mutation(() => Post , { nullable: true })
    async updatePost(
        @Arg("id") id: number,
        @Arg("title", () => String, { nullable: true}) title: string): Promise<Post  | null> {
        const post = await Post.findOne(id);
        if (!post) {
            return null
        }
        if (typeof title !== 'undefined') {
            post.title = title;
            await Post.update({ id }, { title });
        }
        
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(
        @Arg("id") id: number): Promise<boolean> {
        await Post.delete(id);
        return true;
    }
}
