import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { IsEnum } from 'class-validator';

export class CreateGameDto {
    @IsEnum(
        [
            0.01 * LAMPORTS_PER_SOL,
            0.02 * LAMPORTS_PER_SOL,
            0.05 * LAMPORTS_PER_SOL,
            0.1 * LAMPORTS_PER_SOL,
            0.2 * LAMPORTS_PER_SOL,
            0.5 * LAMPORTS_PER_SOL,
            1 * LAMPORTS_PER_SOL,
            2 * LAMPORTS_PER_SOL,
            5 * LAMPORTS_PER_SOL,
        ],
        {
            message:
                'Allowed bets: 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2 and 5 SOLs',
        },
    )
    amount: number;

    @IsEnum([0, 1, 2], { message: 'Choice should be 0, 1, 2' })
    creatorMove: number;
    gameType: "rps";
}