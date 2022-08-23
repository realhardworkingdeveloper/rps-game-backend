import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User, UserSchema } from './user.schema';
import { UserGateway } from './user.gateway';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
    imports: [
        forwardRef(() => TransactionModule),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])
    ],
    controllers: [UserController],
    providers: [UserService, UserGateway],
    exports: [UserService]
})

export class UserModule { }