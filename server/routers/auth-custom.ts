import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../_core/email";
import crypto from "crypto";
import { z } from "zod";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { COOKIE_NAME } from "../../shared/const";

export const authCustomRouter = router({
  // 1. Adım: Kullanıcı ad, soyad ve e-posta girer. 6 haneli kod üretilir ve Resend ile gönderilir.
  requestVerificationCode: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        surname: z.string().min(2),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Veritabanı bağlantısı kurulamadı");

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          await db.update(users).set({
            name: input.name,
            surname: input.surname,
            emailVerifyCode: code,
            emailVerified: false,
          }).where(eq(users.email, input.email));
        } else {
          const openId = `user_${crypto.randomBytes(8).toString("hex")}`;
          await db.insert(users).values({
            openId,
            name: input.name,
            surname: input.surname,
            email: input.email,
            emailVerifyCode: code,
            emailVerified: false,
            loginMethod: "email",
          });
        }
      } catch (dbErr: any) {
        console.error("[Auth DB Error]", dbErr);
        throw new Error("Veritabanı kayıt hatası: " + (dbErr?.message || dbErr));
      }

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Gastronotlar Uygulamasına Hoş Geldiniz!</h2>
          <p>Merhaba <b>${input.name} ${input.surname}</b>,</p>
          <p>E-posta adresinizi doğrulamak için kullanmanız gereken onay kodunuz:</p>
          <div style="font-size: 28px; font-weight: bold; color: #0a7ea4; background: #f0f8ff; padding: 10px 20px; display: inline-block; border-radius: 6px; letter-spacing: 4px;">
            ${code}
          </div>
          <p style="margin-top: 20px; color: #668088;">Bu kodu uygulama ekranına girerek hesabınızı aktifleştirebilirsiniz.</p>
        </div>
      `;

      const emailSent = await sendEmail(input.email, "Gastronotlar - E-posta Doğrulama Kodunuz", html);
      if (!emailSent) {
        console.error("[Auth Error] Email could not be sent via Resend. Check RESEND_API_KEY and domain verification.");
        throw new Error("Doğrulama e-postası Resend üzerinden gönderilemedi. Lütfen sistem yöneticisiyle iletişime geçin.");
      }

      return {
        success: true,
        emailSent: true,
        message: "Doğrulama kodu e-posta adresinize gönderildi.",
      };
      } catch (error: any) {
        console.error("[Auth] requestVerificationCode error:", error);
        throw new Error("Kayıt hatası: " + (error?.message || error));
      }
    }),

  // 2. Adım: Kod kontrolü
  verifyCode: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Veritabanı bağlantısı kurulamadı");

      const found = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (found.length === 0 || found[0].emailVerifyCode !== input.code) {
        throw new Error("Geçersiz doğrulama kodu.");
      }

      await db.update(users).set({
        emailVerified: true,
        emailVerifyCode: null,
      }).where(eq(users.email, input.email));

      return { success: true };
    }),

  // 3. Adım: Şifre oluşturma (İki kez aynı şifre)
  setPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        confirmPassword: z.string().min(6),
        username: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      if (input.password !== input.confirmPassword) {
        throw new Error("Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      }

      const db = await getDb();
      if (!db) throw new Error("Veritabanı bağlantısı kurulamadı");

      const found = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (found.length === 0 || !found[0].emailVerified) {
        throw new Error("Önce e-posta adresinizi doğrulamalısınız.");
      }

      // Basit hash simülasyonu (veya düz saklama)
      const passwordHash = crypto.createHash("sha256").update(input.password).digest("hex");

      await db.update(users).set({
        username: input.username,
        passwordHash,
      }).where(eq(users.email, input.email));

      return { success: true, message: "Şifreniz başarıyla oluşturuldu." };
    }),

  // Giriş yapma
  loginWithPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Veritabanı bağlantısı kurulamadı");

      const found = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (found.length === 0) {
        throw new Error("Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.");
      }

      const user = found[0];
      const passwordHash = crypto.createHash("sha256").update(input.password).digest("hex");

      if (user.passwordHash !== passwordHash) {
        throw new Error("Hatalı şifre.");
      }

      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name ?? user.email ?? "Gastronotlar üyesi" });
      ctx.res.cookie(COOKIE_NAME, sessionToken, getSessionCookieOptions(ctx.req));

      return {
        success: true,
        sessionToken,
        user: {
          id: user.id,
          openId: user.openId,
          email: user.email,
          name: user.name,
          surname: user.surname,
          username: user.username,
          imageUrl: user.imageUrl,
          loginMethod: user.loginMethod,
          role: user.role,
          accountStatus: user.accountStatus,
          lastSignedIn: new Date(),
        },
      };
    }),

  // Şifremi unuttum
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Veritabanı bağlantısı kurulamadı");

      const found = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (found.length === 0) {
        throw new Error("Bu e-posta adresine ait kayıt bulunamadı.");
      }

      const resetToken = crypto.randomBytes(16).toString("hex");
      const expires = new Date(Date.now() + 3600 * 1000); // 1 saat

      await db.update(users).set({
        passwordResetToken: resetToken,
        passwordResetExpires: expires,
      }).where(eq(users.email, input.email));

      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Şifre Sıfırlama Talebi</h2>
          <p>Gastronotlar hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p>Sıfırlama kodunuz / token değeriniz:</p>
          <div style="font-size: 20px; font-weight: bold; color: #0a7ea4; background: #f0f8ff; padding: 10px 20px; display: inline-block; border-radius: 6px;">
            ${resetToken}
          </div>
          <p style="margin-top: 20px;">Bu kodu kullanarak yeni şifrenizi belirleyebilirsiniz.</p>
        </div>
      `;

      await sendEmail(input.email, "Gastronotlar - Şifre Sıfırlama Talebi", html);
      return { success: true, message: "Şifre sıfırlama talimatları e-postanıza gönderildi." };
    }),
});
