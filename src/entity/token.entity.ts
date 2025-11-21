import {
  BeforeInsert,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

@Entity()
@Check(`"type" IN ('access', 'refresh')`)
export class Token {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    default: TokenType.ACCESS,
  })
  type: TokenType;

  @Column({
    length: 500,
  })
  value: string;

  @Column()
  expires: Date;

  @Column({
    default: false,
  })
  revoked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.tokens, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Index()
  @Column()
  userId: number;
  isExpired(): boolean {
    return new Date() > this.expires;
  }

  isValid(): boolean {
    return !this.revoked && !this.isExpired();
  }

  @BeforeInsert()
  setDefaultExpiry() {
    if (!this.expires) {
      const expiryTimes = {
        [TokenType.ACCESS]: 15 * 60 * 1000, // 15 minutes in milliseconds
        [TokenType.REFRESH]: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      };

      this.expires = new Date(Date.now() + (expiryTimes[this.type] || 0));
    }
  }
}
