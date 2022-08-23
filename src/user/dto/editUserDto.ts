import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class EditUserDto {
    @MinLength(2, { message: 'Min. username lenght is 2 characters' })
    @MaxLength(20, { message: 'Max. username lenght is 2 characters' })
    @IsNotEmpty()
    username: string;
}
