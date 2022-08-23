
import { Injectable, Logger } from '@nestjs/common';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class TasksService {
    constructor(private transactionService: TransactionService) { }

    async processTransactions() {
        await this.transactionService.processTransactions()
    }
}