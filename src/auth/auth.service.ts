import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthDto } from '../entity/auth.dto';
import { Token, TokenType } from '../entity/token.entity';
import { User } from '../entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Token)
    public tokenRepository: Repository<Token>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(username: string, password: string): Promise<AuthDto> {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    // Create user
    const user = this.userRepository.create({ username, password });
    await this.userRepository.save(user);

    // Generate tokens
    return await this.generateTokens(user);
  }

  async login(username: string, password: string): Promise<AuthDto> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user || !(await user.validatePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return await this.generateTokens(user);
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.revokeAllUserTokens(userId);
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(refreshToken: string): Promise<AuthDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const token = await this.tokenRepository.findOne({
        where: {
          type: TokenType.REFRESH,
          value: refreshToken,
          revoked: false,
        },
        relations: ['user'],
      });

      if (!token || !token.isValid()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.tokenRepository.update(token.id, { revoked: true });

      return await this.generateTokens(token.user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeTokenByValue(
    tokenValue: string,
  ): Promise<{ success: boolean; message: string }> {
    const token = await this.tokenRepository.findOne({
      where: { value: tokenValue, revoked: false },
    });

    if (!token) {
      throw new NotFoundException('Token not found or already revoked');
    }

    await this.tokenRepository.update({ id: token.id }, { revoked: true });

    return {
      success: true,
      message: 'Token successfully revoked',
    };
  }

  async revokeAllTokensForAllUsers(): Promise<{
    success: boolean;
    revokedCount: number;
  }> {
    const result = await this.tokenRepository.update(
      {
        revoked: false,
      },
      { revoked: true },
    );

    return {
      success: true,
      revokedCount: result.affected || 0,
    };
  }

  private async generateTokens(user: User): Promise<AuthDto> {
    const accessExpiresIn =
      this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m';
    const refreshExpiresIn =
      this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';

    // Generate JWT tokens
    const accessToken = this.jwtService.sign(
      { sub: user.id, username: user.username },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id, username: user.username },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn,
      },
    );

    const expiresIn = this.parseExpiresIn(accessExpiresIn);
    const refreshExpiresInSeconds = this.parseExpiresIn(refreshExpiresIn);

    await Promise.all([
      this.revokeAllUserTokens(user.id),
      this.tokenRepository.save(
        this.tokenRepository.create({
          type: TokenType.ACCESS,
          value: accessToken,
          user: user,
          userId: user.id,
          revoked: false,
        }),
      ),
      this.tokenRepository.save(
        this.tokenRepository.create({
          type: TokenType.REFRESH,
          value: refreshToken,
          user: user,
          userId: user.id,
          revoked: false,
        }),
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      refreshExpiresIn: refreshExpiresInSeconds,
    };
  }

  private parseExpiresIn(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1), 10);

    switch (unit) {
      case 's': // seconds
        return value;
      case 'm': // minutes
        return value * 60;
      case 'h': // hours
        return value * 60 * 60;
      case 'd': // days
        return value * 24 * 60 * 60;
      case 'w': // weeks
        return value * 7 * 24 * 60 * 60;
      default:
        return parseInt(expiresIn, 10) || 900;
    }
  }

  private async revokeAllUserTokens(userId: number): Promise<void> {
    const res = await this.tokenRepository.update(
      { userId, revoked: false },
      { revoked: true },
    );
    console.log(res);
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async getProfile(userId: number): Promise<{ id: number; username: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      username: user.username,
    };
  }
}
