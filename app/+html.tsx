import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * Bu dosya, web için üretilen kök HTML belgesini özelleştirir.
 * Amaç: tarayıcının "Bu sayfayı çevirmek ister misiniz?" (Google
 * Translate) teklifini tamamen devre dışı bırakmak. Google Translate,
 * React'in kendi güncellediği metin düğümlerini doğrudan değiştirdiği
 * için (React'in haberi olmadan), bazı ekranlarda kelimelerin birbirine
 * karışmasına (ör. "Çorbalar" yerine "Günlar" görünmesi) neden oluyordu.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="tr" translate="no" className="notranslate">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="google" content="notranslate" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
