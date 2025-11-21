import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthDto } from '../entity/auth.dto';
import { JwtAuthGuard } from '../jwt-auth/jwt-auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: { username: string; password: string },
  ): Promise<AuthDto> {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: { username: string; password: string },
  ): Promise<AuthDto> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.sub);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body() refreshDto: { refreshToken: string },
  ): Promise<AuthDto> {
    return this.authService.refreshTokens(refreshDto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post('revoke-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeTokenByValue(@Body() revokeDto: { tokenValue: string }) {
    return this.authService.revokeTokenByValue(revokeDto.tokenValue);
  }

  @Post('revoke-all-tokens')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllTokensForAllUsers() {
    return this.authService.revokeAllTokensForAllUsers();
  }
}
