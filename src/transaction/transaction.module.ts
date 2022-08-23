import { CacheModule, forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction } from '@solana/web3.js';
import { UserModule } from 'src/user/user.module';
import { TransactionSchema } from './transaction.schema';
import { TransactionService } from './transaction.service';

@Module({
    imports: [forwardRef(() => UserModule), MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }])],
    providers: [TransactionService],
    exports: [TransactionService]
})
export class TransactionModule { }