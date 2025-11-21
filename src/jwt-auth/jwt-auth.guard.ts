import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';
import { TokenType } from 'src/entity/token.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Access token is required');
    }

    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
      })) satisfies Record<string, string>;

      const isTokenRevoked = await this.isTokenRevoked(token);
      if (isTokenRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }

      request.user = payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async isTokenRevoked(tokenValue: string): Promise<boolean> {
    try {
      const token = await this.authService['tokenRepository'].findOne({
        where: {
          value: tokenValue,
          type: TokenType.ACCESS,
        },
      });
      return !token || token.revoked || token.isExpired();
    } catch (error) {
      console.log(error);
      return true;
    }
  }
}
