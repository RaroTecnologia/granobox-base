export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    clientId: string;
    client: {
      id: string;
      businessName?: string;
      fullName?: string;
      clientType: 'individual' | 'business';
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  clientId: string;
  client: {
    id: string;
    businessName?: string;
    fullName?: string;
    clientType: 'individual' | 'business';
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
