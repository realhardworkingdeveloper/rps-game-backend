import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { PassportSerializer } from "@nestjs/passport";
import { Mode } from "fs";
import { Model, ObjectId } from "mongoose";
import { User, UserDocument } from "src/user/user.schema";
import { UserService } from "src/user/user.service";

@Injectable()
export class SessionSerializer extends PassportSerializer {
    constructor(private userService: UserService) {
        super()
    }

    serializeUser(user: UserDocument, done: Function) {
        done(null, user._id)
    }

    async deserializeUser(userId: ObjectId, done: Function) {
        const user = await this.userService.findById(userId)

        done(null, user)
    }
}