import { forwardRef, HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Keypair, clusterApiUrl, ConfirmedSignatureInfo, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Cluster, NONCE_ACCOUNT_LENGTH, Signer, NonceAccount, ParsedTransactionWithMeta } from "@solana/web3.js";
import { Connection as MongoConnection, Model } from "mongoose";
import { UserService } from "src/user/user.service";
import { Transaction, TransactionDocument } from "./transaction.schema";
import { Transaction as SolanaTransaction } from '@solana/web3.js'
import { ConfigService } from "@nestjs/config";

let isProcessing = false;

@Injectable()
export class TransactionService {
    serviceKeypair: Keypair
    connection: Connection
    nonceAccount: Keypair

    // Note the RPC "onAccountChange" registered, which calls this.processTransactions()
    constructor(
        @InjectConnection() private readonly dbConnection: MongoConnection,
        @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
        @Inject(forwardRef(() => UserService)) private userService: UserService,
        private configService: ConfigService) 
    {
            this.connection = new Connection(
                'https://api.devnet.solana.com',
                'confirmed'
            );
            this.serviceKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(this.configService.get('KEYPAIR_SECRET_KEY'))))
            // this.connection.onAccountChange(this.serviceKeypair.publicKey, () => this.processTransactions())
    }

    async sendLamportsFromServer(receiverPublicKey: string, amount: number) {
        const tx = new SolanaTransaction().add(
            SystemProgram.transfer({
                fromPubkey: this.serviceKeypair.publicKey,
                toPubkey: new PublicKey(receiverPublicKey),
                lamports: amount
            })
        )

        console.log("Sending " + amount / LAMPORTS_PER_SOL + " to user " + receiverPublicKey + " as per withdraw request");
        const txhash = await this.connection.sendTransaction(tx, [this.serviceKeypair])
        try {
            await this.connection.confirmTransaction(txhash, 'finalized')
        } catch (e) {
            Logger.error("WITHDRAW ERROR within SendLamportsFromServer():")
            Logger.error(e)
        }
        return txhash
    }

    async getBySignatureFromBlockchain(signature: string): Promise<ParsedTransactionWithMeta> {
        return await this.connection.getParsedTransaction(signature)
    }

    async getBySignature(signature: string) {
        return await this.transactionModel.findOne({ signature })
    }

    getType(transaction: ParsedTransactionWithMeta): string {
        const instructionN = transaction.transaction.message.instructions.length
        //@ts-ignore
        if(!transaction.transaction.message.instructions[instructionN - 1]?.parsed) {
            return;
        }
        //@ts-ignore
        if(!transaction.transaction.message.instructions[instructionN - 1]?.parsed?.info) {
            return;
        }

        //@ts-ignore
        const { destination, source } = transaction.transaction.message.instructions[instructionN - 1].parsed.info
        if (!destination || !source) {
            return
        }
        else if (destination === this.serviceKeypair.publicKey.toString()) {
            return 'deposit'
        } else if (source === this.serviceKeypair.publicKey.toString()) {
            return 'withdraw'
        }
    }
    getSender(transaction: ParsedTransactionWithMeta): PublicKey {
        //@ts-ignore
        const { source } = transaction.transaction.message.instructions[0].parsed.info
        return new PublicKey(source)
    }
    getReceiver(transaction: ParsedTransactionWithMeta): PublicKey {
        const instructionN = transaction.transaction.message.instructions.length
        //@ts-ignore
        const { destination } = transaction.transaction.message.instructions[instructionN - 1].parsed.info
        return new PublicKey(destination)
    }
    getAmount(transaction: ParsedTransactionWithMeta): number {
        //@ts-ignore
        const { lamports } = transaction.transaction.message.instructions[0].parsed.info
        return lamports
    }


    async getLastFromBlockchain(): Promise<ConfirmedSignatureInfo[]> {
        const currentTransactions = await this.connection.getSignaturesForAddress(this.serviceKeypair.publicKey, { limit: 1000 })

        const startTime = +this.configService.get('START_TIME');
        
        const transactions = [];
        currentTransactions.map(transaction => {
            if(transaction.blockTime >= startTime) {
                transactions.push(transaction);
            }
        });

        return transactions
    }


    // processTransactions() is run each time RPC node informs us house wallet has "changed", i.e. got sent funds
    // (see constructor above that registers this)
    // But what if the connection to RPC node drops? Does it ever attempt to reconnect?
    // What if the app is offline for a few minutes? This won't ever look back to see what historic tx's need to
    // be processed. The app doesnt keep track of what SOL block it most recently processed.
    // Note: this is ALSO run every 60 seconds (but disabled currently)

    async processTransactions() {
        if(isProcessing) return;

        try {
            isProcessing = true;

            // gets the 10 most recent transactions involving house wallet.
            // note: it's totally possible all these tx's have already been processed...
            // or that we actually need more than 10 most recent, e.g. 11 tx's involving our wallet within a second
            // bad approach.
            const blockchainTransactions = await this.getLastFromBlockchain()

            // for each of these 10 tx, runs processTransactions().
            // if ANY fail, below error is logged...
            await Promise.all(blockchainTransactions.map(transaction => this.processTransaction(transaction)))

            isProcessing = false;
        } catch (e) {
            isProcessing = false;
            Logger.error('error within processTransactions():')
            Logger.error(e)
        }
    }

    async processTransaction(tx: ConfirmedSignatureInfo) {
        try {
            // check db to see if tx already exists
            const savedTransaction = await this.getBySignature(tx.signature)
            if (savedTransaction !== null) {
                // tx already exists... is it anything other than 'pending'?
                if (savedTransaction.status !== 'pending') {
                    // stop processing
                    return
                }
            }

            // get more detailed tx info from the RPC node
            const txInfo = await this.getBySignatureFromBlockchain(tx.signature)

            const txType = this.getType(txInfo)

            if (txType === 'deposit') {

                // does the tx have an error (on blockchain)?
                if(txInfo.meta.err === null || txInfo.meta.err.toString() == '') {
                    await this.confirmPendingDeposit(tx.signature, txInfo)
                }
                else {
                    // error! so we didn't get the money!! don't confirm deposit
                    Logger.error('Failed deposit on blockchain detected. tx: ' + tx.signature);
                }
            }

        } catch (e) {
            Logger.error('error within processTransaction():')
            Logger.error(e)
        }
    }

    async confirmPendingDeposit(signature: string, txInfo: ParsedTransactionWithMeta) {
        console.log("CONFIRMING DEPOSIT with tx signature:\n" + signature);

        const sender = this.getSender(txInfo);
        const amount = this.getAmount(txInfo);
        
        const user = await this.userService.findByPublicKey(sender.toString());

        if (!user) {
            Logger.error("Failed to confirm deposit with tx signature:\n" + signature + "\nDepositing user could not be found in db.")
            return
        }

        const session = await this.dbConnection.startSession()
        session.startTransaction()
        user.$session(session)

        try {
            const deposit = new this.transactionModel({ owner: user, signature, type: 'deposit', status: 'confirmed', amount })
            deposit.$session(session)

            await deposit.save()
            await this.userService.changeBalance(user, amount)

            await session.commitTransaction()
        } catch (e) {
            Logger.error("Failed to confirm deposit with tx signature:\n" + signature)
            Logger.error("error within confirmPendingDeposit():")
            Logger.error(e)
            await session.abortTransaction()
        } finally {
            session.endSession()
        }
    }

}