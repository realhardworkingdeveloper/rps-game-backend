import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { GameDocument } from './game-rps.schema';
import { UserDocument } from 'src/user/user.schema';
import { ObjectId } from 'mongoose';

@WebSocketGateway({ namespace: 'game', cors: true })
export class GameGateway implements OnGatewayConnection {
    @WebSocketServer() server: Server;

    handleConnection(client: any, ...args: any[]) {
    }

    newGameNotify(game: GameDocument): void {
        game.creatorMove = undefined

        this.server.emit('newGame', game)
    }
    gameUpdateNotify(updatedGame: GameDocument): void {
        this.server.emit('gameUpdate', updatedGame)
    }
}