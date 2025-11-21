import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from 'src/entity/token.entity';
import { User } from 'src/entity/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule,
    TypeOrmModule.forFeature([User, Token]),
    ConfigModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
