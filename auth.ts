// src/auth.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import type { Adapter } from '@auth/core/adapters'
import { getMongoClient } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { User } from '@/lib/db/models/user.model'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(await getMongoClient()) as Adapter,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await User.findOne({ email: credentials.email }).select(
          '+password',
        )
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        )

        if (!isValid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.fullName || user.username,
          image: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'user' as const,
          isVerified: profile.email_verified ?? false,
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isVerified = user.isVerified
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = token.role as 'user' | 'admin' | 'moderator'
        session.user.isVerified = token.isVerified as boolean
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
})
