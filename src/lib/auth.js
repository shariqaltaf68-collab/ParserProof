import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          throw new Error('Invalid email or password');
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email, deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            plan: true,
            image: true,
            emailVerified: true,
          },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        if (user.emailVerified === null) {
          throw new Error('Please verify your email address before logging in');
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan;
      }
      // Refresh plan from DB when session update is triggered (e.g., after payment)
      if (trigger === 'update' && token.id) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { plan: true },
        });
        if (freshUser) {
          token.plan = freshUser.plan;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
