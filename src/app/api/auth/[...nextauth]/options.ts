import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password harus diisi");
        }

        try {
          await dbConnect();
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            throw new Error("Email atau password salah");
          }
          
          // Pastikan passwordHash ada sebelum melakukan compare (field di model adalah passwordHash, bukan password)
          if (!user.passwordHash) {
            console.error("PasswordHash tidak ditemukan untuk user:", user.email);
            throw new Error("Data pengguna tidak valid");
          }

          // Gunakan passwordHash sesuai dengan model User
          const isPasswordValid = await compare(credentials.password, user.passwordHash);
          
          if (!isPasswordValid) {
            throw new Error("Email atau password salah");
          }

          // Log informasi pengguna untuk debugging
          console.log("User authenticated:", { 
            id: user._id.toString(),
            email: user.email, 
            role: user.role 
          });
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          } as any;
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Terjadi kesalahan saat mencoba masuk");
        }
      },
    }),
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Ensure user exists for OAuth and map DB role/id onto token
    async signIn({ user, account }) {
      try {
        if (account?.provider === 'google') {
          await dbConnect();
          if (!user?.email) return false;
          let existing = await User.findOne({ email: user.email });
          if (!existing) {
            // Generate a compliant placeholder phone
            const phone = `+998${Math.floor(10000000 + Math.random() * 90000000)}`;
            existing = new User({
              name: user.name || user.email.split('@')[0],
              email: user.email,
              phone,
              role: 'customer',
              // passwordHash left undefined for OAuth users
            });
            await existing.save();
          }
        }
        return true;
      } catch (e) {
        console.error('signIn callback error:', e);
        return false;
      }
    },
    async jwt({ token, user }) {
      // When user signs in (credentials or OAuth), attach DB role/id
      if (user) {
        try {
          await dbConnect();
          const email = (user as any).email || token.email;
          if (email) {
            const dbUser = await User.findOne({ email });
            if (dbUser) {
              token.role = dbUser.role as any;
              token.id = dbUser._id.toString();
            }
          }
        } catch (e) {
          console.error('jwt callback lookup error:', e);
          // fallback to any role/id passed by provider
          if ((user as any).role) token.role = (user as any).role;
          if ((user as any).id) token.id = (user as any).id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 jam
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
