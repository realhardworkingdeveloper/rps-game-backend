
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';
export type UserDocument = User & Document;

@Schema({ timestamps: true, optimisticConcurrency: true })
export class User {
    @Prop({ required: true, unique: true })
    publicKey: string;

    @Prop({ default: false })
    isAdmin: boolean;

    @Prop({ default: 0, min: 0 })
    balance: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
