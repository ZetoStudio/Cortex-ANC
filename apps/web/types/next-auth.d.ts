import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    role?: string;
    projectIds?: string[];
  }
  interface Session {
    user: User & {
      role?: string;
      projectIds?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    projectIds?: string[];
  }
}
