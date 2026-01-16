import bcrypt from 'bcrypt'

/**
 * 密码加密和验证服务
 */
export class PasswordService {
  private readonly SALT_ROUNDS = 10

  /**
   * 加密密码
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS)
  }

  /**
   * 验证密码
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * 验证密码强度
   * 要求：至少8位，包含字母和数字
   */
  validateStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: '密码至少需要8个字符' }
    }

    if (!/[A-Za-z]/.test(password)) {
      return { valid: false, message: '密码必须包含字母' }
    }

    if (!/\d/.test(password)) {
      return { valid: false, message: '密码必须包含数字' }
    }

    return { valid: true }
  }
}

export const passwordService = new PasswordService()
