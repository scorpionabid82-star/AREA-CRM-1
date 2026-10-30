# Təhlükəsizlik və Baza Mühafizəsi İcra Planı

İstifadəçinin seçimlərinə uyğun olaraq AREA-CRM sisteminin təhlükəsizliyini təmin etmək üçün tərtib edilmiş addım-addım icra planı:

---

## 1. Cloud Firestore Təhlükəsizlik Qaydalarının Gücləndirilməsi (`firestore.rules`)

### Mövcud Vəziyyət:
- `match /{document=**} { allow read, write: if true; }` — istənilən şəxs verilənlər bazasını kənardan oxuya və dəyişə bilər.

### Hədəf Təhlükəsizlik Strukturu:
- **Ümumi Daxilolma Tələbi:** Bütün əməliyyatlar yalnız rəsmi Firebase autentifikasiyasından (`request.auth != null`) keçmiş istifadəçilərə icazə verilir.
- **İctimai Müraciət Portalı:** Valideynlərin sayt üzərindən onlayn qeydiyyatdan keçə bilməsi üçün yalnız `leads` (müraciətlər) kolleksiyasına anonim müraciət göndərilməsinə (`allow create: if true`) nəzarətli icazə saxlanılır.
- **Qaydaların Tətbiqi:** `deploy_firebase` vasitəsilə yeni `firestore.rules` Cloud Firestore layihəsinə yerləşdirilir.

---

## 2. Şablon Hesabların Bazadan Təmizlənməsi

- **Silinəcək Şablon Hesablar (8 ədəd):**
  - `usr-3` (Kamran Əsədov — kamran@areacrm.az)
  - `usr-4` (Fərid Əliyev — farid.aliyev@areacrm.az)
  - `usr-5` (Nigar Rüstəmova — nigar.r@areacrm.az)
  - `usr-6` (Kənan Məmmədov — kenan.m@areacrm.az)
  - `usr-7` (Rəşad Quliyev — şagird sınaq kabineti)
  - `usr-8` (Aydan Məhərrəmova — şagird sınaq kabineti)
  - `usr-9` (Günay Həsənova — şagird sınaq kabineti)
  - `usr-talabot` (Talabot — sınaq kabineti)
- **Toxunulmayacaq Hesab:**
  - `Nahid Şeydayev` (`usr-2026-6207`, `nahidsheydayev960@gmail.com`) istifadəçinin tələbinə əsasən **tamamilə toxunulmaz saxlanılır**.

---

## 3. Kod Daxili Giriş Təhlükəsizliyinin Bərkidilməsi

- `CrmContext.tsx` daxilində inkişaf (dev) sınaqları üçün istifadə edilmiş `simulateGmailLogin` və birbaşa sınaq giriş funksiyaları kənarlaşdırılır.
- Bütün girişlər yalnız real Google OAuth və Firebase Auth sessiyası ilə əlaqələndirilir.

---

## 4. Doğrulama və Test

1. Qaydaların Firestore-a uğurla yerləşdirilməsinin (`deploy_firebase`) yoxlanılması.
2. Real istifadəçilərin (Direktorlar, Filial Menecerləri və Təlimçilər) Google ilə girişinin və filial məlumatlarına çatımlılığının test edilməsi.
3. Kənar, qeydiyyatsız Google hesabları ilə giriş cəhdlərinin təhlükəsiz şəkildə bloklandığının təsdiqlənməsi.
