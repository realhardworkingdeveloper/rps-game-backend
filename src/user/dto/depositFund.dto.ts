import { IsNotEmpty } from 'class-validator';

export class DepositFundDto {
    @IsNotEmpty()
    txHash: string;
}