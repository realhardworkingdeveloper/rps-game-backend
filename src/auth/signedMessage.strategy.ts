import { Injectable, Req } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { PublicKey } from "@solana/web3.js";
import { Strategy } from "passport-custom"
import { User } from "src/user/user.schema";
import { AuthService } from "./auth.service";

@Injectable()
export class SignedMessageStrategy extends PassportStrategy(Strategy, "signedMessage") {
    constructor(private authService: AuthService) {
        super()
    }

    async validate(@Req() req): Promise<User> {
        const { publicKey, signedMessage } = req.body;

        
        const publicKeyParsed = new PublicKey(Buffer.from(publicKey));
        
        return await this.authService.validateUser(publicKeyParsed, Uint8Array.from(signedMessage));
    }
}