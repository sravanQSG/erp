import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Public schema. Stores a SHA-256 hash of the opaque refresh token (never
 * the raw token) so a DB leak alone can't be used to mint sessions.
 * Refresh tokens are high-entropy random values, not low-entropy secrets
 * like passwords, so a fast cryptographic hash is appropriate here (unlike
 * password hashing, which needs argon2's deliberate slowness).
 */
@Entity({ name: 'refresh_tokens', schema: 'public' })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, name: 'token_hash' })
  tokenHash!: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
