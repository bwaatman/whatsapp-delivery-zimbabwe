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
export declare class AuthService {
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    createUserAuth(email: string, password: string, userType: 'vendor' | 'driver', userId: string): Promise<UserAuth | null>;
    login(credentials: LoginCredentials): Promise<AuthResult>;
    getUserAuthByUserId(userId: string, userType: 'vendor' | 'driver'): Promise<UserAuth | null>;
    updatePassword(userId: string, userType: 'vendor' | 'driver', newPassword: string): Promise<boolean>;
    deactivateUserAuth(userId: string, userType: 'vendor' | 'driver'): Promise<boolean>;
    activateUserAuth(userId: string, userType: 'vendor' | 'driver'): Promise<boolean>;
    checkEmailExists(email: string): Promise<boolean>;
}
//# sourceMappingURL=AuthService.d.ts.map