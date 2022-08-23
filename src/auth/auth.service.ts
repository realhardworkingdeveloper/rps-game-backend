import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import { User } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
    constructor(private userService: UserService) { }

    async validateUser(publicKey: PublicKey, signedMessage: Uint8Array): Promise<User | null> {

        const verifySignature = await this.userService.verifySignature(publicKey.toString(), signedMessage)
        if (!verifySignature) throw new UnauthorizedException()

        const existingUser = await this.userService.findByPublicKey(publicKey.toString())
        let newUser;

        if (!existingUser) {
            newUser = await this.userService.create({
                publicKey: publicKey.toString()
            })
        }

        return existingUser || newUser
    }
}
