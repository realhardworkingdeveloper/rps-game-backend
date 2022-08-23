import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, SchemaTypes } from "mongoose";
import { User, UserDocument } from "src/user/user.schema";

export type GameDocument = Game & Document

@Schema({ timestamps: true, optimisticConcurrency: true })
export class Game {
    @Prop({ default: 'active', enum: ['active', 'joined', 'cancelled', 'ended'] })
    status: string

    @Prop({ required: true })
    amount: number

    @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
    creator: UserDocument

    @Prop({ required: true, enum: [0, 1, 2], select: false })
    creatorMove: number

    @Prop({ enum: [0, 1, 2] })
    opponentMove: number

    @Prop({ default: 4 })
    fee: number

    @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
    opponent: UserDocument

    @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
    winner: UserDocument

    @Prop()
    endedAt: number

    @Prop()
    gameType: string
}

export const GameSchema = SchemaFactory.createForClass(Game)