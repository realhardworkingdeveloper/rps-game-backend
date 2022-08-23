import { IsNotEmpty } from 'class-validator';

export class PublicKeyDto {
    @IsNotEmpty()
    publicKey: string;
}
