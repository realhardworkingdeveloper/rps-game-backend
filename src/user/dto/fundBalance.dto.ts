import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { IsNotEmpty, IsInt, Min, } from 'class-validator';

export class FundBalanceDto {
    @IsInt()
    @Min(0.01 * LAMPORTS_PER_SOL, { message: 'Minimum fund is 0.01 SOLs' })
    amount: number;
}