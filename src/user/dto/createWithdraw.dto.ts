import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { IsNotEmpty, IsInt, Min, } from 'class-validator';

export class CreateWithdrawDto {
    @IsInt()
    @Min(0.01 * LAMPORTS_PER_SOL, { message: 'Minimum withdraw is 0.01 SOLs' })
    amount: number;
}