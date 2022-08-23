
import { Controller, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

@Controller()
export class TaskController {
    constructor(private taskService: TasksService) { }

    @Cron(CronExpression.EVERY_4_HOURS)
    checkDeposits() {
        this.taskService.processTransactions()
    }
}