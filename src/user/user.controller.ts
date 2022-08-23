import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from 'src/auth/signedMessage.guard';
import { CreateWithdrawDto } from './dto/createWithdraw.dto';
import { DepositFundDto } from './dto/depositFund.dto';
import { EditUserDto } from './dto/editUserDto';
import { FundBalanceDto } from './dto/fundBalance.dto';
import { PublicKeyDto } from './dto/publicKey.dto';
import { UserService } from './user.service';

@Controller('u')
export class UserController {
    constructor(private userService: UserService) { }

    @UseGuards(AuthenticatedGuard)
    @Post('/depositFund')
    async depositFund(@Req() req, @Body() depositFundDto: DepositFundDto) {
        const { user } = req

        return await this.userService.depositFund(user, depositFundDto)
    }

    @UseGuards(AuthenticatedGuard)
    @Post('/requestWithdraw')
    async requestWithdraw(@Req() req, @Body() createWithdrawDto: CreateWithdrawDto) {
        const { user } = req

        return await this.userService.requestWithdraw(user, createWithdrawDto)
    }

    @Get('/:publicKey')
    async getUserProfile(@Param() publicKeyParam: PublicKeyDto) {
        return await this.userService.findByPublicKey(publicKeyParam.publicKey)
    }

    @UseGuards(AuthenticatedGuard)
    @Get('/fullInfo/:publicKey')
    async getFullInfo(@Req() req, @Param() publicKeyParam: PublicKeyDto) {
        const { user } = req

        return await this.userService.getFullInfo(user, publicKeyParam.publicKey)
    }

    @UseGuards(AuthenticatedGuard)
    @Get('/fundBalance/:publicKey')
    async fundBalance(@Req() req, @Param() publicKeyParam: PublicKeyDto, @Body() fundBalanceDto: FundBalanceDto) {
        const { user } = req

        return await this.userService.fundBalance(user, publicKeyParam.publicKey, fundBalanceDto)
    }
}
