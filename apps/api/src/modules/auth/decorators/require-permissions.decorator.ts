import { SetMetadata } from '@nestjs/common';

export enum UserType {
  SYSTEM = 'system',
  CLIENT = 'client',
  BOTH = 'both',
}

export interface PermissionConfig {
  userType: UserType;
  roles?: string[];
  requireClientId?: boolean;
}

export const RequirePermissions = (config: PermissionConfig) =>
  SetMetadata('permissions', config);
