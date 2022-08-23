import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Connection as MongoConnection, Model, ObjectId } from 'mongoose';
import { CreateUserDto } from './dto/createUser.dto';
import { User, UserDocument } from './user.schema';
import { sign } from 'tweetnacl'
import { UserGateway } from './user.gateway';
import { TransactionService } from 'src/transaction/transaction.service';
import { CreateWithdrawDto } from './dto/createWithdraw.dto';
import { FundBalanceDto } from './dto/fundBalance.dto';
import { EditUserDto } from './dto/editUserDto';
import Filter from 'bad-words'
import { DepositFundDto } from './dto/depositFund.dto';

const filter = new Filter()

const messageToSign = Uint8Array.from(Buffer.from('Login to RPS Games Club'))

@Injectable()
export class UserService {
    constructor(
        @InjectConnection() private readonly dbConnection: MongoConnection,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private userGateway: UserGateway,
        @Inject(forwardRef(() => TransactionService)) private transactionService: TransactionService
    ) {
        this.getUserBalances()
    }

    async getUserBalances() {
        const users = await this.userModel.find()
        let balances = 0
        users.forEach(user => {
            balances += user.balance
        })
        console.log({ balances: balances / LAMPORTS_PER_SOL })
    }

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        const createdUser = new this.userModel(createUserDto)

        return createdUser.save()
    }

    async findById(userId: ObjectId): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec()
    }

    async findByPublicKey(publicKey: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ publicKey }).exec()
    }

    async verifySignature(publicKey: string, signedMessage: Uint8Array): Promise<boolean> {
        const pK = new PublicKey(publicKey)

        const isVerified = sign.detached.verify(messageToSign, signedMessage, Uint8Array.from(pK.toBuffer()))
        return isVerified
    }

    async changeBalance(user: UserDocument, amount: number, options?: { reason: string }) {
        user.balance += amount
        await user.save()
        this.userGateway.balanceChangeNotify(user._id, user.balance, amount, { reason: options?.reason })
    }

    async getFullInfo(user: UserDocument, publicKey: string) {
        if (!user.isAdmin) throw new HttpException('Imposters are not welcomed here !', HttpStatus.FORBIDDEN)

        return this.userModel.findOne({ publicKey }).populate('associatedKeypair')
    }

    async fundBalance(user: UserDocument, publicKey: string, fundBalanceDto: FundBalanceDto) {
        if (!user.isAdmin) throw new HttpException('Imposters are not welcomed here !', HttpStatus.FORBIDDEN)

        const receiver = await this.findByPublicKey(publicKey)

        if (!receiver) throw new HttpException('User does not exist', HttpStatus.FORBIDDEN)

        const session = await this.dbConnection.startSession()
        session.startTransaction()
        receiver.$session(session)

        try {
            receiver.balance += fundBalanceDto.amount

            await receiver.save()
            await session.commitTransaction()
        } catch (e) {
            await session.abortTransaction()
            throw new HttpException('Server Withdraw Error. Try again later', HttpStatus.INTERNAL_SERVER_ERROR)
        } finally {
            session.endSession()
        }
    }

    async depositFund(user: UserDocument, depositFundDto: DepositFundDto) {
        const { txHash } = depositFundDto;
        console.log(`\n\n start confirm ${txHash}`);

        // await new Promise(resolve => setTimeout(() => resolve(1), 1500))

        try {
            // check db to see if tx already exists
            const savedTransaction = await this.transactionService.getBySignature(txHash)
            if (savedTransaction !== null) {
                if (savedTransaction.status !== 'pending') {
                    return false;
                }
            }

            // get more detailed tx info from the RPC node
            const txInfo = await this.transactionService.getBySignatureFromBlockchain(txHash)

            const txType = this.transactionService.getType(txInfo)

            if (txType === 'deposit') {

                // does the tx have an error (on blockchain)?
                if(txInfo.meta.err === null || txInfo.meta.err.toString() == '') {
                    await this.transactionService.confirmPendingDeposit(txHash, txInfo)
                }
                else {
                    // error! so we didn't get the money!! don't confirm deposit
                    Logger.error('Failed deposit on blockchain detected. tx: ' + txHash);
                }
            }

            console.log(`\n\n end confirm ${txHash}`);
            return true;
        } catch (e) {
            Logger.error('deposit in userService error')
            Logger.error(e)
            return false;
        }

    }

    async requestWithdraw(user: UserDocument, createWithdrawDto: CreateWithdrawDto) {
        const { amount } = createWithdrawDto
        if (user.balance < amount) {
            Logger.error("WITHDRAW ABORTED: user " + user.publicKey + " attempted to withdraw more than balance.")
            Logger.error("balance = " + user.balance + ". withdraw amount = " + amount / LAMPORTS_PER_SOL)
            throw new HttpException('Balance needs to be higher than the withdraw amount', HttpStatus.FORBIDDEN)
        }

        try {
            console.log("(1/3) deducting " + amount / LAMPORTS_PER_SOL + " from user " + user.publicKey + " balance as per withdraw request");
            console.log("(2/3) current balance: " + user.balance / LAMPORTS_PER_SOL);
            const txhash = await this.transactionService.sendLamportsFromServer(user.publicKey, amount)
            await this.changeBalance(user, -amount)
            console.log("(3/3) balance deducted. new balance: " + user.balance / LAMPORTS_PER_SOL); 
            return { txhash }

        } catch (e) {
            Logger.error("WITHDRAW ERROR:")
            Logger.error(e)
            throw new HttpException('Server Withdraw Error. Try again later', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}