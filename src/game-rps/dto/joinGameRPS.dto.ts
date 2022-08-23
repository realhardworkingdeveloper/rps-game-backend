import { IsNotEmpty, IsEnum } from 'class-validator'
import { Type, Transform } from 'class-transformer';
import { Types } from "mongoose"

export class JoinGameDto {
    @IsNotEmpty()
    @Type(() => Types.ObjectId)
    gameId: Types.ObjectId;

    @IsEnum([0, 1, 2], { message: 'Choice should be 0, 1 or 2' })
    move: number;
}
