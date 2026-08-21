// Kimlik doğrulama artık tüm uygulama genelinde tek bir paylaşılan
// state olarak tutuluyor (bkz. lib/auth-context.tsx). Bu dosya, mevcut
// "@/hooks/use-auth" importlarının bozulmaması için oraya yönlendirir.
export { useAuth } from "@/lib/auth-context";
