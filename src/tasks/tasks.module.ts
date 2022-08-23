import { CacheModule, Module } from '@nestjs/common';
import { TransactionModule } from 'src/transaction/transaction.module';
import { TaskController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
    imports: [TransactionModule, CacheModule.register()],
    controllers: [TaskController],
    providers: [TasksService]
})
export class TasksModule { }