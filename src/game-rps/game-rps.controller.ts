import { Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { AuthenticatedGuard } from 'src/auth/signedMessage.guard';
import { UserService } from 'src/user/user.service';
import { CreateGameDto } from './dto/createGameRPS.dto';
import { GameDocument } from './game-rps.schema';
import { GameService } from './game-rps.serivce';
import { GameIdDto } from './dto/gameRPSId.dto';
import { PublicKeyDto } from 'src/user/dto/publicKey.dto';
import { JoinGameDto } from './dto/joinGameRPS.dto';

@Controller('game')
export class GameController {
    constructor(private gameService: GameService, private userService: UserService) { }

    @UseGuards(AuthenticatedGuard)
    @HttpCode(201)
    @Post()
    async createGame(@Req() req, @Body() createGameDto: CreateGameDto) {
        await this.gameService.create(req.user, createGameDto)
    }

    @UseGuards(AuthenticatedGuard)
    @Post('/join')
    async joinGame(@Req() req, @Body() joinGameDto: JoinGameDto) {
        await this.gameService.join(joinGameDto, req.user)
    }

    @UseGuards(AuthenticatedGuard)
    @Post('/cancel')
    async cancelGame(@Req() req, @Body() gameIdBody: GameIdDto) {
        await this.gameService.cancel(gameIdBody, req.user)
    }

    @Get('/allActive')
    async getActiveGames(): Promise<GameDocument[]> {
        return await this.gameService.getActive()
    }

    @Get('/recentGames')
    async getLastEnded(): Promise<GameDocument[]> {
        return await this.gameService.getLastEnded()
    }

    @Get('/u/:publicKey')
    async getUserGames(@Param() publicKeyParam: PublicKeyDto): Promise<GameDocument[]> {
        return await this.gameService.findByUserPublicKey(publicKeyParam.publicKey)
    }
}
