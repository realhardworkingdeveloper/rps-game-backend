import { IsNotEmpty } from 'class-validator'
import { Type, Transform } from 'class-transformer';
import { Types } from "mongoose"

export class GameIdDto {
    @IsNotEmpty()
    @Type(() => Types.ObjectId)
    gameId: Types.ObjectId;
}
