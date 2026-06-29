# Atölye Portalı

Yücel Çelikbilek İmam Hatip Ortaokulu için hazırlanmış mobil uyumlu atölye yönetim portalı. Sistem; herkese açık atölye tanıtımı, öğrenci portalı, öğretmen portalı, veli portalı ve gizli admin panelinden oluşur.

## Kullanılan Teknolojiler

- Next.js App Router
- React ve TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- bcryptjs ile parola hashleme
- 1 yıl kalıcı imzalı HTTP-only cookie tabanlı oturum
- Rol bazlı yetkilendirme
- PWA manifest ve service worker desteği

## Kurulum

```bash
npm install
cp .env.example .env
npm run db:reset
npm run dev
```

Windows PowerShell kullanıyorsanız `.env.example` içeriğini `.env` dosyasına elle de kopyalayabilirsiniz.

Yerel geliştirme için `.env` dosyasındaki `DATABASE_URL` gerçek bir PostgreSQL bağlantı adresi olmalıdır. Vercel yayını için veritabanı adresini Vercel ortam değişkenlerinden vermek yeterlidir.

## Vercel ile Yayınlama

Bu proje Vercel + PostgreSQL yayınına hazır olacak şekilde ayarlanmıştır. Vercel build komutu `vercel.json` içinde `npm run vercel-build` olarak tanımlıdır. Bu komut sırasıyla Prisma Client üretir, PostgreSQL şemasını günceller, canlı seed'i veri silmeden çalıştırır ve Next.js build alır.

Vercel ortam değişkenleri:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
AUTH_SECRET="uzun-rastgele-bir-gizli-anahtar"
SEED_ADMIN_EMAIL="admin@okulunuz.com"
SEED_ADMIN_PASSWORD="en-az-8-karakter-guclu-sifre"
SEED_ADMIN_FIRST_NAME="Sistem"
SEED_ADMIN_LAST_NAME="Yöneticisi"
```

`SEED_ADMIN_EMAIL` ve `SEED_ADMIN_PASSWORD` yalnızca ilk admin hesabını oluşturmak için kullanılır. Aynı admin daha sonra zaten varsa seed işlemi şifreyi her deploy'da değiştirmez.

Canlı ortamda `npm run db:seed` kullanmayın; bu komut yerel demo verisini sıfırlamak içindir. Vercel için güvenli komut `npm run db:seed:prod` veya otomatik olarak çalışan `npm run vercel-build` komutudur.

## Veritabanı Komutları

```bash
npm run db:push
npm run db:seed
npm run db:seed:prod
npm run db:reset
npm run prisma:studio
```

Seed işlemi `mufredatlar.txt` dosyasını UTF-8 olarak okuyup 6 atölyenin 8 haftalık müfredatını veritabanına işler.

## Örnek Kullanıcılar

| Rol | Giriş | Şifre |
| --- | --- | --- |
| Admin | `admin@atolye.local` | `Admin123!` |
| Öğretmen | `ayse@example.com` | `Ogretmen123!` |
| Öğrenci | okul no `1001`, sınıf/şube `7/A` | `Ogrenci123!` |
| Veli | okul no `1001`, veli kodu `V-8K4P2X` | Şifre yok |

## Portal Adresleri

- Public site: `/`
- Atölyeler: `/workshops`
- Öğrenci: `/student/login`
- Öğretmen: `/teacher/login`
- Veli: `/parent/login`
- Admin: `/admin/login`

Admin girişi ana sayfada gösterilmez.

## Klasör Yapısı

```text
app/                 Next.js route ve sayfaları
components/          Ortak UI, layout ve atölye kartları
lib/                 Auth, action, Prisma, format ve yetki yardımcıları
prisma/              Prisma şeması ve seed dosyası
mufredatlar.txt      Atölye müfredatı veri kaynağı
atolye_yonetim.txt   Proje gereksinimleri
```

## Önemli Özellikler

- Öğrenci kayıt/giriş ve otomatik veli erişim kodu
- Öğretmen kayıt akışı ve admin onayı
- Öğretmene atölye bazlı yetki verme
- Kontenjan kontrollü atölye kaydı ve bekleme listesi
- Ödev oluşturma, teslim ve öğretmen değerlendirme
- Elmas kazanma/harcama hareketleri
- Basit ödül mağazası ve admin onaylı ödüller
- Veli için salt okunur öğrenci durumu
- Admin yönetim tabloları, raporlar ve audit log

## Geliştirme Önerileri

- E-posta servis entegrasyonu ile gerçek şifre sıfırlama bağlantısı gönderimi
- Dosya yükleme için güvenli storage ve MIME/boyut kontrolleri
- Raporlara grafik bileşenleri
- Bildirim sistemi
- Daha ayrıntılı test paketi ve uçtan uca senaryolar
