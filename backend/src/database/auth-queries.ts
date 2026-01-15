import { db } from './schema'
import { v4 as uuidv4 } from 'uuid'
import type { User } from '../types/auth'

/**
 * 用户相关的数据库查询
 */
export const authQueries = {
  // 获取用户列表（分页）
  getUsersList(limit = 50, offset = 0): Omit<User, 'password_hash'>[] {
    const stmt = db.prepare(`
      SELECT id, username, email, full_name, role, status, last_login_at, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `)
    const users = stmt.all(limit, offset) as Omit<User, 'password_hash'>[]
    return users
  },

  // 根据 ID 获取用户
  getUserById(id: string): Omit<User, 'password_hash'> | undefined {
    const stmt = db.prepare(`
      SELECT id, username, email, full_name, role, status, last_login_at, created_at, updated_at
      FROM users
      WHERE id = ?
    `)
    return stmt.get(id) as Omit<User, 'password_hash'> | undefined
  },

  // 更新用户信息
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'password_hash' | 'created_at'>>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'password_hash' && k !== 'created_at')
    const values = fields.map(f => (updates as any)[f])

    const stmt = db.prepare(`
      UPDATE users
      SET ${fields.map(f => `${f} = ?`).join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `)

    stmt.run(...values, id)
  },

  // 修改用户角色
  updateUserRole(id: string, role: 'admin' | 'user'): void {
    const stmt = db.prepare(`
      UPDATE users
      SET role = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    stmt.run(role, id)
  },

  // 修改用户状态
  updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended'): void {
    const stmt = db.prepare(`
      UPDATE users
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    stmt.run(status, id)
  },

  // 删除用户
  deleteUser(id: string): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  },

  // 获取用户统计
  getUserStats(): {
    total: number
    active: number
    admins: number
  } {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
      FROM users
    `)
    return stmt.get() as {
      total: number
      active: number
      admins: number
    }
  }
}
