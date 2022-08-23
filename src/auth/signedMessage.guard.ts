import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class SignedMessageAuthGuard extends AuthGuard("signedMessage") {
    async canActivate(context: ExecutionContext) {
        const result = (await super.canActivate(context)) as boolean;
        const request = context.switchToHttp().getRequest()

        await super.logIn(request)

        return result
    }
}

@Injectable()
export class AuthenticatedGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        return req.isAuthenticated();
    }
}

@Injectable()
export class UnAuthenticatedGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        return !req.isAuthenticated();
    }
}