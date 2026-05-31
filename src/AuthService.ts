import { supabase } from './database';
import { createHash } from 'crypto';

export interface UserAuth {
  id: string;
  email: string;
  password_hash: string;
  user_type: 'vendor' | 'driver';
  user_id: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  user_type: 'vendor' | 'driver';
}

export interface AuthResult {
  success: boolean;
  user?: UserAuth;
  error?: string;
}

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return createHash('sha256').update(password).digest('hex');
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = createHash('sha256').update(password).digest('hex');
    return passwordHash === hash;
  }

  async createUserAuth(email: string, password: string, userType: 'vendor' | 'driver', userId: string): Promise<UserAuth | null> {
    try {
      console.log(`🔐 Creating user auth for ${userType}...`);

      const passwordHash = await this.hashPassword(password);

      const { data, error } = await supabase
        .from('user_auth')
        .insert({
          email: email,
          password_hash: passwordHash,
          user_type: userType,
          user_id: userId,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user auth:', error);
        return null;
      }

      console.log('✅ User auth created successfully');
      return data as UserAuth;
    } catch (error) {
      console.error('❌ Exception in createUserAuth:', error);
      return null;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      console.log(`🔐 Attempting login for ${credentials.user_type}...`);

      const { data, error } = await supabase
        .from('user_auth')
        .select('*')
        .eq('email', credentials.email)
        .eq('user_type', credentials.user_type)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('❌ User not found or inactive');
        return { success: false, error: 'Invalid credentials or account not active' };
      }

      const isValidPassword = await this.verifyPassword(credentials.password, data.password_hash);

      if (!isValidPassword) {
        console.error('❌ Invalid password');
        return { success: false, error: 'Invalid credentials' };
      }

      // Update last login
      await supabase
        .from('user_auth')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      console.log('✅ Login successful');
      return { success: true, user: data as UserAuth };
    } catch (error) {
      console.error('❌ Exception in login:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async getUserAuthByUserId(userId: string, userType: 'vendor' | 'driver'): Promise<UserAuth | null> {
    try {
      console.log(`🔐 Getting user auth for ${userType}:`, userId);

      const { data, error } = await supabase
        .from('user_auth')
        .select('*')
        .eq('user_id', userId)
        .eq('user_type', userType)
        .single();

      if (error) {
        console.error('❌ Error getting user auth:', error);
        return null;
      }

      console.log('✅ User auth retrieved successfully');
      return data as UserAuth;
    } catch (error) {
      console.error('❌ Exception in getUserAuthByUserId:', error);
      return null;
    }
  }

  async updatePassword(userId: string, userType: 'vendor' | 'driver', newPassword: string): Promise<boolean> {
    try {
      console.log('🔄 Updating password...');

      const passwordHash = await this.hashPassword(newPassword);

      const { error } = await supabase
        .from('user_auth')
        .update({
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('user_type', userType);

      if (error) {
        console.error('❌ Error updating password:', error);
        return false;
      }

      console.log('✅ Password updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updatePassword:', error);
      return false;
    }
  }

  async deactivateUserAuth(userId: string, userType: 'vendor' | 'driver'): Promise<boolean> {
    try {
      console.log('🔒 Deactivating user auth...');

      const { error } = await supabase
        .from('user_auth')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('user_type', userType);

      if (error) {
        console.error('❌ Error deactivating user auth:', error);
        return false;
      }

      console.log('✅ User auth deactivated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in deactivateUserAuth:', error);
      return false;
    }
  }

  async activateUserAuth(userId: string, userType: 'vendor' | 'driver'): Promise<boolean> {
    try {
      console.log('✅ Activating user auth...');

      const { error } = await supabase
        .from('user_auth')
        .update({
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('user_type', userType);

      if (error) {
        console.error('❌ Error activating user auth:', error);
        return false;
      }

      console.log('✅ User auth activated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in activateUserAuth:', error);
      return false;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('🔍 Checking if email exists:', email);

      const { data, error } = await supabase
        .from('user_auth')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('❌ Exception in checkEmailExists:', error);
      return false;
    }
  }
}
