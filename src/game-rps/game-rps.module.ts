import { forwardRef, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "src/user/user.module";
import { GameController } from "./game-rps.controller";
import { GameGateway } from "./game-rps.gateway";
import { Game, GameSchema } from "./game-rps.schema";
import { GameService } from "./game-rps.serivce";

@Module({
    imports: [
        UserModule,
        MongooseModule.forFeature([
            { name: Game.name, schema: GameSchema }
        ])
    ],
    controllers: [GameController],
    providers: [GameService, GameGateway],
    exports: [GameService]
})

export class GameModuleRPS { }